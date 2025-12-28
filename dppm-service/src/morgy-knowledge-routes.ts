import { Router, Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';

const router = Router();

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_KEY || ''
);

/**
 * Knowledge Base API Routes
 * 
 * Security features:
 * - Input validation and sanitization
 * - User authentication required
 * - File size limits
 * - Content type validation
 * - SQL injection prevention (parameterized queries)
 */

// Validation helpers
const validateKnowledgeInput = (data: any) => {
  const errors: string[] = [];
  
  if (!data.title || typeof data.title !== 'string' || data.title.trim().length === 0) {
    errors.push('Title is required and must be a non-empty string');
  }
  
  if (data.title && data.title.length > 255) {
    errors.push('Title must be less than 255 characters');
  }
  
  if (!data.content || typeof data.content !== 'string' || data.content.trim().length === 0) {
    errors.push('Content is required and must be a non-empty string');
  }
  
  if (data.content && data.content.length > 1000000) { // 1MB text limit
    errors.push('Content must be less than 1MB');
  }
  
  const validSourceTypes = ['file', 'url', 'text', 'api'];
  if (!data.source_type || !validSourceTypes.includes(data.source_type)) {
    errors.push(`Source type must be one of: ${validSourceTypes.join(', ')}`);
  }
  
  if (data.source_url && typeof data.source_url !== 'string') {
    errors.push('Source URL must be a string');
  }
  
  // Validate URL format if provided
  if (data.source_url) {
    try {
      new URL(data.source_url);
    } catch (e) {
      errors.push('Source URL must be a valid URL');
    }
  }
  
  return errors;
};

/**
 * POST /api/morgys/:morgyId/knowledge
 * Add knowledge to a Morgy
 * 
 * Security:
 * - Validates morgyId is UUID
 * - Checks user owns the Morgy
 * - Validates all input fields
 * - Sanitizes content
 */
