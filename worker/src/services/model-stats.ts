/**
 * Model Statistics Service
 * Tracks performance metrics for AI models in the MOE system
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

export interface ModelCompetitionResult {
  model_name: string;
  is_winner: boolean;
  score: number;
  rank: number;
  latency: number;
  tokens: number;
  cost: number;
  quality_score?: number;
  speed_score?: number;
  cost_score?: number;
  preference_score?: number;
  user_message?: string;
  model_response?: string;
  had_files?: boolean;
  file_types?: string[];
  // Enhanced tracking fields
  query_category?: string;        // coding, research, creative, math, analysis, task, conversation
  query_subcategory?: string;     // More specific category
  query_complexity?: string;      // simple, medium, complex
  query_intent?: string;          // question, instruction, conversation, creation
  query_domain?: string;          // finance, science, tech, health, etc.
  requires_reasoning?: boolean;
  requires_creativity?: boolean;
  requires_accuracy?: boolean;
  estimated_tokens?: string;      // short, medium, long
  category_confidence?: number;   // 0-1 confidence in categorization
}

export interface ModelStats {
  model_name: string;
  total_competitions: number;
  total_wins: number;
  total_losses: number;
  win_rate: number;
  avg_score: number;
  avg_latency: number;
  avg_tokens: number;
  avg_cost: number;
  avg_quality_score: number;
  avg_speed_score: number;
  avg_cost_score: number;
  last_competition_at: string;
}

export interface ModelLeaderboard extends ModelStats {
  rank: number;
}

export class ModelStatsService {
  private supabase: SupabaseClient;

  constructor(supabaseUrl: string, supabaseKey: string) {
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  /**
   * Record a competition result
   */
  async recordCompetition(
    results: ModelCompetitionResult[],
    competitionId?: string
  ): Promise<void> {
    try {
      const records = results.map(result => ({
        competition_id: competitionId,
        model_name: result.model_name,
        is_winner: result.is_winner,
        score: result.score,
        rank: result.rank,
        latency: result.latency,
        tokens: result.tokens,
        cost: result.cost,
        quality_score: result.quality_score,
        speed_score: result.speed_score,
        cost_score: result.cost_score,
        preference_score: result.preference_score,
        user_message: result.user_message,
        model_response: result.model_response,
        had_files: result.had_files || false,
        file_types: result.file_types || [],
        // Enhanced tracking fields
        query_category: result.query_category,
        query_subcategory: result.query_subcategory,
        query_complexity: result.query_complexity,
        query_intent: result.query_intent,
        query_domain: result.query_domain,
        requires_reasoning: result.requires_reasoning,
        requires_creativity: result.requires_creativity,
        requires_accuracy: result.requires_accuracy,
        estimated_tokens: result.estimated_tokens,
        category_confidence: result.category_confidence,
      }));

      const { error } = await this.supabase
        .from('model_competition_results')
        .insert(records);

      if (error) {
        console.error('[MODEL_STATS] Error recording competition:', error);
        throw error;
      }

      console.log(`[MODEL_STATS] Recorded ${results.length} competition results`);
    } catch (error) {
      console.error('[MODEL_STATS] Failed to record competition:', error);
      // Don't throw - stats tracking shouldn't break the main flow
    }
  }

  /**
   * Get leaderboard of all models
   */
  async getLeaderboard(limit: number = 10): Promise<ModelLeaderboard[]> {
    const { data, error } = await this.supabase
      .from('model_leaderboard')
      .select('*')
      .limit(limit);

    if (error) {
      console.error('[MODEL_STATS] Error fetching leaderboard:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Get stats for a specific model
   */
  async getModelStats(modelName: string): Promise<ModelStats | null> {
    const { data, error } = await this.supabase
      .from('model_stats')
      .select('*')
      .eq('model_name', modelName)
      .single();

    if (error) {
      console.error('[MODEL_STATS] Error fetching model stats:', error);
      return null;
    }

    return data;
  }

  /**
   * Get recent performance (last 7 days)
   */
  async getRecentPerformance(): Promise<any[]> {
    const { data, error } = await this.supabase
      .from('recent_model_performance')
      .select('*');

    if (error) {
      console.error('[MODEL_STATS] Error fetching recent performance:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Get competition history for a model
   */
  async getModelHistory(
    modelName: string,
    limit: number = 50
  ): Promise<ModelCompetitionResult[]> {
    const { data, error } = await this.supabase
      .from('model_competition_results')
      .select('*')
      .eq('model_name', modelName)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('[MODEL_STATS] Error fetching model history:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Get win/loss streaks
   */
  async getStreaks(modelName: string): Promise<{
    current_streak: number;
    streak_type: 'win' | 'loss' | 'none';
    longest_win_streak: number;
    longest_loss_streak: number;
  }> {
    const history = await this.getModelHistory(modelName, 100);
    
    if (history.length === 0) {
      return {
        current_streak: 0,
        streak_type: 'none',
        longest_win_streak: 0,
        longest_loss_streak: 0,
      };
    }

    let currentStreak = 0;
    let streakType: 'win' | 'loss' | 'none' = 'none';
    let longestWinStreak = 0;
    let longestLossStreak = 0;
    let tempWinStreak = 0;
    let tempLossStreak = 0;

    for (let i = 0; i < history.length; i++) {
      const result = history[i];
      
      // Current streak (most recent)
      if (i === 0) {
        streakType = result.is_winner ? 'win' : 'loss';
        currentStreak = 1;
      } else if (
        (streakType === 'win' && result.is_winner) ||
        (streakType === 'loss' && !result.is_winner)
      ) {
        currentStreak++;
      }

      // Track longest streaks
      if (result.is_winner) {
        tempWinStreak++;
        if (tempWinStreak > longestWinStreak) {
          longestWinStreak = tempWinStreak;
        }
        tempLossStreak = 0;
      } else {
        tempLossStreak++;
        if (tempLossStreak > longestLossStreak) {
          longestLossStreak = tempLossStreak;
        }
        tempWinStreak = 0;
      }
    }

    return {
      current_streak: currentStreak,
      streak_type: streakType,
      longest_win_streak: longestWinStreak,
      longest_loss_streak: longestLossStreak,
    };
  }

  /**
   * Get head-to-head comparison between two models
   */
  async getHeadToHead(model1: string, model2: string): Promise<{
    model1_wins: number;
    model2_wins: number;
    model1_avg_score: number;
    model2_avg_score: number;
  }> {
    // Get all competitions where both models participated
    const { data, error } = await this.supabase
      .from('model_competition_results')
      .select('competition_id, model_name, is_winner, score')
      .in('model_name', [model1, model2])
      .order('created_at', { ascending: false });

    if (error || !data) {
      return {
        model1_wins: 0,
        model2_wins: 0,
        model1_avg_score: 0,
        model2_avg_score: 0,
      };
    }

    // Group by competition_id
    const competitions = new Map<string, any[]>();
    for (const result of data) {
      if (!result.competition_id) continue;
      if (!competitions.has(result.competition_id)) {
        competitions.set(result.competition_id, []);
      }
      competitions.get(result.competition_id)!.push(result);
    }

    // Count wins and calculate averages
    let model1Wins = 0;
    let model2Wins = 0;
    let model1Scores: number[] = [];
    let model2Scores: number[] = [];

    for (const [, results] of competitions) {
      // Only count if both models participated
      const hasModel1 = results.some(r => r.model_name === model1);
      const hasModel2 = results.some(r => r.model_name === model2);
      
      if (!hasModel1 || !hasModel2) continue;

      for (const result of results) {
        if (result.model_name === model1) {
          if (result.is_winner) model1Wins++;
          model1Scores.push(result.score);
        } else if (result.model_name === model2) {
          if (result.is_winner) model2Wins++;
          model2Scores.push(result.score);
        }
      }
    }

    return {
      model1_wins: model1Wins,
      model2_wins: model2Wins,
      model1_avg_score: model1Scores.length > 0
        ? model1Scores.reduce((a, b) => a + b, 0) / model1Scores.length
        : 0,
      model2_avg_score: model2Scores.length > 0
        ? model2Scores.reduce((a, b) => a + b, 0) / model2Scores.length
        : 0,
    };
  }

  /**
   * Get model performance by query category
   * This is the key insight - which models are best at which types of queries
   */
  async getPerformanceByCategory(modelName?: string): Promise<{
    category: string;
    model_name: string;
    total_competitions: number;
    wins: number;
    win_rate: number;
    avg_score: number;
    avg_latency: number;
  }[]> {
    let query = this.supabase
      .from('model_competition_results')
      .select('model_name, query_category, is_winner, score, latency')
      .not('query_category', 'is', null);
    
    if (modelName) {
      query = query.eq('model_name', modelName);
    }
    
    const { data, error } = await query;
    
    if (error || !data) {
      console.error('[MODEL_STATS] Error fetching category performance:', error);
      return [];
    }
    
    // Aggregate by model and category
    const aggregated = new Map<string, {
      total: number;
      wins: number;
      scores: number[];
      latencies: number[];
    }>();
    
    for (const row of data) {
      const key = `${row.model_name}:${row.query_category}`;
      if (!aggregated.has(key)) {
        aggregated.set(key, { total: 0, wins: 0, scores: [], latencies: [] });
      }
      const agg = aggregated.get(key)!;
      agg.total++;
      if (row.is_winner) agg.wins++;
      if (row.score) agg.scores.push(row.score);
      if (row.latency) agg.latencies.push(row.latency);
    }
    
    const results: any[] = [];
    for (const [key, agg] of aggregated) {
      const [model_name, category] = key.split(':');
      results.push({
        category,
        model_name,
        total_competitions: agg.total,
        wins: agg.wins,
        win_rate: agg.total > 0 ? (agg.wins / agg.total) * 100 : 0,
        avg_score: agg.scores.length > 0 
          ? agg.scores.reduce((a, b) => a + b, 0) / agg.scores.length 
          : 0,
        avg_latency: agg.latencies.length > 0 
          ? agg.latencies.reduce((a, b) => a + b, 0) / agg.latencies.length 
          : 0,
      });
    }
    
    return results.sort((a, b) => b.win_rate - a.win_rate);
  }

  /**
   * Get best model for each category based on historical performance
   */
  async getBestModelsByCategory(): Promise<Record<string, {
    best_model: string;
    win_rate: number;
    sample_size: number;
    runner_up?: string;
  }>> {
    const performance = await this.getPerformanceByCategory();
    
    // Group by category and find best model
    const categoryBest: Record<string, any[]> = {};
    for (const row of performance) {
      if (!categoryBest[row.category]) {
        categoryBest[row.category] = [];
      }
      categoryBest[row.category].push(row);
    }
    
    const result: Record<string, any> = {};
    for (const [category, models] of Object.entries(categoryBest)) {
      // Sort by win rate, then by sample size
      models.sort((a, b) => {
        if (Math.abs(a.win_rate - b.win_rate) < 5) {
          return b.total_competitions - a.total_competitions;
        }
        return b.win_rate - a.win_rate;
      });
      
      if (models.length > 0) {
        result[category] = {
          best_model: models[0].model_name,
          win_rate: models[0].win_rate,
          sample_size: models[0].total_competitions,
          runner_up: models[1]?.model_name,
        };
      }
    }
    
    return result;
  }

  /**
   * Get performance by complexity level
   */
  async getPerformanceByComplexity(modelName?: string): Promise<{
    complexity: string;
    model_name: string;
    total: number;
    wins: number;
    win_rate: number;
  }[]> {
    let query = this.supabase
      .from('model_competition_results')
      .select('model_name, query_complexity, is_winner')
      .not('query_complexity', 'is', null);
    
    if (modelName) {
      query = query.eq('model_name', modelName);
    }
    
    const { data, error } = await query;
    
    if (error || !data) {
      console.error('[MODEL_STATS] Error fetching complexity performance:', error);
      return [];
    }
    
    // Aggregate
    const aggregated = new Map<string, { total: number; wins: number }>();
    
    for (const row of data) {
      const key = `${row.model_name}:${row.query_complexity}`;
      if (!aggregated.has(key)) {
        aggregated.set(key, { total: 0, wins: 0 });
      }
      const agg = aggregated.get(key)!;
      agg.total++;
      if (row.is_winner) agg.wins++;
    }
    
    const results: any[] = [];
    for (const [key, agg] of aggregated) {
      const [model_name, complexity] = key.split(':');
      results.push({
        complexity,
        model_name,
        total: agg.total,
        wins: agg.wins,
        win_rate: agg.total > 0 ? (agg.wins / agg.total) * 100 : 0,
      });
    }
    
    return results.sort((a, b) => b.win_rate - a.win_rate);
  }

  /**
   * Get insights summary for dashboard
   */
  async getInsightsSummary(): Promise<{
    total_competitions: number;
    categories_tracked: string[];
    best_by_category: Record<string, string>;
    model_specialties: Record<string, string[]>;
  }> {
    const [categoryPerformance, bestByCategory] = await Promise.all([
      this.getPerformanceByCategory(),
      this.getBestModelsByCategory(),
    ]);
    
    // Extract unique categories
    const categories = [...new Set(categoryPerformance.map(p => p.category))];
    
    // Total competitions
    const totalCompetitions = categoryPerformance.reduce((sum, p) => sum + p.total_competitions, 0) / 3; // Divide by ~3 models
    
    // Best model for each category
    const bestModels: Record<string, string> = {};
    for (const [cat, data] of Object.entries(bestByCategory)) {
      bestModels[cat] = data.best_model;
    }
    
    // Find specialties for each model (categories where they have >50% win rate)
    const modelSpecialties: Record<string, string[]> = {};
    for (const perf of categoryPerformance) {
      if (perf.win_rate >= 50 && perf.total_competitions >= 5) {
        if (!modelSpecialties[perf.model_name]) {
          modelSpecialties[perf.model_name] = [];
        }
        modelSpecialties[perf.model_name].push(perf.category);
      }
    }
    
    return {
      total_competitions: Math.round(totalCompetitions),
      categories_tracked: categories,
      best_by_category: bestModels,
      model_specialties: modelSpecialties,
    };
  }
}
