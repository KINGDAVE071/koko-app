import { Router, Response } from 'express';
import { z } from 'zod';
import db from '../database';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

const transactionSchema = z.object({
  type: z.enum(['income', 'expense']),
  amount: z.number().positive(),
  description: z.string().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

router.get('/', authMiddleware, (req: AuthRequest, res: Response) => {
  const transactions = db.prepare('SELECT * FROM transactions WHERE user_id = ? ORDER BY date DESC').all(req.userId);
  const income = db.prepare("SELECT SUM(amount) as total FROM transactions WHERE user_id = ? AND type = 'income'").get(req.userId) as any;
  const expense = db.prepare("SELECT SUM(amount) as total FROM transactions WHERE user_id = ? AND type = 'expense'").get(req.userId) as any;
  res.json({
    transactions,
    balance: (income?.total || 0) - (expense?.total || 0),
  });
});

router.post('/', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const data = transactionSchema.parse(req.body);
    const result = db.prepare(
      'INSERT INTO transactions (user_id, type, amount, description, date) VALUES (?, ?, ?, ?, ?)'
    ).run(req.userId, data.type, data.amount, data.description || null, data.date);
    const transaction = db.prepare('SELECT * FROM transactions WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({ transaction });
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: error.issues[0].message });
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

export default router;
