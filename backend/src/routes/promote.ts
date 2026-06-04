import { Router, Response } from 'express';
import pool from '../database';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

router.post('/promote', authMiddleware, async (req: AuthRequest, res: Response) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email requis' });
  const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
  if (result.rows.length === 0) return res.status(404).json({ error: 'Utilisateur non trouvé' });
  await pool.query("UPDATE users SET role = 'admin' WHERE email = $1", [email]);
  res.json({ message: `L'utilisateur ${email} est maintenant administrateur.` });
});

export default router;
