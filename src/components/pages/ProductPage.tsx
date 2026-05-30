'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import styles from './ProductPage.module.css';
import { _get, _post } from '@/shared/fetchwrapper';
import { useCart } from '@/context/CartContext';

/* ═══════════════════════════════════════════════════════
   TYPES  (unchanged)
   ═══════════════════════════════════════════════════════ */
interface ProductImage { url: string; public_id?: string; }

interface BackendProduct {
  id:                   string | number;
  name:                 string;
  category:             string;
  sub_category_name?:   string;
  sub_category_slug?:   string;
  description:          string;
  original_price:       number;
  amount_discount:      number;
  percentage_discount:  number;
  count:                number;
  details:              string[];
  product_image:        ProductImage[] | string[];
  rating?:              number;
  review_count?:        number;
  offer_expiration_date?: string;
  // Color variants — stored as JSON array on the product itself
  // Each entry: { name: string, hex: string, images: string[] }
  color_variants?: Array<{ name: string; hex: string; images: string[] }>;
}

// One color variant entry — stored in the product itself
interface ColorVariantItem {
  name:   string;   // e.g. "Pink"
  hex:    string;   // e.g. "#F4A7B9"
  images: string[]; // URLs for this color's images
}

interface MappedProduct {
  id:            string | number;
  name:          string;
  category:      string;
  subcategory:   string;
  description:   string;
  price:         number;
  originalPrice: number;
  discount:      number;
  stars:         number;
  reviewCount:   number;
  inStock:       boolean;
  stockCount:    number;
  images:        string[];   // default/first-color images
  highlights:    string[];
  badges:        { label: string; type: string }[];
  colorVariants: ColorVariantItem[];  // real colors from DB
  ageRange?:     string;
  material?:     string;
  dimensions?:   string;
  safetyInfo?:   string;
}

type CartState = 'idle' | 'loading' | 'added' | 'error';
type WishState = 'idle' | 'loading';

/* ═══════════════════════════════════════════════════════
   CONSTANTS  (unchanged)
   ═══════════════════════════════════════════════════════ */
const PLACEHOLDER_IMG = '/images/placeholder-product.png';

const BADGE_BG:   Record<string, string> = { sale: '#FF6B5B', new: '#3ECFB2', hot: '#FFD336' };
const BADGE_TEXT: Record<string, string> = { sale: '#fff',    new: '#fff',    hot: '#1A2540' };

const BADGE_CLASSES: Record<string, string> = {
  sale: styles.badgeSale,
  new:  styles.badgeNew,
  hot:  styles.badgeHot,
};

const REVIEWS = [
  { name: 'Priya S.',  avatar: '👩',  location: 'Hyderabad',  stars: 5, date: 'March 2026',    text: 'Absolutely worth every rupee! The quality exceeded my expectations and my child has not put it down since it arrived.' },
  { name: 'Rahul M.',  avatar: '👨',  location: 'Vijayawada', stars: 5, date: 'February 2026', text: 'Delivery was super fast — reached in 2 days! Packaging was beautiful and the product looks exactly like the photos.' },
  { name: 'Ananya R.', avatar: '👩‍💼', location: 'Guntur',     stars: 4, date: 'February 2026', text: 'Great quality for the price. My little one loves it. Would have given 5 stars if it came with a small carry bag.' },
];

/* ═══════════════════════════════════════════════════════
   CAROUSEL CONSTANTS  (unchanged)
   ═══════════════════════════════════════════════════════ */
const GAP = 20;
const AUTOPLAY_MS = 3000;

/* ═══════════════════════════════════════════════════════
   HIGHLIGHT ICONS — maps index to emoji icon
   ═══════════════════════════════════════════════════════ */
const HIGHLIGHT_ICONS = ['🛡️', '📦', '🎒', '💧', '⭐', '🔧', '🎨', '🌟'];

/* ═══════════════════════════════════════════════════════
   HELPERS  (unchanged)
   ═══════════════════════════════════════════════════════ */
function extractImageUrls(raw: ProductImage[] | string[] | undefined): string[] {
  if (!raw || !Array.isArray(raw)) return [];
  return raw.map((img) => (typeof img === 'string' ? img : img?.url ?? '')).filter(Boolean);
}

function mapBackendProduct(p: BackendProduct): MappedProduct {
  const images         = extractImageUrls(p.product_image);
  const originalPrice  = p.original_price   ?? 0;
  const amountDiscount = p.amount_discount  ?? 0;
  const pctDiscount    = p.percentage_discount ?? 0;

  let price = originalPrice - amountDiscount;
  if (price <= 0 && pctDiscount > 0)
    price = Math.round(originalPrice - (originalPrice * pctDiscount) / 100);
  if (price <= 0) price = originalPrice;

  const badges =
    pctDiscount    > 0 ? [{ label: `${pctDiscount}% OFF`,     type: 'sale' }] :
    amountDiscount > 0 ? [{ label: `Save ₹${amountDiscount}`, type: 'sale' }] : [];

  // Parse color_variants JSON array from backend
  // Each entry: { name: "Pink", hex: "#F4A7B9", images: ["url1","url2"] }
  const rawCv = Array.isArray(p.color_variants) ? p.color_variants : [];
  const colorVariants: ColorVariantItem[] = rawCv
    .map((cv: any) => ({
      name:   String(cv.name  ?? ''),
      hex:    String(cv.hex   ?? '#cccccc'),
      images: Array.isArray(cv.images) ? (cv.images as string[]) : [],
    }))
    .filter((cv: ColorVariantItem) => cv.name.length > 0);

  return {
    id:            p.id,
    name:          p.name        ?? 'Unnamed Product',
    category:      p.category    ?? '',
    subcategory:   p.sub_category_name ?? p.sub_category_slug ?? p.category ?? '',
    description:   p.description ?? '',
    price,
    originalPrice,
    discount:      pctDiscount,
    stars:         Math.min(5, Math.max(0, p.rating ?? 4)),
    reviewCount:   p.review_count ?? 0,
    inStock:       (p.count ?? 0) > 0,
    stockCount:    p.count        ?? 0,
    images:        images.length  > 0 ? images : [],
    highlights:    Array.isArray(p.details) ? p.details : [],
    badges,
    colorVariants,
  };
}

const fmt = (n: number) => Number.isFinite(n) && n > 0 ? n.toLocaleString('en-IN') : '0';

/* ═══════════════════════════════════════════════════════
   CAROUSEL HOOK  (unchanged)
   ═══════════════════════════════════════════════════════ */
