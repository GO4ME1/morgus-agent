import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { MorgyKnowledge } from './types/morgy';
import { extractText as extractDocumentText, isFileTypeSupported } from './document-extractors';

export interface KnowledgeUpload {
  morgyId: string;
  content: string;
  source: string;
  sourceType: 'text' | 'pdf' | 'docx' | 'website' | 'code' | 'audio' | 'video';
  metadata?: Record<string, any>;
}

export interface KnowledgeSearchResult extends MorgyKnowledge {
  similarity: number;
}

/**
 * Knowledge Base Service
 * Handles document upload, text extraction, embeddings, and semantic search
 */
export class KnowledgeBaseService {
  private supabase: SupabaseClient;
  private openaiApiKey: string;

  constructor(supabaseUrl: string, supabaseKey: string, openaiApiKey: string) {
    this.supabase = createClient(supabaseUrl, supabaseKey);
    this.openaiApiKey = openaiApiKey;
  }

  /**
   * Add knowledge to a Morgy
   */
  async addKnowledge(upload: KnowledgeUpload, userId: string): Promise<MorgyKnowledge> {
    // Verify user owns the Morgy
    const { data: morgy } = await this.supabase
      .from('morgys')
      .select('user_id')
      .eq('id', upload.morgyId)
      .single();

    if (!morgy || morgy.user_id !== userId) {
      throw new Error('Morgy not found or access denied');
    }

    // Generate embedding for the content
    const embedding = await this.generateEmbedding(upload.content);

    // Store knowledge with embedding
    const { data, error } = await this.supabase
      .from('morgy_knowledge')
      .insert({
        morgy_id: upload.morgyId,
        content: upload.content,
        source: upload.source,
        source_type: upload.sourceType,
        embedding: embedding,
        metadata: upload.metadata || {}
      })
      .select()
      .single();

    if (error) throw new Error(`Failed to add knowledge: ${error.message}`);
    return data as MorgyKnowledge;
  }

