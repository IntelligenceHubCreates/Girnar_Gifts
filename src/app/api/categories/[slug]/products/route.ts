// src/app/api/categories/[slug]/products/route.ts
// FIX: Forwards sub_slug query param to FastAPI backend.

import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL ?? 'http://localhost:8000';

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
      next: { revalidate: 30 },
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