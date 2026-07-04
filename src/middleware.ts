import { getToken } from 'next-auth/jwt';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // Proxy all /api/* (except /api/auth/*) to backend
  if (pathname.startsWith('/api') && !pathname.startsWith('/api/auth')) {
    return NextResponse.rewrite(new URL(pathname + search, process.env.BACKEND_URL));
  }

  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });

  // ── Admin routes: must be authenticated AND have isAdmin flag ────────────
  if (pathname.startsWith('/admin')) {
    if (!token?.backendToken) {
      // Not logged in → send to login
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('callbackUrl', encodeURI(pathname));
      return NextResponse.redirect(loginUrl);
    }
    if (!token.isAdmin) {
      // Logged in but not admin → render Next.js not-found page (URL stays as-is)
      const url = request.nextUrl.clone();
      url.pathname = '/_not-found';
      return NextResponse.rewrite(url);
    }
    return NextResponse.next();
  }

  // ── Regular protected routes ─────────────────────────────────────────────
  const protectedPaths = ['/account', '/checkout', '/orders'];
  const isProtected = protectedPaths.some((p) => pathname.startsWith(p));

  if (isProtected) {
    if (!token?.backendToken) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('callbackUrl', encodeURI(pathname));
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/api/:path*',
    '/admin/:path*',
    '/account/:path*',
    '/checkout/:path*',
    '/orders/:path*',
  ],
};
