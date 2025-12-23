-- Morgus Billing Enforcement Database Schema
-- Created: December 21, 2025
-- Purpose: Complete subscription, usage tracking, and payment history tables

-- ============================================================================
-- 1. SUBSCRIPTIONS TABLE
-- ============================================================================
-- Tracks subscription history and current status for each user
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Subscription details
  plan_id TEXT NOT NULL CHECK (plan_id IN ('free', 'daily', 'weekly', 'monthly')),
  status TEXT NOT NULL CHECK (status IN ('active', 'cancelled', 'expired', 'past_due')),
  
  -- Stripe integration
  stripe_subscription_id TEXT UNIQUE,
  stripe_customer_id TEXT,
  stripe_price_id TEXT,
  
  -- Dates
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Indexes for fast lookups
  CONSTRAINT unique_active_subscription UNIQUE (user_id, status) WHERE status = 'active'
);

CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_stripe_subscription_id ON subscriptions(stripe_subscription_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_expires_at ON subscriptions(expires_at) WHERE expires_at IS NOT NULL;

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_subscriptions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_subscriptions_updated_at();

-- ============================================================================
-- 2. USAGE TRACKING TABLE
-- ============================================================================
-- Tracks daily usage for each user across all features
CREATE TABLE IF NOT EXISTS usage_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  
  -- Feature usage counters
  messages_count INTEGER NOT NULL DEFAULT 0,
  builds_count INTEGER NOT NULL DEFAULT 0,
  deployments_count INTEGER NOT NULL DEFAULT 0,
  images_count INTEGER NOT NULL DEFAULT 0,
  searches_count INTEGER NOT NULL DEFAULT 0,
  videos_count INTEGER NOT NULL DEFAULT 0,
  browser_sessions_count INTEGER NOT NULL DEFAULT 0,
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- One record per user per day
  CONSTRAINT unique_user_date UNIQUE (user_id, date)
);

CREATE INDEX idx_usage_tracking_user_id ON usage_tracking(user_id);
CREATE INDEX idx_usage_tracking_date ON usage_tracking(date);
CREATE INDEX idx_usage_tracking_user_date ON usage_tracking(user_id, date);

-- Trigger to update updated_at timestamp
CREATE TRIGGER usage_tracking_updated_at
  BEFORE UPDATE ON usage_tracking
  FOR EACH ROW
  EXECUTE FUNCTION update_subscriptions_updated_at();

-- ============================================================================
-- 3. PAYMENT HISTORY TABLE
-- ============================================================================
-- Records all payment transactions for audit and analytics
CREATE TABLE IF NOT EXISTS payment_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Payment details
  amount_cents INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'usd',
  status TEXT NOT NULL CHECK (status IN ('succeeded', 'failed', 'pending', 'refunded')),
  purchase_type TEXT NOT NULL CHECK (purchase_type IN ('subscription', 'day_pass', 'morgy', 'addon')),
  
  -- Stripe integration
  stripe_payment_intent_id TEXT,
  stripe_invoice_id TEXT,
  stripe_charge_id TEXT,
  
  -- Metadata
  description TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_payment_history_user_id ON payment_history(user_id);
CREATE INDEX idx_payment_history_status ON payment_history(status);
CREATE INDEX idx_payment_history_created_at ON payment_history(created_at DESC);
CREATE INDEX idx_payment_history_stripe_payment_intent_id ON payment_history(stripe_payment_intent_id);

-- Trigger to update updated_at timestamp
CREATE TRIGGER payment_history_updated_at
  BEFORE UPDATE ON payment_history
  FOR EACH ROW
  EXECUTE FUNCTION update_subscriptions_updated_at();

-- ============================================================================
-- 4. PROMO CODES TABLE
-- ============================================================================
-- Manages promotional codes for discounts and free access
CREATE TABLE IF NOT EXISTS promo_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  
  -- Promo details
  type TEXT NOT NULL CHECK (type IN ('day_pass', 'discount', 'trial')),
  value INTEGER NOT NULL, -- Cents for discount, days for trial/day_pass
  
  -- Usage limits
  max_uses INTEGER NOT NULL DEFAULT 1,
  uses_count INTEGER NOT NULL DEFAULT 0,
  
  -- Validity period
  valid_from TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  valid_until TIMESTAMPTZ,
  
  -- Status
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  
  -- Metadata
  description TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_promo_codes_code ON promo_codes(code);
CREATE INDEX idx_promo_codes_is_active ON promo_codes(is_active);
CREATE INDEX idx_promo_codes_valid_until ON promo_codes(valid_until) WHERE valid_until IS NOT NULL;

-- Trigger to update updated_at timestamp
CREATE TRIGGER promo_codes_updated_at
  BEFORE UPDATE ON promo_codes
  FOR EACH ROW
  EXECUTE FUNCTION update_subscriptions_updated_at();

-- ============================================================================
-- 5. PROMO CODE REDEMPTIONS TABLE
-- ============================================================================
-- Tracks which users have redeemed which promo codes
CREATE TABLE IF NOT EXISTS promo_code_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  promo_code_id UUID NOT NULL REFERENCES promo_codes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Redemption details
  redeemed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  
  -- Metadata
  ip_address TEXT,
  user_agent TEXT,
  
  -- One redemption per user per promo code
  CONSTRAINT unique_user_promo UNIQUE (user_id, promo_code_id)
);

