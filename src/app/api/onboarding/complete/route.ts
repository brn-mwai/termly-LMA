import { auth } from '@clerk/nextjs/server';
import { createClient } from '@/lib/supabase/server';
import { successResponse, errorResponse, handleApiError } from '@/lib/utils/api';
import { sendWelcomeEmail } from '@/lib/email/service';

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return errorResponse('UNAUTHORIZED', 'Authentication required', 401);
    }

    const supabase = await createClient();
    const body = await request.json();

    // Get user's organization and full details
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, email, full_name, organization_id')
      .eq('clerk_id', userId)
      .single();

    if (userError || !userData) {
      return errorResponse('NOT_FOUND', 'User not found', 404);
    }

    const user = userData as { id: string; email: string; full_name: string | null; organization_id: string };

    // Get organization name
    const { data: orgData } = await supabase
      .from('organizations')
      .select('name')
      .eq('id', user.organization_id)
      .single();

    const org = orgData as { name: string } | null;
    let organizationName = org?.name || 'Your Organization';

    // Update organization name if provided
    if (body.organizationName) {
      organizationName = body.organizationName;
      await supabase
        .from('organizations')
        .update({
          name: body.organizationName,
          updated_at: new Date().toISOString(),
        } as never)
        .eq('id', user.organization_id);
    }

    // Mark onboarding as complete
    const { error: updateError } = await supabase
      .from('users')
      .update({
        onboarding_completed: true,
        onboarding_completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as never)
      .eq('clerk_id', userId);

    if (updateError) {
      console.error('Failed to complete onboarding:', updateError);
      return errorResponse('UPDATE_FAILED', 'Failed to complete onboarding', 500);
    }

    // Send welcome email
    const userName = user.full_name || user.email.split('@')[0];
    sendWelcomeEmail(user.email, {
      userName,
      organizationName,
    }).catch((err) => {
      console.error('Failed to send welcome email:', err);
    });

    return successResponse({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
