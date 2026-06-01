import { Router, Response } from 'express';
import { z } from 'zod';
import db from '../database';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

const medicationSchema = z.object({
  name: z.string().min(2, 'Nom du médicament requis'),
  dosage: z.string().optional(),
  frequency: z.enum(['daily', 'twice_daily', 'three_times_daily', 'weekly', 'custom']),
  time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Format HH:MM requis'),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format YYYY-MM-DD requis'),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  custom_days: z.array(z.number().min(0).max(6)).optional(),
});

router.post('/', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const data = medicationSchema.parse(req.body);
    const result = db.prepare(`
      INSERT INTO medications (user_id, name, dosage, frequency, time, start_date, end_date)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      req.userId,
      data.name,
      data.dosage || null,
      data.frequency,
      data.time,
      data.start_date,
      data.end_date || null
    );
    const medication = db.prepare('SELECT * FROM medications WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({ medication });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.issues[0].message });
    }
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.get('/', authMiddleware, (req: AuthRequest, res: Response) => {
  const medications = db.prepare(
    'SELECT * FROM medications WHERE user_id = ? AND active = 1 ORDER BY time ASC'
  ).all(req.userId);
  res.json({ medications });
});

router.get('/next', authMiddleware, (req: AuthRequest, res: Response) => {
  const now = new Date();
  const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  const next = db.prepare(`
    SELECT * FROM medications 
    WHERE user_id = ? 
    AND active = 1 
    AND time > ? 
    ORDER BY time ASC 
    LIMIT 1
  `).get(req.userId, currentTime);
  if (!next) {
    const tomorrow = db.prepare(`
      SELECT * FROM medications 
      WHERE user_id = ? 
      AND active = 1 
      ORDER BY time ASC 
      LIMIT 1
    `).get(req.userId);
    return res.json({
      medication: tomorrow || null,
      message: tomorrow ? 'Demain' : 'Aucun médicament programmé',
    });
  }
  res.json({
    medication: next,
    message: `Aujourd'hui à ${(next as any).time}`,
  });
});

router.delete('/:id', authMiddleware, (req: AuthRequest, res: Response) => {
  const medication = db.prepare(
    'SELECT * FROM medications WHERE id = ? AND user_id = ?'
  ).get(req.params.id, req.userId);
  if (!medication) {
    return res.status(404).json({ error: 'Médicament non trouvé' });
  }
  db.prepare('UPDATE medications SET active = 0 WHERE id = ?').run(req.params.id);
  res.json({ message: 'Médicament désactivé' });
});

router.get('/history', authMiddleware, (req: AuthRequest, res: Response) => {
  const medications = db.prepare(`
    SELECT * FROM medications 
    WHERE user_id = ? 
    ORDER BY created_at DESC
  `).all(req.userId);
  res.json({
    total: medications.length,
    active: (medications as any[]).filter((m: any) => m.active === 1).length,
    medications,
    premium_feature: "L'historique détaillé et l'export PDF sont disponibles en version premium",
  });
});

export default router;
