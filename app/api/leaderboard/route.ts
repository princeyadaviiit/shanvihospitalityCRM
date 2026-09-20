import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth/session';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request, ['admin']);
    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month');

    const startDate = month
      ? new Date(`${month}-01T00:00:00Z`)
      : new Date(new Date().getFullYear(), new Date().getMonth(), 1);

    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + 1);

    const agents = await prisma.user.findMany({
      where: {
        companyId: user.companyId,
        role: 'staff_agent',
        active: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    const leaderboard = await Promise.all(
      agents.map(async (agent: any) => {
        const [callCount, bookings, target] = await Promise.all([
          prisma.call.count({
            where: {
              companyId: user.companyId,
              agentId: agent.id,
              createdAt: {
                gte: startDate,
                lt: endDate,
              },
            },
          }),
          prisma.booking.findMany({
            where: {
              companyId: user.companyId,
              lead: {
                assignedAgentId: agent.id,
              },
              createdAt: {
                gte: startDate,
                lt: endDate,
              },
            },
            select: {
              totalAmount: true,
              currency: true,
            },
          }),
          prisma.target.findUnique({
            where: {
              agentId_month: {
                agentId: agent.id,
                month: startDate,
              },
            },
          }),
        ]);

        const totalRevenue = bookings.reduce((sum: number, b: any) => sum + b.totalAmount, 0);
        const bookingCount = bookings.length;
        const revenueTarget = target?.revenueTarget || 0;
        const bookingTarget = target?.bookingTarget || 0;

        const revenueAchievement = revenueTarget > 0
          ? (totalRevenue / revenueTarget) * 100
          : 0;

        const bookingAchievement = bookingTarget > 0
          ? (bookingCount / bookingTarget) * 100
          : 0;

        return {
          agent: {
            id: agent.id,
            name: agent.name,
            email: agent.email,
          },
          metrics: {
            callCount,
            bookingCount,
            totalRevenue,
            revenueTarget,
            bookingTarget,
            revenueAchievement: Math.round(revenueAchievement),
            bookingAchievement: Math.round(bookingAchievement),
          },
        };
      })
    );

    leaderboard.sort((a, b) => {
      const scoreA = (a.metrics.revenueAchievement + a.metrics.bookingAchievement) / 2;
      const scoreB = (b.metrics.revenueAchievement + b.metrics.bookingAchievement) / 2;
      return scoreB - scoreA;
    });

    return NextResponse.json({
      period: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
      },
      leaderboard,
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    if (error instanceof Error && error.message.includes('Forbidden')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error('GET leaderboard error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
