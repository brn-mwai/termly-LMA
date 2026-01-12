import { auth } from '@clerk/nextjs/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { chat, agentChat, ChatMessage, getAnthropicClient, ToolExecution, OnToolExecutionCallback } from '@/lib/ai/client';
import { MONTY_TOOLS, executeTool, ActionRequest } from '@/lib/ai/tools';
import { successResponse, errorResponse, handleApiError } from '@/lib/utils/api';
import { withRateLimit } from '@/lib/utils/rate-limit-middleware';
import Anthropic from '@anthropic-ai/sdk';

const AGENT_SYSTEM_PROMPT = `You are Monty, an AI-powered covenant monitoring agent at Termly. You have FULL access to the database and can both READ and WRITE data - you are a true AGENTIC assistant.

**Your Personality:**
- Professional, efficient, and action-oriented
- You explain WHAT you're doing as you do it
- When taking actions, be clear about the steps
- Keep responses concise but informative

**AGENTIC CAPABILITIES - You CAN perform these actions:**

📊 **Portfolio Management:**
- CREATE new loans and borrowers
- UPDATE loan terms, rates, maturities, status
- DELETE loans and borrowers (soft delete)

🎯 **Covenant Operations:**
- CREATE new covenants with thresholds
- UPDATE covenant thresholds and frequencies
- RECORD covenant test results
- CREATE covenant waivers for breaches

🚨 **Alert Management:**
- ACKNOWLEDGE alerts
- DISMISS alerts with reasons
- ESCALATE alerts to critical status
- BULK acknowledge multiple alerts

📄 **Document Workflow:**
- CATEGORIZE documents by type
- ARCHIVE old documents
- TRIGGER extraction for pending docs

💰 **Financial Data:**
- CREATE financial periods with data
- RECORD revenue, EBITDA, debt figures
- CALCULATE financial ratios

**CRITICAL RULES FOR ACTIONS:**
1. When asked to DO something (create, update, delete, acknowledge), USE THE ACTION TOOLS
2. Show your work - explain what you're doing: "I'm creating a new loan..." "Updating the threshold..."
3. After an action, CONFIRM what was done with the result
4. For destructive actions, confirm with the user first unless they were explicit

**READ Operations (use anytime):**
- get_portfolio_summary, get_loans, get_loan_details
- get_alerts, get_covenants_in_breach, get_covenants_at_warning
- get_borrowers, get_financial_periods, get_risk_scores
- get_covenant_history, get_extracted_data, get_audit_log

**WRITE Operations (use when asked):**
- create_loan, update_loan
- create_borrower, update_borrower
- create_covenant, update_covenant
- record_covenant_test, create_covenant_waiver
- acknowledge_alert, dismiss_alert, escalate_alert, bulk_acknowledge_alerts
- create_financial_period
- categorize_document, archive_document

**Response Format for Actions:**
When performing actions, structure your response like:
1. State what you're about to do
2. Execute the action(s)
3. Confirm the result WITH A LINK to the created/updated item

**IMPORTANT - Always Include Links:**
After creating or updating ANY item, ALWAYS include a clickable link:
- Loans: [View Loan Name](/loans/{id})
- Borrowers: Reference the loan they're associated with
- Alerts: [View Alerts](/dashboard) or link to specific loan
- Documents: [View Document](/documents/{id})
- Covenants: Link to the loan [View Loan](/loans/{loan_id})

Example responses:
- "✓ Created **Senior Term Loan** for Acme Corp with $50M commitment. [View Loan →](/loans/abc-123)"
- "✓ Acknowledged 3 alerts for Harbor Retail. [View Dashboard →](/dashboard)"
- "✓ Added leverage covenant (max 4.5x) to TechFlow loan. [View Loan →](/loans/xyz-456)"

**Report Formatting:**
When generating reports or summaries, use proper markdown:
- Use **headers** (## and ###) for sections
- Use **tables** for comparing data
- Use **bold** for key metrics and status
- Use ✅ ⚠️ 🚨 emojis for status indicators
- Include links to relevant items

**Covenant Reference:**
- Leverage: Total Debt / EBITDA (max 5.0x typical)
- Interest Coverage: EBITDA / Interest (min 2.0x typical)
- Headroom < 0% = Breach, 0-15% = Warning, > 15% = Compliant

You are a POWERFUL agent. When users ask you to do things, DO THEM using your tools and always provide links to created items!`;

