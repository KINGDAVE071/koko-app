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
const saleSchema = zod_1.z.object({
    items: zod_1.z.array(zod_1.z.object({
        product_id: zod_1.z.number().int().positive(),
        quantity: zod_1.z.number().int().positive(),
        unit_price: zod_1.z.number().positive(),
    })).min(1, 'Au moins un produit est requis'),
    description: zod_1.z.string().optional(),
});
// POST /api/sales - Créer une vente rapide
router.post('/', auth_1.authMiddleware, async (req, res) => {
    const client = await database_1.default.connect();
    try {
        const data = saleSchema.parse(req.body);
        await client.query('BEGIN');
        let totalAmount = 0;
        const saleItems = [];
        for (const item of data.items) {
            const productRes = await client.query('SELECT * FROM products WHERE id = $1 AND user_id = $2', [item.product_id, req.userId]);
            if (productRes.rows.length === 0) {
                throw new Error(`Produit ${item.product_id} introuvable`);
            }
            const product = productRes.rows[0];
            if (product.stock < item.quantity) {
                throw new Error(`Stock insuffisant pour ${product.name} (${product.stock} dispo, ${item.quantity} demandé)`);
            }
            await client.query('UPDATE products SET stock = stock - $1 WHERE id = $2', [item.quantity, product.id]);
            const lineTotal = item.unit_price * item.quantity;
            totalAmount += lineTotal;
            saleItems.push({
                product_id: product.id,
                product_name: product.name,
                quantity: item.quantity,
                unit_price: item.unit_price,
                cost_price: product.cost_price || 0,
                tva: product.tva || 0,
            });
        }
        const hashInput = `${req.userId}-${Date.now()}`;
        const hash = crypto_1.default.createHash('sha256').update(hashInput).digest('hex').substring(0, 8);
        const receiptRes = await client.query(`INSERT INTO receipts (user_id, type, from_name, to_name, amount, currency, description, hash)
       VALUES ($1, 'vente', 'Client', 'KOKO', $2, 'XOF', $3, $4) RETURNING *`, [req.userId, totalAmount, data.description || 'Vente rapide', hash]);
        const receiptId = receiptRes.rows[0].id;
        for (const si of saleItems) {
            await client.query(`INSERT INTO sale_items (receipt_id, product_id, product_name, quantity, unit_price, cost_price)
         VALUES ($1, $2, $3, $4, $5, $6)`, [receiptId, si.product_id, si.product_name, si.quantity, si.unit_price, si.cost_price]);
        }
        await client.query('COMMIT');
        res.status(201).json({ receipt: receiptRes.rows[0], items: saleItems });
    }
    catch (error) {
        await client.query('ROLLBACK');
        if (error instanceof zod_1.z.ZodError)
            return res.status(400).json({ error: error.issues[0].message });
        res.status(400).json({ error: error.message || 'Erreur serveur' });
    }
    finally {
        client.release();
    }
});
// GET /api/sales - Historique des ventes (avec items)
router.get('/', auth_1.authMiddleware, async (req, res) => {
    try {
        // Récupérer les reçus de type vente avec profit
        const sales = await database_1.default.query(`SELECT r.*, 
              COALESCE(SUM((si.unit_price - si.cost_price) * si.quantity), 0) AS profit
       FROM receipts r
       LEFT JOIN sale_items si ON si.receipt_id = r.id
       WHERE r.user_id = $1 AND r.type = 'vente'
       GROUP BY r.id
       ORDER BY r.created_at DESC`, [req.userId]);
        // Pour chaque vente, récupérer les items
        const result = [];
        for (const sale of sales.rows) {
            const items = await database_1.default.query('SELECT product_name, quantity, unit_price, cost_price FROM sale_items WHERE receipt_id = $1', [sale.id]);
            result.push({
                ...sale,
                items: items.rows,
            });
        }
        res.json({ sales: result });
    }
    catch (error) {
        res.status(500).json({ error: 'Erreur serveur' });
    }
});
// GET /api/sales/stats - Statistiques
router.get('/stats', auth_1.authMiddleware, async (req, res) => {
    try {
        const stats = await database_1.default.query(`SELECT 
         COALESCE(SUM(r.amount), 0) AS total_revenue,
         COALESCE(SUM((si.unit_price - si.cost_price) * si.quantity), 0) AS total_profit,
         COUNT(DISTINCT r.id) AS total_sales
       FROM receipts r
       LEFT JOIN sale_items si ON si.receipt_id = r.id
       WHERE r.user_id = $1 AND r.type = 'vente'`, [req.userId]);
        res.json(stats.rows[0]);
    }
    catch (error) {
        res.status(500).json({ error: 'Erreur serveur' });
    }
});
exports.default = router;
//# sourceMappingURL=sales.js.map