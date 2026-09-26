import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { authenticateRequest } from '@/lib/auth/session';
import { prisma } from '@/lib/prisma';
import { LeadStatus } from '@prisma/client';

const updateLeadSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional().or(z.literal('')).nullable(),
  phone: z.string().min(1).optional(),
  destination: z.string().min(1).optional(),
  paxCount: z.number().int().min(1).optional(),
  status: z.nativeEnum(LeadStatus).optional(),
  quotedPrice: z.number().min(0).optional(),
  currency: z.string().optional(),
  source: z.string().optional(),
  assignedAgentId: z.string().nullable().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticateRequest(request, ['admin', 'staff_agent', 'accounts']);
  if (!auth.success) {
    return auth.response;
  }

  const { id: leadId } = await params;
  const { companyId, user, role } = auth.context;

  const lead = await prisma.lead.findFirst({
    where: {
      id: leadId,
      companyId, // Tenant isolation
    },
    include: {
      assignedAgent: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
      notes: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              role: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      },
      bookings: {
        select: {
          id: true,
          bookingNumber: true,
          totalAmount: true,
          status: true,
        },
      },
    },
  });

  if (!lead) {
    return NextResponse.json(
      { error: 'Lead not found' },
      { status: 404 }
    );
  }

  // RBAC: Staff agent can only view own leads
  if (role === 'staff_agent' && lead.assignedAgentId !== user.id) {
    return NextResponse.json(
      { error: 'Forbidden: You do not have access to view this lead' },
      { status: 403 }
    );
  }

  return NextResponse.json({ lead });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticateRequest(request, ['admin', 'staff_agent']);
  if (!auth.success) {
    return auth.response;
  }

  const { id: leadId } = await params;
  const { companyId, user, role } = auth.context;

  try {
    const body = await request.json();
    const validatedData = updateLeadSchema.parse(body);

    const existingLead = await prisma.lead.findFirst({
      where: {
        id: leadId,
        companyId, // Tenant isolation
      },
    });

    if (!existingLead) {
      return NextResponse.json(
        { error: 'Lead not found' },
        { status: 404 }
      );
    }

    // RBAC: Staff agent can only update own leads and cannot reassign
    if (role === 'staff_agent') {
      if (existingLead.assignedAgentId !== user.id) {
        return NextResponse.json(
          { error: 'Forbidden: You do not have access to modify this lead' },
          { status: 403 }
        );
      }
      if (validatedData.assignedAgentId !== undefined && validatedData.assignedAgentId !== user.id) {
        return NextResponse.json(
          { error: 'Forbidden: Staff agents cannot reassign leads to another agent' },
          { status: 403 }
        );
      }
    }

    // If assignedAgentId is provided by admin, verify agent belongs to company
    if (role === 'admin' && validatedData.assignedAgentId) {
      const agent = await prisma.user.findFirst({
        where: { id: validatedData.assignedAgentId, companyId, active: true },
      });
      if (!agent) {
        return NextResponse.json(
          { error: 'Assigned agent not found or is inactive in your company' },
          { status: 400 }
        );
      }
    }

    const updatedLead = await prisma.lead.update({
      where: { id: leadId },
      data: {
        ...(validatedData.name !== undefined && { name: validatedData.name }),
        ...(validatedData.email !== undefined && { email: validatedData.email || null }),
        ...(validatedData.phone !== undefined && { phone: validatedData.phone }),
        ...(validatedData.destination !== undefined && { destination: validatedData.destination }),
        ...(validatedData.paxCount !== undefined && { paxCount: validatedData.paxCount }),
        ...(validatedData.status !== undefined && { status: validatedData.status }),
        ...(validatedData.quotedPrice !== undefined && { quotedPrice: validatedData.quotedPrice }),
        ...(validatedData.currency !== undefined && { currency: validatedData.currency }),
        ...(validatedData.source !== undefined && { source: validatedData.source }),
        ...(validatedData.assignedAgentId !== undefined && { assignedAgentId: validatedData.assignedAgentId }),
      },
      include: {
        assignedAgent: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Lead updated successfully',
      lead: updatedLead,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }

    console.error('Error updating lead:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred while updating lead' },
      { status: 500 }
    );
  }
}
