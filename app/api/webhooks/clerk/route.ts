import { NextRequest, NextResponse } from 'next/server';
import { Webhook } from 'svix';
import { prisma } from '@/lib/prisma';

const webhookSecret = process.env.CLERK_WEBHOOK_SIGNING_SECRET;

type ClerkWebhookEvent = {
  type: string;
  data: {
    id: string;
    email_addresses: Array<{ id: string; email_address: string }>;
    primary_email_address_id: string;
    first_name: string | null;
    last_name: string | null;
    public_metadata?: {
      companyId?: string;
      role?: 'admin' | 'staff_agent' | 'accounts';
    };
  };
};

export async function POST(request: NextRequest) {
  if (!webhookSecret) {
    console.error('Clerk webhook secret is not configured');
    return NextResponse.json(
      { error: 'Webhook configuration error' },
      { status: 500 }
    );
  }

  // Get headers for signature verification
  const svix_id = request.headers.get('svix-id');
  const svix_timestamp = request.headers.get('svix-timestamp');
  const svix_signature = request.headers.get('svix-signature');

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return NextResponse.json(
      { error: 'Missing svix headers' },
      { status: 400 }
    );
  }

  // Get the raw body
  const payload = await request.text();

  // Verify the webhook signature
  const wh = new Webhook(webhookSecret);
  let evt: ClerkWebhookEvent;

  try {
    evt = wh.verify(payload, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    }) as unknown as ClerkWebhookEvent;
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 }
    );
  }

  const { type, data } = evt;
  const clerkUserId = data.id;

  try {
    switch (type) {
      case 'user.created':
      case 'user.updated': {
        const primaryEmail = data.email_addresses.find(
          (email) => email.id === data.primary_email_address_id
        );

        if (!primaryEmail) {
          console.error('No primary email found for user:', clerkUserId);
          return NextResponse.json({ error: 'No primary email' }, { status: 400 });
        }

        const fullName = `${data.first_name || ''} ${data.last_name || ''}`.trim() || 'User';

        // Extract metadata for staff invitations
        const companyId = data.public_metadata?.companyId || null;
        const role = data.public_metadata?.role || null;

        // Upsert user (idempotent)
        await prisma.user.upsert({
          where: { clerkUserId },
          update: {
            name: fullName,
            email: primaryEmail.email_address,
            // Update companyId and role if provided in metadata (staff invitation)
            ...(companyId && { companyId }),
            ...(role && { role }),
          },
          create: {
            clerkUserId,
            name: fullName,
            email: primaryEmail.email_address,
            companyId,
            role,
            active: true,
          },
        });

        console.log(`User ${type}:`, clerkUserId);
        break;
      }

      case 'user.deleted': {
        // Soft delete: deactivate instead of hard delete to preserve data integrity
        await prisma.user.updateMany({
          where: { clerkUserId },
          data: { active: false },
        });

        console.log('User deactivated:', clerkUserId);
        break;
      }

      default:
        console.log('Unhandled webhook event type:', type);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}
