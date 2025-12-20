-- Just insert a default thought - no schema changes!
-- Run this in Supabase SQL Editor

INSERT INTO thoughts (
  title,
  description,
  custom_instructions,
  model_preference,
  is_default
) VALUES (
  'General Chat',
  'Default conversation space',
  'You are Morgus, a helpful AI assistant with autonomous capabilities.',
  'gpt-4o-mini',
  true
)
ON CONFLICT DO NOTHING;

-- Verify it worked
SELECT id, title, is_default, created_at FROM thoughts WHERE is_default = true;
