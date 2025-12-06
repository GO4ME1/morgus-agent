/**
 * OpenRouter API Client
 * Unified interface to 300+ AI models
 */

export interface OpenRouterMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface OpenRouterResponse {
  model: string;
  content: string;
  tokens: {
    prompt: number;
    completion: number;
    total: number;
  };
  cost: number;
  latency: number;
  timestamp: number;
}

export interface ModelConfig {
  id: string;
  name: string;
  provider: string;
  free: boolean;
}

/**
 * Free models available on OpenRouter
 */
export const FREE_MODELS: ModelConfig[] = [
  {
    id: 'mistralai/mistral-7b-instruct:free',
    name: 'Mistral 7B Instruct',
    provider: 'mistral',
    free: true,
  },
  {
    id: 'tngtech/deepseek-r1t2-chimera:free',
    name: 'TNG: DeepSeek R1T2 Chimera',
    provider: 'tngtech',
    free: true,
  },
  {
    id: 'kwaipilot/kat-coder-pro-v1:free',
    name: 'KAT-Coder-Pro V1',
    provider: 'kwaipilot',
    free: true,
  },
  {
    id: 'nvidia/nemotron-nano-12b-2-vl:free',
    name: 'NVIDIA: Nemotron Nano 12B 2 VL',
    provider: 'nvidia',
    free: true,
  },
  {
    id: 'google/gemma-3-27b:free',
    name: 'Google: Gemma 3 27B',
    provider: 'google',
    free: true,
  },
];

/**
 * Paid models for production use
 */
export const PAID_MODELS: ModelConfig[] = [
  {
    id: 'openai/gpt-4o-mini',
    name: 'GPT-4o Mini',
    provider: 'openai',
    free: false,
  },
  {
    id: 'anthropic/claude-3-haiku',
    name: 'Claude 3 Haiku',
    provider: 'anthropic',
    free: false,
  },
  {
    id: 'google/gemini-pro-1.5',
    name: 'Gemini Pro 1.5',
    provider: 'google',
    free: false,
  },
];

export class OpenRouterClient {
  private apiKey: string;
  private baseURL = 'https://openrouter.ai/api/v1';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * Query a single model
   */
  async query(
    model: string,
    messages: OpenRouterMessage[],
    options: {
      temperature?: number;
      maxTokens?: number;
    } = {}
  ): Promise<OpenRouterResponse> {
    const startTime = Date.now();

    try {
      const response = await fetch(`${this.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
          'HTTP-Referer': 'https://morgus.ai',
          'X-Title': 'Morgus AI Agent',
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: options.temperature ?? 0.7,
          max_tokens: options.maxTokens ?? 1000,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`OpenRouter API error: ${response.status} ${error}`);
      }

      const data = await response.json();
      const latency = Date.now() - startTime;

      const choice = data.choices[0];
      const usage = data.usage;

      return {
        model,
        content: choice.message.content,
        tokens: {
          prompt: usage.prompt_tokens,
          completion: usage.completion_tokens,
          total: usage.total_tokens,
        },
        cost: this.calculateCost(model, usage),
        latency,
        timestamp: Date.now(),
      };
    } catch (error) {
      console.error(`Error querying model ${model}:`, error);
      throw error;
    }
  }

  /**
   * Query multiple models in parallel
   */
  async queryMultiple(
    models: string[],
    messages: OpenRouterMessage[],
    options: {
      temperature?: number;
      maxTokens?: number;
    } = {}
  ): Promise<OpenRouterResponse[]> {
    const promises = models.map((model) =>
      this.query(model, messages, options).catch((error) => {
        console.error(`Failed to query ${model}:`, error);
        return null;
      })
    );

    const results = await Promise.all(promises);
    return results.filter((r): r is OpenRouterResponse => r !== null);
  }

  /**
   * Calculate approximate cost based on model and token usage
   * This is a simplified calculation - actual costs may vary
   */
  private calculateCost(
    model: string,
    usage: { prompt_tokens: number; completion_tokens: number }
  ): number {
    // Free models cost nothing
    if (model.includes(':free')) {
      return 0;
    }

    // Approximate costs per 1M tokens (as of Dec 2024)
    const costMap: Record<string, { input: number; output: number }> = {
      'openai/gpt-4o-mini': { input: 0.15, output: 0.6 },
      'anthropic/claude-3-haiku': { input: 0.25, output: 1.25 },
      'google/gemini-pro-1.5': { input: 0.35, output: 1.05 },
      'google/gemini-flash-1.5': { input: 0.075, output: 0.3 },
    };

    const costs = costMap[model] || { input: 0.1, output: 0.3 };

    const inputCost = (usage.prompt_tokens / 1_000_000) * costs.input;
    const outputCost = (usage.completion_tokens / 1_000_000) * costs.output;

    return inputCost + outputCost;
  }

  /**
   * Get available models
   */
  getFreeModels(): ModelConfig[] {
    return FREE_MODELS;
  }

  getPaidModels(): ModelConfig[] {
    return PAID_MODELS;
  }

  getAllModels(): ModelConfig[] {
    return [...FREE_MODELS, ...PAID_MODELS];
  }
}
