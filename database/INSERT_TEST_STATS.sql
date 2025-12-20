-- Insert test competition data to verify leaderboard
-- Run this in Supabase SQL Editor

-- Insert some test model stats
INSERT INTO model_stats (model_name, total_competitions, total_wins, win_rate, avg_score, avg_latency) VALUES
  ('google/gemini-2.0-flash-exp:free', 10, 6, 60.00, 85.50, 1200),
  ('anthropic/claude-3.5-haiku', 10, 3, 30.00, 78.20, 1500),
  ('openai/gpt-4o-mini', 10, 1, 10.00, 72.10, 1800)
ON CONFLICT (model_name) DO UPDATE SET
  total_competitions = EXCLUDED.total_competitions,
  total_wins = EXCLUDED.total_wins,
  win_rate = EXCLUDED.win_rate,
  avg_score = EXCLUDED.avg_score,
  avg_latency = EXCLUDED.avg_latency;

-- Insert some test competition results
INSERT INTO model_competition_results (
  model_name, is_winner, score, rank, latency, tokens, cost, user_message, model_response
) VALUES
  ('google/gemini-2.0-flash-exp:free', true, 88.5, 1, 1200, 150, 0.0, 'Test message 1', 'Test response'),
  ('anthropic/claude-3.5-haiku', false, 76.2, 2, 1500, 180, 0.001, 'Test message 1', 'Test response'),
  ('openai/gpt-4o-mini', false, 71.8, 3, 1800, 200, 0.002, 'Test message 1', 'Test response');

-- Verify
SELECT * FROM model_leaderboard;
