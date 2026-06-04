import { Router, Request, Response } from 'express';
import pool from '../database';

const router = Router();

// GET /api/auth-check/exists?email=...
router.get('/exists', async (req: Request, res: Response) => {
  const email = req.query.email as string;
  if (!email) return res.status(400).json({ error: 'Email requis' });
  try {
    const result = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    res.json({ exists: result.rows.length > 0 });
  } catch (e) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

export default router;
