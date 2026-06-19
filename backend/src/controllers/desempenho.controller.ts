import { Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middlewares/auth.middleware';

export async function getDesempenhoIndividual(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { equipeId, unidadeId, dataInicio, dataFim } = req.query;

    const where: any = { consultorId: { not: null } };
    if (equipeId)   where.equipeId  = equipeId;
    if (unidadeId)  where.unidadeId = unidadeId;
    if (dataInicio || dataFim) {
      where.createdAt = {};
      if (dataInicio) where.createdAt.gte = new Date(String(dataInicio));
      if (dataFim)    where.createdAt.lte = new Date(String(dataFim));
    }

    // Agrupar por consultor
    const grouped = await prisma.negocio.groupBy({
      by: ['consultorId'],
      where,
      _count: { id: true },
    });

    const result = await Promise.all(
      grouped.map(async (g) => {
        const user = await prisma.user.findUnique({
          where: { id: g.consultorId! },
          select: { id: true, name: true, avatar: true, role: true },
        });

        // Contar por status para este consultor
        const filtroConsultor = { ...where, consultorId: g.consultorId };

        const [
          registros, emAndamento, concluidos, auditoria,
          desqualificados, pro, vendaPerdida, desistiu, cancelado
        ] = await Promise.all([
          prisma.negocio.count({ where: filtroConsultor }),
          prisma.negocio.count({ where: { ...filtroConsultor, status: { in: ['LEAD','PRIMEIRO_CONTATO','EM_CONTATO','COLETA_DOCUMENTACAO','PENDENCIAS','AGUARDANDO_EMISSAO','EMITIDO','ASSINADO','SANADA','RESET'] } } }),
          prisma.negocio.count({ where: { ...filtroConsultor, status: 'FINALIZADO' } }),
          prisma.negocio.count({ where: { ...filtroConsultor, status: 'AUDITORIA' } }),
          prisma.negocio.count({ where: { ...filtroConsultor, status: 'SEM_RETORNO' } }),
          prisma.negocio.count({ where: { ...filtroConsultor, status: 'PRO' } }),
          prisma.negocio.count({ where: { ...filtroConsultor, status: 'CANCELADO' } }),
          prisma.negocio.count({ where: { ...filtroConsultor, status: 'RESET' } }),
          prisma.negocio.count({ where: { ...filtroConsultor, status: 'CANCELADO' } }),
        ]);

        const taxa = registros > 0 ? Math.round((concluidos / registros) * 100) : 0;

        return {
          id: user?.id,
          nome: user?.name || 'Desconhecido',
          avatar: user?.avatar || null,
          cargo: user?.role || 'Assessor',
          registros,
          emAndamento,
          concluidos,
          auditoria,
          desqualificados,
          pro,
          vendaPerdida,
          desistiu: cancelado,
          taxaFinalizacao: taxa,
        };
      })
    );

    // Ordenar por total de registros
    result.sort((a, b) => b.registros - a.registros);

    res.json({ colaboradores: result, total: result.length });
  } catch (err) { next(err); }
}
