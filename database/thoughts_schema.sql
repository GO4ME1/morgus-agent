-- Morgus Thoughts System Database Schema
-- Run this in Supabase SQL Editor

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- THOUGHTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS thoughts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  system_prompt TEXT,  -- Custom instructions for this Thought
  model_preference VARCHAR(50) DEFAULT 'gpt-4o-mini',
  moe_enabled BOOLEAN DEFAULT false,
  moe_config JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_accessed_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_thoughts_updated_at ON thoughts(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_thoughts_last_accessed ON thoughts(last_accessed_at DESC);
CREATE INDEX IF NOT EXISTS idx_thoughts_name ON thoughts(name);

-- ============================================
-- THOUGHT MESSAGES TABLE
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

-- Indexes for message retrieval
CREATE INDEX IF NOT EXISTS idx_thought_messages_thought_id ON thought_messages(thought_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_thought_messages_created_at ON thought_messages(created_at DESC);

-- ============================================
-- THOUGHT FILES TABLE
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

-- Indexes for file management
CREATE INDEX IF NOT EXISTS idx_thought_files_thought_id ON thought_files(thought_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_thought_files_filename ON thought_files(filename);

-- ============================================
-- THOUGHT ARTIFACTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS thought_artifacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thought_id UUID NOT NULL REFERENCES thoughts(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL CHECK (type IN ('code', 'document', 'image', 'data', 'other')),
  title VARCHAR(255),
  content TEXT,
  language VARCHAR(50),  -- For code artifacts
  created_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Indexes for artifact retrieval
CREATE INDEX IF NOT EXISTS idx_thought_artifacts_thought_id ON thought_artifacts(thought_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_thought_artifacts_type ON thought_artifacts(type);

-- ============================================
-- UPDATE EXISTING TASKS TABLE
-- ============================================
-- Add thought_id to tasks table to link tasks with thoughts
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS thought_id UUID REFERENCES thoughts(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_tasks_thought_id ON tasks(thought_id);

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to update last_accessed_at when a thought is used
CREATE OR REPLACE FUNCTION update_thought_last_accessed()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE thoughts 
  SET last_accessed_at = NOW() 
  WHERE id = NEW.thought_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update last_accessed_at when messages are added
DROP TRIGGER IF EXISTS trigger_update_thought_accessed ON thought_messages;
CREATE TRIGGER trigger_update_thought_accessed
  AFTER INSERT ON thought_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_thought_last_accessed();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at on thoughts table
DROP TRIGGER IF EXISTS trigger_update_thoughts_timestamp ON thoughts;
CREATE TRIGGER trigger_update_thoughts_timestamp
  BEFORE UPDATE ON thoughts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================
-- Note: Uncomment and configure these when you add user authentication

-- ALTER TABLE thoughts ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE thought_messages ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE thought_files ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE thought_artifacts ENABLE ROW LEVEL SECURITY;

-- Example RLS policies (adjust based on your auth setup):
-- CREATE POLICY "Users can view their own thoughts" ON thoughts
--   FOR SELECT USING (auth.uid() = user_id);
-- CREATE POLICY "Users can create their own thoughts" ON thoughts
--   FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================
-- SEED DATA (Optional - for testing)
-- ============================================

-- Create a default "General" thought
INSERT INTO thoughts (name, description, system_prompt, model_preference)
VALUES (
  'General Chat',
  'Default conversation space',
  'You are Morgus, a helpful AI assistant.',
  'gpt-4o-mini'
) ON CONFLICT DO NOTHING;

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Check all tables were created
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('thoughts', 'thought_messages', 'thought_files', 'thought_artifacts')
ORDER BY table_name;

-- Check indexes
SELECT indexname, tablename 
FROM pg_indexes 
WHERE schemaname = 'public' 
  AND tablename LIKE 'thought%'
ORDER BY tablename, indexname;

-- Count records (should be 1 from seed data)
SELECT 
  (SELECT COUNT(*) FROM thoughts) as thoughts_count,
  (SELECT COUNT(*) FROM thought_messages) as messages_count,
  (SELECT COUNT(*) FROM thought_files) as files_count,
  (SELECT COUNT(*) FROM thought_artifacts) as artifacts_count;
