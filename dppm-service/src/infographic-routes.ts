// @ts-nocheck
/**
 * Infographic Generation API Routes
 */

import { Router, Request, Response } from 'express';
import { 
  generateInfographic,
  getInfographicStatus,
  getSupportedChartTypes,
  getInfographicInstructions,
  getInfographicTips,
} from './notebooklm-infographic';

const router = Router();

/**
 * POST /api/infographic/generate
 * Generate an infographic from sources
 */
router.post('/generate', async (req: Request, res: Response) => {
  try {
    const { userId, sources, title, notebookId, chartType } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    if (!sources || !Array.isArray(sources) || sources.length === 0) {
      return res.status(400).json({ error: 'sources array is required and must not be empty' });
    }

    console.log('📊 Infographic generation request:', {
      userId,
      sourceCount: sources.length,
      title,
      chartType,
    });

    const result = await generateInfographic({
      userId,
      sources,
      title,
      notebookId,
      chartType,
    });

    if (!result.success) {
      return res.status(500).json({ 
        error: result.error || 'Infographic generation failed',
        notebookId: result.notebookId,
      });
    }

    res.json(result);

  } catch (error) {
    console.error('❌ Infographic generation error:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/infographic/status/:notebookId
 * Check infographic generation status
 */
router.get('/status/:notebookId', async (req: Request, res: Response) => {
  try {
    const { notebookId } = req.params;

    if (!notebookId) {
      return res.status(400).json({ error: 'notebookId is required' });
    }

    const status = await getInfographicStatus(notebookId);
    res.json(status);

  } catch (error) {
    console.error('❌ Status check error:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/infographic/types
 * Get supported chart types
 */
router.get('/types', async (req: Request, res: Response) => {
  try {
    const types = getSupportedChartTypes();
    res.json({ types });
  } catch (error) {
    console.error('❌ Types error:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
