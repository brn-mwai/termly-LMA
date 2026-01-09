import { auth } from '@clerk/nextjs/server';
import { createClient } from '@/lib/supabase/server';
import { successResponse, errorResponse, handleApiError, parseSearchParams, asUserWithOrg } from '@/lib/utils/api';

export async function GET(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return errorResponse('UNAUTHORIZED', 'Authentication required', 401);

    const supabase = await createClient();
    const { page, limit, search, status, sortBy, sortOrder } = parseSearchParams(request.url);

    // Get user's org_id
    const { data: userData } = await supabase
      .from('users')
      .select('organization_id')
      .eq('clerk_id', userId)
      .single();

    const user = asUserWithOrg(userData);
    if (!user) return errorResponse('NOT_FOUND', 'User not found', 404);

    // Build query
    let query = supabase
      .from('loans')
      .select(`
        *,
        borrowers (id, name, industry, rating),
        covenants (id, name, type, threshold)
      `, { count: 'exact' })
      .eq('organization_id', user.organization_id)
      .is('deleted_at', null);

    // Apply filters
    if (search) {
      query = query.or(`name.ilike.%${search}%,borrowers.name.ilike.%${search}%`);
    }

    if (status) {
      query = query.eq('status', status);
    }

    // Apply sorting
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });

    // Apply pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;
    if (error) throw error;

    return successResponse(data, {
      page,
      limit,
      total: count || 0,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return errorResponse('UNAUTHORIZED', 'Authentication required', 401);

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

    // First, create or find borrower
    let borrowerId = body.borrower_id;

    if (!borrowerId && body.borrower_name) {
      // Check if borrower exists
      const { data: existingBorrower } = await supabase
        .from('borrowers')
        .select('id')
        .eq('organization_id', user.organization_id)
        .eq('name', body.borrower_name)
        .single();

      if (existingBorrower) {
        borrowerId = (existingBorrower as { id: string }).id;
      } else {
        // Create new borrower
        const { data: newBorrower, error: borrowerError } = await supabase
          .from('borrowers')
          .insert({
            organization_id: user.organization_id,
            name: body.borrower_name,
            industry: body.borrower_industry,
          } as never)
          .select('id')
          .single();

        if (borrowerError) throw borrowerError;
        borrowerId = (newBorrower as { id: string }).id;
      }
    }

    // Create loan
    const { data: loanData, error: loanError } = await supabase
      .from('loans')
      .insert({
        organization_id: user.organization_id,
        borrower_id: borrowerId,
        name: body.name,
        facility_type: body.facility_type,
        commitment_amount: body.commitment_amount,
        outstanding_amount: body.outstanding_amount || 0,
        currency: body.currency || 'USD',
        origination_date: body.origination_date,
        maturity_date: body.maturity_date,
        interest_rate: body.interest_rate,
        interest_rate_type: body.interest_rate_type,
        status: body.status || 'active',
        metadata: body.metadata || {},
      } as never)
      .select(`
        *,
        borrowers (id, name, industry)
      `)
      .single();

    if (loanError) throw loanError;

    const loan = loanData as { id: string } & Record<string, unknown>;

    // Log audit
    await supabase.from('audit_logs').insert({
      organization_id: user.organization_id,
      user_id: user.id,
      action: 'create',
      entity_type: 'loan',
      entity_id: loan.id,
      changes: { loan },
    } as never);

    return successResponse(loan, undefined, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
