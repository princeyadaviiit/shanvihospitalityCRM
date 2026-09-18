/**
 * Phase 2 Test Suite: Itinerary & Quote Builder, Auto Costing, PDF Export & Booking Conversion
 *
 * Checks:
 * 1. Agent can build multi-day itinerary with line items across categories
 * 2. Auto costing computes totalCost = sum(lineItems) and finalPrice = totalCost + markup
 * 3. Lead quotedPrice is synchronized with finalPrice
 * 4. RBAC: Staff Agent cannot edit another agent's itinerary (403 Forbidden)
 * 5. RBAC: Accounts role is blocked from creating/editing itineraries (403 Forbidden)
 * 6. Cross-Tenant Isolation: Company B cannot view, modify, or export Company A's itinerary (404 Not Found)
 * 7. PDF Export: Generates valid PDF binary stream with tenant-scoped details
 * 8. Convert to Booking: Converts itinerary to confirmed Booking, locks bookingNumber and updates lead status to CONFIRMED
 * 9. Input Validation: Rejects invalid inputs (negative markup, 0 days) with 400 Bad Request
 */

import { NextRequest } from 'next/server';
import { GET as getItinerary, POST as saveItinerary } from '@/app/api/leads/[id]/itinerary/route';
import { GET as exportPdf } from '@/app/api/itineraries/[id]/export/route';
import { POST as convertBooking } from '@/app/api/itineraries/[id]/convert-booking/route';
import { prisma } from '@/lib/prisma';

