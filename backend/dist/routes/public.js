"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const database_1 = __importDefault(require("../database"));
const router = (0, express_1.Router)();
// GET /api/public/settings – accessible sans authentification
router.get('/settings', async (_req, res) => {
    try {
        const result = await database_1.default.query('SELECT key, value FROM settings');
        const settings = {};
        result.rows.forEach((row) => settings[row.key] = row.value);
        res.json(settings);
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
});
exports.default = router;
//# sourceMappingURL=public.js.map