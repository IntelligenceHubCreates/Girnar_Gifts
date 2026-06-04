'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import styles from './ProductPage.module.css';
import { _get, _post } from '@/shared/fetchwrapper';
import { useCart } from '@/context/CartContext';

/* ═══════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════ */
interface ProductImage { url: string; public_id?: string; }

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
  product_image: ProductImage[] | string[];
  rating?: number;
  review_count?: number;
  offer_expiration_date?: string;
  color_variants?: Array<{ name: string; hex: string; images: string[] }>;
  product_video?: string;
}

interface ColorVariantItem { name: string; hex: string; images: string[]; }

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
  colorVariants: ColorVariantItem[];
  videoUrl: string;
}

type CartState = 'idle' | 'loading' | 'added' | 'error';
type WishState = 'idle' | 'loading';

/* ═══════════════════════════════════════════════════════
   CONSTANTS
   ═══════════════════════════════════════════════════════ */
const PLACEHOLDER_IMG = '/images/placeholder-product.png';
const GAP = 16;
const AUTOPLAY_MS = 3200;

const HIGHLIGHT_ICONS = ['🛡️', '📦', '🎒', '💧', '⭐', '🔧', '🎨', '🌟'];

const OFFERS = [
  { icon: '🏷️', text: 'Get 10% off up to ₹150 on first prepaid order', code: 'HELLO10' },
  { icon: '💸', text: 'Extra 5% off on orders above ₹1999', code: 'EXTRAS' },
];

const REVIEWS_DATA = [
  { name: 'Ananya Mehta', avatar: '👩', verified: true, stars: 5, date: '2 days ago', text: 'Amazing quality! My son loves the space design and uses it every day. Very spacious and comfortable.', photos: [] },
  { name: 'Priya S.', avatar: '👩', verified: true, stars: 5, date: 'March 2026', text: 'Absolutely worth every rupee! The quality exceeded my expectations and my child has not put it down since it arrived.', photos: [] },
  { name: 'Rahul M.', avatar: '👨', verified: true, stars: 5, date: 'February 2026', text: 'Delivery was super fast — reached in 2 days! Packaging was beautiful and the product looks exactly like the photos.', photos: [] },
];

const RATING_DIST = [
  { stars: 5, pct: 86, count: 102 },
  { stars: 4, pct: 11, count: 13 },
  { stars: 3, pct: 2,  count: 2 },
  { stars: 2, pct: 1,  count: 1 },
  { stars: 1, pct: 0,  count: 0 },
];

/* ═══════════════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════════════ */
function extractImageUrls(raw: ProductImage[] | string[] | undefined): string[] {
  if (!raw || !Array.isArray(raw)) return [];
  return raw.map((img) => (typeof img === 'string' ? img : img?.url ?? '')).filter(Boolean);
}

function mapBackendProduct(p: BackendProduct): MappedProduct {
  const images        = extractImageUrls(p.product_image);
  const originalPrice = p.original_price   ?? 0;
  const amtDisc       = p.amount_discount  ?? 0;
  const pctDisc       = p.percentage_discount ?? 0;

  let price = originalPrice - amtDisc;
  if (price <= 0 && pctDisc > 0) price = Math.round(originalPrice - (originalPrice * pctDisc) / 100);
  if (price <= 0) price = originalPrice;

  const badges = pctDisc > 0 ? [{ label: `${pctDisc}% OFF`, type: 'sale' }]
    : amtDisc > 0 ? [{ label: `Save ₹${amtDisc}`, type: 'sale' }] : [];

  const rawCv = Array.isArray(p.color_variants) ? p.color_variants : [];
  const colorVariants: ColorVariantItem[] = rawCv
    .map((cv: any) => ({ name: String(cv.name ?? ''), hex: String(cv.hex ?? '#ccc'), images: Array.isArray(cv.images) ? cv.images : [] }))
    .filter((cv) => cv.name.length > 0);

  return {
    id:            p.id,
    name:          p.name        ?? 'Unnamed Product',
    category:      p.category    ?? '',
    subcategory:   p.sub_category_name ?? p.sub_category_slug ?? p.category ?? '',
    description:   p.description ?? '',
    price,
    originalPrice,
    discount:      pctDisc,
    stars:         Math.min(5, Math.max(0, p.rating ?? 4)),
    reviewCount:   p.review_count ?? 0,
    inStock:       (p.count ?? 0) > 0,
    stockCount:    p.count ?? 0,
    images:        images.length > 0 ? images : [],
    highlights:    Array.isArray(p.details) ? p.details : [],
    badges,
    colorVariants,
    videoUrl:      p.product_video ?? '',
  };
}

const fmt = (n: number) => Number.isFinite(n) && n > 0 ? n.toLocaleString('en-IN') : '0';

/* ═══════════════════════════════════════════════════════
   CAROUSEL HOOK
   ═══════════════════════════════════════════════════════ */
