import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';

export default async function DashboardPage() {
  const supabase = await createClient();

  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    redirect('/login');
  }

  const appUser = await prisma.user.findUnique({
    where: { supabaseUid: user.id },
    include: { company: true },
  });

  if (!appUser || !appUser.active) {
    redirect('/login');
  }

  async function handleLogout() {
    'use server';
    const supabase = await createClient();
    await supabase.auth.signOut();
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">Travel CRM</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">
                {appUser.name} ({appUser.role})
              </span>
              <span className="text-sm text-gray-500">
                {appUser.company.name}
              </span>
              <form action={handleLogout}>
                <button
                  type="submit"
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  Logout
                </button>
              </form>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Welcome to Travel CRM
              </h2>
              <p className="text-gray-600 mb-4">
                You are logged in as <strong>{appUser.name}</strong> with role <strong>{appUser.role}</strong>.
              </p>
              <p className="text-gray-600">
                Company: <strong>{appUser.company.name}</strong>
              </p>
              <div className="mt-6 p-4 bg-blue-50 rounded-md">
                <p className="text-sm text-blue-700">
                  Phase 0 is complete! The basic authentication system is working.
                  Future phases will add lead management, itinerary builder, payments, and more.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
