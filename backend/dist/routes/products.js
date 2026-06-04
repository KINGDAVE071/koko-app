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
router.get('/', auth_1.authMiddleware, async (req, res) => {
    const result = await database_1.default.query('SELECT * FROM products WHERE user_id = $1 ORDER BY name', [req.userId]);
    res.json({ products: result.rows });
});
router.post('/', auth_1.authMiddleware, async (req, res) => {
    try {
        const data = productSchema.parse(req.body);
        const result = await database_1.default.query('INSERT INTO products (user_id, name, price, unit, stock, tva) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *', [req.userId, data.name, data.price, data.unit || 'pièce', data.stock || 0, data.tva || 0]);
        res.status(201).json({ product: result.rows[0] });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError)
            return res.status(400).json({ error: error.issues[0].message });
        res.status(500).json({ error: 'Erreur serveur' });
    }
});
router.delete('/:id', auth_1.authMiddleware, async (req, res) => {
    await database_1.default.query('DELETE FROM products WHERE id = $1 AND user_id = $2', [req.params.id, req.userId]);
    res.json({ message: 'Produit supprimé' });
});
exports.default = router;
//# sourceMappingURL=products.js.map