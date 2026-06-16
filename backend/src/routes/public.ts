import { Router, Request, Response } from 'express';
import pool from '../database';

const router = Router();

// GET /api/public/settings – accessible sans authentification
router.get('/settings', async (_req: Request, res: Response) => {
  try {
    const result = await pool.query('SELECT key, value FROM settings');
    const settings: Record<string, string> = {};
    result.rows.forEach((row: any) => settings[row.key] = row.value);
    res.json(settings);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
