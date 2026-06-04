'use client';

import { useState } from 'react';
import api from '@/lib/api';
import { MapPin, Navigation, Clock } from 'lucide-react';

interface Pharmacy {
  id: number;
  name: string;
  lat: number;
  lon: number;
  distance: number;
  duration?: number;
  isAirDistance: boolean;
}

export default function PharmaciesPage() {
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const getUserLocation = () => {
    setError('');
    if (!navigator.geolocation) {
      setError('Géolocalisation non supportée');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => fetchPharmacies(pos.coords.latitude, pos.coords.longitude),
      () => setError('Veuillez autoriser la localisation dans les paramètres')
    );
  };

  const fetchPharmacies = async (lat: number, lon: number) => {
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/pharmacies', { lat, lon });
      setPharmacies(res.data.pharmacies || []);
      if ((res.data.pharmacies || []).length === 0) {
        setError('Aucune pharmacie trouvée dans un rayon de 5 km.');
      }
    } catch (err: any) {
      if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else {
        setError('Erreur réseau, vérifiez votre connexion.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">💊 Pharmacies à proximité</h1>
      <button
        onClick={getUserLocation}
        disabled={loading}
        className="w-full py-3 bg-koko-orange text-white font-bold rounded-xl hover:bg-koko-orange-dark transition disabled:opacity-50 mb-4"
      >
        <MapPin className="inline mr-2" size={20} />
        {loading ? 'Recherche...' : 'Trouver les pharmacies autour de moi'}
      </button>
      {error && (
        <div className="bg-red-100 dark:bg-red-900 p-3 rounded-xl text-red-700 dark:text-red-200 mb-4">
          {error}
        </div>
      )}
      <div className="space-y-3">
        {pharmacies.map((pharm) => (
          <div
            key={pharm.id}
            className="bg-white dark:bg-koko-blue p-3 rounded-xl shadow-koko flex items-center justify-between"
          >
            <div>
              <p className="font-semibold">{pharm.name}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                <span>
                  {pharm.isAirDistance ? '≈ ' : ''}{pharm.distance} km
                  {pharm.isAirDistance && ' (vol d\'oiseau)'}
                </span>
                {pharm.duration && (
                  <span className="flex items-center">
                    <Clock size={14} className="mr-1" /> {pharm.duration} min
                  </span>
                )}
              </p>
            </div>
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${pharm.lat},${pharm.lon}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-koko-orange hover:text-koko-orange-dark transition"
            >
              <Navigation size={20} />
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}
