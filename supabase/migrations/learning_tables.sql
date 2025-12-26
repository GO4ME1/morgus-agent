-- Morgus Learning System Tables
-- Closes the feedback loop for DPPM reflections and model performance

-- 1. DPPM Reflections - stores outcomes of complex task executions
CREATE TABLE IF NOT EXISTS dppm_reflections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  conversation_id UUID,
  
  -- Task details
  goal TEXT NOT NULL,
  goal_category TEXT, -- 'website', 'analysis', 'writing', etc.
  complexity_score INT CHECK (complexity_score >= 0 AND complexity_score <= 10),
  
  -- Execution results
  subtask_count INT NOT NULL,
  completed_subtasks INT NOT NULL,
  total_time_ms INT NOT NULL,
  success BOOLEAN NOT NULL,
  
  -- Model performance per subtask
  subtask_results JSONB NOT NULL DEFAULT '[]',
  -- Format: [{ subtask_id, title, winning_model, latency_ms, status, runner_up_model }]
  
  -- Learnings
  lessons_learned TEXT[] DEFAULT '{}',
  reflection_text TEXT,
  
  -- Deployment info (if applicable)
  deployed_url TEXT,
  project_type TEXT, -- 'website', 'app', 'script', 'document'
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Model Performance Stats - aggregated model performance by task type
CREATE TABLE IF NOT EXISTS model_performance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_name TEXT NOT NULL,
  task_category TEXT NOT NULL, -- 'website', 'coding', 'writing', 'analysis', etc.
  
  -- Aggregated stats
  total_attempts INT DEFAULT 0,
  wins INT DEFAULT 0,
  avg_latency_ms FLOAT DEFAULT 0,
  avg_quality_score FLOAT DEFAULT 0, -- 0-100
  
  -- Calculated win rate
  win_rate FLOAT GENERATED ALWAYS AS (
    CASE WHEN total_attempts > 0 THEN wins::FLOAT / total_attempts ELSE 0 END
  ) STORED,
  
  -- Time tracking
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(model_name, task_category)
);

-- 3. User Learning Preferences - personalized model preferences per user
CREATE TABLE IF NOT EXISTS user_learning_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  
  -- Preferred models by category (learned from feedback)
  preferred_models JSONB DEFAULT '{}',
  -- Format: { "website": "gemini", "coding": "claude", "writing": "gpt-4o-mini" }
  
  -- Communication preferences (learned from interactions)
  preferred_response_length TEXT DEFAULT 'medium', -- 'brief', 'medium', 'detailed'
  preferred_tone TEXT DEFAULT 'professional', -- 'casual', 'professional', 'technical'
  expertise_areas TEXT[] DEFAULT '{}',
  
  -- Interaction stats
  total_interactions INT DEFAULT 0,
  dppm_tasks_completed INT DEFAULT 0,
  favorite_task_types TEXT[] DEFAULT '{}',
  
  -- Feedback tracking
  positive_feedback_count INT DEFAULT 0,
  negative_feedback_count INT DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Task Pattern Memory - remembers successful decomposition patterns
CREATE TABLE IF NOT EXISTS task_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Pattern matching
  pattern_keywords TEXT[] NOT NULL, -- ['landing', 'page', 'website']
  task_category TEXT NOT NULL,
  
  -- Successful decomposition template
  recommended_subtasks JSONB NOT NULL,
  -- Format: [{ title, description, typical_model_winner }]
  
  -- Performance stats
  times_used INT DEFAULT 0,
  success_rate FLOAT DEFAULT 0,
  avg_completion_time_ms INT DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_dppm_reflections_user ON dppm_reflections(user_id);
