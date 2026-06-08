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
const EMPTY_PROFILE = { firstName:'', lastName:'', email:'', phone:'', dob:'', gender:'', backendAvatar:'' };

/* ─── Typed header helper ────────────────────────────────────────── */
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
  delivered:        { bg:'#ecfdf5', color:'#059669' },
  shipped:          { bg:'#eff6ff', color:'#2563eb' },
  processing:       { bg:'#fffbeb', color:'#d97706' },
  confirmed:        { bg:'#fffbeb', color:'#d97706' },
  pending:          { bg:'#fffbeb', color:'#d97706' },
  cancelled:        { bg:'#fff1f2', color:'#e11d48' },
  out_for_delivery: { bg:'#eff6ff', color:'#2563eb' },
  packed:           { bg:'#eff6ff', color:'#2563eb' },
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

  const carouselRef    = useRef<HTMLDivElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  /* localAvatar — seeded from localStorage on mount so photo survives refresh */
  const [localAvatar,     setLocalAvatar]     = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    try { return localStorage.getItem('ll_avatar') || null; } catch { return null; }
  });
  const [avatarUploading, setAvatarUploading] = useState(false);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3500); };
  const token = (session as any)?.backendToken as string | undefined;

  /* Persist localAvatar to localStorage whenever it changes */
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      if (localAvatar) localStorage.setItem('ll_avatar', localAvatar);
      else             localStorage.removeItem('ll_avatar');
    } catch {}
  }, [localAvatar]);

  /* ── Avatar upload handler ─────────────────────────────────────── */
  /* ── dataURL → Blob (no secondary fetch, pure canvas) ───────────── */
  const dataUrlToBlob = (dataUrl: string): Blob => {
    const [header, data] = dataUrl.split(',');
    const mime = header.match(/:(.*?);/)?.[1] ?? 'image/jpeg';
    const bytes = atob(data);
    const arr   = new Uint8Array(bytes.length);
    for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
    return new Blob([arr], { type: mime });
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (e.target) (e.target as HTMLInputElement).value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) { showToast('⚠️ Please select an image file.'); return; }
    if (file.size > 5 * 1024 * 1024) { showToast('⚠️ Image must be under 5 MB.'); return; }
    setAvatarUploading(true);

    try {
      /* Step 1: compress via canvas → base64 JPEG */
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = ev => {
          const img = new Image();
          img.onload = () => {
            const MAX = 600;
            const scale = Math.min(1, MAX / Math.max(img.width, img.height));
            const canvas = document.createElement('canvas');
            canvas.width  = Math.round(img.width  * scale);
            canvas.height = Math.round(img.height * scale);
            canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
            resolve(canvas.toDataURL('image/jpeg', 0.88));
          };
          img.onerror = () => reject(new Error('img'));
          img.src = ev.target!.result as string;
        };
        reader.onerror = () => reject(new Error('read'));
        reader.readAsDataURL(file);
      });

      /* Step 2: immediately show the photo AND persist base64 to localStorage.
         This guarantees the photo survives a refresh even if the upload fails. */
      setLocalAvatar(dataUrl);
      try { localStorage.setItem('ll_avatar', dataUrl); } catch {}

      if (!token) {
        showToast('✅ Profile photo updated!');
        setAvatarUploading(false);
        return;
      }

      /* Step 3: upload to backend */
      let serverUrl = '';
      try {
        const blob = dataUrlToBlob(dataUrl);
        const form = new FormData();
        form.append('avatar', blob, 'avatar.jpg');
        const res  = await fetch('/api/user/avatar', {
          method: 'POST',
          headers: authHeaders(token),
          body: form,
        });
        if (res.ok) {
          const data = await res.json().catch(() => ({}));
          /* backend returns { url, profile_picture, ... } */
          serverUrl = data?.url || data?.profile_picture || data?.avatar_url || '';
        }
      } catch { /* network error — base64 in localStorage is the fallback */ }

      if (serverUrl && serverUrl.startsWith('http')) {
        /* We have a real Cloudinary URL — swap out the base64 immediately.
           Store the URL in localStorage so refresh shows the hosted image. */
        setLocalAvatar(serverUrl);
        try { localStorage.setItem('ll_avatar', serverUrl); } catch {}
        setProfile(p => ({ ...p, backendAvatar: serverUrl }));
        setDraft(p =>   ({ ...p, backendAvatar: serverUrl }));
        showToast('✅ Profile photo saved!');
      } else {
        /* Upload failed or backend returned no URL.
           base64 is still in localStorage — photo persists on refresh. */
        showToast('📸 Photo saved locally (server sync pending).');
      }

    } catch {
      showToast('❌ Could not process image. Try another file.');
    }

    setAvatarUploading(false);
  };

  /* ── Seed profile from session (immediate — before backend fetch) ── */
  useEffect(() => {
    if (status !== 'authenticated' || !session?.user) return;
    const parts = (session.user.name || '').trim().split(' ');
    const s = {
      firstName:     parts[0] || '',
      lastName:      parts.slice(1).join(' ') || '',
      email:         session.user.email || '',
      phone:         '',
      dob:           '',
      gender:        '',
      backendAvatar: (session?.user as any)?.image || '',
    };
    setProfile(s); setDraft(s); setProfileLoading(false);
  }, [session, status]);

  /* ── Fetch all data ────────────────────────────────────────────── */
  useEffect(() => {
    if (status !== 'authenticated') return;
    const ah = authHeaders(token);

    if (token) {
      fetch('/api/user/profile', { headers: ah })
        .then(r => r.ok ? r.json() : Promise.reject(r.status))
        .then((res: any) => {
          if (!res || res.detail) return;
          const parts = (res.name || '').trim().split(' ');
          /* Resolve the best avatar URL from the backend response */
          const serverAvatar: string =
            res.profile_picture || res.avatar_url || res.avatar || '';
          const m = {
            firstName:     parts[0] || '',
            lastName:      parts.slice(1).join(' ') || '',
            email:         res.email || '',
            phone:         res.phone || '',
            dob:           res.dob   || '',
            gender:        res.gender || '',
            backendAvatar: serverAvatar,
          };
          setProfile(m); setDraft(m);
          /* If backend returned a real Cloudinary URL, prefer it over localStorage.
             Store it in localStorage so it survives future refreshes too. */
          if (serverAvatar && serverAvatar.startsWith('http')) {
            setLocalAvatar(serverAvatar);
            try { localStorage.setItem('ll_avatar', serverAvatar); } catch {}
          }
          /* If NO server URL yet, keep whatever is in localStorage (base64 fallback) */
        })
        .catch(() => {});
    }

    fetch('/api/orders', { headers: ah })
      .then(r => r.json())
      .then((res: any) => {
        const raw = Array.isArray(res) ? res : (res?.orders || []);
        if (raw.length) setOrders(raw.map(mapOrder));
      })
      .catch(() => {});

    fetch('/api/favorite', { headers: ah })
      .then(r => r.json())
      .then((res: any) => { setFavs(Array.isArray(res) ? res : (res?.favorites ?? [])); })
      .catch(() => {});

    _get('/api/product/featured')
      .then((res: any) => { setFeatured((Array.isArray(res) ? res : (res?.data || [])).slice(0, 8)); })
      .catch(() => {});

    setAddrLoading(true);
    fetch('/api/address/addresses', { headers: ah })
      .then(r => r.json())
      .then((res: any) => {
        const addrs: any[] = Array.isArray(res) ? res : (res?.addresses || res?.data || []);
        setAddresses(addrs.map(mapBackendAddress));
      })
      .catch(() => {})
      .finally(() => setAddrLoading(false));

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
  const handleSave = async () => {
    if (!token) {
      /* No backend token — still update local state */
      setProfile({ ...draft }); setEditing(false);
      showToast('✅ Profile updated locally!');
      return;
    }

    const fullName = `${draft.firstName} ${draft.lastName}`.trim();
    const payload: Record<string, string> = {
      name:       fullName,
      first_name: draft.firstName.trim(),
      last_name:  draft.lastName.trim(),
      phone:      draft.phone.trim(),
    };
    /* include optional fields only if non-empty */
    if (draft.dob)    payload.dob    = draft.dob;
    if (draft.gender) payload.gender = draft.gender;

    let saved = false;
    let serverError = '';

    /* Try PUT first */
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: jsonHeaders(token),
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        saved = true;
      } else {
        const body = await res.json().catch(() => ({}));
        serverError = body?.detail || body?.message || `HTTP ${res.status}`;
      }
    } catch (err: any) {
      serverError = err?.message || 'Network error';
    }

    /* If PUT failed try PATCH */
    if (!saved) {
      try {
        const res = await fetch('/api/user/profile', {
          method: 'PATCH',
          headers: jsonHeaders(token),
          body: JSON.stringify(payload),
        });
        if (res.ok) saved = true;
      } catch { /* ignore */ }
    }

    if (saved) {
      setProfile({ ...draft });
      setEditing(false);
      showToast('✅ Profile saved successfully!');
    } else {
      /* Still update local state so the UI reflects changes */
      setProfile({ ...draft });
      setEditing(false);
      showToast(`⚠️ Saved locally but server error: ${serverError || 'Unknown error'}`);
    }
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

  /* ── Toggle wishlist (add / remove) ───────────────────────────── */
  const toggleWishlist = useCallback(async (e: React.MouseEvent, product: any) => {
    e.preventDefault(); e.stopPropagation();
    const id       = String(product.id);
    const isInFavs = favs.some(f => String(f.product?.id) === id);

    if (isInFavs) {
      /* Optimistic remove */
      setFavs(prev => prev.filter(f => String(f.product?.id) !== id));
      try {
        await fetch(`/api/favorite/${id}`, { method: 'DELETE', headers: authHeaders(token) });
      } catch {
        /* Rollback on failure */
        setFavs(prev => [...prev, { product }]);
        showToast('❌ Could not remove from wishlist.');
      }
    } else {
      /* Optimistic add */
      setFavs(prev => [...prev, { product }]);
      showToast(`❤️ Added to wishlist!`);
      try {
        await _post('/api/favorite', { product_id: product.id });
      } catch {
        /* Rollback on failure */
        setFavs(prev => prev.filter(f => String(f.product?.id) !== id));
        showToast('❌ Could not add to wishlist.');
      }
    }
  }, [favs, token]);

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
  /* Avatar priority: just-uploaded blob → DB URL → OAuth photo → null */
  const profileImage = localAvatar || profile.backendAvatar || session?.user?.image || null;
  const displayName  = [profile.firstName, profile.lastName].filter(Boolean).join(' ') || session?.user?.email || '—';
  const displayEmail = profile.email || session?.user?.email || '—';
  const recentOrders = orders.slice(0, 4);

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

  const activeCoupons = coupons.filter(c => !c.used && new Date(c.expiry) >= new Date()).length;

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

        {/* Profile block */}
        <div className={styles.sidebarProfile}>
          {/* Hidden file input */}
          <input
            ref={avatarInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleAvatarChange}
          />
          <div className={styles.sidebarAvatarRow}>
            {/* Avatar with camera overlay */}
            <div className={styles.sidebarAvatarWrap} onClick={() => avatarInputRef.current?.click()}>
              {profileImage
                ? <img src={profileImage} alt={displayName} className={styles.sidebarAvatar} referrerPolicy="no-referrer" />
                : <div className={styles.sidebarAvatarFallback}>{(displayName[0] || 'U').toUpperCase()}</div>
              }
              <div className={styles.sidebarAvatarOverlay}>
                {avatarUploading
                  ? <div className={styles.avatarSpinner} />
                  : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                      <circle cx="12" cy="13" r="4"/>
                    </svg>
                  )
                }
              </div>
            </div>
            <div className={styles.sidebarTextBlock}>
              <div className={styles.sidebarName}>{displayName}</div>
              <div className={styles.sidebarEmail}>{displayEmail}</div>
            </div>
          </div>
          <button type="button" className={styles.sidebarEditLink} onClick={() => setTab('settings')}>
            ✏️ Edit Profile
          </button>
        </div>

        {/* Mobile-only logo */}
        <div className={styles.sidebarLogo}>
          <div className={styles.logoIcon}>🧸</div>
          <div>
            <div className={styles.logoName}>LittleLoot</div>
            <div className={styles.logoTagline}>Your kids, our priority</div>
          </div>
        </div>

        {/* Nav */}
        <nav className={styles.sidebarNav}>
          {/* Dashboard */}
          <button type="button" className={`${styles.navBtn} ${tab === 'overview' ? styles.navBtnActive : ''}`} onClick={() => setTab('overview')}>
            <span className={styles.navIcon}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
            </span>
            <span className={styles.navLabel}>Dashboard</span>
          </button>

          {/* My Orders */}
          <button type="button" className={`${styles.navBtn} ${tab === 'orders' ? styles.navBtnActive : ''}`} onClick={() => setTab('orders')}>
            <span className={styles.navIcon}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/><path d="M9 12h6M9 16h4"/></svg>
            </span>
            <span className={styles.navLabel}>My Orders</span>
            {orders.length > 0 && <span className={styles.navBadge}>{orders.length}</span>}
          </button>

          {/* Wishlist */}
          <button type="button" className={`${styles.navBtn} ${tab === 'wishlist' ? styles.navBtnActive : ''}`} onClick={() => setTab('wishlist')}>
            <span className={styles.navIcon}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
            </span>
            <span className={styles.navLabel}>Wishlist</span>
            {favs.length > 0 && <span className={styles.navBadge}>{favs.length}</span>}
          </button>

          {/* Addresses */}
          <button type="button" className={`${styles.navBtn} ${tab === 'addresses' ? styles.navBtnActive : ''}`} onClick={() => setTab('addresses')}>
            <span className={styles.navIcon}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/><circle cx="12" cy="9" r="2.5"/></svg>
            </span>
            <span className={styles.navLabel}>Addresses</span>
          </button>

          {/* Payment Methods */}
          <button type="button" className={`${styles.navBtn} ${tab === 'settings' ? styles.navBtnActive : ''}`} onClick={() => setTab('settings')}>
            <span className={styles.navIcon}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2"/><path d="M1 10h22"/></svg>
            </span>
            <span className={styles.navLabel}>Payment Methods</span>
          </button>

          {/* My Reviews */}
          <button type="button" className={`${styles.navBtn} ${tab === 'reviews' ? styles.navBtnActive : ''}`} onClick={() => setTab('reviews')}>
            <span className={styles.navIcon}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
            </span>
            <span className={styles.navLabel}>My Reviews</span>
            {pendingReviewProducts.length > 0 && <span className={styles.navBadge}>{pendingReviewProducts.length}</span>}
          </button>

          {/* Little Loot Club */}
          <button type="button" className={styles.navBtn}>
            <span className={styles.navIcon}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6L12 2z"/></svg>
            </span>
            <span className={styles.navLabel}>Little Loot Club</span>
            <span className={styles.navBadgeNew}>New</span>
          </button>

          {/* Rewards */}
          <button type="button" className={`${styles.navBtn} ${tab === 'coupons' ? styles.navBtnActive : ''}`} onClick={() => setTab('coupons')}>
            <span className={styles.navIcon}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/></svg>
            </span>
            <span className={styles.navLabel}>Rewards</span>
            <span className={styles.navBadgePoints}>320 Points</span>
          </button>

          {/* Coupons */}
          <button type="button" className={`${styles.navBtn} ${tab === 'coupons' ? styles.navBtnActive : ''}`} onClick={() => setTab('coupons')}>
            <span className={styles.navIcon}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 12v10H4V12"/><path d="M22 7H2v5h20V7z"/><path d="M12 22V7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/></svg>
            </span>
            <span className={styles.navLabel}>Coupons</span>
          </button>

          {/* Notifications */}
          <button type="button" className={styles.navBtn}>
            <span className={styles.navIcon}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
            </span>
            <span className={styles.navLabel}>Notifications</span>
          </button>

          {/* Settings */}
          <button type="button" className={`${styles.navBtn} ${tab === 'settings' ? styles.navBtnActive : ''}`} onClick={() => setTab('settings')}>
            <span className={styles.navIcon}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
            </span>
            <span className={styles.navLabel}>Settings</span>
          </button>

          {/* Help & Support */}
          <button type="button" className={`${styles.navBtn} ${tab === 'help' ? styles.navBtnActive : ''}`} onClick={() => setTab('help')}>
            <span className={styles.navIcon}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            </span>
            <span className={styles.navLabel}>Help &amp; Support</span>
          </button>

          {/* Logout */}
          <button type="button" className={styles.logoutBtn}
            onClick={() => signOut({ callbackUrl: '/login' })}>
            <span className={styles.logoutIcon}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            </span>
            <span>Logout</span>
          </button>
        </nav>

        <div style={{ flex: 1 }} />

        {/* Little Loot Club card */}
        <div className={styles.clubCard}>
          <div className={styles.clubCardTitle}>
            <span>👑</span> Little Loot Club
          </div>
          <div className={styles.clubCardSub}>Join &amp; enjoy exclusive perks!</div>
          <ul className={styles.clubCardPerks}>
            <li>Early access to new launches</li>
            <li>Exclusive member discounts</li>
            <li>Birthday special rewards</li>
            <li>Earn extra Loot Points</li>
          </ul>
          <button type="button" className={styles.clubJoinBtn}>Join Now →</button>
        </div>

        {/* Need Help card */}
        <div className={styles.helpCard}>
          <div className={styles.helpTop}>
            <div className={styles.helpTitle}>Need Help?</div>
            <div className={styles.helpSub}>We're here for you</div>
          </div>
          <div className={styles.helpContactList}>
            <div className={styles.helpContact}>
              <span className={styles.helpContactIcon}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.4 2 2 0 0 1 3.6 1.22h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.86a16 16 0 0 0 6 6l.95-.96a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21.77 16.92z"/></svg>
              </span>
              +91 98765 43210
            </div>
            <div className={styles.helpContact}>
              <span className={styles.helpContactIcon}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
              </span>
              hello@littleloot.com
            </div>
            <div className={styles.helpContact}>
              <span className={styles.helpContactIcon}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              </span>
              Mon – Sat: 10AM – 7PM
            </div>
          </div>
        </div>

      </aside>

      {/* ══════════ MAIN ══════════ */}
      <main className={styles.main}>

        {/* ─── OVERVIEW ─── */}
        {tab === 'overview' && (
          <>
            {/* Welcome banner */}
            <div className={styles.welcomeBanner}>
              <div className={styles.welcomeLeft}>
                <div className={styles.welcomeAvatarWrap}>
                  {profileImage
                    ? <img src={profileImage} alt={displayName} className={styles.welcomeAvatar} referrerPolicy="no-referrer" />
                    : <div className={styles.welcomeAvatarFallback}>{(displayName[0] || 'U').toUpperCase()}</div>
                  }
                  <button type="button" className={styles.cameraBtn} aria-label="Change photo">📷</button>
                </div>
                <div className={styles.welcomeInfo}>
                  <h2 className={styles.welcomeName}>Welcome back, {profile.firstName || displayName}! 👋</h2>
                  <p className={styles.welcomeEmail}>{displayEmail}</p>
                  {profile.phone && <p className={styles.welcomePhone}>📞 {profile.phone}</p>}
                  <button type="button" className={styles.welcomeEditBtn} onClick={() => setTab('settings')}>
                    ✏️ Edit Profile
                  </button>
                </div>
              </div>

              {/* Loot Points card */}
              <div className={styles.lootPointsCard}>
                <div className={styles.lootPointsStarIcon}>⭐</div>
                <div className={styles.lootPointsLabel}>Loot Points</div>
                <div className={styles.lootPointsNum}>320</div>
                <div className={styles.lootPointsSub}>Available Points</div>
                <button type="button" className={styles.lootPointsLink}>View Rewards →</button>
              </div>
            </div>

            {/* Stats row */}
            <div className={styles.statsRow}>
              {[
                { icon:'📦', label:'Orders',    value: orders.length,    color:'Blue',   link:'View all orders →',    tab:'orders'    as Tab },
                { icon:'❤️', label:'Wishlist',  value: favs.length,      color:'Pink',   link:'View your wishlist →', tab:'wishlist'  as Tab },
                { icon:'📍', label:'Addresses', value: addresses.length, color:'Teal',   link:'Manage addresses →',   tab:'addresses' as Tab },
                { icon:'🎟️', label:'Coupons',   value: activeCoupons,    color:'Orange', link:'View coupons →',       tab:'coupons'   as Tab },
              ].map(s => (
                <div key={s.label} className={styles.statCard} onClick={() => setTab(s.tab)}>
                  <div className={`${styles.statIconWrap} ${styles[`statIcon${s.color}`]}`}>
                    <span className={styles.statIcon}>{s.icon}</span>
                  </div>
                  <div className={styles.statNum}>{s.value}</div>
                  <div className={styles.statLabel}>{s.label}</div>
                  <button type="button" className={styles.statLink}>{s.link}</button>
                </div>
              ))}
            </div>

            {/* Recent orders + Account details */}
            <div className={styles.overviewGrid}>
              <div className={styles.overviewCard}>
                <div className={styles.overviewCardHeader}>
                  <h3 className={styles.overviewCardTitle}>My Recent Orders</h3>
                  <button type="button" className={styles.viewAllBtn} onClick={() => setTab('orders')}>View All Orders →</button>
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
                              <div className={styles.recentOrderId}>Order #{o.id.slice(0, 8).toUpperCase()}</div>
                              <div className={styles.recentOrderMeta}>{o.date} · {o.itemCount} {o.itemCount === 1 ? 'Item' : 'Items'}</div>
                            </div>
                            <div className={styles.recentOrderRight}>
                              <div className={styles.recentOrderAmt}>₹{o.amount.toLocaleString('en-IN')}</div>
                              <span className={styles.recentOrderStatus} style={{ background: sc.bg, color: sc.color }}>
                                {o.status}
                              </span>
                            </div>
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
                        <button type="button" className={styles.changePassBtn}>Change</button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Reward progress banner */}
            <div className={styles.rewardBanner}>
              <div className={styles.rewardBannerIcon}>👑</div>
              <div className={styles.rewardBannerBody}>
                <div className={styles.rewardBannerTitle}>You're just 180 points away from a ₹250 reward!</div>
                <div className={styles.rewardBannerSub}>Keep shopping and earn more Loot Points.</div>
              </div>
              <button type="button" className={styles.rewardBannerBtn} onClick={() => setTab('orders')}>Shop Now</button>
            </div>

            {/* Wishlist + Addresses two-col */}
            <div className={styles.overviewGrid}>
              {/* Wishlist mini */}
              <div className={styles.overviewCard}>
                <div className={styles.overviewCardHeader}>
                  <h3 className={styles.overviewCardTitle}>My Wishlist</h3>
                  <button type="button" className={styles.viewAllBtn} onClick={() => setTab('wishlist')}>View All</button>
                </div>
                {favs.length === 0
                  ? <div className={styles.emptyMini}><span>💔</span><span>Wishlist is empty</span></div>
                  : (
                    <div className={styles.wishMiniGrid}>
                      {favs.slice(0, 3).map(item => {
                        const p = item.product;
                        const img = getProductImage(p);
                        const price = getSellingPrice(p);
                        return (
                          <Link key={String(p.id)} href={`/product/${p.id}`} className={styles.wishMiniCard}>
                            <button type="button"
                              className={`${styles.wishMiniHeart} ${styles.wishMiniHeartActive}`}
                              title="Remove from wishlist"
                              onClick={async e => {
                                e.preventDefault(); e.stopPropagation();
                                const pid = String(p.id);
                                setFavs(prev => prev.filter(i => String(i.product?.id) !== pid));
                                try { await fetch(`/api/favorite/${pid}`, { method: 'DELETE', headers: authHeaders(token) }); } catch {}
                              }}>
                              <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                              </svg>
                            </button>
                            <img src={img} alt={p.name} className={styles.wishMiniImg} onError={e => { (e.target as HTMLImageElement).src = PLACEHOLDER; }} />
                            <div className={styles.wishMiniInfo}>
                              <div className={styles.wishMiniName}>{p.name}</div>
                              <div className={styles.wishMiniPrice}>₹{price.toLocaleString('en-IN')}</div>
                              <span className={styles.wishMiniStock}>In Stock</span>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  )
                }
              </div>

              {/* Addresses mini */}
              <div className={styles.overviewCard}>
                <div className={styles.overviewCardHeader}>
                  <h3 className={styles.overviewCardTitle}>My Addresses</h3>
                  <button type="button" className={styles.viewAllBtn} onClick={() => setTab('addresses')}>Manage Addresses</button>
                </div>
                <div className={styles.addrMiniList}>
                  {addresses.slice(0, 2).map(a => (
                    <div key={a.id} className={styles.addrMiniItem}>
                      <div className={styles.addrMiniIcon}>{a.type === 'Home' ? '🏠' : a.type === 'Office' ? '🏢' : '📌'}</div>
                      <div className={styles.addrMiniBody}>
                        <div className={styles.addrMiniType}>{a.type}</div>
                        <div className={styles.addrMiniText}>
                          {a.line1}, {a.city} – {a.pincode}<br />
                          {a.state}<br />
                          +91 {a.phone}
                        </div>
                      </div>
                      <button type="button" className={styles.addrMiniEdit}
                        onClick={() => { setEditingAddr(a); setAddrForm({ type:a.type, name:a.name, phone:a.phone, line1:a.line1, line2:a.line2, city:a.city, state:a.state, pincode:a.pincode, isDefault:a.isDefault }); setAddrErrors({}); setShowAddrModal(true); }}>
                        ✏️ Edit
                      </button>
                    </div>
                  ))}
                  <button type="button" className={styles.addAddrBtn}
                    onClick={() => { setEditingAddr(null); setAddrForm(EMPTY_ADDR); setAddrErrors({}); setShowAddrModal(true); }}>
                    <span>➕</span><span>Add New Address</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Trust bar + Reviews mini two-col */}
            <div className={styles.overviewGrid}>
              {/* Trust bar */}
              <div className={styles.trustBar} style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 16, background: '#fff', borderRadius: 16, padding: '20px 18px', border: '1px solid #f0f0f0' }}>
                {[
                  { icon:'🚚', title:'Free Delivery',    sub:'On orders above ₹499' },
                  { icon:'🔄', title:'7 Days Returns',   sub:'Hassle-free returns' },
                  { icon:'🔒', title:'Secure Payments',  sub:'100% safe & secure' },
                  { icon:'🧸', title:'Made for Kids',    sub:'Child-safe materials' },
                ].map(t => (
                  <div key={t.title} className={styles.trustItem}>
                    <div className={styles.trustIconWrap}><span>{t.icon}</span></div>
                    <div>
                      <div className={styles.trustTitle}>{t.title}</div>
                      <div className={styles.trustSub}>{t.sub}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Reviews mini */}
              {reviews.length > 0 && (
                <div className={styles.overviewCard}>
                  <div className={styles.overviewCardHeader}>
                    <h3 className={styles.overviewCardTitle}>My Reviews</h3>
                    <button type="button" className={styles.viewAllBtn} onClick={() => setTab('reviews')}>View All</button>
                  </div>
                  <div className={styles.reviewsMiniList}>
                    {reviews.slice(0, 2).map(r => (
                      <div key={r.id} className={styles.reviewMiniItem}>
                        <div className={styles.reviewMiniImg}>
                          <img src={r.productImage} alt={r.productName} onError={e => { (e.target as HTMLImageElement).src = PLACEHOLDER; }} />
                        </div>
                        <div className={styles.reviewMiniBody}>
                          <div className={styles.reviewMiniName}>{r.productName}</div>
                          <StarRating value={r.rating} readonly size="sm" />
                          <div className={styles.reviewMiniDate}>Reviewed on {r.createdAt}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Recommended products carousel */}
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
                          {(() => {
                            const isWished = favs.some(f => String(f.product?.id) === String(p.id));
                            return (
                              <button
                                type="button"
                                className={`${styles.recWishBtn} ${isWished ? styles.recWishBtnActive : ''}`}
                                title={isWished ? 'Remove from wishlist' : 'Add to wishlist'}
                                onClick={e => toggleWishlist(e, p)}>
                                <svg width="14" height="14" viewBox="0 0 24 24"
                                  fill={isWished ? 'currentColor' : 'none'}
                                  stroke="currentColor" strokeWidth="2"
                                  strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                                </svg>
                              </button>
                            );
                          })()}
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
                    onClick={() => carouselRef.current?.scrollBy({ left: 260, behavior: 'smooth' })}>›</button>
                </div>
              </div>
            )}
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
              <button type="button" className={styles.editProfileOutlineBtn}
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
              <span className={styles.tabMeta}>{activeCoupons} active</span>
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
                    onClick={() => sendWhatsAppReminder(pendingReviewProducts)}>
                    <span>📲</span> WhatsApp Reminder
                  </button>
                )}
                <span className={styles.tabMeta}>{reviews.length} submitted</span>
              </div>
            </div>

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

            {filteredReviewProducts.length > 0 && (
              <div className={styles.reviewProductGrid}>
                {filteredReviewProducts.map(p => {
                  const ex = reviews.find(r => r.productId === p.productId);
                  return (
                    <div key={p.productId} className={`${styles.reviewProductCard} ${ex ? styles.reviewProductCardDone : ''}`}>
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

                      {ex && (
                        <div className={styles.reviewPreview}>
                          <p className={styles.reviewPreviewComment}>"{ex.comment}"</p>
                          <span className={styles.reviewPreviewDate}>{ex.createdAt}</span>
                        </div>
                      )}

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
                { id:'firstName', label:'First Name',    icon:'👤', ph:'First name' },
                { id:'lastName',  label:'Last Name',     icon:'👤', ph:'Last name' },
                { id:'email',     label:'Email',         icon:'✉️', ph:'Email address', disabled: true },
                { id:'phone',     label:'Mobile Number', icon:'📱', ph:'10-digit number' },
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

              <div className={styles.modalField}>
                <label className={styles.modalLabel}>Overall Rating *</label>
                <StarRating
                  value={reviewDraft.rating}
                  onChange={v => setReviewDraft(d => ({ ...d, rating: v }))}
                  size="lg" />
              </div>

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
                  <span style={{ color: reviewDraft.comment.length < 10 ? '#ff4444' : '#bbb' }}>
                    {reviewDraft.comment.length < 10 && reviewDraft.comment.length > 0
                      ? `${10 - reviewDraft.comment.length} more characters needed`
                      : `${reviewDraft.comment.length}/500`}
                  </span>
                </div>
              </div>

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