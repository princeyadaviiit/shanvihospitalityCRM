import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { authenticateRequest } from '@/lib/auth/session';
import { prisma } from '@/lib/prisma';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

const createStaffSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  role: z.enum(['admin', 'staff_agent', 'accounts']),
});

export async function GET(request: NextRequest) {
  const auth = await authenticateRequest(request, ['admin']);
  if (!auth.success) {
    return auth.response;
  }

  const { companyId } = auth.context;

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
}

export async function POST(request: NextRequest) {
  const auth = await authenticateRequest(request, ['admin']);
  if (!auth.success) {
    return auth.response;
  }

  const { companyId } = auth.context;

  try {
    const body = await request.json();
    const validatedData = createStaffSchema.parse(body);

    // Check if user with email already exists in this company or database
    const existingUser = await prisma.user.findFirst({
      where: { email: validatedData.email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'A user with this email address already exists' },
        { status: 400 }
      );
    }

    let supabaseUid = `auth_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    // If Supabase service role key is configured, invite via Supabase Auth admin API
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (
      supabaseUrl &&
      serviceRoleKey &&
      !supabaseUrl.includes('your_supabase_project_url')
    ) {
      try {
        const supabaseAdmin = createSupabaseClient(supabaseUrl, serviceRoleKey, {
          auth: { autoRefreshToken: false, persistSession: false },
        });

        const { data: authUser, error: inviteError } =
          await supabaseAdmin.auth.admin.inviteUserByEmail(validatedData.email, {
            data: {
              name: validatedData.name,
              role: validatedData.role,
              companyId,
            },
          });

        if (inviteError) {
          return NextResponse.json(
            { error: `Supabase invite failed: ${inviteError.message}` },
            { status: 400 }
          );
        }

        if (authUser?.user?.id) {
          supabaseUid = authUser.user.id;
        }
      } catch (adminErr) {
        console.warn('Could not call Supabase admin invite; falling back to generated ID in dev', adminErr);
      }
    }

    const newUser = await prisma.user.create({
      data: {
        supabaseUid,
        companyId,
        name: validatedData.name,
        email: validatedData.email,
        role: validatedData.role,
        active: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        active: true,
        createdAt: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Staff member added successfully',
        user: newUser,
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }

    console.error('Error adding staff member:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred while adding staff member' },
      { status: 500 }
    );
  }
}
