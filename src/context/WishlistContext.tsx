// src/context/WishlistContext.tsx
// ---------------------------------------------------------------------------
// Global wishlist state so the count badge (MobileBottomNav) stays in sync
// with wishlist toggles happening on CategoryPage / ProductPage / anywhere
// else. Mirrors the optimistic-update-with-rollback pattern already used in
// CategoryPage's toggleWishlist (POST/DELETE /api/favorite/:id).
// ---------------------------------------------------------------------------

'use client';

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  ReactNode,
} from 'react';

interface WishlistContextValue {
  wishlist: string[];
  isWishlisted: (id: string) => boolean;
  toggleWishlist: (id: string) => Promise<void>;
  count: number;
}

const WishlistContext = createContext<WishlistContextValue | undefined>(undefined);

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [wishlist, setWishlist] = useState<string[]>([]);

  // Load the user's existing wishlist once on mount.
  useEffect(() => {
    const controller = new AbortController();
    (async () => {
      try {
        const res = await fetch('/api/favorite', { signal: controller.signal });
        if (!res.ok) return;
        const data = await res.json();
        const ids: string[] = Array.isArray(data)
          ? data
          : Array.isArray(data?.data)
            ? data.data.map((p: { id: string }) => p.id)
            : [];
        setWishlist(ids);
      } catch {
        /* non-critical on initial load */
      }
    })();
    return () => controller.abort();
  }, []);

  const toggleWishlist = useCallback(
    async (id: string) => {
      const wasWishlisted = wishlist.includes(id);
      setWishlist((prev) => (wasWishlisted ? prev.filter((x) => x !== id) : [...prev, id]));
      try {
        const res = await fetch(`/api/favorite/${id}`, { method: wasWishlisted ? 'DELETE' : 'POST' });
        if (!res.ok) throw new Error('wishlist request failed');
      } catch {
        // roll back on failure
        setWishlist((prev) => (wasWishlisted ? [...prev, id] : prev.filter((x) => x !== id)));
      }
    },
    [wishlist],
  );

  const isWishlisted = useCallback((id: string) => wishlist.includes(id), [wishlist]);

  return (
    <WishlistContext.Provider
      value={{ wishlist, isWishlisted, toggleWishlist, count: wishlist.length }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist(): WishlistContextValue {
  const ctx = useContext(WishlistContext);
  if (!ctx) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return ctx;
}