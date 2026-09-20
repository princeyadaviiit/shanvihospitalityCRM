import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getAuthenticatedUser } from '@/lib/auth/session';
import { prisma } from '@/lib/prisma';
import { getRazorpayInstance } from '@/lib/razorpay';

const createOrderSchema = z.object({
  bookingId: z.string(),
  amount: z.number().positive(),
  currency: z.string().default('INR'),
  description: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    const body = await request.json();
    const validatedData = createOrderSchema.parse(body);

    const booking = await prisma.booking.findUnique({
      where: { id: validatedData.bookingId },
      include: {
        lead: {
          select: { name: true, email: true, phone: true },
        },
      },
    });

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    if (booking.companyId !== user.companyId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const razorpay = getRazorpayInstance();

    const order = await razorpay.orders.create({
      amount: Math.round(validatedData.amount * 100),
      currency: validatedData.currency,
      receipt: `${booking.bookingNumber}-${Date.now()}`,
      notes: {
        bookingId: booking.id,
        companyId: user.companyId,
        description: validatedData.description || `Payment for ${booking.bookingNumber}`,
      },
    });

    await prisma.razorpayOrder.create({
      data: {
        orderId: order.id,
        bookingId: booking.id,
        companyId: user.companyId,
        amount: validatedData.amount,
        currency: validatedData.currency,
        status: 'CREATED',
      },
    });

    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        amount: validatedData.amount,
        currency: order.currency,
      },
      razorpayKeyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      customerInfo: {
        name: booking.lead.name,
        email: booking.lead.email,
        contact: booking.lead.phone,
      },
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
    console.error('Create payment order error:', error);
    return NextResponse.json(
      { error: 'Failed to create payment order' },
      { status: 500 }
    );
  }
}
