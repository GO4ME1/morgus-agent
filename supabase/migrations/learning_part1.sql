-- Part 1: Create the learning tables

-- 1. DPPM Reflections - stores outcomes of complex task executions
CREATE TABLE IF NOT EXISTS dppm_reflections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  conversation_id UUID,
  goal TEXT NOT NULL,
  goal_category TEXT,
  complexity_score INT CHECK (complexity_score >= 0 AND complexity_score <= 10),
  subtask_count INT NOT NULL,
  completed_subtasks INT NOT NULL,
  total_time_ms INT NOT NULL,
  success BOOLEAN NOT NULL,
  subtask_results JSONB NOT NULL DEFAULT '[]',
  lessons_learned TEXT[] DEFAULT '{}',
  reflection_text TEXT,
  deployed_url TEXT,
  project_type TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Model Performance Stats
CREATE TABLE IF NOT EXISTS model_performance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_name TEXT NOT NULL,
  task_category TEXT NOT NULL,
  total_attempts INT DEFAULT 0,
  wins INT DEFAULT 0,
  avg_latency_ms FLOAT DEFAULT 0,
  avg_quality_score FLOAT DEFAULT 0,
  win_rate FLOAT GENERATED ALWAYS AS (
    CASE WHEN total_attempts > 0 THEN wins::FLOAT / total_attempts ELSE 0 END
  ) STORED,
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(model_name, task_category)
);

-- 3. User Learning Preferences
CREATE TABLE IF NOT EXISTS user_learning_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  preferred_models JSONB DEFAULT '{}',
  preferred_response_length TEXT DEFAULT 'medium',
  preferred_tone TEXT DEFAULT 'professional',
  expertise_areas TEXT[] DEFAULT '{}',
  total_interactions INT DEFAULT 0,
  dppm_tasks_completed INT DEFAULT 0,
  favorite_task_types TEXT[] DEFAULT '{}',
  positive_feedback_count INT DEFAULT 0,
  negative_feedback_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Task Pattern Memory
CREATE TABLE IF NOT EXISTS task_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pattern_keywords TEXT[] NOT NULL,
  task_category TEXT NOT NULL,
  recommended_subtasks JSONB NOT NULL,
  times_used INT DEFAULT 0,
  success_rate FLOAT DEFAULT 0,
  avg_completion_time_ms INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
