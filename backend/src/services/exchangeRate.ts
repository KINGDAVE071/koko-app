const API_URL = 'https://open.er-api.com/v6/latest/USD';

let cachedData: any = null;
let lastFetch = 0;

export async function getLiveRates() {
  const now = Date.now();
  // Mettre en cache pendant 1 heure
  if (cachedData && (now - lastFetch) < 3600000) {
    return cachedData;
  }
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);
  try {
    const res = await fetch(API_URL, { signal: controller.signal });
    if (!res.ok) throw new Error('Failed to fetch exchange rates');
    const data: any = await res.json();
    if (data.result !== 'success') throw new Error('Invalid response');
    cachedData = data;
    lastFetch = now;
    return data;
  } finally {
    clearTimeout(timeout);
  }
}