export async function POST(request: Request) {
  try {
    // Apply rate limiting for AI requests
    const rateLimitResult = await withRateLimit(request, { type: 'ai' });
    if (rateLimitResult) return rateLimitResult;

    const { userId } = await auth();
    if (!userId) return errorResponse('UNAUTHORIZED', 'Authentication required', 401);

    // Use admin client to bypass RLS
    const supabase = createAdminClient();
    const { message, history = [], stream = false } = await request.json();

    if (!message) {
      return errorResponse('BAD_REQUEST', 'Message is required', 400);
    }

    // Get user's org for context
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('organization_id')
      .eq('clerk_id', userId)
      .is('deleted_at', null)
      .single();

    if (userError) {
      console.error('Chat user lookup error:', userError);
      return errorResponse('FORBIDDEN', `User lookup failed: ${userError.message}`, 403);
    }

    if (!userData?.organization_id) {
      console.error('Chat: User has no organization_id, userId:', userId);
      return errorResponse('FORBIDDEN', 'User organization not found', 403);
    }

    const organizationId = userData.organization_id;

    // Check if Claude is available for agent mode
    const anthropicAvailable = !!getAnthropicClient();

    if (anthropicAvailable) {
      // Use agent mode with tools
      if (stream) {
        return await handleStreamingAgentChat(message, history, supabase, organizationId);
      }
      return await handleAgentChat(message, history, supabase, organizationId);
    } else {
      // Fallback to simple chat without tools
      return await handleSimpleChat(message, history, supabase, organizationId);
    }
  } catch (error) {
    console.error('Chat error:', error);
    return handleApiError(error);
  }
}

async function handleAgentChat(
  message: string,
  history: { role: string; content: string }[],
  supabase: any,
  organizationId: string
) {
  // Convert history to ChatMessage format
  const chatHistory: ChatMessage[] = history.slice(-10).map((m) => ({
    role: m.role as 'user' | 'assistant',
    content: m.content,
  }));

  // Convert tools to Anthropic format
  const tools: Anthropic.Tool[] = MONTY_TOOLS.map(t => ({
    name: t.name,
    description: t.description,
    input_schema: {
      type: 'object' as const,
      properties: t.input_schema.properties as Record<string, unknown>,
      required: [...t.input_schema.required] as string[],
    },
  }));

  // Tool execution function that captures supabase and orgId
  const executeToolFn = async (name: string, input: Record<string, unknown>): Promise<string> => {
    const result = await executeTool(name, input, supabase, organizationId);

    // Check if this is an action request that needs to be executed
    try {
      const parsed = JSON.parse(result);
      if (parsed.__action_request) {
        // Execute the action via internal call
        const actionResult = await executeActionInternal(
          supabase,
          organizationId,
          parsed.action,
          parsed.params
        );
        return JSON.stringify(actionResult);
      }
    } catch {
      // Not JSON or not an action request, return as-is
    }

    return result;
  };

  try {
    const result = await agentChat(
      AGENT_SYSTEM_PROMPT,
      message,
      chatHistory,
      tools,
      executeToolFn
    );

    // Format tool executions for the UI
    const actions = result.toolExecutions.map((exec: ToolExecution) => ({
      tool: exec.name,
      input: exec.input,
      success: exec.success,
      timestamp: exec.timestamp,
    }));

    return successResponse({
      message: result.message,
      provider: 'anthropic',
      usage: result.usage,
      agent: true,
      mode: 'full',
      capabilities: ['tools', 'database_queries', 'real_time_data'],
      actions, // Include tool executions for UI display
    });
  } catch (error) {
    console.error('Agent chat error:', error);
    // Fallback to simple chat if agent fails
    return await handleSimpleChat(message, history, supabase, organizationId);
  }
}

