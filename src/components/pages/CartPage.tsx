'use client';

import { useState, useEffect, useRef, useCallback, memo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import styles from './CartPage.module.css';
import { _get, _post, _delete } from '@/shared/fetchwrapper';
import { useCart, type CartItem } from '@/context/CartContext';

/* ─── Types ──────────────────────────────────────────────────────────────── */
interface CouponState {
  code: string;
  applied: boolean;
  discountAmount: number;   // ← authoritative amount from the server
  message: string;
  error: boolean;
}
interface BackendProduct {
  id: string | number; name: string; category: string;
  sub_category_name?: string; sub_category_slug?: string; description: string;
  original_price: number; amount_discount: number; percentage_discount: number;
  count: number; details: string[];
  product_image: { url: string; public_id?: string }[] | string[];
  rating?: number; review_count?: number;
}
interface MappedProduct {
  id: string | number; name: string; category: string; subcategory: string;
  description: string; price: number; originalPrice: number; discount: number;
  stars: number; reviewCount: number; inStock: boolean; stockCount: number;
  images: string[]; highlights: string[]; badges: { label: string; type: string }[];
}
type RelCartState = 'idle' | 'loading' | 'added' | 'error';

/* ─── Icon set (shared inline SVG — replaces all emoji iconography) ─────────── */
type IconName =
  | 'lock' | 'truck' | 'return' | 'card' | 'tag' | 'gift' | 'bookmark' | 'shield'
  | 'spark' | 'cart' | 'chevronLeft' | 'chevronRight' | 'close' | 'check'
  | 'checkBadge' | 'alert' | 'phone' | 'bank' | 'arrowRight';

const Icon = memo(function Icon(
  { name, size = 18, className }: { name: IconName; size?: number; className?: string },
) {
  const c = {
    width: size, height: size, viewBox: '0 0 24 24', fill: 'none',
    stroke: 'currentColor', strokeWidth: 1.8,
    strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const,
    className, 'aria-hidden': true,
  };
  switch (name) {
    case 'lock':         return <svg {...c}><rect x="4" y="11" width="16" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>;
    case 'truck':        return <svg {...c}><path d="M3 7h11v8H3z"/><path d="M14 10h4l3 3v2h-7z"/><circle cx="7" cy="18" r="1.5"/><circle cx="17.5" cy="18" r="1.5"/></svg>;
    case 'return':       return <svg {...c}><path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 4v5h5"/></svg>;
    case 'card':         return <svg {...c}><rect x="3" y="6" width="18" height="12" rx="2"/><path d="M3 10h18"/></svg>;
    case 'tag':          return <svg {...c}><path d="M20 12.5 12.5 20 4 11.5V4h7.5z"/><circle cx="8.5" cy="8.5" r="1.1" fill="currentColor" stroke="none"/></svg>;
    case 'gift':         return <svg {...c}><rect x="4" y="9" width="16" height="11" rx="1.5"/><path d="M2 9h20M12 9v11M12 9S9 3.5 6.7 5.3 9 9 12 9zM12 9s3-5.5 5.3-3.7S15 9 12 9z"/></svg>;
    case 'bookmark':     return <svg {...c}><path d="M6 4h12v16l-6-4-6 4z"/></svg>;
    case 'shield':       return <svg {...c}><path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z"/><path d="m9 12 2 2 4-4"/></svg>;
    case 'spark':        return <svg {...c}><path d="M12 3l1.8 4.7L18.5 9l-4.7 1.3L12 15l-1.8-4.7L5.5 9l4.7-1.3z"/></svg>;
    case 'cart':         return <svg {...c}><circle cx="9" cy="20" r="1.4"/><circle cx="18" cy="20" r="1.4"/><path d="M2 3h3l2.2 11a1.6 1.6 0 0 0 1.6 1.3h8a1.6 1.6 0 0 0 1.6-1.3L21 7H6"/></svg>;
    case 'chevronLeft':  return <svg {...c}><polyline points="14 6 8 12 14 18"/></svg>;
    case 'chevronRight': return <svg {...c}><polyline points="10 6 16 12 10 18"/></svg>;
    case 'close':        return <svg {...c}><path d="M6 6l12 12M18 6 6 18"/></svg>;
    case 'check':        return <svg {...c}><polyline points="4 12 9 17 20 6"/></svg>;
    case 'checkBadge':   return <svg {...c}><path d="M12 3l2.1 1.5 2.6-.2.9 2.5 2.2 1.4-.8 2.5.8 2.5-2.2 1.4-.9 2.5-2.6-.2L12 21l-2.1-1.5-2.6.2-.9-2.5L4.2 15l.8-2.5-.8-2.5 2.2-1.4.9-2.5 2.6.2z"/><polyline points="9 12 11 14 15 10"/></svg>;
    case 'alert':        return <svg {...c}><path d="M12 4 2 20h20z"/><path d="M12 10v4"/><circle cx="12" cy="17" r="0.6" fill="currentColor" stroke="none"/></svg>;
    case 'phone':        return <svg {...c}><rect x="7" y="3" width="10" height="18" rx="2"/><path d="M11 18h2"/></svg>;
    case 'bank':         return <svg {...c}><path d="M4 10h16M5 10v8M9 10v8M15 10v8M19 10v8M3 20h18M12 3 4 8h16z"/></svg>;
    case 'arrowRight':   return <svg {...c}><path d="M4 12h15"/><polyline points="13 6 19 12 13 18"/></svg>;
    default:             return null;
  }
});

/* ─── Badge helpers ──────────────────────────────────────────────────────── */
const BADGE_BG: Record<string, string>   = { sale: '#FF6B5B', new: '#3ECFB2', hot: '#FFD336' };
const BADGE_TEXT: Record<string, string> = { sale: '#fff',    new: '#fff',    hot: '#1A2540' };

/* ─── Map backend → MappedProduct (same precedence as ProductPage) ────────── */
function extractImageUrls(raw: { url: string }[] | string[] | undefined): string[] {
  if (!raw || !Array.isArray(raw)) return [];
  return raw.map((img) => (typeof img === 'string' ? img : img?.url ?? '')).filter(Boolean);
}
function mapBackendProduct(p: BackendProduct): MappedProduct {
  const images        = extractImageUrls(p.product_image as any);
  const originalPrice = p.original_price  ?? 0;
  const amountDiscount= p.amount_discount ?? 0;
  const pctDiscount   = p.percentage_discount ?? 0;
  let price = originalPrice;
  if (amountDiscount > 0)   price = originalPrice - amountDiscount;
  else if (pctDiscount > 0) price = Math.round(originalPrice - (originalPrice * pctDiscount) / 100);
  if (!Number.isFinite(price) || price < 0) price = 0;
  const effDiscount = originalPrice > 0 && price < originalPrice
    ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0;
  const badges = effDiscount > 0 ? [{ label: `${effDiscount}% OFF`, type: 'sale' }] : [];
  return {
    id: p.id, name: p.name ?? 'Unnamed Product', category: p.category ?? '',
    subcategory: p.sub_category_name ?? p.sub_category_slug ?? p.category ?? '',
    description: p.description ?? '', price, originalPrice, discount: effDiscount,
    stars: Math.min(5, Math.max(0, p.rating ?? 4)), reviewCount: p.review_count ?? 0,
    inStock: (p.count ?? 0) > 0, stockCount: p.count ?? 0,
    images: images.length > 0 ? images : [],
    highlights: Array.isArray(p.details) ? p.details : [], badges,
  };
}

const fmt = (n: number) => Number.isFinite(n) && n > 0 ? n.toLocaleString('en-IN') : '0';
const PLACEHOLDER_IMG = '/images/placeholder-product.png';

/* ─── ProductImg ─────────────────────────────────────────────────────────── */
function ProductImg({ src, alt, className }: { src: string; alt: string; className: string }) {
  const [err, setErr] = useState(false);
  const safe = !err && src && (src.startsWith('http') || src.startsWith('/')) ? src : null;
  return (
    <Image src={safe ?? PLACEHOLDER_IMG} alt={alt} fill
      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
      className={className} onError={() => setErr(true)} />
  );
}

/* ─── RelatedCard (kept in parity with ProductPage; memoized) ──────────────── */
interface RelatedCardProps {
  product: MappedProduct; wishlisted: boolean; wishPending: boolean;
  cartState: RelCartState; onWishlist: () => void; onAddToCart: () => void; onQuickView: () => void;
}
const RelatedCard = memo(function RelatedCard(
  { product, wishlisted, wishPending, cartState, onWishlist, onAddToCart, onQuickView }: RelatedCardProps,
) {
  const router = useRouter();
  const stars  = Math.min(5, Math.max(0, Math.round(product.stars)));
  const hasSave= product.originalPrice > product.price && product.originalPrice > 0;
  const off    = product.discount > 0
    ? product.discount
    : (hasSave ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100) : 0);
  const hasImg = product.images.length > 0;
  return (
    <article className={styles.relCard}>
      <button className={[styles.relWishBtn, wishlisted ? styles.relWishlisted : '', wishPending ? styles.relWishPending : ''].filter(Boolean).join(' ')}
        onClick={onWishlist} disabled={wishPending} type="button"
        aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'} aria-pressed={wishlisted}>
        {wishPending ? '⏳' : wishlisted ? '❤️' : '🤍'}
      </button>
      <div className={styles.relCardImg}
        onClick={(e) => { if ((e.target as HTMLElement).closest(`.${styles.relCardOverlay}`)) return; router.push(`/product/${product.id}`); }}
        style={{ cursor: 'pointer' }}>
        {hasImg ? <ProductImg src={product.images[0]} alt={product.name} className={styles.relCardImageTag} />
                : <div className={styles.relCardEmoji} aria-hidden="true">🎁</div>}
        {!product.inStock && <div className={styles.relOutOfStock}>Out of Stock</div>}
        <button type="button" className={styles.relCardOverlay}
          onClick={(e) => { e.stopPropagation(); e.preventDefault(); onQuickView(); }}>
          <span className={styles.relQuickView}>Quick View</span>
        </button>
      </div>
      <div className={styles.relCardBody}>
        <Link href={`/product/${product.id}`} className={styles.relCardNameLink}>
          <h3 className={styles.relCardName}>{product.name}</h3>
        </Link>
        <div className={styles.relCardStars} aria-label={`${stars} out of 5 stars`}>
          {'★'.repeat(stars)}{'☆'.repeat(5 - stars)}
          <span className={styles.relCardReviews}>({product.reviewCount})</span>
        </div>
        <div className={styles.relCardPrice}>
          <span className={styles.relPriceNow}>₹{fmt(product.price)}</span>
          {hasSave && <span className={styles.relPriceWas}>₹{fmt(product.originalPrice)}</span>}
          {off > 0 && <span className={styles.relPriceOff}>{off}% off</span>}
        </div>
        <button className={[styles.relAddBtn, !product.inStock ? styles.relAddBtnDisabled : '', cartState === 'added' ? styles.relAddBtnAdded : '', cartState === 'error' ? styles.relAddBtnError : '', cartState === 'loading' ? styles.relAddBtnLoading : ''].filter(Boolean).join(' ')}
          type="button" disabled={!product.inStock || cartState === 'loading'} onClick={onAddToCart}>
          {cartState === 'loading' ? '…' : cartState === 'added' ? '✓ Added' : cartState === 'error' ? '✗ Retry' : product.inStock ? 'Add to Cart' : 'Notify Me'}
        </button>
      </div>
    </article>
  );
});

