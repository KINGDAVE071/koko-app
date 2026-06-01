import { Router, Request, Response } from 'express';
import { z } from 'zod';
import db from '../database';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

const convertSchema = z.object({
  amount: z.number().positive('Le montant doit être positif'),
  from: z.string().length(3, 'Code devise invalide (3 lettres)').toUpperCase(),
  to: z.string().length(3, 'Code devise invalide (3 lettres)').toUpperCase(),
  useParallel: z.boolean().optional().default(false),
});

const marginSchema = z.object({
  costPrice: z.number().positive('Prix d\'achat positif'),
  marginPercent: z.number().min(0).max(100, 'Marge entre 0 et 100%'),
  currency: z.string().length(3).toUpperCase(),
});

router.post('/convert', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const { amount, from, to, useParallel } = convertSchema.parse(req.body);
    const rateRow = db.prepare(
      'SELECT * FROM conversion_rates WHERE from_currency = ? AND to_currency = ? ORDER BY updated_at DESC LIMIT 1'
    ).get(from, to) as any;

    if (!rateRow) {
      return res.status(404).json({ error: `Taux ${from} → ${to} non disponible.` });
    }

    const rate = useParallel && rateRow.parallel_rate ? rateRow.parallel_rate : rateRow.official_rate;
    const result = amount * rate;

    res.json({
      amount,
      from,
      to,
      rate,
      result: Math.round(result * 100) / 100,
      type: useParallel ? 'parallel' : 'official',
      date: new Date().toISOString(),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.issues[0].message });
    }
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.post('/margin', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const { costPrice, marginPercent, currency } = marginSchema.parse(req.body);
    const sellingPrice = costPrice * (1 + marginPercent / 100);
    const marginAmount = sellingPrice - costPrice;

    res.json({
      costPrice,
      marginPercent,
      sellingPrice: Math.round(sellingPrice * 100) / 100,
      marginAmount: Math.round(marginAmount * 100) / 100,
      currency,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.issues[0].message });
    }
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.get('/rates', authMiddleware, (req: AuthRequest, res: Response) => {
  const rates = db.prepare('SELECT * FROM conversion_rates ORDER BY from_currency, to_currency').all();
  res.json({ rates });
});

const updateRateSchema = z.object({
  from: z.string().length(3).toUpperCase(),
  to: z.string().length(3).toUpperCase(),
  official: z.number().positive(),
  parallel: z.number().positive().optional(),
});

router.post('/rates', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const { from, to, official, parallel } = updateRateSchema.parse(req.body);
    const existing = db.prepare(
      'SELECT id FROM conversion_rates WHERE from_currency = ? AND to_currency = ?'
    ).get(from, to);

    if (existing) {
      db.prepare(
        'UPDATE conversion_rates SET official_rate = ?, parallel_rate = ?, updated_at = CURRENT_TIMESTAMP WHERE from_currency = ? AND to_currency = ?'
      ).run(official, parallel || null, from, to);
    } else {
      db.prepare(
        'INSERT INTO conversion_rates (from_currency, to_currency, official_rate, parallel_rate) VALUES (?, ?, ?, ?)'
      ).run(from, to, official, parallel || null);
    }

    res.json({ message: 'Taux mis à jour' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.issues[0].message });
    }
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

export default router;
