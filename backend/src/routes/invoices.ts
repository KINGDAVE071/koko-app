import { Router, Response } from 'express';
import { z } from 'zod';
import pool from '../database';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

// Schéma de validation pour une ligne de facture
const itemSchema = z.object({
  product_id: z.number().optional(),
  description: z.string().optional(),
  quantity: z.number().positive(),
  unit_price: z.number().positive(),
  tva: z.number().min(0).max(100).optional().default(0),
});

// Schéma de création d'une facture
const invoiceSchema = z.object({
  client_id: z.number().optional(),
  client_name: z.string().optional(),
  type: z.enum(['devis', 'facture', 'avoir']).default('facture'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  due_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  discount: z.number().min(0).optional().default(0),
  notes: z.string().optional(),
  payment_terms: z.string().optional(),
  items: z.array(itemSchema).min(1, 'Au moins un article est requis'),
});

// GET /api/invoices – Liste des factures de l'utilisateur
router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(
      'SELECT * FROM invoices WHERE user_id = $1 ORDER BY created_at DESC',
      [req.userId]
    );
    res.json({ invoices: result.rows });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/invoices/:id – Détail d'une facture avec ses items
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

// POST /api/invoices – Créer une facture
router.post('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  const client = await pool.connect();
  try {
    const data = invoiceSchema.parse(req.body);

    // Calcul des totaux
    let totalHT = 0;
    let totalTTC = 0;
    for (const item of data.items) {
      const lineHT = item.quantity * item.unit_price;
      const lineTTC = lineHT * (1 + item.tva / 100);
      totalHT += lineHT;
      totalTTC += lineTTC;
    }
    // Appliquer la remise globale (en % ou valeur ? On suppose un montant)
    totalTTC -= data.discount;
    totalHT -= data.discount / (1 + (data.items[0]?.tva || 0) / 100); // approximation

    await client.query('BEGIN');

    // Générer un numéro de facture unique : FACT-YYYYMMDD-XXXX
    const dateStr = data.date.replace(/-/g, '');
    const countResult = await client.query(
      "SELECT COUNT(*)::int + 1 as next FROM invoices WHERE user_id = $1 AND date LIKE $2",
      [req.userId, data.date.substring(0,7) + '%']
    );
    const nextNum = countResult.rows[0].next;
    const number = `FACT-${dateStr}-${String(nextNum).padStart(4, '0')}`;

    const invoiceResult = await client.query(
      `INSERT INTO invoices (user_id, client_id, client_name, type, number, date, due_date, total_ht, total_ttc, discount, notes, payment_terms)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
      [
        req.userId,
        data.client_id || null,
        data.client_name || null,
        data.type,
        number,
        data.date,
        data.due_date || null,
        Math.round(totalHT * 100) / 100,
        Math.round(totalTTC * 100) / 100,
        data.discount,
        data.notes || null,
        data.payment_terms || null,
      ]
    );
    const invoiceId = invoiceResult.rows[0].id;

    // Insérer les items
    for (const item of data.items) {
      await client.query(
        `INSERT INTO invoice_items (invoice_id, product_id, description, quantity, unit_price, tva)
         VALUES ($1,$2,$3,$4,$5,$6)`,
        [invoiceId, item.product_id || null, item.description || '', item.quantity, item.unit_price, item.tva]
      );
    }

    await client.query('COMMIT');
    res.status(201).json({ invoice: invoiceResult.rows[0] });
  } catch (error) {
    await client.query('ROLLBACK');
    if (error instanceof z.ZodError) return res.status(400).json({ error: error.issues[0].message });
    res.status(500).json({ error: 'Erreur serveur' });
  } finally {
    client.release();
  }
});

// PUT /api/invoices/:id – Modifier le statut
router.put('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { status } = req.body;
    if (!['pending','paid','cancelled'].includes(status)) {
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

// DELETE /api/invoices/:id
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
