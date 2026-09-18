import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { authenticateRequest } from '@/lib/auth/session';
import { prisma } from '@/lib/prisma';

const updateStaffSchema = z.object({
  active: z.boolean().optional(),
  role: z.enum(['admin', 'staff_agent', 'accounts']).optional(),
  name: z.string().min(1).optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticateRequest(request, ['admin']);
  if (!auth.success) {
    return auth.response;
  }

  const { id: staffId } = await params;
  const { companyId, user: currentUser } = auth.context;

  try {
    const body = await request.json();
    const validatedData = updateStaffSchema.parse(body);

    // Verify staff exists and belongs to the admin's company
    const targetUser = await prisma.user.findFirst({
      where: {
        id: staffId,
        companyId,
      },
    });

    if (!targetUser) {
      return NextResponse.json(
        { error: 'Staff member not found in your company' },
        { status: 404 }
      );
    }

    // Prevent admin from deactivating themselves
    if (targetUser.id === currentUser.id && validatedData.active === false) {
      return NextResponse.json(
        { error: 'You cannot deactivate your own admin account' },
        { status: 400 }
      );
    }

    const updatedUser = await prisma.user.update({
      where: { id: staffId },
      data: {
        ...(validatedData.active !== undefined && { active: validatedData.active }),
        ...(validatedData.role !== undefined && { role: validatedData.role }),
        ...(validatedData.name !== undefined && { name: validatedData.name }),
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        active: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Staff member ${updatedUser.active ? 'updated' : 'deactivated'} successfully`,
      user: updatedUser,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }

    console.error('Error updating staff member:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred while updating staff member' },
      { status: 500 }
    );
  }
}
