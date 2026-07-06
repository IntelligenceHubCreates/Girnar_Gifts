'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import styles from './ProductPage.module.css';
import { _get, _post, _delete } from '@/shared/fetchwrapper';
import { useCart } from '@/context/CartContext';
import CustomerReviews from './CustomerReviews';

/* ─── Types ─────────────────────────────────── */
interface ProductImage { url: string; public_id?: string; }
interface BackendProduct {
  id: string | number; name: string; category: string;
  sub_category_name?: string; sub_category_slug?: string;
  description: string; original_price: number; amount_discount: number;
  percentage_discount: number; count: number; details: string[];
  product_image: ProductImage[] | string[];
  rating?: number; review_count?: number;
  color_variants?: Array<{ name: string; hex: string; images: string[] }>;
  product_video?: string;
  variant_group_id?: string;  
}
interface ColorVariant { name: string; hex: string; images: string[]; }
interface Product {
  id: string | number; name: string; category: string; subcategory: string;
  subcategorySlug: string;
  description: string; price: number; originalPrice: number; discount: number;
  stars: number; reviewCount: number; inStock: boolean; stockCount: number;
  images: string[]; highlights: string[];
  badges: { label: string; type: string }[];
  colorVariants: ColorVariant[]; videoUrl: string;
  variantGroupId: string; 
  categoryId: string;
}
type CartState = 'idle'|'loading'|'added'|'error';
type WishState = 'idle'|'loading';

/* ─── Helpers ───────────────────────────────── */
const PLACEHOLDER = '/images/placeholder-product.png';
const GAP = 14;
const AUTOPLAY = 3500;

function extractUrls(raw: ProductImage[]|string[]|undefined): string[] {
  if (!raw || !Array.isArray(raw)) return [];
  return raw.map(img => typeof img === 'string' ? img : img?.url ?? '').filter(Boolean);
}
function mapProduct(p: BackendProduct): Product {
  const imgs = extractUrls(p.product_image);
  const orig = Math.max(0, p.original_price ?? 0);
  const amt  = Math.max(0, p.amount_discount ?? 0);
  const pct  = Math.max(0, p.percentage_discount ?? 0);
  

  // Effective sale price.
  // Precedence: a flat amount discount wins; otherwise apply the percentage.
  // (Previously the percentage was ignored whenever amount_discount was 0.)
  let price = orig;
  if (amt > 0)       price = orig - amt;
  else if (pct > 0)  price = Math.round(orig - (orig * pct) / 100);
  if (!Number.isFinite(price) || price < 0) price = 0;

  const effDiscount = orig > 0 && price < orig
    ? Math.round(((orig - price) / orig) * 100)
    : 0;
  const badges = effDiscount > 0 ? [{ label: `${effDiscount}% OFF`, type: 'sale' }] : [];

  const rawCv = Array.isArray(p.color_variants) ? p.color_variants : [];
  const colorVariants = rawCv
    .map((cv: any) => ({ name: String(cv.name ?? ''), hex: String(cv.hex ?? '#ccc'), images: Array.isArray(cv.images) ? cv.images : [] }))
    .filter(cv => cv.name);

  return {
    id: p.id,
    name: p.name ?? 'Product',
    category: p.category ?? '',
    subcategory: p.sub_category_name ?? p.sub_category_slug ?? p.category ?? '',
    subcategorySlug: p.sub_category_slug ?? '',
    description: p.description ?? '',
    price, originalPrice: orig, discount: effDiscount,
    stars: Math.min(5, Math.max(0, p.rating ?? 0)),
    reviewCount: p.review_count ?? 0,
    inStock: (p.count ?? 0) > 0, stockCount: p.count ?? 0,
    images: imgs.length ? imgs : [],
    highlights: Array.isArray(p.details) ? p.details : [],
    badges, colorVariants, videoUrl: p.product_video ?? '',
    variantGroupId: p.variant_group_id ?? '',
    categoryId: (p as any).category_id ?? '',
  };
}
const fmt = (n: number) => Number.isFinite(n) && n > 0 ? n.toLocaleString('en-IN') : '0';


/* ─── Carousel hook ──────────────────────────── */
function useCarousel(count: number) {
  const vpRef = useRef<HTMLDivElement>(null);
  const [vc, setVC] = useState(5);
  const [cw, setCW] = useState(0);
  const [ri, setRI] = useState(count);
  const [an, setAN] = useState(true);
  const [drag, setDrag] = useState(false);
  const hov = useRef(false), da = useRef(false), sx = useRef(0), cx = useRef(0);
  const timer = useRef<ReturnType<typeof setInterval>|null>(null);

  const calc = useCallback((node?: HTMLDivElement|null) => {
    const el = node ?? vpRef.current; if (!el) return;
    (vpRef as any).current = el;
    const w = el.offsetWidth, ww = window?.innerWidth ?? w;
    const n = ww < 400 ? 2 : ww < 640 ? 3 : ww < 900 ? 4 : ww < 1200 ? 5 : 6;
    setVC(n); setCW((w - GAP*(n-1))/n);
  }, []);

  useEffect(() => { const ro = new ResizeObserver(() => calc()); if (vpRef.current) ro.observe(vpRef.current); window.addEventListener('resize', () => calc()); return () => { ro.disconnect(); window.removeEventListener('resize', () => calc()); }; }, [calc]);
  useEffect(() => { if (count < 2) return; if (ri >= count*2) { const t = setTimeout(() => { setAN(false); setRI(p => p-count); }, 420); return () => clearTimeout(t); } if (ri < count) { const t = setTimeout(() => { setAN(false); setRI(p => p+count); }, 420); return () => clearTimeout(t); } }, [ri, count]);
  useEffect(() => { if (!an) { const id = requestAnimationFrame(() => setAN(true)); return () => cancelAnimationFrame(id); } }, [an]);

  const stopA = useCallback(() => { if (timer.current) { clearInterval(timer.current); timer.current = null; } }, []);
  const startA = useCallback(() => { if (count < 2) return; stopA(); timer.current = setInterval(() => { if (!hov.current && !da.current) { setAN(true); setRI(p => p+1); } }, AUTOPLAY); }, [count, stopA]);
  useEffect(() => { startA(); return stopA; }, [startA, stopA]);

  const go = useCallback((d: number) => { stopA(); setAN(true); setRI(p => p+d); setTimeout(startA, AUTOPLAY+600); }, [startA, stopA]);
  const prev = useCallback(() => go(-1), [go]);
  const next = useCallback(() => go(1), [go]);
  const goPage = useCallback((pi: number) => { stopA(); setAN(true); setRI(count + pi*vc); setTimeout(startA, AUTOPLAY+600); }, [count, vc, startA, stopA]);

  const off = -(ri*(cw+GAP));
  const dots = count > 0 ? Math.ceil(count/vc) : 0;
  const norm = count > 0 ? ((ri%count)+count)%count : 0;
  const activeDot = Math.floor(norm/vc);

  const dh = {
    onTouchStart: (e: React.TouchEvent) => { sx.current = cx.current = e.touches[0].clientX; da.current = true; stopA(); },
    onTouchMove:  (e: React.TouchEvent) => { if (!da.current) return; cx.current = e.touches[0].clientX; },
    onTouchEnd:   () => { if (!da.current) return; da.current = false; const d = sx.current - cx.current; if (Math.abs(d) > 40) d > 0 ? next() : prev(); else startA(); },
    onMouseDown:  (e: React.MouseEvent) => { sx.current = cx.current = e.clientX; da.current = true; setDrag(false); stopA(); },
    onMouseMove:  (e: React.MouseEvent) => { if (!da.current) return; cx.current = e.clientX; if (Math.abs(e.clientX-sx.current) > 6) setDrag(true); },
    onMouseUp:    () => { if (!da.current) return; da.current = false; const d = sx.current - cx.current; if (Math.abs(d) > 40) d > 0 ? next() : prev(); else startA(); setTimeout(() => setDrag(false), 0); },
    onMouseEnter: () => { hov.current = true; },
    onMouseLeave: () => { hov.current = false; if (da.current) { da.current = false; setDrag(false); startA(); } },
  };
  return { ref: calc, vc, cw, off, an, drag, prev, next, goPage, dots, activeDot, dh };
}

