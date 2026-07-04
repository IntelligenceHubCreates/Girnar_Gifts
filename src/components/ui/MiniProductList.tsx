import Link from 'next/link';
import { computePricing, fmtINR } from '@/lib/normalise';
import styles from './MiniProductList.module.css';

interface DBProduct {
  id: string;
  name: string;
  emoji?: string;
  original_price: number;
  amount_discount?: number;
  percentage_discount?: number;
  product_image?: { url: string }[];
  category?: string;
  count?: number;
  is_featured?: boolean;
  is_active?: boolean;
}

interface ApiResponse { data: DBProduct[]; totalCount: number; page?: number; limit?: number; }

type SortBy = 'featured' | 'newest' | 'price_asc' | 'price_desc';

interface Props {
  title:         string;
  sort?:         SortBy;
  limit?:        number;
  categorySlug?: string;
}

/**
 * PRODUCTION SAFETY: no localhost fallback. If the API URL is missing,
 * fail loudly at request time so misconfiguration is visible in logs,
 * instead of silently rendering an empty homepage.
 */
function apiBase(): string {
  const base = process.env.NEXT_PUBLIC_API_URL;
  if (!base) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('[MiniProductList] NEXT_PUBLIC_API_URL is not set in production.');
    }
    return 'http://localhost:8000'; // dev convenience only
  }
  return base;
}

async function fetchProducts(sort: SortBy, limit: number, categorySlug?: string): Promise<DBProduct[]> {
  try {
    const params = new URLSearchParams({ sort_by: sort, limit: String(limit), skip: '0' });
    if (categorySlug) params.set('category_slug', categorySlug);

    const res = await fetch(`${apiBase()}/api/product/all?${params}`, { next: { revalidate: 60 } });
    if (!res.ok) return [];
    const json: ApiResponse = await res.json();
    const list = Array.isArray(json) ? json : (json.data ?? []);
    // Defence in depth: never promote inactive products even if the
    // backend forgets to filter. (Backend should also filter — see notes.)
    return list.filter((p) => p.is_active !== false);
  } catch (err) {
    console.error('[MiniProductList] fetch failed:', err);
    return [];
  }
}

export default async function MiniProductList({ title, sort = 'featured', limit = 5, categorySlug }: Props) {
  const products   = await fetchProducts(sort, limit, categorySlug);
  const seeAllHref = categorySlug
    ? `/category/${categorySlug}?sort_by=${sort}`
    : `/products?sort_by=${sort}`;

  return (
    <section className={styles.section}>
      <div className={styles.header}>
        <div className={styles.titleGroup}>
          <div className={styles.titleRow}>
            <h2 className={styles.title}>{title}</h2>
          </div>
          <span className={styles.titleUnderline} />
        </div>
        <Link href={seeAllHref} className={styles.viewAll}>
          View All
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M5 12h14M13 6l6 6-6 6"/>
          </svg>
        </Link>
      </div>

      {products.length === 0 ? (
        <p className={styles.empty}>No products found.</p>
      ) : (
        <div className={styles.track}>
          {products.map((p) => {
            // Same pricing rule as every other section (fixes C4).
            const { original, selling, effectivePct } = computePricing(p);
            const hasDiscount = selling < original;
            const img = p.product_image?.[0]?.url ?? null;
            const outOfStock = (p.count ?? 1) <= 0;

            return (
              <Link key={p.id} href={`/product/${p.id}`} className={styles.card}>
                {hasDiscount && <span className={styles.badge}>{effectivePct}% off</span>}
                {outOfStock && <span className={styles.oosBadge}>Out of stock</span>}

                <div className={styles.imgWrap}>
                  {img
                    ? <img src={img} alt={p.name} className={styles.img} loading="lazy" draggable={false} />
                    : <span className={styles.emoji}>{p.emoji ?? '🎁'}</span>
                  }
                </div>

                <div className={styles.info}>
                  <p className={styles.name}>{p.name}</p>
                  <div className={styles.priceRow}>
                    <span className={styles.price}>₹{fmtINR(selling)}</span>
                    {hasDiscount && <span className={styles.mrp}>₹{fmtINR(original)}</span>}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}