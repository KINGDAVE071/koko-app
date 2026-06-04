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
async function getOSRMData(lon1, lat1, lon2, lat2) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    try {
        const url = `https://router.project-osrm.org/route/v1/driving/${lon1},${lat1};${lon2},${lat2}?overview=false`;
        const res = await fetch(url, { signal: controller.signal });
        if (res.ok) {
            const data = await res.json();
            if (data.routes && data.routes.length > 0) {
                return {
                    distance: data.routes[0].distance / 1000,
                    duration: data.routes[0].duration / 60,
                };
            }
        }
    }
    catch (e) {
        // fallback plus tard
    }
    finally {
        clearTimeout(timeout);
    }
    return null;
}
router.post('/', async (req, res) => {
    const { lat, lon } = req.body;
    if (typeof lat !== 'number' || typeof lon !== 'number') {
        return res.status(400).json({ error: 'Coordonnées GPS invalides' });
    }
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    try {
        const query = `[out:json];(node["amenity"="pharmacy"](around:5000,${lat},${lon}););out;`;
        const params = new URLSearchParams();
        params.append('data', query);
        const overpassRes = await fetch('https://overpass-api.de/api/interpreter', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Accept': 'application/json',
            },
            body: params.toString(),
            signal: controller.signal,
        });
        if (!overpassRes.ok) {
            const errorText = await overpassRes.text();
            return res.status(502).json({ error: `Overpass a répondu ${overpassRes.status}: ${errorText}` });
        }
        const overpassData = await overpassRes.json();
        const elements = overpassData.elements || [];
        const pharmacies = [];
        for (let i = 0; i < elements.length; i++) {
            const el = elements[i];
            const pharmLat = el.lat;
            const pharmLon = el.lon;
            let distance;
            let duration;
            let isAirDistance = false;
            if (i < 10) {
                const osrm = await getOSRMData(lon, lat, pharmLon, pharmLat);
                if (osrm) {
                    distance = osrm.distance;
                    duration = osrm.duration;
                }
                else {
                    distance = haversineDistance(lat, lon, pharmLat, pharmLon);
                    isAirDistance = true;
                }
            }
            else {
                distance = haversineDistance(lat, lon, pharmLat, pharmLon);
                isAirDistance = true;
            }
            pharmacies.push({
                id: el.id,
                name: el.tags?.name || 'Pharmacie',
                lat: pharmLat,
                lon: pharmLon,
                distance: Math.round(distance * 10) / 10,
                duration: duration ? Math.round(duration) : undefined,
                isAirDistance,
            });
        }
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