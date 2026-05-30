'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { _get, _post } from '@/shared/fetchwrapper';
import type { UiProduct } from '@/types/product';
import { useCart } from '@/context/CartContext';
import styles from './StationerySpotlight.module.css';

// ─── Constants ────────────────────────────────────────────────────
const PLACEHOLDER = '/images/placeholder-product.png';

const SPOTLIGHT_TAGS = [
  { icon: '✏️', label: 'Pencils',        slug: 'pencils'        },
  { icon: '🖊️', label: 'Pens & Markers', slug: 'pens-markers'   },
  { icon: '📓', label: 'Notebooks',      slug: 'notebooks'      },
  { icon: '✂️', label: 'Craft Supplies', slug: 'craft-supplies'  },
  { icon: '🗂️', label: 'Organizers',     slug: 'organizers'     },
];

type CartState = 'idle' | 'loading' | 'added' | 'error';

// ─── Normalise (identical to FeaturedProducts) ────────────────────
function normalise(p: any): UiProduct {
  const price          = Number(p.original_price ?? p.price ?? 0);
  const amountDiscount = Number(p.amount_discount ?? 0);
  const pctDiscount    = Number(p.percentage_discount ?? 0);

  let sellingPrice = price;
  if (amountDiscount > 0) {
    sellingPrice = price - amountDiscount;
  } else if (pctDiscount > 0) {
    sellingPrice = Math.round(price - (price * pctDiscount) / 100);
  }
  sellingPrice = Math.max(0, Math.min(sellingPrice, price));

  const rawImages = p.product_image ?? p.images ?? [];
  const images: string[] = Array.isArray(rawImages)
    ? rawImages
        .map((img: any) =>
          typeof img === 'string' ? img : (img?.url ?? img?.secure_url ?? '')
        )
        .filter(Boolean)
    : [];

  const stockCount = Number(p.count ?? p.stock ?? p.quantity ?? 0);

  return {
    id:              String(p.id   ?? ''),
    name:            String(p.name ?? ''),
    price:           sellingPrice > 0 ? sellingPrice : price,
    originalPrice:   price,
    images,
    brand:           String(p.brand ?? p.brand_name ?? ''),
    category:        String(p.category ?? ''),
    subcategory:     String(p.sub_category_name ?? p.sub_category_slug ?? p.subcategory ?? p.category ?? ''),
    subcategorySlug: String(p.sub_category_slug ?? p.subcategory_slug ?? ''),
    ageRange:        String(p.age_range ?? p.ageRange ?? ''),
    stars:           Math.min(5, Math.max(0, Number(p.stars ?? p.rating ?? 0))),
    reviews:         Number(p.reviews ?? p.review_count ?? p.reviewCount ?? 0),
    inStock:         stockCount > 0,
    stockCount,
    badges:          Array.isArray(p.badges) ? p.badges : [],
    bgGradient:      Boolean(p.bg_gradient ?? p.bgGradient),
    description:     String(p.description ?? ''),
    emoji:           String(p.emoji ?? ''),
    discountPct:     pctDiscount,
  };
}

const fmt = (n: number) =>
  Number.isFinite(n) && n > 0 ? n.toLocaleString('en-IN') : '0';

