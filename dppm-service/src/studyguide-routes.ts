/**
 * Study Guide Generation API Routes
 */

import { Router, Request, Response } from 'express';
import { 
  generateStudyGuide,
  getStudyGuideStatus,
  getSupportedStudyGuideTypes,
  getSupportedDifficultyLevels,
} from './notebooklm-studyguide';

const router = Router();

/**
 * POST /api/studyguide/generate
 * Generate a study guide from sources
 */
router.post('/generate', async (req: Request, res: Response) => {
  try {
    const { userId, sources, title, notebookId, guideType, difficulty } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    if (!sources || !Array.isArray(sources) || sources.length === 0) {
      return res.status(400).json({ error: 'sources array is required and must not be empty' });
    }

    console.log('📚 Study guide generation request:', {
      userId,
      sourceCount: sources.length,
      title,
      guideType,
      difficulty,
    });

    const result = await generateStudyGuide({
      userId,
      sources,
      title,
      notebookId,
      guideType,
      difficulty,
    });

    if (!result.success) {
      return res.status(500).json({ 
        error: result.error || 'Study guide generation failed',
        notebookId: result.notebookId,
      });
    }

    res.json(result);

  } catch (error) {
    console.error('❌ Study guide generation error:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/studyguide/status/:notebookId
 * Check study guide generation status
 */
router.get('/status/:notebookId', async (req: Request, res: Response) => {
  try {
    const { notebookId } = req.params;

    if (!notebookId) {
      return res.status(400).json({ error: 'notebookId is required' });
    }

    const status = await getStudyGuideStatus(notebookId);
    res.json(status);

  } catch (error) {
    console.error('❌ Status check error:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/studyguide/types
 * Get supported study guide types
 */
router.get('/types', async (req: Request, res: Response) => {
  try {
    const types = getSupportedStudyGuideTypes();
    res.json({ types });
  } catch (error) {
    console.error('❌ Types error:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/studyguide/difficulties
 * Get supported difficulty levels
 */
router.get('/difficulties', async (req: Request, res: Response) => {
  try {
    const levels = getSupportedDifficultyLevels();
    res.json({ levels });
  } catch (error) {
    console.error('❌ Difficulties error:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
