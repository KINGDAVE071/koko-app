import { Router, Response } from 'express';
import { z } from 'zod';
import pool from '../database';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

const productSchema = z.object({
  name: z.string().min(1, 'Nom requis'),
  price: z.number().min(0, 'Prix de vente ≥ 0'),
  cost_price: z.number().min(0).optional().default(0),
  stock: z.number().int().min(0).optional().default(0),
  min_stock: z.number().int().min(0).optional().default(0),
  tva: z.number().min(0).max(100).optional().default(0),
});

router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query('SELECT * FROM products WHERE user_id = $1 ORDER BY name', [req.userId]);
    res.json({ products: result.rows });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const data = productSchema.parse(req.body);
    const result = await pool.query(
      `INSERT INTO products (user_id, name, price, cost_price, stock, min_stock, tva)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [req.userId, data.name, data.price, data.cost_price, data.stock, data.min_stock, data.tva]
    );
    res.status(201).json({ product: result.rows[0] });
  } catch (error: any) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: error.issues[0].message });
    res.status(500).json({ error: error.message || 'Erreur serveur' });
  }
});

router.put('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const data = productSchema.parse(req.body);
    const result = await pool.query(
      `UPDATE products SET name=$1, price=$2, cost_price=$3, stock=$4, min_stock=$5, tva=$6
       WHERE id=$7 AND user_id=$8 RETURNING *`,
      [data.name, data.price, data.cost_price, data.stock, data.min_stock, data.tva, req.params.id, req.userId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Produit non trouvé' });
    res.json({ product: result.rows[0] });
  } catch (error: any) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: error.issues[0].message });
    res.status(500).json({ error: error.message || 'Erreur serveur' });
  }
});

router.delete('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    await pool.query('DELETE FROM products WHERE id=$1 AND user_id=$2', [req.params.id, req.userId]);
    res.json({ message: 'Produit supprimé' });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Erreur serveur' });
  }
});

export default router;
