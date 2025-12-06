/**
 * MOE Endpoint for Morgus
 * 
 * Integrates MOE into the chat system
 */

import { MOEService, type MOEResponse } from './service';
import type { OpenRouterMessage } from './openrouter';

export interface MOEChatRequest {
  messages: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
  }>;
}

export interface MOEChatResponse {
  content: string; // The winner's response
  moeMetadata: {
    winner: {
      model: string;
      latency: number;
      tokens: number;
      cost: number;
    };
    allModels: Array<{
      model: string;
      latency: number;
      tokens: number;
      cost: number;
      score: number;
    }>;
    nashExplanation: string;
    totalLatency: number;
    totalCost: number;
  };
}

export class MOEEndpoint {
  private moe: MOEService;

  constructor(openrouterApiKey: string) {
    this.moe = new MOEService(openrouterApiKey);
  }

  /**
   * Process chat request through MOE
   */
  async chat(request: MOEChatRequest): Promise<MOEChatResponse> {
    // Convert to OpenRouter format
    const messages: OpenRouterMessage[] = request.messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    // Query MOE
    const result: MOEResponse = await this.moe.query({ messages });

    // Format response with MOE visualization data
    return {
      content: this.formatWinnerResponse(result),
      moeMetadata: {
        winner: {
          model: result.winner.model,
          latency: result.winner.latency,
          tokens: result.winner.tokens.total,
          cost: result.winner.cost,
        },
        allModels: result.allResponses.map((r) => ({
          model: r.model,
          latency: r.latency,
          tokens: r.tokens.total,
          cost: r.cost,
          score: result.nashResult.scores.get(r.model) || 0,
        })),
        nashExplanation: result.nashResult.explanation,
        totalLatency: result.metadata.totalLatency,
        totalCost: result.metadata.totalCost,
      },
    };
  }

  /**
   * Process chat request through MOE with Gemini as third model
   */
  async chatWithGemini(request: MOEChatRequest & { geminiApiKey: string }): Promise<MOEChatResponse> {
    // Convert to OpenRouter format
    const messages: OpenRouterMessage[] = request.messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    // Query OpenRouter models in parallel with Gemini
    const startTime = Date.now();
    
    // Import Gemini helper
    const { queryGeminiForMOE } = await import('../gemini');
    
    // Query OpenRouter models
    const openrouterPromise = this.moe.query({ messages });
    
    // Query Gemini
    const geminiPromise = queryGeminiForMOE(
      request.geminiApiKey,
      'gemini-2.0-flash-exp',
      request.messages,
      request.files // Pass files for vision support
    ).catch((error) => {
      console.error('Gemini query failed:', error);
      return null;
    });
    
    // Wait for all
    const [openrouterResult, geminiResponse, gptResponse, claudeResponse] = await Promise.all([
      openrouterPromise,
      geminiPromise,
      gptPromise,
      claudePromise
    ]);
    
    // Combine responses
    const allResponses = [...openrouterResult.allResponses];
    if (geminiResponse) {
      allResponses.push(geminiResponse);
    }
    if (gptResponse) {
      allResponses.push(gptResponse);
    }
    if (claudeResponse) {
      allResponses.push(claudeResponse);
    }
    
    // Re-run Nash Equilibrium with all 3 models
    const { NashEquilibriumSelector } = await import('./nash');
    const nash = new NashEquilibriumSelector();
    const nashResult = nash.select(allResponses);
    
    const totalLatency = Date.now() - startTime;
    const totalCost = allResponses.reduce((sum, r) => sum + r.cost, 0);
    
    // Format response
    return {
      content: nashResult.winner.content,
      moeMetadata: {
        winner: {
          model: nashResult.winner.model,
          latency: nashResult.winner.latency,
          tokens: nashResult.winner.tokens.total,
          cost: nashResult.winner.cost,
        },
        allModels: allResponses.map((r) => ({
          model: r.model,
          latency: r.latency,
          tokens: r.tokens.total,
          cost: r.cost,
          score: nashResult.scores.get(r.model) || 0,
        })),
        nashExplanation: nashResult.explanation,
        totalLatency,
        totalCost,
      },
    };
  }

