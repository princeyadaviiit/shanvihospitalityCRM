import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireRole } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { clerkClient } from '@clerk/nextjs/server';

const createStaffSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
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

    console.log('👤 Creating staff with email:', validatedData.email);
    console.log('🏢 Company ID:', companyId);

    // Check if user with email already exists in THIS company only (case-insensitive)
    const existingUser = await prisma.user.findFirst({
      where: {
        email: {
          equals: validatedData.email,
          mode: 'insensitive',
        },
        companyId: companyId,
      },
    });

    if (existingUser) {
      console.log('❌ Duplicate user detected:', existingUser.id);
      return NextResponse.json(
        { error: 'A staff member with this email already exists in your company' },
        { status: 400 }
      );
    }

    console.log('✅ No duplicate found, creating Clerk user with password...');

    // Create Clerk user directly with email and password set by admin
    let clerkUser;
    try {
      const clerk = await clerkClient();
      clerkUser = await clerk.users.createUser({
        emailAddress: [validatedData.email],
        password: validatedData.password,
        firstName: validatedData.name.split(' ')[0],
        lastName: validatedData.name.split(' ').slice(1).join(' ') || undefined,
        skipPasswordRequirement: false,
        skipPasswordChecks: false,
      });
      console.log('✅ Clerk user created:', clerkUser.id);
    } catch (clerkError: any) {
      console.error('❌ Clerk user creation failed:', clerkError);
      return NextResponse.json(
        { error: `Failed to create login account: ${clerkError.message}` },
        { status: 500 }
      );
    }

    // Create user record in database with Clerk ID
    const newStaff = await prisma.user.create({
      data: {
        clerkUserId: clerkUser.id,
        companyId,
        name: validatedData.name,
        email: validatedData.email,
        role: validatedData.role,
        active: true, // Active immediately since admin created it
      },
    });

    console.log('✅ Staff member created successfully:', newStaff.id);

    return NextResponse.json({
      success: true,
      staff: {
        id: newStaff.id,
        name: newStaff.name,
        email: newStaff.email,
        role: newStaff.role,
        active: newStaff.active,
      },
      message: `Staff account created. ${validatedData.name} can now login with email: ${validatedData.email}`,
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
