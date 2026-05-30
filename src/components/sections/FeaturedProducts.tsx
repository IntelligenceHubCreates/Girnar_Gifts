'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { _get, _post } from '@/shared/fetchwrapper';
import type { UiProduct } from '@/types/product';
import styles from './FeaturedProducts.module.css';
import { useCart } from '@/context/CartContext';

// ─── Constants ────────────────────────────────────────────────────
const PLACEHOLDER = '/images/placeholder-product.png';

const BADGE_BG: Record<string, string> = {
  sale: '#FF6B5B',
  new:  '#3ECFB2',
  hot:  '#FFD336',
};
const BADGE_TEXT: Record<string, string> = {
  sale: '#fff',
  new:  '#fff',
  hot:  '#1A2540',
};

// ─── Normalise raw API response to UiProduct ─────────────────────
function normalise(p: any): UiProduct {
  const price = Number(p.original_price ?? p.price ?? 0);
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
    ? rawImages.map((img: any) =>
        typeof img === 'string' ? img : (img?.url ?? img?.secure_url ?? '')
      ).filter(Boolean)
    : [];

  const badges: { label: string; type: 'sale' | 'new' | 'hot' }[] = Array.isArray(p.badges)
    ? p.badges
    : pctDiscount > 0
    ? [{ label: `${pctDiscount}% OFF`, type: 'sale' as const }]
    : amountDiscount > 0
    ? [{ label: `Save ₹${amountDiscount}`, type: 'sale' as const }]
    : [];

  const stockCount = Number(p.count ?? p.stock ?? p.quantity ?? 0);

  return {
    id:            String(p.id   ?? ''),
    name:          String(p.name ?? ''),
    price:         sellingPrice > 0 ? sellingPrice : price,
    originalPrice: price,
    images,
    brand:         String(p.brand ?? p.brand_name ?? ''),
    category:      String(p.category ?? ''),
    subcategory:   String(p.sub_category_name ?? p.sub_category_slug ?? p.subcategory ?? p.category ?? ''),
    subcategorySlug: String(p.sub_category_slug ?? p.subcategory_slug ?? ''),
    ageRange:      String(p.age_range  ?? p.ageRange ?? ''),
    stars:         Math.min(5, Math.max(0, Number(p.stars ?? p.rating ?? 0))),
    reviews:       Number(p.reviews ?? p.review_count ?? p.reviewCount ?? 0),
    inStock:       stockCount > 0,
    stockCount,
    badges,
    bgGradient:    Boolean(p.bg_gradient ?? p.bgGradient),
    description:   String(p.description ?? ''),
    emoji:         String(p.emoji ?? ''),
    discountPct:   pctDiscount,
  };
}

