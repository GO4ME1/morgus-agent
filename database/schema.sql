-- Morgus Database Schema for Supabase

-- Enable pgvector extension for embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- Tasks table
CREATE TABLE IF NOT EXISTS tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    phase TEXT DEFAULT 'RESEARCH',
    model TEXT DEFAULT 'gpt-4',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    error_message TEXT
);

-- Task steps table (execution log)
CREATE TABLE IF NOT EXISTS task_steps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    phase TEXT NOT NULL,
    type TEXT NOT NULL,
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Artifacts table (outputs)
CREATE TABLE IF NOT EXISTS artifacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    name TEXT NOT NULL,
    url TEXT,
    path TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Knowledge base table (for vector memory)
CREATE TABLE IF NOT EXISTS knowledge (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content TEXT NOT NULL,
    embedding vector(1536),  -- OpenAI ada-002 embedding dimension
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON tasks(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_task_steps_task_id ON task_steps(task_id);
CREATE INDEX IF NOT EXISTS idx_task_steps_created_at ON task_steps(created_at);
CREATE INDEX IF NOT EXISTS idx_artifacts_task_id ON artifacts(task_id);

-- Vector similarity search index (for knowledge base)
CREATE INDEX IF NOT EXISTS idx_knowledge_embedding ON knowledge 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function for vector similarity search
CREATE OR REPLACE FUNCTION match_knowledge(
    query_embedding vector(1536),
    match_threshold float DEFAULT 0.7,
    match_count int DEFAULT 5
)
RETURNS TABLE (
    id UUID,
    content TEXT,
    similarity float,
    metadata JSONB
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        knowledge.id,
        knowledge.content,
        1 - (knowledge.embedding <=> query_embedding) AS similarity,
        knowledge.metadata
    FROM knowledge
    WHERE 1 - (knowledge.embedding <=> query_embedding) > match_threshold
    ORDER BY knowledge.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;

-- Row Level Security (RLS) policies
-- Enable RLS on all tables
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE artifacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge ENABLE ROW LEVEL SECURITY;

-- Allow service role to do everything
CREATE POLICY "Service role can do everything on tasks" ON tasks
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can do everything on task_steps" ON task_steps
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can do everything on artifacts" ON artifacts
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can do everything on knowledge" ON knowledge
    FOR ALL USING (auth.role() = 'service_role');

-- Allow anon/authenticated users to read (for web console)
CREATE POLICY "Anyone can read tasks" ON tasks
    FOR SELECT USING (true);

CREATE POLICY "Anyone can read task_steps" ON task_steps
    FOR SELECT USING (true);

CREATE POLICY "Anyone can read artifacts" ON artifacts
    FOR SELECT USING (true);

-- Allow anon/authenticated users to create tasks
CREATE POLICY "Anyone can create tasks" ON tasks
    FOR INSERT WITH CHECK (true);

COMMENT ON TABLE tasks IS 'Main tasks table storing high-level task information';
COMMENT ON TABLE task_steps IS 'Execution log for each task, tracking all steps and tool calls';
COMMENT ON TABLE artifacts IS 'Outputs and artifacts produced by tasks';
COMMENT ON TABLE knowledge IS 'Vector-based knowledge base for long-term memory';
