import { useCallback, useEffect, useRef, useState } from 'react';

export type Flash = { text: string; tone: 'ok' | 'danger' | 'brand' };

// Message de confirmation éphémère (copie, export…).
export function useFlash(duration = 2500) {
  const [flash, setFlash] = useState<Flash | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const show = useCallback((text: string, tone: Flash['tone'] = 'ok') => {
    clearTimeout(timer.current);
    setFlash({ text, tone });
    timer.current = setTimeout(() => setFlash(null), duration);
  }, [duration]);

  useEffect(() => () => clearTimeout(timer.current), []);

  return [flash, show] as const;
}
