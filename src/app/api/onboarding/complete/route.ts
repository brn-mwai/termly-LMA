import { auth, currentUser } from '@clerk/nextjs/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { successResponse, errorResponse, handleApiError } from '@/lib/utils/api';
import { sendWelcomeEmail } from '@/lib/email/service';

export async function POST(request: Request) {
  try {
    console.log('Onboarding complete: Starting...');

    // Check environment variables first
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('SUPABASE_SERVICE_ROLE_KEY is not set');
      return errorResponse('CONFIG_ERROR', 'Server configuration error: Missing service role key', 500);
    }
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      console.error('NEXT_PUBLIC_SUPABASE_URL is not set');
      return errorResponse('CONFIG_ERROR', 'Server configuration error: Missing Supabase URL', 500);
    }

    console.log('Environment variables OK');

    const { userId } = await auth();
    console.log('Onboarding: userId =', userId);
    if (!userId) {
      return errorResponse('UNAUTHORIZED', 'Authentication required', 401);
    }

    // Use admin client to bypass RLS
    const adminSupabase = createAdminClient();
    console.log('Admin client created');

    // Parse request body
    let body: { organizationName?: string } = {};
    try {
      body = await request.json();
      console.log('Request body:', body);
    } catch (e) {
      console.log('No body or invalid JSON, using defaults');
    }

    // Get user's organization and full details (use admin client to bypass RLS)
    console.log('Looking up user with clerk_id:', userId);
    const { data: existingUser, error: userError } = await adminSupabase
      .from('users')
      .select('id, email, full_name, organization_id')
      .eq('clerk_id', userId)
      .is('deleted_at', null)
      .single();

    console.log('User lookup result:', { existingUser, userError: userError?.message });

    let userData = existingUser as { id: string; email: string; full_name: string | null; organization_id: string } | null;

    // If user doesn't exist, check if soft-deleted or create new
    if (userError || !userData) {
      // Check if user exists but was soft-deleted
      const { data: deletedUser } = await adminSupabase
        .from('users')
        .select('id, email, full_name, organization_id')
        .eq('clerk_id', userId)
        .not('deleted_at', 'is', null)
        .single();

      if (deletedUser) {
        // Reactivate soft-deleted user
        console.log('Reactivating soft-deleted user...');
        await adminSupabase
          .from('users')
          .update({ deleted_at: null, updated_at: new Date().toISOString() })
          .eq('clerk_id', userId);
        userData = deletedUser as { id: string; email: string; full_name: string | null; organization_id: string };
      } else {
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
    }

    if (!userData) {
      return errorResponse('NOT_FOUND', 'User not found', 404);
    }

    const user = userData;

    // Get organization name (use admin client to bypass RLS)
    const { data: orgData } = await adminSupabase
      .from('organizations')
      .select('name')
      .eq('id', user.organization_id)
      .single();

    const org = orgData as { name: string } | null;
    let organizationName = org?.name || 'Your Organization';

    // Update organization name if provided
    if (body.organizationName) {
      organizationName = body.organizationName;
      await adminSupabase
        .from('organizations')
        .update({
          name: body.organizationName,
          updated_at: new Date().toISOString(),
        } as never)
        .eq('id', user.organization_id);
    }

    // Mark onboarding as complete (use admin client to bypass RLS)
    const { error: updateError } = await adminSupabase
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

    console.log('Onboarding database update successful');

    // Send welcome email (non-blocking, fully wrapped in try-catch)
    try {
      if (user.email) {
        const userName = user.full_name || user.email.split('@')[0];
        console.log('Attempting to send welcome email to:', user.email);
        // Don't await - fire and forget
        sendWelcomeEmail(user.email, {
          userName,
          organizationName,
        }).then(() => {
          console.log('Welcome email sent successfully');
        }).catch((err) => {
          console.error('Failed to send welcome email:', err);
        });
      }
    } catch (emailError) {
      // Log but don't fail onboarding if email fails
      console.error('Email error (non-fatal):', emailError);
    }

    console.log('Onboarding completed successfully for user:', userId);

    // Return success directly with NextResponse to avoid any issues with successResponse
    return new Response(JSON.stringify({ data: { success: true } }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Onboarding complete error:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });
    return handleApiError(error);
  }
}
