import { useEffect, useRef, useState, useCallback } from 'react';
import { toast } from 'sonner';

interface Medication {
  id: number;
  name: string;
  dosage?: string;
  times: string[];
  logs: Record<string, boolean>;
}

export function usePillAlerts(medications: Medication[]) {
  const [pendingCount, setPendingCount] = useState(0);
  const [missedMeds, setMissedMeds] = useState<{ name: string; time: string }[]>([]);
  const lastAlertTime = useRef<number>(0); // timestamp de la dernière alerte

  // Joue un bip court UNIQUEMENT si la dernière alerte date de plus de 60 secondes
  const playBeep = useCallback(() => {
    const now = Date.now();
    if (now - lastAlertTime.current < 60000) return; // pas plus d'une alerte par minute
    lastAlertTime.current = now;

    try {
      const ctx = new AudioContext();
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
    } catch (e) { /* silencieux */ }
  }, []);

  useEffect(() => {
    const checkAlerts = () => {
      const now = new Date();
      const currentTime = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
      let pending = 0;
      const missed: { name: string; time: string }[] = [];
      let shouldNotify = false;

      medications.forEach(med => {
        med.times.forEach(time => {
          const [h, m] = time.split(':').map(Number);
          const medTime = new Date();
          medTime.setHours(h, m, 0, 0);
          const diffMin = (now.getTime() - medTime.getTime()) / 60000;

          if (diffMin >= 0 && diffMin < 1 && !med.logs[time]) {
            pending++;
            shouldNotify = true;
          } else if (diffMin > 30 && !med.logs[time]) {
            missed.push({ name: med.name, time });
          }
        });
      });

      // Une seule notification groupée
      if (shouldNotify && Notification.permission === 'granted') {
        const medNames = medications
          .filter(med => med.times.some(t => {
            const [h, m] = t.split(':').map(Number);
            const medTime = new Date();
            medTime.setHours(h, m, 0, 0);
            const diffMin = (now.getTime() - medTime.getTime()) / 60000;
            return diffMin >= 0 && diffMin < 1 && !med.logs[t];
          }))
          .map(med => med.name)
          .join(', ');

        if (medNames) {
          new Notification('💊 Rappel de prise', {
            body: `C'est l'heure de prendre : ${medNames}`,
            icon: '/icons/icon-192x192.png',
          });
          toast.info(`🕐 C'est l'heure de prendre : ${medNames}`);
          playBeep();
          if (navigator.vibrate) navigator.vibrate(300);
        }
      }

      setPendingCount(pending);
      setMissedMeds(missed);
    };

    checkAlerts();
    const interval = setInterval(checkAlerts, 30000);
    return () => clearInterval(interval);
  }, [medications, playBeep]);

  return { pendingCount, missedMeds };
}
