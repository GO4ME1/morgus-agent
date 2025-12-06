-- Model Statistics Tracking
-- Tracks performance metrics for each AI model in the MOE system

CREATE TABLE IF NOT EXISTS model_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_name TEXT NOT NULL,
  
  -- Competition stats
  total_competitions INTEGER DEFAULT 0,
  total_wins INTEGER DEFAULT 0,
  total_losses INTEGER DEFAULT 0,
  win_rate DECIMAL(5,2) DEFAULT 0.00,
  
  -- Performance metrics
  avg_score DECIMAL(5,2) DEFAULT 0.00,
  avg_latency INTEGER DEFAULT 0, -- milliseconds
  avg_tokens INTEGER DEFAULT 0,
  avg_cost DECIMAL(10,8) DEFAULT 0.00000000,
  
  -- Quality breakdown
  avg_quality_score DECIMAL(5,2) DEFAULT 0.00,
  avg_speed_score DECIMAL(5,2) DEFAULT 0.00,
  avg_cost_score DECIMAL(5,2) DEFAULT 0.00,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_competition_at TIMESTAMP WITH TIME ZONE,
  
  UNIQUE(model_name)
);

-- Individual competition results
CREATE TABLE IF NOT EXISTS model_competition_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Competition info
  competition_id UUID, -- Can link to a conversations table later
  model_name TEXT NOT NULL,
  
  -- Result
  is_winner BOOLEAN DEFAULT FALSE,
  score DECIMAL(5,2) NOT NULL,
  rank INTEGER, -- 1st, 2nd, 3rd, etc.
  
  -- Performance
  latency INTEGER NOT NULL, -- milliseconds
  tokens INTEGER NOT NULL,
  cost DECIMAL(10,8) DEFAULT 0.00000000,
  
  -- Quality breakdown
  quality_score DECIMAL(5,2),
  speed_score DECIMAL(5,2),
  cost_score DECIMAL(5,2),
  preference_score DECIMAL(5,2),
  
  -- Context
  user_message TEXT,
  model_response TEXT,
  had_files BOOLEAN DEFAULT FALSE,
  file_types TEXT[], -- e.g., ['image/jpeg', 'application/pdf']
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  FOREIGN KEY (model_name) REFERENCES model_stats(model_name) ON DELETE CASCADE
);

-- Create indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_model_stats_win_rate ON model_stats(win_rate DESC);
CREATE INDEX IF NOT EXISTS idx_model_stats_avg_score ON model_stats(avg_score DESC);
CREATE INDEX IF NOT EXISTS idx_model_stats_updated_at ON model_stats(updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_competition_results_model ON model_competition_results(model_name);
CREATE INDEX IF NOT EXISTS idx_competition_results_winner ON model_competition_results(is_winner);
CREATE INDEX IF NOT EXISTS idx_competition_results_created ON model_competition_results(created_at DESC);

-- Function to update model stats after each competition
CREATE OR REPLACE FUNCTION update_model_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the model's aggregate stats
  UPDATE model_stats
  SET
    total_competitions = total_competitions + 1,
    total_wins = total_wins + CASE WHEN NEW.is_winner THEN 1 ELSE 0 END,
    total_losses = total_losses + CASE WHEN NOT NEW.is_winner THEN 1 ELSE 0 END,
    win_rate = ROUND(
      (total_wins + CASE WHEN NEW.is_winner THEN 1 ELSE 0 END)::DECIMAL / 
      (total_competitions + 1) * 100, 
      2
    ),
    avg_score = ROUND(
      ((avg_score * total_competitions) + NEW.score) / (total_competitions + 1),
      2
    ),
    avg_latency = ROUND(
      ((avg_latency * total_competitions) + NEW.latency) / (total_competitions + 1)
    ),
    avg_tokens = ROUND(
      ((avg_tokens * total_competitions) + NEW.tokens) / (total_competitions + 1)
    ),
    avg_cost = ROUND(
      ((avg_cost * total_competitions) + NEW.cost) / (total_competitions + 1),
      8
    ),
    avg_quality_score = ROUND(
      ((avg_quality_score * total_competitions) + COALESCE(NEW.quality_score, 0)) / (total_competitions + 1),
      2
    ),
    avg_speed_score = ROUND(
      ((avg_speed_score * total_competitions) + COALESCE(NEW.speed_score, 0)) / (total_competitions + 1),
      2
    ),
    avg_cost_score = ROUND(
      ((avg_cost_score * total_competitions) + COALESCE(NEW.cost_score, 0)) / (total_competitions + 1),
      2
    ),
    updated_at = NOW(),
    last_competition_at = NOW()
  WHERE model_name = NEW.model_name;
  
  -- If model doesn't exist, create it
  IF NOT FOUND THEN
    INSERT INTO model_stats (
      model_name,
      total_competitions,
      total_wins,
      total_losses,
      win_rate,
      avg_score,
      avg_latency,
      avg_tokens,
      avg_cost,
      avg_quality_score,
      avg_speed_score,
      avg_cost_score,
      last_competition_at
    ) VALUES (
      NEW.model_name,
      1,
      CASE WHEN NEW.is_winner THEN 1 ELSE 0 END,
      CASE WHEN NOT NEW.is_winner THEN 1 ELSE 0 END,
      CASE WHEN NEW.is_winner THEN 100.00 ELSE 0.00 END,
      NEW.score,
      NEW.latency,
      NEW.tokens,
      NEW.cost,
      COALESCE(NEW.quality_score, 0),
      COALESCE(NEW.speed_score, 0),
      COALESCE(NEW.cost_score, 0),
      NOW()
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update stats
CREATE TRIGGER trigger_update_model_stats
AFTER INSERT ON model_competition_results
FOR EACH ROW
EXECUTE FUNCTION update_model_stats();

-- View for easy leaderboard queries
CREATE OR REPLACE VIEW model_leaderboard AS
SELECT
  model_name,
  total_competitions,
  total_wins,
  total_losses,
  win_rate,
  avg_score,
  avg_latency,
  avg_tokens,
  avg_cost,
  last_competition_at,
  RANK() OVER (ORDER BY win_rate DESC, avg_score DESC) as rank
FROM model_stats
WHERE total_competitions > 0
ORDER BY win_rate DESC, avg_score DESC;

-- View for recent performance trends
CREATE OR REPLACE VIEW recent_model_performance AS
SELECT
  model_name,
  COUNT(*) as recent_competitions,
  SUM(CASE WHEN is_winner THEN 1 ELSE 0 END) as recent_wins,
  ROUND(AVG(score), 2) as recent_avg_score,
  ROUND(AVG(latency)) as recent_avg_latency
FROM model_competition_results
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY model_name
ORDER BY recent_wins DESC, recent_avg_score DESC;

-- Comments for documentation
COMMENT ON TABLE model_stats IS 'Aggregate statistics for each AI model in the MOE system';
COMMENT ON TABLE model_competition_results IS 'Individual competition results for detailed analysis';
COMMENT ON VIEW model_leaderboard IS 'Ranked leaderboard of all models by win rate and average score';
COMMENT ON VIEW recent_model_performance IS 'Performance metrics for the last 7 days';
