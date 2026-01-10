import { auth } from '@clerk/nextjs/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { successResponse, errorResponse, handleApiError } from '@/lib/utils/api';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) return errorResponse('UNAUTHORIZED', 'Authentication required', 401);

    const { id } = await params;
    const supabase = createAdminClient();

    // Get user's org_id
    const { data: userData } = await supabase
      .from('users')
      .select('organization_id')
      .eq('clerk_id', userId)
      .is('deleted_at', null)
      .single();

    if (!userData?.organization_id) return errorResponse('NOT_FOUND', 'User not found', 404);
    const orgId = userData.organization_id;

    const { data: loan, error } = await supabase
      .from('loans')
      .select(`
        *,
        borrowers (id, name, industry, rating),
        covenants (
          id, name, type, operator, threshold, testing_frequency,
          covenant_tests (id, calculated_value, threshold_at_test, status, headroom_percentage, tested_at)
        ),
        documents (id, name, type, extraction_status, created_at),
        financial_periods (id, period_end_date, period_type, revenue, ebitda_adjusted, total_debt, interest_expense)
      `)
      .eq('id', id)
      .eq('organization_id', orgId)
      .is('deleted_at', null)
      .single();

    if (error) throw error;
    if (!loan) return errorResponse('NOT_FOUND', 'Loan not found', 404);

    return successResponse(loan);
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
    const supabase = createAdminClient();
    const body = await request.json();

    // Get user's org_id
    const { data: userData } = await supabase
      .from('users')
      .select('id, organization_id')
      .eq('clerk_id', userId)
      .is('deleted_at', null)
      .single();

    if (!userData?.organization_id) return errorResponse('NOT_FOUND', 'User not found', 404);
    const orgId = userData.organization_id;

    // Get current loan for audit
    const { data: currentLoan } = await supabase
      .from('loans')
      .select('*')
      .eq('id', id)
      .eq('organization_id', orgId)
      .single();

    if (!currentLoan) return errorResponse('NOT_FOUND', 'Loan not found', 404);

    // Update loan
    const { data: loan, error } = await supabase
      .from('loans')
      .update({
        ...body,
        updated_at: new Date().toISOString(),
      } as never)
      .eq('id', id)
      .eq('organization_id', orgId)
      .select(`
        *,
        borrowers (id, name, industry)
      `)
      .single();

    if (error) throw error;

    // Log audit
    await supabase.from('audit_logs').insert({
      organization_id: orgId,
      user_id: userData.id,
      action: 'update',
      entity_type: 'loan',
      entity_id: id,
      changes: { before: currentLoan, after: loan },
    } as never);

    return successResponse(loan);
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
    const supabase = createAdminClient();

    // Get user's org_id
    const { data: userData } = await supabase
      .from('users')
      .select('id, organization_id')
      .eq('clerk_id', userId)
      .is('deleted_at', null)
      .single();

    if (!userData?.organization_id) return errorResponse('NOT_FOUND', 'User not found', 404);
    const orgId = userData.organization_id;

    // Soft delete
    const { error } = await supabase
      .from('loans')
      .update({ deleted_at: new Date().toISOString() } as never)
      .eq('id', id)
      .eq('organization_id', orgId);

    if (error) throw error;

    // Log audit
    await supabase.from('audit_logs').insert({
      organization_id: orgId,
      user_id: userData.id,
      action: 'delete',
      entity_type: 'loan',
      entity_id: id,
    } as never);

    return successResponse({ deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}
