import { Router, Response } from 'express';
import { z } from 'zod';
import db from '../database';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

const productSchema = z.object({
  name: z.string().min(1),
  price: z.number().positive(),
  unit: z.string().optional(),
  stock: z.number().optional(),
  tva: z.number().min(0).max(100).optional(),
});

router.get('/', authMiddleware, (req: AuthRequest, res: Response) => {
  const products = db.prepare('SELECT * FROM products WHERE user_id = ? ORDER BY name').all(req.userId);
  res.json({ products });
});

router.post('/', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const data = productSchema.parse(req.body);
    const result = db.prepare(
      'INSERT INTO products (user_id, name, price, unit, stock, tva) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(req.userId, data.name, data.price, data.unit || 'pièce', data.stock || 0, data.tva || 0);
    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({ product });
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: error.issues[0].message });
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.delete('/:id', authMiddleware, (req: AuthRequest, res: Response) => {
  db.prepare('DELETE FROM products WHERE id = ? AND user_id = ?').run(req.params.id, req.userId);
  res.json({ message: 'Produit supprimé' });
});

export default router;
