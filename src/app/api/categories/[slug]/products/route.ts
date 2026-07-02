// src/app/api/categories/[slug]/products/route.ts
// FIX: Forwards sub_slug query param to FastAPI backend.
// FIX (this pass): Removed `next: { revalidate: 30 }` on the outbound fetch.
//   That option made Next's Data Cache store the FastAPI response PER EXACT
//   BACKEND URL for 30s. Since `skip` is part of the URL, different pages
//   were cached as different entries — but any time the SAME skip value was
//   requested again within 30s (e.g. clicking back to page 1, or a filter
//   change that resets to page 1), Next served the stale cached body instead
//   of re-hitting FastAPI. That's why the Network tab (browser → this route)
//   always looked correct, while the second hop (this route → FastAPI) was
//   silently serving 30s-old data for repeated skip values — invisible in
//   browser DevTools entirely.
//
//   `export const dynamic = 'force-dynamic'` opts the whole route segment
//   out of Next's full-route caching, and `cache: 'no-store'` on the fetch
//   stops the per-URL Data Cache too. Belt-and-suspenders, but both matter:
//   one governs the route segment, the other governs this specific fetch call.

import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL ?? 'http://localhost:8000';

// Never let Next statically cache or ISR-cache this route.
export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  const { slug } = params;
  const { searchParams } = new URL(request.url);

  // Forward ALL params: limit, skip, sort_by, sub_slug, in_stock, on_sale
  const qs = searchParams.toString();
  const backendUrl = `${BACKEND_URL}/api/categories/${slug}/products${qs ? `?${qs}` : ''}`;

  try {
    const res = await fetch(backendUrl, {
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store', // was: next: { revalidate: 30 } — caused stale-page bug
    });

    if (res.status === 404) {
      return NextResponse.json({ data: [], totalCount: 0, page: 1, limit: 20 });
    }

    if (!res.ok) {
      console.error(`[GET /api/categories/${slug}/products] Backend ${res.status}`);
      return NextResponse.json({ message: 'Failed to fetch products' }, { status: res.status });
    }

    return NextResponse.json(await res.json());
  } catch (err) {
    console.error(`[GET /api/categories/${slug}/products]`, err);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}