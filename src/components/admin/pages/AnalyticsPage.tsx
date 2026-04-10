'use client'

import { useState } from 'react'

const KPI_DATA = [
  { icon:'💰', bg:'var(--coral-light)', trend:'▲ 18.4%', up:true,  val:'₹2.34L', label:'Total Revenue',     color:'var(--coral)', bars:[45,60,50,75,65,90,100] },
  { icon:'👁', bg:'var(--sky-light)',   trend:'▲ 22.1%', up:true,  val:'48.6K',  label:'Store Visits',       color:'var(--sky)',   bars:[55,70,62,85,78,95,100] },
  { icon:'🛒', bg:'var(--mint-light)',  trend:'▲ 4.3%',  up:true,  val:'3.42%',  label:'Conversion Rate',    color:'var(--mint)',  bars:[50,60,55,72,68,88,100] },
  { icon:'🧾', bg:'var(--sun-light)',   trend:'▲ 6.7%',  up:true,  val:'₹2,763', label:'Avg. Order Value',   color:'var(--sun)',   bars:[48,65,58,76,82,90,100] },
  { icon:'👤', bg:'var(--lilac-light)', trend:'▼ 1.8%',  up:false, val:'1m 42s', label:'Avg. Session Time',  color:'var(--lilac)', bars:[70,65,72,60,68,55,58] },
]

const TRAFFIC = [
  { icon:'🔍', bg:'#FEF3C7', name:'Google Search',   visits:'18,240 visits', pct:'37.5%', pctColor:'var(--coral)', barColor:'linear-gradient(90deg,var(--coral),var(--peach))', bar:82 },
  { icon:'📘', bg:'#EEF2FF', name:'Direct / Type-in', visits:'11,350 visits', pct:'23.4%', pctColor:'var(--sky)',   barColor:'linear-gradient(90deg,var(--sky),#8DD5FA)',         bar:63 },
  { icon:'📸', bg:'#FFF0EE', name:'Instagram',         visits:'8,920 visits',  pct:'18.4%', pctColor:'#C13584',     barColor:'linear-gradient(90deg,#F77737,#C13584)',             bar:50 },
  { icon:'🔗', bg:'#E6FAF6', name:'Referral Links',    visits:'5,480 visits',  pct:'11.3%', pctColor:'var(--mint)', barColor:'linear-gradient(90deg,var(--mint),#6AE8D4)',         bar:37 },
  { icon:'📧', bg:'#FFFBE6', name:'Email Campaigns',   visits:'2,740 visits',  pct:'5.6%',  pctColor:'#B8860B',     barColor:'linear-gradient(90deg,var(--sun),var(--peach))',     bar:22 },
  { icon:'🌐', bg:'var(--soft-2)', name:'Other',       visits:'1,870 visits',  pct:'3.8%',  pctColor:'var(--muted)',barColor:'var(--border-2)',                                    bar:14 },
]

const GEO = [
  { city:'Hyderabad',  bar:100, val:'8,420' },
  { city:'Bengaluru',  bar:78,  val:'6,540' },
  { city:'Vijayawada', bar:64,  val:'5,380' },
  { city:'Chennai',    bar:52,  val:'4,380' },
  { city:'Mumbai',     bar:44,  val:'3,690' },
  { city:'Pune',       bar:36,  val:'3,040' },
  { city:'Guntur',     bar:28,  val:'2,360' },
]

const FUNNEL = [
  { n:1, label:'Store Visits',      count:'48,600', drop:'baseline', bg:'var(--coral-light)', barBg:'var(--coral)', barW:'100%', dropColor:'var(--muted)' },
  { n:2, label:'Product Views',     count:'15,552', drop:'▼ 68%',   bg:'var(--sky-light)',   barBg:'var(--sky)',   barW:'68%',  dropColor:'var(--coral)' },
  { n:3, label:'Added to Cart',     count:'9,148',  drop:'▼ 41%',   bg:'var(--sun-light)',   barBg:'var(--sun)',   barW:'40%',  dropColor:'var(--coral)' },
  { n:4, label:'Checkout Started',  count:'4,380',  drop:'▼ 52%',   bg:'var(--lilac-light)', barBg:'var(--lilac)', barW:'19%',  dropColor:'var(--coral)' },
  { n:5, label:'Orders Placed ✅',  count:'1,664',  drop:'3.42% CVR',bg:'var(--mint-light)', barBg:'var(--mint)',  barW:'7%',   dropColor:'var(--mint)' },
]

