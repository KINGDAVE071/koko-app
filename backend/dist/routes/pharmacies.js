"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const router = (0, express_1.Router)();
function haversineDistance(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
router.post('/', async (req, res) => {
    const { lat, lon } = req.body;
    if (typeof lat !== 'number' || typeof lon !== 'number') {
        return res.status(400).json({ error: 'Coordonnées GPS invalides' });
    }
    const apiKey = process.env.GEOAPIFY_API_KEY;
    if (!apiKey) {
        return res.status(500).json({ error: 'Clé API Geoapify non configurée' });
    }
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    try {
        const url = `https://api.geoapify.com/v2/places?categories=healthcare.pharmacy&filter=circle:${lon},${lat},5000&limit=50&apiKey=${apiKey}`;
        const response = await fetch(url, { signal: controller.signal });
        if (!response.ok) {
            const errorText = await response.text();
            return res.status(502).json({ error: `Geoapify a répondu ${response.status}: ${errorText}` });
        }
        const data = await response.json();
        const rawPharmacies = (data.features || []).map((feature) => {
            const props = feature.properties;
            const coords = feature.geometry.coordinates;
            const distanceInKm = haversineDistance(lat, lon, coords[1], coords[0]);
            return {
                id: props.place_id,
                name: props.name || 'Pharmacie',
                lat: coords[1],
                lon: coords[0],
                distance: Math.round(distanceInKm * 10) / 10,
                duration: undefined,
                isAirDistance: true,
                address: props.formatted,
                phone: props.phone,
                openingHours: props.opening_hours,
            };
        });
        // Filtrer strictement à 5 km
        const pharmacies = rawPharmacies.filter((p) => p.distance <= 5);
        pharmacies.sort((a, b) => a.distance - b.distance);
        res.json({ pharmacies });
    }
    catch (error) {
        if (error.name === 'AbortError') {
            return res.status(504).json({ error: 'La requête a expiré' });
        }
        res.status(500).json({ error: error.message || 'Erreur interne' });
    }
    finally {
        clearTimeout(timeout);
    }
});
exports.default = router;
//# sourceMappingURL=pharmacies.js.map