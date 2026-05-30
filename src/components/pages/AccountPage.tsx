'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import styles from './AccountPage.module.css';
import { _post, _get } from '@/shared/fetchwrapper';
import { signOut, useSession } from 'next-auth/react';

/* ─── Types ──────────────────────────────────────────────────────── */
type Tab = 'overview' | 'orders' | 'wishlist' | 'addresses' | 'coupons' | 'reviews' | 'settings' | 'help';

interface MappedOrder {
  id: string; name: string; date: string;
  amount: number; status: string; images: string[]; itemCount: number;
  rawItems: any[];
}
interface Address {
  id: string; backendId?: string;
  type: 'Home' | 'Office' | 'Other'; name: string; phone: string;
  line1: string; line2: string; city: string; state: string; pincode: string; isDefault: boolean;
}
interface AddressFormData {
  type: 'Home' | 'Office' | 'Other'; name: string; phone: string; line1: string;
  line2: string; city: string; state: string; pincode: string; isDefault: boolean;
}
interface Coupon {
  id: string; code: string; discount: number; type: 'percent' | 'flat';
  minOrder: number; expiry: string; used: boolean; description: string;
}
interface Review {
  id: string; productId: string; productName: string; productImage: string;
  rating: number; comment: string; createdAt: string; orderId: string;
  helpful?: number;
}
interface ReviewableProduct {
  productId: string; productName: string; productImage: string;
  orderId: string; orderDate: string; alreadyReviewed: boolean;
  existingReview?: Review;
}

const EMPTY_ADDR: AddressFormData = {
  type:'Home', name:'', phone:'', line1:'', line2:'', city:'', state:'', pincode:'', isDefault:false
};
const EMPTY_PROFILE = { firstName:'', lastName:'', email:'', phone:'', dob:'', gender:'' };

/* ─── Typed header helper — fixes TS2769 ────────────────────────── */
function authHeaders(token?: string | null): Record<string, string> {
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}
function jsonHeaders(token?: string | null): Record<string, string> {
  return { 'Content-Type': 'application/json', ...authHeaders(token) };
}

/* ─── Static data ────────────────────────────────────────────────── */
const PLACEHOLDER = '/images/placeholder-product.png';
const INDIA_STATES = [
  'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat',
  'Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh',
  'Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab','Rajasthan',
  'Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh','Uttarakhand','West Bengal',
  'Delhi','Jammu & Kashmir','Ladakh','Andaman & Nicobar','Chandigarh',
  'Dadra & Nagar Haveli','Daman & Diu','Lakshadweep','Puducherry',
];
const STATIC_COUPONS: Coupon[] = [
  { id:'1', code:'LITTLE10', discount:10, type:'percent', minOrder:299,  expiry:'2026-12-31', used:false, description:'10% off on orders above ₹299' },
  { id:'2', code:'LOOT20',   discount:20, type:'percent', minOrder:599,  expiry:'2026-12-31', used:false, description:'20% off on orders above ₹599' },
  { id:'3', code:'WELCOME50',discount:50, type:'flat',    minOrder:199,  expiry:'2026-12-31', used:false, description:'Flat ₹50 off on your first order' },
  { id:'4', code:'KIDSJOY',  discount:15, type:'percent', minOrder:499,  expiry:'2026-06-30', used:true,  description:'15% off on toys & games' },
  { id:'5', code:'SUMMER25', discount:25, type:'percent', minOrder:999,  expiry:'2026-08-31', used:false, description:'25% off during summer sale' },
];

/* ─── Product helpers ────────────────────────────────────────────── */
function getProductImage(product: any): string {
  const raw = product?.product_image;
  if (!raw) return PLACEHOLDER;
  if (Array.isArray(raw)) {
    const f = raw[0];
    if (!f) return PLACEHOLDER;
    return typeof f === 'string' ? f : (f?.url ?? PLACEHOLDER);
  }
  return PLACEHOLDER;
}
function getSellingPrice(product: any): number {
  const orig = Number(product?.original_price ?? 0);
  const amt  = Number(product?.amount_discount ?? 0);
  const pct  = Number(product?.percentage_discount ?? 0);
  let p = orig - amt;
  if (p <= 0 && pct > 0) p = Math.round(orig - (orig * pct) / 100);
  return p > 0 ? p : orig;
}

/* ─── Status helpers ─────────────────────────────────────────────── */
const STATUS_COLOR: Record<string, { bg: string; color: string }> = {
  delivered:        { bg:'#e8faf3', color:'#0d8a6a' },
  shipped:          { bg:'#e8f3ff', color:'#1a7dc9' },
  processing:       { bg:'#fff7e0', color:'#b07800' },
  confirmed:        { bg:'#fff7e0', color:'#b07800' },
  pending:          { bg:'#fff7e0', color:'#b07800' },
  cancelled:        { bg:'#fff0f0', color:'#d63030' },
  out_for_delivery: { bg:'#e8f3ff', color:'#1a7dc9' },
  packed:           { bg:'#e8f3ff', color:'#1a7dc9' },
};
const STATUS_LABEL: Record<string, string> = {
  confirmed:'Confirmed', processing:'Processing', pending:'Pending',
  packed:'Packed', shipped:'Shipped', out_for_delivery:'Out for Delivery',
  delivered:'Delivered', cancelled:'Cancelled',
};

function mapOrder(o: any): MappedOrder {
  const items = o.order_items ?? [];
  const images = items
    .slice(0, 3)
    .map((oi: any) => getProductImage(oi.product))
    .filter((i: string) => i !== PLACEHOLDER);
  const rawStatus = (o.status ?? 'processing').toLowerCase().replace(/ /g, '_');
  return {
    id:        String(o.id ?? ''),
    name:      (items[0]?.product?.name ?? 'Order') + (items.length > 1 ? ` +${items.length - 1} more` : ''),
    date:      new Date(o.created_at || o.order_date || Date.now())
                 .toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' }),
    amount:    Number(o.total_amount ?? 0),
    status:    STATUS_LABEL[rawStatus] ?? rawStatus.charAt(0).toUpperCase() + rawStatus.slice(1).replace(/_/g, ' '),
    images,
    itemCount: items.length,
    rawItems:  items,
  };
}

function mapBackendAddress(a: any, idx: number): Address {
  return {
    id:        String(a.id ?? `addr-${idx}`),
    backendId: String(a.id),
    type:      a.address_type === 'work' ? 'Office' : a.address_type === 'other' ? 'Other' : 'Home',
    name:      a.full_name    || '',
    phone:     a.phone        || '',
    line1:     a.address_line1 || '',
    line2:     a.address_line2 || '',
    city:      a.city         || '',
    state:     a.state        || '',
    pincode:   a.postal_code  || a.pincode || '',
    isDefault: Boolean(a.is_default),
  };
}

