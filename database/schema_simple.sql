-- Morgus Database Schema (Simplified)

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

-- Task steps table
CREATE TABLE IF NOT EXISTS task_steps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    phase TEXT NOT NULL,
    type TEXT NOT NULL,
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Artifacts table
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

-- Indexes
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON tasks(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_task_steps_task_id ON task_steps(task_id);
CREATE INDEX IF NOT EXISTS idx_artifacts_task_id ON artifacts(task_id);

-- Update trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS policies
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE artifacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access tasks" ON tasks FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access task_steps" ON task_steps FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access artifacts" ON artifacts FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Public read tasks" ON tasks FOR SELECT USING (true);
CREATE POLICY "Public read task_steps" ON task_steps FOR SELECT USING (true);
CREATE POLICY "Public read artifacts" ON artifacts FOR SELECT USING (true);
CREATE POLICY "Public create tasks" ON tasks FOR INSERT WITH CHECK (true);
