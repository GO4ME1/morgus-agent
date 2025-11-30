-- Minimal Morgus Schema - Guaranteed to work

-- Evaluations table
CREATE TABLE IF NOT EXISTS agent_evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID,
  input_text TEXT NOT NULL,
  output_text TEXT NOT NULL,
  feedback_type VARCHAR(20),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Thoughts table
CREATE TABLE IF NOT EXISTS thoughts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  system_prompt TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Thought messages
CREATE TABLE IF NOT EXISTS thought_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thought_id UUID NOT NULL REFERENCES thoughts(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default thought
INSERT INTO thoughts (name, description, system_prompt)
VALUES ('General Chat', 'Default conversation', 'You are Morgus, a helpful AI agent.');

SELECT 'Success!' as status;
