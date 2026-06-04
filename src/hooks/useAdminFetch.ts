'use client'

/**
 * useAdminFetch.ts — merged, production-ready data fetching hook
 *
 * Merged from two versions:
 * - Old: AbortController per effect, fetcher receives AbortSignal
 * - New: tick-based manual refetch, error clearing, cancelled-flag guard
 *
 * Final behaviour:
 * - AbortController cancels stale in-flight requests on dep change
 * - fetcherRef always calls the latest closure (no stale-closure bug)
 * - tick forces a refetch without changing external deps
 * - Error cleared immediately when a new fetch starts
 * - AbortError / cancelled signal ignored silently
 * - fetcher signature is (signal?: AbortSignal) so callers that
 *   don't need the signal (e.g. simple adminFetch wrappers) still work
 */

import { useState, useEffect, useCallback, useRef } from 'react'

export interface FetchState<T> {
  data:    T | null
  loading: boolean
  error:   string | null
  refetch: () => void
}

export function useAdminFetch<T>(
  fetcher: (signal?: AbortSignal) => Promise<T>,
  deps: unknown[] = [],
): FetchState<T> {
  const [data,    setData]    = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState<string | null>(null)
  const [tick,    setTick]    = useState(0)

  // Always holds the latest fetcher closure — never stale
  const fetcherRef = useRef(fetcher)
  fetcherRef.current = fetcher

  const refetch = useCallback(() => setTick((t) => t + 1), [])

  useEffect(() => {
    const controller = new AbortController()

    setLoading(true)
    setError(null)

    fetcherRef.current(controller.signal)
      .then((res) => {
        if (!controller.signal.aborted) {
          setData(res)
          setLoading(false)
        }
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return
        if (err instanceof Error && (err.name === 'AbortError' || err.message === 'AbortError')) return
        const msg = err instanceof Error ? err.message : String(err)
        setError(msg)
        setLoading(false)
      })

    return () => controller.abort()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick, ...deps])

  return { data, loading, error, refetch }
}