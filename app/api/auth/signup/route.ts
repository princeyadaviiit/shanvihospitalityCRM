import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';

const signUpSchema = z.object({
  companyName: z.string().min(1, 'Company name is required'),
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export async function POST(request: NextRequest) {
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
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }

    console.error('Sign up error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
