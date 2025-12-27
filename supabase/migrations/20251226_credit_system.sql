-- Credit System for Morgus
-- Tracks image and video generation credits for users

-- ============================================================================
-- 1. User Credits Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Image credits
  image_credits_total INTEGER NOT NULL DEFAULT 0,
  image_credits_used INTEGER NOT NULL DEFAULT 0,
  image_credits_remaining INTEGER GENERATED ALWAYS AS (image_credits_total - image_credits_used) STORED,
  
  -- Video credits
  video_credits_total INTEGER NOT NULL DEFAULT 0,
  video_credits_used INTEGER NOT NULL DEFAULT 0,
  video_credits_remaining INTEGER GENERATED ALWAYS AS (video_credits_total - video_credits_used) STORED,
  
  -- Unlimited credits flags (for subscription plans, testing, admins)
  unlimited_image_credits BOOLEAN NOT NULL DEFAULT false,
  unlimited_video_credits BOOLEAN NOT NULL DEFAULT false,
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(user_id),
  CHECK (image_credits_used >= 0),
  CHECK (video_credits_used >= 0),
  CHECK (image_credits_total >= 0),
  CHECK (video_credits_total >= 0)
);

-- Index for fast user lookups
CREATE INDEX IF NOT EXISTS idx_user_credits_user_id ON user_credits(user_id);

-- RLS Policies
ALTER TABLE user_credits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own credits"
  ON user_credits FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all credits"
  ON user_credits FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- ============================================================================
-- 2. Credit Transactions Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Transaction details
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('purchase', 'usage', 'refund', 'bonus', 'promo')),
  credit_type TEXT NOT NULL CHECK (credit_type IN ('image', 'video')),
  amount INTEGER NOT NULL, -- Positive for additions, negative for usage
  
  -- Context
  description TEXT,
  metadata JSONB DEFAULT '{}',
  
  -- Related entities
  task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
  payment_id TEXT, -- Stripe payment ID
  promo_code TEXT,
  
  -- Balances after transaction
  balance_after INTEGER NOT NULL,
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CHECK (amount != 0)
);

-- Indexes for queries
CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_id ON credit_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_task_id ON credit_transactions(task_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_created_at ON credit_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_type ON credit_transactions(transaction_type, credit_type);

-- RLS Policies
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own transactions"
  ON credit_transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all transactions"
  ON credit_transactions FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- ============================================================================
-- 3. Credit Packages Table (for purchases)
-- ============================================================================
CREATE TABLE IF NOT EXISTS credit_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Package details
  name TEXT NOT NULL,
  description TEXT,
  package_type TEXT NOT NULL CHECK (package_type IN ('image_only', 'video_only', 'bundle')),
  
  -- Credits included
  image_credits INTEGER NOT NULL DEFAULT 0,
  video_credits INTEGER NOT NULL DEFAULT 0,
  
  -- Pricing
  price_cents INTEGER NOT NULL, -- Price in cents (USD)
  currency TEXT NOT NULL DEFAULT 'usd',
  
  -- Stripe integration
  stripe_price_id TEXT,
  stripe_product_id TEXT,
  
  -- Status
  active BOOLEAN NOT NULL DEFAULT true,
  featured BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0,
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CHECK (price_cents > 0),
  CHECK (image_credits >= 0),
  CHECK (video_credits >= 0),
  CHECK (image_credits > 0 OR video_credits > 0)
);

-- Index for active packages
CREATE INDEX IF NOT EXISTS idx_credit_packages_active ON credit_packages(active, sort_order);

-- RLS Policies
ALTER TABLE credit_packages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active packages"
  ON credit_packages FOR SELECT
  USING (active = true);

CREATE POLICY "Service role can manage packages"
  ON credit_packages FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- ============================================================================
