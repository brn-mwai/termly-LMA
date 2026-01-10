import { auth } from '@clerk/nextjs/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { successResponse, errorResponse, handleApiError, parseSearchParams } from '@/lib/utils/api';

export async function GET(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return errorResponse('UNAUTHORIZED', 'Authentication required', 401);

    const supabase = createAdminClient();
    const { page, limit } = parseSearchParams(request.url);
    const { searchParams } = new URL(request.url);
    const severity = searchParams.get('severity');
    const acknowledged = searchParams.get('acknowledged');

    // Get user's org_id
    const { data: userData } = await supabase
      .from('users')
      .select('organization_id')
      .eq('clerk_id', userId)
      .is('deleted_at', null)
      .single();

    if (!userData?.organization_id) return errorResponse('NOT_FOUND', 'User not found', 404);
    const orgId = userData.organization_id;

    // Build query
    let query = supabase
      .from('alerts')
      .select(`
        *,
        loans (id, name, borrowers (name)),
        covenants (id, name, type)
      `, { count: 'exact' })
      .eq('organization_id', orgId)
      .order('created_at', { ascending: false });

    if (severity) {
      query = query.eq('severity', severity);
    }

    if (acknowledged !== null) {
      query = query.eq('acknowledged', acknowledged === 'true');
    }

    // Pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;
    if (error) throw error;

    return successResponse(data, { page, limit, total: count || 0 });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return errorResponse('UNAUTHORIZED', 'Authentication required', 401);

    const supabase = createAdminClient();
    const body = await request.json();

    // Get user
    const { data: userData } = await supabase
      .from('users')
      .select('id, organization_id')
      .eq('clerk_id', userId)
      .is('deleted_at', null)
      .single();

    if (!userData?.organization_id) return errorResponse('NOT_FOUND', 'User not found', 404);
    const orgId = userData.organization_id;
    const dbUserId = userData.id;

    // Create alert
    const { data: alertData, error } = await supabase
      .from('alerts')
      .insert({
        organization_id: orgId,
        loan_id: body.loan_id,
        covenant_id: body.covenant_id,
        covenant_test_id: body.covenant_test_id,
        severity: body.severity,
        title: body.title,
        message: body.message,
        acknowledged: false,
      } as never)
      .select()
      .single();

    if (error) throw error;

    const alert = alertData as { id: string } & Record<string, unknown>;

    // Log audit
    await supabase.from('audit_logs').insert({
      organization_id: orgId,
      user_id: dbUserId,
      action: 'create',
      entity_type: 'alert',
      entity_id: alert.id,
    } as never);

    return successResponse(alert, undefined, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
