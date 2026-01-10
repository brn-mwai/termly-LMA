import { SupabaseClient } from '@supabase/supabase-js';

// Type definitions for database entities
interface CovenantTest {
  id: string;
  status: string;
  tested_at: string;
  actual_value?: number;
  headroom?: number;
}

// Tool definitions for Monty's agentic capabilities
export const MONTY_TOOLS = [
  {
    name: 'get_portfolio_summary',
    description: 'Get a summary of the entire loan portfolio including total loans, total commitment, outstanding amounts, and compliance status breakdown.',
    input_schema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'get_loans',
    description: 'Get a list of loans with their details. Can filter by status or search by borrower name.',
    input_schema: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          description: 'Filter by loan status: active, matured, or defaulted',
          enum: ['active', 'matured', 'defaulted'],
        },
        search: {
          type: 'string',
          description: 'Search loans by borrower name or loan name',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of loans to return (default 10)',
        },
      },
      required: [],
    },
  },
  {
    name: 'get_loan_details',
    description: 'Get detailed information about a specific loan including its covenants and latest test results.',
    input_schema: {
      type: 'object',
      properties: {
        loan_id: {
          type: 'string',
          description: 'The ID of the loan to get details for',
        },
        borrower_name: {
          type: 'string',
          description: 'The name of the borrower (will find the first matching loan)',
        },
      },
      required: [],
    },
  },
  {
    name: 'get_alerts',
    description: 'Get alerts from the system. Can filter by severity or acknowledgement status.',
    input_schema: {
      type: 'object',
      properties: {
        severity: {
          type: 'string',
          description: 'Filter by alert severity',
          enum: ['critical', 'warning', 'info'],
        },
        acknowledged: {
          type: 'boolean',
          description: 'Filter by acknowledgement status (true/false)',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of alerts to return (default 10)',
        },
      },
      required: [],
    },
  },
  {
    name: 'get_covenants_in_breach',
    description: 'Get all covenants that are currently in breach status.',
    input_schema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'get_covenants_at_warning',
    description: 'Get all covenants that are at warning level (close to breach).',
    input_schema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'acknowledge_alert',
    description: 'Acknowledge an alert by its ID to mark it as reviewed.',
    input_schema: {
      type: 'object',
      properties: {
        alert_id: {
          type: 'string',
          description: 'The ID of the alert to acknowledge',
        },
      },
      required: ['alert_id'],
    },
  },
  {
    name: 'get_upcoming_covenant_tests',
    description: 'Get covenants with upcoming test due dates.',
    input_schema: {
      type: 'object',
      properties: {
        days: {
          type: 'number',
          description: 'Number of days to look ahead (default 30)',
        },
      },
      required: [],
    },
  },
  {
    name: 'get_documents_needing_review',
    description: 'Get documents that need review or have pending extraction.',
    input_schema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
] as const;

// Tool execution functions
export async function executeTool(
  toolName: string,
  toolInput: Record<string, unknown>,
  supabase: SupabaseClient,
  organizationId: string
): Promise<string> {
  try {
    switch (toolName) {
      case 'get_portfolio_summary':
        return await getPortfolioSummary(supabase, organizationId);
      case 'get_loans':
        return await getLoans(supabase, organizationId, toolInput);
      case 'get_loan_details':
        return await getLoanDetails(supabase, organizationId, toolInput);
      case 'get_alerts':
        return await getAlerts(supabase, organizationId, toolInput);
      case 'get_covenants_in_breach':
        return await getCovenantsInBreach(supabase, organizationId);
      case 'get_covenants_at_warning':
        return await getCovenantsAtWarning(supabase, organizationId);
      case 'acknowledge_alert':
        return await acknowledgeAlert(supabase, organizationId, toolInput);
      case 'get_upcoming_covenant_tests':
        return await getUpcomingCovenantTests(supabase, organizationId, toolInput);
      case 'get_documents_needing_review':
        return await getDocumentsNeedingReview(supabase, organizationId);
      default:
        return JSON.stringify({ error: `Unknown tool: ${toolName}` });
    }
  } catch (error) {
    console.error(`Tool execution error for ${toolName}:`, error);
    return JSON.stringify({ error: `Failed to execute ${toolName}: ${error instanceof Error ? error.message : 'Unknown error'}` });
  }
}

