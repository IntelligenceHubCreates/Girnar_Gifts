'use client'

import FilterTabs from '../ui/FilterTabs'

/* ─── CUSTOMERS ─────────────────────────────────────────────────── */
const CUSTOMERS = [
  { name:'Priya Sharma',  phone:'+91 98765 43210', email:'priya.sharma@gmail.com',   city:'Hyderabad',  orders:12, spent:'₹14,240', joined:'Jan 2025', tag:'tag-vip',     emoji:'👩',  bg:'var(--coral-light)' },
  { name:'Rahul Mehta',   phone:'+91 91234 56789', email:'rahulmehta@outlook.com',   city:'Vijayawada', orders:5,  spent:'₹3,897',  joined:'Mar 2025', tag:'tag-regular', emoji:'👨',  bg:'var(--sky-light)' },
  { name:'Ananya Reddy',  phone:'+91 90000 11223', email:'ananya.r@gmail.com',        city:'Guntur',     orders:8,  spent:'₹7,500',  joined:'Nov 2024', tag:'tag-vip',     emoji:'👩‍💼', bg:'var(--lilac-light)' },
  { name:'Arjun Nair',    phone:'+91 88765 44321', email:'arjun.nair@yahoo.in',       city:'Chennai',    orders:1,  spent:'₹3,845',  joined:'12 Mar 2026', tag:'tag-new', emoji:'🧑',  bg:'var(--sun-light)' },
  { name:'Sneha Iyer',    phone:'+91 87654 32109', email:'sneha.iyer@gmail.com',      city:'Bengaluru',  orders:3,  spent:'₹2,100',  joined:'Feb 2026', tag:'tag-regular', emoji:'👩',  bg:'var(--peach-light)' },
]

