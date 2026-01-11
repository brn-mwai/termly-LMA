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

    // Get document with org check
    const { data: documentRaw, error: docError } = await supabase
      .from('documents')
      .select('id, name, file_path, mime_type, organization_id')
      .eq('id', id)
      .eq('organization_id', orgId)
      .is('deleted_at', null)
      .single();

    if (docError || !documentRaw) {
      return errorResponse('NOT_FOUND', 'Document not found', 404);
    }

    const document = documentRaw as {
      id: string;
      name: string;
      file_path: string;
      mime_type: string;
      organization_id: string;
    };

    // Check if this is a demo document (served from public folder)
    if (document.file_path.startsWith('demo:')) {
      const demoFileName = document.file_path.replace('demo:', '');
      const baseUrl = request.headers.get('origin') || request.headers.get('host') || '';
      const protocol = baseUrl.startsWith('localhost') ? 'http' : 'https';
      const publicUrl = baseUrl.startsWith('http')
        ? `${baseUrl}/demo-docs/${demoFileName}`
        : `${protocol}://${baseUrl}/demo-docs/${demoFileName}`;

      return successResponse({
        url: publicUrl,
        name: document.name,
        mimeType: document.mime_type,
      });
    }

    // Generate signed URL for the document (valid for 1 hour)
    const { data: signedUrlData, error: signedUrlError } = await supabase
      .storage
      .from('documents')
      .createSignedUrl(document.file_path, 3600);

    if (signedUrlError || !signedUrlData?.signedUrl) {
      console.error('Signed URL error:', signedUrlError);
      return errorResponse('STORAGE_ERROR', 'Could not generate document URL', 500);
    }

    return successResponse({
      url: signedUrlData.signedUrl,
      name: document.name,
      mimeType: document.mime_type,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
