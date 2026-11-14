import { useEffect, useState } from 'react';

/** Counts down from `seconds` to 0; resets when `seconds` changes. */
export function useCountdownSeconds(seconds: number): number {
  const [remaining, setRemaining] = useState(Math.max(0, Math.floor(seconds)));

  useEffect(() => {
    const start = Math.max(0, Math.floor(seconds));
    setRemaining(start);
    if (start <= 0) return;
    const id = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(id);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [seconds]);

  return remaining;
}

export function formatCountdownMmSs(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, '0')}`;
}
