'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import styles from './TrackOrderPage.module.css';
import { brand } from '@/config/brand';

/* ─── Types ──────────────────────────────────────────────────────────────── */
type OrderStatus = 'confirmed' | 'packed' | 'shipped' | 'out_for_delivery' | 'delivered' |
                   'processing' | 'pending' | 'cancelled' | 'returned';

interface TrackEvent {
  status:      string;
  label:       string;
  description: string;
  timestamp:   string;
  location:    string;
  done:        boolean;
  active:      boolean;
}

interface OrderData {
  id:                  string;
  status:              string;
  total_amount:        number;
  amount_paid:         number;
  payment_method:      string;
  razorpay_payment_id: string;
  shipping_address:    string;
  shipping_name:       string;
  shipping_city:       string;
  shipping_state:      string;
  shipping_pincode:    string;
  shipping_phone:      string;
  courier_name:        string | null;
  awb_number:          string | null;
  order_items:         Array<{
    id:         string;
    product_id: string;
    quantity:   number;
    price:      number;
    product:    { id: string; name: string; category: string; original_price: number; product_image: any[] };
  }>;
  items:               Array<{ product_id: string; name: string; price: number; quantity: number }>;
  created_at:          string;
  estimated_delivery:  string | null;
  delivered_at:        string | null;
  tracking_events:     TrackEvent[];
}

/* ─── Status config ──────────────────────────────────────────────────────── */
const STATUS_CFG: Record<string, { color: string; bg: string; label: string; emoji: string }> = {
  confirmed:        { color: '#5BBEF5', bg: 'rgba(91,190,245,0.1)',  label: 'Order Confirmed',  emoji: '✅' },
  processing:       { color: '#5BBEF5', bg: 'rgba(91,190,245,0.1)',  label: 'Processing',       emoji: '✅' },
  pending:          { color: '#5BBEF5', bg: 'rgba(91,190,245,0.1)',  label: 'Pending',          emoji: '⏳' },
  packed:           { color: '#C7A4F5', bg: 'rgba(199,164,245,0.1)', label: 'Packed & Ready',   emoji: '📦' },
  shipped:          { color: '#FFAD8A', bg: 'rgba(255,173,138,0.1)', label: 'Shipped',           emoji: '🚀' },
  out_for_delivery: { color: '#FFD336', bg: 'rgba(255,211,54,0.12)', label: 'Out for Delivery',  emoji: '🛵' },
  delivered:        { color: '#3ECFB2', bg: 'rgba(62,207,178,0.1)',  label: 'Delivered',         emoji: '🎉' },
  cancelled:        { color: 'var(--gg-error-text)', bg: 'rgba(222,59,59,0.1)',  label: 'Cancelled',         emoji: '❌' },
  returned:         { color: '#FFAD8A', bg: 'rgba(255,173,138,0.1)', label: 'Returned',          emoji: '↩️' },
};

const STEP_ORDER = ['confirmed', 'packed', 'shipped', 'out_for_delivery', 'delivered'];

/* Phase 14: map a shipment status → the 5-step customer rail position + a
   friendly label. RTO/failed/lost are surfaced as a banner, not a rail step. */
const SHIPMENT_TO_STEP: Record<string, string> = {
  pending: 'confirmed', ready_to_pack: 'confirmed',
  packed: 'packed', label_generated: 'packed', pickup_scheduled: 'packed',
  picked_up: 'shipped', in_transit: 'shipped',
  out_for_delivery: 'out_for_delivery',
  delivered: 'delivered',
};
const SHIPMENT_EXCEPTION = new Set(['delivery_failed', 'rto_initiated', 'returned_to_origin', 'lost', 'damaged_in_transit', 'cancelled']);
const SHIP_STATUS_FRIENDLY: Record<string, string> = {
  delivery_failed: 'Delivery attempted — failed', rto_initiated: 'Returning to seller',
  returned_to_origin: 'Returned to seller', lost: 'Shipment delayed', damaged_in_transit: 'Shipment issue',
  cancelled: 'Shipment cancelled',
};

