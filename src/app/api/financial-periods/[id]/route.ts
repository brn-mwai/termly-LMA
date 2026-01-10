import { auth } from '@clerk/nextjs/server';
import { createClient } from '@/lib/supabase/server';
import { successResponse, errorResponse, handleApiError, asUserWithOrg } from '@/lib/utils/api';

// Get single financial period
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

    const { data: period, error } = await supabase
      .from('financial_periods')
      .select(`
        *,
        loans!inner (organization_id)
      `)
      .eq('id', id)
      .eq('loans.organization_id', user.organization_id)
      .single();

    if (error) throw error;
    if (!period) return errorResponse('NOT_FOUND', 'Financial period not found', 404);

    return successResponse(period);
  } catch (error) {
    return handleApiError(error);
  }
}

// Update financial period
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

    // Get current period with org check
    const { data: currentPeriod } = await supabase
      .from('financial_periods')
      .select(`
        *,
        loans!inner (organization_id)
      `)
      .eq('id', id)
      .eq('loans.organization_id', user.organization_id)
      .single();

    if (!currentPeriod) return errorResponse('NOT_FOUND', 'Financial period not found', 404);

    // Only allow updating certain fields
    const allowedFields = [
      'period_end_date', 'period_type', 'revenue', 'ebitda_reported',
      'ebitda_adjusted', 'total_debt', 'interest_expense', 'fixed_charges',
      'current_assets', 'current_liabilities', 'net_worth', 'verified'
    ];
    const updates: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updates[field] = body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return errorResponse('VALIDATION_ERROR', 'No valid fields to update', 400);
    }

    // If marking as verified, add verifier info
    if (updates.verified === true) {
      updates.verified_by = user.id;
      updates.verified_at = new Date().toISOString();
    }

    const { data: period, error } = await supabase
      .from('financial_periods')
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
      entity_type: 'financial_period',
      entity_id: id,
      changes: { before: currentPeriod, after: period },
    } as never);

    return successResponse(period);
  } catch (error) {
    return handleApiError(error);
  }
}

// Delete financial period
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

    // Verify period belongs to user's org
    const { data: period } = await supabase
      .from('financial_periods')
      .select(`
        id,
        loans!inner (organization_id)
      `)
      .eq('id', id)
      .eq('loans.organization_id', user.organization_id)
      .single();

    if (!period) return errorResponse('NOT_FOUND', 'Financial period not found', 404);

    // Hard delete (financial periods don't have soft delete)
    const { error } = await supabase
      .from('financial_periods')
      .delete()
      .eq('id', id);

    if (error) throw error;

    // Log audit
    await supabase.from('audit_logs').insert({
      organization_id: user.organization_id,
      user_id: user.id,
      action: 'delete',
      entity_type: 'financial_period',
      entity_id: id,
    } as never);

    return successResponse({ deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}
