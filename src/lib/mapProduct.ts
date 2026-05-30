// src/lib/mapProduct.ts
// FIX: subcategorySlug now comes from p.sub_category_slug (real DB value)
//      subcategory display name from p.sub_category_name
//      Previously both were set to p.category which caused chip mismatches.

import type { ApiProduct, UiProduct, ProductBadge, ProductImage } from '@/types/product';

const PLACEHOLDER_IMAGE = '/images/placeholder-product.png';

export function extractImageUrls(
  raw: ProductImage[] | string[] | null | undefined
): string[] {
  if (!raw || !Array.isArray(raw)) return [];
  return raw
    .map((img) => (typeof img === 'string' ? img : img?.url ?? ''))
    .filter(Boolean);
}

export function mapProduct(p: ApiProduct): UiProduct {
  const images  = extractImageUrls(p.product_image as ProductImage[]);
  const price   = Math.max(0, (p.original_price ?? 0) - (p.amount_discount ?? 0));
  const discPct = p.percentage_discount > 0
    ? p.percentage_discount
    : p.original_price > 0
      ? Math.round(((p.amount_discount ?? 0) / p.original_price) * 100)
      : 0;

  const badges: ProductBadge[] = [];
  if (discPct >= 5)  badges.push({ label: `-${discPct}%`, type: 'sale' });
  if (p.is_new)      badges.push({ label: 'New',          type: 'new'  });
  if (p.is_featured) badges.push({ label: 'Hot',          type: 'hot'  });

  return {
    id:              String(p.id),
    name:            p.name ?? 'Product',
    category:        p.category ?? '',
    // FIX: use actual subcategory fields from DB, not the parent category text
    subcategory:     p.sub_category_name ?? p.category ?? '',
    subcategorySlug: p.sub_category_slug ?? '',
    price:           price > 0 ? price : p.original_price,
    originalPrice:   p.original_price,
    // CORRECT
    discountPct: discPct,
    stars:           4,
    reviews:         0,
    brand:           p.brand     ?? 'Little Loot',
    ageRange:        p.age_range ?? '3+ yrs',
    inStock:         (p.count ?? 0) > 0,
    stockCount:      p.count ?? 0,
    images:          images.length > 0 ? images : [PLACEHOLDER_IMAGE],
    badges,
    description:     p.description ?? '',
  };
}

export function mapProducts(list: ApiProduct[]): UiProduct[] {
  return list.map(mapProduct);
}