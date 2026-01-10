import { auth } from '@clerk/nextjs/server';
import { createClient } from '@/lib/supabase/server';
import { successResponse, errorResponse, handleApiError } from '@/lib/utils/api';

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return errorResponse('UNAUTHORIZED', 'Authentication required', 401);
    }

    const supabase = await createClient();

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

      const fallback = fallbackData as {
        id: string;
        organizations: { name: string } | null;
      };

      return successResponse({
        onboarding_completed: false, // Assume not completed if column doesn't exist
        organization_name: fallback.organizations?.name || null,
      });
    }

    const user = userData as {
      id: string;
      onboarding_completed: boolean | null;
      organizations: { name: string } | null;
    };

    return successResponse({
      onboarding_completed: user.onboarding_completed === true,
      organization_name: user.organizations?.name || null,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
