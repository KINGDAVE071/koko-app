import { Router, Response } from 'express';
import db from '../database';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { adminMiddleware } from '../middleware/admin';

const router = Router();

router.use(authMiddleware, adminMiddleware);

router.get('/users', (req: AuthRequest, res: Response) => {
  const users = db.prepare(
    'SELECT id, email, name, language, role, created_at FROM users ORDER BY created_at DESC'
  ).all();
  res.json({ users });
});

router.put('/users/:id/premium', (req: AuthRequest, res: Response) => {
  const userId = req.params.id;
  const { premium } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  if (!user) return res.status(404).json({ error: 'Utilisateur non trouvé' });
  if (premium) {
    const newDate = new Date();
    newDate.setDate(newDate.getDate() + 30);
    db.prepare('UPDATE users SET premium_until = ? WHERE id = ?').run(newDate.toISOString(), userId);
  } else {
    db.prepare('UPDATE users SET premium_until = NULL WHERE id = ?').run(userId);
  }
  res.json({ message: 'Statut premium mis à jour' });
});

router.delete('/users/:id', (req: AuthRequest, res: Response) => {
  const userId = req.params.id;
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  if (!user) return res.status(404).json({ error: 'Utilisateur non trouvé' });
  if (parseInt(userId) === req.userId) {
    return res.status(400).json({ error: 'Vous ne pouvez pas supprimer votre propre compte' });
  }
  db.prepare('DELETE FROM users WHERE id = ?').run(userId);
  res.json({ message: 'Utilisateur supprimé' });
});

router.get('/stats', (req: AuthRequest, res: Response) => {
  const totalUsers = (db.prepare('SELECT COUNT(*) as count FROM users').get() as any).count;
  const premiumUsers = (db.prepare("SELECT COUNT(*) as count FROM users WHERE premium_until > datetime('now')").get() as any).count;
  res.json({ totalUsers, premiumUsers });
});

export default router;
