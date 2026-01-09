import Groq from 'groq-sdk';

// Lazy initialization to avoid build errors
let groqClient: Groq | null = null;

function getGroqClient(): Groq {
  if (!groqClient) {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      throw new Error('GROQ_API_KEY environment variable is required');
    }
    groqClient = new Groq({ apiKey });
  }
  return groqClient;
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export async function chat(messages: ChatMessage[]) {
  const groq = getGroqClient();
  const response = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages,
    temperature: 0.1,
    max_tokens: 2048,
  });

  return {
    message: response.choices[0]?.message?.content || '',
    usage: {
      promptTokens: response.usage?.prompt_tokens || 0,
      completionTokens: response.usage?.completion_tokens || 0,
    },
  };
}

export { getGroqClient as groq };
