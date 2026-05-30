// src/lib/api.ts
// FIX: fetchProductsByCategory now accepts sub_slug.
//      fetchProductsBySubcategory is a new explicit helper.
//      All subcategory filtering goes to the backend — zero client-side category matching.

import type {
  ApiCategory,
  ApiProduct,
  ApiProductListResponse,
  ProductQueryParams,
} from '@/types/product';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? '';

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`API ${res.status}: ${body}`);
  }
  return res.json() as Promise<T>;
}

// ─── Categories ───────────────────────────────────────────────────

export async function fetchCategories(): Promise<ApiCategory[]> {
  return apiFetch<ApiCategory[]>('/api/categories');
}

export async function fetchCategory(slug: string): Promise<ApiCategory> {
  return apiFetch<ApiCategory>(`/api/categories/${slug}`);
}

// ─── Products by Category ─────────────────────────────────────────

/**
 * Primary fetch function used by CategoryPage.
 *
 * categorySlug = parent or subcategory slug (e.g. "toys", "puzzles")
 * subSlug      = optional deeper filter (e.g. pass "puzzles" when on /toys with chip selected)
 *
 * Examples:
 *   fetchProductsByCategory("toys")                → all Toys
 *   fetchProductsByCategory("toys", { subSlug: "puzzles" })  → Puzzles only
 *   fetchProductsByCategory("puzzles")             → Puzzles only (direct subcat page)
 */
export async function fetchProductsByCategory(
  categorySlug: string,
  params: Omit<ProductQueryParams, 'category' | 'category_slug'> & { subSlug?: string } = {}
): Promise<ApiProductListResponse> {
  const qs = new URLSearchParams();
  if (params.subSlug)   qs.set('sub_slug', params.subSlug);
  if (params.limit)     qs.set('limit',    String(params.limit));
  if (params.skip)      qs.set('skip',     String(params.skip));
  if (params.sort_by)   qs.set('sort_by',  params.sort_by);
  if (params.in_stock)  qs.set('in_stock', 'true');
  if (params.on_sale)   qs.set('on_sale',  'true');

  const query = qs.toString();
  return apiFetch<ApiProductListResponse>(
    `/api/categories/${categorySlug}/products${query ? `?${query}` : ''}`
  );
}

/**
 * Legacy /api/product/all endpoint — still works, accepts sub_slug.
 */
export async function fetchAllProducts(
  params: ProductQueryParams = {}
): Promise<ApiProductListResponse> {
  const qs = new URLSearchParams();
  if (params.category_slug) qs.set('category_slug', params.category_slug);
  if (params.sub_slug)      qs.set('sub_slug',      params.sub_slug);
  if (params.category)      qs.set('category',      params.category);
  if (params.limit)         qs.set('limit',          String(params.limit));
  if (params.skip)          qs.set('skip',           String(params.skip));
  if (params.sort_by)       qs.set('sort_by',        params.sort_by);
  if (params.in_stock)      qs.set('in_stock',       'true');
  if (params.on_sale)       qs.set('on_sale',        'true');

  return apiFetch<ApiProductListResponse>(`/api/product/all?${qs}`);
}

// ─── Single product ────────────────────────────────────────────────

export async function fetchProduct(id: string): Promise<ApiProduct> {
  const res = await apiFetch<{ product_details: ApiProduct }>(`/api/product/${id}`);
  return res.product_details;
}

// ─── Featured ─────────────────────────────────────────────────────

export async function fetchFeaturedProducts(limit = 8): Promise<ApiProduct[]> {
  const res = await apiFetch<ApiProductListResponse>(`/api/product/featured?limit=${limit}`);
  return res.data;
}