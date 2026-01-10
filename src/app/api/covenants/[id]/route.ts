import { auth } from '@clerk/nextjs/server';
import { createClient } from '@/lib/supabase/server';
import { successResponse, errorResponse, handleApiError, asUserWithOrg } from '@/lib/utils/api';

// Get single covenant
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) return errorResponse('UNAUTHORIZED', 'Authentication required', 401);

    const { id } = await params;
    const supabase = await createClient();

    const { data: userData } = await supabase
      .from('users')
      .select('organization_id')
      .eq('clerk_id', userId)
      .single();

    const user = asUserWithOrg(userData);
    if (!user) return errorResponse('NOT_FOUND', 'User not found', 404);

    const { data: covenant, error } = await supabase
      .from('covenants')
      .select(`
        *,
        loans!inner (organization_id),
        covenant_tests (
          id, calculated_value, threshold_at_test, status,
          headroom_percentage, tested_at
        )
      `)
      .eq('id', id)
      .eq('loans.organization_id', user.organization_id)
      .is('deleted_at', null)
      .single();

    if (error) throw error;
    if (!covenant) return errorResponse('NOT_FOUND', 'Covenant not found', 404);

    return successResponse(covenant);
  } catch (error) {
    return handleApiError(error);
  }
}

// Update covenant
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

    const { data: userData } = await supabase
      .from('users')
      .select('id, organization_id')
      .eq('clerk_id', userId)
      .single();

    const user = asUserWithOrg(userData);
    if (!user) return errorResponse('NOT_FOUND', 'User not found', 404);

    // Get current covenant with org check
    const { data: currentCovenant } = await supabase
      .from('covenants')
      .select(`
        *,
        loans!inner (organization_id)
      `)
      .eq('id', id)
      .eq('loans.organization_id', user.organization_id)
      .is('deleted_at', null)
      .single();

    if (!currentCovenant) return errorResponse('NOT_FOUND', 'Covenant not found', 404);

    // Only allow updating certain fields
    const allowedFields = ['name', 'threshold', 'operator', 'testing_frequency', 'ebitda_definition', 'grace_period_days'];
    const updates: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updates[field] = body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return errorResponse('VALIDATION_ERROR', 'No valid fields to update', 400);
    }

    const { data: covenant, error } = await supabase
      .from('covenants')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      } as never)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Log audit
    await supabase.from('audit_logs').insert({
      organization_id: user.organization_id,
      user_id: user.id,
      action: 'update',
      entity_type: 'covenant',
      entity_id: id,
      changes: { before: currentCovenant, after: covenant },
    } as never);

    return successResponse(covenant);
  } catch (error) {
    return handleApiError(error);
  }
}

// Delete covenant (soft delete)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) return errorResponse('UNAUTHORIZED', 'Authentication required', 401);

    const { id } = await params;
    const supabase = await createClient();

    const { data: userData } = await supabase
      .from('users')
      .select('id, organization_id')
      .eq('clerk_id', userId)
      .single();

    const user = asUserWithOrg(userData);
    if (!user) return errorResponse('NOT_FOUND', 'User not found', 404);

    // Verify covenant belongs to user's org
    const { data: covenant } = await supabase
      .from('covenants')
      .select(`
        id,
        loans!inner (organization_id)
      `)
      .eq('id', id)
      .eq('loans.organization_id', user.organization_id)
      .is('deleted_at', null)
      .single();

    if (!covenant) return errorResponse('NOT_FOUND', 'Covenant not found', 404);

    // Soft delete
    const { error } = await supabase
      .from('covenants')
      .update({ deleted_at: new Date().toISOString() } as never)
      .eq('id', id);

    if (error) throw error;

    // Log audit
    await supabase.from('audit_logs').insert({
      organization_id: user.organization_id,
      user_id: user.id,
      action: 'delete',
      entity_type: 'covenant',
      entity_id: id,
    } as never);

    return successResponse({ deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}
