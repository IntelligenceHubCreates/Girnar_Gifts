'use client'

import { useState } from 'react'
import FilterTabs from '../ui/FilterTabs'

const RECENT_ORDERS = [
  { id: '#LL-2841', customer: 'Priya Sharma',  city: 'Hyderabad',  emoji: '👩', bg: 'var(--coral-light)', items: '3 items', amount: '₹2,197', date: '12 Mar 2026', status: 'Delivered',  pill: 'pill-green' },
  { id: '#LL-2840', customer: 'Rahul Mehta',   city: 'Vijayawada', emoji: '👨', bg: 'var(--sky-light)',   items: '1 item',   amount: '₹549',   date: '12 Mar 2026', status: 'Processing', pill: 'pill-blue' },
  { id: '#LL-2839', customer: 'Ananya Reddy',  city: 'Guntur',     emoji: '👩‍💼', bg: 'var(--lilac-light)', items: '2 items',  amount: '₹1,498', date: '11 Mar 2026', status: 'Delivered',  pill: 'pill-green' },
  { id: '#LL-2838', customer: 'Arjun Nair',    city: 'Chennai',    emoji: '🧑', bg: 'var(--sun-light)',  items: '4 items',  amount: '₹3,845', date: '11 Mar 2026', status: 'Pending',    pill: 'pill-yellow' },
  { id: '#LL-2837', customer: 'Sneha Iyer',    city: 'Bengaluru',  emoji: '👩', bg: 'var(--peach-light)',items: '2 items',  amount: '₹1,248', date: '10 Mar 2026', status: 'Cancelled',  pill: 'pill-red' },
]

const TOP_PRODUCTS = [
  { emoji: '🚲', bg: '#FFF3D4', name: 'Balance Bicycle',   cat: 'Vehicles',     price: '₹1,399', sold: '84 sold', bar: 84 },
  { emoji: '🦕', bg: '#E1F7F2', name: 'Dino Pull-Along',   cat: 'Soft Toys',    price: '₹899',   sold: '71 sold', bar: 71 },
  { emoji: '🎨', bg: '#EAE0FF', name: 'Color Wonder Kit',  cat: 'Arts & Crafts',price: '₹449',   sold: '65 sold', bar: 65 },
  { emoji: '🎪', bg: '#FFE4E1', name: 'Sudoku Puzzle Set', cat: 'Games',        price: '₹549',   sold: '58 sold', bar: 58 },
  { emoji: '🐻', bg: '#E8FFEE', name: 'Teddy Bear XL',     cat: 'Soft Toys',    price: '₹799',   sold: '52 sold', bar: 52 },
]

const CHART_BARS = [
  { revenue: 55, orders: 42, label: 'Oct' },
  { revenue: 68, orders: 55, label: 'Nov' },
  { revenue: 92, orders: 77, label: 'Dec' },
  { revenue: 60, orders: 50, label: 'Jan' },
  { revenue: 76, orders: 62, label: 'Feb' },
  { revenue: 88, orders: 70, label: 'Mar' },
]

const QUICK_ACTIONS = [
  { emoji: '➕', label: 'Add Product' },
  { emoji: '🏷️', label: 'New Coupon' },
  { emoji: '✏️', label: 'Write Blog' },
  { emoji: '📣', label: 'Send Email' },
  { emoji: '📦', label: 'Stock Update' },
  { emoji: '📊', label: 'Export CSV' },
]

