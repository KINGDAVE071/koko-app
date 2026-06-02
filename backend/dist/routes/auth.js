"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const zod_1 = require("zod");
const database_1 = __importDefault(require("../database"));
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Schéma de mot de passe fort : 8+ car., au moins une majuscule, une minuscule, un chiffre, un symbole
const passwordSchema = zod_1.z.string()
    .min(8, 'Le mot de passe doit contenir au moins 8 caractères')
    .regex(/[A-Z]/, 'Le mot de passe doit contenir au moins une majuscule')
    .regex(/[a-z]/, 'Le mot de passe doit contenir au moins une minuscule')
    .regex(/[0-9]/, 'Le mot de passe doit contenir au moins un chiffre')
    .regex(/[@$!%*?&]/, 'Le mot de passe doit contenir au moins un symbole (@$!%*?&)');
const registerSchema = zod_1.z.object({
    email: zod_1.z.string().email('Email invalide'),
    password: passwordSchema,
    name: zod_1.z.string().min(2, 'Nom trop court'),
    language: zod_1.z.string().optional(),
});
const loginSchema = zod_1.z.object({
    email: zod_1.z.string().email('Email invalide'),
    password: zod_1.z.string(),
});
const JWT_SECRET = process.env.JWT_SECRET || 'koko_production_secret_change_me';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
// Inscription
router.post('/register', async (req, res) => {
    try {
        const data = registerSchema.parse(req.body);
        const existing = database_1.default.prepare('SELECT id FROM users WHERE email = ?').get(data.email);
        if (existing) {
            return res.status(400).json({ error: 'Cet email est déjà utilisé' });
        }
        const passwordHash = await bcryptjs_1.default.hash(data.password, 12);
        const result = database_1.default.prepare('INSERT INTO users (email, pin_hash, name, language) VALUES (?, ?, ?, ?)').run(data.email, passwordHash, data.name, data.language || 'fr');
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
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({ error: error.issues[0].message });
        }
        res.status(500).json({ error: 'Erreur serveur' });
    }
});
// Connexion
router.post('/login', async (req, res) => {
    try {
        const data = loginSchema.parse(req.body);
        const user = database_1.default.prepare('SELECT * FROM users WHERE email = ?').get(data.email);
        if (!user) {
            return res.status(400).json({ error: 'Email ou mot de passe incorrect' });
        }
        const validPassword = await bcryptjs_1.default.compare(data.password, user.pin_hash);
        if (!validPassword) {
            return res.status(400).json({ error: 'Email ou mot de passe incorrect' });
        }
        const token = jsonwebtoken_1.default.sign({ id: user.id }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
        res.json({
            token,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                language: user.language,
            },
        });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({ error: error.issues[0].message });
        }
        res.status(500).json({ error: 'Erreur serveur' });
    }
});
// Profil
router.get('/me', auth_1.authMiddleware, (req, res) => {
    const user = database_1.default.prepare('SELECT id, email, name, language, created_at FROM users WHERE id = ?').get(req.userId);
    if (!user) {
        return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }
    res.json({ user });
});
exports.default = router;
//# sourceMappingURL=auth.js.map