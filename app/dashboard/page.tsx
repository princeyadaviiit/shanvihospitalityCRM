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

