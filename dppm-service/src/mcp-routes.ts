// @ts-nocheck
/**
 * MCP Export API Routes
 * 
 * Handles MCP export, configuration generation, and tool execution
 */

import { Router } from 'express';
import {
  exportMorgyToMCP,
  generateClaudeDesktopConfig,
  createMCPExportPackage,
} from './mcp-export-service';

const router = Router();

/**
 * POST /api/mcp/export
 * Export a Morgy to MCP format
 */
router.post('/export', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { morgyId, options } = req.body;

    const exportPackage = await createMCPExportPackage(morgyId, userId, options);

    res.json(exportPackage);
  } catch (error) {
    console.error('Failed to export Morgy:', error);
    res.status(500).json({ error: (error as Error).message });
  }
});

/**
 * GET /api/mcp/config/:morgyId
 * Get Claude Desktop config for a Morgy
 */
router.get('/config/:morgyId', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { morgyId } = req.params;
    const includeKnowledge = req.query.includeKnowledge === 'true';
    const includeTemplates = req.query.includeTemplates === 'true';

    const config = await generateClaudeDesktopConfig(morgyId, userId, {
      includeKnowledge,
      includeTemplates,
    });

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${morgyId}-mcp.json"`);
    res.send(config);
  } catch (error) {
    console.error('Failed to generate config:', error);
    res.status(500).json({ error: (error as Error).message });
  }
});

/**
 * GET /api/mcp/tools
 * Get available MCP tools for the user
 */
router.get('/tools', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // TODO: Fetch user's Morgys and their available tools
    const tools = [
      {
        name: 'chat',
        description: 'Chat with a Morgy',
        inputSchema: {
          type: 'object',
          properties: {
            morgyId: { type: 'string', description: 'ID of the Morgy to chat with' },
            message: { type: 'string', description: 'Message to send' },
          },
          required: ['morgyId', 'message'],
        },
      },
      {
        name: 'search_knowledge',
        description: 'Search a Morgy\'s knowledge base',
        inputSchema: {
          type: 'object',
          properties: {
            morgyId: { type: 'string', description: 'ID of the Morgy' },
            query: { type: 'string', description: 'Search query' },
          },
          required: ['morgyId', 'query'],
        },
      },
    ];

    res.json({ tools });
  } catch (error) {
    console.error('Failed to get tools:', error);
    res.status(500).json({ error: (error as Error).message });
  }
});

/**
 * POST /api/mcp/execute
 * Execute an MCP tool
 */
router.post('/execute', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { serverName, toolName, arguments: args } = req.body;

    // TODO: Implement actual tool execution
    // For now, return a mock response
    const result = {
      success: true,
      result: {
        message: `Tool ${toolName} executed successfully`,
        args,
      },
      content: `Executed ${serverName}.${toolName}`,
    };

    res.json(result);
  } catch (error) {
    console.error('Failed to execute tool:', error);
    res.status(500).json({ error: (error as Error).message });
  }
});

/**
 * GET /api/mcp/import/:shareId
 * Import a shared Morgy via MCP
 */
router.get('/import/:shareId', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { shareId } = req.params;

    // TODO: Implement import from share link
    // For now, return mock data
    res.json({
      success: true,
      message: 'Import functionality coming soon',
      shareId,
    });
  } catch (error) {
    console.error('Failed to import Morgy:', error);
    res.status(500).json({ error: (error as Error).message });
  }
});

/**
 * POST /api/mcp/test
 * Test MCP connection
 */
router.post('/test', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { morgyId } = req.body;

    // Simple test to verify Morgy exists and is accessible
    const { data: morgy } = await (await import('./supabase')).supabase
      .from('morgys')
      .select('id, name')
      .eq('id', morgyId)
      .eq('user_id', userId)
      .single();

    if (!morgy) {
      return res.status(404).json({ error: 'Morgy not found' });
    }

    res.json({
      success: true,
      message: `MCP connection test successful for ${morgy.name}`,
      morgy,
    });
  } catch (error) {
    console.error('Failed to test MCP:', error);
    res.status(500).json({ error: (error as Error).message });
  }
});

export default router;
