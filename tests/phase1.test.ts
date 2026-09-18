/**
 * Phase 1 Test Suite: RBAC Enforcement, Cross-Tenant Isolation & Lead Pipeline
 *
 * Checks:
 * 1. Admin endpoints reject non-admin roles with 403 Forbidden
 * 2. Cross-tenant queries are blocked (Company A cannot view/update Company B's leads)
 * 3. Staff agents cannot view or edit leads assigned to another agent (403 Forbidden)
 * 4. Deactivated user accounts are rejected immediately (401 Unauthorized)
 * 5. Input validation rejects invalid payloads with 400 Bad Request
 * 6. Lead lifecycle: Create lead -> transition status -> add manual note
 */

import { NextRequest } from 'next/server';
import { GET as getStaff, POST as createStaff } from '@/app/api/staff/route';
import { PATCH as updateStaff } from '@/app/api/staff/[id]/route';
import { GET as getLeads, POST as createLead } from '@/app/api/leads/route';
import { GET as getLeadDetail, PATCH as updateLeadDetail } from '@/app/api/leads/[id]/route';
import { POST as addLeadNote } from '@/app/api/leads/[id]/notes/route';
import { prisma } from '@/lib/prisma';

// Helper to build NextRequest with mock auth headers
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

export async function runPhase1Tests() {
  console.log('====================================================');
  console.log('STARTING PHASE 1 TEST & FIX LOOP VERIFICATION');
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

  // Setup Test Data
  console.log('Setting up isolated test tenants and users in memory/db...');
  const suffix = Date.now().toString().slice(-6);

  // Tenant 1: Apex Tours
  const companyA = await prisma.company.create({
    data: { name: `Apex Tours ${suffix}`, currency: 'INR' },
  });

  const adminA = await prisma.user.create({
    data: {
      supabaseUid: `test_admin_a_${suffix}`,
      companyId: companyA.id,
      name: 'Admin Apex',
      email: `admin.apex.${suffix}@example.com`,
      role: 'admin',
      active: true,
    },
  });

  const agentA1 = await prisma.user.create({
    data: {
      supabaseUid: `test_agent_a1_${suffix}`,
      companyId: companyA.id,
      name: 'Agent Rohit',
      email: `rohit.${suffix}@example.com`,
      role: 'staff_agent',
      active: true,
    },
  });

  const agentA2 = await prisma.user.create({
    data: {
      supabaseUid: `test_agent_a2_${suffix}`,
      companyId: companyA.id,
      name: 'Agent Sneha',
      email: `sneha.${suffix}@example.com`,
      role: 'staff_agent',
      active: true,
    },
  });

  const accountsA = await prisma.user.create({
    data: {
      supabaseUid: `test_accounts_a_${suffix}`,
      companyId: companyA.id,
      name: 'Accounts Vicky',
      email: `vicky.${suffix}@example.com`,
      role: 'accounts',
      active: true,
    },
  });

  const deactivatedUserA = await prisma.user.create({
    data: {
      supabaseUid: `test_deactivated_a_${suffix}`,
      companyId: companyA.id,
      name: 'Deactivated User',
      email: `inactive.${suffix}@example.com`,
      role: 'staff_agent',
      active: false,
    },
  });

  // Tenant 2: Blue Horizon Travels
  const companyB = await prisma.company.create({
    data: { name: `Blue Horizon ${suffix}`, currency: 'USD' },
  });

  const adminB = await prisma.user.create({
    data: {
      supabaseUid: `test_admin_b_${suffix}`,
      companyId: companyB.id,
      name: 'Admin Horizon',
      email: `admin.horizon.${suffix}@example.com`,
      role: 'admin',
      active: true,
    },
  });

  // Create a lead in Company B
  const leadCompanyB = await prisma.lead.create({
    data: {
      companyId: companyB.id,
      name: 'Private Client Horizon',
      phone: '+1 555 123 4567',
      destination: 'Switzerland Alps',
      paxCount: 2,
      quotedPrice: 6500,
      currency: 'USD',
      status: 'ENQUIRY',
    },
  });

  console.log('Test fixtures created successfully.\n');

  try {
    // ----------------------------------------------------
    // TEST 1: RBAC - Staff Agent blocked from Admin endpoints
    // ----------------------------------------------------
    console.log('--- TEST GROUP 1: RBAC Enforcement ---');
    const staffGetReq = buildRequest('/api/staff', 'GET', undefined, agentA1.supabaseUid);
    const staffGetRes = await getStaff(staffGetReq);
    assert(
      staffGetRes.status === 403,
      'Staff Agent is blocked from GET /api/staff with 403 Forbidden',
      `Got status: ${staffGetRes.status}`
    );

    const staffPostReq = buildRequest(
      '/api/staff',
      'POST',
      { name: 'Unauthorized Staff', email: `unauth.${suffix}@example.com`, role: 'staff_agent' },
      agentA1.supabaseUid
    );
    const staffPostRes = await createStaff(staffPostReq);
    assert(
      staffPostRes.status === 403,
      'Staff Agent is blocked from POST /api/staff with 403 Forbidden',
      `Got status: ${staffPostRes.status}`
    );

    // Accounts role blocked from creating staff
    const accountsStaffReq = buildRequest('/api/staff', 'GET', undefined, accountsA.supabaseUid);
    const accountsStaffRes = await getStaff(accountsStaffReq);
    assert(
      accountsStaffRes.status === 403,
      'Accounts role is blocked from GET /api/staff with 403 Forbidden',
      `Got status: ${accountsStaffRes.status}`
    );

    // Admin CAN access staff endpoint
    const adminStaffReq = buildRequest('/api/staff', 'GET', undefined, adminA.supabaseUid);
    const adminStaffRes = await getStaff(adminStaffReq);
    assert(
      adminStaffRes.status === 200,
      'Admin successfully accesses GET /api/staff with 200 OK',
      `Got status: ${adminStaffRes.status}`
    );

    // ----------------------------------------------------
    // TEST 2: Cross-Tenant Isolation
    // ----------------------------------------------------
    console.log('\n--- TEST GROUP 2: Cross-Tenant Isolation ---');
    // Admin of Company A tries to read Lead belonging to Company B
    const crossTenantGetReq = buildRequest(
      `/api/leads/${leadCompanyB.id}`,
      'GET',
      undefined,
      adminA.supabaseUid
    );
    const crossTenantGetRes = await getLeadDetail(crossTenantGetReq, {
      params: Promise.resolve({ id: leadCompanyB.id }),
    });
    assert(
      crossTenantGetRes.status === 404,
      'Company A cannot view Company B lead (returns 404 Not Found due to tenant scope)',
      `Got status: ${crossTenantGetRes.status}`
    );

    // Admin of Company A tries to update Lead belonging to Company B
    const crossTenantPatchReq = buildRequest(
      `/api/leads/${leadCompanyB.id}`,
      'PATCH',
      { status: 'CONFIRMED' },
      adminA.supabaseUid
    );
    const crossTenantPatchRes = await updateLeadDetail(crossTenantPatchReq, {
      params: Promise.resolve({ id: leadCompanyB.id }),
    });
    assert(
      crossTenantPatchRes.status === 404,
      'Company A cannot modify Company B lead (returns 404 Not Found)',
      `Got status: ${crossTenantPatchRes.status}`
    );

    // ----------------------------------------------------
    // TEST 3: Deactivated Account Immediate Rejection
    // ----------------------------------------------------
    console.log('\n--- TEST GROUP 3: Account Deactivation ---');
    const deactReq = buildRequest('/api/leads', 'GET', undefined, deactivatedUserA.supabaseUid);
    const deactRes = await getLeads(deactReq);
    assert(
      deactRes.status === 401,
      'Deactivated account receives 401 Unauthorized immediately',
      `Got status: ${deactRes.status}`
    );

    // ----------------------------------------------------
    // TEST 4: Lead Creation & Lifecycle
    // ----------------------------------------------------
    console.log('\n--- TEST GROUP 4: Lead Lifecycle & Ownership ---');
    // Agent 1 creates a lead
    const createLeadReq = buildRequest(
      '/api/leads',
      'POST',
      {
        name: 'Aarav Gupta',
        phone: '+91 99887 76655',
        email: 'aarav@example.com',
        destination: 'Goa Beach Resort',
        paxCount: 4,
        quotedPrice: 85000,
        currency: 'INR',
        source: 'website',
      },
      agentA1.supabaseUid
    );
    const createLeadRes = await createLead(createLeadReq);
    const createLeadData = await createLeadRes.json();
    assert(
      createLeadRes.status === 201 && createLeadData.lead?.id,
      'Staff Agent 1 creates a lead successfully (201 Created)',
      `Got status: ${createLeadRes.status}`
    );

    const leadA1Id = createLeadData.lead.id;
    assert(
      createLeadData.lead.assignedAgentId === agentA1.id,
      'Staff Agent 1 created lead is automatically assigned to themselves'
    );

    // Agent 2 attempts to view Agent 1's lead -> MUST BE 403 Forbidden
    const agent2ViewReq = buildRequest(
      `/api/leads/${leadA1Id}`,
      'GET',
      undefined,
      agentA2.supabaseUid
    );
    const agent2ViewRes = await getLeadDetail(agent2ViewReq, {
      params: Promise.resolve({ id: leadA1Id }),
    });
    assert(
      agent2ViewRes.status === 403,
      'Staff Agent 2 is blocked from viewing Staff Agent 1 lead with 403 Forbidden',
      `Got status: ${agent2ViewRes.status}`
    );

    // Agent 2 attempts to update Agent 1's lead -> MUST BE 403 Forbidden
    const agent2UpdateReq = buildRequest(
      `/api/leads/${leadA1Id}`,
      'PATCH',
      { status: 'CONFIRMED' },
      agentA2.supabaseUid
    );
    const agent2UpdateRes = await updateLeadDetail(agent2UpdateReq, {
      params: Promise.resolve({ id: leadA1Id }),
    });
    assert(
      agent2UpdateRes.status === 403,
      'Staff Agent 2 is blocked from updating Staff Agent 1 lead with 403 Forbidden',
      `Got status: ${agent2UpdateRes.status}`
    );

    // Agent 1 transitions their own lead to IN_PROGRESS
    const agent1UpdateReq = buildRequest(
      `/api/leads/${leadA1Id}`,
      'PATCH',
      { status: 'IN_PROGRESS' },
      agentA1.supabaseUid
    );
    const agent1UpdateRes = await updateLeadDetail(agent1UpdateReq, {
      params: Promise.resolve({ id: leadA1Id }),
    });
    const agent1UpdateData = await agent1UpdateRes.json();
    assert(
      agent1UpdateRes.status === 200 && agent1UpdateData.lead?.status === 'IN_PROGRESS',
      'Staff Agent 1 transitions own lead to IN_PROGRESS (200 OK)'
    );

    // Agent 1 adds a manual note
    const addNoteReq = buildRequest(
      `/api/leads/${leadA1Id}/notes`,
      'POST',
      { content: 'Called client: prefers 4-star beach resort with private pool.' },
      agentA1.supabaseUid
    );
    const addNoteRes = await addLeadNote(addNoteReq, {
      params: Promise.resolve({ id: leadA1Id }),
    });
    const addNoteData = await addNoteRes.json();
    assert(
      addNoteRes.status === 201 && addNoteData.note?.content?.includes('4-star'),
      'Staff Agent 1 adds manual note to lead timeline (201 Created)'
    );

    // ----------------------------------------------------
    // TEST 5: Input Validation Checks
    // ----------------------------------------------------
    console.log('\n--- TEST GROUP 5: Input Validation (Zod) ---');
    // Invalid pax count (0)
    const invalidPaxReq = buildRequest(
      '/api/leads',
      'POST',
      {
        name: 'Invalid Lead',
        phone: '123',
        destination: 'Kerala',
        paxCount: 0,
      },
      agentA1.supabaseUid
    );
    const invalidPaxRes = await createLead(invalidPaxReq);
    assert(
      invalidPaxRes.status === 400,
      'Invalid paxCount (0) is rejected with 400 Bad Request',
      `Got status: ${invalidPaxRes.status}`
    );

    // Empty note content
    const emptyNoteReq = buildRequest(
      `/api/leads/${leadA1Id}/notes`,
      'POST',
      { content: '' },
      agentA1.supabaseUid
    );
    const emptyNoteRes = await addLeadNote(emptyNoteReq, {
      params: Promise.resolve({ id: leadA1Id }),
    });
    assert(
      emptyNoteRes.status === 400,
      'Empty note content is rejected with 400 Bad Request',
      `Got status: ${emptyNoteRes.status}`
    );

    // Admin self-deactivation protection
    const selfDeactReq = buildRequest(
      `/api/staff/${adminA.id}`,
      'PATCH',
      { active: false },
      adminA.supabaseUid
    );
    const selfDeactRes = await updateStaff(selfDeactReq, {
      params: Promise.resolve({ id: adminA.id }),
    });
    assert(
      selfDeactRes.status === 400,
      'Admin attempting self-deactivation is rejected with 400 Bad Request',
      `Got status: ${selfDeactRes.status}`
    );

    console.log('\n====================================================');
    console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log('====================================================');

    return { passed, failed, success: failed === 0 };
  } finally {
    // Cleanup test data
    console.log('\nCleaning up test records from database...');
    try {
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
