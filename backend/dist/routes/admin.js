"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const database_1 = __importDefault(require("../database"));
const auth_1 = require("../middleware/auth");
const admin_1 = require("../middleware/admin");
const router = (0, express_1.Router)();
router.use(auth_1.authMiddleware, admin_1.adminMiddleware);
router.get('/users', async (req, res) => {
    const result = await database_1.default.query('SELECT id, email, name, language, role, created_at FROM users ORDER BY created_at DESC');
    res.json({ users: result.rows });
});
router.put('/users/:id/premium', async (req, res) => {
    const userId = req.params.id;
    const { premium } = req.body;
    if (premium) {
        await database_1.default.query("UPDATE users SET premium_until = NOW() + INTERVAL '30 days' WHERE id = $1", [userId]);
    }
    else {
        await database_1.default.query('UPDATE users SET premium_until = NULL WHERE id = $1', [userId]);
    }
    res.json({ message: 'Statut premium mis à jour' });
});
router.delete('/users/:id', async (req, res) => {
    const userId = parseInt(req.params.id);
    if (userId === req.userId)
        return res.status(400).json({ error: 'Vous ne pouvez pas supprimer votre propre compte' });
    await database_1.default.query('DELETE FROM users WHERE id = $1', [userId]);
    res.json({ message: 'Utilisateur supprimé' });
});
router.get('/stats', async (req, res) => {
    const total = await database_1.default.query('SELECT COUNT(*)::int AS count FROM users');
    const premium = await database_1.default.query("SELECT COUNT(*)::int AS count FROM users WHERE premium_until > NOW()");
    res.json({ totalUsers: total.rows[0].count, premiumUsers: premium.rows[0].count });
});
exports.default = router;
//# sourceMappingURL=admin.js.map