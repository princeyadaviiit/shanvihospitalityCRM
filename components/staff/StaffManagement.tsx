'use client';

import React, { useState, useEffect } from 'react';

type StaffMember = {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'staff_agent' | 'accounts';
  active: boolean;
  createdAt: string;
  _count?: {
    assignedLeads: number;
  };
};

type StaffManagementProps = {
  currentUserId: string;
};

export default function StaffManagement({ currentUserId }: StaffManagementProps) {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<'admin' | 'staff_agent' | 'accounts'>('staff_agent');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  async function loadStaff() {
    setLoading(true);
    try {
      const res = await fetch('/api/staff');
      const data = await res.json();
      if (res.ok) {
        setStaff(data.staff || []);
      } else {
        setError(data.error);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadStaff();
  }, []);

  async function handleAddStaff(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch('/api/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName,
          email: newEmail,
          role: newRole,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to add staff member');
      }

      setNewName('');
      setNewEmail('');
      setNewRole('staff_agent');
      setIsAddModalOpen(false);
      loadStaff();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleStatus(member: StaffMember) {
    if (member.id === currentUserId && member.active) {
      alert('You cannot deactivate your own admin account.');
      return;
    }

    const confirmAction = window.confirm(
      `Are you sure you want to ${member.active ? 'deactivate' : 'reactivate'} ${member.name}?`
    );
    if (!confirmAction) return;

    setActionInProgress(member.id);
    try {
      const res = await fetch(`/api/staff/${member.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !member.active }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update status');
      }

      setStaff((prev) =>
        prev.map((s) => (s.id === member.id ? { ...s, active: !member.active } : s))
      );
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionInProgress(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-200/80 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Staff & Team Accounts</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage company agents, accounts team, and system access permissions
          </p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-xl shadow-xs transition"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
          </svg>
          <span>Add Staff Member</span>
        </button>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl">
          {error}
        </div>
      )}

      {/* Staff Table */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/75 border-b border-slate-200/80 text-2xs font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3 px-5">Staff Member</th>
                <th className="py-3 px-5">Role</th>
                <th className="py-3 px-5">Status</th>
                <th className="py-3 px-5">Active Leads</th>
                <th className="py-3 px-5">Joined</th>
                <th className="py-3 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                  </td>
                </tr>
              ) : staff.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No staff members found.
                  </td>
                </tr>
              ) : (
                staff.map((member) => {
                  const isCurrent = member.id === currentUserId;
                  return (
                    <tr key={member.id} className="hover:bg-slate-50/50 transition">
                      <td className="py-4 px-5">
                        <div className="font-bold text-slate-900 flex items-center gap-2">
                          {member.name}
                          {isCurrent && (
                            <span className="text-2xs bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded font-bold">
                              You
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-500">{member.email}</div>
                      </td>
                      <td className="py-4 px-5">
                        <span
                          className={`text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                            member.role === 'admin'
                              ? 'bg-purple-100 text-purple-800'
                              : member.role === 'accounts'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {member.role === 'staff_agent' ? 'Sales Agent' : member.role}
                        </span>
                      </td>
                      <td className="py-4 px-5">
                        <span
                          className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full ${
                            member.active
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              member.active ? 'bg-emerald-600' : 'bg-rose-600'
                            }`}
                          ></span>
                          {member.active ? 'Active' : 'Deactivated'}
                        </span>
                      </td>
                      <td className="py-4 px-5 font-medium text-slate-700">
                        {member._count?.assignedLeads ?? 0} leads
                      </td>
                      <td className="py-4 px-5 text-xs text-slate-500">
                        {new Date(member.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-4 px-5 text-right">
                        <button
                          disabled={isCurrent || actionInProgress === member.id}
                          onClick={() => toggleStatus(member)}
                          className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition ${
                            member.active
                              ? 'border-rose-200 text-rose-700 hover:bg-rose-50'
                              : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'
                          } disabled:opacity-30 disabled:cursor-not-allowed`}
                        >
                          {actionInProgress === member.id
                            ? 'Processing...'
                            : member.active
                            ? 'Deactivate'
                            : 'Activate'}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Staff Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center pb-4 mb-4 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Add Staff Account</h3>
                <p className="text-xs text-slate-500 mt-0.5">Provision an internal team member</p>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleAddStaff} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Priya Patel"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="priya@agency.com"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                  Role & Permissions *
                </label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as any)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-slate-900 bg-white"
                >
                  <option value="staff_agent">Staff Agent (Own Leads, Itineraries)</option>
                  <option value="accounts">Accounts (Ledgers, Invoicing, Read-only Leads)</option>
                  <option value="admin">Administrator (Full Access & Staff Management)</option>
                </select>
              </div>

              <div className="pt-4 mt-6 border-t border-slate-100 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-sm font-medium hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-sm transition disabled:opacity-50"
                >
                  {submitting ? 'Creating...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
