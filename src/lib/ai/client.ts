import Anthropic from '@anthropic-ai/sdk';
import Groq from 'groq-sdk';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatResponse {
  message: string;
  provider: 'anthropic' | 'groq';
  model?: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
  };
}

export interface ToolUseBlock {
  type: 'tool_use';
  id: string;
  name: string;
  input: Record<string, unknown>;
}

export interface AgentResponse {
  message: string;
  provider: 'anthropic' | 'groq';
  toolCalls: ToolUseBlock[];
  stopReason: string | null;
  usage: {
    promptTokens: number;
    completionTokens: number;
  };
}

// Groq model configurations with their strengths
export const GROQ_MODELS = {
  // Primary chat models
  versatile: 'llama-3.3-70b-versatile',      // Best for general chat
  instant: 'llama-3.1-8b-instant',           // Fast responses
  // Advanced reasoning
  reasoning: 'deepseek-r1-distill-llama-70b', // Complex reasoning
  // Qwen models
  qwen: 'qwen-qwq-32b',                      // Good for structured tasks
  // Compound for multi-step
  compound: 'compound-beta',                  // Multi-step reasoning
  compoundMini: 'compound-beta-mini',         // Faster compound
} as const;

// Task type to model mapping
export type TaskType = 'chat' | 'analysis' | 'quick' | 'reasoning' | 'structured';

function getModelForTask(taskType: TaskType): string {
  switch (taskType) {
    case 'quick':
      return GROQ_MODELS.instant;
    case 'reasoning':
      return GROQ_MODELS.reasoning;
    case 'structured':
      return GROQ_MODELS.qwen;
    case 'analysis':
      return GROQ_MODELS.versatile;
    case 'chat':
    default:
      return GROQ_MODELS.versatile;
  }
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
    model: 'claude-sonnet-4',
    usage: {
      promptTokens: response.usage.input_tokens,
      completionTokens: response.usage.output_tokens,
    },
  };
}

async function chatWithGroq(
  messages: ChatMessage[],
  taskType: TaskType = 'chat'
): Promise<ChatResponse> {
  const client = getGroqClient();
  if (!client) {
    throw new Error('Groq client not available');
  }

  const model = getModelForTask(taskType);

  try {
    const response = await client.chat.completions.create({
      model,
      messages,
      temperature: taskType === 'reasoning' ? 0.1 : 0.3,
      max_tokens: 4096,
    });

    return {
      message: response.choices[0]?.message?.content || '',
      provider: 'groq',
      model,
      usage: {
        promptTokens: response.usage?.prompt_tokens || 0,
        completionTokens: response.usage?.completion_tokens || 0,
      },
    };
  } catch (error) {
    // If model fails, try fallback to versatile
    if (model !== GROQ_MODELS.versatile) {
      console.warn(`Groq model ${model} failed, falling back to versatile`);
      const response = await client.chat.completions.create({
        model: GROQ_MODELS.versatile,
        messages,
        temperature: 0.3,
        max_tokens: 4096,
      });

      return {
        message: response.choices[0]?.message?.content || '',
        provider: 'groq',
        model: GROQ_MODELS.versatile,
        usage: {
          promptTokens: response.usage?.prompt_tokens || 0,
          completionTokens: response.usage?.completion_tokens || 0,
        },
      };
    }
    throw error;
  }
}

/**
 * Chat with AI using Claude as primary and Groq as fallback.
 */
export async function chat(
  messages: ChatMessage[],
  taskType: TaskType = 'chat'
): Promise<ChatResponse> {
  const anthropic = getAnthropicClient();
  const groq = getGroqClient();

  // Try Claude first if available
  if (anthropic) {
    try {
      return await chatWithAnthropic(messages);
    } catch (error) {
      console.warn('Anthropic API failed, falling back to Groq:', error instanceof Error ? error.message : error);
    }
  }

  // Fallback to Groq
  if (groq) {
    try {
      return await chatWithGroq(messages, taskType);
    } catch (error) {
      console.error('Groq API also failed:', error instanceof Error ? error.message : error);
      throw new Error('All AI providers failed. Please try again later.');
    }
  }

  throw new Error('No AI provider configured. Please set ANTHROPIC_API_KEY or GROQ_API_KEY.');
}

