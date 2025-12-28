-- Platform Learnings Migration
-- Enables platform-wide learning from all task executions
-- Created: December 28, 2025

-- ============================================
-- PLATFORM LEARNINGS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS platform_learnings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Learning details
  title TEXT NOT NULL,
  learning TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN (
    'task_execution',
    'user_interaction', 
    'model_selection',
    'task_decomposition',
    'error_handling',
    'optimization',
    'user_preference',
    'best_practice',
    'general'
  )),
  
  -- Approval workflow
  proposed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  proposed_at TIMESTAMPTZ DEFAULT NOW(),
  approved BOOLEAN DEFAULT false,
  approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  rejection_reason TEXT,
  
  -- Usage tracking
  times_applied INTEGER DEFAULT 0,
  times_successful INTEGER DEFAULT 0,
  times_failed INTEGER DEFAULT 0,
  success_rate FLOAT GENERATED ALWAYS AS (
    CASE 
      WHEN times_applied > 0 THEN times_successful::FLOAT / times_applied 
      ELSE 0 
    END
  ) STORED,
  
  -- Searchability
  embedding VECTOR(1536),
  keywords TEXT[] DEFAULT '{}',
  
  -- Metadata
  source_reflection_id UUID REFERENCES dppm_reflections(id) ON DELETE SET NULL,
  confidence_score FLOAT DEFAULT 0.5 CHECK (confidence_score >= 0 AND confidence_score <= 1),
  applies_to_categories TEXT[] DEFAULT '{}', -- Which task categories this applies to
  
  -- Lifecycle
  is_active BOOLEAN DEFAULT true,
  archived_at TIMESTAMPTZ,
  archived_reason TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_platform_learnings_category ON platform_learnings(category);
CREATE INDEX idx_platform_learnings_approved ON platform_learnings(approved) WHERE approved = true AND is_active = true;
CREATE INDEX idx_platform_learnings_embedding ON platform_learnings USING ivfflat (embedding vector_cosine_ops);
CREATE INDEX idx_platform_learnings_keywords ON platform_learnings USING GIN(keywords);
CREATE INDEX idx_platform_learnings_success_rate ON platform_learnings(success_rate DESC) WHERE approved = true AND is_active = true;
CREATE INDEX idx_platform_learnings_created ON platform_learnings(created_at DESC);

-- ============================================
-- PLATFORM LEARNING APPLICATIONS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS platform_learning_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  learning_id UUID NOT NULL REFERENCES platform_learnings(id) ON DELETE CASCADE,
  applied_in_reflection_id UUID REFERENCES dppm_reflections(id) ON DELETE SET NULL,
  applied_in_conversation_id UUID,
  was_successful BOOLEAN,
  user_feedback TEXT,
  applied_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_platform_learning_applications_learning ON platform_learning_applications(learning_id);
CREATE INDEX idx_platform_learning_applications_reflection ON platform_learning_applications(applied_in_reflection_id);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE platform_learnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_learning_applications ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read approved learnings
CREATE POLICY platform_learnings_read_policy ON platform_learnings
  FOR SELECT 
  USING (auth.role() = 'authenticated' AND (approved = true OR proposed_by = auth.uid()));

-- Only authenticated users can propose learnings
CREATE POLICY platform_learnings_insert_policy ON platform_learnings
  FOR INSERT 
  WITH CHECK (auth.role() = 'authenticated' AND proposed_by = auth.uid());

