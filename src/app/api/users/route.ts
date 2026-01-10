import { createClient } from '@/lib/supabase/server';
import { successResponse, errorResponse, handleApiError } from '@/lib/utils/api';
import { requirePermission } from '@/lib/auth/api-auth';
import { isValidRole, canAssignRole, Role } from '@/lib/auth/roles';
import { sendUserInvitationEmail } from '@/lib/email/service';

// Get users in organization
export async function GET() {
  try {
    const { user, error } = await requirePermission('users:read');
    if (error) return error;

    const supabase = await createClient();

    const { data: users, error: dbError } = await supabase
      .from('users')
      .select('id, clerk_id, email, full_name, role, created_at, updated_at')
      .eq('organization_id', user!.organizationId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (dbError) throw dbError;

    return successResponse(users);
  } catch (error) {
    return handleApiError(error);
  }
}

// Invite a new user (creates a placeholder or sends invitation)
export async function POST(request: Request) {
  try {
    const { user, error } = await requirePermission('users:invite');
    if (error) return error;

    const body = await request.json();
    const { email, role = 'analyst', fullName } = body;

    if (!email) {
      return errorResponse('VALIDATION_ERROR', 'Email is required', 400);
    }

    if (!isValidRole(role)) {
      return errorResponse('VALIDATION_ERROR', 'Invalid role specified', 400);
    }

    // Check if current user can assign this role
    if (!canAssignRole(user!.role, role as Role)) {
      return errorResponse('FORBIDDEN', 'You cannot assign a role higher than your own', 403);
    }

    const supabase = await createClient();

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .eq('organization_id', user!.organizationId)
      .single();

    if (existingUser) {
      return errorResponse('DUPLICATE', 'User with this email already exists in your organization', 409);
    }

    // Create a pending invitation record
    // In a real system, this would also send an email invitation
    const { data: newUserRaw, error: createError } = await supabase
      .from('users')
      .insert({
        email,
        role,
        full_name: fullName,
        organization_id: user!.organizationId,
        clerk_id: `pending_${Date.now()}_${Math.random().toString(36).slice(2)}`, // Temporary ID
      } as never)
      .select()
      .single();

    if (createError) throw createError;

    const newUser = newUserRaw as { id: string } & Record<string, unknown>;

    // Log audit
    await supabase.from('audit_logs').insert({
      organization_id: user!.organizationId,
      user_id: user!.id,
      action: 'invite',
      entity_type: 'user',
      entity_id: newUser.id,
      changes: { email, role },
    } as never);

    // Get organization name for email
    const { data: orgData } = await supabase
      .from('organizations')
      .select('name')
      .eq('id', user!.organizationId)
      .single();

    const org = orgData as { name: string } | null;

    // Send invitation email
    sendUserInvitationEmail(email, {
      inviterName: user!.fullName || user!.email.split('@')[0],
      organizationName: org?.name || 'Your Organization',
      role,
    }).catch((err) => {
      console.error('Failed to send invitation email:', err);
    });

    return successResponse({
      ...newUser,
      status: 'pending_invitation',
    }, undefined, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
