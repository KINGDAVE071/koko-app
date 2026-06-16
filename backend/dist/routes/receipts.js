"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const database_1 = __importDefault(require("../database"));
const auth_1 = require("../middleware/auth");
const crypto_1 = __importDefault(require("crypto"));
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
// Créer une quittance
router.post('/', auth_1.authMiddleware, async (req, res) => {
    try {
        const data = receiptSchema.parse(req.body);
        const raw = `${req.userId}-${data.from_name}-${data.to_name}-${data.amount}-${data.currency}-${Date.now()}`;
        const hash = crypto_1.default.createHash('sha256').update(raw).digest('hex').substring(0, 8);
        const result = await database_1.default.query(`INSERT INTO receipts (user_id, type, from_name, to_name, amount, currency, description, location, signature_from, signature_to, hash)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`, [req.userId, data.type, data.from_name, data.to_name, data.amount, data.currency, data.description || null, data.location || null, data.signature_from || null, data.signature_to || null, hash]);
        res.status(201).json({ receipt: result.rows[0] });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError)
            return res.status(400).json({ error: error.issues[0].message });
        res.status(500).json({ error: 'Erreur serveur' });
    }
});
// Lister les quittances (non supprimées) avec leurs items (pour les ventes)
router.get('/', auth_1.authMiddleware, async (req, res) => {
    try {
        const result = await database_1.default.query(`SELECT r.*,
        COALESCE(
          json_agg(
            json_build_object('product_name', si.product_name, 'quantity', si.quantity, 'unit_price', si.unit_price)
          ) FILTER (WHERE si.receipt_id IS NOT NULL), '[]'
        ) AS items
      FROM receipts r
      LEFT JOIN sale_items si ON si.receipt_id = r.id
      WHERE r.user_id = $1 AND r.deleted = false
      GROUP BY r.id
      ORDER BY r.created_at DESC`, [req.userId]);
        res.json({ receipts: result.rows });
    }
    catch (error) {
        res.status(500).json({ error: 'Erreur serveur' });
    }
});
// Soft delete d'une quittance
router.delete('/:id', auth_1.authMiddleware, async (req, res) => {
    try {
        const result = await database_1.default.query('UPDATE receipts SET deleted = true WHERE id = $1 AND user_id = $2 RETURNING id', [req.params.id, req.userId]);
        if (result.rows.length === 0)
            return res.status(404).json({ error: 'Quittance non trouvée' });
        res.json({ message: 'Quittance supprimée (soft delete)' });
    }
    catch (error) {
        res.status(500).json({ error: 'Erreur serveur' });
    }
});
exports.default = router;
//# sourceMappingURL=receipts.js.map