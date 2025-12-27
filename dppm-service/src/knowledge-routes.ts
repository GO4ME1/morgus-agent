/**
 * Knowledge API Routes
 * 
 * Handles knowledge upload, scraping, and management
 */

import { Router } from 'express';
import multer from 'multer';
import { supabase } from './supabase';
import * as fs from 'fs';
import * as path from 'path';

const router = Router();

// Configure multer for file uploads
const upload = multer({
  dest: '/tmp/uploads/',
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

/**
 * POST /api/knowledge/upload
 * Upload a document and extract knowledge
 */
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { morgyId } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Read file content
    const content = fs.readFileSync(file.path, 'utf-8');
    
    // TODO: Extract text from PDF/Word files
    // For now, assume text files
    
    // TODO: Generate embeddings
    // For now, use mock embeddings
    const chunks = Math.ceil(content.length / 1000);

    // Save to database
    const { data: knowledge, error } = await supabase
      .from('morgy_knowledge')
      .insert({
        morgy_id: morgyId,
        title: file.originalname,
        content,
        source_type: 'file',
        chunks,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    // Clean up temp file
    fs.unlinkSync(file.path);

    res.json({
      id: knowledge.id,
      title: file.originalname,
      size: file.size,
      chunks,
    });
  } catch (error) {
    console.error('Failed to upload knowledge:', error);
    res.status(500).json({ error: (error as Error).message });
  }
});

/**
 * POST /api/knowledge/scrape
 * Scrape a website and extract knowledge
 */
router.post('/scrape', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { url, morgyId } = req.body;

    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    // TODO: Implement website scraping
    // For now, return mock data
    const mockContent = `Content scraped from ${url}`;
    const chunks = Math.ceil(mockContent.length / 1000);

    // Save to database
    const { data: knowledge, error } = await supabase
      .from('morgy_knowledge')
      .insert({
        morgy_id: morgyId,
        title: new URL(url).hostname,
        content: mockContent,
        source_type: 'website',
        source_url: url,
        chunks,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    res.json({
      id: knowledge.id,
      title: knowledge.title,
      size: mockContent.length,
      chunks,
    });
  } catch (error) {
    console.error('Failed to scrape website:', error);
    res.status(500).json({ error: (error as Error).message });
  }
});

/**
 * POST /api/knowledge/text
 * Add text content as knowledge
 */
router.post('/text', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { title, content, morgyId } = req.body;

    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required' });
    }

    const chunks = Math.ceil(content.length / 1000);

    // Save to database
    const { data: knowledge, error } = await supabase
      .from('morgy_knowledge')
      .insert({
        morgy_id: morgyId,
        title,
        content,
        source_type: 'text',
        chunks,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    res.json({
      id: knowledge.id,
      title,
      size: content.length,
      chunks,
    });
  } catch (error) {
    console.error('Failed to save text:', error);
    res.status(500).json({ error: (error as Error).message });
  }
});

/**
 * GET /api/knowledge/:morgyId
 * Get all knowledge for a Morgy
 */
router.get('/:morgyId', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { morgyId } = req.params;

    // Verify user owns the Morgy
    const { data: morgy } = await supabase
      .from('morgys')
      .select('id')
      .eq('id', morgyId)
      .eq('user_id', userId)
      .single();

    if (!morgy) {
      return res.status(404).json({ error: 'Morgy not found' });
    }

    // Fetch knowledge
    const { data: knowledge, error } = await supabase
      .from('morgy_knowledge')
      .select('*')
      .eq('morgy_id', morgyId)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    res.json(knowledge || []);
  } catch (error) {
    console.error('Failed to get knowledge:', error);
    res.status(500).json({ error: (error as Error).message });
  }
});

/**
 * DELETE /api/knowledge/:id
 * Delete a knowledge item
 */
router.delete('/:id', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;

    // Verify ownership through Morgy
    const { data: knowledge } = await supabase
      .from('morgy_knowledge')
      .select('morgy_id')
      .eq('id', id)
      .single();

    if (!knowledge) {
      return res.status(404).json({ error: 'Knowledge not found' });
    }

    const { data: morgy } = await supabase
      .from('morgys')
      .select('id')
      .eq('id', knowledge.morgy_id)
      .eq('user_id', userId)
      .single();

    if (!morgy) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Delete knowledge
    const { error } = await supabase
      .from('morgy_knowledge')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Failed to delete knowledge:', error);
    res.status(500).json({ error: (error as Error).message });
  }
});

/**
 * POST /api/knowledge/test
 * Test knowledge retrieval (RAG)
 */
router.post('/test', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { query, morgyId } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    // Verify ownership
    const { data: morgy } = await supabase
      .from('morgys')
      .select('id')
      .eq('id', morgyId)
      .eq('user_id', userId)
      .single();

    if (!morgy) {
      return res.status(404).json({ error: 'Morgy not found' });
    }

    // TODO: Implement semantic search with embeddings
    // For now, simple text search
    const { data: knowledge, error } = await supabase
      .from('morgy_knowledge')
      .select('*')
      .eq('morgy_id', morgyId)
      .ilike('content', `%${query}%`)
      .limit(3);

    if (error) {
      throw error;
    }

    const results = (knowledge || []).map((item) => ({
      id: item.id,
      source: item.title,
      content: item.content.substring(0, 200) + '...',
      score: 0.85, // Mock score
    }));

    res.json(results);
  } catch (error) {
    console.error('Failed to test knowledge:', error);
    res.status(500).json({ error: (error as Error).message });
  }
});

export default router;
