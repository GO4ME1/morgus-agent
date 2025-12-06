/**
 * Morgys Service - Companion Mini-Agents
 * 
 * Morgys are specialized mini-agents with personalities and skills.
 * They appear in the left panel and can perform quick actions.
 */

export interface MorgyPersonality {
  id: string;
  name: string;
  emoji: string;
  description: string;
  specialties: string[];
  tone: 'professional' | 'casual' | 'playful' | 'technical' | 'creative';
}

export interface MorgySkin {
  id: string;
  name: string;
  imageUrl: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  price?: number; // Optional - for paid skins
}

export interface MorgyAction {
  id: string;
  name: string;
  icon: string;
  description: string;
  toolName: string; // Which tool to call
  quickPrompt: string; // Template for the action
}

export interface Morgy {
  id: string;
  personality: MorgyPersonality;
  currentSkin: MorgySkin;
  level: number;
  xp: number;
  unlockedActions: string[];
  stats: {
    tasksCompleted: number;
    imagesGenerated: number;
    videosCreated: number;
    codeWritten: number;
  };
}

/**
 * Default Morgy Personalities
 */
export const DEFAULT_PERSONALITIES: MorgyPersonality[] = [
  {
    id: 'dev-morgy',
    name: 'Dev Morgy',
    emoji: '👨‍💻',
    description: 'Expert coder who loves building apps and fixing bugs',
    specialties: ['coding', 'debugging', 'architecture', 'deployment'],
    tone: 'technical',
  },
  {
    id: 'creative-morgy',
    name: 'Creative Morgy',
    emoji: '🎨',
    description: 'Artistic soul who generates stunning visuals and videos',
    specialties: ['image-generation', 'video-creation', '3d-modeling', 'design'],
    tone: 'creative',
  },
  {
    id: 'research-morgy',
    name: 'Research Morgy',
    emoji: '🔬',
    description: 'Deep thinker who analyzes data and finds insights',
    specialties: ['research', 'analysis', 'data-viz', 'reporting'],
    tone: 'professional',
  },
  {
    id: 'social-morgy',
    name: 'Social Morgy',
    emoji: '📱',
    description: 'Social media expert who creates viral content',
    specialties: ['social-media', 'copywriting', 'tiktok', 'memes'],
    tone: 'playful',
  },
  {
    id: 'business-morgy',
    name: 'Business Morgy',
    emoji: '💼',
    description: 'Strategic advisor for growth and monetization',
    specialties: ['strategy', 'marketing', 'analytics', 'optimization'],
    tone: 'professional',
  },
];

/**
 * Default Morgy Skins
 */
export const DEFAULT_SKINS: MorgySkin[] = [
  {
    id: 'default',
    name: 'Classic Morgy',
    imageUrl: '/skins/classic.png',
    rarity: 'common',
  },
  {
    id: 'cyberpunk',
    name: 'Cyberpunk Morgy',
    imageUrl: '/skins/cyberpunk.png',
    rarity: 'rare',
    price: 500,
  },
  {
    id: 'wizard',
    name: 'Wizard Morgy',
    imageUrl: '/skins/wizard.png',
    rarity: 'epic',
    price: 1000,
  },
  {
    id: 'galaxy',
    name: 'Galaxy Morgy',
    imageUrl: '/skins/galaxy.png',
    rarity: 'legendary',
    price: 2500,
  },
];

/**
 * Quick Actions for Morgys
 */
export const MORGY_ACTIONS: MorgyAction[] = [
  {
    id: 'make-tiktok',
    name: 'Make TikTok',
    icon: '🎬',
    description: 'Generate a TikTok video from this conversation',
    toolName: 'generate_seed_video',
    quickPrompt: 'Create a 15-second TikTok video summarizing: {context}',
  },
  {
    id: 'tweet-it',
    name: 'Tweet It',
    icon: '🐦',
    description: 'Generate a tweet thread about this',
    toolName: 'generate_text',
    quickPrompt: 'Write a viral tweet thread about: {context}',
  },
  {
    id: 'make-meme',
    name: 'Make Meme',
    icon: '😂',
    description: 'Turn this into a meme',
    toolName: 'generate_image_google',
    quickPrompt: 'Create a funny meme image about: {context}',
  },
  {
    id: 'build-app',
    name: 'Build App',
    icon: '🚀',
    description: 'Scaffold a full app for this idea',
    toolName: 'scaffold_app',
    quickPrompt: 'Build a complete app for: {context}',
  },
  {
    id: 'make-3d',
    name: 'Make 3D',
    icon: '🧊',
    description: 'Generate a 3D model',
    toolName: 'generate_seed3d_model',
    quickPrompt: 'Create a 3D model of: {context}',
  },
  {
    id: 'analyze-data',
    name: 'Analyze Data',
    icon: '📊',
    description: 'Create charts and insights',
    toolName: 'generate_chart',
    quickPrompt: 'Analyze and visualize: {context}',
  },
];

/**
 * Morgys Service
 */
export class MorgysService {
  /**
   * Create a new Morgy for a user
   */
  async createMorgy(
    userId: string,
    personalityId: string,
    skinId: string = 'default'
  ): Promise<Morgy> {
    const personality = DEFAULT_PERSONALITIES.find((p) => p.id === personalityId);
    const skin = DEFAULT_SKINS.find((s) => s.id === skinId);

    if (!personality || !skin) {
      throw new Error('Invalid personality or skin');
    }

    const morgy: Morgy = {
      id: `morgy_${Date.now()}`,
      personality,
      currentSkin: skin,
      level: 1,
      xp: 0,
      unlockedActions: ['make-tiktok', 'tweet-it', 'make-meme'], // Default actions
      stats: {
        tasksCompleted: 0,
        imagesGenerated: 0,
        videosCreated: 0,
        codeWritten: 0,
      },
    };

    // TODO: Save to database
    return morgy;
  }

  /**
   * Get user's Morgys
   */
  async getUserMorgys(userId: string): Promise<Morgy[]> {
    // TODO: Fetch from database
    return [];
  }

  /**
   * Execute a Morgy action
   */
  async executeMorgyAction(
    morgyId: string,
    actionId: string,
    context: string
  ): Promise<string> {
    const action = MORGY_ACTIONS.find((a) => a.id === actionId);
    if (!action) {
      throw new Error('Invalid action');
    }

    // Replace {context} in the quick prompt
    const prompt = action.quickPrompt.replace('{context}', context);

    // TODO: Call the appropriate tool
    return `Executing ${action.name}: ${prompt}`;
  }

  /**
   * Level up a Morgy
   */
  async addXP(morgyId: string, xpAmount: number): Promise<Morgy | null> {
    // TODO: Fetch Morgy, add XP, check for level up
    // Level up formula: level = floor(sqrt(xp / 100))
    return null;
  }

  /**
   * Unlock a new action
   */
  async unlockAction(morgyId: string, actionId: string): Promise<boolean> {
    // TODO: Check if user has enough currency/XP, unlock action
    return false;
  }

  /**
   * Change Morgy skin
   */
  async changeSkin(morgyId: string, skinId: string): Promise<boolean> {
    // TODO: Check if skin is owned, apply skin
    return false;
  }

  /**
   * Get available skins for purchase
   */
  getAvailableSkins(): MorgySkin[] {
    return DEFAULT_SKINS;
  }

  /**
   * Get available personalities
   */
  getAvailablePersonalities(): MorgyPersonality[] {
    return DEFAULT_PERSONALITIES;
  }

  /**
   * Get available actions
   */
  getAvailableActions(): MorgyAction[] {
    return MORGY_ACTIONS;
  }
}
