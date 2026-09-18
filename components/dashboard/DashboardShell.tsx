'use client';

import React, { useState } from 'react';
import KanbanBoard from '@/components/pipeline/KanbanBoard';
import StaffManagement from '@/components/staff/StaffManagement';

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

export default function DashboardShell({ user, onLogout }: DashboardShellProps) {
  const [activeTab, setActiveTab] = useState<'pipeline' | 'team'>('pipeline');

  const roleDisplayNames = {
    admin: 'Administrator',
    staff_agent: 'Sales Agent',
    accounts: 'Finance & Accounts',
  };

  const roleBadges = {
    admin: 'bg-purple-100 text-purple-800 border-purple-200',
    staff_agent: 'bg-blue-100 text-blue-800 border-blue-200',
    accounts: 'bg-amber-100 text-amber-800 border-amber-200',
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Top Navigation */}
      <header className="bg-white border-b border-slate-200/80 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            {/* Brand & Company */}
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-black shadow-sm">
                  T
                </div>
                <div>
                  <h1 className="text-base font-extrabold text-slate-900 tracking-tight leading-none">
                    Travel CRM
                  </h1>
                  <span className="text-2xs font-semibold text-slate-500 uppercase tracking-wider">
                    {user.company.name}
                  </span>
                </div>
              </div>

              {/* Navigation Tabs */}
              <nav className="hidden sm:flex items-center gap-1 border-l border-slate-200 pl-6 h-8">
                <button
                  onClick={() => setActiveTab('pipeline')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
                    activeTab === 'pipeline'
                      ? 'bg-slate-100 text-slate-900 shadow-2xs'
                      : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                  }`}
                >
                  Lead Pipeline
                </button>

                {user.role === 'admin' && (
                  <button
                    onClick={() => setActiveTab('team')}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
                      activeTab === 'team'
                        ? 'bg-slate-100 text-slate-900 shadow-2xs'
                        : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                    }`}
                  >
                    Team & Staff
                  </button>
                )}
              </nav>
            </div>

            {/* User Profile & Actions */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-xs font-bold text-slate-700">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="hidden md:block text-left">
                  <div className="text-xs font-bold text-slate-800">{user.name}</div>
                  <span
                    className={`inline-block text-3xs font-bold px-1.5 py-0.2 rounded border uppercase tracking-wider ${
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
                  className="text-xs font-bold text-slate-500 hover:text-rose-600 hover:bg-rose-50 px-3 py-1.5 rounded-xl transition border border-transparent hover:border-rose-100"
                >
                  Logout
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Mobile Sub-Nav */}
        <div className="sm:hidden flex border-t border-slate-100 px-4 py-2 gap-2 bg-slate-50/60">
          <button
            onClick={() => setActiveTab('pipeline')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg text-center ${
              activeTab === 'pipeline' ? 'bg-white shadow-xs text-blue-600' : 'text-slate-500'
            }`}
          >
            Lead Pipeline
          </button>
          {user.role === 'admin' && (
            <button
              onClick={() => setActiveTab('team')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg text-center ${
                activeTab === 'team' ? 'bg-white shadow-xs text-blue-600' : 'text-slate-500'
              }`}
            >
              Team & Staff
            </button>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {/* Role-Specific Context Banner */}
        <div className="mb-6 p-4 rounded-2xl bg-white border border-slate-200/70 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              {activeTab === 'team'
                ? 'Team Account Management'
                : user.role === 'admin'
                ? 'Company Lead Pipeline'
                : user.role === 'staff_agent'
                ? 'My Assigned Leads'
                : 'Accounts Reconciliation Pipeline'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {activeTab === 'team'
                ? 'Add, configure, and deactivate user accounts for your travel agency staff.'
                : user.role === 'admin'
                ? 'Full pipeline overview: drag leads between stages, filter by assigned agent, or assign enquiries.'
                : user.role === 'staff_agent'
                ? 'Manage your active clients, advance trip statuses, and record detailed discussion notes.'
                : 'Read-only pipeline view: review booking values, confirmed itineraries, and payment prerequisites.'}
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-slate-100 text-slate-700">
              Tenant: {user.company.name}
            </span>
          </div>
        </div>

        {/* Tab Views */}
        {activeTab === 'pipeline' ? (
          <KanbanBoard userRole={user.role} currentUserId={user.id} />
        ) : (
          <StaffManagement currentUserId={user.id} />
        )}
      </main>
    </div>
  );
}
