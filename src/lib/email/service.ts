// Email Service for Termly Notifications
// Supports multiple providers: Resend (recommended), SendGrid, or console logging for development

import { createClient } from '@/lib/supabase/server';

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
  replyTo?: string;
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

// Email provider interface
interface EmailProvider {
  send(options: EmailOptions): Promise<EmailResult>;
}

// Console provider for development
class ConsoleEmailProvider implements EmailProvider {
  async send(options: EmailOptions): Promise<EmailResult> {
    console.log('========== EMAIL SENT ==========');
    console.log('To:', options.to);
    console.log('Subject:', options.subject);
    console.log('From:', options.from);
    console.log('Body:', options.text || options.html.substring(0, 200) + '...');
    console.log('================================');
    return { success: true, messageId: `console-${Date.now()}` };
  }
}

// Resend provider (recommended for production)
class ResendEmailProvider implements EmailProvider {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async send(options: EmailOptions): Promise<EmailResult> {
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: options.from || 'Termly <notifications@termly.app>',
          to: Array.isArray(options.to) ? options.to : [options.to],
          subject: options.subject,
          html: options.html,
          text: options.text,
          reply_to: options.replyTo,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        return { success: false, error: error.message || 'Failed to send email' };
      }

      const data = await response.json();
      return { success: true, messageId: data.id };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error sending email',
      };
    }
  }
}

// Factory to get the right provider
function getEmailProvider(): EmailProvider {
  const resendKey = process.env.RESEND_API_KEY;

  if (resendKey) {
    return new ResendEmailProvider(resendKey);
  }

  // Default to console in development
  console.warn('No email provider configured. Using console logging.');
  return new ConsoleEmailProvider();
}

// Main email service
export const emailService = {
  provider: getEmailProvider(),

  async send(options: EmailOptions): Promise<EmailResult> {
    return this.provider.send(options);
  },
};