-- 4. Credit Usage Confirmations Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS credit_confirmations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  
  -- Confirmation details
  credit_type TEXT NOT NULL CHECK (credit_type IN ('image', 'video')),
  credits_required INTEGER NOT NULL,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'expired')),
  
  -- Context
  description TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  
  -- Response
  confirmed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '5 minutes'),
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CHECK (credits_required > 0)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_credit_confirmations_user_id ON credit_confirmations(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_confirmations_status ON credit_confirmations(status, expires_at);
CREATE INDEX IF NOT EXISTS idx_credit_confirmations_task_id ON credit_confirmations(task_id);

-- RLS Policies
ALTER TABLE credit_confirmations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own confirmations"
  ON credit_confirmations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own confirmations"
  ON credit_confirmations FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all confirmations"
  ON credit_confirmations FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- ============================================================================
-- 5. Functions
-- ============================================================================

-- Function to initialize credits for new users
CREATE OR REPLACE FUNCTION initialize_user_credits()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_credits (user_id, image_credits_total, video_credits_total)
  VALUES (NEW.id, 5, 1) -- Free tier: 5 images, 1 video
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to initialize credits on user signup
DROP TRIGGER IF EXISTS on_auth_user_created_initialize_credits ON auth.users;
CREATE TRIGGER on_auth_user_created_initialize_credits
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION initialize_user_credits();

-- Function to add credits (purchase, bonus, promo)
CREATE OR REPLACE FUNCTION add_credits(
  p_user_id UUID,
  p_credit_type TEXT,
  p_amount INTEGER,
  p_transaction_type TEXT,
  p_description TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}',
  p_payment_id TEXT DEFAULT NULL,
  p_promo_code TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_transaction_id UUID;
  v_balance_after INTEGER;
BEGIN
  -- Validate inputs
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Amount must be positive';
  END IF;
  
  IF p_credit_type NOT IN ('image', 'video') THEN
    RAISE EXCEPTION 'Invalid credit type: %', p_credit_type;
  END IF;
  
  IF p_transaction_type NOT IN ('purchase', 'bonus', 'promo', 'refund') THEN
    RAISE EXCEPTION 'Invalid transaction type for adding credits: %', p_transaction_type;
  END IF;
  
  -- Update user credits
  IF p_credit_type = 'image' THEN
    UPDATE user_credits
    SET image_credits_total = image_credits_total + p_amount,
        updated_at = NOW()
    WHERE user_id = p_user_id;
    
    SELECT image_credits_remaining INTO v_balance_after
    FROM user_credits
    WHERE user_id = p_user_id;
  ELSE
    UPDATE user_credits
    SET video_credits_total = video_credits_total + p_amount,
        updated_at = NOW()
    WHERE user_id = p_user_id;
    
    SELECT video_credits_remaining INTO v_balance_after
    FROM user_credits
    WHERE user_id = p_user_id;
  END IF;
  
  -- Record transaction
  INSERT INTO credit_transactions (
    user_id,
    transaction_type,
    credit_type,
    amount,
    description,
    metadata,
    payment_id,
    promo_code,
    balance_after
  ) VALUES (
    p_user_id,
    p_transaction_type,
    p_credit_type,
    p_amount,
    p_description,
    p_metadata,
    p_payment_id,
    p_promo_code,
    v_balance_after
  )
  RETURNING id INTO v_transaction_id;
  
  RETURN v_transaction_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to use credits
CREATE OR REPLACE FUNCTION use_credits(
  p_user_id UUID,
  p_credit_type TEXT,
  p_amount INTEGER,
  p_task_id UUID DEFAULT NULL,
  p_description TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
  v_transaction_id UUID;
  v_balance_after INTEGER;
  v_available INTEGER;
BEGIN
  -- Validate inputs
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Amount must be positive';
  END IF;
  
  IF p_credit_type NOT IN ('image', 'video') THEN
    RAISE EXCEPTION 'Invalid credit type: %', p_credit_type;
  END IF;
  
  -- Check if user has enough credits
  IF p_credit_type = 'image' THEN
    SELECT image_credits_remaining INTO v_available
    FROM user_credits
    WHERE user_id = p_user_id;
    
    IF v_available IS NULL OR v_available < p_amount THEN
      RAISE EXCEPTION 'Insufficient image credits. Available: %, Required: %', COALESCE(v_available, 0), p_amount;
    END IF;
    
    -- Deduct credits
    UPDATE user_credits
    SET image_credits_used = image_credits_used + p_amount,
        updated_at = NOW()
    WHERE user_id = p_user_id;
    
    SELECT image_credits_remaining INTO v_balance_after
    FROM user_credits
    WHERE user_id = p_user_id;
  ELSE
    SELECT video_credits_remaining INTO v_available
    FROM user_credits
    WHERE user_id = p_user_id;
    
    IF v_available IS NULL OR v_available < p_amount THEN
      RAISE EXCEPTION 'Insufficient video credits. Available: %, Required: %', COALESCE(v_available, 0), p_amount;
    END IF;
    
    -- Deduct credits
    UPDATE user_credits
    SET video_credits_used = video_credits_used + p_amount,
        updated_at = NOW()
    WHERE user_id = p_user_id;
    
    SELECT video_credits_remaining INTO v_balance_after
    FROM user_credits
    WHERE user_id = p_user_id;
  END IF;
  
  -- Record transaction
  INSERT INTO credit_transactions (
    user_id,
    transaction_type,
    credit_type,
    amount,
    description,
    metadata,
    task_id,
    balance_after
  ) VALUES (
    p_user_id,
    'usage',
    p_credit_type,
    -p_amount, -- Negative for usage
    p_description,
    p_metadata,
    p_task_id,
    v_balance_after
  )
  RETURNING id INTO v_transaction_id;
  
  RETURN v_transaction_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user has enough credits
CREATE OR REPLACE FUNCTION check_credits(
  p_user_id UUID,
  p_credit_type TEXT,
  p_amount INTEGER
)
RETURNS BOOLEAN AS $$
DECLARE
  v_available INTEGER;
  v_unlimited_images BOOLEAN;
  v_unlimited_videos BOOLEAN;
BEGIN
  -- Get unlimited flags
  SELECT unlimited_image_credits, unlimited_video_credits
  INTO v_unlimited_images, v_unlimited_videos
  FROM user_credits
  WHERE user_id = p_user_id;
  
  -- Check if user has unlimited for this credit type
  IF p_credit_type = 'image' AND v_unlimited_images = true THEN
    RETURN true;
  END IF;
  
  IF p_credit_type = 'video' AND v_unlimited_videos = true THEN
    RETURN true;
  END IF;
  
  -- Otherwise check actual balance
  IF p_credit_type = 'image' THEN
    SELECT image_credits_remaining INTO v_available
    FROM user_credits
    WHERE user_id = p_user_id;
  ELSE
    SELECT video_credits_remaining INTO v_available
    FROM user_credits
    WHERE user_id = p_user_id;
  END IF;
  
  RETURN COALESCE(v_available, 0) >= p_amount;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 6. Insert Default Credit Packages
-- ============================================================================

INSERT INTO credit_packages (name, description, package_type, image_credits, video_credits, price_cents, featured, sort_order)
VALUES
  ('Image Pack', '50 AI-generated images for your projects', 'image_only', 50, 0, 1000, false, 1),
  ('Video Pack', '20 AI-generated videos (5-sec each)', 'video_only', 0, 20, 1500, false, 2),
  ('Creator Bundle', 'Best value: 50 images + 20 videos', 'bundle', 50, 20, 2000, true, 0)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 7. Update timestamp trigger
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_user_credits_updated_at ON user_credits;
CREATE TRIGGER update_user_credits_updated_at
  BEFORE UPDATE ON user_credits
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_credit_packages_updated_at ON credit_packages;
CREATE TRIGGER update_credit_packages_updated_at
  BEFORE UPDATE ON credit_packages
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 8. Comments
-- ============================================================================

COMMENT ON TABLE user_credits IS 'Tracks image and video generation credits for each user';
COMMENT ON TABLE credit_transactions IS 'Records all credit additions and usage for audit trail';
COMMENT ON TABLE credit_packages IS 'Available credit packages for purchase';
COMMENT ON TABLE credit_confirmations IS 'Pending user confirmations for credit usage';

COMMENT ON FUNCTION add_credits IS 'Add credits to user account (purchase, bonus, promo)';
COMMENT ON FUNCTION use_credits IS 'Deduct credits from user account with validation';
COMMENT ON FUNCTION check_credits IS 'Check if user has sufficient credits';
