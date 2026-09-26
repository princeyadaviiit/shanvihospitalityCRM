'use client';

import React, { useState } from 'react';
import { SHANVI_PACKAGES } from '@/lib/packages-data';

type UserOption = {
  id: string;
  name: string;
  email: string;
  role: string;
};

type LeadModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onLeadCreated: () => void;
  userRole: 'admin' | 'staff_agent' | 'accounts';
  staffList?: UserOption[];
  prefillDestination?: string;
};

export default function LeadModal({
  isOpen,
  onClose,
  onLeadCreated,
  userRole,
  staffList = [],
  prefillDestination = '',
}: LeadModalProps) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [destination, setDestination] = useState(prefillDestination);
  const [selectedPackageId, setSelectedPackageId] = useState('');
  const [paxCount, setPaxCount] = useState(2);
  const [quotedPrice, setQuotedPrice] = useState(0);
  const [currency, setCurrency] = useState('INR');
  const [source, setSource] = useState('website');
  const [assignedAgentId, setAssignedAgentId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  function handlePackageChange(pkgId: string) {
    setSelectedPackageId(pkgId);
    if (!pkgId) return;
    const pkg = SHANVI_PACKAGES.find((p) => p.id === pkgId);
    if (pkg) {
      setDestination(`${pkg.destination} — ${pkg.title}`);
      if (pkg.priceFrom) {
        const num = Number(pkg.priceFrom.replace(/[^0-9]/g, ''));
        if (num) setQuotedPrice(num * paxCount);
      }
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const payload: Record<string, any> = {
        name,
        phone,
        email: email || undefined,
        destination,
        paxCount: Number(paxCount),
        quotedPrice: Number(quotedPrice),
        currency,
        source,
        status: 'ENQUIRY',
      };

      if (userRole === 'admin' && assignedAgentId) {
        payload.assignedAgentId = assignedAgentId;
      }

      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create lead');
      }

      // Reset form
      setName('');
      setPhone('');
      setEmail('');
      setDestination('');
      setPaxCount(2);
      setQuotedPrice(0);
      setCurrency('INR');
      setSource('manual');
      setAssignedAgentId('');

      onLeadCreated();
      onClose();
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full p-6 border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex justify-between items-center pb-4 mb-4 border-b border-slate-100">
          <div>
            <h3 className="text-xl font-bold text-slate-900">New Lead Enquiry</h3>
            <p className="text-xs text-slate-500 mt-0.5">Enter traveller and trip details to add to pipeline</p>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Quick Package Selector */}
          <div className="p-3.5 rounded-2xl bg-orange-50/60 border border-orange-200/80">
            <label className="block text-2xs font-extrabold uppercase tracking-wider text-orange-900 mb-1">
              📦 Select Shanvi Tour Package (Optional Pre-fill)
            </label>
            <select
              value={selectedPackageId}
              onChange={(e) => handlePackageChange(e.target.value)}
              className="w-full px-3 py-1.5 rounded-xl border border-orange-200 text-xs text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 font-medium"
            >
              <option value="">-- Custom / Ad-hoc Enquiry --</option>
              <optgroup label="Domestic Packages (Uttarakhand / India)">
                {SHANVI_PACKAGES.filter((p) => p.type === 'domestic').map((pkg) => (
                  <option key={pkg.id} value={pkg.id}>
                    {pkg.title} ({pkg.duration})
                  </option>
                ))}
              </optgroup>
              <optgroup label="International Packages (Thailand / Vietnam / Nepal)">
                {SHANVI_PACKAGES.filter((p) => p.type === 'international').map((pkg) => (
                  <option key={pkg.id} value={pkg.id}>
                    {pkg.title} ({pkg.duration})
                  </option>
                ))}
              </optgroup>
            </select>
            <span className="text-3xs text-orange-700 block mt-1">
              Selecting a package automatically fills destination and estimated price.
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                Traveller Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Rahul Sharma"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-slate-900 placeholder-slate-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                Phone Number *
              </label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-slate-900 placeholder-slate-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="rahul@example.com"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-slate-900 placeholder-slate-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                Destination *
              </label>
              <input
                type="text"
                required
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder="e.g. Bali, Indonesia"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-slate-900 placeholder-slate-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                Pax Count
              </label>
              <input
                type="number"
                min="1"
                required
                value={paxCount}
                onChange={(e) => setPaxCount(Number(e.target.value))}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                Quoted Price & Currency
              </label>
              <div className="flex gap-2">
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="px-2.5 py-2 rounded-xl border border-slate-200 text-sm bg-slate-50 font-medium text-slate-700 focus:outline-none"
                >
                  <option value="INR">INR (₹)</option>
                  <option value="USD">USD ($)</option>
                </select>
                <input
                  type="number"
                  min="0"
                  value={quotedPrice}
                  onChange={(e) => setQuotedPrice(Number(e.target.value))}
                  placeholder="0"
                  className="flex-1 px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-slate-900"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                Lead Source
              </label>
              <select
                value={source}
                onChange={(e) => setSource(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm text-slate-900 bg-white"
              >
                <option value="website">Shanvi Website Form</option>
                <option value="whatsapp">WhatsApp (+91 9999885087)</option>
                <option value="phone">Direct Phone Call</option>
                <option value="walkin">Walk-in (Noida HQ)</option>
                <option value="referral">Client Referral / Repeat</option>
                <option value="corporate">Corporate Travel & MICE</option>
                <option value="manual">Manual Agent Entry</option>
              </select>
            </div>

            {userRole === 'admin' && (
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                  Assign to Agent
                </label>
                <select
                  value={assignedAgentId}
                  onChange={(e) => setAssignedAgentId(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm text-slate-900 bg-white"
                >
                  <option value="">Unassigned (Open Lead)</option>
                  {staffList
                    .filter((s) => s.role !== 'accounts')
                    .map((staff) => (
                      <option key={staff.id} value={staff.id}>
                        {staff.name} ({staff.role})
                      </option>
                    ))}
                </select>
              </div>
            )}
          </div>

          <div className="pt-4 mt-6 border-t border-slate-100 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-sm font-medium hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-sm font-bold shadow-md shadow-orange-500/20 transition disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Lead & Add to Pipeline'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
