// src/types/product.ts
// ---------------------------------------------------------------------------
// Shared product/category types for Girnar Gifts.
// Fixes vs. previous version:
//   • ApiProduct now declares the fields the backend ACTUALLY returns
//     (color, color_hex, color_variants, variant_group_id, product_video,
//      is_active) plus optional rating aggregates.
//   • UiProduct.colors is now ProductColor[] (was string[]) and carries
//     isNew / isFeatured / createdAt so sorting & filtering are real.
//   • ProductQueryParams accepts an AbortSignal so requests can be cancelled.
// ---------------------------------------------------------------------------

export interface ProductImage {
  url: string;
  public_id?: string;
}

/**
 * Shape of an entry inside Product.color_variants (admin-authored JSON).
 * Intentionally loose — the admin panel has historically written a few
 * different shapes, so the mapper normalises all of them.
 */
export interface ApiColorVariant {
  color?: string;
  hex?: string;
  color_hex?: string;
  label?: string;
  name?: string;
  image?: string;
  imageUrl?: string;
  images?: string[];
}

/** Raw product object as returned by the FastAPI product/category endpoints. */
export interface ApiProduct {
  id: string;
  name: string;
  category_id: string | null;
  category: string | null;
  sub_category_slug: string | null;
  sub_category_name: string | null;
  variant_group_id?: string | null;
  color?: string | null;
  color_hex?: string | null;
  color_variants?: ApiColorVariant[] | string[];
  product_video?: string | null;
  description: string | null;
  details: string[];
  original_price: number;
  amount_discount: number;
  percentage_discount: number;
  count: number;
  product_image: ProductImage[] | string[];
  brand: string | null;
  age_range: string | null;
  is_new: boolean;
  is_featured: boolean;
  is_active?: boolean;
  // Present once the backend rating aggregation is enabled (see backend notes).
  average_rating?: number;
  review_count?: number;
  created_at: string | null;
}

/** Envelope returned by the list endpoints. */
export interface ApiProductListResponse {
  data: ApiProduct[];
  totalCount: number;
  page: number;
  limit: number;
}

export interface ProductBadge {
  label: string;
  type: 'sale' | 'new' | 'hot';
}

export interface ProductColor {
  hex: string;
  image?: string;
  label?: string;
}

/** Normalised, UI-ready product. */
export interface UiProduct {
  id: string;
  name: string;
  category: string;
  subcategory: string;        // display name, e.g. "Puzzles"
  subcategorySlug: string;    // slug, e.g. "puzzles"
  price: number;              // final price after discount
  originalPrice: number;
  discountPct: number;
  stars: number;              // rounded average rating (0 when no reviews)
  reviews: number;            // review count
  brand: string;
  ageRange: string;
  inStock: boolean;
  stockCount: number;
  images: string[];
  badges: ProductBadge[];
  description: string;
  colors: ProductColor[];
  isNew: boolean;
  isFeatured: boolean;
  createdAt: number;          // epoch ms (0 when unknown) — used for "Newest" sort
  emoji?: string;
  bgGradient?: boolean;
}

export interface ApiCategory {
  id: string;
  name: string;
  slug: string;
  parent_id: string | null;
  emoji: string | null;
  description: string | null;
  sort_order: number;
  is_active: boolean;
  children: ApiCategory[];
}

/** Maps a display label to its backend slug (used by CategoryPageProps.subcategories). */
export interface SubcategoryDef {
  label: string;
  slug: string;
}

export interface ProductQueryParams {
  category_slug?: string;
  sub_slug?: string;
  category?: string;
  limit?: number;
  skip?: number;
  /** 1-based page number. The listing endpoints paginate by `page`; `skip` is sent too for safety. */
  page?: number;
  sort_by?: 'featured' | 'price_asc' | 'price_desc' | 'newest' | 'rating';
  in_stock?: boolean;
  on_sale?: boolean;
  is_new?: boolean;
  is_featured?: boolean;
  min_price?: number;
  max_price?: number;
  signal?: AbortSignal;
}