/**
 * Phase 6 Automated Test Suite — Security Hardening, RBAC Audit, Rate Limiting & Production Readiness
 * Adheres strictly to phases.md §Phase 6 and security.md §14.
 */

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { GET as getStaff, POST as createStaff } from '@/app/api/staff/route';
import { GET as getLeaderboard } from '@/app/api/leaderboard/route';
import { POST as createTarget } from '@/app/api/targets/route';
import { PATCH as updateCompany } from '@/app/api/company/route';
import { POST as recordPayroll } from '@/app/api/payroll/route';
import { GET as getLead } from '@/app/api/leads/[id]/route';
import { GET as getVoucher } from '@/app/api/bookings/[id]/voucher/route';
import { checkRateLimit, resetRateLimits } from '@/lib/rate-limit';
import { middleware } from '@/middleware';

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

export async function runPhase6Tests() {
  console.log('\n====================================================');
  console.log('STARTING PHASE 6 HARDENING & PRODUCTION READINESS AUDIT');
  console.log('====================================================\n');

  let companyAId = '';
  let companyBId = '';
  let adminAId = '';
  let adminAUid = 'test-phase6-admin-a';
  let staffAId = '';
  let staffAUid = 'test-phase6-staff-a';
  let deactAUid = 'test-phase6-deact-a';
  let leadBId = '';
  let bookingBId = '';

  try {
    console.log('Setting up enterprise multi-tenant test matrix...');

    // Company A: Shanvi Hospitality
    const compA = await prisma.company.create({
      data: {
        name: 'Shanvi Hospitality Security Audit',
        gstNumber: '09AEKFS1932F1ZX',
        currency: 'INR',
      },
    });
    companyAId = compA.id;

    // Company B: Rival Agency
    const compB = await prisma.company.create({
      data: {
        name: 'Rival Travel Agency',
        gstNumber: '07BBBBB9999F1Z1',
        currency: 'INR',
      },
    });
    companyBId = compB.id;

    // Admin User for Company A
    const adminA = await prisma.user.create({
      data: {
        name: 'Himani Admin',
        email: 'himani.p6@shanvi.in',
        role: 'admin',
        supabaseUid: adminAUid,
        companyId: companyAId,
        active: true,
      },
    });
    adminAId = adminA.id;

    // Staff Agent User for Company A
    const staffA = await prisma.user.create({
      data: {
        name: 'Mohit Agent',
        email: 'mohit.p6@shanvi.in',
        role: 'staff_agent',
        supabaseUid: staffAUid,
        companyId: companyAId,
        active: true,
      },
    });
    staffAId = staffA.id;

    // Deactivated User
    await prisma.user.create({
      data: {
        name: 'Ex-Employee',
        email: 'ex.p6@shanvi.in',
        role: 'staff_agent',
        supabaseUid: deactAUid,
        companyId: companyAId,
        active: false,
      },
    });

    // Company B Lead & Booking (Cross-tenant target)
    const leadB = await prisma.lead.create({
      data: {
        companyId: companyBId,
        name: 'Secret Client B',
        phone: '+919876543210',
        destination: 'Secret Destination',
        paxCount: 4,
        status: 'CONFIRMED',
        quotedPrice: 150000,
      },
    });
    leadBId = leadB.id;

    const itineraryB = await prisma.itinerary.create({
      data: {
        companyId: companyBId,
        leadId: leadBId,
        totalCost: 120000,
        markup: 30000,
        finalPrice: 150000,
        days: {
          create: [{
            dayNumber: 1,
            title: 'Arrival',
            description: 'Arrival at resort',
            lineItems: {
              create: [{
                category: 'Accommodation',
                description: 'Luxury Suite',
                cost: 120000,
              }],
            },
          }],
        },
      },
    });

    const bookingB = await prisma.booking.create({
      data: {
        companyId: companyBId,
        leadId: leadBId,
        itineraryId: itineraryB.id,
        bookingNumber: 'BK-RIV-2026-999',
        totalAmount: 150000,
        status: 'CONFIRMED',
      },
    });
    bookingBId = bookingB.id;

    // ==========================================
    // TEST GROUP 1: Comprehensive RBAC Audit
    // ==========================================
    console.log('--- TEST GROUP 1: Comprehensive RBAC Audit ---');

    // 1. Staff Agent cannot access Admin staff management
    const staffGetStaffReq = new NextRequest('http://localhost:3000/api/staff', {
      headers: { 'x-test-supabase-uid': staffAUid },
    });
    const staffGetStaffRes = await getStaff(staffGetStaffReq);
    assert(staffGetStaffRes.status === 403, 'Staff Agent blocked from GET /api/staff with 403 Forbidden');

    const staffPostStaffReq = new NextRequest('http://localhost:3000/api/staff', {
      method: 'POST',
      headers: {
        'x-test-supabase-uid': staffAUid,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Hacker User',
        email: 'hacker@test.com',
        role: 'admin',
      }),
    });
    const staffPostStaffRes = await createStaff(staffPostStaffReq);
    assert(staffPostStaffRes.status === 403, 'Staff Agent blocked from POST /api/staff with 403 Forbidden');

    // 2. Staff Agent cannot set agency performance targets
    const staffTargetReq = new NextRequest('http://localhost:3000/api/targets', {
      method: 'POST',
      headers: {
        'x-test-supabase-uid': staffAUid,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        agentId: staffAId,
        month: '2026-10',
        revenueTarget: 500000,
        bookingTarget: 5,
      }),
    });
    const staffTargetRes = await createTarget(staffTargetReq);
    assert(staffTargetRes.status === 403, 'Staff Agent blocked from POST /api/targets with 403 Forbidden');

    // 3. Staff Agent cannot view overall agency leaderboard
    const staffLeaderboardReq = new NextRequest('http://localhost:3000/api/leaderboard', {
      headers: { 'x-test-supabase-uid': staffAUid },
    });
    const staffLeaderboardRes = await getLeaderboard(staffLeaderboardReq);
    assert(staffLeaderboardRes.status === 403, 'Staff Agent blocked from GET /api/leaderboard with 403 Forbidden');

    // 4. Staff Agent cannot modify company profile credentials
    const staffCompanyReq = new NextRequest('http://localhost:3000/api/company', {
      method: 'PATCH',
      headers: {
        'x-test-supabase-uid': staffAUid,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Hacked Company Name',
      }),
    });
    const staffCompanyRes = await updateCompany(staffCompanyReq);
    assert(staffCompanyRes.status === 403, 'Staff Agent blocked from PATCH /api/company with 403 Forbidden');

    // 5. Staff Agent cannot disburse payroll
    const staffPayrollReq = new NextRequest('http://localhost:3000/api/payroll', {
      method: 'POST',
      headers: {
        'x-test-supabase-uid': staffAUid,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        employeeId: 'emp_fake',
        month: 'October 2026',
        paymentMode: 'NEFT',
      }),
    });
    const staffPayrollRes = await recordPayroll(staffPayrollReq);
    assert(staffPayrollRes.status === 403, 'Staff Agent blocked from POST /api/payroll with 403 Forbidden');

    // ==========================================
    // TEST GROUP 2: Immediate Account Deactivation
    // ==========================================
    console.log('\n--- TEST GROUP 2: Immediate Account Deactivation ---');
    const deactReq = new NextRequest('http://localhost:3000/api/staff', {
      headers: { 'x-test-supabase-uid': deactAUid },
    });
    const deactRes = await getStaff(deactReq);
    assert(deactRes.status === 401, 'Deactivated account immediately rejected with 401 Unauthorized');

    // ==========================================
    // TEST GROUP 3: Adversarial Cross-Tenant Isolation
    // ==========================================
    console.log('\n--- TEST GROUP 3: Adversarial Cross-Tenant Isolation ---');

    // Admin A attempts to read Company B lead
    const crossLeadReq = new NextRequest(`http://localhost:3000/api/leads/${leadBId}`, {
      headers: { 'x-test-supabase-uid': adminAUid },
    });
    const crossLeadRes = await getLead(crossLeadReq, { params: Promise.resolve({ id: leadBId }) });
    assert(
      crossLeadRes.status === 404 || crossLeadRes.status === 403,
      'Company A user cannot view Company B lead (returns 404/403)'
    );

    // Admin A attempts to read Company B accommodation voucher
    const crossVoucherReq = new NextRequest(`http://localhost:3000/api/bookings/${bookingBId}/voucher`, {
      headers: { 'x-test-supabase-uid': adminAUid },
    });
    const crossVoucherRes = await getVoucher(crossVoucherReq, { params: Promise.resolve({ id: bookingBId }) });
    assert(
      crossVoucherRes.status === 403 || crossVoucherRes.status === 404,
      'Company A user blocked from Company B accommodation voucher with 403/404'
    );

    // ==========================================
    // TEST GROUP 4: In-Memory Sliding-Window Rate Limiter
    // ==========================================
    console.log('\n--- TEST GROUP 4: Rate Limiting Security ---');
    resetRateLimits();

    const testIp = '198.51.100.42';
    // Consume quota of 5 requests
    for (let i = 0; i < 5; i++) {
      checkRateLimit(`test-auth:${testIp}`, { maxRequests: 5, windowMs: 60000, forceCheck: true });
    }
    // 6th request must be blocked
    const blockedCheck = checkRateLimit(`test-auth:${testIp}`, { maxRequests: 5, windowMs: 60000, forceCheck: true });
    assert(!blockedCheck.allowed, 'Rate limiter blocks requests exceeding threshold within time window');
    assert(blockedCheck.remaining === 0, 'Rate limiter reports 0 remaining tokens when exhausted');

    // ==========================================
    // TEST GROUP 5: Enterprise Security Headers
    // ==========================================
    console.log('\n--- TEST GROUP 5: HTTP Security Headers ---');
    const dummyReq = new NextRequest('http://localhost:3000/dashboard');
    const middlewareRes = await middleware(dummyReq);

    const xFrame = middlewareRes.headers.get('X-Frame-Options');
    const xContent = middlewareRes.headers.get('X-Content-Type-Options');
    const referrer = middlewareRes.headers.get('Referrer-Policy');
    const permissions = middlewareRes.headers.get('Permissions-Policy');

    assert(xFrame === 'DENY', 'X-Frame-Options header is set to DENY (clickjacking protection)');
    assert(xContent === 'nosniff', 'X-Content-Type-Options header is set to nosniff (MIME sniffing protection)');
    assert(referrer === 'strict-origin-when-cross-origin', 'Referrer-Policy header is correctly configured');
    assert(permissions !== null && permissions.includes('camera=()'), 'Permissions-Policy header is configured');

  } catch (err: any) {
    console.error('Phase 6 Test Execution Exception:', err);
    assert(false, 'Phase 6 Test Suite crashed', err.message);
  } finally {
    console.log('\nCleaning up test records from database...');
    try {
      if (companyAId && companyBId) {
        await prisma.leadNote.deleteMany({ where: { companyId: { in: [companyAId, companyBId] } } });
        await prisma.booking.deleteMany({ where: { companyId: { in: [companyAId, companyBId] } } });
        await prisma.itinerary.deleteMany({ where: { companyId: { in: [companyAId, companyBId] } } });
        await prisma.lead.deleteMany({ where: { companyId: { in: [companyAId, companyBId] } } });
        await prisma.user.deleteMany({ where: { companyId: { in: [companyAId, companyBId] } } });
        await prisma.company.deleteMany({ where: { id: { in: [companyAId, companyBId] } } });
      }
      console.log('Cleanup complete.\n');
    } catch (cleanupErr) {
      console.warn('Cleanup warning:', cleanupErr);
    }
  }

  const passedCount = results.filter((r) => r.passed).length;
  const failedCount = results.filter((r) => !r.passed).length;

  console.log('====================================================');
  console.log(`PHASE 6 TEST SUMMARY: ${passedCount} PASSED, ${failedCount} FAILED`);
  console.log('====================================================\n');

  return {
    success: failedCount === 0,
    passed: passedCount,
    failed: failedCount,
    results,
  };
}
