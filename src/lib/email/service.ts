// Email Service for Termly Notifications
// Supports multiple providers: Resend (recommended) or console logging for development

import { Resend } from 'resend';

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
  private resend: Resend;

  constructor(apiKey: string) {
    this.resend = new Resend(apiKey);
  }

  async send(options: EmailOptions): Promise<EmailResult> {
    try {
      // Default from address - uses verified domain or falls back to Resend sandbox
      const defaultFrom = process.env.EMAIL_FROM_ADDRESS || 'Termly <notifications@mail.termly.cc>';

      const { data, error } = await this.resend.emails.send({
        from: options.from || defaultFrom,
        to: Array.isArray(options.to) ? options.to : [options.to],
        subject: options.subject,
        html: options.html,
        text: options.text,
        replyTo: options.replyTo || 'support@termly.cc',
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, messageId: data?.id };
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

  // Welcome email sent after user completes onboarding
  welcome(data: {
    userName: string;
    organizationName: string;
    dashboardUrl: string;
  }) {
    return {
      subject: `Welcome to Termly, ${data.userName}! 🎉`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%); color: white; padding: 40px 20px; border-radius: 8px 8px 0 0; text-align: center; }
            .header h1 { margin: 0; font-size: 28px; }
            .content { background: #f9fafb; padding: 30px 20px; border: 1px solid #e5e7eb; }
            .feature { display: flex; align-items: flex-start; margin: 20px 0; }
            .feature-icon { background: #dbeafe; color: #2563eb; width: 40px; height: 40px; border-radius: 8px; display: flex; align-items: center; justify-content: center; margin-right: 15px; font-size: 20px; flex-shrink: 0; }
            .feature-text h3 { margin: 0 0 5px 0; color: #1e3a5f; }
            .feature-text p { margin: 0; color: #6b7280; font-size: 14px; }
            .button { display: inline-block; background: #2563eb; color: white; padding: 14px 28px; border-radius: 6px; text-decoration: none; margin-top: 20px; font-weight: 600; }
            .footer { padding: 20px; color: #6b7280; font-size: 12px; text-align: center; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to Termly!</h1>
              <p style="margin: 10px 0 0 0; opacity: 0.9;">Your covenant monitoring journey begins now</p>
            </div>
            <div class="content">
              <p>Hi ${data.userName},</p>
              <p>Thank you for joining <strong>${data.organizationName}</strong> on Termly. We're excited to help you automate your loan covenant monitoring.</p>

              <h2 style="color: #1e3a5f; margin-top: 30px;">Here's what you can do:</h2>

              <div class="feature">
                <div class="feature-icon">📄</div>
                <div class="feature-text">
                  <h3>Upload Documents</h3>
                  <p>Upload credit agreements and let AI extract covenant terms automatically</p>
                </div>
              </div>

              <div class="feature">
                <div class="feature-icon">📊</div>
                <div class="feature-text">
                  <h3>Track Compliance</h3>
                  <p>Monitor covenant status in real-time with automatic breach alerts</p>
                </div>
              </div>

              <div class="feature">
                <div class="feature-icon">🤖</div>
                <div class="feature-text">
                  <h3>Ask Monty</h3>
                  <p>Chat with our AI assistant for instant portfolio insights</p>
                </div>
              </div>

              <div class="feature">
                <div class="feature-icon">📝</div>
                <div class="feature-text">
                  <h3>Generate Memos</h3>
                  <p>Create AI-powered credit memos in seconds</p>
                </div>
              </div>

              <div style="text-align: center; margin-top: 30px;">
                <a href="${data.dashboardUrl}" class="button">Go to Dashboard</a>
              </div>
            </div>
            <div class="footer">
              <p>Questions? Reply to this email or reach out to support@termly.cc</p>
              <p>© ${new Date().getFullYear()} Termly. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `Welcome to Termly, ${data.userName}!\n\nThank you for joining ${data.organizationName} on Termly.\n\nHere's what you can do:\n- Upload documents and let AI extract covenant terms\n- Track compliance in real-time with automatic alerts\n- Chat with Monty for portfolio insights\n- Generate AI-powered credit memos\n\nGet started: ${data.dashboardUrl}`,
    };
  },

  // User invitation email
  userInvitation(data: {
    inviterName: string;
    organizationName: string;
    inviteUrl: string;
    role: string;
  }) {
    return {
      subject: `${data.inviterName} invited you to join ${data.organizationName} on Termly`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #1e3a5f; color: white; padding: 30px 20px; border-radius: 8px 8px 0 0; text-align: center; }
            .content { background: #f9fafb; padding: 30px 20px; border: 1px solid #e5e7eb; }
            .invite-box { background: white; border: 2px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center; }
            .invite-box h3 { margin: 0 0 5px 0; color: #1e3a5f; }
            .invite-box p { margin: 0; color: #6b7280; }
            .role-badge { display: inline-block; background: #dbeafe; color: #2563eb; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; margin-top: 10px; }
            .button { display: inline-block; background: #2563eb; color: white; padding: 14px 28px; border-radius: 6px; text-decoration: none; margin-top: 20px; font-weight: 600; }
            .footer { padding: 20px; color: #6b7280; font-size: 12px; text-align: center; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0;">You're Invited!</h1>
            </div>
            <div class="content">
              <p><strong>${data.inviterName}</strong> has invited you to join their team on Termly, the AI-powered loan covenant monitoring platform.</p>

              <div class="invite-box">
                <h3>${data.organizationName}</h3>
                <p>You'll be joining as:</p>
                <span class="role-badge">${data.role.charAt(0).toUpperCase() + data.role.slice(1)}</span>
              </div>

              <p>With Termly, you'll be able to:</p>
              <ul style="color: #374151;">
                <li>Monitor loan covenant compliance in real-time</li>
                <li>Get automatic alerts for breaches and warnings</li>
                <li>Use AI to extract data from loan documents</li>
                <li>Generate credit memos and reports</li>
              </ul>

              <div style="text-align: center;">
                <a href="${data.inviteUrl}" class="button">Accept Invitation</a>
              </div>

              <p style="margin-top: 30px; font-size: 14px; color: #6b7280;">This invitation will expire in 7 days. If you didn't expect this invitation, you can ignore this email.</p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} Termly. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `${data.inviterName} invited you to join ${data.organizationName} on Termly!\n\nYou'll be joining as: ${data.role}\n\nAccept your invitation: ${data.inviteUrl}\n\nThis invitation expires in 7 days.`,
    };
  },

  // Document processed notification
  documentProcessed(data: {
    userName: string;
    documentName: string;
    loanName: string;
    borrowerName: string;
    extractionStatus: 'completed' | 'needs_review' | 'failed';
    covenantsFound: number;
    financialPeriodsFound: number;
    documentUrl: string;
  }) {
    const statusConfig = {
      completed: { color: '#10b981', icon: '✅', title: 'Document Successfully Processed' },
      needs_review: { color: '#f59e0b', icon: '⚠️', title: 'Document Needs Review' },
      failed: { color: '#dc2626', icon: '❌', title: 'Document Processing Failed' },
    };
    const status = statusConfig[data.extractionStatus];

    return {
      subject: `${status.icon} ${status.title}: ${data.documentName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: ${status.color}; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; }
            .doc-info { background: white; border-radius: 8px; padding: 15px; margin: 15px 0; }
            .doc-info-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f3f4f6; }
            .doc-info-row:last-child { border-bottom: none; }
            .label { color: #6b7280; }
            .value { font-weight: 600; color: #1f2937; }
            .stats { display: flex; gap: 15px; margin: 20px 0; }
            .stat { background: white; padding: 15px; border-radius: 8px; flex: 1; text-align: center; }
            .stat-value { font-size: 24px; font-weight: 700; color: #2563eb; }
            .stat-label { color: #6b7280; font-size: 12px; }
            .button { display: inline-block; background: #2563eb; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; margin-top: 15px; }
            .footer { padding: 20px; color: #6b7280; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0;">${status.title}</h1>
            </div>
            <div class="content">
              <p>Hi ${data.userName},</p>
              <p>Your document has been processed by our AI extraction system.</p>

              <div class="doc-info">
                <div class="doc-info-row">
                  <span class="label">Document</span>
                  <span class="value">${data.documentName}</span>
                </div>
                <div class="doc-info-row">
                  <span class="label">Loan</span>
                  <span class="value">${data.loanName}</span>
                </div>
                <div class="doc-info-row">
                  <span class="label">Borrower</span>
                  <span class="value">${data.borrowerName}</span>
                </div>
              </div>

              ${data.extractionStatus !== 'failed' ? `
                <div class="stats">
                  <div class="stat">
                    <div class="stat-value">${data.covenantsFound}</div>
                    <div class="stat-label">Covenants Found</div>
                  </div>
                  <div class="stat">
                    <div class="stat-value">${data.financialPeriodsFound}</div>
                    <div class="stat-label">Financial Periods</div>
                  </div>
                </div>
              ` : ''}

              ${data.extractionStatus === 'needs_review' ? `
                <p style="background: #fef3c7; padding: 12px; border-radius: 6px; color: #92400e;">
                  <strong>Action Required:</strong> Some extracted data has low confidence scores and needs your review before it can be used.
                </p>
              ` : ''}

              ${data.extractionStatus === 'failed' ? `
                <p style="background: #fee2e2; padding: 12px; border-radius: 6px; color: #991b1b;">
                  <strong>Processing Failed:</strong> We couldn't extract data from this document. Please check that the document is a valid PDF and try uploading again.
                </p>
              ` : ''}

              <a href="${data.documentUrl}" class="button">View Document</a>
            </div>
            <div class="footer">
              <p>This is an automated notification from Termly.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `${status.title}\n\nDocument: ${data.documentName}\nLoan: ${data.loanName}\nBorrower: ${data.borrowerName}\n\nCovenants Found: ${data.covenantsFound}\nFinancial Periods: ${data.financialPeriodsFound}\n\nView document: ${data.documentUrl}`,
    };
  },

  // Upcoming covenant test reminder
  upcomingTestReminder(data: {
    userName: string;
    tests: Array<{
      covenantName: string;
      loanName: string;
      borrowerName: string;
      dueDate: string;
      daysUntilDue: number;
    }>;
    dashboardUrl: string;
  }) {
    const urgentTests = data.tests.filter(t => t.daysUntilDue <= 3);
    const isUrgent = urgentTests.length > 0;

    return {
      subject: `${isUrgent ? '🔴' : '📅'} ${data.tests.length} Covenant Test${data.tests.length > 1 ? 's' : ''} Due Soon`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: ${isUrgent ? '#dc2626' : '#1e3a5f'}; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; }
            .test-card { background: white; border-radius: 8px; padding: 15px; margin: 10px 0; border-left: 4px solid #2563eb; }
            .test-card.urgent { border-left-color: #dc2626; }
            .test-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
            .test-name { font-weight: 600; color: #1f2937; }
            .due-badge { font-size: 12px; padding: 2px 8px; border-radius: 10px; }
            .due-badge.urgent { background: #fee2e2; color: #dc2626; }
            .due-badge.soon { background: #fef3c7; color: #d97706; }
            .due-badge.normal { background: #dbeafe; color: #2563eb; }
            .test-details { font-size: 14px; color: #6b7280; }
            .button { display: inline-block; background: #2563eb; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; margin-top: 15px; }
            .footer { padding: 20px; color: #6b7280; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0;">Upcoming Covenant Tests</h1>
              <p style="margin: 10px 0 0 0; opacity: 0.9;">${data.tests.length} test${data.tests.length > 1 ? 's' : ''} requiring attention</p>
            </div>
            <div class="content">
              <p>Hi ${data.userName},</p>
              <p>The following covenant tests are due soon and may require financial data updates:</p>

              ${data.tests.map(test => {
                const badgeClass = test.daysUntilDue <= 1 ? 'urgent' : test.daysUntilDue <= 3 ? 'soon' : 'normal';
                const dueText = test.daysUntilDue === 0 ? 'Due Today' : test.daysUntilDue === 1 ? 'Due Tomorrow' : `Due in ${test.daysUntilDue} days`;
                return `
                  <div class="test-card ${test.daysUntilDue <= 3 ? 'urgent' : ''}">
                    <div class="test-header">
                      <span class="test-name">${test.covenantName}</span>
                      <span class="due-badge ${badgeClass}">${dueText}</span>
                    </div>
                    <div class="test-details">
                      ${test.borrowerName} • ${test.loanName}<br>
                      Due: ${test.dueDate}
                    </div>
                  </div>
                `;
              }).join('')}

              <div style="text-align: center;">
                <a href="${data.dashboardUrl}" class="button">View All Tests</a>
              </div>
            </div>
            <div class="footer">
              <p>You're receiving this because you have upcoming covenant tests. Manage your notification preferences in Settings.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `Upcoming Covenant Tests\n\n${data.tests.map(t => `- ${t.covenantName} (${t.borrowerName}): Due ${t.dueDate}`).join('\n')}\n\nView all: ${data.dashboardUrl}`,
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

// Send welcome email after onboarding
export async function sendWelcomeEmail(
  recipient: string,
  data: {
    userName: string;
    organizationName: string;
  }
): Promise<EmailResult> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.termly.cc';
  const template = emailTemplates.welcome({
    ...data,
    dashboardUrl: `${baseUrl}/dashboard`,
  });

  return emailService.send({
    to: recipient,
    ...template,
  });
}

// Send user invitation email
export async function sendUserInvitationEmail(
  recipient: string,
  data: {
    inviterName: string;
    organizationName: string;
    role: string;
  }
): Promise<EmailResult> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.termly.cc';
  const template = emailTemplates.userInvitation({
    ...data,
    inviteUrl: `${baseUrl}/sign-up?invited=true`,
  });

  return emailService.send({
    to: recipient,
    ...template,
  });
}

// Send document processed notification
export async function sendDocumentProcessedEmail(
  recipient: string,
  data: {
    userName: string;
    documentId: string;
    documentName: string;
    loanName: string;
    borrowerName: string;
    extractionStatus: 'completed' | 'needs_review' | 'failed';
    covenantsFound: number;
    financialPeriodsFound: number;
  }
): Promise<EmailResult> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.termly.cc';
  const template = emailTemplates.documentProcessed({
    ...data,
    documentUrl: `${baseUrl}/documents/${data.documentId}`,
  });

  return emailService.send({
    to: recipient,
    ...template,
  });
}

// Send upcoming test reminder
export async function sendUpcomingTestReminderEmail(
  recipient: string,
  data: {
    userName: string;
    tests: Array<{
      covenantName: string;
      loanName: string;
      borrowerName: string;
      dueDate: string;
      daysUntilDue: number;
    }>;
  }
): Promise<EmailResult> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.termly.cc';
  const template = emailTemplates.upcomingTestReminder({
    ...data,
    dashboardUrl: `${baseUrl}/dashboard`,
  });

  return emailService.send({
    to: recipient,
    ...template,
  });
}
