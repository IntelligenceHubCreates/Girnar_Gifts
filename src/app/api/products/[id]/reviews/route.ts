// src/app/api/product/[id]/reviews/route.ts
// Proxies GET/POST reviews to FastAPI

import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL ?? 'http://localhost:8000';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const qs = new URLSearchParams();
    searchParams.forEach((v, k) => qs.set(k, v));

    const res = await fetch(
      `${BACKEND_URL}/api/product/${params.id}/reviews?${qs}`,
      { cache: 'no-store' }
    );
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err: any) {
    return NextResponse.json({ detail: err.message }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const contentType = request.headers.get('content-type') ?? '';
    const cookie      = request.headers.get('cookie') ?? '';
    const body        = await request.arrayBuffer();

    const res = await fetch(
      `${BACKEND_URL}/api/product/${params.id}/reviews`,
      {
        method:  'POST',
        headers: { 'content-type': contentType, ...(cookie ? { cookie } : {}) },
        body,
      }
    );
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err: any) {
    return NextResponse.json({ detail: err.message }, { status: 500 });
  }
}