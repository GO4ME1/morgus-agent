-- Add metadata column to conversation_messages to store MOE competition data
ALTER TABLE conversation_messages 
ADD COLUMN IF NOT EXISTS metadata JSONB;

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_conversation_messages_metadata 
ON conversation_messages USING gin(metadata);
