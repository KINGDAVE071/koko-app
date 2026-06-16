'use client';

import { useState } from 'react';
import api from '@/lib/api';
import { MapPin, Navigation, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface Pharmacy {
  id: string;
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
    <div className="p-4 min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 dark:from-[#0F172A] dark:via-[#1E293B] dark:to-[#0F172A]">
      <div className="flex items-center mb-4">
        <Link href="/dashboard" className="mr-3 text-gray-500 dark:text-gray-400 hover:text-koko-orange">
          <ArrowLeft size={24} />
        </Link>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex-1">💊 Pharmacies à proximité</h1>
      </div>

      {!location && (
        <button
          onClick={getUserLocation}
          className="w-full py-3 rounded-xl bg-koko-orange hover:bg-koko-orange-dark text-white font-bold transition-colors shadow-lg hover:shadow-koko-orange/30 mb-4 flex items-center justify-center gap-2"
        >
          <MapPin size={20} /> Trouver les pharmacies autour de moi
        </button>
      )}

      {error && (
        <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-400 text-sm">
          {error}
        </div>
      )}

      {loading && (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">Recherche en cours...</div>
      )}

      <div className="space-y-2">
        {pharmacies.map((pharm) => (
          <div
            key={pharm.id}
            className="bg-white/70 dark:bg-gray-900/70 backdrop-blur-md border border-koko-orange/20 rounded-xl p-3 flex justify-between items-center shadow-sm"
          >
            <div>
              <p className="font-semibold text-gray-800 dark:text-white">{pharm.name}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {pharm.isAirDistance ? '≈ ' : ''}{pharm.distance} km
                {pharm.isAirDistance && ' (vol d\'oiseau)'}
                {pharm.duration && ` · ${pharm.duration} min`}
              </p>
            </div>
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${pharm.lat},${pharm.lon}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 px-3 py-2 rounded-lg bg-koko-orange hover:bg-koko-orange-dark text-white text-sm font-medium transition-colors"
            >
              <Navigation size={16} /> Itinéraire
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}
