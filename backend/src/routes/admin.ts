import { Router, Response } from 'express';
import pool from '../database';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { adminMiddleware } from '../middleware/admin';

const router = Router();
router.use(authMiddleware, adminMiddleware);

// Helper pour journaliser les actions
async function logAction(adminId: number, action: string, targetType?: string, targetId?: number, details?: string) {
  await pool.query(
    `INSERT INTO audit_logs (admin_id, action, target_type, target_id, details) VALUES ($1,$2,$3,$4,$5)`,
    [adminId, action, targetType || null, targetId || null, details || null]
  );
}

// ─── Statistiques globales ─────────────────────────────────────────────
router.get('/stats', async (_req: AuthRequest, res: Response) => {
  try {
    const total = await pool.query('SELECT COUNT(*)::int AS count FROM users');
    const premium = await pool.query("SELECT COUNT(*)::int AS count FROM users WHERE premium_until > NOW()");
    const sales = await pool.query("SELECT COUNT(*)::int AS count FROM receipts WHERE type = 'vente'");
    const revenue = await pool.query("SELECT COALESCE(SUM(amount),0) AS total FROM receipts WHERE type = 'vente'");
    const newToday = await pool.query("SELECT COUNT(*)::int AS count FROM users WHERE created_at::date = CURRENT_DATE");
    res.json({
      totalUsers: total.rows[0].count,
      premiumUsers: premium.rows[0].count,
      totalSales: sales.rows[0].count,
      revenue: parseFloat(revenue.rows[0].total),
      newToday: newToday.rows[0].count,
    });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// ─── Statistiques d'évolution (7 derniers jours) ──────────────────────
router.get('/stats/evolution', async (_req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT
        d::date AS day,
        COALESCE(u.cnt, 0) AS new_users,
        COALESCE(r.cnt, 0) AS sales,
        COALESCE(r.total, 0) AS revenue
      FROM generate_series(CURRENT_DATE - 6, CURRENT_DATE, '1 day') d
      LEFT JOIN (
        SELECT created_at::date AS day, COUNT(*) AS cnt FROM users GROUP BY day
      ) u ON u.day = d
      LEFT JOIN (
        SELECT created_at::date AS day, COUNT(*) AS cnt, SUM(amount) AS total
        FROM receipts WHERE type = 'vente' GROUP BY day
      ) r ON r.day = d
      ORDER BY d
    `);
    res.json(result.rows);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// ─── Liste des utilisateurs (recherche + pagination) ──────────────────
router.get('/users', async (req: AuthRequest, res: Response) => {
  try {
    const search = (req.query.search as string) || '';
    const page = parseInt(req.query.page as string) || 1;
    const limit = 20;
    const offset = (page - 1) * limit;

    const users = await pool.query(
      `SELECT id, email, name, role, language, premium_until, blocked, created_at
       FROM users
       WHERE email ILIKE $1 OR name ILIKE $1
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [`%${search}%`, limit, offset]
    );
    const total = await pool.query(
      `SELECT COUNT(*)::int AS count FROM users WHERE email ILIKE $1 OR name ILIKE $1`,
      [`%${search}%`]
    );

    res.json({
      users: users.rows,
      total: total.rows[0].count,
      page,
      pages: Math.ceil(total.rows[0].count / limit),
    });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// ─── Bloquer / débloquer un utilisateur ────────────────────────────────
router.put('/users/:id/block', async (req: AuthRequest, res: Response) => {
  try {
    const userId = parseInt(req.params.id);
    const { blocked } = req.body; // true ou false
    const user = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
    if (user.rows.length === 0) return res.status(404).json({ error: 'Utilisateur non trouvé' });

    await pool.query('UPDATE users SET blocked = $1 WHERE id = $2', [blocked, userId]);
    await logAction(req.userId!, blocked ? 'block_user' : 'unblock_user', 'user', userId);
    res.json({ message: blocked ? 'Utilisateur bloqué' : 'Utilisateur débloqué' });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// ─── Activer / désactiver le premium ───────────────────────────────────
router.put('/users/:id/premium', async (req: AuthRequest, res: Response) => {
  try {
    const userId = parseInt(req.params.id);
    const { premium } = req.body;
    if (premium) {
      await pool.query("UPDATE users SET premium_until = NOW() + INTERVAL '30 days' WHERE id = $1", [userId]);
    } else {
      await pool.query('UPDATE users SET premium_until = NULL WHERE id = $1', [userId]);
    }
    await logAction(req.userId!, premium ? 'enable_premium' : 'disable_premium', 'user', userId);
    res.json({ message: 'Statut premium mis à jour' });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// ─── Supprimer un utilisateur ──────────────────────────────────────────
router.delete('/users/:id', async (req: AuthRequest, res: Response) => {
  try {
    const userId = parseInt(req.params.id);
    if (userId === req.userId) return res.status(400).json({ error: 'Vous ne pouvez pas supprimer votre propre compte' });
    await pool.query('DELETE FROM users WHERE id = $1', [userId]);
    await logAction(req.userId!, 'delete_user', 'user', userId);
    res.json({ message: 'Utilisateur supprimé' });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// ─── Journal d'audit ───────────────────────────────────────────────────
router.get('/audit', async (_req: AuthRequest, res: Response) => {
  try {
    const logs = await pool.query(
      `SELECT a.*, u.name AS admin_name
       FROM audit_logs a
       JOIN users u ON u.id = a.admin_id
       ORDER BY a.created_at DESC
       LIMIT 50`
    );
    res.json({ logs: logs.rows });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
