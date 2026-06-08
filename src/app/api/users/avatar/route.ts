// app/api/user/avatar/route.ts
// Forwards multipart upload to FastAPI /api/user/avatar with the Bearer token.

import { NextRequest, NextResponse } from 'next/server';

const BACKEND = (
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.BACKEND_URL ||
  'http://localhost:8000'
).replace(/\/$/, '');

export async function POST(req: NextRequest) {
  const auth = req.headers.get('authorization');
  if (!auth) return NextResponse.json({ detail: 'Unauthorized' }, { status: 401 });

  try {
    const formData = await req.formData();
    // Forward multipart directly — don't set Content-Type, fetch sets it with boundary
    const res = await fetch(`${BACKEND}/api/user/avatar`, {
      method: 'POST',
      headers: { Authorization: auth },
      body: formData as any,
    });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (e: any) {
    return NextResponse.json({ detail: e?.message || 'Gateway error' }, { status: 502 });
  }
}