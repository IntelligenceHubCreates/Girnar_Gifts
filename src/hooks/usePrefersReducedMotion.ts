'use client';

import { useEffect, useState } from 'react';

/**
 * Shared reduced-motion signal for the Girnar motion system. Every
 * choreographed/entrance animation should read this instead of duplicating
 * the media query, so `prefers-reduced-motion: reduce` is honored uniformly
 * across the whole redesign (see DESIGN_SYSTEM.md - Motion System).
 */
export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(query.matches);
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    query.addEventListener('change', handler);
    return () => query.removeEventListener('change', handler);
  }, []);

  return reduced;
}
