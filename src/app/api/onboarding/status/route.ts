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
    const { data: userData, error } = await supabase
      .from('users')
      .select(`
        onboarding_completed,
        organizations (
          name
        )
      `)
      .eq('clerk_id', userId)
      .single();

    if (error || !userData) {
      return successResponse({
        onboarding_completed: false,
        organization_name: null,
      });
    }

    const user = userData as {
      onboarding_completed: boolean;
      organizations: { name: string } | null;
    };

    return successResponse({
      onboarding_completed: user.onboarding_completed || false,
      organization_name: user.organizations?.name || null,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
