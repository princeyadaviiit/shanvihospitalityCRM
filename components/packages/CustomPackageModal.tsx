'use client';

import React, { useState } from 'react';
import { TourPackage, PackageItineraryDay } from '@/lib/packages-data';

interface CustomPackageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPackageCreated: (pkg: TourPackage) => void;
}

export default function CustomPackageModal({
  isOpen,
  onClose,
  onPackageCreated,
}: CustomPackageModalProps) {
  const [title, setTitle] = useState('');
  const [destination, setDestination] = useState('');
  const [country, setCountry] = useState('India');
  const [type, setType] = useState<'domestic' | 'international'>('domestic');
  const [duration, setDuration] = useState('5 Days / 4 Nights');
  const [daysCount, setDaysCount] = useState(5);
  const [priceFrom, setPriceFrom] = useState('₹18,000 / person');
  const [categoryInput, setCategoryInput] = useState('Custom, Hill Station, Family');
  const [highlightsInput, setHighlightsInput] = useState('Private cab with driver\nLuxury resort stay\nGuided sightseeing tours');
  const [description, setDescription] = useState('');
  const [inclusionsInput, setInclusionsInput] = useState('Hotel accommodation on double sharing\nDaily breakfast & dinner\nPrivate AC vehicle for all transfers & sightseeing\nToll taxes, parking, driver allowances');
  const [exclusionsInput, setExclusionsInput] = useState('Airfare / Train tickets\nMonument entry fees\nPersonal expenses');

  const [itineraryDays, setItineraryDays] = useState<PackageItineraryDay[]>([
    { day: 1, title: 'Arrival & Hotel Check-in', description: 'Meet our representative, transfer to hotel, welcome drink, and leisure evening.' },
    { day: 2, title: 'Full Day Sightseeing', description: 'Scenic tour covering prime landmarks, viewpoints, and local cultural markets.' },
    { day: 3, title: 'Adventure & Nature Exploration', description: 'Explore scenic trails, lake activities or wildlife safaris with naturalist.' },
    { day: 4, title: 'Leisure & Local Shopping', description: 'Relax at resort, souvenir shopping, and evening cultural show/Aarti.' },
    { day: 5, title: 'Departure Transfer', description: 'Breakfast, check-out, and private transfer to airport or railway station.' },
  ]);

  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  const handleAddDay = () => {
    const nextDay = itineraryDays.length + 1;
    setItineraryDays([
      ...itineraryDays,
      { day: nextDay, title: `Day ${nextDay} Activity`, description: 'Sightseeing and leisure activities.' },
    ]);
  };

  const handleRemoveDay = (index: number) => {
    if (itineraryDays.length <= 1) return;
    const updated = itineraryDays.filter((_, i) => i !== index).map((d, i) => ({ ...d, day: i + 1 }));
    setItineraryDays(updated);
  };

  const handleDayChange = (index: number, field: 'title' | 'description', value: string) => {
    const updated = [...itineraryDays];
    updated[index] = { ...updated[index], [field]: value };
    setItineraryDays(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !destination) {
      alert('Please fill in title and destination');
      return;
    }

    try {
      setSaving(true);
      const categories = categoryInput.split(',').map((c) => c.trim()).filter(Boolean);
      const highlights = highlightsInput.split('\n').map((h) => h.trim()).filter(Boolean);
      const inclusions = inclusionsInput.split('\n').map((i) => i.trim()).filter(Boolean);
      const exclusions = exclusionsInput.split('\n').map((e) => e.trim()).filter(Boolean);

      const payload = {
        title,
        destination,
        country,
        duration,
        daysCount: Number(daysCount),
        priceFrom,
        category: categories,
        highlights,
        description: description || `Tailor-made customized tour package for ${destination} crafted by Shanvi Hospitality.`,
        itinerary: itineraryDays,
        inclusions,
        exclusions,
      };

      const res = await fetch('/api/packages/custom', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success && data.package) {
        onPackageCreated({
          ...data.package,
          type,
          isCustom: true,
        });
        onClose();
      } else {
        // Fallback for mock/local save
        const fallbackPkg: TourPackage = {
          id: `custom_${Date.now()}`,
          title,
          slug: title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          type,
          destination,
          duration,
          daysCount: Number(daysCount),
          priceFrom,
          category: categories,
          highlights,
          description: description || `Custom tour package for ${destination}.`,
          itinerary: itineraryDays,
          inclusions,
          exclusions,
          isCustom: true,
        };
        onPackageCreated(fallbackPkg);
        onClose();
      }
    } catch (err) {
      console.error('Error creating custom package:', err);
      alert('Failed to save package');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden max-h-[92vh] flex flex-col">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-900 text-white">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-orange-500 text-white uppercase tracking-wider">
                Custom Builder
              </span>
              <h3 className="text-lg font-bold">Create Tailor-Made Tour Package</h3>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Build a personalized itinerary, custom pricing, and inclusions for Shanvi Hospitality clients
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 flex items-center justify-center transition-colors cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Modal Body Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 text-sm">
          {/* General Information */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">Package Title *</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Luxury Nainital & Corbett Wilderness Retreat"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Package Scope</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as any)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
              >
                <option value="domestic">Domestic (India)</option>
                <option value="international">International</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Destination *</label>
              <input
                type="text"
                required
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder="e.g. Uttarakhand / Thailand"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Duration</label>
              <input
                type="text"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="e.g. 5 Days / 4 Nights"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Starting Price</label>
              <input
                type="text"
                value={priceFrom}
                onChange={(e) => setPriceFrom(e.target.value)}
                placeholder="e.g. ₹22,500 / person"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-semibold"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Category Tags (comma separated)</label>
            <input
              type="text"
              value={categoryInput}
              onChange={(e) => setCategoryInput(e.target.value)}
              placeholder="e.g. Hill Station, Wildlife, Honeymoon, Luxury"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Overview Description</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief summary of the vacation experience, hotels, and vehicle..."
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
            />
          </div>

          {/* Day-by-Day Itinerary Builder */}
          <div className="pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Day-by-Day Itinerary Plan</h4>
                <p className="text-[11px] text-slate-500">Define daily routing and highlights</p>
              </div>
              <button
                type="button"
                onClick={handleAddDay}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Day
              </button>
            </div>

            <div className="space-y-3">
              {itineraryDays.map((day, idx) => (
                <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-slate-900 text-white font-mono">
                      Day {day.day}
                    </span>
                    <input
                      type="text"
                      value={day.title}
                      onChange={(e) => handleDayChange(idx, 'title', e.target.value)}
                      placeholder="Title (e.g. Arrival in Nainital & Lake Boating)"
                      className="flex-1 px-2.5 py-1 text-xs font-semibold bg-white border border-slate-200 rounded-md text-slate-800"
                    />
                    {itineraryDays.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveDay(idx)}
                        className="text-slate-400 hover:text-rose-600 transition-colors p-1"
                        title="Remove Day"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </div>
                  <textarea
                    rows={2}
                    value={day.description}
                    onChange={(e) => handleDayChange(idx, 'description', e.target.value)}
                    placeholder="Day activity description..."
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-md text-slate-700"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Inclusions & Exclusions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Inclusions (one per line)</label>
              <textarea
                rows={3}
                value={inclusionsInput}
                onChange={(e) => setInclusionsInput(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Exclusions (one per line)</label>
              <textarea
                rows={3}
                value={exclusionsInput}
                onChange={(e) => setExclusionsInput(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-sm font-semibold shadow-sm transition-colors cursor-pointer flex items-center gap-2"
            >
              {saving ? (
                <span>Saving Package...</span>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Publish Custom Package</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
