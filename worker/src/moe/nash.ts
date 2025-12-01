/**
 * Nash Equilibrium Algorithm for Model Selection
 * 
 * Uses game theory to select the best model response based on multiple criteria.
 * The Nash Equilibrium represents a stable state where no other model could have
 * performed better given the evaluation criteria.
 */

import type { OpenRouterResponse } from './openrouter';

export interface EvaluationCriteria {
  quality: number; // 0-1 score
  speed: number; // 0-1 score
  cost: number; // 0-1 score
  preference: number; // 0-1 score based on historical performance
}

export interface EvaluationWeights {
  quality: number;
  speed: number;
  cost: number;
  preference: number;
}

export interface NashResult {
  winner: OpenRouterResponse;
  scores: Map<string, number>;
  criteria: Map<string, EvaluationCriteria>;
  explanation: string;
}

/**
 * Default weights for evaluation criteria
 */
export const DEFAULT_WEIGHTS: EvaluationWeights = {
  quality: 0.4, // Quality is most important
  speed: 0.2, // Speed matters for UX
  cost: 0.2, // Cost efficiency
  preference: 0.2, // Historical performance
};

export class NashEquilibriumSelector {
  private weights: EvaluationWeights;
  private userPreferences: Map<string, number> = new Map();

  constructor(weights: EvaluationWeights = DEFAULT_WEIGHTS) {
    this.weights = weights;
  }

  /**
   * Select the best response using Nash Equilibrium
   */
  select(responses: OpenRouterResponse[]): NashResult {
    if (responses.length === 0) {
      throw new Error('No responses to evaluate');
    }

    if (responses.length === 1) {
      return {
        winner: responses[0],
        scores: new Map([[responses[0].model, 1.0]]),
        criteria: new Map([
          [responses[0].model, this.evaluateResponse(responses[0], responses)],
        ]),
        explanation: 'Only one response available',
      };
    }

    // Evaluate each response
    const evaluations = new Map<string, EvaluationCriteria>();
    for (const response of responses) {
      evaluations.set(
        response.model,
        this.evaluateResponse(response, responses)
      );
    }

    // Calculate weighted scores
    const scores = new Map<string, number>();
    for (const [model, criteria] of evaluations) {
      const score =
        criteria.quality * this.weights.quality +
        criteria.speed * this.weights.speed +
        criteria.cost * this.weights.cost +
        criteria.preference * this.weights.preference;

      scores.set(model, score);
    }

    // Find winner (Nash Equilibrium)
    let winner = responses[0];
    let maxScore = scores.get(winner.model) || 0;

    for (const response of responses) {
      const score = scores.get(response.model) || 0;
      if (score > maxScore) {
        maxScore = score;
        winner = response;
      }
    }

    const explanation = this.generateExplanation(winner, scores, evaluations);

    return {
      winner,
      scores,
      criteria: evaluations,
      explanation,
    };
  }

  /**
   * Evaluate a single response against all responses
   */
  private evaluateResponse(
    response: OpenRouterResponse,
    allResponses: OpenRouterResponse[]
  ): EvaluationCriteria {
    return {
      quality: this.evaluateQuality(response, allResponses),
      speed: this.evaluateSpeed(response, allResponses),
      cost: this.evaluateCost(response, allResponses),
      preference: this.evaluatePreference(response),
    };
  }

  /**
   * Evaluate response quality
   * 
   * Criteria:
   * - Length appropriateness (not too short, not too long)
   * - Token efficiency (content per token)
   * - Completeness (relative to other responses)
   */
  private evaluateQuality(
    response: OpenRouterResponse,
    allResponses: OpenRouterResponse[]
  ): number {
    const lengths = allResponses.map((r) => r.content.length);
    const avgLength = lengths.reduce((a, b) => a + b, 0) / lengths.length;
    const maxLength = Math.max(...lengths);
    const minLength = Math.min(...lengths);

    // Length score: prefer responses close to average length
    const lengthDiff = Math.abs(response.content.length - avgLength);
    const lengthScore = 1 - lengthDiff / (maxLength - minLength || 1);

    // Token efficiency: content length per token
    const efficiency = response.content.length / response.tokens.completion;
    const efficiencies = allResponses.map(
      (r) => r.content.length / r.tokens.completion
    );
    const maxEfficiency = Math.max(...efficiencies);
    const efficiencyScore = efficiency / maxEfficiency;

    // Completeness: longer responses are generally more complete
    const completenessScore = response.content.length / maxLength;

    // Weighted combination
    return lengthScore * 0.3 + efficiencyScore * 0.3 + completenessScore * 0.4;
  }

