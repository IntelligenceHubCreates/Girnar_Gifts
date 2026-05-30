// app/api/products/route.ts
//
// Proxies to FastAPI backend.
// Set BACKEND_URL in your .env.local:
//   BACKEND_URL=http://localhost:8000
//
// FastAPI endpoints used:
//   GET /api/product/featured  → { data: [...] }
//   GET /api/product/all       → { data: [...], totalCount: N }

import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL ?? 'http://localhost:8000';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const featured = searchParams.get('featured');
  const skip     = searchParams.get('skip')  ?? '0';
  const limit    = searchParams.get('limit') ?? '100';

  // Choose the right FastAPI endpoint
  const backendPath = featured === 'true'
    ? '/api/product/featured'
    : `/api/product/all?skip=${skip}&limit=${limit}`;

  try {
    const backendRes = await fetch(`${BACKEND_URL}${backendPath}`, {
      headers: { 'Content-Type': 'application/json' },
      // Cache featured products for 60 seconds — keeps homepage fast
      next: { revalidate: 60 },
    });

    if (!backendRes.ok) {
      const errorText = await backendRes.text();
      console.error(`[GET /api/products] Backend error ${backendRes.status}:`, errorText);
      return NextResponse.json(
        { message: 'Failed to fetch products from backend' },
        { status: backendRes.status }
      );
    }

    const data = await backendRes.json();

    // Normalize: featured endpoint returns { data: [...] }
    // all endpoint returns { data: [...], totalCount: N }
    // Pass through as-is so the frontend can handle both shapes
    return NextResponse.json(data);

  } catch (error) {
    console.error('[GET /api/products]', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}