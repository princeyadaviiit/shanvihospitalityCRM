import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const callSid = formData.get('CallSid') as string;
    const recordingUrl = formData.get('RecordingUrl') as string;

    if (!callSid || !recordingUrl) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    const existingCall = await prisma.call.findUnique({
      where: { twilioCallSid: callSid },
    });

    if (existingCall && recordingUrl) {
      await prisma.call.update({
        where: { twilioCallSid: callSid },
        data: {
          recordingUrl: recordingUrl,
        },
      });
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Recording webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}
