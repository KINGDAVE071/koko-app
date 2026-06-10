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
    name: zod_1.z.string().min(1, 'Nom requis'),
    price: zod_1.z.number().min(0, 'Prix de vente ≥ 0'),
    cost_price: zod_1.z.number().min(0).optional().default(0),
    stock: zod_1.z.number().int().min(0).optional().default(0),
    min_stock: zod_1.z.number().int().min(0).optional().default(0),
    tva: zod_1.z.number().min(0).max(100).optional().default(0),
});
router.get('/', auth_1.authMiddleware, async (req, res) => {
    try {
        const result = await database_1.default.query('SELECT * FROM products WHERE user_id = $1 ORDER BY name', [req.userId]);
        res.json({ products: result.rows });
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
});
router.post('/', auth_1.authMiddleware, async (req, res) => {
    try {
        const data = productSchema.parse(req.body);
        const result = await database_1.default.query(`INSERT INTO products (user_id, name, price, cost_price, stock, min_stock, tva)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`, [req.userId, data.name, data.price, data.cost_price, data.stock, data.min_stock, data.tva]);
        res.status(201).json({ product: result.rows[0] });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError)
            return res.status(400).json({ error: error.issues[0].message });
        res.status(500).json({ error: error.message || 'Erreur serveur' });
    }
});
router.put('/:id', auth_1.authMiddleware, async (req, res) => {
    try {
        const data = productSchema.parse(req.body);
        const result = await database_1.default.query(`UPDATE products SET name=$1, price=$2, cost_price=$3, stock=$4, min_stock=$5, tva=$6
       WHERE id=$7 AND user_id=$8 RETURNING *`, [data.name, data.price, data.cost_price, data.stock, data.min_stock, data.tva, req.params.id, req.userId]);
        if (result.rows.length === 0)
            return res.status(404).json({ error: 'Produit non trouvé' });
        res.json({ product: result.rows[0] });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError)
            return res.status(400).json({ error: error.issues[0].message });
        res.status(500).json({ error: error.message || 'Erreur serveur' });
    }
});
router.delete('/:id', auth_1.authMiddleware, async (req, res) => {
    try {
        await database_1.default.query('DELETE FROM products WHERE id=$1 AND user_id=$2', [req.params.id, req.userId]);
        res.json({ message: 'Produit supprimé' });
    }
    catch (error) {
        res.status(500).json({ error: error.message || 'Erreur serveur' });
    }
});
exports.default = router;
//# sourceMappingURL=products.js.map