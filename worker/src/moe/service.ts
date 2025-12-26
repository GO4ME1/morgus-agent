/**
 * MOE (Mixture of Experts) Service
 * 
 * Combines OpenRouter multi-model queries with Nash Equilibrium selection
 */

import { OpenRouterClient, type OpenRouterMessage, type OpenRouterResponse } from './openrouter';
import { NashEquilibriumSelector, type NashResult, type EvaluationWeights } from './nash';

export interface MOERequest {
  messages: OpenRouterMessage[];
  models?: string[]; // If not specified, uses default free models
  weights?: EvaluationWeights;
  temperature?: number;
  maxTokens?: number;
}

export interface MOEResponse {
  winner: OpenRouterResponse;
  allResponses: OpenRouterResponse[];
  tooSlowModels: string[];  // Models that didn't respond before majority threshold
  allModels: string[];      // All models that were queried
  nashResult: NashResult;
  metadata: {
    modelsQueried: number;
    totalLatency: number;
    totalCost: number;
    timestamp: number;
  };
}

export class MOEService {
  private openrouter: OpenRouterClient;
  private nash: NashEquilibriumSelector;

  constructor(openrouterApiKey: string, weights?: EvaluationWeights) {
    this.openrouter = new OpenRouterClient(openrouterApiKey);
    this.nash = new NashEquilibriumSelector(weights);
  }

  /**
   * Query multiple models and select the best response
   */
  async query(request: MOERequest): Promise<MOEResponse> {
    const startTime = Date.now();

    // Use specified models or default to free models
    const models = request.models || this.getDefaultModels();

    console.log(`MOE: Querying ${models.length} models...`);

    // Query all models in parallel
    const { responses, tooSlowModels, allModels } = await this.openrouter.queryMultiple(
      models,
      request.messages,
      {
        temperature: request.temperature,
        maxTokens: request.maxTokens,
      }
    );

    if (responses.length === 0) {
      throw new Error('All model queries failed');
    }

    console.log(`MOE: Received ${responses.length} responses`);
    if (tooSlowModels.length > 0) {
      console.log(`MOE: Too slow models: ${tooSlowModels.join(', ')}`);
    }

    // Apply Nash Equilibrium to select winner
    const nashResult = this.nash.select(responses);

    const totalLatency = Date.now() - startTime;
    const totalCost = responses.reduce((sum, r) => sum + r.cost, 0);

    console.log(`MOE: Winner is ${nashResult.winner.model}`);
    console.log(`MOE: Total latency: ${totalLatency}ms`);
    console.log(`MOE: Total cost: $${totalCost.toFixed(6)}`);

    return {
      winner: nashResult.winner,
      allResponses: responses,
      tooSlowModels,
      allModels,
      nashResult,
      metadata: {
        modelsQueried: models.length,
        totalLatency,
        totalCost,
        timestamp: Date.now(),
      },
    };
  }

  /**
   * Update user preference for a model based on feedback
   */
  updatePreference(model: string, rating: number) {
    this.nash.updatePreference(model, rating);
  }

  /**
   * Get current user preferences
   */
  getPreferences(): Map<string, number> {
    return this.nash.getPreferences();
  }

  /**
   * Get default models (free tier)
   */
  private getDefaultModels(): string[] {
    return this.openrouter.getFreeModels().map((m) => m.id);
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
