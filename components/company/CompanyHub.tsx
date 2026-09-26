'use client';

import React, { useState } from 'react';
import { SHANVI_COMPANY_INFO, SHANVI_SERVICES, SHANVI_BANK_DETAILS } from '@/lib/packages-data';
import OfficeMap from './OfficeMap';

export default function CompanyHub() {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(label);
    setTimeout(() => setCopiedField(null), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Company Executive Master Card */}
      <div className="p-6 md:p-8 rounded-3xl bg-slate-900 text-white border border-slate-800 shadow-xl relative overflow-hidden">
        {/* Subtle decorative glow */}
        <div className="absolute right-0 top-0 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-orange-600 flex items-center justify-center font-black text-2xl text-white shadow-lg">
                SH
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold text-white tracking-tight">
                    {SHANVI_COMPANY_INFO.name}
                  </h1>
                  <span className="text-xs font-semibold uppercase tracking-wider bg-orange-500/20 text-orange-400 border border-orange-500/30 px-2.5 py-0.5 rounded-full">
                    Verified DMC
                  </span>
                </div>
                <p className="text-xs text-orange-400 font-semibold tracking-wide">
                  &ldquo;{SHANVI_COMPANY_INFO.tagline}&rdquo;
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed pt-1">
              Established in {SHANVI_COMPANY_INFO.established}, Shanvi Hospitality is a premier Destination Management Company (DMC) and Tour Operator based in Sector 18, Noida, Uttar Pradesh. We provide verified hotel contracting, private tourist transportation fleet, pilgrimage yatra logistics, and customized international holidays across Thailand, Vietnam, and Nepal.
            </p>

            <div className="flex flex-wrap gap-2 pt-2">
              <a
                href={`https://wa.me/919999885087?text=Hello%20Shanvi%20Hospitality%20Team`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 transition-colors shadow-sm flex items-center gap-2 cursor-pointer"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <span>Direct WhatsApp (+91 9999885087)</span>
              </a>

              <a
                href="tel:+919999885087"
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 transition-colors border border-slate-700 flex items-center gap-2 cursor-pointer"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <span>Call Central Helpline</span>
              </a>

              <a
                href={SHANVI_COMPANY_INFO.website}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-800/60 hover:bg-slate-800 transition-colors border border-slate-700/60 flex items-center gap-1.5 cursor-pointer"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                </svg>
                <span>{SHANVI_COMPANY_INFO.website.replace('https://', '')}</span>
              </a>
            </div>
          </div>

          {/* Quick Legal & Tax Credential Box */}
          <div className="bg-slate-800/70 p-5 rounded-2xl border border-slate-700/80 backdrop-blur-md space-y-3 min-w-[280px]">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-700/80 pb-2">
              Registration & GST Credentials
            </h4>

            <div>
              <div className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">GSTIN Number</div>
              <div className="text-xs font-bold text-emerald-400 tracking-wider font-mono mt-0.5">
                {SHANVI_COMPANY_INFO.gstNumber}
              </div>
              <div className="text-[11px] text-slate-400">Reg. Date: {SHANVI_COMPANY_INFO.gstRegistrationDate} (Uttar Pradesh)</div>
            </div>

            <div>
              <div className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">Legal Entity Type</div>
              <div className="text-xs font-bold text-slate-200 mt-0.5">{SHANVI_COMPANY_INFO.legalStatus}</div>
            </div>

            <div>
              <div className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">Key Tour Planner</div>
              <div className="text-xs font-bold text-orange-300 mt-0.5">{SHANVI_COMPANY_INFO.keyContact}</div>
            </div>

            <div>
              <div className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">Official Inquiries</div>
              <div className="text-xs text-slate-300 font-medium mt-0.5">{SHANVI_COMPANY_INFO.email}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Official B2B & B2C Bank Remittance Credentials */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-900 text-white uppercase tracking-wider">
                Official Bank Remittance
              </span>
              <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                Verified Current Account
              </span>
            </div>
            <h3 className="text-lg font-bold text-slate-900 mt-1">
              Shanvi Hospitality Bank Wire & RTGS / NEFT Details
            </h3>
            <p className="text-xs text-slate-500">
              Provide these details to clients and B2B partners for tour package deposits and invoice payments.
            </p>
          </div>

          <div className="text-right">
            <span className="text-xs text-slate-400 block font-mono">UPI ID:</span>
            <span className="text-sm font-bold text-slate-900 font-mono">{SHANVI_BANK_DETAILS.upiId}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-xs font-semibold text-slate-500 uppercase block">Beneficiary Name</span>
            <span className="text-sm font-bold text-slate-900 mt-1 block">{SHANVI_BANK_DETAILS.beneficiaryName}</span>
            <span className="text-[11px] text-slate-400 mt-0.5 block">{SHANVI_BANK_DETAILS.accountType}</span>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase">Account Number</span>
              <button
                onClick={() => handleCopy(SHANVI_BANK_DETAILS.accountNumber, 'ac')}
                className="text-[11px] text-orange-600 font-semibold hover:text-orange-700 cursor-pointer"
              >
                {copiedField === 'ac' ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <span className="text-sm font-bold text-slate-900 font-mono mt-1 block tracking-wider">
              {SHANVI_BANK_DETAILS.accountNumber}
            </span>
            <span className="text-[11px] text-slate-400 mt-0.5 block">{SHANVI_BANK_DETAILS.bankName}</span>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase">IFSC Code</span>
              <button
                onClick={() => handleCopy(SHANVI_BANK_DETAILS.ifscCode, 'ifsc')}
                className="text-[11px] text-orange-600 font-semibold hover:text-orange-700 cursor-pointer"
              >
                {copiedField === 'ifsc' ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <span className="text-sm font-bold text-slate-900 font-mono mt-1 block tracking-wider">
              {SHANVI_BANK_DETAILS.ifscCode}
            </span>
            <span className="text-[11px] text-slate-400 mt-0.5 block">RTGS / NEFT / IMPS Enabled</span>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-xs font-semibold text-slate-500 uppercase block">Bank Branch</span>
            <span className="text-xs font-bold text-slate-800 mt-1 block">{SHANVI_BANK_DETAILS.branch}</span>
            <span className="text-[11px] text-slate-400 mt-0.5 block">HDFC Bank Sector 18 Noida</span>
          </div>
        </div>
      </div>

      {/* Interactive Office Location Map Section */}
      <OfficeMap />

      {/* Core Services Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900 tracking-tight">
              Shanvi Hospitality Core Service Verticals
            </h3>
            <p className="text-xs text-slate-500">
              8 comprehensive travel, logistics, and hospitality offerings provided across India & Southeast Asia
            </p>
          </div>
          <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-full">
            8 DMC Verticals
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {SHANVI_SERVICES.map((srv) => (
            <div
              key={srv.id}
              className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow duration-200 flex flex-col justify-between"
            >
              <div>
                <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center font-bold text-sm mb-3 border border-orange-100">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>

                <h4 className="font-bold text-slate-900 text-sm">{srv.name}</h4>
                <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                  {srv.shortDescription}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100">
                <div className="flex flex-wrap gap-1">
                  {srv.subServices.slice(0, 3).map((sub, i) => (
                    <span
                      key={i}
                      className="text-[10px] font-semibold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md"
                    >
                      {sub}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