/* ─── Sub-components ─────────────────────────── */
function SI({ src, alt, cls }: { src: string; alt: string; cls: string }) {
  const [e, setE] = useState(false);
  return <Image src={!e && src?.startsWith('http') ? src : PLACEHOLDER} alt={alt} fill sizes="25vw" className={cls} onError={() => setE(true)} />;
}
function Stars({ n, size=14 }: { n: number; size?: number }) {
  const s = Math.min(5, Math.max(0, Math.round(n)));
  return <span className={styles.stars} style={{ fontSize: size }}>{'★'.repeat(s)}<span className={styles.starsEmpty}>{'★'.repeat(5-s)}</span></span>;
}
function VP({ src, poster }: { src: string; poster?: string }) {
  const [p, setP] = useState(false);
  const ref = useRef<HTMLVideoElement>(null);
  const t = () => {
    const v = ref.current; if (!v) return;
    if (p) { v.pause(); setP(false); }
    else {
      const pr = v.play();
      if (pr && typeof (pr as any).then === 'function') (pr as Promise<void>).then(() => setP(true)).catch(() => setP(false));
      else setP(true);
    }
  };
  return (
    <div className={styles.vp} onClick={t}>
      <video ref={ref} src={src} poster={poster} className={styles.vpVideo} onEnded={() => setP(false)} playsInline />
      {!p && <div className={styles.vpOverlay}><div className={styles.vpBtn}><svg width="24" height="24" viewBox="0 0 24 24" fill="#fff"><polygon points="5,3 19,12 5,21"/></svg></div><span className={styles.vpLabel}>Watch Video</span></div>}
    </div>
  );
}

/* ─── Related card ───────────────────────────── */
function RC({ p, wl, wp, cs, ow, oc, oq }: any) {
  const router = useRouter();
  const s = Math.min(5, Math.max(0, Math.round(p.stars)));
  const save = p.originalPrice > p.price;
  const d = p.discount > 0 ? p.discount : save ? Math.round((p.originalPrice-p.price)/p.originalPrice*100) : 0;
  return (
    <article className={styles.rc}>
      <button className={[styles.rcW, wl?styles.rcWOn:''].filter(Boolean).join(' ')} onClick={e=>{e.stopPropagation();ow();}} type="button">{wp?'⌛':wl?'❤️':'🤍'}</button>
      <div className={styles.rcImg} onClick={() => router.push(`/product/${p.id}`)} style={{cursor:'pointer'}}>
        {p.images.length ? <SI src={p.images[0]} alt={p.name} cls={styles.rcImgTag} /> : <div className={styles.rcEmoji}>🎁</div>}
        {!p.inStock && <div className={styles.rcOos}>Out of Stock</div>}
        <button type="button" className={styles.rcOvr} onClick={e=>{e.stopPropagation();oq();}}><span className={styles.rcQv}>Quick View</span></button>
      </div>
      <div className={styles.rcBody}>
        <Link href={`/product/${p.id}`} className={styles.rcNL}><h3 className={styles.rcN}>{p.name}</h3></Link>
        <div className={styles.rcS}>{'★'.repeat(s)}{'☆'.repeat(5-s)}<span className={styles.rcSc}>({p.reviewCount})</span></div>
        <div className={styles.rcPR}>
          <span className={styles.rcP}>₹{fmt(p.price)}</span>
          {save&&<span className={styles.rcO}>₹{fmt(p.originalPrice)}</span>}
          {d>0&&<span className={styles.rcD}>{d}% off</span>}
        </div>
        <button className={[styles.rcBtn,!p.inStock?styles.rcBtnOos:'',cs==='added'?styles.rcBtnAdded:''].filter(Boolean).join(' ')} type="button" disabled={!p.inStock||cs==='loading'} onClick={e=>{e.stopPropagation();oc();}}>
          {cs==='loading'?'…':cs==='added'?'✓ Added':p.inStock?'Add to Cart':'Notify Me'}
        </button>
      </div>
    </article>
  );
}

