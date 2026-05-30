// app/api/products/[id]/route.ts
//
// This Next.js route proxies the request to your FastAPI backend.
// Set BACKEND_URL in your .env.local, e.g.:
//   BACKEND_URL=http://localhost:8000
//
// FastAPI endpoint: GET /api/product/{id}
// FastAPI returns:  { product_details: { id, name, ... } }

import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL ?? 'http://localhost:8000';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  if (!id || id.trim() === '') {
    return NextResponse.json({ message: 'Product ID is required' }, { status: 400 });
  }

  try {
    const backendRes = await fetch(`${BACKEND_URL}/api/product/${id}`, {
      // Forward auth header if present (for JWT-protected endpoints)
      headers: {
        'Content-Type': 'application/json',
        ...(request.headers.get('authorization')
          ? { Authorization: request.headers.get('authorization')! }
          : {}),
      },
      // Don't cache individual product pages so stock / price are always fresh
      cache: 'no-store',
    });

    if (backendRes.status === 404) {
      return NextResponse.json({ message: 'Product not found' }, { status: 404 });
    }

    if (!backendRes.ok) {
      const errorText = await backendRes.text();
      console.error(`[GET /api/products/${id}] Backend error ${backendRes.status}:`, errorText);
      return NextResponse.json(
        { message: 'Failed to fetch product from backend' },
        { status: backendRes.status }
      );
    }

    const data = await backendRes.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error(`[GET /api/products/${id}]`, error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}