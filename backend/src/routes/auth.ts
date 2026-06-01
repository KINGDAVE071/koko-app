import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import db from '../database';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

// Validation
const registerSchema = z.object({
  email: z.string().email('Email invalide'),
  pin: z.string().min(6, 'PIN : 6 chiffres minimum').max(6),
  name: z.string().min(2, 'Nom trop court'),
  language: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email('Email invalide'),
  pin: z.string().min(6),
});

const JWT_SECRET: string = process.env.JWT_SECRET || 'koko_secret_2026_change_me_later';
const JWT_EXPIRES_IN: string = process.env.JWT_EXPIRES_IN || '7d';

// Inscription
router.post('/register', async (req: Request, res: Response) => {
  try {
    const data = registerSchema.parse(req.body);

    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(data.email);
    if (existing) {
      return res.status(400).json({ error: 'Cet email est déjà utilisé' });
    }

    const pinHash = await bcrypt.hash(data.pin, 12);
    const result = db.prepare(
      'INSERT INTO users (email, pin_hash, name, language) VALUES (?, ?, ?, ?)'
    ).run(data.email, pinHash, data.name, data.language || 'fr');

    const token = jwt.sign(
      { id: result.lastInsertRowid as number },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN as any }
    );

    res.status(201).json({
      token,
      user: {
        id: result.lastInsertRowid,
        email: data.email,
        name: data.name,
        language: data.language || 'fr',
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.issues[0].message });
    }
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Connexion
router.post('/login', async (req: Request, res: Response) => {
  try {
    const data = loginSchema.parse(req.body);

    const user: any = db.prepare('SELECT * FROM users WHERE email = ?').get(data.email);
    if (!user) {
      return res.status(400).json({ error: 'Email ou PIN incorrect' });
    }

    const validPin = await bcrypt.compare(data.pin, user.pin_hash);
    if (!validPin) {
      return res.status(400).json({ error: 'Email ou PIN incorrect' });
    }

    const token = jwt.sign(
      { id: user.id as number },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN as any }
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        language: user.language,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.issues[0].message });
    }
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Profil
router.get('/me', authMiddleware, (req: AuthRequest, res: Response) => {
  const user: any = db.prepare(
    'SELECT id, email, name, language, created_at FROM users WHERE id = ?'
  ).get(req.userId);

  if (!user) {
    return res.status(404).json({ error: 'Utilisateur non trouvé' });
  }

  res.json({ user });
});

export default router;
