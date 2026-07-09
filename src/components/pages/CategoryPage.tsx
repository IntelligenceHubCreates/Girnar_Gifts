'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSession } from 'next-auth/react';
import styles from './CategoryPage.module.css';
import { fetchProductsByCategory, fetchAllProducts } from '@/lib/api';
import { mapProducts } from '@/lib/mapProduct';
import type { SubcategoryDef, UiProduct, ApiProductListResponse, ProductQueryParams } from '@/types/products';
import { useCart } from '@/context/CartContext';

// ─── Props ─────────────────────────────────────────────────────────────────

export interface CategoryPageProps {
  title?: string;
  emoji?: string;
  description?: string;
  bgEmojis?: string[];
  subcategories?: { label: string; slug: string }[];
  tags?: string[];
  parentLabel?: string;
  parentHref?: string;
  categorySlug?: string;
  apiCategory?: string;
  heroGradient?: string;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const SORT_UI_TO_API: Record<string, 'featured' | 'price_asc' | 'price_desc' | 'newest' | 'rating'> = {
  Featured: 'featured',
  'Price: Low to High': 'price_asc',
  'Price: High to Low': 'price_desc',
  'Newest First': 'newest',
  'Top Rated': 'rating',
};
const SORT_API_TO_UI: Record<string, string> = Object.fromEntries(
  Object.entries(SORT_UI_TO_API).map(([ui, api]) => [api, ui]),
);
const SORT_OPTIONS = Object.keys(SORT_UI_TO_API);

const PAGE_SIZE = 12; // products per page (matches the backend page size)

const PRICE_PRESETS: [number, number][] = [
  [0, 200],
  [200, 500],
  [500, 1500],
  [1500, 5000],
];

// ─── Small product image with graceful fallback ──────────────────────────────

function ProductImg({ src, alt }: { src: string; alt: string }) {
  const [errored, setErrored] = useState(false);
  if (!src || errored) {
    return <div className={styles.imgFallback} aria-hidden="true">🧸</div>;
  }
  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes="(max-width: 600px) 50vw, (max-width: 1024px) 33vw, 240px"
      className={styles.cardImg}
      onError={() => setErrored(true)}
    />
  );
}

// ─── Colour swatches ─────────────────────────────────────────────────────────

interface ProductColor {
  hex: string;
  image?: string;
  label?: string;
}

function normaliseColors(raw: unknown): ProductColor[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((c): ProductColor | null => {
      if (typeof c === 'string') return c ? { hex: c } : null;
      if (c && typeof c === 'object') {
        const o = c as Record<string, unknown>;
        const hex = (o.hex ?? o.color_hex ?? o.color) as string | undefined;
        if (!hex) return null;
        const image = (o.image ?? o.imageUrl) as string | undefined;
        const label = (o.label ?? o.name) as string | undefined;
        return { hex, image, label };
      }
      return null;
    })
    .filter((c): c is ProductColor => c !== null);
}

function ColorSwatch({ product }: { product: UiProduct }) {
  const colors = normaliseColors(product.colors);
  if (colors.length === 0) return null;
  return (
    <div className={styles.swatchRow}>
      {colors.slice(0, 4).map((c, i) => (
        <span
          key={`${c.hex}-${i}`}
          className={styles.swatch}
          style={{ background: c.hex }}
          title={c.label ?? c.hex}
          aria-label={c.label ?? c.hex}
        />
      ))}
      {colors.length > 4 && <span className={styles.swatchMore}>+{colors.length - 4}</span>}
    </div>
  );
}

// ─── Product cards ───────────────────────────────────────────────────────────

interface CardProps {
  product: UiProduct;
  wishlisted: boolean;
  added: boolean;
  onWishlist: (id: string) => void;
  onAdd: (p: UiProduct) => void;
}

function StarLine({ stars, reviews, suffixReviews }: { stars: number; reviews: number; suffixReviews?: boolean }) {
  if (reviews <= 0) {
    return (
      <div className={styles.cardStars}>
        <span className={styles.cardReviews}>No reviews yet</span>
      </div>
    );
  }
  const filled = Math.max(0, Math.min(5, stars));
  return (
    <div className={styles.cardStars}>
      <span className={styles.starsGold}>
        {'★'.repeat(filled)}
        {'☆'.repeat(5 - filled)}
      </span>
      <span className={styles.cardReviews}>
        {suffixReviews ? `(${reviews} reviews)` : `(${reviews})`}
      </span>
    </div>
  );
}

