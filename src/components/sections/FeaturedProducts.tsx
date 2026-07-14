'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { _get, _post, _delete } from '@/shared/fetchwrapper';
import type { UiProduct } from '@/types/product';
import { normaliseProduct, unwrapList, fmtINR as fmt, PLACEHOLDER } from '@/lib/normalise';
import styles from './FeaturedProducts.module.css';
import { useCart } from '@/context/CartContext';
// ─── Constants ────────────────────────────────────────────────────


const BADGE_BG: Record<string, string> = {
  sale:       'var(--gg-accent)',
  new:        'var(--gg-primary)',
  hot:        'var(--gg-primary)',
  bestseller: 'var(--gg-primary)',
};
const BADGE_TEXT: Record<string, string> = {
  sale:       '#fff',
  new:        '#fff',
  hot:        '#fff',
  bestseller: '#fff',
};

// ─── Normalise raw API response to UiProduct ─────────────────────

// ─── ProductImg with fallback ─────────────────────────────────────
function ProductImg({ src, alt, className }: { src: string; alt: string; className: string }) {
  const [err, setErr] = useState(false);
  const safe = !err && src && (src.startsWith('http') || src.startsWith('/')) ? src : null;
  return safe ? (
    <Image src={safe} alt={alt} fill
      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
      className={className} onError={() => setErr(true)} />
  ) : (
    <Image src={PLACEHOLDER} alt={alt} fill
      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
      className={className} />
  );
}

// ─── Card ─────────────────────────────────────────────────────────
interface CardProps {
  product:     UiProduct & { colors?: string[] };
  wishlisted:  boolean;
  wishPending: boolean;
  cartState:   'idle' | 'loading' | 'added' | 'error';
  onWishlist:  () => void;
  onAddToCart: () => void;
  onQuickView: () => void;
}

