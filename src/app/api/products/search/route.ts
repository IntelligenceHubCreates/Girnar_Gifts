import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const BACKEND = (process.env.BACKEND_URL ?? 'http://localhost:8000').replace(/\/$/, '');

  // Pull q and other params from the incoming request
  const q       = request.nextUrl.searchParams.get('q');
  const limit   = request.nextUrl.searchParams.get('limit')   ?? '8';
  const skip    = request.nextUrl.searchParams.get('skip')    ?? '0';
  const sort_by = request.nextUrl.searchParams.get('sort_by') ?? 'featured';

  if (!q || q.trim().length < 2) {
    return NextResponse.json(
      { detail: [{ msg: 'Field required', loc: ['query', 'q'] }] },
      { status: 422 }
    );
  }

  const params = new URLSearchParams({ q: q.trim(), limit, skip, sort_by });
  const url    = `${BACKEND}/api/product/search?${params.toString()}`;

  console.log('[/api/product/search] →', url);

  try {
    const cookie = request.headers.get('cookie') ?? '';
    const res    = await fetch(url, {
      method:  'GET',
      headers: { cookie, 'Content-Type': 'application/json' },
      cache:   'no-store',
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    console.error('[/api/product/search] backend error:', err);
    return NextResponse.json({ detail: 'Backend unavailable' }, { status: 503 });
  }
}