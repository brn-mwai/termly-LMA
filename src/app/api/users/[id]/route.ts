import { createAdminClient } from '@/lib/supabase/admin';
import { successResponse, errorResponse, handleApiError } from '@/lib/utils/api';
import { requirePermission } from '@/lib/auth/api-auth';
import { isValidRole, canAssignRole, Role } from '@/lib/auth/roles';

// Get single user
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, error } = await requirePermission('users:read');
    if (error) return error;

    const { id } = await params;
    const supabase = createAdminClient();

    const { data: targetUser, error: dbError } = await supabase
      .from('users')
      .select('id, clerk_id, email, full_name, role, created_at, updated_at')
      .eq('id', id)
      .eq('organization_id', user!.organizationId)
      .is('deleted_at', null)
      .single();

    if (dbError || !targetUser) {
      return errorResponse('NOT_FOUND', 'User not found', 404);
    }

    return successResponse(targetUser);
  } catch (error) {
    return handleApiError(error);
  }
}

// Update user (mainly for role changes)
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, error } = await requirePermission('users:write');
    if (error) return error;

    const { id } = await params;
    const body = await request.json();
    const supabase = createAdminClient();

    // Get target user
    const { data: targetUserRaw } = await supabase
      .from('users')
      .select('id, role, email')
      .eq('id', id)
      .eq('organization_id', user!.organizationId)
      .is('deleted_at', null)
      .single();

    if (!targetUserRaw) {
      return errorResponse('NOT_FOUND', 'User not found', 404);
    }

    const targetUser = targetUserRaw as { id: string; role: string; email: string };

    // Prevent self-demotion for admins
    if (id === user!.id && body.role && body.role !== user!.role) {
      return errorResponse('FORBIDDEN', 'You cannot change your own role', 403);
    }

    // Validate role change permissions
    if (body.role) {
      if (!isValidRole(body.role)) {
        return errorResponse('VALIDATION_ERROR', 'Invalid role specified', 400);
      }
      if (!canAssignRole(user!.role, body.role as Role)) {
        return errorResponse('FORBIDDEN', 'You cannot assign a role higher than your own', 403);
      }
      // Can't demote someone with higher role than yourself
      if (!canAssignRole(user!.role, targetUser.role as Role)) {
        return errorResponse('FORBIDDEN', 'You cannot modify a user with a higher role than your own', 403);
      }
    }

    const allowedFields = ['role', 'full_name'];
    const updates: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updates[field] = body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return errorResponse('VALIDATION_ERROR', 'No valid fields to update', 400);
    }

    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      } as never)
      .eq('id', id)
      .select('id, clerk_id, email, full_name, role, created_at, updated_at')
      .single();

    if (updateError) throw updateError;

    // Log audit
    await supabase.from('audit_logs').insert({
      organization_id: user!.organizationId,
      user_id: user!.id,
      action: 'update',
      entity_type: 'user',
      entity_id: id,
      changes: { before: targetUser, after: updatedUser },
    } as never);

    return successResponse(updatedUser);
  } catch (error) {
    return handleApiError(error);
  }
}

// Remove user from organization
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, error } = await requirePermission('users:write');
    if (error) return error;

    const { id } = await params;
    const supabase = createAdminClient();

    // Can't delete yourself
    if (id === user!.id) {
      return errorResponse('FORBIDDEN', 'You cannot remove yourself from the organization', 403);
    }

    // Get target user
    const { data: targetUserDelRaw } = await supabase
      .from('users')
      .select('id, role, email')
      .eq('id', id)
      .eq('organization_id', user!.organizationId)
      .is('deleted_at', null)
      .single();

    if (!targetUserDelRaw) {
      return errorResponse('NOT_FOUND', 'User not found', 404);
    }

    const targetUserDel = targetUserDelRaw as { id: string; role: string; email: string };

    // Can't remove someone with higher or equal role (unless admin)
    if (user!.role !== 'admin' && !canAssignRole(user!.role, targetUserDel.role as Role)) {
      return errorResponse('FORBIDDEN', 'You cannot remove a user with a higher role than your own', 403);
    }

    // Soft delete
    const { error: deleteError } = await supabase
      .from('users')
      .update({ deleted_at: new Date().toISOString() } as never)
      .eq('id', id);

    if (deleteError) throw deleteError;

    // Log audit
    await supabase.from('audit_logs').insert({
      organization_id: user!.organizationId,
      user_id: user!.id,
      action: 'delete',
      entity_type: 'user',
      entity_id: id,
      changes: { removed_user: targetUserDel.email },
    } as never);

    return successResponse({ deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}
