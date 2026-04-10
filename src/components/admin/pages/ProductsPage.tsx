'use client'

const PRODUCTS = [
  { bg:'linear-gradient(135deg,#FFF3D4,#FFE099)', emoji:'🚲', badges:[{cls:'pc-badge-sale',label:'-30%'}],       name:'Balance Bicycle',   cat:'Vehicles',     price:'₹1,399', orig:'₹1,999', stock:'In Stock (42)', stockCls:'in-s' },
  { bg:'linear-gradient(135deg,#FFE4E1,#FFBDB6)', emoji:'🎪', badges:[{cls:'pc-badge-new',label:'New'}],         name:'Sudoku Puzzle Set', cat:'Games',        price:'₹549',   orig:'₹749',   stock:'In Stock (80)', stockCls:'in-s' },
  { bg:'linear-gradient(135deg,#E1F7F2,#AAEEDD)', emoji:'🦕', badges:[{cls:'pc-badge-hot',label:'Hot'}],         name:'Dino Pull-Along',   cat:'Soft Toys',    price:'₹899',   orig:'₹1,200', stock:'Low Stock (8)', stockCls:'low-s' },
  { bg:'linear-gradient(135deg,#EAE0FF,#C7A4F5)', emoji:'🎨', badges:[{cls:'pc-badge-sale',label:'-25%'},{cls:'pc-badge-new',label:'New'}], name:'Color Wonder Kit', cat:'Arts & Crafts', price:'₹449', orig:'₹599', stock:'In Stock (55)', stockCls:'in-s' },
  { bg:'linear-gradient(135deg,#E0F3FF,#AACFF5)', emoji:'🧩', badges:[],                                         name:'Jumbo Jigsaw 100pc', cat:'Games',       price:'₹349',   orig:'₹499',   stock:'Out of Stock',  stockCls:'out-s' },
  { bg:'linear-gradient(135deg,#FFF0E0,#FFCC99)', emoji:'🪆', badges:[{cls:'pc-badge-sale',label:'-20%'}],       name:'Spring Doll',       cat:'Soft Toys',    price:'₹699',   orig:'₹899',   stock:'In Stock (30)', stockCls:'in-s' },
  { bg:'linear-gradient(135deg,#FFEEF8,#F5B6D6)', emoji:'🛹', badges:[{cls:'pc-badge-hot',label:'Hot'}],         name:'Mini Skateboards',  cat:'Outdoor',      price:'₹1,199', orig:'₹1,499', stock:'Low Stock (5)', stockCls:'low-s' },
  { bg:'linear-gradient(135deg,#E8FFEE,#AAEECC)', emoji:'🐻', badges:[{cls:'pc-badge-new',label:'New'}],         name:'Teddy Bear XL',     cat:'Soft Toys',    price:'₹799',   orig:'₹1,099', stock:'In Stock (22)', stockCls:'in-s' },
]

export default function ProductsPage() {
  return (
    <div>
      <div className="page-header">
        <div className="ph-left">
          <div className="ph-title">Products</div>
          <div className="ph-sub">840 products across 6 categories</div>
        </div>
        <div className="ph-actions">
          <button className="btn btn-outline">📥 Import</button>
          <button className="btn btn-primary">➕ Add Product</button>
        </div>
      </div>

      <div className="prod-toolbar">
        <div className="tb-search" style={{ flex:1, maxWidth:260 }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ color:'var(--muted)', flexShrink:0 }}>
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input type="text" placeholder="Search products…"/>
        </div>
        <select className="form-select" style={{ width:150, padding:'7px 30px 7px 12px' }}>
          <option>All Categories</option>
          <option>Soft Toys</option><option>Stationery</option>
          <option>Arts & Crafts</option><option>Games</option><option>Vehicles</option>
        </select>
        <select className="form-select" style={{ width:130, padding:'7px 30px 7px 12px' }}>
          <option>All Status</option><option>In Stock</option><option>Low Stock</option><option>Out of Stock</option>
        </select>
        <button className="btn btn-ghost">⊞ Grid</button>
        <button className="btn btn-ghost">☰ List</button>
      </div>

      <div className="prod-grid">
        {PRODUCTS.map(p => (
          <div key={p.name} className="pc">
            <div className="pc-thumb" style={{ background: p.bg }}>
              {p.badges.length > 0 && (
                <div className="pc-badge-wrap">
                  {p.badges.map(b => <span key={b.label} className={`pc-badge ${b.cls}`}>{b.label}</span>)}
                </div>
              )}
              {p.emoji}
            </div>
            <div className="pc-body">
              <div className="pc-name">{p.name}</div>
              <div className="pc-cat">{p.cat}</div>
              <div className="pc-row">
                <div>
                  <span className="pc-price">{p.price}</span>
                  <span className="pc-orig">{p.orig}</span>
                </div>
                <span className={`pc-stock-tag ${p.stockCls}`}>{p.stock}</span>
              </div>
              <div className="pc-footer">
                <button className="btn btn-outline btn-sm">✏️ Edit</button>
                <button className="btn btn-primary btn-sm">👁 View</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
