/**
 * app/api/newsletter/subscribe/route.ts
 * Next.js App Router API route for newsletter subscription.
 *
 * Stores subscribers in your DB via the FastAPI backend.
 * Replace BACKEND_URL with your real endpoint if you have
 * a dedicated newsletter table, or swap for Mailchimp /
 * Resend / ConvertKit SDK calls.
 */

import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:8000';

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const email = (body?.email ?? '').trim().toLowerCase();

    if (!email) {
      return NextResponse.json(
        { detail: 'Email address is required.' },
        { status: 400 }
      );
    }

    if (!isValidEmail(email)) {
      return NextResponse.json(
        { detail: 'Please enter a valid email address.' },
        { status: 400 }
      );
    }

    // ── Forward to FastAPI backend ─────────────────────────────
    // If you don't have a /api/newsletter endpoint yet, the
    // section below shows a simple local DB approach as fallback.

    const backendRes = await fetch(`${BACKEND_URL}/api/newsletter/subscribe`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ email }),
    });

    if (!backendRes.ok) {
      const data = await backendRes.json().catch(() => ({}));
      // 409 = already subscribed — treat as success on the frontend
      if (backendRes.status === 409) {
        return NextResponse.json({ message: 'Already subscribed.' }, { status: 200 });
      }
      return NextResponse.json(
        { detail: data?.detail ?? 'Subscription failed. Please try again.' },
        { status: backendRes.status }
      );
    }

    return NextResponse.json({ message: 'Subscribed successfully.' }, { status: 200 });

  } catch (err: any) {
    console.error('[newsletter] subscribe error:', err);
    return NextResponse.json(
      { detail: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    );
  }
}