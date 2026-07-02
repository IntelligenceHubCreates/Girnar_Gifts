'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import Link from 'next/link';
import styles from './AccountPage.module.css';
import { _post, _get } from '@/shared/fetchwrapper';
import { signOut, useSession } from 'next-auth/react';
import { useCart } from '@/context/CartContext';
import MobileAccountMenu from './Mobileaccountmenu';
import { fetchPublicCoupons, type PublicCoupon } from '@/lib/couponsApi';
import { MobileDashboard, MobileOrders, MobileWishlist, MobileAddresses, MobileReviews, MobileProfile, MobileCoupons, MobileHelp, MobileNotifications } from './Mobileaccounttabs';
import ReturnModal from '@/components/pages/account/ReturnModal';
import { RETURN_STATUS_LABEL, RETURN_STATUS_COLOR, RETURN_REASON_LABEL, type ReturnSummary } from '@/lib/returnsApi';

/* ─── Types ──────────────────────────────────────────────────────── */
type Tab = 'overview' | 'orders' | 'wishlist' | 'addresses' | 'coupons' | 'reviews' | 'settings' | 'notifications' | 'help';

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
  category?: string;    /* e.g. 'Toys', 'All', 'Stationery' */
  maxDiscount?: number; /* cap for percent coupons */
  highlight?: boolean;  /* featured/best coupon */
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

/* Map a UI address type to the backend address_type value. */
function toBackendAddressType(t: 'Home' | 'Office' | 'Other'): string {
  return t === 'Office' ? 'work' : t === 'Other' ? 'other' : 'home';
}

/* Build the full address payload the backend (AddressCreate) requires.
   The backend validates ALL of these as required, so partial bodies 422. */
function buildAddressBody(src: {
  name: string; phone: string; line1: string; line2: string;
  city: string; state: string; pincode: string;
  type: 'Home' | 'Office' | 'Other'; isDefault: boolean;
}) {
  return {
    full_name:     src.name,
    phone:         src.phone,
    address_line1: src.line1,
    address_line2: src.line2 || '',
    city:          src.city,
    state:         src.state,
    postal_code:   src.pincode,
    country:       'India',
    address_type:  toBackendAddressType(src.type),
    is_default:    src.isDefault,
  };
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

/* ─── Product helpers ────────────────────────────────────────────── */
/* FIX: now handles product_image as a plain string OR object OR array,
   instead of discarding any non-array value to PLACEHOLDER. */
function getProductImage(product: any): string {
  const raw = product?.product_image;
  if (!raw) return PLACEHOLDER;
  if (Array.isArray(raw)) {
    const f = raw[0];
    if (!f) return PLACEHOLDER;
    if (typeof f === 'string') return f || PLACEHOLDER;
    return f?.url ?? f?.secure_url ?? PLACEHOLDER;
  }
  if (typeof raw === 'string') return raw || PLACEHOLDER;
  if (typeof raw === 'object') return raw?.url ?? raw?.secure_url ?? PLACEHOLDER;
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

function mapPublicCoupon(c: PublicCoupon): Coupon {
  const isPct = c.discount_type === 'percentage';
  const desc = isPct
    ? `${c.discount_value}% off${c.min_order ? ` on orders above ₹${c.min_order}` : ''}`
    : `Flat ₹${c.discount_value} off${c.min_order ? ` on orders above ₹${c.min_order}` : ''}`;
  return {
    id:       c.id,
    code:     c.code,
    discount: c.discount_value,
    type:     isPct ? 'percent' : 'flat',
    minOrder: c.min_order ?? 0,
    // /public already filters out expired; fall back to a far date when null (never-expires)
    expiry:   c.expires_at ? c.expires_at.split('T')[0] : '2099-12-31',
    used:     false,            // ⚠️ backend has no per-user redemption data — see note
    description: desc,
    category: 'All',
  };
}

function mapOrder(o: any): MappedOrder {
  /* FIX: defensive fallback for the order-items field name. */
  const items = o.order_items ?? o.items ?? o.order_item ?? [];
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
    backendId: a.id != null ? String(a.id) : undefined,
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
   NOTIFICATIONS TAB COMPONENT
═══════════════════════════════════════════════════════════════════ */

/* ── Static notification data ──────────────────────────────────── */
const NOTIF_CHANNELS = [
  {
    id: 'ch_orders',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/>
        <rect x="9" y="3" width="6" height="4" rx="1"/>
      </svg>
    ),
    color: '#3b82f6', bg: '#eff6ff',
    title: 'Order Updates',
    sub: 'Shipping, delivery confirmations and status changes',
    defaultOn: true,
  },
  {
    id: 'ch_offers',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 12v10H4V12"/><path d="M22 7H2v5h20V7z"/><path d="M12 22V7"/>
        <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/>
        <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/>
      </svg>
    ),
    color: '#f59e0b', bg: '#fffbeb',
    title: 'Offers & Promotions',
    sub: 'Flash sales, coupons and exclusive deals',
    defaultOn: true,
  },
  {
    id: 'ch_wishlist',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
      </svg>
    ),
    color: '#f43f5e', bg: '#fff1f2',
    title: 'Wishlist Price Drops',
    sub: 'Alert when a wishlisted product goes on sale',
    defaultOn: false,
  },
  {
    id: 'ch_reviews',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
      </svg>
    ),
    color: '#a855f7', bg: '#faf5ff',
    title: 'Review Reminders',
    sub: 'Nudge to review your delivered products',
    defaultOn: true,
  },
  {
    id: 'ch_whatsapp',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/>
      </svg>
    ),
    color: '#25d366', bg: '#f0fdf4',
    title: 'WhatsApp Notifications',
    sub: 'Order alerts and reminders via WhatsApp',
    defaultOn: false,
  },
  {
    id: 'ch_newsletter',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
        <polyline points="22,6 12,13 2,6"/>
      </svg>
    ),
    color: '#6366f1', bg: '#eef2ff',
    title: 'Weekly Newsletter',
    sub: 'New arrivals, tips and parenting picks every week',
    defaultOn: true,
  },
];

/* Fake in-app notifications generated from real order/wishlist data */
function buildInAppNotifications(orders: MappedOrder[], favs: any[]): Array<{
  id: string; type: string; title: string; body: string;
  time: string; read: boolean; icon: string; color: string;
}> {
  const now   = Date.now();
  const items: Array<{
    id: string; type: string; title: string; body: string;
    time: string; read: boolean; icon: string; color: string;
  }> = [];

  /* From orders */
  orders.slice(0, 3).forEach((o, i) => {
    const sk = o.status.toLowerCase().replace(/ /g, '_');
    const iconMap: Record<string, string> = { delivered:'✅', shipped:'🚚', processing:'⏳', cancelled:'❌' };
    const colorMap: Record<string, string> = { delivered:'#10b981', shipped:'#3b82f6', processing:'#f59e0b', cancelled:'#f43f5e' };
    items.push({
      id:    `order-${o.id}`,
      type:  'order',
      title: `Order ${o.status}`,
      body:  `Your order #${o.id.slice(0,8).toUpperCase()} — ${o.name} is ${o.status.toLowerCase()}.`,
      time:  o.date,
      read:  i > 0,
      icon:  iconMap[sk] ?? '📦',
      color: colorMap[sk] ?? '#6b7280',
    });
  });

  /* Wishlist price drop (simulated) */
  if (favs.length > 0) {
    const p = favs[0]?.product;
    if (p) items.push({
      id:    `wishlist-drop-${p.id}`,
      type:  'wishlist',
      title: 'Price Drop Alert! 🎉',
      body:  `${p.name} is now cheaper. Grab it before it sells out!`,
      time:  new Date(now - 86400000).toLocaleDateString('en-IN', { day:'2-digit', month:'short' }),
      read:  false,
      icon:  '❤️',
      color: '#f43f5e',
    });
  }

  /* Welcome/generic */
  items.push({
    id:    'welcome',
    type:  'system',
    title: 'Welcome to LittleLoot! 🧸',
    body:  'Your account is all set. Start exploring toys, bags and stationery for your little ones.',
    time:  'Just now',
    read:  true,
    icon:  '🧸',
    color: '#FF6B35',
  });

  return items;
}

