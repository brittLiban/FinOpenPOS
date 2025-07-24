import { NextRequest, NextResponse } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';
import createMiddleware from 'next-intl/middleware';

const intlMiddleware = createMiddleware({
  locales: ['en', 'pt', 'es'],
  defaultLocale: 'en',
});

export async function middleware(request: NextRequest) {
  // Handle auth session first
  await updateSession(request);
  
  // Handle multi-tenant subdomain routing
  const hostname = request.headers.get('host') || '';
  const url = request.nextUrl.clone();
  
  // Skip subdomain handling for localhost during development
  if (hostname.includes('localhost') || hostname.includes('127.0.0.1')) {
    return intlMiddleware(request);
  }

  // Extract subdomain
  const subdomain = hostname.split('.')[0];
  
  // Skip for main domain, www, and admin
  if (subdomain === 'www' || subdomain === 'admin' || 
      subdomain === process.env.NEXT_PUBLIC_TENANT_DOMAIN?.split('.')[0]) {
    return intlMiddleware(request);
  }

  // For production: handle subdomain-based tenant routing
  if (subdomain && !hostname.includes('localhost')) {
    // Add tenant context to the request
    url.searchParams.set('tenant', subdomain);
    
    // Apply internationalization first
    const intlResponse = intlMiddleware(request);
    
    // Then add tenant info to headers
    const response = NextResponse.rewrite(url);
    response.headers.set('x-tenant', subdomain);
    response.headers.set('x-hostname', hostname);
    
    return response;
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: [
    '/((?!api|_next|.*\\..*).*)',
  ],
};