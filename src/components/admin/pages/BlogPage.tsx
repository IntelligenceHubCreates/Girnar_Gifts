'use client'

import { useState } from 'react'
import FilterTabs from '../ui/FilterTabs'
import Drawer from '../ui/Drawer'

const POSTS = [
  { bg:'linear-gradient(135deg,#FFF3D4,#FFDEA0)', emoji:'📚', status:'Published', statusCls:'pill-green', tagLabel:'Parenting Tips', tagStyle:{ background:'var(--coral-light)', color:'var(--coral)' }, date:'05 Mar 2026', title:'10 Best Educational Toys for Kids Under 5', excerpt:'Choosing the right toy can shape your child\'s early development. Here are our top picks for 2026, curated by child development experts.', views:'4,812 views', comments:'14 comments', likes:'87 likes', draft:false },
  { bg:'linear-gradient(135deg,#E1F7F2,#AAEEDD)', emoji:'✏️', status:'Published', statusCls:'pill-green', tagLabel:'Stationery Guide', tagStyle:{ background:'var(--mint-light)', color:'#1A9980' }, date:'28 Feb 2026', title:'Must-Have Stationery for the New School Year', excerpt:'From planners to pencil pouches — set your child up for success with our ultimate back-to-school checklist. Everything you need in one place.', views:'3,240 views', comments:'9 comments', likes:'52 likes', draft:false },
  { bg:'linear-gradient(135deg,#EAE0FF,#C7A4F5)', emoji:'🎨', status:'Published', statusCls:'pill-green', tagLabel:'Arts & Crafts', tagStyle:{ background:'var(--lilac-light)', color:'#7B4FCB' }, date:'20 Feb 2026', title:'Easy DIY Craft Projects to Do at Home', excerpt:'Rainy day activities your kids will love! These fun crafts use supplies available right in our store and are perfect for ages 4 to 12.', views:'4,312 views', comments:'15 comments', likes:'94 likes', draft:false },
  { bg:'linear-gradient(135deg,#F5F1EA,#EEE8DE)', emoji:'🧩', status:'Draft', statusCls:'pill-yellow', tagLabel:'Games & Puzzles', tagStyle:{ background:'var(--sky-light)', color:'#1A6EB5' }, date:'Last edited: 10 Mar 2026', title:'Best Board Games for Family Night in 2026', excerpt:'We tested 20+ board games with real families to find the ones that create the most laughs, learning, and lasting memories together…', views:'', comments:'', likes:'', draft:true },
  { bg:'linear-gradient(135deg,#F5F1EA,#EEE8DE)', emoji:'🚗', status:'Draft', statusCls:'pill-yellow', tagLabel:'Buying Guide', tagStyle:{ background:'var(--peach-light)', color:'#C05000' }, date:'Last edited: 08 Mar 2026', title:'How to Choose the Right Ride-On Toy for Your Toddler', excerpt:'Balance bikes, trikes, or push cars? We break down the pros and cons so you can pick the perfect first ride for your little one…', views:'', comments:'', likes:'', draft:true },
]

const TOP_POSTS = [
  { bg:'linear-gradient(135deg,#FFF3D4,#FFDEA0)', emoji:'📚', title:'10 Best Educational Toys…', cat:'Parenting Tips', views:'4,812 views', bar:90 },
  { bg:'linear-gradient(135deg,#EAE0FF,#C7A4F5)', emoji:'🎨', title:'Easy DIY Craft Projects…',  cat:'Arts & Crafts',  views:'4,312 views', bar:80 },
  { bg:'linear-gradient(135deg,#E1F7F2,#AAEEDD)', emoji:'✏️', title:'Must-Have Stationery…',     cat:'Stationery',     views:'3,240 views', bar:62 },
]