/**
 * Chat with Groq using a specific task type for model selection.
 */
export async function chatGroq(
  messages: ChatMessage[],
  taskType: TaskType = 'chat'
): Promise<ChatResponse> {
  return chatWithGroq(messages, taskType);
}

/**
 * Agent chat with tool use support (Claude).
 * Handles the full agentic loop with tool execution.
 */
export async function agentChat(
  systemPrompt: string,
  userMessage: string,
  history: ChatMessage[],
  tools: Anthropic.Tool[],
  executeToolFn: (name: string, input: Record<string, unknown>) => Promise<string>
): Promise<{ message: string; usage: { promptTokens: number; completionTokens: number } }> {
  const client = getAnthropicClient();
  if (!client) {
    throw new Error('Anthropic client required for agent mode');
  }

  // Build initial messages
  const conversationHistory: Anthropic.MessageParam[] = history
    .filter(m => m.role !== 'system')
    .map(m => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }));

  // Add the new user message
  conversationHistory.push({
    role: 'user',
    content: userMessage,
  });

  let totalUsage = { promptTokens: 0, completionTokens: 0 };
  let iterations = 0;
  const maxIterations = 5;

  while (iterations < maxIterations) {
    iterations++;

    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      system: systemPrompt,
      messages: conversationHistory,
      tools,
    });

    totalUsage.promptTokens += response.usage.input_tokens;
    totalUsage.completionTokens += response.usage.output_tokens;

    // Check if we need to process tool calls
    const toolUseBlocks = response.content.filter(
      (block): block is Anthropic.ToolUseBlock => block.type === 'tool_use'
    );
    const textBlocks = response.content.filter(
      (block): block is Anthropic.TextBlock => block.type === 'text'
    );

    // If no tool calls, return the text response
    if (toolUseBlocks.length === 0 || response.stop_reason === 'end_turn') {
      const finalText = textBlocks.map(b => b.text).join('\n');
      return { message: finalText, usage: totalUsage };
    }

    // Add assistant's response (with tool use) to history
    conversationHistory.push({
      role: 'assistant',
      content: response.content,
    });

    // Execute tools and collect results
    const toolResults: Anthropic.ToolResultBlockParam[] = [];
    for (const toolUse of toolUseBlocks) {
      console.log(`[Monty] Executing tool: ${toolUse.name}`, toolUse.input);
      try {
        const result = await executeToolFn(toolUse.name, toolUse.input as Record<string, unknown>);
        toolResults.push({
          type: 'tool_result',
          tool_use_id: toolUse.id,
          content: result,
        });
      } catch (error) {
        console.error(`[Monty] Tool ${toolUse.name} failed:`, error);
        toolResults.push({
          type: 'tool_result',
          tool_use_id: toolUse.id,
          content: JSON.stringify({ error: `Tool execution failed: ${error instanceof Error ? error.message : 'Unknown error'}` }),
          is_error: true,
        });
      }
    }

    // Add tool results to history
    conversationHistory.push({
      role: 'user',
      content: toolResults,
    });
  }

  // Max iterations reached
  return {
    message: "I'm having trouble completing this request. Please try simplifying your question.",
    usage: totalUsage,
  };
}

/**
 * Simple agent chat without tools (for Groq fallback).
 */
export async function simpleAgentChat(
  messages: ChatMessage[],
  context: string
): Promise<ChatResponse> {
  // Add context to system message
  const systemMessage = messages.find(m => m.role === 'system');
  const enhancedMessages = messages.map(m => {
    if (m.role === 'system') {
      return { ...m, content: m.content + '\n\n' + context };
    }
    return m;
  });

  return chat(enhancedMessages, 'analysis');
}

export { getAnthropicClient, getGroqClient };
