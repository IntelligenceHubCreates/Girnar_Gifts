'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from './AccountPage.module.css';
import { RETURN_STATUS_LABEL, RETURN_STATUS_COLOR, RETURN_REASON_LABEL, type ReturnSummary } from '@/lib/returnsApi';
import { brand } from '@/config/brand';

/* ═══════════════════════════════════════════════════════════════════════════
   MobileAccountTabs.tsx
   App-style mobile screens for the Account page (≤768px). Light Girnar Gifts
   theme. All six tab components live here as named exports:
     MobileDashboard · MobileOrders · MobileWishlist ·
     MobileAddresses · MobileReviews · MobileProfile
   They receive data + callbacks from AccountPage, so every mutation
   (cart, wishlist, reviews, addresses, cancel-order, profile save) runs
   through AccountPage's existing functions — no duplicated API logic.
   ═══════════════════════════════════════════════════════════════════════════ */

/* ── Shared helpers ───────────────────────────────────────────────────────── */
const PLACEHOLDER = '/images/placeholder-product.png';

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

const STATUS_COLOR: Record<string, { bg: string; color: string }> = {
  delivered:        { bg: '#ecfdf5', color: '#059669' },
  shipped:          { bg: '#eff6ff', color: '#2563eb' },
  processing:       { bg: '#fffbeb', color: '#d97706' },
  confirmed:        { bg: '#fffbeb', color: '#d97706' },
  pending:          { bg: '#fffbeb', color: '#d97706' },
  cancelled:        { bg: '#fff1f2', color: '#e11d48' },
  out_for_delivery: { bg: '#eff6ff', color: '#2563eb' },
  packed:           { bg: '#eff6ff', color: '#2563eb' },
};

/* ── Shared types ─────────────────────────────────────────────────────────── */
export interface MappedOrder {
  id: string; name: string; date: string;
  amount: number; status: string; images: string[]; itemCount: number; rawItems: any[];
}
export interface Address {
  id: string; backendId?: string;
  type: 'Home' | 'Office' | 'Other'; name: string; phone: string;
  line1: string; line2: string; city: string; state: string; pincode: string; isDefault: boolean;
}
type CartState = 'idle' | 'loading' | 'added' | 'error';
interface ReviewTarget {
  productId: string; productName: string; productImage: string;
  orderId: string; orderDate: string; alreadyReviewed: boolean;
}
interface ReviewableProduct {
  productId: string; productName: string; productImage: string;
  orderId: string; orderDate: string; alreadyReviewed: boolean;
  existingReview?: any; /* AccountPage's Review shape — kept `any` to match its typing */
}
interface Counts { orders: number; delivered: number; wishlist: number; addresses: number; reviews: number; pendingReviews: number; coupons: number; }
interface ProfileData {
  firstName: string; lastName: string; email: string;
  phone: string; dob: string; gender: string; backendAvatar?: string;
}

