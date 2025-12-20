-- ============================================
-- MINIMAL MORGUS MIGRATION - Just Tables
-- No triggers, no conflicts
-- ============================================

-- Enable UUID extension
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

-- ============================================
-- SEED DATA
-- ============================================
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
SELECT 
  'Tables created!' as status,
  (SELECT COUNT(*) FROM thoughts) as thoughts_count;
