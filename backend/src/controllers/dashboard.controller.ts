import { Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middlewares/auth.middleware';
import { startOfMonth, endOfMonth, subMonths, format } from 'date-fns';

// Uma única query GROUP BY em vez de 15 queries separadas
async function getStatusCounts(where: any = {}): Promise<Record<string, number>> {
  const rows = await prisma.negocio.groupBy({
    by: ['status'],
    where,
    _count: { id: true },
  });
  return Object.fromEntries(rows.map(r => [r.status, r._count.id]));
}

async function getEvolucaoMensal(where: any) {
  const meses = [];
  for (let i = 5; i >= 0; i--) {
    const ref = subMonths(new Date(), i);
    const count = await prisma.negocio.count({
      where: { ...where, createdAt: { gte: startOfMonth(ref), lte: endOfMonth(ref) } },
    });
    meses.push({ mes: format(ref, 'MMM/yy'), total: count });
  }
  return meses;
}

async function getRankingConsultores(where: any, limit = 5) {
  const rows = await prisma.negocio.groupBy({
    by: ['consultorId'],
    where: { ...where, consultorId: { not: null } },
    _count: { id: true },
    orderBy: { _count: { id: 'desc' } },
    take: limit,
  });
  const ids = rows.map(r => r.consultorId!).filter(Boolean);
  if (!ids.length) return [];
  const users = await prisma.user.findMany({
    where: { id: { in: ids } },
    select: { id: true, name: true },
  });
  const nameMap = Object.fromEntries(users.map(u => [u.id, u.name]));
  return rows.map(r => ({
    consultorId: r.consultorId,
    nome: nameMap[r.consultorId!] || 'Desconhecido',
    total: r._count.id,
  }));
}

function buildFunil(counts: Record<string, number>) {
  return [
    { etapa: 'Leads',           valor: counts['LEAD'] || 0 },
    { etapa: 'Primeiro Contato',valor: counts['PRIMEIRO_CONTATO'] || 0 },
    { etapa: 'Em Contato',      valor: counts['EM_CONTATO'] || 0 },
    { etapa: 'Documentação',    valor: counts['COLETA_DOCUMENTACAO'] || 0 },
    { etapa: 'Ag. Emissão',     valor: counts['AGUARDANDO_EMISSAO'] || 0 },
    { etapa: 'Emitidos',        valor: counts['EMITIDO'] || 0 },
    { etapa: 'Assinados',       valor: counts['ASSINADO'] || 0 },
    { etapa: 'Finalizados',     valor: counts['FINALIZADO'] || 0 },
  ];
}

export async function getDashboardGeral(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { dataInicio, dataFim, unidadeId } = req.query;
    const where: any = {};
    if (unidadeId) where.unidadeId = unidadeId;
    if (dataInicio || dataFim) {
      where.createdAt = {};
      if (dataInicio) where.createdAt.gte = new Date(String(dataInicio));
      if (dataFim)    where.createdAt.lte = new Date(String(dataFim));
    }

    const [counts, total, evolucaoMensal, rankingConsultores] = await Promise.all([
      getStatusCounts(where),
      prisma.negocio.count({ where }),
      getEvolucaoMensal(where),
      getRankingConsultores(where),
    ]);

    const finalizados = counts['FINALIZADO'] || 0;
    const taxaConversao = total > 0 ? Number(((finalizados / total) * 100).toFixed(1)) : 0;

    const gargalos = ['LEAD','PRIMEIRO_CONTATO','EM_CONTATO','COLETA_DOCUMENTACAO','AGUARDANDO_EMISSAO','AUDITORIA']
      .map(etapa => ({ etapa, count: counts[etapa] || 0 }));

    res.json({
      cards: {
        totalClientes: total,
        leads: counts['LEAD'] || 0,
        primeiroContato: counts['PRIMEIRO_CONTATO'] || 0,
        emContato: counts['EM_CONTATO'] || 0,
        semRetorno: counts['SEM_RETORNO'] || 0,
        coletaDocumentacao: counts['COLETA_DOCUMENTACAO'] || 0,
        pendencias: counts['PENDENCIAS'] || 0,
        aguardandoEmissao: counts['AGUARDANDO_EMISSAO'] || 0,
        emitidos: counts['EMITIDO'] || 0,
        assinados: counts['ASSINADO'] || 0,
        auditoria: counts['AUDITORIA'] || 0,
        finalizados,
        taxaConversao,
      },
      evolucaoMensal,
      rankingConsultores,
      gargalos,
      funil: buildFunil(counts),
    });
  } catch (err) { next(err); }
}

export async function getDashboardComercial(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { dataInicio, dataFim, equipeId, unidadeId } = req.query;
    const where: any = {};
    if (equipeId)  where.equipeId  = equipeId;
    if (unidadeId) where.unidadeId = unidadeId;
    if (dataInicio || dataFim) {
      where.createdAt = {};
      if (dataInicio) where.createdAt.gte = new Date(String(dataInicio));
      if (dataFim)    where.createdAt.lte = new Date(String(dataFim));
    }

    const [counts, evolucaoMensal, rankingConsultores] = await Promise.all([
      getStatusCounts(where),
      getEvolucaoMensal(where),
      getRankingConsultores(where, 10),
    ]);

    res.json({
      cards: counts,
      evolucaoMensal,
      rankingConsultores,
      funil: [
        { etapa: 'Leads',           valor: counts['LEAD'] || 0 },
        { etapa: 'Primeiro Contato',valor: counts['PRIMEIRO_CONTATO'] || 0 },
        { etapa: 'Em Contato',      valor: counts['EM_CONTATO'] || 0 },
        { etapa: 'Sem Retorno',     valor: counts['SEM_RETORNO'] || 0 },
        { etapa: 'Documentação',    valor: counts['COLETA_DOCUMENTACAO'] || 0 },
        { etapa: 'Emitidos',        valor: counts['EMITIDO'] || 0 },
        { etapa: 'Assinados',       valor: counts['ASSINADO'] || 0 },
      ],
    });
  } catch (err) { next(err); }
}

export async function getDashboardBackoffice(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { dataInicio, dataFim } = req.query;
    const where: any = {};
    if (dataInicio || dataFim) {
      where.createdAt = {};
      if (dataInicio) where.createdAt.gte = new Date(String(dataInicio));
      if (dataFim)    where.createdAt.lte = new Date(String(dataFim));
    }

    const [counts, evolucaoMensal, producaoPorColaborador] = await Promise.all([
      getStatusCounts(where),
      getEvolucaoMensal(where),
      getRankingConsultores(where, 10),
    ]);

    res.json({ cards: counts, evolucaoMensal, producaoPorColaborador });
  } catch (err) { next(err); }
}

export async function getDashboardRibeiraoPreto(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const unidade = await prisma.unidade.findFirst({
      where: { nome: { contains: 'Ribeir' } },
    });
    if (unidade) req.query.unidadeId = unidade.id;
    return getDashboardComercial(req, res, next);
  } catch (err) { next(err); }
}
