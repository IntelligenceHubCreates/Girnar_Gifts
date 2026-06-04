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
  title,
  emoji,
  description,
  bgEmojis = [],
  subcategories = [],
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
  const [brandSearch,    setBrandSearch]    = useState('');
  const [showAllBrands,  setShowAllBrands]  = useState(false);
  const [minRating,      setMinRating]      = useState(0);
  const [onlyNewArrival, setOnlyNewArrival] = useState(false);
  const [onlyBestSeller, setOnlyBestSeller] = useState(false);
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

  const filteredBrands = useMemo(
    () => brands.filter((b) => b.toLowerCase().includes(brandSearch.toLowerCase())),
    [brands, brandSearch]
  );

  const visibleBrands = showAllBrands ? filteredBrands : filteredBrands.slice(0, 6);

  const maxPrice = useMemo(
    () => Math.max(5000, ...products.map((p) => p.originalPrice)),
    [products]
  );

  const filtered = useMemo(() => {
    let items = [...products];
    if (selectedBrands.length) items = items.filter((p) => selectedBrands.includes(p.brand));
    if (selectedAges.length)   items = items.filter((p) => selectedAges.includes(p.ageRange));
    items = items.filter((p) => p.price >= priceRange[0] && p.price <= priceRange[1]);
    if (minRating > 0)         items = items.filter((p) => p.stars >= minRating);
    return items;
  }, [products, selectedBrands, selectedAges, priceRange, minRating]);

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
    setMinRating(0);
    setOnlyNewArrival(false);
    setOnlyBestSeller(false);
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
        await fetch(`/api/favorite/${id}`, { method: 'DELETE' });
        setWishlist((prev) => prev.filter((x) => x !== id));
      } else {
        await fetch(`/api/favorite/${id}`, { method: 'POST' });
        setWishlist((prev) => [...prev, id]);
      }
    } catch (err) {
      console.error('Wishlist error:', err);
    }
  }, [wishlist]);

  const addToCart = useCallback((product: UiProduct) => {
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
      dispatch({ type: 'REMOVE_ITEM', payload: { id: product.id } });
    });

    setTimeout(() => setAddedId(null), 1800);
  }, [dispatch]);

  const activeFiltersCount = [
    activeSubcat != null     ? 1 : 0,
    selectedBrands.length,
    selectedAges.length,
    onlyInStock              ? 1 : 0,
    onlyOnSale               ? 1 : 0,
    minRating > 0            ? 1 : 0,
    priceRange[0] > 0 || priceRange[1] < 5000 ? 1 : 0,
  ].reduce((a, b) => a + b, 0);

  // ── Category icon map (for the category strip) ─────────────────
  const CATEGORY_ICONS: Record<string, string> = {
    'All Products':    '🛍️',
    'School Bags':     '🎒',
    'Lunch & Bottles': '🍱',
    'Toys & Games':    '🧸',
    'Stationery':      '✏️',
    'Arts & Crafts':   '🎨',
    'Educational':     '📚',
    'Gift Sets':       '🎁',
    'New Arrivals':    '✨',
  };

  // ── Render ─────────────────────────────────────────────────────

  return (
    <div className={styles.page}>

      {/* ── Page Header (clean, no dark hero) ── */}
      <div className={styles.pageHeader}>
        <div className={styles.pageHeaderInner}>
          {/* Breadcrumb */}
          <div className={styles.breadcrumb}>
            {parentHref && parentLabel && (
              <><Link href={parentHref}>{parentLabel}</Link><span className={styles.breadSep}>›</span></>
            )}
            <span className={styles.breadCurrent}>{title ?? 'Products'}</span>
          </div>

          {/* Title + illustration row */}
          <div className={styles.headerRow}>
            <div>
              <h1 className={styles.pageTitle}>{title ?? 'All Products'}</h1>
              {description && <p className={styles.pageDesc}>{description}</p>}
            </div>
            {/* Floating emoji illustration */}
            <div className={styles.headerIllustration} aria-hidden="true">
              {bgEmojis.slice(0, 3).map((em, i) => (
                <span key={i} className={`${styles.floatEmoji} ${styles[`floatEmoji${i}`]}`}>{em}</span>
              ))}
            </div>
          </div>

          {/* ── Category Icon Strip ── */}
          <div className={styles.catStrip}>
            <button
              className={`${styles.catChip} ${!activeSubcat ? styles.catChipActive : ''}`}
              onClick={() => handleSubcatClick(null)}
              type="button"
            >
              <span className={styles.catIcon}>🛍️</span>
              <span className={styles.catLabel}>All Products</span>
              <span className={styles.catCount}>{totalCount || products.length}</span>
            </button>
            {subcategories.map((sc) => (
              <button
                key={sc.slug}
                className={`${styles.catChip} ${activeSubcat?.slug === sc.slug ? styles.catChipActive : ''}`}
                onClick={() => handleSubcatClick(sc as SubcategoryDef)}
                type="button"
              >
                <span className={styles.catIcon}>{CATEGORY_ICONS[sc.label] ?? '📦'}</span>
                <span className={styles.catLabel}>{sc.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Layout ── */}
      <div className={styles.layout}>

        {/* Mobile filter toggle */}
        <button
          className={styles.filterToggle}
          onClick={() => setSidebarOpen(!sidebarOpen)}
          type="button"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="10" y1="18" x2="14" y2="18"/></svg>
          {sidebarOpen ? 'Hide Filters' : 'Filters'}
          {activeFiltersCount > 0 && <span className={styles.filterBadge}>{activeFiltersCount}</span>}
        </button>

        {/* ── Sidebar ── */}
        <aside className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : ''}`}>
          <div className={styles.sidebarHead}>
            <span className={styles.sidebarTitle}>Filters</span>
            {activeFiltersCount > 0 && (
              <button className={styles.clearBtn} onClick={clearAll} type="button">Clear All</button>
            )}
          </div>

          {/* Categories in sidebar */}
          {subcategories.length > 0 && (
            <div className={styles.filterGroup}>
              <div className={styles.filterLabel}>Categories</div>
              <button
                className={`${styles.catListItem} ${!activeSubcat ? styles.catListActive : ''}`}
                onClick={() => handleSubcatClick(null)}
                type="button"
              >
                <span>All Products</span>
                <span className={styles.catListCount}>{totalCount || products.length}</span>
              </button>
              {subcategories.map((sc) => (
                <button
                  key={sc.slug}
                  className={`${styles.catListItem} ${activeSubcat?.slug === sc.slug ? styles.catListActive : ''}`}
                  onClick={() => handleSubcatClick(sc as SubcategoryDef)}
                  type="button"
                >
                  <span>{sc.label}</span>
                </button>
              ))}
            </div>
          )}

          {/* Price Range */}
          <div className={styles.filterGroup}>
            <div className={styles.filterLabel}>Price Range</div>
            <div className={styles.priceTrack}>
              <input
                type="range" min={0} max={maxPrice} step={50}
                value={priceRange[0]}
                onChange={(e) => { setPriceRange([Number(e.target.value), priceRange[1]]); setPage(1); }}
                className={styles.rangeSlider}
              />
              <input
                type="range" min={0} max={maxPrice} step={50}
                value={priceRange[1]}
                onChange={(e) => { setPriceRange([priceRange[0], Number(e.target.value)]); setPage(1); }}
                className={styles.rangeSlider}
              />
            </div>
            <div className={styles.priceDisplay}>
              <span className={styles.priceTag}>₹{priceRange[0].toLocaleString('en-IN')}</span>
              <span className={styles.priceDash}>—</span>
              <span className={styles.priceTag}>₹{priceRange[1] >= maxPrice ? `${(maxPrice/1000).toFixed(0)}k+` : priceRange[1].toLocaleString('en-IN')}</span>
            </div>
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

          {/* Age Group */}
          <div className={styles.filterGroup}>
            <div className={styles.filterLabel}>Age Group</div>
            {AGE_RANGES.map((a) => (
              <label key={a} className={styles.checkRow}>
                <input type="checkbox" checked={selectedAges.includes(a)}
                  onChange={() => { toggleAge(a); setPage(1); }}
                  className={styles.check} />
                <span>{a}</span>
              </label>
            ))}
          </div>

          {/* Brand */}
          {brands.length > 0 && (
            <div className={styles.filterGroup}>
              <div className={styles.filterLabel}>Brand</div>
              <div className={styles.brandSearchWrap}>
                <svg className={styles.brandSearchIcon} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
                <input
                  type="text"
                  placeholder="Search brands..."
                  value={brandSearch}
                  onChange={(e) => setBrandSearch(e.target.value)}
                  className={styles.brandSearch}
                />
              </div>
              {visibleBrands.map((b) => (
                <label key={b} className={styles.checkRow}>
                  <input type="checkbox" checked={selectedBrands.includes(b)}
                    onChange={() => { toggleBrand(b); setPage(1); }}
                    className={styles.check} />
                  <span>{b}</span>
                </label>
              ))}
              {filteredBrands.length > 6 && (
                <button className={styles.viewMoreBtn} onClick={() => setShowAllBrands(!showAllBrands)} type="button">
                  {showAllBrands ? '− Show Less' : `+ View More (${filteredBrands.length - 6})`}
                </button>
              )}
            </div>
          )}

          {/* Ratings */}
          <div className={styles.filterGroup}>
            <div className={styles.filterLabel}>Ratings</div>
            {[4, 3, 2, 1].map((r) => (
              <label key={r} className={styles.checkRow}>
                <input type="radio" name="rating" checked={minRating === r}
                  onChange={() => { setMinRating(minRating === r ? 0 : r); setPage(1); }}
                  className={styles.check} />
                <span className={styles.starRow}>
                  {'★'.repeat(r)}{'☆'.repeat(5 - r)}
                  <span className={styles.ratingLabel}>&amp; above</span>
                </span>
              </label>
            ))}
          </div>

          {/* Offers */}
          <div className={styles.filterGroup}>
            <div className={styles.filterLabel}>Offers</div>
            <label className={styles.checkRow}>
              <input type="checkbox" checked={onlyOnSale}
                onChange={(e) => { setOnlyOnSale(e.target.checked); setPage(1); }}
                className={styles.check} />
              On Sale
            </label>
            <label className={styles.checkRow}>
              <input type="checkbox" checked={onlyNewArrival}
                onChange={(e) => { setOnlyNewArrival(e.target.checked); setPage(1); }}
                className={styles.check} />
              New Arrivals
            </label>
            <label className={styles.checkRow}>
              <input type="checkbox" checked={onlyBestSeller}
                onChange={(e) => { setOnlyBestSeller(e.target.checked); setPage(1); }}
                className={styles.check} />
              Best Seller
            </label>
            <label className={styles.checkRow}>
              <input type="checkbox" checked={onlyInStock}
                onChange={(e) => { setOnlyInStock(e.target.checked); setPage(1); }}
                className={styles.check} />
              Bundle Offers
            </label>
          </div>

          {activeFiltersCount > 0 && (
            <button className={styles.clearAllBottom} onClick={clearAll} type="button">
              Clear All Filters
            </button>
          )}
        </aside>

        {sidebarOpen && <div className={styles.overlay} onClick={() => setSidebarOpen(false)} />}

        {/* ── Product Area ── */}
        <div className={styles.productArea}>

          {/* Toolbar */}
          <div className={styles.toolbar}>
            <button
              className={styles.hideFiltersBtn}
              onClick={() => setSidebarOpen(!sidebarOpen)}
              type="button"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="10" y1="18" x2="14" y2="18"/></svg>
              {sidebarOpen ? 'Hide Filters' : 'Show Filters'}
            </button>

            <span className={styles.resultCount}>
              {loading ? (
                <span className={styles.loadingText}>Loading…</span>
              ) : (
                <>Showing <strong>{Math.min((page-1)*PAGE_SIZE+1, filtered.length)}–{Math.min(page*PAGE_SIZE, filtered.length)}</strong> of <strong>{filtered.length.toLocaleString()}</strong> products</>
              )}
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
                <button className={`${styles.viewBtn} ${viewMode === 'grid' ? styles.viewActive : ''}`}
                  onClick={() => setViewMode('grid')} type="button" aria-label="Grid view">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
                </button>
                <button className={`${styles.viewBtn} ${viewMode === 'list' ? styles.viewActive : ''}`}
                  onClick={() => setViewMode('list')} type="button" aria-label="List view">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><rect x="3" y="4" width="18" height="3" rx="1"/><rect x="3" y="10.5" width="18" height="3" rx="1"/><rect x="3" y="17" width="18" height="3" rx="1"/></svg>
                </button>
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
              {minRating > 0 && (
                <span className={styles.activeTag}>
                  {minRating}★ & above<button onClick={() => setMinRating(0)} type="button">×</button>
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
              <p>{activeSubcat ? `No products in ${activeSubcat.label} yet.` : `Try adjusting your filters.`}</p>
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

          {/* Pagination */}
          {!loading && filtered.length > 0 && (
            <div className={styles.pagination}>
              <button className={styles.pageBtn}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1} type="button">‹</button>

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
                disabled={page === totalPages} type="button">›</button>

              <div className={styles.pageShow}>
                Show: <select className={styles.pageSizeSelect} defaultValue="24">
                  {[12,24,48].map(n => <option key={n}>{n}</option>)}
                </select>
              </div>
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
    ? src : PLACEHOLDER;
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

const BADGE_STYLES: Record<string, { bg: string; color: string; label: string }> = {
  sale:       { bg: '#FF6B35', color: '#fff',    label: 'Sale'       },
  new:        { bg: '#fff',    color: '#2E7D32',  label: 'New'        },
  hot:        { bg: '#FF6B35', color: '#fff',    label: 'Bestseller' },
  bestseller: { bg: '#FF6B35', color: '#fff',    label: 'Bestseller' },
};

// ─── Colour swatch helper ─────────────────────────────────────────
// Reads product.colors — an array of hex strings like ['#FF0000','#00FF00']
// Falls back to a deterministic palette derived from the product name if
// no colors are supplied, so every card always shows swatches.

const FALLBACK_PALETTES: string[][] = [
  ['#FF6B6B','#4ECDC4','#45B7D1','#96E6A1'],
  ['#A8E6CF','#FFD93D','#FF6B6B','#6C5CE7'],
  ['#FD79A8','#FDCB6E','#6C5CE7','#00B894'],
  ['#E17055','#74B9FF','#A29BFE','#55EFC4'],
  ['#FF7675','#81ECEC','#FFEAA7','#DFE6E9'],
  ['#FAB1A0','#74B9FF','#B2BEC3','#2D3436'],
];

function getSwatchColors(product: UiProduct): string[] {
  if (product.colors && product.colors.length > 0) return product.colors;
  // derive a consistent palette from product id hash
  const hash = product.id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return FALLBACK_PALETTES[hash % FALLBACK_PALETTES.length];
}

function ColorSwatch({ product }: { product: UiProduct }) {
  const [active, setActive] = useState(0);
  const colors = getSwatchColors(product);
  const visible = colors.slice(0, 4);
  const extra   = colors.length - 4;

  return (
    <div className={styles.swatchRow}>
      {visible.map((c, i) => (
        <button
          key={i}
          type="button"
          className={`${styles.swatch} ${i === active ? styles.swatchActive : ''}`}
          style={{ background: c }}
          onClick={(e) => { e.preventDefault(); setActive(i); }}
          aria-label={`Color option ${i + 1}`}
          title={c}
        />
      ))}
      {extra > 0 && (
        <span className={styles.swatchMore}>+{extra}</span>
      )}
    </div>
  );
}

function ProductGridCard({ product, wishlisted, onWishlist, addedToCart, onAddToCart }: {
  product: UiProduct; wishlisted: boolean; onWishlist: () => void;
  addedToCart: boolean; onAddToCart: () => void;
}) {
  const discountPct = product.originalPrice > product.price
    ? Math.round((1 - product.price / product.originalPrice) * 100)
    : 0;

  return (
    <article className={styles.card}>
      <Link href={`/product/${product.id}`} className={styles.cardImgLink} aria-label={product.name}>
        <div className={styles.cardImg}>
          <ProductImg src={product.images[0]} alt={product.name} className={styles.cardImageTag} />

          {/* Top-left badge */}
          {product.badges.length > 0 && (
            <div className={styles.badgeTopLeft}>
              {product.badges.slice(0, 1).map((b) => {
                const s = BADGE_STYLES[b.type] ?? { bg: '#FF6B35', color: '#fff', label: b.label };
                const isOutline = b.type === 'new';
                return (
                  <span
                    key={b.label}
                    className={`${styles.badge} ${isOutline ? styles.badgeOutline : ''}`}
                    style={{ background: s.bg, color: s.color, border: isOutline ? `1.5px solid #2E7D32` : 'none' }}
                  >
                    {b.label}
                  </span>
                );
              })}
            </div>
          )}

          {/* Top-left discount */}
          {discountPct > 0 && product.badges.length === 0 && (
            <div className={styles.badgeTopLeft}>
              <span className={styles.badge} style={{ background: '#f5f5f5', color: '#555' }}>-{discountPct}%</span>
            </div>
          )}

          {!product.inStock && <div className={styles.outOfStock}>Out of Stock</div>}
          <div className={styles.cardOverlay}><span className={styles.quickView}>Quick View</span></div>
        </div>
      </Link>

      {/* Wishlist */}
      <button className={`${styles.wishBtn} ${wishlisted ? styles.wishlisted : ''}`}
        onClick={onWishlist} type="button"
        aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}>
        {wishlisted ? '❤️' : '🤍'}
      </button>

      <div className={styles.cardBody}>
        {/* Category + Age */}
        <div className={styles.cardMeta}>
          <span className={styles.cardCat}>{product.subcategory || product.category}</span>
          <span className={styles.cardAge}>👶 {product.ageRange}</span>
        </div>

        <Link href={`/product/${product.id}`}>
          <h3 className={styles.cardName}>{product.name}</h3>
        </Link>

        {/* Stars */}
        <div className={styles.cardStars}>
          <span className={styles.starsGold}>{'★'.repeat(product.stars)}{'☆'.repeat(5 - product.stars)}</span>
          <span className={styles.cardReviews}>({product.reviews})</span>
        </div>

        {/* Colour swatches */}
        <ColorSwatch product={product} />

        {/* Price row */}
        <div className={styles.cardPriceRow}>
          <div className={styles.cardPriceLeft}>
            <span className={styles.priceNow}>₹{product.price.toLocaleString('en-IN')}</span>
            {product.originalPrice > 0 && product.originalPrice !== product.price && (
              <span className={styles.priceWas}>₹{product.originalPrice.toLocaleString('en-IN')}</span>
            )}
            {discountPct > 0 && (
              <span className={styles.priceSavePct}>{discountPct}% OFF</span>
            )}
          </div>

          {/* Orange cart button */}
          <button
            className={`${styles.cartCircleBtn} ${!product.inStock ? styles.cartCircleBtnDisabled : ''} ${addedToCart ? styles.cartCircleBtnAdded : ''}`}
            type="button"
            disabled={!product.inStock}
            onClick={onAddToCart}
            aria-label="Add to cart"
          >
            {addedToCart ? '✓' : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
              </svg>
            )}
          </button>
        </div>
      </div>
    </article>
  );
}