function useCarousel(itemCount: number) {
  const viewportRef  = useRef<HTMLDivElement>(null);
  const [visibleCount, setVisibleCount] = useState(4);
  const [cardWidth,    setCardWidth]    = useState(0);
  const [rawIndex,     setRawIndex]     = useState(itemCount);
  const [animate,      setAnimate]      = useState(true);
  const [isDragging,   setIsDragging]   = useState(false);

  const isHovered    = useRef(false);
  const dragActive   = useRef(false);
  const dragStartX   = useRef(0);
  const dragCurrentX = useRef(0);
  const autoTimer    = useRef<ReturnType<typeof setInterval> | null>(null);

  const measure = useCallback((node: HTMLDivElement | null) => {
    (viewportRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
    if (!node) return;
    const elWidth = node.offsetWidth;
    const winWidth = typeof window !== 'undefined' ? window.innerWidth : elWidth;
    let count = 4;
    if (winWidth < 640) count = 2;
    setVisibleCount(count);
    setCardWidth((elWidth - GAP * (count - 1)) / count);
  }, []);

  const recalculate = useCallback(() => {
    if (!viewportRef.current) return;
    const elWidth = viewportRef.current.offsetWidth;
    const winWidth = typeof window !== 'undefined' ? window.innerWidth : elWidth;
    let count = 4;
    if (winWidth < 640) count = 2;
    setVisibleCount(count);
    setCardWidth((elWidth - GAP * (count - 1)) / count);
  }, []);

  useEffect(() => {
    const ro = new ResizeObserver(recalculate);
    if (viewportRef.current) ro.observe(viewportRef.current);
    window.addEventListener('resize', recalculate);
    return () => { ro.disconnect(); window.removeEventListener('resize', recalculate); };
  }, [recalculate]);

  useEffect(() => {
    if (itemCount < 2) return;
    if (rawIndex >= itemCount * 2) {
      const t = setTimeout(() => { setAnimate(false); setRawIndex(p => p - itemCount); }, 430);
      return () => clearTimeout(t);
    }
    if (rawIndex < itemCount) {
      const t = setTimeout(() => { setAnimate(false); setRawIndex(p => p + itemCount); }, 430);
      return () => clearTimeout(t);
    }
  }, [rawIndex, itemCount]);

  useEffect(() => {
    if (!animate) {
      const id = requestAnimationFrame(() => setAnimate(true));
      return () => cancelAnimationFrame(id);
    }
  }, [animate]);

  const stopAuto = useCallback(() => {
    if (autoTimer.current) { clearInterval(autoTimer.current); autoTimer.current = null; }
  }, []);

  const startAuto = useCallback(() => {
    if (itemCount < 2) return;
    stopAuto();
    autoTimer.current = setInterval(() => {
      if (!isHovered.current && !dragActive.current) {
        setAnimate(true);
        setRawIndex(p => p + 1);
      }
    }, AUTOPLAY_MS);
  }, [itemCount, stopAuto]);

  useEffect(() => { startAuto(); return stopAuto; }, [startAuto, stopAuto]);

  const go = useCallback((delta: number) => {
    stopAuto();
    setAnimate(true);
    setRawIndex(p => p + delta);
    setTimeout(startAuto, AUTOPLAY_MS + 600);
  }, [startAuto, stopAuto]);

  const prev     = useCallback(() => go(-1), [go]);
  const next     = useCallback(() => go(1),  [go]);
  const goToPage = useCallback((pageIdx: number) => {
    stopAuto();
    setAnimate(true);
    setRawIndex(itemCount + pageIdx * visibleCount);
    setTimeout(startAuto, AUTOPLAY_MS + 600);
  }, [itemCount, visibleCount, startAuto, stopAuto]);

  const trackOffset = -(rawIndex * (cardWidth + GAP));
  const dotCount    = itemCount > 0 ? Math.ceil(itemCount / visibleCount) : 0;
  const normalised  = itemCount > 0 ? ((rawIndex % itemCount) + itemCount) % itemCount : 0;
  const activeDot   = Math.floor(normalised / visibleCount);

  const onTouchStart = (e: React.TouchEvent) => { dragStartX.current = dragCurrentX.current = e.touches[0].clientX; dragActive.current = true; stopAuto(); };
  const onTouchMove  = (e: React.TouchEvent) => { if (!dragActive.current) return; dragCurrentX.current = e.touches[0].clientX; };
  const onTouchEnd   = () => { if (!dragActive.current) return; dragActive.current = false; const diff = dragStartX.current - dragCurrentX.current; if (Math.abs(diff) > 40) { diff > 0 ? next() : prev(); } else { startAuto(); } };
  const onMouseDown  = (e: React.MouseEvent) => { dragStartX.current = dragCurrentX.current = e.clientX; dragActive.current = true; setIsDragging(false); stopAuto(); };
  const onMouseMove  = (e: React.MouseEvent) => { if (!dragActive.current) return; dragCurrentX.current = e.clientX; if (Math.abs(e.clientX - dragStartX.current) > 6) setIsDragging(true); };
  const onMouseUp    = () => { if (!dragActive.current) return; dragActive.current = false; const diff = dragStartX.current - dragCurrentX.current; if (Math.abs(diff) > 40) { diff > 0 ? next() : prev(); } else { startAuto(); } setTimeout(() => setIsDragging(false), 0); };
  const onMouseEnter = () => { isHovered.current = true; };
  const onMouseLeave = () => { isHovered.current = false; if (dragActive.current) { dragActive.current = false; setIsDragging(false); startAuto(); } };

  return {
    viewportRef: measure, visibleCount, cardWidth,
    trackOffset, animate, isDragging,
    prev, next, goToPage, dotCount, activeDot,
    dragHandlers: { onTouchStart, onTouchMove, onTouchEnd, onMouseDown, onMouseMove, onMouseUp, onMouseEnter, onMouseLeave },
  };
}

/* ═══════════════════════════════════════════════════════
   SHARED ProductImg  (unchanged)
   ═══════════════════════════════════════════════════════ */
function ProductImg({ src, alt, className }: { src: string; alt: string; className: string }) {
  const [err, setErr] = useState(false);
  const safe = !err && src && (src.startsWith('http') || src.startsWith('/')) ? src : null;
  return (
    <Image
      src={safe ?? PLACEHOLDER_IMG}
      alt={alt}
      fill
      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
      className={className}
      onError={() => setErr(true)}
    />
  );
}

/* ═══════════════════════════════════════════════════════
   RELATED PRODUCT CARD  (updated UI)
   ═══════════════════════════════════════════════════════ */
interface RelatedCardProps {
  product:     MappedProduct;
  wishlisted:  boolean;
  wishPending: boolean;
  cartState:   CartState;
  onWishlist:  () => void;
  onAddToCart: () => void;
  onQuickView: () => void;
}

function RelatedCard({
  product, wishlisted, wishPending, cartState, onWishlist, onAddToCart, onQuickView,
}: RelatedCardProps) {
  const router  = useRouter();
  const stars   = Math.min(5, Math.max(0, Math.round(product.stars)));
  const hasSave = product.originalPrice > product.price && product.originalPrice > 0;
  const saving  = hasSave ? product.originalPrice - product.price : 0;
  const hasImg  = product.images.length > 0;
  const discPct = product.discount > 0 ? product.discount
    : hasSave ? Math.round((saving / product.originalPrice) * 100) : 0;

  return (
    <article className={styles.relCard}>
      {/* Wishlist */}
      <button
        className={[styles.relWishBtn, wishlisted ? styles.relWishlisted : '', wishPending ? styles.relWishPending : ''].filter(Boolean).join(' ')}
        onClick={(e) => { e.stopPropagation(); onWishlist(); }}
        disabled={wishPending}
        type="button"
        aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
      >
        {wishPending ? '⏳' : wishlisted ? '❤️' : '🤍'}
      </button>

      {/* Image */}
      <div
        className={styles.relCardImg}
        onClick={(e) => {
          if ((e.target as HTMLElement).closest(`.${styles.relCardOverlay}`)) return;
          router.push(`/product/${product.id}`);
        }}
        style={{ cursor: 'pointer' }}
      >
        {hasImg ? (
          <ProductImg src={product.images[0]} alt={product.name} className={styles.relCardImageTag} />
        ) : (
          <div className={styles.relCardEmoji} aria-hidden="true">🎁</div>
        )}
        {!product.inStock && <div className={styles.relOutOfStock}>Out of Stock</div>}

        <button
          type="button"
          className={styles.relCardOverlay}
          onClick={(e) => { e.stopPropagation(); e.preventDefault(); onQuickView(); }}
        >
          <span className={styles.relQuickView}>Quick View</span>
        </button>
      </div>

      {/* Body */}
      <div className={styles.relCardBody}>
        <Link href={`/product/${product.id}`} className={styles.relCardNameLink}>
          <h3 className={styles.relCardName}>{product.name}</h3>
        </Link>

        <div className={styles.relCardStars} aria-label={`${stars} out of 5 stars`}>
          {'★'.repeat(stars)}{'☆'.repeat(5 - stars)}
          <span className={styles.relCardReviews}>({product.reviewCount})</span>
        </div>

        <div className={styles.relCardPriceRow}>
          <span className={styles.relPriceNow}>₹{fmt(product.price)}</span>
          {hasSave && <span className={styles.relPriceWas}>₹{fmt(product.originalPrice)}</span>}
          {discPct > 0 && <span className={styles.relPriceSave}>{discPct}% OFF</span>}
        </div>

        <button
          className={[
            styles.relAddBtn,
            !product.inStock        ? styles.relAddBtnDisabled : '',
            cartState === 'added'   ? styles.relAddBtnAdded    : '',
            cartState === 'error'   ? styles.relAddBtnError    : '',
            cartState === 'loading' ? styles.relAddBtnLoading  : '',
          ].filter(Boolean).join(' ')}
          type="button"
          disabled={!product.inStock || cartState === 'loading'}
          onClick={(e) => { e.stopPropagation(); onAddToCart(); }}
        >
          {cartState === 'loading' ? 'Adding…'
           : cartState === 'added'   ? '✓ Added!'
           : cartState === 'error'   ? '✗ Retry'
           : product.inStock         ? 'Add to Cart'
           :                           'Notify Me'}
        </button>
      </div>
    </article>
  );
}




/* ═══════════════════════════════════════════════════════
   MAIN PAGE COMPONENT
   ═══════════════════════════════════════════════════════ */
export default function ProductPage({ productId }: { productId: string | number }) {
  const router = useRouter();

  /* ── Main product state ───────────────────────────── */
  const [product,    setProduct]    = useState<MappedProduct | null>(null);
  const [loading,    setLoading]    = useState(true);
  const [notFound,   setNotFound]   = useState(false);
  const [activeImg,  setActiveImg]  = useState(0);
  const [qty,        setQty]        = useState(1);
  const [activeTab,  setActiveTab]  = useState<'details' | 'shipping' | 'reviews'>('details');
  const [pincode,       setPincode]       = useState('');
  const [pincodeMsg,    setPincodeMsg]    = useState('');
  const [pincodeStatus, setPincodeStatus] = useState<'idle' | 'checking' | 'available' | 'unavailable' | 'error'>('idle');
  const [showShareSheet, setShowShareSheet] = useState(false);
  const [copyToast,      setCopyToast]      = useState(false);
  const [imgError,   setImgError]   = useState<Record<number, boolean>>({});
  const [cartState,  setCartState]  = useState<CartState>('idle');
  const [cartMsg,    setCartMsg]    = useState('');
  const [buyState,   setBuyState]   = useState<CartState>('idle');
  const [wishlisted, setWishlisted] = useState(false);
  const [wishState,  setWishState]  = useState<WishState>('idle');
  const { dispatch } = useCart();

  /* ── Related products state ───────────────────────── */
  const [related,       setRelated]       = useState<MappedProduct[]>([]);
  const [relWishlist,   setRelWishlist]   = useState<Set<string>>(new Set());
  const [relWishPend,   setRelWishPend]   = useState<Set<string>>(new Set());
  const [relCartStates, setRelCartStates] = useState<Record<string, CartState>>({});

  /* ── Selected color (index into product.colorVariants) ── */
  const [selectedColorIdx, setSelectedColorIdx] = useState<number>(0);

  /* ── Carousel ─────────────────────────────────────── */
  const carousel      = useCarousel(related.length);
  const clonedRelated = [...related, ...related, ...related];

  /* ── Quick view state ─────────────────────────────── */
  const [qvProduct,   setQvProduct]   = useState<MappedProduct | null>(null);
  const [qvActiveImg, setQvActiveImg] = useState(0);
  const [qvQty,       setQvQty]       = useState(1);
  const [qvCartState, setQvCartState] = useState<'idle' | 'loading' | 'added' | 'error'>('idle');

  function openQv(p: MappedProduct) {
    setQvProduct(p); setQvActiveImg(0); setQvQty(1); setQvCartState('idle');
    document.body.style.overflow = 'hidden';
  }
  function closeQv() {
    setQvProduct(null);
    document.body.style.overflow = '';
  }
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') closeQv(); };
    if (qvProduct) window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [qvProduct]);

  /* ── Fetch main product ───────────────────────────── */
  useEffect(() => {
    if (!productId) return;
    setLoading(true); setNotFound(false); setActiveImg(0);
    setImgError({}); setCartState('idle'); setCartMsg(''); setWishlisted(false); setSelectedColorIdx(0);
    _get(`/api/product/${productId}`)
      .then((res: any) => {
        const raw: BackendProduct = res?.product_details ?? res?.product ?? res;
        if (!raw?.name) { setNotFound(true); return; }
        const mapped = mapBackendProduct(raw);
        setProduct(mapped);
        // Reset color selection when product changes
        setSelectedColorIdx(0);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [productId]);

  /* ── Fetch wishlist status ────────────────────────── */
  useEffect(() => {
    if (!productId) return;
    _get('/api/favorite').then((res: any) => {
      const items: any[] = Array.isArray(res) ? res : (res?.data ?? []);
      const ids = items.map((i: any) => typeof i === 'string' ? i : String(i.product_id ?? i.productId ?? i.id ?? ''));
      setWishlisted(ids.includes(String(productId)));
      setRelWishlist(new Set(ids));
    }).catch(() => {});
  }, [productId]);

  /* ── Fetch related products ───────────────────────── */
  useEffect(() => {
    _get('/api/product/featured').then((res: any) => {
      const raw: BackendProduct[] = Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : [];
      setRelated(raw.filter((p) => String(p.id) !== String(productId)).slice(0, 8).map(mapBackendProduct));
    }).catch(() => {});
  }, [productId]);



  /* ── Main product: Add to cart ────────────────────── */
  async function handleCart() {
    if (!product || cartState === 'loading') return;
    setCartState('loading'); setCartMsg('');
    dispatch({ type: 'ADD_ITEM', payload: { id: product.id, name: product.name, price: product.price, originalPrice: product.originalPrice, quantity: qty, image: product.images[0] ?? '', emoji: '🎁', bgGradient: '', category: product.category, color: product.colorVariants[selectedColorIdx]?.name ?? '', product_count: product.stockCount, is_available: product.inStock } });
    try {
      await _post('/api/cart/items', { product_id: product.id, quantity: qty });
      setCartState('added'); setCartMsg(`✓ ${qty > 1 ? `${qty}× ` : ''}${product.name} added to cart!`);
      setTimeout(() => { setCartState('idle'); setCartMsg(''); }, 3000);
    } catch {
      dispatch({ type: 'REMOVE_ITEM',  payload: { id: product.id }, });
      setCartState('error'); setCartMsg('Could not add to cart. Please try again.');
      setTimeout(() => { setCartState('idle'); setCartMsg(''); }, 3000);
    }
  }

  /* ── Main product: Buy Now ────────────────────────── */
  async function handleBuyNow() {
    if (!product || buyState === 'loading') return;
    setBuyState('loading');
    dispatch({ type: 'ADD_ITEM', payload: { id: product.id, name: product.name, price: product.price, originalPrice: product.originalPrice, quantity: qty, image: product.images[0] ?? '', emoji: '🎁', bgGradient: '', category: product.category, color: product.colorVariants[selectedColorIdx]?.name ?? '', product_count: product.stockCount, is_available: product.inStock } });
    try {
      await _post('/api/cart/items', { product_id: product.id, quantity: qty });
      router.push('/cart');
    } catch {
      dispatch({ type: 'REMOVE_ITEM',  payload: { id: product.id }, });
      setBuyState('error'); setTimeout(() => setBuyState('idle'), 3000);
    }
  }

  /* ── Main product: Wishlist ───────────────────────── */
  async function handleWishlist() {
    if (!product || wishState === 'loading') return;
    const was = wishlisted; setWishlisted(!was); setWishState('loading');
    try { await fetch(`/api/favorite/${product.id}`, { method: was ? 'DELETE' : 'POST' }); }
    catch { setWishlisted(was); }
    finally { setWishState('idle'); }
  }

  /* ── Related: Wishlist toggle ─────────────────────── */
  const toggleRelWishlist = useCallback(async (id: string) => {
    if (relWishPend.has(id)) return;
    const was = relWishlist.has(id);
    setRelWishlist((prev) => { const n = new Set(prev); was ? n.delete(id) : n.add(id); return n; });
    setRelWishPend((prev) => new Set(prev).add(id));
    try { await fetch(`/api/favorite/${id}`, { method: was ? 'DELETE' : 'POST' }); }
    catch { setRelWishlist((prev) => { const n = new Set(prev); was ? n.add(id) : n.delete(id); return n; }); }
    finally { setRelWishPend((prev) => { const n = new Set(prev); n.delete(id); return n; }); }
  }, [relWishlist, relWishPend]);

  /* ── Related: Add to cart ─────────────────────────── */
  const addRelToCart = useCallback(async (p: MappedProduct) => {
    const id = String(p.id);
    if (relCartStates[id] === 'loading') return;
    setRelCartStates((prev) => ({ ...prev, [id]: 'loading' }));
    dispatch({ type: 'ADD_ITEM', payload: { id: p.id, name: p.name, price: p.price, originalPrice: p.originalPrice, quantity: 1, image: p.images[0] ?? '', emoji: '🎁', bgGradient: '', category: p.category, color: '', product_count: p.stockCount, is_available: p.inStock } });
    try {
      await _post('/api/cart/items', { product_id: p.id, quantity: 1 });
      setRelCartStates((prev) => ({ ...prev, [id]: 'added' }));
      setTimeout(() => setRelCartStates((prev) => ({ ...prev, [id]: 'idle' })), 2000);
    } catch {
      setRelCartStates((prev) => ({ ...prev, [id]: 'error' }));
      setTimeout(() => setRelCartStates((prev) => ({ ...prev, [id]: 'idle' })), 2500);
    }
  }, [relCartStates, dispatch]);

  /* ── Pincode delivery check ───────────────────────── */
  // Serviceable pincode ranges for simulation (covers major Indian cities)
  const SERVICEABLE_RANGES = [
    [110001, 110096], // Delhi
    [400001, 400104], // Mumbai
    [560001, 560100], // Bangalore
    [500001, 500098], // Hyderabad
    [600001, 600119], // Chennai
    [700001, 700157], // Kolkata
    [411001, 411062], // Pune
    [380001, 380061], // Ahmedabad
    [302001, 302040], // Jaipur
    [226001, 226031], // Lucknow
    [522001, 522034], // Guntur
    [520001, 520015], // Vijayawada
    [500030, 500089], // Hyderabad extended
  ];

  const METRO_PINCODES = new Set([
    110001, 400001, 560001, 500001, 600001, 700001, 411001, 380001,
  ]);

  function getPincodeInfo(pin: number): { available: boolean; days: string; courier: string } {
    for (const [start, end] of SERVICEABLE_RANGES) {
      if (pin >= start && pin <= end) {
        const isMetro = [...METRO_PINCODES].some(m => Math.abs(m - pin) < 200);
        return {
          available: true,
          days: isMetro ? '1–2 business days' : '3–5 business days',
          courier: isMetro ? 'Express Delivery' : 'Standard Delivery',
        };
      }
    }
    // 80% serviceable for unknown pincodes (simulate realistic coverage)
    const hash = pin % 10;
    if (hash <= 7) {
      return { available: true, days: '4–6 business days', courier: 'Standard Delivery' };
    }
    return { available: false, days: '', courier: '' };
  }

  async function checkPincode() {
    const trimmed = pincode.trim();
    if (trimmed.length !== 6 || isNaN(Number(trimmed))) {
      setPincodeMsg('Please enter a valid 6-digit pincode.');
      setPincodeStatus('error');
      return;
    }
    setPincodeStatus('checking');
    setPincodeMsg('');
    // Simulate network delay for realism
    await new Promise(r => setTimeout(r, 700));
    const info = getPincodeInfo(Number(trimmed));
    if (info.available) {
      setPincodeStatus('available');
      setPincodeMsg(`✅ ${info.courier} available — arrives in ${info.days}. Free shipping on orders above ₹499.`);
    } else {
      setPincodeStatus('unavailable');
      setPincodeMsg(`❌ Delivery not available to pincode ${trimmed} yet. Try a nearby pincode or contact support.`);
    }
  }

  function handlePincodeKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') checkPincode();
  }

  /* ── Share ────────────────────────────────────────── */
  async function handleCopyLink() {
    const url = typeof window !== 'undefined' ? window.location.href : '';
    try {
      await navigator.clipboard.writeText(url);
      setCopyToast(true);
      setTimeout(() => setCopyToast(false), 2500);
    } catch {
      // Fallback for older browsers
      const ta = document.createElement('textarea');
      ta.value = url;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.focus(); ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopyToast(true);
      setTimeout(() => setCopyToast(false), 2500);
    }
  }

  function handleShareWhatsApp() {
    const url  = typeof window !== 'undefined' ? window.location.href : '';
    const text = `Check out ${product?.name} on LittleLoot! 🎁\n₹${fmt(product?.price ?? 0)} — ${url}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  }

  function handleShareTwitter() {
    const url  = typeof window !== 'undefined' ? window.location.href : '';
    const text = `Check out ${product?.name} on LittleLoot! 🎁 ₹${fmt(product?.price ?? 0)}`;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank');
  }

  function handleShareFacebook() {
    const url = typeof window !== 'undefined' ? window.location.href : '';
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
  }

  async function handleNativeShare() {
    const url = typeof window !== 'undefined' ? window.location.href : '';
    if (navigator.share) {
      try {
        await navigator.share({
          title: product?.name ?? 'LittleLoot Product',
          text: `Check out ${product?.name} on LittleLoot! ₹${fmt(product?.price ?? 0)}`,
          url,
        });
      } catch { /* user cancelled */ }
    } else {
      setShowShareSheet(true);
    }
  }

  // Close share sheet on backdrop click
  useEffect(() => {
    if (!showShareSheet) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setShowShareSheet(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [showShareSheet]);

  /* ── Quick View: Add to cart ──────────────────────── */
  async function handleQvAddToCart() {
    if (!qvProduct || qvCartState === 'loading') return;
    setQvCartState('loading');
    dispatch({ type: 'ADD_ITEM', payload: { id: qvProduct.id, name: qvProduct.name, price: qvProduct.price, originalPrice: qvProduct.originalPrice, quantity: qvQty, image: qvProduct.images[0] ?? '', emoji: '🎁', bgGradient: '', category: qvProduct.category, color: '', product_count: qvProduct.stockCount, is_available: qvProduct.inStock } });
    try {
      await _post('/api/cart/items', { product_id: qvProduct.id, quantity: qvQty });
      setQvCartState('added'); setTimeout(() => setQvCartState('idle'), 2000);
    } catch {
      dispatch({ type: 'REMOVE_ITEM',  payload: { id: qvProduct.id }, });
      setQvCartState('error'); setTimeout(() => setQvCartState('idle'), 2500);
    }
  }

  /* ── Share ────────────────────────────────────────── */
  function handleShare(type: 'whatsapp' | 'copy') {
    const url = window.location.href;
    if (type === 'whatsapp') window.open(`https://wa.me/?text=${encodeURIComponent(`${product!.name} - ${url}`)}`);
    else navigator.clipboard.writeText(url).catch(() => {});
  }

  /* ── Loading skeleton ─────────────────────────────── */
  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.skeletonBreadcrumb}>
          {[60, 60, 140].map((w, i) => <div key={i} className={styles.skeletonPill} style={{ width: w }} />)}
        </div>
        <div className={styles.mainGrid}>
          <div className={styles.skeletonGallery}>
            <div className={styles.skeletonThumbCol}>
              {[1,2,3,4].map(i => <div key={i} className={styles.skeletonThumb} />)}
            </div>
            <div className={styles.skeletonMainImg} />
          </div>
          <div className={styles.skeletonInfo}>
            {['xs','lg','sm','med','xs','btn'].map((s,i) => (
              <div key={i} className={`${styles.skeletonBlock} ${(styles as any)['skeletonBlock'+s.charAt(0).toUpperCase()+s.slice(1)]}`} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  /* ── Not found ────────────────────────────────────── */
  if (notFound || !product) {
    return (
      <div className={styles.page} style={{ textAlign: 'center', padding: '80px 20px' }}>
        <div style={{ fontSize: 64 }}>🔍</div>
        <h2 style={{ fontFamily: 'var(--font-baloo)', fontSize: 28, color: 'var(--navy)', margin: '16px 0 8px' }}>Product not found</h2>
        <p style={{ color: '#888', marginBottom: 28 }}>This product may have been removed or the link is incorrect.</p>
        <Link href="/" style={{ color: 'var(--coral)', fontWeight: 700 }}>← Back to Home</Link>
      </div>
    );
  }

  /* ── Derived values ───────────────────────────────── */
  const stars = Array.from({ length: 5 }, (_, i) => i < product.stars ? '★' : '☆');
  const discountPct = product.originalPrice > 0
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : product.discount ?? 0;

  // Active color variant — use its images if it has any, otherwise fall back to product images
  const activeColorVariant = product.colorVariants[selectedColorIdx] ?? null;
  const activeImages = (activeColorVariant && activeColorVariant.images.length > 0)
    ? activeColorVariant.images
    : product.images;
  const currentImg = imgError[activeImg] ? PLACEHOLDER_IMG : (activeImages[activeImg] ?? PLACEHOLDER_IMG);

  /* ════════════════════════════════════════════════════
     RENDER
     ════════════════════════════════════════════════════ */
  return (
    <div className={styles.page}>

      {/* ── Breadcrumb ─────────────────────────────── */}
      <div className={styles.breadcrumb}>
        <Link href="/"     className={styles.breadLink}>Home</Link>
        <span className={styles.breadSep}>›</span>
        <Link href="/toys" className={styles.breadLink}>{product.category}</Link>
        <span className={styles.breadSep}>›</span>
        <span className={styles.breadCurrent}>{product.name}</span>
      </div>

      {/* ── Main Grid ──────────────────────────────── */}
      <div className={styles.mainGrid}>

        {/* ── Gallery: thumbs LEFT + main RIGHT ────── */}
        <div className={styles.gallery}>

          {/* Vertical thumbnail strip */}
          {activeImages.length > 1 && (
            <div className={styles.galleryThumbs}>
              {activeImages.map((imgUrl, i) => (
                <button key={i}
                  className={`${styles.thumb} ${i === activeImg ? styles.thumbActive : ''}`}
                  onClick={() => setActiveImg(i)} type="button" aria-label={`View image ${i + 1}`}
                >
                  <Image
                    src={imgError[i] ? PLACEHOLDER_IMG : (activeImages[i] ?? imgUrl)}
                    alt={`${product.name} view ${i + 1}`}
                    fill sizes="80px" className={styles.thumbImage}
                    onError={() => setImgError((prev) => ({ ...prev, [i]: true }))}
                  />
                </button>
              ))}
            </div>
          )}

          {/* Main image */}
          <div className={styles.galleryMain}>
            {/* Best Seller badge if first badge */}
            {product.badges.length > 0 && (
              <div className={styles.galleryBadges}>
                {product.badges.map((b) => (
                  <span key={b.label} className={`${styles.badge} ${BADGE_CLASSES[b.type] ?? ''}`}>{b.label}</span>
                ))}
              </div>
            )}
            {/* Static "Best Seller" pill — shown if in-stock & no discount badge */}
            {product.inStock && product.badges.length === 0 && (
              <div className={styles.galleryBadges}>
                <span className={styles.badgeBestSeller}>⭐ Best Seller</span>
              </div>
            )}

            <Image
              src={currentImg}
              alt={product.name}
              fill priority
              sizes="(max-width: 900px) 100vw, 50vw"
              className={styles.galleryMainImage}
              onError={() => setImgError((prev) => ({ ...prev, [activeImg]: true }))}
            />

            {/* Expand icon */}
            <button className={styles.expandBtn} type="button" aria-label="Expand image">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/>
                <line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/>
              </svg>
            </button>
          </div>
        </div>

        {/* ── Info Panel ─────────────────────────────── */}
        <div className={styles.info}>

          {/* Category pill */}
          <div className={styles.categoryPill}>{product.category.toUpperCase()}</div>

          {/* Title */}
          <h1 className={styles.productTitle}>{product.name}</h1>

          {/* Rating + In Stock inline */}
          <div className={styles.ratingRow}>
            <div className={styles.stars}>
              {stars.map((s, i) => (
                <span key={i} className={s === '★' ? styles.starFilled : styles.starEmpty}>{s}</span>
              ))}
            </div>
            <span className={styles.ratingNum}>{product.stars}.0</span>
            <span className={styles.reviewCount} onClick={() => setActiveTab('reviews')}>
              ({product.reviewCount} reviews)
            </span>
            <span className={product.inStock ? styles.inStockPill : styles.outStockPill}>
              {product.inStock ? 'In Stock' : 'Out of Stock'}
            </span>
          </div>

          {/* Price */}
          <div className={styles.priceBlock}>
            <span className={styles.priceNow}>₹{fmt(product.price)}</span>
            {product.originalPrice > 0 && product.originalPrice !== product.price && (
              <>
                <span className={styles.priceWas}>₹{fmt(product.originalPrice)}</span>
                {discountPct > 0 && <span className={styles.priceSavePill}>{discountPct}% OFF</span>}
              </>
            )}
          </div>

          {/* Short description */}
          <p className={styles.shortDesc}>{product.description}</p>

          {/* Highlights with icons 
          {product.highlights.length > 0 && (
            <ul className={styles.highlightsList}>
              {product.highlights.slice(0, 6).map((h, i) => (
                <li key={i} className={styles.highlightItem}>
                  <span className={styles.highlightIcon}>{HIGHLIGHT_ICONS[i % HIGHLIGHT_ICONS.length]}</span>
                  <span>{h}</span>
                </li>
              ))}
            </ul>
          )}
            */}

          {/* ── Color Swatches ─────────────────────────────────────────────
              Shows real colors from product.colorVariants (stored in DB as JSON).
              Clicking a swatch:
                1. Sets selectedColorIdx → switches displayed images instantly
                2. Resets activeImg to 0 (first image of new color)
              No page navigation. No API calls. Instant switch.
          ── */}
          {product.colorVariants.length > 0 && (
            <div className={styles.colorSection}>
              <div className={styles.colorLabel}>
                Color:
                <span className={styles.colorName}>
                  {activeColorVariant?.name ?? product.colorVariants[0]?.name ?? ''}
                </span>
              </div>
              <div className={styles.colorSwatches} role="radiogroup" aria-label="Select color">
                {product.colorVariants.map((cv, idx) => {
                  const isSelected = idx === selectedColorIdx;
                  const isWhite    = cv.hex.toLowerCase() === '#ffffff';
                  return (
                    <button
                      key={cv.name}
                      type="button"
                      role="radio"
                      aria-checked={isSelected}
                      title={cv.name}
                      aria-label={cv.name}
                      className={[
                        styles.colorSwatch,
                        isSelected ? styles.colorSwatchSelected : '',
                        isWhite    ? styles.colorSwatchWhite    : '',
                      ].filter(Boolean).join(' ')}
                      style={{ background: cv.hex }}
                      onClick={() => {
                        setSelectedColorIdx(idx);
                        setActiveImg(0);        // reset to first image of new color
                        setImgError({});        // clear any image errors from previous color
                      }}
                    >
                      {isSelected && (
                        <svg
                          className={styles.colorSwatchCheck}
                          viewBox="0 0 12 12"
                          fill="none"
                          stroke={isWhite ? '#555' : '#fff'}
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <polyline points="2,6 5,9 10,3" />
                        </svg>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Stock warning */}
          {product.inStock && product.stockCount < 10 && (
            <div className={styles.stockLow}>⚡ Only {product.stockCount} left in stock — order soon!</div>
          )}

          {/* Qty + CTA row */}
          <div className={styles.ctaSection}>
            <div className={styles.qtyControl}>
              <button className={styles.qtyBtn} type="button" onClick={() => setQty(Math.max(1, qty - 1))} disabled={qty <= 1}>−</button>
              <span className={styles.qtyNum}>{qty}</span>
              <button className={styles.qtyBtn} type="button" onClick={() => setQty(Math.min(product.stockCount || 99, qty + 1))} disabled={qty >= (product.stockCount || 99)}>+</button>
            </div>

            <div className={styles.ctaBtns}>
              {/* Add to Wishlist */}
              <button
                className={[styles.wishlistBtn, wishlisted ? styles.wishlistBtnActive : '', wishState === 'loading' ? styles.wishlistBtnLoading : ''].filter(Boolean).join(' ')}
                onClick={handleWishlist}
                disabled={wishState === 'loading'}
                type="button"
              >
                {wishState === 'loading' ? '⏳' : wishlisted ? '❤️ Wishlisted' : '🤍 Add to Wishlist'}
              </button>

              {/* Add to Cart */}
              <button
                className={[
                  styles.addToCartBtn,
                  cartState === 'added'   ? styles.addedToCart  : '',
                  cartState === 'error'   ? styles.cartError    : '',
                  cartState === 'loading' ? styles.cartLoading  : '',
                ].filter(Boolean).join(' ')}
                onClick={handleCart}
                type="button"
                disabled={!product.inStock || cartState === 'loading'}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" style={{ flexShrink: 0 }}>
                  <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
                  <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
                </svg>
                {cartState === 'loading' ? 'Adding…'
                 : cartState === 'added'   ? 'Added to Cart!'
                 : cartState === 'error'   ? 'Try Again'
                 : 'Add to Cart'}
              </button>
            </div>
          </div>

          {/* Buy Now */}
          <button
            className={[styles.buyNowBtn, buyState === 'loading' ? styles.buyNowLoading : '', buyState === 'error' ? styles.buyNowError : ''].filter(Boolean).join(' ')}
            onClick={handleBuyNow}
            type="button"
            disabled={!product.inStock || buyState === 'loading'}
          >
            {buyState === 'loading' ? 'Please wait…' : buyState === 'error' ? '✗ Try Again' : 'Buy Now →'}
          </button>

          {/* Cart feedback */}
          {cartMsg && (
            <div className={`${styles.cartFeedback} ${cartState === 'error' ? styles.cartFeedbackError : styles.cartFeedbackSuccess}`}>
              {cartMsg}
              {cartState === 'added' && <Link href="/cart" className={styles.viewCartLink}>View Cart →</Link>}
            </div>
          )}

          {/* Trust strip — 3 icons */}
          <div className={styles.trustStrip}>
            <div className={styles.trustItem}>
              <span className={styles.trustIcon}>🚚</span>
              <div>
                <div className={styles.trustTitle}>Free Shipping</div>
                <div className={styles.trustSub}>On orders over ₹499</div>
              </div>
            </div>
            <div className={styles.trustItem}>
              <span className={styles.trustIcon}>🔄</span>
              <div>
                <div className={styles.trustTitle}>Easy Returns</div>
                <div className={styles.trustSub}>30-day return policy</div>
              </div>
            </div>
            <div className={styles.trustItem}>
              <span className={styles.trustIcon}>🔒</span>
              <div>
                <div className={styles.trustTitle}>Secure Payment</div>
                <div className={styles.trustSub}>100% secure checkout</div>
              </div>
            </div>
          </div>

          {/* ── Pincode delivery checker ───────────────── */}
          <div className={styles.pincodeBox}>
            <div className={styles.pincodeHeader}>
              <span className={styles.pincodeTitleIcon}>📍</span>
              <span className={styles.pincodeTitle}>Check Delivery</span>
              {pincodeStatus === 'available' && (
                <span className={styles.pincodeAvailBadge}>Available</span>
              )}
            </div>
            <div className={styles.pincodeRow}>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                className={`${styles.pincodeInput} ${
                  pincodeStatus === 'available'   ? styles.pincodeInputOk  :
                  pincodeStatus === 'unavailable' ? styles.pincodeInputErr :
                  pincodeStatus === 'error'       ? styles.pincodeInputErr : ''
                }`}
                placeholder="Enter 6-digit pincode"
                value={pincode}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                  setPincode(val);
                  if (pincodeStatus !== 'idle') { setPincodeStatus('idle'); setPincodeMsg(''); }
                }}
                onKeyDown={handlePincodeKeyDown}
                aria-label="Pincode"
              />
              <button
                className={`${styles.pincodeBtn} ${pincodeStatus === 'checking' ? styles.pincodeBtnChecking : ''}`}
                onClick={checkPincode}
                type="button"
                disabled={pincodeStatus === 'checking' || pincode.trim().length < 6}
              >
                {pincodeStatus === 'checking' ? (
                  <span className={styles.pincodeSpinner} />
                ) : 'Check'}
              </button>
            </div>
            {pincodeMsg && (
              <p className={`${styles.pincodeResult} ${
                pincodeStatus === 'available'   ? styles.pincodeResultOk  :
                pincodeStatus === 'unavailable' ? styles.pincodeResultErr :
                pincodeStatus === 'error'       ? styles.pincodeResultErr : ''
              }`}>
                {pincodeMsg}
              </p>
            )}
            {pincodeStatus === 'idle' && (
              <p className={styles.pincodeHint}>Enter your pincode to check delivery availability &amp; estimated date.</p>
            )}
          </div>

          {/* ── Share row ─────────────────────────────── */}
          <div className={styles.shareRow}>
            <span className={styles.shareLabel}>Share:</span>
            <button className={styles.shareIconBtn} type="button" onClick={handleShareWhatsApp} title="Share on WhatsApp" aria-label="Share on WhatsApp">
              {/* WhatsApp icon */}
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/>
              </svg>
            </button>
            <button className={styles.shareIconBtn} type="button" onClick={handleShareTwitter} title="Share on X / Twitter" aria-label="Share on Twitter">
              {/* X / Twitter icon */}
              <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.259 5.63zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
            </button>
            <button className={styles.shareIconBtn} type="button" onClick={handleShareFacebook} title="Share on Facebook" aria-label="Share on Facebook">
              {/* Facebook icon */}
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
            </button>
            <button className={`${styles.shareIconBtn} ${styles.shareIconBtnLink}`} type="button" onClick={handleCopyLink} title="Copy link" aria-label="Copy link">
              {/* Link icon */}
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
              </svg>
            </button>
            <button className={styles.shareMoreBtn} type="button" onClick={handleNativeShare} aria-label="More share options">
              ··· More
            </button>
          </div>

          {/* Copy toast */}
          {copyToast && (
            <div className={styles.copyToast} role="status" aria-live="polite">
              🔗 Link copied to clipboard!
            </div>
          )}
        </div>
      </div>

      {/* ── Share Sheet Modal ───────────────────────────── */}
      {showShareSheet && (
        <div className={styles.shareSheetOverlay} onClick={() => setShowShareSheet(false)} role="dialog" aria-modal="true" aria-label="Share options">
          <div className={styles.shareSheet} onClick={e => e.stopPropagation()}>
            <div className={styles.shareSheetHandle} />
            <div className={styles.shareSheetTitle}>Share this product</div>
            {product && (
              <div className={styles.shareSheetProduct}>
                <div className={styles.shareSheetImg}>
                  {product.images[0]
                    ? <Image src={product.images[0]} alt={product.name} fill sizes="56px" style={{ objectFit: 'contain' }} />
                    : <span style={{ fontSize: 28 }}>🎁</span>}
                </div>
                <div>
                  <div className={styles.shareSheetProductName}>{product.name}</div>
                  <div className={styles.shareSheetProductPrice}>₹{fmt(product.price)}</div>
                </div>
              </div>
            )}
            <div className={styles.shareSheetGrid}>
              <button className={styles.shareSheetItem} onClick={() => { handleShareWhatsApp(); setShowShareSheet(false); }} type="button">
                <div className={styles.shareSheetIcon} style={{ background: '#25D366' }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="#fff">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/>
                  </svg>
                </div>
                <span>WhatsApp</span>
              </button>
              <button className={styles.shareSheetItem} onClick={() => { handleShareTwitter(); setShowShareSheet(false); }} type="button">
                <div className={styles.shareSheetIcon} style={{ background: '#000' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="#fff">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.259 5.63zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                </div>
                <span>X / Twitter</span>
              </button>
              <button className={styles.shareSheetItem} onClick={() => { handleShareFacebook(); setShowShareSheet(false); }} type="button">
                <div className={styles.shareSheetIcon} style={{ background: '#1877F2' }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="#fff">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </div>
                <span>Facebook</span>
              </button>
              <button className={styles.shareSheetItem} onClick={() => { handleCopyLink(); setShowShareSheet(false); }} type="button">
                <div className={styles.shareSheetIcon} style={{ background: '#6c757d' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2">
                    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
                  </svg>
                </div>
                <span>Copy Link</span>
              </button>
            </div>
            <button className={styles.shareSheetClose} onClick={() => setShowShareSheet(false)} type="button">Cancel</button>
          </div>
        </div>
      )}

      {/* ── Tabs ───────────────────────────────────────── */}
      <div className={styles.tabSection}>
        <div className={styles.tabs}>
          {(['details', 'shipping', 'reviews'] as const).map((t) => (
            <button key={t} type="button"
              className={`${styles.tab} ${activeTab === t ? styles.tabActive : ''}`}
              onClick={() => setActiveTab(t)}
            >
              {t === 'details'  && <><span className={styles.tabEmoji}>📋 </span>Product Details</>}
              {t === 'shipping' && <><span className={styles.tabEmoji}>🚚 </span>Shipping & Returns</>}
              {t === 'reviews'  && <><span className={styles.tabEmoji}>⭐ </span>Reviews ({product.reviewCount})</>}
            </button>
          ))}
        </div>

        <div className={styles.tabContent}>
          {activeTab === 'details' && (
            <div className={styles.detailsTab}>
              <div className={styles.longDesc}>
                <h3>About this product</h3>
                <p>{product.description}</p>
              </div>
              {product.highlights.length > 0 && (
                <div className={styles.highlightsTabList}>
                  <h3>Key Highlights</h3>
                  <ul>
                    {product.highlights.map((h, i) => (
                      <li key={i}><span className={styles.checkIcon}>✦</span>{h}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {activeTab === 'shipping' && (
            <div className={styles.shippingTab}>
              <div className={styles.shippingCard}>
                <h3>🚚 Shipping Policy</h3>
                <ul>
                  <li><strong>Free shipping</strong> on all orders above ₹499</li>
                  <li>Standard delivery: <strong>3–5 business days</strong></li>
                  <li>Express delivery available at checkout: <strong>1–2 days</strong></li>
                  <li>Same-day delivery in Hyderabad, Vijayawada &amp; Guntur</li>
                  <li>Order tracking via SMS and email after dispatch</li>
                </ul>
              </div>
              <div className={styles.shippingCard}>
                <h3>🔄 Return Policy</h3>
                <ul>
                  <li><strong>30-day hassle-free returns</strong> — no questions asked</li>
                  <li>Product must be unused and in original packaging</li>
                  <li>Raise a return request via My Account or WhatsApp</li>
                  <li>Refund processed in <strong>3–5 business days</strong></li>
                  <li>Free pickup for all returns across India</li>
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'reviews' && (
            <div className={styles.reviewsTab}>
              <div className={styles.reviewSummary}>
                <div className={styles.reviewBigScore}>
                  <span className={styles.bigScoreNum}>{product.stars}.0</span>
                  <div className={styles.bigStars}>
                    {stars.map((s, i) => <span key={i} className={s === '★' ? styles.starFilled : styles.starEmpty}>{s}</span>)}
                  </div>
                  <span className={styles.bigReviewCount}>{product.reviewCount} reviews</span>
                </div>
                <div className={styles.ratingBars}>
                  {[5,4,3,2,1].map((n) => (
                    <div key={n} className={styles.ratingBarRow}>
                      <span>{n}★</span>
                      <div className={styles.barTrack}>
                        <div className={styles.barFill} style={{ width: `${n===5?70:n===4?20:n===3?7:n===2?2:1}%` }} />
                      </div>
                      <span>{n===5?'70%':n===4?'20%':n===3?'7%':n===2?'2%':'1%'}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className={styles.reviewList}>
                {REVIEWS.map((r, i) => (
                  <div key={i} className={styles.reviewCard}>
                    <div className={styles.reviewHeader}>
                      <span className={styles.reviewAvatar}>{r.avatar}</span>
                      <div>
                        <div className={styles.reviewName}>{r.name}</div>
                        <div className={styles.reviewMeta}>{r.location} · {r.date}</div>
                      </div>
                      <div className={styles.reviewStars}>{'★'.repeat(r.stars)}{'☆'.repeat(5-r.stars)}</div>
                    </div>
                    <p className={styles.reviewText}>{r.text}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Related Products Carousel ──────────────────── */}
      {related.length > 0 && (
        <div className={styles.relatedSection}>
          <div className={styles.relatedHeader}>
            <h2 className={styles.relatedTitle}>You may also like</h2>
            <div className={styles.relatedControls}>
              <button className={styles.carouselNavBtn} onClick={carousel.prev} type="button" aria-label="Previous">‹</button>
              <button className={styles.carouselNavBtn} onClick={carousel.next} type="button" aria-label="Next">›</button>
              <Link href="/products" className={styles.relatedViewAll}>View all →</Link>
            </div>
          </div>

          {/* Carousel viewport */}
          <div className={styles.carouselViewport} ref={carousel.viewportRef}>
            {carousel.cardWidth > 0 && (
              <div
                className={`${styles.carouselTrack} ${carousel.isDragging ? styles.carouselTrackDragging : ''}`}
                style={{
                  transform: `translateX(${carousel.trackOffset}px)`,
                  transition: carousel.animate ? 'transform 0.42s cubic-bezier(0.25,0.46,0.45,0.94)' : 'none',
                }}
                {...carousel.dragHandlers}
              >
                {clonedRelated.map((p, idx) => {
                  const id = String(p.id);
                  return (
                    <div key={`${id}-${idx}`} style={{ width: `${carousel.cardWidth}px`, minWidth: `${carousel.cardWidth}px`, flexShrink: 0, boxSizing: 'border-box' }}>
                      <RelatedCard
                        product={p}
                        wishlisted={relWishlist.has(id)}
                        wishPending={relWishPend.has(id)}
                        cartState={relCartStates[id] ?? 'idle'}
                        onWishlist={() => !carousel.isDragging && toggleRelWishlist(id)}
                        onAddToCart={() => !carousel.isDragging && addRelToCart(p)}
                        onQuickView={() => !carousel.isDragging && openQv(p)}
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Dots */}
          {carousel.dotCount > 1 && (
            <div className={styles.carouselDots}>
              {Array.from({ length: carousel.dotCount }).map((_, i) => (
                <span
                  key={i} role="button" tabIndex={0}
                  className={`${styles.carouselDot} ${i === carousel.activeDot ? styles.carouselDotActive : ''}`}
                  onClick={() => carousel.goToPage(i)}
                  onKeyDown={(e) => e.key === 'Enter' && carousel.goToPage(i)}
                  aria-label={`Go to slide ${i + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Newsletter Banner ────────────────────────── */}
      <div className={styles.newsletterBanner}>
        <div className={styles.newsletterLeft}>
          <div className={styles.newsletterGiftEmoji} aria-hidden="true">🎁</div>
          <div className={styles.newsletterStars} aria-hidden="true">✨</div>
        </div>
        <div className={styles.newsletterBody}>
          <h3 className={styles.newsletterTitle}>Join Little Loot Club &amp; Save More!</h3>
          <p className={styles.newsletterSub}>Get 10% off on your first order, early access to sales &amp; exclusive member perks.</p>
        </div>
        <div className={styles.newsletterForm}>
          <input
            type="email"
            className={styles.newsletterInput}
            placeholder="Enter your email address"
            aria-label="Email address for newsletter"
          />
          <button className={styles.newsletterBtn} type="button">Join Now →</button>
        </div>
      </div>

      {/* ── Footer ───────────────────────────────────────── */}
      <footer className={styles.footer}>
        <div className={styles.footerTop}>
          {/* Brand */}
          <div className={styles.footerBrand}>
            <div className={styles.footerLogo}>
              <span className={styles.footerLogoIcon}>🙂</span>
              <span className={styles.footerLogoText}>Little Loot</span>
            </div>
            <p className={styles.footerDesc}>
              Your one-stop destination for premium kids toys, creative stationery, and educational games. Bringing joy to every child!
            </p>
            <div className={styles.footerSocials}>
              {/* Instagram */}
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className={styles.footerSocialBtn} aria-label="Instagram">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
                </svg>
              </a>
              {/* Facebook */}
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className={styles.footerSocialBtn} aria-label="Facebook">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </a>
              {/* YouTube */}
              <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" className={styles.footerSocialBtn} aria-label="YouTube">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
              </a>
              {/* Pinterest */}
              <a href="https://pinterest.com" target="_blank" rel="noopener noreferrer" className={styles.footerSocialBtn} aria-label="Pinterest">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.373 0 0 5.373 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 0 1 .083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.632-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z"/>
                </svg>
              </a>
            </div>
          </div>

          {/* Information links */}
          <div className={styles.footerCol}>
            <h4 className={styles.footerColTitle}>Information</h4>
            <ul className={styles.footerLinks}>
              <li><Link href="/about"    className={styles.footerLink}>About Us</Link></li>
              <li><Link href="/delivery" className={styles.footerLink}>Delivery Policy</Link></li>
              <li><Link href="/returns" className={styles.footerLink}>Return Policy</Link></li>
              <li><Link href="/privacy"  className={styles.footerLink}>Privacy Policy</Link></li>
              <li><Link href="/terms"    className={styles.footerLink}>Terms &amp; Conditions</Link></li>
              <li><Link href="/sitemap"  className={styles.footerLink}>Sitemap</Link></li>
            </ul>
          </div>

          {/* My Account links */}
          <div className={styles.footerCol}>
            <h4 className={styles.footerColTitle}>My Account</h4>
            <ul className={styles.footerLinks}>
              <li><Link href="/signin"   className={styles.footerLink}>Sign In</Link></li>
              <li><Link href="/orders"   className={styles.footerLink}>My Orders</Link></li>
              <li><Link href="/wishlist" className={styles.footerLink}>Wishlist</Link></li>
              <li><Link href="/track"    className={styles.footerLink}>Track Order</Link></li>
              <li><Link href="/contact"  className={styles.footerLink}>Contact Us</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div className={styles.footerCol}>
            <h4 className={styles.footerColTitle}>Contact Us</h4>
            <ul className={styles.footerContacts}>
              <li>
                <span className={styles.footerContactIcon}>📍</span>
                <span>123 Market Street, Guntur,<br />Andhra Pradesh 522001</span>
              </li>
              <li>
                <span className={styles.footerContactIcon}>📞</span>
                <a href="tel:+919876543210" className={styles.footerLink}>+91 98765 43210</a>
              </li>
              <li>
                <span className={styles.footerContactIcon}>✉️</span>
                <a href="mailto:hello@littleloot.in" className={styles.footerLink}>hello@littleloot.in</a>
              </li>
              <li>
                <span className={styles.footerContactIcon}>🕐</span>
                <span>Mon–Sat: 9am – 7pm</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Footer bottom bar */}
        <div className={styles.footerBottom}>
          <p className={styles.footerCopy}>© 2026 Little Loot. All rights reserved.</p>
          <div className={styles.footerPayments}>
            <span className={styles.footerPayBadge}>UPI</span>
            <span className={styles.footerPayBadge} style={{ color: '#1A1F71', fontWeight: 800 }}>VISA</span>
            <span className={styles.footerPayBadge} style={{ color: '#EB001B' }}>
              <svg width="32" height="20" viewBox="0 0 38 24" fill="none">
                <circle cx="15" cy="12" r="10" fill="#EB001B" opacity="0.9"/>
                <circle cx="23" cy="12" r="10" fill="#F79E1B" opacity="0.9"/>
              </svg>
            </span>
            <span className={styles.footerPayBadge} style={{ color: '#4CAF50', fontWeight: 800 }}>RuPay</span>
          </div>
        </div>
      </footer>

      {/* ── Quick View Modal ─────────────────────────── */}
      {qvProduct && (
        <div className={styles.qvOverlay} onClick={closeQv} role="dialog" aria-modal="true" aria-label={`Quick view: ${qvProduct.name}`}>
          <div className={styles.qvModal} onClick={(e) => e.stopPropagation()}>
            <button className={styles.qvClose} onClick={closeQv} type="button" aria-label="Close">✕</button>
            <div className={styles.qvGrid}>
              <div className={styles.qvImgCol}>
                <div className={styles.qvMainImg}>
                  {qvProduct.images[qvActiveImg] ? (
                    <Image src={qvProduct.images[qvActiveImg]} alt={qvProduct.name} fill sizes="(max-width: 768px) 100vw, 45vw" className={styles.qvMainImgTag} />
                  ) : (
                    <div className={styles.qvEmojiThumb}>🎁</div>
                  )}
                  {qvProduct.badges.length > 0 && (
                    <div className={styles.qvBadges}>
                      {qvProduct.badges.map((b) => (
                        <span key={b.label} className={styles.qvBadge} style={{ background: BADGE_BG[b.type] ?? '#ccc', color: BADGE_TEXT[b.type] ?? '#000' }}>{b.label}</span>
                      ))}
                    </div>
                  )}
                </div>
                {qvProduct.images.length > 1 && (
                  <div className={styles.qvThumbs}>
                    {qvProduct.images.map((img, i) => (
                      <button key={i} type="button" className={`${styles.qvThumb} ${i === qvActiveImg ? styles.qvThumbActive : ''}`} onClick={() => setQvActiveImg(i)}>
                        <Image src={img} alt={`View ${i + 1}`} fill sizes="64px" className={styles.qvThumbImg} />
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className={styles.qvInfoCol}>
                <div className={styles.qvCategory}>{qvProduct.subcategory || qvProduct.category}</div>
                <h2 className={styles.qvName}>{qvProduct.name}</h2>
                <div className={styles.qvStars}>
                  {'★'.repeat(Math.round(qvProduct.stars))}{'☆'.repeat(5 - Math.round(qvProduct.stars))}
                  <span className={styles.qvReviews}>({qvProduct.reviewCount} reviews)</span>
                </div>
                <div className={styles.qvPrice}>
                  <span className={styles.qvPriceNow}>₹{fmt(qvProduct.price)}</span>
                  {qvProduct.originalPrice > qvProduct.price && (
                    <><span className={styles.qvPriceWas}>₹{fmt(qvProduct.originalPrice)}</span><span className={styles.qvPriceSave}>Save ₹{fmt(qvProduct.originalPrice - qvProduct.price)}</span></>
                  )}
                </div>
                <div className={qvProduct.inStock ? styles.qvInStock : styles.qvOutStock}>
                  {qvProduct.inStock ? '✅ In Stock' : '❌ Out of Stock'}
                </div>
                {qvProduct.description && <p className={styles.qvDesc}>{qvProduct.description}</p>}
                <div className={styles.qvActions}>
                  <div className={styles.qvQty}>
                    <button type="button" className={styles.qvQtyBtn} onClick={() => setQvQty((q) => Math.max(1, q - 1))} disabled={qvQty <= 1}>−</button>
                    <span className={styles.qvQtyNum}>{qvQty}</span>
                    <button type="button" className={styles.qvQtyBtn} onClick={() => setQvQty((q) => q + 1)} disabled={!qvProduct.inStock}>+</button>
                  </div>
                  <button type="button"
                    className={`${styles.qvAddBtn} ${qvCartState === 'added' ? styles.qvAddBtnAdded : qvCartState === 'error' ? styles.qvAddBtnError : qvCartState === 'loading' ? styles.qvAddBtnLoading : ''}`}
                    disabled={!qvProduct.inStock || qvCartState === 'loading'}
                    onClick={handleQvAddToCart}
                  >
                    {qvCartState === 'loading' ? 'Adding…' : qvCartState === 'added' ? '✓ Added to Cart!' : qvCartState === 'error' ? '✗ Try Again' : '🛒 Add to Cart'}
                  </button>
                </div>
                <Link href={`/product/${qvProduct.id}`} className={styles.qvFullLink} onClick={closeQv}>View Full Details →</Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}