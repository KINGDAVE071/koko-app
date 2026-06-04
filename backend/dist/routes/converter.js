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
    amount: zod_1.z.number().positive(),
    from: zod_1.z.string().length(3).toUpperCase(),
    to: zod_1.z.string().length(3).toUpperCase(),
    useParallel: zod_1.z.boolean().optional().default(false),
});
const marginSchema = zod_1.z.object({
    costPrice: zod_1.z.number().positive(),
    marginPercent: zod_1.z.number().min(0).max(100),
    currency: zod_1.z.string().length(3).toUpperCase(),
});
router.post('/convert', auth_1.authMiddleware, async (req, res) => {
    try {
        const { amount, from, to, useParallel } = convertSchema.parse(req.body);
        const result = await database_1.default.query('SELECT * FROM conversion_rates WHERE from_currency = $1 AND to_currency = $2 ORDER BY updated_at DESC LIMIT 1', [from, to]);
        if (result.rows.length === 0)
            return res.status(404).json({ error: `Taux ${from} → ${to} non disponible.` });
        const rate = useParallel && result.rows[0].parallel_rate ? result.rows[0].parallel_rate : result.rows[0].official_rate;
        const converted = Math.round(amount * rate * 100) / 100;
        res.json({ amount, from, to, rate, result: converted, type: useParallel ? 'parallel' : 'official', date: new Date().toISOString() });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError)
            return res.status(400).json({ error: error.issues[0].message });
        res.status(500).json({ error: 'Erreur serveur' });
    }
});
router.post('/margin', auth_1.authMiddleware, async (req, res) => {
    try {
        const { costPrice, marginPercent, currency } = marginSchema.parse(req.body);
        const sellingPrice = Math.round(costPrice * (1 + marginPercent / 100) * 100) / 100;
        const marginAmount = Math.round((sellingPrice - costPrice) * 100) / 100;
        res.json({ costPrice, marginPercent, sellingPrice, marginAmount, currency });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError)
            return res.status(400).json({ error: error.issues[0].message });
        res.status(500).json({ error: 'Erreur serveur' });
    }
});
router.get('/rates', auth_1.authMiddleware, async (req, res) => {
    const result = await database_1.default.query('SELECT * FROM conversion_rates ORDER BY from_currency, to_currency');
    res.json({ rates: result.rows });
});
router.post('/rates', auth_1.authMiddleware, async (req, res) => {
    try {
        const { from, to, official, parallel } = req.body;
        await database_1.default.query(`INSERT INTO conversion_rates (from_currency, to_currency, official_rate, parallel_rate)
       VALUES ($1,$2,$3,$4)
       ON CONFLICT (from_currency, to_currency) DO UPDATE SET official_rate=$3, parallel_rate=$4, updated_at=NOW()`, [from, to, official, parallel || null]);
        res.json({ message: 'Taux mis à jour' });
    }
    catch (error) {
        res.status(500).json({ error: 'Erreur serveur' });
    }
});
exports.default = router;
//# sourceMappingURL=converter.js.map