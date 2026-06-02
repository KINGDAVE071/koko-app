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
const productSchema = zod_1.z.object({
    name: zod_1.z.string().min(1),
    price: zod_1.z.number().positive(),
    unit: zod_1.z.string().optional(),
    stock: zod_1.z.number().optional(),
    tva: zod_1.z.number().min(0).max(100).optional(),
});
router.get('/', auth_1.authMiddleware, (req, res) => {
    const products = database_1.default.prepare('SELECT * FROM products WHERE user_id = ? ORDER BY name').all(req.userId);
    res.json({ products });
});
router.post('/', auth_1.authMiddleware, (req, res) => {
    try {
        const data = productSchema.parse(req.body);
        const result = database_1.default.prepare('INSERT INTO products (user_id, name, price, unit, stock, tva) VALUES (?, ?, ?, ?, ?, ?)').run(req.userId, data.name, data.price, data.unit || 'pièce', data.stock || 0, data.tva || 0);
        const product = database_1.default.prepare('SELECT * FROM products WHERE id = ?').get(result.lastInsertRowid);
        res.status(201).json({ product });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError)
            return res.status(400).json({ error: error.issues[0].message });
        res.status(500).json({ error: 'Erreur serveur' });
    }
});
router.delete('/:id', auth_1.authMiddleware, (req, res) => {
    database_1.default.prepare('DELETE FROM products WHERE id = ? AND user_id = ?').run(req.params.id, req.userId);
    res.json({ message: 'Produit supprimé' });
});
exports.default = router;
//# sourceMappingURL=products.js.map