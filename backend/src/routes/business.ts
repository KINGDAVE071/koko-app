import { Router, Response } from 'express';
import db from '../database';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

router.get('/dashboard', authMiddleware, (req: AuthRequest, res: Response) => {
  const userId = req.userId;
  const productsCount = (db.prepare('SELECT COUNT(*) as count FROM products WHERE user_id = ?').get(userId) as any)?.count || 0;
  const clientsCount = (db.prepare('SELECT COUNT(*) as count FROM clients WHERE user_id = ?').get(userId) as any)?.count || 0;
  const invoicesCount = (db.prepare('SELECT COUNT(*) as count FROM invoices WHERE user_id = ?').get(userId) as any)?.count || 0;
  const income = (db.prepare("SELECT SUM(amount) as total FROM transactions WHERE user_id = ? AND type = 'income'").get(userId) as any)?.total || 0;
  const expense = (db.prepare("SELECT SUM(amount) as total FROM transactions WHERE user_id = ? AND type = 'expense'").get(userId) as any)?.total || 0;
  res.json({
    productsCount,
    clientsCount,
    invoicesCount,
    income,
    expense,
    balance: income - expense,
  });
});

export default router;
