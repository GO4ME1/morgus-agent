-- ===========================
-- MORGUS V2 MEMORY SYSTEM
-- Migration: 002_memory_system.sql
-- Description: Comprehensive memory architecture including experiences, workflows, knowledge docs, notebooks, and Morgy training
-- ===========================

-- ===========================
-- 1. EXPERIENCES TABLE
-- Stores trajectories of past tasks with reflections
-- ===========================

CREATE TABLE IF NOT EXISTS public.experiences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  task_id UUID, -- Reference to the original task if applicable
  goal TEXT NOT NULL, -- The high-level goal of the task
  steps JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of steps taken [{action, tool, result, timestamp}]
  outcome TEXT, -- Final outcome (success, failure, partial)
  reflection TEXT, -- Post-execution reflection notes
  tags TEXT[] DEFAULT ARRAY[]::TEXT[], -- Tags for categorization
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast user queries
CREATE INDEX IF NOT EXISTS idx_experiences_user_id ON public.experiences(user_id);
CREATE INDEX IF NOT EXISTS idx_experiences_created_at ON public.experiences(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_experiences_tags ON public.experiences USING GIN(tags);

-- RLS policies
ALTER TABLE public.experiences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own experiences"
  ON public.experiences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own experiences"
  ON public.experiences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own experiences"
  ON public.experiences FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own experiences"
  ON public.experiences FOR DELETE
  USING (auth.uid() = user_id);

-- ===========================
-- 2. WORKFLOWS TABLE
-- Stores reusable procedures learned from past tasks
-- ===========================

CREATE TABLE IF NOT EXISTS public.workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  triggers TEXT[] DEFAULT ARRAY[]::TEXT[], -- Keywords/phrases that trigger this workflow
  steps JSONB NOT NULL DEFAULT '[]'::jsonb, -- Structured workflow steps
  tools_required TEXT[] DEFAULT ARRAY[]::TEXT[], -- Tools needed for this workflow
  morgy_recommended TEXT, -- Recommended Morgy for this workflow (bill, sally, dev, research)
  success_count INTEGER DEFAULT 0, -- Number of successful executions
  failure_count INTEGER DEFAULT 0, -- Number of failed executions
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast user queries
CREATE INDEX IF NOT EXISTS idx_workflows_user_id ON public.workflows(user_id);
CREATE INDEX IF NOT EXISTS idx_workflows_triggers ON public.workflows USING GIN(triggers);

-- RLS policies
ALTER TABLE public.workflows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own workflows"
  ON public.workflows FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own workflows"
  ON public.workflows FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own workflows"
  ON public.workflows FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own workflows"
  ON public.workflows FOR DELETE
  USING (auth.uid() = user_id);

-- ===========================
-- 3. KNOWLEDGE_DOCS TABLE
-- Stores user-provided documents for RAG
-- ===========================

CREATE TABLE IF NOT EXISTS public.knowledge_docs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  source_url TEXT, -- Original URL if fetched from web
  file_path TEXT, -- File path if uploaded
  embedding vector(1536), -- OpenAI ada-002 embedding dimension
  metadata JSONB DEFAULT '{}'::jsonb, -- Additional metadata (file type, size, etc.)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for vector similarity search
CREATE INDEX IF NOT EXISTS idx_knowledge_docs_embedding ON public.knowledge_docs USING ivfflat (embedding vector_cosine_ops);
CREATE INDEX IF NOT EXISTS idx_knowledge_docs_user_id ON public.knowledge_docs(user_id);

-- RLS policies
ALTER TABLE public.knowledge_docs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own knowledge docs"
  ON public.knowledge_docs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own knowledge docs"
  ON public.knowledge_docs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own knowledge docs"
  ON public.knowledge_docs FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own knowledge docs"
  ON public.knowledge_docs FOR DELETE
  USING (auth.uid() = user_id);

-- ===========================
-- 4. NOTEBOOKS TABLE
-- Stores NotebookLM-generated structured knowledge
-- ===========================

CREATE TABLE IF NOT EXISTS public.notebooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  purpose TEXT NOT NULL, -- 'deep_research', 'infographic_generation', 'roadmap', etc.
  title TEXT,
  summary TEXT,
  raw_notebook TEXT, -- Full raw notebook content from NotebookLM
  sections JSONB DEFAULT '[]'::jsonb, -- Structured sections [{title, bullets}]
  mindmap JSONB, -- Mind map structure
  flowchart JSONB, -- Flowchart structure
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast user queries
CREATE INDEX IF NOT EXISTS idx_notebooks_user_id ON public.notebooks(user_id);
CREATE INDEX IF NOT EXISTS idx_notebooks_purpose ON public.notebooks(purpose);
CREATE INDEX IF NOT EXISTS idx_notebooks_created_at ON public.notebooks(created_at DESC);

-- RLS policies
ALTER TABLE public.notebooks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notebooks"
  ON public.notebooks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own notebooks"
  ON public.notebooks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notebooks"
  ON public.notebooks FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notebooks"
  ON public.notebooks FOR DELETE
  USING (auth.uid() = user_id);

-- ===========================
-- 5. NOTEBOOK_ASSETS TABLE
-- Stores visual assets generated by NotebookLM
-- ===========================

CREATE TABLE IF NOT EXISTS public.notebook_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notebook_id UUID NOT NULL REFERENCES public.notebooks(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'infographic_svg', 'image_png', 'pdf', etc.
  label TEXT,
  content TEXT, -- Inline SVG or URL to stored asset
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast notebook queries
CREATE INDEX IF NOT EXISTS idx_notebook_assets_notebook_id ON public.notebook_assets(notebook_id);

-- RLS policies
ALTER TABLE public.notebook_assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view assets of their own notebooks"
  ON public.notebook_assets FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.notebooks
      WHERE notebooks.id = notebook_assets.notebook_id
      AND notebooks.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert assets for their own notebooks"
  ON public.notebook_assets FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.notebooks
      WHERE notebooks.id = notebook_assets.notebook_id
      AND notebooks.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete assets of their own notebooks"
  ON public.notebook_assets FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.notebooks
      WHERE notebooks.id = notebook_assets.notebook_id
      AND notebooks.user_id = auth.uid()
    )
  );