async function handleStreamingAgentChat(
  message: string,
  history: { role: string; content: string }[],
  supabase: any,
  organizationId: string
) {
  // Convert history to ChatMessage format
  const chatHistory: ChatMessage[] = history.slice(-10).map((m) => ({
    role: m.role as 'user' | 'assistant',
    content: m.content,
  }));

  // Convert tools to Anthropic format
  const tools: Anthropic.Tool[] = MONTY_TOOLS.map(t => ({
    name: t.name,
    description: t.description,
    input_schema: {
      type: 'object' as const,
      properties: t.input_schema.properties as Record<string, unknown>,
      required: [...t.input_schema.required] as string[],
    },
  }));

  // Create a TransformStream for SSE
  const encoder = new TextEncoder();
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();

  // Helper to send SSE event
  const sendEvent = async (event: string, data: unknown) => {
    await writer.write(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
  };

  // Tool execution function with streaming callback
  const executeToolFn = async (name: string, input: Record<string, unknown>): Promise<string> => {
    const result = await executeTool(name, input, supabase, organizationId);

    // Check if this is an action request that needs to be executed
    try {
      const parsed = JSON.parse(result);
      if (parsed.__action_request) {
        const actionResult = await executeActionInternal(
          supabase,
          organizationId,
          parsed.action,
          parsed.params
        );
        return JSON.stringify(actionResult);
      }
    } catch {
      // Not JSON or not an action request
    }

    return result;
  };

  // Callback for streaming tool executions
  const onToolExecution: OnToolExecutionCallback = (execution) => {
    sendEvent('action', {
      tool: execution.name,
      input: execution.input,
      success: execution.success,
      timestamp: execution.timestamp,
    });
  };

  // Start the async process
  (async () => {
    try {
      const result = await agentChat(
        AGENT_SYSTEM_PROMPT,
        message,
        chatHistory,
        tools,
        executeToolFn,
        onToolExecution
      );

      // Send final message
      await sendEvent('message', {
        message: result.message,
        provider: 'anthropic',
        usage: result.usage,
        agent: true,
        mode: 'full',
      });

      await sendEvent('done', {});
    } catch (error) {
      console.error('Streaming agent chat error:', error);
      await sendEvent('error', {
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      await writer.close();
    }
  })();

  return new Response(stream.readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}

async function handleSimpleChat(
  message: string,
  history: { role: string; content: string }[],
  supabase: any,
  organizationId: string
) {
  // Fetch some context about the portfolio
  const [loansResult, alertsResult, testsResult] = await Promise.all([
    supabase
      .from('loans')
      .select('id, name, status, commitment_amount, borrowers(name)', { count: 'exact' })
      .eq('organization_id', organizationId)
      .is('deleted_at', null)
      .limit(10),
    supabase
      .from('alerts')
      .select('id, severity, title, acknowledged', { count: 'exact' })
      .eq('organization_id', organizationId)
      .eq('acknowledged', false)
      .limit(10),
    supabase
      .from('covenant_tests')
      .select('id, status')
      .order('tested_at', { ascending: false })
      .limit(50),
  ]);

  const loans = loansResult.data || [];
  const alerts = alertsResult.data || [];
  const tests = testsResult.data || [];

  const portfolioContext = `
**Current Portfolio Data (Read-only mode):**
- Total loans: ${loansResult.count || loans.length}
- Portfolio value: $${((loans.reduce((sum: number, l: any) => sum + (Number(l.commitment_amount) || 0), 0)) / 1000000).toFixed(1)}M
- Unacknowledged alerts: ${alertsResult.count || alerts.length} (${alerts.filter((a: any) => a.severity === 'critical').length} critical)
- Recent covenant tests: ${tests.filter((t: any) => t.status === 'compliant').length} compliant, ${tests.filter((t: any) => t.status === 'warning').length} warning, ${tests.filter((t: any) => t.status === 'breach').length} breach
- Recent loans: ${loans.slice(0, 5).map((l: any) => `${l.borrowers?.name || 'Unknown'} (${l.name})`).join(', ')}

Note: Running without full database access. Data shown is a summary. For detailed queries, Claude API is required.`;

  const messages: ChatMessage[] = [
    { role: 'system', content: AGENT_SYSTEM_PROMPT + '\n\n' + portfolioContext },
    ...history.slice(-10).map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    })),
    { role: 'user', content: message },
  ];

  const aiResponse = await chat(messages, 'analysis');

  return successResponse({
    message: aiResponse.message,
    provider: aiResponse.provider,
    model: aiResponse.model,
    usage: aiResponse.usage,
    agent: false,
    mode: 'limited',
    capabilities: ['basic_chat', 'cached_data'],
    notice: 'Running in limited mode - live database queries unavailable',
  });
}

// Execute actions directly (internal function to avoid HTTP overhead)
async function executeActionInternal(
  supabase: ReturnType<typeof createAdminClient>,
  orgId: string,
  action: string,
  params: Record<string, unknown>
): Promise<{ success: boolean; message: string; data?: unknown; error?: string }> {
  try {
    switch (action) {
      // ===== LOAN OPERATIONS =====
      case 'create_loan': {
        const { name, borrower_id, principal_amount, interest_rate, maturity_date, facility_type } = params;
        if (!name || !borrower_id) {
          return { success: false, message: '', error: 'Name and borrower_id required' };
        }
        const { data, error } = await supabase.from('loans').insert({
          organization_id: orgId,
          borrower_id: borrower_id as string,
          name: name as string,
          principal_amount: (principal_amount as number) || 0,
          interest_rate: (interest_rate as number) || 0,
          maturity_date: (maturity_date as string) || null,
          facility_type: (facility_type as string) || 'term_loan',
          status: 'active',
        }).select().single();
        if (error) return { success: false, message: '', error: error.message };
        return { success: true, message: `Loan "${name}" created successfully`, data };
      }

      case 'update_loan': {
        const { loan_id, ...updates } = params;
        if (!loan_id) return { success: false, message: '', error: 'loan_id required' };
        const { data, error } = await supabase.from('loans').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', loan_id).eq('organization_id', orgId).select().single();
        if (error) return { success: false, message: '', error: error.message };
        return { success: true, message: 'Loan updated successfully', data };
      }

      // ===== BORROWER OPERATIONS =====
      case 'create_borrower': {
        const { name, industry, rating, contact_email } = params;
        if (!name) return { success: false, message: '', error: 'Name required' };
        const { data, error } = await supabase.from('borrowers').insert({
          organization_id: orgId,
          name: name as string,
          industry: (industry as string) || null,
          rating: (rating as string) || null,
          contact_email: (contact_email as string) || null,
        }).select().single();
        if (error) return { success: false, message: '', error: error.message };
        return { success: true, message: `Borrower "${name}" created successfully`, data };
      }

      case 'update_borrower': {
        const { borrower_id, ...updates } = params;
        if (!borrower_id) return { success: false, message: '', error: 'borrower_id required' };
        const { data, error } = await supabase.from('borrowers').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', borrower_id).eq('organization_id', orgId).select().single();
        if (error) return { success: false, message: '', error: error.message };
        return { success: true, message: 'Borrower updated successfully', data };
      }

      // ===== COVENANT OPERATIONS =====
      case 'create_covenant': {
        const { loan_id, name, type, operator, threshold, testing_frequency } = params;
        if (!loan_id || !name || !type || threshold === undefined) {
          return { success: false, message: '', error: 'loan_id, name, type, threshold required' };
        }
        const { data, error } = await supabase.from('covenants').insert({
          loan_id: loan_id as string,
          name: name as string,
          type: type as string,
          operator: (operator as string) || 'max',
          threshold: threshold as number,
          testing_frequency: (testing_frequency as string) || 'quarterly',
        }).select().single();
        if (error) return { success: false, message: '', error: error.message };
        return { success: true, message: `Covenant "${name}" created successfully`, data };
      }

      case 'update_covenant': {
        const { covenant_id, ...updates } = params;
        if (!covenant_id) return { success: false, message: '', error: 'covenant_id required' };
        const { data, error } = await supabase.from('covenants').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', covenant_id).select().single();
        if (error) return { success: false, message: '', error: error.message };
        return { success: true, message: 'Covenant updated successfully', data };
      }

      case 'create_covenant_test': {
        const { covenant_id, calculated_value, period_end_date, notes } = params;
        if (!covenant_id || calculated_value === undefined) {
          return { success: false, message: '', error: 'covenant_id and calculated_value required' };
        }
        const { data: covenant } = await supabase.from('covenants').select('threshold, operator').eq('id', covenant_id).single();
        if (!covenant) return { success: false, message: '', error: 'Covenant not found' };

        const value = calculated_value as number;
        const threshold = covenant.threshold;
        let status = 'compliant';
        let headroom = 0;

        if (covenant.operator === 'max') {
          headroom = ((threshold - value) / threshold) * 100;
          if (value > threshold) status = 'breach';
          else if (headroom < 15) status = 'warning';
        } else {
          headroom = ((value - threshold) / threshold) * 100;
          if (value < threshold) status = 'breach';
          else if (headroom < 15) status = 'warning';
        }

        const { data, error } = await supabase.from('covenant_tests').insert({
          covenant_id: covenant_id as string,
          calculated_value: value,
          threshold_at_test: threshold,
          status,
          headroom_percentage: headroom,
          period_end_date: (period_end_date as string) || new Date().toISOString().split('T')[0],
          tested_at: new Date().toISOString(),
          notes: (notes as string) || null,
        }).select().single();
        if (error) return { success: false, message: '', error: error.message };
        return { success: true, message: `Test recorded: ${status} (${headroom.toFixed(1)}% headroom)`, data };
      }

      case 'create_covenant_waiver': {
        const { covenant_id, waiver_reason, waiver_end_date } = params;
        if (!covenant_id || !waiver_reason) {
          return { success: false, message: '', error: 'covenant_id and waiver_reason required' };
        }
        const { data, error } = await supabase.from('covenants').update({
          waiver_active: true,
          waiver_reason: waiver_reason as string,
          waiver_end_date: (waiver_end_date as string) || null,
          updated_at: new Date().toISOString(),
        }).eq('id', covenant_id).select().single();
        if (error) return { success: false, message: '', error: error.message };
        return { success: true, message: 'Covenant waiver created successfully', data };
      }

      // ===== ALERT OPERATIONS =====
      case 'acknowledge_alert': {
        const { alert_id, notes } = params;
        if (!alert_id) return { success: false, message: '', error: 'alert_id required' };
        const { data, error } = await supabase.from('alerts').update({
          status: 'acknowledged',
          acknowledged: true,
          acknowledged_at: new Date().toISOString(),
          notes: (notes as string) || null,
        }).eq('id', alert_id).eq('organization_id', orgId).select().single();
        if (error) return { success: false, message: '', error: error.message };
        return { success: true, message: 'Alert acknowledged', data };
      }

      case 'dismiss_alert': {
        const { alert_id, reason } = params;
        if (!alert_id) return { success: false, message: '', error: 'alert_id required' };
        const { data, error } = await supabase.from('alerts').update({
          status: 'dismissed',
          dismissed_at: new Date().toISOString(),
          dismissed_reason: (reason as string) || null,
        }).eq('id', alert_id).eq('organization_id', orgId).select().single();
        if (error) return { success: false, message: '', error: error.message };
        return { success: true, message: 'Alert dismissed', data };
      }

      case 'escalate_alert': {
        const { alert_id, escalation_reason } = params;
        if (!alert_id) return { success: false, message: '', error: 'alert_id required' };
        const { data, error } = await supabase.from('alerts').update({
          severity: 'critical',
          escalated: true,
          escalation_reason: (escalation_reason as string) || null,
          escalated_at: new Date().toISOString(),
        }).eq('id', alert_id).eq('organization_id', orgId).select().single();
        if (error) return { success: false, message: '', error: error.message };
        return { success: true, message: 'Alert escalated to critical', data };
      }

      case 'bulk_acknowledge_alerts': {
        const { alert_ids, notes } = params;
        if (!alert_ids || !Array.isArray(alert_ids)) {
          return { success: false, message: '', error: 'alert_ids array required' };
        }
        const { data, error } = await supabase.from('alerts').update({
          status: 'acknowledged',
          acknowledged: true,
          acknowledged_at: new Date().toISOString(),
          notes: (notes as string) || 'Bulk acknowledged by Monty',
        }).in('id', alert_ids as string[]).eq('organization_id', orgId).select();
        if (error) return { success: false, message: '', error: error.message };
        return { success: true, message: `${(data || []).length} alerts acknowledged`, data };
      }

      // ===== FINANCIAL OPERATIONS =====
      case 'create_financial_period': {
        const { loan_id, period_end_date, revenue, ebitda, total_debt, cash, interest_expense } = params;
        if (!loan_id || !period_end_date) {
          return { success: false, message: '', error: 'loan_id and period_end_date required' };
        }
        const { data, error } = await supabase.from('financial_periods').insert({
          loan_id: loan_id as string,
          organization_id: orgId,
          period_end_date: period_end_date as string,
          revenue: (revenue as number) || null,
          ebitda: (ebitda as number) || null,
          total_debt: (total_debt as number) || null,
          cash: (cash as number) || null,
          interest_expense: (interest_expense as number) || null,
        }).select().single();
        if (error) return { success: false, message: '', error: error.message };
        return { success: true, message: `Financial period for ${period_end_date} created`, data };
      }

      // ===== DOCUMENT OPERATIONS =====
      case 'categorize_document': {
        const { document_id, category } = params;
        if (!document_id || !category) {
          return { success: false, message: '', error: 'document_id and category required' };
        }
        const { data, error } = await supabase.from('documents').update({
          category: category as string,
          updated_at: new Date().toISOString(),
        }).eq('id', document_id).eq('organization_id', orgId).select().single();
        if (error) return { success: false, message: '', error: error.message };
        return { success: true, message: `Document categorized as "${category}"`, data };
      }

      case 'archive_document': {
        const { document_id, reason } = params;
        if (!document_id) return { success: false, message: '', error: 'document_id required' };
        const { data, error } = await supabase.from('documents').update({
          archived: true,
          archived_at: new Date().toISOString(),
          archive_reason: (reason as string) || null,
        }).eq('id', document_id).eq('organization_id', orgId).select().single();
        if (error) return { success: false, message: '', error: error.message };
        return { success: true, message: 'Document archived', data };
      }

      default:
        return { success: false, message: '', error: `Unknown action: ${action}` };
    }
  } catch (error) {
    return {
      success: false,
      message: '',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