async function getPortfolioSummary(supabase: SupabaseClient, orgId: string): Promise<string> {
  // Get loans for this organization
  const { data: loansData } = await supabase
    .from('loans')
    .select('id, commitment_amount, outstanding_amount, status')
    .eq('organization_id', orgId)
    .is('deleted_at', null);

  const loans = loansData || [];
  const loanIds = loans.map(l => l.id);

  // Get alerts for this organization
  const { data: alertsData } = await supabase
    .from('alerts')
    .select('id, severity, acknowledged')
    .eq('organization_id', orgId);

  const alerts = alertsData || [];

  // Get covenants for org's loans, then get tests
  let tests: CovenantTest[] = [];
  if (loanIds.length > 0) {
    const { data: covenants } = await supabase
      .from('covenants')
      .select('id')
      .in('loan_id', loanIds)
      .is('deleted_at', null);

    if (covenants && covenants.length > 0) {
      const covenantIds = covenants.map(c => c.id);
      const { data: testsData } = await supabase
        .from('covenant_tests')
        .select('id, status, tested_at')
        .in('covenant_id', covenantIds)
        .order('tested_at', { ascending: false })
        .limit(100);
      tests = testsData || [];
    }
  }

  const summary = {
    total_loans: loans.length,
    total_commitment: formatCurrency(loans.reduce((sum, l) => sum + (Number(l.commitment_amount) || 0), 0)),
    total_outstanding: formatCurrency(loans.reduce((sum, l) => sum + (Number(l.outstanding_amount) || 0), 0)),
    utilization: loans.length > 0
      ? `${((loans.reduce((sum, l) => sum + (Number(l.outstanding_amount) || 0), 0) / loans.reduce((sum, l) => sum + (Number(l.commitment_amount) || 0), 0)) * 100).toFixed(1)}%`
      : '0%',
    loans_by_status: {
      active: loans.filter(l => l.status === 'active').length,
      matured: loans.filter(l => l.status === 'matured').length,
      defaulted: loans.filter(l => l.status === 'defaulted').length,
    },
    alerts: {
      total: alerts.length,
      critical: alerts.filter(a => a.severity === 'critical').length,
      warning: alerts.filter(a => a.severity === 'warning').length,
      unacknowledged: alerts.filter(a => !a.acknowledged).length,
    },
    covenant_compliance: {
      total_tests: tests.length,
      compliant: tests.filter(t => t.status === 'compliant').length,
      warning: tests.filter(t => t.status === 'warning').length,
      breach: tests.filter(t => t.status === 'breach').length,
    },
  };

  return JSON.stringify(summary, null, 2);
}

async function getLoans(
  supabase: SupabaseClient,
  orgId: string,
  input: Record<string, unknown>
): Promise<string> {
  let query = supabase
    .from('loans')
    .select(`
      id,
      name,
      facility_type,
      commitment_amount,
      outstanding_amount,
      status,
      maturity_date,
      borrowers (id, name, industry, rating)
    `)
    .eq('organization_id', orgId)
    .is('deleted_at', null);

  if (input.status) {
    query = query.eq('status', input.status);
  }

  if (input.search) {
    query = query.or(`name.ilike.%${input.search}%,borrowers.name.ilike.%${input.search}%`);
  }

  const limit = typeof input.limit === 'number' ? input.limit : 10;
  query = query.limit(limit);

  const { data, error } = await query;

  if (error) {
    return JSON.stringify({ error: error.message });
  }

  interface LoanWithBorrower {
    id: string;
    name: string;
    borrowers?: { name: string; industry?: string } | Array<{ name: string; industry?: string }>;
    facility_type: string;
    commitment_amount: number;
    outstanding_amount: number;
    status: string;
    maturity_date: string;
  }
  const loans = ((data || []) as unknown as LoanWithBorrower[]).map((loan) => {
    const borrower = Array.isArray(loan.borrowers) ? loan.borrowers[0] : loan.borrowers;
    return {
      id: loan.id,
      name: loan.name,
      borrower: borrower?.name || 'Unknown',
      industry: borrower?.industry || 'Unknown',
      type: loan.facility_type,
      commitment: formatCurrency(loan.commitment_amount),
      outstanding: formatCurrency(loan.outstanding_amount),
      utilization: `${((loan.outstanding_amount / loan.commitment_amount) * 100).toFixed(1)}%`,
      status: loan.status,
      maturity: loan.maturity_date,
    };
  });

  return JSON.stringify({ loans, count: loans.length }, null, 2);
}

