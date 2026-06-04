import { Router, Response } from 'express';
import { z } from 'zod';
import pool from '../database';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

const medicationSchema = z.object({
  name: z.string().min(2),
  dosage: z.string().optional(),
  frequency: z.enum(['daily','twice_daily','three_times_daily','weekly','custom']),
  time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  custom_days: z.array(z.number().min(0).max(6)).optional(),
});

router.post('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const data = medicationSchema.parse(req.body);
    const result = await pool.query(
      `INSERT INTO medications (user_id, name, dosage, frequency, time, start_date, end_date)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [req.userId, data.name, data.dosage || null, data.frequency, data.time, data.start_date, data.end_date || null]
    );
    res.status(201).json({ medication: result.rows[0] });
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: error.issues[0].message });
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  const result = await pool.query('SELECT * FROM medications WHERE user_id = $1 AND active = 1 ORDER BY time ASC', [req.userId]);
  res.json({ medications: result.rows });
});

router.delete('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  await pool.query('UPDATE medications SET active = 0 WHERE id = $1 AND user_id = $2', [req.params.id, req.userId]);
  res.json({ message: 'Médicament désactivé' });
});

export default router;