/* ── Shared icons ─────────────────────────────────────────────────────────── */
const Search = ({ s = 18 }: { s?: number }) => (<svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>);
const ChevronDown = ({ s = 18 }: { s?: number }) => (<svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>);
const Truck = ({ s = 15 }: { s?: number }) => (<svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 3h15v13H1z" /><path d="M16 8h4l3 3v5h-7V8z" /><circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" /></svg>);
const XCircle = ({ s = 15 }: { s?: number }) => (<svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg>);
const Trash = ({ s = 16 }: { s?: number }) => (<svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>);
const Plus = ({ s = 17 }: { s?: number }) => (<svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>);
const Edit = ({ s = 14 }: { s?: number }) => (<svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>);
const Check = ({ s = 14 }: { s?: number }) => (<svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>);
const Wa = ({ s = 16 }: { s?: number }) => (<svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347" /></svg>);
const Cam = ({ s = 14 }: { s?: number }) => (<svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" /></svg>);
const Logout = ({ s = 16 }: { s?: number }) => (<svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>);
const Bag = ({ s = 18 }: { s?: number }) => (<svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" /><rect x="9" y="3" width="6" height="4" rx="1" /></svg>);
const Heart = ({ s = 18 }: { s?: number }) => (<svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg>);
const Pin = ({ s = 18 }: { s?: number }) => (<svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" /><circle cx="12" cy="9" r="2.5" /></svg>);
const Star = ({ s = 18 }: { s?: number }) => (<svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>);
const User = ({ s = 18 }: { s?: number }) => (<svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>);

const Phone = ({ s = 20 }: { s?: number }) => (<svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.4 2 2 0 0 1 3.6 1.22h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.86a16 16 0 0 0 6 6l.95-.96a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21.77 16.92z" /></svg>);
const Mail = ({ s = 20 }: { s?: number }) => (<svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>);

function Stars({ value }: { value: number }) {
  return (
    <span className={styles.mtStars} aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map(s => (<span key={s} className={s <= value ? '' : styles.mtStarsEmpty}>★</span>))}
    </span>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   DASHBOARD
   ═══════════════════════════════════════════════════════════════════════════ */
interface DashboardProps {
  profileImage: string | null;
  displayName: string;
  firstName?: string;
  phone?: string;
  counts: Counts;
  totalSpend: number;
  recentOrders: MappedOrder[];
  activeOrders: MappedOrder[];
  onNavigate: (tab: string) => void;
  onAvatarClick: () => void;
  avatarUploading?: boolean;
}

export function MobileDashboard({
  profileImage, displayName, firstName, phone, counts, totalSpend,
  recentOrders, activeOrders, onNavigate, onAvatarClick, avatarUploading,
}: DashboardProps) {
  const initial = (displayName?.[0] || 'U').toUpperCase();
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const stats = [
    { label: 'Orders',    value: counts.orders,    sub: `${counts.delivered} delivered`, color: '#3b82f6', bg: '#eff6ff', icon: <Bag />,   tab: 'orders' },
    { label: 'Wishlist',  value: counts.wishlist,  sub: 'items saved',                   color: '#f43f5e', bg: '#fff1f2', icon: <Heart />, tab: 'wishlist' },
    { label: 'Addresses', value: counts.addresses, sub: 'saved',                          color: '#10b981', bg: '#ecfdf5', icon: <Pin />,   tab: 'addresses' },
    { label: 'Reviews',   value: counts.reviews,   sub: counts.pendingReviews > 0 ? `${counts.pendingReviews} pending` : 'all done', color: '#a855f7', bg: '#faf5ff', icon: <Star />, tab: 'reviews' },
  ];
  const actions = [
    { label: 'View orders',      color: '#3b82f6', bg: '#eff6ff', icon: <Bag />,   tab: 'orders' },
    { label: 'Manage addresses', color: '#10b981', bg: '#ecfdf5', icon: <Pin />,   tab: 'addresses' },
    { label: 'My wishlist',      color: '#f43f5e', bg: '#fff1f2', icon: <Heart />, tab: 'wishlist' },
    { label: 'Edit profile',     color: '#FF6B35', bg: '#fff5f2', icon: <User />,  tab: 'settings' },
  ];

  return (
    <div className={styles.mtShell}>
      <div className={styles.mtHero}>
        <div className={styles.mtAvatarWrap} onClick={onAvatarClick}>
          {profileImage
            ? <img src={profileImage} alt={displayName} className={styles.mtAvatar} referrerPolicy="no-referrer" />
            : <div className={styles.mtAvatarFallback}>{initial}</div>}
          <div className={styles.mtAvatarCam}>
            {avatarUploading ? <span className={styles.avatarSpinner} /> : <Cam s={12} />}
          </div>
        </div>
        <div className={styles.mtHeroInfo}>
          <div className={styles.mtGreeting}>{greeting},</div>
          <div className={styles.mtHeroName}>{firstName || displayName} 👋</div>
          <div className={styles.mtHeroEmail}>{phone ? `📞 ${phone}` : `Welcome back to ${brand.name}`}</div>
        </div>
      </div>

      <div className={styles.mtStatGrid}>
        {stats.map(s => (
          <div key={s.label} className={styles.mtStatCard} onClick={() => onNavigate(s.tab)}>
            <div className={styles.mtStatTop}>
              <span className={styles.mtStatIcon} style={{ background: s.bg, color: s.color }}>{s.icon}</span>
              <span className={styles.mtStatNum} style={{ color: s.color }}>{s.value}</span>
            </div>
            <div className={styles.mtStatLabel}>{s.label}</div>
            <div className={styles.mtStatSub}>{s.sub}</div>
          </div>
        ))}
      </div>

      {activeOrders.length > 0 && (
        <div className={styles.mtActiveOrder} onClick={() => onNavigate('orders')}>
          <span className={styles.mtActiveDot} />
          <div className={styles.mtActiveBody}>
            <div className={styles.mtActiveTitle}>{activeOrders.length} order{activeOrders.length > 1 ? 's' : ''} in progress</div>
            <div className={styles.mtActiveSub}>{activeOrders[0].name} · {activeOrders[0].status}</div>
          </div>
          <span className={styles.mtActiveAmt}>₹{activeOrders[0].amount.toLocaleString('en-IN')}</span>
        </div>
      )}

      <div className={styles.mtSectionTitle}>Quick actions</div>
      <div className={styles.mtActionGrid}>
        {actions.map(a => (
          <button key={a.label} type="button" className={styles.mtActionCard} onClick={() => onNavigate(a.tab)}>
            <span className={styles.mtActionIcon} style={{ background: a.bg, color: a.color }}>{a.icon}</span>
            <span className={styles.mtActionLabel}>{a.label}</span>
          </button>
        ))}
      </div>

      <div className={styles.mtCard}>
        <div className={styles.mtCardHead}>
          <span className={styles.mtCardTitle}>Recent orders</span>
          <button type="button" className={styles.mtCardAction} onClick={() => onNavigate('orders')}>View all →</button>
        </div>
        {recentOrders.length === 0 ? (
          <div className={styles.mtEmptyMini}><span>📦</span><span>No orders yet</span></div>
        ) : (
          <div>
            {recentOrders.map(o => {
              const sk = o.status.toLowerCase().replace(/ /g, '_');
              const sc = STATUS_COLOR[sk] ?? STATUS_COLOR.processing;
              return (
                <div key={o.id} className={styles.mtRecentRow} onClick={() => onNavigate('orders')}>
                  <div className={styles.mtRecentImg}>
                    {o.images[0]
                      ? <img src={o.images[0]} alt="" onError={e => { (e.target as HTMLImageElement).src = PLACEHOLDER; }} />
                      : <span>📦</span>}
                  </div>
                  <div className={styles.mtRecentInfo}>
                    <div className={styles.mtRecentName}>{o.name}</div>
                    <div className={styles.mtRecentMeta}>#{o.id.slice(0, 8).toUpperCase()} · {o.date}</div>
                  </div>
                  <div className={styles.mtRecentEnd}>
                    <div className={styles.mtRecentAmt}>₹{o.amount.toLocaleString('en-IN')}</div>
                    <span className={styles.mtStatusPill} style={{ background: sc.bg, color: sc.color }}>{o.status}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {counts.delivered > 0 && (
        <div className={styles.mtCard}>
          <div className={styles.mtCardHead}>
            <span className={styles.mtCardTitle}>Total spent</span>
            <span className={styles.mtStatNum} style={{ fontSize: 20, color: '#FF6B35' }}>₹{totalSpend.toLocaleString('en-IN')}</span>
          </div>
          <div className={styles.mtStatSub}>Across {counts.delivered} delivered order{counts.delivered > 1 ? 's' : ''}</div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   ORDERS
   ═══════════════════════════════════════════════════════════════════════════ */
interface OrdersProps {
  orders: MappedOrder[];
  loading?: boolean;
  cancellingId: string | null;
  onCancelOrder: (id: string) => void;
  onOpenReview: (t: ReviewTarget) => void;
    /* Phase 13 — returns (optional so the component is back-compat if unwired) */
  returnsByOrder?: Record<string, ReturnSummary[]>;
  onRequestReturn?: (order: MappedOrder) => void;
  onViewReturn?: (returnId: string) => void;
}

export function MobileOrders({
  orders, loading, cancellingId, onCancelOrder, onOpenReview,
  returnsByOrder = {}, onRequestReturn, onViewReturn,
}: OrdersProps) {
  const [filter, setFilter] = useState<'all' | 'active' | 'delivered' | 'cancelled'>('all');
  const [query, setQuery] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [confirmCancel, setConfirmCancel] = useState<string | null>(null);

  if (loading) {
    return (<div className={styles.mtShell}>{[1, 2, 3].map(i => <div key={i} className={styles.mtSkeleton} />)}</div>);
  }

  const filtered = orders.filter(o => {
    const sk = o.status.toLowerCase().replace(/ /g, '_');
    const matchFilter =
      filter === 'all' ? true :
      filter === 'active' ? ['processing', 'pending', 'confirmed', 'packed', 'shipped', 'out_for_delivery'].includes(sk) :
      filter === 'delivered' ? sk === 'delivered' :
      sk === 'cancelled';
    const matchQuery = !query ||
      o.name.toLowerCase().includes(query.toLowerCase()) ||
      o.id.toLowerCase().includes(query.toLowerCase());
    return matchFilter && matchQuery;
  });

  return (
    <div className={styles.mtShell}>
      <div className={styles.mtFilterScroll}>
        {([['all', 'All'], ['active', 'Active'], ['delivered', 'Delivered'], ['cancelled', 'Cancelled']] as const).map(([k, label]) => (
          <button key={k} type="button" className={`${styles.mtChip} ${filter === k ? styles.mtChipActive : ''}`} onClick={() => setFilter(k)}>{label}</button>
        ))}
      </div>

      <div className={styles.mtSearch}>
        <Search />
        <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search orders" inputMode="search" aria-label="Search orders" />
      </div>

      {filtered.length === 0 ? (
        <div className={styles.mtEmpty}>
          <div className={styles.mtEmptyIcon}>📦</div>
          <div className={styles.mtEmptyTitle}>{orders.length === 0 ? 'No orders yet' : 'No matching orders'}</div>
          <div className={styles.mtEmptyText}>{orders.length === 0 ? 'Your orders will show up here once you place one.' : 'Try a different filter or search term.'}</div>
          {orders.length === 0 && <Link href="/products" className={styles.mtBtnPrimary}>Start shopping →</Link>}
        </div>
      ) : (
        <div className={styles.mtList}>
          {filtered.map(o => {
            const sk = o.status.toLowerCase().replace(/ /g, '_');
            const sc = STATUS_COLOR[sk] ?? STATUS_COLOR.processing;
            const open = expanded === o.id;
            const canCancel = ['pending', 'processing', 'confirmed', 'packed'].includes(sk);
            return (
              <div key={o.id} className={styles.mtOrderCard}>
                <button type="button" className={styles.mtOrderHead} onClick={() => setExpanded(open ? null : o.id)} aria-expanded={open}>
                  <div className={styles.mtOrderThumb}>
                    {o.images[0]
                      ? <img src={o.images[0]} alt="" onError={e => { (e.target as HTMLImageElement).src = PLACEHOLDER; }} />
                      : <span>📦</span>}
                    {o.itemCount > 1 && <span className={styles.mtOrderThumbCount}>{o.itemCount}</span>}
                  </div>
                  <div className={styles.mtOrderMid}>
                    <div className={styles.mtOrderName}>{o.name}</div>
                    <div className={styles.mtOrderSub}>#{o.id.slice(0, 8).toUpperCase()} · {o.date}</div>
                    <div className={styles.mtOrderSub}>{o.itemCount} item{o.itemCount !== 1 ? 's' : ''}</div>
                  </div>
                  <div className={styles.mtOrderEnd}>
                    <span className={styles.mtStatusPill} style={{ background: sc.bg, color: sc.color }}>{o.status}</span>
                    <span className={styles.mtOrderAmt}>₹{o.amount.toLocaleString('en-IN')}</span>
                    <span className={`${styles.mtChevron} ${open ? styles.mtChevronUp : ''}`}><ChevronDown /></span>
                  </div>
                </button>

                {open && (
                  <div className={styles.mtOrderBody}>
                    <div className={styles.mtOrderItems}>
                      {o.rawItems.map((it: any, idx: number) => {
                        const p = it.product || {};
                        const qty = it.quantity ?? it.count ?? 1;
                        const price = Number(it.price ?? getSellingPrice(p));
                        return (
                          <div key={idx} className={styles.mtOrderItem}>
                            <div className={styles.mtOrderItemImg}>
                              <img src={getProductImage(p)} alt={p.name} onError={e => { (e.target as HTMLImageElement).src = PLACEHOLDER; }} />
                            </div>
                            <div className={styles.mtOrderItemInfo}>
                              <Link href={`/product/${p.id}`} className={styles.mtOrderItemName}>{p.name || 'Product'}</Link>
                              <div className={styles.mtOrderItemMeta}>Qty {qty} × ₹{price.toLocaleString('en-IN')}</div>
                            </div>
                            <div className={styles.mtOrderItemTotal}>₹{(price * qty).toLocaleString('en-IN')}</div>
                          </div>
                        );
                      })}
                    </div>

                      {/* Returns for this order (Phase 13) */}
                    {(returnsByOrder[o.id] ?? []).length > 0 && (
                      <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px dashed #e8e0d5' }}>
                        <div style={{ fontSize: 11, fontWeight: 800, color: '#6b7280', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '.04em' }}>
                          Returns
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                          {(returnsByOrder[o.id] ?? []).map(rr => {
                            const sc = RETURN_STATUS_COLOR[rr.status] ?? { bg: '#f3f4f6', color: '#374151' };
                            return (
                              <button key={rr.id} type="button"
                                onClick={() => onViewReturn?.(rr.id)}
                                style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', textAlign: 'left',
                                  background: '#fafafa', border: '1px solid #eee', borderRadius: 10, padding: '8px 10px', cursor: 'pointer' }}>
                                <span style={{ fontSize: 10.5, fontWeight: 800, padding: '3px 8px', borderRadius: 20, whiteSpace: 'nowrap', background: sc.bg, color: sc.color }}>
                                  {RETURN_STATUS_LABEL[rr.status] ?? rr.status}
                                </span>
                                <span style={{ flex: 1, fontSize: 11.5, color: '#6b7280', fontWeight: 600, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {RETURN_REASON_LABEL[rr.reason] ?? rr.reason} · {rr.item_count} item{rr.item_count !== 1 ? 's' : ''}
                                </span>
                                <span style={{ fontSize: 11.5, fontWeight: 800, color: '#FF6B35', whiteSpace: 'nowrap' }}>View →</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    <div className={styles.mtOrderActions}>
                      <Link href={`/track-order?order_id=${o.id}`} className={styles.mtBtn}><Truck /> Track order</Link>

                      {sk === 'delivered' && (
                        <button type="button" className={styles.mtBtnAmber}
                          onClick={() => {
                            const first = o.rawItems[0]?.product;
                            if (first) onOpenReview({
                              productId: String(first.id), productName: first.name,
                              productImage: getProductImage(first), orderId: o.id,
                              orderDate: o.date, alreadyReviewed: false,
                            });
                          }}>
                          ⭐ Write review
                        </button>
                      )}

                        {sk === 'delivered' && onRequestReturn && (
                        <button type="button" className={styles.mtBtn} onClick={() => onRequestReturn(o)}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 14 4 9 9 4"/><path d="M20 20v-7a4 4 0 0 0-4-4H4"/></svg>
                          Request return
                        </button>
                      )}

                      {canCancel && (confirmCancel === o.id ? (
                        <span className={styles.mtCancelConfirm}>
                          <span className={styles.mtCancelText}>Cancel this order?</span>
                          <button type="button" className={styles.mtCancelYes} disabled={cancellingId === o.id} onClick={() => onCancelOrder(o.id)}>
                            {cancellingId === o.id ? <span className={styles.btnSpinner} /> : 'Yes'}
                          </button>
                          <button type="button" className={styles.mtCancelNo} disabled={cancellingId === o.id} onClick={() => setConfirmCancel(null)}>Keep</button>
                        </span>
                      ) : (
                        <button type="button" className={styles.mtBtnDanger} onClick={() => setConfirmCancel(o.id)}><XCircle /> Cancel</button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   WISHLIST
   ═══════════════════════════════════════════════════════════════════════════ */
interface WishlistProps {
  favs: any[];
  cartStates: Record<string, CartState>;
  onAddToCart: (e: React.MouseEvent, product: any) => void;
  onToggleWishlist: (e: React.MouseEvent, product: any) => void;
}

export function MobileWishlist({ favs, cartStates, onAddToCart, onToggleWishlist }: WishlistProps) {
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<'default' | 'price_asc' | 'price_desc' | 'name'>('default');

  let list = favs.filter(f => !query || (f.product?.name || '').toLowerCase().includes(query.toLowerCase()));
  if (sort === 'price_asc')  list = [...list].sort((a, b) => getSellingPrice(a.product) - getSellingPrice(b.product));
  if (sort === 'price_desc') list = [...list].sort((a, b) => getSellingPrice(b.product) - getSellingPrice(a.product));
  if (sort === 'name')       list = [...list].sort((a, b) => (a.product?.name || '').localeCompare(b.product?.name || ''));

  if (favs.length === 0) {
    return (
      <div className={styles.mtShell}>
        <div className={styles.mtEmpty}>
          <div className={styles.mtEmptyIcon}>💔</div>
          <div className={styles.mtEmptyTitle}>Your wishlist is empty</div>
          <div className={styles.mtEmptyText}>Tap the heart on any product to save it here.</div>
          <Link href="/products" className={styles.mtBtnPrimary}>Explore products →</Link>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.mtShell}>
      <div className={styles.mtSearch}>
        <Search />
        <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search wishlist" inputMode="search" aria-label="Search wishlist" />
      </div>

      <div className={styles.mtFilterScroll}>
        {([['default', 'Recent'], ['price_asc', 'Price ↑'], ['price_desc', 'Price ↓'], ['name', 'A–Z']] as const).map(([k, label]) => (
          <button key={k} type="button" className={`${styles.mtChip} ${sort === k ? styles.mtChipActive : ''}`} onClick={() => setSort(k)}>{label}</button>
        ))}
      </div>

      <div className={styles.mtList}>
        {list.map(item => {
          const p = item.product; const pid = String(p.id);
          const img = getProductImage(p);
          const price = getSellingPrice(p);
          const orig = Number(p.original_price ?? 0);
          const stock = Number(p.count ?? 0);
          const state: CartState = cartStates[pid] ?? 'idle';
          return (
            <div key={pid} className={styles.mtWishCard}>
              <Link href={`/product/${pid}`} className={styles.mtWishImg}>
                <img src={img} alt={p.name} onError={e => { (e.target as HTMLImageElement).src = PLACEHOLDER; }} />
                {orig > price && <span className={styles.mtWishDiscount}>{Math.round((1 - price / orig) * 100)}% OFF</span>}
              </Link>
              <div className={styles.mtWishBody}>
                <Link href={`/product/${pid}`} className={styles.mtWishName}>{p.name}</Link>
                <div className={styles.mtWishPriceRow}>
                  <span className={styles.mtWishPrice}>₹{price.toLocaleString('en-IN')}</span>
                  {orig > price && <span className={styles.mtWishOld}>₹{orig.toLocaleString('en-IN')}</span>}
                </div>
                <span className={`${styles.mtStockPill} ${stock > 0 ? '' : styles.mtStockOut}`}>{stock > 0 ? 'In stock' : 'Out of stock'}</span>
                <div className={styles.mtWishActions}>
                  <button type="button"
                    className={`${styles.mtCartBtn} ${state === 'added' ? styles.mtCartBtnAdded : ''} ${state === 'error' ? styles.mtCartBtnError : ''}`}
                    onClick={e => onAddToCart(e, p)} disabled={state === 'loading'}>
                    {state === 'loading' ? <span className={styles.btnSpinner} /> :
                      state === 'added' ? '✓ Added' :
                      state === 'error' ? 'Retry' : '🛒 Add to cart'}
                  </button>
                  <button type="button" className={styles.mtRemoveBtn} onClick={e => onToggleWishlist(e, p)} aria-label="Remove from wishlist"><Trash s={17} /></button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   ADDRESSES
   ═══════════════════════════════════════════════════════════════════════════ */
interface AddressesProps {
  addresses: Address[];
  loading?: boolean;
  onAdd: () => void;
  onEdit: (a: Address) => void;
  onDelete: (a: Address) => void;
  onSetDefault: (a: Address) => void;
}

const addrTypeIcon = (t: Address['type']) => (t === 'Home' ? '🏠' : t === 'Office' ? '🏢' : '📌');

export function MobileAddresses({ addresses, loading, onAdd, onEdit, onDelete, onSetDefault }: AddressesProps) {
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  if (loading) {
    return (<div className={styles.mtShell}>{[1, 2].map(i => <div key={i} className={styles.mtSkeleton} style={{ height: 150 }} />)}</div>);
  }

  if (addresses.length === 0) {
    return (
      <div className={styles.mtShell}>
        <div className={styles.mtEmpty}>
          <div className={styles.mtEmptyIcon}>📍</div>
          <div className={styles.mtEmptyTitle}>No addresses saved</div>
          <div className={styles.mtEmptyText}>Add a delivery address to check out faster next time.</div>
          <button type="button" className={styles.mtBtnPrimary} onClick={onAdd}>Add address →</button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.mtShell}>
      <button type="button" className={styles.mtAddrAddBtn} onClick={onAdd}><Plus /> Add new address</button>

      {addresses.map(a => (
        <div key={a.id} className={`${styles.mtAddrCard} ${a.isDefault ? styles.mtAddrCardDefault : ''}`}>
          <div className={styles.mtAddrTop}>
            <span className={styles.mtAddrType}>{addrTypeIcon(a.type)} {a.type}</span>
            {a.isDefault && <span className={styles.mtDefaultBadge}>✓ Default</span>}
          </div>
          <div className={styles.mtAddrName}>{a.name}</div>
          <div className={styles.mtAddrText}>
            {a.line1}{a.line2 ? `, ${a.line2}` : ''}<br />
            {a.city}, {a.state} – {a.pincode}
          </div>
          <div className={styles.mtAddrPhone}>📞 {a.phone}</div>

          <div className={styles.mtAddrActions}>
            {!a.isDefault && (
              <button type="button" className={`${styles.mtBtnGhost} ${styles.mtBtnGhostGreen}`} onClick={() => onSetDefault(a)}><Check /> Set default</button>
            )}
            <button type="button" className={styles.mtBtnGhost} onClick={() => onEdit(a)}><Edit /> Edit</button>
            {confirmDelete === a.id ? (
              <button type="button" className={styles.mtBtnDanger} style={{ flex: 1 }} onClick={() => { onDelete(a); setConfirmDelete(null); }}>Tap to confirm</button>
            ) : (
              <button type="button" className={styles.mtIconDanger} onClick={() => setConfirmDelete(a.id)} aria-label="Delete address"><Trash /></button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   REVIEWS
   ═══════════════════════════════════════════════════════════════════════════ */
interface ReviewsProps {
  reviewProducts: ReviewableProduct[];
  pendingCount: number;
  canWhatsApp: boolean;
  onWhatsApp: () => void;
  onOpenReview: (rp: any) => void;
  onDeleteReview: (id: string) => void;
}

export function MobileReviews({ reviewProducts, pendingCount, canWhatsApp, onWhatsApp, onOpenReview, onDeleteReview }: ReviewsProps) {
  const [filter, setFilter] = useState<'all' | 'pending'>('all');
  const list = filter === 'pending' ? reviewProducts.filter(p => !p.alreadyReviewed) : reviewProducts;

  return (
    <div className={styles.mtShell}>
      <div className={styles.mtFilterScroll}>
        <button type="button" className={`${styles.mtChip} ${filter === 'all' ? styles.mtChipActive : ''}`} onClick={() => setFilter('all')}>All products</button>
        <button type="button" className={`${styles.mtChip} ${filter === 'pending' ? styles.mtChipActive : ''}`} onClick={() => setFilter('pending')}>
          Pending{pendingCount > 0 ? ` (${pendingCount})` : ''}
        </button>
      </div>

      {pendingCount > 0 && canWhatsApp && (
        <button type="button" className={styles.mtWaBtn} onClick={onWhatsApp}><Wa /> Send review reminder on WhatsApp</button>
      )}

      {list.length === 0 ? (
        <div className={styles.mtEmpty}>
          <div className={styles.mtEmptyIcon}>⭐</div>
          <div className={styles.mtEmptyTitle}>{filter === 'pending' ? 'All caught up' : 'Nothing to review yet'}</div>
          <div className={styles.mtEmptyText}>
            {filter === 'pending' ? 'You’ve reviewed every delivered product. Thank you!' : 'Once an order is delivered, you can review it here.'}
          </div>
          {reviewProducts.length === 0 && <Link href="/products" className={styles.mtBtnPrimary}>Start shopping →</Link>}
        </div>
      ) : (
        <div className={styles.mtList}>
          {list.map(rp => {
            const ex = rp.existingReview;
            return (
              <div key={rp.productId} className={styles.mtReviewCard}>
                <div className={styles.mtReviewTop}>
                  <Link href={`/product/${rp.productId}`} className={styles.mtReviewImg}>
                    <img src={rp.productImage} alt={rp.productName} onError={e => { (e.target as HTMLImageElement).src = PLACEHOLDER; }} />
                  </Link>
                  <div className={styles.mtReviewInfo}>
                    <Link href={`/product/${rp.productId}`} className={styles.mtReviewName}>{rp.productName}</Link>
                    <div className={styles.mtReviewMeta}>Ordered {rp.orderDate}</div>
                    {ex ? <Stars value={ex.rating} /> : <span className={styles.mtPendingTag}>Not reviewed yet</span>}
                  </div>
                </div>

                {ex && (
                  <div className={styles.mtReviewComment}>
                    <p>“{ex.comment}”</p>
                    <div className={styles.mtReviewDate}>Reviewed {ex.createdAt}</div>
                  </div>
                )}

                <div className={styles.mtReviewActions}>
                  {ex ? (
                    <>
                      <button type="button" className={styles.mtBtnGhost} onClick={() => onOpenReview(rp)}><Edit /> Edit</button>
                      <button type="button" className={styles.mtBtnDanger} onClick={() => onDeleteReview(ex.id)}><Trash s={15} /> Delete</button>
                    </>
                  ) : (
                    <button type="button" className={styles.mtBtnPrimary} onClick={() => onOpenReview(rp)}>⭐ Write review</button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   PROFILE (settings)
   ═══════════════════════════════════════════════════════════════════════════ */
interface ProfileProps {
  profileImage: string | null;
  displayName: string;
  profile: ProfileData;
  draft: ProfileData;
  editing: boolean;
  avatarUploading?: boolean;
  onAvatarClick: () => void;
  onEdit: () => void;
  onCancel: () => void;
  onSave: () => void;
  onChange: (patch: Partial<ProfileData>) => void;
  onSignOut: () => void;
}

export function MobileProfile({
  profileImage, displayName, profile, draft, editing,
  avatarUploading, onAvatarClick, onEdit, onCancel, onSave, onChange, onSignOut,
}: ProfileProps) {
  const v = editing ? draft : profile;
  const initial = (displayName?.[0] || 'U').toUpperCase();

  return (
    <div className={styles.mtShell}>
      <div className={styles.mtProfileHero}>
        <div className={styles.mtProfileAvatarWrap} onClick={onAvatarClick}>
          {profileImage
            ? <img src={profileImage} alt={displayName} className={styles.mtProfileAvatar} referrerPolicy="no-referrer" />
            : <div className={styles.mtProfileAvatarFallback}>{initial}</div>}
          <div className={styles.mtProfileCam}>
            {avatarUploading ? <span className={styles.avatarSpinner} /> : <Cam s={15} />}
          </div>
        </div>
        <div className={styles.mtProfileName}>{displayName}</div>
        <div className={styles.mtProfileEmail}>{profile.email || '—'}</div>
        <button type="button" className={styles.mtUploadBtn} onClick={onAvatarClick}>Change photo</button>
      </div>

      <div className={styles.mtFormCard}>
        <div className={styles.mtFormHead}>
          <span className={styles.mtFormTitle}>Personal details</span>
          {!editing && <button type="button" className={styles.mtBtnGhost} onClick={onEdit}>Edit</button>}
        </div>

        <div className={styles.mtField}>
          <label className={styles.mtFieldLabel}>First name</label>
          <input className={styles.mtInput} value={v.firstName} disabled={!editing} onChange={e => onChange({ firstName: e.target.value })} placeholder="First name" />
        </div>
        <div className={styles.mtField}>
          <label className={styles.mtFieldLabel}>Last name</label>
          <input className={styles.mtInput} value={v.lastName} disabled={!editing} onChange={e => onChange({ lastName: e.target.value })} placeholder="Last name" />
        </div>
        <div className={styles.mtField}>
          <label className={styles.mtFieldLabel}>Email</label>
          <input className={styles.mtInput} value={v.email} disabled type="email" placeholder="Email" />
          <span className={styles.mtFieldHint}>Email can’t be changed</span>
        </div>
        <div className={styles.mtField}>
          <label className={styles.mtFieldLabel}>Phone</label>
          <input className={styles.mtInput} value={v.phone} disabled={!editing} type="tel" maxLength={10} inputMode="numeric"
            onChange={e => onChange({ phone: e.target.value.replace(/\D/g, '') })} placeholder="10-digit mobile" />
        </div>
        <div className={styles.mtField}>
          <label className={styles.mtFieldLabel}>Date of birth</label>
          <input className={styles.mtInput} value={v.dob} disabled={!editing} type="date" onChange={e => onChange({ dob: e.target.value })} />
        </div>
        <div className={styles.mtField}>
          <label className={styles.mtFieldLabel}>Gender</label>
          <select className={styles.mtInput} value={v.gender} disabled={!editing} onChange={e => onChange({ gender: e.target.value })}>
            <option value="">Prefer not to say</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
        </div>

        {editing ? (
          <div className={styles.mtEditRow}>
            <button type="button" className={styles.mtCancelBtn2} onClick={onCancel}>Cancel</button>
            <button type="button" className={styles.mtSaveBtn} onClick={onSave}>Save changes</button>
          </div>
        ) : (
          <button type="button" className={styles.mtEditBtn2} onClick={onEdit}>Edit profile</button>
        )}
      </div>

      <button type="button" className={styles.mtLogoutBtn} onClick={onSignOut}><Logout /> Log out</button>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   COUPONS
   ═══════════════════════════════════════════════════════════════════════════ */
export interface Coupon {
  id: string; code: string; discount: number; type: 'percent' | 'flat';
  minOrder: number; expiry: string; used: boolean; description: string;
  category?: string; maxDiscount?: number; highlight?: boolean;
}
interface CouponsProps {
  coupons: Coupon[];
  copiedCode: string;
  onCopy: (code: string) => void;
  showToast: (msg: string) => void;
}

export function MobileCoupons({ coupons, copiedCode, onCopy, showToast }: CouponsProps) {
  const [filter, setFilter] = useState<'active' | 'expired' | 'all'>('active');
  const [applyInput, setApplyInput] = useState('');
  const [applyLoading, setApplyLoading] = useState(false);
  const now = new Date();
  

  const filtered = coupons.filter(c => {
    const expired = new Date(c.expiry) < now;
    if (filter === 'active')  return !c.used && !expired;
    if (filter === 'expired') return expired && !c.used;
    return true;
  });

const handleApply = () => {
    const code = applyInput.trim().toUpperCase();
    if (!code) return;
    const found = coupons.find(c => c.code === code);
    if (found) {
      onCopy(code);
      showToast(`✅ ${code} copied! Apply it at checkout.`);
    } else {
      showToast('❌ No active coupon with that code.');
    }
    setApplyInput('');
  };

  return (
    <div className={styles.mtShell}>
      <div className={styles.mtCouponApply}>
        <input value={applyInput} onChange={e => setApplyInput(e.target.value.toUpperCase())}
          onKeyDown={e => e.key === 'Enter' && handleApply()} placeholder="Enter coupon code" aria-label="Coupon code" />
        <button type="button" onClick={handleApply} disabled={applyLoading}>
          {applyLoading ? <span className={styles.btnSpinner} /> : 'Apply'}
        </button>
      </div>

      <div className={styles.mtFilterScroll}>
        {([['active', 'Active'], ['expired', 'Expired'], ['all', 'All']] as const).map(([k, label]) => (
          <button key={k} type="button" className={`${styles.mtChip} ${filter === k ? styles.mtChipActive : ''}`} onClick={() => setFilter(k)}>{label}</button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className={styles.mtEmpty}>
          <div className={styles.mtEmptyIcon}>🎟️</div>
          <div className={styles.mtEmptyTitle}>No {filter} coupons</div>
          <div className={styles.mtEmptyText}>Check back soon for fresh offers and discounts.</div>
        </div>
      ) : (
        <div className={styles.mtList}>
          {filtered.map(c => {
            const expired = new Date(c.expiry) < now;
            const disabled = c.used || expired;
            const done = copiedCode === c.code;
            return (
              <div key={c.id} className={`${styles.mtCouponCard} ${disabled ? styles.mtCouponCardOff : ''}`}>
                {c.highlight && !disabled && <span className={styles.mtCouponBest}>⭐ Best</span>}
                <div className={styles.mtCouponLeft}>
                  <div className={styles.mtCouponDisc}>{c.type === 'percent' ? `${c.discount}%` : `₹${c.discount}`}</div>
                  <div className={styles.mtCouponOff}>OFF</div>
                </div>
                <div className={styles.mtCouponBody}>
                  <div className={styles.mtCouponDesc}>{c.description}</div>
                  <div className={styles.mtCouponMeta}>Min order ₹{c.minOrder}{c.maxDiscount ? ` · Up to ₹${c.maxDiscount}` : ''}</div>
                  <div className={styles.mtCouponExpiry}>
                    {expired ? '⏱️ Expired' : `Valid till ${new Date(c.expiry).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`}
                  </div>
                  <div className={styles.mtCouponCodeRow}>
                    <span className={styles.mtCouponCode}>{c.code}</span>
                    {!disabled ? (
                      <button type="button" className={`${styles.mtCouponCopy} ${done ? styles.mtCouponCopyDone : ''}`} onClick={() => onCopy(c.code)}>
                        {done ? '✓ Copied' : 'Copy'}
                      </button>
                    ) : (
                      <span className={styles.mtCouponUsedTag}>{c.used ? 'Used' : 'Expired'}</span>
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
}

/* ═══════════════════════════════════════════════════════════════════════════
   NOTIFICATIONS
   Channel IDs + quiet-hours keys match the desktop NotificationsTab, so
   preferences stay in sync through the same localStorage entries.
   ═══════════════════════════════════════════════════════════════════════════ */
const MT_NOTIF_CHANNELS = [
  { id: 'ch_orders',     icon: '📦', bg: '#eff6ff', title: 'Order updates',          sub: 'Shipping & delivery status',  defaultOn: true },
  { id: 'ch_offers',     icon: '🎁', bg: '#fffbeb', title: 'Offers & promotions',    sub: 'Sales, coupons & deals',      defaultOn: true },
  { id: 'ch_wishlist',   icon: '❤️', bg: '#fff1f2', title: 'Wishlist price drops',   sub: 'Alerts when saved items drop', defaultOn: false },
  { id: 'ch_reviews',    icon: '⭐', bg: '#faf5ff', title: 'Review reminders',       sub: 'Nudges to review your orders', defaultOn: true },
  { id: 'ch_whatsapp',   icon: '💬', bg: '#f0fdf4', title: 'WhatsApp notifications', sub: 'Order alerts on WhatsApp',    defaultOn: false },
  { id: 'ch_newsletter', icon: '✉️', bg: '#eef2ff', title: 'Weekly newsletter',      sub: 'New arrivals & picks',        defaultOn: true },
];

function mtBuildNotifications(orders: MappedOrder[]) {
  const items: Array<{ id: string; type: string; title: string; body: string; time: string; read: boolean; icon: string; color: string }> = [];
  orders.slice(0, 3).forEach((o, i) => {
    const sk = o.status.toLowerCase().replace(/ /g, '_');
    const iconMap: Record<string, string> = { delivered: '✅', shipped: '🚚', processing: '⏳', cancelled: '❌' };
    const colorMap: Record<string, string> = { delivered: '#10b981', shipped: '#3b82f6', processing: '#f59e0b', cancelled: '#f43f5e' };
    items.push({
      id: `order-${o.id}`, type: 'order',
      title: `Order ${o.status}`,
      body: `Your order #${o.id.slice(0, 8).toUpperCase()} — ${o.name} is ${o.status.toLowerCase()}.`,
      time: o.date, read: i > 0, icon: iconMap[sk] ?? '📦', color: colorMap[sk] ?? '#6b7280',
    });
  });
  items.push({
    id: 'welcome', type: 'system', title: `Welcome to ${brand.name}! 🎁`,
    body: 'Your account is all set. Start exploring thoughtful gifts for every occasion.',
    time: 'Just now', read: true, icon: '🧸', color: '#FF6B35',
  });
  return items;
}

interface NotificationsProps {
  orders: MappedOrder[];
  phone?: string;
  onNavigate: (tab: string) => void;
  showToast: (msg: string) => void;
  token?: string | null;
}

export function MobileNotifications({ orders, phone, onNavigate, showToast, token  }: NotificationsProps) {
  const [channels, setChannels] = useState<Record<string, boolean>>(() => {
    const seed: Record<string, boolean> = {};
    MT_NOTIF_CHANNELS.forEach(ch => { seed[ch.id] = ch.defaultOn; });
    return seed;
  });
  const [quietFrom, setQuietFrom] = useState('22:00');
  const [quietUntil, setQuietUntil] = useState('08:00');
  const [quietEnabled, setQuietEnabled] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
const [notifications, setNotifications] = useState<Array<{ id: string; type: string; title: string; body: string; time: string; read: boolean; icon: string; color: string }>>([]);

  useEffect(() => {
    let alive = true;
    import('@/lib/notificationsApi').then(({ fetchMyNotifications, NOTIF_TYPE_STYLE }) => {
      fetchMyNotifications(token, { limit: 40 }).then(res => {
        if (!alive) return;
        setNotifications(res.data.map(n => {
          const st = NOTIF_TYPE_STYLE[n.type] ?? NOTIF_TYPE_STYLE.system;
          return { id: n.id, type: n.type, title: n.title, body: n.body || '',
            time: new Date(n.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
            read: n.is_read, icon: st.icon, color: st.color };
        }));
      }).catch(() => { if (alive) setNotifications([]); });
    });
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    setChannels(prev => {
      const next = { ...prev };
      MT_NOTIF_CHANNELS.forEach(ch => {
        try { const v = localStorage.getItem(ch.id); if (v !== null) next[ch.id] = v === 'true'; } catch { /* ignore */ }
      });
      return next;
    });
    try {
      const f = localStorage.getItem('quiet_from');    if (f) setQuietFrom(f);
      const u = localStorage.getItem('quiet_until');   if (u) setQuietUntil(u);
      const e = localStorage.getItem('quiet_enabled'); if (e !== null) setQuietEnabled(e === 'true');
    } catch { /* ignore */ }
  }, []);

  {/*useEffect(() => { setNotifications(mtBuildNotifications(orders)); }, [orders]);*/}

  const unread = notifications.filter(n => !n.read).length;
  const list = filter === 'unread' ? notifications.filter(n => !n.read) : notifications;

  const toggleChannel = (id: string, val: boolean) => {
    setChannels(p => ({ ...p, [id]: val }));
    try { localStorage.setItem(id, String(val)); } catch { /* ignore */ }
    const ch = MT_NOTIF_CHANNELS.find(c => c.id === id);
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
    <div className={styles.mtShell}>
      {/* In-app notifications */}
      <div className={styles.mtCard}>
        <div className={styles.mtCardHead}>
          <span className={styles.mtCardTitle}>Notifications{unread > 0 && <span className={styles.mtNotifBadge}>{unread} new</span>}</span>
          {unread > 0 && <button type="button" className={styles.mtCardAction} onClick={markAllRead}>Mark all read</button>}
        </div>
        <div className={styles.mtFilterScroll} style={{ marginBottom: 10 }}>
          <button type="button" className={`${styles.mtChip} ${filter === 'all' ? styles.mtChipActive : ''}`} onClick={() => setFilter('all')}>All ({notifications.length})</button>
          <button type="button" className={`${styles.mtChip} ${filter === 'unread' ? styles.mtChipActive : ''}`} onClick={() => setFilter('unread')}>Unread{unread > 0 ? ` (${unread})` : ''}</button>
        </div>
        {list.length === 0 ? (
          <div className={styles.mtEmptyMini}><span>🔔</span><span>{filter === 'unread' ? "You're all caught up" : 'No notifications yet'}</span></div>
        ) : (
          <div>
            {list.map(n => (
              <div key={n.id} className={`${styles.mtNotifItem} ${!n.read ? styles.mtNotifItemUnread : ''}`} onClick={() => markRead(n.id)}>
                <div className={styles.mtNotifIcon} style={{ background: n.color + '18', color: n.color }}>{n.icon}</div>
                <div className={styles.mtNotifBody}>
                  <div className={styles.mtNotifTitle}>{n.title}{!n.read && <span className={styles.mtNotifDot} />}</div>
                  <div className={styles.mtNotifText}>{n.body}</div>
                  <div className={styles.mtNotifTime}>{n.time}</div>
                </div>
                <div className={styles.mtNotifActions}>
                  {n.type === 'order' && <button type="button" className={styles.mtNotifView} onClick={e => { e.stopPropagation(); onNavigate('orders'); }}>View</button>}
                  <button type="button" className={styles.mtNotifDelete} onClick={e => { e.stopPropagation(); deleteNotif(n.id); }} aria-label="Dismiss">✕</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* WhatsApp setup (only if no phone on file) */}
      {!phone && (
        <div className={styles.mtWaBanner}>
          <Wa s={22} />
          <div className={styles.mtWaBannerBody}>
            <div className={styles.mtWaBannerTitle}>Enable WhatsApp alerts</div>
            <div className={styles.mtWaBannerSub}>Add your phone number to get order updates on WhatsApp.</div>
          </div>
          <button type="button" className={styles.mtWaBannerBtn} onClick={() => onNavigate('settings')}>Add</button>
        </div>
      )}

      {/* Channels */}
      <div className={styles.mtCard}>
        <div className={styles.mtCardHead}><span className={styles.mtCardTitle}>Notification channels</span></div>
        <div>
          {MT_NOTIF_CHANNELS.map(ch => (
            <div key={ch.id} className={styles.mtChannelRow}>
              <div className={styles.mtChannelLeft}>
                <span className={styles.mtChannelIcon} style={{ background: ch.bg }}>{ch.icon}</span>
                <div>
                  <div className={styles.mtChannelTitle}>{ch.title}</div>
                  <div className={styles.mtChannelSub}>{ch.sub}</div>
                </div>
              </div>
              <label className={styles.settingsToggle}>
                <input type="checkbox" checked={channels[ch.id] ?? ch.defaultOn} onChange={e => toggleChannel(ch.id, e.target.checked)} />
                <span className={styles.settingsToggleSlider} />
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Quiet hours */}
      <div className={styles.mtCard}>
        <div className={styles.mtCardHead}><span className={styles.mtCardTitle}>Quiet hours</span></div>
        <div className={styles.mtQuietRow}>
          <div className={styles.mtQuietField}>
            <label className={styles.mtFieldLabel}>From</label>
            <input type="time" className={styles.mtInput} value={quietFrom}
              onChange={e => { setQuietFrom(e.target.value); try { localStorage.setItem('quiet_from', e.target.value); } catch { /* ignore */ } }} />
          </div>
          <div className={styles.mtQuietField}>
            <label className={styles.mtFieldLabel}>Until</label>
            <input type="time" className={styles.mtInput} value={quietUntil}
              onChange={e => { setQuietUntil(e.target.value); try { localStorage.setItem('quiet_until', e.target.value); } catch { /* ignore */ } }} />
          </div>
        </div>
        <div className={styles.mtChannelRow}>
          <div className={styles.mtChannelLeft}>
            <span className={styles.mtChannelIcon} style={{ background: '#f5f3ff' }}>🌙</span>
            <div>
              <div className={styles.mtChannelTitle}>Pause notifications</div>
              <div className={styles.mtChannelSub}>Mute during the hours above</div>
            </div>
          </div>
          <label className={styles.settingsToggle}>
            <input type="checkbox" checked={quietEnabled}
              onChange={e => { setQuietEnabled(e.target.checked); try { localStorage.setItem('quiet_enabled', String(e.target.checked)); } catch { /* ignore */ } showToast(e.target.checked ? '🌙 Quiet hours enabled' : '🔔 Quiet hours disabled'); }} />
            <span className={styles.settingsToggleSlider} />
          </label>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   HELP & SUPPORT
   ═══════════════════════════════════════════════════════════════════════════ */
const MT_FAQ = [
  { q: 'How do I track my order?', a: 'Open "My orders", select your order and tap "Track order" for real-time delivery status.' },
  { q: 'What is your return policy?', a: 'We offer hassle-free 7-day returns on most products. Items must be unused and in their original packaging.' },
  { q: 'How do I apply a coupon?', a: 'Go to the Coupons tab, copy the code, and apply it at checkout to get your discount.' },
  { q: 'Are the products safe for kids?', a: 'Yes — all our products are made with certified child-safe, non-toxic materials.' },
  { q: 'How long does delivery take?', a: 'Standard delivery takes 3–5 business days. Express delivery is available in select cities.' },
];

export function MobileHelp() {
  return (
    <div className={styles.mtShell}>
      <a href={`tel:${brand.phone}`} className={styles.mtContactCard}>
        <span className={styles.mtContactIcon} style={{ background: '#f0fdf4', color: '#10b981' }}><Phone /></span>
        <div><div className={styles.mtContactTitle}>Call us</div><div className={styles.mtContactSub}>{brand.phone}</div></div>
      </a>
      <a href={`mailto:${brand.email.support}`} className={styles.mtContactCard}>
        <span className={styles.mtContactIcon} style={{ background: '#eff6ff', color: '#3b82f6' }}><Mail /></span>
        <div><div className={styles.mtContactTitle}>Email us</div><div className={styles.mtContactSub}>{brand.email.support}</div></div>
      </a>
      <a href={`https://wa.me/${brand.whatsapp}`} target="_blank" rel="noopener" className={styles.mtContactCard}>
        <span className={styles.mtContactIcon} style={{ background: '#f0fdf4', color: '#25d366' }}><Wa s={20} /></span>
        <div><div className={styles.mtContactTitle}>WhatsApp</div><div className={styles.mtContactSub}>Chat with us</div></div>
      </a>

      <div className={styles.mtCard}>
        <div className={styles.mtCardHead}><span className={styles.mtCardTitle}>FAQs</span></div>
        {MT_FAQ.map((f, i) => (
          <details key={i} className={styles.mtFaqItem}>
            <summary className={styles.mtFaqQ}>{f.q}</summary>
            <p className={styles.mtFaqA}>{f.a}</p>
          </details>
        ))}
      </div>
    </div>
  );
}