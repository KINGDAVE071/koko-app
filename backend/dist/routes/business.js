"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const database_1 = __importDefault(require("../database"));
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.get('/dashboard', auth_1.authMiddleware, async (req, res) => {
    const userId = req.userId;
    const products = await database_1.default.query('SELECT COUNT(*)::int AS count FROM products WHERE user_id = $1', [userId]);
    const clients = await database_1.default.query('SELECT COUNT(*)::int AS count FROM clients WHERE user_id = $1', [userId]);
    const invoices = await database_1.default.query('SELECT COUNT(*)::int AS count FROM invoices WHERE user_id = $1', [userId]);
    const income = await database_1.default.query("SELECT COALESCE(SUM(amount),0) AS total FROM transactions WHERE user_id = $1 AND type = 'income'", [userId]);
    const expense = await database_1.default.query("SELECT COALESCE(SUM(amount),0) AS total FROM transactions WHERE user_id = $1 AND type = 'expense'", [userId]);
    res.json({
        productsCount: products.rows[0].count,
        clientsCount: clients.rows[0].count,
        invoicesCount: invoices.rows[0].count,
        income: parseFloat(income.rows[0].total),
        expense: parseFloat(expense.rows[0].total),
        balance: parseFloat(income.rows[0].total) - parseFloat(expense.rows[0].total),
    });
});
exports.default = router;
//# sourceMappingURL=business.js.map