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
// Validation
const registerSchema = zod_1.z.object({
    email: zod_1.z.string().email('Email invalide'),
    pin: zod_1.z.string().min(6, 'PIN : 6 chiffres minimum').max(6),
    name: zod_1.z.string().min(2, 'Nom trop court'),
    language: zod_1.z.string().optional(),
});
const loginSchema = zod_1.z.object({
    email: zod_1.z.string().email('Email invalide'),
    pin: zod_1.z.string().min(6),
});
const JWT_SECRET = process.env.JWT_SECRET || 'koko_secret_2026_change_me_later';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
// Inscription
router.post('/register', async (req, res) => {
    try {
        const data = registerSchema.parse(req.body);
        const existing = database_1.default.prepare('SELECT id FROM users WHERE email = ?').get(data.email);
        if (existing) {
            return res.status(400).json({ error: 'Cet email est déjà utilisé' });
        }
        const pinHash = await bcryptjs_1.default.hash(data.pin, 12);
        const result = database_1.default.prepare('INSERT INTO users (email, pin_hash, name, language) VALUES (?, ?, ?, ?)').run(data.email, pinHash, data.name, data.language || 'fr');
        const token = jsonwebtoken_1.default.sign({ id: result.lastInsertRowid }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
        res.status(201).json({
            token,
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
            return res.status(400).json({ error: 'Email ou PIN incorrect' });
        }
        const validPin = await bcryptjs_1.default.compare(data.pin, user.pin_hash);
        if (!validPin) {
            return res.status(400).json({ error: 'Email ou PIN incorrect' });
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