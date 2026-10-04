import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import DashboardShell from '@/components/dashboard/DashboardShell';

export default async function DashboardPage() {
  const user = await getCurrentUser();

  // Not authenticated - redirect to landing
  if (!user) {
    redirect('/');
  }

  // Authenticated but onboarding incomplete - redirect to onboarding
  if (!user.companyId || !user.role) {
    redirect('/onboarding');
  }

  // Transform to format expected by DashboardShell
  const userData = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role as 'admin' | 'staff_agent' | 'accounts',
    company: {
      id: user.companyId,
      name: '', // Will be loaded client-side if needed
      currency: 'INR',
    },
  };

  return <DashboardShell user={userData} />;
}