  /**
   * Evaluate response speed
   * 
   * Faster responses score higher
   */
  private evaluateSpeed(
    response: OpenRouterResponse,
    allResponses: OpenRouterResponse[]
  ): number {
    const latencies = allResponses.map((r) => r.latency);
    const maxLatency = Math.max(...latencies);
    const minLatency = Math.min(...latencies);

    if (maxLatency === minLatency) {
      return 1.0;
    }

    // Invert: lower latency = higher score
    return 1 - (response.latency - minLatency) / (maxLatency - minLatency);
  }

  /**
   * Evaluate cost efficiency
   * 
   * Lower cost scores higher
   */
  private evaluateCost(
    response: OpenRouterResponse,
    allResponses: OpenRouterResponse[]
  ): number {
    const costs = allResponses.map((r) => r.cost);
    const maxCost = Math.max(...costs);
    const minCost = Math.min(...costs);

    if (maxCost === minCost) {
      return 1.0;
    }

    // Invert: lower cost = higher score
    return 1 - (response.cost - minCost) / (maxCost - minCost);
  }

  /**
   * Evaluate user preference
   * 
   * Based on historical performance and user ratings
   */
  private evaluatePreference(response: OpenRouterResponse): number {
    const preference = this.userPreferences.get(response.model) || 0.5;
    return preference;
  }

  /**
   * Update user preference for a model
   */
  updatePreference(model: string, rating: number) {
    const currentPreference = this.userPreferences.get(model) || 0.5;
    // Exponential moving average
    const newPreference = currentPreference * 0.8 + rating * 0.2;
    this.userPreferences.set(model, newPreference);
  }

  /**
   * Generate human-readable explanation
   */
  private generateExplanation(
    winner: OpenRouterResponse,
    scores: Map<string, number>,
    criteria: Map<string, EvaluationCriteria>
  ): string {
    const winnerScore = scores.get(winner.model) || 0;
    const winnerCriteria = criteria.get(winner.model)!;

    const parts: string[] = [];

    parts.push(`**Winner:** ${winner.model}`);
    parts.push(`**Overall Score:** ${(winnerScore * 100).toFixed(1)}%`);
    parts.push('');
    parts.push('**Breakdown:**');
    parts.push(
      `- Quality: ${(winnerCriteria.quality * 100).toFixed(1)}% (weight: ${this.weights.quality * 100}%)`
    );
    parts.push(
      `- Speed: ${(winnerCriteria.speed * 100).toFixed(1)}% (weight: ${this.weights.speed * 100}%)`
    );
    parts.push(
      `- Cost: ${(winnerCriteria.cost * 100).toFixed(1)}% (weight: ${this.weights.cost * 100}%)`
    );
    parts.push(
      `- Preference: ${(winnerCriteria.preference * 100).toFixed(1)}% (weight: ${this.weights.preference * 100}%)`
    );
    parts.push('');
    parts.push('**All Scores:**');

    const sortedScores = Array.from(scores.entries()).sort(
      (a, b) => b[1] - a[1]
    );
    for (const [model, score] of sortedScores) {
      parts.push(`- ${model}: ${(score * 100).toFixed(1)}%`);
    }

    return parts.join('\n');
  }

  /**
   * Get current user preferences
   */
  getPreferences(): Map<string, number> {
    return new Map(this.userPreferences);
  }

  /**
   * Set user preferences
   */
  setPreferences(preferences: Map<string, number>) {
    this.userPreferences = new Map(preferences);
  }
}
