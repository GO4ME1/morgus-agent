/**
 * OpenAI integration for MOE
 * 
 * Allows querying GPT models and OpenAI-compatible APIs (like DeepSeek) for MOE competition
 */

import type { MOEModelResponse } from './moe/service';

export interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/**
 * Query GPT-4o-mini for MOE competition
 */
export async function queryGPT4oMiniForMOE(
  apiKey: string,
  messages: OpenAIMessage[]
): Promise<MOEModelResponse | null> {
  const startTime = Date.now();

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages,
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const latency = Date.now() - startTime;

    return {
      model: 'gpt-4o-mini',
      content: data.choices[0].message.content,
      latency,
      tokens: {
        prompt: data.usage.prompt_tokens,
        completion: data.usage.completion_tokens,
        total: data.usage.total_tokens,
      },
      cost: calculateOpenAICost(data.usage.prompt_tokens, data.usage.completion_tokens),
    };
  } catch (error) {
    console.error('GPT-4o-mini query failed:', error);
    return null;
  }
}

/**
 * Query DeepSeek for MOE competition (via OpenAI-compatible API)
 */
export async function queryDeepSeekForMOE(
  apiKey: string,
  messages: OpenAIMessage[]
): Promise<MOEModelResponse | null> {
  const startTime = Date.now();

  try {
    // DeepSeek uses OpenAI-compatible API
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages,
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      throw new Error(`DeepSeek API error: ${response.status}`);
    }

    const data = await response.json();
    const latency = Date.now() - startTime;

    return {
      model: 'deepseek-chat',
      content: data.choices[0].message.content,
      latency,
      tokens: {
        prompt: data.usage.prompt_tokens,
        completion: data.usage.completion_tokens,
        total: data.usage.total_tokens,
      },
      cost: calculateDeepSeekCost(data.usage.prompt_tokens, data.usage.completion_tokens),
    };
  } catch (error) {
    console.error('DeepSeek query failed:', error);
    return null;
  }
}

/**
 * Calculate OpenAI cost (GPT-4o-mini pricing)
 * Input: $0.15/M tokens
 * Output: $0.60/M tokens
 */
function calculateOpenAICost(promptTokens: number, completionTokens: number): number {
  const inputCost = (promptTokens / 1_000_000) * 0.15;
  const outputCost = (completionTokens / 1_000_000) * 0.60;
  return inputCost + outputCost;
}

/**
 * Calculate DeepSeek cost
 * Input: $0.14/M tokens
 * Output: $0.28/M tokens
 */
function calculateDeepSeekCost(promptTokens: number, completionTokens: number): number {
  const inputCost = (promptTokens / 1_000_000) * 0.14;
  const outputCost = (completionTokens / 1_000_000) * 0.28;
  return inputCost + outputCost;
}
