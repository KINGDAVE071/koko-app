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
const receiptSchema = zod_1.z.object({
    type: zod_1.z.enum(['location', 'vente', 'pret', 'service', 'autre'], {
        message: 'Type invalide (location, vente, pret, service, autre)',
    }),
    from_name: zod_1.z.string().min(2, 'Nom de la personne qui paie requis'),
    to_name: zod_1.z.string().min(2, 'Nom du bénéficiaire requis'),
    amount: zod_1.z.number().positive('Montant positif requis'),
    currency: zod_1.z.string().length(3, 'Code devise sur 3 lettres').toUpperCase(),
    description: zod_1.z.string().optional(),
    location: zod_1.z.string().optional(),
    signature_from: zod_1.z.string().optional(),
    signature_to: zod_1.z.string().optional(),
});
// Créer une quittance
router.post('/', auth_1.authMiddleware, (req, res) => {
    try {
        const data = receiptSchema.parse(req.body);
        const result = database_1.default.prepare(`
      INSERT INTO receipts (user_id, type, from_name, to_name, amount, currency, description, location, signature_from, signature_to)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(req.userId, data.type, data.from_name, data.to_name, data.amount, data.currency, data.description || null, data.location || null, data.signature_from || null, data.signature_to || null);
        const receipt = database_1.default.prepare('SELECT * FROM receipts WHERE id = ?').get(result.lastInsertRowid);
        res.status(201).json({ receipt });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({ error: error.issues[0].message });
        }
        res.status(500).json({ error: 'Erreur serveur' });
    }
});
// Lister ses quittances
router.get('/', auth_1.authMiddleware, (req, res) => {
    const receipts = database_1.default.prepare('SELECT * FROM receipts WHERE user_id = ? ORDER BY created_at DESC').all(req.userId);
    res.json({ receipts });
});
// Détail d'une quittance
router.get('/:id', auth_1.authMiddleware, (req, res) => {
    const receipt = database_1.default.prepare('SELECT * FROM receipts WHERE id = ? AND user_id = ?').get(req.params.id, req.userId);
    if (!receipt) {
        return res.status(404).json({ error: 'Quittance non trouvée' });
    }
    res.json({ receipt });
});
// Supprimer une quittance
router.delete('/:id', auth_1.authMiddleware, (req, res) => {
    const receipt = database_1.default.prepare('SELECT * FROM receipts WHERE id = ? AND user_id = ?').get(req.params.id, req.userId);
    if (!receipt) {
        return res.status(404).json({ error: 'Quittance non trouvée' });
    }
    database_1.default.prepare('DELETE FROM receipts WHERE id = ?').run(req.params.id);
    res.json({ message: 'Quittance supprimée' });
});
exports.default = router;
//# sourceMappingURL=receipts.js.map