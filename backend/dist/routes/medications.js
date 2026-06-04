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
    name: zod_1.z.string().min(2),
    dosage: zod_1.z.string().optional(),
    frequency: zod_1.z.enum(['daily', 'twice_daily', 'three_times_daily', 'weekly', 'custom']),
    time: zod_1.z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/),
    start_date: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    end_date: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    custom_days: zod_1.z.array(zod_1.z.number().min(0).max(6)).optional(),
});
router.post('/', auth_1.authMiddleware, async (req, res) => {
    try {
        const data = medicationSchema.parse(req.body);
        const result = await database_1.default.query(`INSERT INTO medications (user_id, name, dosage, frequency, time, start_date, end_date)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`, [req.userId, data.name, data.dosage || null, data.frequency, data.time, data.start_date, data.end_date || null]);
        res.status(201).json({ medication: result.rows[0] });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError)
            return res.status(400).json({ error: error.issues[0].message });
        res.status(500).json({ error: 'Erreur serveur' });
    }
});
router.get('/', auth_1.authMiddleware, async (req, res) => {
    const result = await database_1.default.query('SELECT * FROM medications WHERE user_id = $1 AND active = 1 ORDER BY time ASC', [req.userId]);
    res.json({ medications: result.rows });
});
router.delete('/:id', auth_1.authMiddleware, async (req, res) => {
    await database_1.default.query('UPDATE medications SET active = 0 WHERE id = $1 AND user_id = $2', [req.params.id, req.userId]);
    res.json({ message: 'Médicament désactivé' });
});
exports.default = router;
//# sourceMappingURL=medications.js.map