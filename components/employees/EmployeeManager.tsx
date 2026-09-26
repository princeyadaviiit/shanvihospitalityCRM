'use client';

import React, { useState, useEffect } from 'react';

export interface Employee {
  id: string;
  name: string;
  email: string;
  phone: string;
  department: string;
  designation: string;
  joiningDate: string;
  baseSalary: number;
  allowances: number;
  deductions: number;
  netSalary: number;
  bankName?: string | null;
  accountNumber?: string | null;
  ifscCode?: string | null;
  panNumber?: string | null;
  status: 'ACTIVE' | 'ON_LEAVE' | 'RESIGNED';
  commissionRate: number;
  salaryPayments?: SalaryPayment[];
}

export interface SalaryPayment {
  id: string;
  employeeId: string;
  month: string;
  baseAmount: number;
  bonusAmount: number;
  deductions: number;
  netPaid: number;
  paymentDate: string;
  paymentMode: string;
  paymentStatus: string;
  transactionRef?: string | null;
  notes?: string | null;
  employee?: {
    name: string;
    designation: string;
    department: string;
  };
}

interface PayrollSummary {
  totalMonthlyPayroll: number;
  headcount: number;
  activeStaff: number;
  averageSalary: number;
}

export default function EmployeeManager() {
  const [activeTab, setActiveTab] = useState<'directory' | 'payroll'>('directory');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [payments, setPayments] = useState<SalaryPayment[]>([]);
  const [summary, setSummary] = useState<PayrollSummary>({
    totalMonthlyPayroll: 0,
    headcount: 0,
    activeStaff: 0,
    averageSalary: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('ALL');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);
  const [selectedEmployeeForPay, setSelectedEmployeeForPay] = useState<Employee | null>(null);
  const [selectedEmployeeForView, setSelectedEmployeeForView] = useState<Employee | null>(null);

  // New Employee Form
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    department: 'Sales',
    designation: '',
    joiningDate: new Date().toISOString().split('T')[0],
    baseSalary: 45000,
    allowances: 10000,
    deductions: 2500,
    bankName: 'HDFC Bank',
    accountNumber: '',
    ifscCode: 'HDFC0000288',
    panNumber: '',
    commissionRate: 2.0,
    status: 'ACTIVE' as const,
  });

  // New Payment Form
  const [payFormData, setPayFormData] = useState({
    employeeId: '',
    month: 'September 2026',
    baseAmount: 0,
    bonusAmount: 0,
    deductions: 0,
    paymentMode: 'NEFT' as const,
    transactionRef: '',
    notes: '',
  });

  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchEmployees();
    fetchPayroll();
  }, []);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/employees');
      const data = await res.json();
      if (data.employees) {
        setEmployees(data.employees);
      }
    } catch (err) {
      console.error('Failed to load employees:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPayroll = async () => {
    try {
      const res = await fetch('/api/payroll');
      const data = await res.json();
      if (data.payments) {
        setPayments(data.payments);
      }
      if (data.summary) {
        setSummary(data.summary);
      }
    } catch (err) {
      console.error('Failed to load payroll:', err);
    }
  };

  const handleCreateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.success) {
        setShowAddModal(false);
        setActionSuccess(`Employee ${formData.name} added successfully.`);
        fetchEmployees();
        fetchPayroll();
        setTimeout(() => setActionSuccess(null), 4000);
      } else {
        alert(data.error || 'Failed to create employee');
      }
    } catch (err) {
      alert('Error creating employee');
    }
  };

  const handleOpenPayModal = (emp: Employee) => {
    setSelectedEmployeeForPay(emp);
    setPayFormData({
      employeeId: emp.id,
      month: 'September 2026',
      baseAmount: emp.baseSalary,
      bonusAmount: emp.allowances,
      deductions: emp.deductions,
      paymentMode: 'NEFT',
      transactionRef: `SHV-NEFT-${Math.floor(100000 + Math.random() * 900000)}`,
      notes: `Salary disbursement for ${emp.name} (September 2026)`,
    });
    setShowPayModal(true);
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const netPaid = payFormData.baseAmount + payFormData.bonusAmount - payFormData.deductions;
      const res = await fetch('/api/payroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...payFormData,
          netPaid,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setShowPayModal(false);
        setActionSuccess(`Salary payment recorded for ${selectedEmployeeForPay?.name || 'employee'}.`);
        fetchPayroll();
        setTimeout(() => setActionSuccess(null), 4000);
      } else {
        alert(data.error || 'Failed to record payment');
      }
    } catch (err) {
      alert('Error recording payment');
    }
  };

  const departments = ['ALL', 'Tour Planning', 'Sales', 'Operations', 'Accounts'];

  const filteredEmployees = employees.filter((emp) => {
    const matchesSearch =
      emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.designation.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDept = selectedDept === 'ALL' || emp.department === selectedDept;
    return matchesSearch && matchesDept;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner & KPI Bento Grid */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-900 text-white uppercase tracking-wider">
              HRMS & Payroll
            </span>
            <span className="text-xs font-medium text-slate-500">Confidential Financials</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Shanvi Hospitality Staff & Payroll</h2>
          <p className="text-sm text-slate-600 mt-0.5">
            Manage team members, salary compensation structures, bank remittance details, and monthly payouts.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveTab('directory')}
            className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer flex items-center gap-2 ${
              activeTab === 'directory'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            Staff Directory ({employees.length})
          </button>

          <button
            onClick={() => setActiveTab('payroll')}
            className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer flex items-center gap-2 ${
              activeTab === 'payroll'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Disbursement Ledger ({payments.length})
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2.5 rounded-xl text-sm font-semibold bg-orange-600 hover:bg-orange-700 text-white shadow-sm transition-all duration-200 cursor-pointer flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Employee
          </button>
        </div>
      </div>

      {actionSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl text-sm font-medium flex items-center gap-3">
          <svg className="w-5 h-5 text-emerald-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          {actionSuccess}
        </div>
      )}

      {/* KPI Cards Bento Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Monthly Payroll</span>
            <div className="w-8 h-8 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">
            ₹{summary.totalMonthlyPayroll.toLocaleString('en-IN')}
          </div>
          <p className="text-xs text-slate-500 mt-1">Disbursed on 1st–7th of each month</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Headcount</span>
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">
            {summary.headcount} Team Members
          </div>
          <p className="text-xs text-emerald-600 font-medium mt-1">
            {summary.activeStaff} currently active on duty
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Average Salary</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">
            ₹{summary.averageSalary.toLocaleString('en-IN')}
          </div>
          <p className="text-xs text-slate-500 mt-1">Across Tour, Sales & Operations</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Payment Mode</span>
            <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
          </div>
          <div className="text-xl font-bold text-slate-900 mt-2">
            Direct Bank NEFT / IMPS
          </div>
          <p className="text-xs text-slate-500 mt-1">HDFC Bank corporate payroll</p>
        </div>
      </div>

      {/* Directory Tab View */}
      {activeTab === 'directory' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200/80">
            <div className="relative w-full sm:w-80">
              <svg className="w-4 h-4 absolute left-3 top-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search staff by name, role or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-colors"
              />
            </div>

            <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
              {departments.map((dept) => (
                <button
                  key={dept}
                  onClick={() => setSelectedDept(dept)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                    selectedDept === dept
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {dept}
                </button>
              ))}
            </div>
          </div>

          {/* Employee Table */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    <th className="py-3.5 px-4">Employee</th>
                    <th className="py-3.5 px-4">Department & Role</th>
                    <th className="py-3.5 px-4">Compensation</th>
                    <th className="py-3.5 px-4">Bank & Tax Info</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {filteredEmployees.map((emp) => (
                    <tr key={emp.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-4 px-4">
                        <div className="font-semibold text-slate-900">{emp.name}</div>
                        <div className="text-xs text-slate-500">{emp.email}</div>
                        <div className="text-xs text-slate-400 mt-0.5">{emp.phone}</div>
                      </td>

                      <td className="py-4 px-4">
                        <span className="inline-block px-2.5 py-0.5 rounded-md text-xs font-medium bg-slate-100 text-slate-800">
                          {emp.department}
                        </span>
                        <div className="font-medium text-slate-700 text-xs mt-1">{emp.designation}</div>
                        {emp.commissionRate > 0 && (
                          <div className="text-xs text-orange-600 font-semibold mt-0.5">
                            +{emp.commissionRate}% Sales Incentive
                          </div>
                        )}
                      </td>

                      <td className="py-4 px-4">
                        <div className="font-bold text-slate-900">₹{emp.netSalary.toLocaleString('en-IN')}<span className="text-xs font-normal text-slate-500">/mo</span></div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          Base: ₹{emp.baseSalary.toLocaleString('en-IN')} | Allow: +₹{emp.allowances.toLocaleString('en-IN')}
                        </div>
                        <div className="text-xs text-rose-500">
                          Deduct: -₹{emp.deductions.toLocaleString('en-IN')}
                        </div>
                      </td>

                      <td className="py-4 px-4 text-xs">
                        <div className="font-medium text-slate-800">{emp.bankName || 'HDFC Bank'}</div>
                        <div className="text-slate-500 font-mono text-[11px]">A/C: {emp.accountNumber || '•••••••••'}</div>
                        <div className="text-slate-400 font-mono text-[11px]">IFSC: {emp.ifscCode || 'HDFC0000288'}</div>
                      </td>

                      <td className="py-4 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                            emp.status === 'ACTIVE'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : emp.status === 'ON_LEAVE'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${emp.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                          {emp.status}
                        </span>
                      </td>

                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setSelectedEmployeeForView(emp)}
                            className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                          >
                            Details
                          </button>
                          <button
                            onClick={() => handleOpenPayModal(emp)}
                            className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200 transition-colors cursor-pointer flex items-center gap-1"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                            Disburse
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}

                  {filteredEmployees.length === 0 && !loading && (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-sm text-slate-500">
                        No employees found matching your criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Payroll Ledger Tab View */}
      {activeTab === 'payroll' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900">Salary Disbursement Log</h3>
                <p className="text-xs text-slate-500">Official record of executed bank remittances for Shanvi Hospitality staff</p>
              </div>
              <div className="text-xs font-medium text-slate-600 bg-white px-3 py-1.5 rounded-lg border border-slate-200">
                FY 2026-27 Registered
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    <th className="py-3.5 px-4">Transaction / Ref</th>
                    <th className="py-3.5 px-4">Staff Member</th>
                    <th className="py-3.5 px-4">Pay Period</th>
                    <th className="py-3.5 px-4">Net Paid</th>
                    <th className="py-3.5 px-4">Mode</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Payment Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {payments.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-mono text-xs font-semibold text-slate-800">{p.transactionRef}</div>
                        <div className="text-[11px] text-slate-400">ID: {p.id.slice(0, 12)}...</div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-900">{p.employee?.name || 'Staff Member'}</div>
                        <div className="text-xs text-slate-500">{p.employee?.designation}</div>
                      </td>

                      <td className="py-3.5 px-4 text-slate-700 font-medium">
                        {p.month}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">₹{p.netPaid.toLocaleString('en-IN')}</div>
                        <div className="text-[11px] text-slate-400">Base: ₹{p.baseAmount.toLocaleString('en-IN')}</div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded text-xs font-mono bg-slate-100 text-slate-700 font-medium">
                          {p.paymentMode}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          {p.paymentStatus}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right text-xs text-slate-500 font-mono">
                        {new Date(p.paymentDate).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                    </tr>
                  ))}

                  {payments.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-sm text-slate-500">
                        No salary payments recorded yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Add Employee Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Add New Team Member</h3>
                <p className="text-xs text-slate-500">Register employee and define compensation breakdown</p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 flex items-center justify-center transition-colors cursor-pointer"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleCreateEmployee} className="p-6 overflow-y-auto space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                    placeholder="e.g. Rahul Sharma"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                    placeholder="e.g. rahul@shanvihospitality.in"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                    placeholder="+91 9999885087"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Department *</label>
                  <select
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                  >
                    <option value="Tour Planning">Tour Planning</option>
                    <option value="Sales">Sales</option>
                    <option value="Operations">Operations</option>
                    <option value="Accounts">Accounts</option>
                    <option value="Management">Management</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Designation / Role *</label>
                  <input
                    type="text"
                    required
                    value={formData.designation}
                    onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                    placeholder="e.g. Senior Tour Planner"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Joining Date</label>
                  <input
                    type="date"
                    value={formData.joiningDate}
                    onChange={(e) => setFormData({ ...formData, joiningDate: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                  />
                </div>
              </div>

              {/* Compensation */}
              <div className="pt-2 border-t border-slate-100">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">Monthly Compensation (INR)</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Base Salary (₹)</label>
                    <input
                      type="number"
                      min={0}
                      value={formData.baseSalary}
                      onChange={(e) => setFormData({ ...formData, baseSalary: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Allowances / HRA (₹)</label>
                    <input
                      type="number"
                      min={0}
                      value={formData.allowances}
                      onChange={(e) => setFormData({ ...formData, allowances: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Deductions / TDS (₹)</label>
                    <input
                      type="number"
                      min={0}
                      value={formData.deductions}
                      onChange={(e) => setFormData({ ...formData, deductions: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-800"
                    />
                  </div>
                </div>

                <div className="mt-2 p-3 bg-slate-50 rounded-lg flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700">Calculated Net In-Hand:</span>
                  <span className="font-bold text-base text-slate-900">
                    ₹{(formData.baseSalary + formData.allowances - formData.deductions).toLocaleString('en-IN')} / month
                  </span>
                </div>
              </div>

              {/* Bank Details */}
              <div className="pt-2 border-t border-slate-100">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">Bank & Tax Details</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Bank Name</label>
                    <input
                      type="text"
                      value={formData.bankName}
                      onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-800"
                      placeholder="e.g. HDFC Bank"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Account Number</label>
                    <input
                      type="text"
                      value={formData.accountNumber}
                      onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-800"
                      placeholder="e.g. 50100492819283"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">IFSC Code</label>
                    <input
                      type="text"
                      value={formData.ifscCode}
                      onChange={(e) => setFormData({ ...formData, ifscCode: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-800 font-mono"
                      placeholder="e.g. HDFC0000288"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">PAN Number</label>
                    <input
                      type="text"
                      value={formData.panNumber}
                      onChange={(e) => setFormData({ ...formData, panNumber: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-800 font-mono uppercase"
                      placeholder="e.g. ABCDE1234F"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-sm font-semibold shadow-sm transition-colors cursor-pointer"
                >
                  Save Employee Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Salary Payment Modal */}
      {showPayModal && selectedEmployeeForPay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Record Salary Disbursement</h3>
                <p className="text-xs text-slate-500">For {selectedEmployeeForPay.name} ({selectedEmployeeForPay.designation})</p>
              </div>
              <button
                onClick={() => setShowPayModal(false)}
                className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 flex items-center justify-center transition-colors cursor-pointer"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleRecordPayment} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Pay Period / Month</label>
                <input
                  type="text"
                  required
                  value={payFormData.month}
                  onChange={(e) => setPayFormData({ ...payFormData, month: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-800"
                  placeholder="e.g. September 2026"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Base Amount (₹)</label>
                  <input
                    type="number"
                    value={payFormData.baseAmount}
                    onChange={(e) => setPayFormData({ ...payFormData, baseAmount: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Bonus/Allow (₹)</label>
                  <input
                    type="number"
                    value={payFormData.bonusAmount}
                    onChange={(e) => setPayFormData({ ...payFormData, bonusAmount: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Deductions (₹)</label>
                  <input
                    type="number"
                    value={payFormData.deductions}
                    onChange={(e) => setPayFormData({ ...payFormData, deductions: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-800"
                  />
                </div>
              </div>

              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-800">Net Disbursement Amount:</span>
                <span className="text-lg font-bold text-emerald-900">
                  ₹{(payFormData.baseAmount + payFormData.bonusAmount - payFormData.deductions).toLocaleString('en-IN')}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Mode</label>
                  <select
                    value={payFormData.paymentMode}
                    onChange={(e) => setPayFormData({ ...payFormData, paymentMode: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-800"
                  >
                    <option value="NEFT">NEFT Bank Transfer</option>
                    <option value="IMPS">IMPS Instant</option>
                    <option value="UPI">UPI Transfer</option>
                    <option value="CHEQUE">Bank Cheque</option>
                    <option value="CASH">Cash Voucher</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Transaction Ref / UTR</label>
                  <input
                    type="text"
                    value={payFormData.transactionRef}
                    onChange={(e) => setPayFormData({ ...payFormData, transactionRef: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-800 font-mono"
                    placeholder="e.g. HDFC-NEFT-928192"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Remarks / Note</label>
                <input
                  type="text"
                  value={payFormData.notes}
                  onChange={(e) => setPayFormData({ ...payFormData, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-800"
                  placeholder="e.g. Regular monthly payroll disbursement"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowPayModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-sm font-semibold shadow-sm transition-colors cursor-pointer"
                >
                  Confirm Payout Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Employee Details Drawer / Modal */}
      {selectedEmployeeForView && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-900 text-white">
              <div>
                <h3 className="text-lg font-bold">{selectedEmployeeForView.name}</h3>
                <p className="text-xs text-slate-300">{selectedEmployeeForView.designation} • {selectedEmployeeForView.department}</p>
              </div>
              <button
                onClick={() => setSelectedEmployeeForView(null)}
                className="w-8 h-8 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 flex items-center justify-center transition-colors cursor-pointer"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-4 pb-4 border-b border-slate-100">
                <div>
                  <span className="text-xs text-slate-500 font-semibold block uppercase">Contact Phone</span>
                  <span className="font-semibold text-slate-900">{selectedEmployeeForView.phone}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-500 font-semibold block uppercase">Email</span>
                  <span className="font-semibold text-slate-900">{selectedEmployeeForView.email}</span>
                </div>
              </div>

              <div className="pb-4 border-b border-slate-100">
                <span className="text-xs text-slate-500 font-semibold block uppercase mb-2">Salary Breakdown</span>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Base Salary:</span>
                    <span className="font-medium text-slate-900">₹{selectedEmployeeForView.baseSalary.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-emerald-600">
                    <span>Allowances & HRA:</span>
                    <span className="font-medium">+₹{selectedEmployeeForView.allowances.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-rose-600">
                    <span>Statutory Deductions (TDS/PF):</span>
                    <span className="font-medium">-₹{selectedEmployeeForView.deductions.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between font-bold text-sm text-slate-900 pt-2 border-t border-slate-100">
                    <span>Net Monthly Take-Home:</span>
                    <span className="text-orange-600">₹{selectedEmployeeForView.netSalary.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>

              <div>
                <span className="text-xs text-slate-500 font-semibold block uppercase mb-2">Bank & Remittance Account</span>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-1 font-mono">
                  <div>Bank: <span className="font-bold text-slate-800">{selectedEmployeeForView.bankName || 'HDFC Bank'}</span></div>
                  <div>A/C: <span className="font-bold text-slate-800">{selectedEmployeeForView.accountNumber || '50100492819283'}</span></div>
                  <div>IFSC: <span className="font-bold text-slate-800">{selectedEmployeeForView.ifscCode || 'HDFC0000288'}</span></div>
                  <div>PAN: <span className="font-bold text-slate-800">{selectedEmployeeForView.panNumber || 'AFKPS9281M'}</span></div>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => setSelectedEmployeeForView(null)}
                  className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-semibold hover:bg-slate-800 transition-colors cursor-pointer"
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
