import { SignUp } from '@clerk/nextjs';

export default function SignUpPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-orange-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-xl bg-gradient-to-tr from-orange-500 to-amber-500 flex items-center justify-center text-white font-black text-2xl shadow-lg shadow-orange-500/20 mx-auto mb-4">
            SH
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Create Account</h1>
          <p className="text-sm text-slate-600">Join Shanvi Hospitality CRM</p>
        </div>

        <SignUp
          appearance={{
            elements: {
              rootBox: 'mx-auto',
              card: 'bg-white border border-slate-200 shadow-xl',
              headerTitle: 'text-slate-900',
              headerSubtitle: 'text-slate-600',
              socialButtonsBlockButton: 'bg-white border-slate-300 hover:bg-slate-50 text-slate-900',
              formButtonPrimary: 'bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600',
              formFieldInput: 'bg-white border-slate-300 text-slate-900',
              footerActionLink: 'text-orange-600 hover:text-orange-700',
              identityPreviewText: 'text-slate-900',
              identityPreviewEditButton: 'text-orange-600',
            }
          }}
          routing="path"
          path="/sign-up"
          signInUrl="/sign-in"
          fallbackRedirectUrl="/onboarding"
        />
      </div>
    </div>
  );
}
