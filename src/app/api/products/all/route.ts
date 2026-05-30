// src/app/api/product/all/route.ts
//
// Proxies the category listing to FastAPI.
// Set BACKEND_URL in .env.local  →  BACKEND_URL=http://localhost:8000
//
// Usage from frontend:
//   _get('/api/product/all', { params: { category: 'Toys', limit: 100, skip: 0 } })

import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL ?? 'http://localhost:8000';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Forward all query params (category, limit, skip, etc.) to FastAPI
    const forwardParams = new URLSearchParams();
    searchParams.forEach((value, key) => forwardParams.set(key, value));

    const backendRes = await fetch(
      `${BACKEND_URL}/api/product/all?${forwardParams.toString()}`,
      {
        headers: { 'Content-Type': 'application/json' },
        // Cache for 60 seconds so category pages load fast
        cache: 'no-store', 
      }
    );

    if (!backendRes.ok) {
      const text = await backendRes.text();
      console.error('[GET /api/product/all] Backend error', backendRes.status, text);
      return NextResponse.json(
        { message: 'Failed to fetch products' },
        { status: backendRes.status }
      );
    }

    const data = await backendRes.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error('[GET /api/product/all]', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}