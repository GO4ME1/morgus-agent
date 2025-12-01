/**
 * MOE Streaming Service
 * 
 * Provides real-time updates during model competition
 */

import { OpenRouterClient, type OpenRouterMessage, type OpenRouterResponse } from './openrouter';
import { NashEquilibriumSelector } from './nash';
import type { EvaluationWeights } from './nash';

export interface MOEStreamEvent {
  type: 'start' | 'model_start' | 'model_progress' | 'model_complete' | 'model_error' | 'nash_analysis' | 'winner' | 'complete';
  data: any;
  timestamp: number;
}

export class MOEStreamingService {
  private openrouter: OpenRouterClient;
  private nash: NashEquilibriumSelector;

  constructor(openrouterApiKey: string, weights?: EvaluationWeights) {
    this.openrouter = new OpenRouterClient(openrouterApiKey);
    this.nash = new NashEquilibriumSelector(weights);
  }

  /**
   * Query models with streaming updates
   */
  async *queryStream(
    messages: OpenRouterMessage[],
    models?: string[]
  ): AsyncGenerator<MOEStreamEvent> {
    const startTime = Date.now();
    const modelsToQuery = models || this.openrouter.getFreeModels().map((m) => m.id);

    // Start event
    yield {
      type: 'start',
      data: {
        models: modelsToQuery,
        count: modelsToQuery.length,
      },
      timestamp: Date.now(),
    };

    // Query all models in parallel with progress tracking
    const responses: OpenRouterResponse[] = [];
    const promises = modelsToQuery.map(async (model) => {
      // Model start event
      yield {
        type: 'model_start',
        data: { model },
        timestamp: Date.now(),
      };

      try {
        const response = await this.openrouter.query(model, messages);

        // Model complete event
        yield {
          type: 'model_complete',
          data: {
            model,
            response,
          },
          timestamp: Date.now(),
        };

        responses.push(response);
        return response;
      } catch (error) {
        // Model error event
        yield {
          type: 'model_error',
          data: {
            model,
            error: error instanceof Error ? error.message : 'Unknown error',
          },
          timestamp: Date.now(),
        };
        return null;
      }
    });

    // Wait for all models to complete
    const results = await Promise.all(promises);
    const validResponses = results.filter((r): r is OpenRouterResponse => r !== null);

    if (validResponses.length === 0) {
      throw new Error('All model queries failed');
    }

    // Nash Equilibrium analysis event
    yield {
      type: 'nash_analysis',
      data: {
        analyzing: true,
        responseCount: validResponses.length,
      },
      timestamp: Date.now(),
    };

    const nashResult = this.nash.select(validResponses);

    // Winner event
    yield {
      type: 'winner',
      data: {
        winner: nashResult.winner,
        nashResult,
        allResponses: validResponses,
      },
      timestamp: Date.now(),
    };

    // Complete event
    const totalLatency = Date.now() - startTime;
    const totalCost = validResponses.reduce((sum, r) => sum + r.cost, 0);

    yield {
      type: 'complete',
      data: {
        metadata: {
          modelsQueried: modelsToQuery.length,
          totalLatency,
          totalCost,
          timestamp: Date.now(),
        },
      },
      timestamp: Date.now(),
    };
  }

  /**
   * Get available models
   */
  getAvailableModels() {
    return {
      free: this.openrouter.getFreeModels(),
      paid: this.openrouter.getPaidModels(),
      all: this.openrouter.getAllModels(),
    };
  }
}
