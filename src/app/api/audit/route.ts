import { auth } from '@clerk/nextjs/server';
import { createClient } from '@/lib/supabase/server';
import { successResponse, errorResponse, handleApiError, parseSearchParams, asUserWithOrg } from '@/lib/utils/api';

export async function GET(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return errorResponse('UNAUTHORIZED', 'Authentication required', 401);

    const supabase = await createClient();
    const { page, limit } = parseSearchParams(request.url);
    const { searchParams } = new URL(request.url);
    const entityType = searchParams.get('entity_type');
    const entityId = searchParams.get('entity_id');
    const action = searchParams.get('action');

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
      .from('audit_logs')
      .select(`
        *,
        users:user_id (full_name, email)
      `, { count: 'exact' })
      .eq('organization_id', user.organization_id)
      .order('created_at', { ascending: false });

    if (entityType) {
      query = query.eq('entity_type', entityType);
    }

    if (entityId) {
      query = query.eq('entity_id', entityId);
    }

    if (action) {
      query = query.eq('action', action);
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
