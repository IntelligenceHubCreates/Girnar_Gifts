import { getToken } from 'next-auth/jwt';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // Proxy all /api/* (except /api/auth/*) to backend
  if (pathname.startsWith('/api') && !pathname.startsWith('/api/auth')) {
    return NextResponse.rewrite(new URL(pathname + search, process.env.BACKEND_URL));
  }

  // Protect these routes — redirect to /login if not authenticated
  const protectedPaths = ['/account', '/checkout', '/orders', '/admin'];
  const isProtected = protectedPaths.some((p) => pathname.startsWith(p));

  if (isProtected) {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    if (!token || !token.backendToken) {
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
    '/account/:path*',
    '/checkout/:path*',
    '/orders/:path*',
    '/admin/:path*',
  ],
};
