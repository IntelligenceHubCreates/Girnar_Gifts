// src/app/api/product/all/route.ts
// ---------------------------------------------------------------------------
// Proxies the product listing to FastAPI.
//
// THE FIX (read this): GET Route Handlers are cached by Next.js by default.
// A cached handler returns the SAME response for every request to this path,
// IGNORING the query string — so ?skip=0, ?skip=24 and ?skip=300 all came back
// as page 1. `cache: 'no-store'` on the inner fetch does NOT fix this: it only
// disables caching of the route→FastAPI call, not Next caching THIS handler's
// own output. The two exports below force the handler to run on every request.
// ---------------------------------------------------------------------------

import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic'; // never statically cache this route
export const revalidate = 0;            // no ISR window either

const BACKEND_URL = process.env.BACKEND_URL ?? 'http://localhost:8000';

export async function GET(request: NextRequest) {
  // nextUrl.searchParams is the canonical dynamic accessor.
  const qs = request.nextUrl.searchParams.toString();

  try {
    const res = await fetch(`${BACKEND_URL}/api/product/all${qs ? `?${qs}` : ''}`, {
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
    });

    if (!res.ok) {
      const text = await res.text();
      console.error('[GET /api/product/all] Backend error', res.status, text);
      return NextResponse.json({ message: 'Failed to fetch products' }, { status: res.status });
    }

    const data = await res.json(); // read the body exactly once
    return NextResponse.json(data);
  } catch (err) {
    console.error('[GET /api/product/all]', err);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}