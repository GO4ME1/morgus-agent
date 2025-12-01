-- Message Ratings Table
-- Stores user feedback on agent responses for training and improvement

CREATE TABLE IF NOT EXISTS message_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id TEXT NOT NULL,
  rating TEXT NOT NULL CHECK (rating IN ('good', 'bad', 'glitch')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Optional fields for future enhancement
  user_id UUID,
  feedback_text TEXT,
  context JSONB
);

-- Index for faster queries by message
CREATE INDEX IF NOT EXISTS idx_message_ratings_message_id ON message_ratings(message_id);

-- Index for analytics queries
CREATE INDEX IF NOT EXISTS idx_message_ratings_rating ON message_ratings(rating);
CREATE INDEX IF NOT EXISTS idx_message_ratings_created_at ON message_ratings(created_at DESC);

-- Comments
COMMENT ON TABLE message_ratings IS 'User feedback ratings on agent responses';
COMMENT ON COLUMN message_ratings.rating IS 'Rating type: good (👍), bad (👎), or glitch (🍅)';
COMMENT ON COLUMN message_ratings.feedback_text IS 'Optional text feedback from user';
COMMENT ON COLUMN message_ratings.context IS 'Optional JSON context about the rating';
