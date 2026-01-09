import { auth } from '@clerk/nextjs/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { successResponse, errorResponse, handleApiError, parseSearchParams, asUserWithOrg } from '@/lib/utils/api';

export async function GET(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return errorResponse('UNAUTHORIZED', 'Authentication required', 401);

    const supabase = await createClient();
    const { page, limit, search, status } = parseSearchParams(request.url);
    const { searchParams } = new URL(request.url);
    const loanId = searchParams.get('loan_id');

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
      .from('documents')
      .select(`
        *,
        loans (id, name, borrowers (name))
      `, { count: 'exact' })
      .eq('organization_id', user.organization_id)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (loanId) {
      query = query.eq('loan_id', loanId);
    }

    if (search) {
      query = query.ilike('name', `%${search}%`);
    }

    if (status) {
      query = query.eq('extraction_status', status);
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

    const supabase = await createClient();
    const adminClient = createAdminClient();

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const loanId = formData.get('loan_id') as string;
    const documentType = formData.get('document_type') as string;

    if (!file) return errorResponse('BAD_REQUEST', 'File is required', 400);
    if (!loanId) return errorResponse('BAD_REQUEST', 'Loan ID is required', 400);
    if (!documentType) return errorResponse('BAD_REQUEST', 'Document type is required', 400);

    // Get user
    const { data: userData } = await supabase
      .from('users')
      .select('id, organization_id')
      .eq('clerk_id', userId)
      .single();

    const user = asUserWithOrg(userData);
    if (!user) return errorResponse('NOT_FOUND', 'User not found', 404);

    // Verify loan belongs to org
    const { data: loan } = await supabase
      .from('loans')
      .select('id')
      .eq('id', loanId)
      .eq('organization_id', user.organization_id)
      .single();

    if (!loan) return errorResponse('NOT_FOUND', 'Loan not found', 404);

    // Upload to storage
    const fileExt = file.name.split('.').pop();
    const fileName = `${user.organization_id}/${loanId}/${Date.now()}.${fileExt}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { error: uploadError } = await adminClient.storage
      .from('documents')
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) throw uploadError;

    // Create document record
    const { data: docData, error: docError } = await supabase
      .from('documents')
      .insert({
        organization_id: user.organization_id,
        loan_id: loanId,
        type: documentType,
        name: file.name,
        file_path: fileName,
        file_size: file.size,
        mime_type: file.type,
        extraction_status: 'pending',
        uploaded_by: user.id,
      } as never)
      .select()
      .single();

    if (docError) throw docError;

    const document = docData as { id: string } & Record<string, unknown>;

    // Log audit
    await supabase.from('audit_logs').insert({
      organization_id: user.organization_id,
      user_id: user.id,
      action: 'upload',
      entity_type: 'document',
      entity_id: document.id,
      changes: { fileName: file.name, fileSize: file.size },
    } as never);

    return successResponse(document, undefined, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
