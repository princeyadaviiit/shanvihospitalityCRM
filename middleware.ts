import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

// Public routes that don't require authentication
const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/clerk-diagnostic',
  '/api/health',
  '/api/webhooks/clerk',
  '/manifest.json',
  '/service-worker.js',
  '/register-sw.js',
  '/icons/(.*)',
  '/favicon.ico',
]);

// Onboarding route - requires auth but not full onboarding
const isOnboardingRoute = createRouteMatcher(['/onboarding', '/api/onboarding']);

export default clerkMiddleware(async (auth, request) => {
  const { userId } = await auth();

  // Allow public routes
  if (isPublicRoute(request)) {
    return NextResponse.next();
  }

  // Redirect to landing page if not authenticated
  if (!userId) {
    const signInUrl = new URL('/', request.url);
    return NextResponse.redirect(signInUrl);
  }

  // Allow onboarding routes for authenticated users
  if (isOnboardingRoute(request)) {
    return NextResponse.next();
  }

  // For all other protected routes, onboarding status will be checked
  // by the auth helpers in each API route and dashboard page
  return NextResponse.next();
});

export const config = {
  matcher: [
    // Skip Next.js internals and static files
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
    // Clerk proxy routes
    '/__clerk/:path*',
  ],
};
