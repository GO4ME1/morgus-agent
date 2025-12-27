-- NotebookLM Scaling Migration
-- Adds support for per-user notebooks and shared notebooks

-- ============================================================================
-- 1. Add NotebookLM fields to user_profiles
-- ============================================================================

ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS notebooklm_notebook_id TEXT,
ADD COLUMN IF NOT EXISTS notebooklm_created_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS notebooklm_source_count INTEGER DEFAULT 0;

COMMENT ON COLUMN user_profiles.notebooklm_notebook_id IS 'Primary NotebookLM notebook ID for this user';
COMMENT ON COLUMN user_profiles.notebooklm_created_at IS 'When the notebook was created';
COMMENT ON COLUMN user_profiles.notebooklm_source_count IS 'Number of sources in user''s notebook';

-- ============================================================================
-- 2. Create notebooklm_notebooks table
-- ============================================================================

CREATE TABLE IF NOT EXISTS notebooklm_notebooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  notebook_id TEXT NOT NULL UNIQUE, -- NotebookLM notebook ID
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('personal', 'shared', 'public')),
  source_count INTEGER DEFAULT 0,
  max_sources INTEGER DEFAULT 50, -- NotebookLM limit
  is_archived BOOLEAN DEFAULT FALSE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE notebooklm_notebooks IS 'NotebookLM notebooks for users and teams';
COMMENT ON COLUMN notebooklm_notebooks.notebook_id IS 'NotebookLM notebook ID (from Google)';
COMMENT ON COLUMN notebooklm_notebooks.type IS 'personal (1 user), shared (team), public (all users)';
COMMENT ON COLUMN notebooklm_notebooks.is_archived IS 'Archived when full or no longer active';

CREATE INDEX idx_notebooklm_notebooks_owner ON notebooklm_notebooks(owner_user_id);
CREATE INDEX idx_notebooklm_notebooks_type ON notebooklm_notebooks(type);
CREATE INDEX idx_notebooklm_notebooks_notebook_id ON notebooklm_notebooks(notebook_id);

-- ============================================================================
-- 3. Create notebooklm_sources table
-- ============================================================================

