-- Migration: Add Creator Economy Tables
-- Source: morgus-creator-economy database
-- Date: December 27, 2025
-- Description: Adds API keys, marketplace listings, MCP exports, knowledge base, rate limits, and usage tracking

-- 1. API Keys Table
CREATE TABLE IF NOT EXISTS api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  key_prefix TEXT NOT NULL,
  key_hash TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  scopes JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  last_used_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Marketplace Listings Table (enhanced version of morgys for marketplace)
CREATE TABLE IF NOT EXISTS marketplace_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  morgy_id UUID NOT NULL REFERENCES morgys(id) ON DELETE CASCADE,
  creator_id UUID NOT NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'pending', 'approved', 'rejected', 'archived')),
  visibility TEXT DEFAULT 'private' CHECK (visibility IN ('private', 'public', 'unlisted')),
  pricing_model TEXT DEFAULT 'free' CHECK (pricing_model IN ('free', 'one_time', 'subscription', 'usage_based')),
  price NUMERIC(10,2) DEFAULT 0,
  views INTEGER DEFAULT 0,
  purchases INTEGER DEFAULT 0,
  rating NUMERIC(3,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(morgy_id)
);

-- 3. MCP Exports Table
CREATE TABLE IF NOT EXISTS mcp_exports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  morgy_id UUID NOT NULL REFERENCES morgys(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  share_id TEXT NOT NULL UNIQUE,
  share_url TEXT NOT NULL,
  include_knowledge BOOLEAN DEFAULT true,
  include_templates BOOLEAN DEFAULT true,
  downloads INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Morgy Knowledge Table
CREATE TABLE IF NOT EXISTS morgy_knowledge (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  morgy_id UUID NOT NULL REFERENCES morgys(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  source_type TEXT NOT NULL CHECK (source_type IN ('file', 'url', 'text', 'api')),
  source_url TEXT,
  metadata JSONB DEFAULT '{}',
  chunks INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Rate Limits Table
CREATE TABLE IF NOT EXISTS rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  endpoint TEXT NOT NULL,
  request_count INTEGER DEFAULT 0,
  window_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, endpoint, window_start)
);

-- 6. Usage Quotas Table
CREATE TABLE IF NOT EXISTS usage_quotas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  month TEXT NOT NULL, -- Format: YYYY-MM
  messages_used INTEGER DEFAULT 0,
  tokens_used BIGINT DEFAULT 0,
  tools_used JSONB DEFAULT '{}',
  cost_usd NUMERIC(10,4) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, month)
);

-- 7. User Usage Table
CREATE TABLE IF NOT EXISTS user_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  action_type TEXT NOT NULL,
  tokens_used INTEGER DEFAULT 0,
  cost_usd NUMERIC(10,4) DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_api_keys_user ON api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_hash ON api_keys(key_hash);
CREATE INDEX IF NOT EXISTS idx_api_keys_active ON api_keys(is_active) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_marketplace_listings_morgy ON marketplace_listings(morgy_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_listings_creator ON marketplace_listings(creator_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_listings_status ON marketplace_listings(status);
CREATE INDEX IF NOT EXISTS idx_marketplace_listings_visibility ON marketplace_listings(visibility);
CREATE INDEX IF NOT EXISTS idx_marketplace_listings_rating ON marketplace_listings(rating DESC);

CREATE INDEX IF NOT EXISTS idx_mcp_exports_morgy ON mcp_exports(morgy_id);
CREATE INDEX IF NOT EXISTS idx_mcp_exports_user ON mcp_exports(user_id);
CREATE INDEX IF NOT EXISTS idx_mcp_exports_share ON mcp_exports(share_id);

CREATE INDEX IF NOT EXISTS idx_morgy_knowledge_morgy ON morgy_knowledge(morgy_id);
CREATE INDEX IF NOT EXISTS idx_morgy_knowledge_type ON morgy_knowledge(source_type);

CREATE INDEX IF NOT EXISTS idx_rate_limits_user ON rate_limits(user_id);
CREATE INDEX IF NOT EXISTS idx_rate_limits_endpoint ON rate_limits(endpoint);
CREATE INDEX IF NOT EXISTS idx_rate_limits_window ON rate_limits(window_start);

CREATE INDEX IF NOT EXISTS idx_usage_quotas_user ON usage_quotas(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_quotas_month ON usage_quotas(month);

CREATE INDEX IF NOT EXISTS idx_user_usage_user ON user_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_user_usage_action ON user_usage(action_type);
CREATE INDEX IF NOT EXISTS idx_user_usage_created ON user_usage(created_at DESC);

-- Triggers for automatic updates
CREATE OR REPLACE FUNCTION update_marketplace_listing_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_marketplace_listings_updated_at
BEFORE UPDATE ON marketplace_listings
FOR EACH ROW
EXECUTE FUNCTION update_marketplace_listing_updated_at();

CREATE TRIGGER trigger_morgy_knowledge_updated_at
BEFORE UPDATE ON morgy_knowledge
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_usage_quotas_updated_at
BEFORE UPDATE ON usage_quotas
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

-- Comments for documentation
COMMENT ON TABLE api_keys IS 'Stores API keys for programmatic access to Morgus platform';
COMMENT ON TABLE marketplace_listings IS 'Enhanced marketplace listings with approval workflow and visibility controls';
COMMENT ON TABLE mcp_exports IS 'MCP (Model Context Protocol) exports for Claude Desktop integration';
COMMENT ON TABLE morgy_knowledge IS 'Knowledge base content for Morgys (files, URLs, text)';
COMMENT ON TABLE rate_limits IS 'Rate limiting tracking per user and endpoint';
COMMENT ON TABLE usage_quotas IS 'Monthly usage quotas and tracking per user';
COMMENT ON TABLE user_usage IS 'Detailed usage logs for billing and analytics';
