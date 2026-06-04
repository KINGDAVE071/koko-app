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
router.get('/', auth_1.authMiddleware, async (req, res) => {
    const txResult = await database_1.default.query('SELECT * FROM transactions WHERE user_id = $1 ORDER BY date DESC', [req.userId]);
    const incomeResult = await database_1.default.query("SELECT COALESCE(SUM(amount),0) AS total FROM transactions WHERE user_id = $1 AND type = 'income'", [req.userId]);
    const expenseResult = await database_1.default.query("SELECT COALESCE(SUM(amount),0) AS total FROM transactions WHERE user_id = $1 AND type = 'expense'", [req.userId]);
    const income = parseFloat(incomeResult.rows[0].total);
    const expense = parseFloat(expenseResult.rows[0].total);
    res.json({ transactions: txResult.rows, balance: income - expense });
});
router.post('/', auth_1.authMiddleware, async (req, res) => {
    try {
        const data = transactionSchema.parse(req.body);
        const result = await database_1.default.query('INSERT INTO transactions (user_id, type, amount, description, date) VALUES ($1,$2,$3,$4,$5) RETURNING *', [req.userId, data.type, data.amount, data.description || null, data.date]);
        res.status(201).json({ transaction: result.rows[0] });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError)
            return res.status(400).json({ error: error.issues[0].message });
        res.status(500).json({ error: 'Erreur serveur' });
    }
});
// DELETE /api/transactions/:id
router.delete('/:id', auth_1.authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const result = await database_1.default.query('DELETE FROM transactions WHERE id = $1 AND user_id = $2 RETURNING id', [id, req.userId]);
        if (result.rows.length === 0)
            return res.status(404).json({ error: 'Transaction non trouvée' });
        res.json({ message: 'Transaction supprimée' });
    }
    catch (error) {
        res.status(500).json({ error: 'Erreur serveur' });
    }
});
exports.default = router;
//# sourceMappingURL=transactions.js.map