async function getLoanDetails(
  supabase: SupabaseClient,
  orgId: string,
  input: Record<string, unknown>
): Promise<string> {
  let loanQuery = supabase
    .from('loans')
    .select(`
      id,
      name,
      facility_type,
      commitment_amount,
      outstanding_amount,
      status,
      maturity_date,
      interest_rate,
      borrowers (id, name, industry, rating)
    `)
    .eq('organization_id', orgId)
    .is('deleted_at', null);

  if (input.loan_id) {
    loanQuery = loanQuery.eq('id', input.loan_id);
  } else if (input.borrower_name) {
    // First find borrower
    const { data: borrowers } = await supabase
      .from('borrowers')
      .select('id')
      .ilike('name', `%${input.borrower_name}%`)
      .limit(1);

    if (borrowers && borrowers.length > 0) {
      loanQuery = loanQuery.eq('borrower_id', borrowers[0].id);
    }
  }

  const { data: loans, error: loanError } = await loanQuery.limit(1).single();

  if (loanError || !loans) {
    return JSON.stringify({ error: 'Loan not found' });
  }

  interface LoanDetails {
    id: string;
    name: string;
    facility_type: string;
    commitment_amount: number;
    outstanding_amount: number;
    status: string;
    maturity_date: string;
    interest_rate?: number;
    borrowers?: { id: string; name: string; industry?: string; rating?: string } | Array<{ id: string; name: string; industry?: string; rating?: string }>;
  }
  const loan = loans as unknown as LoanDetails;

  // Get covenants with latest tests
  const { data: covenants } = await supabase
    .from('covenants')
    .select(`
      id,
      name,
      type,
      operator,
      threshold,
      testing_frequency,
      covenant_tests (
        calculated_value,
        status,
        headroom_percentage,
        tested_at
      )
    `)
    .eq('loan_id', loan.id)
    .is('deleted_at', null);

  interface CovenantWithTests {
    name: string;
    type: string;
    operator: string;
    threshold: number;
    testing_frequency: string;
    covenant_tests?: Array<{
      calculated_value: number;
      status: string;
      headroom_percentage: number;
      tested_at: string;
    }>;
  }
  const covenantDetails = ((covenants || []) as unknown as CovenantWithTests[]).map((c) => {
    const latestTest = c.covenant_tests?.sort((a, b) =>
      new Date(b.tested_at).getTime() - new Date(a.tested_at).getTime()
    )[0];

    return {
      name: c.name,
      type: c.type,
      threshold: `${c.operator === 'max' ? '≤' : '≥'} ${c.threshold}x`,
      frequency: c.testing_frequency,
      current_value: latestTest ? `${latestTest.calculated_value.toFixed(2)}x` : 'Not tested',
      status: latestTest?.status || 'pending',
      headroom: latestTest ? `${latestTest.headroom_percentage.toFixed(1)}%` : 'N/A',
      last_tested: latestTest?.tested_at || 'Never',
    };
  });

  const borrower = Array.isArray(loan.borrowers) ? loan.borrowers[0] : loan.borrowers;
  const result = {
    loan: {
      id: loan.id,
      name: loan.name,
      borrower: borrower?.name || 'Unknown',
      industry: borrower?.industry || 'Unknown',
      rating: borrower?.rating || 'Not rated',
      type: loan.facility_type,
      commitment: formatCurrency(loan.commitment_amount),
      outstanding: formatCurrency(loan.outstanding_amount),
      utilization: `${((loan.outstanding_amount / loan.commitment_amount) * 100).toFixed(1)}%`,
      interest_rate: loan.interest_rate ? `${(loan.interest_rate * 100).toFixed(2)}%` : 'N/A',
      status: loan.status,
      maturity: loan.maturity_date,
    },
    covenants: covenantDetails,
  };

  return JSON.stringify(result, null, 2);
}

async function getAlerts(
  supabase: SupabaseClient,
  orgId: string,
  input: Record<string, unknown>
): Promise<string> {
  let query = supabase
    .from('alerts')
    .select(`
      id,
      severity,
      title,
      message,
      acknowledged,
      created_at,
      loans (name, borrowers (name))
    `)
    .eq('organization_id', orgId)
    .order('created_at', { ascending: false });

  if (input.severity) {
    query = query.eq('severity', input.severity);
  }

  if (typeof input.acknowledged === 'boolean') {
    query = query.eq('acknowledged', input.acknowledged);
  }

  const limit = typeof input.limit === 'number' ? input.limit : 10;
  query = query.limit(limit);

  const { data, error } = await query;

  if (error) {
    return JSON.stringify({ error: error.message });
  }

  interface AlertWithLoan {
    id: string;
    severity: string;
    title: string;
    message: string;
    acknowledged: boolean;
    created_at: string;
    loans?: { name: string; borrowers?: { name: string } };
  }
  const alerts = ((data || []) as unknown as AlertWithLoan[]).map((a) => ({
    id: a.id,
    severity: a.severity,
    title: a.title,
    message: a.message,
    borrower: a.loans?.borrowers?.name || 'Unknown',
    loan: a.loans?.name || 'Unknown',
    acknowledged: a.acknowledged,
    created_at: a.created_at,
  }));

  return JSON.stringify({ alerts, count: alerts.length }, null, 2);
}

