'use client';

import React, { useState, useEffect } from 'react';
import { SHANVI_PACKAGES, TourPackage } from '@/lib/packages-data';
import CustomPackageModal from './CustomPackageModal';

type PackagesCatalogProps = {
  onSelectPackageForQuote?: (pkg: TourPackage) => void;
};

export default function PackagesCatalog({ onSelectPackageForQuote }: PackagesCatalogProps) {
  const [selectedType, setSelectedType] = useState<'all' | 'domestic' | 'international' | 'custom'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [selectedModalPackage, setSelectedModalPackage] = useState<TourPackage | null>(null);
  const [allPackages, setAllPackages] = useState<TourPackage[]>(SHANVI_PACKAGES);
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);

  useEffect(() => {
    fetchCustomPackages();
  }, []);

  const fetchCustomPackages = async () => {
    try {
      const res = await fetch('/api/packages/custom');
      const data = await res.json();
      if (data.packages && Array.isArray(data.packages)) {
        // Merge without duplicating
        const existingIds = new Set(SHANVI_PACKAGES.map((p) => p.id));
        const filteredNew = data.packages.filter((p: TourPackage) => !existingIds.has(p.id));
        setAllPackages([...SHANVI_PACKAGES, ...filteredNew]);
      }
    } catch (err) {
      console.error('Failed to load custom packages:', err);
    }
  };

  const handleCustomPackageCreated = (newPkg: TourPackage) => {
    setAllPackages((prev) => [newPkg, ...prev]);
  };

  // Extract unique categories across all packages
  const allCategories = Array.from(
    new Set(allPackages.flatMap((p) => p.category || []))
  );

  const filteredPackages = allPackages.filter((pkg) => {
    if (selectedType === 'custom') {
      if (!pkg.isCustom) return false;
    } else if (selectedType !== 'all' && pkg.type !== selectedType) {
      return false;
    }

    if (activeCategory !== 'all' && !pkg.category?.includes(activeCategory)) return false;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchTitle = pkg.title.toLowerCase().includes(q);
      const matchDest = pkg.destination.toLowerCase().includes(q);
      const matchDesc = pkg.description.toLowerCase().includes(q);
      if (!matchTitle && !matchDest && !matchDesc) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner & Filter Controls */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-900 text-white uppercase tracking-wider">
                Tour Packages Hub
              </span>
              <span className="text-xs font-medium text-slate-500">Official Catalog & Custom Builder</span>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mt-1 tracking-tight">
              Shanvi Hospitality Tour Packages
            </h2>
            <p className="text-xs text-slate-600 mt-0.5">
              Verified DMC packages across Uttarakhand, Golden Triangle, Thailand, Vietnam & Nepal.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-orange-700 bg-orange-50 border border-orange-200 px-3 py-1.5 rounded-full">
              {filteredPackages.length} Available
            </span>

            <button
              onClick={() => setIsCustomModalOpen(true)}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-orange-600 hover:bg-orange-700 text-white shadow-sm transition-all duration-200 cursor-pointer flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create Custom Package
            </button>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="mt-6 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <svg className="w-4 h-4 absolute left-3 top-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by destination (e.g. Corbett, Nainital, Phuket, Chardham, Nepal)..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-colors"
            />
          </div>

          {/* Type Toggle Tabs */}
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setSelectedType('all')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                selectedType === 'all'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Packages
            </button>
            <button
              onClick={() => setSelectedType('domestic')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                selectedType === 'domestic'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Domestic
            </button>
            <button
              onClick={() => setSelectedType('international')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                selectedType === 'international'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              International
            </button>
            <button
              onClick={() => setSelectedType('custom')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                selectedType === 'custom'
                  ? 'bg-orange-600 text-white shadow-sm'
                  : 'text-orange-700 hover:text-orange-800'
              }`}
            >
              Custom
            </button>
          </div>
        </div>

        {/* Category Pills Bar */}
        <div className="mt-3 flex items-center gap-1.5 overflow-x-auto pb-1">
          <button
            onClick={() => setActiveCategory('all')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
              activeCategory === 'all'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Themes
          </button>
          {allCategories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                activeCategory === cat
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Packages Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredPackages.map((pkg) => (
          <div
            key={pkg.id}
            className="flex flex-col bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden"
          >
            {/* Card Header */}
            <div className="p-5 pb-3">
              <div className="flex items-center justify-between gap-2 mb-2">
                <span
                  className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                    pkg.isCustom
                      ? 'bg-purple-100 text-purple-800 border border-purple-200'
                      : pkg.type === 'domestic'
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-blue-50 text-blue-800 border border-blue-200'
                  }`}
                >
                  {pkg.isCustom ? 'Custom Tailored' : pkg.type === 'domestic' ? 'Domestic' : 'International'}
                </span>

                <div className="flex items-center gap-1 text-slate-500 text-xs font-medium">
                  <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{pkg.duration}</span>
                </div>
              </div>

              <h3 className="font-bold text-slate-900 text-base leading-snug line-clamp-2">
                {pkg.title}
              </h3>

              <div className="flex items-center gap-1 text-xs text-slate-500 mt-1">
                <svg className="w-3.5 h-3.5 text-orange-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>{pkg.destination}</span>
              </div>
            </div>

            {/* Description & Highlights */}
            <div className="px-5 flex-1">
              <p className="text-xs text-slate-600 line-clamp-2 mb-3 leading-relaxed">
                {pkg.description}
              </p>

              {/* Category Badges */}
              <div className="flex flex-wrap gap-1 mb-3">
                {pkg.category.slice(0, 3).map((cat) => (
                  <span
                    key={cat}
                    className="text-[10px] font-semibold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md"
                  >
                    {cat}
                  </span>
                ))}
              </div>

              {/* Highlights Preview */}
              {pkg.highlights && pkg.highlights.length > 0 && (
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 mb-3 space-y-1">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Key Highlights</div>
                  {pkg.highlights.slice(0, 2).map((h, i) => (
                    <div key={i} className="text-xs text-slate-700 flex items-start gap-1.5">
                      <span className="text-orange-500 font-bold">•</span>
                      <span className="line-clamp-1">{h}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Pricing & Footer Actions */}
            <div className="p-5 pt-3 border-t border-slate-100 flex items-center justify-between gap-2 bg-slate-50/50">
              <div>
                <div className="text-[10px] font-semibold uppercase text-slate-500">Starting From</div>
                <div className="text-base font-extrabold text-slate-900">
                  {pkg.priceFrom || 'On Request'}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedModalPackage(pkg)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Itinerary
                </button>

                {onSelectPackageForQuote && (
                  <button
                    onClick={() => onSelectPackageForQuote(pkg)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-orange-600 hover:bg-orange-700 text-white shadow-sm transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Quote
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}

        {filteredPackages.length === 0 && (
          <div className="col-span-full py-16 text-center bg-white rounded-2xl border border-slate-200">
            <svg className="w-12 h-12 text-slate-300 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h4 className="text-base font-bold text-slate-800">No tour packages found</h4>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Try adjusting your search criteria or create a custom package for this customer requirement.
            </p>
            <button
              onClick={() => setIsCustomModalOpen(true)}
              className="mt-4 px-4 py-2 bg-orange-600 text-white rounded-xl text-xs font-semibold hover:bg-orange-700 transition-colors cursor-pointer"
            >
              Create Custom Package
            </button>
          </div>
        )}
      </div>

      {/* Package Itinerary Detail Modal */}
      {selectedModalPackage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden max-h-[88vh] flex flex-col">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-900 text-white">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-orange-400">
                  {selectedModalPackage.duration} • {selectedModalPackage.destination}
                </span>
                <h3 className="text-lg font-bold text-white mt-0.5">
                  {selectedModalPackage.title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedModalPackage(null)}
                className="w-8 h-8 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 flex items-center justify-center transition-colors cursor-pointer"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Scroll Content */}
            <div className="p-6 overflow-y-auto space-y-5 text-sm">
              <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                {selectedModalPackage.description}
              </p>

              {/* Day-by-Day Itinerary */}
              {selectedModalPackage.itinerary && selectedModalPackage.itinerary.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-3 flex items-center gap-1.5">
                    <svg className="w-4 h-4 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Day-by-Day Tour Itinerary
                  </h4>
                  <div className="space-y-3">
                    {selectedModalPackage.itinerary.map((day) => (
                      <div key={day.day} className="p-3 bg-slate-50/80 rounded-xl border border-slate-200/80">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-bold px-2 py-0.5 rounded bg-slate-900 text-white font-mono">
                            Day {day.day}
                          </span>
                          <span className="font-bold text-slate-900 text-xs">{day.title}</span>
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed pl-10">
                          {day.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Inclusions & Exclusions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {selectedModalPackage.inclusions && selectedModalPackage.inclusions.length > 0 && (
                  <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100">
                    <h5 className="text-xs font-bold text-emerald-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Tour Inclusions
                    </h5>
                    <ul className="space-y-1.5 text-xs text-emerald-800">
                      {selectedModalPackage.inclusions.map((inc, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <span className="text-emerald-600 font-bold shrink-0">✓</span>
                          <span>{inc}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {selectedModalPackage.exclusions && selectedModalPackage.exclusions.length > 0 && (
                  <div className="bg-rose-50/50 p-4 rounded-xl border border-rose-100">
                    <h5 className="text-xs font-bold text-rose-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <svg className="w-4 h-4 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      Tour Exclusions
                    </h5>
                    <ul className="space-y-1.5 text-xs text-rose-800">
                      {selectedModalPackage.exclusions.map((exc, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <span className="text-rose-500 font-bold shrink-0">✕</span>
                          <span>{exc}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50">
              <div>
                <span className="text-[10px] font-semibold uppercase text-slate-500 block">Starting From</span>
                <span className="text-base font-bold text-slate-900">
                  {selectedModalPackage.priceFrom || 'On Request'}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedModalPackage(null)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 hover:bg-white transition-colors cursor-pointer"
                >
                  Close
                </button>
                {onSelectPackageForQuote && (
                  <button
                    onClick={() => {
                      onSelectPackageForQuote(selectedModalPackage);
                      setSelectedModalPackage(null);
                    }}
                    className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Apply to Quote
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Custom Package Creator Modal */}
      <CustomPackageModal
        isOpen={isCustomModalOpen}
        onClose={() => setIsCustomModalOpen(false)}
        onPackageCreated={handleCustomPackageCreated}
      />
    </div>
  );
}
