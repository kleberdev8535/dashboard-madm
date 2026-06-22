import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { AppError } from '../middlewares/error.middleware';
import bcrypt from 'bcryptjs';
import axios from 'axios';

async function sendEmail(to: string, toName: string, code: string) {
  const response = await axios.post('https://api.resend.com/emails', {
    from: 'onboarding@resend.dev',
    to: ['kleber.madm@gmail.com'],
    subject: `Código de recuperação de senha — MADM (para: ${to})`,
    html: `
      <div style="font-family: Inter, sans-serif; max-width: 480px; margin: 0 auto; background: #0a0c0b; border-radius: 16px; padding: 40px; color: #e8edea;">
        <div style="text-align: center; margin-bottom: 32px;">
          <div style="display: inline-flex; align-items: center; justify-content: center; width: 56px; height: 56px; background: #14532d; border-radius: 50%; margin-bottom: 16px;">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <rect x="5" y="11" width="14" height="10" rx="2" stroke="#22c55e" stroke-width="1.8"/>
              <path d="M8 11V7a4 4 0 0 1 8 0v4" stroke="#22c55e" stroke-width="1.8"/>
            </svg>
          </div>
          <h1 style="font-size: 22px; font-weight: 800; color: #e8edea; margin: 0;">Recuperação de senha</h1>
          <p style="color: #8a9a90; font-size: 14px; margin-top: 8px;">MADM Dashboard</p>
        </div>

        <p style="color: #8a9a90; font-size: 15px; line-height: 1.6; margin-bottom: 28px;">
          Olá, <strong style="color: #e8edea;">${toName}</strong>! Recebemos uma solicitação para redefinir sua senha. Use o código abaixo:
        </p>

        <div style="background: #050a0a; border: 1px solid #18211c; border-radius: 12px; padding: 28px; text-align: center; margin-bottom: 28px;">
          <p style="color: #4a5650; font-size: 12px; text-transform: uppercase; letter-spacing: 2px; margin: 0 0 12px;">Seu código</p>
          <div style="font-size: 42px; font-weight: 900; letter-spacing: 12px; color: #22c55e; font-family: monospace;">${code}</div>
          <p style="color: #4a5650; font-size: 12px; margin: 12px 0 0;">Válido por <strong style="color: #8a9a90;">15 minutos</strong></p>
        </div>

        <p style="color: #4a5650; font-size: 13px; line-height: 1.6;">
          Se você não solicitou a redefinição de senha, ignore este e-mail. Sua senha permanece a mesma.
        </p>
      </div>
    `,
  }, {
    headers: {
      'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
  });
  console.log('[resend] status:', response.status, '| data:', JSON.stringify(response.data));
}

function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function forgotPassword(req: Request, res: Response, next: NextFunction) {
  try {
    const { email } = req.body;
    if (!email) throw new AppError('E-mail obrigatório', 400);

    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });

    if (!user || !user.active) {
      return res.json({ message: 'Se o e-mail estiver cadastrado, você receberá um código.' });
    }

    await prisma.passwordResetToken.updateMany({
      where: { email: email.toLowerCase(), used: false },
      data: { used: true },
    });

    const code = generateCode();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await prisma.passwordResetToken.create({
      data: { email: email.toLowerCase(), code, expiresAt },
    });

    await sendEmail(email, user.name, code);

    res.json({ message: 'Se o e-mail estiver cadastrado, você receberá um código.' });
  } catch (err) { next(err); }
}

export async function verifyCode(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, code } = req.body;
    if (!email || !code) throw new AppError('E-mail e código obrigatórios', 400);

    const token = await prisma.passwordResetToken.findFirst({
      where: {
        email: email.toLowerCase(),
        code,
        used: false,
        expiresAt: { gt: new Date() },
      },
    });

    if (!token) throw new AppError('Código inválido ou expirado', 400);

    res.json({ valid: true });
  } catch (err) { next(err); }
}

export async function resetPassword(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, code, newPassword } = req.body;
    if (!email || !code || !newPassword) throw new AppError('Dados incompletos', 400);
    if (newPassword.length < 6) throw new AppError('Senha deve ter ao menos 6 caracteres', 400);

    const token = await prisma.passwordResetToken.findFirst({
      where: {
        email: email.toLowerCase(),
        code,
        used: false,
        expiresAt: { gt: new Date() },
      },
    });

    if (!token) throw new AppError('Código inválido ou expirado', 400);

    const hashed = await bcrypt.hash(newPassword, 12);

    await prisma.user.update({
      where: { email: email.toLowerCase() },
      data: { password: hashed },
    });

    await prisma.passwordResetToken.update({
      where: { id: token.id },
      data: { used: true },
    });

    res.json({ message: 'Senha redefinida com sucesso!' });
  } catch (err) { next(err); }
}
