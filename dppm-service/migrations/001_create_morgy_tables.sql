-- Migration: Create Morgy Marketplace Tables
-- Version: 001
-- Date: 2025-12-27

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Morgys Table
CREATE TABLE IF NOT EXISTS morgys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_id UUID NOT NULL,
  
  -- Basic Info
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(50) NOT NULL,
  tags TEXT[] DEFAULT '{}',
  
  -- AI Configuration
  ai_config JSONB NOT NULL DEFAULT '{
    "primaryModel": "gpt-4",
    "temperature": 0.7,
    "maxTokens": 2000,
    "systemPrompt": "",
    "fallbackModels": []
  }'::jsonb,
  
  -- Personality
  personality JSONB NOT NULL DEFAULT '{
    "tone": "professional",
    "verbosity": "balanced",
    "emojiUsage": "minimal",
    "responseStyle": ""
  }'::jsonb,
  
  -- Appearance
  appearance JSONB NOT NULL DEFAULT '{
    "avatar": "🐷",
    "color": "#8B5CF6",
    "icon": "pig"
  }'::jsonb,
  
  -- Capabilities
  capabilities JSONB NOT NULL DEFAULT '{
    "webSearch": true,
    "codeExecution": false,
    "fileProcessing": true,
    "imageGeneration": false,
    "voiceInteraction": false,
    "mcpTools": []
  }'::jsonb,
  
  -- Knowledge Base
  knowledge_base JSONB NOT NULL DEFAULT '{
    "documents": [],
    "urls": [],
    "customData": ""
  }'::jsonb,
  
  -- Marketplace
  is_public BOOLEAN DEFAULT false,
  license_type VARCHAR(20) DEFAULT 'free',
  price DECIMAL(10, 2) DEFAULT 0.00,
  is_premium BOOLEAN DEFAULT false,
  
  -- Stats
  total_purchases INTEGER DEFAULT 0,
  total_revenue DECIMAL(10, 2) DEFAULT 0.00,
  rating DECIMAL(3, 2) DEFAULT 0.00,
  review_count INTEGER DEFAULT 0,
  view_count INTEGER DEFAULT 0,
  
  -- Metadata
  version INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  published_at TIMESTAMP,
  
  -- Constraints
  CONSTRAINT valid_license_type CHECK (license_type IN ('free', 'paid', 'subscription')),
  CONSTRAINT valid_category CHECK (category IN ('business', 'social', 'research', 'technical', 'creative', 'custom')),
  CONSTRAINT valid_price CHECK (price >= 0 AND price <= 999.99),
  CONSTRAINT valid_rating CHECK (rating >= 0 AND rating <= 5)
);

-- Indexes for morgys table
CREATE INDEX idx_morgys_creator ON morgys(creator_id);
CREATE INDEX idx_morgys_public ON morgys(is_public) WHERE is_public = true;
CREATE INDEX idx_morgys_category ON morgys(category);
CREATE INDEX idx_morgys_tags ON morgys USING GIN(tags);
CREATE INDEX idx_morgys_created ON morgys(created_at DESC);
CREATE INDEX idx_morgys_rating ON morgys(rating DESC);
CREATE INDEX idx_morgys_active ON morgys(is_active) WHERE is_active = true;

-- 2. Morgy Purchases Table
CREATE TABLE IF NOT EXISTS morgy_purchases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  morgy_id UUID NOT NULL REFERENCES morgys(id) ON DELETE CASCADE,
  buyer_id UUID NOT NULL,
  creator_id UUID NOT NULL,
  
  -- Purchase Details
  purchase_type VARCHAR(20) NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  platform_fee DECIMAL(10, 2) NOT NULL,
  creator_revenue DECIMAL(10, 2) NOT NULL,
  
  -- Payment
  stripe_payment_id VARCHAR(255),
  stripe_subscription_id VARCHAR(255),
  payment_status VARCHAR(20) DEFAULT 'pending',
  
  -- Subscription (if applicable)
  subscription_start TIMESTAMP,
  subscription_end TIMESTAMP,
  subscription_status VARCHAR(20),
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT unique_buyer_morgy UNIQUE(buyer_id, morgy_id),
  CONSTRAINT valid_purchase_type CHECK (purchase_type IN ('one_time', 'subscription')),
  CONSTRAINT valid_payment_status CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded')),
  CONSTRAINT valid_subscription_status CHECK (subscription_status IS NULL OR subscription_status IN ('active', 'cancelled', 'expired'))
);

