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
const convertSchema = zod_1.z.object({
    amount: zod_1.z.number().positive('Le montant doit être positif'),
    from: zod_1.z.string().length(3, 'Code devise invalide (3 lettres)').toUpperCase(),
    to: zod_1.z.string().length(3, 'Code devise invalide (3 lettres)').toUpperCase(),
    useParallel: zod_1.z.boolean().optional().default(false),
});
const marginSchema = zod_1.z.object({
    costPrice: zod_1.z.number().positive('Prix d\'achat positif'),
    marginPercent: zod_1.z.number().min(0).max(100, 'Marge entre 0 et 100%'),
    currency: zod_1.z.string().length(3).toUpperCase(),
});
router.post('/convert', auth_1.authMiddleware, (req, res) => {
    try {
        const { amount, from, to, useParallel } = convertSchema.parse(req.body);
        const rateRow = database_1.default.prepare('SELECT * FROM conversion_rates WHERE from_currency = ? AND to_currency = ? ORDER BY updated_at DESC LIMIT 1').get(from, to);
        if (!rateRow) {
            return res.status(404).json({ error: `Taux ${from} → ${to} non disponible.` });
        }
        const rate = useParallel && rateRow.parallel_rate ? rateRow.parallel_rate : rateRow.official_rate;
        const result = amount * rate;
        res.json({
            amount,
            from,
            to,
            rate,
            result: Math.round(result * 100) / 100,
            type: useParallel ? 'parallel' : 'official',
            date: new Date().toISOString(),
        });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({ error: error.issues[0].message });
        }
        res.status(500).json({ error: 'Erreur serveur' });
    }
});
router.post('/margin', auth_1.authMiddleware, (req, res) => {
    try {
        const { costPrice, marginPercent, currency } = marginSchema.parse(req.body);
        const sellingPrice = costPrice * (1 + marginPercent / 100);
        const marginAmount = sellingPrice - costPrice;
        res.json({
            costPrice,
            marginPercent,
            sellingPrice: Math.round(sellingPrice * 100) / 100,
            marginAmount: Math.round(marginAmount * 100) / 100,
            currency,
        });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({ error: error.issues[0].message });
        }
        res.status(500).json({ error: 'Erreur serveur' });
    }
});
router.get('/rates', auth_1.authMiddleware, (req, res) => {
    const rates = database_1.default.prepare('SELECT * FROM conversion_rates ORDER BY from_currency, to_currency').all();
    res.json({ rates });
});
const updateRateSchema = zod_1.z.object({
    from: zod_1.z.string().length(3).toUpperCase(),
    to: zod_1.z.string().length(3).toUpperCase(),
    official: zod_1.z.number().positive(),
    parallel: zod_1.z.number().positive().optional(),
});
router.post('/rates', auth_1.authMiddleware, (req, res) => {
    try {
        const { from, to, official, parallel } = updateRateSchema.parse(req.body);
        const existing = database_1.default.prepare('SELECT id FROM conversion_rates WHERE from_currency = ? AND to_currency = ?').get(from, to);
        if (existing) {
            database_1.default.prepare('UPDATE conversion_rates SET official_rate = ?, parallel_rate = ?, updated_at = CURRENT_TIMESTAMP WHERE from_currency = ? AND to_currency = ?').run(official, parallel || null, from, to);
        }
        else {
            database_1.default.prepare('INSERT INTO conversion_rates (from_currency, to_currency, official_rate, parallel_rate) VALUES (?, ?, ?, ?)').run(from, to, official, parallel || null);
        }
        res.json({ message: 'Taux mis à jour' });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({ error: error.issues[0].message });
        }
        res.status(500).json({ error: 'Erreur serveur' });
    }
});
exports.default = router;
//# sourceMappingURL=converter.js.map