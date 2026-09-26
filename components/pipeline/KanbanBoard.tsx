'use client';

import React, { useState, useEffect, useMemo } from 'react';
import LeadModal from './LeadModal';
import LeadDetailDrawer from './LeadDetailDrawer';

export type Lead = {
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
  updatedAt: string;
  assignedAgent?: {
    id: string;
    name: string;
    email: string;
    role: string;
  } | null;
  _count?: {
    notes: number;
  };
};

type StaffOption = {
  id: string;
  name: string;
  email: string;
  role: string;
};

type KanbanBoardProps = {
  userRole: 'admin' | 'staff_agent' | 'accounts';
  currentUserId: string;
  initialOpenCreateModal?: boolean;
  prefillDestination?: string;
  onModalClosed?: () => void;
};

const COLUMNS = [
  {
    id: 'ENQUIRY',
    title: 'Enquiry',
    color: 'border-blue-500 bg-blue-50/50 text-blue-800',
    badge: 'bg-blue-100 text-blue-800',
    description: 'Fresh client enquiries awaiting initial proposal',
  },
  {
    id: 'IN_PROGRESS',
    title: 'In Progress',
    color: 'border-amber-500 bg-amber-50/50 text-amber-800',
    badge: 'bg-amber-100 text-amber-800',
    description: 'Active discussions, quotes and itinerary adjustments',
  },
  {
    id: 'CONFIRMED',
    title: 'Confirmed',
    color: 'border-emerald-500 bg-emerald-50/50 text-emerald-800',
    badge: 'bg-emerald-100 text-emerald-800',
    description: 'Booking agreed, advance deposit or confirmation received',
  },
  {
    id: 'MISSED',
    title: 'Missed',
    color: 'border-rose-500 bg-rose-50/50 text-rose-800',
    badge: 'bg-rose-100 text-rose-800',
    description: 'Lost to competitor, cancelled, or unresponsive',
  },
] as const;

