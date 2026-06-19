import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma';
import { signToken } from '../utils/jwt';
import { AppError } from '../middlewares/error.middleware';
import { AuthRequest } from '../middlewares/auth.middleware';

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password } = req.body;
    if (!email || !password) throw new AppError('Email e senha são obrigatórios', 400);

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: { equipe: true, unidade: true },
    });

    if (!user || !user.active) throw new AppError('Credenciais inválidas', 401);

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) throw new AppError('Credenciais inválidas', 401);

    const token = signToken({ userId: user.id, email: user.email, role: user.role });

    await prisma.log.create({
      data: { userId: user.id, acao: 'LOGIN', ip: req.ip, userAgent: req.headers['user-agent'] },
    });

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        equipe: user.equipe?.nome,
        unidade: user.unidade?.nome,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function me(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true, name: true, email: true, role: true, avatar: true,
        active: true, createdAt: true,
        equipe: { select: { nome: true } },
        unidade: { select: { nome: true } },
      },
    });
    res.json(user);
  } catch (err) {
    next(err);
  }
}

export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) throw new AppError('Nome, e-mail e senha são obrigatórios', 400);
    if (password.length < 6) throw new AppError('Senha deve ter ao menos 6 caracteres', 400);

    const exists = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (exists) throw new AppError('Este e-mail já está cadastrado', 409);

    // Primeiro usuário registrado vira ADMIN automaticamente
    const totalUsers = await prisma.user.count();
    const role = totalUsers === 0 ? 'ADMIN' : 'USUARIO';

    const hashed = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { name, email: email.toLowerCase(), password: hashed, role },
    });

    const token = signToken({ userId: user.id, email: user.email, role: user.role });

    await prisma.log.create({
      data: { userId: user.id, acao: 'REGISTER', ip: req.ip, userAgent: req.headers['user-agent'] },
    });

    res.status(201).json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    next(err);
  }
}

export async function changePassword(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
    if (!user) throw new AppError('Usuário não encontrado', 404);

    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) throw new AppError('Senha atual incorreta', 400);

    const hashed = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({ where: { id: user.id }, data: { password: hashed } });
    res.json({ message: 'Senha alterada com sucesso' });
  } catch (err) {
    next(err);
  }
}
