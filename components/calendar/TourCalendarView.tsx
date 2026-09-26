'use client';

import React, { useState, useEffect } from 'react';

type TourEvent = {
  bookingId: string;
  bookingNumber: string;
  clientName: string;
  destination: string;
  paxCount: number;
  startDate: string;
  endDate: string;
  totalAmount: number;
  agentName: string;
};

export default function TourCalendarView() {
  const [events, setEvents] = useState<TourEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [sendingWhatsappId, setSendingWhatsappId] = useState<string | null>(null);
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  useEffect(() => {
    async function fetchCalendar() {
      setLoading(true);
      try {
        const res = await fetch(`/api/calendar?month=${currentMonth}`);
        if (res.ok) {
          const data = await res.json();
          setEvents(data.bookings || []);
        }
      } catch (err) {
        console.error('Failed to load tour calendar:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchCalendar();
  }, [currentMonth]);

  async function handleSendVoucherWhatsApp(ev: TourEvent) {
    setSendingWhatsappId(ev.bookingId);
    try {
      const res = await fetch('/api/whatsapp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: '+919999885087', // default or customer phone
          type: 'voucher',
          title: `${ev.destination} — Booking #${ev.bookingNumber}`,
          amount: ev.totalAmount,
        }),
      });
      const data = await res.json();
      if (data.directUrl) {
        window.open(data.directUrl, '_blank', 'noopener,noreferrer');
      } else {
        alert('WhatsApp voucher notification processed successfully');
      }
    } catch (err: any) {
      alert(`Could not dispatch WhatsApp voucher: ${err.message}`);
    } finally {
      setSendingWhatsappId(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              Tour Operations & Departures Calendar
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Track confirmed client departures, ongoing trips, and download accommodation vouchers for Shanvi Hospitality.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <label htmlFor="monthPicker" className="text-xs font-semibold text-slate-600">
            Select Month:
          </label>
          <input
            id="monthPicker"
            type="month"
            value={currentMonth}
            onChange={(e) => setCurrentMonth(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500 cursor-pointer"
          />
        </div>
      </div>

      {/* Calendar List / Event Cards */}
      <div className="space-y-3">
        {loading ? (
          <div className="p-12 text-center text-xs font-semibold text-slate-400 bg-white rounded-3xl border border-slate-200">
            Loading tour departure schedule...
          </div>
        ) : events.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 text-slate-500">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-orange-50 text-orange-500 flex items-center justify-center mb-3">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-sm font-bold text-slate-800">
              No confirmed tour departures scheduled for {currentMonth}.
            </p>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              Confirmed bookings from the lead pipeline will appear here automatically with their itinerary dates, guest names, and instant accommodation voucher generators.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {events.map((ev) => (
              <div
                key={ev.bookingId}
                className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs hover:border-orange-300 transition-colors flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider mb-2">
                    <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full">
                      {ev.bookingNumber}
                    </span>
                    <span className="text-slate-500 font-medium flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      <span>{ev.paxCount} {ev.paxCount > 1 ? 'Guests' : 'Guest'}</span>
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 leading-snug">
                    {ev.clientName}
                  </h3>

                  <div className="mt-1 text-xs font-semibold text-orange-600 flex items-center gap-1">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span>{ev.destination}</span>
                  </div>

                  <div className="mt-3 p-3 rounded-2xl bg-slate-50 border border-slate-100 text-xs space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Departure:</span>
                      <span className="font-semibold text-slate-800">
                        {new Date(ev.startDate).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Return:</span>
                      <span className="font-semibold text-slate-800">
                        {new Date(ev.endDate).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">Sales Planner</span>
                      <span className="font-semibold text-slate-800">{ev.agentName}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">Total Package</span>
                      <span className="font-bold text-slate-900">
                        ₹{ev.totalAmount.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>

                  {/* Actions: Hotel Voucher PDF & WhatsApp */}
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <a
                      href={`/api/bookings/${ev.bookingId}/voucher`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1.5 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                      title="Download Accommodation Voucher PDF"
                    >
                      <svg className="w-3.5 h-3.5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span>Voucher</span>
                    </a>

                    <button
                      onClick={() => handleSendVoucherWhatsApp(ev)}
                      disabled={sendingWhatsappId === ev.bookingId}
                      className="px-2.5 py-1.5 rounded-xl text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                      title="Send Voucher via WhatsApp"
                    >
                      <svg className="w-3.5 h-3.5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      <span>{sendingWhatsappId === ev.bookingId ? 'Sending...' : 'WhatsApp'}</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