const INSIGHTS = [
  { color:'var(--mint)',  text:<><strong>Mobile traffic is 61%</strong> of all visits — ensure your checkout is fully optimised for Android users, especially payment UX.</> },
  { color:'var(--sun)',   text:<><strong>Instagram drives 18.4%</strong> of visits with a high 4.1% CVR — doubling down on Reels content could yield significant revenue growth.</> },
  { color:'var(--coral)', text:<>Checkout drop-off is <strong>61% at payment step</strong> — consider adding UPI one-click checkout or COD prominently.</> },
  { color:'var(--lilac)', text:<><strong>Hyderabad &amp; Bengaluru</strong> account for 30% of revenue. A targeted city-level campaign could push this to 40%.</> },
  { color:'var(--sky)',   text:<>Avg. session time <strong>dropped 1.8%</strong> — review the homepage scroll depth; users may not be reaching Featured Products.</> },
]

const CHART_POINTS = [
  { x:0,   revenue:140, orders:155, visitors:148 },
  { x:75,  revenue:130, orders:148, visitors:138 },
  { x:150, revenue:118, orders:142, visitors:133 },
  { x:225, revenue:125, orders:148, visitors:140 },
  { x:300, revenue:100, orders:136, visitors:120 },
  { x:375, revenue:108, orders:140, visitors:126 },
  { x:450, revenue:88,  orders:128, visitors:110 },
  { x:525, revenue:78,  orders:122, visitors:102 },
  { x:600, revenue:90,  orders:132, visitors:115 },
  { x:675, revenue:65,  orders:112, visitors:92  },
  { x:750, revenue:55,  orders:105, visitors:82  },
  { x:825, revenue:42,  orders:98,  visitors:72  },
  { x:900, revenue:30,  orders:88,  visitors:60  },
]

function toPolyline(pts: { x:number; y:number }[]) {
  return pts.map(p => `${p.x},${p.y}`).join(' ')
}
function toAreaPath(pts: { x:number; y:number }[], h=180) {
  return `M${pts[0].x},${pts[0].y} ` + pts.slice(1).map(p=>`L${p.x},${p.y}`).join(' ') + ` L${pts[pts.length-1].x},${h} L${pts[0].x},${h} Z`
}

