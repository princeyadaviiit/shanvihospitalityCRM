'use client';

import React, { useState, useEffect } from 'react';

type LineItem = {
  id?: string;
  category: 'ACCOMMODATION' | 'TRANSPORT' | 'ACTIVITY' | 'MEALS' | 'OTHER';
  description: string;
  cost: number;

  // Hotel/Accommodation fields
  hotelName?: string;
  hotelStarRating?: number;
  mealPlan?: string;
  roomType?: string;
  checkInDate?: string;
  checkOutDate?: string;
  nightsCount?: number;

  // Transportation fields
  vehicleType?: string;
  transferType?: string;
  startTime?: string;

  // Activity/Tour fields
  activityType?: string;
  paxCount?: string;
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
  adultsCount?: number;
  childrenCount?: number;
  childrenAges?: string;
  inclusions?: string;
  exclusions?: string;
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

const DEFAULT_INCLUSIONS = [
  'Accommodation in well-rated hotels/resorts as per the itinerary',
  'Daily breakfast at the hotel (except on Day 1)',
  'Sightseeing as per itinerary in a private/shared vehicle',
  'Airport Transfers',
  'All toll taxes, parking charges, driver allowances',
  'Entry tickets to attractions (as mentioned in the itinerary)',
  'Assistance by our local representative',
];

const DEFAULT_EXCLUSIONS = [
  'Airfare / Train fare / Bus tickets',
  'Meals other than those specified in the Hotel inclusions',
  'Personal expenses: Laundry, telephone calls, room service, mini-bar, etc.',
  'Early check-in or late check-out at hotels (subject to availability)',
  'Tips, porterage, and guide charges',
  'Optional tours and activities not mentioned in the itinerary',
  'Cost of any medical or travel insurance (unless included)',
  'Any additional cost due to flight cancellation, delay, natural calamity, etc.',
];

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
  const [editingItem, setEditingItem] = useState<{dayIndex: number; itemIndex: number} | null>(null);

  // Form state
  const [itineraryId, setItineraryId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [destination, setDestination] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [adultsCount, setAdultsCount] = useState<number>(2);
  const [childrenCount, setChildrenCount] = useState<number>(0);
  const [childrenAges, setChildrenAges] = useState<string>('');
  const [markup, setMarkup] = useState<number>(5000);
  const [currency, setCurrency] = useState('INR');
  const [inclusions, setInclusions] = useState<string[]>(DEFAULT_INCLUSIONS);
  const [exclusions, setExclusions] = useState<string[]>(DEFAULT_EXCLUSIONS);
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
        setAdultsCount(itin.adultsCount || 2);
        setChildrenCount(itin.childrenCount || 0);
        setChildrenAges(itin.childrenAges || '');
        setMarkup(itin.markup || 0);
        setCurrency(itin.currency || 'INR');

        if (itin.inclusions) {
          try {
            setInclusions(JSON.parse(itin.inclusions));
          } catch {
            setInclusions(DEFAULT_INCLUSIONS);
          }
        }

        if (itin.exclusions) {
          try {
            setExclusions(JSON.parse(itin.exclusions));
          } catch {
            setExclusions(DEFAULT_EXCLUSIONS);
          }
        }

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
        setAdultsCount(2);
        setChildrenCount(0);
        setChildrenAges('');
        setMarkup(5000);
        setCurrency('INR');
        setInclusions(DEFAULT_INCLUSIONS);
        setExclusions(DEFAULT_EXCLUSIONS);
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
          { category: 'TRANSPORT', description: 'Airport Arrival Private Transfer', cost: 1500, vehicleType: '16 Seater', transferType: 'One Way' },
          { category: 'ACCOMMODATION', description: '4-Star Resort Deluxe Room (Night 1)', cost: 6000, hotelName: 'Hotel Resort', hotelStarRating: 4, mealPlan: 'Bed and Breakfast', roomType: 'Deluxe Room', nightsCount: 1 },
        ],
      },
      {
        dayNumber: 2,
        title: 'Full Day Sightseeing & Cultural Tour',
        description: 'Guided city sightseeing, key landmarks, and cultural evening show.',
        lineItems: [
          { category: 'ACTIVITY', description: 'City Tour with English Speaking Guide', cost: 3500, activityType: 'SIC Tour', paxCount: '2Ad.' },
          { category: 'MEALS', description: 'Traditional Lunch & Dinner Platter', cost: 2000 },
          { category: 'ACCOMMODATION', description: '4-Star Resort Deluxe Room (Night 2)', cost: 6000, hotelName: 'Hotel Resort', hotelStarRating: 4, mealPlan: 'Bed and Breakfast', roomType: 'Deluxe Room', nightsCount: 1 },
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
    setEditingItem({ dayIndex, itemIndex: updated[dayIndex].lineItems.length - 1 });
  }

  function removeLineItem(dayIndex: number, itemIndex: number) {
    const updated = [...days];
    updated[dayIndex].lineItems = updated[dayIndex].lineItems.filter((_, idx) => idx !== itemIndex);
    setDays(updated);
    if (editingItem && editingItem.dayIndex === dayIndex && editingItem.itemIndex === itemIndex) {
      setEditingItem(null);
    }
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
      [field]: field === 'cost' || field === 'hotelStarRating' || field === 'nightsCount' ? Number(value) || 0 : value,
    };
    setDays(updated);
  }

  async function handleSaveItinerary(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (userRole === 'accounts') return;

    // Validate required fields
    if (!title.trim()) {
      setError('Itinerary title is required');
      return;
    }

    if (!destination.trim()) {
      setError('Destination is required');
      return;
    }

    if (days.length === 0) {
      setError('At least one day is required in the itinerary');
      return;
    }

    // Validate each day has a title
    for (let i = 0; i < days.length; i++) {
      if (!days[i].title.trim()) {
        setError(`Day ${i + 1} must have a title`);
        return;
      }
    }

    setSaving(true);
    setError(null);
    try {
      const payload = {
        title: title.trim(),
        destination: destination.trim(),
        startDate: startDate || null,
        endDate: endDate || null,
        adultsCount: Number(adultsCount) || 0,
        childrenCount: Number(childrenCount) || 0,
        childrenAges: childrenAges.trim() || null,
        markup: Number(markup) || 0,
        currency: currency || 'INR',
        inclusions: inclusions.length > 0 ? JSON.stringify(inclusions) : null,
        exclusions: exclusions.length > 0 ? JSON.stringify(exclusions) : null,
        days: days.map(day => ({
          dayNumber: Number(day.dayNumber),
          title: day.title.trim(),
          description: day.description?.trim() || null,
          lineItems: day.lineItems.map(item => ({
            category: item.category,
            description: item.description.trim(),
            cost: Number(item.cost) || 0,
            // Hotel fields
            hotelName: item.hotelName?.trim() || null,
            hotelStarRating: item.hotelStarRating ? Number(item.hotelStarRating) : null,
            mealPlan: item.mealPlan?.trim() || null,
            roomType: item.roomType?.trim() || null,
            checkInDate: item.checkInDate || null,
            checkOutDate: item.checkOutDate || null,
            nightsCount: item.nightsCount ? Number(item.nightsCount) : null,
            // Transport fields
            vehicleType: item.vehicleType?.trim() || null,
            transferType: item.transferType?.trim() || null,
            startTime: item.startTime || null,
            // Activity fields
            activityType: item.activityType?.trim() || null,
            paxCount: item.paxCount?.trim() || null,
          })),
        })),
      };

      console.log('Sending payload:', JSON.stringify(payload, null, 2));

      const res = await fetch(`/api/leads/${leadId}/itinerary`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        console.error('API Error Response:', data);

        // Format error message
        let errorMessage = data.error || 'Failed to save itinerary';

        if (data.details && Array.isArray(data.details)) {
          errorMessage += '\n\n' + data.details.join('\n');
        } else if (data.details && typeof data.details === 'string') {
          errorMessage += '\n\n' + data.details;
        }

        throw new Error(errorMessage);
      }

      setItineraryId(data.itinerary?.id);
      onSaved();
      alert('Itinerary and quote successfully saved!');
    } catch (err: any) {
      console.error('Save error:', err);
      setError(err.message || 'Failed to save itinerary');
      alert('Error: ' + (err.message || 'Failed to save itinerary'));
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

  async function handleSendWhatsApp() {
    if (!itineraryId) {
      alert('Please save the itinerary first before sending via WhatsApp.');
      return;
    }

    // Get lead phone number
    try {
      const res = await fetch(`/api/leads/${leadId}`);
      const data = await res.json();
      if (!data.lead?.phone) {
        alert('Lead phone number not found.');
        return;
      }

      const whatsappRes = await fetch('/api/whatsapp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: data.lead.phone,
          leadId,
          itineraryId,
          type: 'quote',
        }),
      });

      const whatsappData = await whatsappRes.json();
      if (!whatsappRes.ok) throw new Error(whatsappData.error || 'Failed to send WhatsApp');

      // Open WhatsApp link
      if (whatsappData.directUrl) {
        window.open(whatsappData.directUrl, '_blank');
      }

      alert('WhatsApp message prepared successfully!');
    } catch (err: any) {
      alert(err.message);
    }
  }

  if (!isOpen) return null;

  const currentItem = editingItem ? days[editingItem.dayIndex]?.lineItems[editingItem.itemIndex] : null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[95vh] flex flex-col border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
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
              <>
                <button
                  type="button"
                  onClick={handleSendWhatsApp}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold shadow-2xs transition"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  <span>Send WhatsApp</span>
                </button>

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
              </>
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
              <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-200/80 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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

                {/* Pax Details */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-200">
                  <div>
                    <label className="block text-2xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                      Adults Count
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={adultsCount}
                      onChange={(e) => setAdultsCount(Number(e.target.value) || 0)}
                      className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none text-slate-700"
                    />
                  </div>

                  <div>
                    <label className="block text-2xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                      Children Count
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={childrenCount}
                      onChange={(e) => setChildrenCount(Number(e.target.value) || 0)}
                      className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none text-slate-700"
                    />
                  </div>

                  <div>
                    <label className="block text-2xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                      Children Ages (comma-separated)
                    </label>
                    <input
                      type="text"
                      value={childrenAges}
                      onChange={(e) => setChildrenAges(e.target.value)}
                      placeholder="e.g. 12y, 3y"
                      className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none text-slate-700"
                    />
                  </div>
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

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  {/* Days List */}
                  <div className="lg:col-span-2 space-y-4">
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
                            required
                            minLength={3}
                            maxLength={200}
                            className="flex-1 px-3 py-1.5 text-sm font-bold rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-800"
                            title="Enter a title for this day (3-200 characters)"
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
                              <div
                                key={iIdx}
                                className={`flex items-center gap-2 bg-white p-2 rounded-lg border cursor-pointer transition ${
                                  editingItem?.dayIndex === dIdx && editingItem?.itemIndex === iIdx
                                    ? 'border-blue-500 shadow-sm'
                                    : 'border-slate-200/80 hover:border-blue-300'
                                }`}
                                onClick={() => setEditingItem({ dayIndex: dIdx, itemIndex: iIdx })}
                              >
                                <select
                                  value={item.category}
                                  onChange={(e) => updateLineItem(dIdx, iIdx, 'category', e.target.value)}
                                  onClick={(e) => e.stopPropagation()}
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
                                  onClick={(e) => e.stopPropagation()}
                                  placeholder="Service description"
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
                                    onClick={(e) => e.stopPropagation()}
                                    className="w-20 px-2 py-1 text-xs font-bold rounded border border-slate-200 focus:outline-none text-slate-800 text-right"
                                  />
                                </div>

                                {userRole !== 'accounts' && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      removeLineItem(dIdx, iIdx);
                                    }}
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

                  {/* Details Editor Panel */}
                  <div className="lg:col-span-1">
                    <div className="sticky top-4 p-4 rounded-2xl border border-slate-200 bg-slate-50/70 space-y-3">
                      {currentItem ? (
                        <>
                          <div className="flex items-center justify-between">
                            <h4 className="text-xs font-bold text-slate-900">Item Details</h4>
                            <button
                              onClick={() => setEditingItem(null)}
                              className="text-slate-400 hover:text-slate-600 p-1"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>

                          <div className="space-y-3 text-xs">
                            {currentItem.category === 'ACCOMMODATION' && (
                              <>
                                <div>
                                  <label className="block text-2xs font-bold uppercase text-slate-500 mb-1">Hotel Name</label>
                                  <input
                                    type="text"
                                    value={currentItem.hotelName || ''}
                                    onChange={(e) => updateLineItem(editingItem!.dayIndex, editingItem!.itemIndex, 'hotelName', e.target.value)}
                                    className="w-full px-2 py-1.5 text-xs rounded border border-slate-200 bg-white"
                                    placeholder="e.g. Hotel Nikko Saigon"
                                  />
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <label className="block text-2xs font-bold uppercase text-slate-500 mb-1">Star Rating</label>
                                    <input
                                      type="number"
                                      min="1"
                                      max="5"
                                      value={currentItem.hotelStarRating || 3}
                                      onChange={(e) => updateLineItem(editingItem!.dayIndex, editingItem!.itemIndex, 'hotelStarRating', e.target.value)}
                                      className="w-full px-2 py-1.5 text-xs rounded border border-slate-200 bg-white"
                                    />
                                  </div>

                                  <div>
                                    <label className="block text-2xs font-bold uppercase text-slate-500 mb-1">Nights</label>
                                    <input
                                      type="number"
                                      min="1"
                                      value={currentItem.nightsCount || 1}
                                      onChange={(e) => updateLineItem(editingItem!.dayIndex, editingItem!.itemIndex, 'nightsCount', e.target.value)}
                                      className="w-full px-2 py-1.5 text-xs rounded border border-slate-200 bg-white"
                                    />
                                  </div>
                                </div>

                                <div>
                                  <label className="block text-2xs font-bold uppercase text-slate-500 mb-1">Meal Plan</label>
                                  <select
                                    value={currentItem.mealPlan || 'Bed and Breakfast'}
                                    onChange={(e) => updateLineItem(editingItem!.dayIndex, editingItem!.itemIndex, 'mealPlan', e.target.value)}
                                    className="w-full px-2 py-1.5 text-xs rounded border border-slate-200 bg-white"
                                  >
                                    <option>Bed and Breakfast</option>
                                    <option>Half Board</option>
                                    <option>Full Board</option>
                                    <option>All Inclusive</option>
                                    <option>Room Only</option>
                                  </select>
                                </div>

                                <div>
                                  <label className="block text-2xs font-bold uppercase text-slate-500 mb-1">Room Type</label>
                                  <input
                                    type="text"
                                    value={currentItem.roomType || ''}
                                    onChange={(e) => updateLineItem(editingItem!.dayIndex, editingItem!.itemIndex, 'roomType', e.target.value)}
                                    className="w-full px-2 py-1.5 text-xs rounded border border-slate-200 bg-white"
                                    placeholder="e.g. Deluxe Room"
                                  />
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <label className="block text-2xs font-bold uppercase text-slate-500 mb-1">Check-in</label>
                                    <input
                                      type="date"
                                      value={currentItem.checkInDate || ''}
                                      onChange={(e) => updateLineItem(editingItem!.dayIndex, editingItem!.itemIndex, 'checkInDate', e.target.value)}
                                      className="w-full px-2 py-1.5 text-xs rounded border border-slate-200 bg-white"
                                    />
                                  </div>

                                  <div>
                                    <label className="block text-2xs font-bold uppercase text-slate-500 mb-1">Check-out</label>
                                    <input
                                      type="date"
                                      value={currentItem.checkOutDate || ''}
                                      onChange={(e) => updateLineItem(editingItem!.dayIndex, editingItem!.itemIndex, 'checkOutDate', e.target.value)}
                                      className="w-full px-2 py-1.5 text-xs rounded border border-slate-200 bg-white"
                                    />
                                  </div>
                                </div>
                              </>
                            )}

                            {currentItem.category === 'TRANSPORT' && (
                              <>
                                <div>
                                  <label className="block text-2xs font-bold uppercase text-slate-500 mb-1">Vehicle Type</label>
                                  <input
                                    type="text"
                                    value={currentItem.vehicleType || ''}
                                    onChange={(e) => updateLineItem(editingItem!.dayIndex, editingItem!.itemIndex, 'vehicleType', e.target.value)}
                                    className="w-full px-2 py-1.5 text-xs rounded border border-slate-200 bg-white"
                                    placeholder="e.g. 16 Seater, Sedan"
                                  />
                                </div>

                                <div>
                                  <label className="block text-2xs font-bold uppercase text-slate-500 mb-1">Transfer Type</label>
                                  <select
                                    value={currentItem.transferType || 'One Way'}
                                    onChange={(e) => updateLineItem(editingItem!.dayIndex, editingItem!.itemIndex, 'transferType', e.target.value)}
                                    className="w-full px-2 py-1.5 text-xs rounded border border-slate-200 bg-white"
                                  >
                                    <option>One Way</option>
                                    <option>Two Way</option>
                                    <option>Round Trip</option>
                                  </select>
                                </div>

                                <div>
                                  <label className="block text-2xs font-bold uppercase text-slate-500 mb-1">Start Time</label>
                                  <input
                                    type="time"
                                    value={currentItem.startTime || ''}
                                    onChange={(e) => updateLineItem(editingItem!.dayIndex, editingItem!.itemIndex, 'startTime', e.target.value)}
                                    className="w-full px-2 py-1.5 text-xs rounded border border-slate-200 bg-white"
                                  />
                                </div>
                              </>
                            )}

                            {currentItem.category === 'ACTIVITY' && (
                              <>
                                <div>
                                  <label className="block text-2xs font-bold uppercase text-slate-500 mb-1">Activity Type</label>
                                  <input
                                    type="text"
                                    value={currentItem.activityType || ''}
                                    onChange={(e) => updateLineItem(editingItem!.dayIndex, editingItem!.itemIndex, 'activityType', e.target.value)}
                                    className="w-full px-2 py-1.5 text-xs rounded border border-slate-200 bg-white"
                                    placeholder="e.g. SIC Tour, Ticket, Pvt Transfer + Guide"
                                  />
                                </div>

                                <div>
                                  <label className="block text-2xs font-bold uppercase text-slate-500 mb-1">Pax Count</label>
                                  <input
                                    type="text"
                                    value={currentItem.paxCount || ''}
                                    onChange={(e) => updateLineItem(editingItem!.dayIndex, editingItem!.itemIndex, 'paxCount', e.target.value)}
                                    className="w-full px-2 py-1.5 text-xs rounded border border-slate-200 bg-white"
                                    placeholder="e.g. 4Ad. + 2Ch."
                                  />
                                </div>
                              </>
                            )}

                            {(currentItem.category === 'MEALS' || currentItem.category === 'OTHER') && (
                              <p className="text-2xs text-slate-500 italic py-4">No additional details needed for this category.</p>
                            )}
                          </div>
                        </>
                      ) : (
                        <p className="text-xs text-slate-500 italic text-center py-8">
                          Click on a line item to edit its details
                        </p>
                      )}
                    </div>
                  </div>
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
                        max="9999999"
                        step="1"
                        value={markup}
                        onChange={(e) => setMarkup(Number(e.target.value) || 0)}
                        className="w-full text-base font-bold text-slate-800 border-b border-dashed border-slate-300 focus:outline-none focus:border-blue-500 bg-transparent"
                        title="Enter markup amount (0-9999999)"
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
