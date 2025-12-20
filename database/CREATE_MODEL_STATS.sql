-- Model Statistics for MOE Leaderboard
-- Run this in Supabase SQL Editor

-- Model stats table
CREATE TABLE IF NOT EXISTS model_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_name TEXT NOT NULL UNIQUE,
  total_competitions INTEGER DEFAULT 0,
  total_wins INTEGER DEFAULT 0,
  win_rate DECIMAL(5,2) DEFAULT 0.00,
  avg_score DECIMAL(5,2) DEFAULT 0.00,
  avg_latency INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Competition results table
CREATE TABLE IF NOT EXISTS model_competition_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  competition_id UUID,
  model_name TEXT NOT NULL,
  is_winner BOOLEAN DEFAULT FALSE,
  score DECIMAL(5,2) NOT NULL,
  rank INTEGER,
  latency INTEGER NOT NULL,
  tokens INTEGER NOT NULL,
  cost DECIMAL(10,8) DEFAULT 0,
  user_message TEXT,
  model_response TEXT,
  had_files BOOLEAN DEFAULT FALSE,
  file_types TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_model_stats_win_rate ON model_stats(win_rate DESC);
CREATE INDEX IF NOT EXISTS idx_competition_results_model ON model_competition_results(model_name);

-- Leaderboard view
CREATE OR REPLACE VIEW model_leaderboard AS
SELECT
  model_name,
  total_competitions,
  total_wins AS wins,
  win_rate,
  avg_score,
  avg_latency
FROM model_stats
WHERE total_competitions > 0
ORDER BY win_rate DESC, avg_score DESC;

-- Verify
SELECT 'Model stats tables created!' as status;
