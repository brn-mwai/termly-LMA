import { NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { successResponse, errorResponse } from '@/lib/utils/api';
import { sendUpcomingTestReminderEmail } from '@/lib/email/service';

// Cron job to send upcoming test reminders
// Called daily at 8 AM UTC by Vercel Cron
// Protected by CRON_SECRET environment variable or Vercel's built-in auth
export async function GET(request: NextRequest) {
  try {
    // Verify authorization - supports both Vercel cron and manual triggers
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    // Vercel cron jobs are automatically authenticated in production
    // For local/manual testing, use CRON_SECRET
    const isVercelCron = request.headers.get('x-vercel-cron') === '1';
    const isValidSecret = cronSecret && authHeader === `Bearer ${cronSecret}`;

    if (!isVercelCron && !isValidSecret && process.env.NODE_ENV === 'production') {
      return errorResponse('UNAUTHORIZED', 'Invalid cron secret', 401);
    }

    const supabase = createAdminClient();

    // Get all covenants with test_due_date in the next 7 days
    const today = new Date();
    const sevenDaysFromNow = new Date(today);
    sevenDaysFromNow.setDate(today.getDate() + 7);

    const { data: upcomingTests, error: testsError } = await supabase
      .from('covenants')
      .select(`
        id,
        name,
        test_due_date,
        loans (
          id,
          name,
          organization_id,
          borrowers (name)
        )
      `)
      .gte('test_due_date', today.toISOString().split('T')[0])
      .lte('test_due_date', sevenDaysFromNow.toISOString().split('T')[0])
      .is('deleted_at', null);

    if (testsError) {
      console.error('Error fetching upcoming tests:', testsError);
      return errorResponse('DATABASE_ERROR', 'Failed to fetch upcoming tests', 500);
    }

    if (!upcomingTests || upcomingTests.length === 0) {
      return successResponse({ message: 'No upcoming tests to notify about', sent: 0 });
    }

    // Group tests by organization
    const testsByOrg: Record<string, Array<{
      covenantName: string;
      loanName: string;
      borrowerName: string;
      dueDate: string;
      daysUntilDue: number;
      organizationId: string;
    }>> = {};

    for (const test of upcomingTests) {
      // Handle the Supabase response structure
      const testData = test as Record<string, unknown>;
      const covenantName = testData.name as string;
      const testDueDate = testData.test_due_date as string;
      const loans = testData.loans as {
        id: string;
        name: string;
        organization_id: string;
        borrowers?: { name: string };
      } | null;

      if (!loans) continue;

      const orgId = loans.organization_id;
      const dueDate = new Date(testDueDate);
      const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      if (!testsByOrg[orgId]) {
        testsByOrg[orgId] = [];
      }

      testsByOrg[orgId].push({
        covenantName,
        loanName: loans.name,
        borrowerName: loans.borrowers?.name || 'Unknown',
        dueDate: testDueDate,
        daysUntilDue,
        organizationId: orgId,
      });
    }

    // Send emails to users in each organization
    let emailsSent = 0;
    const errors: string[] = [];

    for (const [orgId, tests] of Object.entries(testsByOrg)) {
      // Get users in this organization who should receive reminders
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id, email, full_name, notification_preferences')
        .eq('organization_id', orgId)
        .is('deleted_at', null);

      if (usersError || !users) {
        errors.push(`Failed to fetch users for org ${orgId}`);
        continue;
      }

      for (const userRaw of users) {
        const user = userRaw as {
          id: string;
          email: string;
          full_name: string | null;
          notification_preferences?: { digest?: { enabled?: boolean } };
        };

        // Check if user has digest notifications enabled (default to true)
        const prefs = user.notification_preferences;
        if (prefs?.digest?.enabled === false) {
          continue;
        }

        try {
          await sendUpcomingTestReminderEmail(user.email, {
            userName: user.full_name || user.email.split('@')[0],
            tests: tests.map(t => ({
              covenantName: t.covenantName,
              loanName: t.loanName,
              borrowerName: t.borrowerName,
              dueDate: t.dueDate,
              daysUntilDue: t.daysUntilDue,
            })),
          });
          emailsSent++;
        } catch (err) {
          errors.push(`Failed to send to ${user.email}: ${err}`);
        }
      }
    }

    return successResponse({
      message: `Sent ${emailsSent} reminder emails`,
      sent: emailsSent,
      testsFound: upcomingTests.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error('Cron job error:', error);
    return errorResponse(
      'CRON_ERROR',
      'Failed to run test reminder cron',
      500,
      error instanceof Error ? error.message : undefined
    );
  }
}
