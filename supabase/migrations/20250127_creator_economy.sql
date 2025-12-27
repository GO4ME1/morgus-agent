-- Creator Economy Migration
-- Adds tables for marketplace, knowledge base, and MCP exports

-- ============================================
-- KNOWLEDGE BASE TABLES
-- ============================================

-- Knowledge items for Morgys
CREATE TABLE IF NOT EXISTS morgy_knowledge (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  morgy_id UUID NOT NULL REFERENCES morgys(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  source_type TEXT NOT NULL CHECK (source_type IN ('file', 'website', 'text', 'data_source')),
  source_url TEXT,
  chunks INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Embeddings for semantic search
CREATE TABLE IF NOT EXISTS morgy_knowledge_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  knowledge_id UUID NOT NULL REFERENCES morgy_knowledge(id) ON DELETE CASCADE,
  chunk_index INTEGER NOT NULL,
  chunk_text TEXT NOT NULL,
  embedding vector(1536), -- OpenAI ada-002 dimension
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for knowledge
CREATE INDEX IF NOT EXISTS idx_morgy_knowledge_morgy_id ON morgy_knowledge(morgy_id);
CREATE INDEX IF NOT EXISTS idx_morgy_knowledge_source_type ON morgy_knowledge(source_type);
CREATE INDEX IF NOT EXISTS idx_morgy_knowledge_embeddings_knowledge_id ON morgy_knowledge_embeddings(knowledge_id);

-- Enable vector similarity search
CREATE INDEX IF NOT EXISTS idx_morgy_knowledge_embeddings_vector 
  ON morgy_knowledge_embeddings USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- ============================================
-- MARKETPLACE TABLES
-- ============================================

-- Marketplace listings
CREATE TABLE IF NOT EXISTS marketplace_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  morgy_id UUID NOT NULL REFERENCES morgys(id) ON DELETE CASCADE,
  creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Pricing
  pricing_model TEXT NOT NULL CHECK (pricing_model IN ('free', 'one-time', 'monthly', 'annual')),
  price DECIMAL(10, 2) DEFAULT 0,
  
  -- Visibility
  visibility TEXT NOT NULL DEFAULT 'public' CHECK (visibility IN ('public', 'unlisted', 'private')),
  
  -- License
  license_personal_use BOOLEAN DEFAULT TRUE,
  license_commercial_use BOOLEAN DEFAULT FALSE,
  license_resale BOOLEAN DEFAULT FALSE,
  license_modification BOOLEAN DEFAULT FALSE,
  
  -- Stats
  views INTEGER DEFAULT 0,
  purchases INTEGER DEFAULT 0,
  rating DECIMAL(3, 2) DEFAULT 0,
  reviews INTEGER DEFAULT 0,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'delisted')),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(morgy_id)
);

-- Marketplace purchases
CREATE TABLE IF NOT EXISTS marketplace_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES marketplace_listings(id) ON DELETE CASCADE,
  buyer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Purchase details
  price_paid DECIMAL(10, 2) NOT NULL,
  pricing_model TEXT NOT NULL,
  
  -- Payment
  payment_intent_id TEXT,
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded')),
  
  -- Cloned Morgy
  cloned_morgy_id UUID REFERENCES morgys(id) ON DELETE SET NULL,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Marketplace reviews
CREATE TABLE IF NOT EXISTS marketplace_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES marketplace_listings(id) ON DELETE CASCADE,
  buyer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  purchase_id UUID NOT NULL REFERENCES marketplace_purchases(id) ON DELETE CASCADE,
  
  -- Review
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(purchase_id)
);

-- Creator analytics (materialized view for performance)
CREATE MATERIALIZED VIEW IF NOT EXISTS creator_analytics AS
SELECT 
  ml.creator_id,
  COUNT(DISTINCT ml.id) as total_listings,
  COUNT(DISTINCT mp.id) as total_sales,
  COALESCE(SUM(mp.price_paid), 0) as total_revenue,
  COALESCE(SUM(mp.price_paid * 0.70), 0) as total_earnings,
  COALESCE(AVG(mr.rating), 0) as average_rating,
  COUNT(DISTINCT mr.id) as total_reviews,
  CASE 
    WHEN COUNT(DISTINCT mp.id) >= 100 THEN 'platinum'
    WHEN COUNT(DISTINCT mp.id) >= 50 THEN 'gold'
    WHEN COUNT(DISTINCT mp.id) >= 10 THEN 'silver'
    ELSE 'bronze'
  END as tier
FROM marketplace_listings ml
LEFT JOIN marketplace_purchases mp ON ml.id = mp.listing_id AND mp.status = 'completed'
LEFT JOIN marketplace_reviews mr ON ml.id = mr.listing_id
GROUP BY ml.creator_id;

