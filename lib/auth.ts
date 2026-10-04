import { auth, currentUser } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@prisma/client';
import { NextRequest } from 'next/server';

export type AuthUser = {
  id: string;
  clerkUserId: string;
  companyId: string | null;
  role: UserRole | null;
  name: string;
  email: string;
  active: boolean;
};

export type AuthenticatedUser = {
  id: string;
  clerkUserId: string;
  companyId: string; // Guaranteed non-null for authenticated users
  role: UserRole; // Guaranteed non-null for authenticated users
  name: string;
  email: string;
  active: boolean;
};

/**
 * Get the current authenticated user from Clerk and our database.
 * Creates the user record just-in-time if it doesn't exist (webhook lag).
 * Returns null if not authenticated.
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  const { userId } = await auth();

  if (!userId) {
    return null;
  }

  // Try to find existing user
  let user = await prisma.user.findUnique({
    where: { clerkUserId: userId },
  });

  // Just-in-time user creation (webhook lag handling)
  if (!user) {
    const clerkUser = await currentUser();

    if (!clerkUser) {
      return null;
    }

    const primaryEmail = clerkUser.emailAddresses.find(
      (email) => email.id === clerkUser.primaryEmailAddressId
    );

    if (!primaryEmail) {
      return null;
    }

    // Create user without company/role (onboarding incomplete)
    user = await prisma.user.create({
      data: {
        clerkUserId: userId,
        name: `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || 'User',
        email: primaryEmail.emailAddress,
        companyId: null,
        role: null,
        active: true,
      },
    });
  }

  // Check if user is active
  if (!user.active) {
    throw new Error('User account is deactivated');
  }

  return {
    id: user.id,
    clerkUserId: user.clerkUserId,
    companyId: user.companyId,
    role: user.role,
    name: user.name,
    email: user.email,
    active: user.active,
  };
}

/**
 * Require the current user to have one of the specified roles.
 * Throws an error if not authenticated, inactive, or missing required role.
 */
export async function requireRole(...allowedRoles: UserRole[]): Promise<AuthenticatedUser> {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error('Unauthorized: Authentication required');
  }

  if (!user.companyId || !user.role) {
    throw new Error('Forbidden: Onboarding incomplete - company and role required');
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    throw new Error(`Forbidden: Role '${user.role}' is not authorized for this action`);
  }

  return user as AuthenticatedUser; // Safe cast after validation
}

/**
 * Require the current user to be authenticated and have completed onboarding.
 * Does not check specific roles.
 */
export async function requireAuth(): Promise<AuthenticatedUser> {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error('Unauthorized: Authentication required');
  }

  if (!user.companyId || !user.role) {
    throw new Error('Forbidden: Onboarding incomplete - company and role required');
  }

  return user as AuthenticatedUser; // Safe cast after validation
}

/**
 * Get a Prisma query filter that scopes to the user's company.
 * Use this to ensure tenant isolation on all queries.
 */
export function getCompanyScope(companyId: string | null) {
  if (!companyId) {
    throw new Error('Cannot create company scope: companyId is null');
  }
  return { companyId };
}

// ========================================
// Legacy compatibility wrappers
// @deprecated - These exist only for backward compatibility
// New code should use requireRole() or getCurrentUser() directly
// ========================================

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
    response: undefined as any, // Not used in new system
  };
}