CREATE INDEX IF NOT EXISTS idx_dppm_reflections_category ON dppm_reflections(goal_category);
CREATE INDEX IF NOT EXISTS idx_dppm_reflections_created ON dppm_reflections(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_model_performance_category ON model_performance(task_category);
CREATE INDEX IF NOT EXISTS idx_model_performance_win_rate ON model_performance(win_rate DESC);
CREATE INDEX IF NOT EXISTS idx_task_patterns_keywords ON task_patterns USING GIN(pattern_keywords);

-- RLS Policies
ALTER TABLE dppm_reflections ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_learning_preferences ENABLE ROW LEVEL SECURITY;

-- Users can only see their own reflections
CREATE POLICY dppm_reflections_user_policy ON dppm_reflections
  FOR ALL USING (auth.uid() = user_id);

-- Users can only see/edit their own preferences
CREATE POLICY user_learning_preferences_policy ON user_learning_preferences
  FOR ALL USING (auth.uid() = user_id);

-- Model performance and task patterns are readable by all authenticated users
ALTER TABLE model_performance ENABLE ROW LEVEL SECURITY;
CREATE POLICY model_performance_read_policy ON model_performance
  FOR SELECT USING (auth.role() = 'authenticated');

ALTER TABLE task_patterns ENABLE ROW LEVEL SECURITY;
CREATE POLICY task_patterns_read_policy ON task_patterns
  FOR SELECT USING (auth.role() = 'authenticated');

-- Functions for updating aggregated stats

-- Function to update model performance after a DPPM reflection
CREATE OR REPLACE FUNCTION update_model_performance_from_reflection()
RETURNS TRIGGER AS $$
DECLARE
  subtask JSONB;
  model TEXT;
  category TEXT;
BEGIN
  category := COALESCE(NEW.goal_category, 'general');
  
  -- Loop through each subtask result
  FOR subtask IN SELECT * FROM jsonb_array_elements(NEW.subtask_results)
  LOOP
    model := subtask->>'winning_model';
    
    IF model IS NOT NULL AND model != 'none' THEN
      -- Upsert model performance
      INSERT INTO model_performance (model_name, task_category, total_attempts, wins, avg_latency_ms)
      VALUES (model, category, 1, 1, (subtask->>'latency_ms')::FLOAT)
      ON CONFLICT (model_name, task_category) DO UPDATE SET
        total_attempts = model_performance.total_attempts + 1,
        wins = model_performance.wins + 1,
        avg_latency_ms = (model_performance.avg_latency_ms * model_performance.total_attempts + (subtask->>'latency_ms')::FLOAT) / (model_performance.total_attempts + 1),
        last_updated = NOW();
    END IF;
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update model performance
DROP TRIGGER IF EXISTS trigger_update_model_performance ON dppm_reflections;
CREATE TRIGGER trigger_update_model_performance
  AFTER INSERT ON dppm_reflections
  FOR EACH ROW
  EXECUTE FUNCTION update_model_performance_from_reflection();

-- Function to get recommended models for a task category
CREATE OR REPLACE FUNCTION get_recommended_models(p_category TEXT, p_limit INT DEFAULT 3)
RETURNS TABLE(model_name TEXT, win_rate FLOAT, avg_latency_ms FLOAT) AS $$
BEGIN
  RETURN QUERY
  SELECT mp.model_name, mp.win_rate, mp.avg_latency_ms
  FROM model_performance mp
  WHERE mp.task_category = p_category
    AND mp.total_attempts >= 5  -- Minimum sample size
  ORDER BY mp.win_rate DESC, mp.avg_latency_ms ASC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Function to get user's learning stats
CREATE OR REPLACE FUNCTION get_user_learning_stats(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'total_dppm_tasks', COUNT(*),
    'success_rate', AVG(CASE WHEN success THEN 1 ELSE 0 END),
    'avg_completion_time_ms', AVG(total_time_ms),
    'favorite_categories', (
      SELECT jsonb_agg(goal_category)
      FROM (
        SELECT goal_category, COUNT(*) as cnt
        FROM dppm_reflections
        WHERE user_id = p_user_id AND goal_category IS NOT NULL
        GROUP BY goal_category
        ORDER BY cnt DESC
        LIMIT 3
      ) top_cats
    ),
    'top_models', (
      SELECT jsonb_object_agg(model, wins)
      FROM (
        SELECT subtask->>'winning_model' as model, COUNT(*) as wins
        FROM dppm_reflections, jsonb_array_elements(subtask_results) as subtask
        WHERE user_id = p_user_id
        GROUP BY subtask->>'winning_model'
        ORDER BY wins DESC
        LIMIT 5
      ) top_models
    )
  ) INTO result
  FROM dppm_reflections
  WHERE user_id = p_user_id;
  
  RETURN COALESCE(result, '{}'::JSONB);
END;
$$ LANGUAGE plpgsql;
