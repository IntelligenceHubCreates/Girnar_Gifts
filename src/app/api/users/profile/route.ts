// app/api/user/profile/route.ts
// Reads Bearer token from the incoming request Authorization header
// and forwards it to the FastAPI backend as-is.

import { NextRequest, NextResponse } from 'next/server';

const BACKEND = (
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.BACKEND_URL ||
  'http://localhost:8000'
).replace(/\/$/, '');

function fwdHeaders(req: NextRequest): Record<string, string> {
  const auth = req.headers.get('authorization') || '';
  if (!auth) return { 'Content-Type': 'application/json' };
  return { 'Content-Type': 'application/json', Authorization: auth };
}

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization');
  if (!auth) return NextResponse.json({ detail: 'Unauthorized' }, { status: 401 });
  try {
    const res  = await fetch(`${BACKEND}/api/user/profile`, {
      headers: { Authorization: auth },
      cache: 'no-store',
    });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (e: any) {
    return NextResponse.json({ detail: e?.message || 'Gateway error' }, { status: 502 });
  }
}

export async function PUT(req: NextRequest) {
  const auth = req.headers.get('authorization');
  if (!auth) return NextResponse.json({ detail: 'Unauthorized' }, { status: 401 });
  try {
    const body = await req.json();
    const res  = await fetch(`${BACKEND}/api/user/profile`, {
      method: 'PUT',
      headers: { Authorization: auth, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (e: any) {
    return NextResponse.json({ detail: e?.message || 'Gateway error' }, { status: 502 });
  }
}

export async function PATCH(req: NextRequest) {
  const auth = req.headers.get('authorization');
  if (!auth) return NextResponse.json({ detail: 'Unauthorized' }, { status: 401 });
  try {
    const body = await req.json();
    const res  = await fetch(`${BACKEND}/api/user/profile`, {
      method: 'PATCH',
      headers: { Authorization: auth, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (e: any) {
    return NextResponse.json({ detail: e?.message || 'Gateway error' }, { status: 502 });
  }
}