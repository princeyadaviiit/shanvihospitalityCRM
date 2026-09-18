'use client';

import React, { useState, useEffect } from 'react';

type Note = {
  id: string;
  content: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    role: string;
  };
};

type LeadDetail = {
  id: string;
  name: string;
  email: string | null;
  phone: string;
  destination: string;
  paxCount: number;
  status: 'ENQUIRY' | 'IN_PROGRESS' | 'CONFIRMED' | 'MISSED';
  quotedPrice: number;
  currency: string;
  source: string;
  createdAt: string;
  assignedAgent?: {
    id: string;
    name: string;
    email: string;
    role: string;
  } | null;
  notes: Note[];
};

type LeadDetailDrawerProps = {
  leadId: string | null;
  onClose: () => void;
  onLeadUpdated: () => void;
  userRole: 'admin' | 'staff_agent' | 'accounts';
};

const STAGES = [
  { key: 'ENQUIRY', label: 'Enquiry', color: 'blue' },
  { key: 'IN_PROGRESS', label: 'In Progress', color: 'amber' },
  { key: 'CONFIRMED', label: 'Confirmed', color: 'emerald' },
  { key: 'MISSED', label: 'Missed', color: 'rose' },
] as const;

export default function LeadDetailDrawer({
  leadId,
  onClose,
  onLeadUpdated,
  userRole,
}: LeadDetailDrawerProps) {
  const [lead, setLead] = useState<LeadDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [submittingNote, setSubmittingNote] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!leadId) {
      setLead(null);
      return;
    }
    fetchLeadDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leadId]);

  async function fetchLeadDetails() {
    if (!leadId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/leads/${leadId}`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to load lead');
      }
      setLead(data.lead);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleStatusChange(newStatus: 'ENQUIRY' | 'IN_PROGRESS' | 'CONFIRMED' | 'MISSED') {
    if (!leadId || !lead || userRole === 'accounts') return;
    setUpdatingStatus(true);
    try {
      const res = await fetch(`/api/leads/${leadId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update status');

      setLead((prev) => (prev ? { ...prev, status: newStatus } : null));
      onLeadUpdated();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setUpdatingStatus(false);
    }
  }

  async function handleAddNote(e: React.FormEvent) {
    e.preventDefault();
    if (!leadId || !newNote.trim() || userRole === 'accounts') return;
    setSubmittingNote(true);
    try {
      const res = await fetch(`/api/leads/${leadId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newNote.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add note');

      setNewNote('');
      setLead((prev) => (prev ? { ...prev, notes: [data.note, ...prev.notes] } : null));
      onLeadUpdated();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmittingNote(false);
    }
  }

  if (!leadId) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/50 backdrop-blur-xs flex justify-end">
      <div className="w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col border-l border-slate-100 animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex justify-between items-start bg-slate-50/50">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-200 text-slate-700 uppercase tracking-wider">
                {lead?.source || 'Lead'}
              </span>
              <span className="text-xs text-slate-400">
                Created {lead ? new Date(lead.createdAt).toLocaleDateString() : ''}
              </span>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mt-1">
              {lead?.name || 'Loading traveller...'}
            </h2>
            <p className="text-sm font-medium text-blue-600 flex items-center gap-1.5 mt-0.5">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {lead?.destination}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          )}

          {error && (
            <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl">
              {error}
            </div>
          )}

          {lead && (
            <>
              {/* Pipeline Stage Controller */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Pipeline Stage
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {STAGES.map((s) => {
                    const isActive = lead.status === s.key;
                    return (
                      <button
                        key={s.key}
                        disabled={updatingStatus || userRole === 'accounts'}
                        onClick={() => handleStatusChange(s.key)}
                        className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                          isActive
                            ? s.key === 'CONFIRMED'
                              ? 'bg-emerald-600 text-white shadow-sm'
                              : s.key === 'MISSED'
                              ? 'bg-rose-600 text-white shadow-sm'
                              : s.key === 'IN_PROGRESS'
                              ? 'bg-amber-500 text-white shadow-sm'
                              : 'bg-blue-600 text-white shadow-sm'
                            : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                        } disabled:opacity-50`}
                      >
                        {isActive && (
                          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
                        )}
                        {s.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Key Details Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border border-slate-100 bg-white">
                  <span className="text-xs text-slate-400 font-semibold uppercase">Contact Phone</span>
                  <div className="text-base font-bold text-slate-800 mt-1 flex items-center gap-1.5">
                    <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    {lead.phone}
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-slate-100 bg-white">
                  <span className="text-xs text-slate-400 font-semibold uppercase">Email</span>
                  <div className="text-base font-bold text-slate-800 mt-1 truncate">
                    {lead.email || 'Not provided'}
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-slate-100 bg-white">
                  <span className="text-xs text-slate-400 font-semibold uppercase">Travellers (Pax)</span>
                  <div className="text-base font-bold text-slate-800 mt-1">
                    {lead.paxCount} {lead.paxCount === 1 ? 'Person' : 'People'}
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-slate-100 bg-white">
                  <span className="text-xs text-slate-400 font-semibold uppercase">Quoted Package</span>
                  <div className="text-base font-bold text-blue-600 mt-1">
                    {lead.currency === 'INR' ? '₹' : '$'}
                    {lead.quotedPrice.toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Assigned Agent */}
              <div className="p-4 rounded-xl border border-slate-100 bg-slate-50 flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-500 font-semibold uppercase">Assigned Sales Agent</span>
                  <div className="text-sm font-bold text-slate-800 mt-0.5">
                    {lead.assignedAgent?.name || 'Unassigned (General Pool)'}
                  </div>
                </div>
                {lead.assignedAgent && (
                  <span className="text-xs px-2.5 py-1 rounded-full bg-blue-100 text-blue-800 font-semibold">
                    {lead.assignedAgent.role}
                  </span>
                )}
              </div>

              {/* Notes Timeline */}
              <div className="border-t border-slate-100 pt-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                    </svg>
                    Communication & Manual Notes
                  </h3>
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600">
                    {lead.notes.length} {lead.notes.length === 1 ? 'note' : 'notes'}
                  </span>
                </div>

                {/* Add Note Input */}
                {userRole !== 'accounts' && (
                  <form onSubmit={handleAddNote} className="mb-6">
                    <div className="border border-slate-200 rounded-2xl overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 bg-white">
                      <textarea
                        rows={3}
                        value={newNote}
                        onChange={(e) => setNewNote(e.target.value)}
                        placeholder="Log phone discussion, traveller preferences, flight details, or budget notes..."
                        className="w-full p-3.5 text-sm text-slate-900 focus:outline-none resize-none placeholder-slate-400"
                      />
                      <div className="px-3 py-2 bg-slate-50 border-t border-slate-100 flex justify-end">
                        <button
                          type="submit"
                          disabled={submittingNote || !newNote.trim()}
                          className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition disabled:opacity-40"
                        >
                          {submittingNote ? 'Saving...' : 'Add Note'}
                        </button>
                      </div>
                    </div>
                  </form>
                )}

                {/* Notes List */}
                <div className="space-y-3">
                  {lead.notes.length === 0 ? (
                    <p className="text-xs text-slate-400 italic text-center py-6">
                      No notes recorded yet for this traveller.
                    </p>
                  ) : (
                    lead.notes.map((note) => (
                      <div
                        key={note.id}
                        className="p-3.5 rounded-xl border border-slate-100 bg-white shadow-xs hover:border-slate-200 transition"
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-bold text-slate-800">
                            {note.user.name} ({note.user.role})
                          </span>
                          <span className="text-2xs text-slate-400">
                            {new Date(note.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-sm text-slate-700 whitespace-pre-wrap">
                          {note.content}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