const fmt = (n: number) =>
  Number.isFinite(n) && n > 0 ? n.toLocaleString('en-IN') : '0';

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
  product:     UiProduct;
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
  const stars  = Math.min(5, Math.max(0, Math.round(product.stars)));
  const hasSave = product.originalPrice > product.price && product.originalPrice > 0;
  const saving  = hasSave ? product.originalPrice - product.price : 0;
  const hasImg  = product.images.length > 0;

  const addIcon =
    cartState === 'loading' ? '⏳'
    : cartState === 'added'   ? '✓'
    : cartState === 'error'   ? '✗'
    : !product.inStock        ? '✉'
    : '🛒';

  return (
    <article className={styles.card}>

      {/* ── Image ── */}
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
          {product.badges.length > 0 && (
            <div className={styles.badges}>
              {product.badges.map((b) => (
                <span key={b.label} className={styles.badge}
                  style={{ background: BADGE_BG[b.type] ?? '#ccc', color: BADGE_TEXT[b.type] ?? '#000' }}>
                  {b.label}
                </span>
              ))}
            </div>
          )}
          <div className={styles.cardOverlay} onClick={(e) => { e.preventDefault(); onQuickView(); }}>
            <span className={styles.quickView}>Quick View</span>
          </div>
        </div>
      </Link>

      {/* ── Wishlist heart ── */}
      <button
        className={[styles.wishBtn, wishlisted ? styles.wishlisted : '', wishPending ? styles.wishPending : ''].filter(Boolean).join(' ')}
        onClick={onWishlist} disabled={wishPending} type="button"
        aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'} aria-pressed={wishlisted}>
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
          {product.ageRange && <span className={styles.cardAge}>👶 {product.ageRange}</span>}
        </div>

        {/* Stars */}
        <div className={styles.cardStars} aria-label={`${stars} out of 5 stars`}>
          {'★'.repeat(stars)}{'☆'.repeat(5 - stars)}
          <span className={styles.cardReviews}>({product.reviews})</span>
        </div>

        {/* Price + round + button */}
        <div className={styles.cardBottom}>
          <div className={styles.cardPrice}>
            <span className={styles.priceNow}>₹{fmt(product.price)}</span>
            {hasSave && (
              <div className={styles.priceRow}>
                <span className={styles.priceWas}>₹{fmt(product.originalPrice)}</span>
                <span className={styles.priceSave}>Save ₹{fmt(saving)}</span>
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
  const [products,    setProducts]    = useState<UiProduct[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [fetchError,  setFetchError]  = useState(false);
  const [wishlist,    setWishlist]    = useState<Set<string>>(new Set());
  const [wishPending, setWishPending] = useState<Set<string>>(new Set());
  const [cartStates,  setCartStates]  = useState<Record<string, CartState>>({});
  const { dispatch } = useCart();

  const [quickViewProduct,  setQuickViewProduct]  = useState<UiProduct | null>(null);
  const [qvActiveImg, setQvActiveImg] = useState(0);
  const [qvQty,       setQvQty]       = useState(1);

  function openQuickView(product: UiProduct) {
    setQuickViewProduct(product); setQvActiveImg(0); setQvQty(1);
    document.body.style.overflow = 'hidden';
  }
  function closeQuickView() {
    setQuickViewProduct(null);
    document.body.style.overflow = '';
  }

  // ── Fetch featured products ────────────────────────────────────
  useEffect(() => {
    setLoading(true); setFetchError(false);
    _get('/api/product/featured')
      .then((res) => {
        const raw: any[] = Array.isArray(res) ? res
          : Array.isArray((res as any)?.products) ? (res as any).products
          : Array.isArray((res as any)?.data)     ? (res as any).data
          : Array.isArray((res as any)?.items)    ? (res as any).items
          : [];
        if (raw.length === 0) { setFetchError(true); return; }
        setProducts(raw.map(normalise));
      })
      .catch(() => setFetchError(true))
      .finally(() => setLoading(false));
  }, []);

  // ── Fetch wishlist ─────────────────────────────────────────────
  useEffect(() => {
    _get('/api/favorite')
      .then((res) => {
        const items: any[] = Array.isArray(res) ? res : Array.isArray((res as any)?.data) ? (res as any).data : [];
        const ids = items.map((i) => typeof i === 'string' ? i : String(i.product_id ?? i.productId ?? i.id ?? '')).filter(Boolean);
        setWishlist(new Set(ids));
      })
      .catch(() => {});
  }, []);

  // ── Wishlist toggle ─────────────────────────────────────────────
  const toggleWishlist = useCallback(async (id: string) => {
    if (wishPending.has(id)) return;
    const already = wishlist.has(id);
    setWishlist((prev) => { const n = new Set(prev); already ? n.delete(id) : n.add(id); return n; });
    setWishPending((prev) => new Set(prev).add(id));
    try {
      await fetch(`/api/favorite/${id}`, { method: already ? 'DELETE' : 'POST' });
    } catch {
      setWishlist((prev) => { const n = new Set(prev); already ? n.add(id) : n.delete(id); return n; });
    } finally {
      setWishPending((prev) => { const n = new Set(prev); n.delete(id); return n; });
    }
  }, [wishlist, wishPending]);

  // ── Add to cart ─────────────────────────────────────────────────
  const addToCart = useCallback(async (product: UiProduct) => {
    if (cartStates[product.id] === 'loading') return;
    setCartStates((prev) => ({ ...prev, [product.id]: 'loading' }));
    dispatch({
      type: 'ADD_ITEM',
      payload: {
        id: product.id, name: product.name, price: product.price,
        originalPrice: product.originalPrice, quantity: 1,
        image: product.images[0] ?? '', emoji: product.emoji || '🎁',
        category: product.category, color: '', product_count: 0,
        is_available: product.inStock,
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
  }, [cartStates]);

  // ── Render ─────────────────────────────────────────────────────
  return (
    <section className={styles.productsSection}>

      <div className={styles.sectionHeader}>
        <div className={styles.sectionHeadLeft}>
          <div className={styles.sectionEyebrow}>⭐ Featured Products</div>
          <h2 className={styles.sectionTitle}>Handpicked Favorites</h2>
          <p className={styles.sectionSub}>Explore our most loved picks.</p>
        </div>
        <Link href="/products" className={styles.viewAll}>View All →</Link>
      </div>

      {!loading && fetchError && (
        <div className={styles.errorBanner}>
          ⚠️ Could not load featured products.{' '}
          <button onClick={() => window.location.reload()} className={styles.retryBtn} type="button">Retry</button>
        </div>
      )}

      <div className={styles.productsGrid}>
        {loading
          ? Array.from({ length: 8 }, (_, i) => <SkeletonCard key={i} />)
          : products.map((product) => (
              <FeaturedCard
                key={product.id} product={product}
                wishlisted={wishlist.has(product.id)}
                wishPending={wishPending.has(product.id)}
                cartState={cartStates[product.id] ?? 'idle'}
                onWishlist={() => toggleWishlist(product.id)}
                onAddToCart={() => addToCart(product)}
                onQuickView={() => openQuickView(product)}
              />
            ))}
      </div>

      {/* ── Quick View Modal ── */}
      {quickViewProduct && (
        <div className={styles.qvOverlay} onClick={closeQuickView}
          role="dialog" aria-modal="true" aria-label={`Quick view: ${quickViewProduct.name}`}>
          <div className={styles.qvModal} onClick={(e) => e.stopPropagation()}>
            <button className={styles.qvClose} onClick={closeQuickView} type="button" aria-label="Close">✕</button>
            <div className={styles.qvGrid}>
              {/* Left — Images */}
              <div className={styles.qvImgCol}>
                <div className={styles.qvMainImg}>
                  {quickViewProduct.images[qvActiveImg] ? (
                    <Image src={quickViewProduct.images[qvActiveImg]} alt={quickViewProduct.name}
                      fill sizes="(max-width: 768px) 100vw, 45vw" className={styles.qvMainImgTag} />
                  ) : (
                    <div className={styles.qvEmojiThumb}>{quickViewProduct.emoji || '🎁'}</div>
                  )}
                  {quickViewProduct.badges.length > 0 && (
                    <div className={styles.qvBadges}>
                      {quickViewProduct.badges.map((b) => (
                        <span key={b.label} className={styles.qvBadge}
                          style={{ background: BADGE_BG[b.type] ?? '#ccc', color: BADGE_TEXT[b.type] ?? '#000' }}>
                          {b.label}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                {quickViewProduct.images.length > 1 && (
                  <div className={styles.qvThumbs}>
                    {quickViewProduct.images.map((img, i) => (
                      <button key={i} type="button"
                        className={`${styles.qvThumb} ${i === qvActiveImg ? styles.qvThumbActive : ''}`}
                        onClick={() => setQvActiveImg(i)}>
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
                {quickViewProduct.description && <p className={styles.qvDesc}>{quickViewProduct.description}</p>}
                <div className={styles.qvActions}>
                  <div className={styles.qvQty}>
                    <button type="button" className={styles.qvQtyBtn}
                      onClick={() => setQvQty((q) => Math.max(1, q - 1))} disabled={qvQty <= 1}>−</button>
                    <span className={styles.qvQtyNum}>{qvQty}</span>
                    <button type="button" className={styles.qvQtyBtn}
                      onClick={() => setQvQty((q) => q + 1)} disabled={!quickViewProduct.inStock}>+</button>
                  </div>
                  <button type="button"
                    className={`${styles.qvAddBtn} ${
                      cartStates[quickViewProduct.id] === 'added'   ? styles.qvAddBtnAdded   :
                      cartStates[quickViewProduct.id] === 'error'   ? styles.qvAddBtnError   :
                      cartStates[quickViewProduct.id] === 'loading' ? styles.qvAddBtnLoading : ''}`}
                    disabled={!quickViewProduct.inStock || cartStates[quickViewProduct.id] === 'loading'}
                    onClick={() => addToCart(quickViewProduct)}>
                    {cartStates[quickViewProduct.id] === 'loading' ? 'Adding…'
                     : cartStates[quickViewProduct.id] === 'added'   ? '✓ Added to Cart!'
                     : cartStates[quickViewProduct.id] === 'error'   ? '✗ Try Again'
                     : '🛒 Add to Cart'}
                  </button>
                </div>
                <Link href={`/product/${quickViewProduct.id}`} className={styles.qvFullLink} onClick={closeQuickView}>
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