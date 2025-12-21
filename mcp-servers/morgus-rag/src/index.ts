#!/usr/bin/env node
/**
 * @morgus/mcp-rag
 * MCP Server for RAG (Retrieval-Augmented Generation) search
 * 
 * This server provides semantic search capabilities over a user's personal knowledge base
 * stored in Supabase with pgvector embeddings.
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

// Configuration from environment
const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_KEY || '';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';
const USER_ID = process.env.MORGUS_USER_ID || '';

// Initialize clients
let supabase: SupabaseClient | null = null;
let openai: OpenAI | null = null;

function initClients() {
  if (SUPABASE_URL && SUPABASE_KEY) {
    supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
  }
  if (OPENAI_API_KEY) {
    openai = new OpenAI({ apiKey: OPENAI_API_KEY });
  }
}

// Types
interface SearchResult {
  id: string;
  content: string;
  document_title: string;
  document_id: string;
  chunk_index: number;
  similarity: number;
  metadata?: Record<string, unknown>;
}

interface KnowledgeDocument {
  id: string;
  title: string;
  source_type: string;
  status: string;
  chunk_count: number;
  created_at: string;
}

/**
 * Generate embedding for a query using OpenAI
 */
async function generateEmbedding(text: string): Promise<number[]> {
  if (!openai) {
    throw new Error('OpenAI client not initialized. Set OPENAI_API_KEY environment variable.');
  }

  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text,
    dimensions: 1536,
  });

  return response.data[0].embedding;
}

/**
 * Search knowledge base using vector similarity
 */
async function searchKnowledge(
  query: string,
  topK: number = 5,
  threshold: number = 0.5
): Promise<SearchResult[]> {
  if (!supabase) {
    throw new Error('Supabase client not initialized. Set SUPABASE_URL and SUPABASE_KEY environment variables.');
  }

  // Generate embedding for the query
  const queryEmbedding = await generateEmbedding(query);

  // Call the search function in Supabase
  const { data, error } = await supabase.rpc('search_knowledge', {
    query_embedding: queryEmbedding,
    match_threshold: threshold,
    match_count: topK,
    p_user_id: USER_ID || null,
  });

  if (error) {
    throw new Error(`Search failed: ${error.message}`);
  }

  return (data || []).map((row: {
    id: string;
    content: string;
    document_title: string;
    document_id: string;
    chunk_index: number;
    similarity: number;
    metadata?: Record<string, unknown>;
  }) => ({
    id: row.id,
    content: row.content,
    document_title: row.document_title,
    document_id: row.document_id,
    chunk_index: row.chunk_index,
    similarity: row.similarity,
    metadata: row.metadata,
  }));
}

/**
 * List all documents in the knowledge base
 */
