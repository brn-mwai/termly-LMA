import Anthropic from '@anthropic-ai/sdk';
import Groq from 'groq-sdk';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatResponse {
  message: string;
  provider: 'anthropic' | 'groq';
  usage: {
    promptTokens: number;
    completionTokens: number;
  };
}

// Lazy initialization
let anthropicClient: Anthropic | null = null;
let groqClient: Groq | null = null;

function getAnthropicClient(): Anthropic | null {
  if (!anthropicClient) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey || apiKey.includes('your_key_here')) {
      return null;
    }
    anthropicClient = new Anthropic({ apiKey });
  }
  return anthropicClient;
}

function getGroqClient(): Groq | null {
  if (!groqClient) {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey || apiKey.includes('your_key_here')) {
      return null;
    }
    groqClient = new Groq({ apiKey });
  }
  return groqClient;
}

async function chatWithAnthropic(messages: ChatMessage[]): Promise<ChatResponse> {
  const client = getAnthropicClient();
  if (!client) {
    throw new Error('Anthropic client not available');
  }

  // Separate system message from other messages
  const systemMessage = messages.find(m => m.role === 'system');
  const otherMessages = messages.filter(m => m.role !== 'system');

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2048,
    system: systemMessage?.content || '',
    messages: otherMessages.map(m => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    })),
  });

  const content = response.content[0];
  if (content.type !== 'text') {
    throw new Error('Unexpected response type from Anthropic');
  }

  return {
    message: content.text,
    provider: 'anthropic',
    usage: {
      promptTokens: response.usage.input_tokens,
      completionTokens: response.usage.output_tokens,
    },
  };
}

async function chatWithGroq(messages: ChatMessage[]): Promise<ChatResponse> {
  const client = getGroqClient();
  if (!client) {
    throw new Error('Groq client not available');
  }

  const response = await client.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages,
    temperature: 0.1,
    max_tokens: 2048,
  });

  return {
    message: response.choices[0]?.message?.content || '',
    provider: 'groq',
    usage: {
      promptTokens: response.usage?.prompt_tokens || 0,
      completionTokens: response.usage?.completion_tokens || 0,
    },
  };
}

/**
 * Chat with AI using Claude as primary and Groq as fallback.
 * If Claude fails or is unavailable, automatically falls back to Groq.
 */
export async function chat(messages: ChatMessage[]): Promise<ChatResponse> {
  const anthropic = getAnthropicClient();
  const groq = getGroqClient();

  // Try Claude first if available
  if (anthropic) {
    try {
      return await chatWithAnthropic(messages);
    } catch (error) {
      console.warn('Anthropic API failed, falling back to Groq:', error instanceof Error ? error.message : error);
      // Fall through to Groq
    }
  }

  // Fallback to Groq
  if (groq) {
    try {
      return await chatWithGroq(messages);
    } catch (error) {
      console.error('Groq API also failed:', error instanceof Error ? error.message : error);
      throw new Error('All AI providers failed. Please try again later.');
    }
  }

  throw new Error('No AI provider configured. Please set ANTHROPIC_API_KEY or GROQ_API_KEY.');
}

/**
 * Chat with a specific provider (no fallback).
 */
export async function chatWith(
  provider: 'anthropic' | 'groq',
  messages: ChatMessage[]
): Promise<ChatResponse> {
  if (provider === 'anthropic') {
    return chatWithAnthropic(messages);
  }
  return chatWithGroq(messages);
}

export { getAnthropicClient, getGroqClient };