export default function KanbanBoard({
  userRole,
  currentUserId,
  initialOpenCreateModal,
  prefillDestination,
  onModalClosed,
}: KanbanBoardProps) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [staffList, setStaffList] = useState<StaffOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAgentId, setSelectedAgentId] = useState('');
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(initialOpenCreateModal || false);
  const [draggingLeadId, setDraggingLeadId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);

  useEffect(() => {
    if (initialOpenCreateModal) {
      setIsCreateModalOpen(true);
    }
  }, [initialOpenCreateModal]);

  // Fetch leads and staff
  async function loadData() {
    setLoading(true);
    try {
      // Build leads URL
      const params = new URLSearchParams();
      if (searchQuery) params.set('search', searchQuery);
      if (selectedAgentId) params.set('assignedAgentId', selectedAgentId);

      const leadsRes = await fetch(`/api/leads?${params.toString()}`);
      const leadsData = await leadsRes.json();
      if (leadsRes.ok) {
        setLeads(leadsData.leads || []);
      }

      // If admin, also fetch staff members for filtering and assignment
      if (userRole === 'admin') {
        const staffRes = await fetch('/api/staff');
        const staffData = await staffRes.json();
        if (staffRes.ok) {
          setStaffList(staffData.staff || []);
        }
      }
    } catch (err) {
      console.error('Failed to load leads:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, selectedAgentId]);

  // Handle Drag and Drop
  function handleDragStart(e: React.DragEvent, leadId: string) {
    if (userRole === 'accounts') return;
    e.dataTransfer.setData('text/plain', leadId);
    setDraggingLeadId(leadId);
  }

  function handleDragOver(e: React.DragEvent, colId: string) {
    if (userRole === 'accounts') return;
    e.preventDefault();
    setDragOverColumn(colId);
  }

  async function handleDrop(e: React.DragEvent, targetStatus: 'ENQUIRY' | 'IN_PROGRESS' | 'CONFIRMED' | 'MISSED') {
    if (userRole === 'accounts') return;
    e.preventDefault();
    setDragOverColumn(null);
    const leadId = e.dataTransfer.getData('text/plain') || draggingLeadId;
    setDraggingLeadId(null);

    if (!leadId) return;

    // Optimistic UI update
    setLeads((prev) =>
      prev.map((l) => (l.id === leadId ? { ...l, status: targetStatus } : l))
    );

    try {
      const res = await fetch(`/api/leads/${leadId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: targetStatus }),
      });
      if (!res.ok) {
        // Revert on failure
        loadData();
      }
    } catch (err) {
      console.error('Status transition failed:', err);
      loadData();
    }
  }

  // Calculate totals per stage
  const stageStats = useMemo(() => {
    const stats: Record<string, { count: number; totalValue: number }> = {
      ENQUIRY: { count: 0, totalValue: 0 },
      IN_PROGRESS: { count: 0, totalValue: 0 },
      CONFIRMED: { count: 0, totalValue: 0 },
      MISSED: { count: 0, totalValue: 0 },
    };

    leads.forEach((l) => {
      if (stats[l.status]) {
        stats[l.status].count += 1;
        stats[l.status].totalValue += l.quotedPrice || 0;
      }
    });
    return stats;
  }, [leads]);

  return (
    <div className="space-y-6">
      {/* Controls Bar */}
      <div className="bg-white p-4 rounded-2xl shadow-xs border border-slate-200/80 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Search & Filters */}
        <div className="flex flex-wrap items-center gap-3 flex-1">
          <div className="relative flex-1 min-w-[240px]">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search traveller, phone, or destination..."
              className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/50"
            />
          </div>

          {userRole === 'admin' && (
            <select
              value={selectedAgentId}
              onChange={(e) => setSelectedAgentId(e.target.value)}
              className="py-2 px-3 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-700"
            >
              <option value="">All Sales Agents</option>
              {staffList.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.role})
                </option>
              ))}
            </select>
          )}

          {(searchQuery || selectedAgentId) && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedAgentId('');
              }}
              className="text-xs font-medium text-slate-500 hover:text-slate-800 underline px-2"
            >
              Reset Filters
            </button>
          )}
        </div>

        {/* Action Button */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => loadData()}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition"
            title="Refresh Leads"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>

          {userRole !== 'accounts' && (
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-xl shadow-xs transition"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
              <span>New Lead</span>
            </button>
          )}
        </div>
      </div>

      {/* Kanban Stage Columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 items-start">
        {COLUMNS.map((col) => {
          const colLeads = leads.filter((l) => l.status === col.id);
          const isOver = dragOverColumn === col.id;

          return (
            <div
              key={col.id}
              onDragOver={(e) => handleDragOver(e, col.id)}
              onDrop={(e) => handleDrop(e, col.id as any)}
              className={`bg-slate-50/80 rounded-2xl p-4 border border-slate-200/70 min-h-[580px] flex flex-col transition-all duration-150 ${
                isOver ? 'ring-2 ring-blue-500 bg-blue-50/30' : ''
              }`}
            >
              {/* Column Header */}
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200/60">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-slate-800 text-sm">{col.title}</h3>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${col.badge}`}>
                    {stageStats[col.id]?.count || 0}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-slate-600">
                    ₹{(stageStats[col.id]?.totalValue || 0).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Cards List */}
              <div className="flex-1 space-y-3 overflow-y-auto">
                {colLeads.length === 0 ? (
                  <div className="h-32 border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center text-xs text-slate-400">
                    No leads in this stage
                  </div>
                ) : (
                  colLeads.map((lead) => {
                    const isDragging = draggingLeadId === lead.id;

                    return (
                      <div
                        key={lead.id}
                        draggable={userRole !== 'accounts'}
                        onDragStart={(e) => handleDragStart(e, lead.id)}
                        onClick={() => setSelectedLeadId(lead.id)}
                        className={`bg-white p-4 rounded-xl shadow-xs border border-slate-200/90 hover:border-blue-300 hover:shadow-md transition cursor-pointer select-none ${
                          isDragging ? 'opacity-40 ring-2 ring-blue-400' : ''
                        }`}
                      >
                        {/* Destination & Source Tag */}
                        <div className="flex items-center justify-between text-xs mb-2">
                          <span className="font-bold text-blue-600 flex items-center gap-1 truncate max-w-[140px]">
                            <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            {lead.destination}
                          </span>
                          <span className="text-2xs font-semibold uppercase px-2 py-0.5 rounded-md bg-slate-100 text-slate-500">
                            {lead.source}
                          </span>
                        </div>

                        {/* Traveller Name */}
                        <h4 className="font-bold text-slate-900 text-sm mb-1 leading-snug">
                          {lead.name}
                        </h4>

                        {/* Phone & Pax */}
                        <div className="text-xs text-slate-500 flex items-center justify-between mb-3">
                          <div className="flex items-center gap-1.5">
                            <span>{lead.phone}</span>
                            <a
                              href={`https://wa.me/${lead.phone.replace(/[^0-9]/g, '')}?text=Hello%20${encodeURIComponent(
                                lead.name
                              )}%2C%20greetings%20from%20Shanvi%20Hospitality!`}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="px-1.5 py-0.5 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-3xs font-extrabold border border-emerald-200 transition"
                              title="Direct WhatsApp"
                            >
                              💬 WA
                            </a>
                          </div>
                          <span className="font-medium text-slate-600">{lead.paxCount} Pax</span>
                        </div>

                        {/* Footer: Price, Agent & Notes count */}
                        <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between">
                          <div className="text-xs font-bold text-slate-900">
                            {lead.currency === 'INR' ? '₹' : '$'}
                            {lead.quotedPrice.toLocaleString()}
                          </div>

                          <div className="flex items-center gap-2">
                            {/* Notes Count */}
                            {(lead._count?.notes ?? 0) > 0 && (
                              <span className="flex items-center gap-0.5 text-2xs text-slate-400 font-medium">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                                </svg>
                                {lead._count?.notes}
                              </span>
                            )}

                            {/* Assigned Agent Tag */}
                            {lead.assignedAgent ? (
                              <span
                                className="text-2xs px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-medium truncate max-w-[80px]"
                                title={`Assigned to ${lead.assignedAgent.name}`}
                              >
                                {lead.assignedAgent.name.split(' ')[0]}
                              </span>
                            ) : (
                              <span className="text-2xs px-1.5 py-0.5 rounded bg-rose-50 text-rose-600 font-medium">
                                Unassigned
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Lead Create Modal */}
      <LeadModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          onModalClosed?.();
        }}
        onLeadCreated={() => loadData()}
        userRole={userRole}
        staffList={staffList}
        prefillDestination={prefillDestination}
      />

      {/* Lead Detail Drawer */}
      <LeadDetailDrawer
        leadId={selectedLeadId}
        onClose={() => setSelectedLeadId(null)}
        onLeadUpdated={() => loadData()}
        userRole={userRole}
      />
    </div>
  );
}
