import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { authenticateRequest } from '@/lib/auth/session';
import { prisma } from '@/lib/prisma';

const createNoteSchema = z.object({
  content: z.string().min(1, 'Note content cannot be empty'),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticateRequest(request, ['admin', 'staff_agent']);
  if (!auth.success) {
    return auth.response;
  }

  const { id: leadId } = await params;
  const { companyId, user, role } = auth.context;

  try {
    const body = await request.json();
    const validatedData = createNoteSchema.parse(body);

    const lead = await prisma.lead.findFirst({
      where: {
        id: leadId,
        companyId, // Tenant isolation
      },
    });

    if (!lead) {
      return NextResponse.json(
        { error: 'Lead not found' },
        { status: 404 }
      );
    }

    // RBAC: Staff agent can only add notes to their own assigned lead
    if (role === 'staff_agent' && lead.assignedAgentId !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden: You do not have access to add notes to this lead' },
        { status: 403 }
      );
    }

    const note = await prisma.leadNote.create({
      data: {
        leadId,
        userId: user.id,
        companyId,
        content: validatedData.content,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Note added successfully',
        note,
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

    console.error('Error adding note:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred while adding note' },
      { status: 500 }
    );
  }
}
