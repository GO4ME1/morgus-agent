-- Morgus Billing Enforcement - Clean Migration
-- Created: December 24, 2025
-- Purpose: Add billing tables that don't already exist

-- ============================================================================
-- 1. SUBSCRIPTIONS TABLE (if not exists)
-- ============================================================================
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id TEXT NOT NULL CHECK (plan_id IN ('free', 'daily', 'weekly', 'monthly')),
  status TEXT NOT NULL CHECK (status IN ('active', 'cancelled', 'expired', 'past_due')),
  stripe_subscription_id TEXT UNIQUE,
  stripe_customer_id TEXT,
  stripe_price_id TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Partial unique index for active subscriptions
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_active_subscription 
  ON subscriptions(user_id) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_id ON subscriptions(stripe_subscription_id);

-- ============================================================================
-- 2. USAGE TRACKING TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS usage_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  messages_count INTEGER NOT NULL DEFAULT 0,
  builds_count INTEGER NOT NULL DEFAULT 0,
  deployments_count INTEGER NOT NULL DEFAULT 0,
  images_count INTEGER NOT NULL DEFAULT 0,
  searches_count INTEGER NOT NULL DEFAULT 0,
  videos_count INTEGER NOT NULL DEFAULT 0,
  browser_sessions_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, date)
);

CREATE INDEX IF NOT EXISTS idx_usage_tracking_user_date ON usage_tracking(user_id, date);

-- ============================================================================
-- 3. PAYMENT HISTORY TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS payment_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount_cents INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'usd',
  payment_type TEXT NOT NULL CHECK (payment_type IN ('subscription', 'day_pass', 'credits')),
  stripe_payment_intent_id TEXT UNIQUE,
  stripe_invoice_id TEXT,
  status TEXT NOT NULL CHECK (status IN ('pending', 'succeeded', 'failed', 'refunded')),
  description TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payment_history_user_id ON payment_history(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_history_created_at ON payment_history(created_at);
CREATE INDEX IF NOT EXISTS idx_payment_history_stripe_payment ON payment_history(stripe_payment_intent_id);

-- ============================================================================
-- 4. PROMO CODE REDEMPTIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS promo_code_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  promo_code_id UUID NOT NULL REFERENCES promo_codes(id) ON DELETE CASCADE,
  redeemed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  benefit_applied JSONB NOT NULL,
  UNIQUE(user_id, promo_code_id)
);

CREATE INDEX IF NOT EXISTS idx_promo_redemptions_user ON promo_code_redemptions(user_id);
CREATE INDEX IF NOT EXISTS idx_promo_redemptions_code ON promo_code_redemptions(promo_code_id);

-- ============================================================================
-- 5. ADD BILLING COLUMNS TO PROFILES (if not exist)
-- ============================================================================
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'stripe_customer_id') THEN
    ALTER TABLE profiles ADD COLUMN stripe_customer_id TEXT UNIQUE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'current_plan') THEN
    ALTER TABLE profiles ADD COLUMN current_plan TEXT NOT NULL DEFAULT 'free';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'day_pass_balance') THEN
    ALTER TABLE profiles ADD COLUMN day_pass_balance INTEGER NOT NULL DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'day_pass_expires_at') THEN
    ALTER TABLE profiles ADD COLUMN day_pass_expires_at TIMESTAMPTZ;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'lifetime_credits_purchased') THEN
    ALTER TABLE profiles ADD COLUMN lifetime_credits_purchased INTEGER NOT NULL DEFAULT 0;
  END IF;
END $$;

-- ============================================================================
-- 6. ROW LEVEL SECURITY POLICIES
-- ============================================================================
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE promo_code_redemptions ENABLE ROW LEVEL SECURITY;

-- Subscriptions policies
DROP POLICY IF EXISTS "Users can view own subscriptions" ON subscriptions;
CREATE POLICY "Users can view own subscriptions" ON subscriptions
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role can manage subscriptions" ON subscriptions;
CREATE POLICY "Service role can manage subscriptions" ON subscriptions
  FOR ALL USING (auth.role() = 'service_role');

-- Usage tracking policies
DROP POLICY IF EXISTS "Users can view own usage" ON usage_tracking;
CREATE POLICY "Users can view own usage" ON usage_tracking
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role can manage usage" ON usage_tracking;
CREATE POLICY "Service role can manage usage" ON usage_tracking
  FOR ALL USING (auth.role() = 'service_role');

-- Payment history policies
DROP POLICY IF EXISTS "Users can view own payments" ON payment_history;
CREATE POLICY "Users can view own payments" ON payment_history
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role can manage payments" ON payment_history;
CREATE POLICY "Service role can manage payments" ON payment_history
  FOR ALL USING (auth.role() = 'service_role');

-- Promo redemptions policies
DROP POLICY IF EXISTS "Users can view own redemptions" ON promo_code_redemptions;
CREATE POLICY "Users can view own redemptions" ON promo_code_redemptions
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role can manage redemptions" ON promo_code_redemptions;
CREATE POLICY "Service role can manage redemptions" ON promo_code_redemptions
  FOR ALL USING (auth.role() = 'service_role');

-- ============================================================================
-- 7. HELPER FUNCTIONS
-- ============================================================================

