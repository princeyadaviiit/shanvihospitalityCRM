import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { authenticateRequest } from '@/lib/auth/session';
import { prisma } from '@/lib/prisma';

const employeeSchema = z.object({
  name: z.string().min(1, 'Employee name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(10, 'Valid phone number is required'),
  department: z.string().default('Operations'),
  designation: z.string().min(1, 'Designation is required'),
  joiningDate: z.string().optional(),
  baseSalary: z.number().min(0).default(0),
  allowances: z.number().min(0).default(0),
  deductions: z.number().min(0).default(0),
  netSalary: z.number().min(0).optional(),
  bankName: z.string().optional().nullable(),
  accountNumber: z.string().optional().nullable(),
  ifscCode: z.string().optional().nullable(),
  panNumber: z.string().optional().nullable(),
  status: z.enum(['ACTIVE', 'ON_LEAVE', 'RESIGNED']).default('ACTIVE'),
  commissionRate: z.number().min(0).default(0),
});

export async function GET(request: NextRequest) {
  const auth = await authenticateRequest(request, ['admin', 'staff_agent', 'accounts']);
  if (!auth.success) {
    return auth.response;
  }
  const companyId = auth.context.companyId;

  try {
    const { searchParams } = new URL(request.url);
    const department = searchParams.get('department') || undefined;
    const status = searchParams.get('status') || undefined;

    const employees = await (prisma as any).employee.findMany({
      where: {
        companyId,
        ...(department ? { department } : {}),
        ...(status ? { status } : {}),
      },
      include: {
        salaryPayments: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({
      success: true,
      employees,
      count: employees.length,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to retrieve employees', details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const auth = await authenticateRequest(request, ['admin', 'accounts']);
  if (!auth.success) {
    return auth.response;
  }
  const companyId = auth.context.companyId;

  try {
    const body = await request.json();
    const validated = employeeSchema.parse(body);

    const baseSalary = validated.baseSalary;
    const allowances = validated.allowances;
    const deductions = validated.deductions;
    const netSalary = validated.netSalary ?? (baseSalary + allowances - deductions);

    const employee = await (prisma as any).employee.create({
      data: {
        ...validated,
        netSalary,
        companyId,
        joiningDate: validated.joiningDate ? new Date(validated.joiningDate) : new Date(),
      },
    });

    return NextResponse.json(
      { success: true, employee },
      { status: 201 }
    );
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to create employee', details: error.message },
      { status: 500 }
    );
  }
}
