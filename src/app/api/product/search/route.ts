import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const BACKEND = (process.env.BACKEND_URL ?? 'http://localhost:8000').replace(/\/$/, '');

  const q       = request.nextUrl.searchParams.get('q');
  const limit   = request.nextUrl.searchParams.get('limit')   ?? '20';
  const skip    = request.nextUrl.searchParams.get('skip')    ?? '0';
  const sort_by = request.nextUrl.searchParams.get('sort_by') ?? 'featured';

  if (!q || q.trim().length < 2) {
    return NextResponse.json({ data: [], totalCount: 0 }, { status: 200 });
  }

  const params     = new URLSearchParams({ q: q.trim(), limit, skip, sort_by });
  const backendUrl = `${BACKEND}/api/product/search?${params.toString()}`;

  console.log(`\n✅ [search route] BACKEND_URL = ${BACKEND}`);
  console.log(`✅ [search route] Calling → ${backendUrl}\n`);

  try {
    const res  = await fetch(backendUrl, {
      method:  'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept':       'application/json',
        'cookie':       request.headers.get('cookie') ?? '',
      },
      cache: 'no-store',
    });

    const text = await res.text();
    console.log(`✅ [search route] Backend responded ${res.status}: ${text.slice(0, 300)}`);

    let data;
    try {
      data = JSON.parse(text);
    } catch {
      console.error('❌ [search route] Non-JSON from backend:', text);
      return NextResponse.json({ data: [], totalCount: 0 }, { status: 200 });
    }

    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    console.error('❌ [search route] Network error:', err);
    return NextResponse.json(
      { data: [], totalCount: 0, detail: 'Cannot reach backend' },
      { status: 503 }
    );
  }
}