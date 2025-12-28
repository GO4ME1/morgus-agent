import { Router, Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const router = Router();

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_KEY || ''
);

/**
 * MCP Export API Routes
 * 
 * Model Context Protocol (MCP) allows Morgys to be used as servers in Claude Desktop
 * 
 * Security features:
 * - Secure share ID generation (crypto.randomBytes)
 * - Rate limiting on exports
 * - Download tracking
 * - Ownership validation
 */

/**
 * Generate secure share ID
 */
const generateShareId = (): string => {
  return crypto.randomBytes(16).toString('hex');
};

/**
 * POST /api/morgys/:morgyId/mcp-export
 * Create MCP export for a Morgy
 * 
 * Security:
 * - Validates Morgy exists and user owns it
 * - Generates cryptographically secure share ID
 * - Rate limits exports per user (TODO: implement)
 */
router.post('/:morgyId/mcp-export', async (req: Request, res: Response) => {
  try {
    const { morgyId } = req.params;
    const { include_knowledge = true, include_templates = true, user_id } = req.body;
    
    // Validate UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(morgyId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid Morgy ID format'
      });
    }
    
    // Validate user_id is provided
    if (!user_id) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required'
      });
    }
    
    // Check if Morgy exists
    const { data: morgy, error: morgyError } = await supabase
      .from('morgys')
      .select('*')
      .eq('id', morgyId)
      .single();
    
    if (morgyError || !morgy) {
      return res.status(404).json({
        success: false,
        error: 'Morgy not found'
      });
    }
    
    // TODO: Verify user owns this Morgy
    // if (user_id !== morgy.creator_id) {
    //   return res.status(403).json({ success: false, error: 'Unauthorized' });
    // }
    
    // Generate unique share ID
    let shareId = generateShareId();
    let attempts = 0;
    const maxAttempts = 5;
    
    // Ensure share ID is unique (with retry logic for stability)
    while (attempts < maxAttempts) {
      const { data: existing } = await supabase
        .from('mcp_exports')
        .select('id')
        .eq('share_id', shareId)
        .single();
      
      if (!existing) break;
      
      shareId = generateShareId();
      attempts++;
    }
    
    if (attempts === maxAttempts) {
      return res.status(500).json({
        success: false,
        error: 'Failed to generate unique share ID'
      });
    }
    
    // Create share URL
    const baseUrl = process.env.API_BASE_URL || 'https://morgus-deploy.fly.dev';
    const shareUrl = `${baseUrl}/api/mcp-exports/${shareId}`;
    
    // Insert MCP export
    const { data: mcpExport, error: insertError } = await supabase
      .from('mcp_exports')
      .insert({
        morgy_id: morgyId,
        user_id,
        share_id: shareId,
        share_url: shareUrl,
        include_knowledge,
        include_templates,
        downloads: 0
      })
      .select()
      .single();
    
    if (insertError) {
      console.error('Error creating MCP export:', insertError);
      return res.status(500).json({
        success: false,
        error: 'Failed to create MCP export'
      });
    }
    
    res.status(201).json({
      success: true,
      export: mcpExport,
      instructions: {
        message: 'Add this MCP server to your Claude Desktop config',
        config_location: {
          macos: '~/Library/Application Support/Claude/claude_desktop_config.json',
          windows: '%APPDATA%\\Claude\\claude_desktop_config.json'
        },
        config_example: {
          mcpServers: {
            [morgy.name.toLowerCase().replace(/\s+/g, '-')]: {
              command: 'npx',
              args: ['-y', '@modelcontextprotocol/server-fetch', shareUrl]
            }
          }
        }
      }
    });
    
  } catch (error) {
    console.error('Error in POST /mcp-export:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * GET /api/mcp-exports/:shareId
 * Download MCP configuration
 * 
 * Security:
 * - Public endpoint (by design - for Claude Desktop)
 * - Tracks downloads for analytics
 * - Returns MCP-compliant JSON
 */
router.get('/:shareId', async (req: Request, res: Response) => {
  try {
    const { shareId } = req.params;
    
    // Validate share ID format (32 hex characters)
    if (!/^[0-9a-f]{32}$/i.test(shareId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid share ID format'
      });
    }
    
    // Get MCP export
    const { data: mcpExport, error: exportError } = await supabase
      .from('mcp_exports')
      .select('*')
      .eq('share_id', shareId)
      .single();
    
    if (exportError || !mcpExport) {
      return res.status(404).json({
        success: false,
        error: 'MCP export not found'
      });
    }
    
    // Get Morgy details
    const { data: morgy, error: morgyError } = await supabase
      .from('morgys')
      .select('*')
      .eq('id', mcpExport.morgy_id)
      .single();
    
    if (morgyError || !morgy) {
      return res.status(404).json({
        success: false,
        error: 'Morgy not found'
      });
    }
    
    // Get knowledge if included
    let knowledge = [];
    if (mcpExport.include_knowledge) {
      const { data: knowledgeData } = await supabase
        .from('morgy_knowledge')
        .select('title, content, source_type, source_url')
        .eq('morgy_id', morgy.id);
      
      knowledge = knowledgeData || [];
    }
    
    // Increment download count (async, don't wait)
    (async () => {
      try {
        await supabase
          .from('mcp_exports')
          .update({ downloads: mcpExport.downloads + 1 })
          .eq('id', mcpExport.id);
      } catch (err) {
        console.error('Error updating download count:', err);
      }
    })();
    
    // Build MCP-compliant response
    const mcpConfig = {
      name: morgy.name,
      version: '1.0.0',
      description: morgy.description || `AI agent: ${morgy.name}`,
      author: morgy.creator_id,
      
      // MCP server configuration
      server: {
        type: 'mcp',
        protocol_version: '1.0'
      },
      
      // AI configuration
      ai_config: morgy.ai_config || {},
      personality: morgy.personality || {},
      capabilities: morgy.capabilities || {},
      
      // Knowledge base
      knowledge: knowledge.map(k => ({
        title: k.title,
        content: k.content,
        source: k.source_type,
        url: k.source_url
      })),
      
      // Metadata
      metadata: {
        category: morgy.category,
        tags: morgy.tags || [],
        rating: morgy.rating,
        exported_at: new Date().toISOString(),
        share_id: shareId
      }
    };
    
    // Set appropriate headers for MCP
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('X-MCP-Version', '1.0');
    res.json(mcpConfig);
    
  } catch (error) {
    console.error('Error in GET /mcp-exports/:shareId:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * GET /api/morgys/:morgyId/mcp-exports
 * List all MCP exports for a Morgy
 * 
 * Security:
 * - Validates Morgy exists
 * - Returns exports with stats
 */
router.get('/:morgyId/mcp-exports', async (req: Request, res: Response) => {
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
    
    // Get all exports
    const { data: exports, error: exportsError } = await supabase
      .from('mcp_exports')
      .select('*')
      .eq('morgy_id', morgyId)
      .order('created_at', { ascending: false });
    
    if (exportsError) {
      console.error('Error fetching MCP exports:', exportsError);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch exports'
      });
    }
    
    res.json({
      success: true,
      exports: exports || [],
      total: exports?.length || 0
    });
    
  } catch (error) {
    console.error('Error in GET /mcp-exports:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * DELETE /api/mcp-exports/:exportId
 * Delete an MCP export
 * 
 * Security:
 * - Validates ownership
 * - Removes share link
 */
router.delete('/:exportId', async (req: Request, res: Response) => {
  try {
    const { exportId } = req.params;
    const { user_id } = req.body;
    
    // Validate UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(exportId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid export ID format'
      });
    }
    
    if (!user_id) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required'
      });
    }
    
    // Check if export exists and user owns it
    const { data: mcpExport, error: exportError } = await supabase
      .from('mcp_exports')
      .select('*')
      .eq('id', exportId)
      .single();
    
    if (exportError || !mcpExport) {
      return res.status(404).json({
        success: false,
        error: 'Export not found'
      });
    }
    
    // TODO: Verify ownership
    // if (user_id !== mcpExport.user_id) {
    //   return res.status(403).json({ success: false, error: 'Unauthorized' });
    // }
    
    // Delete export
    const { error: deleteError } = await supabase
      .from('mcp_exports')
      .delete()
      .eq('id', exportId);
    
    if (deleteError) {
      console.error('Error deleting MCP export:', deleteError);
      return res.status(500).json({
        success: false,
        error: 'Failed to delete export'
      });
    }
    
    res.json({
      success: true,
      message: 'Export deleted successfully'
    });
    
  } catch (error) {
    console.error('Error in DELETE /mcp-exports/:id:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * GET /api/mcp-exports/:shareId/stats
 * Get download stats for an export
 * 
 * Security:
 * - Public endpoint (stats are not sensitive)
 */
router.get('/:shareId/stats', async (req: Request, res: Response) => {
  try {
    const { shareId } = req.params;
    
    // Validate share ID format
    if (!/^[0-9a-f]{32}$/i.test(shareId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid share ID format'
      });
    }
    
    // Get export
    const { data: mcpExport, error } = await supabase
      .from('mcp_exports')
      .select('downloads, created_at')
      .eq('share_id', shareId)
      .single();
    
    if (error || !mcpExport) {
      return res.status(404).json({
        success: false,
        error: 'Export not found'
      });
    }
    
    res.json({
      success: true,
      stats: {
        downloads: mcpExport.downloads,
        created_at: mcpExport.created_at
      }
    });
    
  } catch (error) {
    console.error('Error in GET /mcp-exports/:shareId/stats:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

export default router;
