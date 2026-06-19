import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import axios from 'axios';
import { getCache, setCache } from '../lib/cache';

const SHEETS_URL   = process.env.SHEETS_URL   || '';
const SHEETS_TOKEN = process.env.SHEETS_TOKEN || 'madm2024';
const TTL = 60 * 1000; // 1 minuto

async function fetchSheets(tab: string) {
  if (!SHEETS_URL) throw new Error('SHEETS_URL não configurada no .env');
  const url = `${SHEETS_URL}?action=data&secret=${SHEETS_TOKEN}&tab=${encodeURIComponent(tab)}`;
  const { data } = await axios.get(url, { timeout: 25000 });
  return data;
}

export async function getSheetsTabs(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const key = 'sheets:tabs';
    const cached = getCache<any>(key);
    if (cached) return res.json(cached);
    const url = `${SHEETS_URL}?action=tabs&secret=${SHEETS_TOKEN}`;
    const { data } = await axios.get(url, { timeout: 20000 });
    setCache(key, data, TTL);
    res.json(data);
  } catch (err) { next(err); }
}

export async function getSheetsPerformance(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const key = 'sheets:performance';
    const force = req.query.force === 'true';
    const cached = force ? null : getCache<any>(key);
    if (cached) {
      res.setHeader('X-Cache', 'HIT');
      return res.json(cached);
    }

    const sheetData = await fetchSheets('Mês - Performance');
    const registros: any[] = sheetData.registros || [];

    const linhas = registros.filter(r =>
      r.colaborador &&
      String(r.colaborador).trim() !== '' &&
      String(r.colaborador).toLowerCase() !== 'total'
    );

    const totalRow = registros.find(r =>
      String(r.colaborador || '').toLowerCase() === 'total'
    );

    const totais = totalRow || linhas.reduce((acc: any, r: any) => ({
      recebidos:      (acc.recebidos      || 0) + (r.recebidos      || 0),
      emitidos:       (acc.emitidos       || 0) + (r.emitidos       || 0),
      assinadosSafra: (acc.assinadosSafra || 0) + (r.assinadosSafra || 0),
      vendaGanha:     (acc.vendaGanha     || 0) + (r.vendaGanha     || 0),
      protocolados:   (acc.protocolados   || 0) + (r.protocolados   || 0),
    }), {});

    const result = { total: linhas.length, linhas, totais };
    setCache(key, result, TTL);
    res.setHeader('X-Cache', 'MISS');
    res.json(result);
  } catch (err) { next(err); }
}
