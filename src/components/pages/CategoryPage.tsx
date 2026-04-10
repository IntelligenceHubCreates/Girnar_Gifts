'use client';

import { useState, useMemo, useEffect } from 'react';
import styles from './CategoryPage.module.css';
import { _get, _post } from '@/shared/fetchwrapper';

// ─── Types ──────────────────────────────────────────────────────────────────

interface Product {
  id: number;
  emoji: string;
  name: string;
  category: string;
  subcategory: string;
  stars: number;
  reviews: number;
  price: number;
  originalPrice?: number;
  badges: { label: string; type: 'sale' | 'new' | 'hot' }[];
  bgGradient: string;
  ageRange: string;
  brand: string;
  inStock: boolean;
}

// ─── Category Products Data ──────────────────────────────────────────────────

const ALL_PRODUCTS: Product[] = [
  { id: 1, emoji: '🚲', name: 'Balance Bicycle Pro', category: 'Vehicles', subcategory: 'Bikes & Cycles', stars: 5, reviews: 128, price: 1399, originalPrice: 1999, badges: [{ label: '-30%', type: 'sale' }], bgGradient: 'linear-gradient(135deg,#FFF3D4,#FFE099)', ageRange: '2-5 yrs', brand: 'PlayZone', inStock: true },
  { id: 2, emoji: '🦕', name: 'Dino Pull-Along', category: 'Soft Toys', subcategory: 'Pull Toys', stars: 5, reviews: 94, price: 899, originalPrice: 1200, badges: [{ label: 'Hot', type: 'hot' }], bgGradient: 'linear-gradient(135deg,#E1F7F2,#AAEEDD)', ageRange: '1-3 yrs', brand: 'TinkerTots', inStock: true },
  { id: 3, emoji: '🧸', name: 'Fluffy Teddy Bear XL', category: 'Soft Toys', subcategory: 'Stuffed Animals', stars: 5, reviews: 211, price: 799, originalPrice: 1099, badges: [{ label: 'New', type: 'new' }], bgGradient: 'linear-gradient(135deg,#E8FFEE,#AAEECC)', ageRange: '0+ yrs', brand: 'HugBuddy', inStock: true },
  { id: 4, emoji: '🛹', name: 'Mini Skateboards', category: 'Outdoor', subcategory: 'Sports & Active', stars: 5, reviews: 67, price: 1199, originalPrice: 1499, badges: [{ label: 'Hot', type: 'hot' }], bgGradient: 'linear-gradient(135deg,#FFEEF8,#F5B6D6)', ageRange: '5-10 yrs', brand: 'SpeedKid', inStock: true },
  { id: 5, emoji: '🎮', name: 'Sudoku Puzzle Set', category: 'Games', subcategory: 'Puzzle Games', stars: 4, reviews: 55, price: 549, originalPrice: 749, badges: [{ label: 'New', type: 'new' }], bgGradient: 'linear-gradient(135deg,#FFE4E1,#FFBDB6)', ageRange: '6+ yrs', brand: 'BrainBox', inStock: true },
  { id: 6, emoji: '🧩', name: 'Jumbo Jigsaw 100pc', category: 'Games', subcategory: 'Jigsaw Puzzles', stars: 5, reviews: 143, price: 349, originalPrice: 499, badges: [], bgGradient: 'linear-gradient(135deg,#E0F3FF,#AACFF5)', ageRange: '4-8 yrs', brand: 'BrainBox', inStock: true },
  { id: 7, emoji: '🪆', name: 'Spring Nesting Doll', category: 'Soft Toys', subcategory: 'Traditional Toys', stars: 4, reviews: 38, price: 699, originalPrice: 899, badges: [{ label: '-20%', type: 'sale' }], bgGradient: 'linear-gradient(135deg,#FFF0E0,#FFCC99)', ageRange: '3+ yrs', brand: 'TinkerTots', inStock: false },
  { id: 8, emoji: '🎨', name: 'Color Wonder Kit', category: 'Arts & Crafts', subcategory: 'Painting', stars: 4, reviews: 89, price: 449, originalPrice: 599, badges: [{ label: '-25%', type: 'sale' }, { label: 'New', type: 'new' }], bgGradient: 'linear-gradient(135deg,#EAE0FF,#C7A4F5)', ageRange: '3-8 yrs', brand: 'ArtKidz', inStock: true },
  { id: 9, emoji: '🚀', name: 'Space Explorer Set', category: 'Outdoor', subcategory: 'STEM Toys', stars: 5, reviews: 76, price: 1599, originalPrice: 2199, badges: [{ label: '-27%', type: 'sale' }], bgGradient: 'linear-gradient(135deg,#E8E0FF,#BBAAF5)', ageRange: '6-12 yrs', brand: 'SpeedKid', inStock: true },
  { id: 10, emoji: '🎪', name: 'Circus Tent Playset', category: 'Games', subcategory: 'Playsets', stars: 4, reviews: 44, price: 2199, originalPrice: 2799, badges: [], bgGradient: 'linear-gradient(135deg,#FFF8D4,#FFE8A0)', ageRange: '3-7 yrs', brand: 'PlayZone', inStock: true },
  { id: 11, emoji: '🏄', name: 'Foam Surfboard', category: 'Outdoor', subcategory: 'Sports & Active', stars: 3, reviews: 22, price: 899, originalPrice: 1199, badges: [], bgGradient: 'linear-gradient(135deg,#D4F8FF,#AAEEFD)', ageRange: '5+ yrs', brand: 'SpeedKid', inStock: true },
  { id: 12, emoji: '🪁', name: 'Classic Wooden Kite', category: 'Outdoor', subcategory: 'Sports & Active', stars: 4, reviews: 61, price: 399, originalPrice: 549, badges: [{ label: 'New', type: 'new' }], bgGradient: 'linear-gradient(135deg,#FFEED4,#FFCC88)', ageRange: '4+ yrs', brand: 'HugBuddy', inStock: true },
  { id: 13, emoji: '🐉', name: 'Dragon Finger Puppet', category: 'Soft Toys', subcategory: 'Puppets', stars: 5, reviews: 103, price: 299, originalPrice: 399, badges: [{ label: 'Hot', type: 'hot' }], bgGradient: 'linear-gradient(135deg,#FFE4D4,#FFBBA8)', ageRange: '2+ yrs', brand: 'HugBuddy', inStock: true },
  { id: 14, emoji: '🏰', name: 'Castle Block Set', category: 'Games', subcategory: 'Building Blocks', stars: 5, reviews: 188, price: 1299, originalPrice: 1699, badges: [{ label: '-23%', type: 'sale' }], bgGradient: 'linear-gradient(135deg,#E4FFE0,#AAEEA8)', ageRange: '3-8 yrs', brand: 'BrainBox', inStock: true },
  { id: 15, emoji: '🎻', name: 'Mini Violin Toy', category: 'Games', subcategory: 'Music Toys', stars: 4, reviews: 57, price: 749, originalPrice: 999, badges: [], bgGradient: 'linear-gradient(135deg,#FFE4F8,#F5AADD)', ageRange: '4+ yrs', brand: 'TinkerTots', inStock: false },
  { id: 16, emoji: '🚌', name: 'School Bus Rider', category: 'Vehicles', subcategory: 'Ride-ons', stars: 4, reviews: 79, price: 1899, originalPrice: 2399, badges: [{ label: '-20%', type: 'sale' }], bgGradient: 'linear-gradient(135deg,#FFFCD4,#FFE866)', ageRange: '1-4 yrs', brand: 'PlayZone', inStock: true },
];