-- ===========================
-- 6. MORGY_NOTEBOOKS TABLE
-- Links notebooks to Morgys for training
-- ===========================

CREATE TABLE IF NOT EXISTS public.morgy_notebooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  morgy_id TEXT NOT NULL, -- 'bill', 'sally', 'dev', 'research'
  notebook_id UUID NOT NULL REFERENCES public.notebooks(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast queries
CREATE INDEX IF NOT EXISTS idx_morgy_notebooks_user_id ON public.morgy_notebooks(user_id);
CREATE INDEX IF NOT EXISTS idx_morgy_notebooks_morgy_id ON public.morgy_notebooks(morgy_id);
CREATE INDEX IF NOT EXISTS idx_morgy_notebooks_notebook_id ON public.morgy_notebooks(notebook_id);

-- RLS policies
ALTER TABLE public.morgy_notebooks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own morgy notebook links"
  ON public.morgy_notebooks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own morgy notebook links"
  ON public.morgy_notebooks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own morgy notebook links"
  ON public.morgy_notebooks FOR DELETE
  USING (auth.uid() = user_id);

-- ===========================
-- 7. HELPER FUNCTIONS
-- ===========================

-- Function to search knowledge docs by similarity
CREATE OR REPLACE FUNCTION search_knowledge_docs(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 10,
  filter_user_id uuid DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  title text,
  content text,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    knowledge_docs.id,
    knowledge_docs.title,
    knowledge_docs.content,
    1 - (knowledge_docs.embedding <=> query_embedding) as similarity
  FROM public.knowledge_docs
  WHERE 
    (filter_user_id IS NULL OR knowledge_docs.user_id = filter_user_id)
    AND 1 - (knowledge_docs.embedding <=> query_embedding) > match_threshold
  ORDER BY knowledge_docs.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Function to get notebooks for a specific Morgy
CREATE OR REPLACE FUNCTION get_morgy_notebooks(
  p_user_id uuid,
  p_morgy_id text
)
RETURNS TABLE (
  notebook_id uuid,
  title text,
  summary text,
  purpose text
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    n.id,
    n.title,
    n.summary,
    n.purpose
  FROM public.notebooks n
  INNER JOIN public.morgy_notebooks mn ON mn.notebook_id = n.id
  WHERE mn.user_id = p_user_id
    AND mn.morgy_id = p_morgy_id
  ORDER BY n.created_at DESC;
END;
$$;

-- ===========================
-- MIGRATION COMPLETE
-- ===========================
