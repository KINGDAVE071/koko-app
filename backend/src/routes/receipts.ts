import { Router, Request, Response } from 'express';
import { z } from 'zod';
import pool from '../database';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

const receiptSchema = z.object({
  type: z.enum(['location','vente','pret','service','autre']),
  from_name: z.string().min(2),
  to_name: z.string().min(2),
  amount: z.number().positive(),
  currency: z.string().length(3).toUpperCase(),
  description: z.string().optional(),
  location: z.string().optional(),
  signature_from: z.string().optional(),
  signature_to: z.string().optional(),
});

router.post('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const data = receiptSchema.parse(req.body);
    const result = await pool.query(
      `INSERT INTO receipts (user_id, type, from_name, to_name, amount, currency, description, location, signature_from, signature_to)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [req.userId, data.type, data.from_name, data.to_name, data.amount, data.currency, data.description || null, data.location || null, data.signature_from || null, data.signature_to || null]
    );
    res.status(201).json({ receipt: result.rows[0] });
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: error.issues[0].message });
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  const result = await pool.query('SELECT * FROM receipts WHERE user_id = $1 ORDER BY created_at DESC', [req.userId]);
  res.json({ receipts: result.rows });
});

router.delete('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  await pool.query('DELETE FROM receipts WHERE id = $1 AND user_id = $2', [req.params.id, req.userId]);
  res.json({ message: 'Quittance supprimée' });
});

export default router;
