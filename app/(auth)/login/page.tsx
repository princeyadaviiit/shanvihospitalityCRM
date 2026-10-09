import { redirect } from 'next/navigation';

// Legacy route - redirects to new Clerk sign-in
export default function LegacyLoginPage() {
  redirect('/sign-in');
}
