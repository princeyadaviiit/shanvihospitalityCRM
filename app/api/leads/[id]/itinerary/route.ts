import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { authenticateRequest } from '@/lib/auth/session';
import { prisma } from '@/lib/prisma';
import { LineItemCategory } from '@prisma/client';

const lineItemSchema = z.object({
  category: z.nativeEnum(LineItemCategory),
  description: z.string().min(1, 'Line item description is required'),
  cost: z.number().min(0, 'Cost must be 0 or positive').default(0),
});

const itineraryDaySchema = z.object({
  dayNumber: z.number().int().min(1),
  title: z.string().min(1, 'Day title is required'),
  description: z.string().optional().nullable(),
  lineItems: z.array(lineItemSchema).default([]),
});

const saveItinerarySchema = z.object({
  title: z.string().min(1, 'Itinerary title is required'),
  destination: z.string().min(1, 'Destination is required'),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
  markup: z.number().min(0, 'Markup cannot be negative').default(0),
  currency: z.string().default('INR'),
  days: z.array(itineraryDaySchema).min(1, 'At least 1 day is required in the itinerary'),
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

  // Verify lead exists and belongs to this tenant
  const lead = await prisma.lead.findFirst({
    where: { id: leadId, companyId },
  });

  if (!lead) {
    return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
  }

  // RBAC: Staff agent can only view itinerary for their own lead
  if (role === 'staff_agent' && lead.assignedAgentId !== user.id) {
    return NextResponse.json(
      { error: 'Forbidden: You do not have permission to view this itinerary' },
      { status: 403 }
    );
  }

  const itinerary = await prisma.itinerary.findUnique({
    where: { leadId },
    include: {
      days: {
        include: {
          lineItems: true,
        },
      },
      booking: true,
    },
  });

  return NextResponse.json({
    itinerary,
    lead: {
      id: lead.id,
      name: lead.name,
      destination: lead.destination,
      paxCount: lead.paxCount,
      status: lead.status,
      quotedPrice: lead.quotedPrice,
      currency: lead.currency,
    },
  });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticateRequest(request, ['admin', 'staff_agent']);
  if (!auth.success) {
    return auth.response;
  }

  const { id: leadId } = await params;
  const { companyId, user, role } = auth.context;

  // Verify lead exists and belongs to this tenant
  const lead = await prisma.lead.findFirst({
    where: { id: leadId, companyId },
  });

  if (!lead) {
    return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
  }

  // RBAC: Staff agent can only build/update itinerary for their own lead
  if (role === 'staff_agent' && lead.assignedAgentId !== user.id) {
    return NextResponse.json(
      { error: 'Forbidden: You do not have permission to modify this itinerary' },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const validatedData = saveItinerarySchema.parse(body);

    // Calculate auto cost total from all line items across days
    let totalCost = 0;
    for (const day of validatedData.days) {
      for (const item of day.lineItems) {
        totalCost += Number(item.cost) || 0;
      }
    }
    const finalPrice = totalCost + (Number(validatedData.markup) || 0);

    // Check if itinerary already exists for this lead
    const existingItinerary = await prisma.itinerary.findUnique({
      where: { leadId },
    });

    let savedItinerary;

    if (existingItinerary) {
      // Clean up old days and line items
      const existingDays = await prisma.itineraryDay.findMany({
        where: { itineraryId: existingItinerary.id },
      });
      for (const d of existingDays) {
        await prisma.itineraryLineItem.deleteMany({ where: { dayId: d.id } });
      }
      await prisma.itineraryDay.deleteMany({ where: { itineraryId: existingItinerary.id } });

      // Update itinerary parent record
      await prisma.itinerary.update({
        where: { id: existingItinerary.id },
        data: {
          title: validatedData.title,
          destination: validatedData.destination,
          startDate: validatedData.startDate ? new Date(validatedData.startDate) : null,
          endDate: validatedData.endDate ? new Date(validatedData.endDate) : null,
          markup: validatedData.markup,
          totalCost,
          finalPrice,
          currency: validatedData.currency,
        },
      });

      // Create new days and line items
      for (const d of validatedData.days) {
        await prisma.itineraryDay.create({
          data: {
            itineraryId: existingItinerary.id,
            dayNumber: d.dayNumber,
            title: d.title,
            description: d.description || null,
            lineItems: {
              create: d.lineItems.map((li) => ({
                category: li.category,
                description: li.description,
                cost: li.cost,
              })),
            },
          },
        });
      }

      savedItinerary = await prisma.itinerary.findUnique({
        where: { id: existingItinerary.id },
        include: {
          days: {
            include: { lineItems: true },
          },
          booking: true,
        },
      });
    } else {
      // Create new itinerary with nested days and line items
      savedItinerary = await prisma.itinerary.create({
        data: {
          companyId,
          leadId,
          title: validatedData.title,
          destination: validatedData.destination,
          startDate: validatedData.startDate ? new Date(validatedData.startDate) : null,
          endDate: validatedData.endDate ? new Date(validatedData.endDate) : null,
          markup: validatedData.markup,
          totalCost,
          finalPrice,
          currency: validatedData.currency,
          days: {
            create: validatedData.days.map((d) => ({
              dayNumber: d.dayNumber,
              title: d.title,
              description: d.description || null,
              lineItems: {
                create: d.lineItems.map((li) => ({
                  category: li.category,
                  description: li.description,
                  cost: li.cost,
                })),
              },
            })),
          },
        },
        include: {
          days: {
            include: { lineItems: true },
          },
          booking: true,
        },
      });
    }

    // Sync lead.quotedPrice and currency
    await prisma.lead.update({
      where: { id: leadId },
      data: {
        quotedPrice: finalPrice,
        currency: validatedData.currency,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Itinerary and quote saved successfully',
      itinerary: savedItinerary,
      costSummary: {
        totalCost,
        markup: validatedData.markup,
        finalPrice,
        currency: validatedData.currency,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }

    console.error('Error saving itinerary:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred while saving itinerary' },
      { status: 500 }
    );
  }
}
