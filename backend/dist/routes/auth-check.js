"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const database_1 = __importDefault(require("../database"));
const router = (0, express_1.Router)();
// GET /api/auth-check/exists?email=...
router.get('/exists', async (req, res) => {
    const email = req.query.email;
    if (!email)
        return res.status(400).json({ error: 'Email requis' });
    try {
        const result = await database_1.default.query('SELECT id FROM users WHERE email = $1', [email]);
        res.json({ exists: result.rows.length > 0 });
    }
    catch (e) {
        res.status(500).json({ error: 'Erreur serveur' });
    }
});
exports.default = router;
//# sourceMappingURL=auth-check.js.map