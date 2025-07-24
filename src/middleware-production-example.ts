// Middleware for handling subdomains in production
// Add this to src/middleware.ts

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();
  const hostname = request.headers.get('host') || '';
  
  // Extract subdomain (e.g., 'tenant1' from 'tenant1.yourdomain.com')
  const subdomain = hostname.split('.')[0];
  
  // Skip for main domain and common subdomains
  if (subdomain === 'www' || subdomain === 'app' || !subdomain.includes('.')) {
    return NextResponse.next();
  }
  
  // Add subdomain as header for the app to use
  const response = NextResponse.next();
  response.headers.set('x-tenant-slug', subdomain);
  
  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