CREATE INDEX idx_promo_redemptions_user_id ON promo_code_redemptions(user_id);
CREATE INDEX idx_promo_redemptions_promo_code_id ON promo_code_redemptions(promo_code_id);
CREATE INDEX idx_promo_redemptions_expires_at ON promo_code_redemptions(expires_at) WHERE expires_at IS NOT NULL;

-- ============================================================================
-- 6. UPDATE PROFILES TABLE
-- ============================================================================
-- Add billing-related columns to existing profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT UNIQUE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'free';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS subscription_tier TEXT DEFAULT 'free';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS subscription_started_at TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS subscription_ends_at TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS day_pass_balance INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS day_pass_expires_at TIMESTAMPTZ;

-- Add indexes for billing queries
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_customer_id ON profiles(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_profiles_subscription_status ON profiles(subscription_status);
CREATE INDEX IF NOT EXISTS idx_profiles_subscription_ends_at ON profiles(subscription_ends_at) WHERE subscription_ends_at IS NOT NULL;

-- ============================================================================
-- 7. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE promo_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE promo_code_redemptions ENABLE ROW LEVEL SECURITY;

-- Subscriptions: Users can view their own subscriptions
CREATE POLICY "Users can view own subscriptions"
  ON subscriptions FOR SELECT
  USING (auth.uid() = user_id);

-- Usage Tracking: Users can view their own usage
CREATE POLICY "Users can view own usage"
  ON usage_tracking FOR SELECT
  USING (auth.uid() = user_id);

-- Payment History: Users can view their own payment history
CREATE POLICY "Users can view own payment history"
  ON payment_history FOR SELECT
  USING (auth.uid() = user_id);

-- Promo Codes: Everyone can view active promo codes
CREATE POLICY "Anyone can view active promo codes"
  ON promo_codes FOR SELECT
  USING (is_active = TRUE);

-- Promo Code Redemptions: Users can view their own redemptions
CREATE POLICY "Users can view own redemptions"
  ON promo_code_redemptions FOR SELECT
  USING (auth.uid() = user_id);

-- Service role can do everything (for backend operations)
CREATE POLICY "Service role has full access to subscriptions"
  ON subscriptions FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role has full access to usage_tracking"
  ON usage_tracking FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role has full access to payment_history"
  ON payment_history FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role has full access to promo_codes"
  ON promo_codes FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role has full access to promo_code_redemptions"
  ON promo_code_redemptions FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- ============================================================================
-- 8. HELPER FUNCTIONS
-- ============================================================================

-- Function to get user's current plan
CREATE OR REPLACE FUNCTION get_user_plan(p_user_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_plan TEXT;
  v_expires_at TIMESTAMPTZ;
  v_day_pass_expires_at TIMESTAMPTZ;
BEGIN
  SELECT 
    subscription_tier,
    subscription_ends_at,
    day_pass_expires_at
  INTO v_plan, v_expires_at, v_day_pass_expires_at
  FROM profiles
  WHERE id = p_user_id;
  
  -- Check day pass first (highest priority)
  IF v_day_pass_expires_at IS NOT NULL AND v_day_pass_expires_at > NOW() THEN
    RETURN 'daily';
  END IF;
  
  -- Check subscription
  IF v_expires_at IS NOT NULL AND v_expires_at > NOW() THEN
    RETURN COALESCE(v_plan, 'free');
  END IF;
  
  -- Default to free
  RETURN 'free';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user can use a feature
CREATE OR REPLACE FUNCTION can_use_feature(
  p_user_id UUID,
  p_feature TEXT,
  p_limit INTEGER
)
RETURNS BOOLEAN AS $$
DECLARE
  v_current_usage INTEGER;
  v_today DATE := CURRENT_DATE;
BEGIN
  -- Get current usage for today
  SELECT 
    CASE p_feature
      WHEN 'messages' THEN messages_count
      WHEN 'builds' THEN builds_count
      WHEN 'deployments' THEN deployments_count
      WHEN 'images' THEN images_count
      WHEN 'searches' THEN searches_count
      WHEN 'videos' THEN videos_count
      WHEN 'browser_sessions' THEN browser_sessions_count
      ELSE 0
    END
  INTO v_current_usage
  FROM usage_tracking
  WHERE user_id = p_user_id AND date = v_today;
  
  -- If no usage record, user hasn't used the feature today
  IF v_current_usage IS NULL THEN
    RETURN TRUE;
  END IF;
  
  -- Check if unlimited (-1) or within limit
  RETURN p_limit = -1 OR v_current_usage < p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 9. SEED DATA (OPTIONAL - FOR TESTING)
-- ============================================================================

-- Insert some test promo codes
INSERT INTO promo_codes (code, type, value, max_uses, description, is_active)
VALUES 
  ('PIGLET', 'day_pass', 1, 1000, 'Free 1-day pass for new users', TRUE),
  ('HOGWILD21', 'discount', 21, 500, '21% off weekly subscription', TRUE),
  ('MORGANVOICE', 'day_pass', 1, 100, 'Free Morgy voice feature', TRUE)
ON CONFLICT (code) DO NOTHING;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- To apply this migration:
-- 1. Go to your Supabase project dashboard
-- 2. Navigate to SQL Editor
-- 3. Copy and paste this entire file
-- 4. Click "Run" to execute
-- 
-- To verify:
-- SELECT table_name FROM information_schema.tables 
-- WHERE table_schema = 'public' 
-- AND table_name IN ('subscriptions', 'usage_tracking', 'payment_history', 'promo_codes', 'promo_code_redemptions');
