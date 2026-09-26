'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialErrorParam = searchParams.get('error');

  let defaultError = null;
  if (initialErrorParam === 'account_not_found') {
    defaultError = 'Authenticated with Supabase, but no active CRM staff or admin account is linked to this email. Please register or contact your administrator.';
  } else if (initialErrorParam === 'account_deactivated') {
    defaultError = 'This staff account has been deactivated. Please contact your company administrator.';
  }

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(defaultError);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const data = {
      email: formData.get('email') as string,
      password: formData.get('password') as string,
    };

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Login failed');
      }

      router.push('/dashboard');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 py-12 px-4 sm:px-6 lg:px-8 font-sans selection:bg-orange-500 selection:text-white">
      <div className="max-w-md w-full space-y-8 bg-slate-950/80 p-8 rounded-3xl border border-slate-800 shadow-2xl backdrop-blur-md">
        {/* Brand Header */}
        <div className="text-center">
          <div className="mx-auto w-12 h-12 rounded-2xl bg-gradient-to-tr from-orange-500 to-amber-500 flex items-center justify-center text-white font-black text-2xl shadow-lg shadow-orange-500/25 mb-4">
            SH
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight">
            Shanvi Hospitality
          </h2>
          <p className="mt-1 text-xs text-slate-400 font-medium">
            Staff & Travel Planner Operations Portal
          </p>
          <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-800/80 border border-slate-700 text-3xs text-orange-400 font-bold uppercase tracking-wider">
            GSTIN: 09AEKFS1932F1ZX
          </div>
        </div>

        <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-xs font-bold text-slate-300 mb-1">
                Work Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition"
                placeholder="agent@shanvihospitality.in"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-xs font-bold text-slate-300 mb-1">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition"
                placeholder="••••••••"
              />
            </div>
          </div>

          {error && (
            <div className="rounded-xl bg-rose-500/10 border border-rose-500/20 p-3">
              <div className="text-xs font-medium text-rose-400">{error}</div>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-orange-500/25 transition"
            >
              {loading ? 'Authenticating...' : 'Sign In to CRM'}
            </button>
          </div>

          <div className="text-center pt-2 border-t border-slate-800">
            <Link href="/signup" className="text-xs font-medium text-slate-400 hover:text-orange-400 transition">
              New company setup? <span className="text-orange-400 font-bold">Register Admin Account</span>
            </Link>
          </div>
        </form>
      </div>

      <div className="mt-8 text-center text-xs text-slate-500">
        <p>Sector 18, Noida • Central Helpline: +91 9999885087</p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-900" />}>
      <LoginForm />
    </Suspense>
  );
}
