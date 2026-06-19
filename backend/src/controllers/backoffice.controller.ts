import { Request, Response, NextFunction } from 'express';
import axios from 'axios';
import { getCache, setCache } from '../lib/cache';

const BACKOFFICE_URL = 'https://script.google.com/macros/s/AKfycbx1-rqprwI2jd2mkvLmgwkjZJ5ZVe6b1LA1OJWDDEcwMxYaxjmy836z84MgDY9qBwjDaw/exec';
const TTL       = 5 * 60 * 1000; // 5 minutos de cache válido
const STALE_TTL = 15 * 60 * 1000; // 15 minutos stale (usa cache antigo mas já revalida)
const CACHE_KEY = 'backoffice:list';
const CACHE_TS  = 'backoffice:list:ts';

let revalidating = false;

async function fetchFromSheet(): Promise<any> {
  const { data } = await axios.get(`${BACKOFFICE_URL}?action=list`, { timeout: 30000 });
  if (!data.ok) throw new Error(data.error || 'Script retornou erro');
  const result = { ok: true, rows: data.rows || [], total: data.total || 0 };
  setCache(CACHE_KEY, result, STALE_TTL);
  setCache(CACHE_TS, Date.now(), STALE_TTL);
  return result;
}

export async function getBackofficeList(req: Request, res: Response, next: NextFunction) {
  try {
    const force = req.query.force === 'true';
    const cached = getCache<any>(CACHE_KEY);
    const cachedAt: number = getCache<number>(CACHE_TS) ?? 0;
    const age = Date.now() - cachedAt;

    // Força: busca agora e aguarda
    if (force) {
      const result = await fetchFromSheet();
      res.setHeader('X-Cache', 'FORCE');
      return res.json(result);
    }

    // Cache válido: responde imediatamente
    if (cached && age < TTL) {
      res.setHeader('X-Cache', 'HIT');
      return res.json(cached);
    }

    // Cache stale: responde com dado antigo e revalida em background
    if (cached && age < STALE_TTL) {
      res.setHeader('X-Cache', 'STALE');
      res.json(cached);
      if (!revalidating) {
        revalidating = true;
        fetchFromSheet().catch(() => {}).finally(() => { revalidating = false; });
      }
      return;
    }

    // Sem cache: busca e aguarda
    const result = await fetchFromSheet();
    res.setHeader('X-Cache', 'MISS');
    return res.json(result);
  } catch (err: any) {
    next(err);
  }
}
