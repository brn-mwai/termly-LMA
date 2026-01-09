import { auth } from '@clerk/nextjs/server';
import { createClient } from '@/lib/supabase/server';
import { chat } from '@/lib/ai/groq';
import { MEMO_GENERATION_PROMPT, MEMO_TEMPLATES, MemoTemplate } from '@/lib/ai/prompts/generate-memo';
import { successResponse, errorResponse, handleApiError, parseSearchParams, asUserWithOrg } from '@/lib/utils/api';

export async function GET(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return errorResponse('UNAUTHORIZED', 'Authentication required', 401);

    const supabase = await createClient();
    const { page, limit, search } = parseSearchParams(request.url);
    const { searchParams } = new URL(request.url);
    const loanId = searchParams.get('loan_id');

    // Get user's org_id
    const { data: userData } = await supabase
      .from('users')
      .select('organization_id')
      .eq('clerk_id', userId)
      .single();

    const user = asUserWithOrg(userData);
    if (!user) return errorResponse('NOT_FOUND', 'User not found', 404);

    // Build query
    let query = supabase
      .from('memos')
      .select(`
        *,
        loans (id, name, borrowers (name)),
        users:created_by (full_name, email)
      `, { count: 'exact' })
      .eq('organization_id', user.organization_id)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (loanId) {
      query = query.eq('loan_id', loanId);
    }

    if (search) {
      query = query.ilike('title', `%${search}%`);
    }

    // Pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;
    if (error) throw error;

    return successResponse(data, { page, limit, total: count || 0 });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return errorResponse('UNAUTHORIZED', 'Authentication required', 401);

    const supabase = await createClient();
    const body = await request.json();
    const { loan_id, title, template, generate_ai } = body;

    // Get user
    const { data: userData } = await supabase
      .from('users')
      .select('id, organization_id')
      .eq('clerk_id', userId)
      .single();

    const user = asUserWithOrg(userData);
    if (!user) return errorResponse('NOT_FOUND', 'User not found', 404);

    let content = body.content || '';
    let aiPrompt = null;

    // Generate content with AI if requested
    if (generate_ai && loan_id) {
      // Fetch loan data for context
      const { data: loanData } = await supabase
        .from('loans')
        .select(`
          *,
          borrowers (name, industry, rating),
          covenants (name, type, threshold, operator, covenant_tests (calculated_value, status, headroom_percentage, tested_at)),
          financial_periods (period_end_date, revenue, ebitda_reported, total_debt, interest_expense)
        `)
        .eq('id', loan_id)
        .single();

      if (!loanData) return errorResponse('NOT_FOUND', 'Loan not found', 404);

      const loan = loanData as Record<string, unknown>;

      // Build context for AI
      const templatePrompt = template && MEMO_TEMPLATES[template as MemoTemplate]
        ? MEMO_TEMPLATES[template as MemoTemplate].prompt
        : 'Generate a credit memo for this loan.';

      const borrowers = loan.borrowers as Record<string, unknown> | undefined;
      const covenants = loan.covenants as Array<Record<string, unknown>> | undefined;
      const financialPeriods = loan.financial_periods as Array<Record<string, unknown>> | undefined;

      const loanContext = `
Borrower: ${borrowers?.name || 'Unknown'}
Industry: ${borrowers?.industry || 'Unknown'}
Facility: ${loan.name}
Commitment: $${(Number(loan.commitment_amount) / 1000000).toFixed(1)}M
Outstanding: $${(Number(loan.outstanding_amount) / 1000000).toFixed(1)}M
Maturity: ${loan.maturity_date}
Status: ${loan.status}

Covenants:
${covenants?.map((c) => {
  const tests = c.covenant_tests as Array<Record<string, unknown>> | undefined;
  const latestTest = tests?.[0];
  return `- ${c.name} (${c.type}): ${c.operator === 'max' ? '≤' : '≥'} ${c.threshold}x, Current: ${latestTest?.calculated_value ? Number(latestTest.calculated_value).toFixed(2) : 'N/A'}x, Status: ${latestTest?.status || 'pending'}, Headroom: ${latestTest?.headroom_percentage ? Number(latestTest.headroom_percentage).toFixed(1) : 'N/A'}%`;
}).join('\n') || 'No covenants'}

Recent Financials:
${financialPeriods?.slice(0, 4).map((p) =>
  `- ${p.period_end_date}: Revenue $${(Number(p.revenue) / 1000000).toFixed(1)}M, EBITDA $${(Number(p.ebitda_reported) / 1000000).toFixed(1)}M, Debt $${(Number(p.total_debt) / 1000000).toFixed(1)}M`
).join('\n') || 'No financial data'}
`;

      aiPrompt = `${templatePrompt}\n\nLoan Data:\n${loanContext}`;

      const response = await chat([
        { role: 'system', content: MEMO_GENERATION_PROMPT },
        { role: 'user', content: aiPrompt },
      ]);

      content = response.message;
    }

    // Create memo
    const { data: memoData, error } = await supabase
      .from('memos')
      .insert({
        organization_id: user.organization_id,
        loan_id,
        title: title || 'Credit Memo',
        content,
        generated_by_ai: !!generate_ai,
        ai_prompt: aiPrompt,
        created_by: user.id,
      } as never)
      .select(`
        *,
        loans (id, name, borrowers (name))
      `)
      .single();

    if (error) throw error;

    const memo = memoData as { id: string } & Record<string, unknown>;

    // Log audit
    await supabase.from('audit_logs').insert({
      organization_id: user.organization_id,
      user_id: user.id,
      action: 'create',
      entity_type: 'memo',
      entity_id: memo.id,
      changes: { generated_by_ai: !!generate_ai },
    } as never);

    return successResponse(memo, undefined, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
