-- Morgy Learnings Migration
-- Enables individual Morgys to learn domain-specific insights
-- Created: December 28, 2025

-- ============================================
-- MORGY LEARNINGS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS morgy_learnings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  morgy_id UUID NOT NULL REFERENCES morgys(id) ON DELETE CASCADE,
  
  -- Learning details
  title TEXT NOT NULL,
  learning TEXT NOT NULL,
  domain TEXT, -- 'finance', 'healthcare', 'legal', 'coding', 'writing', etc.
  learning_type TEXT DEFAULT 'insight' CHECK (learning_type IN (
    'insight',      -- General insight or pattern
    'best_practice', -- Recommended approach
    'warning',      -- Things to avoid
    'preference',   -- User preference pattern
    'optimization'  -- Performance improvement
  )),
  
  -- Approval workflow
  proposed_during_session UUID, -- conversation_id where this was proposed
  proposed_at TIMESTAMPTZ DEFAULT NOW(),
  approved BOOLEAN DEFAULT false,
  approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  rejection_reason TEXT,
  
  -- Usage tracking
  times_applied INTEGER DEFAULT 0,
  user_feedback_positive INTEGER DEFAULT 0,
  user_feedback_negative INTEGER DEFAULT 0,
  user_feedback_neutral INTEGER DEFAULT 0,
  
  -- Calculated metrics
  feedback_score FLOAT GENERATED ALWAYS AS (
    CASE 
      WHEN (user_feedback_positive + user_feedback_negative + user_feedback_neutral) > 0 
      THEN (user_feedback_positive::FLOAT - user_feedback_negative::FLOAT) / 
           (user_feedback_positive + user_feedback_negative + user_feedback_neutral)
      ELSE 0 
    END
  ) STORED,
  
  -- Searchability
  embedding VECTOR(1536),
  keywords TEXT[] DEFAULT '{}',
  
  -- Metadata
  confidence_score FLOAT DEFAULT 0.5 CHECK (confidence_score >= 0 AND confidence_score <= 1),
  applies_to_all_users BOOLEAN DEFAULT true, -- If false, learning is user-specific
  specific_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Context
  example_query TEXT, -- Example query that led to this learning
  example_response TEXT, -- Example response that demonstrated the learning
  
  -- Lifecycle
  is_active BOOLEAN DEFAULT true,
  archived_at TIMESTAMPTZ,
  archived_reason TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_morgy_learnings_morgy ON morgy_learnings(morgy_id);
CREATE INDEX idx_morgy_learnings_approved ON morgy_learnings(approved) WHERE approved = true AND is_active = true;
CREATE INDEX idx_morgy_learnings_embedding ON morgy_learnings USING ivfflat (embedding vector_cosine_ops);
CREATE INDEX idx_morgy_learnings_domain ON morgy_learnings(domain);
CREATE INDEX idx_morgy_learnings_feedback_score ON morgy_learnings(feedback_score DESC) WHERE approved = true AND is_active = true;
CREATE INDEX idx_morgy_learnings_user ON morgy_learnings(specific_user_id) WHERE specific_user_id IS NOT NULL;
CREATE INDEX idx_morgy_learnings_created ON morgy_learnings(created_at DESC);