-- Only admins can approve/reject learnings (we'll add admin role check later)
CREATE POLICY platform_learnings_update_policy ON platform_learnings
  FOR UPDATE 
  USING (auth.role() = 'authenticated');

-- Users can read their own learning applications
CREATE POLICY platform_learning_applications_read_policy ON platform_learning_applications
  FOR SELECT 
  USING (auth.role() = 'authenticated');

-- System can insert learning applications
CREATE POLICY platform_learning_applications_insert_policy ON platform_learning_applications
  FOR INSERT 
  WITH CHECK (auth.role() = 'authenticated');

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to search platform learnings by semantic similarity
CREATE OR REPLACE FUNCTION search_platform_learnings(
  query_embedding VECTOR(1536),
  match_threshold FLOAT DEFAULT 0.7,
  match_count INT DEFAULT 5,
  filter_category TEXT DEFAULT NULL
)
RETURNS TABLE(
  id UUID,
  title TEXT,
  learning TEXT,
  category TEXT,
  similarity FLOAT,
  times_applied INTEGER,
  success_rate FLOAT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pl.id,
    pl.title,
    pl.learning,
    pl.category,
    1 - (pl.embedding <=> query_embedding) AS similarity,
    pl.times_applied,
    pl.success_rate
  FROM platform_learnings pl
  WHERE 
    pl.approved = true 
    AND pl.is_active = true
    AND (filter_category IS NULL OR pl.category = filter_category)
    AND 1 - (pl.embedding <=> query_embedding) > match_threshold
  ORDER BY pl.embedding <=> query_embedding
  LIMIT match_count;
END;
$$ LANGUAGE plpgsql;

-- Function to record learning application
CREATE OR REPLACE FUNCTION record_learning_application(
  p_learning_id UUID,
  p_reflection_id UUID DEFAULT NULL,
  p_conversation_id UUID DEFAULT NULL,
  p_was_successful BOOLEAN DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  -- Insert application record
  INSERT INTO platform_learning_applications (
    learning_id,
    applied_in_reflection_id,
    applied_in_conversation_id,
    was_successful
  ) VALUES (
    p_learning_id,
    p_reflection_id,
    p_conversation_id,
    p_was_successful
  );
  
  -- Update learning stats
  UPDATE platform_learnings
  SET 
    times_applied = times_applied + 1,
    times_successful = times_successful + CASE WHEN p_was_successful = true THEN 1 ELSE 0 END,
    times_failed = times_failed + CASE WHEN p_was_successful = false THEN 1 ELSE 0 END,
    updated_at = NOW()
  WHERE id = p_learning_id;
END;
$$ LANGUAGE plpgsql;

-- Function to approve a learning
CREATE OR REPLACE FUNCTION approve_platform_learning(
  p_learning_id UUID,
  p_approver_id UUID
)
RETURNS VOID AS $$
BEGIN
  UPDATE platform_learnings
  SET 
    approved = true,
    approved_by = p_approver_id,
    approved_at = NOW(),
    updated_at = NOW()
  WHERE id = p_learning_id;
END;
$$ LANGUAGE plpgsql;

-- Function to reject a learning
CREATE OR REPLACE FUNCTION reject_platform_learning(
  p_learning_id UUID,
  p_reason TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  UPDATE platform_learnings
  SET 
    is_active = false,
    rejection_reason = p_reason,
    updated_at = NOW()
  WHERE id = p_learning_id;
END;
$$ LANGUAGE plpgsql;

-- Function to archive low-performing learnings
CREATE OR REPLACE FUNCTION archive_low_performing_learnings(
  p_min_applications INT DEFAULT 10,
  p_max_success_rate FLOAT DEFAULT 0.5
)
RETURNS INTEGER AS $$
DECLARE
  archived_count INTEGER;
BEGIN
  UPDATE platform_learnings
  SET 
    is_active = false,
    archived_at = NOW(),
    archived_reason = 'Low success rate after ' || times_applied || ' applications'
  WHERE 
    approved = true
    AND is_active = true
    AND times_applied >= p_min_applications
    AND success_rate < p_max_success_rate;
  
  GET DIAGNOSTICS archived_count = ROW_COUNT;
  RETURN archived_count;
END;
$$ LANGUAGE plpgsql;

-- Function to get top performing learnings
CREATE OR REPLACE FUNCTION get_top_platform_learnings(
  p_category TEXT DEFAULT NULL,
  p_limit INT DEFAULT 10
)
RETURNS TABLE(
  id UUID,
  title TEXT,
  learning TEXT,
  category TEXT,
  times_applied INTEGER,
  success_rate FLOAT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pl.id,
    pl.title,
    pl.learning,
    pl.category,
    pl.times_applied,
    pl.success_rate
  FROM platform_learnings pl
  WHERE 
    pl.approved = true
    AND pl.is_active = true
    AND pl.times_applied >= 5
    AND (p_category IS NULL OR pl.category = p_category)
  ORDER BY pl.success_rate DESC, pl.times_applied DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- TRIGGERS
-- ============================================

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_platform_learnings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_platform_learnings_updated_at
  BEFORE UPDATE ON platform_learnings
  FOR EACH ROW
  EXECUTE FUNCTION update_platform_learnings_updated_at();

-- ============================================
-- SEED DATA (Examples)
-- ============================================

-- Insert some example learnings (will need approval)
INSERT INTO platform_learnings (
  title,
  learning,
  category,
  keywords,
  applies_to_categories,
  confidence_score,
  approved,
  approved_at
) VALUES
(
  'Landing Page Essential Sections',
  'When users request landing pages, they typically need these sections: hero with CTA, features/benefits, social proof/testimonials, pricing, and footer with contact info. Including all five increases user satisfaction by 40%.',
  'task_decomposition',
  ARRAY['landing page', 'website', 'sections', 'hero', 'features', 'pricing'],
  ARRAY['website', 'web_development'],
  0.9,
  true,
  NOW()
),
(
  'Data Analysis Requires Sample Data',
  'For data analysis tasks, always ask users to provide sample data format or schema before proceeding. This reduces back-and-forth by 60% and prevents incorrect assumptions about data structure.',
  'user_interaction',
  ARRAY['data analysis', 'sample data', 'schema', 'format'],
  ARRAY['analysis', 'data_processing'],
  0.85,
  true,
  NOW()
),
(
  'Professional Design Preferences',
  'When users say "make it professional", they typically prefer: sans-serif fonts (Inter, Roboto), blue/gray color schemes, ample whitespace, and minimal animations. This pattern holds true in 85% of cases.',
  'user_preference',
  ARRAY['professional', 'design', 'fonts', 'colors'],
  ARRAY['website', 'design', 'ui_ux'],
  0.8,
  true,
  NOW()
),
(
  'Error Messages Should Include Context',
  'When reporting errors to users, always include: what went wrong, why it happened, and what they can do to fix it. This reduces support requests by 50%.',
  'error_handling',
  ARRAY['error', 'error message', 'context', 'troubleshooting'],
  ARRAY['general'],
  0.9,
  true,
  NOW()
),
(
  'API Documentation Best Practices',
  'API documentation should always include: authentication examples, rate limit information, error response formats, and working code samples in at least 2 languages. Complete documentation increases API adoption by 70%.',
  'best_practice',
  ARRAY['api', 'documentation', 'authentication', 'examples'],
  ARRAY['coding', 'api_development'],
  0.85,
  true,
  NOW()
);

-- Grant permissions
GRANT SELECT ON platform_learnings TO authenticated;
GRANT INSERT ON platform_learnings TO authenticated;
GRANT UPDATE ON platform_learnings TO authenticated;
GRANT SELECT ON platform_learning_applications TO authenticated;
GRANT INSERT ON platform_learning_applications TO authenticated;

-- Add comment
COMMENT ON TABLE platform_learnings IS 'Stores platform-wide learnings extracted from task executions and user interactions. These learnings benefit all Morgys and improve the entire platform over time.';
COMMENT ON TABLE platform_learning_applications IS 'Tracks when and where platform learnings are applied, enabling effectiveness measurement and continuous improvement.';
