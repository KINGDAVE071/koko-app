import { Router, Request, Response } from 'express';

const router = Router();

router.post('/', async (req: Request, res: Response) => {
  const { lat, lon } = req.body;
  if (typeof lat !== 'number' || typeof lon !== 'number') return res.status(400).json({ error: 'Coordonnées GPS invalides' });
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const query = `[out:json];(node["amenity"="pharmacy"](around:5000,${lat},${lon}););out;`;
    const params = new URLSearchParams();
    params.append('data', query);
    const response = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
      signal: controller.signal,
    });
    if (!response.ok) {
      const errorText = await response.text();
      return res.status(502).json({ error: `Overpass a répondu ${response.status}: ${errorText}` });
    }
    const data = await response.json();
    res.json(data);
  } catch (error: any) {
    if (error.name === 'AbortError') return res.status(504).json({ error: 'La requête vers le service de recherche a expiré' });
    res.status(500).json({ error: error.message || 'Erreur interne' });
  } finally {
    clearTimeout(timeout);
  }
});

export default router;
