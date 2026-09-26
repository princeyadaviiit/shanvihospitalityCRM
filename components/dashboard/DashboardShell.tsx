'use client';

import React, { useState } from 'react';
import ExecutiveOverview from './ExecutiveOverview';
import KanbanBoard from '@/components/pipeline/KanbanBoard';
import PackagesCatalog from '@/components/packages/PackagesCatalog';
import TourCalendarView from '@/components/calendar/TourCalendarView';
import EmployeeManager from '@/components/employees/EmployeeManager';
import CompanyHub from '@/components/company/CompanyHub';
import { TourPackage } from '@/lib/packages-data';

type UserData = {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'staff_agent' | 'accounts';
  company: {
    id: string;
    name: string;
    currency: string;
  };
};

type DashboardShellProps = {
  user: UserData;
  onLogout: () => Promise<void>;
};

export type DashboardTab = 'dashboard' | 'leads' | 'tours' | 'calendar' | 'employees' | 'company';

export default function DashboardShell({ user, onLogout }: DashboardShellProps) {
  const [activeTab, setActiveTab] = useState<DashboardTab>('dashboard');
  const [initialOpenCreateModal, setInitialOpenCreateModal] = useState(false);
  const [prefillDestination, setPrefillDestination] = useState('');

  const roleDisplayNames = {
    admin: 'Administrator',
    staff_agent: 'Travel Planner / Agent',
    accounts: 'Finance & Accounts',
  };

  const roleBadges = {
    admin: 'bg-purple-50 text-purple-700 border-purple-200',
    staff_agent: 'bg-orange-50 text-orange-700 border-orange-200',
    accounts: 'bg-amber-50 text-amber-700 border-amber-200',
  };

  function handlePackageQuote(pkg: TourPackage) {
    setPrefillDestination(`${pkg.destination} — ${pkg.title}`);
    setInitialOpenCreateModal(true);
    setActiveTab('leads');
  }

  function handleOpenNewLeadModal() {
    setPrefillDestination('');
    setInitialOpenCreateModal(true);
    setActiveTab('leads');
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-orange-500 selection:text-white">
      {/* Top Header & Navigation */}
      <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-30 shadow-md pt-safe">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-18 items-center">
            {/* Brand Identity */}
            <div className="flex items-center gap-6">
              <div
                onClick={() => setActiveTab('dashboard')}
                className="flex items-center gap-3 cursor-pointer group"
              >
                <div className="w-10 h-10 rounded-2xl bg-orange-600 flex items-center justify-center text-white font-black text-xl shadow-md transition-transform group-hover:scale-105">
                  SH
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-base font-bold text-white tracking-tight leading-none group-hover:text-orange-400 transition-colors">
                      Shanvi Hospitality
                    </h1>
                    <span className="hidden xl:inline-flex items-center text-[10px] font-bold uppercase tracking-wider bg-orange-500/20 text-orange-400 border border-orange-500/30 px-2 py-0.5 rounded">
                      GSTIN: 09AEKFS1932F1ZX
                    </span>
                  </div>
                  <span className="text-[11px] font-medium text-slate-400 tracking-wider">
                    Tour Operations & Lead Engine • Sector 18, Noida
                  </span>
                </div>
              </div>

              {/* Desktop Navigation Tabs */}
              <nav className="hidden lg:flex items-center gap-1 border-l border-slate-800 pl-6 h-9">
                <button
                  onClick={() => setActiveTab('dashboard')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer ${
                    activeTab === 'dashboard'
                      ? 'bg-orange-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                  <span>Dashboard</span>
                </button>

                <button
                  onClick={() => setActiveTab('leads')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer ${
                    activeTab === 'leads'
                      ? 'bg-orange-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  <span>Leads & Pipeline</span>
                </button>

                <button
                  onClick={() => setActiveTab('tours')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer ${
                    activeTab === 'tours'
                      ? 'bg-orange-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                  </svg>
                  <span>Tour Packages</span>
                </button>

                <button
                  onClick={() => setActiveTab('calendar')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer ${
                    activeTab === 'calendar'
                      ? 'bg-orange-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span>Tour Departures</span>
                </button>

                <button
                  onClick={() => setActiveTab('employees')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer ${
                    activeTab === 'employees'
                      ? 'bg-orange-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <span>Employees & Payroll</span>
                </button>

                <button
                  onClick={() => setActiveTab('company')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer ${
                    activeTab === 'company'
                      ? 'bg-orange-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  <span>Company Hub</span>
                </button>
              </nav>
            </div>

            {/* User Profile & Helplines */}
            <div className="flex items-center gap-3">
              <a
                href="https://wa.me/919999885087?text=Shanvi%20Hospitality%20Helpline"
                target="_blank"
                rel="noopener noreferrer"
                className="hidden sm:flex items-center gap-1.5 text-xs font-semibold text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 px-2.5 py-1.5 rounded-xl transition-colors cursor-pointer"
                title="Direct 24/7 Helpline"
              >
                <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <span>+91 9999885087</span>
              </a>

              <div className="flex items-center gap-2.5 border-l border-slate-800 pl-3">
                <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-orange-400">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="hidden md:block text-left">
                  <div className="text-xs font-semibold text-white leading-none">{user.name}</div>
                  <span
                    className={`inline-block text-[10px] font-bold px-1.5 py-0.5 mt-0.5 rounded border uppercase tracking-wider ${
                      roleBadges[user.role]
                    }`}
                  >
                    {roleDisplayNames[user.role]}
                  </span>
                </div>
              </div>

              <form action={onLogout}>
                <button
                  type="submit"
                  className="text-xs font-semibold text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 px-2.5 py-1.5 rounded-xl transition-colors border border-transparent hover:border-rose-500/20 cursor-pointer"
                >
                  Logout
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Tabs */}
        <div className="lg:hidden flex border-t border-slate-800 px-3 py-2 gap-1 overflow-x-auto bg-slate-950/80">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-3 py-1 text-xs font-semibold rounded-lg whitespace-nowrap cursor-pointer ${
              activeTab === 'dashboard' ? 'bg-orange-600 text-white' : 'text-slate-400'
            }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab('leads')}
            className={`px-3 py-1 text-xs font-semibold rounded-lg whitespace-nowrap cursor-pointer ${
              activeTab === 'leads' ? 'bg-orange-600 text-white' : 'text-slate-400'
            }`}
          >
            Leads
          </button>
          <button
            onClick={() => setActiveTab('tours')}
            className={`px-3 py-1 text-xs font-semibold rounded-lg whitespace-nowrap cursor-pointer ${
              activeTab === 'tours' ? 'bg-orange-600 text-white' : 'text-slate-400'
            }`}
          >
            Tours
          </button>
          <button
            onClick={() => setActiveTab('calendar')}
            className={`px-3 py-1 text-xs font-semibold rounded-lg whitespace-nowrap cursor-pointer ${
              activeTab === 'calendar' ? 'bg-orange-600 text-white' : 'text-slate-400'
            }`}
          >
            Calendar
          </button>
          <button
            onClick={() => setActiveTab('employees')}
            className={`px-3 py-1 text-xs font-semibold rounded-lg whitespace-nowrap cursor-pointer ${
              activeTab === 'employees' ? 'bg-orange-600 text-white' : 'text-slate-400'
            }`}
          >
            Employees
          </button>
          <button
            onClick={() => setActiveTab('company')}
            className={`px-3 py-1 text-xs font-semibold rounded-lg whitespace-nowrap cursor-pointer ${
              activeTab === 'company' ? 'bg-orange-600 text-white' : 'text-slate-400'
            }`}
          >
            Company
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-safe">
        {activeTab === 'dashboard' && (
          <ExecutiveOverview
            userRole={user.role}
            userName={user.name}
            onNavigateTab={setActiveTab}
            onOpenNewLeadModal={handleOpenNewLeadModal}
          />
        )}

        {activeTab === 'leads' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Traveller Leads & Pipeline Workspace</h2>
                <p className="text-xs text-slate-500">
                  Track client conversations, dispatch instant WhatsApp quotations, and advance booking stages.
                </p>
              </div>
              <button
                onClick={handleOpenNewLeadModal}
                className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer flex items-center gap-1.5 self-start sm:self-auto"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span>Add Traveller Lead</span>
              </button>
            </div>
            <KanbanBoard
              userRole={user.role}
              currentUserId={user.id}
              initialOpenCreateModal={initialOpenCreateModal}
              onModalClosed={() => setInitialOpenCreateModal(false)}
              prefillDestination={prefillDestination}
            />
          </div>
        )}

        {activeTab === 'tours' && (
          <PackagesCatalog onSelectPackageForQuote={handlePackageQuote} />
        )}

        {activeTab === 'calendar' && (
          <div className="space-y-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
              <h2 className="text-lg font-bold text-slate-900">Upcoming Guest Departures & Dispatches</h2>
              <p className="text-xs text-slate-500">
                Live flight, cab transfer, and hotel check-in schedule for confirmed Shanvi Hospitality bookings.
              </p>
            </div>
            <TourCalendarView />
          </div>
        )}

        {activeTab === 'employees' && (
          <EmployeeManager />
        )}

        {activeTab === 'company' && (
          <CompanyHub />
        )}
      </main>

      {/* Corporate Professional Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 text-xs text-slate-500 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-900">Shanvi Hospitality</span>
            <span>• Destination Management Company (DMC)</span>
            <span className="font-mono text-slate-400">GSTIN: 09AEKFS1932F1ZX</span>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span>Corporate Office: Sector 18, Noida, UP 201301</span>
            <span>Helpline: +91 9999885087</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
