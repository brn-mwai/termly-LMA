import { auth } from '@clerk/nextjs/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { successResponse, errorResponse, handleApiError } from '@/lib/utils/api';

export interface OrganizationSettings {
  name: string;
  domain?: string;
}

export interface UserPreferences {
  notifications: {
    emailAlerts: boolean;
    criticalOnly: boolean;
    weeklyDigest: boolean;
  };
  regional: {
    dateFormat: string;
    currency: string;
    timezone: string;
  };
}

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) return errorResponse('UNAUTHORIZED', 'Authentication required', 401);

    const supabase = createAdminClient();

    // Get user's organization
    const { data: userData } = await supabase
      .from('users')
      .select('organization_id')
      .eq('clerk_id', userId)
      .is('deleted_at', null)
      .single();

    if (!userData?.organization_id) {
      return errorResponse('FORBIDDEN', 'User organization not found', 403);
    }
    const orgId = userData.organization_id;

    // Fetch organization details
    const { data: orgRaw, error: orgError } = await supabase
      .from('organizations')
      .select('id, name, slug')
      .eq('id', orgId)
      .single();

    if (orgError || !orgRaw) {
      return errorResponse('NOT_FOUND', 'Organization not found', 404);
    }

    const org = orgRaw as { id: string; name: string; slug: string };

    return successResponse({
      organization: {
        name: org.name,
        domain: org.slug,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return errorResponse('UNAUTHORIZED', 'Authentication required', 401);

    const supabase = createAdminClient();
    const body = await request.json();

    // Get user's organization
    const { data: userData } = await supabase
      .from('users')
      .select('organization_id')
      .eq('clerk_id', userId)
      .is('deleted_at', null)
      .single();

    if (!userData?.organization_id) {
      return errorResponse('FORBIDDEN', 'User organization not found', 403);
    }
    const orgId = userData.organization_id;

    // Update organization if provided
    if (body.organization) {
      const { name, domain } = body.organization;
      const updates: Record<string, string> = {};

      if (name) updates.name = name;
      if (domain) updates.slug = domain;

      if (Object.keys(updates).length > 0) {
        const { error: updateError } = await supabase
          .from('organizations')
          .update({
            ...updates,
            updated_at: new Date().toISOString(),
          } as never)
          .eq('id', orgId);

        if (updateError) {
          console.error('Failed to update organization:', updateError);
          return errorResponse('UPDATE_FAILED', 'Failed to update organization settings', 500);
        }
      }
    }

    return successResponse({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
