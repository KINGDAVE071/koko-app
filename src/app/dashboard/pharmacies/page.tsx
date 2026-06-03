'use client';

import { useState } from 'react';
import { useLanguage } from '@/i18n/LanguageContext';
import api from '@/lib/api';
import { MapPin, Navigation } from 'lucide-react';

interface Pharmacy {
  id: number;
  name: string;
  lat: number;
  lon: number;
  distance?: number;
  display_name: string;
}

export default function PharmaciesPage() {
  const { t } = useLanguage();
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [location, setLocation] = useState<{ lat: number; lon: number } | null>(null);

  const getUserLocation = () => {
    setError('');
    if (!navigator.geolocation) {
      setError('Géolocalisation non supportée par votre navigateur');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({ lat: position.coords.latitude, lon: position.coords.longitude });
        fetchNearbyPharmacies(position.coords.latitude, position.coords.longitude);
      },
      () => setError('Impossible d\'obtenir votre position. Autorisez la localisation.')
    );
  };

  const fetchNearbyPharmacies = async (lat: number, lon: number) => {
    setLoading(true);
    setError('');
    try {
      // Appeler notre backend proxy
      const res = await api.post('/pharmacies', { lat, lon });
      const data = res.data;
      const results = data.elements.map((el: any) => ({
        id: el.id,
        name: el.tags.name || 'Pharmacie',
        lat: el.lat,
        lon: el.lon,
        distance: getDistanceFromLatLonInKm(lat, lon, el.lat, el.lon),
        display_name: el.tags.name || 'Pharmacie',
      }));
      results.sort((a: Pharmacy, b: Pharmacy) => (a.distance || 0) - (b.distance || 0));
      setPharmacies(results);
      if (results.length === 0) setError('Aucune pharmacie trouvée dans un rayon de 5 km.');
    } catch (e) {
      setError('Erreur lors de la recherche des pharmacies. Vérifiez votre connexion.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">💊 Pharmacies à proximité</h1>
      {!location && (
        <button onClick={getUserLocation} className="w-full py-3 bg-koko-orange text-white font-bold rounded-xl hover:bg-koko-orange-dark transition mb-4">
          <MapPin className="inline w-5 h-5 mr-1" /> Trouver les pharmacies autour de moi
        </button>
      )}
      {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
      {loading && <p className="text-center">Recherche en cours...</p>}
      {pharmacies.length > 0 && (
        <div className="space-y-2">
          {pharmacies.map((pharm) => (
            <div key={pharm.id} className="bg-white dark:bg-koko-blue p-3 rounded-xl shadow-koko flex justify-between items-center">
              <div>
                <p className="font-semibold">{pharm.name}</p>
                <p className="text-sm text-gray-500">À {pharm.distance?.toFixed(1)} km</p>
              </div>
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${pharm.lat},${pharm.lon}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-koko-orange"
              >
                <Navigation size={20} />
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function deg2rad(deg: number) {
  return deg * (Math.PI / 180);
}