function ProductGridCard({ product, wishlisted, added, onWishlist, onAdd }: CardProps) {
  const discountPct =
    product.originalPrice > product.price
      ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
      : 0;

  return (
    <div className={styles.card}>
      <div className={styles.cardImgWrap}>
        <Link href={`/product/${product.id}`} className={styles.cardImgLink}>
          <ProductImg src={product.images[0]} alt={product.name} />
        </Link>

        {product.badges.length > 0 && (
          <div className={styles.badgeStack}>
            {product.badges.slice(0, 1).map((b, i) => (
              <span key={i} className={b.type === 'new' ? styles.badgeNew : styles.badgeBestseller}>
                {b.label}
              </span>
            ))}
          </div>
        )}

        <button
          className={`${styles.wishBtn} ${wishlisted ? styles.wishActive : ''}`}
          onClick={() => onWishlist(product.id)}
          aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          type="button"
        >
          {wishlisted ? '❤️' : '🤍'}
        </button>

        {!product.inStock && <div className={styles.soldOut}>Sold Out</div>}
      </div>

      <div className={styles.cardBody}>
        <span className={styles.cardBrand}>{product.brand}</span>
        <Link href={`/product/${product.id}`} className={styles.cardName}>
          {product.name}
        </Link>

        <StarLine stars={product.stars} reviews={product.reviews} />

        <ColorSwatch product={product} />

        <div className={styles.cardPriceRow}>
          <span className={styles.cardPrice}>₹{product.price.toLocaleString('en-IN')}</span>
          {discountPct > 0 && (
            <>
              <span className={styles.cardOldPrice}>
                ₹{product.originalPrice.toLocaleString('en-IN')}
              </span>
              <span className={styles.cardSave}>{discountPct}% off</span>
            </>
          )}
        </div>

        <button
          className={`${styles.addBtn} ${added ? styles.addBtnDone : ''}`}
          onClick={() => onAdd(product)}
          disabled={!product.inStock}
          type="button"
        >
          {!product.inStock ? 'Notify Me' : added ? '✓ Added' : 'Add to Cart'}
        </button>
      </div>
    </div>
  );
}

