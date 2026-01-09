import { auth } from '@clerk/nextjs/server';
import { createClient } from '@/lib/supabase/server';
import { successResponse, errorResponse, handleApiError, asUserWithOrg } from '@/lib/utils/api';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) return errorResponse('UNAUTHORIZED', 'Authentication required', 401);

    const { id } = await params;
    const supabase = await createClient();

    // Get user's org_id
    const { data: userData } = await supabase
      .from('users')
      .select('organization_id')
      .eq('clerk_id', userId)
      .single();

    const user = asUserWithOrg(userData);
    if (!user) return errorResponse('NOT_FOUND', 'User not found', 404);

    const { data: alert, error } = await supabase
      .from('alerts')
      .select(`
        *,
        loans (id, name, borrowers (name, industry)),
        covenants (id, name, type, threshold, operator),
        covenant_tests (id, calculated_value, threshold_at_test, status, headroom_percentage)
      `)
      .eq('id', id)
      .eq('organization_id', user.organization_id)
      .single();

    if (error) throw error;
    if (!alert) return errorResponse('NOT_FOUND', 'Alert not found', 404);

    return successResponse(alert);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) return errorResponse('UNAUTHORIZED', 'Authentication required', 401);

    const { id } = await params;
    const supabase = await createClient();
    const body = await request.json();

    // Get user
    const { data: userData } = await supabase
      .from('users')
      .select('id, organization_id')
      .eq('clerk_id', userId)
      .single();

    const user = asUserWithOrg(userData);
    if (!user) return errorResponse('NOT_FOUND', 'User not found', 404);

    // Prepare update
    const updateData = { ...body } as Record<string, unknown>;

    if (body.acknowledged === true) {
      updateData.acknowledged_by = user.id;
      updateData.acknowledged_at = new Date().toISOString();
    }

    // Update alert
    const { data: alert, error } = await supabase
      .from('alerts')
      .update(updateData as never)
      .eq('id', id)
      .eq('organization_id', user.organization_id)
      .select()
      .single();

    if (error) throw error;

    // Log audit
    await supabase.from('audit_logs').insert({
      organization_id: user.organization_id,
      user_id: user.id,
      action: body.acknowledged ? 'acknowledge' : 'update',
      entity_type: 'alert',
      entity_id: id,
      changes: body,
    } as never);

    return successResponse(alert);
  } catch (error) {
    return handleApiError(error);
  }
}
