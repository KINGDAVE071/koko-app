import { Router, Request, Response } from 'express';
import { z } from 'zod';
import db from '../database';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

const receiptSchema = z.object({
  type: z.enum(['location', 'vente', 'pret', 'service', 'autre'], {
    message: 'Type invalide (location, vente, pret, service, autre)',
  }),
  from_name: z.string().min(2, 'Nom de la personne qui paie requis'),
  to_name: z.string().min(2, 'Nom du bénéficiaire requis'),
  amount: z.number().positive('Montant positif requis'),
  currency: z.string().length(3, 'Code devise sur 3 lettres').toUpperCase(),
  description: z.string().optional(),
  location: z.string().optional(),
  signature_from: z.string().optional(),
  signature_to: z.string().optional(),
});

// Créer une quittance
router.post('/', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const data = receiptSchema.parse(req.body);

    const result = db.prepare(`
      INSERT INTO receipts (user_id, type, from_name, to_name, amount, currency, description, location, signature_from, signature_to)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      req.userId,
      data.type,
      data.from_name,
      data.to_name,
      data.amount,
      data.currency,
      data.description || null,
      data.location || null,
      data.signature_from || null,
      data.signature_to || null
    );

    const receipt = db.prepare('SELECT * FROM receipts WHERE id = ?').get(result.lastInsertRowid);

    res.status(201).json({ receipt });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.issues[0].message });
    }
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Lister ses quittances
router.get('/', authMiddleware, (req: AuthRequest, res: Response) => {
  const receipts = db.prepare(
    'SELECT * FROM receipts WHERE user_id = ? ORDER BY created_at DESC'
  ).all(req.userId);

  res.json({ receipts });
});

// Détail d'une quittance
router.get('/:id', authMiddleware, (req: AuthRequest, res: Response) => {
  const receipt = db.prepare(
    'SELECT * FROM receipts WHERE id = ? AND user_id = ?'
  ).get(req.params.id, req.userId);

  if (!receipt) {
    return res.status(404).json({ error: 'Quittance non trouvée' });
  }

  res.json({ receipt });
});

// Supprimer une quittance
router.delete('/:id', authMiddleware, (req: AuthRequest, res: Response) => {
  const receipt = db.prepare(
    'SELECT * FROM receipts WHERE id = ? AND user_id = ?'
  ).get(req.params.id, req.userId);

  if (!receipt) {
    return res.status(404).json({ error: 'Quittance non trouvée' });
  }

  db.prepare('DELETE FROM receipts WHERE id = ?').run(req.params.id);
  res.json({ message: 'Quittance supprimée' });
});

export default router;
