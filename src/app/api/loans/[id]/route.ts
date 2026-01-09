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
      .eq('organization_id', user.organization_id)
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
    const supabase = await createClient();
    const body = await request.json();

    // Get user's org_id
    const { data: userData } = await supabase
      .from('users')
      .select('id, organization_id')
      .eq('clerk_id', userId)
      .single();

    const user = asUserWithOrg(userData);
    if (!user) return errorResponse('NOT_FOUND', 'User not found', 404);

    // Get current loan for audit
    const { data: currentLoan } = await supabase
      .from('loans')
      .select('*')
      .eq('id', id)
      .eq('organization_id', user.organization_id)
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
      .eq('organization_id', user.organization_id)
      .select(`
        *,
        borrowers (id, name, industry)
      `)
      .single();

    if (error) throw error;

    // Log audit
    await supabase.from('audit_logs').insert({
      organization_id: user.organization_id,
      user_id: user.id,
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
      .from('loans')
      .update({ deleted_at: new Date().toISOString() } as never)
      .eq('id', id)
      .eq('organization_id', user.organization_id);

    if (error) throw error;

    // Log audit
    await supabase.from('audit_logs').insert({
      organization_id: user.organization_id,
      user_id: user.id,
      action: 'delete',
      entity_type: 'loan',
      entity_id: id,
    } as never);

    return successResponse({ deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}
