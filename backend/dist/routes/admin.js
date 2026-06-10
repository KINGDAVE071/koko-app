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
// Liste des utilisateurs
router.get('/users', async (req, res) => {
    const result = await database_1.default.query('SELECT id, email, name, language, role, created_at FROM users ORDER BY created_at DESC');
    res.json({ users: result.rows });
});
// Premium
router.put('/users/:id/premium', async (req, res) => {
    const { premium } = req.body;
    if (premium) {
        await database_1.default.query("UPDATE users SET premium_until = NOW() + INTERVAL '30 days' WHERE id = $1", [req.params.id]);
    }
    else {
        await database_1.default.query('UPDATE users SET premium_until = NULL WHERE id = $1', [req.params.id]);
    }
    res.json({ message: 'Statut premium mis à jour' });
});
// Supprimer un utilisateur
router.delete('/users/:id', async (req, res) => {
    const userId = parseInt(req.params.id);
    if (userId === req.userId)
        return res.status(400).json({ error: 'Vous ne pouvez pas supprimer votre propre compte' });
    await database_1.default.query('DELETE FROM users WHERE id = $1', [userId]);
    res.json({ message: 'Utilisateur supprimé' });
});
// Stats
router.get('/stats', async (req, res) => {
    const total = await database_1.default.query('SELECT COUNT(*)::int AS count FROM users');
    const premium = await database_1.default.query("SELECT COUNT(*)::int AS count FROM users WHERE premium_until > NOW()");
    res.json({ totalUsers: total.rows[0].count, premiumUsers: premium.rows[0].count });
});
// Création des nouvelles tables (si manquantes)
router.post('/create-medication-tables', async (req, res) => {
    try {
        await database_1.default.query(`
      CREATE TABLE IF NOT EXISTS medication_times (
        id SERIAL PRIMARY KEY,
        medication_id INTEGER NOT NULL REFERENCES medications(id) ON DELETE CASCADE,
        time TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS medication_logs (
        id SERIAL PRIMARY KEY,
        medication_id INTEGER NOT NULL REFERENCES medications(id) ON DELETE CASCADE,
        date TEXT NOT NULL,
        time TEXT NOT NULL,
        taken BOOLEAN DEFAULT false,
        UNIQUE(medication_id, date, time)
      );
    `);
        res.json({ message: 'Tables créées avec succès' });
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
});
exports.default = router;
// Route pour supprimer la colonne "time" obsolète
router.post('/fix-medications-table', async (req, res) => {
    try {
        await database_1.default.query('ALTER TABLE medications DROP COLUMN IF EXISTS time');
        res.json({ message: 'Colonne time supprimée avec succès' });
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
});
// Réinitialisation complète du pilulier
router.post('/reset-medications', async (req, res) => {
    try {
        await database_1.default.query('DROP TABLE IF EXISTS medication_logs CASCADE');
        await database_1.default.query('DROP TABLE IF EXISTS medication_times CASCADE');
        await database_1.default.query('DROP TABLE IF EXISTS medications CASCADE');
        await database_1.default.query(`
      CREATE TABLE medications (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        dosage TEXT,
        frequency TEXT NOT NULL,
        start_date TEXT NOT NULL,
        end_date TEXT,
        active INTEGER DEFAULT 1,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE medication_times (
        id SERIAL PRIMARY KEY,
        medication_id INTEGER NOT NULL REFERENCES medications(id) ON DELETE CASCADE,
        time TEXT NOT NULL
      );

      CREATE TABLE medication_logs (
        id SERIAL PRIMARY KEY,
        medication_id INTEGER NOT NULL REFERENCES medications(id) ON DELETE CASCADE,
        date TEXT NOT NULL,
        time TEXT NOT NULL,
        taken BOOLEAN DEFAULT false,
        UNIQUE(medication_id, date, time)
      );
    `);
        res.json({ message: 'Tables du pilulier réinitialisées avec succès' });
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
});
//# sourceMappingURL=admin.js.map