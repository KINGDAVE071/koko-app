import { Router, Response } from 'express';
import { z } from 'zod';
import pool from '../database';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

const medicationSchema = z.object({
  name: z.string().min(2, 'Le nom est requis (min. 2 caractères)'),
  dosage: z.string().optional(),
  frequency: z.enum(['daily', 'twice_daily', 'three_times_daily', 'weekly', 'custom']),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date invalide (YYYY-MM-DD)'),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  times: z.array(z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Heure invalide (HH:MM)')).min(1, 'Au moins une heure de prise est requise'),
});

// Créer un médicament
router.post('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  const client = await pool.connect();
  try {
    const data = medicationSchema.parse(req.body);

    await client.query('BEGIN');
    const medResult = await client.query(
      `INSERT INTO medications (user_id, name, dosage, frequency, start_date, end_date)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [req.userId, data.name, data.dosage || null, data.frequency, data.start_date, data.end_date || null]
    );
    const medId = medResult.rows[0].id;

    for (const time of data.times) {
      await client.query('INSERT INTO medication_times (medication_id, time) VALUES ($1,$2)', [medId, time]);
    }

    await client.query('COMMIT');

    const timesResult = await client.query('SELECT time FROM medication_times WHERE medication_id = $1 ORDER BY time', [medId]);
    res.status(201).json({
      medication: { ...medResult.rows[0], times: timesResult.rows.map((t: any) => t.time) },
    });
  } catch (error) {
    await client.query('ROLLBACK');
    if (error instanceof z.ZodError) return res.status(400).json({ error: error.issues[0].message });
    res.status(500).json({ error: 'Erreur serveur lors de la création' });
  } finally {
    client.release();
  }
});

// Lister les médicaments
router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const medications = await pool.query(
      'SELECT * FROM medications WHERE user_id = $1 AND active = 1 ORDER BY created_at DESC',
      [req.userId]
    );
    const result = [];
    for (const med of medications.rows) {
      const times = await pool.query('SELECT time FROM medication_times WHERE medication_id = $1 ORDER BY time', [med.id]);
      const logs = await pool.query('SELECT time, taken FROM medication_logs WHERE medication_id = $1 AND date = $2', [med.id, today]);
      const logsMap: Record<string, boolean> = {};
      logs.rows.forEach((l: any) => { logsMap[l.time] = l.taken; });
      result.push({ ...med, times: times.rows.map((t: any) => t.time), logs: logsMap });
    }
    res.json({ medications: result });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur lors de la récupération' });
  }
});

// Marquer une prise
router.post('/:id/take', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { date, time } = req.body;
    const medId = req.params.id;
    const med = await pool.query('SELECT * FROM medications WHERE id = $1 AND user_id = $2', [medId, req.userId]);
    if (med.rows.length === 0) return res.status(404).json({ error: 'Médicament non trouvé' });

    await pool.query(
      `INSERT INTO medication_logs (medication_id, date, time, taken)
       VALUES ($1, $2, $3, true)
       ON CONFLICT (medication_id, date, time) DO UPDATE SET taken = true`,
      [medId, date, time]
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur lors de la prise' });
  }
});

// Désactiver un médicament
router.delete('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    await pool.query('UPDATE medications SET active = 0 WHERE id = $1 AND user_id = $2', [req.params.id, req.userId]);
    res.json({ message: 'Médicament désactivé' });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur lors de la suppression' });
  }
});

export default router;
