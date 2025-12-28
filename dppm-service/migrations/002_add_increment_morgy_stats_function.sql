-- Add function to increment Morgy stats atomically
-- This is used by webhooks to update purchase counts and revenue

CREATE OR REPLACE FUNCTION increment_morgy_stats(
  p_morgy_id UUID,
  p_purchases INTEGER DEFAULT 0,
  p_revenue DECIMAL(10,2) DEFAULT 0
)
RETURNS VOID AS $$
BEGIN
  UPDATE morgys
  SET
    total_purchases = total_purchases + p_purchases,
    total_revenue = total_revenue + p_revenue,
    updated_at = NOW()
  WHERE id = p_morgy_id;
END;
$$ LANGUAGE plpgsql;

-- Add comment
COMMENT ON FUNCTION increment_morgy_stats IS 'Atomically increment Morgy purchase count and revenue';
