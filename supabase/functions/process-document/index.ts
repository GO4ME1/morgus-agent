// Supabase Edge Function for processing documents
// This function is triggered when a document is uploaded to the Knowledge Base

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Chunking configuration
const CHUNK_SIZE = 1000;
const CHUNK_OVERLAP = 200;
const MAX_CHUNKS_PER_DOC = 500;

interface TextChunk {
  content: string;
  chunk_index: number;
  start_char: number;
  end_char: number;
  metadata: Record<string, unknown>;
}

function chunkText(text: string, title: string): TextChunk[] {
  const chunks: TextChunk[] = [];
  const cleanText = text.replace(/\s+/g, ' ').trim();
  
  if (cleanText.length === 0) return chunks;

  let startIndex = 0;
  let chunkIndex = 0;

  while (startIndex < cleanText.length && chunkIndex < MAX_CHUNKS_PER_DOC) {
    let endIndex = Math.min(startIndex + CHUNK_SIZE, cleanText.length);
    
    if (endIndex < cleanText.length) {
      const sentenceEnd = cleanText.lastIndexOf('. ', endIndex);
      if (sentenceEnd > startIndex + CHUNK_SIZE / 2) {
        endIndex = sentenceEnd + 1;
      } else {
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
        metadata: { title, chunk_index: chunkIndex, total_chars: cleanText.length },
      });
      chunkIndex++;
    }

    startIndex = endIndex - CHUNK_OVERLAP;
    if (startIndex <= chunks[chunks.length - 1]?.start_char) {
      startIndex = endIndex;
    }
  }

  return chunks;
}

async function generateEmbeddings(texts: string[], apiKey: string): Promise<number[][]> {
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

  const data = await response.json();
  return data.data
    .sort((a: { index: number }, b: { index: number }) => a.index - b.index)
    .map((item: { embedding: number[] }) => item.embedding);
}

async function extractTextFromUrl(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; MorgusBot/1.0)' },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch URL: ${response.status}`);
  }

  const html = await response.text();
  
  return html
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
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const openaiKey = Deno.env.get('OPENAI_API_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { document_id } = await req.json();

    if (!document_id) {
      return new Response(
        JSON.stringify({ error: 'document_id required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch the document
    const { data: doc, error: fetchError } = await supabase
      .from('knowledge_documents')
      .select('*')
      .eq('id', document_id)
      .single();

    if (fetchError || !doc) {
      return new Response(
        JSON.stringify({ error: 'Document not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update status to processing
    await supabase
      .from('knowledge_documents')
      .update({ status: 'processing' })
      .eq('id', document_id);

    let textContent = '';

    // Extract text based on source type
    if (doc.source_type === 'text' && doc.content) {
      textContent = doc.content;
    } else if (doc.source_type === 'url' && doc.source_url) {
      textContent = await extractTextFromUrl(doc.source_url);
    } else if (doc.source_type === 'upload' && doc.source_url) {
      const { data: fileData, error: downloadError } = await supabase.storage
        .from('knowledge-files')
        .download(doc.source_url);

      if (downloadError) {
        throw new Error(`Failed to download file: ${downloadError.message}`);
      }

      // Handle text-based files
      if (doc.file_type?.includes('text') || 
          doc.file_type?.includes('txt') ||
          doc.file_type?.includes('md') ||
          doc.file_type?.includes('csv') ||
          doc.file_type?.includes('json')) {
        textContent = await fileData.text();
      } else {
        throw new Error(`File type ${doc.file_type} not yet supported`);
      }
    }

    if (!textContent || textContent.length < 10) {
      throw new Error('No text content extracted');
    }

    // Chunk the text
    const chunks = chunkText(textContent, doc.title);
    console.log(`Created ${chunks.length} chunks for document ${document_id}`);

    if (chunks.length === 0) {
      throw new Error('No chunks created');
    }

    // Generate embeddings in batches
    const BATCH_SIZE = 20;
    const allEmbeddings: number[][] = [];

    for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
      const batch = chunks.slice(i, i + BATCH_SIZE);
      const texts = batch.map((c) => c.content);
      const embeddings = await generateEmbeddings(texts, openaiKey);
      allEmbeddings.push(...embeddings);
      
      if (i + BATCH_SIZE < chunks.length) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }

    // Store chunks with embeddings
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

    // Insert in batches
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

    // Update document status
    await supabase
      .from('knowledge_documents')
      .update({
        status: 'completed',
        chunk_count: chunks.length,
        content: textContent.slice(0, 10000),
      })
      .eq('id', document_id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        chunks_created: chunks.length,
        message: 'Document processed successfully' 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error processing document:', error);

    // Try to update document status to failed
    try {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      const { document_id } = await req.json().catch(() => ({}));
      
      if (document_id) {
        await supabase
          .from('knowledge_documents')
          .update({
            status: 'failed',
            error_message: error instanceof Error ? error.message : 'Unknown error',
          })
          .eq('id', document_id);
      }
    } catch (_) {
      // Ignore errors in error handling
    }

    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