  /**
   * Generate OpenAI embedding for text
   */
  private async generateEmbedding(text: string): Promise<number[]> {
    try {
      const response = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.openaiApiKey}`
        },
        body: JSON.stringify({
          model: 'text-embedding-3-small',
          input: text.substring(0, 8000) // Limit to 8K chars
        })
      });

      const data = await response.json();
      return data.data[0].embedding;
    } catch (error) {
      console.error('Failed to generate embedding:', error);
      throw new Error('Failed to generate embedding');
    }
  }

  /**
   * Search knowledge base using semantic search
   */
  async searchKnowledge(
    morgyId: string,
    query: string,
    limit: number = 5
  ): Promise<KnowledgeSearchResult[]> {
    // Generate embedding for query
    const queryEmbedding = await this.generateEmbedding(query);

    // Use pgvector to find similar documents
    // This uses the <-> operator for cosine distance
    const { data, error } = await this.supabase.rpc('search_knowledge', {
      morgy_id_param: morgyId,
      query_embedding: queryEmbedding,
      match_threshold: 0.7,
      match_count: limit
    });

    if (error) {
      console.error('Knowledge search error:', error);
      // Fallback to simple text search
      return this.fallbackTextSearch(morgyId, query, limit);
    }

    return data as KnowledgeSearchResult[];
  }

  /**
   * Fallback text search (when vector search fails)
   */
  private async fallbackTextSearch(
    morgyId: string,
    query: string,
    limit: number
  ): Promise<KnowledgeSearchResult[]> {
    const { data, error } = await this.supabase
      .from('morgy_knowledge')
      .select('*')
      .eq('morgy_id', morgyId)
      .textSearch('content', query)
      .limit(limit);

    if (error) throw new Error(`Failed to search knowledge: ${error.message}`);
    
    // Add dummy similarity scores
    return (data as MorgyKnowledge[]).map(k => ({
      ...k,
      similarity: 0.5
    }));
  }

  /**
   * Extract text from any supported document
   */
  async extractDocument(fileBuffer: Buffer, mimeType: string, filename: string): Promise<string> {
    try {
      return await extractDocumentText(fileBuffer, mimeType, filename);
    } catch (error: any) {
      console.error('Document extraction error:', error);
      throw new Error(`Failed to extract text: ${error.message}`);
    }
  }

  /**
   * Scrape website content
   */
  async scrapeWebsite(url: string): Promise<string> {
    try {
      const response = await fetch(url);
      const html = await response.text();
      
      // Basic HTML to text conversion
      // In production, use a proper HTML parser
      const text = html
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      
      return text;
    } catch (error) {
      throw new Error(`Failed to scrape website: ${error}`);
    }
  }

  /**
   * Upload file and extract text
   */
  async uploadFile(
    morgyId: string,
    userId: string,
    file: {
      name: string;
      type: string;
      buffer: Buffer;
    }
  ): Promise<MorgyKnowledge> {
    let content: string;
    let sourceType: KnowledgeUpload['sourceType'];

    // Check if file type is supported
    if (!isFileTypeSupported(file.type, file.name)) {
      throw new Error(`Unsupported file type: ${file.type}`);
    }

    // Extract text based on file type
    content = await this.extractDocument(file.buffer, file.type, file.name);
    
    // Determine source type
    const extension = file.name.split('.').pop()?.toLowerCase() || '';
    if (extension === 'pdf') {
      sourceType = 'pdf';
    } else if (['doc', 'docx'].includes(extension)) {
      sourceType = 'docx';
    } else if (['js', 'ts', 'py', 'java', 'cpp', 'go', 'rs'].includes(extension)) {
      sourceType = 'code';
    } else {
      sourceType = 'text';
    }

    // Add to knowledge base
    return this.addKnowledge({
      morgyId,
      content,
      source: file.name,
      sourceType,
      metadata: {
        fileName: file.name,
        fileType: file.type,
        fileSize: file.buffer.length,
        uploadedAt: new Date().toISOString()
      }
    }, userId);
  }

  /**
   * Get knowledge items for a Morgy
   */
  async getKnowledge(morgyId: string, userId: string): Promise<MorgyKnowledge[]> {
    // Verify user owns the Morgy
    const { data: morgy } = await this.supabase
      .from('morgys')
      .select('user_id')
      .eq('id', morgyId)
      .single();

    if (!morgy || morgy.user_id !== userId) {
      throw new Error('Morgy not found or access denied');
    }

    const { data, error } = await this.supabase
      .from('morgy_knowledge')
      .select('*')
      .eq('morgy_id', morgyId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(`Failed to get knowledge: ${error.message}`);
    return data as MorgyKnowledge[];
  }

  /**
   * Delete knowledge item
   */
  async deleteKnowledge(knowledgeId: string, userId: string): Promise<void> {
    // Verify user owns the Morgy that owns this knowledge
    const { data: knowledge } = await this.supabase
      .from('morgy_knowledge')
      .select('morgy_id')
      .eq('id', knowledgeId)
      .single();

    if (!knowledge) {
      throw new Error('Knowledge not found');
    }

    const { data: morgy } = await this.supabase
      .from('morgys')
      .select('user_id')
      .eq('id', knowledge.morgy_id)
      .single();

    if (!morgy || morgy.user_id !== userId) {
      throw new Error('Access denied');
    }

    const { error } = await this.supabase
      .from('morgy_knowledge')
      .delete()
      .eq('id', knowledgeId);

    if (error) throw new Error(`Failed to delete knowledge: ${error.message}`);
  }
}

/**
 * Create the pgvector search function in Supabase
 * Run this SQL in Supabase SQL editor:
 */
export const KNOWLEDGE_SEARCH_FUNCTION = `
CREATE OR REPLACE FUNCTION search_knowledge(
  morgy_id_param UUID,
  query_embedding VECTOR(1536),
  match_threshold FLOAT,
  match_count INT
)
RETURNS TABLE (
  id UUID,
  morgy_id UUID,
  content TEXT,
  source TEXT,
  source_type TEXT,
  embedding VECTOR(1536),
  metadata JSONB,
  created_at TIMESTAMPTZ,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    mk.id,
    mk.morgy_id,
    mk.content,
    mk.source,
    mk.source_type,
    mk.embedding,
    mk.metadata,
    mk.created_at,
    1 - (mk.embedding <=> query_embedding) AS similarity
  FROM morgy_knowledge mk
  WHERE mk.morgy_id = morgy_id_param
    AND 1 - (mk.embedding <=> query_embedding) > match_threshold
  ORDER BY mk.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
`;
