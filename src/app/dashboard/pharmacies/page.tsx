'use client';

import { useState } from 'react';
import api from '@/lib/api';
import { MapPin, Navigation, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface Pharmacy {
  id: number;
  name: string;
  lat: number;
  lon: number;
  distance?: number;
  duration?: number;
  isAirDistance?: boolean;
}

export default function PharmaciesPage() {
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
        fetchPharmacies(position.coords.latitude, position.coords.longitude);
      },
      () => setError('Impossible d\'obtenir votre position. Veuillez autoriser la localisation.')
    );
  };

  const fetchPharmacies = async (lat: number, lon: number) => {
    setLoading(true);
    try {
      const res = await api.post('/pharmacies', { lat, lon });
      setPharmacies(res.data.pharmacies || []);
      if (res.data.pharmacies.length === 0) setError('Aucune pharmacie trouvée dans un rayon de 5 km.');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erreur réseau');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4">
      <div className="flex items-center mb-4">
        <Link href="/dashboard" className="mr-3 text-gray-500 hover:text-koko-orange transition-colors">
          <ArrowLeft size={24} />
        </Link>
        <h1 className="text-2xl font-bold flex-1">💊 Pharmacies à proximité</h1>
      </div>

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
                <p className="text-sm text-gray-500">
                  {pharm.isAirDistance ? '≈ ' : ''}{pharm.distance} km
                  {pharm.isAirDistance && ' (vol d\'oiseau)'}
                  {pharm.duration && ` · ${pharm.duration} min`}
                </p>
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
