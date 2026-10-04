import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col font-sans selection:bg-orange-500 selection:text-white">
      {/* Top Brand Navigation Bar */}
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur-md sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-orange-500 to-amber-500 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-orange-500/20">
              SH
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg text-slate-900 tracking-tight">
                  Shanvi Hospitality
                </span>
                <span className="hidden sm:inline-flex items-center gap-1 text-3xs font-bold uppercase tracking-wider bg-orange-50 text-orange-600 border border-orange-200 px-2 py-0.5 rounded-full">
                  DMC & Tour Operator
                </span>
              </div>
              <p className="text-xs text-slate-600 font-medium">
                Best Tour Packages In India • Sector 18, Noida
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="https://wa.me/919999885087?text=Hello%20Shanvi%20Hospitality%20Team"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden md:flex items-center gap-2 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-3 py-1.5 rounded-xl transition"
            >
              <span>WhatsApp: +91 9999885087</span>
            </a>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col justify-center max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">
        <div className="text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-50 border border-orange-200 text-xs font-semibold text-orange-600 mb-6">
            <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></span>
            Enterprise Travel CRM & Lead Pipeline
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-tight mb-6">
            Next-Gen Tour Operations for{' '}
            <span className="bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 bg-clip-text text-transparent">
              Shanvi Hospitality
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-700 mb-12 leading-relaxed max-w-2xl mx-auto">
            Centralized customer data, instant package quotes, drag-and-drop lead pipeline,
            and GST invoicing — engineered for our travel planners and agents.
          </p>

          {/* Login Options */}
          <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto mb-16">
            {/* Admin Login */}
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-amber-500 rounded-2xl opacity-20 group-hover:opacity-30 blur-xl transition duration-500"></div>
              <div className="relative bg-white border-2 border-slate-200 rounded-2xl p-8 hover:border-orange-300 hover:shadow-xl transition-all">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center text-white font-black text-2xl shadow-lg shadow-orange-500/30 mb-4 mx-auto">
                  A
                </div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Admin Portal</h2>
                <p className="text-sm text-slate-600 mb-6">
                  Company owners & administrators
                </p>
                <div className="space-y-3">
                  <Link
                    href="/sign-in"
                    className="block w-full px-6 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-sm shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 transition"
                  >
                    Sign In as Admin
                  </Link>
                  <Link
                    href="/sign-up"
                    className="block w-full px-6 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-900 font-semibold text-sm border border-slate-300 transition"
                  >
                    Create Company Account
                  </Link>
                </div>
              </div>
            </div>

            {/* Staff Login */}
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl opacity-20 group-hover:opacity-30 blur-xl transition duration-500"></div>
              <div className="relative bg-white border-2 border-slate-200 rounded-2xl p-8 hover:border-blue-300 hover:shadow-xl transition-all">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-black text-2xl shadow-lg shadow-blue-500/30 mb-4 mx-auto">
                  S
                </div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Staff Portal</h2>
                <p className="text-sm text-slate-600 mb-6">
                  Travel agents & support staff
                </p>
                <div className="space-y-3">
                  <Link
                    href="/sign-in"
                    className="block w-full px-6 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-bold text-sm shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition"
                  >
                    Sign In as Staff
                  </Link>
                  <p className="text-xs text-slate-500 font-medium">
                    Staff accounts are created by your admin
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Credential Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-left max-w-3xl mx-auto">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <div className="text-2xs font-bold uppercase tracking-wider text-slate-600">Legal Status</div>
              <div className="text-xs font-bold text-slate-900 mt-0.5">Partnership Firm</div>
              <div className="text-3xs text-emerald-600 font-medium">Est. 2022</div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <div className="text-2xs font-bold uppercase tracking-wider text-slate-600">GST Registration</div>
              <div className="text-xs font-bold text-slate-900 mt-0.5">09AEKFS1932F1ZX</div>
              <div className="text-3xs text-slate-600 font-medium">Uttar Pradesh</div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <div className="text-2xs font-bold uppercase tracking-wider text-slate-600">24/7 Support</div>
              <div className="text-xs font-bold text-slate-900 mt-0.5">+91 9999885087</div>
              <div className="text-3xs text-emerald-600 font-medium">Always Available</div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <div className="text-2xs font-bold uppercase tracking-wider text-slate-600">Destinations</div>
              <div className="text-xs font-bold text-slate-900 mt-0.5">India & Abroad</div>
              <div className="text-3xs text-slate-600 font-medium">10+ Packages</div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 py-6 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-xs text-slate-600">
            © {new Date().getFullYear()} Shanvi Hospitality. All rights reserved. | GSTIN: 09AEKFS1932F1ZX
          </p>
        </div>
      </footer>
    </div>
  );
}
