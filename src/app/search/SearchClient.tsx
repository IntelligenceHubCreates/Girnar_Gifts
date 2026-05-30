'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from './SearchPage.module.css';

interface Product {
  id: string;
  name: string;
  category?: string;
  sub_category_name?: string;
  original_price?: number;
  amount_discount?: number;
  product_image?: Array<{ url: string; public_id?: string } | string>;
  brand?: string;
  is_featured?: boolean;
  count?: number;
}

const SORT_OPTIONS = [
  { value: 'featured',   label: 'Featured' },
  { value: 'price_asc',  label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'newest',     label: 'Newest First' },
];

const PAGE_SIZE = 20;

// Direct backend URL — browser calls FastAPI directly (no Next.js proxy needed)
// Set NEXT_PUBLIC_BACKEND_URL=http://localhost:8000 in .env.local
const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:8000';

function getImgUrl(imgs: Product['product_image']): string | null {
  if (!imgs?.length) return null;
  const f = imgs[0];
  return typeof f === 'string' ? f : (f as any)?.url ?? null;
}

function Highlight({ text, query }: { text: string; query: string }) {
  if (!query.trim()) return <>{text}</>;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <mark className={styles.highlight}>{text.slice(idx, idx + query.length)}</mark>
      {text.slice(idx + query.length)}
    </>
  );
}