/* ─── WhatsApp reminder helper ───────────────────────────────────── */
function buildWhatsAppReviewUrl(phone: string, userName: string, products: ReviewableProduct[]): string {
  const name    = userName || 'there';
  const items   = products.slice(0, 3).map(p => `• ${p.productName}`).join('\n');
  const message =
    `Hi ${name}! 👋\n\n` +
    `Thank you for shopping with *LittleLoot* 🧸\n\n` +
    `We noticed you recently received:\n${items}\n\n` +
    `We'd love to hear what you think! Your review helps other parents choose the best toys for their little ones. 💛\n\n` +
    `Tap here to share your feedback:\n` +
    `👉 https://littleloot.in/account (Reviews tab)\n\n` +
    `It only takes 30 seconds! ⭐⭐⭐⭐⭐\n\n` +
    `— Team LittleLoot`;
  const cleaned = phone.replace(/\D/g, '');
  const e164    = cleaned.startsWith('91') ? cleaned : `91${cleaned}`;
  return `https://wa.me/${e164}?text=${encodeURIComponent(message)}`;
}

/* ═══════════════════════════════════════════════════════════════════
   STAR RATING
═══════════════════════════════════════════════════════════════════ */
function StarRating({
  value, onChange, size = 'md', readonly = false,
}: {
  value: number; onChange?: (v: number) => void; size?: 'sm' | 'md' | 'lg'; readonly?: boolean;
}) {
  const [hover, setHover] = useState(0);
  const fontSize = size === 'lg' ? 32 : size === 'sm' ? 16 : 24;
  return (
    <div className={styles.starRow} style={{ gap: size === 'sm' ? 2 : 4 }}>
      {[1, 2, 3, 4, 5].map(s => (
        <button
          key={s} type="button"
          className={`${styles.starBtn} ${(hover || value) >= s ? styles.starFilled : ''}`}
          style={{ fontSize }}
          onMouseEnter={() => !readonly && setHover(s)}
          onMouseLeave={() => !readonly && setHover(0)}
          onClick={() => !readonly && onChange?.(s)}
          disabled={readonly}
          aria-label={`${s} star`}
        >★</button>
      ))}
      {!readonly && (
        <span className={styles.starLabel}>
          {['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][hover || value]}
        </span>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════════════ */
export default function AccountPage() {
  const { data: session, status } = useSession();

  /* ── State ─────────────────────────────────────────────────────── */
  const [tab,     setTab]     = useState<Tab>('overview');
  const [toast,   setToast]   = useState('');
  const [profile, setProfile] = useState(EMPTY_PROFILE);
  const [draft,   setDraft]   = useState(EMPTY_PROFILE);
  const [editing, setEditing] = useState(false);
  const [orders,  setOrders]  = useState<MappedOrder[]>([]);
  const [favs,    setFavs]    = useState<any[]>([]);
  const [featured, setFeatured] = useState<any[]>([]);
  const [addresses,   setAddresses]   = useState<Address[]>([]);
  const [addrLoading, setAddrLoading] = useState(false);
  const [showAddrModal, setShowAddrModal] = useState(false);
  const [editingAddr,   setEditingAddr]   = useState<Address | null>(null);
  const [addrForm,   setAddrForm]   = useState<AddressFormData>(EMPTY_ADDR);
  const [addrErrors, setAddrErrors] = useState<Partial<AddressFormData>>({});
  const [addrSaving, setAddrSaving] = useState(false);
  const [cartStates, setCartStates] = useState<Record<string, 'idle' | 'loading' | 'added' | 'error'>>({});
  const [profileLoading, setProfileLoading] = useState(true);
  const [coupons,    setCoupons]    = useState<Coupon[]>(STATIC_COUPONS);
  const [copiedCode, setCopiedCode] = useState('');

  /* review state */
  const [reviews,          setReviews]          = useState<Review[]>([]);
  const [showReviewModal,  setShowReviewModal]   = useState(false);
  const [reviewTarget,     setReviewTarget]      = useState<ReviewableProduct | null>(null);
  const [reviewDraft,      setReviewDraft]       = useState({ rating: 5, comment: '', title: '' });
  const [reviewSaving,     setReviewSaving]      = useState(false);
  const [reviewFilter,     setReviewFilter]      = useState<'all' | 'pending'>('all');
  const [waReminderSent,   setWaReminderSent]    = useState<Set<string>>(new Set());

  const carouselRef = useRef<HTMLDivElement>(null);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3500); };
  const token = (session as any)?.backendToken as string | undefined;

  /* ── Seed profile from session ─────────────────────────────────── */
  useEffect(() => {
    if (status !== 'authenticated' || !session?.user) return;
    const parts = (session.user.name || '').trim().split(' ');
    const s = {
      firstName: parts[0] || '', lastName: parts.slice(1).join(' ') || '',
      email: session.user.email || '', phone: '', dob: '', gender: '',
    };
    setProfile(s); setDraft(s); setProfileLoading(false);
  }, [session, status]);

  /* ── Fetch all data ────────────────────────────────────────────── */
  useEffect(() => {
    if (status !== 'authenticated') return;
    const ah = authHeaders(token);
    const jh = jsonHeaders(token);

    // Profile
    if (token) {
      fetch('/api/user/profile', { headers: ah })
        .then(r => r.json())
        .then((res: any) => {
          if (!res || res.detail) return;
          const parts = (res.name || '').trim().split(' ');
          const m = {
            firstName: parts[0] || '', lastName: parts.slice(1).join(' ') || '',
            email: res.email || '', phone: res.phone || '', dob: res.dob || '', gender: res.gender || '',
          };
          setProfile(m); setDraft(m);
        })
        .catch(() => {});
    }

    // Orders
    fetch('/api/orders', { headers: ah })
      .then(r => r.json())
      .then((res: any) => {
        const raw = Array.isArray(res) ? res : (res?.orders || []);
        if (raw.length) setOrders(raw.map(mapOrder));
      })
      .catch(() => {});

    // Wishlist
    fetch('/api/favorite', { headers: ah })
      .then(r => r.json())
      .then((res: any) => { setFavs(Array.isArray(res) ? res : (res?.favorites ?? [])); })
      .catch(() => {});

    // Featured products
    _get('/api/product/featured')
      .then((res: any) => { setFeatured((Array.isArray(res) ? res : (res?.data || [])).slice(0, 8)); })
      .catch(() => {});

    // Addresses
    setAddrLoading(true);
    fetch('/api/address/addresses', { headers: ah })
      .then(r => r.json())
      .then((res: any) => {
        const addrs: any[] = Array.isArray(res) ? res : (res?.addresses || res?.data || []);
        setAddresses(addrs.map(mapBackendAddress));
      })
      .catch(() => {})
      .finally(() => setAddrLoading(false));

    // Reviews
    fetch('/api/reviews/user', { headers: ah })
      .then(r => r.json())
      .then((res: any) => {
        const raw = Array.isArray(res) ? res : (res?.reviews || []);
        setReviews(raw.map((r: any) => ({
          id:           String(r.id),
          productId:    String(r.product_id),
          productName:  r.product?.name || 'Product',
          productImage: getProductImage(r.product),
          rating:       Number(r.rating),
          comment:      r.comment || '',
          createdAt:    new Date(r.created_at || Date.now())
                          .toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' }),
          orderId:      String(r.order_id || ''),
          helpful:      Number(r.helpful_count || 0),
        })));
      })
      .catch(() => {});
  }, [session, status, token]);

  /* ── Profile save ──────────────────────────────────────────────── */
  const handleSave = () => {
    if (token) {
      fetch('/api/user/profile', {
        method: 'PUT',
        headers: jsonHeaders(token),
        body: JSON.stringify({ name: `${draft.firstName} ${draft.lastName}`.trim(), phone: draft.phone }),
      }).catch(() => {});
    }
    setProfile({ ...draft }); setEditing(false); showToast('✅ Profile updated!');
  };

  /* ── Wishlist add to cart ──────────────────────────────────────── */
  const addToCart = useCallback(async (e: React.MouseEvent, product: any) => {
    e.preventDefault(); e.stopPropagation();
    const id = String(product.id);
    if (cartStates[id] === 'loading') return;
    setCartStates(p => ({ ...p, [id]: 'loading' }));
    try {
      await _post('/api/cart/items', { product_id: product.id, quantity: 1 });
      setCartStates(p => ({ ...p, [id]: 'added' }));
      showToast(`🛒 ${product.name} added!`);
      setTimeout(() => setCartStates(p => ({ ...p, [id]: 'idle' })), 2000);
    } catch {
      setCartStates(p => ({ ...p, [id]: 'error' }));
      setTimeout(() => setCartStates(p => ({ ...p, [id]: 'idle' })), 2500);
    }
  }, [cartStates]);

  /* ── Address helpers ───────────────────────────────────────────── */
  const validateAddr = () => {
    const e: Partial<AddressFormData> = {};
    if (!addrForm.name.trim())             e.name    = 'Required';
    if (!/^\d{10}$/.test(addrForm.phone))  e.phone   = 'Valid 10-digit number required';
    if (!addrForm.line1.trim())            e.line1   = 'Required';
    if (!addrForm.city.trim())             e.city    = 'Required';
    if (!addrForm.state)                   e.state   = 'Required';
    if (!/^\d{6}$/.test(addrForm.pincode)) e.pincode = 'Valid 6-digit pincode required';
    setAddrErrors(e); return Object.keys(e).length === 0;
  };

  const reloadAddresses = async () => {
    const res  = await fetch('/api/address/addresses', { headers: authHeaders(token) });
    const data = await res.json();
    const arr: any[] = Array.isArray(data) ? data : (data?.addresses || data?.data || []);
    setAddresses(arr.map(mapBackendAddress));
  };

  const handleAddrSave = async () => {
    if (!validateAddr()) return;
    setAddrSaving(true);
    const body = {
      full_name:     addrForm.name,    phone:         addrForm.phone,
      address_line1: addrForm.line1,   address_line2: addrForm.line2,
      city:          addrForm.city,    state:         addrForm.state,
      postal_code:   addrForm.pincode, country:       'India',
      address_type:  addrForm.type === 'Office' ? 'work' : addrForm.type === 'Other' ? 'other' : 'home',
      is_default:    addrForm.isDefault,
    };
    try {
      if (editingAddr?.backendId) {
        await fetch(`/api/address/addresses/${editingAddr.backendId}`, { method:'PUT', headers:jsonHeaders(token), body:JSON.stringify(body) });
        showToast('📍 Address updated!');
      } else {
        await fetch('/api/address/addresses', { method:'POST', headers:jsonHeaders(token), body:JSON.stringify(body) });
        showToast('📍 Address added!');
      }
      await reloadAddresses();
    } catch { showToast('❌ Could not save address.'); }
    setAddrSaving(false); setShowAddrModal(false); setEditingAddr(null); setAddrForm(EMPTY_ADDR);
  };

  const handleAddrDelete = async (addr: Address) => {
    if (addr.backendId) {
      try { await fetch(`/api/address/addresses/${addr.backendId}`, { method:'DELETE', headers:authHeaders(token) }); } catch {}
    }
    setAddresses(p => p.filter(a => a.id !== addr.id));
    showToast('🗑️ Address removed');
  };

  const handleSetDefault = async (addr: Address) => {
    if (addr.backendId) {
      try {
        await fetch(`/api/address/addresses/${addr.backendId}`, {
          method:'PUT', headers:jsonHeaders(token), body:JSON.stringify({ is_default:true }),
        });
      } catch {}
    }
    setAddresses(p => p.map(a => ({ ...a, isDefault: a.id === addr.id })));
    showToast('✅ Default address updated');
  };

  /* ── Coupon copy ───────────────────────────────────────────────── */
  const copyCoupon = (code: string) => {
    navigator.clipboard.writeText(code).catch(() => {});
    setCopiedCode(code);
    showToast(`🎟️ Coupon ${code} copied!`);
    setTimeout(() => setCopiedCode(''), 2000);
  };

  /* ── Review: open modal ────────────────────────────────────────── */
  const openReviewModal = (target: ReviewableProduct) => {
    const ex = reviews.find(r => r.productId === target.productId);
    setReviewTarget({ ...target, alreadyReviewed: !!ex, existingReview: ex });
    setReviewDraft({ rating: ex?.rating ?? 5, comment: ex?.comment ?? '', title: '' });
    setShowReviewModal(true);
  };

  /* ── Review: submit ────────────────────────────────────────────── */
  const handleReviewSubmit = async () => {
    if (!reviewTarget || !reviewDraft.comment.trim()) {
      showToast('⚠️ Please write your review.'); return;
    }
    if (reviewDraft.comment.trim().length < 10) {
      showToast('⚠️ Review must be at least 10 characters.'); return;
    }
    setReviewSaving(true);
    const ex = reviews.find(r => r.productId === reviewTarget.productId);
    try {
      if (ex) {
        await fetch(`/api/reviews/${ex.id}`, {
          method: 'PUT', headers: jsonHeaders(token),
          body: JSON.stringify({ rating: reviewDraft.rating, comment: reviewDraft.comment }),
        });
        setReviews(p => p.map(r => r.id === ex.id
          ? { ...r, rating: reviewDraft.rating, comment: reviewDraft.comment }
          : r
        ));
        showToast('✅ Review updated!');
      } else {
        const res  = await fetch('/api/reviews', {
          method: 'POST', headers: jsonHeaders(token),
          body: JSON.stringify({
            product_id: reviewTarget.productId,
            order_id:   reviewTarget.orderId,
            rating:     reviewDraft.rating,
            comment:    reviewDraft.comment,
          }),
        });
        const data = await res.json();
        setReviews(p => [...p, {
          id:           String(data.id || Date.now()),
          productId:    reviewTarget.productId,
          productName:  reviewTarget.productName,
          productImage: reviewTarget.productImage,
          rating:       reviewDraft.rating,
          comment:      reviewDraft.comment,
          createdAt:    new Date().toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' }),
          orderId:      reviewTarget.orderId,
          helpful:      0,
        }]);
        showToast('✅ Review submitted! Thank you 🎉');
      }
    } catch { showToast('❌ Could not submit review. Try again.'); }
    setReviewSaving(false); setShowReviewModal(false); setReviewTarget(null);
  };

  /* ── Review: delete ────────────────────────────────────────────── */
  const handleReviewDelete = async (id: string) => {
    try {
      await fetch(`/api/reviews/${id}`, { method:'DELETE', headers:authHeaders(token) });
      setReviews(p => p.filter(r => r.id !== id));
      showToast('🗑️ Review deleted');
    } catch { showToast('❌ Could not delete review.'); }
  };

  /* ── WhatsApp reminder ─────────────────────────────────────────── */
  const sendWhatsAppReminder = (products: ReviewableProduct[]) => {
    const phone = profile.phone;
    if (!phone || phone.length < 10) {
      showToast('⚠️ Add your phone number in Settings to send WhatsApp reminders.'); return;
    }
    const url = buildWhatsAppReviewUrl(phone, profile.firstName, products);
    window.open(url, '_blank', 'noopener');
    const ids = new Set(waReminderSent);
    products.forEach(p => ids.add(p.productId));
    setWaReminderSent(ids);
    showToast('📲 WhatsApp opened — review reminder ready to send!');
  };

  /* ── Derived ───────────────────────────────────────────────────── */
  const profileImage = session?.user?.image || null;
  const displayName  = [profile.firstName, profile.lastName].filter(Boolean).join(' ') || session?.user?.email || '—';
  const displayEmail = profile.email || session?.user?.email || '—';
  const recentOrders = orders.slice(0, 5);

  // All reviewable products from delivered orders (de-duped by productId)
  const seen = new Set<string>();
  const reviewableProducts: ReviewableProduct[] = orders
    .filter(o => o.status.toLowerCase() === 'delivered')
    .flatMap(o =>
      o.rawItems.map((item: any) => ({
        productId:      String(item.product?.id || ''),
        productName:    item.product?.name || 'Product',
        productImage:   getProductImage(item.product),
        orderId:        o.id,
        orderDate:      o.date,
        alreadyReviewed: reviews.some(r => r.productId === String(item.product?.id)),
        existingReview:  reviews.find(r => r.productId === String(item.product?.id)),
      }))
    )
    .filter(p => {
      if (!p.productId || seen.has(p.productId)) return false;
      seen.add(p.productId);
      return true;
    });

  const pendingReviewProducts = reviewableProducts.filter(p => !p.alreadyReviewed);
  const filteredReviewProducts = reviewFilter === 'pending' ? pendingReviewProducts : reviewableProducts;

  const NAV = [
    { id:'overview'   as Tab, label:'My Account',    icon:'👤' },
    { id:'orders'     as Tab, label:'Orders',         icon:'📦', badge: orders.length    || undefined },
    { id:'wishlist'   as Tab, label:'Wishlist',       icon:'❤️',  badge: favs.length      || undefined },
    { id:'addresses'  as Tab, label:'Addresses',      icon:'📍', badge: addresses.length || undefined },
    { id:'coupons'    as Tab, label:'Coupons',         icon:'🎟️' },
    { id:'reviews'    as Tab, label:'Reviews',         icon:'⭐', badge: pendingReviewProducts.length || undefined },
    { id:'settings'   as Tab, label:'Settings',        icon:'⚙️' },
    { id:'help'       as Tab, label:'Help & Support',  icon:'🎧' },
  ];

  if (status === 'loading' || (status === 'authenticated' && profileLoading)) {
    return (
      <div className={styles.loadingScreen}>
        <div className={styles.loadingSpinner} />
        <p>Loading your account…</p>
      </div>
    );
  }

  /* ════════════════════ RENDER ════════════════════ */
  return (
    <div className={styles.root}>

      {/* ══════════ SIDEBAR ══════════ */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebarLogo}>
          <div className={styles.logoIcon}>🧸</div>
          <div>
            <div className={styles.logoName}>LittleLoot</div>
            <div className={styles.logoTagline}>Your kids, our priority</div>
          </div>
        </div>

        <nav className={styles.sidebarNav}>
          {NAV.map(n => (
            <button key={n.id} type="button"
              className={`${styles.navBtn} ${tab === n.id ? styles.navBtnActive : ''}`}
              onClick={() => setTab(n.id)}>
              <span className={styles.navIcon}>{n.icon}</span>
              <span className={styles.navLabel}>{n.label}</span>
              {n.badge ? <span className={styles.navBadge}>{n.badge}</span> : null}
            </button>
          ))}
        </nav>

        <div style={{ flex: 1 }} />

        <div className={styles.helpCard}>
          <div className={styles.helpTop}>
            <div className={styles.helpIconWrap}><span>🎧</span></div>
            <div>
              <div className={styles.helpTitle}>Need Help?</div>
              <div className={styles.helpSub}>We are here for you</div>
            </div>
          </div>
          <button type="button" className={styles.helpBtn} onClick={() => setTab('help')}>
            Contact Support
          </button>
        </div>

        <button type="button" className={styles.logoutBtn}
          onClick={() => signOut({ callbackUrl: '/login' })}>
          <span>🚪</span><span>Logout</span>
        </button>
      </aside>

      {/* ══════════ MAIN ══════════ */}
      <main className={styles.main}>

        <div className={styles.pageHeader}>
          <h1 className={styles.pageTitle}>My Account <span className={styles.sparkle}>✨</span></h1>
          <p className={styles.pageSub}>Manage your account details and view your activity</p>
        </div>

        {/* ─── OVERVIEW ─── */}
        {tab === 'overview' && (
          <>
            {/* Profile banner */}
            <div className={styles.profileBanner}>
              <div className={styles.profileBannerLeft}>
                <div className={styles.profileAvatarWrap}>
                  {profileImage
                    ? <img src={profileImage} alt={displayName} className={styles.profileAvatar} referrerPolicy="no-referrer" />
                    : <div className={styles.profileAvatarFallback}>{(displayName[0] || 'U').toUpperCase()}</div>
                  }
                  <button type="button" className={styles.cameraBtn} aria-label="Change photo">📷</button>
                </div>
                <div className={styles.profileBannerInfo}>
                  <h2 className={styles.profileBannerName}>{displayName}</h2>
                  <p className={styles.profileBannerEmail}>{displayEmail}</p>
                  {profile.phone && <p className={styles.profileBannerPhone}>📞 {profile.phone}</p>}
                </div>
              </div>
              <button type="button" className={styles.editProfileBtn} onClick={() => setTab('settings')}>
                ✏️ Edit Profile
              </button>
            </div>

            {/* Two-col */}
            <div className={styles.overviewGrid}>
              {/* Recent orders */}
              <div className={styles.overviewCard}>
                <div className={styles.overviewCardHeader}>
                  <h3 className={styles.overviewCardTitle}>Recent Orders</h3>
                  <button type="button" className={styles.viewAllBtn} onClick={() => setTab('orders')}>View All</button>
                </div>
                {recentOrders.length === 0
                  ? <div className={styles.emptyMini}><span>📦</span><span>No orders yet</span></div>
                  : (
                    <div className={styles.recentOrdersList}>
                      {recentOrders.map(o => {
                        const sk = o.status.toLowerCase().replace(/ /g, '_');
                        const sc = STATUS_COLOR[sk] ?? STATUS_COLOR.processing;
                        return (
                          <Link key={o.id} href={`/track-order?order_id=${o.id}`} className={styles.recentOrderRow}>
                            <div className={styles.recentOrderImg}>
                              {o.images[0]
                                ? <img src={o.images[0]} alt="" onError={e => { (e.target as HTMLImageElement).src = PLACEHOLDER; }} />
                                : <span>📦</span>
                              }
                            </div>
                            <div className={styles.recentOrderInfo}>
                              <div className={styles.recentOrderName}>{o.name}</div>
                              <div className={styles.recentOrderMeta}>#{o.id.slice(0, 8).toUpperCase()} · {o.date}</div>
                            </div>
                            <span className={styles.recentOrderStatus} style={{ background: sc.bg, color: sc.color }}>
                              {o.status}
                            </span>
                            <span className={styles.recentOrderChevron}>›</span>
                          </Link>
                        );
                      })}
                    </div>
                  )}
              </div>

              {/* Account details */}
              <div className={styles.overviewCard}>
                <div className={styles.overviewCardHeader}>
                  <h3 className={styles.overviewCardTitle}>Account Details</h3>
                </div>
                <div className={styles.accountDetailsList}>
                  {[
                    { icon:'👤', label:'Full Name',     value: displayName },
                    { icon:'✉️', label:'Email Address', value: displayEmail },
                    { icon:'📱', label:'Phone Number',  value: profile.phone || '—' },
                    { icon:'📍', label:'Addresses',     value: `${addresses.length} saved` },
                    { icon:'🔒', label:'Password',      value: '••••••••', action: true },
                  ].map(d => (
                    <div key={d.label} className={styles.accountDetailRow}>
                      <div className={styles.accountDetailIcon}><span>{d.icon}</span></div>
                      <div className={styles.accountDetailBody}>
                        <div className={styles.accountDetailLabel}>{d.label}</div>
                        <div className={styles.accountDetailValue}>{d.value}</div>
                      </div>
                      {d.action && (
                        <button type="button" className={styles.changePassBtn}>Change Password</button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Recommended */}
            {featured.length > 0 && (
              <div className={styles.recommendedSection}>
                <div className={styles.recommendedHeader}>
                  <h3 className={styles.recommendedTitle}>Recommended For You</h3>
                  <Link href="/products" className={styles.viewAllBtn}>View All</Link>
                </div>
                <div className={styles.carouselWrap}>
                  <div className={styles.carouselTrack} ref={carouselRef}>
                    {featured.map((p, i) => {
                      const img   = getProductImage(p);
                      const price = getSellingPrice(p);
                      const orig  = Number(p.original_price ?? 0);
                      return (
                        <Link key={String(p.id) + i} href={`/product/${p.id}`} className={styles.recCard}>
                          <button type="button" className={styles.recWishBtn}
                            onClick={e => { e.preventDefault(); e.stopPropagation(); }}>❤️</button>
                          <div className={styles.recImgWrap}>
                            <img src={img} alt={p.name} onError={e => { (e.target as HTMLImageElement).src = PLACEHOLDER; }} />
                          </div>
                          <div className={styles.recInfo}>
                            <div className={styles.recName}>{p.name}</div>
                            <div className={styles.recPriceRow}>
                              <span className={styles.recPrice}>₹{price.toLocaleString('en-IN')}</span>
                              {orig > price && <span className={styles.recOldPrice}>₹{orig.toLocaleString('en-IN')}</span>}
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                  <button type="button"
                    className={`${styles.carouselArrow} ${styles.carouselArrowRight}`}
                    onClick={() => carouselRef.current?.scrollBy({ left: 280, behavior: 'smooth' })}>›</button>
                </div>
              </div>
            )}

            {/* Trust bar */}
            <div className={styles.trustBar}>
              {[
                { icon:'🔒', title:'Secure Payments',  sub:'100% secure' },
                { icon:'🔄', title:'Easy Returns',     sub:'30-day policy' },
                { icon:'🚚', title:'Fast Delivery',    sub:'3–5 business days' },
                { icon:'🧸', title:'Kids Friendly',    sub:'Safety certified' },
              ].map(t => (
                <div key={t.title} className={styles.trustItem}>
                  <div className={styles.trustIcon}>{t.icon}</div>
                  <div>
                    <div className={styles.trustTitle}>{t.title}</div>
                    <div className={styles.trustSub}>{t.sub}</div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ─── ORDERS ─── */}
        {tab === 'orders' && (
          <div className={styles.tabCard}>
            <div className={styles.tabCardHeader}>
              <h2 className={styles.tabCardTitle}>📦 My Orders</h2>
              <Link href="/track-order" className={styles.viewAllBtn}>Track Order →</Link>
            </div>
            {orders.length === 0 ? (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>📦</div>
                <div className={styles.emptyText}>No orders yet. Start shopping!</div>
                <Link href="/" className={styles.emptyBtn}>Shop Now →</Link>
              </div>
            ) : (
              <div className={styles.ordersList}>
                {orders.map(o => {
                  const sk = o.status.toLowerCase().replace(/ /g, '_');
                  const sc = STATUS_COLOR[sk] ?? STATUS_COLOR.processing;
                  const isDelivered = o.status.toLowerCase() === 'delivered';
                  return (
                    <div key={o.id} className={styles.orderCard}>
                      <div className={styles.orderImg}>
                        {o.images[0]
                          ? <img src={o.images[0]} alt="" onError={e => { (e.target as HTMLImageElement).src = PLACEHOLDER; }} />
                          : <span>📦</span>
                        }
                      </div>
                      <div className={styles.orderInfo}>
                        <div className={styles.orderIdText}>#{o.id.slice(0, 8).toUpperCase()}</div>
                        <div className={styles.orderName}>{o.name}</div>
                        <div className={styles.orderMeta}>{o.date} · {o.itemCount} item{o.itemCount !== 1 ? 's' : ''}</div>
                      </div>
                      <div className={styles.orderRight}>
                        <div className={styles.orderAmt}>₹{o.amount.toLocaleString('en-IN')}</div>
                        <span className={styles.orderStatus} style={{ background: sc.bg, color: sc.color }}>
                          {o.status}
                        </span>
                      </div>
                      <div className={styles.orderBtns}>
                        <Link href={`/track-order?order_id=${o.id}`} className={styles.trackBtn}>Track →</Link>
                        {isDelivered && (
                          <button type="button" className={styles.reviewOrderBtn}
                            onClick={() => {
                              const item = o.rawItems[0];
                              if (!item?.product) return;
                              openReviewModal({
                                productId:    String(item.product.id),
                                productName:  item.product.name,
                                productImage: getProductImage(item.product),
                                orderId:      o.id,
                                orderDate:    o.date,
                                alreadyReviewed: reviews.some(r => r.productId === String(item.product.id)),
                              });
                            }}>
                            ⭐ Review
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ─── WISHLIST ─── */}
        {tab === 'wishlist' && (
          <div className={styles.tabCard}>
            <div className={styles.tabCardHeader}>
              <h2 className={styles.tabCardTitle}>❤️ My Wishlist</h2>
              <span className={styles.tabMeta}>{favs.length} items</span>
            </div>
            {favs.length === 0 ? (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>💔</div>
                <div className={styles.emptyText}>Wishlist is empty.<br />Save items you love!</div>
                <Link href="/" className={styles.emptyBtn}>Explore →</Link>
              </div>
            ) : (
              <div className={styles.wishGrid}>
                {favs.map(item => {
                  const p  = item.product; const id = String(p.id);
                  const img = getProductImage(p); const price = getSellingPrice(p); const orig = Number(p.original_price ?? 0);
                  const cs = cartStates[id] ?? 'idle';
                  return (
                    <Link key={id} href={`/product/${id}`} className={styles.wishCard}>
                      <img src={img} alt={p.name} className={styles.wishImg} onError={e => { (e.target as HTMLImageElement).src = PLACEHOLDER; }} />
                      <div className={styles.wishInfo}>
                        <div className={styles.wishName}>{p.name}</div>
                        <div className={styles.wishPriceRow}>
                          <span className={styles.wishPrice}>₹{price.toLocaleString('en-IN')}</span>
                          {orig > price && <span className={styles.wishOldPrice}>₹{orig.toLocaleString('en-IN')}</span>}
                        </div>
                        <div className={styles.wishActions}>
                          <button type="button"
                            className={`${styles.wishAddBtn} ${cs === 'added' ? styles.wishAdded : cs === 'error' ? styles.wishError : ''}`}
                            disabled={cs === 'loading'}
                            onClick={e => addToCart(e, p)}>
                            {cs === 'loading' ? 'Adding…' : cs === 'added' ? '✓ Added!' : cs === 'error' ? '✗ Retry' : '🛒 Add to Cart'}
                          </button>
                          <button type="button" className={styles.wishRemoveBtn}
                            onClick={async e => {
                              e.preventDefault(); e.stopPropagation();
                              try { await fetch(`/api/favorite/${id}`, { method:'DELETE', headers:authHeaders(token) }); } catch {}
                              setFavs(p => p.filter(i => String(i.product.id) !== id));
                              showToast('💔 Removed from wishlist');
                            }}>🗑️</button>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ─── ADDRESSES ─── */}
        {tab === 'addresses' && (
          <div className={styles.tabCard}>
            <div className={styles.tabCardHeader}>
              <h2 className={styles.tabCardTitle}>📍 Saved Addresses</h2>
              <button type="button" className={styles.addAddrBtn}
                onClick={() => { setEditingAddr(null); setAddrForm(EMPTY_ADDR); setAddrErrors({}); setShowAddrModal(true); }}>
                + Add New
              </button>
            </div>
            {addrLoading
              ? <div className={styles.emptyMini}><div className={styles.loadingSpinner} style={{ width:24, height:24 }} /></div>
              : (
                <div className={styles.addrGrid}>
                  {addresses.map(a => (
                    <div key={a.id} className={`${styles.addrCard} ${a.isDefault ? styles.addrCardDefault : ''}`}>
                      {a.isDefault && <span className={styles.defaultBadge}>Default</span>}
                      <div className={styles.addrType}>{a.type === 'Home' ? '🏠' : a.type === 'Office' ? '🏢' : '📌'} {a.type}</div>
                      <div className={styles.addrText}>
                        <strong>{a.name}</strong><br />{a.line1}<br />
                        {a.line2 && <>{a.line2}<br /></>}
                        {a.city} – {a.pincode}<br />{a.state}<br />📱 {a.phone}
                      </div>
                      <div className={styles.addrActions}>
                        <button type="button" className={styles.addrBtn}
                          onClick={() => { setEditingAddr(a); setAddrForm({ type:a.type, name:a.name, phone:a.phone, line1:a.line1, line2:a.line2, city:a.city, state:a.state, pincode:a.pincode, isDefault:a.isDefault }); setAddrErrors({}); setShowAddrModal(true); }}>
                          Edit
                        </button>
                        {!a.isDefault && (
                          <button type="button" className={styles.addrBtn} onClick={() => handleSetDefault(a)}>Set Default</button>
                        )}
                        <button type="button" className={`${styles.addrBtn} ${styles.addrBtnDanger}`}
                          onClick={() => handleAddrDelete(a)}>Delete</button>
                      </div>
                    </div>
                  ))}
                  <button type="button" className={styles.addAddrCard}
                    onClick={() => { setEditingAddr(null); setAddrForm(EMPTY_ADDR); setAddrErrors({}); setShowAddrModal(true); }}>
                    <span className={styles.addAddrIcon}>➕</span>
                    <span className={styles.addAddrLabel}>Add New Address</span>
                  </button>
                </div>
              )
            }
          </div>
        )}

        {/* ─── COUPONS ─── */}
        {tab === 'coupons' && (
          <div className={styles.tabCard}>
            <div className={styles.tabCardHeader}>
              <h2 className={styles.tabCardTitle}>🎟️ My Coupons</h2>
              <span className={styles.tabMeta}>{coupons.filter(c => !c.used && new Date(c.expiry) >= new Date()).length} active</span>
            </div>
            <div className={styles.couponsGrid}>
              {coupons.map(c => {
                const expired  = new Date(c.expiry) < new Date();
                const inactive = c.used || expired;
                return (
                  <div key={c.id} className={`${styles.couponCard} ${inactive ? styles.couponInactive : ''}`}>
                    <div className={styles.couponLeft}>
                      <div className={styles.couponDiscount}>
                        {c.type === 'percent' ? `${c.discount}%` : `₹${c.discount}`}
                        <span className={styles.couponOff}>OFF</span>
                      </div>
                      <div className={styles.couponMin}>Min ₹{c.minOrder}</div>
                    </div>
                    <div className={styles.couponDivider} />
                    <div className={styles.couponRight}>
                      <div className={styles.couponDesc}>{c.description}</div>
                      <div className={styles.couponCodeRow}>
                        <span className={styles.couponCode}>{c.code}</span>
                        {!inactive && (
                          <button type="button"
                            className={`${styles.couponCopyBtn} ${copiedCode === c.code ? styles.couponCopied : ''}`}
                            onClick={() => copyCoupon(c.code)}>
                            {copiedCode === c.code ? '✓ Copied!' : 'Copy'}
                          </button>
                        )}
                      </div>
                      <div className={styles.couponExpiry}>
                        {c.used
                          ? <span className={styles.couponUsedTag}>Used</span>
                          : expired
                            ? <span className={styles.couponExpiredTag}>Expired</span>
                            : <span className={styles.couponValidTag}>
                                Valid till {new Date(c.expiry).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' })}
                              </span>
                        }
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ─── REVIEWS ─── */}
        {tab === 'reviews' && (
          <div className={styles.tabCard}>
            <div className={styles.tabCardHeader}>
              <h2 className={styles.tabCardTitle}>⭐ Reviews & Ratings</h2>
              <div className={styles.reviewHeaderRight}>
                {pendingReviewProducts.length > 0 && (
                  <button type="button" className={styles.waReminderBtn}
                    onClick={() => sendWhatsAppReminder(pendingReviewProducts)}
                    title="Send yourself a WhatsApp reminder to review">
                    <span>📲</span> WhatsApp Reminder
                  </button>
                )}
                <span className={styles.tabMeta}>{reviews.length} submitted</span>
              </div>
            </div>

            {/* Filter tabs */}
            <div className={styles.reviewFilterRow}>
              <button type="button"
                className={`${styles.reviewFilterBtn} ${reviewFilter === 'all' ? styles.reviewFilterActive : ''}`}
                onClick={() => setReviewFilter('all')}>
                All Products ({reviewableProducts.length})
              </button>
              <button type="button"
                className={`${styles.reviewFilterBtn} ${reviewFilter === 'pending' ? styles.reviewFilterActive : ''}`}
                onClick={() => setReviewFilter('pending')}>
                Pending Review ({pendingReviewProducts.length})
                {pendingReviewProducts.length > 0 && <span className={styles.pendingDot} />}
              </button>
            </div>

            {/* Empty state */}
            {filteredReviewProducts.length === 0 && (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>{reviewFilter === 'pending' ? '🎉' : '⭐'}</div>
                <div className={styles.emptyText}>
                  {reviewFilter === 'pending'
                    ? 'All caught up! You\'ve reviewed all your delivered products.'
                    : 'No delivered orders yet. Reviews appear after your order is delivered.'}
                </div>
              </div>
            )}

            {/* Product review cards */}
            {filteredReviewProducts.length > 0 && (
              <div className={styles.reviewProductGrid}>
                {filteredReviewProducts.map(p => {
                  const ex = reviews.find(r => r.productId === p.productId);
                  return (
                    <div key={p.productId} className={`${styles.reviewProductCard} ${ex ? styles.reviewProductCardDone : ''}`}>
                      {/* Product image + info */}
                      <div className={styles.reviewProductTop}>
                        <div className={styles.reviewProductImgWrap}>
                          <img src={p.productImage} alt={p.productName}
                            onError={e => { (e.target as HTMLImageElement).src = PLACEHOLDER; }} />
                        </div>
                        <div className={styles.reviewProductMeta}>
                          <div className={styles.reviewProductName}>{p.productName}</div>
                          <div className={styles.reviewProductDate}>Delivered · {p.orderDate}</div>
                          {ex && (
                            <div className={styles.reviewedBadge}>
                              <StarRating value={ex.rating} readonly size="sm" />
                              <span>Reviewed</span>
                            </div>
                          )}
                        </div>
                        <div className={styles.reviewProductActions}>
                          <button type="button"
                            className={ex ? styles.editReviewBtn : styles.writeReviewBtn}
                            onClick={() => openReviewModal({ ...p, alreadyReviewed: !!ex, existingReview: ex })}>
                            {ex ? '✏️ Edit' : '⭐ Write Review'}
                          </button>
                          {ex && (
                            <button type="button" className={styles.deleteReviewBtn}
                              onClick={() => handleReviewDelete(ex.id)}>🗑️</button>
                          )}
                        </div>
                      </div>

                      {/* Existing review preview */}
                      {ex && (
                        <div className={styles.reviewPreview}>
                          <p className={styles.reviewPreviewComment}>"{ex.comment}"</p>
                          <span className={styles.reviewPreviewDate}>{ex.createdAt}</span>
                        </div>
                      )}

                      {/* WhatsApp nudge for pending */}
                      {!ex && (
                        <div className={styles.reviewNudge}>
                          <span>💛 Share your experience to help other parents!</span>
                          <button type="button" className={styles.reviewNudgeWa}
                            onClick={() => {
                              const phone = profile.phone;
                              if (!phone) { showToast('⚠️ Add phone in Settings to get WhatsApp reminders.'); return; }
                              const url = buildWhatsAppReviewUrl(phone, profile.firstName, [p]);
                              window.open(url, '_blank', 'noopener');
                              showToast('📲 WhatsApp opened!');
                            }}>
                            📲 Remind me on WhatsApp
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Submitted reviews summary */}
            {reviews.length > 0 && (
              <div className={styles.submittedReviewsSection}>
                <div className={styles.submittedReviewsTitle}>Your Submitted Reviews</div>
                <div className={styles.reviewsList}>
                  {reviews.map(r => (
                    <div key={r.id} className={styles.reviewCard}>
                      <div className={styles.reviewProductImg}>
                        <img src={r.productImage} alt={r.productName}
                          onError={e => { (e.target as HTMLImageElement).src = PLACEHOLDER; }} />
                      </div>
                      <div className={styles.reviewBody}>
                        <div className={styles.reviewProductName}>{r.productName}</div>
                        <StarRating value={r.rating} readonly size="sm" />
                        <p className={styles.reviewComment}>"{r.comment}"</p>
                        <div className={styles.reviewDate}>{r.createdAt}</div>
                      </div>
                      <div className={styles.reviewActions}>
                        <button type="button" className={styles.reviewEditBtn}
                          onClick={() => {
                            const target = reviewableProducts.find(p => p.productId === r.productId);
                            if (target) openReviewModal({ ...target, alreadyReviewed: true, existingReview: r });
                          }}>Edit</button>
                        <button type="button" className={`${styles.reviewEditBtn} ${styles.reviewDeleteBtn}`}
                          onClick={() => handleReviewDelete(r.id)}>Delete</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ─── SETTINGS ─── */}
        {tab === 'settings' && (
          <div className={styles.tabCard}>
            <div className={styles.tabCardHeader}>
              <h2 className={styles.tabCardTitle}>⚙️ Profile Settings</h2>
              {editing
                ? <button type="button" className={styles.saveProfileBtn} onClick={handleSave}>Save Changes</button>
                : <button type="button" className={styles.editProfileOutlineBtn} onClick={() => setEditing(true)}>Edit Profile</button>
              }
            </div>
            <div className={styles.profileForm}>
              {[
                { id:'firstName', label:'First Name',   icon:'👤', ph:'First name' },
                { id:'lastName',  label:'Last Name',    icon:'👤', ph:'Last name' },
                { id:'email',     label:'Email',        icon:'✉️',  ph:'Email address', disabled: true },
                { id:'phone',     label:'Mobile Number',icon:'📱', ph:'10-digit number (used for WhatsApp reminders)' },
              ].map(f => (
                <div key={f.id} className={styles.profileField}>
                  <label className={styles.profileLabel}>{f.label}</label>
                  <div className={styles.profileInputWrap}>
                    <span className={styles.profileInputIcon}>{f.icon}</span>
                    <input className={styles.profileInput}
                      value={draft[f.id as keyof typeof draft]}
                      onChange={e => setDraft(d => ({ ...d, [f.id]: e.target.value }))}
                      disabled={!editing || !!f.disabled}
                      placeholder={f.ph} />
                  </div>
                </div>
              ))}
            </div>
            {session?.user?.image && (
              <div className={styles.googleNote}>
                <svg width="14" height="14" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
                  <g fill="none" fillRule="evenodd">
                    <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
                    <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
                    <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
                    <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
                  </g>
                </svg>
                Signed in with Google · Email cannot be changed
              </div>
            )}
          </div>
        )}

        {/* ─── HELP ─── */}
        {tab === 'help' && (
          <div className={styles.tabCard}>
            <div className={styles.tabCardHeader}>
              <h2 className={styles.tabCardTitle}>🎧 Help & Support</h2>
            </div>
            <div className={styles.helpGrid}>
              {[
                { icon:'📧', title:'Email Support',     sub:'support@littleloot.in',   action:'mailto:support@littleloot.in', label:'Send Email' },
                { icon:'💬', title:'Live Chat',         sub:'Available 9am – 9pm',     action:'#',                           label:'Start Chat' },
                { icon:'📦', title:'Track Your Order',  sub:'Check order status',      action:'/track-order',                label:'Track Now' },
                { icon:'🔄', title:'Returns & Refunds', sub:'30-day easy returns',     action:'/returns',                    label:'Learn More' },
              ].map(h => (
                <a key={h.title} href={h.action} className={styles.helpGridCard}>
                  <div className={styles.helpGridIcon}>{h.icon}</div>
                  <div className={styles.helpGridTitle}>{h.title}</div>
                  <div className={styles.helpGridSub}>{h.sub}</div>
                  <span className={styles.helpGridAction}>{h.label} →</span>
                </a>
              ))}
            </div>
          </div>
        )}

      </main>

      {/* ══════════ ADDRESS MODAL ══════════ */}
      {showAddrModal && (
        <div className={styles.modalOverlay} onClick={() => setShowAddrModal(false)}>
          <div className={styles.modalBox} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>{editingAddr ? '✏️ Edit Address' : '📍 Add Address'}</h3>
              <button className={styles.modalClose} onClick={() => setShowAddrModal(false)}>✕</button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.addrTypeRow}>
                {(['Home', 'Office', 'Other'] as const).map(t => (
                  <button key={t} type="button"
                    className={`${styles.addrTypeBtn} ${addrForm.type === t ? styles.addrTypeBtnActive : ''}`}
                    onClick={() => setAddrForm(f => ({ ...f, type: t }))}>
                    {t === 'Home' ? '🏠' : t === 'Office' ? '🏢' : '📌'} {t}
                  </button>
                ))}
              </div>
              {[
                { key:'name',    label:'Full Name *',       ph:'Recipient full name',        icon:'👤' },
                { key:'phone',   label:'Mobile *',          ph:'10-digit number',            icon:'📱' },
                { key:'line1',   label:'Address Line 1 *',  ph:'House/Flat, Street, Colony', icon:'🏠' },
                { key:'line2',   label:'Address Line 2',    ph:'Area, Locality (optional)',  icon:'📌' },
                { key:'city',    label:'City *',            ph:'City',                       icon:'🏙️' },
                { key:'pincode', label:'Pincode *',         ph:'6-digit pincode',            icon:'📮' },
              ].map(f => (
                <div key={f.key} className={styles.modalField}>
                  <label className={styles.modalLabel}>{f.label}</label>
                  <div className={styles.modalInputWrap}>
                    <span className={styles.modalInputIcon}>{f.icon}</span>
                    <input
                      className={`${styles.modalInput} ${addrErrors[f.key as keyof AddressFormData] ? styles.modalInputError : ''}`}
                      placeholder={f.ph}
                      value={addrForm[f.key as keyof AddressFormData] as string}
                      maxLength={f.key === 'phone' ? 10 : f.key === 'pincode' ? 6 : undefined}
                      onChange={e => {
                        let v = e.target.value;
                        if (f.key === 'phone' || f.key === 'pincode') v = v.replace(/\D/g, '');
                        setAddrForm(a => ({ ...a, [f.key]: v }));
                      }} />
                  </div>
                  {addrErrors[f.key as keyof AddressFormData] && (
                    <span className={styles.modalErr}>{addrErrors[f.key as keyof AddressFormData]}</span>
                  )}
                </div>
              ))}
              <div className={styles.modalField}>
                <label className={styles.modalLabel}>State *</label>
                <div className={styles.modalInputWrap}>
                  <span className={styles.modalInputIcon}>🗺️</span>
                  <select
                    className={`${styles.modalInput} ${addrErrors.state ? styles.modalInputError : ''}`}
                    value={addrForm.state}
                    onChange={e => setAddrForm(f => ({ ...f, state: e.target.value }))}>
                    <option value="">Select state</option>
                    {INDIA_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                {addrErrors.state && <span className={styles.modalErr}>{addrErrors.state}</span>}
              </div>
              <label className={styles.checkRow}>
                <input type="checkbox" checked={addrForm.isDefault}
                  onChange={e => setAddrForm(f => ({ ...f, isDefault: e.target.checked }))} />
                <span>Set as default delivery address</span>
              </label>
            </div>
            <div className={styles.modalFooter}>
              <button type="button" className={styles.modalCancelBtn} onClick={() => setShowAddrModal(false)}>Cancel</button>
              <button type="button" className={styles.modalSaveBtn} onClick={handleAddrSave} disabled={addrSaving}>
                {addrSaving ? 'Saving…' : editingAddr ? 'Update Address' : 'Save Address'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════ REVIEW MODAL ══════════ */}
      {showReviewModal && reviewTarget && (
        <div className={styles.modalOverlay} onClick={() => setShowReviewModal(false)}>
          <div className={styles.modalBox} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>
                {reviewTarget.alreadyReviewed ? '✏️ Edit Your Review' : '⭐ Write a Review'}
              </h3>
              <button className={styles.modalClose} onClick={() => setShowReviewModal(false)}>✕</button>
            </div>
            <div className={styles.modalBody}>
              {/* Product preview */}
              <div className={styles.reviewModalProduct}>
                <img
                  src={reviewTarget.productImage} alt={reviewTarget.productName}
                  className={styles.reviewModalImg}
                  onError={e => { (e.target as HTMLImageElement).src = PLACEHOLDER; }} />
                <div>
                  <div className={styles.reviewModalProductName}>{reviewTarget.productName}</div>
                  <div className={styles.reviewModalOrderDate}>Ordered on {reviewTarget.orderDate}</div>
                </div>
              </div>

              {/* Star rating */}
              <div className={styles.modalField}>
                <label className={styles.modalLabel}>Overall Rating *</label>
                <StarRating
                  value={reviewDraft.rating}
                  onChange={v => setReviewDraft(d => ({ ...d, rating: v }))}
                  size="lg" />
              </div>

              {/* Review text */}
              <div className={styles.modalField}>
                <label className={styles.modalLabel}>Your Review *</label>
                <textarea
                  className={styles.reviewTextarea}
                  placeholder="What did your child love about this product? Was the quality good? Would you recommend it to other parents?"
                  rows={5}
                  maxLength={500}
                  value={reviewDraft.comment}
                  onChange={e => setReviewDraft(d => ({ ...d, comment: e.target.value }))} />
                <div className={styles.reviewCharCount}>
                  <span style={{ color: reviewDraft.comment.length < 10 ? '#ff4444' : '#999' }}>
                    {reviewDraft.comment.length < 10 && reviewDraft.comment.length > 0
                      ? `${10 - reviewDraft.comment.length} more characters needed`
                      : `${reviewDraft.comment.length}/500`}
                  </span>
                </div>
              </div>

              {/* WhatsApp nudge */}
              {!reviewTarget.alreadyReviewed && profile.phone && (
                <div className={styles.reviewModalWaNudge}>
                  <span>💡 Want a reminder? We'll send you a WhatsApp message.</span>
                  <button type="button" className={styles.reviewNudgeWa}
                    onClick={() => {
                      const url = buildWhatsAppReviewUrl(profile.phone, profile.firstName, [reviewTarget]);
                      window.open(url, '_blank', 'noopener');
                    }}>
                    📲 Send WhatsApp Reminder
                  </button>
                </div>
              )}
            </div>
            <div className={styles.modalFooter}>
              <button type="button" className={styles.modalCancelBtn} onClick={() => setShowReviewModal(false)}>
                Cancel
              </button>
              <button type="button" className={styles.modalSaveBtn}
                onClick={handleReviewSubmit}
                disabled={reviewSaving || reviewDraft.comment.trim().length < 10}>
                {reviewSaving
                  ? 'Submitting…'
                  : reviewTarget.alreadyReviewed ? 'Update Review' : 'Submit Review'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && <div className={styles.toast}>{toast}</div>}
    </div>
  );
}