import { Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middlewares/auth.middleware';
import axios from 'axios';

const SHEETS_URL   = process.env.SHEETS_URL   || '';
const SHEETS_TOKEN = process.env.SHEETS_TOKEN || 'madm2024';

async function fetchMesPerformance() {
  const url = `${SHEETS_URL}?action=data&secret=${SHEETS_TOKEN}&tab=${encodeURIComponent('Mês - Performance')}`;
  const { data } = await axios.get(url, { timeout: 30000 });
  return (data.registros || []) as any[];
}

// Mapeia métricas agregadas em registros individuais de negócio
function expandirRegistros(linha: any, consultorId: string): { status: string }[] {
  const records: { status: string }[] = [];

  const recebidos      = Number(linha.recebidos      || 0);
  const emitidos       = Number(linha.emitidos       || 0);
  const assinadosSafra = Number(linha.assinadosSafra || 0);
  const vendaGanha     = Number(linha.vendaGanha     || 0);
  const protocolados   = Number(linha.protocolados   || 0);

  // Finalizados (venda ganha = FINALIZADO)
  for (let i = 0; i < vendaGanha; i++)     records.push({ status: 'FINALIZADO' });
  // Assinados que não viraram venda
  for (let i = 0; i < Math.max(0, assinadosSafra - vendaGanha); i++) records.push({ status: 'ASSINADO' });
  // Emitidos que não assinaram
  for (let i = 0; i < Math.max(0, emitidos - assinadosSafra); i++)   records.push({ status: 'EMITIDO' });
  // Protocolados
  for (let i = 0; i < protocolados; i++)   records.push({ status: 'AUDITORIA' });
  // Em andamento (recebidos - emitidos)
  const emAndamento = Math.max(0, recebidos - emitidos - protocolados);
  for (let i = 0; i < emAndamento; i++)    records.push({ status: 'EM_CONTATO' });

  return records;
}

// POST /api/v1/sync/sheets
export async function syncFromSheets(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const registros = await fetchMesPerformance();

    const linhas = registros.filter(r =>
      r.colaborador &&
      String(r.colaborador).trim() !== '' &&
      String(r.colaborador).toLowerCase() !== 'total'
    );

    if (!linhas.length) {
      return res.json({ ok: false, msg: 'Nenhum dado encontrado na planilha' });
    }

    // Limpar dados antigos de importação de sheets (para evitar duplicatas)
    await prisma.negocio.deleteMany({
      where: { observacoes: 'sync-sheets' },
    });

    let totalImportados = 0;

    for (const linha of linhas) {
      const nome = String(linha.colaborador).trim();

      // Criar ou encontrar consultor
      let consultor = await prisma.user.findFirst({ where: { name: nome } });
      if (!consultor) {
        const email = nome.toLowerCase()
          .normalize('NFD').replace(/[̀-ͯ]/g, '')
          .replace(/\s+/g, '.').replace(/[^a-z0-9.]/g, '')
          + '@madm.import';

        consultor = await prisma.user.upsert({
          where: { email },
          update: { name: nome },
          create: { name: nome, email, password: 'sync', role: 'USUARIO' },
        });
      }

      // Criar equipe se tiver
      let equipeId: string | null = null;
      if (linha.equipe) {
        const nomeEquipe = String(linha.equipe).trim();
        let equipe = await prisma.equipe.findFirst({ where: { nome: nomeEquipe } });
        if (!equipe) {
          equipe = await prisma.equipe.create({ data: { nome: nomeEquipe } });
        }
        equipeId = equipe.id;

        // Associar consultor à equipe
        await prisma.user.update({
          where: { id: consultor.id },
          data: { equipeId },
        });
      }

      // Expandir métricas em registros individuais
      const negocios = expandirRegistros(linha, consultor.id);

      for (const neg of negocios) {
        // clienteId é obrigatório — cria cliente placeholder para registros de sync
        const clientePlaceholder = await prisma.cliente.upsert({
          where: { kommoId: `sync-${consultor.id}` },
          update: {},
          create: { nome: nome, kommoId: `sync-${consultor.id}` },
        });

        await prisma.negocio.create({
          data: {
            clienteId:   clientePlaceholder.id,
            status:      neg.status,
            consultorId: consultor.id,
            equipeId,
            observacoes: 'sync-sheets',
          },
        });
        totalImportados++;
      }
    }

    res.json({
      ok: true,
      colaboradores: linhas.length,
      negociosCriados: totalImportados,
      msg: `Sync concluído: ${linhas.length} colaboradores, ${totalImportados} registros criados`,
    });
  } catch (err) { next(err); }
}

// GET /api/v1/sync/status
export async function getSyncStatus(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const total = await prisma.negocio.count({ where: { observacoes: 'sync-sheets' } });
    const ultima = await prisma.negocio.findFirst({
      where: { observacoes: 'sync-sheets' },
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true },
    });
    res.json({ totalRegistros: total, ultimoSync: ultima?.createdAt || null });
  } catch (err) { next(err); }
}
