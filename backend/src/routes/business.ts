import { Router, Response } from 'express';
import pool from '../database';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

router.get('/dashboard', authMiddleware, async (req: AuthRequest, res: Response) => {
  const userId = req.userId;
  const products = await pool.query('SELECT COUNT(*)::int AS count FROM products WHERE user_id = $1', [userId]);
  const clients = await pool.query('SELECT COUNT(*)::int AS count FROM clients WHERE user_id = $1', [userId]);
  const invoices = await pool.query('SELECT COUNT(*)::int AS count FROM invoices WHERE user_id = $1', [userId]);
  const income = await pool.query("SELECT COALESCE(SUM(amount),0) AS total FROM transactions WHERE user_id = $1 AND type = 'income'", [userId]);
  const expense = await pool.query("SELECT COALESCE(SUM(amount),0) AS total FROM transactions WHERE user_id = $1 AND type = 'expense'", [userId]);
  res.json({
    productsCount: products.rows[0].count,
    clientsCount: clients.rows[0].count,
    invoicesCount: invoices.rows[0].count,
    income: parseFloat(income.rows[0].total),
    expense: parseFloat(expense.rows[0].total),
    balance: parseFloat(income.rows[0].total) - parseFloat(expense.rows[0].total),
  });
});

export default router;
