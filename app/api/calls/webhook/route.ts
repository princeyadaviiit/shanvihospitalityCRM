import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const callSid = formData.get('CallSid') as string;
    const callStatus = formData.get('CallStatus') as string;
    const callDuration = formData.get('CallDuration') as string;

    if (!callSid) {
      return NextResponse.json({ error: 'Missing CallSid' }, { status: 400 });
    }

    const existingCall = await prisma.call.findUnique({
      where: { twilioCallSid: callSid },
    });

    if (existingCall) {
      await prisma.call.update({
        where: { twilioCallSid: callSid },
        data: {
          status: callStatus || 'completed',
          duration: callDuration ? parseInt(callDuration, 10) : 0,
        },
      });
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Call webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}
