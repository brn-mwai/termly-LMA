import { auth } from '@clerk/nextjs/server';
import { createClient } from '@/lib/supabase/server';
import { chat, ChatMessage } from '@/lib/ai/client';
import { successResponse, errorResponse, handleApiError, asUserWithOrg } from '@/lib/utils/api';
import { withRateLimit } from '@/lib/utils/rate-limit-middleware';

interface PortfolioMetrics {
  totalLoans: number;
  totalBorrowers: number;
  portfolioValue: number;
  outstandingValue: number;
  complianceRate: number;
  breachCount: number;
  warningCount: number;
  compliantCount: number;
  criticalAlerts: number;
  warningAlerts: number;
  avgHeadroom: number;
  industryBreakdown: { industry: string; count: number; value: number }[];
  upcomingTests: number;
  documentsNeedingReview: number;
}

interface TrendData {
  period: string;
  compliant: number;
  warning: number;
  breach: number;
}

interface RiskBorrower {
  id: string;
  name: string;
  loanCount: number;
  breachCount: number;
  warningCount: number;
  totalExposure: number;
  riskScore: number;
}

export async function GET(request: Request) {
  try {
    // Apply rate limiting
    const rateLimitResult = await withRateLimit(request, { type: 'ai' });
    if (rateLimitResult) return rateLimitResult;

    const { userId } = await auth();
    if (!userId) return errorResponse('UNAUTHORIZED', 'Authentication required', 401);

    const supabase = await createClient();

    // Get user's org
    const { data: userData } = await supabase
      .from('users')
      .select('organization_id')
      .eq('clerk_id', userId)
      .single();

    const user = asUserWithOrg(userData);
    if (!user) {
      return errorResponse('FORBIDDEN', 'User organization not found', 403);
    }

    const orgId = user.organization_id;

    // Fetch all analytics data in parallel
    const [
      loansResult,
      borrowersResult,
      alertsResult,
      covenantTestsResult,
      upcomingTestsResult,
      documentsResult,
    ] = await Promise.all([
      // Loans with borrower details
      supabase
        .from('loans')
        .select(`
          id, name, commitment_amount, outstanding_amount, status, maturity_date,
          borrowers (id, name, industry)
        `)
        .eq('organization_id', orgId)
        .is('deleted_at', null),

      // Unique borrowers
      supabase
        .from('borrowers')
        .select('id, name, industry')
        .eq('organization_id', orgId)
        .is('deleted_at', null),

      // Active alerts
      supabase
        .from('alerts')
        .select('id, severity, title, acknowledged, created_at')
        .eq('organization_id', orgId)
        .eq('acknowledged', false),

      // Recent covenant tests (last 6 months)
      supabase
        .from('covenant_tests')
        .select(`
          id, status, headroom_percentage, tested_at,
          covenants (
            id, loan_id,
            loans (id, borrower_id, borrowers (id, name))
          )
        `)
        .gte('tested_at', new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString())
        .order('tested_at', { ascending: false }),

      // Upcoming covenant tests
      supabase
        .from('covenants')
        .select('id, test_due_date')
        .gte('test_due_date', new Date().toISOString().split('T')[0])
        .lte('test_due_date', new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]),

      // Documents needing review
      supabase
        .from('documents')
        .select('id')
        .eq('organization_id', orgId)
        .eq('extraction_status', 'needs_review')
        .is('deleted_at', null),
    ]);

    const loans = loansResult.data || [];
    const borrowers = borrowersResult.data || [];
    const alerts = alertsResult.data || [];
    const covenantTests = covenantTestsResult.data || [];
    const upcomingTests = upcomingTestsResult.data || [];
    const documentsNeedingReview = documentsResult.data || [];

    // Calculate metrics
    const portfolioValue = loans.reduce((sum, l: any) => sum + (Number(l.commitment_amount) || 0), 0);
    const outstandingValue = loans.reduce((sum, l: any) => sum + (Number(l.outstanding_amount) || 0), 0);

    const compliantCount = covenantTests.filter((t: any) => t.status === 'compliant').length;
    const warningCount = covenantTests.filter((t: any) => t.status === 'warning').length;
    const breachCount = covenantTests.filter((t: any) => t.status === 'breach').length;
    const totalTests = compliantCount + warningCount + breachCount;

    const criticalAlerts = alerts.filter((a: any) => a.severity === 'critical').length;
    const warningAlerts = alerts.filter((a: any) => a.severity === 'warning').length;

    const avgHeadroom = covenantTests.length > 0
      ? covenantTests.reduce((sum, t: any) => sum + (Number(t.headroom_percentage) || 0), 0) / covenantTests.length
      : 0;

    // Industry breakdown
    const industryMap = new Map<string, { count: number; value: number }>();
    loans.forEach((l: any) => {
      const industry = l.borrowers?.industry || 'Unknown';
      const existing = industryMap.get(industry) || { count: 0, value: 0 };
      industryMap.set(industry, {
        count: existing.count + 1,
        value: existing.value + (Number(l.commitment_amount) || 0),
      });
    });
    const industryBreakdown = Array.from(industryMap.entries())
      .map(([industry, data]) => ({ industry, ...data }))
      .sort((a, b) => b.value - a.value);

    // Calculate compliance trends (last 6 months by month)
    const trendMap = new Map<string, { compliant: number; warning: number; breach: number }>();
    covenantTests.forEach((t: any) => {
      const date = new Date(t.tested_at);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const existing = trendMap.get(key) || { compliant: 0, warning: 0, breach: 0 };
      existing[t.status as 'compliant' | 'warning' | 'breach']++;
      trendMap.set(key, existing);
    });
    const trendData: TrendData[] = Array.from(trendMap.entries())
      .map(([period, data]) => ({ period, ...data }))
      .sort((a, b) => a.period.localeCompare(b.period));

    // Calculate risk scores per borrower
    const borrowerRisk = new Map<string, RiskBorrower>();
    loans.forEach((l: any) => {
      const borrowerId = l.borrowers?.id;
      if (!borrowerId) return;

      if (!borrowerRisk.has(borrowerId)) {
        borrowerRisk.set(borrowerId, {
          id: borrowerId,
          name: l.borrowers?.name || 'Unknown',
          loanCount: 0,
          breachCount: 0,
          warningCount: 0,
          totalExposure: 0,
          riskScore: 0,
        });
      }

      const risk = borrowerRisk.get(borrowerId)!;
      risk.loanCount++;
      risk.totalExposure += Number(l.commitment_amount) || 0;
    });

    // Add covenant test results to borrower risk
    covenantTests.forEach((t: any) => {
      const borrowerId = t.covenants?.loans?.borrowers?.id;
      if (!borrowerId || !borrowerRisk.has(borrowerId)) return;

      const risk = borrowerRisk.get(borrowerId)!;
      if (t.status === 'breach') risk.breachCount++;
      if (t.status === 'warning') risk.warningCount++;
    });

    // Calculate risk scores (0-100)
    borrowerRisk.forEach((risk) => {
      const breachWeight = 30;
      const warningWeight = 10;
      const exposureWeight = (risk.totalExposure / portfolioValue) * 30;
      risk.riskScore = Math.min(100, Math.round(
        (risk.breachCount * breachWeight) +
        (risk.warningCount * warningWeight) +
        exposureWeight
      ));
    });

    const highRiskBorrowers = Array.from(borrowerRisk.values())
      .filter(b => b.riskScore > 20)
      .sort((a, b) => b.riskScore - a.riskScore)
      .slice(0, 5);

    const metrics: PortfolioMetrics = {
      totalLoans: loans.length,
      totalBorrowers: borrowers.length,
      portfolioValue,
      outstandingValue,
      complianceRate: totalTests > 0 ? Math.round((compliantCount / totalTests) * 100) : 100,
      breachCount,
      warningCount,
      compliantCount,
      criticalAlerts,
      warningAlerts,
      avgHeadroom: Math.round(avgHeadroom * 10) / 10,
      industryBreakdown,
      upcomingTests: upcomingTests.length,
      documentsNeedingReview: documentsNeedingReview.length,
    };

    // Generate AI insights
    const aiInsights = await generateAIInsights(metrics, trendData, highRiskBorrowers);

    return successResponse({
      metrics,
      trends: trendData,
      highRiskBorrowers,
      insights: aiInsights,
      generatedAt: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Analytics error:', error);
    return handleApiError(error);
  }
}

async function generateAIInsights(
  metrics: PortfolioMetrics,
  trends: TrendData[],
  highRiskBorrowers: RiskBorrower[]
): Promise<{
  summary: string;
  recommendations: string[];
  riskAssessment: string;
  outlook: string;
}> {
  try {
    const prompt = `Analyze this loan portfolio data and provide concise insights:

**Portfolio Metrics:**
- Total Loans: ${metrics.totalLoans}
- Total Borrowers: ${metrics.totalBorrowers}
- Portfolio Value: $${(metrics.portfolioValue / 1000000).toFixed(2)}M
- Outstanding: $${(metrics.outstandingValue / 1000000).toFixed(2)}M
- Compliance Rate: ${metrics.complianceRate}%
- Breaches: ${metrics.breachCount}, Warnings: ${metrics.warningCount}, Compliant: ${metrics.compliantCount}
- Critical Alerts: ${metrics.criticalAlerts}, Warning Alerts: ${metrics.warningAlerts}
- Avg Headroom: ${metrics.avgHeadroom}%
- Upcoming Tests (30 days): ${metrics.upcomingTests}
- Documents Needing Review: ${metrics.documentsNeedingReview}

**Industry Breakdown:**
${metrics.industryBreakdown.slice(0, 5).map(i => `- ${i.industry}: ${i.count} loans, $${(i.value / 1000000).toFixed(1)}M`).join('\n')}

**Compliance Trends (Monthly):**
${trends.slice(-6).map(t => `- ${t.period}: ${t.compliant} compliant, ${t.warning} warning, ${t.breach} breach`).join('\n')}

**High Risk Borrowers:**
${highRiskBorrowers.length > 0
  ? highRiskBorrowers.map(b => `- ${b.name}: Risk Score ${b.riskScore}/100, ${b.breachCount} breaches, $${(b.totalExposure / 1000000).toFixed(1)}M exposure`).join('\n')
  : 'None identified'}

Respond in this exact JSON format (no markdown, just JSON):
{
  "summary": "2-3 sentence portfolio health summary",
  "recommendations": ["action item 1", "action item 2", "action item 3"],
  "riskAssessment": "1-2 sentence risk assessment",
  "outlook": "1 sentence forward-looking statement"
}`;

    const messages: ChatMessage[] = [
      {
        role: 'system',
        content: 'You are a financial analyst AI assistant specializing in loan portfolio analysis. Provide concise, actionable insights. Always respond with valid JSON only, no markdown or extra text.',
      },
      { role: 'user', content: prompt },
    ];

    const response = await chat(messages, 'analysis');

    // Parse AI response
    try {
      const parsed = JSON.parse(response.message);
      return {
        summary: parsed.summary || 'Portfolio analysis complete.',
        recommendations: parsed.recommendations || [],
        riskAssessment: parsed.riskAssessment || 'Risk assessment pending.',
        outlook: parsed.outlook || 'Continue monitoring.',
      };
    } catch {
      // Fallback if JSON parsing fails
      return {
        summary: response.message.slice(0, 200),
        recommendations: ['Review high-risk borrowers', 'Address pending alerts', 'Complete document reviews'],
        riskAssessment: 'Unable to generate detailed assessment.',
        outlook: 'Continue monitoring portfolio health.',
      };
    }
  } catch (error) {
    console.error('AI insights generation failed:', error);
    // Return default insights on AI failure
    return {
      summary: `Portfolio contains ${metrics.totalLoans} loans with ${metrics.complianceRate}% compliance rate.`,
      recommendations: [
        metrics.criticalAlerts > 0 ? `Address ${metrics.criticalAlerts} critical alerts` : 'No critical alerts',
        metrics.documentsNeedingReview > 0 ? `Review ${metrics.documentsNeedingReview} pending documents` : 'All documents reviewed',
        metrics.upcomingTests > 0 ? `Prepare for ${metrics.upcomingTests} upcoming covenant tests` : 'No upcoming tests',
      ].filter(r => !r.includes('No ')),
      riskAssessment: metrics.breachCount > 0
        ? `${metrics.breachCount} covenant breaches require attention.`
        : 'Portfolio is in good standing.',
      outlook: 'Continue regular monitoring and compliance tracking.',
    };
  }
}
