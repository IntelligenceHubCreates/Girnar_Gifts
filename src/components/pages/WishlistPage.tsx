'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSession } from 'next-auth/react';
import { useWishlist } from '@/context/WishlistContext';
import { useCart } from '@/context/CartContext';
import { mapProduct } from '@/lib/mapProduct';
import type { UiProduct } from '@/types/products';
import styles from './WishlistPage.module.css';

function ProductImg({ src, alt }: { src: string; alt: string }) {
  const [errored, setErrored] = useState(false);
  if (!src || errored) {
    return <div className={styles.imgFallback} aria-hidden="true">🎁</div>;
  }
  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes="(max-width: 600px) 50vw, (max-width: 1024px) 33vw, 240px"
      className={styles.cardImg}
      onError={() => setErrored(true)}
    />
  );
}

export default function WishlistPage() {
  const { data: session, status } = useSession();
  const { toggleWishlist } = useWishlist();
  const { addItem } = useCart();

  const [products, setProducts] = useState<UiProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [addedId, setAddedId] = useState<string | null>(null);

  const token = (session as any)?.backendToken as string | undefined;

  useEffect(() => {
    if (status === 'loading') return;
    if (status !== 'authenticated' || !token) {
      setLoading(false);
      return;
    }

    const controller = new AbortController();

    fetch('/api/favorite', {
      headers: { Authorization: `Bearer ${token}` },
      signal: controller.signal,
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((res) => {
        if (!res || controller.signal.aborted) return;
        const rawList: any[] = Array.isArray(res)
          ? res
          : (res?.favorites ?? res?.data ?? []);
        const mapped: UiProduct[] = rawList
          .map((item: any) => {
            const raw = item?.product ?? item;
            try { return mapProduct(raw); } catch { return null; }
          })
          .filter((p): p is UiProduct => p !== null);
        setProducts(mapped);
        setLoading(false);
      })
      .catch(() => setLoading(false));

    return () => controller.abort();
  }, [status, token]);

  const handleRemove = useCallback(
    (id: string) => {
      setProducts((prev) => prev.filter((p) => p.id !== id));
      toggleWishlist(id);
    },
    [toggleWishlist],
  );

  const handleAdd = useCallback(
    async (product: UiProduct) => {
      await addItem({
        id: product.id,
        name: product.name,
        price: product.price,
        originalPrice: product.originalPrice,
        quantity: 1,
        image: product.images[0] ?? '',
        emoji: product.emoji || '🎁',
        category: product.category,
        color: product.colors[0]?.label ?? '',
        product_count: product.stockCount,
        is_available: product.inStock,
      });
      setAddedId(product.id);
      setTimeout(() => setAddedId(null), 1800);
    },
    [addItem],
  );

  if (status === 'unauthenticated') {
    return (
      <div className={styles.page}>
        <div className={styles.pageHeader}>
          <h1 className={styles.pageTitle}>My Wishlist</h1>
        </div>
        <div className={styles.empty}>
          <div className={styles.emptyEmoji}>🔐</div>
          <h2>Sign in to see your wishlist</h2>
          <p>Save products you love and find them here anytime.</p>
          <Link href="/login?callbackUrl=/wishlist" className={styles.emptyBtn}>
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div className={styles.pageHeaderInner}>
          <nav className={styles.breadcrumb} aria-label="Breadcrumb">
            <Link href="/">Home</Link>
            <span className={styles.breadSep}>›</span>
            <span className={styles.breadCurrent}>Wishlist</span>
          </nav>
          <div className={styles.headerRow}>
            <div>
              <h1 className={styles.pageTitle}>
                My Wishlist
                {!loading && products.length > 0 && (
                  <span className={styles.count}>{products.length}</span>
                )}
              </h1>
              {!loading && products.length > 0 && (
                <p className={styles.pageDesc}>Items you&apos;ve saved for later</p>
              )}
            </div>
            <div className={styles.heartIllustration} aria-hidden="true">
              <span>❤️</span>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className={styles.grid}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className={styles.skeleton}>
              <div className={styles.skeletonImg} />
              <div className={styles.skeletonLine} />
              <div className={styles.skeletonLineShort} />
            </div>
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className={styles.empty}>
          <div className={styles.emptyEmoji}>🤍</div>
          <h2>Your wishlist is empty</h2>
          <p>Browse products and tap the heart icon to save them here.</p>
          <Link href="/products" className={styles.emptyBtn}>
            Explore Products
          </Link>
        </div>
      ) : (
        <div className={styles.grid}>
          {products.map((product) => {
            const discountPct =
              product.originalPrice > product.price
                ? Math.round(
                    ((product.originalPrice - product.price) / product.originalPrice) * 100,
                  )
                : 0;
            const added = addedId === product.id;

            return (
              <div key={product.id} className={styles.card}>
                <div className={styles.cardImgWrap}>
                  <Link href={`/product/${product.id}`} className={styles.cardImgLink}>
                    <ProductImg src={product.images[0]} alt={product.name} />
                  </Link>

                  {product.badges.length > 0 && (
                    <div className={styles.badgeStack}>
                      <span
                        className={
                          product.badges[0].type === 'new'
                            ? styles.badgeNew
                            : styles.badgeSale
                        }
                      >
                        {product.badges[0].label}
                      </span>
                    </div>
                  )}

                  <button
                    className={`${styles.wishBtn} ${styles.wishActive}`}
                    onClick={() => handleRemove(product.id)}
                    aria-label="Remove from wishlist"
                    type="button"
                  >
                    ❤️
                  </button>

                  {!product.inStock && <div className={styles.soldOut}>Sold Out</div>}
                </div>

                <div className={styles.cardBody}>
                  <span className={styles.cardBrand}>{product.brand}</span>
                  <Link href={`/product/${product.id}`} className={styles.cardName}>
                    {product.name}
                  </Link>

                  <div className={styles.cardPriceRow}>
                    <span className={styles.cardPrice}>
                      ₹{product.price.toLocaleString('en-IN')}
                    </span>
                    {discountPct > 0 && (
                      <>
                        <span className={styles.cardOldPrice}>
                          ₹{product.originalPrice.toLocaleString('en-IN')}
                        </span>
                        <span className={styles.cardSave}>{discountPct}% off</span>
                      </>
                    )}
                  </div>

                  <button
                    className={`${styles.addBtn} ${added ? styles.addBtnDone : ''}`}
                    onClick={() => handleAdd(product)}
                    disabled={!product.inStock}
                    type="button"
                  >
                    {!product.inStock ? 'Out of Stock' : added ? '✓ Added' : 'Add to Cart'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
