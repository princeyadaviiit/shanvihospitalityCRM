import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

import { getSupabaseEnv } from '@/lib/supabase/env';

function applySecurityHeaders(res: NextResponse): NextResponse {
  res.headers.set('X-Frame-Options', 'DENY');
  res.headers.set('X-Content-Type-Options', 'nosniff');
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.headers.set('Permissions-Policy', 'camera=(), microphone=(self), geolocation=()');
  res.headers.set('X-XSS-Protection', '1; mode=block');
  return res;
}

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });
  applySecurityHeaders(response);

  const { url: supabaseUrl, anonKey: supabaseAnonKey } = getSupabaseEnv();

  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Middleware: Supabase URL or Anon Key is not configured in environment variables');
    return response;
  }

  try {
    const supabase = createServerClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) =>
              request.cookies.set(name, value)
            );
            response = NextResponse.next({
              request,
            });
            applySecurityHeaders(response);
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options)
            );
          },
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();

    if (!user && request.nextUrl.pathname.startsWith('/dashboard')) {
      const redirectRes = NextResponse.redirect(new URL('/login', request.url));
      return applySecurityHeaders(redirectRes);
    }

    if (user && (request.nextUrl.pathname === '/login' || request.nextUrl.pathname === '/signup')) {
      const redirectRes = NextResponse.redirect(new URL('/dashboard', request.url));
      return applySecurityHeaders(redirectRes);
    }
  } catch (error) {
    console.error('Middleware auth check error:', error);
    if (request.nextUrl.pathname.startsWith('/dashboard')) {
      const redirectRes = NextResponse.redirect(new URL('/login', request.url));
      return applySecurityHeaders(redirectRes);
    }
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