-- Indexes for marketplace
CREATE INDEX IF NOT EXISTS idx_marketplace_listings_creator_id ON marketplace_listings(creator_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_listings_status ON marketplace_listings(status);
CREATE INDEX IF NOT EXISTS idx_marketplace_listings_pricing_model ON marketplace_listings(pricing_model);
CREATE INDEX IF NOT EXISTS idx_marketplace_purchases_buyer_id ON marketplace_purchases(buyer_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_purchases_listing_id ON marketplace_purchases(listing_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_reviews_listing_id ON marketplace_reviews(listing_id);

-- ============================================
-- MCP EXPORT TABLES
-- ============================================

-- MCP exports
CREATE TABLE IF NOT EXISTS mcp_exports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  morgy_id UUID NOT NULL REFERENCES morgys(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Export config
  include_knowledge BOOLEAN DEFAULT TRUE,
  include_templates BOOLEAN DEFAULT TRUE,
  share_with_team BOOLEAN DEFAULT FALSE,
  
  -- Share link
  share_id TEXT UNIQUE,
  share_url TEXT,
  
  -- Stats
  downloads INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE
);

-- MCP export downloads (track who imported)
CREATE TABLE IF NOT EXISTS mcp_export_downloads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  export_id UUID NOT NULL REFERENCES mcp_exports(id) ON DELETE CASCADE,
  downloaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for MCP exports
CREATE INDEX IF NOT EXISTS idx_mcp_exports_morgy_id ON mcp_exports(morgy_id);
CREATE INDEX IF NOT EXISTS idx_mcp_exports_user_id ON mcp_exports(user_id);
CREATE INDEX IF NOT EXISTS idx_mcp_exports_share_id ON mcp_exports(share_id);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS
ALTER TABLE morgy_knowledge ENABLE ROW LEVEL SECURITY;
ALTER TABLE morgy_knowledge_embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE mcp_exports ENABLE ROW LEVEL SECURITY;
ALTER TABLE mcp_export_downloads ENABLE ROW LEVEL SECURITY;

-- Knowledge policies
CREATE POLICY "Users can view their own Morgy knowledge"
  ON morgy_knowledge FOR SELECT
  USING (morgy_id IN (SELECT id FROM morgys WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert knowledge for their Morgys"
  ON morgy_knowledge FOR INSERT
  WITH CHECK (morgy_id IN (SELECT id FROM morgys WHERE user_id = auth.uid()));

CREATE POLICY "Users can update their own Morgy knowledge"
  ON morgy_knowledge FOR UPDATE
  USING (morgy_id IN (SELECT id FROM morgys WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete their own Morgy knowledge"
  ON morgy_knowledge FOR DELETE
  USING (morgy_id IN (SELECT id FROM morgys WHERE user_id = auth.uid()));

-- Marketplace listing policies
CREATE POLICY "Anyone can view active public listings"
  ON marketplace_listings FOR SELECT
  USING (status = 'active' AND visibility = 'public');

CREATE POLICY "Creators can view their own listings"
  ON marketplace_listings FOR SELECT
  USING (creator_id = auth.uid());

CREATE POLICY "Creators can create listings"
  ON marketplace_listings FOR INSERT
  WITH CHECK (creator_id = auth.uid());

CREATE POLICY "Creators can update their own listings"
  ON marketplace_listings FOR UPDATE
  USING (creator_id = auth.uid());

CREATE POLICY "Creators can delete their own listings"
  ON marketplace_listings FOR DELETE
  USING (creator_id = auth.uid());

-- Purchase policies
CREATE POLICY "Buyers can view their own purchases"
  ON marketplace_purchases FOR SELECT
  USING (buyer_id = auth.uid());

CREATE POLICY "Creators can view purchases of their listings"
  ON marketplace_purchases FOR SELECT
  USING (listing_id IN (SELECT id FROM marketplace_listings WHERE creator_id = auth.uid()));

-- Review policies
CREATE POLICY "Anyone can view reviews"
  ON marketplace_reviews FOR SELECT
  USING (true);

CREATE POLICY "Buyers can create reviews for their purchases"
  ON marketplace_reviews FOR INSERT
  WITH CHECK (buyer_id = auth.uid() AND purchase_id IN (SELECT id FROM marketplace_purchases WHERE buyer_id = auth.uid()));

-- MCP export policies
CREATE POLICY "Users can view their own exports"
  ON mcp_exports FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can create exports for their Morgys"
  ON mcp_exports FOR INSERT
  WITH CHECK (user_id = auth.uid() AND morgy_id IN (SELECT id FROM morgys WHERE user_id = auth.uid()));

-- ============================================
-- FUNCTIONS
-- ============================================

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_morgy_knowledge_updated_at
  BEFORE UPDATE ON morgy_knowledge
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_marketplace_listings_updated_at
  BEFORE UPDATE ON marketplace_listings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_marketplace_reviews_updated_at
  BEFORE UPDATE ON marketplace_reviews
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Refresh creator analytics (call periodically)
CREATE OR REPLACE FUNCTION refresh_creator_analytics()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW creator_analytics;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- SEED DATA (Optional)
-- ============================================

-- Add some default knowledge to starter Morgys (if they exist)
-- This will be handled by the application

COMMENT ON TABLE morgy_knowledge IS 'Knowledge base items for Morgys';
COMMENT ON TABLE marketplace_listings IS 'Marketplace listings for selling Morgys';
COMMENT ON TABLE marketplace_purchases IS 'Purchase history for marketplace';
COMMENT ON TABLE mcp_exports IS 'MCP export configurations and share links';
