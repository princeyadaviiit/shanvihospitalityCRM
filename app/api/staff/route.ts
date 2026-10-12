import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireRole } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { sendStaffInvitation } from '@/lib/email';

const createStaffSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  role: z.enum(['admin', 'staff_agent', 'accounts']),
});

export async function GET(request: NextRequest) {
  try {
    const user = await requireRole('admin');
    const companyId = user.companyId!;

    const staff = await prisma.user.findMany({
      where: { companyId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        active: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            assignedLeads: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json({ staff });
  } catch (error) {
    console.error('Error fetching staff:', error);

    if (error instanceof Error) {
      if (error.message.includes('Unauthorized')) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
      }
      if (error.message.includes('Forbidden')) {
        return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
      }
    }

    return NextResponse.json(
      { error: 'An unexpected error occurred while fetching staff' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireRole('admin');
    const companyId = user.companyId!;

    const body = await request.json();
    const validatedData = createStaffSchema.parse(body);

    console.log('📧 Creating staff with email:', validatedData.email);
    console.log('🏢 Company ID:', companyId);

    // Check if user with email already exists in THIS company only (case-insensitive)
    const existingUser = await prisma.user.findFirst({
      where: {
        email: {
          equals: validatedData.email,
          mode: 'insensitive', // Case-insensitive search
        },
        companyId: companyId,
      },
    });

    console.log('🔍 Existing user found:', existingUser ? 'YES' : 'NO');

    if (existingUser) {
      console.log('❌ Duplicate user detected:', existingUser.id);
      return NextResponse.json(
        { error: 'A staff member with this email already exists in your company' },
        { status: 400 }
      );
    }

    console.log('✅ No duplicate found, creating new staff...');

    // Create user record without Clerk invitation
    // User will sign up normally and webhook will link them
    const newStaff = await prisma.user.create({
      data: {
        clerkUserId: null, // Will be set when they sign up
        companyId,
        name: validatedData.name,
        email: validatedData.email,
        role: validatedData.role,
        active: false, // Activated when they complete signup
      },
    });

    // Send invitation email (non-blocking - staff creation succeeds even if email fails)
    console.log('📨 Attempting to send invitation email...');
    let emailResult;
    try {
      emailResult = await sendStaffInvitation(
        validatedData.email,
        validatedData.name,
        validatedData.role
      );
      console.log('📧 Email result:', emailResult);
    } catch (emailError: any) {
      console.error('⚠️ Email sending failed (non-blocking):', emailError.message);
      emailResult = {
        success: false,
        method: 'manual',
        message: `Staff created but email failed. Share this link: ${process.env.NEXT_PUBLIC_APP_URL}/sign-up`,
      };
    }

    console.log('✅ Staff member created successfully:', newStaff.id);

    return NextResponse.json({
      success: true,
      staff: {
        id: newStaff.id,
        name: newStaff.name,
        email: newStaff.email,
        role: newStaff.role,
        active: newStaff.active,
        invitationSent: emailResult.success && emailResult.method === 'email',
      },
      message: emailResult.method === 'email'
        ? `Staff account created and invitation email sent to ${validatedData.email}`
        : emailResult.message,
    });
  } catch (error) {
    console.error('Error creating staff:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }

    if (error instanceof Error) {
      if (error.message.includes('Unauthorized')) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
      }
      if (error.message.includes('Forbidden')) {
        return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
      }
    }

    return NextResponse.json(
      { error: 'Failed to create staff member' },
      { status: 500 }
    );
  }
}
