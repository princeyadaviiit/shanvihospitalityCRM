'use client';

import { useEffect, useState } from 'react';

export default function ClerkDiagnosticPage() {
  const [diagnostics, setDiagnostics] = useState<any>({
    publishableKey: '',
    clerkLoaded: false,
    error: null,
  });

  useEffect(() => {
    // Check if Clerk publishable key is available
    const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || 'NOT SET';

    // Check if Clerk loaded
    const checkClerk = () => {
      try {
        // @ts-ignore
        const clerkLoaded = typeof window.Clerk !== 'undefined';
        setDiagnostics({
          publishableKey,
          clerkLoaded,
          error: null,
        });
      } catch (err) {
        setDiagnostics({
          publishableKey,
          clerkLoaded: false,
          error: err instanceof Error ? err.message : 'Unknown error',
        });
      }
    };

    // Check immediately and after delay
    checkClerk();
    setTimeout(checkClerk, 2000);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-slate-900 mb-8">Clerk Diagnostic</h1>

        <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 mb-2">Environment Variables</h2>
            <div className="bg-slate-50 p-4 rounded border border-slate-200">
              <p className="text-sm font-mono break-all">
                <span className="font-bold">NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY:</span>{' '}
                {diagnostics.publishableKey}
              </p>
              {diagnostics.publishableKey === 'NOT SET' && (
                <p className="text-red-600 font-semibold mt-2">
                  ❌ MISSING! This must be set in Vercel environment variables.
                </p>
              )}
              {diagnostics.publishableKey.startsWith('pk_live_') && (
                <p className="text-green-600 font-semibold mt-2">
                  ✅ Live key detected
                </p>
              )}
              {diagnostics.publishableKey.startsWith('pk_test_') && (
                <p className="text-yellow-600 font-semibold mt-2">
                  ⚠️ Test key detected (should be live key in production)
                </p>
              )}
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-slate-900 mb-2">Clerk SDK Status</h2>
            <div className="bg-slate-50 p-4 rounded border border-slate-200">
              <p className="text-sm">
                <span className="font-bold">Clerk Loaded:</span>{' '}
                {diagnostics.clerkLoaded ? (
                  <span className="text-green-600 font-semibold">✅ YES</span>
                ) : (
                  <span className="text-red-600 font-semibold">❌ NO</span>
                )}
              </p>
              {diagnostics.error && (
                <p className="text-red-600 text-sm mt-2">
                  <span className="font-bold">Error:</span> {diagnostics.error}
                </p>
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200">
            <h2 className="text-lg font-semibold text-slate-900 mb-2">Next Steps</h2>
            <ul className="space-y-2 text-sm text-slate-700">
              {diagnostics.publishableKey === 'NOT SET' && (
                <>
                  <li>1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables</li>
                  <li>2. Add: NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = pk_live_Y2xlcmsuc2hhbnZpaG9zcGl0YWxpdHktY3JtLnZlcmNlbC5hcHAk</li>
                  <li>3. Select "Production" environment</li>
                  <li>4. Redeploy your application</li>
                </>
              )}
              {diagnostics.publishableKey !== 'NOT SET' && !diagnostics.clerkLoaded && (
                <>
                  <li>1. Open browser DevTools (F12) and check the Console tab for errors</li>
                  <li>2. Check the Network tab for failed requests to /__clerk</li>
                  <li>3. Verify CLERK_SECRET_KEY is also set in Vercel</li>
                </>
              )}
              {diagnostics.clerkLoaded && (
                <li className="text-green-600 font-semibold">✅ Clerk is loaded! You can go back to /sign-in</li>
              )}
            </ul>
          </div>

          <div className="pt-4">
            <a
              href="/sign-in"
              className="inline-block px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition"
            >
              Try Sign In Page
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
