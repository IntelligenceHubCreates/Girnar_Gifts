// providers/QueryProvider.tsx
// Wrap the admin shell in this provider.
// Place at: app/admin/layout.tsx  →  <QueryProvider>{children}</QueryProvider>

'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { useState, type ReactNode } from 'react'

export function QueryProvider({ children }: { children: ReactNode }) {
  // Create client inside component to avoid sharing state across requests in SSR
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Show stale data immediately, refresh in background
            staleTime: 30_000,
            // Retry failed requests twice before showing error state
            retry: 2,
            retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10_000),
            // Keep unused queries in cache for 5 min
            gcTime: 5 * 60_000,
          },
          mutations: {
            retry: 0, // Don't auto-retry mutations (user should retry explicitly)
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* DevTools only shown in development */}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  )
}