const SUBCATEGORIES = ['All', 'Bikes & Cycles', 'Stuffed Animals', 'Pull Toys', 'Sports & Active', 'Puzzle Games', 'Building Blocks', 'Music Toys', 'Painting', 'STEM Toys', 'Ride-ons'];
const BRANDS = ['PlayZone', 'TinkerTots', 'HugBuddy', 'SpeedKid', 'BrainBox', 'ArtKidz'];
const AGE_RANGES = ['0-2 yrs', '2-5 yrs', '5-8 yrs', '8-12 yrs', '12+ yrs'];
const SORT_OPTIONS = ['Featured', 'Price: Low to High', 'Price: High to Low', 'Newest First', 'Top Rated', 'Most Reviewed'];

// ─── Component ────────────────────────────────────────────────────────────────

export default function CategoryPage() {
  const [activeSubcat, setActiveSubcat] = useState('All');
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [selectedAges, setSelectedAges] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 3000]);
  const [sortBy, setSortBy] = useState('Featured');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [onlyInStock, setOnlyInStock] = useState(false);
  const [onlyOnSale, setOnlyOnSale] = useState(false);
  const [page, setPage] = useState(1);
  const [wishlist, setWishlist] = useState<number[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleBrand = (b: string) =>
    setSelectedBrands((prev) => prev.includes(b) ? prev.filter((x) => x !== b) : [...prev, b]);

  const toggleAge = (a: string) =>
    setSelectedAges((prev) => prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]);

  const toggleWishlist = (id: number) =>
    setWishlist((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);

  const filtered = useMemo(() => {
    let items = [...ALL_PRODUCTS];
    if (activeSubcat !== 'All') items = items.filter((p) => p.subcategory === activeSubcat);
    if (selectedBrands.length) items = items.filter((p) => selectedBrands.includes(p.brand));
    if (onlyInStock) items = items.filter((p) => p.inStock);
    if (onlyOnSale) items = items.filter((p) => p.badges.some((b) => b.type === 'sale'));
    items = items.filter((p) => p.price >= priceRange[0] && p.price <= priceRange[1]);

    switch (sortBy) {
      case 'Price: Low to High': items.sort((a, b) => a.price - b.price); break;
      case 'Price: High to Low': items.sort((a, b) => b.price - a.price); break;
      case 'Top Rated': items.sort((a, b) => b.stars - a.stars); break;
      case 'Most Reviewed': items.sort((a, b) => b.reviews - a.reviews); break;
      case 'Newest First': items.sort((a, b) => b.id - a.id); break;
    }
    return items;
  }, [activeSubcat, selectedBrands, onlyInStock, onlyOnSale, priceRange, sortBy]);

  const perPage = 12;
  const totalPages = Math.ceil(filtered.length / perPage);
  const paged = filtered.slice((page - 1) * perPage, page * perPage);

  const clearAll = () => {
    setActiveSubcat('All');
    setSelectedBrands([]);
    setSelectedAges([]);
    setPriceRange([0, 3000]);
    setOnlyInStock(false);
    setOnlyOnSale(false);
    setPage(1);
  };

  const activeFiltersCount = [
    activeSubcat !== 'All' ? 1 : 0,
    selectedBrands.length,
    selectedAges.length,
    onlyInStock ? 1 : 0,
    onlyOnSale ? 1 : 0,
    (priceRange[0] > 0 || priceRange[1] < 3000) ? 1 : 0,
  ].reduce((a, b) => a + b, 0);

  return (
    <div className={styles.page}>

      {/* ── Category Hero ─────────────────────────────────────── */}
      <div className={styles.hero}>
        <div className={styles.heroBg}>
          <span className={styles.heroBgEmoji}>🧸</span>
          <span className={styles.heroBgEmoji}>🚗</span>
          <span className={styles.heroBgEmoji}>🎮</span>
          <span className={styles.heroBgEmoji}>🧩</span>
          <span className={styles.heroBgEmoji}>🎨</span>
          <span className={styles.heroBgEmoji}>🚀</span>
        </div>
        <div className={styles.heroContent}>
          <nav className={styles.breadcrumb} aria-label="Breadcrumb">
            <a href="/">Home</a>
            <span>›</span>
            <span className={styles.breadcrumbCurrent}>Toys</span>
          </nav>
          <h1 className={styles.heroTitle}>
            <span className={styles.heroEmoji}>🧸</span>
            All Toys
          </h1>
          <p className={styles.heroSub}>
            {filtered.length} products · Safe, certified & joy-approved for every age
          </p>
          <div className={styles.heroTags}>
            {['BIS Certified', 'Age-Safe Materials', 'Award Winning', 'Free Shipping ₹499+'].map((t) => (
              <span key={t} className={styles.heroTag}>{t}</span>
            ))}
          </div>
        </div>
      </div>

      {/* ── Sub-category Chips ────────────────────────────────── */}
      <div className={styles.subcatStrip}>
        <div className={styles.subcatScroll}>
          {SUBCATEGORIES.map((s) => (
            <button
              key={s}
              className={`${styles.subcatChip} ${activeSubcat === s ? styles.subcatActive : ''}`}
              onClick={() => { setActiveSubcat(s); setPage(1); }}
              type="button"
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* ── Main Layout ──────────────────────────────────────── */}
      <div className={styles.layout}>

        {/* Sidebar Toggle (mobile) */}
        <button
          className={styles.filterToggle}
          onClick={() => setSidebarOpen(!sidebarOpen)}
          type="button"
        >
          🎛️ Filters {activeFiltersCount > 0 && <span className={styles.filterBadge}>{activeFiltersCount}</span>}
        </button>

        {/* ── Sidebar ───────────────────────────────────────── */}
        <aside className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : ''}`}>
          <div className={styles.sidebarHead}>
            <span className={styles.sidebarTitle}>Filters</span>
            {activeFiltersCount > 0 && (
              <button className={styles.clearBtn} onClick={clearAll} type="button">Clear all</button>
            )}
          </div>

          {/* Price Range */}
          <div className={styles.filterGroup}>
            <div className={styles.filterLabel}>Price Range</div>
            <div className={styles.priceDisplay}>
              <span>₹{priceRange[0].toLocaleString('en-IN')}</span>
              <span>₹{priceRange[1].toLocaleString('en-IN')}</span>
            </div>
            <input
              type="range" min={0} max={3000} step={50}
              value={priceRange[1]}
              onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
              className={styles.rangeSlider}
            />
            <div className={styles.pricePresets}>
              {[[0, 500], [500, 1000], [1000, 2000], [2000, 3000]].map(([min, max]) => (
                <button
                  key={`${min}-${max}`}
                  className={`${styles.pricePreset} ${priceRange[0] === min && priceRange[1] === max ? styles.pricePresetActive : ''}`}
                  onClick={() => setPriceRange([min, max])}
                  type="button"
                >
                  ₹{min === 0 ? 'Under' : min}–{max === 3000 ? '3k+' : `₹${max}`}
                </button>
              ))}
            </div>
          </div>

          {/* Availability */}
          <div className={styles.filterGroup}>
            <div className={styles.filterLabel}>Availability</div>
            <label className={styles.checkRow}>
              <input type="checkbox" checked={onlyInStock} onChange={(e) => setOnlyInStock(e.target.checked)} className={styles.check} />
              <span>In Stock Only</span>
            </label>
            <label className={styles.checkRow}>
              <input type="checkbox" checked={onlyOnSale} onChange={(e) => setOnlyOnSale(e.target.checked)} className={styles.check} />
              <span>On Sale</span>
              <span className={styles.salePip}>🔥</span>
            </label>
          </div>

          {/* Brand */}
          <div className={styles.filterGroup}>
            <div className={styles.filterLabel}>Brand</div>
            {BRANDS.map((b) => (
              <label key={b} className={styles.checkRow}>
                <input
                  type="checkbox"
                  checked={selectedBrands.includes(b)}
                  onChange={() => toggleBrand(b)}
                  className={styles.check}
                />
                <span>{b}</span>
              </label>
            ))}
          </div>

          {/* Age Range */}
          <div className={styles.filterGroup}>
            <div className={styles.filterLabel}>Age Range</div>
            <div className={styles.ageGrid}>
              {AGE_RANGES.map((a) => (
                <button
                  key={a}
                  className={`${styles.ageChip} ${selectedAges.includes(a) ? styles.ageActive : ''}`}
                  onClick={() => toggleAge(a)}
                  type="button"
                >
                  {a}
                </button>
              ))}
            </div>
          </div>

          {/* Rating */}
          <div className={styles.filterGroup}>
            <div className={styles.filterLabel}>Customer Rating</div>
            {[4, 3, 2].map((r) => (
              <label key={r} className={styles.checkRow}>
                <input type="checkbox" className={styles.check} />
                <span className={styles.starFilter}>{'★'.repeat(r)}{'☆'.repeat(5 - r)}</span>
                <span className={styles.ratingLabel}>&amp; up</span>
              </label>
            ))}
          </div>
        </aside>

        {/* Overlay (mobile) */}
        {sidebarOpen && (
          <div className={styles.overlay} onClick={() => setSidebarOpen(false)} />
        )}

        {/* ── Product Area ──────────────────────────────────── */}
        <div className={styles.productArea}>

          {/* Toolbar */}
          <div className={styles.toolbar}>
            <span className={styles.resultCount}>
              Showing <strong>{(page - 1) * perPage + 1}–{Math.min(page * perPage, filtered.length)}</strong> of <strong>{filtered.length}</strong> products
            </span>
            <div className={styles.toolbarRight}>
              <div className={styles.sortWrap}>
                <label className={styles.sortLabel}>Sort by:</label>
                <select
                  className={styles.sortSelect}
                  value={sortBy}
                  onChange={(e) => { setSortBy(e.target.value); setPage(1); }}
                >
                  {SORT_OPTIONS.map((o) => <option key={o}>{o}</option>)}
                </select>
              </div>
              <div className={styles.viewToggle}>
                <button
                  className={`${styles.viewBtn} ${viewMode === 'grid' ? styles.viewActive : ''}`}
                  onClick={() => setViewMode('grid')}
                  type="button"
                  aria-label="Grid view"
                >⊞</button>
                <button
                  className={`${styles.viewBtn} ${viewMode === 'list' ? styles.viewActive : ''}`}
                  onClick={() => setViewMode('list')}
                  type="button"
                  aria-label="List view"
                >☰</button>
              </div>
            </div>
          </div>

          {/* Active Filter Tags */}
          {activeFiltersCount > 0 && (
            <div className={styles.activeTags}>
              {activeSubcat !== 'All' && (
                <span className={styles.activeTag}>
                  {activeSubcat}
                  <button onClick={() => setActiveSubcat('All')} type="button">×</button>
                </span>
              )}
              {selectedBrands.map((b) => (
                <span key={b} className={styles.activeTag}>
                  {b}
                  <button onClick={() => toggleBrand(b)} type="button">×</button>
                </span>
              ))}
              {onlyInStock && (
                <span className={styles.activeTag}>
                  In Stock
                  <button onClick={() => setOnlyInStock(false)} type="button">×</button>
                </span>
              )}
              {onlyOnSale && (
                <span className={styles.activeTag}>
                  On Sale
                  <button onClick={() => setOnlyOnSale(false)} type="button">×</button>
                </span>
              )}
              <button className={styles.clearTagsBtn} onClick={clearAll} type="button">Clear all</button>
            </div>
          )}

          {/* Grid / List */}
          {paged.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyEmoji}>🔍</div>
              <h3>No products found</h3>
              <p>Try adjusting your filters or browse all toys.</p>
              <button className={styles.emptyBtn} onClick={clearAll} type="button">Clear Filters</button>
            </div>
          ) : (
            <div className={viewMode === 'grid' ? styles.grid : styles.list}>
              {paged.map((product) => (
                viewMode === 'grid'
                  ? <GridCard key={product.id} product={product} wishlisted={wishlist.includes(product.id)} onWishlist={() => toggleWishlist(product.id)} />
                  : <ListCard key={product.id} product={product} wishlisted={wishlist.includes(product.id)} onWishlist={() => toggleWishlist(product.id)} />
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className={styles.pagination}>
              <button
                className={styles.pageBtn}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                type="button"
              >‹ Prev</button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  className={`${styles.pageNum} ${p === page ? styles.pageActive : ''}`}
                  onClick={() => setPage(p)}
                  type="button"
                >{p}</button>
              ))}
              <button
                className={styles.pageBtn}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                type="button"
              >Next ›</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Grid Card ───────────────────────────────────────────────────────────────

function GridCard({ product, wishlisted, onWishlist }: { product: Product; wishlisted: boolean; onWishlist: () => void }) {
  const BADGE_COLOR: Record<string, string> = { sale: '#FF6B5B', new: '#3ECFB2', hot: '#FFD336' };
  const BADGE_TEXT: Record<string, string> = { sale: '#fff', new: '#fff', hot: '#1A2540' };

  return (
    <div className={styles.card}>
      <div className={styles.cardImg} style={{ background: product.bgGradient }}>
        <span className={styles.cardEmoji}>{product.emoji}</span>

        {!product.inStock && <div className={styles.outOfStock}>Out of Stock</div>}

        {product.badges.length > 0 && (
          <div className={styles.badges}>
            {product.badges.map((b) => (
              <span key={b.label} className={styles.badge} style={{ background: BADGE_COLOR[b.type], color: BADGE_TEXT[b.type] }}>
                {b.label}
              </span>
            ))}
          </div>
        )}

        <button className={`${styles.wishBtn} ${wishlisted ? styles.wishlisted : ''}`} onClick={onWishlist} type="button">
          {wishlisted ? '❤️' : '🤍'}
        </button>

        <div className={styles.cardOverlay}>
          <button className={styles.quickView} type="button">Quick View</button>
        </div>
      </div>

      <div className={styles.cardBody}>
        <div className={styles.cardMeta}>
          <span className={styles.cardCat}>{product.subcategory}</span>
          <span className={styles.cardAge}>👶 {product.ageRange}</span>
        </div>
        <h3 className={styles.cardName}>{product.name}</h3>
        <div className={styles.cardBrand}>{product.brand}</div>
        <div className={styles.cardStars}>
          {'★'.repeat(product.stars)}{'☆'.repeat(5 - product.stars)}
          <span className={styles.cardReviews}>({product.reviews})</span>
        </div>
        <div className={styles.cardPrice}>
          <span className={styles.priceNow}>₹{product.price.toLocaleString('en-IN')}</span>
          {product.originalPrice && (
            <>
              <span className={styles.priceWas}>₹{product.originalPrice.toLocaleString('en-IN')}</span>
              <span className={styles.priceSave}>
                Save ₹{(product.originalPrice - product.price).toLocaleString('en-IN')}
              </span>
            </>
          )}
        </div>
        <button className={`${styles.addBtn} ${!product.inStock ? styles.addBtnDisabled : ''}`} type="button" disabled={!product.inStock}>
          {product.inStock ? '🛒 Add to Cart' : '📩 Notify Me'}
        </button>
      </div>
    </div>
  );
}

// ─── List Card ────────────────────────────────────────────────────────────────

function ListCard({ product, wishlisted, onWishlist }: { product: Product; wishlisted: boolean; onWishlist: () => void }) {
  const BADGE_COLOR: Record<string, string> = { sale: '#FF6B5B', new: '#3ECFB2', hot: '#FFD336' };
  const BADGE_TEXT: Record<string, string> = { sale: '#fff', new: '#fff', hot: '#1A2540' };

  return (
    <div className={styles.listCard}>
      <div className={styles.listImg} style={{ background: product.bgGradient }}>
        <span className={styles.listEmoji}>{product.emoji}</span>
        {product.badges.map((b) => (
          <span key={b.label} className={styles.listBadge} style={{ background: BADGE_COLOR[b.type], color: BADGE_TEXT[b.type] }}>
            {b.label}
          </span>
        ))}
      </div>
      <div className={styles.listBody}>
        <div className={styles.listTop}>
          <div>
            <span className={styles.cardCat}>{product.subcategory}</span>
            <h3 className={styles.listName}>{product.name}</h3>
            <div className={styles.cardBrand}>{product.brand} · 👶 {product.ageRange}</div>
          </div>
          <button className={`${styles.wishBtn} ${wishlisted ? styles.wishlisted : ''}`} onClick={onWishlist} type="button">
            {wishlisted ? '❤️' : '🤍'}
          </button>
        </div>
        <div className={styles.cardStars}>
          {'★'.repeat(product.stars)}{'☆'.repeat(5 - product.stars)}
          <span className={styles.cardReviews}>({product.reviews} reviews)</span>
        </div>
        <div className={styles.listFoot}>
          <div className={styles.cardPrice}>
            <span className={styles.priceNow}>₹{product.price.toLocaleString('en-IN')}</span>
            {product.originalPrice && (
              <span className={styles.priceWas}>₹{product.originalPrice.toLocaleString('en-IN')}</span>
            )}
          </div>
          <div className={styles.listActions}>
            <button className={styles.quickView} type="button">Quick View</button>
            <button className={`${styles.addBtn} ${!product.inStock ? styles.addBtnDisabled : ''}`} type="button" disabled={!product.inStock}>
              {product.inStock ? '🛒 Add to Cart' : '📩 Notify Me'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
