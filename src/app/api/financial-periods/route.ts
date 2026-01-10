import { auth } from '@clerk/nextjs/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { successResponse, errorResponse, handleApiError } from '@/lib/utils/api';

// Get financial periods for a loan
export async function GET(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return errorResponse('UNAUTHORIZED', 'Authentication required', 401);

    const { searchParams } = new URL(request.url);
    const loanId = searchParams.get('loan_id');

    if (!loanId) {
      return errorResponse('VALIDATION_ERROR', 'loan_id is required', 400);
    }

    const supabase = createAdminClient();

    const { data: userData } = await supabase
      .from('users')
      .select('organization_id')
      .eq('clerk_id', userId)
      .is('deleted_at', null)
      .single();

    if (!userData?.organization_id) return errorResponse('NOT_FOUND', 'User not found', 404);
    const orgId = userData.organization_id;

    // Verify loan belongs to user's org
    const { data: loan } = await supabase
      .from('loans')
      .select('id')
      .eq('id', loanId)
      .eq('organization_id', orgId)
      .is('deleted_at', null)
      .single();

    if (!loan) return errorResponse('NOT_FOUND', 'Loan not found', 404);

    const { data: periods, error } = await supabase
      .from('financial_periods')
      .select('*')
      .eq('loan_id', loanId)
      .order('period_end_date', { ascending: false });

    if (error) throw error;

    return successResponse(periods);
  } catch (error) {
    return handleApiError(error);
  }
}

// Create a new financial period
export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return errorResponse('UNAUTHORIZED', 'Authentication required', 401);

    const supabase = createAdminClient();
    const body = await request.json();

    const { data: userData } = await supabase
      .from('users')
      .select('id, organization_id')
      .eq('clerk_id', userId)
      .is('deleted_at', null)
      .single();

    if (!userData?.organization_id) return errorResponse('NOT_FOUND', 'User not found', 404);
    const orgId = userData.organization_id;

    // Validate required fields
    const { loan_id, period_end_date, period_type } = body;
    if (!loan_id || !period_end_date || !period_type) {
      return errorResponse('VALIDATION_ERROR', 'Missing required fields: loan_id, period_end_date, period_type', 400);
    }

    // Verify loan belongs to user's org
    const { data: loan } = await supabase
      .from('loans')
      .select('id')
      .eq('id', loan_id)
      .eq('organization_id', orgId)
      .is('deleted_at', null)
      .single();

    if (!loan) return errorResponse('NOT_FOUND', 'Loan not found', 404);

    // Create financial period
    const { data: periodRaw, error } = await supabase
      .from('financial_periods')
      .insert({
        loan_id,
        period_end_date,
        period_type,
        revenue: body.revenue,
        ebitda_reported: body.ebitda_reported,
        ebitda_adjusted: body.ebitda_adjusted,
        total_debt: body.total_debt,
        interest_expense: body.interest_expense,
        fixed_charges: body.fixed_charges,
        current_assets: body.current_assets,
        current_liabilities: body.current_liabilities,
        net_worth: body.net_worth,
        verified: false,
      } as never)
      .select()
      .single();

    if (error) throw error;

    const period = periodRaw as { id: string } & Record<string, unknown>;

    // Log audit
    await supabase.from('audit_logs').insert({
      organization_id: orgId,
      user_id: userData.id,
      action: 'create',
      entity_type: 'financial_period',
      entity_id: period.id,
      changes: { period },
    } as never);

    return successResponse(period, undefined, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