-- Get user's current plan
CREATE OR REPLACE FUNCTION get_user_plan(p_user_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_plan TEXT;
BEGIN
  SELECT current_plan INTO v_plan FROM profiles WHERE id = p_user_id;
  RETURN COALESCE(v_plan, 'free');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user can use a feature
CREATE OR REPLACE FUNCTION can_use_feature(p_user_id UUID, p_feature TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  v_plan TEXT;
  v_usage INTEGER;
  v_limit INTEGER;
BEGIN
  v_plan := get_user_plan(p_user_id);
  
  IF v_plan != 'free' THEN
    RETURN TRUE;
  END IF;
  
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
  INTO v_usage
  FROM usage_tracking
  WHERE user_id = p_user_id AND date = CURRENT_DATE;
  
  v_usage := COALESCE(v_usage, 0);
  
  v_limit := CASE p_feature
    WHEN 'messages' THEN 10
    WHEN 'builds' THEN 1
    WHEN 'deployments' THEN 1
    WHEN 'images' THEN 3
    WHEN 'searches' THEN 5
    WHEN 'videos' THEN 0
    WHEN 'browser_sessions' THEN 2
    ELSE 0
  END;
  
  RETURN v_usage < v_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Atomically increment usage
CREATE OR REPLACE FUNCTION increment_usage(
  p_user_id UUID,
  p_feature TEXT,
  p_amount INTEGER DEFAULT 1
)
RETURNS INTEGER AS $$
DECLARE
  v_new_count INTEGER;
  v_today DATE := CURRENT_DATE;
BEGIN
  INSERT INTO usage_tracking (user_id, date, messages_count, builds_count, deployments_count, images_count, searches_count, videos_count, browser_sessions_count)
  VALUES (p_user_id, v_today, 0, 0, 0, 0, 0, 0, 0)
  ON CONFLICT (user_id, date) DO NOTHING;
  
  EXECUTE format(
    'UPDATE usage_tracking SET %I = %I + $1, updated_at = NOW() WHERE user_id = $2 AND date = $3 RETURNING %I',
    p_feature || '_count', p_feature || '_count', p_feature || '_count'
  ) INTO v_new_count USING p_amount, p_user_id, v_today;
  
  RETURN v_new_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check and increment in one atomic operation
CREATE OR REPLACE FUNCTION check_and_increment_usage(
  p_user_id UUID,
  p_feature TEXT,
  p_limit INTEGER,
  p_amount INTEGER DEFAULT 1
)
RETURNS BOOLEAN AS $$
DECLARE
  v_current_usage INTEGER;
  v_today DATE := CURRENT_DATE;
BEGIN
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
  
  v_current_usage := COALESCE(v_current_usage, 0);
  
  IF p_limit != -1 AND v_current_usage + p_amount > p_limit THEN
    RETURN FALSE;
  END IF;
  
  PERFORM increment_usage(p_user_id, p_feature, p_amount);
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get usage summary
CREATE OR REPLACE FUNCTION get_usage_summary(p_user_id UUID)
RETURNS TABLE (
  feature TEXT,
  used INTEGER,
  limit_value INTEGER,
  remaining INTEGER
) AS $$
DECLARE
  v_plan TEXT;
  v_today DATE := CURRENT_DATE;
BEGIN
  v_plan := get_user_plan(p_user_id);
  
  RETURN QUERY
  SELECT 
    f.feature,
    COALESCE(
      CASE f.feature
        WHEN 'messages' THEN u.messages_count
        WHEN 'builds' THEN u.builds_count
        WHEN 'deployments' THEN u.deployments_count
        WHEN 'images' THEN u.images_count
        WHEN 'searches' THEN u.searches_count
        WHEN 'videos' THEN u.videos_count
        WHEN 'browser_sessions' THEN u.browser_sessions_count
      END, 0
    ) as used,
    CASE 
      WHEN v_plan = 'free' THEN 
        CASE f.feature
          WHEN 'messages' THEN 10
          WHEN 'builds' THEN 1
          WHEN 'deployments' THEN 1
          WHEN 'images' THEN 3
          WHEN 'searches' THEN 5
          WHEN 'videos' THEN 0
          WHEN 'browser_sessions' THEN 2
        END
      ELSE -1
    END as limit_value,
    CASE 
      WHEN v_plan = 'free' THEN 
        GREATEST(0, 
          CASE f.feature
            WHEN 'messages' THEN 10 - COALESCE(u.messages_count, 0)
            WHEN 'builds' THEN 1 - COALESCE(u.builds_count, 0)
            WHEN 'deployments' THEN 1 - COALESCE(u.deployments_count, 0)
            WHEN 'images' THEN 3 - COALESCE(u.images_count, 0)
            WHEN 'searches' THEN 5 - COALESCE(u.searches_count, 0)
            WHEN 'videos' THEN 0 - COALESCE(u.videos_count, 0)
            WHEN 'browser_sessions' THEN 2 - COALESCE(u.browser_sessions_count, 0)
          END
        )
      ELSE -1
    END as remaining
  FROM (VALUES ('messages'), ('builds'), ('deployments'), ('images'), ('searches'), ('videos'), ('browser_sessions')) as f(feature)
  LEFT JOIN usage_tracking u ON u.user_id = p_user_id AND u.date = v_today;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Cleanup expired day passes
CREATE OR REPLACE FUNCTION cleanup_expired_passes()
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  UPDATE profiles
  SET 
    day_pass_balance = 0,
    day_pass_expires_at = NULL
  WHERE day_pass_expires_at IS NOT NULL AND day_pass_expires_at < NOW();
  
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- DONE!
-- ============================================================================
SELECT 'Billing schema migration completed successfully!' as status;
