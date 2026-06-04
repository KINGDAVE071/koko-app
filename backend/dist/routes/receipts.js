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
const receiptSchema = zod_1.z.object({
    type: zod_1.z.enum(['location', 'vente', 'pret', 'service', 'autre']),
    from_name: zod_1.z.string().min(2),
    to_name: zod_1.z.string().min(2),
    amount: zod_1.z.number().positive(),
    currency: zod_1.z.string().length(3).toUpperCase(),
    description: zod_1.z.string().optional(),
    location: zod_1.z.string().optional(),
    signature_from: zod_1.z.string().optional(),
    signature_to: zod_1.z.string().optional(),
});
router.post('/', auth_1.authMiddleware, async (req, res) => {
    try {
        const data = receiptSchema.parse(req.body);
        const result = await database_1.default.query(`INSERT INTO receipts (user_id, type, from_name, to_name, amount, currency, description, location, signature_from, signature_to)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`, [req.userId, data.type, data.from_name, data.to_name, data.amount, data.currency, data.description || null, data.location || null, data.signature_from || null, data.signature_to || null]);
        res.status(201).json({ receipt: result.rows[0] });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError)
            return res.status(400).json({ error: error.issues[0].message });
        res.status(500).json({ error: 'Erreur serveur' });
    }
});
router.get('/', auth_1.authMiddleware, async (req, res) => {
    const result = await database_1.default.query('SELECT * FROM receipts WHERE user_id = $1 ORDER BY created_at DESC', [req.userId]);
    res.json({ receipts: result.rows });
});
router.delete('/:id', auth_1.authMiddleware, async (req, res) => {
    await database_1.default.query('DELETE FROM receipts WHERE id = $1 AND user_id = $2', [req.params.id, req.userId]);
    res.json({ message: 'Quittance supprimée' });
});
exports.default = router;
//# sourceMappingURL=receipts.js.map