  /**
   * Format winner response with MOE context
   */
  private formatWinnerResponse(result: MOEResponse): string {
    // Return only the winner's content - MOE visualization handled by frontend
    return result.winner.content;
  }

  /**
   * Process chat request through MOE with Gemini + GPT-4o-mini + Claude
   */
  async chatWithMultipleAPIs(request: MOEChatRequest & { geminiApiKey: string; openaiApiKey: string; anthropicApiKey?: string; files?: string[] }): Promise<MOEChatResponse> {
    // Convert to OpenRouter format
    const messages: OpenRouterMessage[] = request.messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    // Query all models in parallel
    const startTime = Date.now();
    
    // Import helpers
    const { queryGeminiForMOE } = await import('../gemini');
    const { queryGPT4oMiniForMOE } = await import('../openai-moe');
    
    // Query OpenRouter models
    const openrouterPromise = this.moe.query({ messages });
    
    // Query Gemini
    const geminiPromise = queryGeminiForMOE(
      request.geminiApiKey,
      'gemini-2.0-flash-exp',
      request.messages,
      request.files // Pass files for vision support
    ).catch((error) => {
      console.error('Gemini query failed:', error);
      return null;
    });
    
    // Query GPT-4o-mini
    const gptPromise = queryGPT4oMiniForMOE(
      request.openaiApiKey,
      request.messages.map((m) => ({ role: m.role, content: m.content }))
    ).catch((error) => {
      console.error('GPT-4o-mini query failed:', error);
      return null;
    });
    
    // Query Claude (if API key provided)
    const { queryClaude } = await import('../claude-moe');
    const claudePromise = request.anthropicApiKey
      ? queryClaude(
          request.messages[request.messages.length - 1].content,
          request.anthropicApiKey,
          request.files // Pass files for vision support
        )
          .then((response) => ({
            model: 'claude-3-5-haiku-20241022',
            content: response.content,
            tokens: { prompt: 0, completion: response.tokens, total: response.tokens },
            latency: response.latency,
            cost: (response.tokens / 1000000) * 1.5, // Approximate cost
          }))
          .catch((error) => {
            console.error('Claude query failed:', error);
            return null;
          })
      : Promise.resolve(null);
    
    // Wait for all
    const [openrouterResult, geminiResponse, gptResponse, claudeResponse] = await Promise.all([
      openrouterPromise,
      geminiPromise,
      gptPromise,
      claudePromise
    ]);
    
    // Combine responses
    const allResponses = [...openrouterResult.allResponses];
    if (geminiResponse) {
      allResponses.push(geminiResponse);
    }
    if (gptResponse) {
      allResponses.push(gptResponse);
    }
    if (claudeResponse) {
      allResponses.push(claudeResponse);
    }
    
    // Re-run Nash Equilibrium with all models
    const { NashEquilibriumSelector } = await import('./nash');
    const nash = new NashEquilibriumSelector();
    const nashResult = nash.select(allResponses);
    
    const totalLatency = Date.now() - startTime;
    const totalCost = allResponses.reduce((sum, r) => sum + r.cost, 0);
    
    // Format response
    return {
      content: nashResult.winner.content,
      moeMetadata: {
        winner: {
          model: nashResult.winner.model,
          latency: nashResult.winner.latency,
          tokens: nashResult.winner.tokens.total,
          cost: nashResult.winner.cost,
        },
        allModels: allResponses.map((r) => ({
          model: r.model,
          latency: r.latency,
          tokens: r.tokens.total,
          cost: r.cost,
          score: nashResult.scores.get(r.model) || 0,
        })),
        nashExplanation: nashResult.explanation,
        totalLatency,
        totalCost,
      },
    };
  }

  /**
   * Get friendly model name
   */
  private getModelName(modelId: string): string {
    const names: Record<string, string> = {
      'mistralai/mistral-7b-instruct:free': 'Mistral 7B',
      'x-ai/grok-4.1-fast:free': 'Grok 4.1 Fast',
      'kwaipilot/kat-coder-pro-v1:free': 'KAT-Coder-Pro',
    };
    return names[modelId] || modelId;
  }
}