function ProductListCard({ product, wishlisted, onWishlist, addedToCart, onAddToCart }: {
  product: UiProduct; wishlisted: boolean; onWishlist: () => void;
  addedToCart: boolean; onAddToCart: () => void;
}) {
  const discountPct = product.originalPrice > product.price
    ? Math.round((1 - product.price / product.originalPrice) * 100)
    : 0;

  return (
    <article className={styles.listCard}>
      <Link href={`/product/${product.id}`} aria-label={product.name}>
        <div className={styles.listImg}>
          <ProductImg src={product.images[0]} alt={product.name} className={styles.listImageTag} />
          {product.badges.map((b) => {
            const s = BADGE_STYLES[b.type] ?? { bg: '#FF6B35', color: '#fff', label: b.label };
            return (
              <span key={b.label} className={styles.listBadge}
                style={{ background: s.bg, color: s.color }}>{b.label}</span>
            );
          })}
        </div>
      </Link>
      <div className={styles.listBody}>
        <div className={styles.listTop}>
          <div>
            <span className={styles.cardCat}>{product.subcategory || product.category}</span>
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
          <span className={styles.starsGold}>{'★'.repeat(product.stars)}{'☆'.repeat(5 - product.stars)}</span>
          <span className={styles.cardReviews}>({product.reviews} reviews)</span>
        </div>
        <ColorSwatch product={product} />
        <div className={styles.listFoot}>
          <div className={styles.cardPriceRow}>
            <span className={styles.priceNow}>₹{product.price.toLocaleString('en-IN')}</span>
            {product.originalPrice > 0 && product.originalPrice !== product.price && (
              <span className={styles.priceWas}>₹{product.originalPrice.toLocaleString('en-IN')}</span>
            )}
            {discountPct > 0 && <span className={styles.priceSavePct}>{discountPct}% OFF</span>}
          </div>
          <div className={styles.listActions}>
            <Link href={`/product/${product.id}`} className={styles.viewDetailBtn}>View Details</Link>
            <button
              className={`${styles.cartCircleBtn} ${!product.inStock ? styles.cartCircleBtnDisabled : ''} ${addedToCart ? styles.cartCircleBtnAdded : ''}`}
              type="button" disabled={!product.inStock} onClick={onAddToCart}>
              {addedToCart ? '✓' : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
                  <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}