/* ─── Helpers ────────────────────────────────────────────────────────────── */
function fmtDate(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}
function fmtDateTime(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

function normaliseStatus(status: string): string {
  if (status === 'processing' || status === 'pending') return 'confirmed';
  return status;
}

function buildTrackingEvents(order: OrderData): TrackEvent[] {
  if (order.tracking_events?.length > 0) return order.tracking_events;
  const normStatus = normaliseStatus(order.status);
  const currentIdx = STEP_ORDER.indexOf(normStatus);
  return STEP_ORDER.map((s, i) => ({
    status:      s,
    label:       STATUS_CFG[s]?.label ?? s,
    description: getDefaultDesc(s),
    timestamp:   i === 0 ? fmtDateTime(order.created_at) : i <= currentIdx ? 'Completed' : 'Pending',
    location:    i === 0 ? `${brand.name} Warehouse` : '',
    done:        i < currentIdx,
    active:      i === currentIdx,
  }));
}

/* Phase 14: build timeline from the real shipment history if we have it;
   otherwise fall back to the order-derived synthetic timeline (unchanged). */
function buildShipmentEvents(order: OrderData, tracking: any): TrackEvent[] {
  if (tracking?.timeline?.length > 0) {
    const SHIP_LABEL: Record<string, string> = {
      ready_to_pack: 'Ready to Pack', packed: 'Packed', label_generated: 'Label Generated',
      pickup_scheduled: 'Pickup Scheduled', picked_up: 'Picked Up', in_transit: 'In Transit',
      out_for_delivery: 'Out for Delivery', delivered: 'Delivered', delivery_failed: 'Delivery Failed',
      rto_initiated: 'Returning to Seller', returned_to_origin: 'Returned to Seller',
      lost: 'Delayed', damaged_in_transit: 'Issue Reported', cancelled: 'Cancelled',
    };
    const tl = tracking.timeline;
    return tl.map((h: any, i: number) => ({
      status:      h.new_status,
      label:       SHIP_LABEL[h.new_status] ?? h.new_status,
      description: h.note || '',
      timestamp:   fmtDateTime(h.created_at),
      location:    '',
      done:        i < tl.length - 1,
      active:      i === tl.length - 1,
    }));
  }
  return buildTrackingEvents(order);
}

function getDefaultDesc(s: string) {
  return {
    confirmed:        'Your order has been placed and payment received.',
    packed:           'Items carefully inspected and packed with love.',
    shipped:          'Package handed over to courier partner.',
    out_for_delivery: 'Your package is with the delivery agent!',
    delivered:        'Package delivered successfully.',
  }[s] ?? '';
}

function getOrderAmount(order: OrderData): number {
  return order.amount_paid ?? order.total_amount ?? 0;
}

function getFirstImage(product_image: any): string | null {
  if (!product_image?.length) return null;
  const f = product_image[0];
  return typeof f === 'string' ? f : f?.url ?? null;
}

function getOrderItems(order: OrderData) {
  if (order.order_items?.length > 0) {
    return order.order_items.map(oi => ({
      product_id: String(oi.product_id ?? ''),
      name:       oi.product?.name ?? 'Product',
      quantity:   oi.quantity,
      price:      oi.price ?? oi.product?.original_price ?? 0,
      image:      getFirstImage(oi.product?.product_image),
    }));
  }
  return (order.items ?? []).map(i => ({
    product_id: String(i.product_id ?? ''),
    name:       i.name,
    quantity:   i.quantity,
    price:      i.price,
    image:      null as string | null,
  }));
}

function parseShipping(order: OrderData) {
  // Your existing Order model stores shipping as a single string
  const addr = order.shipping_address ?? '';
  const parts = addr.split(',').map((s: string) => s.trim());
  return {
    name:    order.shipping_name ?? parts[0] ?? '',
    line:    parts[1] ?? addr,
    city:    order.shipping_city ?? parts[parts.length - 2] ?? '',
    state:   order.shipping_state ?? '',
    pincode: order.shipping_pincode ?? (addr.includes('-') ? addr.split('-').pop()?.trim() ?? '' : ''),
    phone:   order.shipping_phone ?? '',
  };
}

/* ─── Component ──────────────────────────────────────────────────────────── */
export default function TrackOrderPage() {
  const searchParams     = useSearchParams();
  const prefilledOrderId = searchParams.get('order_id') ?? '';
  const { data: session, status: sessionStatus } = useSession();
  const token = (session as any)?.backendToken as string | undefined;

  const [inputValue,  setInputValue]  = useState(prefilledOrderId);
  const [order,       setOrder]       = useState<OrderData | null>(null);
  const [notFound,    setNotFound]    = useState(false);
  const [loading,     setLoading]     = useState(false);
  const [searched,    setSearched]    = useState(false);
  const [copied,      setCopied]      = useState(false);
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);
  const [tracking,    setTracking]    = useState<any | null>(null);

  useEffect(() => {
    if (sessionStatus === 'loading') return;   // wait for the token before fetching
    if (prefilledOrderId) fetchOrder(prefilledOrderId);
  }, [prefilledOrderId, sessionStatus]);

  async function fetchOrder(id: string) {
    const trimmed = id.trim();
    if (!trimmed) return;
    setLoading(true); setNotFound(false); setOrder(null); setSearched(false); setTracking(null);

    try {
      const res = await fetch(`/api/orders/${trimmed}`, {
        credentials: 'include',
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      if (!res.ok) { setNotFound(true); return; }

      const data: OrderData = await res.json();

      // If items come from cart snapshot (no product relation), fetch images
      if ((!data.order_items?.length) && data.items?.length > 0) {
        const withImages = await Promise.all(
          data.items.map(async (item) => {
            if (!item.product_id) return { ...item, image: null };
            try {
              const r = await fetch(`/api/product/${item.product_id}`);
              if (r.ok) {
                const pd = await r.json();
                const product = pd?.product_details ?? pd;
                return { ...item, image: getFirstImage(product?.product_image) };
              }
            } catch {}
            return { ...item, image: null };
          })
        );
        setOrder({ ...data, items: withImages as any });
      } else {
        setOrder(data);
      }

      /* Phase 14: pull the real shipment tracking (if a shipment exists). */
      try {
        const tr = await fetch(`/api/orders/${trimmed}/tracking`, {
          credentials: 'include',
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        if (tr.ok) {
          const td = await tr.json();
          setTracking(td?.has_shipment ? td : null);
        } else {
          setTracking(null);
        }
      } catch { setTracking(null); }
    } catch {
      setNotFound(true);
    } finally {
      setLoading(false);
      setSearched(true);
    }
  }

  function handleSearch() { fetchOrder(inputValue); }
  function clearSearch()  { setInputValue(''); setOrder(null); setNotFound(false); setSearched(false); }

  function handleCopy() {
    const awb = tracking?.awb_number ?? order?.awb_number;
    if (!awb) return;
    navigator.clipboard.writeText(awb).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

/* Phase 14: prefer real shipment data. courierName/awb/trackingUrl now come
     from the shipment (the order's own fields were always null). */
  const courierName  = tracking?.courier_name  ?? order?.courier_name  ?? null;
  const awbNumber    = tracking?.awb_number     ?? order?.awb_number    ?? null;
  const trackingUrl  = tracking?.tracking_url   ?? null;
  const shipStatus   = tracking?.status as string | undefined;
  const shipException = shipStatus && SHIPMENT_EXCEPTION.has(shipStatus) ? shipStatus : null;
  const expectedDate = tracking?.expected_delivery_date ?? order?.estimated_delivery ?? null;

  /* Rail position: shipment status wins; else fall back to order status. */
  const railStatus = shipStatus && SHIPMENT_TO_STEP[shipStatus]
    ? SHIPMENT_TO_STEP[shipStatus]
    : (order ? normaliseStatus(order.status) : 'confirmed');

  const normStatus = railStatus;
  const cfg        = order ? (STATUS_CFG[order.status] ?? STATUS_CFG['confirmed']) : null;
  const currentIdx = STEP_ORDER.indexOf(normStatus);
  const events     = order ? buildShipmentEvents(order, tracking) : [];
  const shipping   = order ? parseShipping(order) : null;
  const orderItems = order ? getOrderItems(order) : [];
  const amount     = order ? getOrderAmount(order) : 0;
  const latestAttempt = tracking?.latest_attempt ?? null;

  return (
    <div className={styles.page}>

      {/* Breadcrumb */}
      <nav className={styles.breadcrumb}>
        <Link href="/" className={styles.breadLink}>Home</Link>
        <span className={styles.breadSep}>›</span>
        <span className={styles.breadCurrent}>Track Order</span>
      </nav>

      {/* Hero */}
      <div className={styles.hero}>
        <div className={styles.heroLeft}>
          <div className={styles.heroBadge}>📦 Real-time tracking</div>
          <h1 className={styles.heroTitle}>
            Where's your<br />
            <span className={styles.heroAccent}>Gift?</span>
          </h1>
          <p className={styles.heroSub}>Enter your Order ID to see exactly where your package is.</p>
        </div>
        <div className={styles.heroArt}>
          <div className={styles.truckWrap}>
            <div className={styles.truckEmoji}>🚚</div>
            <div className={styles.truckRoad}>
              <div className={styles.roadDash} /><div className={styles.roadDash} /><div className={styles.roadDash} />
            </div>
          </div>
          {(['📦','🎁','⭐'] as const).map((icon, i) => (
            <span key={i} className={styles.floatIcon} style={{ '--fi': i } as React.CSSProperties}>{icon}</span>
          ))}
        </div>
      </div>

      {/* Search */}
      <div className={styles.searchCard}>
        <div className={styles.searchTopRow}>
          <div className={styles.searchLabel}>Order ID</div>
          <span className={styles.searchHintInline}>Find it in your confirmation email or account</span>
        </div>
        <div className={styles.searchRow}>
          <div className={styles.searchInputWrap}>
            <span className={styles.searchIco}>🔍</span>
            <input
              className={styles.searchInput}
              placeholder="Paste your Order ID here…"
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
            />
            {inputValue && (
              <button className={styles.clearBtn} onClick={clearSearch} aria-label="Clear">✕</button>
            )}
          </div>
          <button
            className={`${styles.searchBtn} ${loading ? styles.searchBtnLoading : ''}`}
            onClick={handleSearch}
            disabled={loading || !inputValue.trim()}
          >
            {loading ? <span className={styles.spinner} /> : 'Track Now'}
          </button>
        </div>
        <div className={styles.myOrdersRow}>
          <Link href="/account/orders" className={styles.myOrdersLink}>📋 View all your orders →</Link>
        </div>
      </div>

      {/* Not found */}
      {searched && notFound && (
        <div className={styles.notFound}>
          <div className={styles.notFoundEmoji}>🤔</div>
          <h3 className={styles.notFoundTitle}>Order not found</h3>
          <p className={styles.notFoundText}>
            We couldn't find any order matching "<strong>{inputValue}</strong>".
            Check your confirmation email for the correct Order ID.
          </p>
          <div className={styles.tipList}>
            <div className={styles.tip}><span>📧</span><span>Find your Order ID in the confirmation email from {brand.name}</span></div>
            <div className={styles.tip}><span>👤</span><span>Or check your <Link href="/account/orders" className={styles.notFoundLink}>order history</Link></span></div>
            <div className={styles.tip}><span>📞</span><span>Need help? Email us at {brand.email.support}</span></div>
          </div>
        </div>
      )}

      {/* Order result */}
      {order && cfg && (
        <div className={styles.results}>
          {/* Phase 14: shipment exception / delay banner */}
          {shipException && (
            <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', color: '#9a3412', borderRadius: 14, padding: '12px 16px', marginBottom: 16, fontSize: 14, fontWeight: 600 }}>
              {shipException === 'delivery_failed' && '🚪 A delivery attempt was unsuccessful. The courier will try again soon.'}
              {shipException === 'rto_initiated' && '↩️ This shipment is on its way back to the seller. Our team will reach out about next steps.'}
              {shipException === 'returned_to_origin' && '↩️ This shipment was returned to the seller. Please contact support for a refund or reshipment.'}
              {shipException === 'lost' && '⏱️ This shipment is delayed. We’re working with the courier — thanks for your patience.'}
              {shipException === 'damaged_in_transit' && '⚠️ There was an issue with this shipment in transit. Please contact support.'}
              {shipException === 'cancelled' && '❌ This shipment was cancelled.'}
            </div>
          )}

          {/* Status strip */}
          <div className={styles.statusStrip} style={{ '--sc': cfg.color, '--sb': cfg.bg } as React.CSSProperties}>
            <div className={styles.statusLeft}>
              <div className={styles.statusEmoji}>{cfg.emoji}</div>
              <div>
                <div className={styles.statusLabel} style={{ color: cfg.color }}>{cfg.label}</div>
                <div className={styles.statusOrderId}>Order #{order.id.slice(0,8).toUpperCase()}</div>
                {(shipStatus === 'out_for_delivery' || order.status === 'out_for_delivery') && <div className={styles.statusEta}>⏱ Expected delivery today</div>}
                {latestAttempt && latestAttempt.status === 'failed' && latestAttempt.failure_reason && (
                  <div className={styles.statusEta} style={{ color: '#b45309' }}>
                    Last attempt: {String(latestAttempt.failure_reason).replace(/_/g, ' ')}
                    {latestAttempt.next_attempt_at ? ` · next ${fmtDate(latestAttempt.next_attempt_at)}` : ''}
                  </div>
                )}
                {(shipStatus === 'delivered' || order.status === 'delivered') && (tracking?.delivered_at || order.delivered_at) && (
                  <div className={styles.statusDelivered}>Delivered · {fmtDateTime(tracking?.delivered_at || order.delivered_at)}</div>
                )}
                {!['delivered','out_for_delivery','cancelled','returned'].includes(order.status) && order.estimated_delivery && (
                  <div className={styles.statusEta}>📅 Est. delivery: {fmtDate(order.estimated_delivery)}</div>
                )}
                {!['delivered','out_for_delivery','cancelled','returned'].includes(order.status) && !order.estimated_delivery && (
                  <div className={styles.statusEta}>📅 Est. delivery: 3–5 business days</div>
                )}
              </div>
            </div>
            {courierName && (
              <div className={styles.courierPill}>
                <span>🚚</span>
                <div>
                  <div className={styles.courierName}>{courierName}</div>
                  {awbNumber && (
                    <div className={styles.awbRow}>
                      <span className={styles.awbNum}>{awbNumber}</span>
                      <button className={`${styles.copyBtn} ${copied ? styles.copyBtnDone : ''}`} onClick={handleCopy}>
                        {copied ? '✓' : '📋'}
                      </button>
                    </div>
                  )}
                  {trackingUrl && (
                    <a href={trackingUrl} target="_blank" rel="noopener noreferrer"
                      style={{ fontSize: 11, fontWeight: 700, color: '#5BBEF5', textDecoration: 'none', display: 'inline-block', marginTop: 2 }}>
                      Track on courier site →
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Progress rail — only for non-cancelled */}
          {!['cancelled','returned'].includes(order.status) && (
            <div className={styles.progressCard}>
              <div className={styles.progressRail}>
                {STEP_ORDER.map((s, i) => {
                  const sc       = STATUS_CFG[s];
                  const isDone   = i < currentIdx;
                  const isActive = i === currentIdx;
                  const isFuture = i > currentIdx;
                  return (
                    <div key={s} className={styles.progressStep}>
                      {i > 0 && (
                        <div
                          className={`${styles.railLine} ${(isDone || isActive) ? styles.railLineDone : ''}`}
                          style={(isDone || isActive) ? { background: `linear-gradient(90deg,${STATUS_CFG[STEP_ORDER[i-1]].color},${sc.color})` } : {}}
                        />
                      )}
                      <div
                        className={`${styles.railNode} ${isDone ? styles.railNodeDone : ''} ${isActive ? styles.railNodeActive : ''} ${isFuture ? styles.railNodeFuture : ''}`}
                        style={isActive ? { background: sc.color, boxShadow: `0 0 0 5px ${sc.bg},0 6px 20px ${sc.bg}` } : isDone ? { background: '#3ECFB2' } : {}}
                      >
                        {isDone ? <span className={styles.railCheck}>✓</span> : <span>{sc.emoji}</span>}
                        {isActive && <span className={styles.railPulse} style={{ '--rc': sc.color } as React.CSSProperties} />}
                      </div>
                      <div
                        className={`${styles.railLabel} ${isActive ? styles.railLabelActive : ''} ${isFuture ? styles.railLabelFuture : ''}`}
                        style={isActive ? { color: sc.color } : {}}
                      >
                        {sc.label}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className={styles.railBarWrap}>
                <div className={styles.railBarTrack}>
                  <div
                    className={styles.railBarFill}
                    style={{
                      width: `${Math.max(0, currentIdx) / (STEP_ORDER.length - 1) * 100}%`,
                      background: `linear-gradient(90deg,#5BBEF5,${cfg.color})`,
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Main grid */}
          <div className={styles.mainGrid}>

            {/* Left col */}
            <div className={styles.leftCol}>

              {/* Timeline */}
              <div className={styles.panel}>
                <div className={styles.panelTitle}><span>📍</span> Shipment Updates</div>
                <div className={styles.timeline}>
                  {[...events].reverse().map((ev, i) => {
                    const ec     = STATUS_CFG[ev.status] ?? STATUS_CFG['confirmed'];
                    const isOpen = expandedIdx === i;
                    return (
                      <div key={i} className={`${styles.tlItem} ${ev.active ? styles.tlItemActive : ''} ${!ev.done && !ev.active ? styles.tlItemFuture : ''}`}>
                        {i < events.length - 1 && (
                          <div className={`${styles.tlTrack} ${ev.done || ev.active ? styles.tlTrackDone : ''}`} />
                        )}
                        <div
                          className={`${styles.tlNode} ${ev.done ? styles.tlNodeDone : ''} ${ev.active ? styles.tlNodeActive : ''}`}
                          style={ev.active ? { background: ec.color, boxShadow: `0 0 0 4px ${ec.bg}` } : {}}
                        >
                          {ev.done ? <span>✓</span> : <span>{ec.emoji}</span>}
                        </div>
                        <div className={styles.tlBody} onClick={() => setExpandedIdx(isOpen ? null : i)}>
                          <div className={styles.tlTop}>
                            <div className={styles.tlLabelWrap}>
                              <span className={styles.tlLabel} style={ev.active ? { color: ec.color } : {}}>{ev.label}</span>
                              {ev.active && <span className={styles.liveDot} />}
                            </div>
                            <div className={styles.tlTimes}>
                              <div className={styles.tlDate}>{ev.timestamp?.split(' · ')[0]}</div>
                              {ev.timestamp?.includes(' · ') && <div className={styles.tlTime}>{ev.timestamp.split(' · ')[1]}</div>}
                            </div>
                          </div>
                          <div className={styles.tlDesc}>{ev.description}</div>
                          {ev.location && (
                            <>
                              <button className={styles.tlToggle}>{isOpen ? '▲ Hide location' : '▼ Show location'}</button>
                              <div className={`${styles.tlLocation} ${isOpen ? styles.tlLocationOpen : ''}`}>
                                <span>📍</span> {ev.location}
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Order details */}
              <div className={styles.panel}>
                <div className={styles.panelTitle}><span>🚚</span> Order Details</div>
                <div className={styles.detailGrid}>
                  <div className={styles.detailRow}>
                    <span className={styles.detailKey}>Order Placed</span>
                    <span className={styles.detailVal}>{fmtDateTime(order.created_at)}</span>
                  </div>
                  <div className={styles.detailRow}>
                    <span className={styles.detailKey}>Payment</span>
                    <span className={styles.detailVal}>{order.payment_method ?? 'Razorpay'}</span>
                  </div>
                  <div className={styles.detailRow}>
                    <span className={styles.detailKey}>Amount Paid</span>
                    <span className={styles.detailVal} style={{ color: 'var(--coral)', fontWeight: 800 }}>
                      ₹{amount.toLocaleString('en-IN')}
                    </span>
                  </div>
                  {courierName && (
                    <div className={styles.detailRow}>
                      <span className={styles.detailKey}>Courier</span>
                      <span className={styles.detailVal}>{courierName}</span>
                    </div>
                  )}
                  {awbNumber && (
                    <div className={styles.detailRow}>
                      <span className={styles.detailKey}>AWB Number</span>
                      <div className={styles.detailValRow}>
                        <span className={styles.detailVal}>{awbNumber}</span>
                        <button className={`${styles.copySmall} ${copied ? styles.copySmallDone : ''}`} onClick={handleCopy}>
                          {copied ? '✓ Copied' : '📋 Copy'}
                        </button>
                      </div>
                    </div>
                  )}
                  {order.delivered_at ? (
                    <div className={styles.detailRow}>
                      <span className={styles.detailKey}>Delivered On</span>
                      <span className={styles.detailVal} style={{ color: '#3ECFB2', fontWeight: 800 }}>{fmtDateTime(order.delivered_at)}</span>
                    </div>
                  ) : (
                    <div className={styles.detailRow}>
                      <span className={styles.detailKey}>Est. Delivery</span>
                      <span className={styles.detailVal} style={{ color: 'var(--coral)', fontWeight: 800 }}>
                        {order.estimated_delivery ? fmtDate(order.estimated_delivery) : '3–5 business days'}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Delivery address */}
              {shipping && (
                <div className={styles.panel}>
                  <div className={styles.panelTitle}><span>🏠</span> Delivery Address</div>
                  <div className={styles.addrBody}>
                    <div className={styles.addrAvatar}>🏠</div>
                    <div>
                      {shipping.name && <div className={styles.addrName}>{shipping.name}</div>}
                      <div className={styles.addrLine}>{shipping.line}</div>
                      {(shipping.city || shipping.pincode) && (
                        <div className={styles.addrLine}>
                          {[shipping.city, shipping.state].filter(Boolean).join(', ')}
                          {shipping.pincode ? ` – ${shipping.pincode}` : ''}
                        </div>
                      )}
                      {shipping.phone && <div className={styles.addrPhone}>📞 {shipping.phone}</div>}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right col */}
            <div className={styles.rightCol}>

              {/* Items */}
              <div className={styles.panel}>
                <div className={styles.panelTitle}><span>🛍️</span> Order Items</div>
                <div className={styles.itemsList}>
                  {orderItems.map((item, i) => (
                    <div key={i} className={styles.itemRow}>
                      <div className={styles.itemImg}>
                        {item.image
                          ? <img
                              src={item.image}
                              alt={item.name}
                              style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '4px' }}
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                          : <span style={{ fontSize: '22px' }}>🎁</span>
                        }
                        <span className={styles.itemQty}>{item.quantity}</span>
                      </div>
                      <div className={styles.itemInfo}>
                        <div className={styles.itemName}>{item.name}</div>
                      </div>
                      <div className={styles.itemPrice}>
                        ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                      </div>
                    </div>
                  ))}
                </div>
                <div className={styles.orderFooter}>
                  <div className={styles.totalRow}>
                    <span>Total Paid</span>
                    <span className={styles.totalAmt}>₹{amount.toLocaleString('en-IN')}</span>
                  </div>
                  <div className={styles.payChip}>💳 {order.payment_method ?? 'Razorpay'}</div>
                </div>
              </div>

              {/* Help */}
              <div className={styles.panel}>
                <div className={styles.panelTitle}><span>🙋</span> Need Help?</div>
                <div className={styles.helpBtns}>
                  <a href={`https://wa.me/${brand.whatsapp}`} target="_blank" rel="noopener noreferrer" className={`${styles.helpBtn} ${styles.helpWhatsapp}`}>
                    <span className={styles.helpBtnIco}>💬</span>
                    <div><div className={styles.helpBtnTitle}>WhatsApp</div><div className={styles.helpBtnSub}>Replies in 5 min</div></div>
                  </a>
                  <a href={`mailto:${brand.email.support}`} className={`${styles.helpBtn} ${styles.helpEmail}`}>
                    <span className={styles.helpBtnIco}>📧</span>
                    <div><div className={styles.helpBtnTitle}>Email Support</div><div className={styles.helpBtnSub}>{brand.email.support}</div></div>
                  </a>
                </div>
              </div>

              {/* Rate if delivered */}
              {order.status === 'delivered' && (
                <div className={styles.rateCard}>
                  <div className={styles.rateTitle}>How was your order? 🎉</div>
                  <p className={styles.rateSub}>Help other parents by sharing your experience</p>
                  <div className={styles.rateStars}>
                    {[1,2,3,4,5].map(n => <button key={n} className={styles.rateStar}>⭐</button>)}
                  </div>
                  <div className={styles.rateActions}>
                    <button className={styles.reviewBtn}>Write a Review</button>
                    <button className={styles.returnBtn}>Return / Exchange</button>
                  </div>
                </div>
              )}

              {/* Shop nudge */}
              <div className={styles.shopCard}>
                <div className={styles.shopEmoji}>🛍️</div>
                <div className={styles.shopBody}>
                  <div className={styles.shopTitle}>Your kids want more!</div>
                  <div className={styles.shopSub}>Explore our latest arrivals</div>
                </div>
                <Link href="/" className={styles.shopBtn}>Shop Now →</Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Initial featurettes */}
      {!searched && !loading && !prefilledOrderId && (
        <div className={styles.featurettes}>
          {[
            { icon: '📦', title: 'Real-time Updates',  sub: 'Live tracking from warehouse to your doorstep' },
            { icon: '🗺️', title: 'Full Journey Map',   sub: 'Every checkpoint your package passes through' },
            { icon: '🔔', title: 'Instant Alerts',     sub: 'Automatic notifications at every milestone' },
          ].map((f, i) => (
            <div key={i} className={styles.featurette}>
              <span className={styles.featureIcon}>{f.icon}</span>
              <div className={styles.featureTitle}>{f.title}</div>
              <div className={styles.featureSub}>{f.sub}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}