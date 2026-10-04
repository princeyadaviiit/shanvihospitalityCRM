import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const onboardingSchema = z.object({
  companyName: z.string().min(1, 'Company name is required'),
  gstNumber: z.string().optional(),
  currency: z.enum(['INR', 'USD']).default('INR'),
});

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();

    // Check if user already has a company
    if (user.companyId) {
      return NextResponse.json(
        { error: 'User already has a company assigned' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validatedData = onboardingSchema.parse(body);

    // Create company and assign user as admin in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create the company
      const company = await tx.company.create({
        data: {
          name: validatedData.companyName,
          gstNumber: validatedData.gstNumber || null,
          currency: validatedData.currency,
        },
      });

      // Update user with company and admin role
      const updatedUser = await tx.user.update({
        where: { id: user.id },
        data: {
          companyId: company.id,
          role: 'admin',
        },
      });

      return { company, user: updatedUser };
    });

    return NextResponse.json({
      success: true,
      company: result.company,
      user: {
        id: result.user.id,
        companyId: result.user.companyId,
        role: result.user.role,
      },
    });
  } catch (error) {
    console.error('Onboarding error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }

    if (error instanceof Error) {
      if (error.message.includes('Onboarding incomplete')) {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Failed to complete onboarding' },
      { status: 500 }
    );
  }
}
