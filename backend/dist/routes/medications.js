"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const database_1 = __importDefault(require("../database"));
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
const medicationSchema = zod_1.z.object({
    name: zod_1.z.string().min(2, 'Nom du médicament requis'),
    dosage: zod_1.z.string().optional(),
    frequency: zod_1.z.enum(['daily', 'twice_daily', 'three_times_daily', 'weekly', 'custom']),
    time: zod_1.z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Format HH:MM requis'),
    start_date: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format YYYY-MM-DD requis'),
    end_date: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    custom_days: zod_1.z.array(zod_1.z.number().min(0).max(6)).optional(),
});
router.post('/', auth_1.authMiddleware, (req, res) => {
    try {
        const data = medicationSchema.parse(req.body);
        const result = database_1.default.prepare(`
      INSERT INTO medications (user_id, name, dosage, frequency, time, start_date, end_date)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(req.userId, data.name, data.dosage || null, data.frequency, data.time, data.start_date, data.end_date || null);
        const medication = database_1.default.prepare('SELECT * FROM medications WHERE id = ?').get(result.lastInsertRowid);
        res.status(201).json({ medication });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({ error: error.issues[0].message });
        }
        res.status(500).json({ error: 'Erreur serveur' });
    }
});
router.get('/', auth_1.authMiddleware, (req, res) => {
    const medications = database_1.default.prepare('SELECT * FROM medications WHERE user_id = ? AND active = 1 ORDER BY time ASC').all(req.userId);
    res.json({ medications });
});
router.get('/next', auth_1.authMiddleware, (req, res) => {
    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const next = database_1.default.prepare(`
    SELECT * FROM medications 
    WHERE user_id = ? 
    AND active = 1 
    AND time > ? 
    ORDER BY time ASC 
    LIMIT 1
  `).get(req.userId, currentTime);
    if (!next) {
        const tomorrow = database_1.default.prepare(`
      SELECT * FROM medications 
      WHERE user_id = ? 
      AND active = 1 
      ORDER BY time ASC 
      LIMIT 1
    `).get(req.userId);
        return res.json({
            medication: tomorrow || null,
            message: tomorrow ? 'Demain' : 'Aucun médicament programmé',
        });
    }
    res.json({
        medication: next,
        message: `Aujourd'hui à ${next.time}`,
    });
});
router.delete('/:id', auth_1.authMiddleware, (req, res) => {
    const medication = database_1.default.prepare('SELECT * FROM medications WHERE id = ? AND user_id = ?').get(req.params.id, req.userId);
    if (!medication) {
        return res.status(404).json({ error: 'Médicament non trouvé' });
    }
    database_1.default.prepare('UPDATE medications SET active = 0 WHERE id = ?').run(req.params.id);
    res.json({ message: 'Médicament désactivé' });
});
router.get('/history', auth_1.authMiddleware, (req, res) => {
    const medications = database_1.default.prepare(`
    SELECT * FROM medications 
    WHERE user_id = ? 
    ORDER BY created_at DESC
  `).all(req.userId);
    res.json({
        total: medications.length,
        active: medications.filter((m) => m.active === 1).length,
        medications,
        premium_feature: "L'historique détaillé et l'export PDF sont disponibles en version premium",
    });
});
exports.default = router;
//# sourceMappingURL=medications.js.map