async function getCovenantsInBreach(supabase: SupabaseClient, orgId: string): Promise<string> {
  // First get loan IDs for this organization
  const { data: loans } = await supabase
    .from('loans')
    .select('id')
    .eq('organization_id', orgId)
    .is('deleted_at', null);

  if (!loans || loans.length === 0) {
    return JSON.stringify({ breaches: [], count: 0, message: 'No loans found in your portfolio' });
  }

  const loanIds = loans.map(l => l.id);

  // Get covenants for these loans
  const { data: covenants } = await supabase
    .from('covenants')
    .select('id')
    .in('loan_id', loanIds)
    .is('deleted_at', null);

  if (!covenants || covenants.length === 0) {
    return JSON.stringify({ breaches: [], count: 0, message: 'No covenants found for your loans' });
  }

  const covenantIds = covenants.map(c => c.id);

  // Now get breach tests for these covenants
  const { data, error } = await supabase
    .from('covenant_tests')
    .select(`
      id,
      calculated_value,
      threshold_at_test,
      headroom_percentage,
      tested_at,
      covenants (
        name,
        type,
        operator,
        loans (
          name,
          borrowers (name)
        )
      )
    `)
    .in('covenant_id', covenantIds)
    .eq('status', 'breach')
    .order('tested_at', { ascending: false })
    .limit(20);

  if (error) {
    return JSON.stringify({ error: error.message });
  }

  interface TestWithCovenant {
    calculated_value: number;
    threshold_at_test: number;
    headroom_percentage: number;
    tested_at: string;
    covenants?: {
      name: string;
      type: string;
      operator: string;
      loans?: { name: string; borrowers?: { name: string } };
    };
  }
  const breaches = ((data || []) as unknown as TestWithCovenant[]).map((t) => ({
    borrower: t.covenants?.loans?.borrowers?.name || 'Unknown',
    loan: t.covenants?.loans?.name || 'Unknown',
    covenant: t.covenants?.name || 'Unknown',
    type: t.covenants?.type || 'Unknown',
    current_value: `${(t.calculated_value || 0).toFixed(2)}x`,
    threshold: `${t.covenants?.operator === 'max' ? '≤' : '≥'} ${t.threshold_at_test}x`,
    headroom: `${(t.headroom_percentage || 0).toFixed(1)}%`,
    tested_at: t.tested_at,
  }));

  return JSON.stringify({ breaches, count: breaches.length }, null, 2);
}

async function getCovenantsAtWarning(supabase: SupabaseClient, orgId: string): Promise<string> {
  // First get loan IDs for this organization
  const { data: loans } = await supabase
    .from('loans')
    .select('id')
    .eq('organization_id', orgId)
    .is('deleted_at', null);

  if (!loans || loans.length === 0) {
    return JSON.stringify({ warnings: [], count: 0, message: 'No loans found in your portfolio' });
  }

  const loanIds = loans.map(l => l.id);

  // Get covenants for these loans
  const { data: covenants } = await supabase
    .from('covenants')
    .select('id')
    .in('loan_id', loanIds)
    .is('deleted_at', null);

  if (!covenants || covenants.length === 0) {
    return JSON.stringify({ warnings: [], count: 0, message: 'No covenants found for your loans' });
  }

  const covenantIds = covenants.map(c => c.id);

  // Now get warning tests for these covenants
  const { data, error } = await supabase
    .from('covenant_tests')
    .select(`
      id,
      calculated_value,
      threshold_at_test,
      headroom_percentage,
      tested_at,
      covenants (
        name,
        type,
        operator,
        loans (
          name,
          borrowers (name)
        )
      )
    `)
    .in('covenant_id', covenantIds)
    .eq('status', 'warning')
    .order('tested_at', { ascending: false })
    .limit(20);

  if (error) {
    return JSON.stringify({ error: error.message });
  }

  interface WarningTest {
    calculated_value: number;
    threshold_at_test: number;
    headroom_percentage: number;
    tested_at: string;
    covenants?: {
      name: string;
      type: string;
      operator: string;
      loans?: { name: string; borrowers?: { name: string } };
    };
  }
  const warnings = ((data || []) as unknown as WarningTest[]).map((t) => ({
    borrower: t.covenants?.loans?.borrowers?.name || 'Unknown',
    loan: t.covenants?.loans?.name || 'Unknown',
    covenant: t.covenants?.name || 'Unknown',
    type: t.covenants?.type || 'Unknown',
    current_value: `${(t.calculated_value || 0).toFixed(2)}x`,
    threshold: `${t.covenants?.operator === 'max' ? '≤' : '≥'} ${t.threshold_at_test}x`,
    headroom: `${(t.headroom_percentage || 0).toFixed(1)}%`,
    tested_at: t.tested_at,
  }));

  return JSON.stringify({ warnings, count: warnings.length }, null, 2);
}