function ProductListCard({ product, wishlisted, added, onWishlist, onAdd }: CardProps) {
  const discountPct =
    product.originalPrice > product.price
      ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
      : 0;

  return (
    <div className={styles.listCard}>
      <div className={styles.listImgWrap}>
        <Link href={`/product/${product.id}`} className={styles.cardImgLink}>
          <ProductImg src={product.images[0]} alt={product.name} />
        </Link>
        {!product.inStock && <div className={styles.soldOut}>Sold Out</div>}
      </div>

      <div className={styles.listBody}>
        <div className={styles.listTop}>
          <div>
            <span className={styles.cardBrand}>{product.brand}</span>
            <Link href={`/product/${product.id}`} className={styles.listName}>
              {product.name}
            </Link>
          </div>
          <button
            className={`${styles.wishBtn} ${wishlisted ? styles.wishActive : ''}`}
            onClick={() => onWishlist(product.id)}
            aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
            type="button"
          >
            {wishlisted ? '❤️' : '🤍'}
          </button>
        </div>

        <StarLine stars={product.stars} reviews={product.reviews} suffixReviews />

        {product.description && <p className={styles.listDesc}>{product.description}</p>}

        <ColorSwatch product={product} />

        <div className={styles.listBottom}>
          <div className={styles.cardPriceRow}>
            <span className={styles.cardPrice}>₹{product.price.toLocaleString('en-IN')}</span>
            {discountPct > 0 && (
              <>
                <span className={styles.cardOldPrice}>
                  ₹{product.originalPrice.toLocaleString('en-IN')}
                </span>
                <span className={styles.cardSave}>{discountPct}% off</span>
              </>
            )}
          </div>
          <button
            className={`${styles.addBtn} ${added ? styles.addBtnDone : ''}`}
            onClick={() => onAdd(product)}
            disabled={!product.inStock}
            type="button"
          >
            {!product.inStock ? 'Notify Me' : added ? '✓ Added' : 'Add to Cart'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────

export default function CategoryPage({
  title,
  emoji,
  description,
  bgEmojis = [],
  subcategories = [],
  parentLabel,
  parentHref,
  categorySlug,
  apiCategory,
}: CategoryPageProps) {
  // ── Data state ────────────────────────────────────────────────────────────
  const [products, setProducts] = useState<UiProduct[]>([]); // current page only
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0); // total for the CURRENT filters (drives pagination)
  const [catTotal, setCatTotal] = useState(0); // grand total for the category (sidebar "All Products")
  const [subcatCounts, setSubcatCounts] = useState<Record<string, number>>({});
  const [maxPrice, setMaxPrice] = useState(1000);
  const [reloadKey, setReloadKey] = useState(0);

  // ── UI state ──────────────────────────────────────────────────────────────
  const [sortBy, setSortBy] = useState('Featured');
  const [activeSubcat, setActiveSubcat] = useState<SubcategoryDef | null>(null);
  const [onlyInStock, setOnlyInStock] = useState(false);
  const [onlyOnSale, setOnlyOnSale] = useState(false);
  const [onlyNewArrival, setOnlyNewArrival] = useState(false);
  const [onlyBestSeller, setOnlyBestSeller] = useState(false);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000]);
  const [priceTouched, setPriceTouched] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [page, setPage] = useState(1);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [addedId, setAddedId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const { dispatch, addItem: addItemToCart } = useCart();
  const { data: session } = useSession();
  const token = (session as any)?.backendToken as string | undefined;

  // Single place that picks the right endpoint (category slug vs. /all).
  const runFetch = useCallback(
    (opts: {
      subSlug?: string;
      limit: number;
      skip?: number;
      page?: number;
      sort_by?: ProductQueryParams['sort_by'];
      in_stock?: boolean;
      on_sale?: boolean;
      is_new?: boolean;
      is_featured?: boolean;
      min_price?: number;
      max_price?: number;
      signal?: AbortSignal;
    }): Promise<ApiProductListResponse> => {
      if (categorySlug) {
        return fetchProductsByCategory(categorySlug, {
          subSlug: opts.subSlug,
          limit: opts.limit,
          skip: opts.skip,
          page: opts.page,
          sort_by: opts.sort_by,
          in_stock: opts.in_stock,
          on_sale: opts.on_sale,
          is_new: opts.is_new,
          is_featured: opts.is_featured,
          min_price: opts.min_price,
          max_price: opts.max_price,
          signal: opts.signal,
        });
      }
      return fetchAllProducts({
        category: apiCategory,
        sub_slug: opts.subSlug,
        limit: opts.limit,
        skip: opts.skip,
        page: opts.page,
        sort_by: opts.sort_by,
        in_stock: opts.in_stock,
        on_sale: opts.on_sale,
        is_new: opts.is_new,
        is_featured: opts.is_featured,
        min_price: opts.min_price,
        max_price: opts.max_price,
        signal: opts.signal,
      });
    },
    [categorySlug, apiCategory],
  );

  // ════════════════════════════════════════════════════════════════════════════
  //  CATEGORY META — grand total, per-subcategory counts, and price ceiling.
  //  Done with cheap limit=1 probes (we only read totalCount / the top price),
  //  so the sidebar counts stay accurate WITHOUT loading every product.
  //  Runs once per category, not on every filter/page change.
  // ════════════════════════════════════════════════════════════════════════════
  const subcatKey = subcategories.map((s) => s.slug).join(',');
  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;

    (async () => {
      try {
        const [allRes, maxRes, ...subRes] = await Promise.all([
          runFetch({ limit: 1, signal }),
          runFetch({ limit: 1, sort_by: 'price_desc', signal }),
          ...subcategories.map((sc) => runFetch({ subSlug: sc.slug, limit: 1, signal })),
        ]);
        if (signal.aborted) return;

        setCatTotal(allRes.totalCount ?? 0);
        const top = maxRes.data?.[0]?.original_price ?? 0;
        setMaxPrice(top > 0 ? Math.ceil(top) : 1000);

        const counts: Record<string, number> = {};
        subcategories.forEach((sc, i) => {
          counts[sc.slug] = subRes[i]?.totalCount ?? 0;
        });
        setSubcatCounts(counts);
      } catch {
        /* counts are non-critical — ignore */
      }
    })();

    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categorySlug, apiCategory, subcatKey, reloadKey]);

  // ════════════════════════════════════════════════════════════════════════════
  //  PAGE FETCH — server-side pagination. Fetches exactly ONE page (PAGE_SIZE)
  //  with the active filters + sort applied on the backend, so page 1 = first 12,
  //  page 2 = next 12, and so on across all results.
  // ════════════════════════════════════════════════════════════════════════════
  // Price params as PRIMITIVES (undefined until the user touches the slider).
  // This is deliberate: when the price-ceiling probe resolves and we sync the
  // slider to [0, maxPrice], `priceRange` changes identity — but these stay
  // `undefined`, so the fetch below does NOT re-run. That removes the refetch
  // storm you saw in the network tab (multiple skip=0 calls).
  const minPriceParam = priceTouched ? priceRange[0] : undefined;
  const maxPriceParam = priceTouched ? priceRange[1] : undefined;

  // Monotonic request id — only the response from the LATEST request is allowed
  // to update the grid. Guarantees "last click wins": clicking page 3 can never
  // be overwritten by a slower, earlier page-1 response.
  const reqIdRef = useRef(0);

  useEffect(() => {
    const reqId = ++reqIdRef.current;
    const controller = new AbortController();
    const { signal } = controller;

    setLoading(true);
    setError(null);

    (async () => {
      try {
        const res = await runFetch({
          subSlug: activeSubcat?.slug,
          limit: PAGE_SIZE,
          skip: (page - 1) * PAGE_SIZE,
          page, // 1-based — backend paginates by `page`; skip kept for skip-based backends
          sort_by: SORT_UI_TO_API[sortBy],
          in_stock: onlyInStock || undefined,
          on_sale: onlyOnSale || undefined,
          is_new: onlyNewArrival || undefined,
          is_featured: onlyBestSeller || undefined,
          min_price: minPriceParam,
          max_price: maxPriceParam,
          signal,
        });
        if (signal.aborted || reqId !== reqIdRef.current) return; // stale → drop
        setProducts(mapProducts(res.data ?? []));
        setTotalCount(res.totalCount ?? 0);
      } catch (err) {
        const e = err as { name?: string; message?: string };
        if (e?.name === 'AbortError' || signal.aborted || reqId !== reqIdRef.current) return;
        setError(e?.message ?? 'Failed to load products');
      } finally {
        if (reqId === reqIdRef.current) setLoading(false);
      }
    })();

    return () => controller.abort();
  }, [
    runFetch,
    activeSubcat,
    sortBy,
    page,
    onlyInStock,
    onlyOnSale,
    onlyNewArrival,
    onlyBestSeller,
    minPriceParam,
    maxPriceParam,
    reloadKey,
  ]);

  // Reset filters when the PARENT category changes (skips first mount).
  const didMountRef = useRef(false);
  useEffect(() => {
    if (!didMountRef.current) {
      didMountRef.current = true;
      return;
    }
    setActiveSubcat(null);
    setOnlyInStock(false);
    setOnlyOnSale(false);
    setOnlyNewArrival(false);
    setOnlyBestSeller(false);
    setPriceTouched(false);
    setPage(1);
  }, [categorySlug, apiCategory]);

  // Keep the slider pinned to the full range until the user touches it.
  useEffect(() => {
    if (!priceTouched) setPriceRange([0, maxPrice]);
  }, [maxPrice, priceTouched]);

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  // Clamp the page if the filtered total shrinks below it.
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  // ── URL ⇄ state sync (sub, sort, view, page) via History API ───────────────
  const urlReadyRef = useRef(false);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const sp = new URLSearchParams(window.location.search);

    const sub = sp.get('sub');
    if (sub && subcategories.length) {
      const match = subcategories.find((s) => s.slug === sub);
      if (match) setActiveSubcat(match as SubcategoryDef);
    }
    const sort = sp.get('sort');
    if (sort && SORT_API_TO_UI[sort]) setSortBy(SORT_API_TO_UI[sort]);
    const view = sp.get('view');
    if (view === 'list' || view === 'grid') setViewMode(view);
    const pg = parseInt(sp.get('page') ?? '', 10);
    if (Number.isFinite(pg) && pg > 1) setPage(pg);

    urlReadyRef.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || !urlReadyRef.current) return;
    const sp = new URLSearchParams(window.location.search);
    if (activeSubcat) sp.set('sub', activeSubcat.slug);
    else sp.delete('sub');
    const apiSort = SORT_UI_TO_API[sortBy];
    if (apiSort && apiSort !== 'featured') sp.set('sort', apiSort);
    else sp.delete('sort');
    if (viewMode !== 'grid') sp.set('view', viewMode);
    else sp.delete('view');
    if (page > 1) sp.set('page', String(page));
    else sp.delete('page');
    const qs = sp.toString();
    window.history.replaceState(null, '', qs ? `${window.location.pathname}?${qs}` : window.location.pathname);
  }, [activeSubcat, sortBy, viewMode, page]);

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handleSubcatClick = useCallback((sub: SubcategoryDef | null) => {
    setActiveSubcat(sub);
    setPage(1);
    setSidebarOpen(false);
  }, []);

  const handlePriceChange = useCallback((which: 0 | 1, value: number) => {
    setPriceTouched(true);
    setPage(1);
    setPriceRange((prev) =>
      which === 0 ? [Math.min(value, prev[1]), prev[1]] : [prev[0], Math.max(value, prev[0])],
    );
  }, []);

  const applyPreset = useCallback((mn: number, mx: number) => {
    setPriceTouched(true);
    setPriceRange([mn, mx]);
    setPage(1);
  }, []);

  const clearAll = useCallback(() => {
    setActiveSubcat(null);
    setPriceTouched(false);
    setPriceRange([0, maxPrice]);
    setOnlyInStock(false);
    setOnlyOnSale(false);
    setOnlyNewArrival(false);
    setOnlyBestSeller(false);
    setPage(1);
  }, [maxPrice]);

  const toggleWishlist = useCallback(
    async (id: string) => {
      const wasWishlisted = wishlist.includes(id);
      setWishlist((prev) => (wasWishlisted ? prev.filter((x) => x !== id) : [...prev, id]));
      try {
        const res = await fetch(`/api/favorite/${id}`, {
          method: wasWishlisted ? 'DELETE' : 'POST',
          credentials: 'include',
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        if (!res.ok) throw new Error('wishlist request failed');
      } catch {
        setWishlist((prev) => (wasWishlisted ? [...prev, id] : prev.filter((x) => x !== id)));
      }
    },
    [wishlist, token],
  );

  const addToCart = useCallback(
    async (product: UiProduct) => {
      setAddedId(product.id);
      await addItemToCart({
        id: product.id,
        name: product.name,
        price: product.price,
        originalPrice: product.originalPrice,
        quantity: 1,
        image: product.images[0] ?? '',
        emoji: product.emoji || '🎁',
        category: product.category,
        color: product.colors[0]?.label ?? '',
        product_count: product.stockCount,
        is_available: product.inStock,
      });
      setTimeout(() => setAddedId(null), 1800);
    },
    [addItemToCart],
  );

  const activeFiltersCount =
    (activeSubcat != null ? 1 : 0) +
    (onlyInStock ? 1 : 0) +
    (onlyOnSale ? 1 : 0) +
    (onlyNewArrival ? 1 : 0) +
    (onlyBestSeller ? 1 : 0) +
    (priceTouched ? 1 : 0);

  const heroEmojis = bgEmojis.length ? bgEmojis : emoji ? [emoji] : [];
  const headingLabel = activeSubcat?.label ?? title ?? 'All Products';
  const priceMaxLabel =
    priceRange[1] >= maxPrice && maxPrice >= 1000
      ? `${Math.round(maxPrice / 1000)}k+`
      : Math.min(priceRange[1], maxPrice).toLocaleString('en-IN');

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className={styles.page}>
      {/* ── Page header ── */}
      <div className={styles.pageHeader}>
        <div className={styles.pageHeaderInner}>
          <nav className={styles.breadcrumb} aria-label="Breadcrumb">
            <Link href="/">Home</Link>
            <span className={styles.breadSep}>›</span>
            {parentLabel && parentHref && (
              <>
                <Link href={parentHref}>{parentLabel}</Link>
                <span className={styles.breadSep}>›</span>
              </>
            )}
            {activeSubcat && title ? (
              <>
                <span>{title}</span>
                <span className={styles.breadSep}>›</span>
                <span className={styles.breadCurrent}>{activeSubcat.label}</span>
              </>
            ) : (
              <span className={styles.breadCurrent}>{headingLabel}</span>
            )}
          </nav>

          <div className={styles.headerRow}>
            <div>
              <h1 className={styles.pageTitle}>{headingLabel}</h1>
              {description && <p className={styles.pageDesc}>{description}</p>}
            </div>
            {heroEmojis.length > 0 && (
              <div className={styles.headerIllustration} aria-hidden="true">
                {heroEmojis.slice(0, 3).map((e, i) => (
                  <span key={i} className={`${styles.floatEmoji} ${styles[`floatEmoji${i}`]}`}>
                    {e}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Mobile filter trigger ── */}
      <button className={styles.mobileFilterBtn} onClick={() => setSidebarOpen(true)} type="button">
        ⚙ Filters{activeFiltersCount > 0 ? ` (${activeFiltersCount})` : ''}
      </button>

      {/* ── Layout ── */}
      <div className={styles.layout}>
        {/* Sidebar */}
        <aside className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : ''}`}>
          <div className={styles.sidebarHead}>
            <span className={styles.sidebarTitle}>Filters</span>
            <div className={styles.sidebarHeadActions}>
              {activeFiltersCount > 0 && (
                <button className={styles.clearBtn} onClick={clearAll} type="button">
                  Clear all
                </button>
              )}
              <button
                className={styles.sidebarClose}
                onClick={() => setSidebarOpen(false)}
                aria-label="Close filters"
                type="button"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Categories with live counts */}
          {subcategories.length > 0 && (
            <div className={styles.filterGroup}>
              <div className={styles.filterLabel}>Categories</div>
              <button
                className={`${styles.catListItem} ${!activeSubcat ? styles.catListActive : ''}`}
                onClick={() => handleSubcatClick(null)}
                type="button"
              >
                <span>All Products</span>
                <span className={styles.catListCount}>{catTotal}</span>
              </button>
              {subcategories.map((sc) => (
                <button
                  key={sc.slug}
                  className={`${styles.catListItem} ${
                    activeSubcat?.slug === sc.slug ? styles.catListActive : ''
                  }`}
                  onClick={() => handleSubcatClick(sc as SubcategoryDef)}
                  type="button"
                >
                  <span>{sc.label}</span>
                  <span className={styles.catListCount}>{subcatCounts[sc.slug] ?? 0}</span>
                </button>
              ))}
            </div>
          )}

          {/* Price */}
          <div className={styles.filterGroup}>
            <div className={styles.filterLabel}>Price Range</div>
            <div className={styles.priceTrack}>
              <input
                type="range"
                min={0}
                max={maxPrice}
                step={50}
                value={Math.min(priceRange[0], maxPrice)}
                onChange={(e) => handlePriceChange(0, Number(e.target.value))}
                className={styles.rangeSlider}
                aria-label="Minimum price"
              />
              <input
                type="range"
                min={0}
                max={maxPrice}
                step={50}
                value={Math.min(priceRange[1], maxPrice)}
                onChange={(e) => handlePriceChange(1, Number(e.target.value))}
                className={styles.rangeSlider}
                aria-label="Maximum price"
              />
            </div>
            <div className={styles.priceDisplay}>
              <span className={styles.priceTag}>₹{priceRange[0].toLocaleString('en-IN')}</span>
              <span className={styles.priceDash}>—</span>
              <span className={styles.priceTag}>₹{priceMaxLabel}</span>
            </div>
            <div className={styles.pricePresets}>
              {PRICE_PRESETS.map(([mn, mx]) => (
                <button
                  key={`${mn}-${mx}`}
                  className={`${styles.pricePreset} ${
                    priceTouched && priceRange[0] === mn && priceRange[1] === mx
                      ? styles.pricePresetActive
                      : ''
                  }`}
                  onClick={() => applyPreset(mn, mx)}
                  type="button"
                >
                  {mn === 0 ? `Under ₹${mx}` : `₹${mn}–₹${mx === 5000 ? '5k+' : mx}`}
                </button>
              ))}
            </div>
          </div>

          {/* Offers */}
          <div className={styles.filterGroup}>
            <div className={styles.filterLabel}>Offers</div>
            <label className={styles.checkRow}>
              <div className={styles.checkLeft}>
                <input
                  type="checkbox"
                  checked={onlyOnSale}
                  onChange={(e) => {
                    setOnlyOnSale(e.target.checked);
                    setPage(1);
                  }}
                  className={styles.check}
                />
                <span>On Sale</span>
              </div>
            </label>
            <label className={styles.checkRow}>
              <div className={styles.checkLeft}>
                <input
                  type="checkbox"
                  checked={onlyNewArrival}
                  onChange={(e) => {
                    setOnlyNewArrival(e.target.checked);
                    setPage(1);
                  }}
                  className={styles.check}
                />
                <span>New Arrivals</span>
              </div>
            </label>
            <label className={styles.checkRow}>
              <div className={styles.checkLeft}>
                <input
                  type="checkbox"
                  checked={onlyBestSeller}
                  onChange={(e) => {
                    setOnlyBestSeller(e.target.checked);
                    setPage(1);
                  }}
                  className={styles.check}
                />
                <span>Best Seller</span>
              </div>
            </label>
            <label className={styles.checkRow}>
              <div className={styles.checkLeft}>
                <input
                  type="checkbox"
                  checked={onlyInStock}
                  onChange={(e) => {
                    setOnlyInStock(e.target.checked);
                    setPage(1);
                  }}
                  className={styles.check}
                />
                <span>In Stock Only</span>
              </div>
            </label>
          </div>
        </aside>

        {sidebarOpen && <div className={styles.sidebarBackdrop} onClick={() => setSidebarOpen(false)} />}

        {/* Product area */}
        <main className={styles.productArea}>
          {/* Toolbar */}
          <div className={styles.toolbar}>
            <span className={styles.resultCount}>
              {loading ? (
                <span className={styles.loadingText}>Loading…</span>
              ) : totalCount > 0 ? (
                <>
                  Showing{' '}
                  <strong>
                    {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, totalCount)}
                  </strong>{' '}
                  of <strong>{totalCount.toLocaleString()}</strong> products
                </>
              ) : (
                <>No products</>
              )}
            </span>

            <div className={styles.toolbarRight}>
              <div className={styles.viewToggle}>
                <button
                  className={`${styles.viewBtn} ${viewMode === 'grid' ? styles.viewActive : ''}`}
                  onClick={() => setViewMode('grid')}
                  aria-label="Grid view"
                  type="button"
                >
                  ▦
                </button>
                <button
                  className={`${styles.viewBtn} ${viewMode === 'list' ? styles.viewActive : ''}`}
                  onClick={() => setViewMode('list')}
                  aria-label="List view"
                  type="button"
                >
                  ☰
                </button>
              </div>

              <select
                className={styles.sortSelect}
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value);
                  setPage(1);
                }}
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Active filter tags */}
          {activeFiltersCount > 0 && (
            <div className={styles.activeTags}>
              {activeSubcat && (
                <span className={styles.activeTag}>
                  {activeSubcat.label}
                  <button onClick={() => handleSubcatClick(null)} type="button">
                    ×
                  </button>
                </span>
              )}
              {onlyOnSale && (
                <span className={styles.activeTag}>
                  On Sale
                  <button
                    onClick={() => {
                      setOnlyOnSale(false);
                      setPage(1);
                    }}
                    type="button"
                  >
                    ×
                  </button>
                </span>
              )}
              {onlyNewArrival && (
                <span className={styles.activeTag}>
                  New Arrivals
                  <button
                    onClick={() => {
                      setOnlyNewArrival(false);
                      setPage(1);
                    }}
                    type="button"
                  >
                    ×
                  </button>
                </span>
              )}
              {onlyBestSeller && (
                <span className={styles.activeTag}>
                  Best Seller
                  <button
                    onClick={() => {
                      setOnlyBestSeller(false);
                      setPage(1);
                    }}
                    type="button"
                  >
                    ×
                  </button>
                </span>
              )}
              {onlyInStock && (
                <span className={styles.activeTag}>
                  In Stock
                  <button
                    onClick={() => {
                      setOnlyInStock(false);
                      setPage(1);
                    }}
                    type="button"
                  >
                    ×
                  </button>
                </span>
              )}
              {priceTouched && (
                <span className={styles.activeTag}>
                  ₹{priceRange[0].toLocaleString('en-IN')}–₹{priceRange[1].toLocaleString('en-IN')}
                  <button
                    onClick={() => {
                      setPriceTouched(false);
                      setPriceRange([0, maxPrice]);
                      setPage(1);
                    }}
                    type="button"
                  >
                    ×
                  </button>
                </span>
              )}
            </div>
          )}

          {/* Error */}
          {error && (
            <div className={styles.errorBanner}>
              ⚠️ Could not load products.{' '}
              <button onClick={() => setReloadKey((k) => k + 1)} type="button">
                Retry
              </button>
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className={viewMode === 'grid' ? styles.grid : styles.list}>
              {Array.from({ length: PAGE_SIZE }).map((_, i) => (
                <div key={i} className={styles.skeleton}>
                  <div className={styles.skeletonImg} />
                  <div className={styles.skeletonLine} />
                  <div className={styles.skeletonLineShort} />
                </div>
              ))}
            </div>
          )}

          {/* Empty */}
          {!loading && !error && products.length === 0 && (
            <div className={styles.emptyState}>
              <div className={styles.emptyEmoji}>🔍</div>
              <h3>No products found</h3>
              <p>
                {activeSubcat
                  ? `We couldn't find anything in “${activeSubcat.label}” with these filters.`
                  : 'Try adjusting or clearing your filters.'}
              </p>
              {activeFiltersCount > 0 && (
                <button className={styles.emptyBtn} onClick={clearAll} type="button">
                  Clear all filters
                </button>
              )}
            </div>
          )}

          {/* Products (this page) */}
          {!loading && !error && products.length > 0 && (
            <div className={viewMode === 'grid' ? styles.grid : styles.list}>
              {products.map((product) =>
                viewMode === 'grid' ? (
                  <ProductGridCard
                    key={product.id}
                    product={product}
                    wishlisted={wishlist.includes(product.id)}
                    added={addedId === product.id}
                    onWishlist={toggleWishlist}
                    onAdd={addToCart}
                  />
                ) : (
                  <ProductListCard
                    key={product.id}
                    product={product}
                    wishlisted={wishlist.includes(product.id)}
                    added={addedId === product.id}
                    onWishlist={toggleWishlist}
                    onAdd={addToCart}
                  />
                ),
              )}
            </div>
          )}

          {/* Pagination */}
          {!loading && !error && totalCount > 0 && totalPages > 1 && (
            <div className={styles.pagination}>
              <button
                className={styles.pageBtn}
                disabled={page <= 1}
                onClick={() => {
                  setPage((p) => Math.max(1, p - 1));
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                type="button"
              >
                ‹ Prev
              </button>

              {Array.from({ length: totalPages }).map((_, i) => {
                const n = i + 1;
                const show = n === 1 || n === totalPages || (n >= page - 1 && n <= page + 1);
                const gapStart = n === page - 2 && n > 1;
                const gapEnd = n === page + 2 && n < totalPages;
                if (gapStart || gapEnd) {
                  return (
                    <span key={n} className={styles.pageDots}>
                      …
                    </span>
                  );
                }
                if (!show) return null;
                return (
                  <button
                    key={n}
                    className={`${styles.pageBtn} ${n === page ? styles.pageActive : ''}`}
                    onClick={() => {
                      setPage(n);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    type="button"
                  >
                    {n}
                  </button>
                );
              })}

              <button
                className={styles.pageBtn}
                disabled={page >= totalPages}
                onClick={() => {
                  setPage((p) => Math.min(totalPages, p + 1));
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                type="button"
              >
                Next ›
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}