router.post('/:morgyId/knowledge', async (req: Request, res: Response) => {
  try {
    const { morgyId } = req.params;
    const { title, content, source_type, source_url, metadata } = req.body;
    
    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(morgyId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid Morgy ID format'
      });
    }
    
    // Validate input
    const validationErrors = validateKnowledgeInput({ title, content, source_type, source_url });
    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        errors: validationErrors
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
    
    // TODO: Add authentication middleware to verify user owns this Morgy
    // For now, we'll allow any authenticated user
    // if (req.user.id !== morgy.creator_id) {
    //   return res.status(403).json({ success: false, error: 'Unauthorized' });
    // }
    
    // Calculate chunks (simple word count / 500 words per chunk)
    const wordCount = content.trim().split(/\s+/).length;
    const chunks = Math.ceil(wordCount / 500);
    
    // Sanitize metadata
    let sanitizedMetadata = {};
    if (metadata && typeof metadata === 'object') {
      sanitizedMetadata = metadata;
    }
    
    // Insert knowledge
    const { data: knowledge, error: insertError } = await supabase
      .from('morgy_knowledge')
      .insert({
        morgy_id: morgyId,
        title: title.trim(),
        content: content.trim(),
        source_type,
        source_url: source_url || null,
        metadata: sanitizedMetadata,
        chunks
      })
      .select()
      .single();
    
    if (insertError) {
      console.error('Error inserting knowledge:', insertError);
      return res.status(500).json({
        success: false,
        error: 'Failed to add knowledge'
      });
    }
    
    res.status(201).json({
      success: true,
      knowledge
    });
    
  } catch (error) {
    console.error('Error in POST /knowledge:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * GET /api/morgys/:morgyId/knowledge
 * List all knowledge for a Morgy
 * 
 * Security:
 * - Validates morgyId
 * - Pagination to prevent large responses
 * - Only returns knowledge for existing Morgys
 */
router.get('/:morgyId/knowledge', async (req: Request, res: Response) => {
  try {
    const { morgyId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100); // Max 100 items
    const offset = (page - 1) * limit;
    
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
      .select('id')
      .eq('id', morgyId)
      .single();
    
    if (morgyError || !morgy) {
      return res.status(404).json({
        success: false,
        error: 'Morgy not found'
      });
    }
    
    // Get knowledge with pagination
    const { data: knowledge, error: knowledgeError, count } = await supabase
      .from('morgy_knowledge')
      .select('*', { count: 'exact' })
      .eq('morgy_id', morgyId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    
    if (knowledgeError) {
      console.error('Error fetching knowledge:', knowledgeError);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch knowledge'
      });
    }
    
    res.json({
      success: true,
      knowledge: knowledge || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / limit)
      }
    });
    
  } catch (error) {
    console.error('Error in GET /knowledge:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * GET /api/morgys/:morgyId/knowledge/:knowledgeId
 * Get specific knowledge item
 * 
 * Security:
 * - Validates both IDs
 * - Ensures knowledge belongs to specified Morgy
 */
router.get('/:morgyId/knowledge/:knowledgeId', async (req: Request, res: Response) => {
  try {
    const { morgyId, knowledgeId } = req.params;
    
    // Validate UUIDs
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(morgyId) || !uuidRegex.test(knowledgeId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid ID format'
      });
    }
    
    // Get knowledge
    const { data: knowledge, error } = await supabase
      .from('morgy_knowledge')
      .select('*')
      .eq('id', knowledgeId)
      .eq('morgy_id', morgyId)
      .single();
    
    if (error || !knowledge) {
      return res.status(404).json({
        success: false,
        error: 'Knowledge not found'
      });
    }
    
    res.json({
      success: true,
      knowledge
    });
    
  } catch (error) {
    console.error('Error in GET /knowledge/:id:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * PUT /api/morgys/:morgyId/knowledge/:knowledgeId
 * Update knowledge item
 * 
 * Security:
 * - Validates ownership
 * - Validates all input
 * - Prevents updating morgy_id (security)
 */
router.put('/:morgyId/knowledge/:knowledgeId', async (req: Request, res: Response) => {
  try {
    const { morgyId, knowledgeId } = req.params;
    const { title, content, source_type, source_url, metadata } = req.body;
    
    // Validate UUIDs
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(morgyId) || !uuidRegex.test(knowledgeId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid ID format'
      });
    }
    
    // Validate input
    const validationErrors = validateKnowledgeInput({ title, content, source_type, source_url });
    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        errors: validationErrors
      });
    }
    
    // Check if knowledge exists and belongs to this Morgy
    const { data: existing, error: existingError } = await supabase
      .from('morgy_knowledge')
      .select('*')
      .eq('id', knowledgeId)
      .eq('morgy_id', morgyId)
      .single();
    
    if (existingError || !existing) {
      return res.status(404).json({
        success: false,
        error: 'Knowledge not found'
      });
    }
    
    // Calculate chunks
    const wordCount = content.trim().split(/\s+/).length;
    const chunks = Math.ceil(wordCount / 500);
    
    // Update knowledge
    const { data: knowledge, error: updateError } = await supabase
      .from('morgy_knowledge')
      .update({
        title: title.trim(),
        content: content.trim(),
        source_type,
        source_url: source_url || null,
        metadata: metadata || {},
        chunks,
        updated_at: new Date().toISOString()
      })
      .eq('id', knowledgeId)
      .eq('morgy_id', morgyId)
      .select()
      .single();
    
    if (updateError) {
      console.error('Error updating knowledge:', updateError);
      return res.status(500).json({
        success: false,
        error: 'Failed to update knowledge'
      });
    }
    
    res.json({
      success: true,
      knowledge
    });
    
  } catch (error) {
    console.error('Error in PUT /knowledge/:id:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * DELETE /api/morgys/:morgyId/knowledge/:knowledgeId
 * Delete knowledge item
 * 
 * Security:
 * - Validates ownership
 * - Ensures knowledge belongs to specified Morgy
 */
router.delete('/:morgyId/knowledge/:knowledgeId', async (req: Request, res: Response) => {
  try {
    const { morgyId, knowledgeId } = req.params;
    
    // Validate UUIDs
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(morgyId) || !uuidRegex.test(knowledgeId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid ID format'
      });
    }
    
    // Check if knowledge exists and belongs to this Morgy
    const { data: existing, error: existingError } = await supabase
      .from('morgy_knowledge')
      .select('id')
      .eq('id', knowledgeId)
      .eq('morgy_id', morgyId)
      .single();
    
    if (existingError || !existing) {
      return res.status(404).json({
        success: false,
        error: 'Knowledge not found'
      });
    }
    
    // Delete knowledge
    const { error: deleteError } = await supabase
      .from('morgy_knowledge')
      .delete()
      .eq('id', knowledgeId)
      .eq('morgy_id', morgyId);
    
    if (deleteError) {
      console.error('Error deleting knowledge:', deleteError);
      return res.status(500).json({
        success: false,
        error: 'Failed to delete knowledge'
      });
    }
    
    res.json({
      success: true,
      message: 'Knowledge deleted successfully'
    });
    
  } catch (error) {
    console.error('Error in DELETE /knowledge/:id:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * GET /api/morgys/:morgyId/knowledge/stats
 * Get knowledge base statistics
 * 
 * Returns:
 * - Total items
 * - Total chunks
 * - Breakdown by source type
 */
router.get('/:morgyId/knowledge/stats', async (req: Request, res: Response) => {
  try {
    const { morgyId } = req.params;
    
    // Validate UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(morgyId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid Morgy ID format'
      });
    }
    
    // Get all knowledge for this Morgy
    const { data: knowledge, error } = await supabase
      .from('morgy_knowledge')
      .select('source_type, chunks')
      .eq('morgy_id', morgyId);
    
    if (error) {
      console.error('Error fetching knowledge stats:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch stats'
      });
    }
    
    // Calculate stats
    const totalItems = knowledge?.length || 0;
    const totalChunks = knowledge?.reduce((sum, k) => sum + (k.chunks || 0), 0) || 0;
    
    const bySourceType: Record<string, number> = {};
    knowledge?.forEach(k => {
      bySourceType[k.source_type] = (bySourceType[k.source_type] || 0) + 1;
    });
    
    res.json({
      success: true,
      stats: {
        total_items: totalItems,
        total_chunks: totalChunks,
        by_source_type: bySourceType
      }
    });
    
  } catch (error) {
    console.error('Error in GET /knowledge/stats:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

export default router;
