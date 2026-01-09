import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { WebhookEvent } from '@clerk/nextjs/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    console.error('Missing CLERK_WEBHOOK_SECRET');
    return new Response('Error: Missing webhook secret', { status: 500 });
  }

  const headerPayload = await headers();
  const svix_id = headerPayload.get('svix-id');
  const svix_timestamp = headerPayload.get('svix-timestamp');
  const svix_signature = headerPayload.get('svix-signature');

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Error: Missing svix headers', { status: 400 });
  }

  const payload = await req.json();
  const body = JSON.stringify(payload);

  const wh = new Webhook(WEBHOOK_SECRET);
  let evt: WebhookEvent;

  try {
    evt = wh.verify(body, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error('Error verifying webhook:', err);
    return new Response('Error: Verification failed', { status: 400 });
  }

  const supabase = createAdminClient();

  try {
    switch (evt.type) {
      case 'user.created': {
        const { id, email_addresses, first_name, last_name } = evt.data;
        const primaryEmail = email_addresses[0]?.email_address;
        const fullName = [first_name, last_name].filter(Boolean).join(' ') || null;

        // Create or get organization (using email domain for demo)
        const emailDomain = primaryEmail?.split('@')[1] || 'default';
        const orgSlug = emailDomain.replace(/\./g, '-');

        let orgId: string;

        // Check if org exists
        const { data: existingOrg } = await supabase
          .from('organizations')
          .select('id')
          .eq('slug', orgSlug)
          .single();

        if (existingOrg) {
          orgId = existingOrg.id;
        } else {
          // Create new organization
          const { data: newOrg, error: orgError } = await supabase
            .from('organizations')
            .insert({
              name: emailDomain,
              slug: orgSlug,
            })
            .select('id')
            .single();

          if (orgError) throw orgError;
          orgId = newOrg.id;
        }

        // Create user
        const { error: userError } = await supabase.from('users').insert({
          clerk_id: id,
          email: primaryEmail,
          full_name: fullName,
          organization_id: orgId,
          role: 'analyst',
        });

        if (userError) throw userError;

        console.log(`User created: ${id}`);
        break;
      }

      case 'user.updated': {
        const { id, email_addresses, first_name, last_name } = evt.data;
        const primaryEmail = email_addresses[0]?.email_address;
        const fullName = [first_name, last_name].filter(Boolean).join(' ') || null;

        const { error } = await supabase
          .from('users')
          .update({
            email: primaryEmail,
            full_name: fullName,
          })
          .eq('clerk_id', id);

        if (error) throw error;

        console.log(`User updated: ${id}`);
        break;
      }

      case 'user.deleted': {
        const { id } = evt.data;

        // Soft delete
        const { error } = await supabase
          .from('users')
          .update({ deleted_at: new Date().toISOString() })
          .eq('clerk_id', id);

        if (error) throw error;

        console.log(`User deleted: ${id}`);
        break;
      }

      default:
        console.log(`Unhandled event type: ${evt.type}`);
    }

    return new Response('Success', { status: 200 });
  } catch (error) {
    console.error('Webhook handler error:', error);
    return new Response('Error processing webhook', { status: 500 });
  }
}
