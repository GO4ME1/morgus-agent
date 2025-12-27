import { Router, Request, Response } from 'express';
import { AvatarGenerator, AvatarConfig } from './avatar-generator';
import { authMiddleware } from './auth-middleware';

const router = Router();

const avatarGenerator = new AvatarGenerator(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  process.env.OPENAI_API_KEY || ''
);

/**
 * Generate avatar for a Morgy
 * POST /api/morgys/:id/avatar/generate
 */
router.post('/:id/avatar/generate', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id: morgyId } = req.params;
    const config: AvatarConfig = req.body;

    // Validate config
    if (!config.baseColor || !config.accentColor || !config.characterType || !config.personality) {
      return res.status(400).json({ error: 'Invalid avatar configuration' });
    }

    // Generate and save avatar
    const avatarUrl = await avatarGenerator.generateAndSaveAvatar(config, morgyId);

    res.json({ avatarUrl });
  } catch (error: any) {
    console.error('Avatar generation error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate avatar' });
  }
});

/**
 * Get preset configuration
 * GET /api/avatar/preset/:category
 */
router.get('/preset/:category', async (req: Request, res: Response) => {
  try {
    const { category } = req.params;
    const config = AvatarGenerator.getPresetConfig(category);
    res.json(config);
  } catch (error: any) {
    console.error('Preset config error:', error);
    res.status(500).json({ error: error.message || 'Failed to get preset' });
  }
});

/**
 * Get random colors
 * GET /api/avatar/random-colors
 */
router.get('/random-colors', async (req: Request, res: Response) => {
  try {
    const colors = AvatarGenerator.getRandomColors();
    res.json(colors);
  } catch (error: any) {
    console.error('Random colors error:', error);
    res.status(500).json({ error: error.message || 'Failed to get random colors' });
  }
});

export default router;
