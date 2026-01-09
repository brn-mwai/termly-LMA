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

    const { data: document, error } = await supabase
      .from('documents')
      .select(`
        *,
        loans (id, name, borrowers (name))
      `)
      .eq('id', id)
      .eq('organization_id', user.organization_id)
      .is('deleted_at', null)
      .single();

    if (error) throw error;
    if (!document) return errorResponse('NOT_FOUND', 'Document not found', 404);

    return successResponse(document);
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

    // Get user's org_id
    const { data: userData } = await supabase
      .from('users')
      .select('id, organization_id')
      .eq('clerk_id', userId)
      .single();

    const user = asUserWithOrg(userData);
    if (!user) return errorResponse('NOT_FOUND', 'User not found', 404);

    // Soft delete
    const { error } = await supabase
      .from('documents')
      .update({ deleted_at: new Date().toISOString() } as never)
      .eq('id', id)
      .eq('organization_id', user.organization_id);

    if (error) throw error;

    // Log audit
    await supabase.from('audit_logs').insert({
      organization_id: user.organization_id,
      user_id: user.id,
      action: 'delete',
      entity_type: 'document',
      entity_id: id,
    } as never);

    return successResponse({ deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}
