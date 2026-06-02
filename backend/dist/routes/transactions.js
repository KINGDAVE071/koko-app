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
const transactionSchema = zod_1.z.object({
    type: zod_1.z.enum(['income', 'expense']),
    amount: zod_1.z.number().positive(),
    description: zod_1.z.string().optional(),
    date: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});
router.get('/', auth_1.authMiddleware, (req, res) => {
    const transactions = database_1.default.prepare('SELECT * FROM transactions WHERE user_id = ? ORDER BY date DESC').all(req.userId);
    const income = database_1.default.prepare("SELECT SUM(amount) as total FROM transactions WHERE user_id = ? AND type = 'income'").get(req.userId);
    const expense = database_1.default.prepare("SELECT SUM(amount) as total FROM transactions WHERE user_id = ? AND type = 'expense'").get(req.userId);
    res.json({
        transactions,
        balance: (income?.total || 0) - (expense?.total || 0),
    });
});
router.post('/', auth_1.authMiddleware, (req, res) => {
    try {
        const data = transactionSchema.parse(req.body);
        const result = database_1.default.prepare('INSERT INTO transactions (user_id, type, amount, description, date) VALUES (?, ?, ?, ?, ?)').run(req.userId, data.type, data.amount, data.description || null, data.date);
        const transaction = database_1.default.prepare('SELECT * FROM transactions WHERE id = ?').get(result.lastInsertRowid);
        res.status(201).json({ transaction });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError)
            return res.status(400).json({ error: error.issues[0].message });
        res.status(500).json({ error: 'Erreur serveur' });
    }
});
exports.default = router;
//# sourceMappingURL=transactions.js.map