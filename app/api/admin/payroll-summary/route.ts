import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/admin/payroll-summary
 * Admin-only: Get payroll summary for all employees
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireRole('admin');
    const companyId = user.companyId!; // Admin users always have companyId after requireRole

    // Get all employees with their recent salary payments
    const employees = await prisma.employee.findMany({
      where: {
        companyId,
      },
      include: {
        salaryPayments: {
          orderBy: {
            paymentDate: 'desc',
          },
          take: 3,
        },
      },
    });

    // Calculate summary for each employee
    const payrollSummary = employees.map((employee) => {
      const totalPaid = employee.salaryPayments.reduce(
        (sum, payment) => sum + payment.netPaid,
        0
      );

      const lastPayment = employee.salaryPayments[0];

      return {
        employee: {
          id: employee.id,
          name: employee.name,
          email: employee.email,
          department: employee.department,
          designation: employee.designation,
          status: employee.status,
        },
        salary: {
          baseSalary: employee.baseSalary,
          allowances: employee.allowances,
          deductions: employee.deductions,
          netSalary: employee.netSalary,
          commissionRate: employee.commissionRate,
        },
        payments: {
          totalPaid,
          lastPaymentDate: lastPayment?.paymentDate || null,
          lastPaymentAmount: lastPayment?.netPaid || 0,
          recentPayments: employee.salaryPayments,
        },
      };
    });

    // Company payroll totals
    const companyPayrollTotals = {
      totalEmployees: employees.length,
      activeEmployees: employees.filter((e) => e.status === 'ACTIVE').length,
      monthlyPayrollBudget: employees
        .filter((e) => e.status === 'ACTIVE')
        .reduce((sum, e) => sum + e.netSalary, 0),
      totalPaidThisYear: await prisma.salaryPayment.aggregate({
        where: {
          companyId,
          paymentDate: {
            gte: new Date(new Date().getFullYear(), 0, 1),
          },
        },
        _sum: {
          netPaid: true,
        },
      }),
    };

    return NextResponse.json({
      payrollSummary,
      companyPayrollTotals: {
        ...companyPayrollTotals,
        totalPaidThisYear: companyPayrollTotals.totalPaidThisYear._sum.netPaid || 0,
      },
    });
  } catch (error) {
    console.error('Payroll summary error:', error);

    if (error instanceof Error) {
      if (error.message.includes('Unauthorized') || error.message.includes('Forbidden')) {
        return NextResponse.json({ error: error.message }, { status: 403 });
      }
    }

    return NextResponse.json(
      { error: 'Failed to fetch payroll summary' },
      { status: 500 }
    );
  }
}
