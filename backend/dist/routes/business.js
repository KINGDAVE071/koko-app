"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const database_1 = __importDefault(require("../database"));
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.get('/dashboard', auth_1.authMiddleware, (req, res) => {
    const userId = req.userId;
    const productsCount = database_1.default.prepare('SELECT COUNT(*) as count FROM products WHERE user_id = ?').get(userId)?.count || 0;
    const clientsCount = database_1.default.prepare('SELECT COUNT(*) as count FROM clients WHERE user_id = ?').get(userId)?.count || 0;
    const invoicesCount = database_1.default.prepare('SELECT COUNT(*) as count FROM invoices WHERE user_id = ?').get(userId)?.count || 0;
    const income = database_1.default.prepare("SELECT SUM(amount) as total FROM transactions WHERE user_id = ? AND type = 'income'").get(userId)?.total || 0;
    const expense = database_1.default.prepare("SELECT SUM(amount) as total FROM transactions WHERE user_id = ? AND type = 'expense'").get(userId)?.total || 0;
    res.json({
        productsCount,
        clientsCount,
        invoicesCount,
        income,
        expense,
        balance: income - expense,
    });
});
exports.default = router;
//# sourceMappingURL=business.js.map