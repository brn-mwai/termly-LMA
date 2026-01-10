import { createAdminClient } from '@/lib/supabase/admin';
import { successResponse, errorResponse, handleApiError } from '@/lib/utils/api';
import { requirePermission, getAuthenticatedUser } from '@/lib/auth/api-auth';
import { emailService, emailTemplates, sendAlertNotification } from '@/lib/email/service';
import type { NotificationPreferences } from '@/types/database';

// Default notification preferences
const DEFAULT_PREFERENCES: NotificationPreferences = {
  alerts: {
    breach: true,
    warning: true,
    info: false,
  },
  digest: {
    enabled: true,
    frequency: 'weekly',
  },
};

// Get notification preferences
export async function GET() {
  try {
    const user = await getAuthenticatedUser();
    if (!user) return errorResponse('UNAUTHORIZED', 'Authentication required', 401);

    const supabase = createAdminClient();

    // Get user's notification preferences from database
    // Using raw query to access notification_preferences column added via migration
    const { data: userData, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) {
      console.error('Error fetching notification preferences:', error);
    }

    // Merge with defaults to ensure all fields exist
    const rawData = userData as Record<string, unknown> | null;
    const storedPrefs = rawData?.notification_preferences as NotificationPreferences | null;
    const preferences = {
      email: user.email,
      alerts: {
        ...DEFAULT_PREFERENCES.alerts,
        ...(storedPrefs?.alerts || {}),
      },
      digest: {
        ...DEFAULT_PREFERENCES.digest,
        ...(storedPrefs?.digest || {}),
      },
    };

    return successResponse(preferences);
  } catch (error) {
    return handleApiError(error);
  }
}

// Update notification preferences
export async function PUT(request: Request) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) return errorResponse('UNAUTHORIZED', 'Authentication required', 401);

    const body = await request.json();
    const supabase = createAdminClient();

    // Build preferences object
    const preferences: NotificationPreferences = {
      alerts: {
        breach: body.alerts?.breach ?? DEFAULT_PREFERENCES.alerts.breach,
        warning: body.alerts?.warning ?? DEFAULT_PREFERENCES.alerts.warning,
        info: body.alerts?.info ?? DEFAULT_PREFERENCES.alerts.info,
      },
      digest: {
        enabled: body.digest?.enabled ?? DEFAULT_PREFERENCES.digest.enabled,
        frequency: body.digest?.frequency ?? DEFAULT_PREFERENCES.digest.frequency,
      },
    };

    // Persist to database
    // Note: Using type assertion as notification_preferences column added via migration
    const updateData = {
      notification_preferences: preferences,
      updated_at: new Date().toISOString(),
    };
    const { error } = await supabase
      .from('users')
      .update(updateData as never)
      .eq('id', user.id);

    if (error) {
      console.error('Error saving notification preferences:', error);
      return errorResponse('DATABASE_ERROR', 'Failed to save preferences', 500);
    }

    // Log the change
    await supabase.from('audit_logs').insert({
      organization_id: user.organizationId,
      user_id: user.id,
      action: 'update',
      entity_type: 'notification_preferences',
      entity_id: user.id,
      changes: { preferences },
    } as never);

    return successResponse({
      message: 'Preferences updated',
      preferences: {
        email: user.email,
        ...preferences,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// Send notification (internal use or manual trigger)
export async function POST(request: Request) {
  try {
    const { user, error } = await requirePermission('alerts:acknowledge');
    if (error) return error;

    const body = await request.json();
    const { type, alertId, recipients } = body;

    const supabase = createAdminClient();

    if (type === 'test') {
      // Send test email
      const result = await emailService.send({
        to: user!.email,
        subject: '🧪 Test Email from Termly',
        html: `
          <h1>Test Email</h1>
          <p>This is a test email from Termly.</p>
          <p>If you received this, email notifications are working correctly!</p>
        `,
        text: 'Test Email - This is a test email from Termly.',
      });

      return successResponse({
        message: result.success ? 'Test email sent successfully' : 'Failed to send test email',
        ...result,
      });
    }

    if (type === 'alert' && alertId) {
      // Get alert details
      const { data: alertRaw, error: alertError } = await supabase
        .from('alerts')
        .select(`
          *,
          loans (id, name, borrowers (name))
        `)
        .eq('id', alertId)
        .eq('organization_id', user!.organizationId)
        .single();

      if (alertError || !alertRaw) {
        return errorResponse('NOT_FOUND', 'Alert not found', 404);
      }

      const alert = alertRaw as {
        severity: 'critical' | 'warning' | 'info';
        title: string;
        loan_id: string;
        loans?: { id: string; name: string; borrowers?: { name: string } };
      };

      // Get recipients (either specified or all org users with alert permissions)
      let emailRecipients = recipients;
      if (!emailRecipients || emailRecipients.length === 0) {
        const { data: users } = await supabase
          .from('users')
          .select('email')
          .eq('organization_id', user!.organizationId)
          .is('deleted_at', null);
        emailRecipients = users?.map((u: { email: string }) => u.email) || [user!.email];
      }

      const result = await sendAlertNotification(
        {
          severity: alert.severity,
          title: alert.title,
          borrowerName: alert.loans?.borrowers?.name || 'Unknown',
          loanId: alert.loan_id,
          loanName: alert.loans?.name || 'Unknown',
        },
        emailRecipients
      );

      // Log notification sent
      await supabase.from('audit_logs').insert({
        organization_id: user!.organizationId,
        user_id: user!.id,
        action: 'notification_sent',
        entity_type: 'alert',
        entity_id: alertId,
        changes: { recipients: emailRecipients, result },
      } as never);

      return successResponse({
        message: result.success ? 'Notification sent' : 'Failed to send notification',
        ...result,
      });
    }

    if (type === 'digest') {
      // Send weekly digest (normally triggered by cron, but can be manual)
      const { data: orgRaw } = await supabase
        .from('organizations')
        .select('name')
        .eq('id', user!.organizationId)
        .single();

      const org = orgRaw as { name: string } | null;

      const { count: totalLoans } = await supabase
        .from('loans')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', user!.organizationId)
        .is('deleted_at', null);

      // Get recent covenant test stats
      const { data: recentTests } = await supabase
        .from('covenant_tests')
        .select('status')
        .order('tested_at', { ascending: false })
        .limit(100);

      const stats = {
        totalLoans: totalLoans || 0,
        compliantCount: recentTests?.filter((t: { status: string }) => t.status === 'compliant').length || 0,
        warningCount: recentTests?.filter((t: { status: string }) => t.status === 'warning').length || 0,
        breachCount: recentTests?.filter((t: { status: string }) => t.status === 'breach').length || 0,
        upcomingTests: 0, // Would calculate from test schedules
      };

      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://app.termly.finance';
      const template = emailTemplates.weeklyDigest({
        organizationName: org?.name || 'Your Organization',
        summary: stats,
        highlights: [],
        dashboardUrl: `${baseUrl}/dashboard`,
      });

      const result = await emailService.send({
        to: user!.email,
        ...template,
      });

      return successResponse({
        message: result.success ? 'Digest sent' : 'Failed to send digest',
        ...result,
      });
    }

    return errorResponse('VALIDATION_ERROR', 'Invalid notification type', 400);
  } catch (error) {
    return handleApiError(error);
  }
}
