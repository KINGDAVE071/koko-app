import { Router, Request, Response } from 'express';
import fetch from 'node-fetch';

const router = Router();

router.post('/', async (req: Request, res: Response) => {
  const { lat, lon } = req.body;
  if (!lat || !lon) return res.status(400).json({ error: 'Coordonnées GPS requises' });

  try {
    const query = `[out:json];(node["amenity"="pharmacy"](around:5000,${lat},${lon}););out;`;
    const response = await fetch('https://overpass-api.de/api/interpreter', {
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
  } catch (error: any) {
    // Renvoyer le message d'erreur exact
    res.status(500).json({ error: error.message || 'Erreur inconnue' });
  }
});

export default router;
