import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans selection:bg-orange-500 selection:text-white">
      {/* Top Brand Navigation Bar */}
      <header className="border-b border-slate-800/80 bg-slate-950/60 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-orange-500 to-amber-500 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-orange-500/20">
              SH
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg text-white tracking-tight">
                  Shanvi Hospitality
                </span>
                <span className="hidden sm:inline-flex items-center gap-1 text-3xs font-bold uppercase tracking-wider bg-orange-500/10 text-orange-400 border border-orange-500/20 px-2 py-0.5 rounded-full">
                  DMC & Tour Operator
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium">
                Best Tour Packages In India • Sector 18, Noida
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="https://wa.me/919999885087?text=Hello%20Shanvi%20Hospitality%20Team"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden md:flex items-center gap-2 text-xs font-semibold text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 px-3 py-1.5 rounded-xl transition"
            >
              <span>💬 WhatsApp: +91 9999885087</span>
            </a>
            <Link
              href="/login"
              className="text-xs font-bold px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white transition border border-slate-700/80"
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              className="text-xs font-bold px-4 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-md shadow-orange-500/25 transition"
            >
              Staff Portal
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col justify-center max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700/80 text-xs font-semibold text-orange-400 mb-6">
            <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></span>
            Enterprise Travel CRM & Lead Pipeline
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-tight mb-6">
            Next-Gen Tour Operations for{' '}
            <span className="bg-gradient-to-r from-orange-400 via-amber-300 to-orange-500 bg-clip-text text-transparent">
              Shanvi Hospitality
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-300 mb-8 leading-relaxed">
            Centralized customer data, instant package quotes, drag-and-drop lead pipeline,
            and GST invoicing — engineered for our travel planners and agents.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-14">
            <Link
              href="/login"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-sm shadow-xl shadow-orange-500/25 hover:shadow-orange-500/40 transition flex items-center justify-center gap-2"
            >
              <span>Access Staff Dashboard</span>
              <span>→</span>
            </Link>
            <Link
              href="/signup"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 font-bold text-sm border border-slate-700 transition"
            >
              Create New Company Account
            </Link>
          </div>

          {/* Quick Credential Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-left">
            <div className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-800">
              <div className="text-2xs font-bold uppercase tracking-wider text-slate-400">Legal Status</div>
              <div className="text-xs font-bold text-white mt-0.5">Partnership Firm</div>
              <div className="text-3xs text-emerald-400 font-medium">Est. 2022</div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-800">
              <div className="text-2xs font-bold uppercase tracking-wider text-slate-400">GST Registration</div>
              <div className="text-xs font-bold text-white mt-0.5">09AEKFS1932F1ZX</div>
              <div className="text-3xs text-slate-400 font-medium">Uttar Pradesh</div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-800">
              <div className="text-2xs font-bold uppercase tracking-wider text-slate-400">Head Office</div>
              <div className="text-xs font-bold text-white mt-0.5">Sector 18, Noida</div>
              <div className="text-3xs text-slate-400 font-medium">Gautam Buddha Nagar</div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-800">
              <div className="text-2xs font-bold uppercase tracking-wider text-slate-400">Central Helpline</div>
              <div className="text-xs font-bold text-white mt-0.5">+91 9999885087</div>
              <div className="text-3xs text-orange-400 font-medium">24/7 Support</div>
            </div>
          </div>
        </div>

        {/* Feature Highlights Grid */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-slate-800/40 border border-slate-800 hover:border-orange-500/40 transition">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-400 flex items-center justify-center text-xl mb-4">
              📦
            </div>
            <h3 className="text-base font-bold text-white mb-2">
              Official Package Catalog
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Browse Haridwar, Jim Corbett, Nainital, Mussoorie, Chardham Yatra, and Thailand packages with 1-click quoting.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-800/40 border border-slate-800 hover:border-orange-500/40 transition">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-400 flex items-center justify-center text-xl mb-4">
              💬
            </div>
            <h3 className="text-base font-bold text-white mb-2">
              WhatsApp & Telephony
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Instant WhatsApp outreach templates, click-to-call dialer, and full chronological communication history per traveler.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-800/40 border border-slate-800 hover:border-orange-500/40 transition">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-400 flex items-center justify-center text-xl mb-4">
              🧾
            </div>
            <h3 className="text-base font-bold text-white mb-2">
              Itinerary & GST Invoicing
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Generate branded Shanvi Hospitality PDFs with auto markup, day-by-day schedules, and 18% GST tax invoices.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/60 py-6 text-center text-xs text-slate-500">
        <p>
          © {new Date().getFullYear()} Shanvi Hospitality. All rights reserved. GSTIN: 09AEKFS1932F1ZX.
        </p>
      </footer>
    </div>
  );
}
