import { Request, Response, NextFunction } from 'express';
import axios from 'axios';
import { getCache, setCache } from '../lib/cache';

const UMBLER_URL = 'https://script.google.com/macros/s/AKfycbwNi9hbXJYXPBU0nNoWgSGyfkWOVjesewhxUPMSfdrR1AYa4HojRhQ8wxrj6wXrOp2N/exec';
const TTL = 60 * 1000;
const CACHE_KEY = 'umbler:list';

export async function getUmblerList(req: Request, res: Response, next: NextFunction) {
  try {
    const force = req.query.force === 'true';
    const cached = force ? null : getCache<any>(CACHE_KEY);
    if (cached) { res.setHeader('X-Cache', 'HIT'); return res.json(cached); }

    const { data } = await axios.get(`${UMBLER_URL}?action=getDados`, { timeout: 30000 });
    if (!data.ok) return res.json({ ok: false, rows: [], error: data.error });

    const result = { ok: true, rows: data.dados || [], total: data.total || 0 };
    setCache(CACHE_KEY, result, TTL);
    res.setHeader('X-Cache', 'MISS');
    return res.json(result);
  } catch (err) { next(err); }
}
