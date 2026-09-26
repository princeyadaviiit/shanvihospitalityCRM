import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

const signUpSchema = z.object({
  companyName: z.string().min(1, 'Company name is required'),
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export async function POST(request: NextRequest) {
  const clientIp = getClientIp(request);
  const rateLimit = checkRateLimit(`signup:${clientIp}`, { maxRequests: 5, windowMs: 60 * 1000 });

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: 'Too many registration requests from this IP. Please wait 60 seconds.' },
      { status: 429 }
    );
  }

  try {
    const body = await request.json();
    const validatedData = signUpSchema.parse(body);

    const supabase = await createClient();

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: validatedData.email,
      password: validatedData.password,
    });

    if (authError) {
      console.error('Supabase signUp error:', authError.message, authError);
      return NextResponse.json(
        { error: authError.message },
        { status: 400 }
      );
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: 'Failed to create user' },
        { status: 500 }
      );
    }

    const company = await prisma.company.create({
      data: {
        name: validatedData.companyName,
      },
    });

    await prisma.user.create({
      data: {
        supabaseUid: authData.user.id,
        companyId: company.id,
        name: validatedData.name,
        email: validatedData.email,
        role: 'admin',
        active: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Account created successfully',
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }

    console.error('Sign up error:', error);

    // Prisma Unique Constraint Error (P2002)
    if (error?.code === 'P2002') {
      return NextResponse.json(
        { error: 'An account or company with this credential already exists.' },
        { status: 409 }
      );
    }

    // Prisma Database Connection Error
    if (error?.message?.includes("Can't reach database") || error?.message?.includes('connection') || error?.code === 'P1001') {
      return NextResponse.json(
        { error: 'Database connection failed. Please verify that your DATABASE_URL uses the Supabase Connection Pooler (port 6543).' },
        { status: 503 }
      );
    }

    const message = error instanceof Error ? error.message : 'An unexpected error occurred during registration';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
