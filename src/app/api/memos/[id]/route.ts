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

    const { data: memo, error } = await supabase
      .from('memos')
      .select(`
        *,
        loans (id, name, borrowers (name, industry)),
        users:created_by (full_name, email)
      `)
      .eq('id', id)
      .eq('organization_id', user.organization_id)
      .is('deleted_at', null)
      .single();

    if (error) throw error;
    if (!memo) return errorResponse('NOT_FOUND', 'Memo not found', 404);

    return successResponse(memo);
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

    // Update memo
    const { data: memo, error } = await supabase
      .from('memos')
      .update({
        title: body.title,
        content: body.content,
        updated_at: new Date().toISOString(),
      } as never)
      .eq('id', id)
      .eq('organization_id', user.organization_id)
      .select()
      .single();

    if (error) throw error;

    // Log audit
    await supabase.from('audit_logs').insert({
      organization_id: user.organization_id,
      user_id: user.id,
      action: 'update',
      entity_type: 'memo',
      entity_id: id,
    } as never);

    return successResponse(memo);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) return errorResponse('UNAUTHORIZED', 'Authentication required', 401);

    const { id } = await params;
    const supabase = await createClient();

    // Get user
    const { data: userData } = await supabase
      .from('users')
      .select('id, organization_id')
      .eq('clerk_id', userId)
      .single();

    const user = asUserWithOrg(userData);
    if (!user) return errorResponse('NOT_FOUND', 'User not found', 404);

    // Soft delete
    const { error } = await supabase
      .from('memos')
      .update({ deleted_at: new Date().toISOString() } as never)
      .eq('id', id)
      .eq('organization_id', user.organization_id);

    if (error) throw error;

    // Log audit
    await supabase.from('audit_logs').insert({
      organization_id: user.organization_id,
      user_id: user.id,
      action: 'delete',
      entity_type: 'memo',
      entity_id: id,
    } as never);

    return successResponse({ deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}
