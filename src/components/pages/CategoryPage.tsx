'use client';

import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import styles from './CategoryPage.module.css';
import { fetchProductsByCategory, fetchAllProducts } from '@/lib/api';
import { mapProducts } from '@/lib/mapProduct';
import type { SubcategoryDef, UiProduct } from '@/types/product';
import { useCart } from '@/context/CartContext';

// ─── Props ────────────────────────────────────────────────────────

export interface CategoryPageProps {
  title?: string;
  emoji?: string;
  description?: string;
  bgEmojis?: string[];
  subcategories?: { label: string; slug: string }[];
  tags:          string[];
  parentLabel?:  string;
  parentHref?:   string;
  categorySlug?: string;
  apiCategory?:  string;
  heroGradient?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────

const SORT_UI_TO_API: Record<string, string> = {
  'Featured':           'featured',
  'Price: Low to High': 'price_asc',
  'Price: High to Low': 'price_desc',
  'Newest First':       'newest',
  'Top Rated':          'rating',
};
const SORT_OPTIONS = Object.keys(SORT_UI_TO_API);
const AGE_RANGES   = ['0-2 yrs', '2-5 yrs', '5-8 yrs', '8-12 yrs', '12+ yrs'];
const PAGE_SIZE    = 20;

// ─── Component ────────────────────────────────────────────────────

export default function CategoryPage({
  tags,
  parentLabel,
  parentHref,
  categorySlug,
  apiCategory,
  heroGradient = 'linear-gradient(135deg, var(--navy) 0%, #26355a 60%, #1f2e50 100%)',
}: CategoryPageProps) {

  // ── Data state ─────────────────────────────────────────────────
  const [products,   setProducts]   = useState<UiProduct[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [error,      setError]      = useState<string | null>(null);

  // ── UI state ───────────────────────────────────────────────────
  const [sortBy,         setSortBy]         = useState('Featured');
  const [priceRange,     setPriceRange]     = useState<[number, number]>([0, 5000]);
  const [onlyInStock,    setOnlyInStock]    = useState(false);
  const [onlyOnSale,     setOnlyOnSale]     = useState(false);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [selectedAges,   setSelectedAges]   = useState<string[]>([]);
  const [viewMode,       setViewMode]       = useState<'grid' | 'list'>('grid');
  const [page,           setPage]           = useState(1);
  const [wishlist,       setWishlist]       = useState<string[]>([]);
  const [addedId,        setAddedId]        = useState<string | null>(null);
  const [sidebarOpen,    setSidebarOpen]    = useState(false);
  const [activeSubcat,   setActiveSubcat]   = useState<SubcategoryDef | null>(null);
  const { dispatch } = useCart();

  // ── Fetch ──────────────────────────────────────────────────────
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    abortRef.current?.abort();
    abortRef.current = new AbortController();

    setLoading(true);
    setError(null);

    const apiSort = (SORT_UI_TO_API[sortBy] ?? 'featured') as 'featured';

    const baseParams = {
      limit:   100,
      skip:    0,
      sort_by: apiSort,
      ...(onlyInStock && { in_stock: true }),
      ...(onlyOnSale  && { on_sale:  true }),
    };

    let request: Promise<any>;

    if (categorySlug) {
      request = fetchProductsByCategory(categorySlug, {
        ...baseParams,
        subSlug: activeSubcat?.slug,
      });
    } else {
      request = fetchAllProducts({
        ...baseParams,
        category:  apiCategory,
        sub_slug:  activeSubcat?.slug,
      });
    }

    request
      .then((res) => {
        setProducts(mapProducts(res.data));
        setTotalCount(res.totalCount);
        setPage(1);
      })
      .catch((err: Error) => {
        if (err.name !== 'AbortError') setError(err.message);
      })
      .finally(() => setLoading(false));

  }, [categorySlug, apiCategory, sortBy, onlyInStock, onlyOnSale, activeSubcat]);

  // ── Derived values ─────────────────────────────────────────────

  const brands = useMemo(
    () => [...new Set(products.map((p) => p.brand))].filter(Boolean),
    [products]
  );

  const maxPrice = useMemo(
    () => Math.max(5000, ...products.map((p) => p.originalPrice)),
    [products]
  );

