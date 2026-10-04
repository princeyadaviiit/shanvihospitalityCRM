// Temporary compatibility wrapper for old API routes during migration
// This file should be removed once all routes are updated to use the new auth functions directly

import { getCurrentUser, requireRole, requireAuth } from '@/lib/auth';
import { NextRequest } from 'next/server';
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
  const user = await requireRole(...allowedRoles);

  return {
    success: true,
    context: {
      companyId: user.companyId!,
      user,
      role: user.role!,
    },
  };
}
