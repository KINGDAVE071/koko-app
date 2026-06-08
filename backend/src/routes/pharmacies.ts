import { Router, Request, Response } from 'express';

const router = Router();

router.post('/', async (req: Request, res: Response) => {
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
    const url = `https://api.geoapify.com/v2/places?categories=healthcare.pharmacy&filter=circle:${lon},${lat},5000&limit=20&apiKey=${apiKey}`;
    const response = await fetch(url, { signal: controller.signal });

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(502).json({ error: `Geoapify a répondu ${response.status}: ${errorText}` });
    }

    const data: any = await response.json();
    const pharmacies = (data.features || []).map((feature: any) => {
      const props = feature.properties;
      const coords = feature.geometry.coordinates;
      const distanceInKm = props.distance ? props.distance / 1000 : undefined;
      return {
        id: props.place_id,
        name: props.name || 'Pharmacie',
        lat: coords[1],
        lon: coords[0],
        distance: distanceInKm ? Math.round(distanceInKm * 10) / 10 : undefined,
        duration: undefined,
        isAirDistance: false,
        address: props.formatted,
        phone: props.phone,
        openingHours: props.opening_hours,
      };
    });

    pharmacies.sort((a: any, b: any) => (a.distance || 9999) - (b.distance || 9999));
    res.json({ pharmacies });
  } catch (error: any) {
    if (error.name === 'AbortError') {
      return res.status(504).json({ error: 'La requête a expiré' });
    }
    res.status(500).json({ error: error.message || 'Erreur interne' });
  } finally {
    clearTimeout(timeout);
  }
});

export default router;
