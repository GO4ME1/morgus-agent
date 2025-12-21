-- ============================================
-- MORGUS MONETIZATION DATABASE SCHEMA
-- ============================================
-- This schema supports:
-- - User authentication (via Supabase Auth)
-- - Subscription management (Stripe integration)
-- - Usage tracking and limits
-- - Day pass wallet system
-- - Promo code system
-- - Referral system
-- - Morgy ownership and customization
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. USER PROFILES (extends Supabase auth.users)
-- ============================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  
  -- Subscription status
  subscription_status TEXT DEFAULT 'free' CHECK (subscription_status IN ('free', 'daily', 'weekly', 'monthly', 'cancelled')),
  subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'daily', 'weekly', 'monthly')),
  subscription_started_at TIMESTAMPTZ,
  subscription_ends_at TIMESTAMPTZ,
  
  -- Stripe integration
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT,
  
  -- Day pass wallet
  day_pass_balance INTEGER DEFAULT 0 CHECK (day_pass_balance >= 0 AND day_pass_balance <= 3),
  day_pass_expires_at TIMESTAMPTZ,
  
  -- Referral system
  referral_code TEXT UNIQUE,
  referred_by UUID REFERENCES public.profiles(id),
  referral_count INTEGER DEFAULT 0,
  
  -- Admin flag
  is_admin BOOLEAN DEFAULT FALSE,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Generate unique referral code on insert
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS TRIGGER AS $$
BEGIN
  NEW.referral_code := UPPER(SUBSTRING(MD5(NEW.id::TEXT || NOW()::TEXT) FROM 1 FOR 8));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_referral_code
  BEFORE INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION generate_referral_code();

-- ============================================
-- 2. SUBSCRIPTION PLANS (reference table)
-- ============================================
CREATE TABLE public.subscription_plans (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price_cents INTEGER NOT NULL,
  interval TEXT NOT NULL CHECK (interval IN ('day', 'week', 'month')),
  stripe_price_id TEXT,
  
  -- Limits
  daily_messages INTEGER DEFAULT -1, -- -1 = unlimited
  daily_builds INTEGER DEFAULT -1,
  daily_deployments INTEGER DEFAULT -1,
  daily_images INTEGER DEFAULT -1,
  daily_searches INTEGER DEFAULT -1,
  daily_videos INTEGER DEFAULT -1,
  included_morgys INTEGER DEFAULT 1,
  
  -- Features
  github_access BOOLEAN DEFAULT FALSE,
  morgy_tools_access BOOLEAN DEFAULT FALSE,
  video_generation BOOLEAN DEFAULT FALSE,
  three_d_morgys BOOLEAN DEFAULT FALSE,
  
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default plans
INSERT INTO public.subscription_plans (id, name, description, price_cents, interval, daily_messages, daily_builds, daily_deployments, daily_images, daily_searches, daily_videos, included_morgys, github_access, morgy_tools_access, video_generation, three_d_morgys) VALUES
  ('free', 'Free', 'Try Morgus with limited features', 0, 'day', 20, 1, 1, 3, 10, 0, 1, FALSE, FALSE, FALSE, FALSE),
  ('daily', 'Day Pass', 'Full access for 24 hours', 300, 'day', -1, -1, -1, -1, -1, 2, 1, TRUE, TRUE, TRUE, FALSE),
  ('weekly', 'Weekly', 'Best value - full access for 7 days', 2100, 'week', -1, -1, -1, -1, -1, 10, 3, TRUE, TRUE, TRUE, TRUE),
  ('monthly', 'Monthly', 'Power user - unlimited everything', 7500, 'month', -1, -1, -1, -1, -1, -1, 5, TRUE, TRUE, TRUE, TRUE);

-- ============================================
-- 3. USAGE TRACKING
-- ============================================
CREATE TABLE public.usage_tracking (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- Daily counters (reset at midnight UTC)
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  
  messages_count INTEGER DEFAULT 0,
  builds_count INTEGER DEFAULT 0,
  deployments_count INTEGER DEFAULT 0,
  images_count INTEGER DEFAULT 0,
  searches_count INTEGER DEFAULT 0,
  videos_count INTEGER DEFAULT 0,
  
  -- Cost tracking (in cents, for analytics)
  estimated_cost_cents INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, date)
);

-- Index for fast lookups
CREATE INDEX idx_usage_user_date ON public.usage_tracking(user_id, date);

