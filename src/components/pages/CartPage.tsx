'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import styles from './CartPage.module.css';
import { _get, _put, _delete, _post } from '@/shared/fetchwrapper';
import { useCart } from '@/context/CartContext';

/* ─── Types ──────────────────────────────────────────────────────────────── */
interface CartItem {
  id: number;
  emoji: string;
  name: string;
  category: string;
  price: number;
  originalPrice: number;
  quantity: number;
  bgGradient: string;
  badge?: string;
  backendId?: number | string;
  cartItemId?: string;          // ← backend cart_items row UUID for PUT/DELETE
  image?: string;
  color?: string;
  color_hex?: string;
}

interface CouponState {
  code: string;
  applied: boolean;
  discount: number;
  message: string;
  error: boolean;
}

/* ─── Shared product shape (mirrors ProductPage MappedProduct) ───────────── */
interface BackendProduct {
  id: string | number;
  name: string;
  category: string;
  sub_category_name?: string;
  sub_category_slug?: string;
  description: string;
  original_price: number;
  amount_discount: number;
  percentage_discount: number;
  count: number;
  details: string[];
  product_image: { url: string; public_id?: string }[] | string[];
  rating?: number;
  review_count?: number;
}

interface MappedProduct {
  id: string | number;
  name: string;
  category: string;
  subcategory: string;
  description: string;
  price: number;
  originalPrice: number;
  discount: number;
  stars: number;
  reviewCount: number;
  inStock: boolean;
  stockCount: number;
  images: string[];
  highlights: string[];
  badges: { label: string; type: string }[];
}

type RelCartState = 'idle' | 'loading' | 'added' | 'error';

/* ─── Emoji / gradient helpers ───────────────────────────────────────────── */
const CATEGORY_EMOJI: Record<string, string> = {
  Toys: '🧸', Vehicles: '🚲', 'Soft Toys': '🐻', Games: '🎮',
  Stationery: '✏️', 'Arts & Crafts': '🎨', Books: '📚',
  'Baby & Toddler': '🍼', Outdoor: '🛹', default: '🎁',
};
const GRADIENTS = [
  'linear-gradient(135deg,#FFF3D4,#FFE099)',
  'linear-gradient(135deg,#E1F7F2,#AAEEDD)',
  'linear-gradient(135deg,#EAE0FF,#C7A4F5)',
  'linear-gradient(135deg,#E0F3FF,#AACFF5)',
  'linear-gradient(135deg,#E8FFEE,#AAEECC)',
  'linear-gradient(135deg,#FFEEF8,#F5B6D6)',
];
function gradientFor(id: number) { return GRADIENTS[id % GRADIENTS.length]; }

/* ─── Badge helpers ──────────────────────────────────────────────────────── */
const BADGE_BG: Record<string, string>   = { sale: '#FF6B5B', new: '#3ECFB2', hot: '#FFD336' };
const BADGE_TEXT: Record<string, string> = { sale: '#fff',    new: '#fff',    hot: '#1A2540' };

/* ─── Map backend → MappedProduct ───────────────────────────────────────── */
function extractImageUrls(raw: { url: string }[] | string[] | undefined): string[] {
  if (!raw || !Array.isArray(raw)) return [];
  return raw.map((img) => (typeof img === 'string' ? img : img?.url ?? '')).filter(Boolean);
}