// ─── Product image with fallback ──────────────────────────────────
function ProductImg({ src, alt, className }: { src: string; alt: string; className: string }) {
  const [err, setErr] = useState(false);
  const safe = !err && src && (src.startsWith('http') || src.startsWith('/')) ? src : null;
  return safe ? (
    <Image src={safe} alt={alt} fill sizes="(max-width: 768px) 50vw, 20vw"
      className={className} onError={() => setErr(true)} />
  ) : (
    <Image src={PLACEHOLDER} alt={alt} fill sizes="(max-width: 768px) 50vw, 20vw"
      className={className} />
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────
function SkeletonProd() {
  return (
    <div className={styles.skeletonProd}>
      <div className={styles.skeletonImg} />
      <div className={styles.skeletonName} />
      <div className={styles.skeletonPrice} />
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────
export default function StationerySpotlight() {
  const [products,    setProducts]    = useState<UiProduct[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [fetchError,  setFetchError]  = useState(false);
  const [cartStates,  setCartStates]  = useState<Record<string, CartState>>({});
  const [wishlist,    setWishlist]    = useState<Set<string>>(new Set());
  const [wishPending, setWishPending] = useState<Set<string>>(new Set());

  const { dispatch } = useCart();

  // ── Fetch stationery products ──────────────────────────────────
  useEffect(() => {
    setLoading(true);
    setFetchError(false);

    _get('/api/product/all?category_slug=stationery&limit=4')
      .then((res) => {
        const raw: any[] = Array.isArray((res as any)?.data)     ? (res as any).data
          : Array.isArray(res)                                    ? res
          : Array.isArray((res as any)?.products)                ? (res as any).products
          : Array.isArray((res as any)?.items)                   ? (res as any).items
          : [];
        if (raw.length === 0) { setFetchError(true); return; }
        setProducts(raw.slice(0, 4).map(normalise));
      })
      .catch(() => setFetchError(true))
      .finally(() => setLoading(false));
  }, []);

  // ── Fetch wishlist ─────────────────────────────────────────────
  useEffect(() => {
    _get('/api/favorite')
      .then((res) => {
        const items: any[] = Array.isArray(res) ? res
          : Array.isArray((res as any)?.data)   ? (res as any).data
          : [];
        const ids = items
          .map((i) => typeof i === 'string' ? i : String(i.product_id ?? i.productId ?? i.id ?? ''))
          .filter(Boolean);
        setWishlist(new Set(ids));
      })
      .catch(() => {});
  }, []);

  // ── Wishlist toggle (identical logic to FeaturedProducts) ──────
  const toggleWishlist = useCallback(async (id: string) => {
    if (wishPending.has(id)) return;
    const already = wishlist.has(id);
    setWishlist((prev) => { const n = new Set(prev); already ? n.delete(id) : n.add(id); return n; });
    setWishPending((prev) => new Set(prev).add(id));
    try {
      await fetch(`/api/favorite/${id}`, { method: already ? 'DELETE' : 'POST' });
    } catch {
      // rollback on error
      setWishlist((prev) => { const n = new Set(prev); already ? n.add(id) : n.delete(id); return n; });
    } finally {
      setWishPending((prev) => { const n = new Set(prev); n.delete(id); return n; });
    }
  }, [wishlist, wishPending]);

  // ── Add to cart (identical logic to FeaturedProducts) ──────────
  const addToCart = useCallback(async (product: UiProduct) => {
    if (cartStates[product.id] === 'loading') return;
    setCartStates((prev) => ({ ...prev, [product.id]: 'loading' }));

    // Optimistic local dispatch first
    dispatch({
      type: 'ADD_ITEM',
      payload: {
        id:            product.id,
        name:          product.name,
        price:         product.price,
        originalPrice: product.originalPrice,
        quantity:      1,
        image:         product.images[0] ?? '',
        emoji:         product.emoji || '🎁',
        category:      product.category,
        color:         '',
        product_count: 0,
        is_available:  product.inStock,
      },
    });

    try {
      await _post('/api/cart/items', { product_id: product.id, quantity: 1 });
      setCartStates((prev) => ({ ...prev, [product.id]: 'added' }));
      setTimeout(() => setCartStates((prev) => ({ ...prev, [product.id]: 'idle' })), 2000);
    } catch {
      setCartStates((prev) => ({ ...prev, [product.id]: 'error' }));
      setTimeout(() => setCartStates((prev) => ({ ...prev, [product.id]: 'idle' })), 2500);
    }
  }, [cartStates, dispatch]);

  // ── Render ─────────────────────────────────────────────────────
  return (
    <section className={styles.spotlightSection}>
      <div className={styles.spotlightInner}>

        {/* ── Left: text + tags + CTA ── */}
        <div className={styles.spotlightText}>
          <div className={styles.tag}>⭐ Stationery Collection</div>
          <h2>
            Tools That<br />
            <span>Spark Creativity</span>
          </h2>
          <p>
            From vibrant sketch pads to premium gel pens — our curated stationery
            collection turns every desk into a creative studio.
          </p>

          <div className={styles.spotlightItems}>
            {SPOTLIGHT_TAGS.map((tag) => (
              <Link key={tag.label} href={`/category/${tag.slug}`} className={styles.spotlightItem}>
                <span className={styles.tagIcon}>{tag.icon}</span>
                {tag.label}
              </Link>
            ))}
          </div>

          <Link href="/stationery" className={styles.btnPrimary}>
            Explore Stationery →
          </Link>
        </div>

        {/* ── Right: 2×2 product grid ── */}
        <div className={styles.spotlightGrid}>

          {/* Error */}
          {!loading && fetchError && (
            <div className={styles.errorState}>
              <span>⚠️ Could not load products.</span>
              <button type="button" className={styles.retryBtn}
                onClick={() => window.location.reload()}>Retry</button>
            </div>
          )}

          {/* Skeletons */}
          {loading && Array.from({ length: 4 }, (_, i) => <SkeletonProd key={i} />)}

          {/* Real products */}
          {!loading && !fetchError && products.map((product) => {
            const hasImg     = product.images.length > 0;
            const cartState  = cartStates[product.id] ?? 'idle';
            const wishlisted = wishlist.has(product.id);
            const isPending  = wishPending.has(product.id);
            const hasSave    = product.originalPrice > product.price;

            // Cart button icon — same mapping as FeaturedProducts
            const cartIcon =
              cartState === 'loading' ? '⏳'
              : cartState === 'added' ? '✓'
              : cartState === 'error' ? '✗'
              : !product.inStock      ? '✉'
              : '🛒';

            return (
              <div key={product.id} className={styles.spotlightProd}>

                {/* ── Wishlist button ── */}
                <button
                  type="button"
                  className={[
                    styles.wishBtn,
                    wishlisted ? styles.wishlisted : '',
                    isPending  ? styles.wishPending : '',
                  ].filter(Boolean).join(' ')}
                  onClick={() => toggleWishlist(product.id)}
                  disabled={isPending}
                  aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
                  aria-pressed={wishlisted}
                >
                  {isPending ? '⏳' : wishlisted ? '❤️' : '🤍'}
                </button>

                {/* ── Product image (links to PDP) ── */}
                <Link href={`/product/${product.id}`} className={styles.imgLink} aria-label={product.name}>
                  <div className={styles.imgWrapper}>
                    {hasImg ? (
                      <ProductImg src={product.images[0]} alt={product.name} className={styles.prodImg} />
                    ) : (
                      <div className={styles.prodEmoji} aria-hidden="true">
                        {product.emoji || '📦'}
                      </div>
                    )}
                    {!product.inStock && <div className={styles.outOfStock}>Out of Stock</div>}
                  </div>
                </Link>

                {/* ── Bottom row: name+price left, cart button right ── */}
                <div className={styles.cardBottom}>
                  <Link href={`/product/${product.id}`} className={styles.cardInfo}>
                    <div className={styles.sname}>{product.name}</div>
                    <div className={styles.priceRow}>
                      <span className={styles.sprice}>₹{fmt(product.price)}</span>
                      {hasSave && (
                        <span className={styles.soriginal}>₹{fmt(product.originalPrice)}</span>
                      )}
                    </div>
                  </Link>

                  <button
                    type="button"
                    className={[
                      styles.cartBtn,
                      cartState === 'added'   ? styles.cartBtnAdded   : '',
                      cartState === 'error'   ? styles.cartBtnError   : '',
                      cartState === 'loading' ? styles.cartBtnLoading : '',
                      !product.inStock        ? styles.cartBtnDisabled : '',
                    ].filter(Boolean).join(' ')}
                    disabled={!product.inStock || cartState === 'loading'}
                    onClick={() => addToCart(product)}
                    aria-label={product.inStock ? 'Add to cart' : 'Notify me'}
                  >
                    {cartIcon}
                  </button>
                </div>

              </div>
            );
          })}

        </div>
      </div>
    </section>
  );
}