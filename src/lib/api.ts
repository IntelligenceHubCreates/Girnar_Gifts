// src/lib/api.ts
// ---------------------------------------------------------------------------
// Thin client for the FastAPI product/category endpoints.
//
// IMPORTANT: these endpoints paginate via `skip` + `limit` (NOT `page`).
// We always call the backend directly through NEXT_PUBLIC_API_BASE so the
// Next.js App Router never tries to intercept / cache the request.
//
// Fixes vs. previous version:
//   • The AbortSignal is now actually forwarded to fetch(), so in-flight
//     requests are truly cancelled when the user navigates / refilters.
//   • Path segments are URL-encoded.
//   • skip=0 is sent explicitly (so the first page is unambiguous).
// ---------------------------------------------------------------------------

import type { ApiProduct, ApiProductListResponse, ProductQueryParams } from '@/types/products';

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE ??
  process.env.NEXT_PUBLIC_BACKEND_URL ??
  '';

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    cache: 'no-store',
    ...init,
  });

  if (!res.ok) {
    let detail = '';
    try {
      const body = await res.json();
      detail = body?.detail ?? '';
    } catch {
      /* ignore parse errors */
    }
    throw new Error(detail || `Request failed (${res.status})`);
  }

  return res.json() as Promise<T>;
}

/** Products for a category slug (the backend returns the category + all descendants). */
export async function fetchProductsByCategory(
  categorySlug: string,
  params: Omit<ProductQueryParams, 'category' | 'category_slug'> & { subSlug?: string } = {},
): Promise<ApiProductListResponse> {
  const qs = new URLSearchParams();
  if (params.subSlug) qs.set('sub_slug', params.subSlug);
  if (params.limit !== undefined) qs.set('limit', String(params.limit));
  if (params.skip !== undefined) qs.set('skip', String(params.skip));
  if (params.sort_by) qs.set('sort_by', params.sort_by);
  if (params.in_stock) qs.set('in_stock', 'true');
  if (params.on_sale) qs.set('on_sale', 'true');
  if (params.is_new) qs.set('is_new', 'true');
  if (params.is_featured) qs.set('is_featured', 'true');
  if (params.min_price !== undefined) qs.set('min_price', String(params.min_price));
  if (params.max_price !== undefined) qs.set('max_price', String(params.max_price));

  const query = qs.toString();
  return apiFetch<ApiProductListResponse>(
    `/api/categories/${encodeURIComponent(categorySlug)}/products${query ? `?${query}` : ''}`,
    { signal: params.signal },
  );  
}

/** The "all products" endpoint, optionally filtered by category name / slug. */
export async function fetchAllProducts(
  params: ProductQueryParams = {},
): Promise<ApiProductListResponse> {
  const qs = new URLSearchParams();
  if (params.category_slug) qs.set('category_slug', params.category_slug);
  if (params.sub_slug) qs.set('sub_slug', params.sub_slug);
  if (params.category) qs.set('category', params.category);
  if (params.limit !== undefined) qs.set('limit', String(params.limit));
  if (params.skip !== undefined) qs.set('skip', String(params.skip));
  if (params.sort_by) qs.set('sort_by', params.sort_by);
  if (params.in_stock) qs.set('in_stock', 'true');
  if (params.on_sale) qs.set('on_sale', 'true');
  if (params.is_new) qs.set('is_new', 'true');
  if (params.is_featured) qs.set('is_featured', 'true');
  if (params.min_price !== undefined) qs.set('min_price', String(params.min_price));
  if (params.max_price !== undefined) qs.set('max_price', String(params.max_price));

  const query = qs.toString();
  return apiFetch<ApiProductListResponse>(
    `/api/product/all${query ? `?${query}` : ''}`,
    { signal: params.signal },
  );
}

/** Single product detail. */
export async function fetchProduct(
  id: string,
  signal?: AbortSignal,
): Promise<ApiProduct> {
  return apiFetch<ApiProduct>(`/api/product/${encodeURIComponent(id)}`, { signal });
}

/** Featured products for the home page. */
export async function fetchFeaturedProducts(
  limit = 12,
  signal?: AbortSignal,
): Promise<ApiProductListResponse> {
  return apiFetch<ApiProductListResponse>(`/api/product/featured?limit=${limit}`, { signal });
}