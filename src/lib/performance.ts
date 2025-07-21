import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function performanceMiddleware(request: NextRequest) {
  const start = Date.now();
  
  // Add performance headers
  const response = NextResponse.next();
  
  // Add cache headers for static content
  if (request.nextUrl.pathname.startsWith('/api/')) {
    // API routes - short cache for data
    response.headers.set('Cache-Control', 'public, max-age=60, s-maxage=300');
  }
  
  // Add security headers
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'origin-when-cross-origin');
  
  // Add timing header
  const end = Date.now();
  response.headers.set('X-Response-Time', `${end - start}ms`);
  
  return response;
}

// Performance logging for slow queries
export function logSlowQuery(query: string, duration: number, threshold: number = 1000) {
  if (duration > threshold) {
    console.warn(`⚠️ Slow query detected (${duration}ms):`, query);
  }
}
