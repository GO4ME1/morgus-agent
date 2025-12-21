/**
 * Morgus Document Processor Worker
 * 
 * This worker processes documents uploaded to the Knowledge Base:
 * 1. Fetches pending documents from Supabase
 * 2. Downloads and extracts text content
 * 3. Chunks the content into smaller pieces
 * 4. Generates embeddings using OpenAI
 * 5. Stores chunks and embeddings in Supabase
 */

import { createClient } from '@supabase/supabase-js';

interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_KEY: string;
  OPENAI_API_KEY: string;
}

interface KnowledgeDocument {
  id: string;
  user_id: string;
  title: string;
  source_type: 'upload' | 'url' | 'text';
  source_url?: string;
  content?: string;
  file_type?: string;
  status: string;
}

interface TextChunk {
  content: string;
  chunk_index: number;
  start_char: number;
  end_char: number;
  metadata: Record<string, unknown>;
}

// Chunking configuration
const CHUNK_SIZE = 1000; // characters per chunk
const CHUNK_OVERLAP = 200; // overlap between chunks
const MAX_CHUNKS_PER_DOC = 500; // safety limit

/**
 * Split text into overlapping chunks
 */
function chunkText(text: string, title: string): TextChunk[] {
  const chunks: TextChunk[] = [];
  const cleanText = text.replace(/\s+/g, ' ').trim();
  
  if (cleanText.length === 0) {
    return chunks;
  }

  let startIndex = 0;
  let chunkIndex = 0;

  while (startIndex < cleanText.length && chunkIndex < MAX_CHUNKS_PER_DOC) {
    // Find the end of this chunk
    let endIndex = Math.min(startIndex + CHUNK_SIZE, cleanText.length);
    
    // Try to break at a sentence or word boundary
    if (endIndex < cleanText.length) {
      // Look for sentence boundary
      const sentenceEnd = cleanText.lastIndexOf('. ', endIndex);
      if (sentenceEnd > startIndex + CHUNK_SIZE / 2) {
        endIndex = sentenceEnd + 1;
      } else {
        // Look for word boundary
        const wordEnd = cleanText.lastIndexOf(' ', endIndex);
        if (wordEnd > startIndex + CHUNK_SIZE / 2) {
          endIndex = wordEnd;
        }
      }
    }

    const chunkContent = cleanText.slice(startIndex, endIndex).trim();
    
    if (chunkContent.length > 0) {
      chunks.push({
        content: chunkContent,
        chunk_index: chunkIndex,
        start_char: startIndex,
        end_char: endIndex,
        metadata: {
          title,
          chunk_index: chunkIndex,
          total_chars: cleanText.length,
        },
      });
      chunkIndex++;
    }

    // Move start index, accounting for overlap
    startIndex = endIndex - CHUNK_OVERLAP;
    if (startIndex <= chunks[chunks.length - 1]?.start_char) {
      startIndex = endIndex; // Prevent infinite loop
    }
  }

  return chunks;
}

/**
 * Generate embeddings using OpenAI API
 */
async function generateEmbeddings(
  texts: string[],
  apiKey: string
): Promise<number[][]> {
  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'text-embedding-3-small',
      input: texts,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI API error: ${error}`);
  }

  const data = await response.json() as {
    data: Array<{ embedding: number[]; index: number }>;
  };

  // Sort by index to maintain order
  return data.data
    .sort((a, b) => a.index - b.index)
    .map((item) => item.embedding);
}

/**
 * Extract text from URL using a simple fetch
 */
async function extractTextFromUrl(url: string): Promise<string> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; MorgusBot/1.0)',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch URL: ${response.status}`);
    }

    const html = await response.text();
    
    // Simple HTML to text extraction
    // Remove script and style tags
    let text = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\s+/g, ' ')
      .trim();

    return text;
  } catch (error) {
    console.error('Error extracting text from URL:', error);
    throw error;
  }
}

/**
 * Process a single document
 */