export function CustomersPage() {
  return (
    <div>
      <div className="page-header">
        <div className="ph-left">
          <div className="ph-title">Customers</div>
          <div className="ph-sub">3,412 registered customers</div>
        </div>
        <div className="ph-actions">
          <button className="btn btn-outline">📥 Export</button>
          <button className="btn btn-primary">➕ Add Customer</button>
        </div>
      </div>
      <div className="card">
        <div className="card-head">
          <FilterTabs tabs={['All','⭐ VIP','Regular','New']} />
          <div className="tb-search" style={{ width:190 }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ color:'var(--muted)', flexShrink:0 }}>
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input type="text" placeholder="Search customers…"/>
          </div>
        </div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Customer</th><th>Email</th><th>City</th><th>Orders</th><th>Total Spent</th><th>Joined</th><th>Segment</th><th>Actions</th></tr></thead>
            <tbody>
              {CUSTOMERS.map(c => (
                <tr key={c.name}>
                  <td>
                    <div style={{ display:'flex', alignItems:'center', gap:9 }}>
                      <div className="rc-av" style={{ background: c.bg }}>{c.emoji}</div>
                      <div>
                        <div style={{ fontWeight:800 }}>{c.name}</div>
                        <div className="td-muted">{c.phone}</div>
                      </div>
                    </div>
                  </td>
                  <td className="td-muted">{c.email}</td>
                  <td>{c.city}</td>
                  <td style={{ fontWeight:800 }}>{c.orders}</td>
                  <td style={{ fontWeight:900, color:'var(--coral)' }}>{c.spent}</td>
                  <td className="td-muted">{c.joined}</td>
                  <td><span className={`tag ${c.tag}`}>{c.tag === 'tag-vip' ? '⭐ VIP' : c.tag === 'tag-new' ? 'New' : 'Regular'}</span></td>
                  <td>
                    <div style={{ display:'flex', gap:5 }}>
                      <button className="btn btn-ghost btn-xs btn-icon">👁</button>
                      <button className="btn btn-ghost btn-xs btn-icon">✉️</button>
                      <button className="btn btn-ghost btn-xs btn-icon">✏️</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="card-footer" style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <span style={{ fontSize:'.75rem', fontWeight:700, color:'var(--muted)' }}>Showing 5 of 3,412 customers</span>
          <div style={{ display:'flex', gap:4 }}>
            <button className="btn btn-ghost btn-sm">← Prev</button>
            <button className="btn btn-primary btn-sm">1</button>
            <button className="btn btn-ghost btn-sm">2</button>
            <button className="btn btn-ghost btn-sm">Next →</button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─── CATEGORIES ─────────────────────────────────────────────────── */
const CATS = [
  { bg:'linear-gradient(135deg,#FFF3D4,#FFE099)', emoji:'🧸', name:'Soft Toys',    count:'120+ items', pill:'pill-green', status:'Active', products:124, orders:334, rev:'₹89K',  bar:72 },
  { bg:'linear-gradient(135deg,#FFE4E1,#FFBDB6)', emoji:'✏️', name:'Stationery',   count:'200+ items', pill:'pill-green', status:'Active', products:208, orders:512, rev:'₹1.2L', bar:88 },
  { bg:'linear-gradient(135deg,#E1F7F2,#AAEEDD)', emoji:'🎨', name:'Arts & Crafts',count:'85+ items',  pill:'pill-green', status:'Active', products:87,  orders:238, rev:'₹56K',  bar:55 },
  { bg:'linear-gradient(135deg,#EAE0FF,#C7A4F5)', emoji:'🎮', name:'Board Games',  count:'60+ items',  pill:'pill-green', status:'Active', products:62,  orders:180, rev:'₹44K',  bar:48 },
  { bg:'linear-gradient(135deg,#E0F3FF,#AACFF5)', emoji:'📚', name:'Books',        count:'300+ items', pill:'pill-green', status:'Active', products:312, orders:410, rev:'₹78K',  bar:64 },
  { bg:'linear-gradient(135deg,#FFF0E0,#FFCC99)', emoji:'🚗', name:'Vehicles',     count:'75+ items',  pill:'pill-yellow',status:'Draft',  products:76,  orders:95,  rev:'₹32K',  bar:38 },
]

export function CategoriesPage() {
  return (
    <div>
      <div className="page-header">
        <div className="ph-left">
          <div className="ph-title">Categories</div>
          <div className="ph-sub">6 active categories · 840 total products</div>
        </div>
        <div className="ph-actions">
          <button className="btn btn-outline">⬇ Reorder</button>
          <button className="btn btn-primary">➕ Add Category</button>
        </div>
      </div>
      <div className="cat-grid">
        {CATS.map(c => (
          <div key={c.name} className="cat-card">
            <div className="cat-banner" style={{ background: c.bg }}>
              <div className="cat-emoji">{c.emoji}</div>
              <div className="cat-banner-text">
                <div className="cat-banner-name">{c.name}</div>
                <div className="cat-banner-count">{c.count}</div>
              </div>
              <span className={`pill ${c.pill}`}>{c.status}</span>
            </div>
            <div className="cat-card-body">
              <div className="cat-meta-row">
                <div className="cat-stat"><div className="cs-val">{c.products}</div><div className="cs-lbl">Products</div></div>
                <div className="cat-stat"><div className="cs-val">{c.orders}</div><div className="cs-lbl">Orders</div></div>
                <div className="cat-stat"><div className="cs-val">{c.rev}</div><div className="cs-lbl">Revenue</div></div>
              </div>
              <div className="cat-bar-track"><div className="cat-bar-fill" style={{ width:`${c.bar}%` }} /></div>
              <div style={{ fontSize:'.66rem', fontWeight:700, color:'var(--muted)', marginTop:5 }}>{c.bar}% of category target reached</div>
              <div className="cat-actions">
                <button className="btn btn-outline btn-sm">✏️ Edit</button>
                {c.status === 'Draft'
                  ? <button className="btn btn-primary btn-sm">▶ Publish</button>
                  : <button className="btn btn-ghost btn-sm">👁 View</button>
                }
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ─── COUPONS ─────────────────────────────────────────────────────── */
const COUPONS = [
  { code:'HOLI20',       desc:'Holi special — 20% off everything',          stripe:'#FF6B5B', discount:'20% OFF',  expiry:'31 Mar 2026',  minOrder:'₹299',  uses:248,  maxUses:500,  status:'Active',  pill:'pill-green' },
  { code:'FIRSTBUY10',   desc:'₹100 off for first-time buyers',              stripe:'#3ECFB2', discount:'₹100 OFF', expiry:'No expiry',    minOrder:'₹499',  uses:1100, maxUses:null, status:'Active',  pill:'pill-green' },
  { code:'STATIONERY15', desc:'15% off all stationery products',             stripe:'#5BBEF5', discount:'15% OFF',  expiry:'30 Apr 2026',  minOrder:'₹199',  uses:89,   maxUses:300,  status:'Active',  pill:'pill-green' },
  { code:'FREESHIP',     desc:'Free shipping — any order',                   stripe:'#C7A4F5', discount:'FREE SHIP',expiry:'28 Feb 2026',  minOrder:'₹1',    uses:420,  maxUses:1000, status:'Expired', pill:'pill-red'  },
]

export function CouponsPage() {
  return (
    <div>
      <div className="page-header">
        <div className="ph-left">
          <div className="ph-title">Coupons</div>
          <div className="ph-sub">12 active promo codes · ₹38.4K discount given this month</div>
        </div>
        <div className="ph-actions">
          <button className="btn btn-outline">📥 Export</button>
          <button className="btn btn-primary">➕ Create Coupon</button>
        </div>
      </div>

      <div className="coupons-stats">
        {[
          { icon:'🏷️', bg:'var(--coral-light)', val:'12',    label:'Active Coupons' },
          { icon:'🔢', bg:'var(--mint-light)',  val:'1,248', label:'Times Used' },
          { icon:'💸', bg:'var(--sun-light)',   val:'₹38.4K',label:'Total Discount Given' },
          { icon:'📈', bg:'var(--sky-light)',   val:'18.3%', label:'Conversion Lift' },
        ].map(s => (
          <div key={s.label} className="coupon-stat">
            <div className="cs-icon" style={{ background: s.bg }}>{s.icon}</div>
            <div className="cs-info"><div className="cs-n">{s.val}</div><div className="cs-l">{s.label}</div></div>
          </div>
        ))}
      </div>

      <div className="coupons-list">
        {COUPONS.map(c => (
          <div key={c.code} className="coupon-card">
            <div className="coupon-stripe" style={{ background: c.stripe }} />
            <div className="coupon-inner">
              <div className="coupon-top">
                <div>
                  <div className="coupon-code">{c.code}</div>
                  <div className="coupon-desc">{c.desc}</div>
                </div>
                <span className={`pill ${c.pill}`}>{c.status}</span>
              </div>
              <div className="coupon-meta">
                <div className="cm-item"><em>Discount:</em> {c.discount}</div>
                <div className="cm-item"><em>Expires:</em> {c.expiry}</div>
                <div className="cm-item"><em>Min order:</em> {c.minOrder}</div>
              </div>
              <div className="coupon-footer">
                <div className="coupon-progress-wrap">
                  <div className="coupon-progress-fill" style={{ width:`${c.maxUses ? Math.round(c.uses/c.maxUses*100) : 100}%`, background: c.stripe }} />
                </div>
                <span className="coupon-progress-label">{c.uses}{c.maxUses ? ` / ${c.maxUses}` : ''} uses</span>
                <div style={{ display:'flex', gap:6, marginLeft:'auto' }}>
                  <button className="btn btn-outline btn-xs">✏️</button>
                  <button className="btn btn-danger btn-xs">🗑</button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ─── REVIEWS ─────────────────────────────────────────────────────── */
const REVIEWS = [
  { name:'Priya Sharma', product:'🎨 Color Wonder Kit · Verified Purchase',   emoji:'👩',  bg:'var(--coral-light)', stars:'⭐⭐⭐⭐⭐', date:'12 Mar 2026', pill:'pill-green',  status:'Approved',       border:'var(--border)', text:'My daughter absolutely loves the art kit from Little Loot. The quality is outstanding and the packaging is so adorable.' },
  { name:'Rahul Mehta',  product:'📚 Stationery Bundle · Verified Purchase',  emoji:'👨',  bg:'var(--sky-light)',   stars:'⭐⭐⭐⭐',  date:'10 Mar 2026', pill:'pill-yellow', status:'Needs Response', border:'var(--sun)',    text:'Great stationery selection! My son needed a full kit for school and Little Loot had everything. Only thing — the pencil box was slightly dented.' },
  { name:'Ananya Reddy', product:'🐻 Teddy Bear XL · Verified Purchase',      emoji:'👩‍💼', bg:'var(--lilac-light)', stars:'⭐⭐⭐⭐⭐', date:'08 Mar 2026', pill:'pill-green',  status:'Approved',       border:'var(--border)', text:'The teddy bear I ordered for my niece\'s birthday was so soft and premium! Beautifully packaged. Would 100% recommend!' },
  { name:'Kiran Patil',  product:'🚲 Balance Bicycle · Verified Purchase',    emoji:'🧑',  bg:'var(--peach-light)', stars:'⭐⭐⭐',    date:'05 Mar 2026', pill:'pill-red',    status:'Flagged',        border:'#FFCFC9',       text:'Bicycle looks good but one of the wheels had a slight wobble. Expected better quality control at this price point.' },
]

export function ReviewsPage() {
  return (
    <div>
      <div className="page-header">
        <div className="ph-left">
          <div className="ph-title">Product Reviews</div>
          <div className="ph-sub">Moderate and respond to customer reviews</div>
        </div>
        <div className="ph-actions"><button className="btn btn-outline">📥 Export</button></div>
      </div>

      <div className="reviews-summary">
        <div className="card">
          <div className="card-body" style={{ textAlign:'center' }}>
            <div className="rb-num">4.6</div>
            <div className="rb-stars">⭐⭐⭐⭐⭐</div>
            <div className="rb-count">Based on 1,248 reviews</div>
          </div>
        </div>
        <div className="card">
          <div className="rating-bars">
            {[{label:'5★',pct:72},{label:'4★',pct:18},{label:'3★',pct:6},{label:'2★',pct:2},{label:'1★',pct:2}].map(r => (
              <div key={r.label} className="rb-row">
                <span className="rb-label">{r.label}</span>
                <div className="rb-track"><div className="rb-fill" style={{ width:`${r.pct}%` }} /></div>
                <span className="rb-pct">{r.pct}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="reviews-filters">
        <FilterTabs tabs={['All Reviews','⭐⭐⭐⭐⭐ 5 Star','⭐⭐⭐⭐ 4 Star','⚠️ Needs Response','🚩 Flagged (3)']} />
      </div>

      <div className="reviews-list">
        {REVIEWS.map(r => (
          <div key={r.name + r.date} className="review-card" style={{ borderColor: r.border, background: r.status === 'Needs Response' ? 'var(--sun-light)' : '' }}>
            <div className="rc-head">
              <div className="rc-av" style={{ background: r.bg }}>{r.emoji}</div>
              <div className="rc-meta" style={{ flex:1 }}>
                <div className="rc-name">{r.name}</div>
                <div className="rc-product">{r.product}</div>
              </div>
              <div style={{ textAlign:'right' }}>
                <div className="rc-stars">{r.stars}</div>
                <div className="rc-date">{r.date}</div>
              </div>
              <span className={`pill ${r.pill}`} style={{ marginLeft:10 }}>{r.status}</span>
            </div>
            <div className="rc-text">&ldquo;{r.text}&rdquo;</div>
            <div className="rc-actions">
              <button className={`btn ${r.status === 'Needs Response' ? 'btn-primary' : 'btn-outline'} btn-xs`}>💬 Reply</button>
              <button className="btn btn-ghost btn-xs">📌 Pin</button>
              {r.status === 'Flagged'
                ? <><button className="btn btn-ghost btn-xs">✅ Approve</button><button className="btn btn-danger btn-xs">🗑 Remove</button></>
                : <button className="btn btn-danger btn-xs">🚩 Flag</button>
              }
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
