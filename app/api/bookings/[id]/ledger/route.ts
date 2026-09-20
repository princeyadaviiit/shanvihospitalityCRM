import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getAuthenticatedUser } from '@/lib/auth/session';
import { prisma } from '@/lib/prisma';
import { createAuditLog } from '@/lib/audit';

const addLedgerEntrySchema = z.object({
  type: z.enum(['DEPOSIT', 'PAYMENT', 'SUPPLIER_COST', 'REFUND']),
  amount: z.number().positive('Amount must be positive'),
  currency: z.string().min(3).max(3),
  description: z.string().min(1, 'Description is required'),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser(request);
    const { id: bookingId } = await params;

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        ledgerEntries: {
          include: {
            recordedBy: {
              select: { id: true, name: true, role: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        lead: {
          select: { id: true, name: true },
        },
      },
    });

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    if (booking.companyId !== user.companyId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({
      booking: {
        id: booking.id,
        bookingNumber: booking.bookingNumber,
        totalAmount: booking.totalAmount,
        currency: booking.currency,
        lead: booking.lead,
      },
      ledgerEntries: booking.ledgerEntries,
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    if (error instanceof Error && error.message.includes('Forbidden')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error('GET ledger error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser(request, ['admin', 'accounts']);
    const { id: bookingId } = await params;
    const body = await request.json();
    const validatedData = addLedgerEntrySchema.parse(body);

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      select: { id: true, companyId: true },
    });

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    if (booking.companyId !== user.companyId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const result = await prisma.$transaction(async (tx: any) => {
      const ledgerEntry = await tx.ledgerEntry.create({
        data: {
          bookingId: booking.id,
          companyId: user.companyId,
          type: validatedData.type,
          amount: validatedData.amount,
          currency: validatedData.currency,
          description: validatedData.description,
          recordedById: user.id,
        },
        include: {
          recordedBy: {
            select: { id: true, name: true, role: true },
          },
        },
      });

      await tx.auditLog.create({
        data: {
          companyId: user.companyId,
          actorId: user.id,
          actorRole: user.role,
          action: 'ledger.create',
          entityType: 'LedgerEntry',
          entityId: ledgerEntry.id,
          beforeState: null,
          afterState: JSON.stringify({
            bookingId: ledgerEntry.bookingId,
            type: ledgerEntry.type,
            amount: ledgerEntry.amount,
            currency: ledgerEntry.currency,
            description: ledgerEntry.description,
          }),
        },
      });

      return ledgerEntry;
    });

    return NextResponse.json({
      success: true,
      ledgerEntry: result,
    });
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
    console.error('POST ledger error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
