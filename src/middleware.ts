import { NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';
import createMiddleware from 'next-intl/middleware';

const intlMiddleware = createMiddleware({
  locales: ['en', 'pt', 'es'],
  defaultLocale: 'en',
});


export async function middleware(request: NextRequest) {
  await updateSession(request);
  return intlMiddleware(request);
}

export const config = {
  matcher: [
    '/((?!api|_next|.*\\..*).*)',
  ],
};