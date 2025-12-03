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
   * Format winner response with MOE context
   */
  private formatWinnerResponse(result: MOEResponse): string {
    // Return only the winner's content - MOE visualization handled by frontend
    return result.winner.content;
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
