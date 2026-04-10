'use client';

import { useState } from 'react';
import Link from 'next/link';
import styles from './TrackOrderPage.module.css';

/* ─── Types ──────────────────────────────────────────────────────────────── */
type OrderStatus = 'confirmed' | 'packed' | 'shipped' | 'out_for_delivery' | 'delivered';

interface TrackEvent {
  status: OrderStatus;
  label: string;
  description: string;
  timestamp: string;
  location: string;
  done: boolean;
  active: boolean;
}

interface OrderData {
  orderId: string;
  status: OrderStatus;
  placedOn: string;
  deliveredOn?: string;
  estimatedDelivery: string;
  courier: string;
  awbNumber: string;
  paymentMethod: string;
  amountPaid: number;
  items: { id: number; emoji: string; name: string; category: string; price: number; qty: number; bg: string; }[];
  deliveryAddress: { name: string; line: string; city: string; state: string; pincode: string; phone: string; };
  events: TrackEvent[];
}

/* ─── Mock Order Database ────────────────────────────────────────────────── */
const ORDERS: Record<string, OrderData> = {
  'LL12345678': {
    orderId: 'LL12345678', status: 'out_for_delivery',
    placedOn: '18 Mar 2026, 10:32 AM', estimatedDelivery: '22 Mar 2026',
    courier: 'Delhivery', awbNumber: 'DL98765432101',
    paymentMethod: 'UPI (GPay)', amountPaid: 3796,
    items: [
      { id: 1, emoji: '🚲', name: 'Balance Bicycle',  category: 'Vehicles',      price: 1399, qty: 1, bg: 'linear-gradient(135deg,#FFF3D4,#FFE099)' },
      { id: 3, emoji: '🦕', name: 'Dino Pull-Along',  category: 'Soft Toys',     price: 899,  qty: 2, bg: 'linear-gradient(135deg,#E1F7F2,#AAEEDD)' },
      { id: 4, emoji: '🎨', name: 'Color Wonder Kit', category: 'Arts & Crafts', price: 449,  qty: 1, bg: 'linear-gradient(135deg,#EAE0FF,#C7A4F5)' },
    ],
    deliveryAddress: { name: 'Priya Sharma', line: '42, Banjara Hills, Road No. 12', city: 'Hyderabad', state: 'Telangana', pincode: '500034', phone: '+91 98765 43210' },
    events: [
      { status: 'confirmed',        label: 'Order Confirmed',   description: 'Your order has been placed and payment received.',       timestamp: '18 Mar 2026 · 10:32 AM', location: 'Little Loot Warehouse, Hyderabad',   done: true,  active: false },
      { status: 'packed',           label: 'Packed & Ready',    description: 'Items carefully inspected and packed with love.',         timestamp: '19 Mar 2026 · 02:15 PM', location: 'Little Loot Warehouse, Hyderabad',   done: true,  active: false },
      { status: 'shipped',          label: 'Shipped',           description: 'Package handed to Delhivery courier partner.',           timestamp: '20 Mar 2026 · 09:40 AM', location: 'Delhivery Hub, Gachibowli',          done: true,  active: false },
      { status: 'out_for_delivery', label: 'Out for Delivery',  description: 'Your package is with the delivery agent and on its way!', timestamp: '22 Mar 2026 · 08:10 AM', location: 'Delivery Hub, Banjara Hills',        done: false, active: true  },
      { status: 'delivered',        label: 'Delivered',         description: 'Package delivered successfully.',                        timestamp: 'Expected by 8 PM today', location: '42, Banjara Hills, Hyderabad',       done: false, active: false },
    ],
  },
  'LL87654321': {
    orderId: 'LL87654321', status: 'delivered',
    placedOn: '10 Mar 2026, 03:15 PM', estimatedDelivery: '15 Mar 2026', deliveredOn: '14 Mar 2026, 06:22 PM',
    courier: 'BlueDart', awbNumber: 'BD12344321001',
    paymentMethod: 'Credit Card (HDFC)', amountPaid: 1248,
    items: [
      { id: 8, emoji: '🐻', name: 'Teddy Bear XL',       category: 'Soft Toys', price: 799, qty: 1, bg: 'linear-gradient(135deg,#E8FFEE,#AAEECC)' },
      { id: 5, emoji: '🧩', name: 'Jumbo Jigsaw 100pc',  category: 'Games',     price: 349, qty: 1, bg: 'linear-gradient(135deg,#E0F3FF,#AACFF5)' },
    ],
    deliveryAddress: { name: 'Rahul Mehta', line: '7-B, MG Road, Labbipet', city: 'Vijayawada', state: 'Andhra Pradesh', pincode: '520010', phone: '+91 91234 56789' },
    events: [
      { status: 'confirmed',        label: 'Order Confirmed',  description: 'Order placed and payment received.',              timestamp: '10 Mar 2026 · 03:15 PM', location: 'Little Loot Warehouse, Hyderabad', done: true, active: false },
      { status: 'packed',           label: 'Packed & Ready',   description: 'Items inspected and packed.',                     timestamp: '11 Mar 2026 · 11:00 AM', location: 'Little Loot Warehouse, Hyderabad', done: true, active: false },
      { status: 'shipped',          label: 'Shipped',          description: 'Package picked up by BlueDart.',                  timestamp: '11 Mar 2026 · 04:30 PM', location: 'BlueDart Hub, KPHB, Hyderabad',   done: true, active: false },
      { status: 'out_for_delivery', label: 'Out for Delivery', description: 'Package with delivery agent.',                    timestamp: '14 Mar 2026 · 09:00 AM', location: 'BlueDart Hub, Vijayawada',         done: true, active: false },
      { status: 'delivered',        label: 'Delivered',        description: 'Package delivered and accepted at the door.',     timestamp: '14 Mar 2026 · 06:22 PM', location: '7-B, MG Road, Vijayawada',         done: true, active: true  },
    ],
  },
  'LL11223344': {
    orderId: 'LL11223344', status: 'shipped',
    placedOn: '20 Mar 2026, 07:45 PM', estimatedDelivery: '25 Mar 2026',
    courier: 'Ekart', awbNumber: 'EK44332211009',
    paymentMethod: 'Cash on Delivery', amountPaid: 1199,
    items: [
      { id: 7, emoji: '🛹', name: 'Mini Skateboards', category: 'Outdoor', price: 1199, qty: 1, bg: 'linear-gradient(135deg,#FFEEF8,#F5B6D6)' },
    ],
    deliveryAddress: { name: 'Ananya Reddy', line: '12, Brodipet, 1st Lane', city: 'Guntur', state: 'Andhra Pradesh', pincode: '522002', phone: '+91 99887 76655' },
    events: [
      { status: 'confirmed',        label: 'Order Confirmed',   description: 'Your order has been placed successfully.',         timestamp: '20 Mar 2026 · 07:45 PM', location: 'Little Loot Warehouse, Hyderabad',   done: true,  active: false },
      { status: 'packed',           label: 'Packed & Ready',    description: 'Items inspected and packed for dispatch.',          timestamp: '21 Mar 2026 · 10:20 AM', location: 'Little Loot Warehouse, Hyderabad',   done: true,  active: false },
      { status: 'shipped',          label: 'Shipped',           description: 'Package picked up by Ekart logistics.',            timestamp: '21 Mar 2026 · 05:00 PM', location: 'Ekart Facility, Uppal, Hyderabad',   done: false, active: true  },
      { status: 'out_for_delivery', label: 'Out for Delivery',  description: 'Package will be out for delivery soon.',           timestamp: 'Expected: 24 Mar 2026',  location: 'Guntur Delivery Hub',               done: false, active: false },
      { status: 'delivered',        label: 'Delivered',         description: 'Expected delivery.',                               timestamp: 'Expected by 25 Mar 2026', location: '12, Brodipet, Guntur',             done: false, active: false },
    ],
  },
};

