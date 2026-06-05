import { Router, Response } from 'express';
import { z } from 'zod';
import pool from '../database';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

const invoiceItemSchema = z.object({
  description: z.string().optional(),
  quantity: z.number().positive({ message: 'La quantité doit être un nombre positif' }),
  unit_price: z.number().positive({ message: 'Le prix unitaire doit être un nombre positif' }),
  tva: z.number().min(0).optional().default(0),
});

const invoiceSchema = z.object({
  client_name: z.string().optional(),
  type: z.enum(['facture', 'devis', 'avoir']).default('facture'),
  date: z.string({ required_error: 'La date est requise' }),
  due_date: z.string().optional(),
  discount: z.number().min(0).optional().default(0),
  notes: z.string().optional(),
  items: z.array(invoiceItemSchema).min(1, { message: 'Au moins un article est requis' }),
});

router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(
      'SELECT * FROM invoices WHERE user_id = $1 ORDER BY created_at DESC',
      [req.userId]
    );
    res.json({ invoices: result.rows });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur lors de la récupération des factures' });
  }
});

router.get('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const invoice = await pool.query(
      'SELECT * FROM invoices WHERE id = $1 AND user_id = $2',
      [req.params.id, req.userId]
    );
    if (invoice.rows.length === 0) return res.status(404).json({ error: 'Facture non trouvée' });
    const items = await pool.query(
      'SELECT * FROM invoice_items WHERE invoice_id = $1',
      [req.params.id]
    );
    res.json({ invoice: invoice.rows[0], items: items.rows });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.post('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  const client = await pool.connect();
  try {
    const data = invoiceSchema.parse(req.body);

    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const prefix = `FACT-${year}${month}`;
    const count = await client.query(
      'SELECT COUNT(*)::int + 1 AS next FROM invoices WHERE user_id = $1 AND number LIKE $2',
      [req.userId, `${prefix}%`]
    );
    const num = String(count.rows[0].next).padStart(3, '0');
    const number = `${prefix}-${num}`;

    let totalHT = 0, totalTTC = 0;
    for (const item of data.items) {
      const lineHT = item.quantity * item.unit_price;
      const lineTTC = lineHT * (1 + item.tva / 100);
      totalHT += lineHT;
      totalTTC += lineTTC;
    }
    totalTTC -= data.discount;

    await client.query('BEGIN');

    const invoiceResult = await client.query(
      `INSERT INTO invoices (user_id, client_name, type, number, date, due_date, total_ht, total_ttc, discount, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [
        req.userId,
        data.client_name || null,
        data.type,
        number,
        data.date,
        data.due_date || null,
        Math.round(totalHT * 100) / 100,
        Math.round(totalTTC * 100) / 100,
        data.discount,
        data.notes || null,
      ]
    );
    const invoiceId = invoiceResult.rows[0].id;

    for (const item of data.items) {
      await client.query(
        `INSERT INTO invoice_items (invoice_id, description, quantity, unit_price, tva)
         VALUES ($1,$2,$3,$4,$5)`,
        [invoiceId, item.description || '', item.quantity, item.unit_price, item.tva]
      );
    }

    await client.query('COMMIT');
    res.status(201).json({ invoice: invoiceResult.rows[0] });
  } catch (error) {
    await client.query('ROLLBACK');
    if (error instanceof z.ZodError) {
      // Renvoie la première erreur de validation
      return res.status(400).json({ error: error.issues[0].message });
    }
    res.status(500).json({ error: 'Erreur serveur lors de la création de la facture' });
  } finally {
    client.release();
  }
});

router.put('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { status } = req.body;
    if (!['pending', 'paid', 'cancelled'].includes(status)) {
      return res.status(400).json({ error: 'Statut invalide' });
    }
    const result = await pool.query(
      'UPDATE invoices SET status = $1 WHERE id = $2 AND user_id = $3 RETURNING *',
      [status, req.params.id, req.userId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Facture non trouvée' });
    res.json({ invoice: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.delete('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(
      'DELETE FROM invoices WHERE id = $1 AND user_id = $2 RETURNING id',
      [req.params.id, req.userId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Facture non trouvée' });
    res.json({ message: 'Facture supprimée' });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

export default router;