/* ─── Carousel Hook (2/3/4/5/6 columns, matched to ProductPage) ────────────── */
const GAP = 14;
const AUTOPLAY_MS = 3500;
function useCarousel(itemCount: number) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const [visibleCount, setVisibleCount] = useState(4);
  const [cardWidth, setCardWidth]       = useState(0);
  const [rawIndex, setRawIndex]         = useState(itemCount);
  const [animate, setAnimate]           = useState(true);
  const [isDragging, setIsDragging]     = useState(false);
  const isHovered  = useRef(false);
  const dragActive = useRef(false);
  const dragStartX = useRef(0);
  const dragCurrentX = useRef(0);
  const autoTimer  = useRef<ReturnType<typeof setInterval> | null>(null);

  const columnsFor = (w: number) => (w < 400 ? 2 : w < 640 ? 3 : w < 900 ? 4 : w < 1200 ? 5 : 6);

  const measure = useCallback((node: HTMLDivElement | null) => {
    (viewportRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
    if (!node) return;
    const elWidth = node.offsetWidth;
    const winWidth = typeof window !== 'undefined' ? window.innerWidth : elWidth;
    const count = columnsFor(winWidth);
    setVisibleCount(count);
    setCardWidth((elWidth - GAP * (count - 1)) / count);
  }, []);

  const recalculate = useCallback(() => {
    if (!viewportRef.current) return;
    const elWidth  = viewportRef.current.offsetWidth;
    const winWidth = typeof window !== 'undefined' ? window.innerWidth : elWidth;
    const count    = columnsFor(winWidth);
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
    if (rawIndex >= itemCount * 2) { const t = setTimeout(() => { setAnimate(false); setRawIndex(p => p - itemCount); }, 430); return () => clearTimeout(t); }
    if (rawIndex < itemCount)      { const t = setTimeout(() => { setAnimate(false); setRawIndex(p => p + itemCount); }, 430); return () => clearTimeout(t); }
  }, [rawIndex, itemCount]);

  useEffect(() => { if (!animate) { const id = requestAnimationFrame(() => setAnimate(true)); return () => cancelAnimationFrame(id); } }, [animate]);

  const stopAuto  = useCallback(() => { if (autoTimer.current) { clearInterval(autoTimer.current); autoTimer.current = null; } }, []);
  const startAuto = useCallback(() => {
    if (itemCount < 2) return;
    stopAuto();
    autoTimer.current = setInterval(() => {
      if (!isHovered.current && !dragActive.current) { setAnimate(true); setRawIndex(p => p + 1); }
    }, AUTOPLAY_MS);
  }, [itemCount, stopAuto]);

  useEffect(() => { startAuto(); return stopAuto; }, [startAuto, stopAuto]);

  const go      = useCallback((delta: number) => { stopAuto(); setAnimate(true); setRawIndex(p => p + delta); setTimeout(startAuto, AUTOPLAY_MS + 600); }, [startAuto, stopAuto]);
  const prev    = useCallback(() => go(-1), [go]);
  const next    = useCallback(() => go(1),  [go]);
  const goToPage= useCallback((pageIdx: number) => { stopAuto(); setAnimate(true); setRawIndex(itemCount + pageIdx * visibleCount); setTimeout(startAuto, AUTOPLAY_MS + 600); }, [itemCount, visibleCount, startAuto, stopAuto]);

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
    viewportRef: measure, visibleCount, cardWidth, trackOffset, animate, isDragging,
    prev, next, goToPage, dotCount, activeDot,
    dragHandlers: { onTouchStart, onTouchMove, onTouchEnd, onMouseDown, onMouseMove, onMouseUp, onMouseEnter, onMouseLeave },
  };
}