-- Indexes for morgy_purchases table
CREATE INDEX idx_purchases_morgy ON morgy_purchases(morgy_id);
CREATE INDEX idx_purchases_buyer ON morgy_purchases(buyer_id);
CREATE INDEX idx_purchases_creator ON morgy_purchases(creator_id);
CREATE INDEX idx_purchases_status ON morgy_purchases(payment_status);
CREATE INDEX idx_purchases_created ON morgy_purchases(created_at DESC);

-- 3. Morgy Reviews Table
CREATE TABLE IF NOT EXISTS morgy_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  morgy_id UUID NOT NULL REFERENCES morgys(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT unique_user_morgy_review UNIQUE(user_id, morgy_id)
);

-- Indexes for morgy_reviews table
CREATE INDEX idx_reviews_morgy ON morgy_reviews(morgy_id);
CREATE INDEX idx_reviews_user ON morgy_reviews(user_id);
CREATE INDEX idx_reviews_rating ON morgy_reviews(rating DESC);

-- 4. Morgy Analytics Table
CREATE TABLE IF NOT EXISTS morgy_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  morgy_id UUID NOT NULL REFERENCES morgys(id) ON DELETE CASCADE,
  
  -- Daily metrics
  date DATE NOT NULL,
  views INTEGER DEFAULT 0,
  purchases INTEGER DEFAULT 0,
  revenue DECIMAL(10, 2) DEFAULT 0.00,
  messages_sent INTEGER DEFAULT 0,
  unique_users INTEGER DEFAULT 0,
  
  created_at TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT unique_morgy_date UNIQUE(morgy_id, date)
);

-- Indexes for morgy_analytics table
CREATE INDEX idx_analytics_morgy ON morgy_analytics(morgy_id);
CREATE INDEX idx_analytics_date ON morgy_analytics(date DESC);

-- 5. Creator Payouts Table
CREATE TABLE IF NOT EXISTS creator_payouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_id UUID NOT NULL,
  
  -- Payout Details
  amount DECIMAL(10, 2) NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  
  -- Payment
  stripe_payout_id VARCHAR(255),
  status VARCHAR(20) DEFAULT 'pending',
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  paid_at TIMESTAMP,
  
  CONSTRAINT valid_payout_status CHECK (status IN ('pending', 'processing', 'paid', 'failed'))
);

-- Indexes for creator_payouts table
CREATE INDEX idx_payouts_creator ON creator_payouts(creator_id);
CREATE INDEX idx_payouts_status ON creator_payouts(status);
CREATE INDEX idx_payouts_period ON creator_payouts(period_end DESC);

-- Functions

-- Function to update morgy rating
CREATE OR REPLACE FUNCTION update_morgy_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE morgys
  SET 
    rating = (
      SELECT COALESCE(AVG(rating), 0)
      FROM morgy_reviews
      WHERE morgy_id = NEW.morgy_id
    ),
    review_count = (
      SELECT COUNT(*)
      FROM morgy_reviews
      WHERE morgy_id = NEW.morgy_id
    ),
    updated_at = NOW()
  WHERE id = NEW.morgy_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update rating on review insert/update
CREATE TRIGGER trigger_update_morgy_rating
AFTER INSERT OR UPDATE ON morgy_reviews
FOR EACH ROW
EXECUTE FUNCTION update_morgy_rating();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER trigger_morgys_updated_at
BEFORE UPDATE ON morgys
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_purchases_updated_at
BEFORE UPDATE ON morgy_purchases
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_reviews_updated_at
BEFORE UPDATE ON morgy_reviews
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE morgys IS 'Custom AI agents (Morgys) created by users';
COMMENT ON TABLE morgy_purchases IS 'Purchase records for Morgys (one-time and subscriptions)';
COMMENT ON TABLE morgy_reviews IS 'User reviews and ratings for Morgys';
COMMENT ON TABLE morgy_analytics IS 'Daily analytics metrics for Morgys';
COMMENT ON TABLE creator_payouts IS 'Revenue payouts to Morgy creators';

-- Grant permissions (adjust as needed)
-- GRANT ALL ON morgys TO your_app_user;
-- GRANT ALL ON morgy_purchases TO your_app_user;
-- GRANT ALL ON morgy_reviews TO your_app_user;
-- GRANT ALL ON morgy_analytics TO your_app_user;
-- GRANT ALL ON creator_payouts TO your_app_user;
