import { NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: Request) {
  try {
    // Step 1: Check auth
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } }, { status: 401 });
    }

    // Step 2: Check env vars
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY || !process.env.NEXT_PUBLIC_SUPABASE_URL) {
      return NextResponse.json({ error: { code: 'CONFIG_ERROR', message: 'Missing config' } }, { status: 500 });
    }

    // Step 3: Parse body
    let organizationName = '';
    try {
      const body = await request.json();
      organizationName = body.organizationName || '';
    } catch {
      // No body is fine
    }

    // Step 4: Get admin client and lookup user
    const adminSupabase = createAdminClient();

    const { data: existingUser } = await adminSupabase
      .from('users')
      .select('id, email, full_name, organization_id')
      .eq('clerk_id', userId)
      .is('deleted_at', null)
      .single();

    // Step 5: If no user, create one
    let user = existingUser;
    if (!user) {
      const clerkUser = await currentUser();
      if (!clerkUser?.emailAddresses[0]?.emailAddress) {
        return NextResponse.json({ error: { code: 'NO_USER', message: 'Cannot find user' } }, { status: 404 });
      }

      const email = clerkUser.emailAddresses[0].emailAddress;
      const fullName = [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(' ') || null;
      const domain = email.split('@')[1] || 'default';
      const slug = domain.replace(/\./g, '-');

      // Get or create org
      let orgId: string;
      const { data: org } = await adminSupabase
        .from('organizations')
        .select('id')
        .eq('slug', slug)
        .single();

      if (org) {
        orgId = org.id;
      } else {
        const { data: newOrg } = await adminSupabase
          .from('organizations')
          .insert({ name: organizationName || domain, slug })
          .select('id')
          .single();

        if (!newOrg) {
          return NextResponse.json({ error: { code: 'ORG_ERROR', message: 'Failed to create org' } }, { status: 500 });
        }
        orgId = newOrg.id;
      }

      // Create user
      const { data: newUser } = await adminSupabase
        .from('users')
        .insert({
          clerk_id: userId,
          email,
          full_name: fullName,
          organization_id: orgId,
          role: 'analyst',
        })
        .select('id, email, full_name, organization_id')
        .single();

      if (!newUser) {
        return NextResponse.json({ error: { code: 'USER_ERROR', message: 'Failed to create user' } }, { status: 500 });
      }
      user = newUser;
    }

    // Step 6: Update org name if provided
    if (organizationName && user.organization_id) {
      await adminSupabase
        .from('organizations')
        .update({ name: organizationName, updated_at: new Date().toISOString() })
        .eq('id', user.organization_id);
    }

    // Step 7: Mark onboarding complete
    await adminSupabase
      .from('users')
      .update({
        onboarding_completed: true,
        onboarding_completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('clerk_id', userId);

    // Step 8: Return success
    return NextResponse.json({ data: { success: true } });

  } catch (error) {
    console.error('Onboarding error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: error instanceof Error ? error.message : 'Unknown error' } },
      { status: 500 }
    );
  }
}
