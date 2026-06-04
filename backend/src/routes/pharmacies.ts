import { Router, Request, Response } from 'express';

const router = Router();

const USER_AGENT = 'Mozilla/5.0 (compatible; KOKO/1.0)';

// Haversine distance (fallback)
function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// OSRM routing (timeout 6s)
async function getOSRMData(lon1: number, lat1: number, lon2: number, lat2: number) {
  const url = `https://router.project-osrm.org/route/v1/driving/${lon1},${lat1};${lon2},${lat2}?overview=false`;
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(6000),  // timeout per-request
      headers: { 'User-Agent': USER_AGENT },
    });
    if (res.ok) {
      const data: any = await res.json();
      if (data.routes?.[0]) {
        return {
          distance: data.routes[0].distance / 1000,
          duration: data.routes[0].duration / 60,
        };
      }
    }
  } catch (e) {}
  return null;
}

// Overpass API avec timeout (10s) et fallback entre deux miroirs
async function fetchOverpass(query: string, endpoint: string): Promise<any> {
  const params = new URLSearchParams({ data: query });
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json',
      'User-Agent': USER_AGENT,
    },
    body: params.toString(),
    signal: AbortSignal.timeout(10000),  // 10 secondes
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Overpass ${res.status}: ${text}`);
  }
  return res.json();
}

router.post('/', async (req: Request, res: Response) => {
  const { lat, lon } = req.body;
  if (typeof lat !== 'number' || typeof lon !== 'number') {
    return res.status(400).json({ error: 'Coordonnées GPS invalides' });
  }

  const query = `[out:json];(node["amenity"="pharmacy"](around:5000,${lat},${lon}););out;`;
  const endpoints = [
    'https://overpass-api.de/api/interpreter',
    'https://overpass.kumi.systems/api/interpreter',
  ];

  let overpassData: any;
  let lastError: string = '';

  // Essaie chaque endpoint successivement
  for (const endpoint of endpoints) {
    try {
      overpassData = await fetchOverpass(query, endpoint);
      break;  // succès, on sort de la boucle
    } catch (e: any) {
      lastError = e.message;
      continue;
    }
  }

  if (!overpassData) {
    return res.status(502).json({ error: `Tous les services Overpass ont échoué. ${lastError}` });
  }

  const elements = overpassData.elements || [];
  const pharmacies = [];
  for (let i = 0; i < elements.length; i++) {
    const el = elements[i];
    const pharmLat = el.lat;
    const pharmLon = el.lon;
    let distance: number;
    let duration: number | undefined;
    let isAirDistance = false;

    if (i < 10) {
      const osrm = await getOSRMData(lon, lat, pharmLon, pharmLat);
      if (osrm) {
        distance = osrm.distance;
        duration = osrm.duration;
      } else {
        distance = haversineDistance(lat, lon, pharmLat, pharmLon);
        isAirDistance = true;
      }
    } else {
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
});

export default router;
