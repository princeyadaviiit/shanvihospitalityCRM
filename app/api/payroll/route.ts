import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { authenticateRequest } from '@/lib/auth/session';
import { prisma } from '@/lib/prisma';

const salaryPaymentSchema = z.object({
  employeeId: z.string().min(1, 'Employee is required'),
  month: z.string().min(1, 'Payment month is required'),
  baseAmount: z.number().min(0, 'Base amount cannot be negative'),
  bonusAmount: z.number().min(0).default(0),
  deductions: z.number().min(0).default(0),
  netPaid: z.number().min(0).optional(),
  paymentDate: z.string().optional(),
  paymentMode: z.enum(['NEFT', 'IMPS', 'UPI', 'CHEQUE', 'CASH']).default('NEFT'),
  paymentStatus: z.enum(['PAID', 'PENDING', 'PROCESSING']).default('PAID'),
  transactionRef: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export async function GET(request: NextRequest) {
  const auth = await authenticateRequest(request, ['admin', 'accounts']);
  if (!auth.success) {
    return auth.response;
  }
  const companyId = auth.context.companyId;

  try {
    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month') || undefined;
    const employeeId = searchParams.get('employeeId') || undefined;

    const payments = await (prisma as any).salaryPayment.findMany({
      where: {
        companyId,
        ...(month ? { month } : {}),
        ...(employeeId ? { employeeId } : {}),
      },
      include: {
        employee: true,
      },
      orderBy: {
        paymentDate: 'desc',
      },
    });

    const employees = await (prisma as any).employee.findMany({
      where: { companyId },
    });

    // Compute summary metrics
    const totalPayroll = employees.reduce((sum: number, e: any) => sum + (e.netSalary || 0), 0);
    const activeStaff = employees.filter((e: any) => e.status === 'ACTIVE').length;
    const averageSalary = employees.length > 0 ? Math.round(totalPayroll / employees.length) : 0;

    return NextResponse.json({
      success: true,
      payments,
      summary: {
        totalMonthlyPayroll: totalPayroll,
        headcount: employees.length,
        activeStaff,
        averageSalary,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to retrieve payroll data', details: error.message },
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
    const validated = salaryPaymentSchema.parse(body);

    const netPaid = validated.netPaid ?? (validated.baseAmount + (validated.bonusAmount || 0) - (validated.deductions || 0));

    const payment = await (prisma as any).salaryPayment.create({
      data: {
        ...validated,
        netPaid,
        companyId,
        paymentDate: validated.paymentDate ? new Date(validated.paymentDate) : new Date(),
        transactionRef: validated.transactionRef || `SHV-${validated.paymentMode}-${Date.now().toString().slice(-6)}`,
      },
    });

    return NextResponse.json({ success: true, payment }, { status: 201 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to record salary payment', details: error.message },
      { status: 500 }
    );
  }
}
