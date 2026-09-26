'use client';

import React, { useState } from 'react';
import { SHANVI_OFFICE_LOCATION, SHANVI_COMPANY_INFO } from '@/lib/packages-data';

export default function OfficeMap() {
  const [copied, setCopied] = useState(false);

  const handleCopyCoords = () => {
    navigator.clipboard.writeText(`${SHANVI_OFFICE_LOCATION.latitude}, ${SHANVI_OFFICE_LOCATION.longitude}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/50">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-900 text-white uppercase tracking-wider">
              Corporate Headquarters
            </span>
            <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              Open 9:00 AM – 7:00 PM
            </span>
          </div>
          <h3 className="text-xl font-bold text-slate-900">Shanvi Hospitality — Noida Sector 18 Office</h3>
          <p className="text-xs text-slate-600 mt-0.5">
            {SHANVI_OFFICE_LOCATION.address}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyCoords}
            className="px-3 py-2 rounded-xl text-xs font-semibold bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 shadow-sm transition-colors cursor-pointer flex items-center gap-1.5"
            title="Copy GPS coordinates"
          >
            <svg className="w-3.5 h-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            {copied ? 'Copied GPS!' : '28.5708° N, 77.3271° E'}
          </button>

          <a
            href={SHANVI_OFFICE_LOCATION.googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-orange-600 hover:bg-orange-700 text-white shadow-sm transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            Open in Google Maps
          </a>
        </div>
      </div>

      {/* Interactive Map Visual Frame */}
      <div className="relative w-full h-80 sm:h-96 bg-slate-100 overflow-hidden">
        {/* OpenStreetMap iframe */}
        <iframe
          title="Shanvi Hospitality Sector 18 Noida Office Map"
          width="100%"
          height="100%"
          frameBorder="0"
          scrolling="no"
          marginHeight={0}
          marginWidth={0}
          src="https://www.openstreetmap.org/export/embed.html?bbox=77.3180%2C28.5640%2C77.3360%2C28.5770&amp;layer=mapnik&amp;marker=28.5708%2C77.3271"
          className="w-full h-full border-0 filter contrast-[1.05]"
        />

        {/* Floating Headquarters Info Card */}
        <div className="absolute top-4 left-4 max-w-xs bg-slate-900/90 text-white p-4 rounded-xl shadow-lg backdrop-blur-md border border-white/10 hidden sm:block">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-wider text-orange-400">Ground Presence</span>
          </div>
          <div className="font-bold text-sm text-white">Shanvi Hospitality DMC</div>
          <div className="text-xs text-slate-300 mt-1">
            Sector 18, Noida, Uttar Pradesh 201301
          </div>
          <div className="mt-2.5 pt-2 border-t border-slate-700/80 flex items-center justify-between text-[11px] text-slate-300">
            <span>GSTIN:</span>
            <span className="font-mono text-orange-300 font-semibold">{SHANVI_COMPANY_INFO.gstNumber}</span>
          </div>
        </div>

        {/* Floating Helpline Badge */}
        <div className="absolute bottom-4 right-4 bg-white/95 backdrop-blur-md p-3 rounded-xl shadow-md border border-slate-200 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center shrink-0">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
          </div>
          <div>
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">24/7 Noida Helpline</div>
            <a href="tel:+919999885087" className="text-xs font-bold text-slate-900 hover:text-orange-600 transition-colors">
              +91 9999885087 / 9355141058
            </a>
          </div>
        </div>
      </div>

      {/* Transit & Accessibility Details Bento Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-slate-100 bg-white">
        <div className="p-4 flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div>
            <div className="text-xs font-bold text-slate-900">Metro Station Proximity</div>
            <p className="text-xs text-slate-600 mt-0.5">{SHANVI_OFFICE_LOCATION.metroConnectivity}</p>
          </div>
        </div>

        <div className="p-4 flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </div>
          <div>
            <div className="text-xs font-bold text-slate-900">Airport Transit</div>
            <p className="text-xs text-slate-600 mt-0.5">{SHANVI_OFFICE_LOCATION.airportDistance}</p>
          </div>
        </div>

        <div className="p-4 flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 mt-0.5">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <div>
            <div className="text-xs font-bold text-slate-900">Rail Conectivity</div>
            <p className="text-xs text-slate-600 mt-0.5">{SHANVI_OFFICE_LOCATION.railwayDistance}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
