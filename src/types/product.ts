// src/types/product.ts
// FIX: Added sub_category_slug + sub_category_name to ApiProduct.
//      Added SubcategoryDef interface for the slug→label mapping.

export interface ProductImage {
  url: string;
  public_id?: string;
}

export interface ApiProduct {
  id: string;
  name: string;
  category_id: string | null;
  category: string | null;
  // FIX: these come from the new columns on the products table
  sub_category_slug: string | null;
  sub_category_name: string | null;
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
  created_at: string | null;
}

export interface ApiProductListResponse {
  data: ApiProduct[];
  totalCount: number;
  page: number;
  limit: number;
}

export interface UiProduct {
  colors: string[];
  bgGradient: boolean;
  emoji: string;
  id: string;
  name: string;
  category: string;
  subcategory: string;       // display name e.g. "Puzzles"
  subcategorySlug: string;   // slug e.g. "puzzles"  ← FIX: was missing
  price: number;
  originalPrice: number;
  discountPct: number;
  stars: number;
  reviews: number;
  brand: string;
  ageRange: string;
  inStock: boolean;
  stockCount: number;
  images: string[];
  badges: ProductBadge[];
  description: string;
}

export interface ProductBadge {
  label: string;
  type: 'sale' | 'new' | 'hot';
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

/**
 * FIX: Maps a display label to its backend slug.
 * Used in CategoryPageProps.subcategories.
 * Example: { label: "School Bags", slug: "school-bags" }
 */
export interface SubcategoryDef {
  label: string;   // shown in UI chip
  slug: string;    // sent to API as ?sub_slug=
}

export interface ProductQueryParams {
  category_slug?: string;
  sub_slug?: string;        // FIX: sub-category slug for deep filtering
  category?: string;
  limit?: number;
  skip?: number;
  sort_by?: 'featured' | 'price_asc' | 'price_desc' | 'newest' | 'rating';
  in_stock?: boolean;
  on_sale?: boolean;
}

export interface ProductColor {
  hex:      string;   // CSS color, e.g. "#7A1E33"
  image?:   string;   // URL of the variant image shown when this color is selected
  label?:   string;   // Human-readable name, e.g. "Coral Red"
}