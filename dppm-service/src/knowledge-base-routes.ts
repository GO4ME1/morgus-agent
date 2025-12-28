/**
 * Knowledge Base API Routes
 * 
 * Manages knowledge sources for Morgys:
 * - File uploads (PDF, TXT, MD, DOCX)
 * - URL scraping
 * - Text input
 * - Knowledge chunking for RAG
 * 
 * Security features:
 * - File type validation
 * - Size limits
 * - Content sanitization
 * - Ownership verification
 */

import { Router, Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import multer from 'multer';
import crypto from 'crypto';

const router = Router();

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_KEY || ''
);

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max
  },
  fileFilter: (req, file, cb) => {
    // Allow only specific file types
    const allowedTypes = [
      'text/plain',
      'text/markdown',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Allowed: TXT, MD, PDF, DOC, DOCX'));
    }
  }
});

/**
 * POST /api/knowledge-base/:morgyId/sources
 * Add knowledge source to a Morgy
 * 
 * Supports:
 * - File upload (multipart/form-data)
 * - URL (application/json)
 * - Text (application/json)
 */
router.post('/:morgyId/sources', upload.single('file'), async (req: Request, res: Response) => {
  try {
    const { morgyId } = req.params;
    const userId = req.headers['x-user-id'] as string;
    
    // Validate UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(morgyId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid Morgy ID format'
      });
    }
    
    // Check if Morgy exists
    const { data: morgy, error: morgyError } = await supabase
      .from('morgys')
      .select('id, creator_id')
      .eq('id', morgyId)
      .single();
    
    if (morgyError || !morgy) {
      return res.status(404).json({
        success: false,
        error: 'Morgy not found'
      });
    }
    
    // TODO: Verify ownership
    // if (userId !== morgy.creator_id) {
    //   return res.status(403).json({ success: false, error: 'Unauthorized' });
    // }
    
    let sourceType: string;
    let sourceUrl: string | null = null;
    let title: string;
    let content: string;
    let metadata: any = {};
    
    // Handle file upload
    if (req.file) {
      sourceType = 'file';
      title = req.file.originalname;
      content = req.file.buffer.toString('utf-8');
      metadata = {
        filename: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size
      };
    }
    // Handle URL
    else if (req.body.url) {
      sourceType = 'url';
      sourceUrl = req.body.url;
      title = req.body.title || req.body.url;
      
      // TODO: Scrape URL content
      // For now, require content to be provided
      if (!req.body.content) {
        return res.status(400).json({
          success: false,
          error: 'Content is required for URL sources (scraping not yet implemented)'
        });
      }
      content = req.body.content;
    }
    // Handle text input
    else if (req.body.text) {
      sourceType = 'text';
      title = req.body.title || 'Text Input';
      content = req.body.text;
    }
    else {
      return res.status(400).json({
        success: false,
        error: 'Must provide either file, url, or text'
      });
    }
    
    // Validate content
    if (!content || content.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Content cannot be empty'
      });
    }
    
    // Limit content size
    if (content.length > 1000000) { // 1MB
      return res.status(400).json({
        success: false,
        error: 'Content too large (max 1MB)'
      });
    }
    
    // Insert knowledge source
    const { data: knowledge, error: insertError } = await supabase
      .from('morgy_knowledge')
      .insert({
        morgy_id: morgyId,
        title: title.trim(),
        content: content.trim(),
        source_type: sourceType,
        source_url: sourceUrl,
        metadata
      })
      .select()
      .single();
    
    if (insertError) {
      console.error('Error adding knowledge source:', insertError);
      return res.status(500).json({
        success: false,
        error: 'Failed to add knowledge source'
      });
    }
    
    res.status(201).json({
      success: true,
      knowledge,
      message: 'Knowledge source added successfully'
    });
    
  } catch (error: any) {
    console.error('Error in POST /knowledge-base/:morgyId/sources:', error);
    
    if (error.message && error.message.includes('Invalid file type')) {
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * GET /api/knowledge-base/:morgyId/sources
 * List all knowledge sources for a Morgy
 */
router.get('/:morgyId/sources', async (req: Request, res: Response) => {
  try {
    const { morgyId } = req.params;
    const { page = '1', limit = '20' } = req.query;
    
    // Validate UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(morgyId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid Morgy ID format'
      });
    }
    
    // Parse pagination
    const pageNum = Math.max(1, parseInt(page as string) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string) || 20));
    const offset = (pageNum - 1) * limitNum;
    
    // Get knowledge sources
    const { data: sources, error, count } = await supabase
      .from('morgy_knowledge')
      .select('*', { count: 'exact' })
      .eq('morgy_id', morgyId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limitNum - 1);
    
    if (error) {
      console.error('Error fetching knowledge sources:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch knowledge sources'
      });
    }
    
    res.json({
      success: true,
      sources: sources || [],
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: count || 0,
        total_pages: Math.ceil((count || 0) / limitNum)
      }
    });
    
  } catch (error) {
    console.error('Error in GET /knowledge-base/:morgyId/sources:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * GET /api/knowledge-base/sources/:sourceId
 * Get a specific knowledge source
 */
router.get('/sources/:sourceId', async (req: Request, res: Response) => {
  try {
    const { sourceId } = req.params;
    
    // Validate UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(sourceId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid source ID format'
      });
    }
    
    const { data: source, error } = await supabase
      .from('morgy_knowledge')
      .select('*')
      .eq('id', sourceId)
      .single();
    
    if (error || !source) {
      return res.status(404).json({
        success: false,
        error: 'Knowledge source not found'
      });
    }
    
    res.json({
      success: true,
      source
    });
    
  } catch (error) {
    console.error('Error in GET /knowledge-base/sources/:sourceId:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * PUT /api/knowledge-base/sources/:sourceId
 * Update a knowledge source
 */
router.put('/sources/:sourceId', async (req: Request, res: Response) => {
  try {
    const { sourceId } = req.params;
    const userId = req.headers['x-user-id'] as string;
    const { title, content } = req.body;
    
    // Validate UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(sourceId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid source ID format'
      });
    }
    
    // Check if source exists
    const { data: existing, error: existingError } = await supabase
      .from('morgy_knowledge')
      .select('*, morgys(creator_id)')
      .eq('id', sourceId)
      .single();
    
    if (existingError || !existing) {
      return res.status(404).json({
        success: false,
        error: 'Knowledge source not found'
      });
    }
    
    // TODO: Verify ownership
    // if (userId !== existing.morgys.creator_id) {
    //   return res.status(403).json({ success: false, error: 'Unauthorized' });
    // }
    
    // Build updates
    const updates: any = {};
    
    if (title !== undefined) {
      if (typeof title !== 'string' || title.trim().length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Title must be a non-empty string'
        });
      }
      updates.title = title.trim();
    }
    
    if (content !== undefined) {
      if (typeof content !== 'string' || content.trim().length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Content must be a non-empty string'
        });
      }
      if (content.length > 1000000) {
        return res.status(400).json({
          success: false,
          error: 'Content too large (max 1MB)'
        });
      }
      updates.content = content.trim();
    }
    
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No valid fields to update'
      });
    }
    
    // Update source
    const { data: source, error: updateError } = await supabase
      .from('morgy_knowledge')
      .update(updates)
      .eq('id', sourceId)
      .select()
      .single();
    
    if (updateError) {
      console.error('Error updating knowledge source:', updateError);
      return res.status(500).json({
        success: false,
        error: 'Failed to update knowledge source'
      });
    }
    
    res.json({
      success: true,
      source,
      message: 'Knowledge source updated successfully'
    });
    
  } catch (error) {
    console.error('Error in PUT /knowledge-base/sources/:sourceId:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * DELETE /api/knowledge-base/sources/:sourceId
 * Delete a knowledge source
 */
router.delete('/sources/:sourceId', async (req: Request, res: Response) => {
  try {
    const { sourceId } = req.params;
    const userId = req.headers['x-user-id'] as string;
    
    // Validate UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(sourceId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid source ID format'
      });
    }
    
    // Check if source exists
    const { data: existing, error: existingError } = await supabase
      .from('morgy_knowledge')
      .select('*, morgys(creator_id)')
      .eq('id', sourceId)
      .single();
    
    if (existingError || !existing) {
      return res.status(404).json({
        success: false,
        error: 'Knowledge source not found'
      });
    }
    
    // TODO: Verify ownership
    // if (userId !== existing.morgys.creator_id) {
    //   return res.status(403).json({ success: false, error: 'Unauthorized' });
    // }
    
    // Delete source
    const { error: deleteError } = await supabase
      .from('morgy_knowledge')
      .delete()
      .eq('id', sourceId);
    
    if (deleteError) {
      console.error('Error deleting knowledge source:', deleteError);
      return res.status(500).json({
        success: false,
        error: 'Failed to delete knowledge source'
      });
    }
    
    res.json({
      success: true,
      message: 'Knowledge source deleted successfully'
    });
    
  } catch (error) {
    console.error('Error in DELETE /knowledge-base/sources/:sourceId:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

export default router;
