import type { UiProduct } from '@/types/product';

const PLACEHOLDER = '/images/placeholder-product.png';

/** Compute selling price from original + discounts. One rule everywhere. */
export function computePricing(p: any) {
  const original = Number(p.original_price ?? p.price ?? 0);
  const amtOff   = Number(p.amount_discount ?? 0);
  const pctOff   = Number(p.percentage_discount ?? 0);

  let selling = original;
  if (amtOff > 0)      selling = original - amtOff;
  else if (pctOff > 0) selling = Math.round(original - (original * pctOff) / 100);
  selling = Math.max(0, Math.min(selling, original));

  // Effective % always derived from actual prices, so amount-based
  // discounts never render "0% OFF" (fixes H5).
  const effectivePct =
    original > 0 && selling < original
      ? Math.round(((original - selling) / original) * 100)
      : 0;

  return { original, selling: selling > 0 ? selling : original, effectivePct };
}

export function normaliseProduct(p: any): UiProduct & { colors: string[] } {
  const { original, selling, effectivePct } = computePricing(p);

  const rawImages = p.product_image ?? p.images ?? [];
  const images: string[] = Array.isArray(rawImages)
    ? rawImages
        .map((img: any) => (typeof img === 'string' ? img : img?.url ?? img?.secure_url ?? ''))
        .filter(Boolean)
    : [];

  const badges: { label: string; type: string }[] = Array.isArray(p.badges)
    ? p.badges
    : effectivePct > 0
    ? [{ label: `${effectivePct}% OFF`, type: 'sale' }]
    : [];

  const stockCount = Number(p.count ?? p.stock ?? p.quantity ?? 0);

  const colors: string[] =
    Array.isArray(p.color_variants) && p.color_variants.length > 0
      ? p.color_variants.map((v: any) => v.hex).filter(Boolean)
      : p.color_hex ? [p.color_hex] : [];

  return {
    id:              String(p.id ?? ''),
    name:            String(p.name ?? ''),
    price:           selling,
    originalPrice:   original,
    images,
    brand:           String(p.brand ?? p.brand_name ?? ''),
    category:        String(p.category ?? ''),
    subcategory:     String(p.sub_category_name ?? p.sub_category_slug ?? p.subcategory ?? p.category ?? ''),
    subcategorySlug: String(p.sub_category_slug ?? p.subcategory_slug ?? ''),
    ageRange:        String(p.age_range ?? p.ageRange ?? ''),
    stars:           Math.min(5, Math.max(0, Number(p.stars ?? p.rating ?? 0))),
    reviews:         Number(p.reviews ?? p.review_count ?? p.reviewCount ?? 0),
    inStock:         stockCount > 0,
    stockCount,
    badges,
    bgGradient:      Boolean(p.bg_gradient ?? p.bgGradient),
    description:     String(p.description ?? ''),
    emoji:           String(p.emoji ?? ''),
    discountPct:     effectivePct,   // now always the *effective* pct
    colors,
    colorVariants:   p.color_variants ?? [],
  } as UiProduct & { colors: string[] };
}

/** Unwrap the various list-response envelopes your API returns. */
export function unwrapList(res: any): any[] {
  if (Array.isArray(res)) return res;
  if (Array.isArray(res?.data)) return res.data;
  if (Array.isArray(res?.products)) return res.products;
  if (Array.isArray(res?.items)) return res.items;
  return [];
}

export const fmtINR = (n: number) =>
  Number.isFinite(n) && n > 0 ? n.toLocaleString('en-IN') : '0';

export { PLACEHOLDER };