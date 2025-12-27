/**
 * Podcast Generation API Routes
 * 
 * REST API for NotebookLM podcast generation
 */

import { Router, Request, Response } from 'express';
import { 
  generatePodcast, 
  getPodcastStatus,
  getEstimatedGenerationTime,
  getPodcastInstructions,
  getPodcastTips,
} from './notebooklm-podcast';

const router = Router();

/**
 * POST /api/podcast/generate
 * Generate a podcast from conversation sources
 */
router.post('/generate', async (req: Request, res: Response) => {
  try {
    const { userId, sources, title, notebookId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    if (!sources || !Array.isArray(sources) || sources.length === 0) {
      return res.status(400).json({ error: 'sources array is required and must not be empty' });
    }

    console.log('🎧 Podcast generation request:', {
      userId,
      sourceCount: sources.length,
      title,
    });

    const result = await generatePodcast({
      userId,
      sources,
      title,
      notebookId,
    });

    if (!result.success) {
      return res.status(500).json({ 
        error: result.error || 'Podcast generation failed',
        notebookId: result.notebookId,
      });
    }

    // Get instructions for user
    const instructions = getPodcastInstructions(result.notebookId);
    const tips = getPodcastTips();

    res.json({
      success: true,
      notebookId: result.notebookId,
      notebookUrl: `https://notebooklm.google.com/notebook/${result.notebookId}`,
      instructions,
      tips,
      estimatedTime: getEstimatedGenerationTime(sources),
    });

  } catch (error) {
    console.error('❌ Podcast generation error:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/podcast/status/:notebookId
 * Check podcast generation status
 */
router.get('/status/:notebookId', async (req: Request, res: Response) => {
  try {
    const { notebookId } = req.params;

    if (!notebookId) {
      return res.status(400).json({ error: 'notebookId is required' });
    }

    const status = await getPodcastStatus(notebookId);

    res.json(status);

  } catch (error) {
    console.error('❌ Status check error:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/podcast/estimate
 * Get estimated generation time
 */
router.post('/estimate', async (req: Request, res: Response) => {
  try {
    const { sources } = req.body;

    if (!sources || !Array.isArray(sources)) {
      return res.status(400).json({ error: 'sources array is required' });
    }

    const estimatedTime = getEstimatedGenerationTime(sources);

    res.json({
      estimatedTime,
      estimatedMinutes: Math.round(estimatedTime / 60),
      sourceCount: sources.length,
    });

  } catch (error) {
    console.error('❌ Estimation error:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/podcast/tips
 * Get podcast generation tips
 */
router.get('/tips', async (req: Request, res: Response) => {
  try {
    const tips = getPodcastTips();
    res.json({ tips });
  } catch (error) {
    console.error('❌ Tips error:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