/* ─── Quick View ─────────────────────────────── */
function QV({ p, onClose, onAdd, cs }: any) {
  const [qi, setQi] = useState(0);
  const [qty, setQty] = useState(1);
  useEffect(() => { const h = (e: KeyboardEvent) => { if (e.key==='Escape') onClose(); }; window.addEventListener('keydown', h); return () => window.removeEventListener('keydown', h); }, [onClose]);
  return (
    <div className={styles.qvO} onClick={onClose}>
      <div className={styles.qvM} onClick={e=>e.stopPropagation()}>
        <button className={styles.qvCls} onClick={onClose} type="button">✕</button>
        <div className={styles.qvG}>
          <div className={styles.qvL}>
            <div className={styles.qvMI}>{p.images[qi]?<Image src={p.images[qi]} alt={p.name} fill sizes="40vw" style={{objectFit:'contain',padding:12}}/>:<span style={{fontSize:64}}>🎁</span>}</div>
            {p.images.length>1&&<div className={styles.qvTs}>{p.images.map((u:string,i:number)=><button key={i} type="button" className={`${styles.qvT} ${i===qi?styles.qvTA:''}`} onClick={()=>setQi(i)}><Image src={u} alt="" fill sizes="48px" style={{objectFit:'contain'}}/></button>)}</div>}
          </div>
          <div className={styles.qvR}>
            <div className={styles.qvCat}>{p.subcategory||p.category}</div>
            <h2 className={styles.qvName}>{p.name}</h2>
            <div className={styles.qvSR}><Stars n={p.stars} size={13}/><span className={styles.qvRC}>({p.reviewCount})</span></div>
            <div className={styles.qvPR}>
              <span className={styles.qvP}>₹{fmt(p.price)}</span>
              {p.originalPrice>p.price&&<><span className={styles.qvPO}>₹{fmt(p.originalPrice)}</span><span className={styles.qvPS}>Save ₹{fmt(p.originalPrice-p.price)}</span></>}
            </div>
            <div className={p.inStock?styles.qvIS:styles.qvOS}>{p.inStock?'✅ In Stock':'❌ Out of Stock'}</div>
            {p.description&&<p className={styles.qvD}>{p.description}</p>}
            <div className={styles.qvA}>
              <div className={styles.qvQ}>
                <button type="button" className={styles.qvQB} onClick={()=>setQty(q=>Math.max(1,q-1))} disabled={qty<=1}>−</button>
                <span className={styles.qvQN}>{qty}</span>
                <button type="button" className={styles.qvQB} onClick={()=>setQty(q=>q+1)} disabled={!p.inStock}>+</button>
              </div>
              <button type="button" className={`${styles.qvAB} ${cs==='added'?styles.qvABOk:cs==='error'?styles.qvABErr:''}`} disabled={!p.inStock||cs==='loading'} onClick={()=>onAdd(qty)}>
                {cs==='loading'?'Adding…':cs==='added'?'✓ Added!':cs==='error'?'✗ Retry':'🛒 Add to Cart'}
              </button>
            </div>
            <Link href={`/product/${p.id}`} className={styles.qvFL} onClick={onClose}>View full details →</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

// Category tree is small and rarely changes — cache it for the session so
// navigating product→product doesn't refetch it.
let _catTreeCache: any[] | null = null;

/* ─── Hover-pan zoom (desktop only) ──────────── */
function useZoom() {
  const [zoom, setZoom] = useState(false);
  const [pos, setPos] = useState({ x: 50, y: 50 });   // % origin for transform-origin
  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * 100;
    const y = ((e.clientY - r.top) / r.height) * 100;
    setPos({ x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) });
  };
  return { zoom, setZoom, pos, onMove };
}