export default function AnalyticsPage() {
  const [period, setPeriod] = useState('30D')

  const revenuePoints = CHART_POINTS.map(p => ({ x:p.x, y:p.revenue }))
  const ordersPoints  = CHART_POINTS.map(p => ({ x:p.x, y:p.orders }))
  const visitorPoints = CHART_POINTS.map(p => ({ x:p.x, y:p.visitors }))

  return (
    <div>
      <div className="page-header">
        <div className="ph-left">
          <div className="ph-title">Analytics</div>
          <div className="ph-sub">Store performance, traffic & conversion insights</div>
        </div>
        <div className="ph-actions">
          <div className="period-toggle">
            {['7D','30D','90D','1Y'].map(p => (
              <button key={p} className={`pt-btn${period===p?' active':''}`} onClick={()=>setPeriod(p)}>{p}</button>
            ))}
          </div>
          <button className="btn btn-outline">📥 Export Report</button>
        </div>
      </div>

      {/* KPIs */}
      <div className="an-kpi-grid">
        {KPI_DATA.map(k => (
          <div key={k.label} className="an-kpi">
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <div className="an-kpi-icon" style={{ background: k.bg }}>{k.icon}</div>
              <span className={`an-kpi-trend ${k.up ? 'up' : 'down'}`}>{k.trend}</span>
            </div>
            <div className="an-kpi-val">{k.val}</div>
            <div className="an-kpi-label">{k.label}</div>
            <div className="an-kpi-sparkline">
              {k.bars.map((h,i) => <div key={i} className="spark-bar" style={{ height:`${h}%`, background: k.color }} />)}
            </div>
          </div>
        ))}
      </div>

      {/* Revenue line chart */}
      <div className="card" style={{ marginBottom:18 }}>
        <div className="card-head">
          <div className="card-title">Revenue & Orders Over Time</div>
          <div style={{ display:'flex', gap:14 }}>
            {[{c:'var(--coral)',label:'Revenue'},{c:'var(--mint)',label:'Orders'},{c:'var(--sky)',label:'Visitors',dash:true}].map(l=>(
              <div key={l.label} style={{ display:'flex', alignItems:'center', gap:6, fontSize:'.74rem', fontWeight:700, color:'var(--muted)' }}>
                <div style={{ width:12, height: l.dash ? 0 : 3, borderRadius:3, background: l.dash ? 'none' : l.c, borderTop: l.dash ? `2px dashed ${l.c}` : 'none' }} />
                {l.label}
              </div>
            ))}
          </div>
        </div>
        <div className="line-chart-wrap">
          <svg className="line-chart-svg" viewBox="0 0 900 180" preserveAspectRatio="none" style={{ height:180 }}>
            <line className="lc-grid-line" x1="0" y1="36" x2="900" y2="36"/>
            <line className="lc-grid-line" x1="0" y1="72" x2="900" y2="72"/>
            <line className="lc-grid-line" x1="0" y1="108" x2="900" y2="108"/>
            <line className="lc-grid-line" x1="0" y1="144" x2="900" y2="144"/>
            <path className="lc-area" d={toAreaPath(revenuePoints)} fill="var(--coral)" />
            <polyline className="lc-line" points={toPolyline(revenuePoints)} stroke="var(--coral)" />
            <path className="lc-area" d={toAreaPath(ordersPoints)} fill="var(--mint)" />
            <polyline className="lc-line" points={toPolyline(ordersPoints)} stroke="var(--mint)" />
            <polyline className="lc-line" points={toPolyline(visitorPoints)} stroke="var(--sky)" strokeDasharray="6,4" />
          </svg>
          <div className="lc-x-labels">
            {['01 Mar','05 Mar','08 Mar','10 Mar','11 Mar','12 Mar','Today'].map(l=>(
              <span key={l} className="lc-x-label">{l}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Traffic + Devices */}
      <div className="an-side-grid">
        <div className="card">
          <div className="card-head"><div className="card-title">Traffic Sources</div><button className="btn btn-ghost btn-sm">Details</button></div>
          <div className="card-body" style={{ paddingTop:10 }}>
            {TRAFFIC.map(t => (
              <div key={t.name} className="traffic-row">
                <div className="tr-source">
                  <div className="tr-icon" style={{ background: t.bg }}>{t.icon}</div>
                  <div><div className="tr-name">{t.name}</div><div className="tr-visits">{t.visits}</div></div>
                </div>
                <div className="tr-bar-wrap"><div className="tr-bar-fill" style={{ width:`${t.bar}%`, background: t.barColor }} /></div>
                <div className="tr-pct" style={{ color: t.pctColor }}>{t.pct}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-head"><div className="card-title">Device Breakdown</div><button className="btn btn-ghost btn-sm">Details</button></div>
          <div className="card-body" style={{ paddingTop:10 }}>
            <div style={{ display:'flex', alignItems:'center', gap:20, marginBottom:16, paddingBottom:14, borderBottom:'1.5px solid var(--border)' }}>
              <div style={{ position:'relative', width:90, height:90, flexShrink:0 }}>
                <svg viewBox="0 0 36 36" style={{ width:90, height:90, transform:'rotate(-90deg)' }}>
                  <circle cx="18" cy="18" r="15.9" fill="none" stroke="var(--border)" strokeWidth="3.2"/>
                  <circle cx="18" cy="18" r="15.9" fill="none" stroke="var(--coral)" strokeWidth="3.2" strokeDasharray="61 39" strokeLinecap="round"/>
                  <circle cx="18" cy="18" r="15.9" fill="none" stroke="var(--sky)" strokeWidth="3.2" strokeDasharray="28 72" strokeDashoffset="-61" strokeLinecap="round"/>
                  <circle cx="18" cy="18" r="15.9" fill="none" stroke="var(--mint)" strokeWidth="3.2" strokeDasharray="11 89" strokeDashoffset="-89" strokeLinecap="round"/>
                </svg>
                <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
                  <div style={{ fontSize:'.7rem', fontWeight:900 }}>48.6K</div>
                  <div style={{ fontSize:'.56rem', fontWeight:700, color:'var(--muted)' }}>visits</div>
                </div>
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:7, flex:1 }}>
                {[{ c:'var(--coral)', label:'Mobile', pct:'61%' },{ c:'var(--sky)', label:'Desktop', pct:'28%' },{ c:'var(--mint)', label:'Tablet', pct:'11%' }].map(d=>(
                  <div key={d.label} style={{ display:'flex', alignItems:'center', gap:7 }}>
                    <div style={{ width:10, height:10, borderRadius:3, background:d.c, flexShrink:0 }} />
                    <span style={{ fontSize:'.76rem', fontWeight:700, flex:1 }}>{d.label}</span>
                    <span style={{ fontSize:'.8rem', fontWeight:900 }}>{d.pct}</span>
                  </div>
                ))}
              </div>
            </div>
            {[
              { icon:'📱', name:'Android',    visits:'29,640 sessions', bar:78, color:'var(--coral)', pct:'47.2%' },
              { icon:'🍎', name:'iPhone/iOS', visits:'8,608 sessions',  bar:38, color:'var(--sky)',   pct:'13.7%' },
              { icon:'💻', name:'Windows PC', visits:'11,232 sessions', bar:48, color:'var(--mint)',  pct:'17.9%' },
              { icon:'🖥️', name:'Mac/Safari', visits:'5,480 sessions',  bar:28, color:'var(--lilac)', pct:'8.7%' },
            ].map(d => (
              <div key={d.name} className="device-row">
                <div className="device-icon">{d.icon}</div>
                <div><div className="device-name">{d.name}</div><div style={{ fontSize:'.66rem', fontWeight:600, color:'var(--muted)' }}>{d.visits}</div></div>
                <div className="device-bar-wrap"><div className="device-bar" style={{ width:`${d.bar}%`, background: d.color }} /></div>
                <div className="device-pct">{d.pct}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Funnel + Geo + Insights */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:18 }}>
        {/* Funnel */}
        <div className="card">
          <div className="card-head"><div className="card-title">Conversion Funnel</div><button className="btn btn-ghost btn-sm">This Month</button></div>
          <div className="card-body">
            {FUNNEL.map((f,i) => (
              <div key={f.n}>
                <div className="funnel-step" style={{ background: f.bg }}>
                  <div className="funnel-num">{f.n}</div>
                  <div style={{ flex:1 }}>
                    <div className="funnel-label">{f.label}</div>
                    <div style={{ height:4, background:'rgba(0,0,0,.1)', borderRadius:4, marginTop:6, overflow:'hidden' }}>
                      <div style={{ height:'100%', width:f.barW, background:f.barBg, borderRadius:4 }} />
                    </div>
                  </div>
                  <div style={{ textAlign:'right' }}>
                    <div className="funnel-count" style={{ color: f.n===5 ? 'var(--mint)' : '' }}>{f.count}</div>
                    <div className="funnel-drop" style={{ color: f.dropColor }}>{f.drop}</div>
                  </div>
                </div>
                {i < FUNNEL.length-1 && <div style={{ textAlign:'center', fontSize:'.66rem', fontWeight:700, color:'var(--muted)', margin:'-2px 0' }}>▼ drop-off</div>}
              </div>
            ))}
          </div>
        </div>

        {/* Geo */}
        <div className="card">
          <div className="card-head"><div className="card-title">Top Cities</div><button className="btn btn-ghost btn-sm">Expand Map</button></div>
          <div className="card-body">
            <div style={{ background:'linear-gradient(135deg,var(--soft),var(--soft-2))', borderRadius:'var(--r-sm)', height:96, display:'flex', alignItems:'center', justifyContent:'center', marginBottom:14, border:'1.5px dashed var(--border)', fontSize:'1.8rem', gap:8 }}>
              🗺️ <span style={{ fontSize:'.74rem', fontWeight:700, color:'var(--muted)' }}>India Heatmap</span>
            </div>
            {GEO.map(g => (
              <div key={g.city} className="geo-row">
                <div className="geo-flag">📍</div>
                <div className="geo-city">{g.city}</div>
                <div className="geo-bar-wrap"><div className="geo-bar" style={{ width:`${g.bar}%` }} /></div>
                <div className="geo-val">{g.val} <span style={{ fontSize:'.62rem', color:'var(--muted)' }}>visits</span></div>
              </div>
            ))}
          </div>
        </div>

        {/* Insights */}
        <div className="insight-card">
          <div className="insight-title">🤖 AI Insights — Mar 2026</div>
          {INSIGHTS.map((ins,i) => (
            <div key={i} className="insight-row">
              <div className="insight-dot" style={{ background: ins.color }} />
              <div className="insight-text">{ins.text}</div>
            </div>
          ))}
          <div style={{ marginTop:14, paddingTop:12, borderTop:'1px solid rgba(255,255,255,.1)' }}>
            <div style={{ fontSize:'.7rem', fontWeight:700, color:'rgba(255,255,255,.35)' }}>Generated from your last 30 days of store data</div>
          </div>
        </div>
      </div>
    </div>
  )
}
