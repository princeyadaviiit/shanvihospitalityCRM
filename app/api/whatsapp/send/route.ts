import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getAuthenticatedUser } from '@/lib/auth/session';
import { prisma } from '@/lib/prisma';

const sendWhatsAppSchema = z.object({
  to: z.string().min(10, 'Valid phone number is required'),
  leadId: z.string().optional(),
  type: z.enum(['quote', 'invoice', 'voucher', 'custom']).default('quote'),
  title: z.string().optional(),
  amount: z.number().optional(),
  documentUrl: z.string().optional(),
  message: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    const body = await request.json();
    const validated = sendWhatsAppSchema.parse(body);

    // Sanitize phone number (strip whitespace, hyphens, and ensure country code 91 if missing)
    let cleanPhone = validated.to.replace(/[^\d+]/g, '');
    if (!cleanPhone.startsWith('+')) {
      if (cleanPhone.length === 10) {
        cleanPhone = `+91${cleanPhone}`;
      } else if (cleanPhone.startsWith('91') && cleanPhone.length === 12) {
        cleanPhone = `+${cleanPhone}`;
      }
    }

    // Compose branded Shanvi Hospitality WhatsApp message
    let outboundText = validated.message;

    if (!outboundText) {
      if (validated.type === 'quote') {
        outboundText = `*Namaste from Shanvi Hospitality!* 🏔️🌴\n\nDear Guest, here is your customized tour package proposal:\n\n📋 *Tour:* ${validated.title || 'Custom Tour Package'}\n💰 *Price:* ₹${validated.amount?.toLocaleString('en-IN') || 'As discussed'} (Inclusive of private cab, hotels & sightseeing)\n\nOfficial proposal details & itinerary can be viewed online.\n\nFor any customizations, please reply to this chat.\n\nWarm regards,\n*Himani Ma'am & Team Shanvi Hospitality*\nSector 18, Noida | 📞 +91 9999885087`;
      } else if (validated.type === 'invoice') {
        outboundText = `*Shanvi Hospitality — Official Tax Invoice* 📄\n\nDear Guest, thank you for confirming your holiday. Your GST Tax Invoice has been generated.\n\n💰 *Total Amount:* ₹${validated.amount?.toLocaleString('en-IN') || ''}\n\nPlease find your booking receipt. For any assistance, reach us at +91 9999885087.\n\n*Shanvi Hospitality Noida*`;
      } else if (validated.type === 'voucher') {
        outboundText = `*Shanvi Hospitality — Hotel Accommodation Voucher* 🏨\n\nDear Guest, your hotel check-in voucher is confirmed for your upcoming tour.\n\nPlease present your confirmation voucher and Govt ID at the reception.\n\n*Emergency Helpline:* +91 9999885087\nHave a memorable trip with Shanvi Hospitality!`;
      } else {
        outboundText = `*Shanvi Hospitality Update:* Hello, regarding your travel enquiry with us, please let us know when is a convenient time to connect. Helpline: +91 9999885087.`;
      }
    }

    let twilioSid: string | null = null;
    let dispatchMethod = 'wa_me_link';

    // Attempt Twilio WhatsApp dispatch if credentials are configured
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromWhatsApp = process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+14155238886'; // default Twilio sandbox

    if (accountSid && authToken && accountSid.startsWith('AC')) {
      try {
        const endpoint = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
        const params = new URLSearchParams();
        params.append('From', fromWhatsApp.startsWith('whatsapp:') ? fromWhatsApp : `whatsapp:${fromWhatsApp}`);
        params.append('To', `whatsapp:${cleanPhone}`);
        params.append('Body', outboundText);

        const twilioRes = await fetch(endpoint, {
          method: 'POST',
          headers: {
            Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: params.toString(),
        });

        if (twilioRes.ok) {
          const twilioData = await twilioRes.json();
          twilioSid = twilioData.sid;
          dispatchMethod = 'twilio_sandbox';
        }
      } catch (twilioErr) {
        console.warn('Twilio dispatch failed, falling back to direct WhatsApp link:', twilioErr);
      }
    }

    // Direct WhatsApp Click-to-Chat deep link fallback
    const encodedText = encodeURIComponent(outboundText);
    const directUrl = `https://wa.me/${cleanPhone.replace('+', '')}?text=${encodedText}`;

    // Auto-log note in Lead timeline if leadId provided
    if (validated.leadId) {
      try {
        await prisma.leadNote.create({
          data: {
            leadId: validated.leadId,
            userId: user.id,
            companyId: user.companyId,
            content: `[WhatsApp ${validated.type.toUpperCase()}] Dispatched to ${cleanPhone} via ${dispatchMethod}. ${twilioSid ? `SID: ${twilioSid}` : ''}`,
          },
        });
      } catch (noteErr) {
        console.warn('Could not auto-log note for WhatsApp dispatch:', noteErr);
      }
    }

    return NextResponse.json({
      success: true,
      dispatchMethod,
      cleanPhone,
      twilioSid,
      directUrl,
      message: 'WhatsApp delivery processed successfully',
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to process WhatsApp dispatch', details: error.message },
      { status: 500 }
    );
  }
}