function NotificationsTab({
  orders, profile, showToast, setTab, token,
}: {
  orders: MappedOrder[];
  profile: typeof EMPTY_PROFILE;
  showToast: (msg: string) => void;
  setTab: (t: Tab) => void;
  token?: string | null;
}) {
  /* ── Channel preference state ───────────────────────────────────
     Hydration-safe: seed with defaults on first render (server + client
     match), then read localStorage in an effect after mount. */
  const [channels, setChannels] = useState<Record<string, boolean>>(() => {
    const seed: Record<string, boolean> = {};
    NOTIF_CHANNELS.forEach(ch => { seed[ch.id] = ch.defaultOn; });
    return seed;
  });
  const [quietFrom, setQuietFrom]       = useState('22:00');
  const [quietUntil, setQuietUntil]     = useState('08:00');
  const [quietEnabled, setQuietEnabled] = useState(false);

  useEffect(() => {
    /* Read persisted prefs only on the client, post-mount, to avoid
       hydration mismatch warnings. */
    setChannels(prev => {
      const next = { ...prev };
      NOTIF_CHANNELS.forEach(ch => {
        try {
          const v = localStorage.getItem(ch.id);
          if (v !== null) next[ch.id] = v === 'true';
        } catch { /* ignore */ }
      });
      return next;
    });
    try {
      const f = localStorage.getItem('quiet_from');   if (f) setQuietFrom(f);
      const u = localStorage.getItem('quiet_until');  if (u) setQuietUntil(u);
      const e = localStorage.getItem('quiet_enabled'); if (e !== null) setQuietEnabled(e === 'true');
    } catch { /* ignore */ }
  }, []);

const [notifFilter, setNotifFilter] = useState<'all' | 'unread'>('all');
  const [notifications, setNotifications] = useState<Array<{
    id: string; type: string; title: string; body: string; time: string; read: boolean; icon: string; color: string;
  }>>([]);

  /* Phase 14: real notifications from the backend (replaces client-generated list). */
  useEffect(() => {
    let alive = true;
    import('@/lib/notificationsApi').then(({ fetchMyNotifications, NOTIF_TYPE_STYLE }) => {
      fetchMyNotifications(token, { limit: 40 }).then(res => {
        if (!alive) return;
        setNotifications(res.data.map(n => {
          const st = NOTIF_TYPE_STYLE[n.type] ?? NOTIF_TYPE_STYLE.system;
          return {
            id: n.id, type: n.type, title: n.title, body: n.body || '',
            time: new Date(n.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
            read: n.is_read, icon: st.icon, color: st.color,
          };
        }));
      }).catch(() => { if (alive) setNotifications([]); });
    });
    return () => { alive = false; };
  }, [token]);

  const unreadCount = notifications.filter(n => !n.read).length;
  const filtered    = notifFilter === 'unread'
    ? notifications.filter(n => !n.read)
    : notifications;

  const toggleChannel = (id: string, val: boolean) => {
    setChannels(p => ({ ...p, [id]: val }));
    try { localStorage.setItem(id, String(val)); } catch { /* ignore */ }
    const ch = NOTIF_CHANNELS.find(c => c.id === id);
    showToast(val ? `🔔 ${ch?.title} enabled` : `🔕 ${ch?.title} disabled`);
  };

const markAllRead = () => {
    setNotifications(p => p.map(n => ({ ...n, read: true })));
    import('@/lib/notificationsApi').then(({ markAllNotificationsRead }) => markAllNotificationsRead(token));
  };
  const deleteNotif = (id: string) => setNotifications(p => p.filter(n => n.id !== id)); /* local dismiss only */
  const markRead    = (id: string) => {
    setNotifications(p => p.map(n => n.id === id ? { ...n, read: true } : n));
    import('@/lib/notificationsApi').then(({ markNotificationRead }) => markNotificationRead(id, token));
  };

  return (
    <div className={styles.settingsWrap}>

      {/* ── In-App Notifications ────────────────────────────────── */}
      <div className={styles.settingsSection}>
        <div className={styles.settingsSectionHeader}>
          <div>
            <div className={styles.settingsSectionTitle}>
              <span className={styles.settingsSectionIcon} style={{ background:'#fff7ed' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FF6B35" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
              </span>
              Notifications
              {unreadCount > 0 && (
                <span className={styles.notifUnreadBadge}>{unreadCount} new</span>
              )}
            </div>
            <div className={styles.settingsSectionSub}>Your recent activity and alerts</div>
          </div>
          <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
            {/* Filter pills */}
            <div className={styles.notifFilterRow}>
              <button type="button"
                className={`${styles.notifFilterBtn} ${notifFilter === 'all' ? styles.notifFilterActive : ''}`}
                onClick={() => setNotifFilter('all')}>
                All ({notifications.length})
              </button>
              <button type="button"
                className={`${styles.notifFilterBtn} ${notifFilter === 'unread' ? styles.notifFilterActive : ''}`}
                onClick={() => setNotifFilter('unread')}>
                Unread {unreadCount > 0 && `(${unreadCount})`}
              </button>
            </div>
            {unreadCount > 0 && (
              <button type="button" className={styles.notifMarkAllBtn} onClick={markAllRead}>
                Mark all read
              </button>
            )}
          </div>
        </div>

        {/* Notification list */}
        {filtered.length === 0 ? (
          <div className={styles.notifEmpty}>
            <div className={styles.notifEmptyIcon}>🔔</div>
            <div className={styles.notifEmptyText}>
              {notifFilter === 'unread' ? "You're all caught up! No unread notifications." : "No notifications yet."}
            </div>
          </div>
        ) : (
          <div className={styles.notifList}>
            {filtered.map(n => (
              <div key={n.id}
                className={`${styles.notifItem} ${!n.read ? styles.notifItemUnread : ''}`}
                onClick={() => markRead(n.id)}>
                <div className={styles.notifItemIcon}
                  style={{ background: n.color + '18', color: n.color }}>
                  {n.icon}
                </div>
                <div className={styles.notifItemBody}>
                  <div className={styles.notifItemTitle}>
                    {n.title}
                    {!n.read && <span className={styles.notifDot} />}
                  </div>
                  <div className={styles.notifItemText}>{n.body}</div>
                  <div className={styles.notifItemTime}>{n.time}</div>
                </div>
                <div className={styles.notifItemActions}>
                  {n.type === 'order' && (
                    <button type="button" className={styles.notifActionLink}
                      onClick={e => { e.stopPropagation(); setTab('orders'); }}>
                      View
                    </button>
                  )}
                  {n.type === 'wishlist' && (
                    <button type="button" className={styles.notifActionLink}
                      onClick={e => { e.stopPropagation(); setTab('wishlist'); }}>
                      View
                    </button>
                  )}
                  <button type="button" className={styles.notifDeleteBtn}
                    onClick={e => { e.stopPropagation(); deleteNotif(n.id); }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── WhatsApp quick-setup (if phone not set) ─────────────── */}
      {!profile.phone && (
        <div className={styles.notifWhatsAppBanner}>
          <div className={styles.notifWaBannerIcon}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="#25d366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/></svg>
          </div>
          <div style={{ flex:1 }}>
            <div className={styles.notifWaBannerTitle}>Enable WhatsApp Notifications</div>
            <div className={styles.notifWaBannerSub}>Add your phone number to get order updates instantly on WhatsApp</div>
          </div>
          <button type="button" className={styles.notifWaBannerBtn}
            onClick={() => setTab('settings')}>
            Add Phone →
          </button>
        </div>
      )}

      {/* ── Channel preferences ─────────────────────────────────── */}
      <div className={styles.settingsSection}>
        <div className={styles.settingsSectionHeader}>
          <div>
            <div className={styles.settingsSectionTitle}>
              <span className={styles.settingsSectionIcon} style={{ background:'#f0fdf4' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.4 2 2 0 0 1 3.6 1.22h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.86a16 16 0 0 0 6 6l.95-.96a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21.77 16.92z"/></svg>
              </span>
              Notification Channels
            </div>
            <div className={styles.settingsSectionSub}>Choose exactly what you want to hear about</div>
          </div>
        </div>

        <div className={styles.notifChannelList}>
          {NOTIF_CHANNELS.map(ch => (
            <div key={ch.id} className={styles.notifChannelRow}>
              <div className={styles.notifChannelLeft}>
                <div className={styles.notifChannelIcon}
                  style={{ background: ch.bg, color: ch.color }}>
                  {ch.icon}
                </div>
                <div>
                  <div className={styles.notifChannelTitle}>{ch.title}</div>
                  <div className={styles.notifChannelSub}>{ch.sub}</div>
                </div>
              </div>
              <label className={styles.settingsToggle}>
                <input type="checkbox"
                  checked={channels[ch.id] ?? ch.defaultOn}
                  onChange={e => toggleChannel(ch.id, e.target.checked)} />
                <span className={styles.settingsToggleSlider} />
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* ── Quiet Hours ─────────────────────────────────────────── */}
      <div className={styles.settingsSection}>
        <div className={styles.settingsSectionHeader} style={{ marginBottom:0 }}>
          <div>
            <div className={styles.settingsSectionTitle}>
              <span className={styles.settingsSectionIcon} style={{ background:'#f5f3ff' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              </span>
              Quiet Hours
            </div>
            <div className={styles.settingsSectionSub}>Pause all notifications during these hours</div>
          </div>
        </div>

        <div className={styles.notifQuietRow}>
          <div className={styles.notifQuietField}>
            <label className={styles.settingsLabel}>From</label>
            <input type="time" className={styles.settingsInput}
              value={quietFrom}
              onChange={e => { setQuietFrom(e.target.value); try { localStorage.setItem('quiet_from', e.target.value); } catch {} showToast('🌙 Quiet hours updated'); }} />
          </div>
          <div className={styles.notifQuietSep}>to</div>
          <div className={styles.notifQuietField}>
            <label className={styles.settingsLabel}>Until</label>
            <input type="time" className={styles.settingsInput}
              value={quietUntil}
              onChange={e => { setQuietUntil(e.target.value); try { localStorage.setItem('quiet_until', e.target.value); } catch {} showToast('🌙 Quiet hours updated'); }} />
          </div>
          <div className={styles.notifQuietToggleWrap}>
            <label className={styles.settingsLabel}>Enable</label>
            <label className={styles.settingsToggle}>
              <input type="checkbox"
                checked={quietEnabled}
                onChange={e => { setQuietEnabled(e.target.checked); try { localStorage.setItem('quiet_enabled', String(e.target.checked)); } catch {} showToast(e.target.checked ? '🌙 Quiet hours enabled' : '🔔 Quiet hours disabled'); }} />
              <span className={styles.settingsToggleSlider} />
            </label>
          </div>
        </div>
      </div>

    </div>
  );
}
/* ═══════════════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════════════ */
export default function AccountPage() {
  const { data: session, status } = useSession();
   const { dispatch } = useCart();

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
  const [coupons,        setCoupons]        = useState<Coupon[]>([]);
  const [couponsLoading, setCouponsLoading] = useState(true);
  const [copiedCode,    setCopiedCode]    = useState('');
  const [applyInput,    setApplyInput]    = useState('');
  const [applyLoading,  setApplyLoading]  = useState(false);
  const [couponFilter,  setCouponFilter]  = useState<'all'|'active'|'used'|'expired'>('active');
  const [orderFilter,   setOrderFilter]   = useState<'all'|'processing'|'shipped'|'delivered'|'cancelled'>('all');
  const [orderSearch,   setOrderSearch]   = useState('');
  const [expandedOrder,    setExpandedOrder]    = useState<string | null>(null);
  const [wishlistSearch,   setWishlistSearch]   = useState('');
  const [wishlistSort,     setWishlistSort]     = useState<'default'|'price_asc'|'price_desc'|'name'>('default');
  const [wishlistSelected, setWishlistSelected] = useState<Set<string>>(new Set());
  const [wishlistView,     setWishlistView]     = useState<'grid'|'list'>('grid');
  const [mobileDash, setMobileDash] = useState(false);

  /* Orders pagination */
  const [ordersPage, setOrdersPage] = useState(1);
  const ORDERS_PER_PAGE = 6;

  /* review state */
  const [reviews,          setReviews]          = useState<Review[]>([]);
  const [showReviewModal,  setShowReviewModal]   = useState(false);
  const [reviewTarget,     setReviewTarget]      = useState<ReviewableProduct | null>(null);
  const [reviewDraft,      setReviewDraft]       = useState({ rating: 5, comment: '', title: '' });
  const [reviewSaving,     setReviewSaving]      = useState(false);
  const [reviewFilter,     setReviewFilter]      = useState<'all' | 'pending'>('all');
  const [waReminderSent,   setWaReminderSent]    = useState<Set<string>>(new Set());
  const [confirmCancelId, setConfirmCancelId] = useState<string | null>(null);
  const [cancellingId,    setCancellingId]    = useState<string | null>(null);

    /* returns (Phase 13) */
  const [returns,          setReturns]          = useState<ReturnSummary[]>([]);
  const [returnModalOrder, setReturnModalOrder] = useState<MappedOrder | null>(null);
  const [viewReturnId,     setViewReturnId]     = useState<string | null>(null);

  const carouselRef    = useRef<HTMLDivElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  /* Guards against setting state after unmount (avoids memory-leak warnings). */
  const mountedRef     = useRef(true);

  /* localAvatar — hydration-safe: start null on server + first client render,
     then hydrate from localStorage in an effect after mount. */
  const [localAvatar,     setLocalAvatar]     = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);

  /* Stable per-user identifier — namespaces the cached avatar so one account's
     photo can NEVER appear for a different account on the same browser. */
  const userKey = session?.user?.email ?? null;

  useEffect(() => { setMobileDash(false); }, [tab]);

  useEffect(() => {
    mountedRef.current = true;
    /* One-time migration: delete the OLD global key. That single shared key is
       exactly what made every user on a shared browser see the last person's photo. */
    try { localStorage.removeItem('ll_avatar'); } catch { /* ignore */ }
    return () => { mountedRef.current = false; };
  }, []);

  /* Load (or clear) the avatar cached for THIS user whenever the signed-in
     identity changes. A new / uncached user => null => falls through to the
     backend image, then the Google image, then initials. */
  useEffect(() => {
    if (!userKey) { setLocalAvatar(null); return; }
    try {
      const saved = localStorage.getItem(`ll_avatar:${userKey}`);
      setLocalAvatar(saved || null);
    } catch { setLocalAvatar(null); }
  }, [userKey]);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => { if (mountedRef.current) setToast(''); }, 3500);
  }, []);

  const token = (session as any)?.backendToken as string | undefined;

  /* Logout cleanup — drop this user's cached photo before signing out so a
     shared device retains nothing. */
  const handleSignOut = useCallback(() => {
    try { if (userKey) localStorage.removeItem(`ll_avatar:${userKey}`); } catch { /* ignore */ }
    signOut({ callbackUrl: '/login' });
  }, [userKey]);




  /* ── dataURL → Blob (no secondary fetch, pure canvas) ───────────── */
  const dataUrlToBlob = (dataUrl: string): Blob => {
    const [header, data] = dataUrl.split(',');
    const mime = header.match(/:(.*?);/)?.[1] ?? 'image/jpeg';
    const bytes = atob(data);
    const arr   = new Uint8Array(bytes.length);
    for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
    return new Blob([arr], { type: mime });
  };

  /* ── Avatar upload handler ─────────────────────────────────────── */
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

      /* Step 2: optimistic — show + persist base64 so it survives refresh
         even if the upload fails. */
      setLocalAvatar(dataUrl);
      if (userKey) { try { localStorage.setItem(`ll_avatar:${userKey}`, dataUrl); } catch { /* ignore quota */ } }

      if (!token) {
        showToast('✅ Profile photo updated!');
        if (mountedRef.current) setAvatarUploading(false);
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
          headers: authHeaders(token), // do NOT set Content-Type — browser sets multipart boundary
          body: form,
        });
        if (res.ok) {
          const data = await res.json().catch(() => ({}));
          serverUrl = data?.url || data?.profile_picture || data?.avatar_url || '';
        }
      } catch { /* network error — base64 fallback already persisted */ }

      if (!mountedRef.current) return;

      if (serverUrl && serverUrl.startsWith('http')) {
        setLocalAvatar(serverUrl);
        if (userKey) { try { localStorage.setItem(`ll_avatar:${userKey}`, serverUrl); } catch { /* ignore */ } }
        setProfile(p => ({ ...p, backendAvatar: serverUrl }));
        setDraft(p =>   ({ ...p, backendAvatar: serverUrl }));
        showToast('✅ Profile photo saved!');
      } else {
        showToast('📸 Photo saved locally (server sync pending).');
      }
    } catch {
      showToast('❌ Could not process image. Try another file.');
    }

    if (mountedRef.current) setAvatarUploading(false);
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
    setProfile(s); setDraft(s);
  }, [session, status]);

  /* ── Fetch all data ────────────────────────────────────────────────
     Single effect keyed on token/status. AbortController prevents
     state updates from stale in-flight requests (race conditions). */
  useEffect(() => {
    if (status === 'loading') return;
    if (status !== 'authenticated') { setProfileLoading(false); return; }

    const controller = new AbortController();
    const { signal } = controller;
    const ah = authHeaders(token);

    /* Profile — relative path + Bearer (works for both cookie & NextAuth) */
    const loadProfile = async () => {
      try {
        const r = await fetch('/api/user/profile', {
          headers: { ...ah, 'Content-Type': 'application/json' },
          cache: 'no-store',
          signal,
        });
        if (!r.ok) return;
        const res: any = await r.json();
        if (!res || res.error || res.detail) return;
        const parts = (res.name || '').trim().split(' ');
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
        if (!mountedRef.current) return;
        setProfile(m); setDraft(m);
        if (serverAvatar && serverAvatar.startsWith('http')) {
          /* Backend is the source of truth; keep a just-uploaded data: URL only
             until the server copy is confirmed. Cache under THIS user's key. */
          setLocalAvatar(prev => (prev && prev.startsWith('data:')) ? prev : serverAvatar);
          if (userKey) { try { localStorage.setItem(`ll_avatar:${userKey}`, serverAvatar); } catch { /* ignore */ } }
        }
      } catch { /* aborted or network error */ }
    };

    const loadCoupons = async () => {
      try {
        const list = await fetchPublicCoupons(signal);
        if (mountedRef.current) setCoupons(list.map(mapPublicCoupon));
      } catch { /* leave empty */ }
      finally { if (mountedRef.current) setCouponsLoading(false); }
    };

    const loadOrders = async () => {
      try {
        const r = await fetch('/api/orders', { headers: ah, signal });
        if (!r.ok) return;
        const res: any = await r.json();
        const raw = Array.isArray(res) ? res : (res?.orders || res?.data || []);
        if (mountedRef.current && raw.length) setOrders(raw.map(mapOrder));
      } catch { /* ignore */ }
    };

    const loadFavs = async () => {
      try {
        const r = await fetch('/api/favorite', { headers: ah, signal });
        if (!r.ok) return;
        const res: any = await r.json();
        const rawList = Array.isArray(res) ? res : (res?.favorites ?? res?.data ?? []);
        /* Normalise to { product, favorite_id } shape regardless of backend variant */
        const normalized = rawList.map((item: any) =>
          item?.product ? item : { product: item, favorite_id: item?.id }
        );
        if (mountedRef.current) setFavs(normalized);
      } catch { /* ignore */ }
    };

    const loadFeatured = async () => {
      try {
        const res: any = await _get('/api/product/featured', { signal });
        const list = (Array.isArray(res) ? res : (res?.data || [])).slice(0, 8);
        if (mountedRef.current) setFeatured(list);
      } catch { /* ignore */ }
    };

    const loadAddresses = async () => {
      if (mountedRef.current) setAddrLoading(true);
      try {
        const r = await fetch('/api/address/addresses', { headers: ah, signal });
        if (!r.ok) return;
        const res: any = await r.json();
        const addrs: any[] = Array.isArray(res) ? res : (res?.addresses || res?.data || []);
        if (mountedRef.current) setAddresses(addrs.map(mapBackendAddress));
      } catch { /* ignore */ }
      finally { if (mountedRef.current) setAddrLoading(false); }
    };

    const loadReviews = async () => {
      try {
        /* FIX: correct backend prefix is /api/rating (not /api/reviews) */
        const r = await fetch('/api/rating/user', { headers: ah, signal });
        if (!r.ok) return; /* 404/501 → reviews unavailable, fail silently */
        const res: any = await r.json();
        const raw = Array.isArray(res) ? res : (res?.reviews || []);
        if (!mountedRef.current) return;
        setReviews(raw.map((rv: any) => ({
          id:           String(rv.id),
          productId:    String(rv.product_id),
          productName:  rv.product?.name || 'Product',
          productImage: getProductImage(rv.product),
          rating:       Number(rv.rating),
          comment:      rv.comment || '',
          createdAt:    new Date(rv.created_at || Date.now())
                          .toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' }),
          orderId:      String(rv.order_id || ''),
          helpful:      Number(rv.helpful_count || 0),
        })));
      } catch { /* ignore */ }
    };

        const loadReturns = async () => {
      try {
        const r = await fetch('/api/returns/my', { headers: ah, signal });
        if (!r.ok) return;
        const res: any = await r.json();
        const list = Array.isArray(res) ? res : (res?.data ?? []);
        if (mountedRef.current) setReturns(list);
      } catch { /* ignore */ }
    };

    /* Run all, then drop the loading gate once profile resolves. */
    (async () => {
      await Promise.allSettled([
        loadProfile(), loadOrders(), loadFavs(),
        loadFeatured(), loadAddresses(), loadReviews(), loadReturns(), loadCoupons(),
      ]);
      if (mountedRef.current) setProfileLoading(false);
    })();

    return () => controller.abort();
  }, [session, status, token, userKey]);

  /* ── Profile save ──────────────────────────────────────────────── */
  const handleSave = async () => {
    if (!token) {
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
    if (draft.dob)    payload.dob    = draft.dob;
    if (draft.gender) payload.gender = draft.gender;

    let saved = false;
    let serverError = '';

    /* Relative path + Bearer — header-aware backend (no env-var branching) */
    const profileUrl = '/api/user/profile';

    try {
      const res = await fetch(profileUrl, {
        method: 'PUT',
        headers: { ...authHeaders(token), 'Content-Type': 'application/json' },
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

    if (!saved) {
      try {
        const res = await fetch(profileUrl, {
          method: 'PATCH',
          headers: { ...authHeaders(token), 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (res.ok) saved = true;
      } catch { /* ignore */ }
    }

    setProfile({ ...draft });
    setEditing(false);
    showToast(saved ? '✅ Profile saved successfully!' : `⚠️ Saved locally but server error: ${serverError || 'Unknown error'}`);
  };

  const cancelOrder = useCallback(async (orderId: string) => {
  setCancellingId(orderId);
  try {
    const r = await fetch(`/api/orders/${orderId}/cancel`, {
      method: 'PATCH',
      headers: jsonHeaders(token),
    });
    if (!r.ok) throw new Error('cancel failed');
    setOrders(prev => prev.map(o =>
      o.id === orderId ? { ...o, status: 'Cancelled' } : o
    ));
    showToast('✅ Order cancelled');
  } catch {
    showToast('⚠️ Could not cancel order — please try again.');
  } finally {
    setCancellingId(null);
    setConfirmCancelId(null);
  }
}, [token, showToast]);

 /* ── Wishlist add to cart ──────────────────────────────────────── */
  const addToCart = useCallback(async (e: React.MouseEvent, product: any) => {
    e.preventDefault(); e.stopPropagation();
    const id = String(product.id);
    if (cartStates[id] === 'loading') return;
    setCartStates(p => ({ ...p, [id]: 'loading' }));

    /* Same shape ProductPage dispatches — keeps one source of truth */
    const price = getSellingPrice(product);
    const orig  = Number(product.original_price ?? 0);
    const img   = getProductImage(product);
    const stock = Number(product.count ?? 0);

    /* Optimistic global update → Header + MobileBottomNav badges update instantly */
    dispatch({
      type: 'ADD_ITEM',
      payload: {
        id:            product.id,
        name:          product.name,
        price,
        originalPrice: orig,
        quantity:      1,
        image:         img,
        emoji:         '🎁',
        bgGradient:    '',
        category:      product.category ?? '',
        color:         '',
        product_count: stock,
        is_available:  stock > 0,
      },
    });

    try {
      await _post('/api/cart/items', { product_id: product.id, quantity: 1 }, { token });
      setCartStates(p => ({ ...p, [id]: 'added' }));
      showToast(`🛒 ${product.name} added!`);
      setTimeout(() => { if (mountedRef.current) setCartStates(p => ({ ...p, [id]: 'idle' })); }, 2000);
    } catch {
      /* Roll back the optimistic add so the badge stays accurate */
      dispatch({ type: 'REMOVE_ITEM', payload: { id: product.id } });
      setCartStates(p => ({ ...p, [id]: 'error' }));
      setTimeout(() => { if (mountedRef.current) setCartStates(p => ({ ...p, [id]: 'idle' })); }, 2500);
    }
  }, [cartStates, token, showToast, dispatch]);

  /* ── Toggle wishlist (add / remove) ───────────────────────────── */
  const toggleWishlist = useCallback(async (e: React.MouseEvent, product: any) => {
    e.preventDefault(); e.stopPropagation();
    const id       = String(product.id);
    const isInFavs = favs.some(f => String(f.product?.id) === id);

    if (isInFavs) {
      /* Optimistic remove */
      setFavs(prev => prev.filter(f => String(f.product?.id) !== id));
      try {
        const res = await fetch(`/api/favorite/${id}`, { method: 'DELETE', headers: authHeaders(token) });
        if (!res.ok && res.status !== 404) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err?.detail || `HTTP ${res.status}`);
        }
      } catch {
        /* Rollback on failure */
        setFavs(prev => [...prev, { product }]);
        showToast('❌ Could not remove from wishlist.');
      }
    } else {
      /* Optimistic add */
      setFavs(prev => [...prev, { product }]);
      showToast('❤️ Added to wishlist!');
      try {
        const res = await fetch(`/api/favorite/${id}`, {
          method: 'POST',
          headers: jsonHeaders(token),
        });
        /* 201 created; 400 "already in favorites" is idempotent success */
        if (!res.ok && res.status !== 400) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err?.detail || err?.message || `HTTP ${res.status}`);
        }
        if (res.status === 400) {
          const err = await res.json().catch(() => ({}));
          const detail = String(err?.detail || '').toLowerCase();
          if (detail && !detail.includes('already')) throw new Error(err.detail);
        }
      } catch (err: any) {
        /* Rollback on failure */
        setFavs(prev => prev.filter(f => String(f.product?.id) !== id));
        showToast(`❌ Could not add to wishlist: ${err?.message || 'Unknown error'}`);
      }
    }
  }, [favs, token, showToast]);

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
    if (!res.ok) throw new Error(`Failed to reload addresses (${res.status})`);
    const data = await res.json();
    const arr: any[] = Array.isArray(data) ? data : (data?.addresses || data?.data || []);
    if (mountedRef.current) setAddresses(arr.map(mapBackendAddress));
  };

    const reloadReturns = async () => {
    try {
      const res = await fetch('/api/returns/my', { headers: authHeaders(token) });
      if (!res.ok) return;
      const data = await res.json();
      const list: any[] = Array.isArray(data) ? data : (data?.data ?? []);
      if (mountedRef.current) setReturns(list);
    } catch { /* ignore */ }
  };

  const handleAddrSave = async () => {
    if (!validateAddr()) return;
    setAddrSaving(true);
    const body = buildAddressBody(addrForm);
    try {
      const url = editingAddr?.backendId
        ? `/api/address/addresses/${editingAddr.backendId}`
        : '/api/address/addresses';
      const method = editingAddr?.backendId ? 'PUT' : 'POST';

      const res = await fetch(url, { method, headers: jsonHeaders(token), body: JSON.stringify(body) });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        const detail = Array.isArray(err?.detail)
          ? err.detail.map((d: any) => d?.msg).filter(Boolean).join(', ')
          : err?.detail || err?.message || `HTTP ${res.status}`;
        throw new Error(detail);
      }

      showToast(editingAddr?.backendId ? '📍 Address updated!' : '📍 Address added!');
      await reloadAddresses();
      /* Close + reset only on success — failed save keeps modal open. */
      setShowAddrModal(false);
      setEditingAddr(null);
      setAddrForm(EMPTY_ADDR);
      setAddrErrors({});
    } catch (err: any) {
      showToast(`❌ Could not save address: ${err?.message || 'Unknown error'}`);
    } finally {
      if (mountedRef.current) setAddrSaving(false);
    }
  };

  const handleAddrDelete = async (addr: Address) => {
    const prev = addresses;
    setAddresses(p => p.filter(a => a.id !== addr.id));
    showToast('🗑️ Address removed');
    if (addr.backendId) {
      try {
        const res = await fetch(`/api/address/addresses/${addr.backendId}`, { method:'DELETE', headers:authHeaders(token) });
        if (!res.ok && res.status !== 404) throw new Error(`HTTP ${res.status}`);
      } catch {
        setAddresses(prev); /* rollback */
        showToast('❌ Could not remove address.');
      }
    }
  };

  const handleSetDefault = async (addr: Address) => {
    const prev = addresses;
    /* Optimistic UI */
    setAddresses(p => p.map(a => ({ ...a, isDefault: a.id === addr.id })));

    if (!addr.backendId) { showToast('✅ Default address updated'); return; }

    try {
      /* FIX: backend PUT requires the FULL AddressCreate body, not { is_default } */
      const body = { ...buildAddressBody(addr), is_default: true };
      const res = await fetch(`/api/address/addresses/${addr.backendId}`, {
        method:'PUT', headers:jsonHeaders(token), body:JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.detail || `HTTP ${res.status}`);
      }
      showToast('✅ Default address updated');
    } catch (err: any) {
      setAddresses(prev); /* rollback */
      showToast(`❌ Could not set default: ${err?.message || 'Unknown error'}`);
    }
  };

  /* ── Coupon copy ───────────────────────────────────────────────── */
  const copyCoupon = (code: string) => {
    try { navigator.clipboard?.writeText(code).catch(() => {}); } catch { /* ignore */ }
    setCopiedCode(code);
    showToast(`🎟️ Coupon ${code} copied!`);
    setTimeout(() => { if (mountedRef.current) setCopiedCode(''); }, 2000);
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
    if (reviewDraft.rating < 1 || reviewDraft.rating > 5) {
      showToast('⚠️ Please select a rating between 1 and 5.'); return;
    }
    setReviewSaving(true);
    const ex = reviews.find(r => r.productId === reviewTarget.productId);
    try {
      if (ex) {
        /* FIX: /api/rating prefix */
        const res = await fetch(`/api/rating/${ex.id}`, {
          method: 'PUT', headers: jsonHeaders(token),
          body: JSON.stringify({ rating: reviewDraft.rating, comment: reviewDraft.comment }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err?.detail || `HTTP ${res.status}`);
        }
        setReviews(p => p.map(r => r.id === ex.id
          ? { ...r, rating: reviewDraft.rating, comment: reviewDraft.comment }
          : r
        ));
        showToast('✅ Review updated!');
      } else {
        const res  = await fetch('/api/rating', {
          method: 'POST', headers: jsonHeaders(token),
          body: JSON.stringify({
            product_id: reviewTarget.productId,
            order_id:   reviewTarget.orderId,
            rating:     reviewDraft.rating,
            comment:    reviewDraft.comment,
          }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err?.detail || `HTTP ${res.status}`);
        }
        const data = await res.json().catch(() => ({}));
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
      setShowReviewModal(false);
      setReviewTarget(null);
    } catch (err: any) {
      showToast(`❌ Could not submit review: ${err?.message || 'Try again'}`);
    } finally {
      if (mountedRef.current) setReviewSaving(false);
    }
  };

  /* ── Review: delete ────────────────────────────────────────────── */
  const handleReviewDelete = async (id: string) => {
    const prev = reviews;
    setReviews(p => p.filter(r => r.id !== id));
    showToast('🗑️ Review deleted');
    try {
      const res = await fetch(`/api/rating/${id}`, { method:'DELETE', headers:authHeaders(token) });
      if (!res.ok && res.status !== 404) throw new Error(`HTTP ${res.status}`);
    } catch {
      setReviews(prev); /* rollback */
      showToast('❌ Could not delete review.');
    }
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
  const returnsByOrder = useMemo(() => {
  const m: Record<string, ReturnSummary[]> = {};
    for (const r of returns) (m[r.order_id] ??= []).push(r);
    return m;
  }, [returns]);

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

  /* Unauthenticated guard — protected route */
  if (status === 'unauthenticated') {
    return (
      <div className={styles.loadingScreen}>
        <p>Please sign in to view your account.</p>
        <Link href="/login" className={styles.emptyBtn} style={{ display:'inline-flex', marginTop:12 }}>
          Go to Login →
        </Link>
      </div>
    );
  }
  /* ════════════════════ RENDER ════════════════════ */
  return (
    <div className={styles.root}>

      {/* ══════════ SIDEBAR ══════════ */}
      <aside className={styles.sidebar}>

        {/* ── Hidden avatar input ── */}
        <input ref={avatarInputRef} type="file" accept="image/*"
          style={{ display:'none' }} onChange={handleAvatarChange} />

        {/* ── Logo (desktop top / mobile inline) ── */}
        <div className={styles.sidebarLogoRow}>
          <div className={styles.sidebarLogoIcon}>🧸</div>
          <div className={styles.sidebarLogoText}>
            <span className={styles.sidebarLogoName}>Little</span>
            <span className={styles.sidebarLogoAccent}>Loot</span>
          </div>
        </div>

        {/* ── Profile card ── */}
        <div className={styles.sbProfile}>
          <div className={styles.sbAvatarWrap} onClick={() => avatarInputRef.current?.click()}>
            {profileImage
              ? <img src={profileImage} alt={displayName} className={styles.sbAvatar} referrerPolicy="no-referrer" />
              : <div className={styles.sbAvatarFallback}>{(displayName[0]||'U').toUpperCase()}</div>
            }
            <div className={styles.sbAvatarOverlay}>
              {avatarUploading
                ? <div className={styles.avatarSpinner} />
                : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
              }
            </div>
            <div className={styles.sbOnlineDot} />
          </div>
          <div className={styles.sbProfileInfo}>
            <div className={styles.sbName}>{displayName}</div>
            <div className={styles.sbEmail}>{displayEmail}</div>
            <button type="button" className={styles.sbEditLink} onClick={() => setTab('settings')}>
              ✏️ Edit Profile
            </button>
          </div>
        </div>

        {/* ── Loot points mini-bar ── */}
        <div className={styles.sbLootBar} onClick={() => setTab('coupons')}>
          <div className={styles.sbLootLeft}>
            <span className={styles.sbLootStar}>⭐</span>
            <div>
              <div className={styles.sbLootLabel}>Loot Points</div>
              <div className={styles.sbLootNum}>320 pts</div>
            </div>
          </div>
          <div className={styles.sbLootProgress}>
            <div className={styles.sbLootTrack}>
              <div className={styles.sbLootFill} style={{ width:'64%' }} />
            </div>
            <div className={styles.sbLootHint}>180 more for ₹250</div>
          </div>
        </div>

        {/* ── Nav sections ── */}
        <nav className={styles.sbNav}>

          {/* MAIN */}
          <div className={styles.sbSection}>
            <div className={styles.sbSectionLabel}>Main</div>

            <button type="button"
              className={`${styles.sbItem} ${tab==='overview' ? styles.sbItemActive : ''}`}
              onClick={() => setTab('overview')}>
              <span className={styles.sbItemIcon} style={{ background: tab==='overview' ? '#fff3ee' : undefined, color: tab==='overview' ? '#FF6B35' : undefined }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
              </span>
              <span className={styles.sbItemLabel}>Dashboard</span>
            </button>

            <button type="button"
              className={`${styles.sbItem} ${tab==='orders' ? styles.sbItemActive : ''}`}
              onClick={() => setTab('orders')}>
              <span className={styles.sbItemIcon} style={{ background: tab==='orders' ? '#eff6ff' : undefined, color: tab==='orders' ? '#3b82f6' : undefined }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/></svg>
              </span>
              <span className={styles.sbItemLabel}>My Orders</span>
              {orders.length > 0 && <span className={`${styles.sbBadge} ${styles.sbBadgeBlue}`}>{orders.length}</span>}
            </button>

            <button type="button"
              className={`${styles.sbItem} ${tab==='wishlist' ? styles.sbItemActive : ''}`}
              onClick={() => setTab('wishlist')}>
              <span className={styles.sbItemIcon} style={{ background: tab==='wishlist' ? '#fff1f2' : undefined, color: tab==='wishlist' ? '#f43f5e' : undefined }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
              </span>
              <span className={styles.sbItemLabel}>Wishlist</span>
              {favs.length > 0 && <span className={`${styles.sbBadge} ${styles.sbBadgeRed}`}>{favs.length}</span>}
            </button>

            <button type="button"
              className={`${styles.sbItem} ${tab==='addresses' ? styles.sbItemActive : ''}`}
              onClick={() => setTab('addresses')}>
              <span className={styles.sbItemIcon} style={{ background: tab==='addresses' ? '#f0fdf4' : undefined, color: tab==='addresses' ? '#10b981' : undefined }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/><circle cx="12" cy="9" r="2.5"/></svg>
              </span>
              <span className={styles.sbItemLabel}>Addresses</span>
              {addresses.length > 0 && <span className={`${styles.sbBadge} ${styles.sbBadgeGreen}`}>{addresses.length}</span>}
            </button>
          </div>

          {/* REWARDS */}
          <div className={styles.sbSection}>
            <div className={styles.sbSectionLabel}>Rewards</div>

            <button type="button"
              className={`${styles.sbItem} ${tab==='coupons' ? styles.sbItemActive : ''}`}
              onClick={() => setTab('coupons')}>
              <span className={styles.sbItemIcon} style={{ background: tab==='coupons' ? '#fffbeb' : undefined, color: tab==='coupons' ? '#f59e0b' : undefined }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 12v10H4V12"/><path d="M22 7H2v5h20V7z"/><path d="M12 22V7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/></svg>
              </span>
              <span className={styles.sbItemLabel}>Coupons</span>
              {activeCoupons > 0 && <span className={`${styles.sbBadge} ${styles.sbBadgeOrange}`}>{activeCoupons}</span>}
            </button>

            <button type="button" className={styles.sbItem}>
              <span className={styles.sbItemIcon} style={{ background:'#f5f3ff', color:'#7c3aed' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/></svg>
              </span>
              <span className={styles.sbItemLabel}>Little Loot Club</span>
              <span className={styles.sbBadgeNew}>New</span>
            </button>
          </div>

          {/* ACTIVITY */}
          <div className={styles.sbSection}>
            <div className={styles.sbSectionLabel}>Activity</div>

            <button type="button"
              className={`${styles.sbItem} ${tab==='reviews' ? styles.sbItemActive : ''}`}
              onClick={() => setTab('reviews')}>
              <span className={styles.sbItemIcon} style={{ background: tab==='reviews' ? '#faf5ff' : undefined, color: tab==='reviews' ? '#a855f7' : undefined }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
              </span>
              <span className={styles.sbItemLabel}>My Reviews</span>
              {pendingReviewProducts.length > 0 && (
                <span className={`${styles.sbBadge} ${styles.sbBadgePurple}`}>{pendingReviewProducts.length}</span>
              )}
            </button>

            <button type="button"
              className={`${styles.sbItem} ${tab==='notifications' ? styles.sbItemActive : ''}`}
              onClick={() => setTab('notifications')}>
              <span className={styles.sbItemIcon} style={{ background: tab==='notifications' ? '#fff7ed' : undefined, color: tab==='notifications' ? '#FF6B35' : undefined }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
              </span>
              <span className={styles.sbItemLabel}>Notifications</span>
            </button>
          </div>

          {/* ACCOUNT */}
          <div className={styles.sbSection}>
            <div className={styles.sbSectionLabel}>Account</div>

            <button type="button"
              className={`${styles.sbItem} ${tab==='settings' ? styles.sbItemActive : ''}`}
              onClick={() => setTab('settings')}>
              <span className={styles.sbItemIcon} style={{ background: tab==='settings' ? '#f8fafc' : undefined, color: tab==='settings' ? '#475569' : undefined }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
              </span>
              <span className={styles.sbItemLabel}>Settings</span>
            </button>

            <button type="button"
              className={`${styles.sbItem} ${tab==='help' ? styles.sbItemActive : ''}`}
              onClick={() => setTab('help')}>
              <span className={styles.sbItemIcon} style={{ background: tab==='help' ? '#f0fdf4' : undefined, color: tab==='help' ? '#10b981' : undefined }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
              </span>
              <span className={styles.sbItemLabel}>Help & Support</span>
            </button>

            <button type="button" className={`${styles.sbItem} ${styles.sbItemLogout}`}
              onClick={(handleSignOut) => signOut({ callbackUrl: '/login' })}>
              <span className={styles.sbItemIcon} style={{ background:'#fff1f2', color:'#f43f5e' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
              </span>
              <span className={styles.sbItemLabel}>Logout</span>
            </button>
          </div> 

        </nav>

        <div style={{ flex:1 }} />

        {/* ── Little Loot Club promo card ── */}
        <div className={styles.sbClubCard}>
          <div className={styles.sbClubCardBg} />
          <div className={styles.sbClubTop}>
            <span className={styles.sbClubCrown}>👑</span>
            <div>
              <div className={styles.sbClubTitle}>Little Loot Club</div>
              <div className={styles.sbClubSub}>Join & enjoy exclusive perks!</div>
            </div>
          </div>
          <ul className={styles.sbClubPerks}>
            <li><svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>Early access to new launches</li>
            <li><svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>Exclusive member discounts</li>
            <li><svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>Birthday special rewards</li>
            <li><svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>Earn extra Loot Points</li>
          </ul>
          <button type="button" className={styles.sbClubBtn}>Join Now →</button>
        </div>

        {/* ── Need Help card ── */}
        <div className={styles.sbHelpCard}>
          <div className={styles.sbHelpTitle}>Need Help?</div>
          <div className={styles.sbHelpSub}>We're here for you</div>
          <div className={styles.sbHelpContacts}>
            <a href="tel:+919876543210" className={styles.sbHelpContact}>
              <span className={styles.sbHelpContactIcon}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.4 2 2 0 0 1 3.6 1.22h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.86a16 16 0 0 0 6 6l.95-.96a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21.77 16.92z"/></svg>
              </span>
              +91 98765 43210
            </a>
            <a href="mailto:hello@littleloot.com" className={styles.sbHelpContact}>
              <span className={styles.sbHelpContactIcon}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
              </span>
              hello@littleloot.com
            </a>
            <div className={styles.sbHelpContact}>
              <span className={styles.sbHelpContactIcon}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              </span>
              Mon–Sat: 10AM – 7PM
            </div>
          </div>
        </div>

      </aside>
      {/* ══════════ MAIN ══════════ */}
      <main className={`${styles.main} ${tab === 'overview' && !mobileDash ? styles.mainMenuMode : ''}`}>

        {/* Mobile-only account menu — the phone landing/hub */}
        {tab === 'overview' && !mobileDash && (
          <MobileAccountMenu
            profileImage={profileImage}
            displayName={displayName}
            displayEmail={displayEmail}
            hasEmail={!!(profile.email || session?.user?.email)}
            counts={{
              orders: orders.length,
              wishlist: favs.length,
              addresses: addresses.length,
              reviews: reviews.length,
              pendingReviews: pendingReviewProducts.length,
              coupons: activeCoupons,
            }}
            onNavigate={(t) => setTab(t as Tab)}
            onDashboard={() => setMobileDash(true)}
            onSignOut={handleSignOut}
          />
        )}

        {/* Mobile-only back-to-menu bar — shown on every section + the dashboard */}
        {!(tab === 'overview' && !mobileDash) && (
          <button
            type="button"
            className={styles.mobileBackBar}
            onClick={() => { setMobileDash(false); setTab('overview'); }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
            Account
          </button>
        )}

        {/* ── Mobile-only app-style tab screens (≤768px). The desktop blocks below
      carry styles.desktopOnly; CSS shows whichever matches the viewport. ── */}
        {tab === 'overview' && mobileDash && (
          <div className={styles.mobileOnly}>
            <MobileDashboard
              profileImage={profileImage}
              displayName={displayName}
              firstName={profile.firstName}
              phone={profile.phone}
              counts={{
                orders: orders.length,
                delivered: orders.filter(o => o.status.toLowerCase() === 'delivered').length,
                wishlist: favs.length,
                addresses: addresses.length,
                reviews: reviews.length,
                pendingReviews: pendingReviewProducts.length,
                coupons: activeCoupons,
              }}
              totalSpend={orders.filter(o => o.status.toLowerCase() === 'delivered').reduce((s, o) => s + o.amount, 0)}
              recentOrders={orders.slice(0, 4)}
              activeOrders={orders.filter(o => !['delivered', 'cancelled'].includes(o.status.toLowerCase()))}
              onNavigate={(t) => setTab(t as Tab)}
              onAvatarClick={() => avatarInputRef.current?.click()}
              avatarUploading={avatarUploading}
            />
          </div>
        )}

        {tab === 'orders' && (
          <div className={styles.mobileOnly}>
            <MobileOrders
              orders={orders}
              cancellingId={cancellingId}
              onCancelOrder={cancelOrder}
              onOpenReview={openReviewModal}
              returnsByOrder={returnsByOrder}
              onRequestReturn={(o) => setReturnModalOrder(o as MappedOrder)}
              onViewReturn={(id) => setViewReturnId(id)}
            />
          </div>
        )}

        {tab === 'wishlist' && (
          <div className={styles.mobileOnly}>
            <MobileWishlist
              favs={favs}
              cartStates={cartStates}
              onAddToCart={addToCart}
              onToggleWishlist={toggleWishlist}
            />
          </div>
        )}

        {tab === 'addresses' && (
          <div className={styles.mobileOnly}>
            <MobileAddresses
              addresses={addresses}
              loading={addrLoading}
              onAdd={() => { setEditingAddr(null); setAddrForm(EMPTY_ADDR); setAddrErrors({}); setShowAddrModal(true); }}
              onEdit={(a) => {
                setEditingAddr(a);
                setAddrForm({ type: a.type, name: a.name, phone: a.phone, line1: a.line1, line2: a.line2, city: a.city, state: a.state, pincode: a.pincode, isDefault: a.isDefault });
                setAddrErrors({}); setShowAddrModal(true);
              }}
              onDelete={handleAddrDelete}
              onSetDefault={handleSetDefault}
            />
          </div>
        )}

        {tab === 'reviews' && (
          <div className={styles.mobileOnly}>
            <MobileReviews
              reviewProducts={reviewableProducts}
              pendingCount={pendingReviewProducts.length}
              canWhatsApp={!!profile.phone}
              onWhatsApp={() => sendWhatsAppReminder(pendingReviewProducts)}
              onOpenReview={openReviewModal}
              onDeleteReview={handleReviewDelete}
            />
          </div>
        )}

        {tab === 'coupons' && (
          <div className={styles.mobileOnly}>
            <MobileCoupons
              coupons={coupons}
              copiedCode={copiedCode}
              onCopy={copyCoupon}
              showToast={showToast}
            />
          </div>
        )}

        {tab === 'notifications' && (
          <div className={styles.mobileOnly}>
            <MobileNotifications
              orders={orders}
              phone={profile.phone}
              onNavigate={(t) => setTab(t as Tab)}
              showToast={showToast}
              token={token}
            />
          </div>
        )}

        {tab === 'help' && (
          <div className={styles.mobileOnly}>
            <MobileHelp />
          </div>
        )}

        {tab === 'settings' && (
          <div className={styles.mobileOnly}>
            <MobileProfile
              profileImage={profileImage}
              displayName={displayName}
              profile={profile}
              draft={draft}
              editing={editing}
              avatarUploading={avatarUploading}
              onAvatarClick={() => avatarInputRef.current?.click()}
              onEdit={() => { setDraft(profile); setEditing(true); }}
              onCancel={() => { setDraft(profile); setEditing(false); }}
              onSave={handleSave}
              onChange={(p) => setDraft(d => ({ ...d, ...p }))}
              onSignOut={handleSignOut}
            />
          </div>
        )}

        {/* ─── OVERVIEW / DASHBOARD ─── */}
        {tab === 'overview' && (() => {
          /* ── derived dashboard data ── */
          const deliveredOrders  = orders.filter(o => o.status.toLowerCase() === 'delivered');
          const activeOrders     = orders.filter(o => !['delivered','cancelled'].includes(o.status.toLowerCase()));
          const totalSpend       = deliveredOrders.reduce((s,o) => s + o.amount, 0);
          const totalSaved       = favs.reduce((s,f) => {
            const orig = Number(f.product?.original_price ?? 0);
            return s + Math.max(0, orig - getSellingPrice(f.product));
          }, 0);
          const activeCouponList = coupons.filter(c => !c.used && new Date(c.expiry) >= new Date());
          const pendingCount     = pendingReviewProducts.length;
          const greetingHour     = new Date().getHours();
          const greeting         = greetingHour < 12 ? 'Good morning' : greetingHour < 17 ? 'Good afternoon' : 'Good evening';

          return (
            <div className={`${styles.dashWrap} ${styles.desktopOnly}`}>

              {/* ── Hero welcome strip ── */}
              <div className={styles.dashHero}>
                <div className={styles.dashHeroLeft}>
                  <div className={styles.dashAvatarWrap} onClick={() => avatarInputRef.current?.click()} title="Change photo">
                    {profileImage
                      ? <img src={profileImage} alt={displayName} className={styles.dashAvatar} referrerPolicy="no-referrer" />
                      : <div className={styles.dashAvatarFallback}>{(displayName[0]||'U').toUpperCase()}</div>
                    }
                    <div className={styles.dashAvatarCam}>
                      {avatarUploading
                        ? <div className={styles.avatarSpinner} />
                        : <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
                      }
                    </div>
                  </div>
                  <div className={styles.dashHeroInfo}>
                    <div className={styles.dashGreeting}>{greeting},</div>
                    <h1 className={styles.dashName}>{profile.firstName || displayName}! 👋</h1>
                    <div className={styles.dashEmail}>{displayEmail}</div>
                    {profile.phone && <div className={styles.dashPhone}>📞 {profile.phone}</div>}
                    <button type="button" className={styles.dashEditBtn} onClick={() => setTab('settings')}>
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                      Edit Profile
                    </button>
                  </div>
                </div>

                {/* Loot Points */}
                <div className={styles.dashLootCard}>
                  <div className={styles.dashLootBg} />
                  <div className={styles.dashLootIcon}>⭐</div>
                  <div className={styles.dashLootLabel}>Loot Points</div>
                  <div className={styles.dashLootNum}>320</div>
                  <div className={styles.dashLootSub}>Available Points</div>
                  <div className={styles.dashLootProgress}>
                    <div className={styles.dashLootBar}>
                      <div className={styles.dashLootBarFill} style={{ width:'64%' }} />
                    </div>
                    <div className={styles.dashLootBarLabel}>180 more for ₹250 reward</div>
                  </div>
                  <button type="button" className={styles.dashLootBtn} onClick={() => setTab('coupons')}>View Rewards →</button>
                </div>
              </div>

              {/* ── 4-stat quick cards ── */}
              <div className={styles.dashStatGrid}>
                {[
                  { icon:<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/></svg>,
                    label:'Total Orders', value: orders.length, sub: `${deliveredOrders.length} delivered`, color:'#3b82f6', bg:'#eff6ff', tab:'orders' as Tab },
                  { icon:<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>,
                    label:'Wishlist', value: favs.length, sub: totalSaved > 0 ? `Save ₹${totalSaved.toLocaleString('en-IN')}` : 'Items saved', color:'#f43f5e', bg:'#fff1f2', tab:'wishlist' as Tab },
                  { icon:<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 12v10H4V12"/><path d="M22 7H2v5h20V7z"/><path d="M12 22V7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/></svg>,
                    label:'Coupons', value: activeCouponList.length, sub:'Active coupons', color:'#f59e0b', bg:'#fffbeb', tab:'coupons' as Tab },
                  { icon:<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
                    label:'Reviews', value: reviews.length, sub: pendingCount > 0 ? `${pendingCount} pending` : 'All reviewed', color:'#a855f7', bg:'#faf5ff', tab:'reviews' as Tab },
                ].map(s => (
                  <div key={s.label} className={styles.dashStatCard} onClick={() => setTab(s.tab)}>
                    <div className={styles.dashStatTop}>
                      <div className={styles.dashStatIcon} style={{ background:s.bg, color:s.color }}>{s.icon}</div>
                      <div className={styles.dashStatNum} style={{ color:s.color }}>{s.value}</div>
                    </div>
                    <div className={styles.dashStatLabel}>{s.label}</div>
                    <div className={styles.dashStatSub}>{s.sub}</div>
                  </div>
                ))}
              </div>

              {/* ── Active order alert (if any in transit) ── */}
              {activeOrders.length > 0 && (
                <div className={styles.dashActiveOrderBanner} onClick={() => setTab('orders')}>
                  <div className={styles.dashActiveOrderLeft}>
                    <div className={styles.dashActiveOrderPulse}>
                      <div className={styles.dashActiveOrderDot} />
                    </div>
                    <div>
                      <div className={styles.dashActiveOrderTitle}>
                        {activeOrders.length} order{activeOrders.length > 1 ? 's' : ''} in progress
                      </div>
                      <div className={styles.dashActiveOrderSub}>
                        {activeOrders[0].name} · {activeOrders[0].status}
                      </div>
                    </div>
                  </div>
                  <div className={styles.dashActiveOrderRight}>
                    <span className={styles.dashActiveOrderAmt}>₹{activeOrders[0].amount.toLocaleString('en-IN')}</span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                  </div>
                </div>
              )}

              {/* ── Two-col: Recent orders + Spend summary ── */}
              <div className={styles.dashTwoCol}>
                {/* Recent orders */}
                <div className={styles.dashCard}>
                  <div className={styles.dashCardHeader}>
                    <div className={styles.dashCardTitle}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/></svg>
                      Recent Orders
                    </div>
                    <button type="button" className={styles.dashCardAction} onClick={() => setTab('orders')}>View All →</button>
                  </div>
                  {recentOrders.length === 0
                    ? <div className={styles.dashEmptyMini}><span>📦</span><span>No orders yet</span></div>
                    : <div className={styles.dashOrderList}>
                        {recentOrders.map(o => {
                          const sk = o.status.toLowerCase().replace(/ /g,'_');
                          const sc = STATUS_COLOR[sk] ?? STATUS_COLOR.processing;
                          return (
                            <div key={o.id} className={styles.dashOrderRow} onClick={() => setTab('orders')}>
                              <div className={styles.dashOrderImg}>
                                {o.images[0]
                                  ? <img src={o.images[0]} alt="" onError={e=>{(e.target as HTMLImageElement).src=PLACEHOLDER;}} />
                                  : <span>📦</span>}
                              </div>
                              <div className={styles.dashOrderInfo}>
                                <div className={styles.dashOrderName}>{o.name}</div>
                                <div className={styles.dashOrderMeta}>#{o.id.slice(0,8).toUpperCase()} · {o.date}</div>
                              </div>
                              <div className={styles.dashOrderRight}>
                                <div className={styles.dashOrderAmt}>₹{o.amount.toLocaleString('en-IN')}</div>
                                <span className={styles.dashOrderStatus} style={{ background:sc.bg, color:sc.color }}>{o.status}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                  }
                </div>

                {/* Spend summary */}
                <div className={styles.dashCard}>
                  <div className={styles.dashCardHeader}>
                    <div className={styles.dashCardTitle}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                      Spending Summary
                    </div>
                  </div>
                  <div className={styles.dashSpendList}>
                    {[
                      { label:'Total Spent',       value:`₹${totalSpend.toLocaleString('en-IN')}`,    color:'#FF6B35', sub:'across all orders' },
                      { label:'Average Order',      value: orders.length > 0 ? `₹${Math.round(totalSpend/Math.max(deliveredOrders.length,1)).toLocaleString('en-IN')}` : '—', color:'#3b82f6', sub:'per delivered order' },
                      { label:'Wishlist Value',     value:`₹${favs.reduce((s,f)=>s+getSellingPrice(f.product),0).toLocaleString('en-IN')}`, color:'#f43f5e', sub:'items saved' },
                      { label:'Potential Savings',  value: totalSaved > 0 ? `₹${totalSaved.toLocaleString('en-IN')}` : '₹0', color:'#10b981', sub:'on wishlisted items' },
                    ].map(s => (
                      <div key={s.label} className={styles.dashSpendRow}>
                        <div>
                          <div className={styles.dashSpendLabel}>{s.label}</div>
                          <div className={styles.dashSpendSub}>{s.sub}</div>
                        </div>
                        <div className={styles.dashSpendValue} style={{ color:s.color }}>{s.value}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* ── Two-col: Wishlist preview + Account details ── */}
              <div className={styles.dashTwoCol}>
                {/* Wishlist preview */}
                <div className={styles.dashCard}>
                  <div className={styles.dashCardHeader}>
                    <div className={styles.dashCardTitle}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                      My Wishlist
                    </div>
                    <button type="button" className={styles.dashCardAction} onClick={() => setTab('wishlist')}>View All →</button>
                  </div>
                  {favs.length === 0
                    ? <div className={styles.dashEmptyMini}><span>💔</span><span>Wishlist is empty</span></div>
                    : <div className={styles.dashWishGrid}>
                        {favs.slice(0,3).map(item => {
                          const p = item.product; const pid = String(p.id);
                          const img = getProductImage(p); const price = getSellingPrice(p);
                          const orig = Number(p.original_price ?? 0);
                          return (
                            <Link key={pid} href={`/product/${pid}`} className={styles.dashWishCard}>
                              <div className={styles.dashWishImg}>
                                <img src={img} alt={p.name} onError={e=>{(e.target as HTMLImageElement).src=PLACEHOLDER;}} />
                              </div>
                              <div className={styles.dashWishName}>{p.name}</div>
                              <div className={styles.dashWishPrice}>₹{price.toLocaleString('en-IN')}</div>
                              {orig > price && <div className={styles.dashWishOld}>₹{orig.toLocaleString('en-IN')}</div>}
                            </Link>
                          );
                        })}
                        {favs.length > 3 && (
                          <button type="button" className={styles.dashWishMore} onClick={() => setTab('wishlist')}>
                            +{favs.length-3} more
                          </button>
                        )}
                      </div>
                  }
                </div>

                {/* Account details */}
                <div className={styles.dashCard}>
                  <div className={styles.dashCardHeader}>
                    <div className={styles.dashCardTitle}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                      Account Details
                    </div>
                    <button type="button" className={styles.dashCardAction} onClick={() => setTab('settings')}>Edit →</button>
                  </div>
                  <div className={styles.dashAccList}>
                    {[
                      { label:'Name',      value: displayName,                         icon:'👤' },
                      { label:'Email',     value: displayEmail,                        icon:'✉️' },
                      { label:'Phone',     value: profile.phone || 'Not added',        icon:'📱' },
                      { label:'DOB',       value: profile.dob ? new Date(profile.dob).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'}) : 'Not added', icon:'🎂' },
                      { label:'Addresses', value: `${addresses.length} saved`,         icon:'📍' },
                    ].map(d => (
                      <div key={d.label} className={styles.dashAccRow}>
                        <span className={styles.dashAccIcon}>{d.icon}</span>
                        <div className={styles.dashAccBody}>
                          <div className={styles.dashAccLabel}>{d.label}</div>
                          <div className={styles.dashAccValue} style={{ color: d.value.includes('Not added') ? '#ccc' : undefined }}>{d.value}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* ── Pending reviews alert ── */}
              {pendingCount > 0 && (
                <div className={styles.dashReviewAlert} onClick={() => setTab('reviews')}>
                  <div className={styles.dashReviewAlertLeft}>
                    <div className={styles.dashReviewAlertIcon}>⭐</div>
                    <div>
                      <div className={styles.dashReviewAlertTitle}>
                        {pendingCount} product{pendingCount > 1 ? 's' : ''} awaiting your review
                      </div>
                      <div className={styles.dashReviewAlertSub}>Your review helps other parents choose the best for their kids</div>
                    </div>
                  </div>
                  <button type="button" className={styles.dashReviewAlertBtn}>Write Reviews →</button>
                </div>
              )}

              {/* ── Addresses preview ── */}
              {addresses.length > 0 && (
                <div className={styles.dashCard}>
                  <div className={styles.dashCardHeader}>
                    <div className={styles.dashCardTitle}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/><circle cx="12" cy="9" r="2.5"/></svg>
                      Saved Addresses
                    </div>
                    <button type="button" className={styles.dashCardAction} onClick={() => setTab('addresses')}>Manage →</button>
                  </div>
                  <div className={styles.dashAddrRow}>
                    {addresses.slice(0,2).map(a => (
                      <div key={a.id} className={`${styles.dashAddrItem} ${a.isDefault ? styles.dashAddrItemDefault : ''}`}>
                        <div className={styles.dashAddrType}>
                          {a.isDefault && <span className={styles.dashAddrDefaultBadge}>Default</span>}
                          {a.type === 'Home' ? '🏠' : a.type === 'Office' ? '🏢' : '📌'} {a.type}
                        </div>
                        <div className={styles.dashAddrText}>{a.line1}, {a.city} – {a.pincode}</div>
                      </div>
                    ))}
                    <button type="button" className={styles.dashAddrAddBtn}
                      onClick={() => { setEditingAddr(null); setAddrForm(EMPTY_ADDR); setAddrErrors({}); setShowAddrModal(true); }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                      Add Address
                    </button>
                  </div>
                </div>
              )}

              {/* ── Recommended carousel ── */}
              {featured.length > 0 && (
                <div className={styles.dashCard}>
                  <div className={styles.dashCardHeader}>
                    <div className={styles.dashCardTitle}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                      Recommended For You
                    </div>
                    <Link href="/products" className={styles.dashCardAction}>View All →</Link>
                  </div>
                  <div className={styles.carouselWrap}>
                    <div className={styles.carouselTrack} ref={carouselRef}>
                      {featured.map((p, i) => {
                        const img = getProductImage(p); const price = getSellingPrice(p); const orig = Number(p.original_price ?? 0);
                        const isWished = favs.some(f => String(f.product?.id) === String(p.id));
                        return (
                          <Link key={String(p.id)+i} href={`/product/${p.id}`} className={styles.recCard}>
                            <button type="button"
                              className={`${styles.recWishBtn} ${isWished ? styles.recWishBtnActive : ''}`}
                              onClick={e => toggleWishlist(e, p)}>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill={isWished?'currentColor':'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                            </button>
                            <div className={styles.recImgWrap}><img src={img} alt={p.name} onError={e=>{(e.target as HTMLImageElement).src=PLACEHOLDER;}} /></div>
                            <div className={styles.recInfo}>
                              <div className={styles.recName}>{p.name}</div>
                              <div className={styles.recPriceRow}>
                                <span className={styles.recPrice}>₹{price.toLocaleString('en-IN')}</span>
                                {orig>price && <span className={styles.recOldPrice}>₹{orig.toLocaleString('en-IN')}</span>}
                              </div>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                    <button type="button" className={`${styles.carouselArrow} ${styles.carouselArrowRight}`}
                      onClick={() => carouselRef.current?.scrollBy({ left:260, behavior:'smooth' })}>›</button>
                  </div>
                </div>
              )}

              {/* ── Trust strip ── */}
              <div className={styles.dashTrustStrip}>
                {[
                  { icon:'🚚', title:'Free Delivery',   sub:'Orders above ₹499' },
                  { icon:'🔄', title:'7 Day Returns',   sub:'Hassle-free' },
                  { icon:'🔒', title:'Secure Payments', sub:'100% safe' },
                  { icon:'🧸', title:'Kids Safe',       sub:'Certified materials' },
                ].map(t => (
                  <div key={t.title} className={styles.dashTrustItem}>
                    <span className={styles.dashTrustIcon}>{t.icon}</span>
                    <div>
                      <div className={styles.dashTrustTitle}>{t.title}</div>
                      <div className={styles.dashTrustSub}>{t.sub}</div>
                    </div>
                  </div>
                ))}
              </div>

            </div>
          );
        })()}
        {/* ─── ORDERS ─── */}
        {tab === 'orders' && (() => {
          const filtered = orders.filter(o => {
            const sk = o.status.toLowerCase().replace(/ /g, '_');
            const matchFilter =
              orderFilter === 'all' ? true :
              orderFilter === 'processing' ? ['processing','pending','confirmed','packed'].includes(sk) :
              orderFilter === 'shipped' ? ['shipped','out_for_delivery'].includes(sk) :
              orderFilter === 'delivered' ? sk === 'delivered' :
              orderFilter === 'cancelled' ? sk === 'cancelled' : true;
            const matchSearch = !orderSearch ||
              o.name.toLowerCase().includes(orderSearch.toLowerCase()) ||
              o.id.toLowerCase().includes(orderSearch.toLowerCase());
            return matchFilter && matchSearch;
          });

          /* Pagination — clamp page to valid range derived from filtered length */
          const totalPages = Math.max(1, Math.ceil(filtered.length / ORDERS_PER_PAGE));
          const safePage   = Math.min(ordersPage, totalPages);
          const pageStart  = (safePage - 1) * ORDERS_PER_PAGE;
          const paged      = filtered.slice(pageStart, pageStart + ORDERS_PER_PAGE);


          return (
            <div className={`${styles.tabWrap} ${styles.desktopOnly}`}>
              <div className={styles.tabHeader}>
                <div>
                  <h1 className={styles.tabTitle}>My Orders</h1>
                  <p className={styles.tabSubtitle}>{orders.length} order{orders.length !== 1 ? 's' : ''} placed</p>
                </div>
              </div>

              {/* Filter + search */}
              <div className={styles.ordersToolbar}>
                <div className={styles.ordersFilterPills}>
                  {([
                    ['all','All'], ['processing','Processing'], ['shipped','Shipped'],
                    ['delivered','Delivered'], ['cancelled','Cancelled'],
                  ] as const).map(([k,label]) => (
                    <button key={k} type="button"
                      className={`${styles.ordersFilterPill} ${orderFilter===k ? styles.ordersFilterPillActive : ''}`}
                      onClick={() => { setOrderFilter(k); setOrdersPage(1); }}>
                      {label}
                    </button>
                  ))}
                </div>
                <div className={styles.ordersSearchWrap}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                  <input type="text" placeholder="Search orders…"
                    value={orderSearch}
                    onChange={e => { setOrderSearch(e.target.value); setOrdersPage(1); }} />
                </div>
              </div>

              {filtered.length === 0 ? (
                <div className={styles.emptyState}>
                  <div className={styles.emptyIcon}>📦</div>
                  <h3 className={styles.emptyTitle}>{orders.length === 0 ? 'No orders yet' : 'No matching orders'}</h3>
                  <p className={styles.emptyText}>
                    {orders.length === 0 ? 'Start shopping to see your orders here!' : 'Try a different filter or search term.'}
                  </p>
                  {orders.length === 0 && <Link href="/products" className={styles.emptyBtn}>Start Shopping →</Link>}
                </div>
              ) : (
                <>
                  <div className={styles.ordersList}>
                    {paged.map(o => {
                      const sk = o.status.toLowerCase().replace(/ /g,'_');
                      const sc = STATUS_COLOR[sk] ?? STATUS_COLOR.processing;
                      const isExpanded = expandedOrder === o.id;
                      return (
                        <div key={o.id} className={styles.orderCard}>
                          <div className={styles.orderCardHead} onClick={() => setExpandedOrder(isExpanded ? null : o.id)}>
                            <div className={styles.orderCardImgs}>
                              {o.images.length > 0
                                ? o.images.slice(0,3).map((img,i) => (
                                    <div key={i} className={styles.orderCardImg} style={{ zIndex: 3-i, marginLeft: i>0 ? -14 : 0 }}>
                                      <img src={img} alt="" onError={e=>{(e.target as HTMLImageElement).src=PLACEHOLDER;}} />
                                    </div>
                                  ))
                                : <div className={styles.orderCardImg}><span>📦</span></div>
                              }
                              {o.itemCount > 3 && <div className={styles.orderCardImgMore}>+{o.itemCount-3}</div>}
                            </div>
                            <div className={styles.orderCardInfo}>
                              <div className={styles.orderCardName}>{o.name}</div>
                              <div className={styles.orderCardMeta}>
                                <span>#{o.id.slice(0,8).toUpperCase()}</span>
                                <span className={styles.orderCardDot}>·</span>
                                <span>{o.date}</span>
                                <span className={styles.orderCardDot}>·</span>
                                <span>{o.itemCount} item{o.itemCount !== 1 ? 's' : ''}</span>
                              </div>
                            </div>
                            <div className={styles.orderCardRight}>
                              <div className={styles.orderCardAmt}>₹{o.amount.toLocaleString('en-IN')}</div>
                              <span className={styles.orderCardStatus} style={{ background:sc.bg, color:sc.color }}>{o.status}</span>
                            </div>
                            <button type="button" className={`${styles.orderCardChevron} ${isExpanded ? styles.orderCardChevronUp : ''}`}>
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
                            </button>
                          </div>

                          {isExpanded && (
                            <div className={styles.orderCardBody}>
                              <div className={styles.orderItemsList}>
                                {o.rawItems.map((item:any, idx:number) => {
                                  const p = item.product || {};
                                  const img = getProductImage(p);
                                  const qty = item.quantity ?? item.count ?? 1;
                                  const price = Number(item.price ?? getSellingPrice(p));
                                  return (
                                    <div key={idx} className={styles.orderItemRow}>
                                      <div className={styles.orderItemImg}>
                                        <img src={img} alt={p.name} onError={e=>{(e.target as HTMLImageElement).src=PLACEHOLDER;}} />
                                      </div>
                                      <div className={styles.orderItemInfo}>
                                        <Link href={`/product/${p.id}`} className={styles.orderItemName}>{p.name || 'Product'}</Link>
                                        <div className={styles.orderItemMeta}>Qty: {qty} × ₹{price.toLocaleString('en-IN')}</div>
                                      </div>
                                      <div className={styles.orderItemTotal}>₹{(price*qty).toLocaleString('en-IN')}</div>
                                    </div>
                                  );
                                })}
                              </div>
                              {/* Returns for this order (Phase 13) */}
                              {(returnsByOrder[o.id] ?? []).length > 0 && (
                                <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px dashed #e8e0d5' }}>
                                  <div style={{ fontSize: 12, fontWeight: 800, color: '#6b7280', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '.04em' }}>
                                    Returns for this order
                                  </div>
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                    {(returnsByOrder[o.id] ?? []).map(rr => {
                                      const sc = RETURN_STATUS_COLOR[rr.status] ?? { bg: '#f3f4f6', color: '#374151' };
                                      return (
                                        <button key={rr.id} type="button" onClick={() => setViewReturnId(rr.id)}
                                          style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', textAlign: 'left',
                                            background: '#fafafa', border: '1px solid #eee', borderRadius: 10, padding: '9px 12px', cursor: 'pointer' }}>
                                          <span style={{ fontSize: 11, fontWeight: 800, padding: '3px 9px', borderRadius: 20, whiteSpace: 'nowrap', background: sc.bg, color: sc.color }}>
                                            {RETURN_STATUS_LABEL[rr.status] ?? rr.status}
                                          </span>
                                          <span style={{ flex: 1, fontSize: 12, color: '#6b7280', fontWeight: 600 }}>
                                            {RETURN_REASON_LABEL[rr.reason] ?? rr.reason} · {rr.item_count} item{rr.item_count !== 1 ? 's' : ''} · {new Date(rr.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                                          </span>
                                          <span style={{ fontSize: 12, fontWeight: 800, color: '#FF6B35', whiteSpace: 'nowrap' }}>View →</span>
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}
                              <div className={styles.orderCardActions}>
                                <Link href={`/track-order?order_id=${o.id}`} className={styles.orderActionBtn}>
                                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 3h15v13H1z"/><path d="M16 8h4l3 3v5h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
                                  Track Order
                                </Link>

                                {sk === 'delivered' && (
                                  <button type="button" className={styles.orderActionBtnPrimary}
                                    onClick={() => {
                                      const first = o.rawItems[0]?.product;
                                      if (first) openReviewModal({
                                        productId: String(first.id), productName: first.name,
                                        productImage: getProductImage(first), orderId: o.id,
                                        orderDate: o.date, alreadyReviewed: false,
                                      });
                                    }}>
                                    ⭐ Write Review
                                  </button>
                                )}
                                  {sk === 'delivered' && (
                                  <button type="button"
                                    onClick={() => setReturnModalOrder(o)}
                                    style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px',
                                      borderRadius: 9, border: '1.5px solid #e5e7eb', background: '#fff', color: '#374151',
                                      fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 14 4 9 9 4"/><path d="M20 20v-7a4 4 0 0 0-4-4H4"/></svg>
                                    Request Return
                                  </button>
                                )}

                                {['pending','processing','confirmed','packed'].includes(sk) && (
                                  confirmCancelId === o.id ? (
                                    <span className={styles.orderCancelConfirm}>
                                      <span className={styles.orderCancelConfirmText}>Cancel this order?</span>
                                      <button type="button" className={styles.orderCancelYesBtn}
                                        disabled={cancellingId === o.id}
                                        onClick={() => cancelOrder(o.id)}>
                                        {cancellingId === o.id ? <span className={styles.btnSpinner} /> : 'Yes, cancel'}
                                      </button>
                                      <button type="button" className={styles.orderCancelNoBtn}
                                        disabled={cancellingId === o.id}
                                        onClick={() => setConfirmCancelId(null)}>
                                        Keep
                                      </button>
                                    </span>
                                  ) : (
                                    <button type="button" className={styles.orderCancelBtn}
                                      onClick={() => setConfirmCancelId(o.id)}>
                                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                                      Cancel Order
                                    </button>
                                  )
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Pagination control */}
                  {totalPages > 1 && (
                    <div className={styles.ordersPagination}>
                      <button type="button"
                        className={styles.ordersPageBtn}
                        disabled={safePage <= 1}
                        onClick={() => setOrdersPage(p => Math.max(1, p - 1))}>
                        ‹ Prev
                      </button>
                      <span className={styles.ordersPageInfo}>Page {safePage} of {totalPages}</span>
                      <button type="button"
                        className={styles.ordersPageBtn}
                        disabled={safePage >= totalPages}
                        onClick={() => setOrdersPage(p => Math.min(totalPages, p + 1))}>
                        Next ›
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          );
        })()}

        {/* ─── WISHLIST ─── */}
        {tab === 'wishlist' && (() => {
          let list = favs.filter(f => {
            if (!wishlistSearch) return true;
            return (f.product?.name || '').toLowerCase().includes(wishlistSearch.toLowerCase());
          });
          if (wishlistSort === 'price_asc')  list = [...list].sort((a,b) => getSellingPrice(a.product) - getSellingPrice(b.product));
          if (wishlistSort === 'price_desc') list = [...list].sort((a,b) => getSellingPrice(b.product) - getSellingPrice(a.product));
          if (wishlistSort === 'name')       list = [...list].sort((a,b) => (a.product?.name||'').localeCompare(b.product?.name||''));

          return (
            <div className={`${styles.tabWrap} ${styles.desktopOnly}`}>
              <div className={styles.tabHeader}>
                <div>
                  <h1 className={styles.tabTitle}>My Wishlist</h1>
                  <p className={styles.tabSubtitle}>{favs.length} item{favs.length !== 1 ? 's' : ''} saved</p>
                </div>
              </div>

              {favs.length === 0 ? (
                <div className={styles.emptyState}>
                  <div className={styles.emptyIcon}>💔</div>
                  <h3 className={styles.emptyTitle}>Your wishlist is empty</h3>
                  <p className={styles.emptyText}>Save items you love and find them all here!</p>
                  <Link href="/products" className={styles.emptyBtn}>Explore Products →</Link>
                </div>
              ) : (
                <>
                  <div className={styles.wishToolbar}>
                    <div className={styles.ordersSearchWrap}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                      <input type="text" placeholder="Search wishlist…" value={wishlistSearch} onChange={e => setWishlistSearch(e.target.value)} />
                    </div>
                    <div className={styles.wishToolbarRight}>
                      <select className={styles.wishSortSelect} value={wishlistSort} onChange={e => setWishlistSort(e.target.value as any)}>
                        <option value="default">Sort: Default</option>
                        <option value="price_asc">Price: Low to High</option>
                        <option value="price_desc">Price: High to Low</option>
                        <option value="name">Name: A–Z</option>
                      </select>
                      <div className={styles.wishViewToggle}>
                        <button type="button" className={wishlistView==='grid' ? styles.wishViewActive : ''} onClick={() => setWishlistView('grid')}>
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
                        </button>
                        <button type="button" className={wishlistView==='list' ? styles.wishViewActive : ''} onClick={() => setWishlistView('list')}>
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className={wishlistView === 'grid' ? styles.wishGrid : styles.wishListView}>
                    {list.map(item => {
                      const p = item.product; const pid = String(p.id);
                      const img = getProductImage(p); const price = getSellingPrice(p);
                      const orig = Number(p.original_price ?? 0);
                      const cartState = cartStates[pid] ?? 'idle';
                      return (
                        <div key={pid} className={wishlistView === 'grid' ? styles.wishCard : styles.wishCardList}>
                          <Link href={`/product/${pid}`} className={styles.wishCardImg}>
                            <img src={img} alt={p.name} onError={e=>{(e.target as HTMLImageElement).src=PLACEHOLDER;}} />
                            {orig > price && <span className={styles.wishDiscount}>{Math.round((1-price/orig)*100)}% OFF</span>}
                          </Link>
                          <div className={styles.wishCardBody}>
                            <Link href={`/product/${pid}`} className={styles.wishCardName}>{p.name}</Link>
                            <div className={styles.wishCardPriceRow}>
                              <span className={styles.wishCardPrice}>₹{price.toLocaleString('en-IN')}</span>
                              {orig > price && <span className={styles.wishCardOld}>₹{orig.toLocaleString('en-IN')}</span>}
                            </div>
                            <div className={styles.wishCardActions}>
                              <button type="button"
                                className={`${styles.wishCartBtn} ${cartState==='added' ? styles.wishCartBtnAdded : ''} ${cartState==='error' ? styles.wishCartBtnError : ''}`}
                                onClick={e => addToCart(e, p)} disabled={cartState==='loading'}>
                                {cartState==='loading' ? <span className={styles.btnSpinner} /> :
                                 cartState==='added'   ? '✓ Added' :
                                 cartState==='error'   ? 'Retry'   : '🛒 Add to Cart'}
                              </button>
                              <button type="button" className={styles.wishRemoveBtn} onClick={e => toggleWishlist(e, p)} title="Remove">
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          );
        })()}

        {/* ─── ADDRESSES ─── */}
        {tab === 'addresses' && (
          <div className={`${styles.tabWrap} ${styles.desktopOnly}`}>
            <div className={styles.tabHeader}>
              <div>
                <h1 className={styles.tabTitle}>Saved Addresses</h1>
                <p className={styles.tabSubtitle}>{addresses.length} address{addresses.length !== 1 ? 'es' : ''} saved</p>
              </div>
              <button type="button" className={styles.tabHeaderBtn}
                onClick={() => { setEditingAddr(null); setAddrForm(EMPTY_ADDR); setAddrErrors({}); setShowAddrModal(true); }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                Add New
              </button>
            </div>

            {addrLoading ? (
              <div className={styles.addrLoadingGrid}>
                {[1,2].map(i => <div key={i} className={styles.addrSkeleton} />)}
              </div>
            ) : addresses.length === 0 ? (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>📍</div>
                <h3 className={styles.emptyTitle}>No addresses saved</h3>
                <p className={styles.emptyText}>Add a delivery address to checkout faster!</p>
                <button type="button" className={styles.emptyBtn}
                  onClick={() => { setEditingAddr(null); setAddrForm(EMPTY_ADDR); setAddrErrors({}); setShowAddrModal(true); }}>
                  Add Address →
                </button>
              </div>
            ) : (
              <div className={styles.addrGrid}>
                {addresses.map(a => (
                  <div key={a.id} className={`${styles.addrCard} ${a.isDefault ? styles.addrCardDefault : ''}`}>
                    {a.isDefault && <span className={styles.addrDefaultBadge}>✓ Default</span>}
                    <div className={styles.addrCardType}>
                      <span className={styles.addrTypeIcon}>{a.type==='Home' ? '🏠' : a.type==='Office' ? '🏢' : '📌'}</span>
                      {a.type}
                    </div>
                    <div className={styles.addrCardName}>{a.name}</div>
                    <div className={styles.addrCardText}>
                      {a.line1}{a.line2 ? `, ${a.line2}` : ''}<br/>
                      {a.city}, {a.state} – {a.pincode}
                    </div>
                    <div className={styles.addrCardPhone}>📞 {a.phone}</div>
                    <div className={styles.addrCardActions}>
                      {!a.isDefault && (
                        <button type="button" className={styles.addrSetDefaultBtn} onClick={() => handleSetDefault(a)}>
                          Set as Default
                        </button>
                      )}
                      <button type="button" className={styles.addrEditBtn}
                        onClick={() => {
                          setEditingAddr(a);
                          setAddrForm({ type:a.type, name:a.name, phone:a.phone, line1:a.line1, line2:a.line2, city:a.city, state:a.state, pincode:a.pincode, isDefault:a.isDefault });
                          setAddrErrors({}); setShowAddrModal(true);
                        }}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        Edit
                      </button>
                      <button type="button" className={styles.addrDeleteBtn} onClick={() => handleAddrDelete(a)}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        {/* ─── COUPONS ─── */}
        {tab === 'coupons' && (() => {
          const now = new Date();
          const filtered = coupons.filter(c => {
            const expired = new Date(c.expiry) < now;
            if (couponFilter === 'active')  return !c.used && !expired;
            if (couponFilter === 'used')    return c.used;
            if (couponFilter === 'expired') return expired && !c.used;
            return true;
          });

          const handleApply = () => {
            const code = applyInput.trim().toUpperCase();
            if (!code) return;
            const found = coupons.find(c => c.code === code);
            if (found) {
              copyCoupon(code);
              showToast(`✅ ${code} copied! Apply it at checkout.`);
            } else {
              showToast('❌ No active coupon with that code.');
            }
            setApplyInput('');
          };

          
              if (couponsLoading) {
                return (
                  <div className={`${styles.tabWrap} ${styles.desktopOnly}`}>
                    <div className={styles.tabHeader}>
                      <div><h1 className={styles.tabTitle}>My Coupons</h1>
                      <p className={styles.tabSubtitle}>Loading offers…</p></div>
                    </div>
                    <div className={styles.couponGrid}>
                      {[0,1,2,3].map(i => (
                        <div key={i} className={styles.couponCard} style={{ opacity: 0.5 }}>
                          <div className={styles.couponLeft}><div className={styles.couponDiscount}>·</div></div>
                          <div className={styles.couponDivider}><span className={styles.couponNotchTop}/><span className={styles.couponNotchBot}/></div>
                          <div className={styles.couponRight}><div className={styles.couponDesc}>Loading…</div></div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              }

          return (
            <div className={`${styles.tabWrap} ${styles.desktopOnly}`}>
              <div className={styles.tabHeader}>
                <div>
                  <h1 className={styles.tabTitle}>My Coupons</h1>
                  <p className={styles.tabSubtitle}>{activeCoupons} active coupon{activeCoupons !== 1 ? 's' : ''} available</p>
                </div>
              </div>

              {/* Apply coupon */}
              <div className={styles.couponApplyBar}>
                <input type="text" placeholder="Enter coupon code…" value={applyInput}
                  onChange={e => setApplyInput(e.target.value.toUpperCase())}
                  onKeyDown={e => e.key === 'Enter' && handleApply()} />
                <button type="button" onClick={handleApply} disabled={applyLoading}>
                  {applyLoading ? <span className={styles.btnSpinner} /> : 'Apply'}
                </button>
              </div>

              {/* Filter pills */}
              <div className={styles.ordersFilterPills} style={{ marginBottom:20 }}>
                {([['active','Active'],['used','Used'],['expired','Expired'],['all','All']] as const).map(([k,label]) => (
                  <button key={k} type="button"
                    className={`${styles.ordersFilterPill} ${couponFilter===k ? styles.ordersFilterPillActive : ''}`}
                    onClick={() => setCouponFilter(k)}>
                    {label}
                  </button>
                ))}
              </div>

              {couponsLoading ? (
                <div className={styles.couponGrid}>
                  {[0,1,2,3].map(i => (
                    <div key={i} className={styles.couponCard} style={{ opacity: 0.5 }}>
                      <div className={styles.couponLeft}><div className={styles.couponDiscount}>·</div></div>
                      <div className={styles.couponDivider}><span className={styles.couponNotchTop}/><span className={styles.couponNotchBot}/></div>
                      <div className={styles.couponRight}><div className={styles.couponDesc}>Loading…</div></div>
                    </div>
                  ))}
                </div>
              ) : filtered.length === 0 ? (
                <div className={styles.emptyState}>
                  <div className={styles.emptyIcon}>🎟️</div>
                  <h3 className={styles.emptyTitle}>No {couponFilter} coupons</h3>
                  <p className={styles.emptyText}>Check back soon for exciting offers!</p>
                </div>
              ) : (
                <div className={styles.couponGrid}>
                  {filtered.map(c => {
                    const expired = new Date(c.expiry) < now;
                    const disabled = c.used || expired;
                    return (
                      <div key={c.id} className={`${styles.couponCard} ${disabled ? styles.couponCardDisabled : ''} ${c.highlight && !disabled ? styles.couponCardHighlight : ''}`}>
                        {c.highlight && !disabled && <span className={styles.couponBestBadge}>⭐ Best Offer</span>}
                        <div className={styles.couponLeft}>
                          <div className={styles.couponDiscount}>
                            {c.type === 'percent' ? `${c.discount}%` : `₹${c.discount}`}
                            <span className={styles.couponOff}>OFF</span>
                          </div>
                          {c.category && c.category !== 'All' && <div className={styles.couponCategory}>{c.category}</div>}
                        </div>
                        <div className={styles.couponDivider}>
                          <span className={styles.couponNotchTop} /><span className={styles.couponNotchBot} />
                        </div>
                        <div className={styles.couponRight}>
                          <div className={styles.couponDesc}>{c.description}</div>
                          <div className={styles.couponMeta}>
                            Min. order ₹{c.minOrder}
                            {c.maxDiscount ? ` · Up to ₹${c.maxDiscount}` : ''}
                          </div>
                          <div className={styles.couponExpiry}>
                            {expired ? '⏱️ Expired' : `Valid till ${new Date(c.expiry).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})}`}
                          </div>
                          <div className={styles.couponCodeRow}>
                            <span className={styles.couponCode}>{c.code}</span>
                            {!disabled ? (
                              <button type="button"
                                className={`${styles.couponCopyBtn} ${copiedCode===c.code ? styles.couponCopyBtnDone : ''}`}
                                onClick={() => copyCoupon(c.code)}>
                                {copiedCode === c.code ? '✓ Copied' : 'Copy'}
                              </button>
                            ) : (
                              <span className={styles.couponUsedTag}>{c.used ? 'Used' : 'Expired'}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })()}

        {/* ─── REVIEWS ─── */}
        {tab === 'reviews' && (
          <div className={`${styles.tabWrap} ${styles.desktopOnly}`}>
            <div className={styles.tabHeader}>
              <div>
                <h1 className={styles.tabTitle}>My Reviews</h1>
                <p className={styles.tabSubtitle}>
                  {reviews.length} review{reviews.length !== 1 ? 's' : ''} written
                  {pendingReviewProducts.length > 0 && ` · ${pendingReviewProducts.length} pending`}
                </p>
              </div>
              {pendingReviewProducts.length > 0 && profile.phone && (
                <button type="button" className={styles.reviewWaBtn}
                  onClick={() => sendWhatsAppReminder(pendingReviewProducts)}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884"/></svg>
                  Send Reminder
                </button>
              )}
            </div>

            {/* Filter pills */}
            <div className={styles.ordersFilterPills} style={{ marginBottom:20 }}>
              {([['all','All Products'],['pending','Pending Review']] as const).map(([k,label]) => (
                <button key={k} type="button"
                  className={`${styles.ordersFilterPill} ${reviewFilter===k ? styles.ordersFilterPillActive : ''}`}
                  onClick={() => setReviewFilter(k)}>
                  {label}
                  {k === 'pending' && pendingReviewProducts.length > 0 && ` (${pendingReviewProducts.length})`}
                </button>
              ))}
            </div>

            {filteredReviewProducts.length === 0 ? (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>⭐</div>
                <h3 className={styles.emptyTitle}>
                  {reviewFilter === 'pending' ? 'All caught up!' : 'No products to review yet'}
                </h3>
                <p className={styles.emptyText}>
                  {reviewFilter === 'pending'
                    ? "You've reviewed all your delivered products. Thank you!"
                    : 'Once your orders are delivered, you can review them here.'}
                </p>
                {orders.length === 0 && <Link href="/products" className={styles.emptyBtn}>Start Shopping →</Link>}
              </div>
            ) : (
              <div className={styles.reviewGrid}>
                {filteredReviewProducts.map(rp => {
                  const ex = rp.existingReview;
                  return (
                    <div key={rp.productId} className={styles.reviewCard}>
                      <div className={styles.reviewCardTop}>
                        <Link href={`/product/${rp.productId}`} className={styles.reviewCardImg}>
                          <img src={rp.productImage} alt={rp.productName} onError={e=>{(e.target as HTMLImageElement).src=PLACEHOLDER;}} />
                        </Link>
                        <div className={styles.reviewCardInfo}>
                          <Link href={`/product/${rp.productId}`} className={styles.reviewCardName}>{rp.productName}</Link>
                          <div className={styles.reviewCardOrderMeta}>Ordered {rp.orderDate}</div>
                          {ex
                            ? <div className={styles.reviewCardStars}><StarRating value={ex.rating} readonly size="sm" /></div>
                            : <span className={styles.reviewPendingTag}>Not reviewed yet</span>
                          }
                        </div>
                      </div>

                      {ex && (
                        <div className={styles.reviewCardComment}>
                          <p>"{ex.comment}"</p>
                          <div className={styles.reviewCardDate}>Reviewed on {ex.createdAt}</div>
                        </div>
                      )}

                      <div className={styles.reviewCardActions}>
                        {ex ? (
                          <>
                            <button type="button" className={styles.reviewEditBtn} onClick={() => openReviewModal(rp)}>
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                              Edit
                            </button>
                            <button type="button" className={styles.reviewDeleteBtn} onClick={() => handleReviewDelete(ex.id)}>
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                            </button>
                          </>
                        ) : (
                          <button type="button" className={styles.reviewWriteBtn} onClick={() => openReviewModal(rp)}>
                            ⭐ Write Review
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

        {/* ─── SETTINGS ─── */}
        {tab === 'settings' && (
          <div className={`${styles.tabWrap} ${styles.desktopOnly}`}>
            <div className={styles.tabHeader}>
              <div>
                <h1 className={styles.tabTitle}>Settings</h1>
                <p className={styles.tabSubtitle}>Manage your profile and preferences</p>
              </div>
            </div>

            <div className={styles.settingsWrap}>
              {/* Profile section */}
              <div className={styles.settingsSection}>
                <div className={styles.settingsSectionHeader}>
                  <div>
                    <div className={styles.settingsSectionTitle}>
                      <span className={styles.settingsSectionIcon} style={{ background:'#fff3ee' }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FF6B35" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                      </span>
                      Personal Information
                    </div>
                    <div className={styles.settingsSectionSub}>Update your personal details</div>
                  </div>
                  {!editing
                    ? <button type="button" className={styles.settingsEditBtn} onClick={() => { setDraft(profile); setEditing(true); }}>Edit</button>
                    : <div className={styles.settingsEditActions}>
                        <button type="button" className={styles.settingsCancelBtn} onClick={() => { setDraft(profile); setEditing(false); }}>Cancel</button>
                        <button type="button" className={styles.settingsSaveBtn} onClick={handleSave}>Save Changes</button>
                      </div>
                  }
                </div>

                {/* Avatar row */}
                <div className={styles.settingsAvatarRow}>
                  <div className={styles.settingsAvatarWrap} onClick={() => avatarInputRef.current?.click()}>
                    {profileImage
                      ? <img src={profileImage} alt={displayName} className={styles.settingsAvatar} referrerPolicy="no-referrer" />
                      : <div className={styles.settingsAvatarFallback}>{(displayName[0]||'U').toUpperCase()}</div>
                    }
                    <div className={styles.settingsAvatarOverlay}>
                      {avatarUploading
                        ? <div className={styles.avatarSpinner} />
                        : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
                      }
                    </div>
                  </div>
                  <div className={styles.settingsAvatarInfo}>
                    <div className={styles.settingsAvatarName}>{displayName}</div>
                    <div className={styles.settingsAvatarHint}>Click photo to change · JPG, PNG up to 5 MB</div>
                    <button type="button" className={styles.settingsAvatarBtn} onClick={() => avatarInputRef.current?.click()}>
                      Upload New Photo
                    </button>
                  </div>
                </div>

                {/* Fields */}
                <div className={styles.settingsFieldGrid}>
                  <div className={styles.settingsField}>
                    <label className={styles.settingsLabel}>First Name</label>
                    <input className={styles.settingsInput} value={editing ? draft.firstName : profile.firstName}
                      disabled={!editing} onChange={e => setDraft(d => ({ ...d, firstName: e.target.value }))} placeholder="First name" />
                  </div>
                  <div className={styles.settingsField}>
                    <label className={styles.settingsLabel}>Last Name</label>
                    <input className={styles.settingsInput} value={editing ? draft.lastName : profile.lastName}
                      disabled={!editing} onChange={e => setDraft(d => ({ ...d, lastName: e.target.value }))} placeholder="Last name" />
                  </div>
                  <div className={styles.settingsField}>
                    <label className={styles.settingsLabel}>Email</label>
                    <input className={styles.settingsInput} value={editing ? draft.email : profile.email}
                      disabled type="email" placeholder="Email" />
                    <span className={styles.settingsFieldHint}>Email cannot be changed</span>
                  </div>
                  <div className={styles.settingsField}>
                    <label className={styles.settingsLabel}>Phone</label>
                    <input className={styles.settingsInput} value={editing ? draft.phone : profile.phone}
                      disabled={!editing} type="tel" maxLength={10}
                      onChange={e => setDraft(d => ({ ...d, phone: e.target.value.replace(/\D/g,'') }))} placeholder="10-digit mobile" />
                  </div>
                  <div className={styles.settingsField}>
                    <label className={styles.settingsLabel}>Date of Birth</label>
                    <input className={styles.settingsInput} value={editing ? draft.dob : profile.dob}
                      disabled={!editing} type="date"
                      onChange={e => setDraft(d => ({ ...d, dob: e.target.value }))} />
                  </div>
                  <div className={styles.settingsField}>
                    <label className={styles.settingsLabel}>Gender</label>
                    <select className={styles.settingsInput} value={editing ? draft.gender : profile.gender}
                      disabled={!editing} onChange={e => setDraft(d => ({ ...d, gender: e.target.value }))}>
                      <option value="">Prefer not to say</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Security section */}
              <div className={styles.settingsSection}>
                <div className={styles.settingsSectionHeader}>
                  <div>
                    <div className={styles.settingsSectionTitle}>
                      <span className={styles.settingsSectionIcon} style={{ background:'#eff6ff' }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                      </span>
                      Security
                    </div>
                    <div className={styles.settingsSectionSub}>Keep your account safe</div>
                  </div>
                </div>
                <div className={styles.settingsSecurityList}>
                  <div className={styles.settingsSecurityRow}>
                    <div>
                      <div className={styles.settingsSecurityLabel}>Password</div>
                      <div className={styles.settingsSecuritySub}>Last changed recently</div>
                    </div>
                    <button type="button" className={styles.settingsSecurityBtn}>Change Password</button>
                  </div>
                  <div className={styles.settingsSecurityRow}>
                    <div>
                      <div className={styles.settingsSecurityLabel}>Two-Factor Authentication</div>
                      <div className={styles.settingsSecuritySub}>Add an extra layer of security</div>
                    </div>
                    <label className={styles.settingsToggle}>
                      <input type="checkbox" />
                      <span className={styles.settingsToggleSlider} />
                    </label>
                  </div>
                </div>
              </div>

              {/* Danger zone */}
              <div className={styles.settingsSection}>
                <div className={styles.settingsSectionHeader}>
                  <div>
                    <div className={styles.settingsSectionTitle}>
                      <span className={styles.settingsSectionIcon} style={{ background:'#fff1f2' }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f43f5e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                      </span>
                      Danger Zone
                    </div>
                    <div className={styles.settingsSectionSub}>Irreversible account actions</div>
                  </div>
                </div>
                <div className={styles.settingsDangerList}>
                  <div className={styles.settingsDangerRow}>
                    <div>
                      <div className={styles.settingsSecurityLabel}>Sign out everywhere</div>
                      <div className={styles.settingsSecuritySub}>Log out of all devices</div>
                    </div>
                    <button type="button" className={styles.settingsDangerBtn} onClick={(handleSignOut) => signOut({ callbackUrl:'/login' })}>Sign Out</button>
                  </div>
                  <div className={styles.settingsDangerRow}>
                    <div>
                      <div className={styles.settingsSecurityLabel}>Delete account</div>
                      <div className={styles.settingsSecuritySub}>Permanently remove your account & data</div>
                    </div>
                    <button type="button" className={styles.settingsDangerBtnSolid}>Delete Account</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ─── NOTIFICATIONS ─── */}
        {tab === 'notifications' && (
          <div className={`${styles.tabWrap} ${styles.desktopOnly}`}>
            <div className={styles.tabHeader}>
              <div>
                <h1 className={styles.tabTitle}>Notifications</h1>
                <p className={styles.tabSubtitle}>Stay updated on orders, offers and more</p>
              </div>
            </div>
            <NotificationsTab orders={orders} profile={profile} showToast={showToast} setTab={setTab} token={token} />
          </div>
        )}

        {/* ─── HELP ─── */}
        {tab === 'help' && (
          <div className={`${styles.tabWrap} ${styles.desktopOnly}`}>
            <div className={styles.tabHeader}>
              <div>
                <h1 className={styles.tabTitle}>Help & Support</h1>
                <p className={styles.tabSubtitle}>We're here to help you 24/7</p>
              </div>
            </div>

            <div className={styles.helpWrap}>
              <div className={styles.helpContactGrid}>
                <a href="tel:+919876543210" className={styles.helpContactCard}>
                  <div className={styles.helpContactIcon} style={{ background:'#f0fdf4', color:'#10b981' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.4 2 2 0 0 1 3.6 1.22h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.86a16 16 0 0 0 6 6l.95-.96a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21.77 16.92z"/></svg>
                  </div>
                  <div className={styles.helpContactTitle}>Call Us</div>
                  <div className={styles.helpContactSub}>+91 98765 43210</div>
                </a>
                <a href="mailto:hello@littleloot.com" className={styles.helpContactCard}>
                  <div className={styles.helpContactIcon} style={{ background:'#eff6ff', color:'#3b82f6' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                  </div>
                  <div className={styles.helpContactTitle}>Email Us</div>
                  <div className={styles.helpContactSub}>hello@littleloot.com</div>
                </a>
                <a href="https://wa.me/919876543210" target="_blank" rel="noopener" className={styles.helpContactCard}>
                  <div className={styles.helpContactIcon} style={{ background:'#f0fdf4', color:'#25d366' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347"/></svg>
                  </div>
                  <div className={styles.helpContactTitle}>WhatsApp</div>
                  <div className={styles.helpContactSub}>Chat with us</div>
                </a>
              </div>

              <div className={styles.helpFaq}>
                <h3 className={styles.helpFaqTitle}>Frequently Asked Questions</h3>
                {[
                  { q:'How do I track my order?', a:'Go to "My Orders", select your order and click "Track Order" to see real-time delivery status.' },
                  { q:'What is your return policy?', a:'We offer hassle-free 7-day returns on most products. Items must be unused and in original packaging.' },
                  { q:'How do I apply a coupon?', a:'Go to the "Coupons" tab, copy the code, and apply it at checkout to get your discount.' },
                  { q:'Are the products safe for kids?', a:'Absolutely! All our products are made with certified child-safe, non-toxic materials.' },
                  { q:'How long does delivery take?', a:'Standard delivery takes 3–5 business days. Express delivery is available in select cities.' },
                ].map((f,i) => (
                  <details key={i} className={styles.helpFaqItem}>
                    <summary className={styles.helpFaqQ}>{f.q}</summary>
                    <p className={styles.helpFaqA}>{f.a}</p>
                  </details>
                ))}
              </div>
            </div>
          </div>
        )}

      </main>
      {/* ══════════ ADDRESS MODAL ══════════ */}
      {showAddrModal && (
        <div className={styles.modalOverlay} onClick={() => !addrSaving && setShowAddrModal(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>{editingAddr ? 'Edit Address' : 'Add New Address'}</h2>
              <button type="button" className={styles.modalClose} onClick={() => !addrSaving && setShowAddrModal(false)}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>

            <div className={styles.modalBody}>
              {/* Type selector */}
              <div className={styles.modalField}>
                <label className={styles.modalLabel}>Address Type</label>
                <div className={styles.addrTypeSelector}>
                  {(['Home','Office','Other'] as const).map(t => (
                    <button key={t} type="button"
                      className={`${styles.addrTypeOption} ${addrForm.type===t ? styles.addrTypeOptionActive : ''}`}
                      onClick={() => setAddrForm(f => ({ ...f, type: t }))}>
                      {t==='Home' ? '🏠' : t==='Office' ? '🏢' : '📌'} {t}
                    </button>
                  ))}
                </div>
              </div>

              <div className={styles.modalFieldGrid}>
                <div className={styles.modalField}>
                  <label className={styles.modalLabel}>Full Name *</label>
                  <input className={`${styles.modalInput} ${addrErrors.name ? styles.modalInputError : ''}`}
                    value={addrForm.name} onChange={e => setAddrForm(f => ({ ...f, name: e.target.value }))} placeholder="Recipient's name" />
                  {addrErrors.name && <span className={styles.modalError}>{addrErrors.name}</span>}
                </div>
                <div className={styles.modalField}>
                  <label className={styles.modalLabel}>Phone *</label>
                  <input className={`${styles.modalInput} ${addrErrors.phone ? styles.modalInputError : ''}`}
                    value={addrForm.phone} maxLength={10} type="tel"
                    onChange={e => setAddrForm(f => ({ ...f, phone: e.target.value.replace(/\D/g,'') }))} placeholder="10-digit mobile" />
                  {addrErrors.phone && <span className={styles.modalError}>{addrErrors.phone}</span>}
                </div>
              </div>

              <div className={styles.modalField}>
                <label className={styles.modalLabel}>Address Line 1 *</label>
                <input className={`${styles.modalInput} ${addrErrors.line1 ? styles.modalInputError : ''}`}
                  value={addrForm.line1} onChange={e => setAddrForm(f => ({ ...f, line1: e.target.value }))} placeholder="House no., Building, Street" />
                {addrErrors.line1 && <span className={styles.modalError}>{addrErrors.line1}</span>}
              </div>

              <div className={styles.modalField}>
                <label className={styles.modalLabel}>Address Line 2</label>
                <input className={styles.modalInput}
                  value={addrForm.line2} onChange={e => setAddrForm(f => ({ ...f, line2: e.target.value }))} placeholder="Landmark, Area (optional)" />
              </div>

              <div className={styles.modalFieldGrid}>
                <div className={styles.modalField}>
                  <label className={styles.modalLabel}>City *</label>
                  <input className={`${styles.modalInput} ${addrErrors.city ? styles.modalInputError : ''}`}
                    value={addrForm.city} onChange={e => setAddrForm(f => ({ ...f, city: e.target.value }))} placeholder="City" />
                  {addrErrors.city && <span className={styles.modalError}>{addrErrors.city}</span>}
                </div>
                <div className={styles.modalField}>
                  <label className={styles.modalLabel}>State *</label>
                  <select className={`${styles.modalInput} ${addrErrors.state ? styles.modalInputError : ''}`}
                    value={addrForm.state} onChange={e => setAddrForm(f => ({ ...f, state: e.target.value }))}>
                    <option value="">Select State</option>
                    {INDIA_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  {addrErrors.state && <span className={styles.modalError}>{addrErrors.state}</span>}
                </div>
              </div>

              <div className={styles.modalField}>
                <label className={styles.modalLabel}>Pincode *</label>
                <input className={`${styles.modalInput} ${addrErrors.pincode ? styles.modalInputError : ''}`}
                  value={addrForm.pincode} maxLength={6} type="tel"
                  onChange={e => setAddrForm(f => ({ ...f, pincode: e.target.value.replace(/\D/g,'') }))} placeholder="6-digit pincode" />
                {addrErrors.pincode && <span className={styles.modalError}>{addrErrors.pincode}</span>}
              </div>

              <label className={styles.modalCheckRow}>
                <input type="checkbox" checked={addrForm.isDefault}
                  onChange={e => setAddrForm(f => ({ ...f, isDefault: e.target.checked }))} />
                <span>Set as default delivery address</span>
              </label>
            </div>

            <div className={styles.modalFooter}>
              <button type="button" className={styles.modalCancelBtn} onClick={() => !addrSaving && setShowAddrModal(false)} disabled={addrSaving}>
                Cancel
              </button>
              <button type="button" className={styles.modalSaveBtn} onClick={handleAddrSave} disabled={addrSaving}>
                {addrSaving ? <span className={styles.btnSpinner} /> : (editingAddr ? 'Update Address' : 'Save Address')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════ REVIEW MODAL ══════════ */}
      {showReviewModal && reviewTarget && (
        <div className={styles.modalOverlay} onClick={() => !reviewSaving && setShowReviewModal(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>{reviewTarget.alreadyReviewed ? 'Edit Review' : 'Write a Review'}</h2>
              <button type="button" className={styles.modalClose} onClick={() => !reviewSaving && setShowReviewModal(false)}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>

            <div className={styles.modalBody}>
              {/* Product preview */}
              <div className={styles.reviewModalProduct}>
                <div className={styles.reviewModalImg}>
                  <img src={reviewTarget.productImage} alt={reviewTarget.productName} onError={e=>{(e.target as HTMLImageElement).src=PLACEHOLDER;}} />
                </div>
                <div>
                  <div className={styles.reviewModalName}>{reviewTarget.productName}</div>
                  <div className={styles.reviewModalOrder}>Ordered {reviewTarget.orderDate}</div>
                </div>
              </div>

              {/* Star rating */}
              <div className={styles.reviewModalRatingBlock}>
                <label className={styles.modalLabel}>Your Rating *</label>
                <StarRating value={reviewDraft.rating} onChange={v => setReviewDraft(d => ({ ...d, rating: v }))} size="lg" />
              </div>

              {/* Comment */}
              <div className={styles.modalField}>
                <label className={styles.modalLabel}>Your Review *</label>
                <textarea className={styles.modalTextarea}
                  value={reviewDraft.comment}
                  onChange={e => setReviewDraft(d => ({ ...d, comment: e.target.value }))}
                  placeholder="Share your experience with this product… (min 10 characters)"
                  rows={5} maxLength={500} />
                <span className={styles.reviewCharCount}>{reviewDraft.comment.length}/500</span>
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button type="button" className={styles.modalCancelBtn} onClick={() => !reviewSaving && setShowReviewModal(false)} disabled={reviewSaving}>
                Cancel
              </button>
              <button type="button" className={styles.modalSaveBtn} onClick={handleReviewSubmit} disabled={reviewSaving}>
                {reviewSaving ? <span className={styles.btnSpinner} /> : (reviewTarget.alreadyReviewed ? 'Update Review' : 'Submit Review')}
              </button>
            </div>
          </div>
        </div>
      )}

       {/* ══════════ RETURN MODAL (create) ══════════ */}
      {returnModalOrder && (
        <ReturnModal
          mode="create"
          token={token}
          order={{ id: returnModalOrder.id, rawItems: returnModalOrder.rawItems, date: returnModalOrder.date }}
          onClose={() => setReturnModalOrder(null)}
          onCreated={() => { reloadReturns(); showToast('✅ Return request submitted'); }}
        />
      )}

      {/* ══════════ RETURN MODAL (view) ══════════ */}
      {viewReturnId && (
        <ReturnModal
          mode="view"
          token={token}
          returnId={viewReturnId}
          onClose={() => setViewReturnId(null)}
          onCancelled={() => { setViewReturnId(null); reloadReturns(); showToast('Return request cancelled'); }}
        />
      )}


      {/* ══════════ TOAST ══════════ */}
      {toast && (
        <div className={styles.toast}>
          <span>{toast}</span>
        </div>
      )}

    </div>
  );
}