  const filtered = useMemo(() => {
    let items = [...products];
    if (selectedBrands.length) items = items.filter((p) => selectedBrands.includes(p.brand));
    if (selectedAges.length)   items = items.filter((p) => selectedAges.includes(p.ageRange));
    items = items.filter((p) => p.price >= priceRange[0] && p.price <= priceRange[1]);
    return items;
  }, [products, selectedBrands, selectedAges, priceRange]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged      = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // ── Handlers ───────────────────────────────────────────────────

  const handleSubcatClick = useCallback((sub: SubcategoryDef | null) => {
    setActiveSubcat(sub);
    setPage(1);
    setSelectedBrands([]);
    setSelectedAges([]);
  }, []);

  const clearAll = useCallback(() => {
    setActiveSubcat(null);
    setSelectedBrands([]);
    setSelectedAges([]);
    setPriceRange([0, 5000]);
    setOnlyInStock(false);
    setOnlyOnSale(false);
    setPage(1);
  }, []);

  const toggleBrand = useCallback(
    (b: string) => setSelectedBrands((p) => p.includes(b) ? p.filter((x) => x !== b) : [...p, b]),
    []
  );
  const toggleAge = useCallback(
    (a: string) => setSelectedAges((p) => p.includes(a) ? p.filter((x) => x !== a) : [...p, a]),
    []
  );
  

  const toggleWishlist = useCallback(async (id: string) => {
  try {
    const isAlreadyWishlisted = wishlist.includes(id);

    if (isAlreadyWishlisted) {
      await fetch(`/api/favorite/${id}`, {
        method: 'DELETE',
      });

      setWishlist((prev) => prev.filter((x) => x !== id));
    } else {
      await fetch(`/api/favorite/${id}`, {
        method: 'POST',
      });

      setWishlist((prev) => [...prev, id]);
    }
  } catch (err) {
    console.error('Wishlist error:', err);
  }
}, [wishlist]);


 const addToCart = useCallback((product: UiProduct) => {
  // ✅ Optimistically update context so header badge increments instantly
  dispatch({
    type: 'ADD_ITEM',
    payload: {
      id:            product.id,
      name:          product.name,
      price:         product.price,
      originalPrice: product.originalPrice,
      quantity:      1,
      image:         product.images[0] ?? '',
      emoji:         product.emoji || '🎁',
      category:      product.category,
      color:         '',
      product_count: 0,
      is_available:  product.inStock,
    },
  });

  setAddedId(product.id);

  fetch('/api/cart/items', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ product_id: product.id, quantity: 1 }),
  }).catch(() => {
    // ✅ Roll back if API fails
    dispatch({ type: 'REMOVE_ITEM', payload: { id: product.id }, });
  });

