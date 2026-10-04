import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/admin/analytics
 * Admin-only: Get comprehensive analytics for all staff members
 * Includes leads created, revenue generated, pending amounts, and performance metrics
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireRole('admin');
    const companyId = user.companyId!; // Admin users always have companyId after requireRole

    // Get all users in the company (staff and admin)
    const users = await prisma.user.findMany({
      where: {
        companyId,
        active: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });

    // Get analytics for each user
    const analyticsPromises = users.map(async (staffMember) => {
      // Total leads created by this user
      const totalLeads = await prisma.lead.count({
        where: {
          companyId,
          createdById: staffMember.id,
        },
      });

      // Leads by status
      const leadsByStatus = await prisma.lead.groupBy({
        by: ['status'],
        where: {
          companyId,
          createdById: staffMember.id,
        },
        _count: true,
      });

      // Total revenue from confirmed bookings
      const confirmedBookings = await prisma.booking.findMany({
        where: {
          companyId,
          status: 'CONFIRMED',
          lead: {
            createdById: staffMember.id,
          },
        },
        select: {
          totalAmount: true,
          currency: true,
          ledgerEntries: {
            where: {
              type: 'DEPOSIT',
            },
            select: {
              amount: true,
            },
          },
        },
      });

      const totalRevenue = confirmedBookings.reduce(
        (sum, booking) => sum + booking.totalAmount,
        0
      );

      const receivedAmount = confirmedBookings.reduce(
        (sum, booking) =>
          sum + booking.ledgerEntries.reduce((s, entry) => s + entry.amount, 0),
        0
      );

      const pendingAmount = totalRevenue - receivedAmount;

      // Recent leads (last 5)
      const recentLeads = await prisma.lead.findMany({
        where: {
          companyId,
          createdById: staffMember.id,
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 5,
        select: {
          id: true,
          name: true,
          destination: true,
          status: true,
          quotedPrice: true,
          currency: true,
          createdAt: true,
        },
      });

      // Call statistics
      const totalCalls = await prisma.call.count({
        where: {
          companyId,
          agentId: staffMember.id,
        },
      });

      const avgCallDuration = await prisma.call.aggregate({
        where: {
          companyId,
          agentId: staffMember.id,
          duration: { not: null },
        },
        _avg: {
          duration: true,
        },
      });

      return {
        user: {
          id: staffMember.id,
          name: staffMember.name,
          email: staffMember.email,
          role: staffMember.role,
        },
        metrics: {
          totalLeads,
          leadsByStatus: leadsByStatus.reduce(
            (acc, item) => ({
              ...acc,
              [item.status]: item._count,
            }),
            {} as Record<string, number>
          ),
          totalRevenue,
          receivedAmount,
          pendingAmount,
          totalCalls,
          avgCallDuration: avgCallDuration._avg.duration || 0,
        },
        recentLeads,
      };
    });

    const analytics = await Promise.all(analyticsPromises);

    // Calculate company totals
    const companyTotals = {
      totalLeads: analytics.reduce((sum, a) => sum + a.metrics.totalLeads, 0),
      totalRevenue: analytics.reduce((sum, a) => sum + a.metrics.totalRevenue, 0),
      receivedAmount: analytics.reduce((sum, a) => sum + a.metrics.receivedAmount, 0),
      pendingAmount: analytics.reduce((sum, a) => sum + a.metrics.pendingAmount, 0),
      totalCalls: analytics.reduce((sum, a) => sum + a.metrics.totalCalls, 0),
    };

    return NextResponse.json({
      analytics,
      companyTotals,
    });
  } catch (error) {
    console.error('Admin analytics error:', error);

    if (error instanceof Error) {
      if (error.message.includes('Unauthorized') || error.message.includes('Forbidden')) {
        return NextResponse.json({ error: error.message }, { status: 403 });
      }
    }

    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}
