import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getAuthenticatedUser } from '@/lib/auth/session';
import { prisma } from '@/lib/prisma';
import { getTwilioClient } from '@/lib/twilio';

const initiateCallSchema = z.object({
  leadId: z.string(),
  to: z.string().min(10, 'Valid phone number required'),
});

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    const body = await request.json();
    const validatedData = initiateCallSchema.parse(body);

    const lead = await prisma.lead.findUnique({
      where: { id: validatedData.leadId },
      select: { id: true, companyId: true, name: true },
    });

    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    if (lead.companyId !== user.companyId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const twilioClient = getTwilioClient();
    const fromNumber = process.env.TWILIO_PHONE_NUMBER;

    if (!fromNumber) {
      return NextResponse.json(
        { error: 'Twilio phone number not configured' },
        { status: 500 }
      );
    }

    const call = await twilioClient.calls.create({
      to: validatedData.to,
      from: fromNumber,
      url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/calls/twiml`,
      statusCallback: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/calls/webhook`,
      statusCallbackEvent: ['completed'],
      record: true,
      recordingStatusCallback: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/calls/recording-webhook`,
    });

    const callRecord = await prisma.call.create({
      data: {
        companyId: user.companyId,
        leadId: lead.id,
        agentId: user.id,
        twilioCallSid: call.sid,
        status: 'initiated',
      },
    });

    return NextResponse.json({
      success: true,
      call: {
        id: callRecord.id,
        sid: call.sid,
        status: call.status,
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
    console.error('Initiate call error:', error);
    return NextResponse.json(
      { error: 'Failed to initiate call' },
      { status: 500 }
    );
  }
}
