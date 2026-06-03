"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const router = (0, express_1.Router)();
router.post('/', async (req, res) => {
    const { lat, lon } = req.body;
    if (!lat || !lon)
        return res.status(400).json({ error: 'Coordonnées GPS requises' });
    try {
        const query = `[out:json];(node["amenity"="pharmacy"](around:5000,${lat},${lon}););out;`;
        // Utilisation de fetch natif (Node 18+)
        const response = await fetch('https://overpass-api.de/api/interpreter', {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain' },
            body: query,
        });
        if (!response.ok)
            throw new Error('API Overpass indisponible');
        const data = await response.json();
        res.json(data);
    }
    catch (error) {
        res.status(500).json({ error: 'Erreur lors de la recherche de pharmacies' });
    }
});
exports.default = router;
//# sourceMappingURL=pharmacies.js.map