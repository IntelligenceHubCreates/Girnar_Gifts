'use client'

import FilterTabs from '../ui/FilterTabs'

const ORDERS = [
  { id:'#LL-2841', customer:'Priya Sharma',  city:'Hyderabad',  emoji:'👩',  bg:'var(--coral-light)', items:3, amount:'₹2,197', payment:'UPI',  payPill:'pill-green', date:'12 Mar 2026', status:'Delivered',  pill:'pill-green' },
  { id:'#LL-2840', customer:'Rahul Mehta',   city:'Vijayawada', emoji:'👨',  bg:'var(--sky-light)',   items:1, amount:'₹549',   payment:'Card', payPill:'pill-blue',  date:'12 Mar 2026', status:'Processing', pill:'pill-blue' },
  { id:'#LL-2839', customer:'Ananya Reddy',  city:'Guntur',     emoji:'👩‍💼', bg:'var(--lilac-light)', items:2, amount:'₹1,498', payment:'UPI',  payPill:'pill-green', date:'11 Mar 2026', status:'Delivered',  pill:'pill-green' },
  { id:'#LL-2838', customer:'Arjun Nair',    city:'Chennai',    emoji:'🧑',  bg:'var(--sun-light)',   items:4, amount:'₹3,845', payment:'COD',  payPill:'pill-grey',  date:'11 Mar 2026', status:'Pending',    pill:'pill-yellow' },
  { id:'#LL-2837', customer:'Sneha Iyer',    city:'Bengaluru',  emoji:'👩',  bg:'var(--peach-light)', items:2, amount:'₹1,248', payment:'Card', payPill:'pill-blue',  date:'10 Mar 2026', status:'Cancelled',  pill:'pill-red' },
  { id:'#LL-2836', customer:'Vikram Singh',  city:'Pune',       emoji:'🧔',  bg:'var(--mint-light)',  items:5, amount:'₹4,299', payment:'UPI',  payPill:'pill-green', date:'10 Mar 2026', status:'Delivered',  pill:'pill-green' },
]

export default function OrdersPage() {
  return (
    <div>
      <div className="page-header">
        <div className="ph-left">
          <div className="ph-title">Orders</div>
          <div className="ph-sub">847 total orders · ₹2.34L this month</div>
        </div>
        <div className="ph-actions">
          <button className="btn btn-outline">📥 Export CSV</button>
          <button className="btn btn-primary">➕ Create Order</button>
        </div>
      </div>

      <div className="card">
        <div className="card-head">
          <FilterTabs tabs={['All (847)','Pending (152)','Processing (194)','Delivered (356)','Cancelled (145)']} />
          <div className="tb-search" style={{ width:190 }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ color:'var(--muted)', flexShrink:0 }}>
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input type="text" placeholder="Search orders…"/>
          </div>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Order ID</th><th>Customer</th><th>Items</th><th>Amount</th><th>Payment</th><th>Date</th><th>Status</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {ORDERS.map(o => (
                <tr key={o.id}>
                  <td className="td-id">{o.id}</td>
                  <td>
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <div className="rc-av" style={{ background: o.bg }}>{o.emoji}</div>
                      <div>
                        <div style={{ fontWeight:800 }}>{o.customer}</div>
                        <div className="td-muted">{o.city}</div>
                      </div>
                    </div>
                  </td>
                  <td>{o.items}</td>
                  <td style={{ fontWeight:900 }}>{o.amount}</td>
                  <td><span className={`pill ${o.payPill}`} style={{ fontSize:'.65rem' }}>{o.payment}</span></td>
                  <td className="td-muted">{o.date}</td>
                  <td><span className={`pill ${o.pill}`}>{o.status}</span></td>
                  <td>
                    <div style={{ display:'flex', gap:5 }}>
                      <button className="btn btn-ghost btn-xs btn-icon">👁</button>
                      <button className="btn btn-ghost btn-xs btn-icon">✏️</button>
                      <button className="btn btn-danger btn-xs btn-icon">🗑</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card-footer" style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <span style={{ fontSize:'.75rem', fontWeight:700, color:'var(--muted)' }}>Showing 6 of 847 orders</span>
          <div style={{ display:'flex', gap:4 }}>
            <button className="btn btn-ghost btn-sm">← Prev</button>
            <button className="btn btn-primary btn-sm">1</button>
            <button className="btn btn-ghost btn-sm">2</button>
            <button className="btn btn-ghost btn-sm">3</button>
            <button className="btn btn-ghost btn-sm">Next →</button>
          </div>
        </div>
      </div>
    </div>
  )
}
