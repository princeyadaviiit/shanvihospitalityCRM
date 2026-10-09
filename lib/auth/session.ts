// Temporary compatibility wrapper for old API routes during migration
// This file should be removed once all routes are updated to use the new auth functions directly

import { getCurrentUser, requireRole, requireAuth } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';
import { UserRole } from '@prisma/client';

/**
 * @deprecated Use requireRole() or getCurrentUser() instead
 * Legacy wrapper for getAuthenticatedUser
 */
export async function getAuthenticatedUser(
  request: NextRequest,
  allowedRoles?: UserRole[]
) {
  if (allowedRoles && allowedRoles.length > 0) {
    return await requireRole(...allowedRoles);
  }

  return await requireAuth();
}

/**
 * @deprecated Use requireRole() directly instead
 * Legacy wrapper for authenticateRequest
 */
export async function authenticateRequest(
  request: NextRequest,
  allowedRoles: UserRole[]
) {
  try {
    const user = await requireRole(...allowedRoles);

    return {
      success: true,
      context: {
        companyId: user.companyId!,
        user,
        role: user.role!,
      },
      response: undefined as any,
    };
  } catch (error: any) {
    // Determine appropriate status code from error message
    let status = 500;
    if (error.message?.includes('Unauthorized')) {
      status = 401;
    } else if (error.message?.includes('Forbidden')) {
      status = 403;
    }

    return {
      success: false,
      context: undefined as any,
      response: NextResponse.json(
        { error: error.message || 'Authentication failed' },
        { status }
      ),
    };
  }
}