function FeaturedCard({
  product, wishlisted, wishPending, cartState,
  onWishlist, onAddToCart, onQuickView,
}: CardProps) {
  const stars   = Math.min(5, Math.max(0, Math.round(product.stars)));
  const hasSave = product.originalPrice > product.price && product.originalPrice > 0;
  const hasImg  = product.images.length > 0;
  const colors  = (product as any).colors ?? [];

  const addIcon =
    cartState === 'loading' ? '⏳'
    : cartState === 'added'   ? '✓'
    : cartState === 'error'   ? '✗'
    : !product.inStock        ? '✉'
    : '+';

  return (
    <article className={styles.card}>

      {/* ── Image area ── */}
      <Link href={`/product/${product.id}`} className={styles.cardImgLink} aria-label={product.name}>
        <div
          className={styles.cardImg}
          style={!hasImg && product.bgGradient ? { backgroundImage: `linear-gradient(${product.bgGradient})` } : undefined}
        >
          {hasImg ? (
            <ProductImg src={product.images[0]} alt={product.name} className={styles.cardImageTag} />
          ) : (
            <div className={styles.cardEmojiThumb} aria-hidden="true">{product.emoji || '🎁'}</div>
          )}
          {!product.inStock && <div className={styles.outOfStock}>Out of Stock</div>}

          {/* Badges — top left */}
          {product.badges.length > 0 && (
            <div className={styles.badges}>
              {product.badges.map((b) => (
                <span
                  key={b.label}
                  className={styles.badge}
                  style={{
                    background: BADGE_BG[b.type] ?? 'var(--gg-primary)',
                    color:      BADGE_TEXT[b.type] ?? '#fff',
                  }}
                >
                  {b.label}
                </span>
              ))}
            </div>
          )}

          {/* Quick-view overlay */}
          <div className={styles.cardOverlay} onClick={(e) => { e.preventDefault(); onQuickView(); }}>
            <span className={styles.quickView}>Quick View</span>
          </div>
        </div>
      </Link>

      {/* ── Wishlist heart — top right ── */}
      <button
        className={[
          styles.wishBtn,
          wishlisted  ? styles.wishlisted  : '',
          wishPending ? styles.wishPending  : '',
        ].filter(Boolean).join(' ')}
        onClick={onWishlist}
        disabled={wishPending}
        type="button"
        aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
        aria-pressed={wishlisted}
      >
        {wishPending ? '⏳' : wishlisted ? '❤️' : '🤍'}
      </button>

      {/* ── Body ── */}
      <div className={styles.cardBody}>

        {/* Name */}
        <Link href={`/product/${product.id}`} className={styles.cardNameLink}>
          <h3 className={styles.cardName}>{product.name}</h3>
        </Link>
        

        {/* Category */}
        <div className={styles.cardMeta}>
          <span className={styles.cardCat}>{product.subcategory || product.category}</span>
          {product.ageRange && <span className={styles.cardAge}>· {product.ageRange}</span>}
        </div>

        {/* Stars */}
        <div className={styles.cardStars} aria-label={`${stars} out of 5 stars`}>
          <span>{'★'.repeat(stars)}{'☆'.repeat(5 - stars)}</span>
          <span className={styles.cardReviews}>({product.reviews})</span>
        </div>

        {/* Color swatches — shown only when colors exist */}
        {colors.length > 0 && (
          <div className={styles.colorSwatches}>
            {colors.slice(0, 5).map((color: string, index: number) => (
              <span
                key={index}
                className={styles.swatch}
                style={{ backgroundColor: color }}
                title={color}
              />
            ))}

            {colors.length > 5 && (
              <span className={styles.moreColors}>
                +{colors.length - 5}
              </span>
            )}
  </div>
        )}

        {/* Price + ADD button */}
        <div className={styles.cardBottom}>
          <div className={styles.cardPrice}>
            <span className={styles.priceNow}>₹{fmt(product.price)}</span>
            {hasSave && (
              <div className={styles.priceRow}>
                <span className={styles.priceWas}>₹{fmt(product.originalPrice)}</span>
                <span className={styles.priceOff}>{product.discountPct}% OFF</span>
              </div>
            )}
          </div>
          

          <button
            className={[
              styles.addBtn,
              !product.inStock        ? styles.addBtnDisabled : '',
              cartState === 'added'   ? styles.addBtnAdded    : '',
              cartState === 'error'   ? styles.addBtnError    : '',
              cartState === 'loading' ? styles.addBtnLoading  : '',
            ].filter(Boolean).join(' ')}
            type="button"
            disabled={!product.inStock || cartState === 'loading'}
            onClick={onAddToCart}
            aria-label={product.inStock ? 'Add to cart' : 'Notify me'}
          >
            {addIcon}
          </button>
        </div>

        

      </div>
    </article>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className={styles.skeletonCard}>
      <div className={styles.skeletonImg} />
      <div className={styles.skeletonBody}>
        <div className={styles.skeletonLine} />
        <div className={styles.skeletonLineMed} />
        <div className={styles.skeletonLineShort} />
        <div className={styles.skeletonLineShort} />
        <div className={styles.skeletonLineBtn} />
      </div>
    </div>
  );
}

type CartState = 'idle' | 'loading' | 'added' | 'error';

