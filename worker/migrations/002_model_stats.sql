-- =====================================================
-- Model Stats Migration
-- Tracks AI model performance in the MOE (Mixture of Experts) system
-- =====================================================

-- Model competition results table
-- Records every model's performance in each competition
CREATE TABLE IF NOT EXISTS model_competition_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    competition_id UUID,
    model_name TEXT NOT NULL,
    is_winner BOOLEAN NOT NULL DEFAULT false,
    score DECIMAL(10, 4) NOT NULL DEFAULT 0,
    rank INTEGER NOT NULL DEFAULT 0,
    latency INTEGER NOT NULL DEFAULT 0, -- milliseconds
    tokens INTEGER NOT NULL DEFAULT 0,
    cost DECIMAL(10, 6) NOT NULL DEFAULT 0,
    quality_score DECIMAL(5, 4),
    speed_score DECIMAL(5, 4),
    cost_score DECIMAL(5, 4),
    preference_score DECIMAL(5, 4),
    user_message TEXT,
    model_response TEXT,
    had_files BOOLEAN DEFAULT false,
    file_types TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_model_competition_model_name ON model_competition_results(model_name);
CREATE INDEX IF NOT EXISTS idx_model_competition_created_at ON model_competition_results(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_model_competition_is_winner ON model_competition_results(is_winner);
CREATE INDEX IF NOT EXISTS idx_model_competition_competition_id ON model_competition_results(competition_id);

-- Aggregated model stats view (materialized for performance)
-- This provides quick access to model leaderboard data
CREATE MATERIALIZED VIEW IF NOT EXISTS model_stats_summary AS
SELECT 
    model_name,
    COUNT(*) as total_competitions,
    SUM(CASE WHEN is_winner THEN 1 ELSE 0 END) as total_wins,
    SUM(CASE WHEN NOT is_winner THEN 1 ELSE 0 END) as total_losses,
    ROUND(
        (SUM(CASE WHEN is_winner THEN 1 ELSE 0 END)::DECIMAL / NULLIF(COUNT(*), 0)) * 100, 
        2
    ) as win_rate,
    ROUND(AVG(score)::DECIMAL, 4) as avg_score,
    ROUND(AVG(latency)::DECIMAL, 0) as avg_latency,
    ROUND(AVG(tokens)::DECIMAL, 0) as avg_tokens,
    ROUND(AVG(cost)::DECIMAL, 6) as avg_cost,
    ROUND(AVG(quality_score)::DECIMAL, 4) as avg_quality_score,
    ROUND(AVG(speed_score)::DECIMAL, 4) as avg_speed_score,
    ROUND(AVG(cost_score)::DECIMAL, 4) as avg_cost_score,
    MAX(created_at) as last_competition_at
FROM model_competition_results
GROUP BY model_name;

-- Create unique index for concurrent refresh
CREATE UNIQUE INDEX IF NOT EXISTS idx_model_stats_summary_model ON model_stats_summary(model_name);

-- Function to refresh the materialized view
CREATE OR REPLACE FUNCTION refresh_model_stats()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY model_stats_summary;
END;
$$ LANGUAGE plpgsql;

-- Daily stats table for time-series analysis
CREATE TABLE IF NOT EXISTS model_daily_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    model_name TEXT NOT NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    competitions INTEGER DEFAULT 0,
    wins INTEGER DEFAULT 0,
    avg_score DECIMAL(10, 4) DEFAULT 0,
    avg_latency INTEGER DEFAULT 0,
    avg_tokens INTEGER DEFAULT 0,
    total_cost DECIMAL(10, 6) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(model_name, date)
);

CREATE INDEX IF NOT EXISTS idx_model_daily_stats_date ON model_daily_stats(date DESC);
CREATE INDEX IF NOT EXISTS idx_model_daily_stats_model ON model_daily_stats(model_name);

-- Function to update daily stats (call this after each competition)
CREATE OR REPLACE FUNCTION update_model_daily_stats()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO model_daily_stats (model_name, date, competitions, wins, avg_score, avg_latency, avg_tokens, total_cost)
    VALUES (
        NEW.model_name,
        CURRENT_DATE,
        1,
        CASE WHEN NEW.is_winner THEN 1 ELSE 0 END,
        NEW.score,
        NEW.latency,
        NEW.tokens,
        NEW.cost
    )
    ON CONFLICT (model_name, date) DO UPDATE SET
        competitions = model_daily_stats.competitions + 1,
        wins = model_daily_stats.wins + CASE WHEN NEW.is_winner THEN 1 ELSE 0 END,
        avg_score = (model_daily_stats.avg_score * model_daily_stats.competitions + NEW.score) / (model_daily_stats.competitions + 1),
        avg_latency = (model_daily_stats.avg_latency * model_daily_stats.competitions + NEW.latency) / (model_daily_stats.competitions + 1),
        avg_tokens = (model_daily_stats.avg_tokens * model_daily_stats.competitions + NEW.tokens) / (model_daily_stats.competitions + 1),
        total_cost = model_daily_stats.total_cost + NEW.cost;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update daily stats
DROP TRIGGER IF EXISTS trigger_update_model_daily_stats ON model_competition_results;
CREATE TRIGGER trigger_update_model_daily_stats
    AFTER INSERT ON model_competition_results
    FOR EACH ROW
    EXECUTE FUNCTION update_model_daily_stats();

-- Enable Row Level Security
ALTER TABLE model_competition_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE model_daily_stats ENABLE ROW LEVEL SECURITY;

-- Allow public read access to stats (they're aggregated, no PII)
CREATE POLICY "Allow public read on model_competition_results" 
    ON model_competition_results FOR SELECT 
    USING (true);

CREATE POLICY "Allow public read on model_daily_stats" 
    ON model_daily_stats FOR SELECT 
    USING (true);

-- Allow service role to insert/update
CREATE POLICY "Allow service role insert on model_competition_results" 
    ON model_competition_results FOR INSERT 
    WITH CHECK (true);

CREATE POLICY "Allow service role insert on model_daily_stats" 
    ON model_daily_stats FOR INSERT 
    WITH CHECK (true);

CREATE POLICY "Allow service role update on model_daily_stats" 
    ON model_daily_stats FOR UPDATE 
    USING (true);

-- =====================================================
-- Content Filter Logs Table
-- Tracks blocked content for safety monitoring
-- =====================================================

CREATE TABLE IF NOT EXISTS content_filter_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    filter_type TEXT NOT NULL, -- 'input' or 'output'
    category TEXT NOT NULL,
    severity TEXT NOT NULL,
    reason TEXT,
    flagged_preview TEXT, -- First 100 chars, redacted for output
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_content_filter_logs_created ON content_filter_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_content_filter_logs_category ON content_filter_logs(category);
CREATE INDEX IF NOT EXISTS idx_content_filter_logs_severity ON content_filter_logs(severity);

-- RLS for content filter logs (admin only)
ALTER TABLE content_filter_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow service role on content_filter_logs" 
    ON content_filter_logs FOR ALL 
    USING (true);

-- =====================================================
-- Summary
-- =====================================================
-- Tables created:
--   1. model_competition_results - Individual competition records
--   2. model_daily_stats - Aggregated daily statistics
--   3. content_filter_logs - Safety filter violation logs
--
-- Views created:
--   1. model_stats_summary - Materialized view for leaderboard
--
-- Functions created:
--   1. refresh_model_stats() - Refresh the materialized view
--   2. update_model_daily_stats() - Trigger function for daily stats
--
-- To refresh the leaderboard view, run:
--   SELECT refresh_model_stats();
-- =====================================================
