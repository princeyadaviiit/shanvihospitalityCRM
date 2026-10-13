import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { authenticateRequest } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { clerkClient } from '@clerk/nextjs/server';

const updateStaffSchema = z.object({
  active: z.boolean().optional(),
  role: z.enum(['admin', 'staff_agent', 'accounts']).optional(),
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  password: z.string().min(8).optional(),
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

    // If email or password is being updated, update Clerk user
    if (targetUser.clerkUserId && (validatedData.email || validatedData.password)) {
      try {
        const clerk = await clerkClient();
        const updateData: any = {};

        if (validatedData.email) {
          updateData.emailAddress = [validatedData.email];
        }

        if (validatedData.password) {
          updateData.password = validatedData.password;
        }

        await clerk.users.updateUser(targetUser.clerkUserId, updateData);
        console.log('✅ Clerk user updated');
      } catch (clerkError: any) {
        console.error('❌ Clerk update failed:', clerkError);
        return NextResponse.json(
          { error: `Failed to update login credentials: ${clerkError.message}` },
          { status: 500 }
        );
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: staffId },
      data: {
        ...(validatedData.active !== undefined && { active: validatedData.active }),
        ...(validatedData.role !== undefined && { role: validatedData.role }),
        ...(validatedData.name !== undefined && { name: validatedData.name }),
        ...(validatedData.email !== undefined && { email: validatedData.email }),
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
      message: `Staff member updated successfully`,
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

export async function DELETE(
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
    console.log('🗑️ Attempting to delete staff member:', staffId);

    // Verify staff exists and belongs to the admin's company
    const targetUser = await prisma.user.findFirst({
      where: {
        id: staffId,
        companyId,
      },
      include: {
        _count: {
          select: {
            assignedLeads: true,
            createdLeads: true,
            leadNotes: true,
          },
        },
      },
    });

    if (!targetUser) {
      return NextResponse.json(
        { error: 'Staff member not found in your company' },
        { status: 404 }
      );
    }

    // Prevent admin from deleting themselves
    if (targetUser.id === currentUser.id) {
      return NextResponse.json(
        { error: 'You cannot delete your own admin account' },
        { status: 400 }
      );
    }

    // Check if staff has assigned data
    const hasData = targetUser._count.assignedLeads > 0 ||
                    targetUser._count.createdLeads > 0 ||
                    targetUser._count.leadNotes > 0;

    if (hasData) {
      console.log('⚠️ Staff has assigned data, performing soft delete');
      // Soft delete - deactivate instead of hard delete to preserve data integrity
      const deactivated = await prisma.user.update({
        where: { id: staffId },
        data: {
          active: false,
          // Optionally clear sensitive fields
          email: `deleted_${staffId}@removed.local`,
        },
      });

      return NextResponse.json({
        success: true,
        message: `Staff member deactivated (has ${targetUser._count.assignedLeads} assigned leads)`,
        user: {
          id: deactivated.id,
          name: deactivated.name,
          active: deactivated.active,
        },
        softDelete: true,
      });
    }

    // Hard delete - no data associated
    console.log('✅ Staff has no data, performing hard delete');
    await prisma.user.delete({
      where: { id: staffId },
    });

    return NextResponse.json({
      success: true,
      message: 'Staff member deleted successfully',
      hardDelete: true,
    });
  } catch (error: any) {
    console.error('❌ Error deleting staff member:', error);

    // Handle foreign key constraints
    if (error.code === 'P2003') {
      return NextResponse.json(
        { error: 'Cannot delete staff member with existing data. Try deactivating instead.' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'An unexpected error occurred while deleting staff member', details: error.message },
      { status: 500 }
    );
  }
}