// ─── Section ──────────────────────────────────────────────────────
export default function FeaturedProducts() {
  const [products,    setProducts]    = useState<(UiProduct & { colors?: string[] })[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [fetchError,  setFetchError]  = useState(false);
  const [wishlist,    setWishlist]    = useState<Set<string>>(new Set());
  const [wishPending, setWishPending] = useState<Set<string>>(new Set());
  const [cartStates,  setCartStates]  = useState<Record<string, CartState>>({});
  const [activeDot,   setActiveDot]   = useState(0);
  const gridRef = useRef<HTMLDivElement>(null);
  const { addItem } = useCart();

  const [quickViewProduct, setQuickViewProduct] = useState<(UiProduct & { colors?: string[] }) | null>(null);
  const [qvActiveImg, setQvActiveImg] = useState(0);
  const [qvQty,       setQvQty]       = useState(1);

  function openQuickView(product: UiProduct & { colors?: string[] }) {
    setQuickViewProduct(product); setQvActiveImg(0); setQvQty(1);
    document.body.style.overflow = 'hidden';
  }
  function closeQuickView() {
    setQuickViewProduct(null);
    document.body.style.overflow = '';
  }
  // Escape closes the modal; body scroll is always restored on unmount.
useEffect(() => {
  if (!quickViewProduct) return;
  const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') closeQuickView(); };
  window.addEventListener('keydown', onKey);
  return () => {
    window.removeEventListener('keydown', onKey);
    document.body.style.overflow = '';
  };
}, [quickViewProduct]);

  // ── Fetch featured products ───────────────────────────────────
const loadFeatured = useCallback(() => {
  setLoading(true); setFetchError(false);
  _get('/api/product/featured')
    .then((res) => {
      setProducts(unwrapList(res).map(normaliseProduct));
      // NOTE: empty array is a valid state, NOT an error.
    })
    .catch(() => setFetchError(true))
    .finally(() => setLoading(false));
}, []);

useEffect(() => { loadFeatured(); }, [loadFeatured]);

  // ── Fetch wishlist ────────────────────────────────────────────
  useEffect(() => {
    _get('/api/favorite')
      .then((res) => {
        const items: any[] = Array.isArray(res) ? res : Array.isArray((res as any)?.data) ? (res as any).data : [];
        const ids = items
          .map((i) => typeof i === 'string' ? i : String(i.product_id ?? i.productId ?? i.id ?? ''))
          .filter(Boolean);
        setWishlist(new Set(ids));
      })
      .catch(() => {});
  }, []);

  // ── Scroll dot tracking ───────────────────────────────────────
  useEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;
    const onScroll = () => {
      const total = grid.scrollWidth - grid.clientWidth;
      if (total <= 0) return;
      const pct = grid.scrollLeft / total;
      const dots = Math.ceil(products.length / 4) || 1;
      setActiveDot(Math.round(pct * (dots - 1)));
    };
    grid.addEventListener('scroll', onScroll, { passive: true });
    return () => grid.removeEventListener('scroll', onScroll);
  }, [products.length]);

  const scrollToDot = (idx: number) => {
    const grid = gridRef.current;
    if (!grid) return;
    const total = grid.scrollWidth - grid.clientWidth;
    const dots  = Math.ceil(products.length / 4) || 1;
    grid.scrollTo({ left: (idx / (dots - 1)) * total, behavior: 'smooth' });
  };

  // ── Wishlist toggle ───────────────────────────────────────────
const toggleWishlist = useCallback(async (id: string) => {
  if (wishPending.has(id)) return;
  const already = wishlist.has(id);

  // optimistic
  setWishlist((prev) => { const n = new Set(prev); already ? n.delete(id) : n.add(id); return n; });
  setWishPending((prev) => new Set(prev).add(id));

  try {
    // Goes through the fetch wrapper: correct FastAPI base URL + bearer token,
    // and the wrapper throws on non-2xx so rollback actually runs.
    if (already) await _delete(`/api/favorite/${id}`);
    else         await _post(`/api/favorite/${id}`, {});
  } catch {
    // rollback
    setWishlist((prev) => { const n = new Set(prev); already ? n.add(id) : n.delete(id); return n; });
    // TODO (recommended): if the wrapper surfaces a 401 here, redirect to
    // /login?next=/ instead of silently un-hearting.
  } finally {
    setWishPending((prev) => { const n = new Set(prev); n.delete(id); return n; });
  }
}, [wishlist, wishPending]);

  // ── Add to cart ───────────────────────────────────────────────
  // Goes through CartContext's addItem, which attaches the auth token and
  // redirects to /login only when the user is genuinely logged out — a
  // hand-rolled _post() here previously sent no Authorization header at
  // all, so it 401'd for every user, logged in or not.
