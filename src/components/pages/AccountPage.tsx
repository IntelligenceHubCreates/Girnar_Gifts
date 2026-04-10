'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from './AccountPage.module.css';
import { _get, _put } from '@/shared/fetchwrapper';
import { signOut } from 'next-auth/react';

/* ─── Types & Data ───────────────────────────────────────────────────────── */
type Tab = 'profile' | 'orders' | 'addresses' | 'wishlist' | 'rewards';

const ORDERS = [
  { id: 'LL2025031', items: ['🚀', '🦕'], name: 'Balance Bike + Dino Pull-Along', date: '18 Mar 2025', amount: 2298, status: 'Delivered' },
  { id: 'LL2025028', items: ['🎨'], name: 'Sketch & Color Art Kit', date: '12 Mar 2025', amount: 849, status: 'Shipped' },
  { id: 'LL2025021', items: ['🧸', '🔮'], name: 'Teddy Bear + Magic Puzzle Globe', date: '02 Mar 2025', amount: 1599, status: 'Processing' },
  { id: 'LL2025015', items: ['📚'], name: 'Learning Activity Books Set', date: '21 Feb 2025', amount: 699, status: 'Cancelled' },
];

const WISHLIST = [
  { id: 1, emoji: '🤖', name: 'Robot Builder Kit', price: 1499 },
  { id: 2, emoji: '🎯', name: 'Target Archery Set', price: 799 },
  { id: 3, emoji: '🧩', name: '3D Puzzle Cube', price: 599 },
  { id: 4, emoji: '🎪', name: 'Mini Circus Tent', price: 1199 },
  { id: 5, emoji: '🚂', name: 'Wooden Train Set', price: 2199 },
  { id: 6, emoji: '🌈', name: 'Rainbow Stacking Rings', price: 449 },
];

const REWARDS_HISTORY = [
  { desc: 'Order #LL2025031 purchase', pts: '+230', type: 'earn', date: '18 Mar' },
  { desc: 'Welcome bonus', pts: '+100', type: 'earn', date: '10 Mar' },
  { desc: 'Redeemed on Order #LL2025028', pts: '-100', type: 'redeem', date: '12 Mar' },
  { desc: 'Review submitted', pts: '+50', type: 'earn', date: '05 Mar' },
];

const STATUS_CLASS: Record<string, string> = {
  Delivered: styles.statusDelivered,
  Shipped: styles.statusShipped,
  Processing: styles.statusProcessing,
  Cancelled: styles.statusCancelled,
};

