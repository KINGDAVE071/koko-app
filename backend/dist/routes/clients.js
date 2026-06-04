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
const clientSchema = zod_1.z.object({
    name: zod_1.z.string().min(1),
    email: zod_1.z.string().email().optional().or(zod_1.z.literal('')),
    phone: zod_1.z.string().optional(),
    type: zod_1.z.enum(['client', 'fournisseur']).default('client'),
});
router.get('/', auth_1.authMiddleware, async (req, res) => {
    const result = await database_1.default.query('SELECT * FROM clients WHERE user_id = $1 ORDER BY name', [req.userId]);
    res.json({ clients: result.rows });
});
router.post('/', auth_1.authMiddleware, async (req, res) => {
    try {
        const data = clientSchema.parse(req.body);
        const result = await database_1.default.query('INSERT INTO clients (user_id, name, email, phone, type) VALUES ($1,$2,$3,$4,$5) RETURNING *', [req.userId, data.name, data.email || null, data.phone || null, data.type]);
        res.status(201).json({ client: result.rows[0] });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError)
            return res.status(400).json({ error: error.issues[0].message });
        res.status(500).json({ error: 'Erreur serveur' });
    }
});
router.delete('/:id', auth_1.authMiddleware, async (req, res) => {
    await database_1.default.query('DELETE FROM clients WHERE id = $1 AND user_id = $2', [req.params.id, req.userId]);
    res.json({ message: 'Supprimé' });
});
exports.default = router;
//# sourceMappingURL=clients.js.map