-- ============================================
-- MORGY SYSTEM - COMPLETE DATABASE MIGRATION
-- ============================================
-- This migration creates all tables for the Agentic Morgy system
-- including Morgys, knowledge bases, social media, marketplace, and MCP

-- ============================================
-- CORE MORGY TABLES
-- ============================================

-- Main Morgy table
CREATE TABLE IF NOT EXISTS morgys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  
  -- Personality configuration
  personality JSONB NOT NULL DEFAULT '{
    "traits": ["helpful", "friendly"],
    "communication_style": "casual",
    "expertise_areas": [],
    "tone": "professional"
  }'::jsonb,
  
  -- Avatar configuration
  avatar_config JSONB NOT NULL DEFAULT '{
    "body_shape": "chubby",
    "color": "pink",
    "pattern": "solid",
    "ears": "floppy",
    "snout": "button",
    "eyes": "round",
    "clothes": "casual",
    "accessories": []
  }'::jsonb,
  
  -- Skills and capabilities
  skills JSONB NOT NULL DEFAULT '{
    "social_media": false,
    "research": false,
    "writing": false,
    "data_analysis": false,
    "customer_support": false
  }'::jsonb,
  
  -- Knowledge base reference
  knowledge_base_id UUID,
  
  -- System prompt (generated from personality + skills)
  system_prompt TEXT,
  
  -- Category
  category TEXT,
  
  -- Marketplace settings
  is_public BOOLEAN DEFAULT false,
  is_starter BOOLEAN DEFAULT false,
  price_cents INTEGER,
  license_type TEXT CHECK (license_type IN ('free', 'one-time', 'subscription', 'trial')),
  
  -- Stats
  total_conversations INTEGER DEFAULT 0,
  total_messages INTEGER DEFAULT 0,
  total_sales INTEGER DEFAULT 0,
  average_rating DECIMAL(3,2),
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_morgys_public ON morgys(is_public, created_at) WHERE deleted_at IS NULL;
CREATE INDEX idx_morgys_creator ON morgys(creator_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_morgys_slug ON morgys(slug);
CREATE INDEX idx_morgys_category ON morgys(category) WHERE is_public = true;

-- ============================================
-- MORGY AVATARS
-- ============================================

CREATE TABLE IF NOT EXISTS morgy_avatars (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  morgy_id UUID NOT NULL REFERENCES morgys(id) ON DELETE CASCADE,
  config JSONB NOT NULL,
  image_url TEXT NOT NULL,
  thumbnail_url TEXT,
  
  -- Animation frames
  idle_animation JSONB,
  thinking_animation JSONB,
  excited_animation JSONB,
  working_animation JSONB,
  speaking_animation JSONB,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_morgy_avatars_morgy ON morgy_avatars(morgy_id);

-- ============================================
-- CONVERSATIONS & MESSAGES
-- ============================================

CREATE TABLE IF NOT EXISTS morgy_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  morgy_id UUID NOT NULL REFERENCES morgys(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT,
  last_message_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_morgy_conversations_user ON morgy_conversations(user_id, last_message_at DESC);
CREATE INDEX idx_morgy_conversations_morgy ON morgy_conversations(morgy_id);

CREATE TABLE IF NOT EXISTS morgy_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES morgy_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_morgy_messages_conversation ON morgy_messages(conversation_id, created_at);

-- ============================================
-- MEMORY SYSTEM
-- ============================================

CREATE TABLE IF NOT EXISTS morgy_memory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  morgy_id UUID NOT NULL REFERENCES morgys(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  memory_type TEXT NOT NULL CHECK (memory_type IN ('fact', 'preference', 'context', 'task')),
  content TEXT NOT NULL,
  importance INTEGER DEFAULT 5 CHECK (importance >= 1 AND importance <= 10),
  embedding VECTOR(1536),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  accessed_at TIMESTAMPTZ DEFAULT NOW(),
  access_count INTEGER DEFAULT 0
);

CREATE INDEX idx_morgy_memory_user ON morgy_memory(morgy_id, user_id);
CREATE INDEX idx_morgy_memory_embedding ON morgy_memory USING ivfflat (embedding vector_cosine_ops);

-- ============================================
-- KNOWLEDGE BASE
-- ============================================

CREATE TABLE IF NOT EXISTS knowledge_bases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  morgy_id UUID REFERENCES morgys(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  total_chunks INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_knowledge_bases_user ON knowledge_bases(user_id);
CREATE INDEX idx_knowledge_bases_morgy ON knowledge_bases(morgy_id);

CREATE TABLE IF NOT EXISTS knowledge_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  knowledge_base_id UUID NOT NULL REFERENCES knowledge_bases(id) ON DELETE CASCADE,
  source_type TEXT NOT NULL CHECK (source_type IN ('document', 'website', 'code', 'text', 'media')),
  source_name TEXT NOT NULL,
  source_url TEXT,
  file_path TEXT,
  file_size_bytes INTEGER,
  processing_status TEXT DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed')),
  error_message TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_knowledge_sources_kb ON knowledge_sources(knowledge_base_id);

CREATE TABLE IF NOT EXISTS knowledge_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id UUID NOT NULL REFERENCES knowledge_sources(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  embedding VECTOR(1536),
  chunk_index INTEGER,
  token_count INTEGER,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_knowledge_chunks_source ON knowledge_chunks(source_id);
CREATE INDEX idx_knowledge_chunks_embedding ON knowledge_chunks USING ivfflat (embedding vector_cosine_ops);

-- Semantic search function
CREATE OR REPLACE FUNCTION search_knowledge(
  query_embedding VECTOR(1536),
  kb_id UUID,
  match_threshold FLOAT DEFAULT 0.7,
  match_count INT DEFAULT 10
)
RETURNS TABLE (
  chunk_id UUID,
  content TEXT,
  similarity FLOAT,
  source_name TEXT,
  metadata JSONB
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    kc.id,
    kc.content,
    1 - (kc.embedding <=> query_embedding) AS similarity,
    ks.source_name,
    kc.metadata
  FROM knowledge_chunks kc
  JOIN knowledge_sources ks ON kc.source_id = ks.id
  WHERE ks.knowledge_base_id = kb_id
    AND 1 - (kc.embedding <=> query_embedding) > match_threshold
  ORDER BY kc.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- ============================================
-- SOCIAL MEDIA AUTOMATION
-- ============================================

CREATE TABLE IF NOT EXISTS social_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  morgy_id UUID REFERENCES morgys(id) ON DELETE SET NULL,
  platform TEXT NOT NULL CHECK (platform IN ('twitter', 'facebook', 'reddit', 'tiktok', 'instagram', 'linkedin')),
  account_name TEXT NOT NULL,
  account_id TEXT NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_social_accounts_user ON social_accounts(user_id);
CREATE INDEX idx_social_accounts_morgy ON social_accounts(morgy_id);

CREATE TABLE IF NOT EXISTS social_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  morgy_id UUID NOT NULL REFERENCES morgys(id) ON DELETE CASCADE,
  social_account_id UUID NOT NULL REFERENCES social_accounts(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  media_urls TEXT[],
  scheduled_for TIMESTAMPTZ,
  posted_at TIMESTAMPTZ,
  platform_post_id TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'posted', 'failed')),
  error_message TEXT,
  
  -- Analytics
  likes INTEGER DEFAULT 0,
  shares INTEGER DEFAULT 0,
  comments INTEGER DEFAULT 0,
  views INTEGER DEFAULT 0,
  
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_social_posts_morgy ON social_posts(morgy_id, created_at DESC);
CREATE INDEX idx_social_posts_scheduled ON social_posts(scheduled_for) WHERE status = 'scheduled';

CREATE TABLE IF NOT EXISTS social_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  morgy_id UUID NOT NULL REFERENCES morgys(id) ON DELETE CASCADE,
  social_account_id UUID NOT NULL REFERENCES social_accounts(id) ON DELETE CASCADE,
  interaction_type TEXT NOT NULL CHECK (interaction_type IN ('reply', 'like', 'follow', 'dm')),
  target_user TEXT NOT NULL,
  target_post_id TEXT,
  content TEXT,
  performed_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  error_message TEXT
);

CREATE INDEX idx_social_interactions_morgy ON social_interactions(morgy_id, performed_at DESC);

-- ============================================
-- MARKETPLACE
-- ============================================

CREATE TABLE IF NOT EXISTS morgy_licenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  morgy_id UUID NOT NULL REFERENCES morgys(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  license_type TEXT NOT NULL CHECK (license_type IN ('free', 'trial', 'monthly', 'annual', 'lifetime')),
  price_paid_cents INTEGER,
  starts_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  stripe_subscription_id TEXT,
  stripe_payment_intent_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_morgy_licenses_user ON morgy_licenses(user_id);
CREATE INDEX idx_morgy_licenses_morgy ON morgy_licenses(morgy_id);
CREATE INDEX idx_morgy_licenses_active ON morgy_licenses(morgy_id, user_id) WHERE is_active = true;

CREATE TABLE IF NOT EXISTS morgy_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  morgy_id UUID NOT NULL REFERENCES morgys(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  is_verified_purchase BOOLEAN DEFAULT false,
  helpful_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(morgy_id, user_id)
);

CREATE INDEX idx_morgy_reviews_morgy ON morgy_reviews(morgy_id, created_at DESC);

CREATE TABLE IF NOT EXISTS morgy_sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  morgy_id UUID NOT NULL REFERENCES morgys(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  buyer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  price_cents INTEGER NOT NULL,
  platform_fee_cents INTEGER NOT NULL,
  seller_earnings_cents INTEGER NOT NULL,
  stripe_payment_intent_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_morgy_sales_seller ON morgy_sales(seller_id, created_at DESC);
CREATE INDEX idx_morgy_sales_morgy ON morgy_sales(morgy_id);

-- Creator balances
CREATE TABLE IF NOT EXISTS creator_balances (
  creator_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  balance_cents INTEGER DEFAULT 0,
  total_earned_cents INTEGER DEFAULT 0,
  total_withdrawn_cents INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS creator_payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount_cents INTEGER NOT NULL,
  stripe_payout_id TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_creator_payouts_creator ON creator_payouts(creator_id, created_at DESC);

-- ============================================
-- MCP INTEGRATION
-- ============================================

CREATE TABLE IF NOT EXISTS morgy_api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  morgy_id UUID NOT NULL REFERENCES morgys(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  key_hash TEXT NOT NULL UNIQUE,
  key_prefix TEXT NOT NULL,
  name TEXT,
  last_used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_morgy_api_keys_user ON morgy_api_keys(user_id);
CREATE INDEX idx_morgy_api_keys_morgy ON morgy_api_keys(morgy_id);

CREATE TABLE IF NOT EXISTS morgy_mcp_exports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  morgy_id UUID NOT NULL REFERENCES morgys(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  export_config JSONB NOT NULL,
  download_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_morgy_mcp_exports_user ON morgy_mcp_exports(user_id);

-- ============================================
-- ANALYTICS
-- ============================================

CREATE TABLE IF NOT EXISTS morgy_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  morgy_id UUID NOT NULL REFERENCES morgys(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  
  -- Usage metrics
  total_messages INTEGER DEFAULT 0,
  total_conversations INTEGER DEFAULT 0,
  unique_users INTEGER DEFAULT 0,
  
  -- Social media metrics
  posts_created INTEGER DEFAULT 0,
  posts_published INTEGER DEFAULT 0,
  total_engagement INTEGER DEFAULT 0,
  
  -- Knowledge base metrics
  knowledge_queries INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(morgy_id, date)
);

CREATE INDEX idx_morgy_analytics_morgy_date ON morgy_analytics(morgy_id, date DESC);

-- ============================================
-- TRIGGERS & FUNCTIONS
-- ============================================

-- Update Morgy average rating
CREATE OR REPLACE FUNCTION update_morgy_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE morgys
  SET average_rating = (
    SELECT AVG(rating)::DECIMAL(3,2)
    FROM morgy_reviews
    WHERE morgy_id = NEW.morgy_id
  )
  WHERE id = NEW.morgy_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_morgy_rating
AFTER INSERT OR UPDATE ON morgy_reviews
FOR EACH ROW
EXECUTE FUNCTION update_morgy_rating();

-- Update creator balance
CREATE OR REPLACE FUNCTION add_creator_earnings(
  creator_id UUID,
  amount_cents INTEGER
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO creator_balances (creator_id, balance_cents, total_earned_cents)
  VALUES (creator_id, amount_cents, amount_cents)
  ON CONFLICT (creator_id)
  DO UPDATE SET
    balance_cents = creator_balances.balance_cents + amount_cents,
    total_earned_cents = creator_balances.total_earned_cents + amount_cents,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Increment review helpful count
CREATE OR REPLACE FUNCTION increment_review_helpful_count(
  review_id UUID
)
RETURNS VOID AS $$
BEGIN
  UPDATE morgy_reviews
  SET helpful_count = helpful_count + 1
  WHERE id = review_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

-- Enable RLS on all tables
ALTER TABLE morgys ENABLE ROW LEVEL SECURITY;
ALTER TABLE morgy_avatars ENABLE ROW LEVEL SECURITY;
ALTER TABLE morgy_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE morgy_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE morgy_memory ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_bases ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE morgy_licenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE morgy_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE morgy_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE creator_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE creator_payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE morgy_api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE morgy_mcp_exports ENABLE ROW LEVEL SECURITY;
ALTER TABLE morgy_analytics ENABLE ROW LEVEL SECURITY;

-- Morgys policies
CREATE POLICY "Users can view public Morgys"
  ON morgys FOR SELECT
  USING (is_public = true OR creator_id = auth.uid());

CREATE POLICY "Users can create their own Morgys"
  ON morgys FOR INSERT
  WITH CHECK (creator_id = auth.uid());

CREATE POLICY "Users can update their own Morgys"
  ON morgys FOR UPDATE
  USING (creator_id = auth.uid());

CREATE POLICY "Users can delete their own Morgys"
  ON morgys FOR DELETE
  USING (creator_id = auth.uid());

-- Conversations policies
CREATE POLICY "Users can view their own conversations"
  ON morgy_conversations FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can create their own conversations"
  ON morgy_conversations FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Messages policies
CREATE POLICY "Users can view messages in their conversations"
  ON morgy_messages FOR SELECT
  USING (
    conversation_id IN (
      SELECT id FROM morgy_conversations WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create messages in their conversations"
  ON morgy_messages FOR INSERT
  WITH CHECK (
    conversation_id IN (
      SELECT id FROM morgy_conversations WHERE user_id = auth.uid()
    )
  );

-- Knowledge base policies
CREATE POLICY "Users can view their own knowledge bases"
  ON knowledge_bases FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can create their own knowledge bases"
  ON knowledge_bases FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own knowledge bases"
  ON knowledge_bases FOR UPDATE
  USING (user_id = auth.uid());

-- Social accounts policies
CREATE POLICY "Users can view their own social accounts"
  ON social_accounts FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can create their own social accounts"
  ON social_accounts FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Licenses policies
CREATE POLICY "Users can view their own licenses"
  ON morgy_licenses FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can view licenses for their Morgys"
  ON morgy_licenses FOR SELECT
  USING (
    morgy_id IN (
      SELECT id FROM morgys WHERE creator_id = auth.uid()
    )
  );

-- Reviews policies
CREATE POLICY "Anyone can view reviews for public Morgys"
  ON morgy_reviews FOR SELECT
  USING (
    morgy_id IN (
      SELECT id FROM morgys WHERE is_public = true
    )
  );

CREATE POLICY "Users can create reviews"
  ON morgy_reviews FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Creator balances policies
CREATE POLICY "Users can view their own balance"
  ON creator_balances FOR SELECT
  USING (creator_id = auth.uid());

-- ============================================
-- SEED DATA - STARTER MORGYS
-- ============================================

-- Insert starter Morgys
INSERT INTO morgys (
  creator_id,
  name,
  slug,
  description,
  personality,
  avatar_config,
  skills,
  system_prompt,
  category,
  is_public,
  is_starter,
  price_cents,
  license_type
) VALUES
(
  (SELECT id FROM auth.users LIMIT 1), -- System user
  'Bill',
  'bill-business-strategist',
  'A seasoned business strategist with 15+ years of experience helping companies grow from startup to scale.',
  '{
    "traits": ["analytical", "strategic", "professional", "data-driven"],
    "communication_style": "professional",
    "expertise_areas": ["business strategy", "market analysis", "financial planning"],
    "tone": "authoritative yet approachable"
  }'::jsonb,
  '{
    "body_shape": "athletic",
    "color": "navy blue",
    "pattern": "solid",
    "ears": "upright",
    "snout": "medium",
    "eyes": "sharp",
    "clothes": "business suit",
    "accessories": ["glasses", "briefcase"]
  }'::jsonb,
  '{
    "research": true,
    "writing": true,
    "data_analysis": true,
    "social_media": false,
    "customer_support": false
  }'::jsonb,
  'You are Bill, a seasoned business strategist...',
  'Business & Productivity',
  true,
  true,
  500, -- $5/month
  'subscription'
),
(
  (SELECT id FROM auth.users LIMIT 1),
  'Sally',
  'sally-social-media-manager',
  'A creative and energetic social media manager who lives and breathes digital culture.',
  '{
    "traits": ["creative", "enthusiastic", "trendy", "empathetic"],
    "communication_style": "casual",
    "expertise_areas": ["social media", "content creation", "community management"],
    "tone": "upbeat and encouraging"
  }'::jsonb,
  '{
    "body_shape": "curvy",
    "color": "bright pink",
    "pattern": "sparkle",
    "ears": "decorated",
    "snout": "small",
    "eyes": "large",
    "clothes": "trendy outfit",
    "accessories": ["sunglasses", "smartphone"]
  }'::jsonb,
  '{
    "research": true,
    "writing": true,
    "data_analysis": true,
    "social_media": true,
    "customer_support": true
  }'::jsonb,
  'You are Sally, a creative social media manager...',
  'Creative & Marketing',
  true,
  true,
  500,
  'subscription'
),
(
  (SELECT id FROM auth.users LIMIT 1),
  'Professor Hogsworth',
  'professor-hogsworth-research-scholar',
  'A distinguished scholar and researcher with expertise spanning multiple disciplines.',
  '{
    "traits": ["scholarly", "thorough", "patient", "curious"],
    "communication_style": "formal",
    "expertise_areas": ["research", "technical writing", "data analysis"],
    "tone": "educational and patient"
  }'::jsonb,
  '{
    "body_shape": "rotund",
    "color": "tweed brown",
    "pattern": "solid",
    "ears": "large",
    "snout": "long",
    "eyes": "intelligent",
    "clothes": "tweed jacket",
    "accessories": ["glasses", "pipe", "books"]
  }'::jsonb,
  '{
    "research": true,
    "writing": true,
    "data_analysis": true,
    "social_media": false,
    "customer_support": false
  }'::jsonb,
  'You are Professor Hogsworth, a distinguished scholar...',
  'Education & Research',
  true,
  true,
  500,
  'subscription'
);

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE morgys IS 'Main table for Morgy AI assistants';
COMMENT ON TABLE knowledge_bases IS 'Knowledge bases for training Morgys';
COMMENT ON TABLE social_accounts IS 'Connected social media accounts';
COMMENT ON TABLE morgy_licenses IS 'Licenses for using Morgys';
COMMENT ON TABLE morgy_reviews IS 'User reviews and ratings for Morgys';
COMMENT ON TABLE morgy_sales IS 'Sales transactions for Morgys';