  setTimeout(() => setAddedId(null), 1800);
}, [dispatch]); // ← removed cartStates dep, added dispatch

  const activeFiltersCount = [
    activeSubcat != null     ? 1 : 0,
    selectedBrands.length,
    selectedAges.length,
    onlyInStock              ? 1 : 0,
    onlyOnSale               ? 1 : 0,
    priceRange[0] > 0 || priceRange[1] < 5000 ? 1 : 0,
  ].reduce((a, b) => a + b, 0);

  // ── Render ─────────────────────────────────────────────────────

  return (
    <div className={styles.page}>

      {/* ── Hero ── */}
      

      {/* ── Layout ── */}
      <div className={styles.layout}>

        <button
          className={styles.filterToggle}
          onClick={() => setSidebarOpen(!sidebarOpen)}
          type="button"
        >
          🎛️ Filters
          {activeFiltersCount > 0 && <span className={styles.filterBadge}>{activeFiltersCount}</span>}
        </button>

        {/* ── Sidebar ── */}
        <aside className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : ''}`}>
          <div className={styles.sidebarHead}>
            <span className={styles.sidebarTitle}>Filters</span>
            {activeFiltersCount > 0 && (
              <button className={styles.clearBtn} onClick={clearAll} type="button">Clear all</button>
            )}
          </div>

          <div className={styles.filterGroup}>
            <div className={styles.filterLabel}>Price Range</div>
            <div className={styles.priceDisplay}>
              <span>₹{priceRange[0].toLocaleString('en-IN')}</span>
              <span>₹{priceRange[1].toLocaleString('en-IN')}</span>
            </div>
            <input
              type="range" min={0} max={maxPrice} step={50}
              value={priceRange[1]}
              onChange={(e) => { setPriceRange([priceRange[0], Number(e.target.value)]); setPage(1); }}
              className={styles.rangeSlider}
            />
            <div className={styles.pricePresets}>
              {[[0, 200], [200, 500], [500, 1500], [1500, 5000]].map(([mn, mx]) => (
                <button
                  key={`${mn}-${mx}`}
                  className={`${styles.pricePreset} ${priceRange[0] === mn && priceRange[1] === mx ? styles.pricePresetActive : ''}`}
                  onClick={() => { setPriceRange([mn, mx]); setPage(1); }}
                  type="button"
                >
                  {mn === 0 ? `Under ₹${mx}` : `₹${mn}–₹${mx === 5000 ? '5k+' : mx}`}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.filterGroup}>
            <div className={styles.filterLabel}>Availability</div>
            <label className={styles.checkRow}>
              <input type="checkbox" checked={onlyInStock}
                onChange={(e) => { setOnlyInStock(e.target.checked); setPage(1); }}
                className={styles.check} />
              In Stock Only
            </label>
            <label className={styles.checkRow}>
              <input type="checkbox" checked={onlyOnSale}
                onChange={(e) => { setOnlyOnSale(e.target.checked); setPage(1); }}
                className={styles.check} />
              On Sale <span className={styles.salePip}>🔥</span>
            </label>
          </div>

          {brands.length > 0 && (
            <div className={styles.filterGroup}>
              <div className={styles.filterLabel}>Brand</div>
              {brands.map((b) => (
                <label key={b} className={styles.checkRow}>
                  <input type="checkbox" checked={selectedBrands.includes(b)}
                    onChange={() => { toggleBrand(b); setPage(1); }}
                    className={styles.check} />
                  {b}
                </label>
              ))}
            </div>
          )}

          <div className={styles.filterGroup}>
            <div className={styles.filterLabel}>Age Range</div>
            <div className={styles.ageGrid}>
              {AGE_RANGES.map((a) => (
                <button
                  key={a}
                  className={`${styles.ageChip} ${selectedAges.includes(a) ? styles.ageActive : ''}`}
                  onClick={() => { toggleAge(a); setPage(1); }}
                  type="button"
                >
                  {a}
                </button>
              ))}
            </div>
          </div>
        </aside>

        {sidebarOpen && <div className={styles.overlay} onClick={() => setSidebarOpen(false)} />}

        {/* ── Product Area ── */}
        <div className={styles.productArea}>

          <div className={styles.toolbar}>
            <span className={styles.resultCount}>
              {loading ? (
                <span className={styles.loadingText}>
                  {activeSubcat ? `Loading ${activeSubcat.label}…` : 'Loading…'}
                </span>
              ) : (
                <>
                  Showing{' '}
                  <strong>{Math.min((page - 1) * PAGE_SIZE + 1, filtered.length)}–{Math.min(page * PAGE_SIZE, filtered.length)}</strong>
                  {' '}of <strong>{filtered.length}</strong> products
                  {activeSubcat && <> in <strong>{activeSubcat.label}</strong></>}
                </>
              )}
            </span>
            <div className={styles.toolbarRight}>
              <div className={styles.sortWrap}>
                <label className={styles.sortLabel}>Sort:</label>
                <select
                  className={styles.sortSelect}
                  value={sortBy}
                  onChange={(e) => { setSortBy(e.target.value); setPage(1); }}
                >
                  {SORT_OPTIONS.map((o) => <option key={o}>{o}</option>)}
                </select>
              </div>
              <div className={styles.viewToggle}>
                <button className={`${styles.viewBtn} ${viewMode === 'grid' ? styles.viewActive : ''}`}
                  onClick={() => setViewMode('grid')} type="button" aria-label="Grid view">⊞</button>
                <button className={`${styles.viewBtn} ${viewMode === 'list' ? styles.viewActive : ''}`}
                  onClick={() => setViewMode('list')} type="button" aria-label="List view">☰</button>
              </div>
            </div>
          </div>

          {/* Active filter tags */}
          {activeFiltersCount > 0 && (
            <div className={styles.activeTags}>
              {activeSubcat && (
                <span className={styles.activeTag}>
                  {activeSubcat.label}
                  <button onClick={() => handleSubcatClick(null)} type="button">×</button>
                </span>
              )}
              {selectedBrands.map((b) => (
                <span key={b} className={styles.activeTag}>
                  {b}<button onClick={() => toggleBrand(b)} type="button">×</button>
                </span>
              ))}
              {onlyInStock && (
                <span className={styles.activeTag}>
                  In Stock<button onClick={() => setOnlyInStock(false)} type="button">×</button>
                </span>
              )}
              {onlyOnSale && (
                <span className={styles.activeTag}>
                  On Sale<button onClick={() => setOnlyOnSale(false)} type="button">×</button>
                </span>
              )}
              <button className={styles.clearTagsBtn} onClick={clearAll} type="button">Clear all</button>
            </div>
          )}

          {error && (
            <div className={styles.errorBanner}>
              ⚠️ Could not load products.{' '}
              <button onClick={() => window.location.reload()}>Retry</button>
            </div>
          )}

          {loading && (
            <div className={styles.grid}>
              {[...Array(8)].map((_, i) => (
                <div key={i} className={styles.skeletonCard}>
                  <div className={styles.skeletonImg} />
                  <div className={styles.skeletonBody}>
                    <div className={styles.skeletonLine} />
                    <div className={styles.skeletonLineShort} />
                    <div className={styles.skeletonLineShort} />
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && !error && paged.length === 0 && (
            <div className={styles.emptyState}>
              <div className={styles.emptyEmoji}>🔍</div>
              <h3>No products found</h3>
              <p>
                {activeSubcat
                  ? `No products in ${activeSubcat.label} yet.`
                  : `Try adjusting your filters.`}
              </p>
              <button className={styles.emptyBtn} onClick={clearAll} type="button">
                {activeSubcat ? 'Show All Products' : 'Clear Filters'}
              </button>
            </div>
          )}

          {!loading && paged.length > 0 && (
            <div className={viewMode === 'grid' ? styles.grid : styles.list}>
              {paged.map((product) =>
                viewMode === 'grid' ? (
                  <ProductGridCard
                    key={product.id}
                    product={product}
                    wishlisted={wishlist.includes(product.id)}
                    onWishlist={() => toggleWishlist(product.id)}
                    addedToCart={addedId === product.id}
                    onAddToCart={() => addToCart(product)}
                  />
                ) : (
                  <ProductListCard
                    key={product.id}
                    product={product}
                    wishlisted={wishlist.includes(product.id)}
                    onWishlist={() => toggleWishlist(product.id)}
                    addedToCart={addedId === product.id}
                    onAddToCart={() => addToCart(product)}
                  />
                )
              )}
            </div>
          )}

          {!loading && totalPages > 1 && (
            <div className={styles.pagination}>
              <button className={styles.pageBtn}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1} type="button">‹ Prev</button>

              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                .reduce<(number | '…')[]>((acc, p, i, arr) => {
                  if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push('…');
                  acc.push(p);
                  return acc;
                }, [])
                .map((p, i) =>
                  p === '…'
                    ? <span key={`e${i}`} className={styles.pageEllipsis}>…</span>
                    : <button key={p}
                        className={`${styles.pageNum} ${p === page ? styles.pageActive : ''}`}
                        onClick={() => setPage(p as number)} type="button">{p}</button>
                )}

              <button className={styles.pageBtn}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages} type="button">Next ›</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Card sub-components ──────────────────────────────────────────

const PLACEHOLDER = '/images/placeholder-product.png';

function ProductImg({ src, alt, className }: { src: string; alt: string; className: string }) {
  const [err, setErr] = useState(false);
  const safeSrc = src && (src.startsWith('http://') || src.startsWith('https://') || src.startsWith('/'))
    ? src
    : PLACEHOLDER;
  return (
    <Image
      src={err ? PLACEHOLDER : safeSrc}
      alt={alt}
      fill
      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
      className={className}
      onError={() => setErr(true)}
    />
  );
}

const BADGE_BG:   Record<string, string> = { sale: '#FF6B5B', new: '#3ECFB2', hot: '#FFD336' };
const BADGE_TEXT: Record<string, string> = { sale: '#fff',    new: '#fff',    hot: '#1A2540' };

function ProductGridCard({ product, wishlisted, onWishlist, addedToCart, onAddToCart }: {
  product: UiProduct; wishlisted: boolean; onWishlist: () => void;
  addedToCart: boolean; onAddToCart: () => void;
}) {
  return (
    <article className={styles.card}>
      <Link href={`/product/${product.id}`} className={styles.cardImgLink} aria-label={product.name}>
        <div className={styles.cardImg}>
          <ProductImg src={product.images[0]} alt={product.name} className={styles.cardImageTag} />
          {!product.inStock && <div className={styles.outOfStock}>Out of Stock</div>}
          {product.badges.length > 0 && (
            <div className={styles.badges}>
              {product.badges.map((b) => (
                <span key={b.label} className={styles.badge}
                  style={{ background: BADGE_BG[b.type], color: BADGE_TEXT[b.type] }}>
                  {b.label}
                </span>
              ))}
            </div>
          )}
          <div className={styles.cardOverlay}><span className={styles.quickView}>Quick View</span></div>
        </div>
      </Link>
      <button className={`${styles.wishBtn} ${wishlisted ? styles.wishlisted : ''}`}
        onClick={onWishlist} type="button"
        aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}>
        {wishlisted ? '❤️' : '🤍'}
      </button>
      <div className={styles.cardBody}>
        <div className={styles.cardMeta}>
          <span className={styles.cardCat}>{product.subcategory}</span>
          <span className={styles.cardAge}>👶 {product.ageRange}</span>
        </div>
        <Link href={`/product/${product.id}`}>
          <h3 className={styles.cardName}>{product.name}</h3>
        </Link>
        <div className={styles.cardBrand}>{product.brand}</div>
        <div className={styles.cardStars}>
          {'★'.repeat(product.stars)}{'☆'.repeat(5 - product.stars)}
          <span className={styles.cardReviews}>({product.reviews})</span>
        </div>
        <div className={styles.cardPrice}>
          <span className={styles.priceNow}>₹{product.price.toLocaleString('en-IN')}</span>
          {product.originalPrice > 0 && product.originalPrice !== product.price && (
            <>
              <span className={styles.priceWas}>₹{product.originalPrice.toLocaleString('en-IN')}</span>
              <span className={styles.priceSave}>Save ₹{(product.originalPrice - product.price).toLocaleString('en-IN')}</span>
            </>
          )}
        </div>
        <button
          className={`${styles.addBtn} ${!product.inStock ? styles.addBtnDisabled : ''} ${addedToCart ? styles.addBtnAdded : ''}`}
          type="button" disabled={!product.inStock} onClick={onAddToCart}>
          {addedToCart ? '✓ Added!' : product.inStock ? '🛒 Add to Cart' : '📩 Notify Me'}
        </button>
      </div>
    </article>
  );
}

function ProductListCard({ product, wishlisted, onWishlist, addedToCart, onAddToCart }: {
  product: UiProduct; wishlisted: boolean; onWishlist: () => void;
  addedToCart: boolean; onAddToCart: () => void;
}) {
  return (
    <article className={styles.listCard}>
      <Link href={`/product/${product.id}`} aria-label={product.name}>
        <div className={styles.listImg}>
          <ProductImg src={product.images[0]} alt={product.name} className={styles.listImageTag} />
          {product.badges.map((b) => (
            <span key={b.label} className={styles.listBadge}
              style={{ background: BADGE_BG[b.type], color: BADGE_TEXT[b.type] }}>{b.label}</span>
          ))}
        </div>
      </Link>
      <div className={styles.listBody}>
        <div className={styles.listTop}>
          <div>
            <span className={styles.cardCat}>{product.subcategory}</span>
            <Link href={`/product/${product.id}`}>
              <h3 className={styles.listName}>{product.name}</h3>
            </Link>
            <div className={styles.cardBrand}>{product.brand} · 👶 {product.ageRange}</div>
          </div>
          <button className={`${styles.wishBtn} ${wishlisted ? styles.wishlisted : ''}`}
            onClick={onWishlist} type="button">
            {wishlisted ? '❤️' : '🤍'}
          </button>
        </div>
        {product.description && <p className={styles.listDesc}>{product.description}</p>}
        <div className={styles.cardStars}>
          {'★'.repeat(product.stars)}{'☆'.repeat(5 - product.stars)}
          <span className={styles.cardReviews}>({product.reviews} reviews)</span>
        </div>
        <div className={styles.listFoot}>
          <div className={styles.cardPrice}>
            <span className={styles.priceNow}>₹{product.price.toLocaleString('en-IN')}</span>
            {product.originalPrice > 0 && product.originalPrice !== product.price && (
              <span className={styles.priceWas}>₹{product.originalPrice.toLocaleString('en-IN')}</span>
            )}
          </div>
          <div className={styles.listActions}>
            <Link href={`/product/${product.id}`} className={styles.viewDetailBtn}>View Details</Link>
            <button
              className={`${styles.addBtn} ${!product.inStock ? styles.addBtnDisabled : ''} ${addedToCart ? styles.addBtnAdded : ''}`}
              type="button" disabled={!product.inStock} onClick={onAddToCart}>
              {addedToCart ? '✓ Added!' : product.inStock ? '🛒 Add to Cart' : '📩 Notify Me'}
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}