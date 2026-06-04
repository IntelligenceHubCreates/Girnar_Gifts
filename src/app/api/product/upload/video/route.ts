// src/app/api/product/upload/video/route.ts

import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL ?? 'http://localhost:8000';

export const maxDuration = 120; // 2 min — required for large uploads on Vercel/Next

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type') ?? '';
    const cookie      = request.headers.get('cookie') ?? '';

    // Read the full body into a buffer first.
    // Streaming via request.body causes ECONNRESET on large files because
    // Next.js closes the incoming socket before the proxy fetch completes.
    const bodyBuffer = await request.arrayBuffer();

    const backendRes = await fetch(
      `${BACKEND_URL}/api/product/upload/video`,
      {
        method:  'POST',
        headers: {
          'content-type': contentType,
          ...(cookie ? { cookie } : {}),
        },
        body: bodyBuffer,
        // No duplex needed — body is a resolved ArrayBuffer, not a stream
      }
    );

    const data = await backendRes.json();
    return NextResponse.json(data, { status: backendRes.status });

  } catch (error: any) {
    console.error('[POST /api/product/upload/video]', error);
    return NextResponse.json(
      { detail: 'Video upload failed: ' + (error.message ?? 'unknown') },
      { status: 500 }
    );
  }
}