function useCarousel(itemCount: number) {
  const viewportRef  = useRef<HTMLDivElement>(null);
  const [visibleCount, setVisibleCount] = useState(4);
  const [cardWidth,    setCardWidth]    = useState(0);
  const [rawIndex,     setRawIndex]     = useState(itemCount);
  const [animate,      setAnimate]      = useState(true);
  const [isDragging,   setIsDragging]   = useState(false);

  const isHovered  = useRef(false);
  const dragActive = useRef(false);
  const dragStartX = useRef(0);
  const dragCurrX  = useRef(0);
  const autoTimer  = useRef<ReturnType<typeof setInterval> | null>(null);

  const measure = useCallback((node: HTMLDivElement | null) => {
    (viewportRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
    if (!node) return;
    const w = node.offsetWidth;
    const ww = typeof window !== 'undefined' ? window.innerWidth : w;
    const count = ww < 640 ? 2 : 4;
    setVisibleCount(count);
    setCardWidth((w - GAP * (count - 1)) / count);
  }, []);

  const recalc = useCallback(() => {
    if (!viewportRef.current) return;
    const w = viewportRef.current.offsetWidth;
    const ww = typeof window !== 'undefined' ? window.innerWidth : w;
    const count = ww < 640 ? 2 : 4;
    setVisibleCount(count);
    setCardWidth((w - GAP * (count - 1)) / count);
  }, []);

  useEffect(() => {
    const ro = new ResizeObserver(recalc);
    if (viewportRef.current) ro.observe(viewportRef.current);
    window.addEventListener('resize', recalc);
    return () => { ro.disconnect(); window.removeEventListener('resize', recalc); };
  }, [recalc]);

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

  useEffect(() => { if (!animate) { const id = requestAnimationFrame(() => setAnimate(true)); return () => cancelAnimationFrame(id); } }, [animate]);

  const stopAuto = useCallback(() => { if (autoTimer.current) { clearInterval(autoTimer.current); autoTimer.current = null; } }, []);
  const startAuto = useCallback(() => {
    if (itemCount < 2) return;
    stopAuto();
    autoTimer.current = setInterval(() => {
      if (!isHovered.current && !dragActive.current) { setAnimate(true); setRawIndex(p => p + 1); }
    }, AUTOPLAY_MS);
  }, [itemCount, stopAuto]);

  useEffect(() => { startAuto(); return stopAuto; }, [startAuto, stopAuto]);

  const go = useCallback((delta: number) => { stopAuto(); setAnimate(true); setRawIndex(p => p + delta); setTimeout(startAuto, AUTOPLAY_MS + 600); }, [startAuto, stopAuto]);
  const prev = useCallback(() => go(-1), [go]);
  const next = useCallback(() => go(1), [go]);
  const goToPage = useCallback((pageIdx: number) => {
    stopAuto(); setAnimate(true); setRawIndex(itemCount + pageIdx * visibleCount); setTimeout(startAuto, AUTOPLAY_MS + 600);
  }, [itemCount, visibleCount, startAuto, stopAuto]);

  const trackOffset = -(rawIndex * (cardWidth + GAP));
  const dotCount    = itemCount > 0 ? Math.ceil(itemCount / visibleCount) : 0;
  const normalised  = itemCount > 0 ? ((rawIndex % itemCount) + itemCount) % itemCount : 0;
  const activeDot   = Math.floor(normalised / visibleCount);

  const onTouchStart = (e: React.TouchEvent) => { dragStartX.current = dragCurrX.current = e.touches[0].clientX; dragActive.current = true; stopAuto(); };
  const onTouchMove  = (e: React.TouchEvent) => { if (!dragActive.current) return; dragCurrX.current = e.touches[0].clientX; };
  const onTouchEnd   = () => { if (!dragActive.current) return; dragActive.current = false; const diff = dragStartX.current - dragCurrX.current; if (Math.abs(diff) > 40) diff > 0 ? next() : prev(); else startAuto(); };
  const onMouseDown  = (e: React.MouseEvent) => { dragStartX.current = dragCurrX.current = e.clientX; dragActive.current = true; setIsDragging(false); stopAuto(); };
  const onMouseMove  = (e: React.MouseEvent) => { if (!dragActive.current) return; dragCurrX.current = e.clientX; if (Math.abs(e.clientX - dragStartX.current) > 6) setIsDragging(true); };
  const onMouseUp    = () => { if (!dragActive.current) return; dragActive.current = false; const diff = dragStartX.current - dragCurrX.current; if (Math.abs(diff) > 40) diff > 0 ? next() : prev(); else startAuto(); setTimeout(() => setIsDragging(false), 0); };
  const onMouseEnter = () => { isHovered.current = true; };
  const onMouseLeave = () => { isHovered.current = false; if (dragActive.current) { dragActive.current = false; setIsDragging(false); startAuto(); } };

  return { viewportRef: measure, visibleCount, cardWidth, trackOffset, animate, isDragging, prev, next, goToPage, dotCount, activeDot, dragHandlers: { onTouchStart, onTouchMove, onTouchEnd, onMouseDown, onMouseMove, onMouseUp, onMouseEnter, onMouseLeave } };
}

/* ═══════════════════════════════════════════════════════
   PRODUCT IMAGE COMPONENT
   ═══════════════════════════════════════════════════════ */
function ProductImg({ src, alt, className }: { src: string; alt: string; className: string }) {
  const [err, setErr] = useState(false);
  const safe = !err && src && (src.startsWith('http') || src.startsWith('/')) ? src : null;
  return <Image src={safe ?? PLACEHOLDER_IMG} alt={alt} fill sizes="25vw" className={className} onError={() => setErr(true)} />;
}

/* ═══════════════════════════════════════════════════════
   RELATED CARD
   ═══════════════════════════════════════════════════════ */
function RelatedCard({ product, wishlisted, wishPending, cartState, onWishlist, onAddToCart, onQuickView }: any) {
  const router = useRouter();
  const stars  = Math.min(5, Math.max(0, Math.round(product.stars)));
  const hasSave = product.originalPrice > product.price;
  const discPct = product.discount > 0 ? product.discount : hasSave ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100) : 0;

  return (
    <article className={styles.relCard}>
      <button className={[styles.relWishBtn, wishlisted ? styles.relWishlisted : ''].filter(Boolean).join(' ')}
        onClick={(e) => { e.stopPropagation(); onWishlist(); }} type="button">
        {wishPending ? '⏳' : wishlisted ? '❤️' : '🤍'}
      </button>
      <div className={styles.relCardImg} onClick={() => router.push(`/product/${product.id}`)} style={{ cursor: 'pointer' }}>
        {product.images.length > 0
          ? <ProductImg src={product.images[0]} alt={product.name} className={styles.relCardImageTag} />
          : <div className={styles.relCardEmoji}>🎁</div>}
        {!product.inStock && <div className={styles.relOutOfStock}>Out of Stock</div>}
        <button type="button" className={styles.relCardOverlay} onClick={(e) => { e.stopPropagation(); onQuickView(); }}>
          <span className={styles.relQuickView}>Quick View</span>
        </button>
      </div>
      <div className={styles.relCardBody}>
        <Link href={`/product/${product.id}`} className={styles.relCardNameLink}>
          <h3 className={styles.relCardName}>{product.name}</h3>
        </Link>
        <div className={styles.relCardStars}>
          {'★'.repeat(stars)}{'☆'.repeat(5 - stars)}
          <span className={styles.relCardReviews}>({product.reviewCount})</span>
        </div>
        <div className={styles.relCardPriceRow}>
          <span className={styles.relPriceNow}>₹{fmt(product.price)}</span>
          {hasSave && <span className={styles.relPriceWas}>₹{fmt(product.originalPrice)}</span>}
          {discPct > 0 && <span className={styles.relPriceSave}>{discPct}% OFF</span>}
        </div>
        <button className={[styles.relAddBtn, !product.inStock ? styles.relAddBtnDisabled : '', cartState === 'added' ? styles.relAddBtnAdded : ''].filter(Boolean).join(' ')}
          type="button" disabled={!product.inStock || cartState === 'loading'} onClick={(e) => { e.stopPropagation(); onAddToCart(); }}>
          {cartState === 'loading' ? 'Adding…' : cartState === 'added' ? '✓ Added!' : product.inStock ? 'Add to Cart' : 'Notify Me'}
        </button>
      </div>
    </article>
  );
}

