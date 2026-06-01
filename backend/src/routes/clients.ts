import { Router, Response } from 'express';
import { z } from 'zod';
import db from '../database';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

const clientSchema = z.object({
  name: z.string().min(1),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  type: z.enum(['client', 'fournisseur']).default('client'),
});

router.get('/', authMiddleware, (req: AuthRequest, res: Response) => {
  const clients = db.prepare('SELECT * FROM clients WHERE user_id = ? ORDER BY name').all(req.userId);
  res.json({ clients });
});

router.post('/', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const data = clientSchema.parse(req.body);
    const result = db.prepare(
      'INSERT INTO clients (user_id, name, email, phone, type) VALUES (?, ?, ?, ?, ?)'
    ).run(req.userId, data.name, data.email || null, data.phone || null, data.type);
    const client = db.prepare('SELECT * FROM clients WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({ client });
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: error.issues[0].message });
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.delete('/:id', authMiddleware, (req: AuthRequest, res: Response) => {
  db.prepare('DELETE FROM clients WHERE id = ? AND user_id = ?').run(req.params.id, req.userId);
  res.json({ message: 'Supprimé' });
});

export default router;