async function processDocument(
  doc: KnowledgeDocument,
  supabase: ReturnType<typeof createClient>,
  openaiKey: string
): Promise<void> {
  console.log(`Processing document: ${doc.id} - ${doc.title}`);

  try {
    // Update status to processing
    await supabase
      .from('knowledge_documents')
      .update({ status: 'processing' })
      .eq('id', doc.id);

    let textContent = '';

    // Extract text based on source type
    if (doc.source_type === 'text' && doc.content) {
      textContent = doc.content;
    } else if (doc.source_type === 'url' && doc.source_url) {
      textContent = await extractTextFromUrl(doc.source_url);
    } else if (doc.source_type === 'upload' && doc.source_url) {
      // For uploaded files, download from Supabase Storage
      const { data, error } = await supabase.storage
        .from('knowledge-files')
        .download(doc.source_url);

      if (error) {
        throw new Error(`Failed to download file: ${error.message}`);
      }

      // For now, only handle text-based files
      if (doc.file_type?.includes('text') || 
          doc.file_type?.includes('txt') ||
          doc.file_type?.includes('md') ||
          doc.file_type?.includes('csv') ||
          doc.file_type?.includes('json')) {
        textContent = await data.text();
      } else {
        // For PDF and other formats, we'd need additional processing
        // For now, mark as needing manual processing
        throw new Error(`File type ${doc.file_type} not yet supported for automatic processing`);
      }
    }

    if (!textContent || textContent.length < 10) {
      throw new Error('No text content extracted from document');
    }

    // Chunk the text
    const chunks = chunkText(textContent, doc.title);
    console.log(`Created ${chunks.length} chunks for document ${doc.id}`);

    if (chunks.length === 0) {
      throw new Error('No chunks created from document');
    }

    // Generate embeddings in batches (OpenAI limit is ~8000 tokens per request)
    const BATCH_SIZE = 20;
    const allEmbeddings: number[][] = [];

    for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
      const batch = chunks.slice(i, i + BATCH_SIZE);
      const texts = batch.map((c) => c.content);
      const embeddings = await generateEmbeddings(texts, openaiKey);
      allEmbeddings.push(...embeddings);
      
      // Small delay to avoid rate limiting
      if (i + BATCH_SIZE < chunks.length) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }

    // Store chunks with embeddings in Supabase
    const chunkRecords = chunks.map((chunk, index) => ({
      document_id: doc.id,
      user_id: doc.user_id,
      content: chunk.content,
      chunk_index: chunk.chunk_index,
      start_char: chunk.start_char,
      end_char: chunk.end_char,
      embedding: allEmbeddings[index],
      metadata: chunk.metadata,
    }));

    // Insert in batches to avoid payload size limits
    const INSERT_BATCH_SIZE = 50;
    for (let i = 0; i < chunkRecords.length; i += INSERT_BATCH_SIZE) {
      const batch = chunkRecords.slice(i, i + INSERT_BATCH_SIZE);
      const { error: insertError } = await supabase
        .from('knowledge_chunks')
        .insert(batch);

      if (insertError) {
        throw new Error(`Failed to insert chunks: ${insertError.message}`);
      }
    }

    // Update document status and chunk count
    await supabase
      .from('knowledge_documents')
      .update({
        status: 'completed',
        chunk_count: chunks.length,
        content: textContent.slice(0, 10000), // Store first 10k chars for reference
      })
      .eq('id', doc.id);

    console.log(`Successfully processed document ${doc.id} with ${chunks.length} chunks`);

  } catch (error) {
    console.error(`Error processing document ${doc.id}:`, error);
    
    // Update document with error status
    await supabase
      .from('knowledge_documents')
      .update({
        status: 'failed',
        error_message: error instanceof Error ? error.message : 'Unknown error',
      })
      .eq('id', doc.id);
  }
}

// CORS headers for cross-origin requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders,
    },
  });
}

/**
 * Main worker handler
 */
export default {
  // Scheduled handler - runs periodically to process pending documents
  async scheduled(
    _controller: ScheduledController,
    env: Env,
    _ctx: ExecutionContext
  ): Promise<void> {
    console.log('Document processor scheduled run started');

    const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY);

    // Fetch pending documents
    const { data: documents, error } = await supabase
      .from('knowledge_documents')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      .limit(10); // Process up to 10 documents per run

    if (error) {
      console.error('Error fetching documents:', error);
      return;
    }

    if (!documents || documents.length === 0) {
      console.log('No pending documents to process');
      return;
    }

    console.log(`Found ${documents.length} pending documents`);

    // Process each document
    for (const doc of documents) {
      await processDocument(doc as KnowledgeDocument, supabase, env.OPENAI_API_KEY);
    }

    console.log('Document processor scheduled run completed');
  },

  // HTTP handler - for manual triggering and status checks
  async fetch(
    request: Request,
    env: Env,
    _ctx: ExecutionContext
  ): Promise<Response> {
    const url = new URL(request.url);

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // Health check
    if (url.pathname === '/health') {
      return jsonResponse({ status: 'ok' });
    }

    // Manual trigger to process a specific document
    if (url.pathname === '/process' && request.method === 'POST') {
      try {
        const body = await request.json() as { document_id?: string };
        const documentId = body.document_id;

        if (!documentId) {
          return jsonResponse({ error: 'document_id required' }, 400);
        }

        const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY);

        // Fetch the document
        const { data: doc, error } = await supabase
          .from('knowledge_documents')
          .select('*')
          .eq('id', documentId)
          .single();

        if (error || !doc) {
          return jsonResponse({ error: 'Document not found' }, 404);
        }

        // Process the document
        await processDocument(doc as KnowledgeDocument, supabase, env.OPENAI_API_KEY);

        return jsonResponse({ success: true, message: 'Document processed' });

      } catch (error) {
        return jsonResponse({ error: error instanceof Error ? error.message : 'Unknown error' }, 500);
      }
    }

    // Trigger processing of all pending documents
    if (url.pathname === '/process-all' && request.method === 'POST') {
      const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY);

      const { data: documents, error } = await supabase
        .from('knowledge_documents')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: true })
        .limit(10);

      if (error) {
        return jsonResponse({ error: error.message }, 500);
      }

      if (!documents || documents.length === 0) {
        return jsonResponse({ message: 'No pending documents' });
      }

      // Process documents
      for (const doc of documents) {
        await processDocument(doc as KnowledgeDocument, supabase, env.OPENAI_API_KEY);
      }

      return jsonResponse({ success: true, processed: documents.length });
    }

    return jsonResponse({ error: 'Not found' }, 404);
  },
};