/* ═══════════════════════════════════════════════════════
   VIDEO PLAYER COMPONENT
   ═══════════════════════════════════════════════════════ */
function VideoPlayer({ src, poster }: { src: string; poster?: string }) {
  const [playing, setPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  function toggle() {
    const v = videoRef.current;
    if (!v) return;
    if (playing) { v.pause(); setPlaying(false); }
    else { v.play(); setPlaying(true); }
  }

  return (
    <div className={styles.videoWrap} onClick={toggle}>
      <video ref={videoRef} src={src} poster={poster} className={styles.videoEl}
        onEnded={() => setPlaying(false)} playsInline />
      {!playing && (
        <div className={styles.videoOverlay}>
          <div className={styles.videoPlayBtn}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="#fff">
              <polygon points="5,3 19,12 5,21" />
            </svg>
          </div>
          <span className={styles.videoLabel}>Watch Video</span>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   STAR RENDER
   ═══════════════════════════════════════════════════════ */
function Stars({ count, size = 14 }: { count: number; size?: number }) {
  const n = Math.min(5, Math.max(0, Math.round(count)));
  return (
    <span className={styles.starsRow} style={{ fontSize: size }}>
      {'★'.repeat(n)}<span className={styles.starEmpty}>{'★'.repeat(5 - n)}</span>
    </span>
  );
}

/* ═══════════════════════════════════════════════════════
   MAIN PAGE COMPONENT
   ═══════════════════════════════════════════════════════ */
export default function ProductPage({ productId }: { productId: string | number }) {
  const router = useRouter();

  const [product,    setProduct]    = useState<MappedProduct | null>(null);
  const [loading,    setLoading]    = useState(true);
  const [notFound,   setNotFound]   = useState(false);
  const [activeImg,  setActiveImg]  = useState(0);
  const [qty,        setQty]        = useState(1);
  const [activeTab,  setActiveTab]  = useState<'details' | 'specs' | 'reviews' | 'qa' | 'delivery'>('details');
  const [imgError,   setImgError]   = useState<Record<number, boolean>>({});
  const [cartState,  setCartState]  = useState<CartState>('idle');
  const [cartMsg,    setCartMsg]    = useState('');
  const [buyState,   setBuyState]   = useState<CartState>('idle');
  const [wishlisted, setWishlisted] = useState(false);
  const [wishState,  setWishState]  = useState<WishState>('idle');
  const [selectedColorIdx, setSelectedColorIdx] = useState(0);
  const [showOffers, setShowOffers] = useState(false);
  const [copiedCode, setCopiedCode] = useState('');
  const [pincode,    setPincode]    = useState('');
  const [pincodeMsg, setPincodeMsg] = useState('');
  const [pincodeOk,  setPincodeOk]  = useState<boolean | null>(null);
  const [copyToast,  setCopyToast]  = useState(false);

  const [related,       setRelated]       = useState<MappedProduct[]>([]);
  const [relWishlist,   setRelWishlist]   = useState<Set<string>>(new Set());
  const [relWishPend,   setRelWishPend]   = useState<Set<string>>(new Set());
  const [relCartStates, setRelCartStates] = useState<Record<string, CartState>>({});

  const [qvProduct,   setQvProduct]   = useState<MappedProduct | null>(null);
  const [qvActiveImg, setQvActiveImg] = useState(0);
  const [qvQty,       setQvQty]       = useState(1);
  const [qvCartState, setQvCartState] = useState<CartState>('idle');

  const carousel      = useCarousel(related.length);
  const clonedRelated = [...related, ...related, ...related];
  const { dispatch }  = useCart();

  function openQv(p: MappedProduct) { setQvProduct(p); setQvActiveImg(0); setQvQty(1); setQvCartState('idle'); document.body.style.overflow = 'hidden'; }
  function closeQv() { setQvProduct(null); document.body.style.overflow = ''; }
  useEffect(() => { const h = (e: KeyboardEvent) => { if (e.key === 'Escape') closeQv(); }; if (qvProduct) window.addEventListener('keydown', h); return () => window.removeEventListener('keydown', h); }, [qvProduct]);

  /* Fetch */
  useEffect(() => {
    if (!productId) return;
    setLoading(true); setNotFound(false); setActiveImg(0); setImgError({}); setCartState('idle'); setCartMsg(''); setSelectedColorIdx(0);
    _get(`/api/product/${productId}`)
      .then((res: any) => {
        const raw: BackendProduct = res?.product_details ?? res?.product ?? res;
        if (!raw?.name) { setNotFound(true); return; }
        setProduct(mapBackendProduct(raw));
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [productId]);

  useEffect(() => {
    if (!productId) return;
    _get('/api/favorite').then((res: any) => {
      const items: any[] = Array.isArray(res) ? res : (res?.data ?? []);
      const ids = items.map((i: any) => typeof i === 'string' ? i : String(i.product_id ?? i.id ?? ''));
      setWishlisted(ids.includes(String(productId)));
      setRelWishlist(new Set(ids));
    }).catch(() => {});
  }, [productId]);

  useEffect(() => {
    _get('/api/product/featured').then((res: any) => {
      const raw: BackendProduct[] = Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : [];
      setRelated(raw.filter((p) => String(p.id) !== String(productId)).slice(0, 8).map(mapBackendProduct));
    }).catch(() => {});
  }, [productId]);

  /* Cart */
  async function handleCart() {
    if (!product || cartState === 'loading') return;
    setCartState('loading');
    const cv = product.colorVariants[selectedColorIdx] ?? null;
    const col = cv?.name ?? '', hex = cv?.hex ?? '', img = cv?.images[0] ?? product.images[0] ?? '';
    dispatch({ type: 'ADD_ITEM', payload: { id: product.id, name: col ? `${product.name} – ${col}` : product.name, price: product.price, originalPrice: product.originalPrice, quantity: qty, image: img, emoji: '🎁', bgGradient: '', category: product.category, color: col, color_hex: hex, product_count: product.stockCount, is_available: product.inStock } });
    try {
      await _post('/api/cart/items', { product_id: product.id, quantity: qty, color: col, color_hex: hex, image: img });
      setCartState('added'); setCartMsg(`✓ ${product.name}${col ? ` (${col})` : ''} added to cart!`);
      setTimeout(() => { setCartState('idle'); setCartMsg(''); }, 3000);
    } catch {
      dispatch({ type: 'REMOVE_ITEM', payload: { id: product.id, color: col } });
      setCartState('error'); setCartMsg('Could not add to cart. Please try again.');
      setTimeout(() => { setCartState('idle'); setCartMsg(''); }, 3000);
    }
  }

  async function handleBuyNow() {
    if (!product || buyState === 'loading') return;
    setBuyState('loading');
    const cv = product.colorVariants[selectedColorIdx] ?? null;
    const col = cv?.name ?? '', hex = cv?.hex ?? '', img = cv?.images[0] ?? product.images[0] ?? '';
    dispatch({ type: 'ADD_ITEM', payload: { id: product.id, name: col ? `${product.name} – ${col}` : product.name, price: product.price, originalPrice: product.originalPrice, quantity: qty, image: img, emoji: '🎁', bgGradient: '', category: product.category, color: col, color_hex: hex, product_count: product.stockCount, is_available: product.inStock } });
    try { await _post('/api/cart/items', { product_id: product.id, quantity: qty, color: col, color_hex: hex, image: img }); router.push('/cart'); }
    catch { dispatch({ type: 'REMOVE_ITEM', payload: { id: product.id, color: col } }); setBuyState('error'); setTimeout(() => setBuyState('idle'), 3000); }
  }

  async function handleWishlist() {
    if (!product || wishState === 'loading') return;
    const was = wishlisted; setWishlisted(!was); setWishState('loading');
    try { await fetch(`/api/favorite/${product.id}`, { method: was ? 'DELETE' : 'POST' }); }
    catch { setWishlisted(was); }
    finally { setWishState('idle'); }
  }

  const toggleRelWishlist = useCallback(async (id: string) => {
    if (relWishPend.has(id)) return;
    const was = relWishlist.has(id);
    setRelWishlist((prev) => { const n = new Set(prev); was ? n.delete(id) : n.add(id); return n; });
    setRelWishPend((prev) => new Set(prev).add(id));
    try { await fetch(`/api/favorite/${id}`, { method: was ? 'DELETE' : 'POST' }); }
    catch { setRelWishlist((prev) => { const n = new Set(prev); was ? n.add(id) : n.delete(id); return n; }); }
    finally { setRelWishPend((prev) => { const n = new Set(prev); n.delete(id); return n; }); }
  }, [relWishlist, relWishPend]);

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

  async function handleQvAddToCart() {
    if (!qvProduct || qvCartState === 'loading') return;
    setQvCartState('loading');
    dispatch({ type: 'ADD_ITEM', payload: { id: qvProduct.id, name: qvProduct.name, price: qvProduct.price, originalPrice: qvProduct.originalPrice, quantity: qvQty, image: qvProduct.images[0] ?? '', emoji: '🎁', bgGradient: '', category: qvProduct.category, color: '', product_count: qvProduct.stockCount, is_available: qvProduct.inStock } });
    try {
      await _post('/api/cart/items', { product_id: qvProduct.id, quantity: qvQty });
      setQvCartState('added'); setTimeout(() => setQvCartState('idle'), 2000);
    } catch {
      dispatch({ type: 'REMOVE_ITEM', payload: { id: qvProduct.id } });
      setQvCartState('error'); setTimeout(() => setQvCartState('idle'), 2500);
    }
  }

  function copyCode(code: string) {
    navigator.clipboard.writeText(code).catch(() => {});
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(''), 2000);
  }

  async function checkPincode() {
    const p = pincode.trim();
    if (p.length !== 6 || isNaN(Number(p))) { setPincodeMsg('Enter a valid 6-digit pincode'); setPincodeOk(false); return; }
    setPincodeMsg('Checking…'); setPincodeOk(null);
    await new Promise(r => setTimeout(r, 600));
    const n = Number(p);
    const serviceable = [[110001,110096],[400001,400104],[560001,560100],[500001,500098],[600001,600119],[700001,700157],[411001,411062],[380001,380061],[302001,302040],[522001,522034],[520001,520015]];
    const ok = serviceable.some(([s,e]) => n >= s && n <= e) || (n % 10) <= 7;
    setPincodeOk(ok);
    setPincodeMsg(ok ? `✅ Delivery available — arrives in 3–5 business days. Free shipping on orders above ₹499.` : `❌ Delivery not available to ${p} yet.`);
  }

  /* Loading */
  if (loading) return (
    <div className={styles.page}>
      <div className={styles.mainGrid}>
        <div className={styles.skeletonGallery}><div className={styles.skeletonMainImg} /></div>
        <div className={styles.skeletonInfo}>
          {[80,200,100,120,160,200].map((w,i) => <div key={i} className={styles.skeletonBlock} style={{ width: w, height: i===1?32:i===5?52:16 }} />)}
        </div>
      </div>
    </div>
  );

  if (notFound || !product) return (
    <div className={styles.page} style={{ textAlign: 'center', padding: '80px 20px' }}>
      <div style={{ fontSize: 64 }}>🔍</div>
      <h2 style={{ fontFamily: 'var(--font-baloo)', fontSize: 28, color: 'var(--navy)', margin: '16px 0 8px' }}>Product not found</h2>
      <Link href="/" style={{ color: 'var(--coral)', fontWeight: 700 }}>← Back to Home</Link>
    </div>
  );

  const activeCV   = product.colorVariants[selectedColorIdx] ?? null;
  const activeImgs = (activeCV && activeCV.images.length > 0) ? activeCV.images : product.images;
  const allThumbs  = product.videoUrl ? [...activeImgs, 'VIDEO'] : activeImgs;
  const currentImg = activeImg < activeImgs.length ? (imgError[activeImg] ? PLACEHOLDER_IMG : (activeImgs[activeImg] ?? PLACEHOLDER_IMG)) : PLACEHOLDER_IMG;
  const discountPct = product.originalPrice > 0 ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100) : product.discount ?? 0;

  return (
    <div className={styles.page}>

      {/* Breadcrumb */}
      <div className={styles.breadcrumb}>
        <Link href="/" className={styles.breadLink}>Home</Link>
        <span className={styles.breadSep}>›</span>
        <Link href={`/category/${product.subcategory}`} className={styles.breadLink}>{product.category}</Link>
        <span className={styles.breadSep}>›</span>
        <span className={styles.breadCurrent}>{product.name}</span>
      </div>

      {/* Main Grid */}
      <div className={styles.mainGrid}>

        {/* ── GALLERY ── */}
        <div className={styles.gallery}>
          {/* Thumbs */}
          <div className={styles.galleryThumbs}>
            {allThumbs.map((src, i) => (
              <button key={i}
                className={`${styles.thumb} ${i === activeImg ? styles.thumbActive : ''}`}
                onClick={() => setActiveImg(i)} type="button">
                {src === 'VIDEO' ? (
                  <div className={styles.thumbVideoIcon}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="var(--coral)"><polygon points="5,3 19,12 5,21"/></svg>
                  </div>
                ) : (
                  <Image src={imgError[i] ? PLACEHOLDER_IMG : src} alt={`view ${i+1}`} fill sizes="76px" className={styles.thumbImage} onError={() => setImgError(p => ({...p,[i]:true}))} />
                )}
              </button>
            ))}
          </div>

          {/* Main */}
          <div className={styles.galleryMain}>
            {product.badges.length > 0 && (
              <div className={styles.galleryBadges}>
                {product.badges.map((b) => <span key={b.label} className={styles.badgeSale}>{b.label}</span>)}
              </div>
            )}
            {product.inStock && product.badges.length === 0 && (
              <div className={styles.galleryBadges}><span className={styles.badgeBestSeller}>Bestseller</span></div>
            )}

            {/* Show video player or image */}
            {activeImg >= activeImgs.length && product.videoUrl ? (
              <VideoPlayer src={product.videoUrl} poster={product.images[0]} />
            ) : (
              <>
                <Image src={currentImg} alt={product.name} fill priority sizes="(max-width:900px) 100vw, 50vw" className={styles.galleryMainImage} onError={() => setImgError(p => ({...p,[activeImg]:true}))} />
                <button className={styles.viewBtn} type="button">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
                  360° View
                </button>
              </>
            )}

            {/* Wishlist on gallery */}
            <button className={[styles.galleryWishBtn, wishlisted ? styles.galleryWishlisted : ''].filter(Boolean).join(' ')} onClick={handleWishlist} type="button">
              {wishState === 'loading' ? '⏳' : wishlisted ? '❤️' : '🤍'}
            </button>
          </div>
        </div>

        {/* ── INFO PANEL ── */}
        <div className={styles.info}>
          <div className={styles.categoryPill}>{product.subcategory || product.category}</div>
          <h1 className={styles.productTitle}>{product.name}</h1>

          {/* Rating row */}
          <div className={styles.ratingRow}>
            <Stars count={product.stars} size={16} />
            <span className={styles.ratingNum}>{product.stars}.0</span>
            <button className={styles.reviewCountBtn} type="button" onClick={() => setActiveTab('reviews')}>
              ({product.reviewCount} reviews)
            </button>
            {product.inStock && product.badges.length > 0 && (
              <span className={styles.bestsellerTag}>⭐ Bestseller</span>
            )}
          </div>

          {/* Price */}
          <div className={styles.priceBlock}>
            <span className={styles.priceNow}>₹{fmt(product.price)}</span>
            {product.originalPrice !== product.price && (
              <>
                <span className={styles.priceWas}>₹{fmt(product.originalPrice)}</span>
                {discountPct > 0 && <span className={styles.discPill}>{discountPct}% OFF</span>}
              </>
            )}
          </div>
          <div className={styles.taxNote}>Inclusive of all taxes</div>

          {/* Short desc */}
          <p className={styles.shortDesc}>{product.description}</p>

          {/* Highlight icons — 4 per row */}
          {product.highlights.length > 0 && (
            <div className={styles.highlightGrid}>
              {product.highlights.slice(0, 4).map((h, i) => (
                <div key={i} className={styles.highlightCell}>
                  <span className={styles.highlightCellIcon}>{HIGHLIGHT_ICONS[i % HIGHLIGHT_ICONS.length]}</span>
                  <span className={styles.highlightCellText}>{h}</span>
                </div>
              ))}
            </div>
          )}

          {/* Color swatches */}
          {product.colorVariants.length > 0 && (
            <div className={styles.colorSection}>
              <div className={styles.colorLabel}>
                Color: <span className={styles.colorName}>{activeCV?.name ?? product.colorVariants[0]?.name}</span>
              </div>
              <div className={styles.colorSwatches}>
                {product.colorVariants.map((cv, idx) => {
                  const isWhite = cv.hex.toLowerCase() === '#ffffff';
                  return (
                    <button key={cv.name} type="button" title={cv.name}
                      className={[styles.colorSwatch, idx === selectedColorIdx ? styles.colorSwatchSelected : '', isWhite ? styles.colorSwatchWhite : ''].filter(Boolean).join(' ')}
                      style={{ background: cv.hex }}
                      onClick={() => { setSelectedColorIdx(idx); setActiveImg(0); setImgError({}); }}>
                      {idx === selectedColorIdx && (
                        <svg className={styles.colorSwatchCheck} viewBox="0 0 12 12" fill="none" stroke={isWhite ? '#555' : '#fff'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="2,6 5,9 10,3" />
                        </svg>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Available Offers */}
          <div className={styles.offersBox}>
            <div className={styles.offersTitle}>Available Offers</div>
            {OFFERS.slice(0, showOffers ? OFFERS.length : 2).map((o, i) => (
              <div key={i} className={styles.offerRow}>
                <span className={styles.offerIcon}>🏷️</span>
                <span className={styles.offerText}>{o.text}</span>
                <button className={styles.offerApplyBtn} type="button" onClick={() => copyCode(o.code)}>
                  {copiedCode === o.code ? 'Copied!' : 'Apply'}
                </button>
              </div>
            ))}
            {OFFERS.length > 2 && (
              <button className={styles.moreOffersBtn} type="button" onClick={() => setShowOffers(p => !p)}>
                {showOffers ? 'Show less' : `+ ${OFFERS.length - 2} More Offer`}
              </button>
            )}
          </div>

          {/* Stock warning */}
          {product.inStock && product.stockCount < 10 && (
            <div className={styles.stockLow}>⚡ Only {product.stockCount} left — order soon!</div>
          )}

          {/* Qty + Add to Cart */}
          <div className={styles.ctaRow}>
            <div className={styles.qtyControl}>
              <button className={styles.qtyBtn} type="button" onClick={() => setQty(Math.max(1, qty-1))} disabled={qty <= 1}>−</button>
              <span className={styles.qtyNum}>{qty}</span>
              <button className={styles.qtyBtn} type="button" onClick={() => setQty(Math.min(product.stockCount||99, qty+1))} disabled={qty >= (product.stockCount||99)}>+</button>
            </div>
            <button className={[styles.addToCartBtn, cartState==='added'?styles.addedToCart:'', cartState==='error'?styles.cartError:''].filter(Boolean).join(' ')}
              onClick={handleCart} type="button" disabled={!product.inStock || cartState==='loading'}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
              {cartState==='loading'?'Adding…':cartState==='added'?'Added to Cart!':cartState==='error'?'Try Again':'Add to Cart'}
            </button>
          </div>

          <button className={[styles.buyNowBtn, buyState==='loading'?styles.buyNowLoading:''].filter(Boolean).join(' ')}
            onClick={handleBuyNow} type="button" disabled={!product.inStock || buyState==='loading'}>
            {buyState==='loading'?'Please wait…':'Buy Now →'}
          </button>

          {cartMsg && (
            <div className={`${styles.cartFeedback} ${cartState==='error'?styles.cartFeedbackError:styles.cartFeedbackSuccess}`}>
              {cartMsg}
              {cartState==='added' && <Link href="/cart" className={styles.viewCartLink}>View Cart →</Link>}
            </div>
          )}

          {/* Trust strip */}
          <div className={styles.trustStrip}>
            {[
              { icon: '🚚', title: 'Free Delivery',   sub: 'On orders above ₹499' },
              { icon: '🔄', title: '7 Days Returns',  sub: 'Hassle-free returns' },
              { icon: '🔒', title: 'Secure Payment',  sub: '100% safe checkout' },
              { icon: '❤️', title: 'Made for Kids',   sub: 'Child-safe materials' },
            ].map((t) => (
              <div key={t.title} className={styles.trustItem}>
                <span className={styles.trustIcon}>{t.icon}</span>
                <div><div className={styles.trustTitle}>{t.title}</div><div className={styles.trustSub}>{t.sub}</div></div>
              </div>
            ))}
          </div>

          {/* Pincode checker */}
          <div className={styles.pincodeBox}>
            <div className={styles.pincodeHeader}>
              <span>📍</span>
              <span className={styles.pincodeTitle}>Check Delivery</span>
            </div>
            <div className={styles.pincodeRow}>
              <input type="text" inputMode="numeric" maxLength={6} className={styles.pincodeInput}
                placeholder="Enter 6-digit pincode" value={pincode}
                onChange={(e) => { setPincode(e.target.value.replace(/\D/g,'').slice(0,6)); setPincodeMsg(''); setPincodeOk(null); }}
                onKeyDown={(e) => e.key==='Enter' && checkPincode()} />
              <button className={styles.pincodeBtn} onClick={checkPincode} type="button" disabled={pincode.length<6}>Check</button>
            </div>
            {pincodeMsg && <p className={`${styles.pincodeResult} ${pincodeOk===true?styles.pincodeResultOk:pincodeOk===false?styles.pincodeResultErr:''}`}>{pincodeMsg}</p>}
          </div>
        </div>
      </div>

      {/* ── TABS SECTION ── */}
      <div className={styles.tabSection}>
        <div className={styles.tabs}>
          {([
            { key: 'details',  label: 'Product Details' },
            { key: 'specs',    label: 'Specifications' },
            { key: 'reviews',  label: `Reviews (${product.reviewCount})` },
            { key: 'qa',       label: 'Q&A' },
            { key: 'delivery', label: 'Delivery & Returns' },
          ] as const).map((t) => (
            <button key={t.key} type="button"
              className={`${styles.tab} ${activeTab===t.key?styles.tabActive:''}`}
              onClick={() => setActiveTab(t.key)}>{t.label}</button>
          ))}
        </div>

        <div className={styles.tabContent}>
          {/* DETAILS TAB — description left, video right */}
          {activeTab === 'details' && (
            <div className={styles.detailsTabGrid}>
              <div className={styles.detailsLeft}>
                <p className={styles.detailsDesc}>{product.description}</p>
                {product.highlights.length > 0 && (
                  <ul className={styles.detailsList}>
                    {product.highlights.map((h, i) => (
                      <li key={i}><span className={styles.detailsBullet}>•</span>{h}</li>
                    ))}
                  </ul>
                )}
                {/* Cert badges */}
                <div className={styles.certBadges}>
                  {['🏅 BIS Certified','🌿 Non Toxic Materials','💧 Water Resistant','⭐ Premium Quality'].map((c) => (
                    <span key={c} className={styles.certBadge}>{c}</span>
                  ))}
                </div>
              </div>

              {/* Video */}
              {product.videoUrl && (
                <div className={styles.detailsRight}>
                  <VideoPlayer src={product.videoUrl} poster={product.images[0]} />
                </div>
              )}
            </div>
          )}

          {activeTab === 'specs' && (
            <div className={styles.specsGrid}>
              {[
                ['Category', product.category], ['Sub Category', product.subcategory],
                ['In Stock', product.inStock ? 'Yes' : 'No'], ['Stock Count', String(product.stockCount)],
                ['Price', `₹${fmt(product.price)}`], ['Discount', discountPct > 0 ? `${discountPct}%` : 'None'],
              ].map(([k, v]) => (
                <div key={k} className={styles.specRow}><span className={styles.specKey}>{k}</span><span className={styles.specVal}>{v}</span></div>
              ))}
            </div>
          )}

          {activeTab === 'reviews' && (
            <div className={styles.reviewsLayout}>
              {/* Summary */}
              <div className={styles.reviewSummary}>
                <div className={styles.bigScore}>{product.stars}.0</div>
                <Stars count={product.stars} size={18} />
                <div className={styles.bigReviewCount}>Based on {product.reviewCount} reviews</div>
                <div className={styles.ratingBars}>
                  {RATING_DIST.map((r) => (
                    <div key={r.stars} className={styles.ratingBarRow}>
                      <span className={styles.ratingBarLabel}>{r.stars} ★</span>
                      <div className={styles.barTrack}><div className={styles.barFill} style={{ width: `${r.pct}%` }} /></div>
                      <span className={styles.ratingBarPct}>{r.pct}% ({r.count})</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Reviews list */}
              <div className={styles.reviewsList}>
                {REVIEWS_DATA.map((r, i) => (
                  <div key={i} className={styles.reviewCard}>
                    <div className={styles.reviewHeader}>
                      <div className={styles.reviewAvatar}>{r.avatar}</div>
                      <div>
                        <div className={styles.reviewName}>{r.name} {r.verified && <span className={styles.verifiedBadge}>✓ Verified Purchase</span>}</div>
                        <div className={styles.reviewMeta}>{r.date}</div>
                      </div>
                      <Stars count={r.stars} size={13} />
                    </div>
                    <p className={styles.reviewText}>{r.text}</p>
                  </div>
                ))}
                <button className={styles.viewAllReviewsBtn} type="button">View all reviews →</button>
              </div>
            </div>
          )}

          {activeTab === 'qa' && (
            <div className={styles.qaEmpty}>
              <div style={{ fontSize: 48 }}>💬</div>
              <p>No questions yet. Be the first to ask!</p>
              <button className={styles.askBtn} type="button">Ask a Question</button>
            </div>
          )}

          {activeTab === 'delivery' && (
            <div className={styles.deliveryGrid}>
              <div className={styles.deliveryCard}>
                <h3>🚚 Shipping Policy</h3>
                <ul>
                  <li><strong>Free shipping</strong> on all orders above ₹499</li>
                  <li>Standard delivery: <strong>3–5 business days</strong></li>
                  <li>Express delivery: <strong>1–2 days</strong></li>
                  <li>Same-day delivery in major cities</li>
                  <li>Track via SMS & email after dispatch</li>
                </ul>
              </div>
              <div className={styles.deliveryCard}>
                <h3>🔄 Return Policy</h3>
                <ul>
                  <li><strong>7-day hassle-free returns</strong></li>
                  <li>Product must be unused & in original packaging</li>
                  <li>Raise return via My Account or WhatsApp</li>
                  <li>Refund in <strong>3–5 business days</strong></li>
                  <li>Free pickup for all returns</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── YOU MAY ALSO LIKE ── */}
      {related.length > 0 && (
        <div className={styles.relatedSection}>
          <div className={styles.relatedHeader}>
            <h2 className={styles.relatedTitle}>You May Also Like</h2>
            <div className={styles.relatedControls}>
              <button className={styles.carouselNavBtn} onClick={carousel.prev} type="button">‹</button>
              <button className={styles.carouselNavBtn} onClick={carousel.next} type="button">›</button>
              <Link href="/products" className={styles.relatedViewAll}>View all →</Link>
            </div>
          </div>

          <div className={styles.carouselViewport} ref={carousel.viewportRef}>
            {carousel.cardWidth > 0 && (
              <div
                className={`${styles.carouselTrack} ${carousel.isDragging ? styles.carouselTrackDragging : ''}`}
                style={{ transform: `translateX(${carousel.trackOffset}px)`, transition: carousel.animate ? 'transform 0.42s cubic-bezier(0.25,0.46,0.45,0.94)' : 'none' }}
                {...carousel.dragHandlers}
              >
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
                  className={`${styles.carouselDot} ${i===carousel.activeDot?styles.carouselDotActive:''}`}
                  onClick={() => carousel.goToPage(i)} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── BOTTOM TRUST BAR ── */}
      <div className={styles.bottomTrustBar}>
        {[
          { icon: '🏅', title: '100% Original Products', sub: 'Sourced from trusted brands' },
          { icon: '🌿', title: 'Safe & Non-Toxic',       sub: 'Child-safe and eco-friendly' },
          { icon: '🔄', title: 'Easy Returns',           sub: '7 days hassle-free returns' },
          { icon: '🔒', title: 'Secure Payments',        sub: 'Multiple safe payment options' },
        ].map((t) => (
          <div key={t.title} className={styles.bottomTrustItem}>
            <span className={styles.bottomTrustIcon}>{t.icon}</span>
            <div><div className={styles.bottomTrustTitle}>{t.title}</div><div className={styles.bottomTrustSub}>{t.sub}</div></div>
          </div>
        ))}
      </div>

      {/* ── FOOTER ── */}
      <footer className={styles.footer}>
        <div className={styles.footerTop}>
          <div className={styles.footerBrand}>
            <div className={styles.footerLogo}>
              <span className={styles.footerLogoIcon}>🙂</span>
              <span className={styles.footerLogoText}>Little Loot</span>
            </div>
            <p className={styles.footerDesc}>Premium quality products for happy learning, creativity and joyful childhood memories.</p>
            <div className={styles.footerSocials}>
              {['📘','📸','▶️','📌'].map((s,i) => <a key={i} href="#" className={styles.footerSocialBtn}>{s}</a>)}
            </div>
          </div>

          {[
            { title: 'Shop', links: ['School Bags','Lunch & Bottles','Toys & Games','Stationery','Gift Sets','New Arrivals'] },
            { title: 'Customer Care', links: ['Contact Us','Track Order','Returns & Refunds','Shipping Policy','FAQs'] },
            { title: 'Company', links: ['About Us','Our Story','Careers','Press','Blog'] },
          ].map((col) => (
            <div key={col.title} className={styles.footerCol}>
              <h4 className={styles.footerColTitle}>{col.title}</h4>
              <ul className={styles.footerLinks}>
                {col.links.map((l) => <li key={l}><Link href="#" className={styles.footerLink}>{l}</Link></li>)}
              </ul>
            </div>
          ))}

          <div className={styles.footerNewsletterCol}>
            <h4 className={styles.footerColTitle}>Newsletter</h4>
            <p className={styles.footerNewsletterSub}>Subscribe to get special offers, free giveaways, and new arrivals.</p>
            <div className={styles.footerNewsletterForm}>
              <input type="email" className={styles.footerNewsletterInput} placeholder="Enter your email" />
              <button className={styles.footerNewsletterBtn} type="button">Subscribe</button>
            </div>
          </div>
        </div>

        <div className={styles.footerBottom}>
          <p className={styles.footerCopy}>© 2024 Little Loot. All rights reserved.</p>
          <div className={styles.footerLinks2}>
            <Link href="#" className={styles.footerLink2}>Terms & Conditions</Link>
            <Link href="#" className={styles.footerLink2}>Privacy Policy</Link>
          </div>
          <div className={styles.footerPayments}>
            {['VISA','MC','UPI','RuPay','G-Pay'].map((p) => <span key={p} className={styles.footerPayBadge}>{p}</span>)}
          </div>
        </div>
      </footer>

      {/* Copy toast */}
      {copyToast && <div className={styles.copyToast}>🔗 Link copied!</div>}

      {/* ── QUICK VIEW MODAL ── */}
      {qvProduct && (
        <div className={styles.qvOverlay} onClick={closeQv} role="dialog" aria-modal="true">
          <div className={styles.qvModal} onClick={(e) => e.stopPropagation()}>
            <button className={styles.qvClose} onClick={closeQv} type="button">✕</button>
            <div className={styles.qvGrid}>
              <div className={styles.qvImgCol}>
                <div className={styles.qvMainImg}>
                  {qvProduct.images[qvActiveImg]
                    ? <Image src={qvProduct.images[qvActiveImg]} alt={qvProduct.name} fill sizes="45vw" className={styles.qvMainImgTag} />
                    : <div className={styles.qvEmojiThumb}>🎁</div>}
                </div>
                {qvProduct.images.length > 1 && (
                  <div className={styles.qvThumbs}>
                    {qvProduct.images.map((img, i) => (
                      <button key={i} type="button" className={`${styles.qvThumb} ${i===qvActiveImg?styles.qvThumbActive:''}`} onClick={() => setQvActiveImg(i)}>
                        <Image src={img} alt={`View ${i+1}`} fill sizes="56px" className={styles.qvThumbImg} />
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className={styles.qvInfoCol}>
                <div className={styles.qvCategory}>{qvProduct.subcategory || qvProduct.category}</div>
                <h2 className={styles.qvName}>{qvProduct.name}</h2>
                <div className={styles.qvStars}><Stars count={qvProduct.stars} size={14} /> <span className={styles.qvReviews}>({qvProduct.reviewCount})</span></div>
                <div className={styles.qvPrice}>
                  <span className={styles.qvPriceNow}>₹{fmt(qvProduct.price)}</span>
                  {qvProduct.originalPrice > qvProduct.price && <>
                    <span className={styles.qvPriceWas}>₹{fmt(qvProduct.originalPrice)}</span>
                    <span className={styles.qvPriceSave}>Save ₹{fmt(qvProduct.originalPrice-qvProduct.price)}</span>
                  </>}
                </div>
                <div className={qvProduct.inStock ? styles.qvInStock : styles.qvOutStock}>{qvProduct.inStock ? '✅ In Stock' : '❌ Out of Stock'}</div>
                {qvProduct.description && <p className={styles.qvDesc}>{qvProduct.description}</p>}
                <div className={styles.qvActions}>
                  <div className={styles.qvQty}>
                    <button type="button" className={styles.qvQtyBtn} onClick={() => setQvQty(q => Math.max(1,q-1))} disabled={qvQty<=1}>−</button>
                    <span className={styles.qvQtyNum}>{qvQty}</span>
                    <button type="button" className={styles.qvQtyBtn} onClick={() => setQvQty(q => q+1)} disabled={!qvProduct.inStock}>+</button>
                  </div>
                  <button type="button"
                    className={`${styles.qvAddBtn} ${qvCartState==='added'?styles.qvAddBtnAdded:qvCartState==='error'?styles.qvAddBtnError:''}`}
                    disabled={!qvProduct.inStock || qvCartState==='loading'} onClick={handleQvAddToCart}>
                    {qvCartState==='loading'?'Adding…':qvCartState==='added'?'✓ Added!':qvCartState==='error'?'✗ Retry':'🛒 Add to Cart'}
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