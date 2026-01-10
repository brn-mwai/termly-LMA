import { auth, currentUser } from '@clerk/nextjs/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { successResponse, errorResponse, handleApiError } from '@/lib/utils/api';
import { sendWelcomeEmail } from '@/lib/email/service';

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return errorResponse('UNAUTHORIZED', 'Authentication required', 401);
    }

    const supabase = await createClient();
    const adminSupabase = createAdminClient();
    const body = await request.json();

    // Get user's organization and full details
    const { data: existingUser, error: userError } = await supabase
      .from('users')
      .select('id, email, full_name, organization_id')
      .eq('clerk_id', userId)
      .single();

    let userData = existingUser as { id: string; email: string; full_name: string | null; organization_id: string } | null;

    // If user doesn't exist, create them (fallback for failed webhook)
    if (userError || !userData) {
      console.log('User not found in Supabase, creating via fallback...');
      const clerkUser = await currentUser();
      if (!clerkUser) {
        console.error('No Clerk user found');
        return errorResponse('NOT_FOUND', 'User not found', 404);
      }

      const primaryEmail = clerkUser.emailAddresses[0]?.emailAddress;
      if (!primaryEmail) {
        console.error('No email found for Clerk user');
        return errorResponse('NO_EMAIL', 'No email address found', 400);
      }

      const fullName = [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(' ') || null;
      console.log(`Creating user: ${primaryEmail}`);

      // Create or get organization
      const emailDomain = primaryEmail?.split('@')[1] || 'default';
      const orgSlug = emailDomain.replace(/\./g, '-');

      let orgId: string;

      const { data: existingOrg } = await adminSupabase
        .from('organizations')
        .select('id')
        .eq('slug', orgSlug)
        .single();

      if (existingOrg) {
        orgId = existingOrg.id;
        console.log(`Using existing org: ${orgId}`);
      } else {
        console.log(`Creating new org with slug: ${orgSlug}`);
        const { data: newOrg, error: orgError } = await adminSupabase
          .from('organizations')
          .insert({
            name: body.organizationName || emailDomain,
            slug: orgSlug,
          })
          .select('id')
          .single();

        if (orgError) {
          console.error('Failed to create organization:', JSON.stringify(orgError));
          return errorResponse('ORG_CREATE_FAILED', `Failed to create organization: ${orgError.message}`, 500);
        }
        if (!newOrg) {
          console.error('No organization returned after insert');
          return errorResponse('ORG_CREATE_FAILED', 'Organization was not created', 500);
        }
        orgId = newOrg.id;
        console.log(`Created org: ${orgId}`);
      }

      // Create user
      console.log(`Creating user with clerk_id: ${userId}, org_id: ${orgId}`);
      const { data: newUser, error: createError } = await adminSupabase
        .from('users')
        .insert({
          clerk_id: userId,
          email: primaryEmail,
          full_name: fullName,
          organization_id: orgId,
          role: 'analyst',
        })
        .select('id, email, full_name, organization_id')
        .single();

      if (createError) {
        console.error('Failed to create user:', JSON.stringify(createError));
        return errorResponse('USER_CREATE_FAILED', `Failed to create user: ${createError.message}`, 500);
      }
      if (!newUser) {
        console.error('No user returned after insert');
        return errorResponse('USER_CREATE_FAILED', 'User was not created', 500);
      }

      userData = newUser as { id: string; email: string; full_name: string | null; organization_id: string };
      console.log(`User created via onboarding fallback: ${userId}`);
    }

    if (!userData) {
      return errorResponse('NOT_FOUND', 'User not found', 404);
    }

    const user = userData;

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
    if (user.email) {
      const userName = user.full_name || user.email.split('@')[0];
      sendWelcomeEmail(user.email, {
        userName,
        organizationName,
      }).catch((err) => {
        console.error('Failed to send welcome email:', err);
      });
    }

    return successResponse({ success: true });
  } catch (error) {
    console.error('Onboarding complete error:', error);
    return handleApiError(error);
  }
}