export default function BlogPage() {
  const [drawerOpen, setDrawerOpen] = useState(false)

  return (
    <div>
      <div className="page-header">
        <div className="ph-left">
          <div className="ph-title">Blog Manager</div>
          <div className="ph-sub">Manage posts, drafts and content strategy</div>
        </div>
        <div className="ph-actions">
          <button className="btn btn-outline">📥 Import</button>
          <button className="btn btn-primary" onClick={() => setDrawerOpen(true)}>✏️ New Post</button>
        </div>
      </div>

      {/* Stats */}
      <div className="blog-stats">
        {[
          { icon:'📝', bg:'var(--coral-light)', val:'3',    label:'Published Posts' },
          { icon:'📄', bg:'var(--sun-light)',   val:'2',    label:'Drafts' },
          { icon:'👁', bg:'var(--mint-light)',  val:'12.4K',label:'Total Views' },
          { icon:'💬', bg:'var(--sky-light)',   val:'38',   label:'Comments' },
        ].map(s => (
          <div key={s.label} className="blog-stat">
            <div className="bst-icon" style={{ background: s.bg }}>{s.icon}</div>
            <div><div className="bst-val">{s.val}</div><div className="bst-lbl">{s.label}</div></div>
          </div>
        ))}
      </div>

      <div className="blog-layout">
        {/* Post list */}
        <div>
          <div style={{ display:'flex', gap:8, marginBottom:16, alignItems:'center', flexWrap:'wrap' }}>
            <FilterTabs tabs={['All (5)','Published (3)','Drafts (2)','Scheduled (0)']} />
            <div className="tb-search" style={{ width:200, marginLeft:'auto' }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ color:'var(--muted)', flexShrink:0 }}>
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
              <input type="text" placeholder="Search posts…"/>
            </div>
          </div>

          <div className="blog-list">
            {POSTS.map(p => (
              <div key={p.title} className="blog-post-card" style={{ opacity: p.draft ? .78 : 1, borderStyle: p.draft ? 'dashed' : 'solid' }}>
                <div className="bpc-thumb" style={{ background: p.bg }}>
                  <div className="bpc-status"><span className={`pill ${p.statusCls}`}>{p.status}</span></div>
                  {p.emoji}
                </div>
                <div className="bpc-body">
                  <div className="bpc-tags">
                    <span className="bpc-tag" style={p.tagStyle}>{p.tagLabel}</span>
                    <span className="bpc-date">{p.date}</span>
                  </div>
                  <div className="bpc-title">{p.title}</div>
                  <div className="bpc-excerpt">{p.excerpt}</div>
                  <div className="bpc-footer">
                    {!p.draft ? (
                      <>
                        <div className="bpc-meta">👁 {p.views}</div>
                        <div className="bpc-meta">💬 {p.comments}</div>
                        <div className="bpc-meta">❤️ {p.likes}</div>
                      </>
                    ) : (
                      <div className="bpc-meta" style={{ color:'var(--sun)', fontWeight:800 }}>⚠️ Draft — not published</div>
                    )}
                    <div className="bpc-actions">
                      {p.draft && <button className="btn btn-primary btn-xs">▶ Publish</button>}
                      {!p.draft && <button className="btn btn-ghost btn-xs">👁 Preview</button>}
                      <button className="btn btn-outline btn-xs">✏️ Edit</button>
                      <button className="btn btn-danger btn-xs btn-icon">🗑</button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right panel */}
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          <div className="blog-editor-panel">
            <div className="bep-head"><div className="bep-title">✏️ Quick New Post</div></div>
            <div className="bep-body">
              <div className="form-group"><label className="form-label">Post Title</label><input className="form-input" placeholder="Enter post title…"/></div>
              <div className="form-group"><label className="form-label">Category</label>
                <select className="form-select"><option>Parenting Tips</option><option>Stationery Guide</option><option>Arts & Crafts</option><option>Buying Guide</option></select>
              </div>
              <div className="form-group"><label className="form-label">Excerpt</label><textarea className="form-textarea" placeholder="Short description…" style={{ minHeight:72 }}/></div>
              <div className="form-group"><label className="form-label">Thumbnail</label>
                <div className="bep-thumb-preview"><span>🖼️</span><em>Click to upload image</em></div>
              </div>
              <div className="form-group"><label className="form-label">Tags</label><input className="form-input" placeholder="e.g. toys, kids, learning"/></div>
            </div>
            <div className="bep-footer">
              <button className="btn btn-primary" style={{ width:'100%', justifyContent:'center' }}>✏️ Open Full Editor</button>
              <button className="btn btn-ghost" style={{ width:'100%', justifyContent:'center' }}>💾 Save as Draft</button>
            </div>
          </div>

          <div className="card">
            <div className="card-head"><div className="card-title">Top Performing Posts</div></div>
            <div className="card-body" style={{ paddingTop:10 }}>
              {TOP_POSTS.map(p => (
                <div key={p.title} className="top-prod-row">
                  <div className="tpr-icon" style={{ background: p.bg }}>{p.emoji}</div>
                  <div style={{ flex:1, minWidth:0 }}><div className="tpr-name">{p.title}</div><div className="tpr-cat">{p.cat}</div></div>
                  <div className="tpr-right">
                    <div className="tpr-price" style={{ fontSize:'.78rem' }}>{p.views}</div>
                    <div className="tpr-bar-wrap"><div className="tpr-bar" style={{ width:`${p.bar}%` }}/></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ background:'linear-gradient(135deg,var(--coral-light),#FFE0DC)', borderRadius:'var(--r)', border:'1.5px solid #FFCDC8', padding:'16px 18px' }}>
            <div style={{ fontSize:'.82rem', fontWeight:900, color:'var(--coral)', marginBottom:6 }}>💡 SEO Tip</div>
            <div style={{ fontSize:'.76rem', fontWeight:600, color:'var(--text-2)', lineHeight:1.5 }}>Your last 3 posts averaged <strong>4,121 views</strong>. Try adding internal links to product pages to increase store conversions from blog traffic.</div>
          </div>
        </div>
      </div>

      {/* New Post Drawer */}
      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title="✏️ Create New Blog Post" width={540}
        footer={<>
          <button className="btn btn-ghost" onClick={() => setDrawerOpen(false)}>Cancel</button>
          <button className="btn btn-ghost">💾 Save Draft</button>
          <button className="btn btn-primary">▶ Open Full Editor</button>
        </>}
      >
        <div className="form-grid form-grid-2">
          <div className="form-group span-2"><label className="form-label">Post Title</label><input className="form-input" placeholder="e.g. Top 5 Toys for Rainy Days"/></div>
          <div className="form-group"><label className="form-label">Category</label>
            <select className="form-select"><option>Parenting Tips</option><option>Stationery Guide</option><option>Arts & Crafts</option><option>Buying Guide</option></select>
          </div>
          <div className="form-group"><label className="form-label">Status</label>
            <select className="form-select"><option>Draft</option><option>Published</option><option>Scheduled</option></select>
          </div>
          <div className="form-group span-2"><label className="form-label">Excerpt / Description</label><textarea className="form-textarea" placeholder="Short summary shown in blog listings…"/></div>
          <div className="form-group span-2"><label className="form-label">Tags (comma-separated)</label><input className="form-input" placeholder="e.g. kids, educational, toys, learning"/></div>
          <div className="form-group"><label className="form-label">Publish Date</label><input className="form-input" type="date"/></div>
          <div className="form-group"><label className="form-label">Author</label><input className="form-input" defaultValue="Varsha · Intelligence Hub"/></div>
          <div className="form-group span-2"><label className="form-label">Featured Thumbnail Emoji</label><input className="form-input" placeholder="e.g. 🧸 or paste image URL"/></div>
        </div>
      </Drawer>
    </div>
  )
}
