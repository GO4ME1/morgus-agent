-- Migration: Add missing columns to morgys table
-- This adds all the columns required by the Morgy CRUD API

-- Add creator_id column
ALTER TABLE morgys ADD COLUMN IF NOT EXISTS creator_id TEXT;

-- Add category column
ALTER TABLE morgys ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'custom';

-- Add tags column
ALTER TABLE morgys ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

-- Add JSONB columns for complex data
ALTER TABLE morgys ADD COLUMN IF NOT EXISTS ai_config JSONB DEFAULT '{
  "primaryModel": "gpt-4",
  "temperature": 0.7,
  "maxTokens": 2000,
  "systemPrompt": "",
  "fallbackModels": []
}'::jsonb;

ALTER TABLE morgys ADD COLUMN IF NOT EXISTS personality JSONB DEFAULT '{
  "tone": "professional",
  "verbosity": "balanced",
  "emojiUsage": "minimal",
  "responseStyle": ""
}'::jsonb;

ALTER TABLE morgys ADD COLUMN IF NOT EXISTS appearance JSONB DEFAULT '{
  "avatar": "🐷",
  "color": "#8B5CF6",
  "icon": "pig"
}'::jsonb;

ALTER TABLE morgys ADD COLUMN IF NOT EXISTS capabilities JSONB DEFAULT '{
  "webSearch": true,
  "codeExecution": false,
  "fileProcessing": true,
  "imageGeneration": false,
  "voiceInteraction": false,
  "mcpTools": []
}'::jsonb;

ALTER TABLE morgys ADD COLUMN IF NOT EXISTS knowledge_base JSONB DEFAULT '{
  "documents": [],
  "urls": [],
  "customData": ""
}'::jsonb;

-- Add boolean columns
ALTER TABLE morgys ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Add marketplace columns
ALTER TABLE morgys ADD COLUMN IF NOT EXISTS license_type TEXT DEFAULT 'free';
ALTER TABLE morgys ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT false;

-- Add stats columns
ALTER TABLE morgys ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0;
ALTER TABLE morgys ADD COLUMN IF NOT EXISTS total_purchases INTEGER DEFAULT 0;
ALTER TABLE morgys ADD COLUMN IF NOT EXISTS total_revenue DECIMAL(10,2) DEFAULT 0.00;
ALTER TABLE morgys ADD COLUMN IF NOT EXISTS rating DECIMAL(3,2) DEFAULT 0.00;
ALTER TABLE morgus ADD COLUMN IF NOT EXISTS review_count INTEGER DEFAULT 0;

-- Add published_at column
ALTER TABLE morgys ADD COLUMN IF NOT EXISTS published_at TIMESTAMP;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_morgys_creator ON morgys(creator_id);
CREATE INDEX IF NOT EXISTS idx_morgys_public ON morgys(is_public);
CREATE INDEX IF NOT EXISTS idx_morgys_category ON morgys(category);
CREATE INDEX IF NOT EXISTS idx_morgys_rating ON morgys(rating DESC);
CREATE INDEX IF NOT EXISTS idx_morgys_purchases ON morgys(total_purchases DESC);
CREATE INDEX IF NOT EXISTS idx_morgys_created ON morgys(created_at DESC);

-- Add constraints
ALTER TABLE morgys ADD CONSTRAINT IF NOT EXISTS check_category 
  CHECK (category IN ('business', 'social', 'research', 'technical', 'creative', 'custom'));

ALTER TABLE morgys ADD CONSTRAINT IF NOT EXISTS check_license_type 
  CHECK (license_type IN ('free', 'paid', 'subscription'));

ALTER TABLE morgys ADD CONSTRAINT IF NOT EXISTS check_price_range 
  CHECK (price >= 0 AND price <= 999.99);

ALTER TABLE morgys ADD CONSTRAINT IF NOT EXISTS check_rating_range 
  CHECK (rating >= 0 AND rating <= 5);

-- Refresh schema cache
NOTIFY pgrst, 'reload schema';

-- Verify the changes
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns
WHERE table_name = 'morgys'
ORDER BY ordinal_position;
