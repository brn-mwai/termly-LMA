import { auth } from '@clerk/nextjs/server';
import { createClient } from '@/lib/supabase/server';
import { errorResponse, asUserWithOrg } from '@/lib/utils/api';
import { hasPermission, Permission, Role } from './roles';

export interface AuthenticatedUser {
  id: string;
  clerkId: string;
  email: string;
  fullName: string | null;
  organizationId: string;
  role: Role;
}

export async function getAuthenticatedUser(): Promise<AuthenticatedUser | null> {
  const { userId } = await auth();
  if (!userId) return null;

  const supabase = await createClient();

  const { data: userDataRaw, error } = await supabase
    .from('users')
    .select('id, clerk_id, email, full_name, organization_id, role')
    .eq('clerk_id', userId)
    .single();

  if (error || !userDataRaw) return null;

  const userData = userDataRaw as {
    id: string;
    clerk_id: string;
    email: string;
    full_name: string | null;
    organization_id: string;
    role: string;
  };

  return {
    id: userData.id,
    clerkId: userData.clerk_id,
    email: userData.email,
    fullName: userData.full_name,
    organizationId: userData.organization_id,
    role: (userData.role as Role) || 'analyst',
  };
}

export async function requireAuth() {
  const user = await getAuthenticatedUser();
  if (!user) {
    return { user: null, error: errorResponse('UNAUTHORIZED', 'Authentication required', 401) };
  }
  return { user, error: null };
}

export async function requirePermission(permission: Permission) {
  const { user, error } = await requireAuth();
  if (error) return { user: null, error };

  if (!hasPermission(user!.role, permission)) {
    return {
      user: null,
      error: errorResponse('FORBIDDEN', `You don't have permission to perform this action`, 403),
    };
  }

  return { user, error: null };
}

export async function requireAnyPermission(permissions: Permission[]) {
  const { user, error } = await requireAuth();
  if (error) return { user: null, error };

  const hasAny = permissions.some(p => hasPermission(user!.role, p));
  if (!hasAny) {
    return {
      user: null,
      error: errorResponse('FORBIDDEN', `You don't have permission to perform this action`, 403),
    };
  }

  return { user, error: null };
}

// Helper to check organization ownership
export function verifyOrganizationAccess(
  user: AuthenticatedUser,
  entityOrgId: string
): boolean {
  return user.organizationId === entityOrgId;
}
