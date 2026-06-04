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
router.post('/register', async (req, res) => {
    try {
        const data = registerSchema.parse(req.body);
        const exists = await database_1.default.query('SELECT id FROM users WHERE email = $1', [data.email]);
        if (exists.rows.length > 0)
            return res.status(400).json({ error: 'Cet email est déjà utilisé' });
        const hash = await bcryptjs_1.default.hash(data.password, 12);
        const result = await database_1.default.query('INSERT INTO users (email, pin_hash, name, language) VALUES ($1,$2,$3,$4) RETURNING id', [data.email, hash, data.name, data.language || 'fr']);
        res.status(201).json({
            message: 'Compte créé avec succès',
            user: { id: result.rows[0].id, email: data.email, name: data.name, language: data.language || 'fr', role: 'user' }
        });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError)
            return res.status(400).json({ error: error.issues[0].message });
        res.status(500).json({ error: 'Erreur serveur' });
    }
});
router.post('/login', async (req, res) => {
    try {
        const data = loginSchema.parse(req.body);
        const result = await database_1.default.query('SELECT id, email, pin_hash, name, language, role FROM users WHERE email = $1', [data.email]);
        if (result.rows.length === 0)
            return res.status(400).json({ error: 'Email ou mot de passe incorrect' });
        const user = result.rows[0];
        const valid = await bcryptjs_1.default.compare(data.password, user.pin_hash);
        if (!valid)
            return res.status(400).json({ error: 'Email ou mot de passe incorrect' });
        const token = jsonwebtoken_1.default.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
        res.json({
            token,
            user: { id: user.id, email: user.email, name: user.name, language: user.language, role: user.role }
        });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError)
            return res.status(400).json({ error: error.issues[0].message });
        res.status(500).json({ error: 'Erreur serveur' });
    }
});
router.get('/me', auth_1.authMiddleware, async (req, res) => {
    try {
        const result = await database_1.default.query('SELECT id, email, name, language, role, created_at FROM users WHERE id = $1', [req.userId]);
        if (result.rows.length === 0)
            return res.status(404).json({ error: 'Utilisateur non trouvé' });
        res.json({ user: result.rows[0] });
    }
    catch (error) {
        res.status(500).json({ error: 'Erreur serveur' });
    }
});
exports.default = router;
//# sourceMappingURL=auth.js.map