CREATE TABLE IF NOT EXISTS notebooklm_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notebook_id UUID REFERENCES notebooklm_notebooks(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  source_type TEXT NOT NULL CHECK (source_type IN ('text', 'url', 'pdf', 'youtube', 'chat_message')),
  title TEXT NOT NULL,
  content TEXT,
  url TEXT,
  content_hash TEXT, -- For deduplication
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE notebooklm_sources IS 'Sources added to NotebookLM notebooks';
COMMENT ON COLUMN notebooklm_sources.content_hash IS 'SHA256 hash of content for deduplication';

CREATE INDEX idx_notebooklm_sources_notebook ON notebooklm_sources(notebook_id);
CREATE INDEX idx_notebooklm_sources_user ON notebooklm_sources(user_id);
CREATE INDEX idx_notebooklm_sources_type ON notebooklm_sources(source_type);
CREATE INDEX idx_notebooklm_sources_hash ON notebooklm_sources(content_hash);

-- ============================================================================
-- 4. Create notebooklm_notebook_members table (for shared notebooks)
-- ============================================================================

CREATE TABLE IF NOT EXISTS notebooklm_notebook_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notebook_id UUID REFERENCES notebooklm_notebooks(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner', 'editor', 'viewer')),
  joined_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(notebook_id, user_id)
);

COMMENT ON TABLE notebooklm_notebook_members IS 'Members of shared notebooks with roles';

CREATE INDEX idx_notebooklm_members_notebook ON notebooklm_notebook_members(notebook_id);
CREATE INDEX idx_notebooklm_members_user ON notebooklm_notebook_members(user_id);

-- ============================================================================
-- 5. Create helper functions
-- ============================================================================

-- Function: Get or create user's primary notebook
CREATE OR REPLACE FUNCTION get_user_primary_notebook(p_user_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_notebook_id TEXT;
BEGIN
  -- Check if user already has a primary notebook
  SELECT notebooklm_notebook_id INTO v_notebook_id
  FROM user_profiles
  WHERE user_id = p_user_id;
  
  IF v_notebook_id IS NOT NULL THEN
    RETURN v_notebook_id;
  END IF;
  
  -- Check if user has any personal notebook
  SELECT notebook_id INTO v_notebook_id
  FROM notebooklm_notebooks
  WHERE owner_user_id = p_user_id
    AND type = 'personal'
    AND is_archived = FALSE
  ORDER BY created_at DESC
  LIMIT 1;
  
  RETURN v_notebook_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Add source to notebook
CREATE OR REPLACE FUNCTION add_notebook_source(
  p_notebook_id UUID,
  p_user_id UUID,
  p_source_type TEXT,
  p_title TEXT,
  p_content TEXT DEFAULT NULL,
  p_url TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
  v_source_id UUID;
  v_content_hash TEXT;
  v_existing_source UUID;
  v_source_count INTEGER;
  v_max_sources INTEGER;
BEGIN
  -- Get notebook limits
  SELECT source_count, max_sources INTO v_source_count, v_max_sources
  FROM notebooklm_notebooks
  WHERE id = p_notebook_id;
  
  -- Check if notebook is full
  IF v_source_count >= v_max_sources THEN
    RAISE EXCEPTION 'Notebook is full (% / % sources)', v_source_count, v_max_sources;
  END IF;
  
  -- Calculate content hash for deduplication
  IF p_content IS NOT NULL THEN
    v_content_hash := encode(digest(p_content, 'sha256'), 'hex');
    
    -- Check if source already exists
    SELECT id INTO v_existing_source
    FROM notebooklm_sources
    WHERE notebook_id = p_notebook_id
      AND content_hash = v_content_hash
    LIMIT 1;
    
    IF v_existing_source IS NOT NULL THEN
      RETURN v_existing_source;
    END IF;
  END IF;
  
  -- Insert source
  INSERT INTO notebooklm_sources (
    notebook_id,
    user_id,
    source_type,
    title,
    content,
    url,
    content_hash,
    metadata
  ) VALUES (
    p_notebook_id,
    p_user_id,
    p_source_type,
    p_title,
    p_content,
    p_url,
    v_content_hash,
    p_metadata
  )
  RETURNING id INTO v_source_id;
  
  -- Update source count
  UPDATE notebooklm_notebooks
  SET source_count = source_count + 1,
      updated_at = NOW()
  WHERE id = p_notebook_id;
  
  -- Update user profile count
  UPDATE user_profiles
  SET notebooklm_source_count = notebooklm_source_count + 1
  WHERE user_id = p_user_id;
  
  RETURN v_source_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get user's notebooks (personal + shared)
CREATE OR REPLACE FUNCTION get_user_notebooks(p_user_id UUID)
RETURNS TABLE (
  notebook_id UUID,
  notebook_external_id TEXT,
  name TEXT,
  description TEXT,
  type TEXT,
  source_count INTEGER,
  max_sources INTEGER,
  is_archived BOOLEAN,
  role TEXT,
  created_at TIMESTAMP
) AS $$
BEGIN
  RETURN QUERY
  -- Personal notebooks
  SELECT 
    n.id,
    n.notebook_id,
    n.name,
    n.description,
    n.type,
    n.source_count,
    n.max_sources,
    n.is_archived,
    'owner'::TEXT as role,
    n.created_at
  FROM notebooklm_notebooks n
  WHERE n.owner_user_id = p_user_id
  
  UNION ALL
  
  -- Shared notebooks
  SELECT 
    n.id,
    n.notebook_id,
    n.name,
    n.description,
    n.type,
    n.source_count,
    n.max_sources,
    n.is_archived,
    m.role,
    n.created_at
  FROM notebooklm_notebooks n
  JOIN notebooklm_notebook_members m ON m.notebook_id = n.id
  WHERE m.user_id = p_user_id
  
  ORDER BY created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 6. Insert default shared notebook
-- ============================================================================

-- Insert the shared Morgus notebook (if not exists)
INSERT INTO notebooklm_notebooks (
  notebook_id,
  name,
  description,
  type,
  source_count,
  max_sources
) VALUES (
  'f3d3d717-6658-4d5b-9570-49c709a7d0fd',
  'Morgus Shared Research',
  'Shared notebook for all Morgus users (MVP)',
  'public',
  0,
  50
) ON CONFLICT (notebook_id) DO NOTHING;

-- ============================================================================
-- 7. Row Level Security (RLS)
-- ============================================================================

ALTER TABLE notebooklm_notebooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE notebooklm_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE notebooklm_notebook_members ENABLE ROW LEVEL SECURITY;

-- Notebooks: Users can see their own notebooks + shared notebooks they're members of
CREATE POLICY "Users can view their notebooks"
  ON notebooklm_notebooks FOR SELECT
  USING (
    owner_user_id = auth.uid()
    OR type = 'public'
    OR id IN (
      SELECT notebook_id FROM notebooklm_notebook_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create notebooks"
  ON notebooklm_notebooks FOR INSERT
  WITH CHECK (owner_user_id = auth.uid());

CREATE POLICY "Users can update their notebooks"
  ON notebooklm_notebooks FOR UPDATE
  USING (owner_user_id = auth.uid());

CREATE POLICY "Users can delete their notebooks"
  ON notebooklm_notebooks FOR DELETE
  USING (owner_user_id = auth.uid());

-- Sources: Users can see sources in notebooks they have access to
CREATE POLICY "Users can view sources in their notebooks"
  ON notebooklm_sources FOR SELECT
  USING (
    notebook_id IN (
      SELECT id FROM notebooklm_notebooks
      WHERE owner_user_id = auth.uid()
        OR type = 'public'
        OR id IN (
          SELECT notebook_id FROM notebooklm_notebook_members
          WHERE user_id = auth.uid()
        )
    )
  );

CREATE POLICY "Users can add sources to their notebooks"
  ON notebooklm_sources FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND notebook_id IN (
      SELECT id FROM notebooklm_notebooks
      WHERE owner_user_id = auth.uid()
        OR type = 'public'
        OR id IN (
          SELECT notebook_id FROM notebooklm_notebook_members
          WHERE user_id = auth.uid() AND role IN ('owner', 'editor')
        )
    )
  );

-- Members: Users can see members of notebooks they have access to
CREATE POLICY "Users can view notebook members"
  ON notebooklm_notebook_members FOR SELECT
  USING (
    notebook_id IN (
      SELECT id FROM notebooklm_notebooks
      WHERE owner_user_id = auth.uid()
        OR id IN (
          SELECT notebook_id FROM notebooklm_notebook_members
          WHERE user_id = auth.uid()
        )
    )
  );

CREATE POLICY "Notebook owners can manage members"
  ON notebooklm_notebook_members FOR ALL
  USING (
    notebook_id IN (
      SELECT id FROM notebooklm_notebooks
      WHERE owner_user_id = auth.uid()
    )
  );

-- ============================================================================
-- 8. Triggers
-- ============================================================================

-- Update notebook updated_at on source changes
CREATE OR REPLACE FUNCTION update_notebook_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE notebooklm_notebooks
  SET updated_at = NOW()
  WHERE id = NEW.notebook_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_notebook_timestamp
AFTER INSERT ON notebooklm_sources
FOR EACH ROW
EXECUTE FUNCTION update_notebook_timestamp();

-- ============================================================================
-- Done!
-- ============================================================================

-- Verify tables created
SELECT 
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public'
  AND table_name LIKE 'notebooklm%'
ORDER BY table_name;
