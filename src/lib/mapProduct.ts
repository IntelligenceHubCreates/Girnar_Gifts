// src/lib/mapProduct.ts
// ---------------------------------------------------------------------------
// Maps a raw ApiProduct into a UI-ready UiProduct.
// Fixes vs. previous version:
//   • Discount is derived from a SINGLE source of truth (amount OR percentage),
//     so the "-X%" badge can never contradict the displayed price.
//   • Colours are populated (single colour_hex OR color_variants array), so the
//     product-card swatches actually render.
//   • stars/reviews come from the backend rating aggregate when present, and are
//     0 otherwise (no more fake "4 stars on everything").
//   • Adds isNew / isFeatured / createdAt for honest filtering & sorting.
// ---------------------------------------------------------------------------

import type {
  ApiProduct,
  UiProduct,
  ProductBadge,
  ProductImage,
  ProductColor,
  ApiColorVariant,
} from '@/types/products';

const PLACEHOLDER_IMAGE = '/placeholder-product.png';

/** Pull plain URL strings out of the product_image field (objects OR strings). */
function extractImageUrls(raw: ProductImage[] | string[] | null | undefined): string[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((img) => (typeof img === 'string' ? img : img?.url))
    .filter((u): u is string => typeof u === 'string' && u.length > 0);
}

/** Build a ProductColor[] from either color_variants (array) or a single color_hex. */
function normaliseColors(p: ApiProduct): ProductColor[] {
  const cv = p.color_variants;

  if (Array.isArray(cv) && cv.length > 0) {
    return cv
      .map((c): ProductColor | null => {
        if (typeof c === 'string') {
          return c ? { hex: c } : null;
        }
        const v = c as ApiColorVariant;
        const hex = v.hex ?? v.color_hex ?? v.color ?? '';
        if (!hex) return null;
        const image =
          v.image ?? v.imageUrl ?? (Array.isArray(v.images) ? v.images[0] : undefined);
        const label = v.label ?? v.name ?? v.color ?? undefined;
        return { hex, image, label };
      })
      .filter((c): c is ProductColor => c !== null);
  }

  if (p.color_hex) {
    return [{ hex: p.color_hex, label: p.color ?? undefined }];
  }
  return [];
}

export function mapProduct(p: ApiProduct): UiProduct {
  const images   = extractImageUrls(p.product_image as ProductImage[]);
  const original = p.original_price ?? 0;
  const pctOff   = p.percentage_discount ?? 0;
  const amtOff   = p.amount_discount ?? 0;

  // Single source of truth for the discount amount in rupees.
  const amountOff =
    amtOff > 0
      ? amtOff
      : pctOff > 0 && original > 0
        ? Math.round((original * pctOff) / 100)
        : 0;

  const price = Math.max(0, original - amountOff);
  const discountPct =
    original > 0 && amountOff > 0 ? Math.round((amountOff / original) * 100) : 0;

  const badges: ProductBadge[] = [];
  if (discountPct >= 5) badges.push({ label: `-${discountPct}%`, type: 'sale' });
  if (p.is_new)         badges.push({ label: 'New',             type: 'new' });
  if (p.is_featured)    badges.push({ label: 'Bestseller',      type: 'hot' });

  const avg       = typeof p.average_rating === 'number' ? p.average_rating : 0;
  const reviews   = typeof p.review_count === 'number' ? p.review_count : 0;
  const createdMs = p.created_at ? Date.parse(p.created_at) : 0;

  return {
    id:              String(p.id),
    name:            p.name ?? 'Product',
    category:        p.category ?? '',
    subcategory:     p.sub_category_name ?? p.category ?? '',
    subcategorySlug: p.sub_category_slug ?? '',
    price:           price > 0 ? price : original,
    originalPrice:   original,
    discountPct,
    stars:           Math.round(avg),
    reviews,
    brand:           p.brand ?? 'Little Loot',
    ageRange:        p.age_range ?? '3+ yrs',
    inStock:         (p.count ?? 0) > 0,
    stockCount:      p.count ?? 0,
    images:          images.length > 0 ? images : [PLACEHOLDER_IMAGE],
    badges,
    description:     p.description ?? '',
    colors:          normaliseColors(p),
    isNew:           !!p.is_new,
    isFeatured:      !!p.is_featured,
    createdAt:       Number.isFinite(createdMs) ? createdMs : 0,
    emoji:           '🎁',
    bgGradient:      false,
  };
}

/** Map an array safely (guards against a non-array payload). */
export function mapProducts(list: ApiProduct[] | null | undefined): UiProduct[] {
  if (!Array.isArray(list)) return [];
  return list.map(mapProduct);
}