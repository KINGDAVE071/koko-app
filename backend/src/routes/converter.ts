import { Router, Request, Response } from 'express';
import { z } from 'zod';
import pool from '../database';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { getLiveRates } from '../services/exchangeRate';

const router = Router();

const convertSchema = z.object({
  amount: z.number().positive(),
  from: z.string().length(3).toUpperCase(),
  to: z.string().length(3).toUpperCase(),
  useParallel: z.boolean().optional().default(false),
});

const marginSchema = z.object({
  costPrice: z.number().positive(),
  marginPercent: z.number().min(0).max(100),
  currency: z.string().length(3).toUpperCase(),
});

// GET /live-rates : liste des devises et taux en direct
router.get('/live-rates', async (_req: Request, res: Response) => {
  try {
    const data = await getLiveRates();
    res.json({ rates: data.rates, base: data.base_code, time: data.time_last_update_utc });
  } catch (error) {
    res.status(500).json({ error: 'Impossible de récupérer les taux en direct' });
  }
});

// POST /convert : conversion officielle (via API live) ou parallèle (via table)
router.post('/convert', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { amount, from, to, useParallel } = convertSchema.parse(req.body);

    if (useParallel) {
      const result = await pool.query(
        'SELECT * FROM conversion_rates WHERE from_currency = $1 AND to_currency = $2 ORDER BY updated_at DESC LIMIT 1',
        [from, to]
      );
      if (result.rows.length === 0) {
        return res.status(404).json({ error: `Taux parallèle ${from} → ${to} non disponible.` });
      }
      const rate = result.rows[0].parallel_rate || result.rows[0].official_rate;
      const converted = Math.round(amount * rate * 100) / 100;
      res.json({ amount, from, to, rate, result: converted, type: 'parallel', date: new Date().toISOString() });
    } else {
      const liveData = await getLiveRates();
      const rates = liveData.rates;
      const fromToUSD = from === 'USD' ? 1 : (1 / rates[from]);
      const usdToTarget = to === 'USD' ? 1 : rates[to];
      if (fromToUSD === undefined || usdToTarget === undefined) {
        return res.status(404).json({ error: `Devise non supportée : ${from} ou ${to}` });
      }
      const rate = fromToUSD * usdToTarget;
      const converted = Math.round(amount * rate * 100) / 100;
      res.json({ amount, from, to, rate, result: converted, type: 'official', date: new Date().toISOString() });
    }
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: error.issues[0].message });
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /margin (inchangé)
router.post('/margin', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { costPrice, marginPercent, currency } = marginSchema.parse(req.body);
    const sellingPrice = Math.round(costPrice * (1 + marginPercent / 100) * 100) / 100;
    res.json({ costPrice, marginPercent, sellingPrice, marginAmount: Math.round((sellingPrice - costPrice) * 100) / 100, currency });
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: error.issues[0].message });
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Administration des taux stockés (pour le mode parallèle)
router.get('/rates', authMiddleware, async (_req: AuthRequest, res: Response) => {
  const result = await pool.query('SELECT * FROM conversion_rates ORDER BY from_currency, to_currency');
  res.json({ rates: result.rows });
});

router.post('/rates', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { from, to, official, parallel } = req.body;
    await pool.query(
      `INSERT INTO conversion_rates (from_currency, to_currency, official_rate, parallel_rate)
       VALUES ($1,$2,$3,$4)
       ON CONFLICT (from_currency, to_currency) DO UPDATE SET official_rate=$3, parallel_rate=$4, updated_at=NOW()`,
      [from, to, official, parallel || null]
    );
    res.json({ message: 'Taux mis à jour' });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

export default router;
