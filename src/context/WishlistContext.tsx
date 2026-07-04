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
import { useSession } from 'next-auth/react';

interface WishlistContextValue {
  wishlist: string[];
  isWishlisted: (id: string) => boolean;
  toggleWishlist: (id: string) => Promise<void>;
  count: number;
}

const WishlistContext = createContext<WishlistContextValue | undefined>(undefined);

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [wishlist, setWishlist] = useState<string[]>([]);
  const { data: session, status } = useSession();
  const token = (session as any)?.backendToken as string | undefined;

  useEffect(() => {
    if (status !== 'authenticated' || !token) return;
    const controller = new AbortController();
    (async () => {
      try {
        const res = await fetch('/api/favorite', {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        });
        if (!res.ok) return;
        const data = await res.json();
        const rawList: any[] = Array.isArray(data)
          ? data
          : (data?.favorites ?? data?.data ?? []);
        const ids: string[] = rawList.map((item: any) =>
          String(item?.product?.id ?? item?.id ?? item),
        ).filter(Boolean);
        setWishlist(ids);
      } catch { /* non-critical */ }
    })();
    return () => controller.abort();
  }, [status, token]);

  const toggleWishlist = useCallback(
    async (id: string) => {
      const wasWishlisted = wishlist.includes(id);
      setWishlist((prev) => (wasWishlisted ? prev.filter((x) => x !== id) : [...prev, id]));
      try {
        const res = await fetch(`/api/favorite/${id}`, {
          method: wasWishlisted ? 'DELETE' : 'POST',
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!res.ok) throw new Error('wishlist request failed');
      } catch {
        setWishlist((prev) => (wasWishlisted ? [...prev, id] : prev.filter((x) => x !== id)));
      }
    },
    [wishlist, token],
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