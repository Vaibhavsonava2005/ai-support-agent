import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Only protect /api routes
  if (request.nextUrl.pathname.startsWith('/api')) {
    // Get headers to verify request origin
    const referer = request.headers.get('referer');
    const origin = request.headers.get('origin');
    const host = request.headers.get('host');
    const secFetchSite = request.headers.get('sec-fetch-site');

    // If it's a browser request from another site, block it
    if (secFetchSite === 'cross-site') {
      return NextResponse.json({ error: 'Unauthorized origin' }, { status: 403 });
    }

    // Check if the request comes from our own application (basic protection against scripts/Postman)
    // Postman/cURL usually don't send referer or origin unless spoofed.
    // Allow if referer or origin contains the host
    const isLocal = host?.includes('localhost');
    const isVercel = host?.includes('vercel.app');

    if (!isLocal && isVercel) {
      if (!referer?.includes(host as string) && !origin?.includes(host as string)) {
        // Block external direct API access
        return NextResponse.json({ error: 'API access restricted to official client' }, { status: 403 });
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/api/:path*',
};
