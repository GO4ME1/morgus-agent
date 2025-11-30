-- Create Thoughts System Tables
-- Run this in Supabase SQL Editor

-- 1. Create thoughts table
CREATE TABLE IF NOT EXISTS thoughts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  custom_instructions TEXT,
  model_preference TEXT DEFAULT 'gpt-4o-mini',
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create thought_messages table
CREATE TABLE IF NOT EXISTS thought_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thought_id UUID NOT NULL REFERENCES thoughts(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_thought_messages_thought_id ON thought_messages(thought_id);
CREATE INDEX IF NOT EXISTS idx_thought_messages_created_at ON thought_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_thoughts_created_at ON thoughts(created_at);

-- 4. Insert default "General Chat" thought
INSERT INTO thoughts (title, description, is_default)
VALUES ('General Chat', 'Default conversation space', true)
ON CONFLICT DO NOTHING;
