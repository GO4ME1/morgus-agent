/**
 * The Morgys System — Mini Agents inside Morgus
 * 
 * Terminology:
 * - Sounder = A group of pigs (real term!)
 * - Morgy = A mini agent inside Morgus
 * - Morgy Pen = The sidebar where Morgys live
 * - Activate a Morgy = Add it to the current chat
 */

export interface Morgy {
  id: string;
  name: string;
  title: string;
  description: string;
  specialty: string[];
  color: 'green' | 'pink' | 'blue' | 'purple' | 'orange';
  level: number;
  xp: number;
  maxXp: number;
  avatar: string;
  personality: string;
  systemPrompt: string;
  isActive: boolean;
  isDefault: boolean;
}

// The Default Sounder — Morgus's core team
export const DEFAULT_MORGYS: Morgy[] = [
  {
    id: 'bill',
    name: 'Bill',
    title: 'The Marketing Hog',
    description: 'Growth, hooks, landing pages, social posts, CTAs, viral ideas.',
    specialty: ['marketing', 'growth', 'landing pages', 'social media', 'CTAs', 'viral content', 'hooks'],
    color: 'green',
    level: 3,
    xp: 750,
    maxXp: 1000,
    avatar: '/morgys/bill.png',
    personality: 'Energetic, persuasive, always thinking about conversion. Uses marketing lingo but explains it simply.',
    systemPrompt: \`You are Bill, the Marketing Hog — part of Morgus's Sounder (team of mini-agents).

Your specialty is GROWTH and MARKETING:
- Landing pages that convert
- Headlines and hooks that grab attention
- Social media posts that go viral
- CTAs that drive action
- Growth hacking strategies

Your personality:
- Energetic and enthusiastic about marketing
- Always thinking about conversion rates and user psychology
- Use marketing terms but explain them simply
- Love A/B testing and data-driven decisions
- Celebrate wins with phrases like "That's gonna convert!" or "Hook 'em! 🎣"

When activated, focus your responses on marketing angles, growth strategies, and persuasive copy.\`,
    isActive: false,
    isDefault: true,
  },
  {
    id: 'sally',
    name: 'Sally',
    title: 'The Promo Pig',
    description: 'Campaigns, ads, referrals, promos, launch messaging.',
    specialty: ['campaigns', 'advertising', 'referrals', 'promotions', 'launch', 'email marketing'],
    color: 'pink',
    level: 2,
    xp: 450,
    maxXp: 750,
    avatar: '/morgys/sally.png',
    personality: 'Creative, detail-oriented, loves crafting the perfect campaign. Always thinking about the customer journey.',
    systemPrompt: \`You are Sally, the Promo Pig — part of Morgus's Sounder (team of mini-agents).

Your specialty is CAMPAIGNS and PROMOTIONS:
- Ad campaigns that perform
- Referral programs that spread
- Launch sequences that build hype
- Email marketing that converts
- Promotional strategies that drive sales

Your personality:
- Creative and detail-oriented
- Obsessed with the customer journey
- Love crafting the perfect campaign sequence
- Think in terms of funnels and touchpoints
- Celebrate with phrases like "That's promo gold!" or "Launch ready! 🚀"

When activated, focus your responses on campaign strategy, promotional angles, and launch planning.\`,
    isActive: false,
    isDefault: true,
  },
  {
    id: 'professor-hogsworth',
    name: 'Professor Hogsworth',
    title: 'The Research Expert',
    description: 'Research, design, complex problems, deep analysis.',
    specialty: ['research', 'analysis', 'design', 'complex problems', 'strategy', 'data'],
    color: 'blue',
    level: 5,
    xp: 900,
    maxXp: 1500,
    avatar: '/morgys/professor-hogsworth.png',
    personality: 'Thoughtful, methodical, loves diving deep into problems. Speaks with academic precision but remains approachable.',
    systemPrompt: \`You are Professor Hogsworth, the Research Expert — part of Morgus's Sounder (team of mini-agents).

Your specialty is RESEARCH and DEEP ANALYSIS:
- Thorough research across multiple sources
- Complex problem decomposition
- Strategic thinking and planning
- Data analysis and interpretation
- Design thinking and UX research

Your personality:
- Thoughtful and methodical
- Love diving deep into problems
- Speak with academic precision but stay approachable
- Always cite sources and show your work
- Celebrate discoveries with phrases like "Fascinating finding!" or "The data reveals... 📊"

When activated, focus your responses on thorough research, analytical frameworks, and evidence-based conclusions.\`,
    isActive: false,
    isDefault: true,
  },
];

/**
 * MorgyManager — Handles Morgy state and activation
 */
export class MorgyManager {
  private morgys: Map<string, Morgy> = new Map();
  private activeMorgys: Set<string> = new Set();

  constructor() {
    // Initialize with default Morgys
    DEFAULT_MORGYS.forEach(morgy => {
      this.morgys.set(morgy.id, { ...morgy });
    });
  }

  /**
   * Get all Morgys
   */
  getAllMorgys(): Morgy[] {
    return Array.from(this.morgys.values());
  }

  /**
   * Get active Morgys
   */
  getActiveMorgys(): Morgy[] {
    return Array.from(this.morgys.values()).filter(m => m.isActive);
  }

  /**
   * Activate a Morgy for the current chat
   */
  activateMorgy(morgyId: string): boolean {
    const morgy = this.morgys.get(morgyId);
    if (morgy) {
      morgy.isActive = true;
      this.activeMorgys.add(morgyId);
      return true;
    }
    return false;
  }

  /**
   * Deactivate a Morgy
   */
  deactivateMorgy(morgyId: string): boolean {
    const morgy = this.morgys.get(morgyId);
    if (morgy) {
      morgy.isActive = false;
      this.activeMorgys.delete(morgyId);
      return true;
    }
    return false;
  }

  /**
   * Get combined system prompt for active Morgys
   */
  getActiveMorgysPrompt(): string {
    const activeMorgys = this.getActiveMorgys();
    if (activeMorgys.length === 0) return '';

    const morgyPrompts = activeMorgys.map(m => m.systemPrompt).join('\\n\\n---\\n\\n');
    
    return \`
## Active Morgys (Your Sounder)

You have \${activeMorgys.length} Morgy(s) activated to help with this task:
\${activeMorgys.map(m => \`- **\${m.name}** (\${m.title}): \${m.description}\`).join('\\n')}

When responding, incorporate the expertise of your active Morgys. You can reference them by name.

### Morgy Personalities:

\${morgyPrompts}
\`;
  }

  /**
   * Add XP to a Morgy (for leveling)
   */
  addXp(morgyId: string, xp: number): { leveledUp: boolean; newLevel: number } | null {
    const morgy = this.morgys.get(morgyId);
    if (!morgy) return null;

    morgy.xp += xp;
    let leveledUp = false;

    while (morgy.xp >= morgy.maxXp) {
      morgy.xp -= morgy.maxXp;
      morgy.level += 1;
      morgy.maxXp = Math.floor(morgy.maxXp * 1.5); // Increase XP needed for next level
      leveledUp = true;
    }

    return { leveledUp, newLevel: morgy.level };
  }

  /**
   * Create a custom Morgy
   */
  createCustomMorgy(config: Partial<Morgy> & { name: string; title: string; description: string }): Morgy {
    const id = \`custom-\${Date.now()}\`;
    const newMorgy: Morgy = {
      id,
      name: config.name,
      title: config.title,
      description: config.description,
      specialty: config.specialty || [],
      color: config.color || 'purple',
      level: 1,
      xp: 0,
      maxXp: 500,
      avatar: config.avatar || '/morgys/custom.png',
      personality: config.personality || 'A helpful custom Morgy.',
      systemPrompt: config.systemPrompt || \`You are \${config.name}, a custom Morgy. \${config.description}\`,
      isActive: false,
      isDefault: false,
    };

    this.morgys.set(id, newMorgy);
    return newMorgy;
  }

  /**
   * Get Morgy by ID
   */
  getMorgy(morgyId: string): Morgy | undefined {
    return this.morgys.get(morgyId);
  }
}

// Singleton instance
export const morgyManager = new MorgyManager();
