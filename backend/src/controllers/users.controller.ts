import { Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma';
import { AppError } from '../middlewares/error.middleware';
import { AuthRequest } from '../middlewares/auth.middleware';

export async function listUsers(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { page = 1, limit = 20, search, role, equipeId, unidadeId } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = { active: true };
    if (search) where.OR = [
      { name: { contains: String(search) } },
      { email: { contains: String(search) } },
    ];
    if (role) where.role = role;
    if (equipeId) where.equipeId = equipeId;
    if (unidadeId) where.unidadeId = unidadeId;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { name: 'asc' },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          avatar: true,
          active: true,
          createdAt: true,
          equipe: { select: { nome: true } },
          unidade: { select: { nome: true } },
        },
      }),
      prisma.user.count({ where }),
    ]);

    res.json({ users, total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / Number(limit)) });
  } catch (err) { next(err); }
}

export async function createUser(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { name, email, password, role, equipeId, unidadeId } = req.body;
    const exists = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (exists) throw new AppError('Email já cadastrado', 409);

    const hashed = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { name, email: email.toLowerCase(), password: hashed, role, equipeId, unidadeId },
      select: { id: true, name: true, email: true, role: true, active: true, createdAt: true },
    });
    res.status(201).json(user);
  } catch (err) { next(err); }
}

export async function updateUser(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const { name, role, equipeId, unidadeId, active } = req.body;
    const user = await prisma.user.update({
      where: { id },
      data: { name, role, equipeId, unidadeId, active },
      select: {
        id: true, name: true, email: true, role: true,
        avatar: true, active: true, createdAt: true,
        equipe: { select: { nome: true } },
        unidade: { select: { nome: true } },
      },
    });
    res.json(user);
  } catch (err) { next(err); }
}

export async function deleteUser(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    if (id === req.user!.id) throw new AppError('Não é possível desativar a si mesmo', 400);
    await prisma.user.update({ where: { id }, data: { active: false } });
    res.json({ message: 'Usuário desativado' });
  } catch (err) { next(err); }
}
