'use client'

import { useState, useEffect } from 'react'

/**
 * SSR-safe media query hook.
 * Returns false on the server / first paint, then corrects after mount
 * (avoids hydration mismatch). Used to drive drawer mode + scroll lock.
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false)

  useEffect(() => {
    const mql = window.matchMedia(query)
    const onChange = () => setMatches(mql.matches)
    onChange() // sync initial value after mount
    mql.addEventListener('change', onChange)
    return () => mql.removeEventListener('change', onChange)
  }, [query])

  return matches
}