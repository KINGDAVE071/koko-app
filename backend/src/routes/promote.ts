import { Router, Response } from 'express';
import db from '../database';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

router.post('/promote', authMiddleware, (req: AuthRequest, res: Response) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email requis' });
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as any;
  if (!user) return res.status(404).json({ error: 'Utilisateur non trouvé' });
  db.prepare("UPDATE users SET role = 'admin' WHERE email = ?").run(email);
  res.json({ message: `L'utilisateur ${email} est maintenant administrateur.` });
});

export default router;
