"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const node_fetch_1 = __importDefault(require("node-fetch"));
const router = (0, express_1.Router)();
router.post('/', async (req, res) => {
    const { lat, lon } = req.body;
    if (!lat || !lon)
        return res.status(400).json({ error: 'Coordonnées GPS requises' });
    try {
        const query = `[out:json];(node["amenity"="pharmacy"](around:5000,${lat},${lon}););out;`;
        const response = await (0, node_fetch_1.default)('https://overpass-api.de/api/interpreter', {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain' },
            body: query,
        });
        if (!response.ok) {
            const text = await response.text();
            return res.status(502).json({ error: `Overpass API a répondu ${response.status}: ${text}` });
        }
        const data = await response.json();
        res.json(data);
    }
    catch (error) {
        // Renvoyer le message d'erreur exact
        res.status(500).json({ error: error.message || 'Erreur inconnue' });
    }
});
exports.default = router;
//# sourceMappingURL=pharmacies.js.map