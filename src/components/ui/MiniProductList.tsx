import Link from 'next/link';
import styles from './MiniProductList.module.css';

/* ─── Types ───────────────────────────────────────────────────── */
interface DBProduct {
  id: string;
  name: string;
  emoji?: string;
  original_price: number;
  amount_discount?: number;
  product_image?: { url: string }[];
  category?: string;
  is_featured?: boolean;
  is_active?: boolean;
}

interface ApiResponse {
  data: DBProduct[];
  totalCount: number;
  page?: number;
  limit?: number;
}

type SortBy = 'featured' | 'newest' | 'price_asc' | 'price_desc';

interface Props {
  title:         string;
  sort?:         SortBy;
  limit?:        number;
  categorySlug?: string;
}

/* ─── Fetch ───────────────────────────────────────────────────── */
async function fetchProducts(
  sort: SortBy = 'featured',
  limit = 8,
  categorySlug?: string,
): Promise<DBProduct[]> {
  try {
    const base   = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';
    const params = new URLSearchParams({ sort_by: sort, limit: String(limit), skip: '0' });
    if (categorySlug) params.set('category_slug', categorySlug);

    const res = await fetch(`${base}/api/product/all?${params}`, { next: { revalidate: 60 } });
    if (!res.ok) return [];
    const json: ApiResponse = await res.json();
    return Array.isArray(json) ? json : (json.data ?? []);
  } catch {
    return [];
  }
}

function getPrice(p: DBProduct) {
  const discount = p.amount_discount ?? 0;
  const now      = Math.max(0, p.original_price - discount);
  const orig     = discount > 0 ? p.original_price : null;
  const pct      = orig ? Math.round((discount / orig) * 100) : 0;
  return { now, orig, pct };
}

/* ─── Component ───────────────────────────────────────────────── */
export default async function MiniProductList({ title, sort = 'featured', limit = 5, categorySlug }: Props) {
  const products   = await fetchProducts(sort, limit, categorySlug);
  const seeAllHref = categorySlug ? `/category/${categorySlug}?sort_by=${sort}` : `/products?sort_by=${sort}`;

  return (
    <section className={styles.section}>

      {/* Header */}
      <div className={styles.header}>
        <div className={styles.titleGroup}>
          <span className={styles.starIcon} aria-hidden="true">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="#F97316">
              <path d="M10 1l2.39 4.84 5.34.78-3.87 3.77.91 5.32L10 13.27l-4.77 2.44.91-5.32L2.27 6.62l5.34-.78L10 1z"/>
            </svg>
          </span>
          <h2 className={styles.title}>{title}</h2>
        </div>
        <Link href={seeAllHref} className={styles.viewAll}>
          View All
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M5 12h14M13 6l6 6-6 6"/>
          </svg>
        </Link>
      </div>

      {/* Cards */}
      {products.length === 0 ? (
        <p className={styles.empty}>No products found.</p>
      ) : (
        <div className={styles.track}>
          {products.map((p) => {
            const { now, orig, pct } = getPrice(p);
            const img = p.product_image?.[0]?.url ?? null;

            return (
              <Link key={p.id} href={`/product/${p.id}`} className={styles.card}>

                {/* Discount badge */}
                {orig && <span className={styles.badge}>{pct}% off</span>}

                {/* Image — LEFT */}
                <div className={styles.imgWrap}>
                  {img
                    ? <img src={img} alt={p.name} className={styles.img} loading="lazy" draggable={false} />
                    : <span className={styles.emoji}>{p.emoji ?? '🎁'}</span>
                  }
                </div>

                {/* Text — RIGHT */}
                <div className={styles.info}>
                  <p className={styles.name}>{p.name}</p>
                  <div className={styles.priceRow}>
                    <span className={styles.price}>₹{now.toLocaleString('en-IN')}</span>
                    {orig && <span className={styles.mrp}>₹{orig.toLocaleString('en-IN')}</span>}
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