import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth/session';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request, ['admin', 'staff_agent']);
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const agentId = searchParams.get('agentId');

    const start = startDate ? new Date(startDate) : new Date(new Date().getFullYear(), 0, 1);
    const end = endDate ? new Date(endDate) : new Date();

    const whereClause: any = {
      companyId: user.companyId,
      createdAt: {
        gte: start,
        lte: end,
      },
    };

    if (user.role === 'staff_agent') {
      whereClause.assignedAgentId = user.id;
    } else if (agentId) {
      whereClause.assignedAgentId = agentId;
    }

    const [leads, bookings] = await Promise.all([
      prisma.lead.findMany({
        where: whereClause,
        include: {
          assignedAgent: {
            select: { id: true, name: true },
          },
        },
      }),
      prisma.booking.findMany({
        where: {
          companyId: user.companyId,
          createdAt: {
            gte: start,
            lte: end,
          },
          ...(user.role === 'staff_agent' || agentId
            ? {
                lead: {
                  assignedAgentId: user.role === 'staff_agent' ? user.id : agentId,
                },
              }
            : {}),
        },
        include: {
          lead: {
            select: {
              id: true,
              name: true,
              assignedAgent: {
                select: { id: true, name: true },
              },
            },
          },
        },
      }),
    ]);

    const totalLeads = leads.length;
    const enquiries = leads.filter((l) => l.status === 'ENQUIRY').length;
    const inProgress = leads.filter((l) => l.status === 'IN_PROGRESS').length;
    const confirmed = leads.filter((l) => l.status === 'CONFIRMED').length;
    const missed = leads.filter((l) => l.status === 'MISSED').length;

    const totalBookings = bookings.length;
    const totalRevenue = bookings.reduce((sum: number, b: any) => sum + b.totalAmount, 0);

    const conversionRate = totalLeads > 0 ? (confirmed / totalLeads) * 100 : 0;

    const byAgent: Record<string, any> = {};
    leads.forEach((lead) => {
      if (!lead.assignedAgent) return;
      const agentName = lead.assignedAgent.name;
      if (!byAgent[agentName]) {
        byAgent[agentName] = {
          agentId: lead.assignedAgent.id,
          agentName,
          totalLeads: 0,
          confirmed: 0,
          missed: 0,
        };
      }
      byAgent[agentName].totalLeads++;
      if (lead.status === 'CONFIRMED') byAgent[agentName].confirmed++;
      if (lead.status === 'MISSED') byAgent[agentName].missed++;
    });

    return NextResponse.json({
      period: {
        start: start.toISOString(),
        end: end.toISOString(),
      },
      summary: {
        totalLeads,
        enquiries,
        inProgress,
        confirmed,
        missed,
        totalBookings,
        totalRevenue,
        conversionRate: Math.round(conversionRate * 100) / 100,
      },
      byAgent: Object.values(byAgent),
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    if (error instanceof Error && error.message.includes('Forbidden')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error('GET sales report error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