// Pre-built email templates
export const emailTemplates = {
  covenantBreach(data: {
    borrowerName: string;
    covenantName: string;
    currentValue: number;
    threshold: number;
    headroom: number;
    loanName: string;
    loanUrl: string;
  }) {
    return {
      subject: `🚨 Covenant Breach Alert: ${data.borrowerName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #dc2626; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; }
            .metric { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
            .label { color: #6b7280; }
            .value { font-weight: 600; }
            .breach { color: #dc2626; }
            .button { display: inline-block; background: #2563eb; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; margin-top: 20px; }
            .footer { padding: 20px; color: #6b7280; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0;">Covenant Breach Detected</h1>
            </div>
            <div class="content">
              <p><strong>${data.borrowerName}</strong> has breached the <strong>${data.covenantName}</strong> covenant on loan <strong>${data.loanName}</strong>.</p>

              <div class="metric">
                <span class="label">Current Value</span>
                <span class="value breach">${data.currentValue.toFixed(2)}x</span>
              </div>
              <div class="metric">
                <span class="label">Threshold</span>
                <span class="value">${data.threshold.toFixed(2)}x</span>
              </div>
              <div class="metric">
                <span class="label">Headroom</span>
                <span class="value breach">${data.headroom.toFixed(1)}%</span>
              </div>

              <a href="${data.loanUrl}" class="button">View Loan Details</a>
            </div>
            <div class="footer">
              <p>This alert was automatically generated by Termly.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `COVENANT BREACH: ${data.borrowerName} has breached the ${data.covenantName} covenant.\n\nCurrent Value: ${data.currentValue.toFixed(2)}x\nThreshold: ${data.threshold.toFixed(2)}x\nHeadroom: ${data.headroom.toFixed(1)}%\n\nView details: ${data.loanUrl}`,
    };
  },

  covenantWarning(data: {
    borrowerName: string;
    covenantName: string;
    currentValue: number;
    threshold: number;
    headroom: number;
    loanName: string;
    loanUrl: string;
  }) {
    return {
      subject: `⚠️ Covenant Warning: ${data.borrowerName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #f59e0b; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; }
            .metric { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
            .label { color: #6b7280; }
            .value { font-weight: 600; }
            .warning { color: #f59e0b; }
            .button { display: inline-block; background: #2563eb; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; margin-top: 20px; }
            .footer { padding: 20px; color: #6b7280; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0;">Covenant Warning</h1>
            </div>
            <div class="content">
              <p><strong>${data.borrowerName}</strong> is approaching the threshold for <strong>${data.covenantName}</strong> on loan <strong>${data.loanName}</strong>.</p>

              <div class="metric">
                <span class="label">Current Value</span>
                <span class="value warning">${data.currentValue.toFixed(2)}x</span>
              </div>
              <div class="metric">
                <span class="label">Threshold</span>
                <span class="value">${data.threshold.toFixed(2)}x</span>
              </div>
              <div class="metric">
                <span class="label">Headroom</span>
                <span class="value warning">${data.headroom.toFixed(1)}%</span>
              </div>

              <a href="${data.loanUrl}" class="button">View Loan Details</a>
            </div>
            <div class="footer">
              <p>This alert was automatically generated by Termly.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `COVENANT WARNING: ${data.borrowerName} is approaching the threshold for ${data.covenantName}.\n\nCurrent Value: ${data.currentValue.toFixed(2)}x\nThreshold: ${data.threshold.toFixed(2)}x\nHeadroom: ${data.headroom.toFixed(1)}%\n\nView details: ${data.loanUrl}`,
    };
  },

  weeklyDigest(data: {
    organizationName: string;
    summary: {
      totalLoans: number;
      compliantCount: number;
      warningCount: number;
      breachCount: number;
      upcomingTests: number;
    };
    highlights: string[];
    dashboardUrl: string;
  }) {
    return {
      subject: `📊 Weekly Portfolio Digest - ${data.organizationName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #1e3a5f; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; }
            .stats { display: flex; gap: 15px; margin: 20px 0; flex-wrap: wrap; }
            .stat { background: white; padding: 15px; border-radius: 8px; flex: 1; min-width: 120px; text-align: center; }
            .stat-value { font-size: 24px; font-weight: 700; }
            .stat-label { color: #6b7280; font-size: 12px; }
            .green { color: #10b981; }
            .yellow { color: #f59e0b; }
            .red { color: #dc2626; }
            .highlights { background: white; padding: 15px; border-radius: 8px; margin-top: 20px; }
            .highlight { padding: 8px 0; border-bottom: 1px solid #e5e7eb; }
            .button { display: inline-block; background: #2563eb; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; margin-top: 20px; }
            .footer { padding: 20px; color: #6b7280; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0;">Weekly Portfolio Digest</h1>
              <p style="margin: 10px 0 0 0; opacity: 0.9;">${data.organizationName}</p>
            </div>
            <div class="content">
              <div class="stats">
                <div class="stat">
                  <div class="stat-value">${data.summary.totalLoans}</div>
                  <div class="stat-label">Total Loans</div>
                </div>
                <div class="stat">
                  <div class="stat-value green">${data.summary.compliantCount}</div>
                  <div class="stat-label">Compliant</div>
                </div>
                <div class="stat">
                  <div class="stat-value yellow">${data.summary.warningCount}</div>
                  <div class="stat-label">Warning</div>
                </div>
                <div class="stat">
                  <div class="stat-value red">${data.summary.breachCount}</div>
                  <div class="stat-label">Breach</div>
                </div>
              </div>

              <p><strong>${data.summary.upcomingTests}</strong> covenant tests due in the next 7 days.</p>

              ${data.highlights.length > 0 ? `
                <div class="highlights">
                  <h3 style="margin-top: 0;">This Week's Highlights</h3>
                  ${data.highlights.map(h => `<div class="highlight">${h}</div>`).join('')}
                </div>
              ` : ''}

              <a href="${data.dashboardUrl}" class="button">View Dashboard</a>
            </div>
            <div class="footer">
              <p>You're receiving this because you're subscribed to weekly digest emails.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `Weekly Portfolio Digest - ${data.organizationName}\n\nTotal Loans: ${data.summary.totalLoans}\nCompliant: ${data.summary.compliantCount}\nWarning: ${data.summary.warningCount}\nBreach: ${data.summary.breachCount}\n\n${data.summary.upcomingTests} tests due in the next 7 days.\n\nView dashboard: ${data.dashboardUrl}`,
    };
  },
};

// Send notification based on alert type
export async function sendAlertNotification(
  alert: {
    severity: 'critical' | 'warning' | 'info';
    title: string;
    borrowerName: string;
    covenantName?: string;
    currentValue?: number;
    threshold?: number;
    headroom?: number;
    loanId: string;
    loanName: string;
  },
  recipients: string[]
): Promise<EmailResult> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://app.termly.finance';
  const loanUrl = `${baseUrl}/loans/${alert.loanId}`;

  let template;
  if (alert.severity === 'critical' && alert.currentValue && alert.threshold && alert.headroom !== undefined) {
    template = emailTemplates.covenantBreach({
      borrowerName: alert.borrowerName,
      covenantName: alert.covenantName || alert.title,
      currentValue: alert.currentValue,
      threshold: alert.threshold,
      headroom: alert.headroom,
      loanName: alert.loanName,
      loanUrl,
    });
  } else if (alert.severity === 'warning' && alert.currentValue && alert.threshold && alert.headroom !== undefined) {
    template = emailTemplates.covenantWarning({
      borrowerName: alert.borrowerName,
      covenantName: alert.covenantName || alert.title,
      currentValue: alert.currentValue,
      threshold: alert.threshold,
      headroom: alert.headroom,
      loanName: alert.loanName,
      loanUrl,
    });
  } else {
    // Generic alert
    template = {
      subject: `${alert.severity === 'critical' ? '🚨' : '⚠️'} ${alert.title}`,
      html: `<p>${alert.title}</p><p>Borrower: ${alert.borrowerName}</p><p>Loan: ${alert.loanName}</p><a href="${loanUrl}">View Details</a>`,
      text: `${alert.title}\nBorrower: ${alert.borrowerName}\nLoan: ${alert.loanName}\n\nView: ${loanUrl}`,
    };
  }

  return emailService.send({
    to: recipients,
    ...template,
  });
}