-- ============================================
-- 4. PROMO CODES
-- ============================================
CREATE TABLE public.promo_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT UNIQUE NOT NULL,
  
  -- Reward type
  reward_type TEXT NOT NULL CHECK (reward_type IN ('day_pass', 'morgy', 'skin', 'discount')),
  reward_value INTEGER NOT NULL, -- days for day_pass, morgy_id for morgy, percentage for discount
  
  -- Limits
  max_uses INTEGER DEFAULT 1000,
  uses_count INTEGER DEFAULT 0,
  max_uses_per_user INTEGER DEFAULT 1,
  
  -- Validity
  starts_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Metadata
  description TEXT,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for code lookups
CREATE INDEX idx_promo_code ON public.promo_codes(code);

-- ============================================
-- 5. PROMO REDEMPTIONS
-- ============================================
CREATE TABLE public.promo_redemptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  promo_code_id UUID NOT NULL REFERENCES public.promo_codes(id),
  
  redeemed_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, promo_code_id) -- Each user can only redeem each code once
);

-- ============================================
-- 6. REFERRALS
-- ============================================
CREATE TABLE public.referrals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  referrer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  referred_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- Status tracking
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'activated', 'rewarded')),
  
  -- Reward tracking
  reward_type TEXT, -- 'morgy', 'skin', 'week'
  reward_given_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(referred_id) -- Each user can only be referred once
);

-- ============================================
-- 7. MORGYS (User's companion pigs)
-- ============================================
CREATE TABLE public.user_morgys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- Morgy identity
  morgy_type TEXT NOT NULL, -- 'bill', 'sally', 'professor', 'custom'
  custom_name TEXT,
  
  -- Customization
  skin_id TEXT DEFAULT 'default',
  personality TEXT,
  
  -- Stats
  level INTEGER DEFAULT 1,
  xp INTEGER DEFAULT 0,
  
  -- Generated assets
  image_url TEXT,
  tiktok_count INTEGER DEFAULT 0,
  three_d_model_url TEXT,
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  is_primary BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for user's morgys
CREATE INDEX idx_user_morgys ON public.user_morgys(user_id);

-- ============================================
-- 8. MORGY SKINS (purchasable/unlockable)
-- ============================================
CREATE TABLE public.morgy_skins (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  preview_url TEXT,
  
  -- Pricing
  price_cents INTEGER DEFAULT 0, -- 0 = free or reward
  is_premium BOOLEAN DEFAULT FALSE,
  
  -- Availability
  is_active BOOLEAN DEFAULT TRUE,
  unlock_method TEXT DEFAULT 'purchase' CHECK (unlock_method IN ('purchase', 'referral', 'promo', 'achievement')),
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default skins
INSERT INTO public.morgy_skins (id, name, description, price_cents, is_premium, unlock_method) VALUES
  ('default', 'Classic', 'The original Morgy look', 0, FALSE, 'purchase'),
  ('cyber', 'Cyber Morgy', 'Neon cyberpunk style', 100, TRUE, 'purchase'),
  ('samurai', 'Samurai Morgy', 'Honorable warrior pig', 200, TRUE, 'purchase'),
  ('chaos', 'Chaos Morgy', 'Unpredictable and wild', 300, TRUE, 'purchase'),
  ('golden', 'Golden Morgy', 'Luxurious gold finish', 500, TRUE, 'purchase'),
  ('referral_1', 'Friend Finder', 'Unlocked by referring 1 friend', 0, FALSE, 'referral'),
  ('referral_3', 'Social Butterfly', 'Unlocked by referring 3 friends', 0, FALSE, 'referral');

-- ============================================
-- 9. USER SKINS (owned skins)
-- ============================================
CREATE TABLE public.user_skins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  skin_id TEXT NOT NULL REFERENCES public.morgy_skins(id),
  
  unlocked_via TEXT DEFAULT 'purchase' CHECK (unlocked_via IN ('purchase', 'referral', 'promo', 'achievement', 'included')),
  unlocked_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, skin_id)
);

-- ============================================
-- 10. PAYMENT HISTORY
-- ============================================
CREATE TABLE public.payment_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- Stripe data
  stripe_payment_intent_id TEXT,
  stripe_invoice_id TEXT,
  
  -- Payment details
  amount_cents INTEGER NOT NULL,
  currency TEXT DEFAULT 'usd',
  status TEXT NOT NULL CHECK (status IN ('pending', 'succeeded', 'failed', 'refunded')),
  
  -- What was purchased
  purchase_type TEXT NOT NULL CHECK (purchase_type IN ('subscription', 'day_pass', 'morgy', 'skin', 'video', '3d_model')),
  purchase_details JSONB,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 11. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promo_redemptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_morgys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_skins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_history ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can read/update their own profile
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Usage tracking: Users can view their own usage
CREATE POLICY "Users can view own usage" ON public.usage_tracking FOR SELECT USING (auth.uid() = user_id);