function buildRequest(
  url: string,
  method: string,
  body?: any,
  mockSupabaseUid?: string
): NextRequest {
  const headers = new Headers();
  headers.set('Content-Type', 'application/json');
  if (mockSupabaseUid) {
    headers.set('x-test-supabase-uid', mockSupabaseUid);
  }

  return new NextRequest(new URL(url, 'http://localhost:3000'), {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
}

export async function runPhase2Tests() {
  console.log('====================================================');
  console.log('STARTING PHASE 2 TEST & FIX LOOP VERIFICATION');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: any) {
    if (condition) {
      console.log(`✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${testName}`, detail || '');
      failed++;
    }
  }

  const suffix = Date.now().toString().slice(-6);

  console.log('Creating test tenants, users, and leads...');

  // Tenant 1: Zenith Travels
  const companyA = await prisma.company.create({
    data: { name: `Zenith Travels ${suffix}`, currency: 'INR' },
  });

  const adminA = await prisma.user.create({
    data: {
      supabaseUid: `admin_zenith_${suffix}`,
      companyId: companyA.id,
      name: 'Zenith Admin',
      email: `admin.zenith.${suffix}@example.com`,
      role: 'admin',
      active: true,
    },
  });

  const agentA1 = await prisma.user.create({
    data: {
      supabaseUid: `agent_a1_${suffix}`,
      companyId: companyA.id,
      name: 'Agent Siddharth',
      email: `sid.${suffix}@example.com`,
      role: 'staff_agent',
      active: true,
    },
  });

  const agentA2 = await prisma.user.create({
    data: {
      supabaseUid: `agent_a2_${suffix}`,
      companyId: companyA.id,
      name: 'Agent Meera',
      email: `meera.${suffix}@example.com`,
      role: 'staff_agent',
      active: true,
    },
  });

  const accountsA = await prisma.user.create({
    data: {
      supabaseUid: `accounts_zenith_${suffix}`,
      companyId: companyA.id,
      name: 'Zenith Accounts',
      email: `accounts.zenith.${suffix}@example.com`,
      role: 'accounts',
      active: true,
    },
  });

  // Lead belonging to Agent A1
  const leadA1 = await prisma.lead.create({
    data: {
      companyId: companyA.id,
      assignedAgentId: agentA1.id,
      name: 'Karan Mehra',
      phone: '+91 98111 22334',
      destination: 'Dubai & Abu Dhabi',
      paxCount: 2,
      status: 'ENQUIRY',
      quotedPrice: 0,
      currency: 'INR',
    },
  });

  // Tenant 2: Global Voyage
  const companyB = await prisma.company.create({
    data: { name: `Global Voyage ${suffix}`, currency: 'USD' },
  });

  const adminB = await prisma.user.create({
    data: {
      supabaseUid: `admin_voyage_${suffix}`,
      companyId: companyB.id,
      name: 'Voyage Admin',
      email: `admin.voyage.${suffix}@example.com`,
      role: 'admin',
      active: true,
    },
  });

  console.log('Fixtures created successfully.\n');

  try {
    // ----------------------------------------------------
    // TEST 1: Build Multi-Day Itinerary with Auto Costing
    // ----------------------------------------------------
    console.log('--- TEST GROUP 1: Itinerary Creation & Costing ---');
    const itineraryPayload = {
      title: '5 Nights 6 Days Luxury Dubai & Abu Dhabi',
      destination: 'Dubai & Abu Dhabi',
      startDate: '2026-11-10',
      endDate: '2026-11-15',
      markup: 15000,
      currency: 'INR',
      days: [
        {
          dayNumber: 1,
          title: 'Arrival in Dubai & Dhow Cruise Dinner',
          description: 'Private airport pickup, check-in to Atlantis The Palm, evening Marina cruise.',
          lineItems: [
            { category: 'TRANSPORT', description: 'Dubai Airport Private SUV Transfer', cost: 3500 },
            { category: 'ACCOMMODATION', description: 'Atlantis The Palm - Ocean Room (Night 1)', cost: 22000 },
            { category: 'ACTIVITY', description: 'Marina Luxury Dhow Cruise with Dinner', cost: 4500 },
          ],
        },
        {
          dayNumber: 2,
          title: 'Desert Safari & Dune Bashing Experience',
          description: 'Morning at leisure, 4x4 desert safari with BBQ dinner and cultural show.',
          lineItems: [
            { category: 'ACTIVITY', description: 'Premium Desert Safari with VIP Majlis', cost: 7000 },
            { category: 'ACCOMMODATION', description: 'Atlantis The Palm - Ocean Room (Night 2)', cost: 22000 },
            { category: 'MEALS', description: 'Bedouin Gourmet BBQ Dinner', cost: 3000 },
          ],
        },
      ],
    };

    // Expected costs:
    // Day 1: 3500 + 22000 + 4500 = 30000
    // Day 2: 7000 + 22000 + 3000 = 32000
    // Total Cost = 62000
    // Final Price = 62000 + 15000 (markup) = 77000

    const saveReq = buildRequest(
      `/api/leads/${leadA1.id}/itinerary`,
      'POST',
      itineraryPayload,
      agentA1.supabaseUid
    );
    const saveRes = await saveItinerary(saveReq, {
      params: Promise.resolve({ id: leadA1.id }),
    });
    const saveData = await saveRes.json();

    assert(
      saveRes.status === 200 && saveData.itinerary?.id,
      'Staff Agent 1 saves multi-day itinerary successfully (200 OK)',
      `Got status: ${saveRes.status}`
    );

    const itineraryId = saveData.itinerary?.id;

    assert(
      saveData.itinerary.totalCost === 62000,
      'Auto-calculated totalCost correctly sums all line items across days (62,000 INR)',
      `Expected 62000, got ${saveData.itinerary?.totalCost}`
    );

    assert(
      saveData.itinerary.finalPrice === 77000,
      'Final price correctly applies flat markup (62,000 + 15,000 = 77,000 INR)',
      `Expected 77000, got ${saveData.itinerary?.finalPrice}`
    );

    // Verify lead record's quotedPrice was synced
    const updatedLead = await prisma.lead.findUnique({ where: { id: leadA1.id } });
    assert(
      updatedLead?.quotedPrice === 77000,
      'Lead quotedPrice is automatically updated with itinerary finalPrice'
    );

    // ----------------------------------------------------
    // TEST 2: RBAC & Agent Scoping
    // ----------------------------------------------------
    console.log('\n--- TEST GROUP 2: RBAC & Lead Scoping ---');
    // Agent A2 tries to modify Agent A1's itinerary -> MUST BE 403 Forbidden
    const agent2SaveReq = buildRequest(
      `/api/leads/${leadA1.id}/itinerary`,
      'POST',
      itineraryPayload,
      agentA2.supabaseUid
    );
    const agent2SaveRes = await saveItinerary(agent2SaveReq, {
      params: Promise.resolve({ id: leadA1.id }),
    });
    assert(
      agent2SaveRes.status === 403,
      'Staff Agent 2 is blocked from modifying Staff Agent 1 itinerary with 403 Forbidden',
      `Got status: ${agent2SaveRes.status}`
    );

    // Accounts role tries to modify itinerary -> MUST BE 403 Forbidden
    const accountsSaveReq = buildRequest(
      `/api/leads/${leadA1.id}/itinerary`,
      'POST',
      itineraryPayload,
      accountsA.supabaseUid
    );
    const accountsSaveRes = await saveItinerary(accountsSaveReq, {
      params: Promise.resolve({ id: leadA1.id }),
    });
    assert(
      accountsSaveRes.status === 403,
      'Accounts role is blocked from modifying itinerary with 403 Forbidden',
      `Got status: ${accountsSaveRes.status}`
    );

    // Accounts role CAN read the itinerary (read-only for reconciliation)
    const accountsGetReq = buildRequest(
      `/api/leads/${leadA1.id}/itinerary`,
      'GET',
      undefined,
      accountsA.supabaseUid
    );
    const accountsGetRes = await getItinerary(accountsGetReq, {
      params: Promise.resolve({ id: leadA1.id }),
    });
    assert(
      accountsGetRes.status === 200,
      'Accounts role can view itinerary in read-only mode with 200 OK',
      `Got status: ${accountsGetRes.status}`
    );

    // ----------------------------------------------------
    // TEST 3: Cross-Tenant Isolation
    // ----------------------------------------------------
    console.log('\n--- TEST GROUP 3: Cross-Tenant Isolation ---');
    // Admin B from Company B tries to view Company A's itinerary
    const crossTenantGetReq = buildRequest(
      `/api/leads/${leadA1.id}/itinerary`,
      'GET',
      undefined,
      adminB.supabaseUid
    );
    const crossTenantGetRes = await getItinerary(crossTenantGetReq, {
      params: Promise.resolve({ id: leadA1.id }),
    });
    assert(
      crossTenantGetRes.status === 404,
      'Company B cannot access Company A itinerary (404 Not Found)',
      `Got status: ${crossTenantGetRes.status}`
    );

    // Admin B tries to export Company A's itinerary to PDF
    const crossTenantExportReq = buildRequest(
      `/api/itineraries/${itineraryId}/export`,
      'GET',
      undefined,
      adminB.supabaseUid
    );
    const crossTenantExportRes = await exportPdf(crossTenantExportReq, {
      params: Promise.resolve({ id: itineraryId }),
    });
    assert(
      crossTenantExportRes.status === 404,
      'Company B cannot export Company A itinerary to PDF (404 Not Found)',
      `Got status: ${crossTenantExportRes.status}`
    );

    // ----------------------------------------------------
    // TEST 4: PDF Export Generation
    // ----------------------------------------------------
    console.log('\n--- TEST GROUP 4: PDF Export Generation ---');
    const exportReq = buildRequest(
      `/api/itineraries/${itineraryId}/export`,
      'GET',
      undefined,
      agentA1.supabaseUid
    );
    const exportRes = await exportPdf(exportReq, {
      params: Promise.resolve({ id: itineraryId }),
    });
    assert(
      exportRes.status === 200,
      'Itinerary PDF export returns 200 OK',
      `Got status: ${exportRes.status}`
    );

    const contentType = exportRes.headers.get('content-type');
    assert(
      contentType?.includes('application/pdf'),
      'PDF export returns Content-Type: application/pdf',
      `Got: ${contentType}`
    );

    const pdfArrayBuffer = await exportRes.arrayBuffer();
    const pdfBuffer = Buffer.from(pdfArrayBuffer);
    const hasPdfHeader = pdfBuffer.slice(0, 5).toString('ascii') === '%PDF-';
    assert(
      hasPdfHeader,
      'Exported stream is a valid PDF file starting with %PDF- header',
      `Header: ${pdfBuffer.slice(0, 5).toString('ascii')}`
    );

    // ----------------------------------------------------
    // TEST 5: Convert Itinerary to Booking
    // ----------------------------------------------------
    console.log('\n--- TEST GROUP 5: Convert to Booking ---');
    const convertReq = buildRequest(
      `/api/itineraries/${itineraryId}/convert-booking`,
      'POST',
      undefined,
      agentA1.supabaseUid
    );
    const convertRes = await convertBooking(convertReq, {
      params: Promise.resolve({ id: itineraryId }),
    });
    const convertData = await convertRes.json();

    assert(
      convertRes.status === 201 && convertData.booking?.id,
      'Itinerary converts to confirmed Booking (201 Created)',
      `Got status: ${convertRes.status}`
    );

    assert(
      convertData.booking.bookingNumber?.startsWith('BK-'),
      `Booking assigned valid formatted bookingNumber: ${convertData.booking?.bookingNumber}`
    );

    assert(
      convertData.lead?.status === 'CONFIRMED',
      'Lead status transitioned to CONFIRMED upon booking conversion'
    );

    assert(
      convertData.booking.totalAmount === 77000,
      'Booking totalAmount preserves the finalized itinerary price (77,000 INR)'
    );

    // ----------------------------------------------------
    // TEST 6: Input Validation (Zod)
    // ----------------------------------------------------
    console.log('\n--- TEST GROUP 6: Input Validation ---');
    // Empty days array
    const emptyDaysReq = buildRequest(
      `/api/leads/${leadA1.id}/itinerary`,
      'POST',
      {
        title: 'Empty Days Itinerary',
        destination: 'Goa',
        days: [],
      },
      agentA1.supabaseUid
    );
    const emptyDaysRes = await saveItinerary(emptyDaysReq, {
      params: Promise.resolve({ id: leadA1.id }),
    });
    assert(
      emptyDaysRes.status === 400,
      'Itinerary with 0 days is rejected with 400 Bad Request',
      `Got status: ${emptyDaysRes.status}`
    );

    // Negative markup
    const negativeMarkupReq = buildRequest(
      `/api/leads/${leadA1.id}/itinerary`,
      'POST',
      {
        ...itineraryPayload,
        markup: -100,
      },
      agentA1.supabaseUid
    );
    const negativeMarkupRes = await saveItinerary(negativeMarkupReq, {
      params: Promise.resolve({ id: leadA1.id }),
    });
    assert(
      negativeMarkupRes.status === 400,
      'Negative markup is rejected with 400 Bad Request',
      `Got status: ${negativeMarkupRes.status}`
    );

    console.log('\n====================================================');
    console.log(`PHASE 2 TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log('====================================================');

    return { passed, failed, success: failed === 0 };
  } finally {
    console.log('\nCleaning up test records from database...');
    try {
      await prisma.booking.deleteMany({
        where: { companyId: { in: [companyA.id, companyB.id] } },
      });
      await prisma.itinerary.deleteMany({
        where: { companyId: { in: [companyA.id, companyB.id] } },
      });
      await prisma.leadNote.deleteMany({
        where: { companyId: { in: [companyA.id, companyB.id] } },
      });
      await prisma.lead.deleteMany({
        where: { companyId: { in: [companyA.id, companyB.id] } },
      });
      await prisma.user.deleteMany({
        where: { companyId: { in: [companyA.id, companyB.id] } },
      });
      await prisma.company.deleteMany({
        where: { id: { in: [companyA.id, companyB.id] } },
      });
      console.log('Cleanup complete.');
    } catch (cleanErr) {
      console.warn('Cleanup warning:', cleanErr);
    }
  }
}