/* ─── Coupons ────────────────────────────────────────────────────────────── */

const DELIVERY_FEE            = 49;
const FREE_DELIVERY_THRESHOLD = 499;

const lineKey = (i: { id: string | number; color?: string }) => `${i.id}::${i.color ?? ''}`;

/* ─── Component ──────────────────────────────────────────────────────────── */
export default function CartPage() {
  const { state, addItem, updateQuantity, removeItem, refresh, pushToast } = useCart();
  const router = useRouter();
  const items = state.items;

  const [coupon, setCoupon]           = useState<CouponState>({ code: '', applied: false, discountAmount: 0, message: '', error: false });
const [couponLoading, setCouponLoading] = useState(false);
  const [couponInput, setCouponInput] = useState('');
  const [removingKey, setRemovingKey] = useState<string | null>(null);
  const [savedItems, setSavedItems]   = useState<CartItem[]>([]);
  const [giftOpen, setGiftOpen]       = useState(false);

  const [giftMessage, setGiftMessage] = useState('');
  const [giftSaved,   setGiftSaved]   = useState(false);

  // Load any previously-saved gift message (survives refresh; PaymentButton reads this key at checkout)
  useEffect(() => {
    try {
      const saved = localStorage.getItem('littleloot_gift_message');
      if (saved) { setGiftMessage(saved); setGiftSaved(true); setGiftOpen(true); }
    } catch {}
  }, []);

  function saveGiftMessage() {
    const msg = giftMessage.trim().slice(0, 500);
    setGiftMessage(msg);
    try {
      if (msg) localStorage.setItem('littleloot_gift_message', msg);
      else     localStorage.removeItem('littleloot_gift_message');
    } catch {}
    setGiftSaved(true);
    pushToast(msg ? 'Gift message saved' : 'Gift message cleared', 'success');
  }
  function clearGiftMessage() {
    setGiftMessage('');
    try { localStorage.removeItem('littleloot_gift_message'); } catch {}
    setGiftSaved(false);
  }

  /* Delivery estimate (client-only → no hydration mismatch) */
  const [deliveryRange, setDeliveryRange] = useState('');
  const [deliveryBy, setDeliveryBy]       = useState('');
  useEffect(() => {
    const opts = { weekday: 'short', day: 'numeric', month: 'short' } as const;
    const s = new Date(); s.setDate(s.getDate() + 3);
    const e = new Date(); e.setDate(e.getDate() + 6);
    setDeliveryRange(`${s.toLocaleDateString('en-IN', opts)} – ${e.toLocaleDateString('en-IN', opts)}`);
    setDeliveryBy(e.toLocaleDateString('en-IN', opts));
  }, []);

  /* Related products state */
  const [related,       setRelated]       = useState<MappedProduct[]>([]);
  const [relWishlist,   setRelWishlist]   = useState<Set<string>>(new Set());
  const [relWishPend,   setRelWishPend]   = useState<Set<string>>(new Set());
  const [relCartStates, setRelCartStates] = useState<Record<string, RelCartState>>({});

  const carousel      = useCarousel(related.length);
  const clonedRelated = [...related, ...related, ...related];

  /* Quick view state */
  const [qvProduct,   setQvProduct]   = useState<MappedProduct | null>(null);
  const [qvActiveImg, setQvActiveImg] = useState(0);
  const [qvQty,       setQvQty]       = useState(1);
  const [qvCartState, setQvCartState] = useState<'idle' | 'loading' | 'added' | 'error'>('idle');

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') closeQv(); };
    if (qvProduct) window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [qvProduct]);

  function openQv(p: MappedProduct) { setQvProduct(p); setQvActiveImg(0); setQvQty(1); setQvCartState('idle'); document.body.style.overflow = 'hidden'; }
  function closeQv()                { setQvProduct(null); document.body.style.overflow = ''; }

  /* Fetch wishlist */
  useEffect(() => {
    _get('/api/favorite')
      .then((res: any) => {
        const arr: any[] = Array.isArray(res) ? res : (res?.data ?? []);
        const ids = arr.map((i: any) => typeof i === 'string' ? i : String(i.product_id ?? i.productId ?? i.id ?? ''));
        setRelWishlist(new Set(ids));
      }).catch(() => {});
  }, []);

  /* Fetch related/featured products */
  useEffect(() => {
    _get('/api/product/featured')
      .then((res: any) => {
        const raw: BackendProduct[] = Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : [];
        setRelated(raw.slice(0, 12).map(mapBackendProduct));
      }).catch(() => {});
  }, []);

  

  /* Related: wishlist toggle (via wrapper → token attached) */
  const toggleRelWishlist = useCallback(async (id: string) => {
    if (relWishPend.has(id)) return;
    const was = relWishlist.has(id);
    setRelWishlist((prev) => { const n = new Set(prev); was ? n.delete(id) : n.add(id); return n; });
    setRelWishPend((prev) => new Set(prev).add(id));
    try {
      if (was) await _delete(`/api/favorite/${id}`);
      else     await _post(`/api/favorite/${id}`, {});
    } catch {
      setRelWishlist((prev) => { const n = new Set(prev); was ? n.add(id) : n.delete(id); return n; });
    } finally {
      setRelWishPend((prev) => { const n = new Set(prev); n.delete(id); return n; });
    }
  }, [relWishlist, relWishPend]);

  /* Related: add to cart (optimism + rollback handled in context) */
  const addRelToCart = useCallback(async (p: MappedProduct) => {
    const id = String(p.id);
    if (relCartStates[id] === 'loading') return;
    setRelCartStates((prev) => ({ ...prev, [id]: 'loading' }));
    const res = await addItem({
      id: p.id, name: p.name, price: p.price, originalPrice: p.originalPrice,
      quantity: 1, image: p.images[0] ?? '', category: p.category,
      product_count: p.stockCount, is_available: p.inStock,
    });
    if (res.ok) {
      setRelCartStates((prev) => ({ ...prev, [id]: 'added' }));
      setTimeout(() => setRelCartStates((prev) => ({ ...prev, [id]: 'idle' })), 2000);
    } else {
      pushToast(res.error || 'Could not add to cart', 'error');
      setRelCartStates((prev) => ({ ...prev, [id]: 'error' }));
      setTimeout(() => setRelCartStates((prev) => ({ ...prev, [id]: 'idle' })), 2500);
    }
  }, [relCartStates, addItem, pushToast]);

  /* Quick view: add to cart */
  async function handleQvAddToCart() {
    if (!qvProduct || qvCartState === 'loading') return;
    setQvCartState('loading');
    const res = await addItem({
      id: qvProduct.id, name: qvProduct.name, price: qvProduct.price,
      originalPrice: qvProduct.originalPrice, quantity: qvQty,
      image: qvProduct.images[0] ?? '', category: qvProduct.category,
      product_count: qvProduct.stockCount, is_available: qvProduct.inStock,
    });
    if (res.ok) { setQvCartState('added'); setTimeout(() => setQvCartState('idle'), 2000); }
    else { pushToast(res.error || 'Could not add to cart', 'error'); setQvCartState('error'); setTimeout(() => setQvCartState('idle'), 2500); }
  }

  /* ─── Cart handlers (logic unchanged) ─────────────────────────────────── */
  function updateQty(item: typeof items[0], delta: number) {
    updateQuantity({ id: item.id, color: item.color ?? '', cartItemId: item.cartItemId }, item.quantity + delta);
  }
  function handleRemove(item: typeof items[0]) {
    const key = lineKey(item);
    setRemovingKey(key);
    setTimeout(() => { removeItem({ id: item.id, color: item.color ?? '', cartItemId: item.cartItemId }); setRemovingKey(null); }, 320);
  }
  function saveForLater(item: typeof items[0]) {
    setSavedItems((prev) => [...prev, item as CartItem]);
    removeItem({ id: item.id, color: item.color ?? '', cartItemId: item.cartItemId });
  }
  async function moveToCart(item: CartItem) {
    const res = await addItem({
      id: item.id, name: item.name, price: item.price,
      originalPrice: item.originalPrice ?? item.price, quantity: item.quantity,
      image: item.image ?? '', color: item.color ?? '', color_hex: item.color_hex ?? '',
      category: item.category ?? '', product_count: item.product_count ?? 0,
      is_available: item.is_available ?? true,
    });
    if (res.ok) setSavedItems((prev) => prev.filter((i) => lineKey(i) !== lineKey(item)));
    else pushToast(res.error || 'Could not move to cart', 'error');
  }
