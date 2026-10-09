import { redirect } from 'next/navigation';

// Legacy route - redirects to new Clerk sign-up
export default function LegacySignupPage() {
  redirect('/sign-up');
}
