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
// Validation : exactement ce que le frontend va envoyer
const medicationSchema = zod_1.z.object({
    name: zod_1.z.string().min(2, 'Le nom est requis (min. 2 caractères)'),
    dosage: zod_1.z.string().optional(),
    frequency: zod_1.z.enum(['daily', 'twice_daily', 'three_times_daily', 'weekly', 'custom']),
    start_date: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date invalide (YYYY-MM-DD)'),
    end_date: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    times: zod_1.z.array(zod_1.z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Heure invalide (HH:MM)')).min(1, 'Au moins une heure de prise est requise'),
});
// Créer un médicament
router.post('/', auth_1.authMiddleware, async (req, res) => {
    const client = await database_1.default.connect();
    try {
        const data = medicationSchema.parse(req.body);
        await client.query('BEGIN');
        // Insérer le médicament
        const medResult = await client.query(`INSERT INTO medications (user_id, name, dosage, frequency, start_date, end_date)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`, [req.userId, data.name, data.dosage || null, data.frequency, data.start_date, data.end_date || null]);
        const medId = medResult.rows[0].id;
        // Insérer les horaires
        for (const time of data.times) {
            await client.query('INSERT INTO medication_times (medication_id, time) VALUES ($1,$2)', [medId, time]);
        }
        await client.query('COMMIT');
        // Récupérer les horaires pour la réponse
        const timesResult = await client.query('SELECT time FROM medication_times WHERE medication_id = $1 ORDER BY time', [medId]);
        res.status(201).json({
            medication: {
                ...medResult.rows[0],
                times: timesResult.rows.map((t) => t.time),
            },
        });
    }
    catch (error) {
        await client.query('ROLLBACK');
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({ error: error.issues[0].message });
        }
        console.error('Erreur création médicament:', error);
        res.status(500).json({ error: 'Erreur serveur lors de la création' });
    }
    finally {
        client.release();
    }
});
// Lister les médicaments avec horaires et logs du jour
router.get('/', auth_1.authMiddleware, async (req, res) => {
    try {
        const today = new Date().toISOString().split('T')[0];
        const medications = await database_1.default.query('SELECT * FROM medications WHERE user_id = $1 AND active = 1 ORDER BY created_at DESC', [req.userId]);
        const result = [];
        for (const med of medications.rows) {
            const times = await database_1.default.query('SELECT time FROM medication_times WHERE medication_id = $1 ORDER BY time', [med.id]);
            const logs = await database_1.default.query('SELECT time, taken FROM medication_logs WHERE medication_id = $1 AND date = $2', [med.id, today]);
            const logsMap = {};
            logs.rows.forEach((l) => {
                logsMap[l.time] = l.taken;
            });
            result.push({
                ...med,
                times: times.rows.map((t) => t.time),
                logs: logsMap,
            });
        }
        res.json({ medications: result });
    }
    catch (error) {
        console.error('Erreur liste médicaments:', error);
        res.status(500).json({ error: 'Erreur serveur lors de la récupération' });
    }
});
// Marquer une prise
router.post('/:id/take', auth_1.authMiddleware, async (req, res) => {
    try {
        const { date, time } = req.body;
        const medId = req.params.id;
        // Vérifier que le médicament appartient à l'utilisateur
        const med = await database_1.default.query('SELECT * FROM medications WHERE id = $1 AND user_id = $2', [medId, req.userId]);
        if (med.rows.length === 0) {
            return res.status(404).json({ error: 'Médicament non trouvé' });
        }
        await database_1.default.query(`INSERT INTO medication_logs (medication_id, date, time, taken)
       VALUES ($1, $2, $3, true)
       ON CONFLICT (medication_id, date, time) DO UPDATE SET taken = true`, [medId, date, time]);
        res.json({ success: true });
    }
    catch (error) {
        console.error('Erreur prise médicament:', error);
        res.status(500).json({ error: 'Erreur serveur lors de la prise' });
    }
});
// Désactiver un médicament
router.delete('/:id', auth_1.authMiddleware, async (req, res) => {
    try {
        await database_1.default.query('UPDATE medications SET active = 0 WHERE id = $1 AND user_id = $2', [req.params.id, req.userId]);
        res.json({ message: 'Médicament désactivé' });
    }
    catch (error) {
        console.error('Erreur suppression médicament:', error);
        res.status(500).json({ error: 'Erreur serveur lors de la suppression' });
    }
});
exports.default = router;
//# sourceMappingURL=medications.js.map