const ACTIVITIES = [
  { ico: '📦', bg: 'var(--mint-light)',  text: <><strong>#LL-2841</strong> marked as Delivered</>,           time: '2 min ago' },
  { ico: '⭐', bg: 'var(--sun-light)',   text: <>New 5★ review on <strong>Dino Pull-Along</strong></>,      time: '18 min ago' },
  { ico: '🏷️', bg: 'var(--sun-light)',  text: <>Coupon <strong>HOLI20</strong> activated</>,                time: '1 hr ago' },
  { ico: '👤', bg: 'var(--lilac-light)', text: <><strong>Arjun Nair</strong> registered</>,                 time: '2 hr ago' },
  { ico: '📝', bg: 'var(--sky-light)',   text: <>Blog <strong>"10 Best Toys"</strong> published</>,         time: '5 hr ago' },
]

const DONUT_ITEMS = [
  { color: 'var(--mint)',  label: 'Delivered',   val: '42% · 356' },
  { color: 'var(--sun)',   label: 'Processing',  val: '23% · 194' },
  { color: 'var(--coral)', label: 'Pending',     val: '18% · 152' },
  { color: 'var(--lilac)', label: 'Cancelled',   val: '17% · 145' },
]

export default function DashboardPage() {
  const [chartPeriod, setChartPeriod] = useState('6M')

  return (
    <div>
      {/* KPI cards */}
      <div className="stats-row">
        {[
          { cls: 'sc-a', icon: '💰', trend: '▲ 18.4%', up: true, val: '₹2.34L', label: 'Revenue This Month' },
          { cls: 'sc-b', icon: '📦', trend: '▲ 12%',   up: true, val: '847',    label: 'Orders This Month' },
          { cls: 'sc-c', icon: '👤', trend: '▲ 9%',    up: true, val: '3,412',  label: 'Total Customers' },
          { cls: 'sc-d', icon: '🔄', trend: '▼ 2.1%',  up: false,val: '1.8%',  label: 'Return Rate' },
        ].map((s) => (
          <div key={s.label} className={`stat-card ${s.cls}`}>
            <div className="stat-row">
              <div className="stat-icon-wrap">{s.icon}</div>
              <span className={`stat-trend ${s.up ? 'up' : 'down'}`}>{s.trend}</span>
            </div>
            <div className="stat-val">{s.val}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Chart + Donut */}
      <div className="dash-grid">
        <div className="card">
          <div className="card-head">
            <div className="card-title">Revenue vs Orders</div>
            <div className="chart-period">
              {['7D','6M','1Y'].map(p => (
                <button key={p} className={`cp-btn${chartPeriod === p ? ' active' : ''}`} onClick={() => setChartPeriod(p)}>{p}</button>
              ))}
            </div>
          </div>
          <div className="chart-area">
            <div className="chart-bars">
              {CHART_BARS.map((b) => (
                <div key={b.label} className="bar-g">
                  <div className="bar bar-coral" style={{ height: `${b.revenue}%` }} />
                  <div className="bar bar-mint"  style={{ height: `${b.orders}%`  }} />
                </div>
              ))}
            </div>
            <div className="chart-xaxis">{CHART_BARS.map(b => <span key={b.label}>{b.label}</span>)}</div>
            <div className="chart-legend">
              <div className="cl-item"><div className="cl-dot" style={{ background:'var(--coral)', width:10,height:10,borderRadius:3 }} />Revenue</div>
              <div className="cl-item"><div className="cl-dot" style={{ background:'var(--mint)',  width:10,height:10,borderRadius:3 }} />Orders</div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-head"><div className="card-title">Order Status</div><button className="btn btn-ghost btn-sm">This Month</button></div>
          <div className="donut-outer">
            <div className="donut-ring">
              <div className="donut-inner"><div className="donut-n">847</div><div className="donut-lbl">Orders</div></div>
            </div>
            <div className="donut-list">
              {DONUT_ITEMS.map(d => (
                <div key={d.label} className="dl-row">
                  <div className="dl-dot" style={{ background: d.color }} />
                  <div className="dl-name">{d.label}</div>
                  <div className="dl-val">{d.val}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Recent orders mini-table */}
      <div className="card" style={{ marginBottom: 18 }}>
        <div className="card-head">
          <div className="card-title">Recent Orders</div>
          <FilterTabs tabs={['All','Pending','Processing','Delivered']} />
          <button className="btn btn-outline btn-sm">View All →</button>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Order ID</th><th>Customer</th><th>Items</th><th>Amount</th><th>Date</th><th>Status</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {RECENT_ORDERS.map(o => (
                <tr key={o.id}>
                  <td className="td-id">{o.id}</td>
                  <td>
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <div className="rc-av" style={{ background: o.bg }}>{o.emoji}</div>
                      <div>
                        <div style={{ fontWeight:800, fontSize:'.82rem' }}>{o.customer}</div>
                        <div className="td-muted">{o.city}</div>
                      </div>
                    </div>
                  </td>
                  <td>{o.items}</td>
                  <td style={{ fontWeight:900 }}>{o.amount}</td>
                  <td className="td-muted">{o.date}</td>
                  <td><span className={`pill ${o.pill}`}>{o.status}</span></td>
                  <td>
                    <div style={{ display:'flex', gap:5 }}>
                      <button className="btn btn-ghost btn-xs btn-icon">👁</button>
                      <button className="btn btn-ghost btn-xs btn-icon">✏️</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bottom grid */}
      <div className="bottom-grid">
        {/* Top products */}
        <div className="card">
          <div className="card-head"><div className="card-title">Top Products</div><button className="btn btn-ghost btn-sm">This Week</button></div>
          <div className="card-body" style={{ paddingTop:10 }}>
            {TOP_PRODUCTS.map(p => (
              <div key={p.name} className="top-prod-row">
                <div className="tpr-icon" style={{ background: p.bg }}>{p.emoji}</div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div className="tpr-name">{p.name}</div>
                  <div className="tpr-cat">{p.cat}</div>
                </div>
                <div className="tpr-right">
                  <div className="tpr-price">{p.price}</div>
                  <div className="tpr-sold">{p.sold}</div>
                  <div className="tpr-bar-wrap"><div className="tpr-bar" style={{ width:`${p.bar}%` }} /></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick actions */}
        <div className="card">
          <div className="card-head"><div className="card-title">Quick Actions</div></div>
          <div className="qa-grid">
            {QUICK_ACTIONS.map(a => (
              <button key={a.label} className="qa-item">
                <span className="qa-emoji">{a.emoji}</span>{a.label}
              </button>
            ))}
          </div>
        </div>

        {/* Recent activity */}
        <div className="card">
          <div className="card-head"><div className="card-title">Recent Activity</div></div>
          <div className="card-body" style={{ paddingTop:10 }}>
            {ACTIVITIES.map((a, i) => (
              <div key={i} className="act-row">
                <div className="act-ico" style={{ background: a.bg }}>{a.ico}</div>
                <div>
                  <div className="act-text">{a.text}</div>
                  <div className="act-time">{a.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
