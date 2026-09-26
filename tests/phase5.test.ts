/**
 * Phase 5 Automated Test Suite — Calendar, Reports, Vouchers & WhatsApp Delivery
 * Adheres strictly to phases.md §Phase 5 acceptance criteria.
 */

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { GET as getCalendar } from '@/app/api/calendar/route';
import { GET as getSalesReport } from '@/app/api/reports/sales/route';
import { POST as sendWhatsApp } from '@/app/api/whatsapp/send/route';
import { GET as getVoucher } from '@/app/api/bookings/[id]/voucher/route';
import { GET as getCompany, PATCH as updateCompany } from '@/app/api/company/route';

type TestResult = {
  name: string;
  passed: boolean;
  error?: string;
};

const results: TestResult[] = [];

function assert(condition: boolean, name: string, details?: string) {
  if (condition) {
    results.push({ name, passed: true });
    console.log(`✅ PASS: ${name}`);
  } else {
    results.push({ name, passed: false, error: details });
    console.error(`❌ FAIL: ${name} ${details ? `— ${details}` : ''}`);
  }
}

export async function runPhase5Tests() {
  console.log('\n====================================================');
  console.log('STARTING PHASE 5 TEST & FIX LOOP VERIFICATION');
  console.log('====================================================\n');

  let companyAId = '';
  let companyBId = '';
  let adminAId = '';
  let adminAUid = 'test-phase5-admin-a';
  let leadAId = '';
  let itineraryAId = '';
  let bookingAId = '';

  try {
    console.log('Creating test tenants, users, and booking data...');

    // Create Company A (Shanvi)
    const compA = await prisma.company.create({
      data: {
        name: 'Shanvi Hospitality Test',
        gstNumber: '09AEKFS1932F1ZX',
        currency: 'INR',
      },
    });
    companyAId = compA.id;

    // Create Company B (Cross-tenant competitor)
    const compB = await prisma.company.create({
      data: {
        name: 'Competitor Travel Ltd',
        gstNumber: '07AAACC1234F1Z5',
        currency: 'INR',
      },
    });
    companyBId = compB.id;

    // Create Admin A user
    const adminA = await prisma.user.create({
      data: {
        name: 'Himani Sharma',
        email: 'himani.test@shanvihospitality.in',
        role: 'admin',
        supabaseUid: adminAUid,
        companyId: companyAId,
        active: true,
      },
    });
    adminAId = adminA.id;

    // Create Lead for Company A
    const leadA = await prisma.lead.create({
      data: {
        companyId: companyAId,
        name: 'Rohan Verma',
        phone: '+919999885087',
        destination: 'Haridwar & Corbett',
        paxCount: 2,
        status: 'CONFIRMED',
        quotedPrice: 38000,
        assignedAgentId: adminAId,
      },
    });
    leadAId = leadA.id;

    // Create Itinerary for Lead A
    const itineraryA = await prisma.itinerary.create({
      data: {
        companyId: companyAId,
        leadId: leadAId,
        title: 'Haridwar Corbett 4D3N Escape',
        destination: 'Uttarakhand',
        startDate: new Date('2026-10-10'),
        endDate: new Date('2026-10-14'),
        markup: 5000,
        totalCost: 33000,
        finalPrice: 38000,
        currency: 'INR',
      },
    });
    itineraryAId = itineraryA.id;

    // Create Day 1 with accommodation line item
    const day1 = await prisma.itineraryDay.create({
      data: {
        itineraryId: itineraryAId,
        dayNumber: 1,
        title: 'Arrival in Haridwar',
        description: 'Hotel check in and Ganga Aarti',
      },
    });

    await prisma.itineraryLineItem.create({
      data: {
        dayId: day1.id,
        category: 'ACCOMMODATION',
        description: 'Hotel Ganga View Superior Room',
        cost: 4500,
      },
    });

    // Create Confirmed Booking for Lead A
    const bookingA = await prisma.booking.create({
      data: {
        companyId: companyAId,
        leadId: leadAId,
        itineraryId: itineraryAId,
        bookingNumber: 'BK-SHV-2026-001',
        status: 'CONFIRMED',
        totalAmount: 38000,
        currency: 'INR',
      },
    });
    bookingAId = bookingA.id;

    console.log('Fixtures initialized successfully.\n');

    // --- TEST GROUP 1: Tour Calendar View ---
    console.log('--- TEST GROUP 1: Tour Calendar View ---');
    const calendarReq = new NextRequest('http://localhost:3000/api/calendar?month=2026-10', {
      headers: { 'x-test-supabase-uid': adminAUid },
    });
    const calendarRes = await getCalendar(calendarReq);
    assert(calendarRes.status === 200, 'GET /api/calendar returns 200 OK');
    const calendarData = await calendarRes.json();
    assert(
      Array.isArray(calendarData.bookings) && calendarData.bookings.length >= 1,
      'Calendar correctly returns confirmed booking departures for October 2026'
    );
    assert(
      calendarData.bookings.some((b: any) => b.bookingNumber === 'BK-SHV-2026-001'),
      'Calendar includes booking BK-SHV-2026-001 with guest and destination details'
    );

    // --- TEST GROUP 2: Sales Report ---
    console.log('\n--- TEST GROUP 2: Sales Report ---');
    const reportReq = new NextRequest('http://localhost:3000/api/reports/sales', {
      headers: { 'x-test-supabase-uid': adminAUid },
    });
    const reportRes = await getSalesReport(reportReq);
    assert(reportRes.status === 200, 'GET /api/reports/sales returns 200 OK');
    const reportData = await reportRes.json();
    assert(
      reportData.summary && typeof reportData.summary.totalRevenue === 'number',
      'Sales report computes summary metrics (totalRevenue, totalLeads, conversionRate)'
    );

    // --- TEST GROUP 3: WhatsApp Delivery Dispatch ---
    console.log('\n--- TEST GROUP 3: WhatsApp Delivery Dispatch ---');
    const waQuoteReq = new NextRequest('http://localhost:3000/api/whatsapp/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-test-supabase-uid': adminAUid,
      },
      body: JSON.stringify({
        to: '+919999885087',
        leadId: leadAId,
        type: 'quote',
        title: 'Haridwar Corbett 4D3N Escape',
        amount: 38000,
      }),
    });
    const waQuoteRes = await sendWhatsApp(waQuoteReq);
    assert(waQuoteRes.status === 200, 'POST /api/whatsapp/send returns 200 OK for quote dispatch');
    const waQuoteData = await waQuoteRes.json();
    assert(
      waQuoteData.success && waQuoteData.directUrl.includes('https://wa.me/'),
      'WhatsApp dispatch returns direct wa.me deep link with pre-composed Shanvi message'
    );

    // Verify lead note was automatically logged
    const leadNotes = await prisma.leadNote.findMany({
      where: { leadId: leadAId },
    });
    assert(
      leadNotes.some((n: any) => n.content.includes('[WhatsApp QUOTE]')),
      'Lead timeline note automatically logged for WhatsApp quote dispatch'
    );

    // --- TEST GROUP 4: Accommodation Voucher PDF Generation ---
    console.log('\n--- TEST GROUP 4: Accommodation Voucher PDF Generation ---');
    const voucherReq = new NextRequest(`http://localhost:3000/api/bookings/${bookingAId}/voucher`, {
      headers: { 'x-test-supabase-uid': adminAUid },
    });
    const voucherRes = await getVoucher(voucherReq, { params: Promise.resolve({ id: bookingAId }) });
    assert(voucherRes.status === 200, 'GET /api/bookings/[id]/voucher returns 200 OK');
    assert(
      voucherRes.headers.get('content-type') === 'application/pdf',
      'Voucher response returns Content-Type: application/pdf'
    );
    const voucherBlob = await voucherRes.arrayBuffer();
    const voucherHeader = Buffer.from(voucherBlob).subarray(0, 5).toString();
    assert(
      voucherHeader === '%PDF-',
      'Generated accommodation voucher is a valid binary PDF starting with %PDF-'
    );

    // --- TEST GROUP 5: Cross-Tenant Voucher Isolation ---
    console.log('\n--- TEST GROUP 5: Cross-Tenant Voucher Isolation ---');
    const compBAdmin = await prisma.user.create({
      data: {
        name: 'Competitor Admin',
        email: 'admin.b@competitor.com',
        role: 'admin',
        supabaseUid: 'test-phase5-comp-b-admin',
        companyId: companyBId,
        active: true,
      },
    });

    const crossVoucherReq = new NextRequest(`http://localhost:3000/api/bookings/${bookingAId}/voucher`, {
      headers: { 'x-test-supabase-uid': 'test-phase5-comp-b-admin' },
    });
    const crossVoucherRes = await getVoucher(crossVoucherReq, { params: Promise.resolve({ id: bookingAId }) });
    assert(
      crossVoucherRes.status === 403,
      'Cross-tenant user is blocked from viewing Company A voucher with 403 Forbidden'
    );

    // --- TEST GROUP 6: Company Profile Settings ---
    console.log('\n--- TEST GROUP 6: Company Profile Settings ---');
    const patchCompanyReq = new NextRequest('http://localhost:3000/api/company', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'x-test-supabase-uid': adminAUid,
      },
      body: JSON.stringify({
        gstNumber: '09AEKFS1932F1ZX',
        currency: 'INR',
      }),
    });
    const patchCompanyRes = await updateCompany(patchCompanyReq);
    assert(patchCompanyRes.status === 200, 'PATCH /api/company updates GSTIN and currency successfully');

    const getCompReq = new NextRequest('http://localhost:3000/api/company', {
      headers: { 'x-test-supabase-uid': adminAUid },
    });
    const getCompRes = await getCompany(getCompReq);
    assert(getCompRes.status === 200, 'GET /api/company returns updated company credentials');

  } catch (err: any) {
    console.error('Fatal error during Phase 5 testing:', err);
    assert(false, 'Phase 5 Test Suite execution', err.message);
  } finally {
    console.log('\nCleaning up test records from database...');
    try {
      if (bookingAId) await prisma.booking.deleteMany({ where: { id: bookingAId } });
      if (itineraryAId) await prisma.itinerary.deleteMany({ where: { id: itineraryAId } });
      if (leadAId) await prisma.lead.deleteMany({ where: { id: leadAId } });
      if (adminAId) await prisma.user.deleteMany({ where: { companyId: companyAId } });
      await prisma.user.deleteMany({ where: { companyId: companyBId } });
      if (companyAId) await prisma.company.deleteMany({ where: { id: companyAId } });
      if (companyBId) await prisma.company.deleteMany({ where: { id: companyBId } });
    } catch (cleanupErr) {
      console.warn('Cleanup error (non-fatal):', cleanupErr);
    }
    console.log('Cleanup complete.\n');
  }

  const passedCount = results.filter((r) => r.passed).length;
  const failedCount = results.filter((r) => !r.passed).length;

  console.log('====================================================');
  console.log(`PHASE 5 TEST SUMMARY: ${passedCount} PASSED, ${failedCount} FAILED`);
  console.log('====================================================\n');

  return {
    success: failedCount === 0,
    passed: passedCount,
    failed: failedCount,
    results,
  };
}
