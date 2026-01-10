import { auth } from '@clerk/nextjs/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { successResponse, errorResponse, handleApiError } from '@/lib/utils/api';

export async function GET() {
  try {
    // Check for required env vars
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY || !process.env.NEXT_PUBLIC_SUPABASE_URL) {
      console.error('Missing Supabase environment variables');
      return errorResponse('CONFIG_ERROR', 'Server configuration error', 500);
    }

    const { userId } = await auth();
    if (!userId) {
      return errorResponse('UNAUTHORIZED', 'Authentication required', 401);
    }

    // Use admin client to bypass RLS
    const supabase = createAdminClient();

    // Get user's onboarding status and organization
    // First try with onboarding_completed field
    const { data: userData, error } = await supabase
      .from('users')
      .select(`
        id,
        onboarding_completed,
        organization_id,
        organizations (
          name
        )
      `)
      .eq('clerk_id', userId)
      .single();

    // If column doesn't exist or other error, try without it
    if (error) {
      // Try fetching without onboarding_completed (column may not exist yet)
      const { data: fallbackData } = await supabase
        .from('users')
        .select(`
          id,
          organization_id,
          organizations (
            name
          )
        `)
        .eq('clerk_id', userId)
        .single();

      if (!fallbackData) {
        return successResponse({
          onboarding_completed: false,
          organization_name: null,
        });
      }

      // Handle both array and object formats for organizations
      const fallback = fallbackData as unknown as {
        id: string;
        organizations: { name: string } | { name: string }[] | null;
      };

      const orgName = Array.isArray(fallback.organizations)
        ? fallback.organizations[0]?.name
        : fallback.organizations?.name;

      return successResponse({
        onboarding_completed: false, // Assume not completed if column doesn't exist
        organization_name: orgName || null,
      });
    }

    // Handle both array and object formats for organizations
    const user = userData as unknown as {
      id: string;
      onboarding_completed: boolean | null;
      organizations: { name: string } | { name: string }[] | null;
    };

    const orgName = Array.isArray(user.organizations)
      ? user.organizations[0]?.name
      : user.organizations?.name;

    return successResponse({
      onboarding_completed: user.onboarding_completed === true,
      organization_name: orgName || null,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
