import { Router, Response } from 'express';
import { z } from 'zod';
import pool from '../database';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();
const productSchema = z.object({
  name: z.string().min(1),
  price: z.number().positive(),
  unit: z.string().optional(),
  stock: z.number().optional(),
  tva: z.number().min(0).max(100).optional(),
});

router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  const result = await pool.query('SELECT * FROM products WHERE user_id = $1 ORDER BY name', [req.userId]);
  res.json({ products: result.rows });
});

router.post('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const data = productSchema.parse(req.body);
    const result = await pool.query(
      'INSERT INTO products (user_id, name, price, unit, stock, tva) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',
      [req.userId, data.name, data.price, data.unit || 'pièce', data.stock || 0, data.tva || 0]
    );
    res.status(201).json({ product: result.rows[0] });
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: error.issues[0].message });
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.delete('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  await pool.query('DELETE FROM products WHERE id = $1 AND user_id = $2', [req.params.id, req.userId]);
  res.json({ message: 'Produit supprimé' });
});

export default router;
