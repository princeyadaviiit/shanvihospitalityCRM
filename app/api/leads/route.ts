import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { authenticateRequest } from '@/lib/auth/session';
import { prisma } from '@/lib/prisma';
import { LeadStatus } from '@prisma/client';

const leadFilterSchema = z.object({
  status: z.nativeEnum(LeadStatus).optional(),
  assignedAgentId: z.string().optional(),
  search: z.string().optional(),
});

const createLeadSchema = z.object({
  name: z.string().min(1, 'Traveller name is required'),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  phone: z.string().min(1, 'Phone number is required'),
  destination: z.string().min(1, 'Destination is required'),
  paxCount: z.number().int().min(1, 'Pax count must be at least 1').default(1),
  status: z.nativeEnum(LeadStatus).default(LeadStatus.ENQUIRY),
  quotedPrice: z.number().min(0, 'Quoted price cannot be negative').default(0),
  currency: z.string().default('INR'),
  source: z.string().default('manual'),
  assignedAgentId: z.string().optional(),
});

export async function GET(request: NextRequest) {
  const auth = await authenticateRequest(request, ['admin', 'staff_agent', 'accounts']);
  if (!auth.success) {
    return auth.response;
  }

  const { companyId, user, role } = auth.context;

  try {
    const { searchParams } = new URL(request.url);
    const filterQuery = leadFilterSchema.parse({
      status: searchParams.get('status') || undefined,
      assignedAgentId: searchParams.get('assignedAgentId') || undefined,
      search: searchParams.get('search') || undefined,
    });

    // Build query conditions
    const where: any = {
      companyId,
    };

    // RBAC: Staff agent only sees own leads
    if (role === 'staff_agent') {
      where.assignedAgentId = user.id;
    } else if (filterQuery.assignedAgentId) {
      where.assignedAgentId = filterQuery.assignedAgentId;
    }

    if (filterQuery.status) {
      where.status = filterQuery.status;
    }

    if (filterQuery.search) {
      where.OR = [
        { name: { contains: filterQuery.search, mode: 'insensitive' } },
        { destination: { contains: filterQuery.search, mode: 'insensitive' } },
        { phone: { contains: filterQuery.search, mode: 'insensitive' } },
        { email: { contains: filterQuery.search, mode: 'insensitive' } },
      ];
    }

    const leads = await prisma.lead.findMany({
      where,
      include: {
        assignedAgent: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        _count: {
          select: {
            notes: true,
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return NextResponse.json({ leads });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }

    console.error('Error fetching leads:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred while fetching leads' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  // Only Admin and Staff Agent can create leads
  const auth = await authenticateRequest(request, ['admin', 'staff_agent']);
  if (!auth.success) {
    return auth.response;
  }

  const { companyId, user, role } = auth.context;

  try {
    const body = await request.json();
    const validatedData = createLeadSchema.parse(body);

    // If staff_agent, enforce self-assignment
    let assignedAgentId = validatedData.assignedAgentId || null;
    if (role === 'staff_agent') {
      assignedAgentId = user.id;
    } else if (assignedAgentId) {
      // If admin assigned an agent, verify that agent belongs to this company and is active
      const agent = await prisma.user.findFirst({
        where: { id: assignedAgentId, companyId, active: true },
      });
      if (!agent) {
        return NextResponse.json(
          { error: 'Assigned agent not found or is inactive in your company' },
          { status: 400 }
        );
      }
    }

    const newLead = await prisma.lead.create({
      data: {
        companyId,
        name: validatedData.name,
        email: validatedData.email || null,
        phone: validatedData.phone,
        destination: validatedData.destination,
        paxCount: validatedData.paxCount,
        status: validatedData.status,
        quotedPrice: validatedData.quotedPrice,
        currency: validatedData.currency,
        source: validatedData.source,
        assignedAgentId,
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

    return NextResponse.json(
      {
        success: true,
        message: 'Lead created successfully',
        lead: newLead,
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }

    console.error('Error creating lead:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred while creating lead' },
      { status: 500 }
    );
  }
}
