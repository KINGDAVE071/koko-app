"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const database_1 = __importDefault(require("../database"));
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Upload du logo (base64)
router.put('/logo', auth_1.authMiddleware, async (req, res) => {
    const { logo } = req.body; // base64 string
    if (!logo)
        return res.status(400).json({ error: 'Aucune image fournie' });
    try {
        await database_1.default.query('UPDATE users SET logo = $1 WHERE id = $2', [logo, req.userId]);
        res.json({ message: 'Logo mis à jour' });
    }
    catch (error) {
        res.status(500).json({ error: 'Erreur lors de la mise à jour du logo' });
    }
});
// Récupérer le logo
router.get('/logo', auth_1.authMiddleware, async (req, res) => {
    try {
        const result = await database_1.default.query('SELECT logo FROM users WHERE id = $1', [req.userId]);
        if (result.rows.length === 0)
            return res.status(404).json({ error: 'Utilisateur non trouvé' });
        res.json({ logo: result.rows[0].logo });
    }
    catch (error) {
        res.status(500).json({ error: 'Erreur serveur' });
    }
});
exports.default = router;
//# sourceMappingURL=auth-logo.js.map