import { Router, Response } from 'express';
import { z } from 'zod';
import pool from '../database';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();
const transactionSchema = z.object({
  type: z.enum(['income', 'expense']),
  amount: z.number().positive(),
  description: z.string().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  const txResult = await pool.query('SELECT * FROM transactions WHERE user_id = $1 ORDER BY date DESC', [req.userId]);
  const incomeResult = await pool.query("SELECT COALESCE(SUM(amount),0) AS total FROM transactions WHERE user_id = $1 AND type = 'income'", [req.userId]);
  const expenseResult = await pool.query("SELECT COALESCE(SUM(amount),0) AS total FROM transactions WHERE user_id = $1 AND type = 'expense'", [req.userId]);
  const income = parseFloat(incomeResult.rows[0].total);
  const expense = parseFloat(expenseResult.rows[0].total);
  res.json({ transactions: txResult.rows, balance: income - expense });
});

router.post('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const data = transactionSchema.parse(req.body);
    const result = await pool.query(
      'INSERT INTO transactions (user_id, type, amount, description, date) VALUES ($1,$2,$3,$4,$5) RETURNING *',
      [req.userId, data.type, data.amount, data.description || null, data.date]
    );
    res.status(201).json({ transaction: result.rows[0] });
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: error.issues[0].message });
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// DELETE /api/transactions/:id
router.delete('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM transactions WHERE id = $1 AND user_id = $2 RETURNING id', [id, req.userId]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Transaction non trouvée' });
    res.json({ message: 'Transaction supprimée' });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

export default router;
