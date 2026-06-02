import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import db from '../database';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

// Schéma de mot de passe fort : 8+ car., au moins une majuscule, une minuscule, un chiffre, un symbole
const passwordSchema = z.string()
  .min(8, 'Le mot de passe doit contenir au moins 8 caractères')
  .regex(/[A-Z]/, 'Le mot de passe doit contenir au moins une majuscule')
  .regex(/[a-z]/, 'Le mot de passe doit contenir au moins une minuscule')
  .regex(/[0-9]/, 'Le mot de passe doit contenir au moins un chiffre')
  .regex(/[@$!%*?&]/, 'Le mot de passe doit contenir au moins un symbole (@$!%*?&)');

const registerSchema = z.object({
  email: z.string().email('Email invalide'),
  password: passwordSchema,
  name: z.string().min(2, 'Nom trop court'),
  language: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string(),
});

const JWT_SECRET: string = process.env.JWT_SECRET || 'koko_production_secret_change_me';
const JWT_EXPIRES_IN: string = process.env.JWT_EXPIRES_IN || '7d';

// Inscription
router.post('/register', async (req: Request, res: Response) => {
  try {
    const data = registerSchema.parse(req.body);

    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(data.email);
    if (existing) {
      return res.status(400).json({ error: 'Cet email est déjà utilisé' });
    }

    const passwordHash = await bcrypt.hash(data.password, 12);
    const result = db.prepare(
      'INSERT INTO users (email, pin_hash, name, language) VALUES (?, ?, ?, ?)'
    ).run(data.email, passwordHash, data.name, data.language || 'fr');

    // On ne connecte plus automatiquement l'utilisateur
    res.status(201).json({
      message: 'Compte créé avec succès',
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
      return res.status(400).json({ error: 'Email ou mot de passe incorrect' });
    }

    const validPassword = await bcrypt.compare(data.password, user.pin_hash);
    if (!validPassword) {
      return res.status(400).json({ error: 'Email ou mot de passe incorrect' });
    }

    const token = jwt.sign(
      { id: user.id },
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