const addToCart = useCallback(async (product: UiProduct & { colors?: string[] }) => {
  if (cartStates[product.id] === 'loading') return;
  setCartStates((prev) => ({ ...prev, [product.id]: 'loading' }));

  const result = await addItem({
    id: product.id,
    name: product.name,
    price: product.price,
    originalPrice: product.originalPrice,
    quantity: 1,
    image: product.images[0] || undefined,
    emoji: product.emoji || '🎁',
    category: product.category,
    is_available: product.inStock,
  });

  if (result.ok) {
    setCartStates((prev) => ({ ...prev, [product.id]: 'added' }));
    setTimeout(() => setCartStates((prev) => ({ ...prev, [product.id]: 'idle' })), 2000);
  } else if (result.error !== 'login_required') {
    setCartStates((prev) => ({ ...prev, [product.id]: 'error' }));
    setTimeout(() => setCartStates((prev) => ({ ...prev, [product.id]: 'idle' })), 2500);
  }
  // login_required: addItem already redirected to /login, nothing left to do here
}, [cartStates, addItem]);

  const dotCount = Math.max(1, Math.ceil(products.length / 4));

  // ── Render ───────────────────────────────────────────────────
  return (
    <section className={styles.productsSection}>

      {/* Header */}
      <div className={styles.sectionHeader}>
        <div className={styles.sectionHeadLeft}>
          <h2 className={styles.sectionTitle}>Featured Products</h2>
          <span className={styles.titleUnderline} />
        </div>
        <Link href="/products" className={styles.viewAll}>
          View All &nbsp;→
        </Link>
      </div>

      {/* Error */}
      {!loading && fetchError && (
        <div className={styles.errorBanner}>
          ⚠️ Could not load featured products.{' '}
          <button onClick={() => window.location.reload()} className={styles.retryBtn} type="button">
            Retry
          </button>
        </div>
      )}

      {/* Empty state — no products marked Featured yet (not an error) */}
      {!loading && !fetchError && products.length === 0 && (
        <div className={styles.emptyState}>
          <span className={styles.emptyEmoji} aria-hidden="true">🌟</span>
          <p className={styles.emptyTitle}>No featured products yet</p>
          <p className={styles.emptyText}>Mark a product as Featured from the admin Products page to show it here.</p>
        </div>
      )}

      {/* Product grid */}
      {(loading || products.length > 0) && (
        <div className={styles.productsGrid} ref={gridRef}>
          {loading
            ? Array.from({ length: 8 }, (_, i) => <SkeletonCard key={i} />)
            : products.map((product) => (
                <FeaturedCard
                  key={product.id}
                  product={product}
                  wishlisted={wishlist.has(product.id)}
                  wishPending={wishPending.has(product.id)}
                  cartState={cartStates[product.id] ?? 'idle'}
                  onWishlist={() => toggleWishlist(product.id)}
                  onAddToCart={() => addToCart(product)}
                  onQuickView={() => openQuickView(product)}
                />
              ))}
        </div>
      )}

      {/* Scroll indicator dots */}
      {!loading && dotCount > 1 && (
        <div className={styles.scrollDots}>
          {Array.from({ length: dotCount }, (_, i) => (
            <button
              key={i}
              type="button"
              className={[styles.dot, i === activeDot ? styles.dotActive : ''].filter(Boolean).join(' ')}
              onClick={() => scrollToDot(i)}
              aria-label={`Go to page ${i + 1}`}
            />
          ))}
        </div>
      )}

      {/* Quick View Modal */}
      {quickViewProduct && (
        <div
          className={styles.qvOverlay}
          onClick={closeQuickView}
          role="dialog"
          aria-modal="true"
          aria-label={`Quick view: ${quickViewProduct.name}`}
        >
          <div className={styles.qvModal} onClick={(e) => e.stopPropagation()}>
            <button className={styles.qvClose} onClick={closeQuickView} type="button" aria-label="Close">✕</button>
            <div className={styles.qvGrid}>

              {/* Left — Images */}
              <div className={styles.qvImgCol}>
                <div className={styles.qvMainImg}>
                  {quickViewProduct.images[qvActiveImg] ? (
                    <Image
                      src={quickViewProduct.images[qvActiveImg]}
                      alt={quickViewProduct.name}
                      fill
                      sizes="(max-width: 768px) 100vw, 45vw"
                      className={styles.qvMainImgTag}
                    />
                  ) : (
                    <div className={styles.qvEmojiThumb}>{quickViewProduct.emoji || '🎁'}</div>
                  )}
                  {quickViewProduct.badges.length > 0 && (
                    <div className={styles.qvBadges}>
                      {quickViewProduct.badges.map((b) => (
                        <span
                          key={b.label}
                          className={styles.qvBadge}
                          style={{ background: BADGE_BG[b.type] ?? 'var(--gg-primary)', color: BADGE_TEXT[b.type] ?? '#fff' }}
                        >
                          {b.label}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                {quickViewProduct.images.length > 1 && (
                  <div className={styles.qvThumbs}>
                    {quickViewProduct.images.map((img, i) => (
                      <button
                        key={i}
                        type="button"
                        className={`${styles.qvThumb} ${i === qvActiveImg ? styles.qvThumbActive : ''}`}
                        onClick={() => setQvActiveImg(i)}
                      >
                        <Image src={img} alt={`View ${i + 1}`} fill sizes="56px" className={styles.qvThumbImg} />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Right — Info */}
              <div className={styles.qvInfoCol}>
                <div className={styles.qvCategory}>{quickViewProduct.subcategory || quickViewProduct.category}</div>
                <h2 className={styles.qvName}>{quickViewProduct.name}</h2>
                {quickViewProduct.brand && <div className={styles.qvBrand}>by {quickViewProduct.brand}</div>}
                <div className={styles.qvStars}>
                  {'★'.repeat(Math.round(quickViewProduct.stars))}
                  {'☆'.repeat(5 - Math.round(quickViewProduct.stars))}
                  <span className={styles.qvReviews}>({quickViewProduct.reviews} reviews)</span>
                </div>
                <div className={styles.qvPrice}>
                  <span className={styles.qvPriceNow}>₹{fmt(quickViewProduct.price)}</span>
                  {quickViewProduct.originalPrice > quickViewProduct.price && (
                    <>
                      <span className={styles.qvPriceWas}>₹{fmt(quickViewProduct.originalPrice)}</span>
                      <span className={styles.qvPriceSave}>Save ₹{fmt(quickViewProduct.originalPrice - quickViewProduct.price)}</span>
                    </>
                  )}
                </div>
                <div className={quickViewProduct.inStock ? styles.qvInStock : styles.qvOutStock}>
                  {quickViewProduct.inStock ? '✅ In Stock' : '❌ Out of Stock'}
                </div>
                {quickViewProduct.description && (
                  <p className={styles.qvDesc}>{quickViewProduct.description}</p>
                )}
                <div className={styles.qvActions}>
                  <div className={styles.qvQty}>
                    <button
                      type="button"
                      className={styles.qvQtyBtn}
                      onClick={() => setQvQty((q) => Math.max(1, q - 1))}
                      disabled={qvQty <= 1}
                    >−</button>
                    <span className={styles.qvQtyNum}>{qvQty}</span>
                    <button
                      type="button"
                      className={styles.qvQtyBtn}
                      onClick={() => setQvQty((q) => q + 1)}
                      disabled={!quickViewProduct.inStock}
                    >+</button>
                  </div>
                  <button
                    type="button"
                    className={`${styles.qvAddBtn} ${
                      cartStates[quickViewProduct.id] === 'added'   ? styles.qvAddBtnAdded   :
                      cartStates[quickViewProduct.id] === 'error'   ? styles.qvAddBtnError   :
                      cartStates[quickViewProduct.id] === 'loading' ? styles.qvAddBtnLoading : ''
                    }`}
                    disabled={!quickViewProduct.inStock || cartStates[quickViewProduct.id] === 'loading'}
                    onClick={() => addToCart(quickViewProduct)}
                  >
                    {cartStates[quickViewProduct.id] === 'loading' ? 'Adding…'
                     : cartStates[quickViewProduct.id] === 'added'   ? '✓ Added to Cart!'
                     : cartStates[quickViewProduct.id] === 'error'   ? '✗ Try Again'
                     : '🛒 Add to Cart'}
                  </button>
                </div>
                <Link
                  href={`/product/${quickViewProduct.id}`}
                  className={styles.qvFullLink}
                  onClick={closeQuickView}
                >
                  View Full Details →
                </Link>
              </div>

            </div>
          </div>
        </div>
      )}

    </section>
  );
}