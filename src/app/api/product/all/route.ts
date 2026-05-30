// src/app/api/product/all/route.ts
//
// Proxies to FastAPI:  GET /api/product/all
// Supports: ?category_slug=bags, ?category=Bags, ?limit=20, ?skip=0, ?sort_by=featured

import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL ?? 'http://localhost:8000';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const qs = searchParams.toString();
console.log('[DEBUG] Query string received:', qs)
  console.log('[DEBUG] Fetching:', `${BACKEND_URL}/api/product/all${qs ? `?${qs}` : ''}`)

  try {
    const res = await fetch(
      `${BACKEND_URL}/api/product/all${qs ? `?${qs}` : ''}`,
      {
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store', 
      }
    );
    

    if (!res.ok) {
      console.error('[GET /api/product/all] Backend error', res.status);
      return NextResponse.json({ message: 'Failed to fetch products' }, { status: res.status });
    }
    const data = await res.json()
console.log('[DEBUG] Backend returned page:', data.page)
    return NextResponse.json(await res.json(data));
  } catch (err) {
    console.error('[GET /api/product/all]', err);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}