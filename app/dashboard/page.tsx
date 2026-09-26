import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import DashboardShell from '@/components/dashboard/DashboardShell';

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect('/login');
  }

  let appUser = null;
  let dbError: string | null = null;

  try {
    appUser = await prisma.user.findUnique({
      where: { supabaseUid: user.id },
      include: { company: true },
    });

    // Fallback: match by email if supabaseUid changed or was created by admin script
    if (!appUser && user.email) {
      const existingUser = await prisma.user.findFirst({
        where: { email: user.email },
        include: { company: true },
      });
      if (existingUser) {
        appUser = await prisma.user.update({
          where: { id: existingUser.id },
          data: { supabaseUid: user.id },
          include: { company: true },
        });
      }
    }
  } catch (err: any) {
    console.error('Database connection error on dashboard:', err);
    dbError = err?.message || 'Database connection error';
  }

  async function handleLogout() {
    'use server';
    const supabase = await createClient();
    await supabase.auth.signOut();
    redirect('/login');
  }

  // If database failed to connect (e.g. invalid DATABASE_URL or IPv6 connection issue in serverless)
  if (dbError) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6">
        <div className="max-w-xl w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-6">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xl">
            ⚠️
          </div>
          <div>
            <h1 className="text-xl font-black text-white">Database Connection Required</h1>
            <p className="text-sm text-slate-400 mt-2">
              You are authenticated with Supabase Auth as <strong className="text-slate-200">{user.email}</strong>, but the application server could not reach your PostgreSQL database.
            </p>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs font-mono text-rose-300 break-all space-y-2">
            <div><strong>Error:</strong> {dbError}</div>
          </div>

          <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-xl text-xs text-blue-300 space-y-1">
            <p className="font-bold">💡 How to fix in Vercel / Netlify:</p>
            <p>1. Ensure your <code className="bg-blue-900/40 px-1 py-0.5 rounded">DATABASE_URL</code> uses the Supabase <strong>Connection Pooler (port 6543)</strong>, not direct port 5432 (direct port 5432 is IPv6-only and cannot be reached by serverless lambdas).</p>
            <p>2. Verify your database password is URL-encoded if it contains special characters.</p>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <a
              href="/dashboard"
              className="px-5 py-2.5 bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs rounded-xl transition"
            >
              Retry Connection
            </a>
            <form action={handleLogout}>
              <button
                type="submit"
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition"
              >
                Sign Out
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  if (!appUser) {
    await supabase.auth.signOut();
    redirect('/login?error=account_not_found');
  }

  if (!appUser.active) {
    await supabase.auth.signOut();
    redirect('/login?error=account_deactivated');
  }

  return (
    <DashboardShell
      user={{
        id: appUser.id,
        name: appUser.name,
        email: appUser.email,
        role: appUser.role,
        company: {
          id: appUser.company.id,
          name: appUser.company.name,
          currency: appUser.company.currency,
        },
      }}
      onLogout={handleLogout}
    />
  );
}

