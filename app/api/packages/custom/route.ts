import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { authenticateRequest } from '@/lib/auth/session';
import { prisma } from '@/lib/prisma';

const customPackageSchema = z.object({
  title: z.string().min(1, 'Package title is required'),
  destination: z.string().min(1, 'Destination is required'),
  country: z.string().default('India'),
  duration: z.string().min(1, 'Duration is required'),
  daysCount: z.number().int().min(1).default(1),
  priceFrom: z.string().optional().nullable(),
  category: z.array(z.string()).default([]),
  highlights: z.array(z.string()).default([]),
  description: z.string().min(1, 'Description is required'),
  itinerary: z.array(z.object({
    day: z.number().int(),
    title: z.string(),
    description: z.string(),
  })).optional(),
  inclusions: z.array(z.string()).optional(),
  exclusions: z.array(z.string()).optional(),
});

export async function GET(request: NextRequest) {
  let companyId = 'default-company-id';
  const auth = await authenticateRequest(request, ['admin', 'staff_agent', 'accounts']);
  if (auth.success) {
    companyId = auth.context.companyId;
  }

  try {
    const rawPackages = await (prisma as any).customPackage.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
    });

    const packages = rawPackages.map((p: any) => ({
      ...p,
      isCustom: true,
      category: typeof p.category === 'string' ? JSON.parse(p.category || '[]') : p.category,
      highlights: typeof p.highlights === 'string' ? JSON.parse(p.highlights || '[]') : p.highlights,
      itinerary: typeof p.itinerary === 'string' ? JSON.parse(p.itinerary || '[]') : p.itinerary,
      inclusions: typeof p.inclusions === 'string' ? JSON.parse(p.inclusions || '[]') : p.inclusions,
      exclusions: typeof p.exclusions === 'string' ? JSON.parse(p.exclusions || '[]') : p.exclusions,
    }));

    return NextResponse.json({ success: true, packages });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to retrieve custom packages', details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  let companyId = 'default-company-id';
  const auth = await authenticateRequest(request, ['admin', 'staff_agent', 'accounts']);
  if (auth.success) {
    companyId = auth.context.companyId;
  }

  try {
    const body = await request.json();
    const validated = customPackageSchema.parse(body);

    const slug = validated.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');

    const created = await (prisma as any).customPackage.create({
      data: {
        companyId,
        title: validated.title,
        slug,
        destination: validated.destination,
        country: validated.country,
        duration: validated.duration,
        daysCount: validated.daysCount,
        priceFrom: validated.priceFrom || null,
        category: JSON.stringify(validated.category),
        highlights: JSON.stringify(validated.highlights),
        description: validated.description,
        itinerary: JSON.stringify(validated.itinerary || []),
        inclusions: JSON.stringify(validated.inclusions || []),
        exclusions: JSON.stringify(validated.exclusions || []),
      },
    });

    return NextResponse.json({
      success: true,
      package: {
        ...created,
        isCustom: true,
        category: validated.category,
        highlights: validated.highlights,
        itinerary: validated.itinerary,
        inclusions: validated.inclusions,
        exclusions: validated.exclusions,
      },
    }, { status: 201 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to create custom package', details: error.message },
      { status: 500 }
    );
  }
}
