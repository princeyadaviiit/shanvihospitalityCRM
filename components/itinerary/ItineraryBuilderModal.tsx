'use client';

import React, { useState, useEffect } from 'react';

type LineItem = {
  id?: string;
  category: 'ACCOMMODATION' | 'TRANSPORT' | 'ACTIVITY' | 'MEALS' | 'OTHER';
  description: string;
  cost: number;
};

type ItineraryDay = {
  id?: string;
  dayNumber: number;
  title: string;
  description?: string;
  lineItems: LineItem[];
};

type ItineraryData = {
  id: string;
  title: string;
  destination: string;
  startDate?: string | null;
  endDate?: string | null;
  markup: number;
  totalCost: number;
  finalPrice: number;
  currency: string;
  days: ItineraryDay[];
  booking?: {
    id: string;
    bookingNumber: string;
    status: string;
  } | null;
};

type ItineraryBuilderModalProps = {
  isOpen: boolean;
  leadId: string;
  leadName: string;
  initialDestination: string;
  onClose: () => void;
  onSaved: () => void;
  userRole: 'admin' | 'staff_agent' | 'accounts';
};

const CATEGORIES = [
  { value: 'ACCOMMODATION', label: 'Accommodation', color: 'bg-indigo-100 text-indigo-800' },
  { value: 'TRANSPORT', label: 'Transport', color: 'bg-sky-100 text-sky-800' },
  { value: 'ACTIVITY', label: 'Activity / Sightseeing', color: 'bg-emerald-100 text-emerald-800' },
  { value: 'MEALS', label: 'Meals / Dining', color: 'bg-amber-100 text-amber-800' },
  { value: 'OTHER', label: 'Other Service', color: 'bg-slate-100 text-slate-800' },
] as const;