/* ─── Component ──────────────────────────────────────────────────────────── */
export default function AccountPage() {
  const [tab, setTab] = useState<Tab>('profile');
  const [editing, setEditing] = useState(false);
  const [toast, setToast] = useState('');
  const [wishlist, setWishlist] = useState(WISHLIST);

  const [profile, setProfile] = useState({
    firstName: 'Ananya', lastName: 'Reddy',
    email: 'ananya.reddy@gmail.com', phone: '9876543210',
    dob: '1992-08-14', gender: 'Female',
  });
  const [draft, setDraft] = useState({ ...profile });
  const [orders, setOrders] = useState(ORDERS);

  /* ─── Load real data from backend ─────────────────────────────────── */
 useEffect(() => {
    // Load profile
    _get('/api/user/profile').then((res) => {
      if (res) {
        const nameParts = (res.name || '').split(' ');
        const p = {
          firstName: nameParts[0] || profile.firstName,
          lastName: nameParts.slice(1).join(' ') || profile.lastName,
          email: res.email || profile.email,
          phone: res.phone || profile.phone,
          dob: res.dob || profile.dob,
          gender: res.gender || profile.gender,
        };
        setProfile(p);
        setDraft(p);
      }
    }).catch(() => {});
    // Load orders
    _get('/api/orders').then((res) => {
      const raw = Array.isArray(res) ? res : (res?.orders || []);
      if (raw.length > 0) {
        const mapped = raw.map((o: any) => ({
          id: o.id,
          items: ['📦'],
          name: o.order_items?.map((i: any) => i.product?.name).join(' + ') || 'Order',
          date: new Date(o.created_at || o.order_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
          amount: o.total_amount || 0,
          status: o.status || 'Processing',
        }));
        setOrders(mapped);
      }
    }).catch(() => {});
  }, []);

  /* Override handleSave to call backend */
  const handleSaveWithApi = () => {
    _put('/api/user/profile', {
      name: `${draft.firstName} ${draft.lastName}`.trim(),
      phone: draft.phone,
    }).catch(() => {});
    setProfile({ ...draft });
    setEditing(false);
    showToast('✅ Profile updated!');
  };


  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const handleSave = () => {
    setProfile({ ...draft });
    setEditing(false);
    showToast('✅ Profile updated!');
  };

  const removeWishItem = (id: number) => {
    setWishlist(w => w.filter(x => x.id !== id));
    showToast('💔 Removed from wishlist');
  };

  const navItems: { id: Tab; label: string; icon: string; badge?: number }[] = [
    { id: 'profile', label: 'My Profile', icon: '👤' },
    { id: 'orders', label: 'My Orders', icon: '📦', badge: 2 },
    { id: 'addresses', label: 'Addresses', icon: '📍' },
    { id: 'wishlist', label: 'Wishlist', icon: '❤️', badge: wishlist.length },
    { id: 'rewards', label: 'Rewards', icon: '⭐' },
  ];

  return (
    <div className={styles.page}>
      {/* Breadcrumb */}
      <div className={styles.breadcrumb}>
        <Link href="/" className={styles.breadLink}>Home</Link>
        <span className={styles.breadSep}>›</span>
        <span className={styles.breadCurrent}>My Account</span>
      </div>

      <div className={styles.layout}>
        {/* ── Sidebar ── */}
        <aside className={styles.sidebar}>
          {/* Profile card */}
          <div className={styles.profileCard}>
            <div className={styles.avatarWrap}>
              <div className={styles.avatar}>👩</div>
              <div className={styles.avatarEdit}>✏️</div>
            </div>
            <div className={styles.profileName}>{profile.firstName} {profile.lastName}</div>
            <div className={styles.profileEmail}>{profile.email}</div>
            <div className={styles.statsRow}>
              <div className={styles.stat}>
                <div className={styles.statNum}>4</div>
                <div className={styles.statLabel}>Orders</div>
              </div>
              <div className={styles.stat}>
                <div className={styles.statNum}>{wishlist.length}</div>
                <div className={styles.statLabel}>Wishlist</div>
              </div>
              <div className={styles.stat}>
                <div className={styles.statNum}>280</div>
                <div className={styles.statLabel}>Points</div>
              </div>
            </div>
          </div>

          {/* Nav */}
          <nav className={styles.navMenu}>
            {navItems.map(n => (
              <button
                key={n.id}
                type="button"
                className={`${styles.navItem} ${tab === n.id ? styles.active : ''}`}
                onClick={() => setTab(n.id)}
              >
                <span className={styles.navIcon}>{n.icon}</span>
                {n.label}
                {n.badge ? <span className={styles.navBadge}>{n.badge}</span> : null}
              </button>
            ))}
            <div className={styles.navDivider} />
            <button
  type="button"
  className={styles.logoutBtn}
  onClick={() => signOut({ callbackUrl: '/login' })}
>
  <span className={styles.navIcon}>🚪</span> Sign Out
</button>
          </nav>
        </aside>

        {/* ── Content ── */}
        <div className={styles.content}>

          {/* ──── PROFILE ──── */}
          {tab === 'profile' && (
            <div className={styles.sectionCard}>
              <div className={styles.sectionHeader}>
                <div className={styles.sectionTitle}>👤 My Profile</div>
                {editing
                  ? <button type="button" className={styles.saveBtn} onClick={handleSaveWithApi}>Save Changes</button>
                  : <button type="button" className={styles.editBtn} onClick={() => setEditing(true)}>Edit Profile</button>
                }
              </div>
              <div className={styles.formGrid}>
                {[
                  { id:'firstName', label:'First Name', icon:'👤', placeholder:'First name' },
                  { id:'lastName',  label:'Last Name',  icon:'👤', placeholder:'Last name' },
                  { id:'email',     label:'Email',      icon:'✉️',  placeholder:'Email' },
                  { id:'phone',     label:'Mobile',     icon:'📱', placeholder:'Mobile number' },
                  { id:'dob',       label:'Date of Birth', icon:'🎂', placeholder:'' },
                  { id:'gender',    label:'Gender',     icon:'⚧️', placeholder:'Gender' },
                ].map(f => (
                  <div className={styles.field} key={f.id}>
                    <label className={styles.label}>{f.label}</label>
                    <div className={styles.inputWrap}>
                      <span className={styles.inputIcon}>{f.icon}</span>
                      <input
                        type={f.id === 'dob' ? 'date' : f.id === 'email' ? 'email' : 'text'}
                        className={styles.input}
                        value={draft[f.id as keyof typeof draft]}
                        onChange={e => setDraft(d => ({ ...d, [f.id]: e.target.value }))}
                        disabled={!editing || f.id === 'email'}
                        placeholder={f.placeholder}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ──── ORDERS ──── */}
          {tab === 'orders' && (
            <div className={styles.sectionCard}>
              <div className={styles.sectionHeader}>
                <div className={styles.sectionTitle}>📦 My Orders</div>
                <Link href="/track-order" style={{ fontSize: 13, fontWeight: 700, color: 'var(--coral)' }}>
                  Track Order →
                </Link>
              </div>
              <div className={styles.ordersList}>
                {orders.map(o => (
                  <div key={o.id} className={styles.orderCard}>
                    <div className={styles.orderEmojis}>
                      {o.items.map((em, i) => (
                        <div key={i} className={styles.orderEmoji}>{em}</div>
                      ))}
                    </div>
                    <div className={styles.orderInfo}>
                      <div className={styles.orderId}>#{o.id}</div>
                      <div className={styles.orderName}>{o.name}</div>
                      <div className={styles.orderMeta}>{o.date}</div>
                    </div>
                    <div className={styles.orderRight}>
                      <div className={styles.orderAmt}>₹{o.amount.toLocaleString('en-IN')}</div>
                      <div className={`${styles.orderStatus} ${STATUS_CLASS[o.status]}`}>
                        {o.status === 'Delivered' && '✅'}
                        {o.status === 'Shipped' && '🚚'}
                        {o.status === 'Processing' && '⏳'}
                        {o.status === 'Cancelled' && '❌'}
                        {' '}{o.status}
                      </div>
                    </div>
                    <button type="button" className={styles.reorderBtn}
                      onClick={() => showToast('🛒 Added to cart!')}>
                      Reorder
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ──── ADDRESSES ──── */}
          {tab === 'addresses' && (
            <div className={styles.sectionCard}>
              <div className={styles.sectionHeader}>
                <div className={styles.sectionTitle}>📍 Saved Addresses</div>
              </div>
              <div className={styles.addressGrid}>
                <div className={`${styles.addressCard} ${styles.defaultCard}`}>
                  <span className={styles.defaultBadge}>Default</span>
                  <div className={styles.addressType}>🏠 Home</div>
                  <div className={styles.addressText}>
                    Ananya Reddy<br />
                    Plot 42, Madhapur Road<br />
                    Hyderabad – 500081<br />
                    Telangana, India<br />
                    📱 9876543210
                  </div>
                  <div className={styles.addressActions}>
                    <button type="button" className={styles.addrBtn}>Edit</button>
                    <button type="button" className={`${styles.addrBtn} ${styles.addrBtnDanger}`}>Delete</button>
                  </div>
                </div>
                <div className={styles.addressCard}>
                  <div className={styles.addressType}>🏢 Office</div>
                  <div className={styles.addressText}>
                    Ananya Reddy<br />
                    5th Floor, Cyber Towers<br />
                    HITEC City, Hyderabad – 500084<br />
                    Telangana, India<br />
                    📱 9876543210
                  </div>
                  <div className={styles.addressActions}>
                    <button type="button" className={styles.addrBtn}>Edit</button>
                    <button type="button" className={styles.addrBtn}>Set Default</button>
                    <button type="button" className={`${styles.addrBtn} ${styles.addrBtnDanger}`}>Delete</button>
                  </div>
                </div>
                <button type="button" className={styles.addAddressCard}
                  onClick={() => showToast('📍 Add address form coming soon!')}>
                  <span className={styles.addIcon}>➕</span>
                  <span className={styles.addLabel}>Add New Address</span>
                </button>
              </div>
            </div>
          )}

          {/* ──── WISHLIST ──── */}
          {tab === 'wishlist' && (
            <div className={styles.sectionCard}>
              <div className={styles.sectionHeader}>
                <div className={styles.sectionTitle}>❤️ My Wishlist</div>
                <span style={{ fontSize: 13, color: '#999' }}>{wishlist.length} items</span>
              </div>
              {wishlist.length === 0 ? (
                <div className={styles.emptyState}>
                  <div className={styles.emptyIcon}>💔</div>
                  <div className={styles.emptyText}>Your wishlist is empty.<br />Start adding items you love!</div>
                </div>
              ) : (
                <div className={styles.wishlistGrid}>
                  {wishlist.map(w => (
                    <div key={w.id} className={styles.wishCard}>
                      <div className={styles.wishEmoji}>{w.emoji}</div>
                      <div className={styles.wishName}>{w.name}</div>
                      <div className={styles.wishPrice}>₹{w.price.toLocaleString('en-IN')}</div>
                      <div className={styles.wishActions}>
                        <button type="button" className={styles.wishAddBtn}
                          onClick={() => showToast('🛒 Added to cart!')}>
                          Add to Cart
                        </button>
                        <button type="button" className={styles.wishRemoveBtn}
                          onClick={() => removeWishItem(w.id)}>
                          🗑️
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ──── REWARDS ──── */}
          {tab === 'rewards' && (
            <div className={styles.sectionCard}>
              <div className={styles.sectionHeader}>
                <div className={styles.sectionTitle}>⭐ Reward Points</div>
              </div>
              <div className={styles.rewardsTop}>
                <div>
                  <div className={styles.rewardsPoints}>280</div>
                  <div className={styles.rewardsLabel}>Points available · Worth ₹28</div>
                </div>
                <button type="button" className={styles.redeemBtn}
                  onClick={() => showToast('🎁 Points redeemed at checkout!')}>
                  Redeem Now
                </button>
              </div>
              <div className={styles.rewardsHistory}>
                {REWARDS_HISTORY.map((r, i) => (
                  <div key={i} className={styles.rewardRow}>
                    <div>
                      <div style={{ fontWeight: 700, color: 'var(--navy)', fontSize: 14 }}>{r.desc}</div>
                      <div className={styles.rewardDesc}>{r.date}</div>
                    </div>
                    <div className={`${styles.rewardPts} ${r.type === 'earn' ? styles.earn : styles.redeem}`}>
                      {r.pts} pts
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {toast && <div className={styles.toast}>{toast}</div>}
    </div>
  );
}
