import { Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middlewares/auth.middleware';

export async function getRelatorios(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { dataInicio, dataFim, status, search, consultorId, equipeId, unidadeId, advogadoId, page = 1, limit = 50 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {};
    if (status) where.status = String(status);
    if (consultorId) where.consultorId = consultorId;
    if (equipeId) where.equipeId = equipeId;
    if (unidadeId) where.unidadeId = unidadeId;
    if (advogadoId) where.advogadoId = advogadoId;
    if (dataInicio || dataFim) {
      where.createdAt = {};
      if (dataInicio) where.createdAt.gte = new Date(String(dataInicio));
      if (dataFim) where.createdAt.lte = new Date(String(dataFim));
    }
    if (search) {
      where.cliente = { nome: { contains: String(search), mode: 'insensitive' } };
    }

    const [negocios, total] = await Promise.all([
      prisma.negocio.findMany({
        where, skip, take: Number(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          cliente: { select: { nome: true, email: true, telefone: true } },
          consultor: { select: { name: true } },
          equipe: { select: { nome: true } },
          unidade: { select: { nome: true } },
          advogado: { select: { nome: true } },
        },
      }),
      prisma.negocio.count({ where }),
    ]);

    res.json({ negocios, total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / Number(limit)) });
  } catch (err) { next(err); }
}
