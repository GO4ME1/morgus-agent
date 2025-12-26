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
    id: 'qwen/qwen3-4b:free',
    name: 'Qwen3 4B',
    provider: 'qwen',
    free: true,
  },
  {
    id: 'kwaipilot/kat-coder-pro-v1:free',
    name: 'KAT-Coder-Pro V1',
    provider: 'kwaipilot',
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
   * Query multiple models in parallel with majority-based early exit
   * Returns as soon as majority (4+ of 6) models respond
   * Also returns list of models that were too slow
   */
  async queryMultiple(
    models: string[],
    messages: OpenRouterMessage[],
    options: {
      temperature?: number;
      maxTokens?: number;
      majorityThreshold?: number; // Default: ceil(models.length * 0.6)
    } = {}
  ): Promise<{ responses: OpenRouterResponse[]; tooSlowModels: string[]; allModels: string[] }> {
    const threshold = options.majorityThreshold || Math.ceil(models.length * 0.6);
    const results: OpenRouterResponse[] = [];
    const tooSlowModels: string[] = [];
    let resolved = false;
    
    console.log(`[MOE] Querying ${models.length} models, majority threshold: ${threshold}`);
    const startTime = Date.now();

    return new Promise((resolve) => {
      // Track pending promises
      let pendingCount = models.length;
      const failedModels: string[] = [];
      
      // Query each model
      models.forEach((model) => {
        this.query(model, messages, options)
          .then((response) => {
            if (resolved) {
              // Already returned, this model was too slow
              tooSlowModels.push(model);
              console.log(`[MOE] ${model} responded AFTER majority (too slow: ${Date.now() - startTime}ms)`);
              return;
            }
            
            results.push(response);
            console.log(`[MOE] ${model} responded in ${response.latency}ms (${results.length}/${threshold} needed)`);
            
            // Check if we have majority
            if (results.length >= threshold && !resolved) {
              resolved = true;
              // Calculate which models haven't responded yet
              const respondedModels = results.map(r => r.model);
              const pendingModels = models.filter(m => !respondedModels.includes(m) && !failedModels.includes(m));
              tooSlowModels.push(...pendingModels);
              
              console.log(`[MOE] Majority reached! Returning ${results.length} responses in ${Date.now() - startTime}ms`);
              if (tooSlowModels.length > 0) {
                console.log(`[MOE] Too slow models: ${tooSlowModels.join(', ')}`);
              }
              resolve({ responses: results, tooSlowModels, allModels: models });
            }
          })
          .catch((error) => {
            console.error(`[MOE] Failed to query ${model}:`, error);
            failedModels.push(model);
          })
          .finally(() => {
            pendingCount--;
            // If all models finished and we haven't resolved yet, resolve with what we have
            if (pendingCount === 0 && !resolved) {
              resolved = true;
              console.log(`[MOE] All models finished, returning ${results.length} responses`);
              resolve({ responses: results, tooSlowModels, allModels: models });
            }
          });
      });
      
      // Safety timeout: if nothing responds in 30 seconds, return what we have
      setTimeout(() => {
        if (!resolved) {
          resolved = true;
          const slowModels = models.filter(m => !results.some(r => r.model === m) && !failedModels.includes(m));
          tooSlowModels.push(...slowModels);
          console.log(`[MOE] Timeout! Returning ${results.length} responses. Too slow: ${slowModels.join(', ')}`);
          resolve({ responses: results, tooSlowModels, allModels: models });
        }
      }, 30000);
    });
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