function mapBackendProduct(p: BackendProduct): MappedProduct {
  const images        = extractImageUrls(p.product_image as any);
  const originalPrice = p.original_price  ?? 0;
  const amountDiscount= p.amount_discount ?? 0;
  const pctDiscount   = p.percentage_discount ?? 0;
  let price = originalPrice - amountDiscount;
  if (price <= 0 && pctDiscount > 0)
    price = Math.round(originalPrice - (originalPrice * pctDiscount) / 100);
  if (price <= 0) price = originalPrice;
  const badges =
    pctDiscount   > 0 ? [{ label: `${pctDiscount}% OFF`,    type: 'sale' }] :
    amountDiscount> 0 ? [{ label: `Save ₹${amountDiscount}`,type: 'sale' }] : [];
  return {
    id: p.id, name: p.name ?? 'Unnamed Product', category: p.category ?? '',
    subcategory: p.sub_category_name ?? p.sub_category_slug ?? p.category ?? '',
    description: p.description ?? '', price, originalPrice, discount: pctDiscount,
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

/* ─── RelatedCard ────────────────────────────────────────────────────────── */
interface RelatedCardProps {
  product: MappedProduct; wishlisted: boolean; wishPending: boolean;
  cartState: RelCartState; onWishlist: () => void;
  onAddToCart: () => void; onQuickView: () => void;
}
function RelatedCard({ product, wishlisted, wishPending, cartState, onWishlist, onAddToCart, onQuickView }: RelatedCardProps) {
  const router = useRouter();
  const stars  = Math.min(5, Math.max(0, Math.round(product.stars)));
  const hasSave= product.originalPrice > product.price && product.originalPrice > 0;
  const saving = hasSave ? product.originalPrice - product.price : 0;
  const hasImg = product.images.length > 0;
  return (
    <article className={styles.relCard}>
      <div className={styles.relCardImg}
        onClick={(e) => { if ((e.target as HTMLElement).closest(`.${styles.relCardOverlay}`)) return; router.push(`/product/${product.id}`); }}
        style={{ cursor: 'pointer' }}>
        {hasImg ? <ProductImg src={product.images[0]} alt={product.name} className={styles.relCardImageTag} />
                : <div className={styles.relCardEmoji} aria-hidden="true">🎁</div>}
        {!product.inStock && <div className={styles.relOutOfStock}>Out of Stock</div>}
        {product.badges.length > 0 && (
          <div className={styles.relBadges}>
            {product.badges.map((b) => (
              <span key={b.label} className={styles.relBadge}
                style={{ background: BADGE_BG[b.type] ?? '#ccc', color: BADGE_TEXT[b.type] ?? '#000' }}>
                {b.label}
              </span>
            ))}
          </div>
        )}
        <button type="button" className={styles.relCardOverlay}
          onClick={(e) => { e.stopPropagation(); e.preventDefault(); onQuickView(); }}>
          <span className={styles.relQuickView}>Quick View</span>
        </button>
      </div>
      <button className={[styles.relWishBtn, wishlisted ? styles.relWishlisted : '', wishPending ? styles.relWishPending : ''].filter(Boolean).join(' ')}
        onClick={onWishlist} disabled={wishPending} type="button"
        aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'} aria-pressed={wishlisted}>
        {wishPending ? '⏳' : wishlisted ? '❤️' : '🤍'}
      </button>
      <div className={styles.relCardBody}>
        <div className={styles.relCardMeta}><span className={styles.relCardCat}>{product.subcategory || product.category}</span></div>
        <Link href={`/product/${product.id}`} className={styles.relCardNameLink}>
          <h3 className={styles.relCardName}>{product.name}</h3>
        </Link>
        <div className={styles.relCardStars} aria-label={`${stars} out of 5 stars`}>
          {'★'.repeat(stars)}{'☆'.repeat(5 - stars)}
          <span className={styles.relCardReviews}>({product.reviewCount})</span>
        </div>
        <div className={styles.relCardPrice}>
          <span className={styles.relPriceNow}>₹{fmt(product.price)}</span>
          {hasSave && (<><span className={styles.relPriceWas}>₹{fmt(product.originalPrice)}</span><span className={styles.relPriceSave}>Save ₹{fmt(saving)}</span></>)}
        </div>
        <button className={[styles.relAddBtn, !product.inStock ? styles.relAddBtnDisabled : '', cartState === 'added' ? styles.relAddBtnAdded : '', cartState === 'error' ? styles.relAddBtnError : '', cartState === 'loading' ? styles.relAddBtnLoading : ''].filter(Boolean).join(' ')}
          type="button" disabled={!product.inStock || cartState === 'loading'} onClick={onAddToCart}>
          {cartState === 'loading' ? 'Adding…' : cartState === 'added' ? '✓ Added!' : cartState === 'error' ? '✗ Try Again' : product.inStock ? '🛒 Add to Cart' : '📩 Notify Me'}
        </button>
      </div>
    </article>
  );
}

/* ─── Carousel Hook (unchanged) ─────────────────────────────────────────── */
const GAP = 18;
const AUTOPLAY_MS = 3000;

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

  const measure = useCallback((node: HTMLDivElement | null) => {
    (viewportRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
    if (!node) return;
    const elWidth = node.offsetWidth;
    const winWidth = typeof window !== 'undefined' ? window.innerWidth : elWidth;
    const count = winWidth < 640 ? 2 : 4;
    setVisibleCount(count);
    setCardWidth((elWidth - GAP * (count - 1)) / count);
  }, []);

  const recalculate = useCallback(() => {
    if (!viewportRef.current) return;
    const elWidth  = viewportRef.current.offsetWidth;
    const winWidth = typeof window !== 'undefined' ? window.innerWidth : elWidth;
    const count    = winWidth < 640 ? 2 : 4;
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

/* ─── Coupons (unchanged) ────────────────────────────────────────────────── */
const VALID_COUPONS: Record<string, { discount: number; label: string }> = {
  LITTLE10:  { discount: 0.1, label: '10% off applied!' },
  LOOT20:    { discount: 0.2, label: '20% off applied!' },
  WELCOME50: { discount: 0,   label: '₹50 flat off applied!' },
};
const FLAT_COUPONS: Record<string, number> = { WELCOME50: 50 };
const DELIVERY_FEE             = 49;
const FREE_DELIVERY_THRESHOLD  = 499;

/* ─── Component ──────────────────────────────────────────────────────────── */
export default function CartPage() {
  const { state, dispatch } = useCart();
  const items = state.items;

  const [coupon, setCoupon]         = useState<CouponState>({ code: '', applied: false, discount: 0, message: '', error: false });
  const [couponInput, setCouponInput] = useState('');
  const [removingId, setRemovingId] = useState<string | number | null>(null);
  const [savedItems, setSavedItems] = useState<CartItem[]>([]);
  const [loading, setLoading]       = useState(true);

  /* ── Related products state ── */
  const [related,       setRelated]       = useState<MappedProduct[]>([]);
  const [relWishlist,   setRelWishlist]   = useState<Set<string>>(new Set());
  const [relWishPend,   setRelWishPend]   = useState<Set<string>>(new Set());
  const [relCartStates, setRelCartStates] = useState<Record<string, RelCartState>>({});

  /* ── Carousel ── */
  const carousel      = useCarousel(related.length);
  const clonedRelated = [...related, ...related, ...related];

  /* ── Quick view state ── */
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

  /* ── Hydration ── */
  useEffect(() => { if (state.hydrated) setLoading(false); }, [state.hydrated]);

  /* ── Fetch wishlist ── */
  useEffect(() => {
    _get('/api/favorite')
      .then((res: any) => {
        const arr: any[] = Array.isArray(res) ? res : (res?.data ?? []);
        const ids = arr.map((i: any) => typeof i === 'string' ? i : String(i.product_id ?? i.productId ?? i.id ?? ''));
        setRelWishlist(new Set(ids));
      }).catch(() => {});
  }, []);

  /* ── Fetch related/featured products ── */
  useEffect(() => {
    _get('/api/product/featured')
      .then((res: any) => {
        const raw: BackendProduct[] = Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : [];
        setRelated(raw.slice(0, 8).map(mapBackendProduct));
      }).catch(() => {});
  }, []);

  /* ── Related: Wishlist toggle ── */
  const toggleRelWishlist = useCallback(async (id: string) => {
    if (relWishPend.has(id)) return;
    const was = relWishlist.has(id);
    setRelWishlist((prev) => { const n = new Set(prev); was ? n.delete(id) : n.add(id); return n; });
    setRelWishPend((prev) => new Set(prev).add(id));
    try { await fetch(`/api/favorite/${id}`, { method: was ? 'DELETE' : 'POST' }); }
    catch { setRelWishlist((prev) => { const n = new Set(prev); was ? n.add(id) : n.delete(id); return n; }); }
    finally { setRelWishPend((prev) => { const n = new Set(prev); n.delete(id); return n; }); }
  }, [relWishlist, relWishPend]);

  /* ── Related: Add to cart ── */
  const addRelToCart = useCallback(async (p: MappedProduct) => {
    const id = String(p.id);
    if (relCartStates[id] === 'loading') return;
    setRelCartStates((prev) => ({ ...prev, [id]: 'loading' }));
    dispatch({
      type: 'ADD_ITEM',
      payload: {
        id: p.id, name: p.name, price: p.price, originalPrice: p.originalPrice,
        quantity: 1, image: p.images[0] ?? '',
        emoji: CATEGORY_EMOJI[p.category] ?? CATEGORY_EMOJI.default,
        bgGradient: gradientFor(Number(p.id)), category: p.category,
        color: '', product_count: p.stockCount, is_available: p.inStock,
      },
    });
    try {
      await _post('/api/cart/items', { product_id: p.id, quantity: 1 });
      setRelCartStates((prev) => ({ ...prev, [id]: 'added' }));
      setTimeout(() => setRelCartStates((prev) => ({ ...prev, [id]: 'idle' })), 2000);
    } catch {
      // ── FIXED: REMOVE_ITEM now takes { id, color } ──────────────────
      dispatch({ type: 'REMOVE_ITEM', payload: { id: p.id, color: '' } });
      setRelCartStates((prev) => ({ ...prev, [id]: 'error' }));
      setTimeout(() => setRelCartStates((prev) => ({ ...prev, [id]: 'idle' })), 2500);
    }
  }, [relCartStates, dispatch]);

  /* ── Quick view: Add to cart ── */
  async function handleQvAddToCart() {
    if (!qvProduct || qvCartState === 'loading') return;
    setQvCartState('loading');
    dispatch({
      type: 'ADD_ITEM',
      payload: {
        id: qvProduct.id, name: qvProduct.name, price: qvProduct.price,
        originalPrice: qvProduct.originalPrice, quantity: qvQty,
        image: qvProduct.images[0] ?? '', emoji: '🎁', bgGradient: '',
        category: qvProduct.category, color: '',
        product_count: qvProduct.stockCount, is_available: qvProduct.inStock,
      },
    });
    try {
      await _post('/api/cart/items', { product_id: qvProduct.id, quantity: qvQty });
      setQvCartState('added');
      setTimeout(() => setQvCartState('idle'), 2000);
    } catch {
      // ── FIXED: REMOVE_ITEM now takes { id, color } ──────────────────
      dispatch({ type: 'REMOVE_ITEM', payload: { id: qvProduct.id, color: '' } });
      setQvCartState('error');
      setTimeout(() => setQvCartState('idle'), 2500);
    }
  }

  /* ─── Cart handlers ───────────────────────────────────────────────────── */

  function updateQty(item: typeof items[0], delta: number) {
    const newQty = Math.max(1, item.quantity + delta);
    // ── FIXED: UPDATE_QUANTITY now takes { id, color, quantity } ────────
    dispatch({ type: 'UPDATE_QUANTITY', payload: { id: item.id, color: item.color ?? '', quantity: newQty } });
    // Use cartItemId (backend row UUID) for the API call — more precise than product id
    const backendRowId = item.cartItemId ?? item.backendId;
    if (backendRowId) {
      _put(`/api/cart/items/${backendRowId}`, { quantity: newQty }).catch(() => {});
    }
  }

  function removeItem(item: typeof items[0]) {
    setRemovingId(item.id);
    setTimeout(() => {
      // ── FIXED: REMOVE_ITEM now takes { id, color } ──────────────────
      dispatch({ type: 'REMOVE_ITEM', payload: { id: item.id, color: item.color ?? '' } });
      setRemovingId(null);
    }, 320);
    // Use cartItemId for the DELETE call
    const backendRowId = item.cartItemId ?? item.backendId;
    if (backendRowId) {
      _delete(`/api/cart/items/${backendRowId}`).catch(() => {});
    }
  }

  function saveForLater(item: typeof items[0]) {
    setSavedItems((prev) => [...prev, item as unknown as CartItem]);
    dispatch({ type: 'REMOVE_ITEM', payload: { id: item.id, color: item.color ?? '' } });
  }

  function moveToCart(id: number) {
    const item = savedItems.find((i) => i.id === id);
    if (!item) return;
    dispatch({
      type: 'ADD_ITEM',
      payload: { id: item.id, name: item.name, price: item.price, quantity: 1, color: item.color ?? '', color_hex: item.color_hex ?? '', image: item.image ?? '', product_count: 0, is_available: true },
    });
    setSavedItems((prev) => prev.filter((i) => i.id !== id));
    _post('/api/cart/items', { product_id: item.id, quantity: item.quantity, color: item.color ?? '', color_hex: item.color_hex ?? '', image: item.image ?? '' }).catch(() => {});
  }

  function applyCoupon() {
    const code = couponInput.trim().toUpperCase();
    if (!code) { setCoupon({ code: '', applied: false, discount: 0, message: 'Please enter a coupon code.', error: true }); return; }
    const valid = VALID_COUPONS[code];
    if (valid) { setCoupon({ code, applied: true, discount: valid.discount, message: valid.label, error: false }); }
    else        { setCoupon({ code: '', applied: false, discount: 0, message: 'Invalid coupon. Try LITTLE10 or LOOT20.', error: true }); }
  }
  function removeCoupon() { setCoupon({ code: '', applied: false, discount: 0, message: '', error: false }); setCouponInput(''); }

  /* ─── Calculations (unchanged) ────────────────────────────────────────── */
  const subtotal       = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const originalTotal  = items.reduce((s, i) => s + (i.originalPrice ?? i.price) * i.quantity, 0);
  const itemSavings    = originalTotal - subtotal;
  const isDeliveryFree = subtotal >= FREE_DELIVERY_THRESHOLD;
  const deliveryCharge = items.length === 0 ? 0 : isDeliveryFree ? 0 : DELIVERY_FEE;
  const flatDiscount   = coupon.applied && FLAT_COUPONS[coupon.code] ? FLAT_COUPONS[coupon.code] : 0;
  const percentDiscount= coupon.applied && !FLAT_COUPONS[coupon.code] ? Math.round(subtotal * coupon.discount) : 0;
  const couponSavings  = flatDiscount + percentDiscount;
  const total          = Math.max(0, subtotal + deliveryCharge - couponSavings);
  const totalSavings   = itemSavings + couponSavings + (isDeliveryFree && items.length > 0 ? DELIVERY_FEE : 0);
  const amountToFreeDelivery  = FREE_DELIVERY_THRESHOLD - subtotal;
  const freeDeliveryProgress  = Math.min(100, (subtotal / FREE_DELIVERY_THRESHOLD) * 100);

  /* ─── Related Products Carousel ──────────────────────────────────────── */
  const RelatedCarousel = () => {
    if (related.length === 0) return null;
    return (
      <div className={styles.relatedSection}>
        <div className={styles.relatedHeader}>
          <h2 className={styles.relatedTitle}>You might also like</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button className={styles.carouselNavBtn} onClick={carousel.prev} aria-label="Previous" type="button">‹</button>
            <button className={styles.carouselNavBtn} onClick={carousel.next} aria-label="Next"     type="button">›</button>
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
  };

  /* ─── Quick View Modal (unchanged) ───────────────────────────────────── */
  const QuickViewModal = qvProduct ? (
    <div className={styles.qvOverlay} onClick={closeQv} role="dialog" aria-modal="true" aria-label={`Quick view: ${qvProduct.name}`}>
      <div className={styles.qvModal} onClick={(e) => e.stopPropagation()}>
        <button className={styles.qvClose} onClick={closeQv} type="button" aria-label="Close">✕</button>
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
                disabled={!qvProduct.inStock || qvCartState === 'loading'} onClick={handleQvAddToCart}>
                {qvCartState === 'loading' ? 'Adding…' : qvCartState === 'added' ? '✓ Added to Cart!' : qvCartState === 'error' ? '✗ Try Again' : '🛒 Add to Cart'}
              </button>
            </div>
            <Link href={`/product/${qvProduct.id}`} className={styles.qvFullLink} onClick={closeQv}>View Full Details →</Link>
          </div>
        </div>
      </div>
    </div>
  ) : null;

  /* ─── Empty State ────────────────────────────────────────────────────── */
  if (!loading && items.length === 0 && savedItems.length === 0) {
    return (
      <div className={styles.page}>
        <div className={styles.breadcrumb}>
          <Link href="/" className={styles.breadLink}>Home</Link>
          <span className={styles.breadSep}>›</span>
          <span className={styles.breadCurrent}>My Cart</span>
        </div>
        <div className={styles.emptyState}>
          <div className={styles.emptyEmoji}>🛒</div>
          <h2 className={styles.emptyTitle}>Your cart is empty!</h2>
          <p className={styles.emptyText}>Looks like you haven't added anything yet. Let's fix that!</p>
          <Link href="/" className={styles.emptyBtn}>Start Shopping →</Link>
        </div>
        <RelatedCarousel />
        {QuickViewModal}
      </div>
    );
  }

  /* ─── Main Cart ──────────────────────────────────────────────────────── */
  return (
    <div className={styles.page}>
      {/* Breadcrumb */}
      <div className={styles.breadcrumb}>
        <Link href="/" className={styles.breadLink}>Home</Link>
        <span className={styles.breadSep}>›</span>
        <span className={styles.breadCurrent}>My Cart</span>
      </div>

      {/* Page Title */}
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>My Cart</h1>
          <p className={styles.pageSubtitle}>
            {loading ? 'Loading…' : `${items.length} item${items.length !== 1 ? 's' : ''} in your cart`}
          </p>
        </div>
        <Link href="/" className={styles.continueShopping}>← Continue Shopping</Link>
      </div>

      {/* Free Delivery Progress */}
      {items.length > 0 && (
        <div className={styles.deliveryBanner}>
          {isDeliveryFree
            ? <span className={styles.deliveryFreeMsg}>🎉 You've unlocked <strong>FREE delivery</strong> on this order!</span>
            : <span>🚚 Add <strong>₹{amountToFreeDelivery.toLocaleString('en-IN')}</strong> more for <strong>FREE delivery</strong></span>}
          <div className={styles.deliveryTrack}>
            <div className={styles.deliveryFill} style={{ width: `${freeDeliveryProgress}%` }} />
          </div>
        </div>
      )}

      {/* Main Layout */}
      <div className={styles.layout}>

        {/* ── Left: Cart Items ── */}
        <div className={styles.cartItems}>
          {/* Step indicator */}
          <div className={styles.steps}>
            <div className={`${styles.step} ${styles.stepActive}`}><span className={styles.stepNum}>1</span><span className={styles.stepLabel}>Cart</span></div>
            <div className={styles.stepLine} />
            <div className={styles.step}><span className={styles.stepNum}>2</span><span className={styles.stepLabel}>Address</span></div>
            <div className={styles.stepLine} />
            <div className={styles.step}><span className={styles.stepNum}>3</span><span className={styles.stepLabel}>Payment</span></div>
          </div>

          {/* Items list */}
          {items.map((item) => (
            <div key={`${item.id}-${item.color ?? 'nc'}`}
              className={`${styles.cartItem} ${removingId === item.id ? styles.cartItemRemoving : ''}`}>

              <Link href={`/product/${item.id}`} className={styles.itemImgLink}>
                <div className={styles.itemImg} style={{ background: item.bgGradient }}>
                  {/* Color-specific image — falls back to emoji if no image */}
                  {item.image ? (
                    <img src={item.image} alt={item.name}
                      style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: '18px' }} />
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
                      <span className={styles.metaChip}>🛡️ BIS Certified</span>
                      <span className={styles.metaChip}>🔄 30-day return</span>
                    </div>

                    {/* ── Color swatch + label ── */}
                    {item.color && (
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 6,
                        background: '#f5f2ee', border: '1px solid #e8e0d5', borderRadius: 20,
                        padding: '3px 10px 3px 6px', }}>
                        {item.color_hex && (
                          <span style={{
                            width: 13, height: 13, borderRadius: '50%',
                            background: item.color_hex,
                            border: '1.5px solid rgba(0,0,0,0.12)',
                            display: 'inline-block', flexShrink: 0,
                            boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
                          }} />
                        )}
                        <span style={{ fontSize: 11, color: '#555', fontWeight: 700,
                          fontFamily: 'var(--font-nunito, Nunito, sans-serif)' }}>
                          {item.color}
                        </span>
                      </div>
                    )}
                  </div>
                  <button className={styles.removeBtn} onClick={() => removeItem(item)} aria-label="Remove item">✕</button>
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
                      <button className={styles.qtyBtn} onClick={() => updateQty(item, -1)} aria-label="Decrease">−</button>
                      <span className={styles.qtyNum}>{item.quantity}</span>
                      <button className={styles.qtyBtn} onClick={() => updateQty(item, 1)} aria-label="Increase">+</button>
                    </div>
                    <button className={styles.saveBtn} onClick={() => saveForLater(item)}>🤍 Save for later</button>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Saved for Later (unchanged) */}
          {savedItems.length > 0 && (
            <div className={styles.savedSection}>
              <h3 className={styles.savedTitle}>Saved for Later ({savedItems.length})</h3>
              <div className={styles.savedGrid}>
                {savedItems.map((item) => (
                  <div key={item.id} className={styles.savedCard}>
                    <div className={styles.savedImg} style={{ background: item.bgGradient }}><span>{item.emoji}</span></div>
                    <div className={styles.savedInfo}>
                      <div className={styles.savedName}>{item.name}</div>
                      {item.color && (
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, marginTop: 2,
                          fontSize: 11, color: '#888', fontWeight: 600 }}>
                          {item.color_hex && <span style={{ width: 10, height: 10, borderRadius: '50%', background: item.color_hex, border: '1px solid rgba(0,0,0,0.1)', display: 'inline-block' }} />}
                          {item.color}
                        </div>
                      )}
                      <div className={styles.savedPrice}>₹{item.price.toLocaleString('en-IN')}</div>
                      <button className={styles.moveToCartBtn} onClick={() => moveToCart(item.id)}>Move to Cart</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Coupon Section (unchanged) */}
          <div className={styles.couponSection}>
            <div className={styles.couponHeader}><span className={styles.couponIcon}>🎟️</span><span className={styles.couponTitle}>Apply Coupon</span></div>
            {coupon.applied ? (
              <div className={styles.couponApplied}>
                <div className={styles.couponAppliedLeft}>
                  <span className={styles.couponCheckmark}>✓</span>
                  <div><div className={styles.couponAppliedCode}>{coupon.code}</div><div className={styles.couponAppliedMsg}>{coupon.message}</div></div>
                </div>
                <button className={styles.removeCouponBtn} onClick={removeCoupon}>Remove</button>
              </div>
            ) : (
              <div className={styles.couponRow}>
                <input type="text" className={styles.couponInput} placeholder="Enter coupon code (try LITTLE10)"
                  value={couponInput} onChange={(e) => setCouponInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && applyCoupon()} />
                <button className={styles.couponApplyBtn} onClick={applyCoupon}>Apply</button>
              </div>
            )}
            {coupon.message && !coupon.applied && (
              <p className={`${styles.couponMsg} ${coupon.error ? styles.couponError : styles.couponSuccess}`}>{coupon.message}</p>
            )}
          </div>

          {/* Trust bar (unchanged) */}
          <div className={styles.trustBar}>
            <div className={styles.trustItem}><span>🔒</span><span>100% Secure<br /><small>SSL encrypted</small></span></div>
            <div className={styles.trustItem}><span>🚚</span><span>Fast Delivery<br /><small>2–5 business days</small></span></div>
            <div className={styles.trustItem}><span>🔄</span><span>Easy Returns<br /><small>30-day policy</small></span></div>
            <div className={styles.trustItem}><span>💳</span><span>All Payments<br /><small>UPI, Card, COD</small></span></div>
          </div>
        </div>

        {/* ── Right: Order Summary (unchanged) ── */}
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
            {totalSavings > 0 && <div className={styles.totalSavingsBadge}>🎉 You're saving <strong>₹{totalSavings.toLocaleString('en-IN')}</strong> on this order!</div>}
            <a href="/checkout" className={styles.checkoutBtn}>Proceed to Checkout →</a>
            <div className={styles.paymentMethods}>
              <div className={styles.paymentLabel}>We accept</div>
              <div className={styles.paymentIcons}>
                <span className={styles.payIcon}>💳</span><span className={styles.payIcon}>📱</span>
                <span className={styles.payIcon}>🏦</span><span className={styles.payText}>UPI</span>
                <span className={styles.payText}>COD</span>
              </div>
            </div>
          </div>

          {!isDeliveryFree && items.length > 0 && (
            <div className={styles.nudgeCard}>
              <span className={styles.nudgeEmoji}>🚀</span>
              <div><div className={styles.nudgeTitle}>Almost there!</div><div className={styles.nudgeText}>Add ₹{amountToFreeDelivery.toLocaleString('en-IN')} more to get <strong>FREE delivery</strong></div></div>
            </div>
          )}

          <div className={styles.giftCard}>
            <div className={styles.giftHeader}><span>🎁</span><span className={styles.giftTitle}>Add a Gift Message</span></div>
            <textarea className={styles.giftTextarea} placeholder="Write something special for the recipient…" rows={3} />
            <button className={styles.giftBtn}>Add Message</button>
          </div>
        </div>
      </div>

      <RelatedCarousel />
      {QuickViewModal}
    </div>
  );
}