/* ═══════════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════════ */
export default function ProductPage({ productId }: { productId: string|number }) {
  const router = useRouter();
  // Cast loosely so this stays correct regardless of your exact CartContext value type.
  const cart: any = useCart();
  const dispatch = cart?.dispatch;
  const addItem = cart?.addItem as (input: any) => Promise<{ ok: boolean; error?: string }>;
  const pushToast = cart?.pushToast as (m: string, k?: 'error' | 'success') => void;
  // Cart count for the mobile bottom-nav badge (defensive about the context shape).
  const cartItems: any[] = Array.isArray(cart?.state?.items) ? cart.state.items : [];
  const cartCount = cartItems.reduce((n: number, it: any) => n + (Number(it?.quantity) || 0), 0);

  const [product,   setProduct]   = useState<Product|null>(null);
  const [loading,   setLoading]   = useState(true);
  const [notFound,  setNotFound]  = useState(false);
  const [activeImg, setActiveImg] = useState(0);
  const [qty,       setQty]       = useState(1);
  const [imgErr,    setImgErr]    = useState<Record<number,boolean>>({});
  const [cartSt,    setCartSt]    = useState<CartState>('idle');
  const [cartMsg,   setCartMsg]   = useState('');
  const [buySt,     setBuySt]     = useState<CartState>('idle');
  const [wished,    setWished]    = useState(false);
  const [wishSt,    setWishSt]    = useState<WishState>('idle');
  const [selColor,  setSelColor]  = useState(0);
  const [showMore,  setShowMore]  = useState(false);
  const [copied,    setCopied]    = useState('');
  const [pin,       setPin]       = useState('');
  const [pinMsg,    setPinMsg]    = useState('');
  const [pinOk,     setPinOk]     = useState<boolean|null>(null);
  const [pinLoading,setPinLoading]= useState(false);
  const [activeTab, setActiveTab] = useState<'details'|'specs'|'reviews'|'qa'>('details');
  const [openSec,   setOpenSec]   = useState<string|null>(null);

  const [related,   setRelated]   = useState<Product[]>([]);
  const [relWish,   setRelWish]   = useState<Set<string>>(new Set());
  const [relWP,     setRelWP]     = useState<Set<string>>(new Set());
  const [relCS,     setRelCS]     = useState<Record<string,CartState>>({});
  const [qvP,       setQvP]       = useState<Product|null>(null);
  const [qvCS,      setQvCS]      = useState<CartState>('idle');

  const car = useCarousel(related.length);
  const zoomImg = useZoom();
  const cloned = [...related, ...related, ...related];
  const OFFERS = [
    { text: 'Get 10% off up to ₹150 on first prepaid order\nUse code: HELLO10', color: '#22c55e', code: 'HELLO10' },
    { text: 'Extra 5% off on orders above ₹1999\nUse code: EXTRAS', color: '#f59e0b', code: 'EXTRAS' },
    { text: 'Free gift wrap on orders above ₹999\nUse code: GIFTWRAP', color: '#3b82f6', code: 'GIFTWRAP' },
  ];

  function openQv(p: Product) { setQvP(p); setQvCS('idle'); document.body.style.overflow='hidden'; }
  function closeQv() { setQvP(null); document.body.style.overflow=''; }
  function toggleSec(k: string) { setOpenSec(o => o===k ? null : k); }

  /* ── Fetches ───────────────────── */
  useEffect(() => {
    if (!productId) return;
    setLoading(true); setNotFound(false); setActiveImg(0); setImgErr({}); setCartSt('idle'); setCartMsg(''); setSelColor(0); setQty(1);
    _get(`/api/product/${productId}`)
      .then((res: any) => { const r: BackendProduct = res?.product_details ?? res?.product ?? res; if (!r?.name) { setNotFound(true); return; } setProduct(mapProduct(r)); })
      .catch(() => setNotFound(true)).finally(() => setLoading(false));
  }, [productId]);

  useEffect(() => {
    if (!productId) return;
    _get('/api/favorite').then((res: any) => {
      const items: any[] = Array.isArray(res) ? res : (res?.data ?? []);
      const ids = items.map((i: any) => typeof i==='string' ? i : String(i.product_id ?? i.id ?? ''));
      setWished(ids.includes(String(productId))); setRelWish(new Set(ids));
    }).catch(() => {});
  }, [productId]);

  // Collapse variant families (and any accidental dupes) to one card each.
function dedupeFamilies(list: Product[], excludeId: string): Product[] {
  const seen = new Set<string>();
  const seenNames = new Set<string>();
  const out: Product[] = [];
  for (const p of list) {
    if (String(p.id) === excludeId) continue;
    const key = p.variantGroupId || String(p.id);
    if (seen.has(key)) continue;
    // Fallback: dedupe by name when variant_group_id is absent (same-named variants)
    const nameKey = p.name.trim().toLowerCase();
    if (seenNames.has(nameKey)) continue;
    seen.add(key);
    seenNames.add(nameKey);
    out.push(p);
  }
  return out;
}

 /* Related products: same PARENT category — i.e. all sibling sub-categories. */
  useEffect(() => {
    if (!product) return;
    const prod = product; 
    let cancelled = false;
    const RAIL_SIZE = 10;
    const selfId = String(prod.id);

    const toList = (res: any): BackendProduct[] =>
      Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : [];

    async function load() {
      // 1) Get the category tree (roots[] each with children[]).
      let tree = _catTreeCache;
      if (!tree) {
        try { tree = toList(await _get('/api/categories/')) as any[]; _catTreeCache = tree; }
        catch { tree = []; }   // not cached on failure → retried next navigation
      }

      // 2) Resolve the PARENT slug from this product's sub-category.
      //    The sub-category is either a child of a root, or is itself a root.
      // 2) Resolve the PARENT slug from this product's category via parent_id.
      //    /api/categories/ returns a FLAT array (no nesting) — each node has
      //    parent_id, so we look up the product's category, then walk up once.
      const byId = new Map((tree ?? []).map((c: any) => [String(c.id), c]));

      let parentSlug = '';
      const own = prod.categoryId ? byId.get(String(prod.categoryId)) : undefined;
      if (own) {
        parentSlug = own.parent_id
          ? (byId.get(String(own.parent_id))?.slug ?? own.slug)  // parent's slug
          : own.slug;                                             // already a root
      } else if (prod.subcategorySlug) {
        // Fallback: match the sub-category by slug, then climb to its parent.
        const subCat = (tree ?? []).find((c: any) => c.slug === prod.subcategorySlug);
        parentSlug = subCat?.parent_id
          ? (byId.get(String(subCat.parent_id))?.slug ?? prod.subcategorySlug)
          : (subCat?.slug ?? '');
      }

      const finish = (res: any) =>
        dedupeFamilies(toList(res).map(mapProduct), selfId).slice(0, RAIL_SIZE);

      // 3) Query the whole parent category. limit+1 backfills after self-exclusion.
      try {
        let res: any = null;
        if (parentSlug) {
          res = await _get(`/api/product/all?category_slug=${encodeURIComponent(parentSlug)}&limit=${RAIL_SIZE + 1}&in_stock=true`);
        } else if (prod.category) {
          // Legacy fallback: products with no category_id have no sub-category slug.
          // Match by category NAME — still same-category, NOT featured.
          res = await _get(`/api/product/all?category=${encodeURIComponent(prod.category)}&limit=${RAIL_SIZE + 1}&in_stock=true`);
        }
        if (!cancelled) setRelated(res ? finish(res) : []);
      } catch {
        if (!cancelled) setRelated([]);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [product]);

  /* ── Cart / wishlist ────────────── */
async function handleCart() {
    if (!product || cartSt==='loading') return; setCartSt('loading');
    const cv = product.colorVariants[selColor] ?? null;
    const col = cv?.name ?? '', hex = cv?.hex ?? '', img = cv?.images[0] ?? product.images[0] ?? '';
    const res = await addItem({
      id: product.id, name: col ? `${product.name} – ${col}` : product.name,
      price: product.price, originalPrice: product.originalPrice, quantity: qty,
      image: img, category: product.category, color: col, color_hex: hex,
      product_count: product.stockCount, is_available: product.inStock,
    });
    if (res.ok) {
      setCartSt('added'); setCartMsg(`${product.name}${col?` (${col})`:''}  added!`);
      setTimeout(() => { setCartSt('idle'); setCartMsg(''); }, 3000);
    } else {
      setCartSt('error'); setCartMsg(res.error || 'Could not add. Try again.');
      setTimeout(() => { setCartSt('idle'); setCartMsg(''); }, 3000);
    }
  }

async function handleBuy() {
    if (!product || buySt==='loading') return; setBuySt('loading');
    const cv = product.colorVariants[selColor] ?? null;
    const col = cv?.name ?? '', hex = cv?.hex ?? '', img = cv?.images[0] ?? product.images[0] ?? '';
    const res = await addItem({
      id: product.id, name: col ? `${product.name} – ${col}` : product.name,
      price: product.price, originalPrice: product.originalPrice, quantity: qty,
      image: img, category: product.category, color: col, color_hex: hex,
      product_count: product.stockCount, is_available: product.inStock,
    });
    if (res.ok) router.push('/cart');
    else { setBuySt('error'); pushToast?.(res.error || 'Could not proceed. Try again.', 'error'); setTimeout(() => setBuySt('idle'), 3000); }
  }

  async function handleWish() {
    if (!product || wishSt==='loading') return;
    const was = wished; setWished(!was); setWishSt('loading');
    try {
      if (was) await _delete(`/api/favorite/${product.id}`);
      else     await _post(`/api/favorite/${product.id}`, {});
    } catch { setWished(was); }
    finally { setWishSt('idle'); }
  }
  /* Mobile swipe through gallery images */
  const galTouch = useRef({ x: 0, active: false });
  const onGalTouchStart = (e: React.TouchEvent) => { galTouch.current = { x: e.touches[0].clientX, active: true }; };
  const onGalTouchEnd = (e: React.TouchEvent) => {
    if (!galTouch.current.active) return;
    galTouch.current.active = false;
    const dx = galTouch.current.x - (e.changedTouches[0]?.clientX ?? galTouch.current.x);
    if (Math.abs(dx) < 40) return;                        // ignore taps / tiny drags
    const total = allTh.length;
    if (total < 2) return;
    setActiveImg(i => dx > 0 ? (i + 1) % total : (i - 1 + total) % total);  // wraps both ways
  };

  const toggleRelWish = useCallback(async (id: string) => {
    if (relWP.has(id)) return; const was = relWish.has(id);
    setRelWish(p => { const n=new Set(p); was?n.delete(id):n.add(id); return n; });
    setRelWP(p => new Set(p).add(id));
    try {
      if (was) await _delete(`/api/favorite/${id}`);
      else     await _post(`/api/favorite/${id}`, {});
    } catch { setRelWish(p => { const n=new Set(p); was?n.add(id):n.delete(id); return n; }); }
    finally { setRelWP(p => { const n=new Set(p); n.delete(id); return n; }); }
  }, [relWish, relWP]);

const addRelToCart = useCallback(async (p: Product) => {
    const id = String(p.id); if (relCS[id]==='loading') return;
    setRelCS(prev => ({ ...prev, [id]:'loading' }));
    const res = await addItem({
      id: p.id, name: p.name, price: p.price, originalPrice: p.originalPrice,
      quantity: 1, image: p.images[0]??'', category: p.category,
      product_count: p.stockCount, is_available: p.inStock,
    });
    if (res.ok) { setRelCS(prev => ({ ...prev, [id]:'added' })); setTimeout(() => setRelCS(prev => ({ ...prev, [id]:'idle' })), 2000); }
    else { pushToast?.(res.error || 'Could not add to cart', 'error'); setRelCS(prev => ({ ...prev, [id]:'error' })); setTimeout(() => setRelCS(prev => ({ ...prev, [id]:'idle' })), 2500); }
  }, [relCS, addItem, pushToast]);

async function handleQvAdd(qty: number) {
    if (!qvP || qvCS==='loading') return; setQvCS('loading');
    const res = await addItem({
      id: qvP.id, name: qvP.name, price: qvP.price, originalPrice: qvP.originalPrice,
      quantity: qty, image: qvP.images[0]??'', category: qvP.category,
      product_count: qvP.stockCount, is_available: qvP.inStock,
    });
    if (res.ok) { setQvCS('added'); setTimeout(() => setQvCS('idle'), 2000); }
    else { pushToast?.(res.error || 'Could not add', 'error'); setQvCS('error'); setTimeout(() => setQvCS('idle'), 2500); }
  }

  function copyCode(code: string) { navigator.clipboard.writeText(code).catch(()=>{}); setCopied(code); setTimeout(()=>setCopied(''), 2500); }

  async function checkPin() {
    const p = pin.trim(); if (p.length!==6||isNaN(Number(p))) { setPinMsg('Enter a valid 6-digit pincode.'); setPinOk(false); return; }
    setPinLoading(true); setPinMsg(''); setPinOk(null);
    await new Promise(r => setTimeout(r, 700));
    const n = Number(p);
    const ok = [[110001,110096],[400001,400104],[560001,560100],[500001,500098],[600001,600119],[700001,700157],[411001,411062],[380001,380061],[522001,522034],[520001,520015]].some(([s,e])=>n>=s&&n<=e) || (n%10)<=7;
    setPinOk(ok); setPinLoading(false);
    setPinMsg(ok ? '✅ Delivery available · arrives in 3–5 business days · Free shipping above ₹499' : `❌ Delivery unavailable to ${p}. Try a nearby pincode.`);
  }

  /* ── Loading / 404 ─────────────── */
  if (loading) return (
    <div className={styles.page}>
      <div className={styles.skelWrap}>
        <div className={styles.skelGal}><div className={styles.skelImg}/></div>
        <div className={styles.skelInfo}>{[220,100,60,80,52,100,52].map((h,i)=><div key={i} className={styles.skelB} style={{height:h,width:i===0?'80%':i===2?'40%':'100%'}}/>)}</div>
      </div>
    </div>
  );
  if (notFound || !product) return (
    <div className={styles.page} style={{display:'flex',alignItems:'center',justifyContent:'center',minHeight:'60vh',flexDirection:'column',gap:16,padding:24}}>
      <span style={{fontSize:56}}>🔍</span>
      <h2 style={{fontFamily:'var(--font-baloo)',fontSize:24,color:'#1a2540',margin:0}}>Product not found</h2>
      <Link href="/" style={{color:'var(--gg-primary)',fontWeight:700,fontSize:14}}>← Back to home</Link>
    </div>
  );

  const cv      = product.colorVariants[selColor] ?? null;
  const aImgs   = (cv?.images.length ?? 0) > 0 ? cv!.images : product.images;
  const allTh   = product.videoUrl ? [...aImgs, 'VIDEO'] : aImgs;
  const curImg  = activeImg < aImgs.length ? (imgErr[activeImg] ? PLACEHOLDER : (aImgs[activeImg] ?? PLACEHOLDER)) : PLACEHOLDER;
  const discPct = product.originalPrice > 0 ? Math.round((product.originalPrice - product.price)/product.originalPrice*100) : product.discount;
  const saving  = product.originalPrice - product.price;

  /* ── Render ─────────────────────── */
  return (
    <div className={styles.page}>

      {/* BREADCRUMB */}
      <nav className={styles.bc}>
        <Link href="/" className={styles.bcL}>Home</Link>
        <span className={styles.bcS}>›</span>
        {product.subcategorySlug ? (
          <Link href={`/category/${product.subcategorySlug}`} className={styles.bcL}>{product.subcategory || product.category}</Link>
        ) : (
          <span className={styles.bcL}>{product.subcategory || product.category}</span>
        )}
        <span className={styles.bcS}>›</span>
        <span className={styles.bcC}>{product.name}</span>
      </nav>

      {/* MAIN GRID */}
      <div className={styles.mainGrid}>

        {/* ── GALLERY ── */}
        <div className={styles.gallery}>
          {/* Desktop thumbnail strip */}
          <div className={styles.thumbs}>
            {allTh.map((src, i) => (
              <button key={i} type="button"
                className={`${styles.thumb} ${i===activeImg?styles.thumbOn:''}`}
                onClick={() => setActiveImg(i)}>
                {src==='VIDEO'
                  ? <div className={styles.thumbVid}><svg width="14" height="14" viewBox="0 0 24 24" fill="var(--gg-primary)"><polygon points="5,3 19,12 5,21"/></svg></div>
                  : <Image src={imgErr[i]?PLACEHOLDER:src} alt="" fill sizes="62px" className={styles.thumbImg} onError={() => setImgErr(p=>({...p,[i]:true}))}/>}
              </button>
            ))}
          </div>

          {/* Main image area */}
          <div className={styles.mainImg} onTouchStart={onGalTouchStart} onTouchEnd={onGalTouchEnd}>
            <span className={styles.spark1} aria-hidden>✦</span>
            <span className={styles.spark2} aria-hidden>✦</span>
            <span className={styles.spark3} aria-hidden>✦</span>
            <span className={styles.stageShadow} aria-hidden/>
            {/* Badge: show discount when on sale, otherwise Bestseller */}
            {discPct > 0
              ? <span className={styles.badgeSale}>{discPct}% OFF</span>
              : <span className={styles.badgeSale}>Bestseller</span>}

            {/* Wishlist */}
            <button type="button" className={[styles.wishBtn, wished?styles.wishOn:''].filter(Boolean).join(' ')} onClick={handleWish} disabled={wishSt==='loading'} aria-label="Wishlist">
              <svg width="17" height="17" viewBox="0 0 24 24" fill={wished?'var(--gg-primary)':'none'} stroke={wished?'var(--gg-primary)':'#888'} strokeWidth="2" strokeLinecap="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
            </button>

{/* Video or image (with desktop hover-pan zoom on images) */}
            {activeImg >= aImgs.length && product.videoUrl ? (
              <VP src={product.videoUrl} poster={product.images[0]}/>
            ) : (
              <div
                className={styles.zoomStage}
                onMouseEnter={() => zoomImg.setZoom(true)}
                onMouseLeave={() => zoomImg.setZoom(false)}
                onMouseMove={zoomImg.onMove}
              >
                <Image
                  src={curImg}
                  alt={product.name}
                  fill
                  priority
                  sizes="(max-width:900px)100vw,50vw"
                  className={styles.mainImgTag}
                  style={zoomImg.zoom ? { transform: 'scale(2)', transformOrigin: `${zoomImg.pos.x}% ${zoomImg.pos.y}%` } : undefined}
                  onError={() => setImgErr(p=>({...p,[activeImg]:true}))}
                />
                {zoomImg.zoom && <span className={styles.zoomHint} aria-hidden>🔍 Hover to zoom</span>}
              </div>
            )}

            {/* 360 view */}
            {!(activeImg >= aImgs.length && product.videoUrl) && (
              <div className={styles.viewTag}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
                360° View
              </div>
            )}

            {/* Mobile image dots */}
            {allTh.length > 1 && (
              <div className={styles.imgDots}>
                {allTh.map((_,i) => <button key={i} type="button" className={`${styles.imgDot} ${i===activeImg?styles.imgDotOn:''}`} onClick={()=>setActiveImg(i)}/>)}
              </div>
            )}
          </div>
        </div>

        {/* ── INFO PANEL ── */}
        <div className={styles.info}>
          <p className={styles.catLabel}>{product.subcategory || product.category}</p>
          <h1 className={styles.title}>{product.name}</h1>

          {/* Rating row — real data, honest empty state */}
          <div className={styles.ratingRow}>
            {product.reviewCount > 0 ? (
              <>
                <Stars n={product.stars} size={16}/>
                <span className={styles.ratingVal}>{product.stars.toFixed(1)}</span>
                <button type="button" className={styles.ratingCnt} onClick={()=>setActiveTab('reviews')}>
                  ({product.reviewCount} {product.reviewCount === 1 ? 'review' : 'reviews'})
                </button>
              </>
            ) : (
              <button type="button" className={styles.ratingCnt} onClick={()=>setActiveTab('reviews')}>
                No reviews yet — be the first
              </button>
            )}
            <span className={styles.bestPill}>Bestseller</span>
          </div>

          {/* Price */}
          <div className={styles.priceRow}>
            <span className={styles.priceNow}>₹{fmt(product.price)}</span>
            {product.originalPrice !== product.price && (
              <><span className={styles.priceOld}>MRP ₹{fmt(product.originalPrice)}</span>
              {discPct > 0 && <span className={styles.priceOff}>{discPct}% OFF</span>}</>
            )}
          </div>
          <p className={styles.taxNote}>Inclusive of all taxes</p>

          {/* Description */}
          <p className={styles.desc}>{product.description}</p>

          {/* Color */}
          {product.colorVariants.length > 0 && (
            <div className={styles.colorBlock}>
              <p className={styles.colorLabel}>Color: <strong>{cv?.name ?? product.colorVariants[0]?.name}</strong></p>
              <div className={styles.colorSwatches}>
                {product.colorVariants.map((v,i) => {
                  const white = v.hex.toLowerCase()==='#ffffff';
                  return (
                    <button key={v.name} type="button" title={v.name}
                      className={[styles.swatch, i===selColor?styles.swatchOn:'', white?styles.swatchW:''].filter(Boolean).join(' ')}
                      style={{ background: v.hex }}
                      onClick={() => { setSelColor(i); setActiveImg(0); setImgErr({}); }}>
                      {i===selColor && (
                        <svg viewBox="0 0 12 12" fill="none" stroke={white?'#555':'#fff'} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{width:10,height:10}}>
                          <polyline points="2,6 5,9 10,3"/>
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
            <p className={styles.offersHead}>Available Offers</p>
            {OFFERS.slice(0, showMore ? 3 : 2).map((o,i) => (
              <div key={i} className={styles.offerRow}>
                <span className={styles.offerDot} style={{ background: o.color }}/>
                <span className={styles.offerTxt}>{o.text.split('\n').map((t,j) => <span key={j} style={j===1?{color:'#555',fontSize:'11.5px',display:'block',marginTop:1}:{}}>{t}</span>)}</span>
                <button type="button" className={styles.offerApply} onClick={() => copyCode(o.code)}>
                  {copied===o.code ? '✓ Copied' : 'Apply'}
                </button>
              </div>
            ))}
            <button type="button" className={styles.offersMore} onClick={()=>setShowMore(p=>!p)}>
              {showMore ? '▲ Show less' : `+ 1 More Offer`}
            </button>
          </div>

          {/* Stock warning */}
          {product.inStock && product.stockCount > 0 && product.stockCount < 8 && (
            <div className={styles.stockWarn}>⚡ Only {product.stockCount} left in stock — order soon!</div>
          )}

          {/* Desktop quantity selector */}
          <div className={styles.qtyBlock}>
            <span className={styles.qtyLabel}>Quantity</span>
            <div className={styles.qtyStepper}>
              <button type="button" className={styles.qtyBtn} onClick={()=>setQty(q=>Math.max(1,q-1))} disabled={qty<=1} aria-label="Decrease quantity">−</button>
              <span className={styles.qtyNum}>{qty}</span>
              <button type="button" className={styles.qtyBtn}
                onClick={()=>setQty(q=>Math.min(product.stockCount||99,q+1))}
                disabled={!product.inStock || qty >= (product.stockCount||99)} aria-label="Increase quantity">+</button>
            </div>
            {product.inStock && product.stockCount>0 && qty >= product.stockCount && (
              <span className={styles.qtyMax}>Max available</span>
            )}
          </div>

          {/* CTA */}
          <div className={styles.ctaWrap}>
            <button type="button"
              className={[styles.btnAddCart, cartSt==='added'?styles.btnAdded:'', cartSt==='error'?styles.btnErr:'', !product.inStock?styles.btnDis:''].filter(Boolean).join(' ')}
              onClick={handleCart} disabled={!product.inStock||cartSt==='loading'}>
              {cartSt==='loading' ? '…Adding' : cartSt==='added' ? '✓ Added to Cart!' : cartSt==='error' ? 'Try Again' : (
                <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" style={{marginRight:6}}><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>Add to Cart</>
              )}
            </button>
            <button type="button"
              className={[styles.btnBuyNow, buySt==='loading'?styles.btnBuyLoading:'', !product.inStock?styles.btnDis:''].filter(Boolean).join(' ')}
              onClick={handleBuy} disabled={!product.inStock||buySt==='loading'}>
              {buySt==='loading' ? '…Processing' : buySt==='error' ? 'Try Again' : (
                <><svg width="14" height="14" viewBox="0 0 24 24" fill="#fff" style={{marginRight:6}}><polygon points="5,3 19,12 5,21"/></svg>Buy Now</>
              )}
            </button>
          </div>

          {cartMsg && (
            <div className={`${styles.cartFb} ${cartSt==='error'?styles.cartFbErr:styles.cartFbOk}`}>
              {cartMsg}
              {cartSt==='added' && <Link href="/cart" className={styles.cartLink}>View Cart →</Link>}
            </div>
          )}

          {/* Trust strip */}
          <div className={styles.trustStrip}>
            {[
              {icon:'🚚',t:'Free Delivery',s:'On orders above ₹499'},
              {icon:'🔄',t:'7 Days Returns',s:'Hassle-free returns'},
              {icon:'🔒',t:'Secure Payment',s:'100% safe checkout'},
              {icon:'🎁',t:'Gift Wrapping',s:'Complimentary on every order'},
            ].map(x => (
              <div key={x.t} className={styles.trustItem}>
                <span className={styles.trustIcon}>{x.icon}</span>
                <div><div className={styles.trustT}>{x.t}</div><div className={styles.trustS}>{x.s}</div></div>
              </div>
            ))}
          </div>

          {/* Pincode */}
          <div className={styles.pinBox}>
            <p className={styles.pinHead}><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg> Check Delivery</p>
            <div className={styles.pinRow}>
              <input type="text" inputMode="numeric" maxLength={6} className={styles.pinInput} placeholder="Enter pincode" value={pin}
                onChange={e=>{setPin(e.target.value.replace(/\D/g,'').slice(0,6));setPinMsg('');setPinOk(null);}}
                onKeyDown={e=>e.key==='Enter'&&checkPin()}/>
              <button type="button" className={styles.pinBtn} onClick={checkPin} disabled={pin.length<6||pinLoading}>
                {pinLoading ? <span className={styles.pinSpin}/> : 'Check'}
              </button>
            </div>
            {pinMsg && <p className={`${styles.pinMsg} ${pinOk===true?styles.pinOk:pinOk===false?styles.pinErr:''}`}>{pinMsg}</p>}
          </div>
        </div>
      </div>

      {/* ── TABS ── */}
  <div className={styles.tabsWrap}>
    <div className={styles.tabsBar}>
      {([
        {k:'details',l:'Product Details'},
        {k:'specs',  l:'Specifications'},
        {k:'reviews',l:`Reviews (${product.reviewCount})`},
        {k:'qa',     l:'Q&A'},
      ] as const).map(t=>(
        <button key={t.k} type="button" className={`${styles.tabBtn} ${activeTab===t.k?styles.tabOn:''}`} onClick={()=>setActiveTab(t.k)}>{t.l}</button>
      ))}
    </div>
    <div className={styles.tabBody}>
      {activeTab==='details' && (
        <div className={styles.detailsGrid}>
          <div>
            <p className={styles.detailsDesc}>{product.description}</p>
            {product.highlights.length>0 && (
              <ul className={styles.detailsList}>
                {product.highlights.map((h,i)=><li key={i}><strong>{h.split(':')[0]}{h.includes(':')?':':''}</strong>{h.includes(':')?h.split(':').slice(1).join(':'):''}</li>)}
              </ul>
            )}
            <div className={styles.certRow}>
              {['🎁 Gift Ready','✅ Quality Checked','📦 Secure Packaging','⭐ Premium Quality'].map(c=><span key={c} className={styles.certChip}>{c}</span>)}
            </div>
          </div>
          {product.videoUrl && (
            <div className={styles.detailsVideoWrap}><VP src={product.videoUrl} poster={product.images[0]}/></div>
          )}
        </div>
      )}
      {activeTab==='specs' && (
        <table className={styles.specsTable}>
          <tbody>
            {[['Category',product.category],['Sub-Category',product.subcategory],['Availability',product.inStock?`In Stock (${product.stockCount})`:'Out of Stock'],['Price',`₹${fmt(product.price)}`],['Discount',discPct>0?`${discPct}% (Save ₹${fmt(saving)})`:'None'],['Colors',product.colorVariants.length>0?product.colorVariants.map(c=>c.name).join(', '):'Single']].map(([k,v])=>(
              <tr key={k}><td className={styles.specK}>{k}</td><td className={styles.specV}>{v}</td></tr>
            ))}
          </tbody>
        </table>
      )}
      {activeTab==='reviews' && <div className={styles.tabNote}><CustomerReviews productId={productId} productName={product.name}/></div>}
      {activeTab==='qa' && (
        <div className={styles.qaEmpty}>
          <span style={{fontSize:40}}>💬</span>
          <p>No questions yet. Be the first to ask!</p>
          <button type="button" className={styles.qaBtn}>Ask a Question</button>
        </div>
      )}
    </div>
  </div>

  {/* ── YOU MAY ALSO LIKE (only render when there's something to show) ── */}
  {related.length > 0 && (
    <div className={styles.relSection}>
      <div className={styles.relHeader}>
        <h2 className={styles.relTitle}>You May Also Like</h2>
        {related.length > car.vc && (
          <div className={styles.relCtrl}>
            <button className={styles.navBtn} onClick={car.prev} type="button" aria-label="Prev"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg></button>
            <button className={styles.navBtn} onClick={car.next} type="button" aria-label="Next"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg></button>
          </div>
        )}
      </div>
      <div className={styles.carVP} ref={car.ref}>
        {car.cw > 0 && (
          <div className={`${styles.carTrack} ${car.drag?styles.carDrag:''}`}
            style={{ transform:`translateX(${car.off}px)`, transition:car.an?'transform 0.4s cubic-bezier(0.25,0.46,0.45,0.94)':'none' }}
            {...car.dh}>
            {cloned.map((p,idx) => {
              const id = String(p.id);
              return (
                <div key={`${id}-${idx}`} style={{ width:`${car.cw}px`, minWidth:`${car.cw}px`, flexShrink:0, boxSizing:'border-box' }}>
                  <RC p={p} wl={relWish.has(id)} wp={relWP.has(id)} cs={relCS[id]??'idle'} ow={()=>!car.drag&&toggleRelWish(id)} oc={()=>!car.drag&&addRelToCart(p)} oq={()=>!car.drag&&openQv(p)}/>
                </div>
              );
            })}
          </div>
        )}
      </div>
      {car.dots > 1 && (
        <div className={styles.carDots}>
          {Array.from({length:car.dots}).map((_,i)=>(
            <button key={i} type="button" className={`${styles.dot} ${i===car.activeDot?styles.dotOn:''}`} onClick={()=>car.goPage(i)}/>
          ))}
        </div>
      )}
    </div>
  )}

  {/* ── TRUST BAR ── */}
  <div className={styles.trustBar}>
    {[{i:'🏅',t:'100% Original',s:'Sourced from trusted brands'},{i:'🌿',t:'Safe & Non-Toxic',s:'Child-safe & eco-friendly'},{i:'🔄',t:'Easy Returns',s:'7-day hassle-free'},{i:'🔒',t:'Secure Payments',s:'Multiple safe options'}].map(x=>(
      <div key={x.t} className={styles.trustBarItem}><span className={styles.trustBarI}>{x.i}</span><div><div className={styles.trustBarT}>{x.t}</div><div className={styles.trustBarS}>{x.s}</div></div></div>
    ))}
  </div>

  {/* ── MOBILE STICKY BAR ── */}
  <div className={styles.stickyBar}>
    <div className={styles.stickyLeft}>
      <span className={styles.stickyP}>₹{fmt(product.price)}</span>
      {product.originalPrice > product.price && <span className={styles.stickyO}>₹{fmt(product.originalPrice)}</span>}
      {discPct > 0 && <span className={styles.stickyD}>{discPct}% OFF</span>}
    </div>
    <div className={styles.stickyQty}>
      <button type="button" className={styles.stickyQB} onClick={()=>setQty(q=>Math.max(1,q-1))} disabled={qty<=1}>−</button>
      <span className={styles.stickyQN}>{qty}</span>
      <button type="button" className={styles.stickyQB} onClick={()=>setQty(q=>Math.min(product.stockCount||99,q+1))} disabled={!product.inStock || qty >= (product.stockCount||99)}>+</button>
    </div>
    <button type="button" className={[styles.stickyCart, cartSt==='added'?styles.stickyCartAdded:''].filter(Boolean).join(' ')} onClick={handleCart} disabled={!product.inStock||cartSt==='loading'}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
      {cartSt==='loading'?'…':cartSt==='added'?'Added':'Add to Cart'}
    </button>
    <button type="button" className={styles.stickyBuy} onClick={handleBuy} disabled={!product.inStock||buySt==='loading'}>
      <svg width="12" height="12" viewBox="0 0 24 24" fill="#fff"><polygon points="5,3 19,12 5,21"/></svg>
      {buySt==='loading'?'…':'Buy Now'}
    </button>
  </div>

  {/* ── MOBILE BOTTOM NAV ── */}
  <nav className={styles.mobileNav}>
    <Link href="/" className={styles.mobileNavItem}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg><span>Home</span></Link>
    <Link href="/categories" className={styles.mobileNavItem}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg><span>Categories</span></Link>
    <Link href="/wishlist" className={styles.mobileNavItem}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg><span>Wishlist</span></Link>
    <Link href="/cart" className={styles.mobileNavItem}>
      <span className={styles.mobileCartIcon}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
        {cartCount > 0 && <span className={styles.mobileCartBadge}>{cartCount > 99 ? '99+' : cartCount}</span>}
      </span>
      <span>Cart</span>
    </Link>
    <Link href="/account" className={styles.mobileNavItem}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg><span>Account</span></Link>
  </nav>

  {/* ── QUICK VIEW ── */}
  {qvP && <QV p={qvP} onClose={closeQv} onAdd={handleQvAdd} cs={qvCS}/>}
</div>
);

}