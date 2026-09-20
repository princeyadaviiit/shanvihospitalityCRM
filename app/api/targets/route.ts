import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getAuthenticatedUser } from '@/lib/auth/session';
import { prisma } from '@/lib/prisma';

const setTargetSchema = z.object({
  agentId: z.string(),
  month: z.string().regex(/^\d{4}-\d{2}$/),
  revenueTarget: z.number().min(0),
  bookingTarget: z.number().int().min(0),
});

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request, ['admin']);
    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month');

    let targets;
    if (month) {
      const monthDate = new Date(`${month}-01T00:00:00Z`);
      targets = await prisma.target.findMany({
        where: {
          companyId: user.companyId,
          month: monthDate,
        },
        include: {
          agent: {
            select: { id: true, name: true, email: true },
          },
        },
      });
    } else {
      targets = await prisma.target.findMany({
        where: { companyId: user.companyId },
        include: {
          agent: {
            select: { id: true, name: true, email: true },
          },
        },
        orderBy: { month: 'desc' },
        take: 50,
      });
    }

    return NextResponse.json({ targets });
  } catch (error) {
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    if (error instanceof Error && error.message.includes('Forbidden')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error('GET targets error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request, ['admin']);
    const body = await request.json();
    const validatedData = setTargetSchema.parse(body);

    const agent = await prisma.user.findUnique({
      where: { id: validatedData.agentId },
      select: { id: true, companyId: true, role: true },
    });

    if (!agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }

    if (agent.companyId !== user.companyId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const monthDate = new Date(`${validatedData.month}-01T00:00:00Z`);

    const target = await prisma.target.upsert({
      where: {
        agentId_month: {
          agentId: validatedData.agentId,
          month: monthDate,
        },
      },
      update: {
        revenueTarget: validatedData.revenueTarget,
        bookingTarget: validatedData.bookingTarget,
      },
      create: {
        companyId: user.companyId,
        agentId: validatedData.agentId,
        month: monthDate,
        revenueTarget: validatedData.revenueTarget,
        bookingTarget: validatedData.bookingTarget,
      },
      include: {
        agent: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return NextResponse.json({ success: true, target });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    if (error instanceof Error && error.message.includes('Forbidden')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error('POST target error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
