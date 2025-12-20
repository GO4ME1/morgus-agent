-- ============================================
-- FIXED MORGUS DATABASE MIGRATION
-- Handles existing tables gracefully
-- ============================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- THOUGHTS TABLE (Conversations)
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
-- THOUGHT MESSAGES TABLE (Chat History)
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
  language VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_thought_artifacts_thought_id ON thought_artifacts(thought_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_thought_artifacts_type ON thought_artifacts(type);

-- ============================================
-- MESSAGE RATINGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS message_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL,
  thought_id UUID REFERENCES thoughts(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating IN (-1, 1)),
  feedback TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_message_ratings_message_id ON message_ratings(message_id);
CREATE INDEX IF NOT EXISTS idx_message_ratings_thought_id ON message_ratings(thought_id);

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to update last_accessed_at
CREATE OR REPLACE FUNCTION update_thought_last_accessed()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE thoughts 
  SET last_accessed_at = NOW() 
  WHERE id = NEW.thought_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- TRIGGERS
-- ============================================

-- Trigger for thought last accessed
DROP TRIGGER IF EXISTS trigger_update_thought_accessed ON thought_messages;
CREATE TRIGGER trigger_update_thought_accessed
  AFTER INSERT ON thought_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_thought_last_accessed();

-- Trigger for thought updated_at
DROP TRIGGER IF EXISTS trigger_update_thoughts_timestamp ON thoughts;
CREATE TRIGGER trigger_update_thoughts_timestamp
  BEFORE UPDATE ON thoughts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- SEED DATA
-- ============================================

-- Create default "General Chat" thought
INSERT INTO thoughts (name, description, system_prompt, model_preference, moe_enabled)
VALUES (
  'General Chat',
  'Default conversation space',
  'You are Morgus, a helpful AI assistant.',
  'gpt-4o-mini',
  true
) 
ON CONFLICT DO NOTHING;

-- ============================================
-- VERIFICATION
-- ============================================

-- Show what we created
SELECT 
  'Migration completed!' as status,
  (SELECT COUNT(*) FROM thoughts) as thoughts_count,
  (SELECT COUNT(*) FROM thought_messages) as messages_count;
