import { Router, Response } from 'express';
import pool from '../database';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { adminMiddleware } from '../middleware/admin';

const router = Router();
router.use(authMiddleware, adminMiddleware);

router.get('/users', async (req: AuthRequest, res: Response) => {
  const result = await pool.query('SELECT id, email, name, language, role, created_at FROM users ORDER BY created_at DESC');
  res.json({ users: result.rows });
});

router.put('/users/:id/premium', async (req: AuthRequest, res: Response) => {
  const userId = req.params.id;
  const { premium } = req.body;
  if (premium) {
    await pool.query("UPDATE users SET premium_until = NOW() + INTERVAL '30 days' WHERE id = $1", [userId]);
  } else {
    await pool.query('UPDATE users SET premium_until = NULL WHERE id = $1', [userId]);
  }
  res.json({ message: 'Statut premium mis à jour' });
});

router.delete('/users/:id', async (req: AuthRequest, res: Response) => {
  const userId = parseInt(req.params.id);
  if (userId === req.userId) return res.status(400).json({ error: 'Vous ne pouvez pas supprimer votre propre compte' });
  await pool.query('DELETE FROM users WHERE id = $1', [userId]);
  res.json({ message: 'Utilisateur supprimé' });
});

router.get('/stats', async (req: AuthRequest, res: Response) => {
  const total = await pool.query('SELECT COUNT(*)::int AS count FROM users');
  const premium = await pool.query("SELECT COUNT(*)::int AS count FROM users WHERE premium_until > NOW()");
  res.json({ totalUsers: total.rows[0].count, premiumUsers: premium.rows[0].count });
});

export default router;
