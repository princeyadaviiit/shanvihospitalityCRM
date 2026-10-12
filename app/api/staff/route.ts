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

    // Check if user with email already exists in THIS company only
    const existingUser = await prisma.user.findFirst({
      where: {
        email: validatedData.email,
        companyId: companyId, // Company-scoped check
      },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'A staff member with this email already exists in your company' },
        { status: 400 }
      );
    }

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

    // Send invitation email
    const emailResult = await sendStaffInvitation(
      validatedData.email,
      validatedData.name,
      validatedData.role
    );

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
