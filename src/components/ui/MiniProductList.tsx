import Link from 'next/link';
import styles from './MiniProductList.module.css';

/* ─── Types ──────────────────────────────────────────────────────── */
interface DBProduct {
  id: string;
  name: string;
  emoji?: string;
  stars?: number;
  rating?: number;
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

/* ─── Icon map ───────────────────────────────────────────────────── */
const TITLE_ICONS: Record<string, string> = {
  'Latest':        '🕐',
  'Bestsellers':   '👑',
  'Special Picks': '⭐',
};

/* ─── Data fetch ──────────────────────────────────────────────────── */
async function fetchProducts(
  sort: SortBy = 'featured',
  limit: number = 6,
  categorySlug?: string,
): Promise<DBProduct[]> {
  try {
    const base = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';

    const params = new URLSearchParams({
      sort_by: sort,
      limit:   String(limit),
      skip:    '0',
    });
    if (categorySlug) params.set('category_slug', categorySlug);

    const url = `${base}/api/product/all?${params.toString()}`;
    const res = await fetch(url, { next: { revalidate: 60 } });

    if (!res.ok) {
      console.error(`[MiniProductList] fetch failed: ${res.status} ${url}`);
      return [];
    }

    const json: ApiResponse = await res.json();
    return Array.isArray(json) ? json : (json.data ?? []);
  } catch (err) {
    console.error('[MiniProductList] fetch error:', err);
    return [];
  }
}

/* ─── Helpers ────────────────────────────────────────────────────── */
function getPrice(p: DBProduct) {
  const now  = p.original_price - (p.amount_discount ?? 0);
  const orig = (p.amount_discount ?? 0) > 0 ? p.original_price : null;
  return { now, orig };
}

/* ─── Component ──────────────────────────────────────────────────── */
export default async function MiniProductList({
  title,
  sort        = 'featured',
  limit       = 6,
  categorySlug,
}: Props) {
  const products = await fetchProducts(sort, limit, categorySlug);
  const icon     = TITLE_ICONS[title] ?? '🏷️';

  const seeAllHref = categorySlug
    ? `/category/${categorySlug}?sort_by=${sort}`
    : `/products?sort_by=${sort}`;

  return (
    <div className={styles.miniSection}>

      {/* ── Header ── */}
      <div className={styles.miniSectionTitle}>
        <div className={styles.titleLeft}>
          <span className={styles.titleIcon}>{icon}</span>
          <span className={styles.titleText}>{title}</span>
        </div>
        <Link href={seeAllHref} className={styles.seeAll}>
          See All →
        </Link>
      </div>

      {/* ── Empty state ── */}
      {products.length === 0 && (
        <div className={styles.empty}>No products found.</div>
      )}

      {/* ── Rows ── */}
      {products.map((p) => {
        const { now, orig } = getPrice(p);
        const img           = p.product_image?.[0]?.url ?? null;

        return (
          <Link
            key={p.id}
            href={`/product/${p.id}`}
            className={styles.miniProduct}
          >
            {/* Thumbnail */}
            <div className={styles.miniThumb}>
              {img ? (
                <img
                  src={img}
                  alt={p.name}
                  className={styles.miniThumbImg}
                  loading="lazy"
                />
              ) : (
                <span className={styles.miniThumbEmoji}>
                  {p.emoji ?? '🎁'}
                </span>
              )}
            </div>

            {/* Info */}
            <div className={styles.miniInfo}>
              <div className={styles.miniName}>{p.name}</div>
              <div className={styles.miniPrice}>
                <span className={styles.miniNow}>
                  ₹{now.toLocaleString('en-IN')}
                </span>
                {orig && (
                  <span className={styles.miniOriginal}>
                    ₹{orig.toLocaleString('en-IN')}
                  </span>
                )}
              </div>
            </div>

            {/* Chevron */}
            <span className={styles.miniArrow}>›</span>
          </Link>
        );
      })}

    </div>
  );
}