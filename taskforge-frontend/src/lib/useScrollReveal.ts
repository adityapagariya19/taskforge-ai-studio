import { useEffect, useRef, useState } from 'react';

/**
 * Real scroll-triggered reveal via IntersectionObserver — no animation
 * library, no fake "always visible" CSS. Elements genuinely animate in
 * only once they cross into the viewport, and only once (the observer
 * disconnects after the first reveal) so re-scrolling past doesn't
 * re-trigger and feel gimmicky.
 */
export function useScrollReveal<T extends HTMLElement>(threshold = 0.15) {
  const ref = useRef<T | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return { ref, visible };
}
