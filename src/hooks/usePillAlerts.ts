import { useEffect, useRef, useState, useCallback } from 'react';
import { toast } from 'sonner';

interface Medication {
  id: number;
  name: string;
  dosage?: string;
  times: string[];
  logs: Record<string, boolean>;
}

/**
 * Hook qui gère les notifications, le son, les vibrations et le compteur de prises.
 * @param medications liste des médicaments actifs
 * @returns { pendingCount, missedMeds } pour l'affichage dans l'UI
 */
export function usePillAlerts(medications: Medication[]) {
  const [pendingCount, setPendingCount] = useState(0);
  const [missedMeds, setMissedMeds] = useState<{ name: string; time: string }[]>([]);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Joue un bip synthétique (ne nécessite aucun fichier audio)
  const playBeep = useCallback(() => {
    try {
      if (!audioCtxRef.current) audioCtxRef.current = new AudioContext();
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') ctx.resume();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 880;
      gain.gain.value = 0.1;
      osc.start();
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
      osc.stop(ctx.currentTime + 0.5);
    } catch (e) { /* silencieux si l'API Audio n'est pas supportée */ }
  }, []);

  // Vérifie toutes les 30 secondes les prises imminentes et passées
  useEffect(() => {
    const checkAlerts = () => {
      const now = new Date();
      const currentTime = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
      const today = now.toISOString().split('T')[0];
      let pending = 0;
      const missed: { name: string; time: string }[] = [];

      medications.forEach(med => {
        med.times.forEach(time => {
          const [h, m] = time.split(':').map(Number);
          const medTime = new Date();
          medTime.setHours(h, m, 0, 0);
          const diffMin = (now.getTime() - medTime.getTime()) / 60000;

          if (diffMin >= 0 && diffMin < 1 && !med.logs[time]) {
            // Prise imminente (dans la minute)
            pending++;
            if (Notification.permission === 'granted') {
              new Notification('💊 Rappel de prise', {
                body: `Il est l'heure de prendre : ${med.name} ${med.dosage ? `(${med.dosage})` : ''}`,
                icon: '/icons/icon-192x192.png',
                vibrate: [200, 100, 200],
              });
            }
            playBeep();
            if (navigator.vibrate) navigator.vibrate(500);
            toast.info(`🕐 C'est l'heure de prendre ${med.name} !`);
          } else if (diffMin > 30 && !med.logs[time]) {
            // Oubli de plus de 30 minutes
            missed.push({ name: med.name, time });
          }
        });
      });

      setPendingCount(pending);
      setMissedMeds(missed);
    };

    checkAlerts();
    const interval = setInterval(checkAlerts, 30000);
    return () => clearInterval(interval);
  }, [medications, playBeep]);

  return { pendingCount, missedMeds };
}
