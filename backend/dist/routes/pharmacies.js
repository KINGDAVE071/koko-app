"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const router = (0, express_1.Router)();
const USER_AGENT = 'Mozilla/5.0 (compatible; KOKO/1.0)';
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
        const res = await fetch(url, { signal: controller.signal, headers: { 'User-Agent': USER_AGENT } });
        if (res.ok) {
            const data = await res.json();
            if (data.routes?.[0]) {
                return { distance: data.routes[0].distance / 1000, duration: data.routes[0].duration / 60 };
            }
        }
    }
    catch (e) { }
    finally {
        clearTimeout(timeout);
    }
    return null;
}
async function fetchOverpass(query, signal, endpoint = 'https://overpass-api.de/api/interpreter') {
    const params = new URLSearchParams({ data: query });
    const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'application/json',
            'User-Agent': USER_AGENT,
        },
        body: params.toString(),
        signal,
    });
    if (!res.ok) {
        const text = await res.text();
        throw new Error(`Overpass ${res.status}: ${text}`);
    }
    return res.json();
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
        let data;
        // Essayer d'abord le miroir principal
        try {
            data = await fetchOverpass(query, controller.signal);
        }
        catch (e) {
            // Fallback sur un miroir (overpass.kumi.systems)
            try {
                data = await fetchOverpass(query, controller.signal, 'https://overpass.kumi.systems/api/interpreter');
            }
            catch (e2) {
                return res.status(502).json({ error: e2.message || 'Services Overpass indisponibles' });
            }
        }
        const elements = data.elements || [];
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