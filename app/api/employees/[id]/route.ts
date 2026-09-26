import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { authenticateRequest } from '@/lib/auth/session';
import { prisma } from '@/lib/prisma';

const updateEmployeeSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  phone: z.string().min(10).optional(),
  department: z.string().optional(),
  designation: z.string().min(1).optional(),
  joiningDate: z.string().optional(),
  baseSalary: z.number().min(0).optional(),
  allowances: z.number().min(0).optional(),
  deductions: z.number().min(0).optional(),
  netSalary: z.number().min(0).optional(),
  bankName: z.string().optional().nullable(),
  accountNumber: z.string().optional().nullable(),
  ifscCode: z.string().optional().nullable(),
  panNumber: z.string().optional().nullable(),
  status: z.enum(['ACTIVE', 'ON_LEAVE', 'RESIGNED']).optional(),
  commissionRate: z.number().min(0).optional(),
});

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const auth = await authenticateRequest(request, ['admin', 'staff_agent', 'accounts']);
  if (!auth.success) {
    return auth.response;
  }
  const companyId = auth.context.companyId;

  try {
    const employee = await (prisma as any).employee.findUnique({
      where: { id, companyId },
      include: { salaryPayments: true },
    });

    if (!employee) {
      return NextResponse.json(
        { error: 'Employee not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, employee });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to retrieve employee', details: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const auth = await authenticateRequest(request, ['admin', 'accounts']);
  if (!auth.success) {
    return auth.response;
  }
  const companyId = auth.context.companyId;

  try {
    const body = await request.json();
    const validated = updateEmployeeSchema.parse(body);

    const updated = await (prisma as any).employee.update({
      where: { id },
      data: validated,
    });

    return NextResponse.json({ success: true, employee: updated });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to update employee', details: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const auth = await authenticateRequest(request, ['admin']);
  if (!auth.success) {
    return auth.response;
  }
  const companyId = auth.context.companyId;

  try {
    const deleted = await (prisma as any).employee.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, employee: deleted });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to delete employee', details: error.message },
      { status: 500 }
    );
  }
}
