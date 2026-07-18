import { useEffect, useRef, useState } from 'react';

export function useGameTimer(running) {
  const [elapsed, setElapsed] = useState(0);
  const startRef = useRef(null);
  const rafRef = useRef(null);

  useEffect(() => {
    if (!running) {
      startRef.current = null;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      return;
    }
    startRef.current = performance.now();
    const tick = (now) => {
      setElapsed(Math.floor((now - startRef.current) / 1000));
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => rafRef.current && cancelAnimationFrame(rafRef.current);
  }, [running]);

  return elapsed;
}

export function useCountdown(seconds, running, onDone) {
  const [remaining, setRemaining] = useState(seconds);
  const startRef = useRef(null);
  const rafRef = useRef(null);
  const firedRef = useRef(false);

  useEffect(() => {
    if (!running) {
      firedRef.current = false;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      return;
    }
    startRef.current = performance.now();
    firedRef.current = false;
    const tick = (now) => {
      const left = seconds - (now - startRef.current) / 1000;
      setRemaining(Math.max(0, left));
      if (left <= 0 && !firedRef.current) {
        firedRef.current = true;
        onDone && onDone();
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => rafRef.current && cancelAnimationFrame(rafRef.current);
  }, [running, seconds, onDone]);

  return remaining;
}