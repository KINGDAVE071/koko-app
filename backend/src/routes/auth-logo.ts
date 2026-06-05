import { Router, Response } from 'express';
import pool from '../database';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

// Upload du logo (base64)
router.put('/logo', authMiddleware, async (req: AuthRequest, res: Response) => {
  const { logo } = req.body;
  if (!logo) return res.status(400).json({ error: 'Aucune image fournie' });
  try {
    await pool.query('UPDATE users SET logo = $1 WHERE id = $2', [logo, req.userId]);
    res.json({ message: 'Logo mis à jour' });
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la mise à jour du logo' });
  }
});

// Récupérer le logo
router.get('/logo', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query('SELECT logo FROM users WHERE id = $1', [req.userId]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Utilisateur non trouvé' });
    res.json({ logo: result.rows[0].logo });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

export default router;
