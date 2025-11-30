-- Morgus Complete Database Schema
-- Includes: Thoughts System + Self-Improvement/Evaluations System

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- SELF-IMPROVEMENT: EVALUATIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS agent_evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
  agent_version VARCHAR(50) NOT NULL DEFAULT 'v1.0.0',
  input_text TEXT NOT NULL,
  output_text TEXT NOT NULL,
  score DECIMAL(3,2) CHECK (score >= 0 AND score <= 1),
  feedback_type VARCHAR(20) CHECK (feedback_type IN ('human', 'human_glitch', 'llm_judge', 'automated')),
  feedback_text TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_evaluations_score ON agent_evaluations(score);
CREATE INDEX IF NOT EXISTS idx_evaluations_version ON agent_evaluations(agent_version);
CREATE INDEX IF NOT EXISTS idx_evaluations_feedback_type ON agent_evaluations(feedback_type);
CREATE INDEX IF NOT EXISTS idx_evaluations_created_at ON agent_evaluations(created_at DESC);

-- ============================================
-- THOUGHTS SYSTEM: THOUGHTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS thoughts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  system_prompt TEXT,
  model_preference VARCHAR(50) DEFAULT 'gpt-4o-mini',
  moe_enabled BOOLEAN DEFAULT false,
  moe_config JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_accessed_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_thoughts_updated_at ON thoughts(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_thoughts_last_accessed ON thoughts(last_accessed_at DESC);
CREATE INDEX IF NOT EXISTS idx_thoughts_name ON thoughts(name);

-- ============================================
-- THOUGHTS SYSTEM: MESSAGES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS thought_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thought_id UUID NOT NULL REFERENCES thoughts(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  attachments JSONB DEFAULT '[]'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_thought_messages_thought_id ON thought_messages(thought_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_thought_messages_created_at ON thought_messages(created_at DESC);

-- ============================================
-- THOUGHTS SYSTEM: FILES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS thought_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thought_id UUID NOT NULL REFERENCES thoughts(id) ON DELETE CASCADE,
  filename VARCHAR(255) NOT NULL,
  file_type VARCHAR(50),
  file_size INTEGER,
  storage_url TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_thought_files_thought_id ON thought_files(thought_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_thought_files_filename ON thought_files(filename);

-- ============================================
-- THOUGHTS SYSTEM: ARTIFACTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS thought_artifacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thought_id UUID NOT NULL REFERENCES thoughts(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL CHECK (type IN ('code', 'document', 'image', 'data', 'other')),
  title VARCHAR(255),
  content TEXT,
  language VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_thought_artifacts_thought_id ON thought_artifacts(thought_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_thought_artifacts_type ON thought_artifacts(type);

-- ============================================
-- LINK TASKS WITH THOUGHTS
-- ============================================
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS thought_id UUID REFERENCES thoughts(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_tasks_thought_id ON tasks(thought_id);

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Update last_accessed_at when messages are added
CREATE OR REPLACE FUNCTION update_thought_last_accessed()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE thoughts 
  SET last_accessed_at = NOW() 
  WHERE id = NEW.thought_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_thought_accessed ON thought_messages;
CREATE TRIGGER trigger_update_thought_accessed
  AFTER INSERT ON thought_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_thought_last_accessed();

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_thoughts_timestamp ON thoughts;
CREATE TRIGGER trigger_update_thoughts_timestamp
  BEFORE UPDATE ON thoughts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- SEED DATA
-- ============================================

-- Create default "General Chat" thought
INSERT INTO thoughts (name, description, system_prompt, model_preference)
VALUES (
  'General Chat',
  'Default conversation space for general queries',
  'You are Morgus, a helpful and autonomous AI agent.',
  'gpt-4o-mini'
) ON CONFLICT DO NOTHING;

-- ============================================
-- VERIFICATION
-- ============================================

-- Check tables created
SELECT 
  'agent_evaluations' as table_name, 
  COUNT(*) as row_count 
FROM agent_evaluations
UNION ALL
SELECT 'thoughts', COUNT(*) FROM thoughts
UNION ALL
SELECT 'thought_messages', COUNT(*) FROM thought_messages
UNION ALL
SELECT 'thought_files', COUNT(*) FROM thought_files
UNION ALL
SELECT 'thought_artifacts', COUNT(*) FROM thought_artifacts;
