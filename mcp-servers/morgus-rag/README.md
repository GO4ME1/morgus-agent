# @morgus/mcp-rag

MCP (Model Context Protocol) server for RAG (Retrieval-Augmented Generation) search over your personal knowledge base.

## Features

- **Semantic Search** - Search your knowledge base using natural language queries
- **Vector Similarity** - Uses OpenAI embeddings and pgvector for accurate results
- **Document Management** - List and retrieve documents from your knowledge base
- **MCP Compatible** - Works with any MCP-compatible AI assistant

## Installation

```bash
npm install @morgus/mcp-rag
```

Or run directly:

```bash
npx @morgus/mcp-rag
```

## Configuration

Set the following environment variables:

| Variable | Required | Description |
|----------|----------|-------------|
| `SUPABASE_URL` | Yes | Your Supabase project URL |
| `SUPABASE_KEY` | Yes | Your Supabase anon/service key |
| `OPENAI_API_KEY` | Yes | OpenAI API key for embeddings |
| `MORGUS_USER_ID` | No | Filter results to a specific user |

## MCP Configuration

Add to your MCP settings (e.g., Claude Desktop):

```json
{
  "mcpServers": {
    "morgus-rag": {
      "command": "npx",
      "args": ["@morgus/mcp-rag"],
      "env": {
        "SUPABASE_URL": "https://your-project.supabase.co",
        "SUPABASE_KEY": "your-anon-key",
        "OPENAI_API_KEY": "sk-..."
      }
    }
  }
}
```

## Available Tools

### `rag_search`

Search the knowledge base using semantic similarity.

**Parameters:**
- `query` (required): The search query
- `top_k` (optional): Max results (default: 5, max: 20)
- `threshold` (optional): Minimum similarity (0-1, default: 0.5)

**Example:**
```
Search for: "How does React handle state management?"
```

### `list_knowledge_documents`

List all documents in the knowledge base.

### `get_document_content`

Get the full content of a specific document.

**Parameters:**
- `document_id` (required): The document ID

## Database Schema

This server expects the following Supabase tables:

### `knowledge_documents`
- `id` (uuid)
- `user_id` (uuid)
- `title` (text)
- `source_type` (text)
- `status` (text)
- `chunk_count` (integer)
- `created_at` (timestamp)

### `knowledge_chunks`
- `id` (uuid)
- `document_id` (uuid)
- `user_id` (uuid)
- `content` (text)
- `chunk_index` (integer)
- `embedding` (vector(1536))

### `search_knowledge` Function

```sql
CREATE OR REPLACE FUNCTION search_knowledge(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.5,
  match_count int DEFAULT 5,
  p_user_id uuid DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  content text,
  document_title text,
  document_id uuid,
  chunk_index integer,
  similarity float,
  metadata jsonb
)
```

## License

MIT
