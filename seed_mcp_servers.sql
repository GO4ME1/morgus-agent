-- =====================================================
-- SEED OFFICIAL MORGUS MCP SERVERS
-- Morgus Intelligence Platform - Phase 5
-- =====================================================

-- Insert official Morgus MCP servers
INSERT INTO mcp_servers (
  name, display_name, description, long_description, version,
  author, author_url, repository_url, documentation_url, icon_url,
  category, tags, install_command, config_template,
  is_official, is_verified, is_featured, is_active
) VALUES
-- 1. RAG Knowledge Base Server
(
  'morgus-rag',
  'Morgus RAG',
  'Vector search over your personal knowledge base',
  'The Morgus RAG (Retrieval-Augmented Generation) server enables semantic search across your uploaded documents, notes, and knowledge base. It uses pgvector for fast similarity search and automatically chunks and embeds your documents for optimal retrieval.',
  '1.0.0',
  'Morgus Team',
  'https://morgus.ai',
  'https://github.com/GO4ME1/morgus-agent',
  'https://docs.morgus.ai/mcp/rag',
  '🔍',
  'knowledge',
  ARRAY['rag', 'search', 'knowledge', 'embeddings', 'vector'],
  'npx @morgus/mcp-rag',
  '{"embedding_model": "text-embedding-3-small", "chunk_size": 512, "chunk_overlap": 50}'::jsonb,
  true, true, true, true
),
-- 2. Web Search Server
(
  'morgus-web-search',
  'Morgus Web Search',
  'Enhanced web search with source verification',
  'Perform intelligent web searches with automatic source verification, fact-checking, and citation generation. Integrates with multiple search providers and ranks results by relevance and credibility.',
  '1.0.0',
  'Morgus Team',
  'https://morgus.ai',
  'https://github.com/GO4ME1/morgus-agent',
  'https://docs.morgus.ai/mcp/web-search',
  '🌐',
  'search',
  ARRAY['search', 'web', 'research', 'citations'],
  'npx @morgus/mcp-web-search',
  '{"max_results": 10, "verify_sources": true}'::jsonb,
  true, true, true, true
),
-- 3. Code Executor Server
(
  'morgus-code-executor',
  'Morgus Code Executor',
  'Safe sandboxed code execution',
  'Execute Python, JavaScript, and shell code in a secure sandboxed environment. Perfect for data analysis, automation scripts, and testing code snippets without risk to your system.',
  '1.0.0',
  'Morgus Team',
  'https://morgus.ai',
  'https://github.com/GO4ME1/morgus-agent',
  'https://docs.morgus.ai/mcp/code-executor',
  '💻',
  'development',
  ARRAY['code', 'python', 'javascript', 'sandbox', 'execution'],
  'npx @morgus/mcp-code-executor',
  '{"languages": ["python", "javascript", "bash"], "timeout_seconds": 30, "memory_limit_mb": 256}'::jsonb,
  true, true, true, true
),
-- 4. File Manager Server
(
  'morgus-file-manager',
  'Morgus File Manager',
  'Document processing and cloud storage',
  'Upload, process, and manage documents with automatic text extraction, OCR for images, and cloud storage integration. Supports PDF, Word, Excel, images, and more.',
  '1.0.0',
  'Morgus Team',
  'https://morgus.ai',
  'https://github.com/GO4ME1/morgus-agent',
  'https://docs.morgus.ai/mcp/file-manager',
  '📁',
  'productivity',
  ARRAY['files', 'documents', 'storage', 'ocr', 'pdf'],
  'npx @morgus/mcp-file-manager',
  '{"storage_provider": "supabase", "max_file_size_mb": 50, "ocr_enabled": true}'::jsonb,
  true, true, true, true
),
-- 5. GitHub Integration Server
(
  'morgus-github',
  'Morgus GitHub',
  'Full GitHub integration for repos and issues',
  'Interact with GitHub repositories, issues, pull requests, and actions. Clone repos, create branches, submit PRs, and manage your GitHub workflow directly from Morgus.',
  '1.0.0',
  'Morgus Team',
  'https://morgus.ai',
  'https://github.com/GO4ME1/morgus-agent',
  'https://docs.morgus.ai/mcp/github',
  '🐙',
  'development',
  ARRAY['github', 'git', 'repos', 'issues', 'pr'],
  'npx @morgus/mcp-github',
  '{"default_branch": "main"}'::jsonb,
  true, true, true, true
),
-- 6. Database Query Server
(
  'morgus-database',
  'Morgus Database',
  'Query and manage SQL databases',
  'Connect to PostgreSQL, MySQL, SQLite, and other SQL databases. Run queries, explore schemas, and manage data with natural language commands.',
  '1.0.0',
  'Morgus Team',
  'https://morgus.ai',
  'https://github.com/GO4ME1/morgus-agent',
  'https://docs.morgus.ai/mcp/database',
  '🗄️',
  'data',
  ARRAY['database', 'sql', 'postgres', 'mysql', 'query'],
  'npx @morgus/mcp-database',
  '{"supported_databases": ["postgresql", "mysql", "sqlite"], "query_timeout_seconds": 30}'::jsonb,
  true, true, false, true
),
-- 7. Calendar & Scheduling Server
(
  'morgus-calendar',
  'Morgus Calendar',
  'Google Calendar and scheduling integration',
  'Manage your calendar, create events, check availability, and schedule meetings. Integrates with Google Calendar and supports natural language date parsing.',
  '1.0.0',
  'Morgus Team',
  'https://morgus.ai',
  'https://github.com/GO4ME1/morgus-agent',
  'https://docs.morgus.ai/mcp/calendar',
  '📅',
  'productivity',
  ARRAY['calendar', 'scheduling', 'google', 'events', 'meetings'],
  'npx @morgus/mcp-calendar',
  '{"default_calendar": "primary", "timezone": "auto"}'::jsonb,
  true, true, false, true
),
-- 8. Email Server
(
  'morgus-email',
  'Morgus Email',
  'Read and send emails via Gmail',
  'Access your Gmail inbox, read emails, compose and send messages, and manage labels. Perfect for email automation and staying on top of your inbox.',
  '1.0.0',
  'Morgus Team',
  'https://morgus.ai',
  'https://github.com/GO4ME1/morgus-agent',
  'https://docs.morgus.ai/mcp/email',
  '📧',
  'communication',
  ARRAY['email', 'gmail', 'inbox', 'send', 'automation'],
  'npx @morgus/mcp-email',
  '{"provider": "gmail", "max_results": 50}'::jsonb,
  true, true, false, true
),
-- 9. Image Generation Server
(
  'morgus-image-gen',
  'Morgus Image Generator',
  'AI-powered image generation with DALL-E',
  'Generate images from text descriptions using DALL-E and other AI models. Create illustrations, diagrams, logos, and artwork directly from your prompts.',
  '1.0.0',
  'Morgus Team',
  'https://morgus.ai',
  'https://github.com/GO4ME1/morgus-agent',
  'https://docs.morgus.ai/mcp/image-gen',
  '🎨',
  'ai',
  ARRAY['image', 'generation', 'dalle', 'art', 'ai'],
  'npx @morgus/mcp-image-gen',
  '{"model": "dall-e-3", "default_size": "1024x1024", "quality": "standard"}'::jsonb,
  true, true, true, true
),
-- 10. Slack Integration Server
(
  'morgus-slack',
  'Morgus Slack',
  'Slack workspace integration',
  'Send messages, read channels, and interact with your Slack workspace. Perfect for team communication and automation.',
  '1.0.0',
  'Morgus Team',
  'https://morgus.ai',
  'https://github.com/GO4ME1/morgus-agent',
  'https://docs.morgus.ai/mcp/slack',
  '💬',
  'communication',
  ARRAY['slack', 'messaging', 'team', 'channels', 'automation'],
  'npx @morgus/mcp-slack',
  '{"default_channel": "general"}'::jsonb,
  true, true, false, true
);

-- Verify the insert
SELECT name, display_name, is_official, is_featured FROM mcp_servers WHERE is_official = true;
