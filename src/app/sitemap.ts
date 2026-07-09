import type { MetadataRoute } from 'next';
import { brand } from '@/config/brand';

// Runs server-side only (no 'use client'), so the non-public BACKEND_URL
// can be read directly — no NEXT_PUBLIC_* / browser proxy needed here.
const API_BASE = process.env.BACKEND_URL ?? '';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = brand.url;
  const staticRoutes = [
    '', '/products',
    '/privacy-policy', '/terms', '/refund-policy', '/shipping-policy',
  ].map((p) => ({ url: `${base}${p}`, lastModified: new Date() }));

  // NOTE: category URLs are intentionally omitted for now - the storefront's
  // category routing is still Little Loot's taxonomy and is being redesigned
  // (see MANUAL_STEPS.md 1). Add category routes back once that lands.
  let productRoutes: MetadataRoute.Sitemap = [];

  try {
    const productsRes = await fetch(`${API_BASE}/api/product/all?limit=100`, { cache: 'no-store' });
    if (productsRes.ok) {
      const body = await productsRes.json();
      const products: Array<{ id: string }> = body?.data ?? [];
      productRoutes = products.map((p) => ({
        url: `${base}/product/${p.id}`,
        lastModified: new Date(),
      }));
    }
  } catch {
    // Sitemap generation shouldn't fail the build if the API is unreachable.
  }

  return [...staticRoutes, ...productRoutes];
}
