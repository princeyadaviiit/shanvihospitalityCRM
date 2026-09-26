import { NextResponse, NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { UserRole, User } from '@prisma/client';

export type AuthContext = {
  user: User;
  companyId: string;
  role: UserRole;
};

export type AuthResult =
  | { success: true; context: AuthContext }
  | { success: false; response: NextResponse };

/**
 * Standard server-side authentication & RBAC check adhering strictly to auth.md §6:
 * 1. Resolve Supabase session -> 401 if absent/invalid
 * 2. Lookup DB User -> 401 if missing or active === false
 * 3. Check role against allowedRoles -> 403 if disallowed
 * 4. Return context with session user and companyId for tenant scoping
 */
export async function authenticateRequest(
  request?: NextRequest,
  allowedRoles?: UserRole[]
): Promise<AuthResult> {
  let supabaseUid: string | null = null;

  // In test environment, allow mock auth header for local verification
  if (process.env.NODE_ENV === 'test' && request) {
    const testUid = request.headers.get('x-test-supabase-uid');
    if (testUid) {
      supabaseUid = testUid;
    }
  }

  // 1. Resolve Supabase session
  if (!supabaseUid) {
    try {
      const supabase = await createClient();
      const {
        data: { user: authUser },
        error,
      } = await supabase.auth.getUser();

      if (error || !authUser) {
        return {
          success: false,
          response: NextResponse.json(
            { error: 'Unauthorized: Invalid or missing session' },
            { status: 401 }
          ),
        };
      }
      supabaseUid = authUser.id;
    } catch {
      return {
        success: false,
        response: NextResponse.json(
          { error: 'Unauthorized: Session resolution failed' },
          { status: 401 }
        ),
      };
    }
  }

  // 2. Look up the corresponding User row
  const dbUser = await prisma.user.findUnique({
    where: { supabaseUid },
  });

  if (!dbUser) {
    return {
      success: false,
      response: NextResponse.json(
        { error: 'Unauthorized: User account not found' },
        { status: 401 }
      ),
    };
  }

  // Reject deactivated user immediately
  if (!dbUser.active) {
    return {
      success: false,
      response: NextResponse.json(
        { error: 'Unauthorized: User account is deactivated' },
        { status: 401 }
      ),
    };
  }

  // 3. Check resolved role against permitted roles
  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(dbUser.role)) {
    return {
      success: false,
      response: NextResponse.json(
        { error: `Forbidden: Role '${dbUser.role}' is not authorized for this action` },
        { status: 403 }
      ),
    };
  }

  // 4. Return authenticated context
  return {
    success: true,
    context: {
      user: dbUser,
      companyId: dbUser.companyId,
      role: dbUser.role,
    },
  };
}

/**
 * Simplified helper that throws on auth failure instead of returning NextResponse.
 * Use this in API routes where you want automatic error handling.
 */
export async function getAuthenticatedUser(
  request?: NextRequest,
  allowedRoles?: UserRole[]
): Promise<AuthContext['user'] & { companyId: string; role: UserRole }> {
  const result = await authenticateRequest(request, allowedRoles);

  if (!result.success) {
    if (result.response.status === 403) {
      throw new Error('Forbidden: Insufficient permissions for this action');
    }
    throw new Error('Unauthorized: Authentication required');
  }

  return {
    ...result.context.user,
    companyId: result.context.companyId,
    role: result.context.role,
  };
}