async function listDocuments(): Promise<KnowledgeDocument[]> {
  if (!supabase) {
    throw new Error('Supabase client not initialized.');
  }

  let query = supabase
    .from('knowledge_documents')
    .select('id, title, source_type, status, chunk_count, created_at')
    .eq('status', 'completed')
    .order('created_at', { ascending: false });

  if (USER_ID) {
    query = query.eq('user_id', USER_ID);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to list documents: ${error.message}`);
  }

  return data || [];
}

/**
 * Get chunks from a specific document
 */
async function getDocumentChunks(documentId: string): Promise<string[]> {
  if (!supabase) {
    throw new Error('Supabase client not initialized.');
  }

  const { data, error } = await supabase
    .from('knowledge_chunks')
    .select('content, chunk_index')
    .eq('document_id', documentId)
    .order('chunk_index', { ascending: true });

  if (error) {
    throw new Error(`Failed to get document chunks: ${error.message}`);
  }

  return (data || []).map((chunk: { content: string }) => chunk.content);
}

// Create MCP Server
const server = new Server(
  {
    name: '@morgus/mcp-rag',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
      resources: {},
    },
  }
);

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'rag_search',
        description: 'Search the user\'s personal knowledge base using semantic similarity. Returns the most relevant text chunks from uploaded documents, URLs, and notes.',
        inputSchema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'The search query to find relevant information',
            },
            top_k: {
              type: 'number',
              description: 'Maximum number of results to return (default: 5, max: 20)',
              default: 5,
            },
            threshold: {
              type: 'number',
              description: 'Minimum similarity threshold (0-1, default: 0.5)',
              default: 0.5,
            },
          },
          required: ['query'],
        },
      },
      {
        name: 'list_knowledge_documents',
        description: 'List all documents in the user\'s knowledge base that are ready for search.',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'get_document_content',
        description: 'Get the full content of a specific document from the knowledge base.',
        inputSchema: {
          type: 'object',
          properties: {
            document_id: {
              type: 'string',
              description: 'The ID of the document to retrieve',
            },
          },
          required: ['document_id'],
        },
      },
    ],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'rag_search': {
        const query = args?.query as string;
        const topK = Math.min((args?.top_k as number) || 5, 20);
        const threshold = (args?.threshold as number) || 0.5;

        if (!query) {
          throw new Error('Query is required');
        }

        const results = await searchKnowledge(query, topK, threshold);

        if (results.length === 0) {
          return {
            content: [
              {
                type: 'text',
                text: 'No relevant results found in the knowledge base for this query.',
              },
            ],
          };
        }

        const formattedResults = results.map((r, i) => 
          `### Result ${i + 1} (${(r.similarity * 100).toFixed(1)}% match)\n` +
          `**Source:** ${r.document_title}\n\n` +
          `${r.content}\n`
        ).join('\n---\n\n');

        return {
          content: [
            {
              type: 'text',
              text: `Found ${results.length} relevant results:\n\n${formattedResults}`,
            },
          ],
        };
      }

      case 'list_knowledge_documents': {
        const documents = await listDocuments();

        if (documents.length === 0) {
          return {
            content: [
              {
                type: 'text',
                text: 'No documents in the knowledge base yet.',
              },
            ],
          };
        }

        const formattedDocs = documents.map((doc) =>
          `- **${doc.title}** (${doc.source_type})\n` +
          `  ID: ${doc.id}\n` +
          `  Chunks: ${doc.chunk_count} | Added: ${new Date(doc.created_at).toLocaleDateString()}`
        ).join('\n\n');

        return {
          content: [
            {
              type: 'text',
              text: `Knowledge Base Documents (${documents.length}):\n\n${formattedDocs}`,
            },
          ],
        };
      }

      case 'get_document_content': {
        const documentId = args?.document_id as string;

        if (!documentId) {
          throw new Error('document_id is required');
        }

        const chunks = await getDocumentChunks(documentId);

        if (chunks.length === 0) {
          return {
            content: [
              {
                type: 'text',
                text: 'Document not found or has no content.',
              },
            ],
          };
        }

        return {
          content: [
            {
              type: 'text',
              text: `Document Content (${chunks.length} chunks):\n\n${chunks.join('\n\n---\n\n')}`,
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        },
      ],
      isError: true,
    };
  }
});

// List available resources (documents as resources)
server.setRequestHandler(ListResourcesRequestSchema, async () => {
  try {
    const documents = await listDocuments();

    return {
      resources: documents.map((doc) => ({
        uri: `knowledge://${doc.id}`,
        name: doc.title,
        description: `${doc.source_type} document with ${doc.chunk_count} chunks`,
        mimeType: 'text/plain',
      })),
    };
  } catch {
    return { resources: [] };
  }
});

// Read a specific resource
server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const uri = request.params.uri;
  const match = uri.match(/^knowledge:\/\/(.+)$/);

  if (!match) {
    throw new Error('Invalid resource URI');
  }

  const documentId = match[1];
  const chunks = await getDocumentChunks(documentId);

  return {
    contents: [
      {
        uri,
        mimeType: 'text/plain',
        text: chunks.join('\n\n---\n\n'),
      },
    ],
  };
});

// Main entry point
async function main() {
  initClients();

  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error('@morgus/mcp-rag server started');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
