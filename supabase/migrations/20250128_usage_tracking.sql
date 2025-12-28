-- Usage Tracking & Quota Management System
-- Migration: 20250128_usage_tracking.sql
-- Note: Auth system and profiles table already exist, only adding usage tracking

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- User Usage Tracking (detailed log of all actions)
CREATE TABLE IF NOT EXISTS user_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL, -- 'message_sent', 'tool_used', 'morgy_created', etc.
  tokens_used INTEGER DEFAULT 0,
  cost_usd DECIMAL(10,6) DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Usage Quotas (monthly aggregated tracking)
CREATE TABLE IF NOT EXISTS usage_quotas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  month TEXT NOT NULL, -- Format: 'YYYY-MM'
  messages_used INTEGER DEFAULT 0,
  tokens_used BIGINT DEFAULT 0,
  cost_usd DECIMAL(10,4) DEFAULT 0,
  tools_used JSONB DEFAULT '{}', -- Track which tools were used
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, month)
);

-- API Keys Table (for programmatic access)
CREATE TABLE IF NOT EXISTS api_keys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  key_hash TEXT UNIQUE NOT NULL,
  key_prefix TEXT NOT NULL, -- First 8 chars for display (e.g., "morg_abc")
  name TEXT,
  last_used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  scopes JSONB DEFAULT '["read", "write"]', -- Permissions
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Rate Limit Tracking (prevent abuse)
CREATE TABLE IF NOT EXISTS rate_limits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL, -- '/api/chat', '/api/tools', etc.
  window_start TIMESTAMPTZ NOT NULL,
  request_count INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, endpoint, window_start)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_usage_user_id ON user_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_user_usage_created_at ON user_usage(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_usage_action_type ON user_usage(action_type);
CREATE INDEX IF NOT EXISTS idx_usage_quotas_user_month ON usage_quotas(user_id, month);
CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_key_hash ON api_keys(key_hash);
CREATE INDEX IF NOT EXISTS idx_api_keys_active ON api_keys(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_rate_limits_user_endpoint ON rate_limits(user_id, endpoint, window_start);

-- Row Level Security (RLS) Policies

-- Enable RLS
ALTER TABLE user_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_quotas ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;

-- User Usage Policies
CREATE POLICY "Users can view own usage"
  ON user_usage FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service can insert usage"
  ON user_usage FOR INSERT
  WITH CHECK (true); -- Service role can insert

-- Usage Quotas Policies
CREATE POLICY "Users can view own quotas"
  ON usage_quotas FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service can manage quotas"
  ON usage_quotas FOR ALL
  USING (true); -- Service role can manage

-- API Keys Policies
CREATE POLICY "Users can view own API keys"
  ON api_keys FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own API keys"
  ON api_keys FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own API keys"
  ON api_keys FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own API keys"
  ON api_keys FOR DELETE
  USING (auth.uid() = user_id);

-- Rate Limits Policies
CREATE POLICY "Service can manage rate limits"
  ON rate_limits FOR ALL
  USING (true); -- Service role only

-- Functions

-- Function to get user's current usage and limits
CREATE OR REPLACE FUNCTION get_user_current_usage(p_user_id UUID)
RETURNS TABLE (
  messages_used INTEGER,
  tokens_used BIGINT,
  cost_usd DECIMAL,
  tier TEXT,
  limit_messages INTEGER,
  limit_tokens BIGINT,
  percentage_used DECIMAL
) AS $$
DECLARE
  current_month TEXT := TO_CHAR(NOW(), 'YYYY-MM');
  user_tier TEXT;
  tier_msg_limit INTEGER;
  tier_token_limit BIGINT;
  msgs_used INTEGER;
  toks_used BIGINT;
BEGIN
  -- Get user tier from profiles table
  SELECT subscription_tier INTO user_tier
  FROM profiles
  WHERE id = p_user_id;
  
  -- Set tier limits
  CASE user_tier
    WHEN 'free' THEN
      tier_msg_limit := 100;
      tier_token_limit := 100000;
    WHEN 'pro' THEN
      tier_msg_limit := 1000;
      tier_token_limit := 1000000;
    WHEN 'business' THEN
      tier_msg_limit := 10000;
      tier_token_limit := 10000000;
    WHEN 'enterprise' THEN
      tier_msg_limit := 999999;
      tier_token_limit := 999999999;
    ELSE
      tier_msg_limit := 100;
      tier_token_limit := 100000;
  END CASE;
  
  -- Get current usage
  SELECT 
    COALESCE(uq.messages_used, 0),
    COALESCE(uq.tokens_used, 0)
  INTO msgs_used, toks_used
  FROM usage_quotas uq
  WHERE uq.user_id = p_user_id AND uq.month = current_month;
  
  -- Return results
  RETURN QUERY
  SELECT 
    COALESCE(msgs_used, 0)::INTEGER,
    COALESCE(toks_used, 0)::BIGINT,
    COALESCE((SELECT cost_usd FROM usage_quotas WHERE user_id = p_user_id AND month = current_month), 0)::DECIMAL,
    COALESCE(user_tier, 'free')::TEXT,
    tier_msg_limit,
    tier_token_limit,
    CASE 
      WHEN tier_msg_limit > 0 THEN (COALESCE(msgs_used, 0)::DECIMAL / tier_msg_limit * 100)
      ELSE 0
    END::DECIMAL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to track usage
CREATE OR REPLACE FUNCTION track_user_usage(
  p_user_id UUID,
  p_action_type TEXT,
  p_tokens INTEGER DEFAULT 0,
  p_cost DECIMAL DEFAULT 0,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS VOID AS $$
DECLARE
  current_month TEXT := TO_CHAR(NOW(), 'YYYY-MM');
  tool_name TEXT;
BEGIN
  -- Insert usage record
  INSERT INTO user_usage (user_id, action_type, tokens_used, cost_usd, metadata)
  VALUES (p_user_id, p_action_type, p_tokens, p_cost, p_metadata);
  
  -- Extract tool name if it's a tool_used action
  IF p_action_type = 'tool_used' AND p_metadata ? 'tool_name' THEN
    tool_name := p_metadata->>'tool_name';
  END IF;
  
  -- Update quota
  INSERT INTO usage_quotas (user_id, month, messages_used, tokens_used, cost_usd, tools_used)
  VALUES (
    p_user_id, 
    current_month, 
    CASE WHEN p_action_type = 'message_sent' THEN 1 ELSE 0 END,
    p_tokens, 
    p_cost,
    CASE WHEN tool_name IS NOT NULL THEN jsonb_build_object(tool_name, 1) ELSE '{}'::jsonb END
  )
  ON CONFLICT (user_id, month) 
  DO UPDATE SET
    messages_used = usage_quotas.messages_used + CASE WHEN p_action_type = 'message_sent' THEN 1 ELSE 0 END,
    tokens_used = usage_quotas.tokens_used + p_tokens,
    cost_usd = usage_quotas.cost_usd + p_cost,
    tools_used = CASE 
      WHEN tool_name IS NOT NULL THEN
        jsonb_set(
          usage_quotas.tools_used,
          ARRAY[tool_name],
          to_jsonb(COALESCE((usage_quotas.tools_used->>tool_name)::int, 0) + 1)
        )
      ELSE usage_quotas.tools_used
    END,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user can perform action
CREATE OR REPLACE FUNCTION can_user_perform_action(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  usage_info RECORD;
BEGIN
  SELECT * INTO usage_info FROM get_user_current_usage(p_user_id);
  
  -- Check if under limit
  RETURN usage_info.messages_used < usage_info.limit_messages;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check rate limit
CREATE OR REPLACE FUNCTION check_rate_limit(
  p_user_id UUID,
  p_endpoint TEXT,
  p_window_minutes INTEGER DEFAULT 1,
  p_max_requests INTEGER DEFAULT 60
)
RETURNS BOOLEAN AS $$
DECLARE
  window_start TIMESTAMPTZ := date_trunc('minute', NOW()) - (p_window_minutes || ' minutes')::INTERVAL;
  request_count INTEGER;
BEGIN
  -- Get current request count in window
  SELECT COALESCE(SUM(request_count), 0) INTO request_count
  FROM rate_limits
  WHERE user_id = p_user_id
    AND endpoint = p_endpoint
    AND window_start >= window_start;
  
  -- Check if under limit
  IF request_count >= p_max_requests THEN
    RETURN FALSE;
  END IF;
  
  -- Increment counter
  INSERT INTO rate_limits (user_id, endpoint, window_start, request_count)
  VALUES (p_user_id, p_endpoint, date_trunc('minute', NOW()), 1)
  ON CONFLICT (user_id, endpoint, window_start)
  DO UPDATE SET request_count = rate_limits.request_count + 1;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_usage_quotas_updated_at
  BEFORE UPDATE ON usage_quotas
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Cleanup old rate limit records (run daily via cron)
CREATE OR REPLACE FUNCTION cleanup_old_rate_limits()
RETURNS VOID AS $$
BEGIN
  DELETE FROM rate_limits
  WHERE window_start < NOW() - INTERVAL '1 hour';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Comments
COMMENT ON TABLE user_usage IS 'Detailed usage tracking for billing and analytics';
COMMENT ON TABLE usage_quotas IS 'Monthly usage quotas and limits per user';
COMMENT ON TABLE api_keys IS 'API keys for programmatic access';
COMMENT ON TABLE rate_limits IS 'Rate limiting to prevent abuse';
COMMENT ON FUNCTION get_user_current_usage IS 'Get user current month usage and limits';
COMMENT ON FUNCTION track_user_usage IS 'Track user action and update quotas';
COMMENT ON FUNCTION can_user_perform_action IS 'Check if user is within quota limits';
COMMENT ON FUNCTION check_rate_limit IS 'Check and enforce rate limits';
