-- Morgus Simple Database Schema
-- Fixed version without syntax errors

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Evaluations table for feedback (thumbs up/down/tomato)
CREATE TABLE IF NOT EXISTS agent_evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID,
  agent_version VARCHAR(50) DEFAULT 'v1.0.0',
  input_text TEXT NOT NULL,
  output_text TEXT NOT NULL,
  score DECIMAL(3,2),
  feedback_type VARCHAR(20),
  feedback_text TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Thoughts table (main project/context container)
CREATE TABLE IF NOT EXISTS thoughts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  system_prompt TEXT,
  model_preference VARCHAR(50) DEFAULT 'gpt-4o-mini',
  moe_enabled BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_accessed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Thought messages (conversation history per thought)
CREATE TABLE IF NOT EXISTS thought_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thought_id UUID NOT NULL REFERENCES thoughts(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Thought files (file attachments per thought)
CREATE TABLE IF NOT EXISTS thought_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thought_id UUID NOT NULL REFERENCES thoughts(id) ON DELETE CASCADE,
  filename VARCHAR(255) NOT NULL,
  file_type VARCHAR(50),
  file_size INTEGER,
  storage_url TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Thought artifacts (generated code/documents)
CREATE TABLE IF NOT EXISTS thought_artifacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thought_id UUID NOT NULL REFERENCES thoughts(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255),
  content TEXT,
  language VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Link tasks with thoughts
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS thought_id UUID;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_thoughts_updated_at ON thoughts(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_thought_messages_thought_id ON thought_messages(thought_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_evaluations_created_at ON agent_evaluations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tasks_thought_id ON tasks(thought_id);

-- Insert default "General Chat" thought
INSERT INTO thoughts (name, description, system_prompt)
VALUES ('General Chat', 'Default conversation space for general queries', 'You are Morgus, a helpful and autonomous AI agent.')
ON CONFLICT DO NOTHING;

-- Verify tables created
SELECT 'Tables created successfully!' as status;