export default function ItineraryBuilderModal({
  isOpen,
  leadId,
  leadName,
  initialDestination,
  onClose,
  onSaved,
  userRole,
}: ItineraryBuilderModalProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [converting, setConverting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [itineraryId, setItineraryId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [destination, setDestination] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [markup, setMarkup] = useState<number>(5000);
  const [currency, setCurrency] = useState('INR');
  const [days, setDays] = useState<ItineraryDay[]>([]);
  const [booking, setBooking] = useState<{ id: string; bookingNumber: string; status: string } | null>(null);

  const loadItinerary = React.useCallback(async () => {
    if (!leadId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/leads/${leadId}/itinerary`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load itinerary');

      if (data.itinerary) {
        const itin: ItineraryData = data.itinerary;
        setItineraryId(itin.id);
        setTitle(itin.title);
        setDestination(itin.destination);
        setStartDate(itin.startDate ? itin.startDate.split('T')[0] : '');
        setEndDate(itin.endDate ? itin.endDate.split('T')[0] : '');
        setMarkup(itin.markup || 0);
        setCurrency(itin.currency || 'INR');
        setDays(
          itin.days?.length > 0
            ? itin.days.sort((a, b) => a.dayNumber - b.dayNumber)
            : getDefaultInitialDays(data.lead?.destination || initialDestination)
        );
        setBooking(itin.booking || null);
      } else {
        // Initialize fresh itinerary
        setItineraryId(null);
        setTitle(`Tour Package to ${initialDestination || 'Destination'}`);
        setDestination(initialDestination || '');
        setMarkup(5000);
        setCurrency('INR');
        setDays(getDefaultInitialDays(initialDestination));
        setBooking(null);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leadId, initialDestination]);

  useEffect(() => {
    if (!isOpen || !leadId) return;
    loadItinerary();
  }, [isOpen, leadId, loadItinerary]);

  function getDefaultInitialDays(dest: string): ItineraryDay[] {
    return [
      {
        dayNumber: 1,
        title: `Arrival in ${dest || 'Destination'} & Hotel Check-in`,
        description: 'Airport welcome by our tour representative, transfer to hotel, and leisure evening.',
        lineItems: [
          { category: 'TRANSPORT', description: 'Airport Arrival Private Transfer', cost: 1500 },
          { category: 'ACCOMMODATION', description: '4-Star Resort Deluxe Room (Night 1)', cost: 6000 },
        ],
      },
      {
        dayNumber: 2,
        title: 'Full Day Sightseeing & Cultural Tour',
        description: 'Guided city sightseeing, key landmarks, and cultural evening show.',
        lineItems: [
          { category: 'ACTIVITY', description: 'City Tour with English Speaking Guide', cost: 3500 },
          { category: 'MEALS', description: 'Traditional Lunch & Dinner Platter', cost: 2000 },
          { category: 'ACCOMMODATION', description: '4-Star Resort Deluxe Room (Night 2)', cost: 6000 },
        ],
      },
    ];
  }

  // Auto-calculated totals
  const totalCost = days.reduce((sum, day) => {
    const daySum = day.lineItems.reduce((dSum, item) => dSum + (Number(item.cost) || 0), 0);
    return sum + daySum;
  }, 0);

  const finalPrice = totalCost + (Number(markup) || 0);

  function addDay() {
    const newDayNum = days.length + 1;
    setDays([
      ...days,
      {
        dayNumber: newDayNum,
        title: `Day ${newDayNum} Exploration`,
        description: '',
        lineItems: [],
      },
    ]);
  }

  function removeDay(dayIndex: number) {
    if (days.length <= 1) {
      alert('An itinerary must contain at least 1 day.');
      return;
    }
    const updated = days.filter((_, idx) => idx !== dayIndex);
    // Renumber days sequentially
    const renumbered = updated.map((d, idx) => ({ ...d, dayNumber: idx + 1 }));
    setDays(renumbered);
  }

  function updateDayField(dayIndex: number, field: 'title' | 'description', value: string) {
    const updated = [...days];
    updated[dayIndex][field] = value;
    setDays(updated);
  }

  function addLineItem(dayIndex: number) {
    const updated = [...days];
    updated[dayIndex].lineItems.push({
      category: 'ACTIVITY',
      description: '',
      cost: 1000,
    });
    setDays(updated);
  }

  function removeLineItem(dayIndex: number, itemIndex: number) {
    const updated = [...days];
    updated[dayIndex].lineItems = updated[dayIndex].lineItems.filter((_, idx) => idx !== itemIndex);
    setDays(updated);
  }

  function updateLineItem(
    dayIndex: number,
    itemIndex: number,
    field: keyof LineItem,
    value: any
  ) {
    const updated = [...days];
    updated[dayIndex].lineItems[itemIndex] = {
      ...updated[dayIndex].lineItems[itemIndex],
      [field]: field === 'cost' ? Number(value) || 0 : value,
    };
    setDays(updated);
  }

  async function handleSaveItinerary(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (userRole === 'accounts') return;

    setSaving(true);
    setError(null);
    try {
      const payload = {
        title,
        destination,
        startDate: startDate || null,
        endDate: endDate || null,
        markup: Number(markup) || 0,
        currency,
        days,
      };

      const res = await fetch(`/api/leads/${leadId}/itinerary`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save itinerary');

      setItineraryId(data.itinerary?.id);
      onSaved();
      alert('Itinerary and quote successfully saved!');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleConvertToBooking() {
    if (!itineraryId) {
      alert('Please save the itinerary before converting it to a confirmed booking.');
      return;
    }
    const confirmConv = window.confirm(
      'Are you sure you want to convert this quotation into a confirmed Booking? The lead status will be updated to Confirmed.'
    );
    if (!confirmConv) return;

    setConverting(true);
    try {
      const res = await fetch(`/api/itineraries/${itineraryId}/convert-booking`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to convert booking');

      setBooking(data.booking);
      onSaved();
      alert(`Success! Converted to Booking: ${data.booking.bookingNumber}`);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setConverting(false);
    }
  }

  function handleExportPdf() {
    if (!itineraryId) {
      alert('Please save the itinerary first before exporting to PDF.');
      return;
    }
    window.open(`/api/itineraries/${itineraryId}/export`, '_blank');
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/75 rounded-t-2xl">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800">
                Itinerary & Quote Builder
              </span>
              {booking && (
                <span className="text-2xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  Confirmed: {booking.bookingNumber}
                </span>
              )}
            </div>
            <h2 className="text-xl font-bold text-slate-900 mt-1">
              {leadName} — {destination || 'Tour Package'}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            {itineraryId && (
              <button
                type="button"
                onClick={handleExportPdf}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition"
              >
                <svg className="w-4 h-4 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>Export PDF</span>
              </button>
            )}

            {userRole !== 'accounts' && !booking && (
              <button
                type="button"
                disabled={converting || !itineraryId}
                onClick={handleConvertToBooking}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-2xs transition disabled:opacity-40"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
                <span>{converting ? 'Converting...' : 'Convert to Booking'}</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition ml-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {loading ? (
            <div className="py-16 text-center text-slate-400">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="text-xs mt-2">Loading itinerary details...</p>
            </div>
          ) : (
            <>
              {error && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
                  {error}
                </div>
              )}

              {/* Package Header Meta Inputs */}
              <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-200/80 grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-2xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Itinerary Title
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. 5N/6D Scenic Bali Getaway"
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-2xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Destination
                  </label>
                  <input
                    type="text"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    placeholder="e.g. Bali, Indonesia"
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-2xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Tour Start Date
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none text-slate-700"
                  />
                </div>

                <div>
                  <label className="block text-2xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Tour End Date
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none text-slate-700"
                  />
                </div>

                <div>
                  <label className="block text-2xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Currency
                  </label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none text-slate-700"
                  >
                    <option value="INR">INR (₹)</option>
                    <option value="USD">USD ($)</option>
                  </select>
                </div>
              </div>

              {/* Day by Day Plan */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Day-by-Day Itinerary Schedule ({days.length} {days.length === 1 ? 'Day' : 'Days'})
                  </h3>

                  {userRole !== 'accounts' && (
                    <button
                      type="button"
                      onClick={addDay}
                      className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 hover:bg-blue-50 px-2.5 py-1 rounded-lg transition"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                      </svg>
                      Add Next Day
                    </button>
                  )}
                </div>

                <div className="space-y-4">
                  {days.map((day, dIdx) => (
                    <div
                      key={dIdx}
                      className="p-4 rounded-2xl border border-slate-200 bg-white shadow-2xs space-y-3"
                    >
                      {/* Day Title Bar */}
                      <div className="flex items-center justify-between gap-3">
                        <span className="flex-shrink-0 w-7 h-7 rounded-xl bg-blue-600 text-white font-bold text-xs flex items-center justify-center">
                          D{day.dayNumber}
                        </span>
                        <input
                          type="text"
                          value={day.title}
                          onChange={(e) => updateDayField(dIdx, 'title', e.target.value)}
                          placeholder={`Day ${day.dayNumber} Title`}
                          className="flex-1 px-3 py-1.5 text-sm font-bold rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-800"
                        />
                        {userRole !== 'accounts' && days.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeDay(dIdx)}
                            className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition"
                            title="Remove this day"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        )}
                      </div>

                      {/* Day Description */}
                      <textarea
                        rows={2}
                        value={day.description || ''}
                        onChange={(e) => updateDayField(dIdx, 'description', e.target.value)}
                        placeholder="Day summary or client sightseeing notes..."
                        className="w-full px-3 py-1.5 text-xs text-slate-600 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none bg-slate-50/40"
                      />

                      {/* Line Items Table */}
                      <div className="border border-slate-100 rounded-xl overflow-hidden bg-slate-50/60 p-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-3xs font-bold uppercase tracking-wider text-slate-500">
                            Line Items & Tour Services ({day.lineItems.length})
                          </span>
                          {userRole !== 'accounts' && (
                            <button
                              type="button"
                              onClick={() => addLineItem(dIdx)}
                              className="text-2xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
                            >
                              + Add Item
                            </button>
                          )}
                        </div>

                        {day.lineItems.length === 0 ? (
                          <p className="text-2xs text-slate-400 italic py-1">No services added for this day.</p>
                        ) : (
                          day.lineItems.map((item, iIdx) => (
                            <div key={iIdx} className="flex items-center gap-2 bg-white p-2 rounded-lg border border-slate-200/80">
                              <select
                                value={item.category}
                                onChange={(e) => updateLineItem(dIdx, iIdx, 'category', e.target.value)}
                                className="text-2xs font-semibold px-2 py-1 rounded-md border border-slate-200 bg-slate-50 text-slate-700"
                              >
                                {CATEGORIES.map((c) => (
                                  <option key={c.value} value={c.value}>
                                    {c.label}
                                  </option>
                                ))}
                              </select>

                              <input
                                type="text"
                                value={item.description}
                                onChange={(e) => updateLineItem(dIdx, iIdx, 'description', e.target.value)}
                                placeholder="Service description (e.g. Airport Transfer, Hotel)"
                                className="flex-1 px-2.5 py-1 text-xs rounded border border-slate-200 focus:outline-none text-slate-800"
                              />

                              <div className="flex items-center gap-1">
                                <span className="text-xs font-bold text-slate-400">
                                  {currency === 'INR' ? '₹' : '$'}
                                </span>
                                <input
                                  type="number"
                                  min="0"
                                  value={item.cost}
                                  onChange={(e) => updateLineItem(dIdx, iIdx, 'cost', e.target.value)}
                                  className="w-20 px-2 py-1 text-xs font-bold rounded border border-slate-200 focus:outline-none text-slate-800 text-right"
                                />
                              </div>

                              {userRole !== 'accounts' && (
                                <button
                                  type="button"
                                  onClick={() => removeLineItem(dIdx, iIdx)}
                                  className="text-slate-300 hover:text-rose-600 p-1 transition"
                                >
                                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Auto Costing Summary Panel */}
              <div className="bg-gradient-to-br from-slate-50 to-blue-50/50 p-5 rounded-2xl border border-blue-100/80 shadow-2xs space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  Real-Time Tour Costing & Quote Calculator
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                  <div className="p-3 bg-white rounded-xl border border-slate-200">
                    <span className="text-2xs font-semibold uppercase text-slate-400">
                      Base Line Items Total
                    </span>
                    <div className="text-lg font-bold text-slate-800 mt-0.5">
                      {currency === 'INR' ? '₹' : '$'}
                      {totalCost.toLocaleString()}
                    </div>
                  </div>

                  <div className="p-3 bg-white rounded-xl border border-slate-200">
                    <span className="text-2xs font-semibold uppercase text-slate-400">
                      Agency Markup (Flat)
                    </span>
                    <div className="flex items-center gap-1 mt-0.5">
                      <span className="text-sm font-bold text-slate-600">
                        {currency === 'INR' ? '₹' : '$'}
                      </span>
                      <input
                        type="number"
                        min="0"
                        value={markup}
                        onChange={(e) => setMarkup(Number(e.target.value) || 0)}
                        className="w-full text-base font-bold text-slate-800 border-b border-dashed border-slate-300 focus:outline-none focus:border-blue-500 bg-transparent"
                      />
                    </div>
                  </div>

                  <div className="p-3 bg-blue-600 text-white rounded-xl shadow-xs">
                    <span className="text-2xs font-semibold uppercase text-blue-100">
                      Final Client Quoted Price
                    </span>
                    <div className="text-xl font-black mt-0.5">
                      {currency === 'INR' ? '₹' : '$'}
                      {finalPrice.toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/80 rounded-b-2xl flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-100 transition"
          >
            Close
          </button>

          {userRole !== 'accounts' && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={saving}
                onClick={handleSaveItinerary}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm transition disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Itinerary & Quote'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