export default function SearchClient() {
  const searchParams = useSearchParams();
  const router       = useRouter();
  const q            = searchParams.get('q') ?? '';

  const [products,   setProducts]   = useState<Product[]>([]);
  const [loading,    setLoading]    = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [page,       setPage]       = useState(1);
  const [sortBy,     setSortBy]     = useState('featured');
  const [addedId,    setAddedId]    = useState<string | null>(null);
  const [inputVal,   setInputVal]   = useState(q);
  const abortRef = useRef<AbortController | null>(null);

  const fetchResults = useCallback(async (query: string, pg: number, sort: string) => {
    if (!query.trim()) { setProducts([]); setTotalCount(0); return; }

    abortRef.current?.abort();
    abortRef.current = new AbortController();
    setLoading(true);

    try {
      const params = new URLSearchParams({
        q:       query.trim(),
        limit:   String(PAGE_SIZE),
        skip:    String((pg - 1) * PAGE_SIZE),
        sort_by: sort,
      });

      // Call FastAPI directly from browser — works on localhost and Vercel
      // (Vercel: set NEXT_PUBLIC_BACKEND_URL to your deployed API URL)
      const res  = await fetch(`${BACKEND}/api/product/search?${params}`, {
        signal: abortRef.current.signal,
      });

      const json = await res.json();
      const list: Product[] = Array.isArray(json) ? json : (json?.data ?? []);
      setProducts(list);
      setTotalCount(Array.isArray(json) ? list.length : (json?.totalCount ?? list.length));
    } catch (e: any) {
      if (e?.name !== 'AbortError') { setProducts([]); setTotalCount(0); }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { setPage(1); setInputVal(q); }, [q]);
  useEffect(() => { fetchResults(q, page, sortBy); }, [q, page, sortBy, fetchResults]);

  function addToCart(e: React.MouseEvent, product: Product) {
    e.preventDefault();
    setAddedId(product.id);
    fetch(`${BACKEND}/api/cart/items`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ product_id: product.id, quantity: 1 }),
      credentials: 'include',
    }).catch(() => {});
    setTimeout(() => setAddedId(null), 1800);
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (inputVal.trim()) router.push(`/search?q=${encodeURIComponent(inputVal.trim())}`);
  }

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  return (
    <div className={styles.page}>
      <div className={styles.searchHeader}>
        <form className={styles.searchForm} onSubmit={handleSearch}>
          <input
            className={styles.searchInput}
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            placeholder="Search for toys, stationery, games…"
            aria-label="Search"
          />
          <button className={styles.searchBtn} type="submit">🔍 Search</button>
        </form>
      </div>

      <div className={styles.metaRow}>
        <div className={styles.metaLeft}>
          {loading && <span className={styles.resultMeta}>Searching…</span>}
          {!loading && q && (
            <span className={styles.resultMeta}>
              {totalCount > 0
                ? <>{totalCount} result{totalCount !== 1 ? 's' : ''} for <strong>"{q}"</strong></>
                : <>No results for <strong>"{q}"</strong></>}
            </span>
          )}
        </div>
        <div className={styles.metaRight}>
          <label className={styles.sortLabel}>Sort:</label>
          <select className={styles.sortSelect} value={sortBy} onChange={(e) => { setSortBy(e.target.value); setPage(1); }}>
            {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
      </div>

      {loading && (
        <div className={styles.grid}>
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className={styles.skeletonCard}>
              <div className={styles.skeletonImg} />
              <div className={styles.skeletonBody}>
                <div className={`${styles.skeletonLine} ${styles.skeletonShort}`} />
                <div className={`${styles.skeletonLine} ${styles.skeletonMed}`} />
                <div className={`${styles.skeletonLine} ${styles.skeletonFull}`} />
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && q && products.length === 0 && (
        <div className={styles.empty}>
          <div className={styles.emptyEmoji}>🔍</div>
          <h2 className={styles.emptyTitle}>No products found</h2>
          <p className={styles.emptyText}>We couldn't find anything for <strong>"{q}"</strong>.<br />Try different keywords or browse a category.</p>
          <Link href="/" className={styles.emptyBtn}>Back to Home</Link>
        </div>
      )}

      {!loading && !q && (
        <div className={styles.empty}>
          <div className={styles.emptyEmoji}>🛍️</div>
          <h2 className={styles.emptyTitle}>What are you looking for?</h2>
          <p className={styles.emptyText}>Type something above to find products.</p>
        </div>
      )}

      {!loading && products.length > 0 && (
        <>
          <div className={styles.grid}>
            {products.map((product) => {
              const imgUrl   = getImgUrl(product.product_image);
              const price    = product.original_price != null ? product.original_price - (product.amount_discount ?? 0) : null;
              const origPrice = (product.amount_discount ?? 0) > 0 ? product.original_price : null;
              const catLabel = product.sub_category_name || product.category;
              const inStock  = (product.count ?? 1) > 0;
              const wasAdded = addedId === product.id;
              return (
                <Link key={product.id} href={`/product/${product.id}`} className={styles.cardLink}>
                  <article className={styles.card}>
                    <div className={styles.imgWrap}>
                      {imgUrl ? <img src={imgUrl} alt={product.name} className={styles.img} /> : <span className={styles.imgFallback}>🎁</span>}
                      {!inStock && <div className={styles.outOfStock}>Out of Stock</div>}
                      {(product.amount_discount ?? 0) > 0 && product.original_price && (
                        <span className={styles.discountBadge}>−{Math.round((product.amount_discount! / product.original_price) * 100)}%</span>
                      )}
                    </div>
                    <div className={styles.cardBody}>
                      {catLabel && <span className={styles.category}>{catLabel}</span>}
                      <h3 className={styles.name}><Highlight text={product.name} query={q} /></h3>
                      {product.brand && <div className={styles.brand}>{product.brand}</div>}
                      <div className={styles.priceRow}>
                        {price != null && <span className={styles.price}>₹{price.toLocaleString('en-IN')}</span>}
                        {origPrice != null && <span className={styles.origPrice}>₹{origPrice.toLocaleString('en-IN')}</span>}
                      </div>
                      <button
                        className={`${styles.addBtn} ${!inStock ? styles.addBtnDisabled : ''} ${wasAdded ? styles.addBtnAdded : ''}`}
                        onClick={(e) => addToCart(e, product)}
                        disabled={!inStock}
                        type="button"
                      >
                        {wasAdded ? '✓ Added!' : inStock ? '🛒 Add to Cart' : '📩 Notify Me'}
                      </button>
                    </div>
                  </article>
                </Link>
              );
            })}
          </div>

          {totalPages > 1 && (
            <div className={styles.pagination}>
              <button className={styles.pageBtn} onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} type="button">‹ Prev</button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                .reduce<(number | '…')[]>((acc, p, i, arr) => { if (i > 0 && p - (arr[i-1] as number) > 1) acc.push('…'); acc.push(p); return acc; }, [])
                .map((p, i) => p === '…'
                  ? <span key={`e${i}`} className={styles.pageEllipsis}>…</span>
                  : <button key={p} className={`${styles.pageNum} ${p === page ? styles.pageActive : ''}`} onClick={() => setPage(p as number)} type="button">{p}</button>
                )}
              <button className={styles.pageBtn} onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} type="button">Next ›</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}