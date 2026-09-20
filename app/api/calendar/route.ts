import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth/session';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month');

    let startDate: Date;
    let endDate: Date;

    if (month) {
      startDate = new Date(`${month}-01T00:00:00Z`);
      endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + 1);
    } else {
      startDate = new Date();
      startDate.setDate(1);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + 1);
    }

    const bookings = await prisma.booking.findMany({
      where: {
        companyId: user.companyId,
        status: 'CONFIRMED',
        itinerary: {
          OR: [
            {
              startDate: {
                gte: startDate,
                lt: endDate,
              },
            },
            {
              endDate: {
                gte: startDate,
                lt: endDate,
              },
            },
            {
              AND: [
                {
                  startDate: {
                    lt: startDate,
                  },
                },
                {
                  endDate: {
                    gte: endDate,
                  },
                },
              ],
            },
          ],
        },
      },
      include: {
        lead: {
          select: {
            id: true,
            name: true,
            destination: true,
            paxCount: true,
            assignedAgent: {
              select: { id: true, name: true },
            },
          },
        },
        itinerary: {
          select: {
            id: true,
            title: true,
            destination: true,
            startDate: true,
            endDate: true,
            totalCost: true,
            finalPrice: true,
            currency: true,
          },
        },
      },
      orderBy: {
        itinerary: {
          startDate: 'asc',
        },
      },
    });

    return NextResponse.json({
      period: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
      },
      bookings,
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error('GET calendar error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
