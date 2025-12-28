import { Router, Request, Response } from 'express';
import {
  proposePlatformLearning,
  searchPlatformLearnings,
  getTopPlatformLearnings,
  recordPlatformLearningApplication,
  approvePlatformLearning,
  rejectPlatformLearning,
  proposeMorgyLearning,
  searchMorgyLearnings,
  getMorgyLearningStats,
  recordMorgyLearningApplication,
  approveMorgyLearning,
  rejectMorgyLearning,
  createConversation,
  addConversationMessage,
  getConversationHistory,
  getUserConversations
} from '../services/memory-service';

const router = Router();

// ============================================
// PLATFORM LEARNINGS ROUTES
// ============================================

/**
 * POST /api/memory/platform/propose
 * Propose a new platform learning
 */
router.post('/platform/propose', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const learning = req.body;
    const result = await proposePlatformLearning(learning, userId);

    res.json(result);
  } catch (error: any) {
    console.error('Error proposing platform learning:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/memory/platform/search
 * Search for relevant platform learnings
 */
router.post('/platform/search', async (req: Request, res: Response) => {
  try {
    const { query, category, limit } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    const results = await searchPlatformLearnings(query, category, limit);

    res.json({ learnings: results });
  } catch (error: any) {
    console.error('Error searching platform learnings:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/memory/platform/top
 * Get top performing platform learnings
 */
router.get('/platform/top', async (req: Request, res: Response) => {
  try {
    const category = req.query.category as string | undefined;
    const limit = parseInt(req.query.limit as string) || 10;

    const results = await getTopPlatformLearnings(category, limit);

    res.json({ learnings: results });
  } catch (error: any) {
    console.error('Error getting top platform learnings:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/memory/platform/:id/apply
 * Record that a platform learning was applied
 */
router.post('/platform/:id/apply', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { reflectionId, conversationId, wasSuccessful } = req.body;

    await recordPlatformLearningApplication(id, reflectionId, conversationId, wasSuccessful);

    res.json({ success: true });
  } catch (error: any) {
    console.error('Error recording platform learning application:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/memory/platform/:id/approve
 * Approve a platform learning
 */
router.post('/platform/:id/approve', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;

    await approvePlatformLearning(id, userId);

    res.json({ success: true });
  } catch (error: any) {
    console.error('Error approving platform learning:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/memory/platform/:id/reject
 * Reject a platform learning
 */
router.post('/platform/:id/reject', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    await rejectPlatformLearning(id, reason);

    res.json({ success: true });
  } catch (error: any) {
    console.error('Error rejecting platform learning:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// MORGY LEARNINGS ROUTES
// ============================================

/**
 * POST /api/memory/morgy/propose
 * Propose a new Morgy learning
 */
router.post('/morgy/propose', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const learning = req.body;
    const result = await proposeMorgyLearning(learning, req.body.sessionId);

    res.json(result);
  } catch (error: any) {
    console.error('Error proposing Morgy learning:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/memory/morgy/:morgyId/search
 * Search for relevant Morgy learnings
 */
router.post('/morgy/:morgyId/search', async (req: Request, res: Response) => {
  try {
    const { morgyId } = req.params;
    const { query, limit } = req.body;
    const userId = (req as any).user?.id;

    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    const results = await searchMorgyLearnings(morgyId, query, userId, limit);

    res.json({ learnings: results });
  } catch (error: any) {
    console.error('Error searching Morgy learnings:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/memory/morgy/:morgyId/stats
 * Get Morgy learning statistics
 */
router.get('/morgy/:morgyId/stats', async (req: Request, res: Response) => {
  try {
    const { morgyId } = req.params;

    const stats = await getMorgyLearningStats(morgyId);

    res.json(stats);
  } catch (error: any) {
    console.error('Error getting Morgy learning stats:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/memory/morgy/:id/apply
 * Record that a Morgy learning was applied
 */
router.post('/morgy/:id/apply', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;
    const { morgyId, conversationId, feedback } = req.body;

    await recordMorgyLearningApplication(id, morgyId, userId, conversationId, feedback);

    res.json({ success: true });
  } catch (error: any) {
    console.error('Error recording Morgy learning application:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/memory/morgy/:id/approve
 * Approve a Morgy learning
 */
router.post('/morgy/:id/approve', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;

    await approveMorgyLearning(id, userId);

    res.json({ success: true });
  } catch (error: any) {
    console.error('Error approving Morgy learning:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/memory/morgy/:id/reject
 * Reject a Morgy learning
 */
router.post('/morgy/:id/reject', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    await rejectMorgyLearning(id, reason);

    res.json({ success: true });
  } catch (error: any) {
    console.error('Error rejecting Morgy learning:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// CONVERSATIONS ROUTES
// ============================================

/**
 * POST /api/memory/conversations
 * Create a new conversation
 */
router.post('/conversations', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { morgyId, title } = req.body;

    const result = await createConversation(userId, morgyId, title);

    res.json(result);
  } catch (error: any) {
    console.error('Error creating conversation:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/memory/conversations
 * Get user's conversations
 */
router.get('/conversations', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const status = (req.query.status as 'active' | 'archived' | 'deleted') || 'active';
    const limit = parseInt(req.query.limit as string) || 20;

    const conversations = await getUserConversations(userId, status, limit);

    res.json({ conversations });
  } catch (error: any) {
    console.error('Error getting user conversations:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/memory/conversations/:id/messages
 * Add a message to a conversation
 */
router.post('/conversations/:id/messages', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;
    const { role, content, metadata, appliedLearnings, proposedLearningId } = req.body;

    if (!role || !content) {
      return res.status(400).json({ error: 'Role and content are required' });
    }

    const result = await addConversationMessage(
      id,
      role,
      content,
      metadata,
      appliedLearnings,
      proposedLearningId
    );

    res.json(result);
  } catch (error: any) {
    console.error('Error adding conversation message:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/memory/conversations/:id/messages
 * Get conversation history
 */
router.get('/conversations/:id/messages', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;
    const limit = parseInt(req.query.limit as string) || 50;

    const messages = await getConversationHistory(id, limit);

    res.json({ messages });
  } catch (error: any) {
    console.error('Error getting conversation history:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
