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
// Schéma d'item commun
const itemSchema = zod_1.z.object({
    description: zod_1.z.string().optional(),
    quantity: zod_1.z.number().positive(),
    unit_price: zod_1.z.number().positive(),
    tva: zod_1.z.number().min(0).optional().default(0),
});
// Schéma global (tout est optionnel, validation métier plus tard)
const invoiceSchema = zod_1.z.object({
    client_name: zod_1.z.string().optional(),
    type: zod_1.z.enum(['facture', 'devis', 'avoir']).default('facture'),
    date: zod_1.z.string(),
    due_date: zod_1.z.string().optional(),
    discount: zod_1.z.number().min(0).optional().default(0),
    notes: zod_1.z.string().optional(),
    items: zod_1.z.array(itemSchema).optional(),
    total: zod_1.z.number().positive().optional(),
});
router.get('/', auth_1.authMiddleware, async (req, res) => {
    try {
        const result = await database_1.default.query('SELECT * FROM invoices WHERE user_id = $1 ORDER BY created_at DESC', [req.userId]);
        res.json({ invoices: result.rows });
    }
    catch (error) {
        res.status(500).json({ error: error.message || 'Erreur serveur' });
    }
});
router.get('/:id', auth_1.authMiddleware, async (req, res) => {
    try {
        const invoice = await database_1.default.query('SELECT * FROM invoices WHERE id = $1 AND user_id = $2', [req.params.id, req.userId]);
        if (invoice.rows.length === 0)
            return res.status(404).json({ error: 'Facture non trouvée' });
        const items = await database_1.default.query('SELECT * FROM invoice_items WHERE invoice_id = $1', [req.params.id]);
        res.json({ invoice: invoice.rows[0], items: items.rows });
    }
    catch (error) {
        res.status(500).json({ error: error.message || 'Erreur serveur' });
    }
});
router.post('/', auth_1.authMiddleware, async (req, res) => {
    const client = await database_1.default.connect();
    try {
        const data = invoiceSchema.parse(req.body);
        // Validation métier
        if (data.type === 'facture' && (!data.items || data.items.length === 0)) {
            return res.status(400).json({ error: 'Une facture doit contenir au moins un article.' });
        }
        if (data.type === 'devis' && (!data.items || data.items.length === 0) && !data.total) {
            return res.status(400).json({ error: 'Un devis doit contenir au moins un article ou un montant total.' });
        }
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const prefix = data.type === 'devis' ? 'DEV' : 'FACT';
        const fullPrefix = `${prefix}-${year}${month}`;
        const count = await client.query('SELECT COUNT(*)::int + 1 AS next FROM invoices WHERE user_id = $1 AND number LIKE $2', [req.userId, `${fullPrefix}%`]);
        const num = String(count.rows[0].next).padStart(3, '0');
        const number = `${fullPrefix}-${num}`;
        let totalHT = 0, totalTTC = 0;
        if (data.items && data.items.length > 0) {
            for (const item of data.items) {
                const lineHT = item.quantity * item.unit_price;
                const lineTTC = lineHT * (1 + item.tva / 100);
                totalHT += lineHT;
                totalTTC += lineTTC;
            }
        }
        else if (data.total) {
            totalTTC = data.total;
            totalHT = data.total; // approximation
        }
        totalTTC -= data.discount;
        totalHT -= data.discount;
        await client.query('BEGIN');
        const invoiceResult = await client.query(`INSERT INTO invoices (user_id, client_name, type, number, date, due_date, total_ht, total_ttc, discount, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`, [
            req.userId,
            data.client_name || null,
            data.type,
            number,
            data.date,
            data.due_date || null,
            Math.round(totalHT * 100) / 100,
            Math.round(totalTTC * 100) / 100,
            data.discount,
            data.notes || null,
        ]);
        const invoiceId = invoiceResult.rows[0].id;
        if (data.items) {
            for (const item of data.items) {
                await client.query(`INSERT INTO invoice_items (invoice_id, description, quantity, unit_price, tva)
           VALUES ($1,$2,$3,$4,$5)`, [invoiceId, item.description || '', item.quantity, item.unit_price, item.tva]);
            }
        }
        await client.query('COMMIT');
        res.status(201).json({ invoice: invoiceResult.rows[0] });
    }
    catch (error) {
        await client.query('ROLLBACK');
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({ error: error.issues[0].message });
        }
        res.status(500).json({ error: error.message || 'Erreur inconnue' });
    }
    finally {
        client.release();
    }
});
router.put('/:id', auth_1.authMiddleware, async (req, res) => {
    try {
        const { status } = req.body;
        if (!['pending', 'paid', 'cancelled'].includes(status)) {
            return res.status(400).json({ error: 'Statut invalide' });
        }
        const result = await database_1.default.query('UPDATE invoices SET status = $1 WHERE id = $2 AND user_id = $3 RETURNING *', [status, req.params.id, req.userId]);
        if (result.rows.length === 0)
            return res.status(404).json({ error: 'Document non trouvé' });
        res.json({ invoice: result.rows[0] });
    }
    catch (error) {
        res.status(500).json({ error: error.message || 'Erreur serveur' });
    }
});
router.delete('/:id', auth_1.authMiddleware, async (req, res) => {
    try {
        const result = await database_1.default.query('DELETE FROM invoices WHERE id = $1 AND user_id = $2 RETURNING id', [req.params.id, req.userId]);
        if (result.rows.length === 0)
            return res.status(404).json({ error: 'Document non trouvé' });
        res.json({ message: 'Document supprimé' });
    }
    catch (error) {
        res.status(500).json({ error: error.message || 'Erreur serveur' });
    }
});
exports.default = router;
//# sourceMappingURL=invoices.js.map