async function applyCoupon() {
    const code = couponInput.trim().toUpperCase();
    if (!code) {
      setCoupon({ code: '', applied: false, discountAmount: 0, message: 'Please enter a coupon code.', error: true });
      return;
    }
    if (subtotal <= 0) {
      setCoupon({ code: '', applied: false, discountAmount: 0, message: 'Add items before applying a coupon.', error: true });
      return;
    }
    setCouponLoading(true);
    try {
      const res: any = await _post('/api/admin/coupons/validate', { code, order_total: subtotal });
      // Backend returns { valid, code, discount_type, discount_value, discount_amount, message }
      setCoupon({
        code: res.code ?? code,
        applied: true,
        discountAmount: Math.max(0, Math.min(subtotal, Number(res.discount_amount) || 0)),
        message: res.message || 'Coupon applied!',
        error: false,
      });
    } catch (e: any) {
      // FastAPI HTTPException detail → the exact reason (expired / min order / usage / invalid)
      const detail = e?.detail || e?.message || 'Invalid coupon code.';
      setCoupon({ code: '', applied: false, discountAmount: 0, message: detail, error: true });
    } finally {
      setCouponLoading(false);
    }
  }
  function removeCoupon() {
    setCoupon({ code: '', applied: false, discountAmount: 0, message: '', error: false });
    setCouponInput('');
  }

  // Persist applied coupon so /checkout can read the code
  useEffect(() => {
    try {
      if (coupon.applied && coupon.code) {
        localStorage.setItem('appliedCoupon', JSON.stringify({ code: coupon.code, discountAmount: coupon.discountAmount }));
      } else {
        localStorage.removeItem('appliedCoupon');
      }
    } catch {}
  }, [coupon.applied, coupon.code, coupon.discountAmount]);


  /* ─── Calculations (unchanged) ────────────────────────────────────────── */
  const subtotal       = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const originalTotal  = items.reduce((s, i) => s + (i.originalPrice ?? i.price) * i.quantity, 0);
  const itemSavings    = Math.max(0, originalTotal - subtotal);
  const isDeliveryFree = subtotal >= FREE_DELIVERY_THRESHOLD;
  const deliveryCharge = items.length === 0 ? 0 : isDeliveryFree ? 0 : DELIVERY_FEE;
  const couponSavings  = coupon.applied ? Math.min(subtotal, coupon.discountAmount) : 0;
  const total          = Math.max(0, subtotal + deliveryCharge - couponSavings);
  const totalSavings   = itemSavings + couponSavings + (isDeliveryFree && items.length > 0 ? DELIVERY_FEE : 0);
  const amountToFreeDelivery = Math.max(0, FREE_DELIVERY_THRESHOLD - subtotal);
  const freeDeliveryProgress = Math.min(100, (subtotal / FREE_DELIVERY_THRESHOLD) * 100);

  const unavailableItems = items.filter((i) => !i.is_available || (i.product_count ?? 0) <= 0);
  const overStockItems   = items.filter((i) => (i.product_count ?? 0) > 0 && i.quantity > (i.product_count ?? 0));
  const hasBlockingIssue = unavailableItems.length > 0 || overStockItems.length > 0;

  function goToCheckout() {
    if (hasBlockingIssue) { pushToast('Remove out-of-stock items or reduce quantities to continue.', 'error'); return; }
    router.push('/checkout');
  }

  /* ─── Toast ──────────────────────────────────────────────────────────── */
  const Toast = state.toast ? (
    <div className={[styles.toast, state.toast.kind === 'success' ? styles.toastSuccess : styles.toastError].filter(Boolean).join(' ')}
      role="status" aria-live="polite">{state.toast.message}</div>
  ) : null;

  // Re-validate an applied coupon whenever the cart subtotal changes
  // (quantity edits, item removal) so the discount stays correct and
  // min-order rules are re-enforced.
  useEffect(() => {
    if (!coupon.applied || !coupon.code) return;
    let cancelled = false;
    (async () => {
      try {
        const res: any = await _post('/api/admin/coupons/validate', { code: coupon.code, order_total: subtotal });
        if (cancelled) return;
        setCoupon((c) => ({ ...c, discountAmount: Math.max(0, Math.min(subtotal, Number(res.discount_amount) || 0)), error: false }));
      } catch (e: any) {
        if (cancelled) return;
        // Coupon no longer valid at the new subtotal (e.g. dropped below min order) → drop it
        setCoupon({ code: '', applied: false, discountAmount: 0, message: e?.detail || 'Coupon no longer applies to this cart.', error: true });
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subtotal]);

  /* ─── Related carousel (plain function → no remount) ─────────────────── */
  function renderRelated() {
    if (related.length === 0) return null;
    return (
      <div className={styles.relatedSection}>
        <div className={styles.relatedHeader}>
          <h2 className={styles.relatedTitle}>You might also like</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button className={styles.carouselNavBtn} onClick={carousel.prev} aria-label="Previous" type="button"><Icon name="chevronLeft" size={18} /></button>
            <button className={styles.carouselNavBtn} onClick={carousel.next} aria-label="Next" type="button"><Icon name="chevronRight" size={18} /></button>
            <Link href="/products" className={styles.relatedViewAll}>View All →</Link>
          </div>
        </div>
        <div className={styles.carouselViewport} ref={carousel.viewportRef}>
          {carousel.cardWidth > 0 && (
            <div className={`${styles.carouselTrack} ${carousel.isDragging ? styles.carouselTrackDragging : ''}`}
              style={{ transform: `translateX(${carousel.trackOffset}px)`, transition: carousel.animate ? 'transform 0.42s cubic-bezier(0.25,0.46,0.45,0.94)' : 'none' }}
              {...carousel.dragHandlers}>
              {clonedRelated.map((p, idx) => {
                const id = String(p.id);
                return (
                  <div key={`${id}-${idx}`} style={{ width: `${carousel.cardWidth}px`, minWidth: `${carousel.cardWidth}px`, flexShrink: 0, boxSizing: 'border-box' }}>
                    <RelatedCard product={p} wishlisted={relWishlist.has(id)} wishPending={relWishPend.has(id)} cartState={relCartStates[id] ?? 'idle'}
                      onWishlist={() => !carousel.isDragging && toggleRelWishlist(id)}
                      onAddToCart={() => !carousel.isDragging && addRelToCart(p)}
                      onQuickView={() => !carousel.isDragging && openQv(p)} />
                  </div>
                );
              })}
            </div>
          )}
        </div>
        {carousel.dotCount > 1 && (
          <div className={styles.carouselDots}>
            {Array.from({ length: carousel.dotCount }).map((_, i) => (
              <span key={i} role="button" tabIndex={0}
                className={`${styles.carouselDot} ${i === carousel.activeDot ? styles.carouselDotActive : ''}`}
                onClick={() => carousel.goToPage(i)} onKeyDown={(e) => e.key === 'Enter' && carousel.goToPage(i)}
                aria-label={`Go to slide ${i + 1}`} />
            ))}
          </div>
        )}
      </div>
    );
  }

  /* ─── Quick View Modal ───────────────────────────────────────────────── */
  const QuickViewModal = qvProduct ? (
    <div className={styles.qvOverlay} onClick={closeQv} role="dialog" aria-modal="true" aria-label={`Quick view: ${qvProduct.name}`}>
      <div className={styles.qvModal} onClick={(e) => e.stopPropagation()}>
        <button className={styles.qvClose} onClick={closeQv} type="button" aria-label="Close"><Icon name="close" size={15} /></button>
        <div className={styles.qvGrid}>
          <div className={styles.qvImgCol}>
            <div className={styles.qvMainImg}>
              {qvProduct.images[qvActiveImg]
                ? <Image src={qvProduct.images[qvActiveImg]} alt={qvProduct.name} fill sizes="(max-width: 768px) 100vw, 45vw" className={styles.qvMainImgTag} />
                : <div className={styles.qvEmojiThumb}>🎁</div>}
              {qvProduct.badges.length > 0 && (
                <div className={styles.qvBadges}>
                  {qvProduct.badges.map((b) => <span key={b.label} className={styles.qvBadge} style={{ background: BADGE_BG[b.type] ?? '#ccc', color: BADGE_TEXT[b.type] ?? '#000' }}>{b.label}</span>)}
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
              <span className={qvProduct.inStock ? styles.qvDotOk : styles.qvDotOut} aria-hidden="true" />
              {qvProduct.inStock ? 'In Stock' : 'Out of Stock'}
            </div>
            {qvProduct.description && <p className={styles.qvDesc}>{qvProduct.description}</p>}
            <div className={styles.qvActions}>
              <div className={styles.qvQty}>
                <button type="button" className={styles.qvQtyBtn} onClick={() => setQvQty((q) => Math.max(1, q - 1))} disabled={qvQty <= 1} aria-label="Decrease quantity">−</button>
                <span className={styles.qvQtyNum}>{qvQty}</span>
                <button type="button" className={styles.qvQtyBtn}
                  onClick={() => setQvQty((q) => Math.min(qvProduct.stockCount || 99, q + 1))}
                  disabled={!qvProduct.inStock || (qvProduct.stockCount > 0 && qvQty >= qvProduct.stockCount)} aria-label="Increase quantity">+</button>
              </div>
              <button type="button"
                className={`${styles.qvAddBtn} ${qvCartState === 'added' ? styles.qvAddBtnAdded : qvCartState === 'error' ? styles.qvAddBtnError : qvCartState === 'loading' ? styles.qvAddBtnLoading : ''}`}
                disabled={!qvProduct.inStock || qvCartState === 'loading'} onClick={handleQvAddToCart}>
                {qvCartState === 'loading' ? 'Adding…' : qvCartState === 'added' ? '✓ Added to Cart!' : qvCartState === 'error' ? '✗ Try Again' : 'Add to Cart'}
              </button>
            </div>
            <Link href={`/product/${qvProduct.id}`} className={styles.qvFullLink} onClick={closeQv}>View Full Details →</Link>
          </div>
        </div>
      </div>
    </div>
  ) : null;

  /* ─── Loading State ──────────────────────────────────────────────────── */
  if (state.status === 'loading' && !state.hydrated) {
    return (
      <div className={styles.page}>
        <div className={styles.breadcrumb}>
          <Link href="/" className={styles.breadLink}>Home</Link>
          <span className={styles.breadSep}>›</span>
          <span className={styles.breadCurrent}>My Cart</span>
        </div>
        <div className={styles.pageHeader}>
          <div><h1 className={styles.pageTitle}>My Cart</h1><p className={styles.pageSubtitle}>Loading…</p></div>
        </div>
        <div className={styles.layout}>
          <div className={styles.cartSkeleton}>
            {[0, 1, 2].map((i) => (
              <div key={i} className={styles.skelItem}>
                <div className={styles.skelThumb} />
                <div className={styles.skelLines}>
                  <div className={styles.skelLine} style={{ width: '38%' }} />
                  <div className={styles.skelLine} style={{ width: '74%' }} />
                  <div className={styles.skelLine} style={{ width: '52%' }} />
                  <div className={styles.skelLine} style={{ width: '30%' }} />
                </div>
              </div>
            ))}
          </div>
          <div className={styles.skelSummary}>
            <div className={styles.skelLine} style={{ width: '55%', height: 18 }} />
            <div className={styles.skelLine} style={{ width: '100%' }} />
            <div className={styles.skelLine} style={{ width: '100%' }} />
            <div className={styles.skelLine} style={{ width: '80%' }} />
            <div className={styles.skelLine} style={{ width: '100%', height: 46, marginTop: 8 }} />
          </div>
        </div>
      </div>
    );
  }

  /* ─── Error State ────────────────────────────────────────────────────── */
  if (state.status === 'error') {
    return (
      <div className={styles.page}>
        <div className={styles.breadcrumb}>
          <Link href="/" className={styles.breadLink}>Home</Link>
          <span className={styles.breadSep}>›</span>
          <span className={styles.breadCurrent}>My Cart</span>
        </div>
        <div className={styles.errorState}>
          <div className={styles.errorIllus}>
            <svg width="96" height="96" viewBox="0 0 96 96" fill="none" aria-hidden="true">
              <circle cx="48" cy="48" r="44" fill="#fdecea" />
              <path d="M32 58h30a11 11 0 0 0 1-22 15 15 0 0 0-28-3" stroke="#e74c3c" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M30 30l36 36" stroke="#e74c3c" strokeWidth="3.2" strokeLinecap="round" />
            </svg>
          </div>
          <h2 className={styles.errorTitle}>We couldn't load your cart</h2>
          <p className={styles.errorText}>{state.error || 'Please check your connection and try again.'}</p>
          <button type="button" className={styles.retryBtn} onClick={() => refresh()}>Try Again</button>
        </div>
      </div>
    );
  }

  /* ─── Empty State ────────────────────────────────────────────────────── */
  if (state.status === 'ready' && items.length === 0 && savedItems.length === 0) {
    return (
      <div className={styles.page}>
        <div className={styles.breadcrumb}>
          <Link href="/" className={styles.breadLink}>Home</Link>
          <span className={styles.breadSep}>›</span>
          <span className={styles.breadCurrent}>My Cart</span>
        </div>
        <div className={styles.emptyState}>
          <div className={styles.emptyIllus}>
            <svg width="120" height="120" viewBox="0 0 120 120" fill="none" aria-hidden="true">
              <circle cx="60" cy="60" r="56" fill="var(--soft)" />
              <path d="M34 44h52l-5 34a6 6 0 0 1-6 5H45a6 6 0 0 1-6-5z" stroke="var(--navy)" strokeWidth="3" strokeLinejoin="round" />
              <path d="M46 44a14 14 0 0 1 28 0" stroke="var(--coral)" strokeWidth="3" strokeLinecap="round" />
              <circle cx="52" cy="64" r="2.6" fill="var(--navy)" />
              <circle cx="68" cy="64" r="2.6" fill="var(--navy)" />
              <path d="M52 73q8 6 16 0" stroke="var(--coral)" strokeWidth="3" strokeLinecap="round" />
            </svg>
          </div>
          <h2 className={styles.emptyTitle}>Your cart is empty!</h2>
          <p className={styles.emptyText}>Looks like you haven't added anything yet. Let's fix that!</p>
          <Link href="/" className={styles.emptyBtn}>Start Shopping →</Link>
        </div>
        {renderRelated()}
        {QuickViewModal}
        {Toast}
      </div>
    );
  }

  /* ─── Main Cart ──────────────────────────────────────────────────────── */
  return (
    <div className={styles.page}>
      <div className={styles.breadcrumb}>
        <Link href="/" className={styles.breadLink}>Home</Link>
        <span className={styles.breadSep}>›</span>
        <span className={styles.breadCurrent}>My Cart</span>
      </div>

      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>My Cart</h1>
          <p className={styles.pageSubtitle}>{`${items.length} item${items.length !== 1 ? 's' : ''} in your cart`}</p>
        </div>
        <Link href="/" className={styles.continueShopping}>← Continue Shopping</Link>
      </div>

      {items.length > 0 && (
        <div className={styles.deliveryBanner}>
          {isDeliveryFree
            ? <span className={`${styles.deliveryMsg} ${styles.deliveryFreeMsg}`}><Icon name="checkBadge" size={18} /> You've unlocked <strong>FREE delivery</strong> on this order!</span>
            : <span className={styles.deliveryMsg}><Icon name="truck" size={18} /> Add <strong>₹{amountToFreeDelivery.toLocaleString('en-IN')}</strong> more for <strong>FREE delivery</strong></span>}
          <div className={styles.deliveryTrack}><div className={styles.deliveryFill} style={{ width: `${freeDeliveryProgress}%` }} /></div>
        </div>
      )}

      <div className={styles.layout}>
        {/* ── Left: Cart Items ── */}
        <div className={styles.cartItems}>
          <div className={styles.steps}>
            <div className={`${styles.step} ${styles.stepActive}`}><span className={styles.stepNum}>1</span><span className={styles.stepLabel}>Cart</span></div>
            <div className={styles.stepLine} />
            <div className={styles.step}><span className={styles.stepNum}>2</span><span className={styles.stepLabel}>Address</span></div>
            <div className={styles.stepLine} />
            <div className={styles.step}><span className={styles.stepNum}>3</span><span className={styles.stepLabel}>Payment</span></div>
          </div>

          {items.map((item) => {
            const outOfStock = !item.is_available || (item.product_count ?? 0) <= 0;
            const overStock  = (item.product_count ?? 0) > 0 && item.quantity > (item.product_count ?? 0);
            const lowStock   = !outOfStock && !overStock && (item.product_count ?? 0) > 0 && (item.product_count ?? 0) < 8;
            const atMax      = (item.product_count ?? 0) > 0 && item.quantity >= (item.product_count ?? 0);
            return (
              <div key={lineKey(item)} className={`${styles.cartItem} ${removingKey === lineKey(item) ? styles.cartItemRemoving : ''} ${outOfStock ? styles.cartItemMuted : ''}`}>
                <Link href={`/product/${item.id}`} className={styles.itemImgLink}>
                  <div className={styles.itemImg} style={{ background: item.bgGradient }}>
                    {item.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.image} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: '18px' }} />
                    ) : (
                      <span className={styles.itemEmoji}>{item.emoji ?? '🎁'}</span>
                    )}
                    {item.badge && <span className={styles.itemBadge}>{item.badge}</span>}
                  </div>
                </Link>

                <div className={styles.itemDetails}>
                  <div className={styles.itemTop}>
                    <div>
                      <div className={styles.itemCategory}>{item.category}</div>
                      <Link href={`/product/${item.id}`} className={styles.itemName}>{item.name}</Link>
                      <div className={styles.itemMeta}>
                        <span className={styles.metaChip}><Icon name="shield" size={13} /> BIS Certified</span>
                        <span className={styles.metaChip}><Icon name="return" size={13} /> Easy Returns</span>
                      </div>

                      {item.color && (
                        <div className={styles.itemColor}>
                          {item.color_hex && <span className={styles.itemColorDot} style={{ background: item.color_hex }} />}
                          <span className={styles.itemColorName}>{item.color}</span>
                        </div>
                      )}

                      {outOfStock ? (
                        <div className={styles.itemUnavailable}><Icon name="alert" size={13} /> Currently unavailable — please remove</div>
                      ) : overStock ? (
                        <div className={styles.itemUnavailable}><Icon name="alert" size={13} /> Only {item.product_count} left — reduce quantity</div>
                      ) : (
                        <>
                          {lowStock && <div className={styles.itemLowStock}><Icon name="alert" size={13} /> Only {item.product_count} left in stock</div>}
                          {deliveryBy && <div className={styles.itemDelivery}><Icon name="truck" size={13} /> Free delivery by {deliveryBy}</div>}
                        </>
                      )}
                    </div>
                    <button className={styles.removeBtn} onClick={() => handleRemove(item)} aria-label="Remove item"><Icon name="close" size={13} /></button>
                  </div>

                  <div className={styles.itemBottom}>
                    <div className={styles.itemPricing}>
                      <span className={styles.itemPrice}>₹{(item.price * item.quantity).toLocaleString('en-IN')}</span>
                      {(item.originalPrice ?? 0) > item.price && (
                        <>
                          <span className={styles.itemOriginalPrice}>₹{((item.originalPrice ?? item.price) * item.quantity).toLocaleString('en-IN')}</span>
                          <span className={styles.itemSaveChip}>Save ₹{(((item.originalPrice ?? item.price) - item.price) * item.quantity).toLocaleString('en-IN')}</span>
                        </>
                      )}
                    </div>
                    <div className={styles.itemActions}>
                      <div className={styles.qtyControl}>
                        <button className={styles.qtyBtn} onClick={() => updateQty(item, -1)} disabled={item.quantity <= 1} aria-label="Decrease quantity">−</button>
                        <span className={styles.qtyNum}>{item.quantity}</span>
                        <button className={styles.qtyBtn} onClick={() => updateQty(item, 1)} disabled={outOfStock || atMax} aria-label="Increase quantity">+</button>
                      </div>
                      <button className={styles.saveBtn} onClick={() => saveForLater(item)}><Icon name="bookmark" size={14} /> Save for later</button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {savedItems.length > 0 && (
            <div className={styles.savedSection}>
              <h3 className={styles.savedTitle}>Saved for Later ({savedItems.length})</h3>
              <div className={styles.savedGrid}>
                {savedItems.map((item) => (
                  <div key={lineKey(item)} className={styles.savedCard}>
                    <div className={styles.savedImg} style={{ background: item.bgGradient }}>
                      {item.image
                        // eslint-disable-next-line @next/next/no-img-element
                        ? <img src={item.image} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: 12 }} />
                        : <span>{item.emoji}</span>}
                    </div>
                    <div className={styles.savedInfo}>
                      <div className={styles.savedName}>{item.name}</div>
                      {item.color && (
                        <div className={styles.savedColor}>
                          {item.color_hex && <span className={styles.savedColorDot} style={{ background: item.color_hex }} />}
                          {item.color}
                        </div>
                      )}
                      <div className={styles.savedPrice}>₹{item.price.toLocaleString('en-IN')}</div>
                      <button className={styles.moveToCartBtn} onClick={() => moveToCart(item)}>Move to Cart</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className={styles.couponSection}>
            <div className={styles.couponHeader}><span className={styles.couponIcon}><Icon name="tag" size={18} /></span><span className={styles.couponTitle}>Apply Coupon</span></div>
            {coupon.applied ? (
              <div className={styles.couponApplied}>
                <div className={styles.couponAppliedLeft}>
                  <span className={styles.couponCheckmark}><Icon name="check" size={15} /></span>
                  <div><div className={styles.couponAppliedCode}>{coupon.code}</div><div className={styles.couponAppliedMsg}>{coupon.message}</div></div>
                </div>
                <button className={styles.removeCouponBtn} onClick={removeCoupon}>Remove</button>
              </div>
            ) : (
              <div className={styles.couponRow}>
                <input type="text" className={styles.couponInput} placeholder="Enter coupon code (try LITTLE10)" aria-label="Coupon code"
                  value={couponInput} onChange={(e) => setCouponInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && applyCoupon()} />
                <button className={styles.couponApplyBtn} onClick={applyCoupon}>Apply</button>
              </div>
            )}
            {coupon.message && !coupon.applied && (
              <p className={`${styles.couponMsg} ${coupon.error ? styles.couponError : styles.couponSuccess}`}>{coupon.message}</p>
            )}
          </div>

          <div className={styles.trustBar}>
            <div className={styles.trustItem}><span className={styles.trustIcon}><Icon name="lock" size={20} /></span><span>100% Secure<br /><small>SSL encrypted</small></span></div>
            <div className={styles.trustItem}><span className={styles.trustIcon}><Icon name="truck" size={20} /></span><span>Fast Delivery<br /><small>2–5 business days</small></span></div>
            <div className={styles.trustItem}><span className={styles.trustIcon}><Icon name="return" size={20} /></span><span>Easy Returns<br /><small>30-day policy</small></span></div>
            <div className={styles.trustItem}><span className={styles.trustIcon}><Icon name="card" size={20} /></span><span>All Payments<br /><small>UPI, Card, COD</small></span></div>
          </div>
        </div>

        {/* ── Right: Order Summary ── */}
        <div className={styles.summaryCol}>
          <div className={styles.summaryCard}>
            <h2 className={styles.summaryTitle}>Order Summary</h2>
            <div className={styles.summaryLines}>
              <div className={styles.summaryLine}><span>Subtotal ({items.reduce((s, i) => s + i.quantity, 0)} items)</span><span>₹{subtotal.toLocaleString('en-IN')}</span></div>
              {itemSavings > 0 && <div className={`${styles.summaryLine} ${styles.savingsLine}`}><span>Product Discount</span><span>− ₹{itemSavings.toLocaleString('en-IN')}</span></div>}
              {couponSavings > 0 && <div className={`${styles.summaryLine} ${styles.savingsLine}`}><span>Coupon ({coupon.code})</span><span>− ₹{couponSavings.toLocaleString('en-IN')}</span></div>}
              <div className={styles.summaryLine}><span>Delivery</span><span className={isDeliveryFree ? styles.freeDeliveryTag : ''}>{isDeliveryFree || items.length === 0 ? 'FREE' : `₹${DELIVERY_FEE}`}</span></div>
            </div>
            <div className={styles.summaryDivider} />
            <div className={styles.summaryTotal}><span>Total</span><span className={styles.totalAmt}>₹{total.toLocaleString('en-IN')}</span></div>
            <p className={styles.summaryTaxNote}>Inclusive of all taxes</p>
            {totalSavings > 0 && <div className={styles.totalSavingsBadge}><Icon name="spark" size={15} /> You're saving <strong>₹{totalSavings.toLocaleString('en-IN')}</strong> on this order!</div>}
            {deliveryRange && <div className={styles.summaryDeliveryLine}><Icon name="truck" size={15} /> Arrives <strong>{deliveryRange}</strong></div>}
            {giftSaved && giftMessage && (
              <div className={styles.summaryGiftLine}><Icon name="gift" size={15} /> Gift message attached</div>
            )}

            {hasBlockingIssue && (
              <div className={styles.checkoutBlockNote}>Some items are out of stock or exceed available quantity. Update them to continue.</div>
            )}

            <button type="button"
              className={[styles.checkoutBtn, hasBlockingIssue ? styles.checkoutBtnDisabled : ''].filter(Boolean).join(' ')}
              onClick={goToCheckout} disabled={hasBlockingIssue}>
              <Icon name="lock" size={17} /> Secure Checkout
            </button>

            <div className={styles.summaryReassure}>
              <span><Icon name="lock" size={13} /> Secure payment</span>
              <span><Icon name="return" size={13} /> 7-day returns</span>
              <span><Icon name="shield" size={13} /> Money-back guarantee</span>
            </div>

            <div className={styles.paymentMethods}>
              <span className={styles.paymentLabel}>We accept</span>
              <div className={styles.paymentIcons}>
                <span className={styles.payIcon}><Icon name="card" size={18} /></span>
                <span className={styles.payIcon}><Icon name="phone" size={18} /></span>
                <span className={styles.payIcon}><Icon name="bank" size={18} /></span>
                <span className={styles.payText}>UPI</span>
                <span className={styles.payText}>COD</span>
              </div>
            </div>
          </div>

          <div className={styles.giftCard}>
            <button type="button" className={styles.giftToggle} onClick={() => setGiftOpen((o) => !o)} aria-expanded={giftOpen}>
              <span className={styles.giftTitle}><Icon name="gift" size={18} /> Add a gift message</span>
              <span className={`${styles.giftChevron} ${giftOpen ? styles.giftChevronOpen : ''}`}><Icon name="chevronRight" size={16} /></span>
            </button>
            {giftOpen && (
              <div className={styles.giftBody}>
                <textarea
                  className={styles.giftTextarea}
                  placeholder="Write something special for the recipient…"
                  rows={3}
                  maxLength={500}
                  aria-label="Gift message"
                  value={giftMessage}
                  onChange={(e) => { setGiftMessage(e.target.value); setGiftSaved(false); }}
                />
                <div className={styles.giftFootRow}>
                  <span className={styles.giftCount}>{giftMessage.length}/500</span>
                  {giftSaved && giftMessage && <span className={styles.giftSavedTag}><Icon name="check" size={13} /> Saved</span>}
                </div>
                <div className={styles.giftBtnRow}>
                  <button type="button" className={styles.giftBtn} onClick={saveGiftMessage}>
                    {giftSaved && giftMessage ? 'Update Message' : 'Save Message'}
                  </button>
                  {giftMessage && (
                    <button type="button" className={styles.giftClearBtn} onClick={clearGiftMessage}>Clear</button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Mobile sticky checkout bar ── */}
      {items.length > 0 && (
        <div className={styles.mobileCheckoutBar}>
          <div className={styles.mcbInfo}>
            <span className={styles.mcbLabel}>{items.reduce((s, i) => s + i.quantity, 0)} items · Total</span>
            <span className={styles.mcbTotal}>₹{total.toLocaleString('en-IN')}</span>
          </div>
          <button type="button" className={[styles.mcbBtn, hasBlockingIssue ? styles.mcbBtnDisabled : ''].filter(Boolean).join(' ')} onClick={goToCheckout} disabled={hasBlockingIssue}>
            {hasBlockingIssue ? 'Review items' : <>Checkout <Icon name="arrowRight" size={16} /></>}
          </button>
        </div>
      )}

      {renderRelated()}
      {QuickViewModal}
      {Toast}
    </div>
  );
}