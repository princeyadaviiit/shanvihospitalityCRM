import { NextRequest, NextResponse } from 'next/server';
import { verifyWebhookSignature } from '@/lib/razorpay';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const signature = request.headers.get('x-razorpay-signature');

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing signature' },
        { status: 400 }
      );
    }

    const body = await request.text();
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.error('Razorpay webhook secret not configured');
      return NextResponse.json(
        { error: 'Webhook not configured' },
        { status: 500 }
      );
    }

    const isValid = verifyWebhookSignature(body, signature, webhookSecret);

    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }

    const payload = JSON.parse(body);
    const event = payload.event;

    if (event === 'payment.captured') {
      const payment = payload.payload.payment.entity;
      const orderId = payment.order_id;
      const paymentId = payment.id;
      const amount = payment.amount / 100;
      const currency = payment.currency;

      const razorpayOrder = await prisma.razorpayOrder.findUnique({
        where: { orderId },
        include: {
          booking: {
            include: {
              company: true,
            },
          },
        },
      });

      if (!razorpayOrder) {
        console.error('Order not found:', orderId);
        return NextResponse.json({ received: true });
      }

      const existingPayment = await prisma.razorpayOrder.findFirst({
        where: { paymentId },
      });

      if (existingPayment) {
        return NextResponse.json({ received: true });
      }

      await prisma.$transaction(async (tx: any) => {
        await tx.razorpayOrder.update({
          where: { orderId },
          data: {
            paymentId,
            status: 'CAPTURED',
          },
        });

        const ledgerEntry = await tx.ledgerEntry.create({
          data: {
            bookingId: razorpayOrder.bookingId,
            companyId: razorpayOrder.companyId,
            type: 'PAYMENT',
            amount,
            currency,
            description: `Online payment via Razorpay (${paymentId})`,
            recordedById: razorpayOrder.booking.company.users[0]?.id || razorpayOrder.companyId,
          },
        });

        await tx.auditLog.create({
          data: {
            companyId: razorpayOrder.companyId,
            actorId: 'system',
            actorRole: 'system',
            action: 'payment.captured',
            entityType: 'LedgerEntry',
            entityId: ledgerEntry.id,
            beforeState: null,
            afterState: JSON.stringify({
              paymentId,
              orderId,
              amount,
              currency,
            }),
          },
        });
      });
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}