-- ============================================
-- MORGY LEARNING APPLICATIONS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS morgy_learning_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  learning_id UUID NOT NULL REFERENCES morgy_learnings(id) ON DELETE CASCADE,
  morgy_id UUID NOT NULL REFERENCES morgys(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  conversation_id UUID,
  
  -- Feedback
  user_feedback TEXT CHECK (user_feedback IN ('positive', 'negative', 'neutral')),
  feedback_comment TEXT,
  
  applied_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_morgy_learning_applications_learning ON morgy_learning_applications(learning_id);
CREATE INDEX idx_morgy_learning_applications_morgy ON morgy_learning_applications(morgy_id);
CREATE INDEX idx_morgy_learning_applications_user ON morgy_learning_applications(user_id);
CREATE INDEX idx_morgy_learning_applications_conversation ON morgy_learning_applications(conversation_id);

-- ============================================
-- CONVERSATIONS TABLE (for context)
-- ============================================

CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  morgy_id UUID REFERENCES morgys(id) ON DELETE SET NULL,
  
  -- Conversation metadata
  title TEXT,
  summary TEXT,
  message_count INTEGER DEFAULT 0,
  
  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived', 'deleted')),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_message_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_conversations_user ON conversations(user_id);
CREATE INDEX idx_conversations_morgy ON conversations(morgy_id);
CREATE INDEX idx_conversations_last_message ON conversations(last_message_at DESC);
CREATE INDEX idx_conversations_status ON conversations(status);

-- ============================================
-- CONVERSATION MESSAGES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS conversation_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  
  -- Message details
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  tokens_used INTEGER,
  model_used TEXT,
  
  -- Learning context
  applied_learnings UUID[], -- Array of learning IDs applied in this response
  proposed_learning_id UUID REFERENCES morgy_learnings(id) ON DELETE SET NULL,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_conversation_messages_conversation ON conversation_messages(conversation_id);
CREATE INDEX idx_conversation_messages_created ON conversation_messages(created_at);
CREATE INDEX idx_conversation_messages_proposed_learning ON conversation_messages(proposed_learning_id) WHERE proposed_learning_id IS NOT NULL;

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE morgy_learnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE morgy_learning_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_messages ENABLE ROW LEVEL SECURITY;

-- Users can read learnings for Morgys they own or public Morgys
CREATE POLICY morgy_learnings_read_policy ON morgy_learnings
  FOR SELECT 
  USING (
    auth.role() = 'authenticated' AND (
      approved = true OR
      morgy_id IN (SELECT id FROM morgys WHERE user_id = auth.uid())
    )
  );

-- Morgy owners can insert learnings
CREATE POLICY morgy_learnings_insert_policy ON morgy_learnings
  FOR INSERT 
  WITH CHECK (
    auth.role() = 'authenticated' AND
    morgy_id IN (SELECT id FROM morgys WHERE user_id = auth.uid())
  );

-- Morgy owners can update their learnings
CREATE POLICY morgy_learnings_update_policy ON morgy_learnings
  FOR UPDATE 
  USING (
    auth.role() = 'authenticated' AND
    morgy_id IN (SELECT id FROM morgys WHERE user_id = auth.uid())
  );

-- Users can read their own learning applications
CREATE POLICY morgy_learning_applications_read_policy ON morgy_learning_applications
  FOR SELECT 
  USING (auth.role() = 'authenticated' AND user_id = auth.uid());

-- Users can insert learning applications
CREATE POLICY morgy_learning_applications_insert_policy ON morgy_learning_applications
  FOR INSERT 
  WITH CHECK (auth.role() = 'authenticated' AND user_id = auth.uid());

-- Users can read their own conversations
CREATE POLICY conversations_read_policy ON conversations
  FOR SELECT 
  USING (auth.role() = 'authenticated' AND user_id = auth.uid());

-- Users can create their own conversations
CREATE POLICY conversations_insert_policy ON conversations
  FOR INSERT 
  WITH CHECK (auth.role() = 'authenticated' AND user_id = auth.uid());

-- Users can update their own conversations
CREATE POLICY conversations_update_policy ON conversations
  FOR UPDATE 
  USING (auth.role() = 'authenticated' AND user_id = auth.uid());

-- Users can read messages from their conversations
CREATE POLICY conversation_messages_read_policy ON conversation_messages
  FOR SELECT 
  USING (
    auth.role() = 'authenticated' AND
    conversation_id IN (SELECT id FROM conversations WHERE user_id = auth.uid())
  );

-- Users can insert messages in their conversations
CREATE POLICY conversation_messages_insert_policy ON conversation_messages
  FOR INSERT 
  WITH CHECK (
    auth.role() = 'authenticated' AND
    conversation_id IN (SELECT id FROM conversations WHERE user_id = auth.uid())
  );

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to search Morgy learnings by semantic similarity
CREATE OR REPLACE FUNCTION search_morgy_learnings(
  p_morgy_id UUID,
  query_embedding VECTOR(1536),
  p_user_id UUID DEFAULT NULL,
  match_threshold FLOAT DEFAULT 0.7,
  match_count INT DEFAULT 5
)
RETURNS TABLE(
  id UUID,
  title TEXT,
  learning TEXT,
  domain TEXT,
  similarity FLOAT,
  times_applied INTEGER,
  feedback_score FLOAT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ml.id,
    ml.title,
    ml.learning,
    ml.domain,
    1 - (ml.embedding <=> query_embedding) AS similarity,
    ml.times_applied,
    ml.feedback_score
  FROM morgy_learnings ml
  WHERE 
    ml.morgy_id = p_morgy_id
    AND ml.approved = true 
    AND ml.is_active = true
    AND (ml.applies_to_all_users = true OR ml.specific_user_id = p_user_id)
    AND 1 - (ml.embedding <=> query_embedding) > match_threshold
  ORDER BY ml.embedding <=> query_embedding
  LIMIT match_count;
END;
$$ LANGUAGE plpgsql;

-- Function to record learning application
CREATE OR REPLACE FUNCTION record_morgy_learning_application(
  p_learning_id UUID,
  p_morgy_id UUID,
  p_user_id UUID,
  p_conversation_id UUID DEFAULT NULL,
  p_feedback TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  -- Insert application record
  INSERT INTO morgy_learning_applications (
    learning_id,
    morgy_id,
    user_id,
    conversation_id,
    user_feedback
  ) VALUES (
    p_learning_id,
    p_morgy_id,
    p_user_id,
    p_conversation_id,
    p_feedback
  );
  
  -- Update learning stats
  UPDATE morgy_learnings
  SET 
    times_applied = times_applied + 1,
    user_feedback_positive = user_feedback_positive + CASE WHEN p_feedback = 'positive' THEN 1 ELSE 0 END,
    user_feedback_negative = user_feedback_negative + CASE WHEN p_feedback = 'negative' THEN 1 ELSE 0 END,
    user_feedback_neutral = user_feedback_neutral + CASE WHEN p_feedback = 'neutral' THEN 1 ELSE 0 END,
    updated_at = NOW()
  WHERE id = p_learning_id;
END;
$$ LANGUAGE plpgsql;

-- Function to approve a Morgy learning
CREATE OR REPLACE FUNCTION approve_morgy_learning(
  p_learning_id UUID,
  p_approver_id UUID
)
RETURNS VOID AS $$
BEGIN
  UPDATE morgy_learnings
  SET 
    approved = true,
    approved_by = p_approver_id,
    approved_at = NOW(),
    updated_at = NOW()
  WHERE id = p_learning_id;
END;
$$ LANGUAGE plpgsql;

-- Function to reject a Morgy learning
CREATE OR REPLACE FUNCTION reject_morgy_learning(
  p_learning_id UUID,
  p_reason TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  UPDATE morgy_learnings
  SET 
    is_active = false,
    rejection_reason = p_reason,
    updated_at = NOW()
  WHERE id = p_learning_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get Morgy learning stats
CREATE OR REPLACE FUNCTION get_morgy_learning_stats(p_morgy_id UUID)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'total_learnings', COUNT(*),
    'approved_learnings', COUNT(*) FILTER (WHERE approved = true),
    'pending_learnings', COUNT(*) FILTER (WHERE approved = false AND is_active = true),
    'total_applications', SUM(times_applied),
    'avg_feedback_score', AVG(feedback_score) FILTER (WHERE approved = true),
    'top_domains', (
      SELECT jsonb_agg(domain)
      FROM (
        SELECT domain, COUNT(*) as cnt
        FROM morgy_learnings
        WHERE morgy_id = p_morgy_id AND approved = true AND domain IS NOT NULL
        GROUP BY domain
        ORDER BY cnt DESC
        LIMIT 5
      ) top_domains
    )
  ) INTO result
  FROM morgy_learnings
  WHERE morgy_id = p_morgy_id;
  
  RETURN COALESCE(result, '{}'::JSONB);
END;
$$ LANGUAGE plpgsql;

-- Function to archive low-performing Morgy learnings
CREATE OR REPLACE FUNCTION archive_low_performing_morgy_learnings(
  p_morgy_id UUID,
  p_min_applications INT DEFAULT 10,
  p_max_feedback_score FLOAT DEFAULT -0.3
)
RETURNS INTEGER AS $$
DECLARE
  archived_count INTEGER;
BEGIN
  UPDATE morgy_learnings
  SET 
    is_active = false,
    archived_at = NOW(),
    archived_reason = 'Low feedback score after ' || times_applied || ' applications'
  WHERE 
    morgy_id = p_morgy_id
    AND approved = true
    AND is_active = true
    AND times_applied >= p_min_applications
    AND feedback_score < p_max_feedback_score;
  
  GET DIAGNOSTICS archived_count = ROW_COUNT;
  RETURN archived_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- TRIGGERS
-- ============================================

-- Trigger to update updated_at timestamp on morgy_learnings
CREATE OR REPLACE FUNCTION update_morgy_learnings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_morgy_learnings_updated_at
  BEFORE UPDATE ON morgy_learnings
  FOR EACH ROW
  EXECUTE FUNCTION update_morgy_learnings_updated_at();

-- Trigger to update conversation updated_at and last_message_at
CREATE OR REPLACE FUNCTION update_conversation_on_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversations
  SET 
    message_count = message_count + 1,
    updated_at = NOW(),
    last_message_at = NOW()
  WHERE id = NEW.conversation_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_conversation_on_message
  AFTER INSERT ON conversation_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_on_message();

-- Grant permissions
GRANT SELECT ON morgy_learnings TO authenticated;
GRANT INSERT ON morgy_learnings TO authenticated;
GRANT UPDATE ON morgy_learnings TO authenticated;
GRANT SELECT ON morgy_learning_applications TO authenticated;
GRANT INSERT ON morgy_learning_applications TO authenticated;
GRANT SELECT, INSERT, UPDATE ON conversations TO authenticated;
GRANT SELECT, INSERT ON conversation_messages TO authenticated;

-- Add comments
COMMENT ON TABLE morgy_learnings IS 'Stores domain-specific learnings for individual Morgys. Each Morgy learns from its interactions and improves over time.';
COMMENT ON TABLE morgy_learning_applications IS 'Tracks when and where Morgy learnings are applied, with user feedback for continuous improvement.';
COMMENT ON TABLE conversations IS 'Stores conversation sessions between users and Morgys, enabling conversation history and resumption.';
COMMENT ON TABLE conversation_messages IS 'Stores individual messages within conversations, including learning context and metadata.';
