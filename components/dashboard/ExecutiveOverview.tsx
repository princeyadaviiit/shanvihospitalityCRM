'use client';

import React, { useState, useEffect } from 'react';
import { SHANVI_COMPANY_INFO, SHANVI_PACKAGES } from '@/lib/packages-data';

type OverviewStats = {
  totalLeads: number;
  enquiries: number;
  inProgress: number;
  confirmed: number;
  missed: number;
  pipelineValue: number;
  conversionRate: number;
  monthlyTarget: number;
  monthlyAchieved: number;
};

type AgentPerformance = {
  agentId: string;
  agentName: string;
  totalLeads: number;
  confirmed: number;
  missed: number;
};

type NavigationTab = 'dashboard' | 'leads' | 'tours' | 'calendar' | 'employees' | 'company';

type ExecutiveOverviewProps = {
  userRole: 'admin' | 'staff_agent' | 'accounts';
  userName: string;
  onNavigateTab: (tab: NavigationTab) => void;
  onOpenNewLeadModal: () => void;
};

export default function ExecutiveOverview({
  userRole,
  userName,
  onNavigateTab,
  onOpenNewLeadModal,
}: ExecutiveOverviewProps) {
  const [stats, setStats] = useState<OverviewStats>({
    totalLeads: 0,
    enquiries: 0,
    inProgress: 0,
    confirmed: 0,
    missed: 0,
    pipelineValue: 0,
    conversionRate: 0,
    monthlyTarget: 1500000,
    monthlyAchieved: 0,
  });
  const [agents, setAgents] = useState<AgentPerformance[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSalesReportOpen, setIsSalesReportOpen] = useState(false);

  useEffect(() => {
    async function loadStats() {
      try {
        const res = await fetch('/api/reports/sales');
        if (res.ok) {
          const data = await res.json();
          if (data.summary) {
            setStats({
              totalLeads: data.summary.totalLeads || 0,
              enquiries: data.summary.enquiries || 0,
              inProgress: data.summary.inProgress || 0,
              confirmed: data.summary.confirmed || 0,
              missed: data.summary.missed || 0,
              pipelineValue: data.summary.totalRevenue || 0,
              conversionRate: data.summary.conversionRate || 0,
              monthlyTarget: 1500000,
              monthlyAchieved: data.summary.totalRevenue || 0,
            });
          }
          if (data.byAgent && Array.isArray(data.byAgent)) {
            setAgents(data.byAgent);
          }
        }
      } catch (err) {
        console.error('Failed to load executive overview stats:', err);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  const targetPercentage = Math.min(
    100,
    Math.round((stats.monthlyAchieved / stats.monthlyTarget) * 100) || 0
  );

  return (
    <div className="space-y-6">
      {/* Executive Welcome & Brand Banner */}
      <div className="p-6 md:p-8 rounded-3xl bg-slate-900 text-white border border-slate-800 shadow-xl relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute right-0 top-0 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30">
                Shanvi Hospitality CRM Engine
              </span>
              <span className="text-xs font-medium text-slate-400">
                GSTIN: {SHANVI_COMPANY_INFO.gstNumber}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Welcome back, <span className="text-orange-400">{userName}</span>
            </h1>
            <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
              Track active enquiries, generate custom package quotes, and coordinate traveler bookings across Uttarakhand, Rajasthan, Thailand, Vietnam & Nepal.
            </p>
          </div>

          {/* Primary Quick Actions */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5">
            <button
              onClick={onOpenNewLeadModal}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-orange-600 hover:bg-orange-700 shadow-sm transition-all duration-200 flex items-center gap-2 cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>+ New Enquiry</span>
            </button>

            <button
              onClick={() => setIsSalesReportOpen(true)}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 transition-colors border border-slate-700 flex items-center gap-2 cursor-pointer"
            >
              <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <span>Sales Report</span>
            </button>

            <button
              onClick={() => onNavigateTab('tours')}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 transition-colors border border-slate-700 flex items-center gap-2 cursor-pointer"
            >
              <svg className="w-4 h-4 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
              <span>Tour Catalog</span>
            </button>

            <button
              onClick={() => onNavigateTab('employees')}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 transition-colors border border-slate-700 flex items-center gap-2 cursor-pointer"
            >
              <svg className="w-4 h-4 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span>Staff & Payroll</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Active Enquiries */}
        <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              New Enquiries
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900">
              {loading ? '...' : stats.enquiries}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">Awaiting agent quotation</p>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-blue-600">
            <button onClick={() => onNavigateTab('leads')} className="hover:underline cursor-pointer flex items-center gap-1">
              <span>View in Leads</span>
              <span>→</span>
            </button>
          </div>
        </div>

        {/* Card 2: In Progress Quotes */}
        <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Active Proposals
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900">
              {loading ? '...' : stats.inProgress}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">Quotes & Itineraries sent</p>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-amber-600">
            <button onClick={() => onNavigateTab('leads')} className="hover:underline cursor-pointer flex items-center gap-1">
              <span>Follow-up required</span>
              <span>→</span>
            </button>
          </div>
        </div>

        {/* Card 3: Confirmed Bookings */}
        <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Confirmed Trips
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-emerald-600">
              {loading ? '...' : stats.confirmed}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">Deposit & Advance paid</p>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-emerald-600">
            <button onClick={() => onNavigateTab('calendar')} className="hover:underline cursor-pointer flex items-center gap-1">
              <span>Check Departures</span>
              <span>→</span>
            </button>
          </div>
        </div>

        {/* Card 4: Conversion Rate */}
        <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Conversion Rate
            </span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900">
              {loading ? '...' : `${stats.conversionRate}%`}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">Enquiry to confirmed booking</p>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-purple-600">
            <button onClick={() => setIsSalesReportOpen(true)} className="hover:underline cursor-pointer flex items-center gap-1">
              <span>View Breakdown</span>
              <span>→</span>
            </button>
          </div>
        </div>
      </div>

      {/* Target Progress & Best-Sellers Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Target Meter */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Monthly Agency Sales Target
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Shanvi Hospitality revenue quota
                </p>
              </div>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-orange-50 text-orange-700 border border-orange-200">
                {targetPercentage}% Achieved
              </span>
            </div>

            {/* Target Progress Bar */}
            <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden mb-3">
              <div
                className="bg-orange-600 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.max(5, targetPercentage)}%` }}
              ></div>
            </div>

            <div className="flex justify-between text-xs font-semibold text-slate-700">
              <span>Achieved: ₹{stats.monthlyAchieved.toLocaleString('en-IN')}</span>
              <span className="text-slate-400">Target: ₹{stats.monthlyTarget.toLocaleString('en-IN')}</span>
            </div>
          </div>

          <div className="mt-6 p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs text-slate-600">
            <div className="font-bold text-slate-900 mb-1 flex items-center gap-1.5">
              <svg className="w-4 h-4 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Tour Planning Advisory</span>
            </div>
            Chardham Yatra and Thailand Island combos have the highest closure rate this season. Use pre-built packages to quote within 10 minutes.
          </div>
        </div>

        {/* Featured Popular Packages Snippet */}
        <div className="lg:col-span-2 p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Shanvi Hospitality Best-Sellers
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Quick-access tour packages with standard inclusions & B2B rates
              </p>
            </div>
            <button
              onClick={() => onNavigateTab('tours')}
              className="text-xs font-bold text-orange-600 hover:text-orange-700 cursor-pointer flex items-center gap-1"
            >
              <span>View All ({SHANVI_PACKAGES.length})</span>
              <span>→</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {SHANVI_PACKAGES.slice(0, 4).map((pkg) => (
              <div
                key={pkg.id}
                className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-orange-300 transition-colors flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider mb-1">
                    <span className="text-slate-500">{pkg.destination}</span>
                    <span className="text-orange-600 font-bold">{pkg.duration}</span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 line-clamp-1 leading-snug">
                    {pkg.title}
                  </h4>
                  <p className="text-xs text-slate-500 line-clamp-1 mt-1">
                    {pkg.highlights[0]}
                  </p>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-200/60 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">
                    {pkg.priceFrom || 'On Request'}
                  </span>
                  <button
                    onClick={() => onNavigateTab('tours')}
                    className="text-xs font-semibold text-white bg-slate-900 hover:bg-orange-600 px-3 py-1 rounded-lg transition-colors cursor-pointer"
                  >
                    Details & Quote
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Phase 5: Detailed Sales Report Modal */}
      {isSalesReportOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-orange-600/30 text-orange-400 border border-orange-500/40">
                    Phase 5 Sales Engine
                  </span>
                  <span className="text-xs text-slate-400">Shanvi Hospitality Financial Audit</span>
                </div>
                <h2 className="text-xl font-black text-white mt-1">
                  Executive Sales Report & Conversion Analytics
                </h2>
              </div>
              <button
                onClick={() => setIsSalesReportOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
              {/* Summary Metrics Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Inquiries</span>
                  <span className="text-2xl font-black text-slate-900">{stats.totalLeads}</span>
                  <span className="text-2xs text-slate-500 block mt-0.5">All marketing channels</span>
                </div>

                <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200">
                  <span className="text-[10px] uppercase font-bold text-amber-700 block">In Progress</span>
                  <span className="text-2xl font-black text-amber-800">{stats.inProgress}</span>
                  <span className="text-2xs text-amber-600 block mt-0.5">Active quotes</span>
                </div>

                <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200">
                  <span className="text-[10px] uppercase font-bold text-emerald-700 block">Confirmed Bookings</span>
                  <span className="text-2xl font-black text-emerald-800">{stats.confirmed}</span>
                  <span className="text-2xs text-emerald-600 block mt-0.5">{stats.conversionRate}% conversion</span>
                </div>

                <div className="p-4 rounded-2xl bg-purple-50/60 border border-purple-200">
                  <span className="text-[10px] uppercase font-bold text-purple-700 block">Gross Revenue</span>
                  <span className="text-2xl font-black text-purple-900">₹{stats.pipelineValue.toLocaleString('en-IN')}</span>
                  <span className="text-2xs text-purple-600 block mt-0.5">Locked itinerary value</span>
                </div>
              </div>

              {/* Conversion Funnel Breakdown */}
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">
                  Lead Conversion Pipeline Flow
                </h3>
                <div className="grid grid-cols-4 gap-2 text-center text-xs font-bold">
                  <div className="p-3 bg-white rounded-xl border border-slate-200">
                    <span className="text-slate-400 text-[10px] block">1. Enquiries</span>
                    <span className="text-base text-blue-600">{stats.enquiries}</span>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-slate-200">
                    <span className="text-slate-400 text-[10px] block">2. Proposals</span>
                    <span className="text-base text-amber-600">{stats.inProgress}</span>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-slate-200">
                    <span className="text-slate-400 text-[10px] block">3. Confirmed</span>
                    <span className="text-base text-emerald-600">{stats.confirmed}</span>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-slate-200">
                    <span className="text-slate-400 text-[10px] block">4. Missed</span>
                    <span className="text-base text-rose-600">{stats.missed}</span>
                  </div>
                </div>
              </div>

              {/* Agent Performance Table */}
              <div>
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">
                  Sales Agent Conversion Leaderboard
                </h3>
                <div className="rounded-2xl border border-slate-200 overflow-hidden">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-100 text-slate-600 font-bold uppercase text-3xs border-b border-slate-200">
                      <tr>
                        <th className="p-3">Sales Agent</th>
                        <th className="p-3 text-center">Assigned Leads</th>
                        <th className="p-3 text-center">Confirmed</th>
                        <th className="p-3 text-center">Lost / Missed</th>
                        <th className="p-3 text-right">Conversion Rate</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                      {agents.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="p-6 text-center text-slate-400">
                            No agent activity logged for current period.
                          </td>
                        </tr>
                      ) : (
                        agents.map((ag) => {
                          const rate = ag.totalLeads > 0 ? Math.round((ag.confirmed / ag.totalLeads) * 100) : 0;
                          return (
                            <tr key={ag.agentId} className="hover:bg-slate-50">
                              <td className="p-3 font-bold text-slate-900">{ag.agentName}</td>
                              <td className="p-3 text-center">{ag.totalLeads}</td>
                              <td className="p-3 text-center text-emerald-600 font-bold">{ag.confirmed}</td>
                              <td className="p-3 text-center text-rose-600">{ag.missed}</td>
                              <td className="p-3 text-right font-bold text-slate-900">{rate}%</td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center text-xs">
              <span className="text-slate-400">
                Data generated in real-time from Shanvi Hospitality booking ledger.
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl transition cursor-pointer"
                >
                  Print Report
                </button>
                <button
                  type="button"
                  onClick={() => setIsSalesReportOpen(false)}
                  className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl shadow-xs transition cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
