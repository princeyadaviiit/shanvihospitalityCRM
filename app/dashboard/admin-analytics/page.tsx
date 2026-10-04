'use client';

import { useEffect, useState } from 'react';

type StaffAnalytics = {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  metrics: {
    totalLeads: number;
    leadsByStatus: Record<string, number>;
    totalRevenue: number;
    receivedAmount: number;
    pendingAmount: number;
    totalCalls: number;
    avgCallDuration: number;
  };
  recentLeads: Array<{
    id: string;
    name: string;
    destination: string;
    status: string;
    quotedPrice: number;
    currency: string;
    createdAt: string;
  }>;
};

type PayrollSummary = {
  employee: {
    id: string;
    name: string;
    email: string;
    department: string;
    designation: string;
    status: string;
  };
  salary: {
    baseSalary: number;
    allowances: number;
    deductions: number;
    netSalary: number;
    commissionRate: number;
  };
  payments: {
    totalPaid: number;
    lastPaymentDate: string | null;
    lastPaymentAmount: number;
    recentPayments: Array<any>;
  };
};

export default function AdminAnalyticsPage() {
  const [analytics, setAnalytics] = useState<StaffAnalytics[]>([]);
  const [payrollSummary, setPayrollSummary] = useState<PayrollSummary[]>([]);
  const [companyTotals, setCompanyTotals] = useState<any>(null);
  const [payrollTotals, setPayrollTotals] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'analytics' | 'payroll'>('analytics');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [analyticsRes, payrollRes] = await Promise.all([
        fetch('/api/admin/analytics'),
        fetch('/api/admin/payroll-summary'),
      ]);

      if (analyticsRes.ok) {
        const analyticsData = await analyticsRes.json();
        setAnalytics(analyticsData.analytics);
        setCompanyTotals(analyticsData.companyTotals);
      }

      if (payrollRes.ok) {
        const payrollData = await payrollRes.json();
        setPayrollSummary(payrollData.payrollSummary);
        setPayrollTotals(payrollData.companyPayrollTotals);
      }
    } catch (error) {
      console.error('Failed to fetch admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number, currency: string = 'INR') => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}m ${secs}s`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 font-medium">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Admin Analytics</h1>
          <p className="text-slate-600">
            Comprehensive tracking of staff performance, revenue, and payroll
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-slate-200">
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-6 py-3 font-semibold transition-colors border-b-2 ${
              activeTab === 'analytics'
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            Staff Analytics
          </button>
          <button
            onClick={() => setActiveTab('payroll')}
            className={`px-6 py-3 font-semibold transition-colors border-b-2 ${
              activeTab === 'payroll'
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            Payroll Summary
          </button>
        </div>

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <>
            {/* Company Totals */}
            {companyTotals && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                  <p className="text-sm font-semibold text-slate-600 mb-1">Total Leads</p>
                  <p className="text-3xl font-bold text-slate-900">{companyTotals.totalLeads}</p>
                </div>
                <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                  <p className="text-sm font-semibold text-slate-600 mb-1">Total Revenue</p>
                  <p className="text-3xl font-bold text-emerald-600">
                    {formatCurrency(companyTotals.totalRevenue)}
                  </p>
                </div>
                <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                  <p className="text-sm font-semibold text-slate-600 mb-1">Received</p>
                  <p className="text-3xl font-bold text-blue-600">
                    {formatCurrency(companyTotals.receivedAmount)}
                  </p>
                </div>
                <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                  <p className="text-sm font-semibold text-slate-600 mb-1">Pending</p>
                  <p className="text-3xl font-bold text-orange-600">
                    {formatCurrency(companyTotals.pendingAmount)}
                  </p>
                </div>
              </div>
            )}

            {/* Staff Analytics Cards */}
            <div className="space-y-4">
              {analytics.map((staff) => (
                <div key={staff.user.id} className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-slate-900">{staff.user.name}</h3>
                      <p className="text-sm text-slate-600">{staff.user.email}</p>
                      <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                        {staff.user.role.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                  </div>

                  {/* Metrics Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
                    <div className="text-center p-3 rounded-lg bg-slate-50">
                      <p className="text-2xl font-bold text-slate-900">{staff.metrics.totalLeads}</p>
                      <p className="text-xs text-slate-600 font-medium">Total Leads</p>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-emerald-50">
                      <p className="text-2xl font-bold text-emerald-700">
                        {staff.metrics.leadsByStatus.CONFIRMED || 0}
                      </p>
                      <p className="text-xs text-emerald-600 font-medium">Confirmed</p>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-blue-50">
                      <p className="text-lg font-bold text-blue-700">
                        {formatCurrency(staff.metrics.totalRevenue)}
                      </p>
                      <p className="text-xs text-blue-600 font-medium">Revenue</p>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-orange-50">
                      <p className="text-lg font-bold text-orange-700">
                        {formatCurrency(staff.metrics.pendingAmount)}
                      </p>
                      <p className="text-xs text-orange-600 font-medium">Pending</p>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-purple-50">
                      <p className="text-2xl font-bold text-purple-700">{staff.metrics.totalCalls}</p>
                      <p className="text-xs text-purple-600 font-medium">Calls</p>
                    </div>
                  </div>

                  {/* Recent Leads */}
                  {staff.recentLeads.length > 0 && (
                    <div className="mt-4">
                      <h4 className="text-sm font-semibold text-slate-700 mb-2">Recent Leads</h4>
                      <div className="space-y-2">
                        {staff.recentLeads.slice(0, 3).map((lead) => (
                          <div key={lead.id} className="flex justify-between items-center text-sm p-2 rounded bg-slate-50">
                            <div>
                              <span className="font-semibold text-slate-900">{lead.name}</span>
                              <span className="text-slate-600 mx-2">→</span>
                              <span className="text-slate-600">{lead.destination}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                                lead.status === 'CONFIRMED' ? 'bg-emerald-100 text-emerald-700' :
                                lead.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-700' :
                                lead.status === 'ENQUIRY' ? 'bg-slate-100 text-slate-700' :
                                'bg-red-100 text-red-700'
                              }`}>
                                {lead.status}
                              </span>
                              <span className="font-semibold text-slate-900">
                                {formatCurrency(lead.quotedPrice, lead.currency)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        {/* Payroll Tab */}
        {activeTab === 'payroll' && (
          <>
            {/* Payroll Totals */}
            {payrollTotals && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                  <p className="text-sm font-semibold text-slate-600 mb-1">Total Employees</p>
                  <p className="text-3xl font-bold text-slate-900">{payrollTotals.totalEmployees}</p>
                </div>
                <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                  <p className="text-sm font-semibold text-slate-600 mb-1">Active Employees</p>
                  <p className="text-3xl font-bold text-emerald-600">{payrollTotals.activeEmployees}</p>
                </div>
                <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                  <p className="text-sm font-semibold text-slate-600 mb-1">Monthly Budget</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {formatCurrency(payrollTotals.monthlyPayrollBudget)}
                  </p>
                </div>
                <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                  <p className="text-sm font-semibold text-slate-600 mb-1">Paid This Year</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {formatCurrency(payrollTotals.totalPaidThisYear)}
                  </p>
                </div>
              </div>
            )}

            {/* Employee Payroll Cards */}
            <div className="space-y-4">
              {payrollSummary.map((employee) => (
                <div key={employee.employee.id} className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-slate-900">{employee.employee.name}</h3>
                      <p className="text-sm text-slate-600">{employee.employee.email}</p>
                      <div className="flex gap-2 mt-1">
                        <span className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
                          {employee.employee.department}
                        </span>
                        <span className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                          {employee.employee.designation}
                        </span>
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${
                          employee.employee.status === 'ACTIVE'
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {employee.employee.status}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Salary Breakdown */}
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div className="text-center p-3 rounded-lg bg-slate-50">
                      <p className="text-lg font-bold text-slate-900">
                        {formatCurrency(employee.salary.baseSalary)}
                      </p>
                      <p className="text-xs text-slate-600 font-medium">Base Salary</p>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-emerald-50">
                      <p className="text-lg font-bold text-emerald-700">
                        {formatCurrency(employee.salary.allowances)}
                      </p>
                      <p className="text-xs text-emerald-600 font-medium">Allowances</p>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-red-50">
                      <p className="text-lg font-bold text-red-700">
                        {formatCurrency(employee.salary.deductions)}
                      </p>
                      <p className="text-xs text-red-600 font-medium">Deductions</p>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-blue-50">
                      <p className="text-lg font-bold text-blue-700">
                        {formatCurrency(employee.salary.netSalary)}
                      </p>
                      <p className="text-xs text-blue-600 font-medium">Net Salary</p>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-purple-50">
                      <p className="text-lg font-bold text-purple-700">
                        {formatCurrency(employee.payments.totalPaid)}
                      </p>
                      <p className="text-xs text-purple-600 font-medium">Total Paid</p>
                    </div>
                  </div>

                  {/* Last Payment Info */}
                  {employee.payments.lastPaymentDate && (
                    <div className="mt-4 p-3 bg-slate-50 rounded-lg">
                      <p className="text-xs text-slate-600 font-medium">Last Payment</p>
                      <p className="text-sm text-slate-900 font-semibold">
                        {formatCurrency(employee.payments.lastPaymentAmount)} on{' '}
                        {new Date(employee.payments.lastPaymentDate).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
