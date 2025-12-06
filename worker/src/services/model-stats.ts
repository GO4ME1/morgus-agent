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
}
