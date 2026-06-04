"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const database_1 = __importDefault(require("../database"));
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.post('/promote', auth_1.authMiddleware, async (req, res) => {
    const { email } = req.body;
    if (!email)
        return res.status(400).json({ error: 'Email requis' });
    const result = await database_1.default.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0)
        return res.status(404).json({ error: 'Utilisateur non trouvé' });
    await database_1.default.query("UPDATE users SET role = 'admin' WHERE email = $1", [email]);
    res.json({ message: `L'utilisateur ${email} est maintenant administrateur.` });
});
exports.default = router;
//# sourceMappingURL=promote.js.map