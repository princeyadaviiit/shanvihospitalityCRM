import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getAuthenticatedUser } from '@/lib/auth/session';
import { prisma } from '@/lib/prisma';

const updateCompanySchema = z.object({
  name: z.string().min(1).optional(),
  gstNumber: z.string().optional(),
  currency: z.enum(['INR', 'USD']).optional(),
  logoUrl: z.string().url().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);

    const company = await prisma.company.findUnique({
      where: { id: user.companyId },
      select: {
        id: true,
        name: true,
        gstNumber: true,
        currency: true,
        logoUrl: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    return NextResponse.json({ company });
  } catch (error) {
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error('GET company error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request, ['admin']);
    const body = await request.json();
    const validatedData = updateCompanySchema.parse(body);

    const company = await prisma.company.update({
      where: { id: user.companyId },
      data: validatedData,
      select: {
        id: true,
        name: true,
        gstNumber: true,
        currency: true,
        logoUrl: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ success: true, company });
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
    console.error('PATCH company error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