-- Promo codes: Anyone can view active codes (for validation)
CREATE POLICY "Anyone can view active promo codes" ON public.promo_codes FOR SELECT USING (is_active = TRUE);

-- Promo redemptions: Users can view/create their own
CREATE POLICY "Users can view own redemptions" ON public.promo_redemptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create redemptions" ON public.promo_redemptions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Referrals: Users can view referrals they made or received
CREATE POLICY "Users can view own referrals" ON public.referrals FOR SELECT USING (auth.uid() = referrer_id OR auth.uid() = referred_id);

-- User morgys: Users can manage their own morgys
CREATE POLICY "Users can view own morgys" ON public.user_morgys FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create morgys" ON public.user_morgys FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own morgys" ON public.user_morgys FOR UPDATE USING (auth.uid() = user_id);

-- User skins: Users can view their own skins
CREATE POLICY "Users can view own skins" ON public.user_skins FOR SELECT USING (auth.uid() = user_id);

-- Payment history: Users can view their own payments
CREATE POLICY "Users can view own payments" ON public.payment_history FOR SELECT USING (auth.uid() = user_id);

-- ============================================
-- 12. HELPER FUNCTIONS
-- ============================================

-- Function to check if user has active subscription
CREATE OR REPLACE FUNCTION public.has_active_subscription(user_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
  profile_record RECORD;
BEGIN
  SELECT * INTO profile_record FROM public.profiles WHERE id = user_uuid;
  
  -- Check day pass first
  IF profile_record.day_pass_balance > 0 AND (profile_record.day_pass_expires_at IS NULL OR profile_record.day_pass_expires_at > NOW()) THEN
    RETURN TRUE;
  END IF;
  
  -- Check subscription
  IF profile_record.subscription_status IN ('daily', 'weekly', 'monthly') AND profile_record.subscription_ends_at > NOW() THEN
    RETURN TRUE;
  END IF;
  
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's current plan limits
CREATE OR REPLACE FUNCTION public.get_user_limits(user_uuid UUID)
RETURNS TABLE (
  plan_id TEXT,
  daily_messages INTEGER,
  daily_builds INTEGER,
  daily_deployments INTEGER,
  daily_images INTEGER,
  daily_searches INTEGER,
  daily_videos INTEGER,
  github_access BOOLEAN,
  morgy_tools_access BOOLEAN
) AS $$
DECLARE
  profile_record RECORD;
  plan_record RECORD;
BEGIN
  SELECT * INTO profile_record FROM public.profiles WHERE id = user_uuid;
  
  -- Determine effective plan
  IF public.has_active_subscription(user_uuid) THEN
    SELECT * INTO plan_record FROM public.subscription_plans WHERE id = profile_record.subscription_tier;
  ELSE
    SELECT * INTO plan_record FROM public.subscription_plans WHERE id = 'free';
  END IF;
  
  RETURN QUERY SELECT 
    plan_record.id,
    plan_record.daily_messages,
    plan_record.daily_builds,
    plan_record.daily_deployments,
    plan_record.daily_images,
    plan_record.daily_searches,
    plan_record.daily_videos,
    plan_record.github_access,
    plan_record.morgy_tools_access;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment usage and check limits
CREATE OR REPLACE FUNCTION public.use_feature(user_uuid UUID, feature_name TEXT)
RETURNS JSONB AS $$
DECLARE
  limits_record RECORD;
  usage_record RECORD;
  current_count INTEGER;
  max_count INTEGER;
BEGIN
  -- Get user limits
  SELECT * INTO limits_record FROM public.get_user_limits(user_uuid);
  
  -- Get or create today's usage record
  INSERT INTO public.usage_tracking (user_id, date)
  VALUES (user_uuid, CURRENT_DATE)
  ON CONFLICT (user_id, date) DO NOTHING;
  
  SELECT * INTO usage_record FROM public.usage_tracking 
  WHERE user_id = user_uuid AND date = CURRENT_DATE;
  
  -- Check limit based on feature
  CASE feature_name
    WHEN 'message' THEN
      current_count := usage_record.messages_count;
      max_count := limits_record.daily_messages;
    WHEN 'build' THEN
      current_count := usage_record.builds_count;
      max_count := limits_record.daily_builds;
    WHEN 'deployment' THEN
      current_count := usage_record.deployments_count;
      max_count := limits_record.daily_deployments;
    WHEN 'image' THEN
      current_count := usage_record.images_count;
      max_count := limits_record.daily_images;
    WHEN 'search' THEN
      current_count := usage_record.searches_count;
      max_count := limits_record.daily_searches;
    WHEN 'video' THEN
      current_count := usage_record.videos_count;
      max_count := limits_record.daily_videos;
    ELSE
      RETURN jsonb_build_object('allowed', FALSE, 'error', 'Unknown feature');
  END CASE;
  
  -- Check if unlimited (-1) or within limit
  IF max_count = -1 OR current_count < max_count THEN
    -- Increment usage
    EXECUTE format('UPDATE public.usage_tracking SET %I_count = %I_count + 1, updated_at = NOW() WHERE user_id = $1 AND date = CURRENT_DATE', feature_name, feature_name)
    USING user_uuid;
    
    RETURN jsonb_build_object(
      'allowed', TRUE,
      'current', current_count + 1,
      'limit', max_count,
      'remaining', CASE WHEN max_count = -1 THEN -1 ELSE max_count - current_count - 1 END
    );
  ELSE
    RETURN jsonb_build_object(
      'allowed', FALSE,
      'current', current_count,
      'limit', max_count,
      'remaining', 0,
      'error', 'Daily limit reached',
      'upgrade_message', 'Upgrade to unlock unlimited ' || feature_name || 's!'
    );
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to redeem promo code
CREATE OR REPLACE FUNCTION public.redeem_promo_code(user_uuid UUID, promo_code TEXT)
RETURNS JSONB AS $$
DECLARE
  code_record RECORD;
  profile_record RECORD;
  redemption_count INTEGER;
BEGIN
  -- Get promo code
  SELECT * INTO code_record FROM public.promo_codes 
  WHERE code = UPPER(promo_code) AND is_active = TRUE;
  
  IF code_record IS NULL THEN
    RETURN jsonb_build_object('success', FALSE, 'error', 'Invalid promo code');
  END IF;
  
  -- Check expiration
  IF code_record.expires_at IS NOT NULL AND code_record.expires_at < NOW() THEN
    RETURN jsonb_build_object('success', FALSE, 'error', 'Promo code has expired');
  END IF;
  
  -- Check max uses
  IF code_record.uses_count >= code_record.max_uses THEN
    RETURN jsonb_build_object('success', FALSE, 'error', 'Promo code has reached maximum uses');
  END IF;
  
  -- Check if user already redeemed
  SELECT COUNT(*) INTO redemption_count FROM public.promo_redemptions 
  WHERE user_id = user_uuid AND promo_code_id = code_record.id;
  
  IF redemption_count >= code_record.max_uses_per_user THEN
    RETURN jsonb_build_object('success', FALSE, 'error', 'You have already redeemed this code');
  END IF;
  
  -- Get user profile
  SELECT * INTO profile_record FROM public.profiles WHERE id = user_uuid;
  
  -- Apply reward based on type
  IF code_record.reward_type = 'day_pass' THEN
    -- Check day pass limit (max 3)
    IF profile_record.day_pass_balance + code_record.reward_value > 3 THEN
      RETURN jsonb_build_object('success', FALSE, 'error', 'You already have 3 day passes. Use them before redeeming more.');
    END IF;
    
    -- Add day passes
    UPDATE public.profiles 
    SET day_pass_balance = day_pass_balance + code_record.reward_value,
        updated_at = NOW()
    WHERE id = user_uuid;
  END IF;
  
  -- Record redemption
  INSERT INTO public.promo_redemptions (user_id, promo_code_id)
  VALUES (user_uuid, code_record.id);
  
  -- Increment uses count
  UPDATE public.promo_codes SET uses_count = uses_count + 1 WHERE id = code_record.id;
  
  RETURN jsonb_build_object(
    'success', TRUE,
    'reward_type', code_record.reward_type,
    'reward_value', code_record.reward_value,
    'message', CASE 
      WHEN code_record.reward_type = 'day_pass' THEN format('You received %s free day pass(es)!', code_record.reward_value)
      ELSE 'Promo code redeemed successfully!'
    END
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 13. TRIGGERS FOR UPDATED_AT
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_usage_tracking_updated_at
  BEFORE UPDATE ON public.usage_tracking
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_user_morgys_updated_at
  BEFORE UPDATE ON public.user_morgys
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ============================================
-- END OF SCHEMA
-- ============================================
