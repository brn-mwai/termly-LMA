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
  {
    name: 'get_extracted_data',
    description: 'Get extracted data from a specific document including covenants, EBITDA definition, addbacks, and financial data.',
    input_schema: {
      type: 'object',
      properties: {
        document_id: {
          type: 'string',
          description: 'The ID of the document to get extracted data from',
        },
        document_name: {
          type: 'string',
          description: 'Search for document by name (partial match)',
        },
      },
      required: [],
    },
  },
  {
    name: 'get_financial_periods',
    description: 'Get financial period data including EBITDA, revenue, total debt, and other metrics. Can filter by loan or date range.',
    input_schema: {
      type: 'object',
      properties: {
        loan_id: {
          type: 'string',
          description: 'Filter by specific loan ID',
        },
        borrower_name: {
          type: 'string',
          description: 'Filter by borrower name',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of periods to return (default 10)',
        },
      },
      required: [],
    },
  },
  {
    name: 'get_borrowers',
    description: 'Get a list of borrowers with their details. Can search by name or filter by industry.',
    input_schema: {
      type: 'object',
      properties: {
        search: {
          type: 'string',
          description: 'Search borrowers by name',
        },
        industry: {
          type: 'string',
          description: 'Filter by industry',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of borrowers to return (default 10)',
        },
      },
      required: [],
    },
  },
  {
    name: 'get_ebitda_definition',
    description: 'Get the EBITDA definition and permitted addbacks for a specific loan.',
    input_schema: {
      type: 'object',
      properties: {
        loan_id: {
          type: 'string',
          description: 'The ID of the loan',
        },
        borrower_name: {
          type: 'string',
          description: 'Find loan by borrower name',
        },
      },
      required: [],
    },
  },
  {
    name: 'get_covenant_history',
    description: 'Get the full test history for a specific covenant showing trends over time.',
    input_schema: {
      type: 'object',
      properties: {
        covenant_id: {
          type: 'string',
          description: 'The ID of the covenant',
        },
        covenant_name: {
          type: 'string',
          description: 'Search by covenant name',
        },
        borrower_name: {
          type: 'string',
          description: 'Filter by borrower name',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of test results to return (default 12)',
        },
      },
      required: [],
    },
  },
  {
    name: 'trigger_extraction',
    description: 'Trigger document extraction for a specific document. Returns immediately with status.',
    input_schema: {
      type: 'object',
      properties: {
        document_id: {
          type: 'string',
          description: 'The ID of the document to extract',
        },
      },
      required: ['document_id'],
    },
  },
  {
    name: 'get_audit_log',
    description: 'Get recent audit log entries showing actions taken in the system.',
    input_schema: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          description: 'Filter by action type (create, update, delete, extract, etc.)',
        },
        entity_type: {
          type: 'string',
          description: 'Filter by entity type (loan, document, covenant, alert)',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of entries to return (default 20)',
        },
      },
      required: [],
    },
  },
  {
    name: 'get_risk_scores',
    description: 'Get risk scores for borrowers based on covenant compliance, headroom, trends, and credit rating. Returns risk level (low/medium/high) with contributing factors.',
    input_schema: {
      type: 'object',
      properties: {
        borrower_name: {
          type: 'string',
          description: 'Get risk score for a specific borrower',
        },
      },
      required: [],
    },
  },
  // ===== AGENTIC ACTION TOOLS =====
  {
    name: 'create_loan',
    description: 'Create a new loan in the portfolio. Requires borrower_id and loan name.',
    input_schema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Name of the loan/facility' },
        borrower_id: { type: 'string', description: 'ID of the borrower' },
        principal_amount: { type: 'number', description: 'Principal/commitment amount' },
        interest_rate: { type: 'number', description: 'Interest rate (e.g., 0.05 for 5%)' },
        maturity_date: { type: 'string', description: 'Maturity date (YYYY-MM-DD)' },
        facility_type: { type: 'string', description: 'Type: term_loan, revolver, delayed_draw' },
      },
      required: ['name', 'borrower_id'],
    },
  },
  {
    name: 'update_loan',
    description: 'Update an existing loan. Can update name, amounts, rates, status, dates.',
    input_schema: {
      type: 'object',
      properties: {
        loan_id: { type: 'string', description: 'ID of the loan to update' },
        name: { type: 'string', description: 'New name' },
        principal_amount: { type: 'number', description: 'New principal amount' },
        interest_rate: { type: 'number', description: 'New interest rate' },
        status: { type: 'string', description: 'New status: active, matured, defaulted' },
        maturity_date: { type: 'string', description: 'New maturity date' },
      },
      required: ['loan_id'],
    },
  },
  {
    name: 'create_borrower',
    description: 'Create a new borrower in the system.',
    input_schema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Borrower name' },
        industry: { type: 'string', description: 'Industry sector' },
        rating: { type: 'string', description: 'Credit rating (e.g., BBB+, BB-)' },
        contact_email: { type: 'string', description: 'Contact email' },
      },
      required: ['name'],
    },
  },
  {
    name: 'update_borrower',
    description: 'Update an existing borrower.',
    input_schema: {
      type: 'object',
      properties: {
        borrower_id: { type: 'string', description: 'ID of borrower to update' },
        name: { type: 'string', description: 'New name' },
        industry: { type: 'string', description: 'New industry' },
        rating: { type: 'string', description: 'New credit rating' },
      },
      required: ['borrower_id'],
    },
  },
  {
    name: 'create_covenant',
    description: 'Create a new covenant for a loan.',
    input_schema: {
      type: 'object',
      properties: {
        loan_id: { type: 'string', description: 'ID of the loan' },
        name: { type: 'string', description: 'Covenant name (e.g., "Senior Leverage Ratio")' },
        type: { type: 'string', description: 'Type: leverage, interest_coverage, fixed_charge_coverage, etc.' },
        operator: { type: 'string', description: 'Operator: max or min' },
        threshold: { type: 'number', description: 'Threshold value (e.g., 4.5 for 4.5x)' },
        testing_frequency: { type: 'string', description: 'Frequency: quarterly, monthly, annually' },
      },
      required: ['loan_id', 'name', 'type', 'threshold'],
    },
  },
  {
    name: 'update_covenant',
    description: 'Update an existing covenant threshold or other details.',
    input_schema: {
      type: 'object',
      properties: {
        covenant_id: { type: 'string', description: 'ID of covenant to update' },
        threshold: { type: 'number', description: 'New threshold' },
        testing_frequency: { type: 'string', description: 'New frequency' },
        name: { type: 'string', description: 'New name' },
      },
      required: ['covenant_id'],
    },
  },
  {
    name: 'record_covenant_test',
    description: 'Record a new covenant test result with calculated value.',
    input_schema: {
      type: 'object',
      properties: {
        covenant_id: { type: 'string', description: 'ID of the covenant' },
        calculated_value: { type: 'number', description: 'The calculated ratio value' },
        period_end_date: { type: 'string', description: 'Period end date (YYYY-MM-DD)' },
        notes: { type: 'string', description: 'Optional notes about the test' },
      },
      required: ['covenant_id', 'calculated_value'],
    },
  },
  {
    name: 'create_covenant_waiver',
    description: 'Create a waiver for a covenant that is in breach or expected to breach.',
    input_schema: {
      type: 'object',
      properties: {
        covenant_id: { type: 'string', description: 'ID of the covenant' },
        waiver_reason: { type: 'string', description: 'Reason for the waiver' },
        waiver_end_date: { type: 'string', description: 'When the waiver expires (YYYY-MM-DD)' },
      },
      required: ['covenant_id', 'waiver_reason'],
    },
  },
  {
    name: 'dismiss_alert',
    description: 'Dismiss an alert with a reason.',
    input_schema: {
      type: 'object',
      properties: {
        alert_id: { type: 'string', description: 'ID of the alert' },
        reason: { type: 'string', description: 'Reason for dismissing' },
      },
      required: ['alert_id'],
    },
  },
  {
    name: 'escalate_alert',
    description: 'Escalate an alert to critical status.',
    input_schema: {
      type: 'object',
      properties: {
        alert_id: { type: 'string', description: 'ID of the alert' },
        escalation_reason: { type: 'string', description: 'Reason for escalation' },
      },
      required: ['alert_id'],
    },
  },
  {
    name: 'bulk_acknowledge_alerts',
    description: 'Acknowledge multiple alerts at once.',
    input_schema: {
      type: 'object',
      properties: {
        alert_ids: { type: 'array', items: { type: 'string' }, description: 'Array of alert IDs to acknowledge' },
        notes: { type: 'string', description: 'Notes for acknowledgement' },
      },
      required: ['alert_ids'],
    },
  },
  {
    name: 'create_financial_period',
    description: 'Record financial data for a period (quarterly/annual financials).',
    input_schema: {
      type: 'object',
      properties: {
        loan_id: { type: 'string', description: 'ID of the loan' },
        period_end_date: { type: 'string', description: 'Period end date (YYYY-MM-DD)' },
        revenue: { type: 'number', description: 'Revenue for the period' },
        ebitda: { type: 'number', description: 'EBITDA for the period' },
        total_debt: { type: 'number', description: 'Total debt at period end' },
        cash: { type: 'number', description: 'Cash at period end' },
        interest_expense: { type: 'number', description: 'Interest expense for the period' },
      },
      required: ['loan_id', 'period_end_date'],
    },
  },
  {
    name: 'categorize_document',
    description: 'Categorize a document by type.',
    input_schema: {
      type: 'object',
      properties: {
        document_id: { type: 'string', description: 'ID of the document' },
        category: { type: 'string', description: 'Category: credit_agreement, amendment, financial_statement, compliance_certificate' },
      },
      required: ['document_id', 'category'],
    },
  },
  {
    name: 'archive_document',
    description: 'Archive a document that is no longer needed.',
    input_schema: {
      type: 'object',
      properties: {
        document_id: { type: 'string', description: 'ID of the document' },
        reason: { type: 'string', description: 'Reason for archiving' },
      },
      required: ['document_id'],
    },
  },
  {
    name: 'get_memos',
    description: 'Get a list of credit memos. Can filter by loan or search by title.',
    input_schema: {
      type: 'object',
      properties: {
        loan_id: { type: 'string', description: 'Filter by loan ID' },
        borrower_name: { type: 'string', description: 'Filter by borrower name' },
        search: { type: 'string', description: 'Search memo titles' },
        limit: { type: 'number', description: 'Maximum number of memos to return (default 10)' },
      },
      required: [],
    },
  },
  {
    name: 'create_memo',
    description: 'Create a new credit memo for a loan. Can optionally generate content with AI.',
    input_schema: {
      type: 'object',
      properties: {
        loan_id: { type: 'string', description: 'ID of the loan the memo is for' },
        title: { type: 'string', description: 'Title of the memo' },
        content: { type: 'string', description: 'Content of the memo (markdown supported)' },
        generated_by_ai: { type: 'boolean', description: 'Whether this was AI-generated (default true)' },
      },
      required: ['loan_id', 'title', 'content'],
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
      case 'get_extracted_data':
        return await getExtractedData(supabase, organizationId, toolInput);
      case 'get_financial_periods':
        return await getFinancialPeriods(supabase, organizationId, toolInput);
      case 'get_borrowers':
        return await getBorrowers(supabase, organizationId, toolInput);
      case 'get_ebitda_definition':
        return await getEbitdaDefinition(supabase, organizationId, toolInput);
      case 'get_covenant_history':
        return await getCovenantHistory(supabase, organizationId, toolInput);
      case 'trigger_extraction':
        return await triggerExtraction(supabase, organizationId, toolInput);
      case 'get_audit_log':
        return await getAuditLog(supabase, organizationId, toolInput);
      case 'get_risk_scores':
        return await getRiskScores(supabase, organizationId, toolInput);
      // ===== AGENTIC ACTION TOOLS =====
      case 'create_loan':
        return await executeAction('create_loan', toolInput);
      case 'update_loan':
        return await executeAction('update_loan', toolInput);
      case 'create_borrower':
        return await executeAction('create_borrower', toolInput);
      case 'update_borrower':
        return await executeAction('update_borrower', toolInput);
      case 'create_covenant':
        return await executeAction('create_covenant', toolInput);
      case 'update_covenant':
        return await executeAction('update_covenant', toolInput);
      case 'record_covenant_test':
        return await executeAction('create_covenant_test', toolInput);
      case 'create_covenant_waiver':
        return await executeAction('create_covenant_waiver', toolInput);
      case 'dismiss_alert':
        return await executeAction('dismiss_alert', toolInput);
      case 'escalate_alert':
        return await executeAction('escalate_alert', toolInput);
      case 'bulk_acknowledge_alerts':
        return await executeAction('bulk_acknowledge_alerts', toolInput);
      case 'create_financial_period':
        return await executeAction('create_financial_period', toolInput);
      case 'categorize_document':
        return await executeAction('categorize_document', toolInput);
      case 'archive_document':
        return await executeAction('archive_document', toolInput);
      case 'get_memos':
        return await getMemos(supabase, organizationId, toolInput);
      case 'create_memo':
        return await executeAction('create_memo', toolInput);
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

// ============ NEW TOOLS ============

async function getExtractedData(
  supabase: SupabaseClient,
  orgId: string,
  input: Record<string, unknown>
): Promise<string> {
  let query = supabase
    .from('documents')
    .select(`
      id,
      name,
      type,
      extraction_status,
      extraction_method,
      extracted_data,
      confidence_scores,
      loans (name, borrowers (name))
    `)
    .eq('organization_id', orgId)
    .is('deleted_at', null);

  if (input.document_id) {
    query = query.eq('id', input.document_id);
  } else if (input.document_name) {
    query = query.ilike('name', `%${input.document_name}%`);
  }

  const { data, error } = await query.limit(1).single();

  if (error || !data) {
    return JSON.stringify({ error: 'Document not found' });
  }

  interface DocumentWithExtraction {
    id: string;
    name: string;
    type: string;
    extraction_status: string;
    extraction_method?: string;
    extracted_data?: {
      documentType?: string;
      borrowerName?: string;
      facilityName?: string;
      ebitdaDefinition?: string;
      ebitdaAddbacks?: Array<{ category: string; description: string; cap?: string }>;
      covenants?: Array<{
        name: string;
        type: string;
        operator: string;
        threshold: number;
        testingFrequency: string;
        sourceClause?: string;
      }>;
      financialData?: Array<{
        periodEndDate: string;
        periodType: string;
        revenue?: number;
        ebitdaReported?: number;
        totalDebt?: number;
      }>;
      overallConfidence?: number;
    };
    confidence_scores?: { overall?: number };
    loans?: { name: string; borrowers?: { name: string } };
  }

  const doc = data as unknown as DocumentWithExtraction;
  const extracted = doc.extracted_data;

  if (!extracted || doc.extraction_status !== 'completed') {
    return JSON.stringify({
      document: {
        id: doc.id,
        name: doc.name,
        status: doc.extraction_status,
      },
      message: doc.extraction_status === 'pending'
        ? 'Document has not been extracted yet. Use trigger_extraction to start.'
        : `Extraction status: ${doc.extraction_status}`,
    });
  }

  const result = {
    document: {
      id: doc.id,
      name: doc.name,
      type: doc.type,
      borrower: doc.loans?.borrowers?.name || 'Unknown',
      loan: doc.loans?.name || 'Unknown',
      extraction_method: doc.extraction_method,
      confidence: extracted.overallConfidence || doc.confidence_scores?.overall,
    },
    ebitda: {
      definition: extracted.ebitdaDefinition || 'Not found',
      addbacks: extracted.ebitdaAddbacks?.map(a => ({
        category: a.category,
        description: a.description,
        cap: a.cap || 'No cap',
      })) || [],
    },
    covenants: extracted.covenants?.map(c => ({
      name: c.name,
      type: c.type,
      threshold: `${c.operator === 'max' ? '≤' : '≥'} ${c.threshold}`,
      frequency: c.testingFrequency,
      source: c.sourceClause?.substring(0, 200) + (c.sourceClause && c.sourceClause.length > 200 ? '...' : ''),
    })) || [],
    financial_data: extracted.financialData?.map(f => ({
      period: f.periodEndDate,
      type: f.periodType,
      revenue: f.revenue ? formatCurrency(f.revenue) : 'N/A',
      ebitda: f.ebitdaReported ? formatCurrency(f.ebitdaReported) : 'N/A',
      total_debt: f.totalDebt ? formatCurrency(f.totalDebt) : 'N/A',
    })) || [],
  };

  return JSON.stringify(result, null, 2);
}

async function getFinancialPeriods(
  supabase: SupabaseClient,
  orgId: string,
  input: Record<string, unknown>
): Promise<string> {
  let query = supabase
    .from('financial_periods')
    .select(`
      id,
      period_end_date,
      period_type,
      revenue,
      ebitda_reported,
      total_debt,
      interest_expense,
      fixed_charges,
      current_assets,
      current_liabilities,
      net_worth,
      loans (name, borrowers (name))
    `)
    .eq('organization_id', orgId)
    .order('period_end_date', { ascending: false });

  if (input.loan_id) {
    query = query.eq('loan_id', input.loan_id);
  }

  const limit = typeof input.limit === 'number' ? input.limit : 10;
  const { data, error } = await query.limit(limit);

  if (error) {
    return JSON.stringify({ error: error.message });
  }

  interface FinancialPeriod {
    id: string;
    period_end_date: string;
    period_type: string;
    revenue?: number;
    ebitda_reported?: number;
    total_debt?: number;
    interest_expense?: number;
    fixed_charges?: number;
    current_assets?: number;
    current_liabilities?: number;
    net_worth?: number;
    loans?: { name: string; borrowers?: { name: string } };
  }

  // Filter by borrower name if provided
  let periods = (data || []) as unknown as FinancialPeriod[];
  if (input.borrower_name) {
    const searchName = String(input.borrower_name).toLowerCase();
    periods = periods.filter(p =>
      p.loans?.borrowers?.name?.toLowerCase().includes(searchName)
    );
  }

  const result = periods.map(p => ({
    period: p.period_end_date,
    type: p.period_type,
    borrower: p.loans?.borrowers?.name || 'Unknown',
    loan: p.loans?.name || 'Unknown',
    revenue: p.revenue ? formatCurrency(p.revenue) : 'N/A',
    ebitda: p.ebitda_reported ? formatCurrency(p.ebitda_reported) : 'N/A',
    total_debt: p.total_debt ? formatCurrency(p.total_debt) : 'N/A',
    interest_expense: p.interest_expense ? formatCurrency(p.interest_expense) : 'N/A',
    current_ratio: p.current_assets && p.current_liabilities
      ? `${(p.current_assets / p.current_liabilities).toFixed(2)}x`
      : 'N/A',
    net_worth: p.net_worth ? formatCurrency(p.net_worth) : 'N/A',
  }));

  return JSON.stringify({ financial_periods: result, count: result.length }, null, 2);
}

async function getBorrowers(
  supabase: SupabaseClient,
  orgId: string,
  input: Record<string, unknown>
): Promise<string> {
  let query = supabase
    .from('borrowers')
    .select(`
      id,
      name,
      industry,
      rating,
      loans (id, name, status, commitment_amount)
    `)
    .eq('organization_id', orgId)
    .is('deleted_at', null);

  if (input.search) {
    query = query.ilike('name', `%${input.search}%`);
  }

  if (input.industry) {
    query = query.ilike('industry', `%${input.industry}%`);
  }

  const limit = typeof input.limit === 'number' ? input.limit : 10;
  const { data, error } = await query.limit(limit);

  if (error) {
    return JSON.stringify({ error: error.message });
  }

  interface BorrowerWithLoans {
    id: string;
    name: string;
    industry?: string;
    rating?: string;
    loans?: Array<{ id: string; name: string; status: string; commitment_amount: number }>;
  }

  const borrowers = ((data || []) as unknown as BorrowerWithLoans[]).map(b => ({
    id: b.id,
    name: b.name,
    industry: b.industry || 'Unknown',
    rating: b.rating || 'Not rated',
    total_loans: b.loans?.length || 0,
    total_commitment: formatCurrency(
      b.loans?.reduce((sum, l) => sum + (Number(l.commitment_amount) || 0), 0) || 0
    ),
    active_loans: b.loans?.filter(l => l.status === 'active').length || 0,
    loan_names: b.loans?.map(l => l.name).join(', ') || 'None',
  }));

  return JSON.stringify({ borrowers, count: borrowers.length }, null, 2);
}

async function getEbitdaDefinition(
  supabase: SupabaseClient,
  orgId: string,
  input: Record<string, unknown>
): Promise<string> {
  // Find the loan first
  let loanId = input.loan_id as string | undefined;

  if (!loanId && input.borrower_name) {
    const { data: borrowers } = await supabase
      .from('borrowers')
      .select('id')
      .eq('organization_id', orgId)
      .ilike('name', `%${input.borrower_name}%`)
      .limit(1);

    if (borrowers && borrowers.length > 0) {
      const { data: loans } = await supabase
        .from('loans')
        .select('id')
        .eq('borrower_id', borrowers[0].id)
        .limit(1);

      if (loans && loans.length > 0) {
        loanId = loans[0].id;
      }
    }
  }

  if (!loanId) {
    return JSON.stringify({ error: 'Loan not found. Provide loan_id or borrower_name.' });
  }

  // Get documents with extracted EBITDA definitions
  const { data: documents } = await supabase
    .from('documents')
    .select(`
      id,
      name,
      extracted_data,
      loans (name, borrowers (name))
    `)
    .eq('loan_id', loanId)
    .eq('extraction_status', 'completed')
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  interface DocWithEbitda {
    id: string;
    name: string;
    extracted_data?: {
      ebitdaDefinition?: string;
      ebitdaAddbacks?: Array<{ category: string; description: string; cap?: string; confidence?: number }>;
    };
    loans?: { name: string; borrowers?: { name: string } };
  }

  const docs = (documents || []) as unknown as DocWithEbitda[];
  const docWithEbitda = docs.find(d => d.extracted_data?.ebitdaDefinition);

  if (!docWithEbitda || !docWithEbitda.extracted_data) {
    return JSON.stringify({
      error: 'No EBITDA definition found. Extract a credit agreement document first.',
      loan: docs[0]?.loans?.name || 'Unknown',
    });
  }

  const result = {
    borrower: docWithEbitda.loans?.borrowers?.name || 'Unknown',
    loan: docWithEbitda.loans?.name || 'Unknown',
    source_document: docWithEbitda.name,
    ebitda_definition: docWithEbitda.extracted_data.ebitdaDefinition,
    addbacks: docWithEbitda.extracted_data.ebitdaAddbacks?.map(a => ({
      category: a.category,
      description: a.description,
      cap: a.cap || 'No cap specified',
    })) || [],
    total_addbacks: docWithEbitda.extracted_data.ebitdaAddbacks?.length || 0,
  };

  return JSON.stringify(result, null, 2);
}

async function getCovenantHistory(
  supabase: SupabaseClient,
  orgId: string,
  input: Record<string, unknown>
): Promise<string> {
  // Find covenant(s) based on input
  let covenantIds: string[] = [];

  if (input.covenant_id) {
    covenantIds = [input.covenant_id as string];
  } else {
    // Get loans for this org first
    const { data: loans } = await supabase
      .from('loans')
      .select('id, borrowers (name)')
      .eq('organization_id', orgId)
      .is('deleted_at', null);

    if (!loans || loans.length === 0) {
      return JSON.stringify({ error: 'No loans found' });
    }

    let loanIds = loans.map(l => l.id);

    // Filter by borrower if provided
    if (input.borrower_name) {
      interface LoanWithBorrower {
        id: string;
        borrowers?: { name: string } | Array<{ name: string }>;
      }
      const searchName = String(input.borrower_name).toLowerCase();
      loanIds = (loans as unknown as LoanWithBorrower[])
        .filter(l => {
          const borrower = Array.isArray(l.borrowers) ? l.borrowers[0] : l.borrowers;
          return borrower?.name?.toLowerCase().includes(searchName);
        })
        .map(l => l.id);
    }

    // Get covenants
    let covenantQuery = supabase
      .from('covenants')
      .select('id, name')
      .in('loan_id', loanIds)
      .is('deleted_at', null);

    if (input.covenant_name) {
      covenantQuery = covenantQuery.ilike('name', `%${input.covenant_name}%`);
    }

    const { data: covenants } = await covenantQuery.limit(1);
    covenantIds = (covenants || []).map(c => c.id);
  }

  if (covenantIds.length === 0) {
    return JSON.stringify({ error: 'Covenant not found' });
  }

  const limit = typeof input.limit === 'number' ? input.limit : 12;

  const { data: tests, error } = await supabase
    .from('covenant_tests')
    .select(`
      id,
      calculated_value,
      threshold_at_test,
      status,
      headroom_percentage,
      tested_at,
      covenants (
        name,
        type,
        operator,
        loans (name, borrowers (name))
      )
    `)
    .in('covenant_id', covenantIds)
    .order('tested_at', { ascending: false })
    .limit(limit);

  if (error) {
    return JSON.stringify({ error: error.message });
  }

  interface TestHistory {
    calculated_value: number;
    threshold_at_test: number;
    status: string;
    headroom_percentage: number;
    tested_at: string;
    covenants?: {
      name: string;
      type: string;
      operator: string;
      loans?: { name: string; borrowers?: { name: string } };
    };
  }

  const history = ((tests || []) as unknown as TestHistory[]).map(t => ({
    date: t.tested_at,
    value: `${t.calculated_value?.toFixed(2)}x`,
    threshold: `${t.covenants?.operator === 'max' ? '≤' : '≥'} ${t.threshold_at_test}x`,
    status: t.status,
    headroom: `${t.headroom_percentage?.toFixed(1)}%`,
  }));

  const firstTest = tests?.[0] as unknown as TestHistory | undefined;
  const covenantInfo = firstTest?.covenants;

  const result = {
    covenant: covenantInfo?.name || 'Unknown',
    type: covenantInfo?.type || 'Unknown',
    borrower: covenantInfo?.loans?.borrowers?.name || 'Unknown',
    loan: covenantInfo?.loans?.name || 'Unknown',
    history,
    total_tests: history.length,
    trend: history.length >= 2
      ? (parseFloat(history[0].value) > parseFloat(history[1].value) ? 'increasing' : 'decreasing')
      : 'insufficient data',
  };

  return JSON.stringify(result, null, 2);
}

async function triggerExtraction(
  supabase: SupabaseClient,
  orgId: string,
  input: Record<string, unknown>
): Promise<string> {
  if (!input.document_id) {
    return JSON.stringify({ error: 'document_id is required' });
  }

  // Verify document exists and belongs to org
  const { data: doc, error: docError } = await supabase
    .from('documents')
    .select('id, name, extraction_status')
    .eq('id', input.document_id)
    .eq('organization_id', orgId)
    .is('deleted_at', null)
    .single();

  if (docError || !doc) {
    return JSON.stringify({ error: 'Document not found' });
  }

  interface DocumentStatus {
    id: string;
    name: string;
    extraction_status: string;
  }

  const document = doc as unknown as DocumentStatus;

  if (document.extraction_status === 'processing') {
    return JSON.stringify({
      status: 'already_processing',
      message: `Document "${document.name}" is already being extracted. Please wait.`,
    });
  }

  if (document.extraction_status === 'completed') {
    return JSON.stringify({
      status: 'already_completed',
      message: `Document "${document.name}" has already been extracted. Use get_extracted_data to view results.`,
    });
  }

  // Update status to processing
  await supabase
    .from('documents')
    .update({ extraction_status: 'processing' } as never)
    .eq('id', input.document_id);

  return JSON.stringify({
    status: 'triggered',
    document_id: document.id,
    document_name: document.name,
    message: `Extraction triggered for "${document.name}". This may take 15-30 seconds. Use get_extracted_data to check results.`,
    note: 'The extraction runs asynchronously. Check back shortly for results.',
  });
}

async function getAuditLog(
  supabase: SupabaseClient,
  orgId: string,
  input: Record<string, unknown>
): Promise<string> {
  let query = supabase
    .from('audit_logs')
    .select(`
      id,
      action,
      entity_type,
      entity_id,
      changes,
      created_at,
      users (full_name, email)
    `)
    .eq('organization_id', orgId)
    .order('created_at', { ascending: false });

  if (input.action) {
    query = query.eq('action', input.action);
  }

  if (input.entity_type) {
    query = query.eq('entity_type', input.entity_type);
  }

  const limit = typeof input.limit === 'number' ? input.limit : 20;
  const { data, error } = await query.limit(limit);

  if (error) {
    return JSON.stringify({ error: error.message });
  }

  interface AuditEntry {
    id: string;
    action: string;
    entity_type: string;
    entity_id: string;
    changes?: Record<string, unknown>;
    created_at: string;
    users?: { full_name?: string; email?: string };
  }

  const logs = ((data || []) as unknown as AuditEntry[]).map(log => ({
    timestamp: log.created_at,
    user: log.users?.full_name || log.users?.email || 'System',
    action: log.action,
    entity: `${log.entity_type}:${log.entity_id.substring(0, 8)}...`,
    details: log.changes ? summarizeChanges(log.changes) : 'No details',
  }));

  return JSON.stringify({ audit_logs: logs, count: logs.length }, null, 2);
}

function summarizeChanges(changes: Record<string, unknown>): string {
  const keys = Object.keys(changes);
  if (keys.length === 0) return 'No changes';
  if (keys.length <= 3) return keys.join(', ');
  return `${keys.slice(0, 3).join(', ')} +${keys.length - 3} more`;
}

async function getMemos(
  supabase: SupabaseClient,
  orgId: string,
  input: Record<string, unknown>
): Promise<string> {
  let query = supabase
    .from('memos')
    .select(`
      id,
      title,
      content,
      generated_by_ai,
      created_at,
      loans (id, name, borrowers (name)),
      users:created_by (full_name)
    `)
    .eq('organization_id', orgId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  if (input.loan_id) {
    query = query.eq('loan_id', input.loan_id);
  }

  if (input.search) {
    query = query.ilike('title', `%${input.search}%`);
  }

  const limit = typeof input.limit === 'number' ? input.limit : 10;
  const { data, error } = await query.limit(limit);

  if (error) {
    return JSON.stringify({ error: error.message });
  }

  interface MemoWithRelations {
    id: string;
    title: string;
    content: string;
    generated_by_ai: boolean;
    created_at: string;
    loans?: { id: string; name: string; borrowers?: { name: string } };
    users?: { full_name?: string };
  }

  let memos = (data || []) as unknown as MemoWithRelations[];

  // Filter by borrower name if provided
  if (input.borrower_name) {
    const searchName = String(input.borrower_name).toLowerCase();
    memos = memos.filter(m =>
      m.loans?.borrowers?.name?.toLowerCase().includes(searchName)
    );
  }

  const result = memos.map(m => ({
    id: m.id,
    title: m.title,
    preview: m.content?.substring(0, 150) + (m.content?.length > 150 ? '...' : ''),
    borrower: m.loans?.borrowers?.name || 'Unknown',
    loan: m.loans?.name || 'Unknown',
    ai_generated: m.generated_by_ai,
    created_by: m.users?.full_name || 'System',
    created_at: m.created_at,
  }));

  return JSON.stringify({ memos: result, count: result.length }, null, 2);
}

async function getRiskScores(
  supabase: SupabaseClient,
  orgId: string,
  input: Record<string, unknown>
): Promise<string> {
  // Get loans for this org
  let loansQuery = supabase
    .from('loans')
    .select(`
      id,
      name,
      borrower_id,
      borrowers (id, name, rating)
    `)
    .eq('organization_id', orgId)
    .is('deleted_at', null);

  // Filter by borrower if specified
  if (input.borrower_name) {
    const { data: borrowers } = await supabase
      .from('borrowers')
      .select('id')
      .eq('organization_id', orgId)
      .ilike('name', `%${input.borrower_name}%`);

    if (borrowers && borrowers.length > 0) {
      loansQuery = loansQuery.in('borrower_id', borrowers.map(b => b.id));
    }
  }

  const { data: loans } = await loansQuery;

  interface LoanData {
    id: string;
    name: string;
    borrower_id: string;
    borrowers?: { id: string; name: string; rating?: string };
  }

  const loansList = (loans || []) as unknown as LoanData[];

  if (loansList.length === 0) {
    return JSON.stringify({ message: 'No loans found', riskScores: [] });
  }

  const loanIds = loansList.map(l => l.id);

  // Get covenants with test results
  const { data: covenants } = await supabase
    .from('covenants')
    .select(`
      id,
      loan_id,
      covenant_tests (status, headroom_percentage, tested_at)
    `)
    .in('loan_id', loanIds)
    .is('deleted_at', null);

  interface CovenantData {
    id: string;
    loan_id: string;
    covenant_tests?: Array<{ status: string; headroom_percentage: number; tested_at: string }>;
  }

  const covenantsList = (covenants || []) as unknown as CovenantData[];

  // Group by borrower and calculate risk
  const borrowerData: Record<string, {
    name: string;
    rating: string | null;
    loans: string[];
    breaches: number;
    warnings: number;
    headrooms: number[];
  }> = {};

  for (const loan of loansList) {
    const borrowerId = loan.borrowers?.id || loan.borrower_id;
    const borrowerName = loan.borrowers?.name || 'Unknown';

    if (!borrowerData[borrowerId]) {
      borrowerData[borrowerId] = {
        name: borrowerName,
        rating: loan.borrowers?.rating || null,
        loans: [],
        breaches: 0,
        warnings: 0,
        headrooms: [],
      };
    }

    borrowerData[borrowerId].loans.push(loan.name);
  }

  // Process covenants
  for (const cov of covenantsList) {
    const loan = loansList.find(l => l.id === cov.loan_id);
    if (!loan) continue;

    const borrowerId = loan.borrowers?.id || loan.borrower_id;
    if (!borrowerData[borrowerId]) continue;

    const tests = cov.covenant_tests || [];
    const latest = tests.sort((a, b) =>
      new Date(b.tested_at).getTime() - new Date(a.tested_at).getTime()
    )[0];

    if (latest) {
      if (latest.status === 'breach') borrowerData[borrowerId].breaches++;
      if (latest.status === 'warning') borrowerData[borrowerId].warnings++;
      if (latest.headroom_percentage !== null) {
        borrowerData[borrowerId].headrooms.push(latest.headroom_percentage);
      }
    }
  }

  // Calculate risk scores
  const riskScores = Object.entries(borrowerData).map(([id, data]) => {
    let score = 0;

    // Breaches add 25 points each (max 50)
    score += Math.min(data.breaches * 25, 50);

    // Warnings add 10 points each (max 30)
    score += Math.min(data.warnings * 10, 30);

    // Low headroom adds up to 20 points
    if (data.headrooms.length > 0) {
      const minHeadroom = Math.min(...data.headrooms);
      if (minHeadroom < 0) score += 20;
      else if (minHeadroom < 10) score += 15;
      else if (minHeadroom < 20) score += 10;
    }

    const level = score > 60 ? 'HIGH' : score > 30 ? 'MEDIUM' : 'LOW';
    const minHeadroom = data.headrooms.length > 0 ? Math.min(...data.headrooms) : null;

    return {
      borrower: data.name,
      rating: data.rating || 'Not rated',
      loans: data.loans.length,
      score,
      level,
      breaches: data.breaches,
      warnings: data.warnings,
      lowestHeadroom: minHeadroom !== null ? `${minHeadroom.toFixed(1)}%` : 'N/A',
    };
  });

  // Sort by score descending
  riskScores.sort((a, b) => b.score - a.score);

  const summary = {
    totalBorrowers: riskScores.length,
    highRisk: riskScores.filter(r => r.level === 'HIGH').length,
    mediumRisk: riskScores.filter(r => r.level === 'MEDIUM').length,
    lowRisk: riskScores.filter(r => r.level === 'LOW').length,
  };

  return JSON.stringify({ riskScores, summary }, null, 2);
}

// ===== AGENTIC ACTION EXECUTOR =====
// This function calls the /api/actions endpoint to perform write operations
async function executeAction(
  action: string,
  params: Record<string, unknown>
): Promise<string> {
  try {
    // The API call will be made from the chat route which has the auth context
    // For now, return a formatted action request that the chat route will execute
    return JSON.stringify({
      __action_request: true,
      action,
      params,
    });
  } catch (error) {
    return JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to execute action',
    });
  }
}

// Export for use in chat route
export type ActionRequest = {
  __action_request: true;
  action: string;
  params: Record<string, unknown>;
};
