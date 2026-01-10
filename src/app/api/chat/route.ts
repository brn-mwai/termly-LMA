import { auth } from '@clerk/nextjs/server';
import { createClient } from '@/lib/supabase/server';
import { chat, agentChat, ChatMessage, getAnthropicClient } from '@/lib/ai/client';
import { MONTY_TOOLS, executeTool } from '@/lib/ai/tools';
import { successResponse, errorResponse, handleApiError, asUserWithOrg } from '@/lib/utils/api';
import { withRateLimit } from '@/lib/utils/rate-limit-middleware';
import Anthropic from '@anthropic-ai/sdk';

const AGENT_SYSTEM_PROMPT = `You are Monty, a smart and friendly covenant monitoring assistant at Termly. You have access to the database and can look up real data to answer questions accurately.

**Your Personality:**
- Friendly, approachable, and occasionally witty—but always professional
- You keep responses SHORT and punchy—no fluff, just value
- When things are serious (breaches, risks), you're direct and clear

**CRITICAL RULES:**
1. ALWAYS use your tools to look up data before answering questions about:
   - Loans, borrowers, or portfolio information
   - Alerts, breaches, or compliance status
   - Covenant tests or financial metrics
   - Documents or upcoming deadlines
2. NEVER make up or guess data. If a tool returns no results, say so.
3. Use tools proactively - don't ask the user if they want you to look something up.
4. After getting tool results, summarize them clearly and concisely.

**Response Style:**
- DEFAULT: 1-3 sentences with key facts. Get to the point fast.
- Use bullet points for lists (max 5 items, summarize if more)
- Highlight critical numbers and status clearly
- If something is urgent/risky, flag it immediately with "⚠️" or "🚨"

**You CAN:**
- Look up portfolio stats, loans, alerts, covenants
- Check which loans are in breach or at warning
- Acknowledge alerts when asked
- Find upcoming covenant tests
- Check documents needing review

**Covenant Reference:**
- Leverage Ratio: Total Debt / EBITDA (typically max 5.0x)
- Interest Coverage: EBITDA / Interest Expense (typically min 2.0x)
- Headroom < 0% = Breach, 0-15% = Warning, > 15% = Compliant

Remember: You have REAL access to the database. Use your tools to provide accurate information!`;

export async function POST(request: Request) {
  try {
    // Apply rate limiting for AI requests
    const rateLimitResult = await withRateLimit(request, { type: 'ai' });
    if (rateLimitResult) return rateLimitResult;

    const { userId } = await auth();
    if (!userId) return errorResponse('UNAUTHORIZED', 'Authentication required', 401);

    const supabase = await createClient();
    const { message, history = [] } = await request.json();

    if (!message) {
      return errorResponse('BAD_REQUEST', 'Message is required', 400);
    }

    // Get user's org for context
    const { data: userData } = await supabase
      .from('users')
      .select('organization_id')
      .eq('clerk_id', userId)
      .single();

    const user = asUserWithOrg(userData);
    if (!user) {
      return errorResponse('FORBIDDEN', 'User organization not found', 403);
    }

    // Check if Claude is available for agent mode
    const anthropicAvailable = !!getAnthropicClient();

    if (anthropicAvailable) {
      // Use agent mode with tools
      return await handleAgentChat(message, history, supabase, user.organization_id);
    } else {
      // Fallback to simple chat without tools
      return await handleSimpleChat(message, history, supabase, user.organization_id);
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
    return executeTool(name, input, supabase, organizationId);
  };

  try {
    const result = await agentChat(
      AGENT_SYSTEM_PROMPT,
      message,
      chatHistory,
      tools,
      executeToolFn
    );

    return successResponse({
      message: result.message,
      provider: 'anthropic',
      usage: result.usage,
      agent: true,
      mode: 'full',
      capabilities: ['tools', 'database_queries', 'real_time_data'],
    });
  } catch (error) {
    console.error('Agent chat error:', error);
    // Fallback to simple chat if agent fails
    return await handleSimpleChat(message, history, supabase, organizationId);
  }
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
