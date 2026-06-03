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
router.get('/users', (_req, res) => {
    const users = database_1.default.prepare('SELECT id, email, name, language, role, created_at FROM users ORDER BY created_at DESC').all();
    res.json({ users });
});
router.put('/users/:id/premium', (req, res) => {
    const userId = req.params.id;
    const { premium } = req.body;
    const user = database_1.default.prepare('SELECT * FROM users WHERE id = ?').get(userId);
    if (!user)
        return res.status(404).json({ error: 'Utilisateur non trouvé' });
    if (premium) {
        const newDate = new Date();
        newDate.setDate(newDate.getDate() + 30);
        database_1.default.prepare('UPDATE users SET premium_until = ? WHERE id = ?').run(newDate.toISOString(), userId);
    }
    else {
        database_1.default.prepare('UPDATE users SET premium_until = NULL WHERE id = ?').run(userId);
    }
    res.json({ message: 'Statut premium mis à jour' });
});
router.delete('/users/:id', (req, res) => {
    const userId = req.params.id;
    const user = database_1.default.prepare('SELECT * FROM users WHERE id = ?').get(userId);
    if (!user)
        return res.status(404).json({ error: 'Utilisateur non trouvé' });
    if (parseInt(userId) === req.userId) {
        return res.status(400).json({ error: 'Vous ne pouvez pas supprimer votre propre compte' });
    }
    database_1.default.prepare('DELETE FROM users WHERE id = ?').run(userId);
    res.json({ message: 'Utilisateur supprimé' });
});
router.get('/stats', (_req, res) => {
    const totalUsers = database_1.default.prepare('SELECT COUNT(*) as count FROM users').get().count;
    const premiumUsers = database_1.default.prepare("SELECT COUNT(*) as count FROM users WHERE premium_until > datetime('now')").get().count;
    res.json({ totalUsers, premiumUsers });
});
exports.default = router;
//# sourceMappingURL=admin.js.map