async function acknowledgeAlert(
  supabase: SupabaseClient,
  orgId: string,
  input: Record<string, unknown>
): Promise<string> {
  if (!input.alert_id) {
    return JSON.stringify({ error: 'alert_id is required' });
  }

  const { data, error } = await supabase
    .from('alerts')
    .update({ acknowledged: true, updated_at: new Date().toISOString() } as never)
    .eq('id', input.alert_id)
    .eq('organization_id', orgId)
    .select()
    .single();

  if (error) {
    return JSON.stringify({ error: error.message });
  }

  return JSON.stringify({
    success: true,
    message: `Alert "${(data as { title?: string })?.title}" has been acknowledged.`
  });
}

async function getUpcomingCovenantTests(
  supabase: SupabaseClient,
  orgId: string,
  input: Record<string, unknown>
): Promise<string> {
  const days = typeof input.days === 'number' ? input.days : 30;
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + days);

  const { data, error } = await supabase
    .from('covenants')
    .select(`
      id,
      name,
      type,
      test_due_date,
      loans (
        name,
        borrowers (name)
      )
    `)
    .gte('test_due_date', new Date().toISOString().split('T')[0])
    .lte('test_due_date', futureDate.toISOString().split('T')[0])
    .order('test_due_date', { ascending: true })
    .limit(20);

  if (error) {
    return JSON.stringify({ error: error.message });
  }

  interface UpcomingCovenant {
    name: string;
    type: string;
    test_due_date: string;
    loans?: { name: string; borrowers?: { name: string } };
  }
  const upcoming = ((data || []) as unknown as UpcomingCovenant[]).map((c) => ({
    borrower: c.loans?.borrowers?.name || 'Unknown',
    loan: c.loans?.name || 'Unknown',
    covenant: c.name,
    type: c.type,
    due_date: c.test_due_date,
    days_until: Math.ceil((new Date(c.test_due_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
  }));

  return JSON.stringify({ upcoming_tests: upcoming, count: upcoming.length }, null, 2);
}

async function getDocumentsNeedingReview(supabase: SupabaseClient, orgId: string): Promise<string> {
  const { data, error } = await supabase
    .from('documents')
    .select(`
      id,
      name,
      type,
      extraction_status,
      created_at,
      loans (name, borrowers (name))
    `)
    .eq('organization_id', orgId)
    .in('extraction_status', ['pending', 'needs_review'])
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) {
    return JSON.stringify({ error: error.message });
  }

  interface DocumentWithLoan {
    id: string;
    name: string;
    type: string;
    extraction_status: string;
    created_at: string;
    loans?: { name: string; borrowers?: { name: string } };
  }
  const documents = ((data || []) as unknown as DocumentWithLoan[]).map((d) => ({
    id: d.id,
    name: d.name,
    type: d.type,
    status: d.extraction_status,
    borrower: d.loans?.borrowers?.name || 'Unknown',
    loan: d.loans?.name || 'Unknown',
    uploaded_at: d.created_at,
  }));

  return JSON.stringify({ documents, count: documents.length }, null, 2);
}

function formatCurrency(amount: number): string {
  if (amount >= 1000000000) {
    return `$${(amount / 1000000000).toFixed(2)}B`;
  }
  if (amount >= 1000000) {
    return `$${(amount / 1000000).toFixed(1)}M`;
  }
  return `$${amount.toLocaleString()}`;
}
