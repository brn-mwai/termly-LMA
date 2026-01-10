import { auth } from '@clerk/nextjs/server';
import { createClient } from '@/lib/supabase/server';
import { successResponse, errorResponse, handleApiError, asUserWithOrg } from '@/lib/utils/api';

// Create a new covenant
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

    // Validate required fields
    const { loan_id, name, type, operator, threshold, testing_frequency } = body;
    if (!loan_id || !name || !type || !operator || threshold === undefined) {
      return errorResponse('VALIDATION_ERROR', 'Missing required fields', 400);
    }

    // Verify loan belongs to user's org
    const { data: loan } = await supabase
      .from('loans')
      .select('id')
      .eq('id', loan_id)
      .eq('organization_id', user.organization_id)
      .is('deleted_at', null)
      .single();

    if (!loan) return errorResponse('NOT_FOUND', 'Loan not found', 404);

    // Create covenant
    const { data: covenantRaw, error } = await supabase
      .from('covenants')
      .insert({
        loan_id,
        name,
        type,
        operator,
        threshold,
        testing_frequency: testing_frequency || 'quarterly',
        ebitda_definition: body.ebitda_definition,
        grace_period_days: body.grace_period_days || 0,
        metadata: body.metadata || {},
      } as never)
      .select()
      .single();

    if (error) throw error;

    const covenant = covenantRaw as { id: string } & Record<string, unknown>;

    // Log audit
    await supabase.from('audit_logs').insert({
      organization_id: user.organization_id,
      user_id: user.id,
      action: 'create',
      entity_type: 'covenant',
      entity_id: covenant.id,
      changes: { covenant },
    } as never);

    return successResponse(covenant, undefined, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