const STATUS_CFG: Record<OrderStatus, { color: string; bg: string; label: string; emoji: string }> = {
  confirmed:        { color: '#5BBEF5', bg: 'rgba(91,190,245,0.1)',  label: 'Order Confirmed',    emoji: '✅' },
  packed:           { color: '#C7A4F5', bg: 'rgba(199,164,245,0.1)', label: 'Packed & Ready',     emoji: '📦' },
  shipped:          { color: '#FFAD8A', bg: 'rgba(255,173,138,0.1)', label: 'Shipped',            emoji: '🚀' },
  out_for_delivery: { color: '#FFD336', bg: 'rgba(255,211,54,0.12)', label: 'Out for Delivery',   emoji: '🛵' },
  delivered:        { color: '#3ECFB2', bg: 'rgba(62,207,178,0.1)',  label: 'Delivered',          emoji: '🎉' },
};

const STEP_ORDER: OrderStatus[] = ['confirmed', 'packed', 'shipped', 'out_for_delivery', 'delivered'];

/* ─── Component ──────────────────────────────────────────────────────────── */
export default function TrackOrderPage() {
  const [inputValue, setInputValue] = useState('');
  const [order,      setOrder]      = useState<OrderData | null>(null);
  const [notFound,   setNotFound]   = useState(false);
  const [loading,    setLoading]    = useState(false);
  const [searched,   setSearched]   = useState(false);
  const [copied,     setCopied]     = useState(false);
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);

  function handleSearch() {
    const id = inputValue.trim().toUpperCase();
    if (!id) return;
    setLoading(true); setNotFound(false); setOrder(null); setSearched(false);
    setTimeout(() => {
      const found = ORDERS[id] ?? null;
      setOrder(found); setNotFound(!found); setSearched(true); setLoading(false);
    }, 900);
  }

  function clearSearch() {
    setInputValue(''); setOrder(null); setNotFound(false); setSearched(false);
  }

  function handleCopy() {
    if (!order) return;
    navigator.clipboard.writeText(order.awbNumber).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const cfg = order ? STATUS_CFG[order.status] : null;
  const currentIdx = order ? STEP_ORDER.indexOf(order.status) : -1;

  return (
    <div className={styles.page}>

      {/* Breadcrumb */}
      <nav className={styles.breadcrumb}>
        <Link href="/" className={styles.breadLink}>Home</Link>
        <span className={styles.breadSep}>›</span>
        <span className={styles.breadCurrent}>Track Order</span>
      </nav>

      {/* ── Hero ── */}
      <div className={styles.hero}>
        <div className={styles.heroLeft}>
          <div className={styles.heroBadge}>📦 Real-time tracking</div>
          <h1 className={styles.heroTitle}>
            Where's your<br />
            <span className={styles.heroAccent}>Little Loot?</span>
          </h1>
          <p className={styles.heroSub}>
            Enter your order ID or AWB number to see exactly where your package is right now.
          </p>
        </div>
        <div className={styles.heroArt}>
          <div className={styles.truckWrap}>
            <div className={styles.truckEmoji}>🚚</div>
            <div className={styles.truckRoad}>
              <div className={styles.roadDash} />
              <div className={styles.roadDash} />
              <div className={styles.roadDash} />
            </div>
          </div>
          {(['📦','🎁','⭐'] as const).map((icon, i) => (
            <span key={i} className={styles.floatIcon} style={{ '--fi': i } as React.CSSProperties}>{icon}</span>
          ))}
        </div>
      </div>

      {/* ── Search Box ── */}
      <div className={styles.searchCard}>
        <div className={styles.searchTopRow}>
          <div className={styles.searchLabel}>Order ID / AWB Number</div>
          <span className={styles.searchHintInline}>Check your confirmation email</span>
        </div>
        <div className={styles.searchRow}>
          <div className={styles.searchInputWrap}>
            <span className={styles.searchIco}>🔍</span>
            <input
              className={styles.searchInput}
              placeholder="e.g. LL12345678"
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
        <div className={styles.sampleRow}>
          <span className={styles.sampleLabel}>Try sample IDs:</span>
          {Object.keys(ORDERS).map(id => (
            <button key={id} className={styles.sampleChip} onClick={() => setInputValue(id)}>{id}</button>
          ))}
        </div>
      </div>

      {/* ── Not Found ── */}
      {searched && notFound && (
        <div className={styles.notFound}>
          <div className={styles.notFoundEmoji}>🤔</div>
          <h3 className={styles.notFoundTitle}>Order not found</h3>
          <p className={styles.notFoundText}>
            We couldn't find any order matching "<strong>{inputValue}</strong>".
            Please double-check your order confirmation email.
          </p>
          <div className={styles.tipList}>
            <div className={styles.tip}><span>💡</span><span>Order IDs start with "LL" followed by 8 digits</span></div>
            <div className={styles.tip}><span>📧</span><span>Find your ID in the confirmation email from Little Loot</span></div>
            <div className={styles.tip}><span>📞</span><span>Need help? Call 1800-123-4567 (toll-free, 9 AM–9 PM)</span></div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════
          ORDER RESULT
      ══════════════════════════════════ */}
      {order && cfg && (
        <div className={styles.results}>

          {/* Status Hero Strip */}
          <div className={styles.statusStrip} style={{ '--sc': cfg.color, '--sb': cfg.bg } as React.CSSProperties}>
            <div className={styles.statusLeft}>
              <div className={styles.statusEmoji}>{cfg.emoji}</div>
              <div>
                <div className={styles.statusLabel} style={{ color: cfg.color }}>{cfg.label}</div>
                <div className={styles.statusOrderId}>Order #{order.orderId}</div>
                {order.status === 'out_for_delivery' && <div className={styles.statusEta}>⏱ Expected by 8:00 PM today</div>}
                {order.status === 'delivered' && order.deliveredOn && <div className={styles.statusDelivered}>Delivered · {order.deliveredOn}</div>}
                {order.status !== 'delivered' && order.status !== 'out_for_delivery' && (
                  <div className={styles.statusEta}>📅 Est. delivery: {order.estimatedDelivery}</div>
                )}
              </div>
            </div>
            <div className={styles.courierPill}>
              <span>🚚</span>
              <div>
                <div className={styles.courierName}>{order.courier}</div>
                <div className={styles.awbRow}>
                  <span className={styles.awbNum}>{order.awbNumber}</span>
                  <button className={`${styles.copyBtn} ${copied ? styles.copyBtnDone : ''}`} onClick={handleCopy}>
                    {copied ? '✓' : '📋'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Visual Progress Rail */}
          <div className={styles.progressCard}>
            <div className={styles.progressRail}>
              {STEP_ORDER.map((s, i) => {
                const sc    = STATUS_CFG[s];
                const isDone   = i < currentIdx;
                const isActive = i === currentIdx;
                const isFuture = i > currentIdx;
                return (
                  <div key={s} className={styles.progressStep}>
                    {i > 0 && (
                      <div className={`${styles.railLine} ${(isDone || isActive) ? styles.railLineDone : ''}`}
                        style={(isDone || isActive) ? { background: `linear-gradient(90deg, ${STATUS_CFG[STEP_ORDER[i-1]].color}, ${sc.color})` } : {}} />
                    )}
                    <div
                      className={`${styles.railNode} ${isDone ? styles.railNodeDone : ''} ${isActive ? styles.railNodeActive : ''} ${isFuture ? styles.railNodeFuture : ''}`}
                      style={isActive ? { background: sc.color, boxShadow: `0 0 0 5px ${sc.bg}, 0 6px 20px ${sc.bg}` } : isDone ? { background: '#3ECFB2' } : {}}
                    >
                      {isDone  ? <span className={styles.railCheck}>✓</span> : <span>{sc.emoji}</span>}
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
            {/* fill bar under icons */}
            <div className={styles.railBarWrap}>
              <div className={styles.railBarTrack}>
                <div
                  className={styles.railBarFill}
                  style={{ width: `${(currentIdx / (STEP_ORDER.length - 1)) * 100}%`, background: `linear-gradient(90deg, #5BBEF5, ${cfg.color})` }}
                />
              </div>
            </div>
          </div>

          {/* Main grid */}
          <div className={styles.mainGrid}>

            {/* ─── Left col ─── */}
            <div className={styles.leftCol}>

              {/* Detailed event timeline */}
              <div className={styles.panel}>
                <div className={styles.panelTitle}><span>📍</span> Shipment Updates</div>
                <div className={styles.timeline}>
                  {[...order.events].reverse().map((ev, i) => {
                    const ec      = STATUS_CFG[ev.status];
                    const isOpen  = expandedIdx === i;
                    return (
                      <div
                        key={i}
                        className={`${styles.tlItem} ${ev.active ? styles.tlItemActive : ''} ${!ev.done && !ev.active ? styles.tlItemFuture : ''}`}
                      >
                        {i < order.events.length - 1 && (
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
                              <span className={styles.tlLabel} style={ev.active ? { color: ec.color } : {}}>
                                {ev.label}
                              </span>
                              {ev.active && <span className={styles.liveDot} />}
                            </div>
                            <div className={styles.tlTimes}>
                              <div className={styles.tlDate}>{ev.timestamp.split(' · ')[0]}</div>
                              {ev.timestamp.includes(' · ') && (
                                <div className={styles.tlTime}>{ev.timestamp.split(' · ')[1]}</div>
                              )}
                            </div>
                          </div>
                          <div className={styles.tlDesc}>{ev.description}</div>
                          <button className={styles.tlToggle}>
                            {isOpen ? '▲ Hide location' : '▼ Show location'}
                          </button>
                          <div className={`${styles.tlLocation} ${isOpen ? styles.tlLocationOpen : ''}`}>
                            <span>📍</span> {ev.location}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Courier info */}
              <div className={styles.panel}>
                <div className={styles.panelTitle}><span>🚚</span> Courier Details</div>
                <div className={styles.detailGrid}>
                  <div className={styles.detailRow}>
                    <span className={styles.detailKey}>Courier Partner</span>
                    <span className={styles.detailVal}>{order.courier}</span>
                  </div>
                  <div className={styles.detailRow}>
                    <span className={styles.detailKey}>AWB / Tracking No.</span>
                    <div className={styles.detailValRow}>
                      <span className={styles.detailVal}>{order.awbNumber}</span>
                      <button className={`${styles.copySmall} ${copied ? styles.copySmallDone : ''}`} onClick={handleCopy}>
                        {copied ? '✓ Copied' : '📋 Copy'}
                      </button>
                    </div>
                  </div>
                  <div className={styles.detailRow}>
                    <span className={styles.detailKey}>Order Placed</span>
                    <span className={styles.detailVal}>{order.placedOn}</span>
                  </div>
                  {order.deliveredOn ? (
                    <div className={styles.detailRow}>
                      <span className={styles.detailKey}>Delivered On</span>
                      <span className={styles.detailVal} style={{ color: '#3ECFB2', fontWeight: 800 }}>{order.deliveredOn}</span>
                    </div>
                  ) : (
                    <div className={styles.detailRow}>
                      <span className={styles.detailKey}>Est. Delivery</span>
                      <span className={styles.detailVal} style={{ color: 'var(--coral)', fontWeight: 800 }}>{order.estimatedDelivery}</span>
                    </div>
                  )}
                </div>
                <a
                  href={`https://www.${order.courier.toLowerCase().replace(' ', '')}.com`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.courierLink}
                >
                  Track on {order.courier} website →
                </a>
              </div>

              {/* Delivery address */}
              <div className={styles.panel}>
                <div className={styles.panelTitle}><span>🏠</span> Delivery Address</div>
                <div className={styles.addrBody}>
                  <div className={styles.addrAvatar}>🏠</div>
                  <div>
                    <div className={styles.addrName}>{order.deliveryAddress.name}</div>
                    <div className={styles.addrLine}>{order.deliveryAddress.line}</div>
                    <div className={styles.addrLine}>{order.deliveryAddress.city}, {order.deliveryAddress.state} – {order.deliveryAddress.pincode}</div>
                    <div className={styles.addrPhone}>📞 {order.deliveryAddress.phone}</div>
                  </div>
                </div>
              </div>

            </div>

            {/* ─── Right col ─── */}
            <div className={styles.rightCol}>

              {/* Order items */}
              <div className={styles.panel}>
                <div className={styles.panelTitle}><span>🛍️</span> Order Items</div>
                <div className={styles.itemsList}>
                  {order.items.map(item => (
                    <Link key={item.id} href={`/product/${item.id}`} className={styles.itemRow}>
                      <div className={styles.itemImg} style={{ background: item.bg }}>
                        <span>{item.emoji}</span>
                        <span className={styles.itemQty}>{item.qty}</span>
                      </div>
                      <div className={styles.itemInfo}>
                        <div className={styles.itemName}>{item.name}</div>
                        <div className={styles.itemCat}>{item.category}</div>
                      </div>
                      <div className={styles.itemPrice}>₹{(item.price * item.qty).toLocaleString('en-IN')}</div>
                    </Link>
                  ))}
                </div>
                <div className={styles.orderFooter}>
                  <div className={styles.totalRow}>
                    <span>Total Paid</span>
                    <span className={styles.totalAmt}>₹{order.amountPaid.toLocaleString('en-IN')}</span>
                  </div>
                  <div className={styles.payChip}>💳 {order.paymentMethod}</div>
                </div>
              </div>

              {/* Help */}
              <div className={styles.panel}>
                <div className={styles.panelTitle}><span>🙋</span> Need Help?</div>
                <div className={styles.helpBtns}>
                  <a href="https://wa.me/911234567890" target="_blank" rel="noopener noreferrer" className={`${styles.helpBtn} ${styles.helpWhatsapp}`}>
                    <span className={styles.helpBtnIco}>💬</span>
                    <div><div className={styles.helpBtnTitle}>WhatsApp</div><div className={styles.helpBtnSub}>Replies in 5 min</div></div>
                  </a>
                  <a href="tel:18001234567" className={`${styles.helpBtn} ${styles.helpCall}`}>
                    <span className={styles.helpBtnIco}>📞</span>
                    <div><div className={styles.helpBtnTitle}>Call Us</div><div className={styles.helpBtnSub}>1800-123-4567</div></div>
                  </a>
                  <a href="mailto:help@littleloot.in" className={`${styles.helpBtn} ${styles.helpEmail}`}>
                    <span className={styles.helpBtnIco}>📧</span>
                    <div><div className={styles.helpBtnTitle}>Email</div><div className={styles.helpBtnSub}>help@littleloot.in</div></div>
                  </a>
                </div>
              </div>

              {/* Rate (only delivered) */}
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

      {/* Initial featurette */}
      {!searched && !loading && (
        <div className={styles.featurettes}>
          {[
            { icon: '📦', title: 'Real-time Updates',   sub: 'Live tracking from warehouse to your doorstep' },
            { icon: '🗺️', title: 'Full Journey Map',    sub: 'Every checkpoint your package passes through' },
            { icon: '🔔', title: 'SMS & Email Alerts',  sub: 'Automatic notifications at every milestone' },
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
