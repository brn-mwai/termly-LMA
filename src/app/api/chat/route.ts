import { auth } from '@clerk/nextjs/server';
import { createClient } from '@/lib/supabase/server';
import { chat, ChatMessage } from '@/lib/ai/client';
import { CHAT_SYSTEM_PROMPT } from '@/lib/ai/prompts/chat-system';
import { successResponse, errorResponse, handleApiError, asUserWithOrg } from '@/lib/utils/api';

export async function POST(request: Request) {
  try {
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

    // Fetch some context about the portfolio
    let portfolioContext = '';

    if (user) {
      // Get summary stats
      const [loansResult, alertsResult] = await Promise.all([
        supabase
          .from('loans')
          .select('id, name, status, borrowers(name)', { count: 'exact' })
          .eq('organization_id', user.organization_id)
          .is('deleted_at', null)
          .limit(10),
        supabase
          .from('alerts')
          .select('*', { count: 'exact' })
          .eq('organization_id', user.organization_id)
          .eq('acknowledged', false)
          .limit(5),
      ]);

      if (loansResult.data) {
        portfolioContext = `\n\nCurrent Portfolio Context:
- Total loans: ${loansResult.count}
- Active unacknowledged alerts: ${alertsResult.count}
- Recent loans: ${loansResult.data.map((l: any) => `${l.borrowers?.name || 'Unknown'} (${l.name})`).join(', ')}`;
      }
    }

    // Build messages
    const messages: ChatMessage[] = [
      { role: 'system', content: CHAT_SYSTEM_PROMPT + portfolioContext },
      ...history.slice(-10).map((m: any) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
      { role: 'user', content: message },
    ];

    // Get AI response (Claude primary, Groq fallback)
    const aiResponse = await chat(messages);

    return successResponse({
      message: aiResponse.message,
      provider: aiResponse.provider,
      usage: aiResponse.usage,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
