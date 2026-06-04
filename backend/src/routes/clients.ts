import { Router, Response } from 'express';
import { z } from 'zod';
import pool from '../database';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();
const clientSchema = z.object({
  name: z.string().min(1),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  type: z.enum(['client', 'fournisseur']).default('client'),
});

router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  const result = await pool.query('SELECT * FROM clients WHERE user_id = $1 ORDER BY name', [req.userId]);
  res.json({ clients: result.rows });
});

router.post('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const data = clientSchema.parse(req.body);
    const result = await pool.query(
      'INSERT INTO clients (user_id, name, email, phone, type) VALUES ($1,$2,$3,$4,$5) RETURNING *',
      [req.userId, data.name, data.email || null, data.phone || null, data.type]
    );
    res.status(201).json({ client: result.rows[0] });
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: error.issues[0].message });
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.delete('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  await pool.query('DELETE FROM clients WHERE id = $1 AND user_id = $2', [req.params.id, req.userId]);
  res.json({ message: 'Supprimé' });
});

export default router;
