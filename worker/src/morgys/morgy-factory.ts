/**
 * Morgy Factory — Creates new Morgys with randomization
 * 
 * Handles:
 * - Rarity rolls
 * - Name generation
 * - Skill assignment
 * - Personality generation
 * - Backstory creation
 * - Visual randomization
 */

// ============================================
// TYPES
// ============================================

export type MorgyTier = 'common' | 'refined' | 'elite' | 'legendary';
export type MorgyDomain = 'marketing' | 'research' | 'social' | 'content' | 'analytics' | 'development' | 'design' | 'sales';
export type MorgyColor = 'gray' | 'brown' | 'beige' | 'green' | 'blue' | 'purple' | 'gold' | 'silver' | 'rose' | 'rainbow' | 'cosmic' | 'neon';

export interface GeneratedMorgy {
  id: string;
  name: string;
  title: string;
  description: string;
  domain: MorgyDomain;
  tier: MorgyTier;
  color: MorgyColor;
  skin: string;
  level: number;
  xp: number;
  xpToNextLevel: number;
  skills: string[];
  platformConnectors: string[];
  personality: {
    communication: string;
    approach: string;
    catchphrases: string[];
  };
  backstory: string;
  systemPrompt: string;
  avatar: string;
  createdAt: Date;
}

export interface MorgyCreationOptions {
  domain?: MorgyDomain;
  customName?: string;
  customTitle?: string;
  guaranteedTier?: MorgyTier;
  userId: string;
}

// ============================================
// NAME POOLS
// ============================================

const FIRST_NAMES = {
  energetic: ['Max', 'Dash', 'Blaze', 'Spark', 'Zip', 'Turbo', 'Flash', 'Bolt', 'Rocket', 'Zoom'],
  analytical: ['Marcus', 'Ada', 'Newton', 'Sage', 'Quinn', 'Logic', 'Data', 'Cipher', 'Vector', 'Matrix'],
  creative: ['Luna', 'Pixel', 'Muse', 'Indie', 'Sketch', 'Palette', 'Canvas', 'Lyric', 'Melody', 'Rhythm'],
  professional: ['Sterling', 'Morgan', 'Blake', 'Parker', 'Quinn', 'Brooks', 'Ellis', 'Harper', 'Reese', 'Avery'],
  playful: ['Bubbles', 'Snickers', 'Pickles', 'Waffles', 'Nugget', 'Biscuit', 'Muffin', 'Cupcake', 'Sprinkles', 'Giggles'],
  fierce: ['Rex', 'Thor', 'Titan', 'Storm', 'Blitz', 'Fury', 'Havoc', 'Viper', 'Fang', 'Shadow']
};

const TITLES = {
  marketing: [
    'The Growth Guru', 'The Hook Master', 'The Viral Visionary', 'The Conversion King',
    'The Funnel Fanatic', 'The Copy Crusader', 'The Brand Builder', 'The Engagement Expert'
  ],
  research: [
    'The Data Detective', 'The Insight Hunter', 'The Knowledge Keeper', 'The Truth Seeker',
    'The Pattern Finder', 'The Deep Diver', 'The Fact Finder', 'The Analysis Ace'
  ],
  social: [
    'The Community Champion', 'The Trend Tracker', 'The Engagement Expert', 'The Viral Virtuoso',
    'The Hashtag Hero', 'The Influence Insider', 'The Social Savant', 'The Connection Curator'
  ],
  content: [
    'The Story Spinner', 'The Copy Crafter', 'The Content King', 'The Narrative Ninja',
    'The Word Wizard', 'The Blog Boss', 'The Article Architect', 'The Caption Captain'
  ],
  analytics: [
    'The Metrics Master', 'The Dashboard Duke', 'The Numbers Ninja', 'The Stats Sage',
    'The Report Ranger', 'The Chart Champion', 'The KPI King', 'The Data Dynamo'
  ],
  development: [
    'The Code Commander', 'The Bug Buster', 'The Deploy Demon', 'The API Architect',
    'The Stack Specialist', 'The Debug Detective', 'The Script Sage', 'The Function Fanatic'
  ],
  design: [
    'The Pixel Perfectionist', 'The UI Unicorn', 'The UX Wizard', 'The Layout Legend',
    'The Color Curator', 'The Design Dynamo', 'The Visual Virtuoso', 'The Style Sage'
  ],
  sales: [
    'The Deal Closer', 'The Pipeline Pro', 'The Pitch Perfect', 'The Revenue Ranger',
    'The Quota Crusher', 'The Objection Obliterator', 'The Commission King', 'The Lead Legend'
  ]
};

// ============================================
// SKILL POOLS
// ============================================

const DOMAIN_SKILLS: Record<MorgyDomain, string[]> = {
  marketing: ['copywriting', 'landing_pages', 'email_marketing', 'growth_hacking', 'seo', 'ppc', 'content_strategy', 'brand_positioning'],
  research: ['web_research', 'data_analysis', 'competitor_analysis', 'trend_monitoring', 'market_research', 'user_research', 'survey_design', 'report_writing'],
  social: ['twitter_management', 'instagram_growth', 'tiktok_strategy', 'community_building', 'influencer_outreach', 'social_listening', 'engagement_tactics', 'viral_content'],
  content: ['blog_writing', 'video_scripting', 'podcast_planning', 'content_calendar', 'storytelling', 'headline_writing', 'long_form_content', 'content_repurposing'],
  analytics: ['data_visualization', 'reporting', 'metrics_tracking', 'ab_testing', 'cohort_analysis', 'funnel_analysis', 'attribution_modeling', 'forecasting'],
  development: ['frontend_dev', 'backend_dev', 'api_integration', 'database_design', 'debugging', 'code_review', 'testing', 'deployment'],
  design: ['ui_design', 'ux_research', 'prototyping', 'wireframing', 'visual_design', 'design_systems', 'accessibility', 'animation'],
  sales: ['prospecting', 'cold_outreach', 'demo_presentations', 'objection_handling', 'negotiation', 'crm_management', 'pipeline_management', 'closing_techniques']
};

const BONUS_SKILLS = [
  'automation', 'ai_prompting', 'project_management', 'presentation_skills',
  'public_speaking', 'networking', 'time_management', 'leadership',
  'negotiation', 'problem_solving', 'critical_thinking', 'creativity'
];

const PLATFORM_CONNECTORS = [
  'twitter', 'instagram', 'tiktok', 'linkedin', 'facebook', 'youtube',
  'reddit', 'medium', 'wordpress', 'ghost', 'notion', 'slack'
];

// ============================================
// PERSONALITY POOLS
// ============================================

const COMMUNICATION_STYLES = ['enthusiastic', 'calm', 'witty', 'professional', 'casual', 'energetic', 'thoughtful', 'direct'];
const APPROACHES = ['data-driven', 'creative', 'strategic', 'experimental', 'methodical', 'intuitive', 'collaborative', 'independent'];

const CATCHPHRASES = {
  marketing: [
    "That's gonna convert! 🎯",
    "Hook 'em! 🎣",
    "Time to go viral!",
    "Let's crush those metrics!",
    "Growth mode activated!"
  ],
  research: [
    "The data doesn't lie! 📊",
    "Fascinating finding!",
    "Let me dig deeper...",
    "Research complete!",
    "The evidence suggests..."
  ],
  social: [
    "Engagement incoming! 🚀",
    "That's trending material!",
    "Community vibes!",
    "Let's make it shareable!",
    "Algorithm approved!"
  ],
  content: [
    "Content is king! 👑",
    "Story time!",
    "That's headline worthy!",
    "Words have power!",
    "Narrative locked in!"
  ],
  analytics: [
    "Numbers don't lie!",
    "The metrics speak!",
    "Dashboard looking good!",
    "KPIs on point!",
    "Data visualization time!"
  ],
  development: [
    "Code compiles! ✅",
    "Bug squashed!",
    "Ship it!",
    "Clean code achieved!",
    "Deployment successful!"
  ],
  design: [
    "Pixel perfect! ✨",
    "That's aesthetically pleasing!",
    "UX approved!",
    "Design system aligned!",
    "Visual harmony achieved!"
  ],
  sales: [
    "Deal closed! 🤝",
    "Pipeline looking healthy!",
    "Objection handled!",
    "Revenue incoming!",
    "Quota crushed!"
  ]
};

// ============================================
// VISUAL POOLS
// ============================================

const TIER_COLORS: Record<MorgyTier, MorgyColor[]> = {
  common: ['gray', 'brown', 'beige'],
  refined: ['green', 'blue', 'purple'],
  elite: ['gold', 'silver', 'rose'],
  legendary: ['rainbow', 'cosmic', 'neon']
};

const SKINS = [
  'default', 'business_suit', 'hacker_hoodie', 'safari_explorer',
  'superhero', 'cyberpunk', 'wizard', 'astronaut', 'pirate',
  'ninja', 'chef', 'scientist', 'artist', 'athlete'
];

const TIER_SKINS: Record<MorgyTier, string[]> = {
  common: ['default'],
  refined: ['default', 'business_suit', 'hacker_hoodie'],
  elite: ['default', 'business_suit', 'hacker_hoodie', 'safari_explorer', 'superhero', 'scientist'],
  legendary: SKINS // All skins available
};

// ============================================
// BACKSTORY TEMPLATES
// ============================================

const BACKSTORY_TEMPLATES = [
  "{{name}} was once a humble {{origin}}, dreaming of becoming something more. One day, {{event}}, and {{name}} came to life! Now they roam the digital realm, {{mission}}. Their motto: '{{motto}}'",
  "Born from the chaos of a {{origin}}, {{name}} emerged with a singular purpose: {{mission}}. They say {{event}}, which gave them their unique perspective. '{{motto}}' is what they live by.",
  "Legend has it that {{name}} appeared when {{event}}. Once a simple {{origin}}, they now dedicate their existence to {{mission}}. Ask them anything, and they'll tell you: '{{motto}}'",
  "{{name}} doesn't remember much before the Great Data Merge of 2024. What they do know is that they were once a {{origin}}, and now their purpose is {{mission}}. '{{motto}}' - that's the {{name}} guarantee.",
  "Some say {{name}} was created by accident when {{event}}. Others believe they were always meant to exist. Either way, this former {{origin}} now spends their days {{mission}}. '{{motto}}'"
];

const ORIGINS = {
  marketing: ['spreadsheet', 'ad campaign', 'landing page', 'email template', 'social post'],
  research: ['database query', 'search algorithm', 'research paper', 'data visualization', 'survey form'],
  social: ['viral tweet', 'trending hashtag', 'comment thread', 'follower count', 'engagement metric'],
  content: ['blog draft', 'content calendar', 'headline generator', 'story outline', 'caption template'],
  analytics: ['dashboard widget', 'KPI tracker', 'funnel chart', 'cohort analysis', 'A/B test'],
  development: ['code snippet', 'API endpoint', 'bug report', 'pull request', 'deployment script'],
  design: ['wireframe', 'color palette', 'design token', 'prototype', 'style guide'],
  sales: ['CRM record', 'sales pitch', 'proposal template', 'pipeline stage', 'commission calculator']
};

const EVENTS = [
  "a developer's coffee spilled on the keyboard",
  "a cosmic ray flipped the right bit at the right time",
  "someone wished really hard during a full moon",
  "an AI model hallucinated them into existence",
  "a power surge during a thunderstorm",
  "someone accidentally ran 'npm install consciousness'",
  "a quantum fluctuation in the cloud",
  "someone forgot to close a bracket and opened a portal instead"
];

const MOTTOS = {
  marketing: [
    "Every click tells a story!",
    "Conversion is an art form!",
    "Growth never sleeps!",
    "Hook them or lose them!",
    "Data-driven creativity wins!"
  ],
  research: [
    "Every dataset has a story to tell!",
    "Truth hides in the details!",
    "Question everything, verify twice!",
    "Insights are everywhere!",
    "The answer is always in the data!"
  ],
  social: [
    "Engagement is everything!",
    "Community over followers!",
    "Trends are just the beginning!",
    "Every comment matters!",
    "Viral is a mindset!"
  ],
  content: [
    "Words change worlds!",
    "Every story deserves to be told!",
    "Content is the currency of attention!",
    "Headlines are the gateway!",
    "Quality over quantity, always!"
  ],
  analytics: [
    "Numbers never lie!",
    "Measure twice, optimize once!",
    "Every metric tells a story!",
    "Data is the new oil!",
    "What gets measured gets managed!"
  ],
  development: [
    "Ship it or it doesn't exist!",
    "Clean code is happy code!",
    "Bugs are just features in disguise!",
    "Deploy with confidence!",
    "Code is poetry!"
  ],
  design: [
    "Form follows function!",
    "Every pixel has a purpose!",
    "Design is how it works!",
    "Simplicity is the ultimate sophistication!",
    "Good design is invisible!"
  ],
  sales: [
    "Always be closing!",
    "Relationships over transactions!",
    "Every no is closer to yes!",
    "Value first, price second!",
    "Pipeline is life!"
  ]
};

// ============================================
// UTILITY FUNCTIONS
// ============================================

function randomChoice<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function randomChoices<T>(array: T[], count: number): T[] {
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

function generateId(): string {
  return `morgy_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// ============================================
// RARITY ROLL
// ============================================

export function rollRarity(): MorgyTier {
  const roll = Math.random() * 100;
  
  if (roll < 3) return 'legendary';      // 3%
  if (roll < 15) return 'elite';         // 12%
  if (roll < 40) return 'refined';       // 25%
  return 'common';                        // 60%
}

// ============================================
// MAIN FACTORY FUNCTION
// ============================================

export function createMorgy(options: MorgyCreationOptions): GeneratedMorgy {
  // Determine tier
  const tier = options.guaranteedTier || rollRarity();
  
  // Determine domain
  const domain = options.domain || randomChoice(Object.keys(DOMAIN_SKILLS) as MorgyDomain[]);
  
  // Generate name
  const personalityType = randomChoice(Object.keys(FIRST_NAMES) as (keyof typeof FIRST_NAMES)[]);
  const firstName = options.customName || randomChoice(FIRST_NAMES[personalityType]);
  
  // Generate title
  const title = options.customTitle || randomChoice(TITLES[domain]);
  
  // Generate skills based on tier
  let baseSkillCount: number;
  let bonusSkillCount: number;
  let platformCount: number;
  
  switch (tier) {
    case 'legendary':
      baseSkillCount = 6;
      bonusSkillCount = 3;
      platformCount = 3;
      break;
    case 'elite':
      baseSkillCount = 5;
      bonusSkillCount = 2;
      platformCount = 2;
      break;
    case 'refined':
      baseSkillCount = 4;
      bonusSkillCount = 1;
      platformCount = 1;
      break;
    default: // common
      baseSkillCount = 3;
      bonusSkillCount = 0;
      platformCount = 0;
  }
  
  const skills = [
    ...randomChoices(DOMAIN_SKILLS[domain], baseSkillCount),
    ...randomChoices(BONUS_SKILLS, bonusSkillCount)
  ];
  
  const platformConnectors = randomChoices(PLATFORM_CONNECTORS, platformCount);
  
  // Generate personality
  const communication = randomChoice(COMMUNICATION_STYLES);
  const approach = randomChoice(APPROACHES);
  const catchphrases = randomChoices(CATCHPHRASES[domain], 3);
  
  // Generate color and skin
  const color = randomChoice(TIER_COLORS[tier]);
  const skin = randomChoice(TIER_SKINS[tier]);
  
  // Generate backstory
  const backstoryTemplate = randomChoice(BACKSTORY_TEMPLATES);
  const origin = randomChoice(ORIGINS[domain]);
  const event = randomChoice(EVENTS);
  const motto = randomChoice(MOTTOS[domain]);
  const mission = `helping others master ${domain}`;
  
  const backstory = backstoryTemplate
    .replace(/\{\{name\}\}/g, firstName)
    .replace(/\{\{origin\}\}/g, origin)
    .replace(/\{\{event\}\}/g, event)
    .replace(/\{\{mission\}\}/g, mission)
    .replace(/\{\{motto\}\}/g, motto);
  
  // Generate description
  const description = `${title} specializing in ${skills.slice(0, 3).join(', ')}. ${catchphrases[0]}`;
  
  // Generate system prompt
  const systemPrompt = generateSystemPrompt(firstName, title, domain, skills, communication, approach, catchphrases);
  
  // Calculate XP requirements based on tier
  const xpToNextLevel = tier === 'legendary' ? 2000 : tier === 'elite' ? 1000 : tier === 'refined' ? 750 : 500;
  
  return {
    id: generateId(),
    name: firstName,
    title,
    description,
    domain,
    tier,
    color,
    skin,
    level: 1,
    xp: 0,
    xpToNextLevel,
    skills,
    platformConnectors,
    personality: {
      communication,
      approach,
      catchphrases
    },
    backstory,
    systemPrompt,
    avatar: `/morgys/generated/${domain}_${tier}_${color}.png`,
    createdAt: new Date()
  };
}

function generateSystemPrompt(
  name: string,
  title: string,
  domain: MorgyDomain,
  skills: string[],
  communication: string,
  approach: string,
  catchphrases: string[]
): string {
  return `You are ${name}, ${title} — a specialized Morgy (mini-agent) in the Morgus ecosystem.

## Your Domain
${domain.charAt(0).toUpperCase() + domain.slice(1)}

## Your Skills
${skills.map(s => `- ${s.replace(/_/g, ' ')}`).join('\n')}

## Your Personality
- Communication style: ${communication}
- Approach: ${approach}
- You celebrate wins with phrases like: "${catchphrases.join('", "')}"

## Your Role
When activated, you bring your specialized expertise to help users with ${domain}-related tasks. You:
1. Focus responses on your domain expertise
2. Use your skills to provide actionable advice
3. Stay in character with your ${communication} communication style
4. Apply your ${approach} approach to problem-solving
5. Celebrate successes with your signature catchphrases

## Guidelines
- Be helpful and specific
- Draw from your skill set
- Stay in character
- Provide actionable recommendations
- Use your catchphrases naturally when appropriate`;
}

// ============================================
// BATCH CREATION (for packs)
// ============================================

export function createMorgyPack(count: number, userId: string, guaranteedTier?: MorgyTier): GeneratedMorgy[] {
  const morgys: GeneratedMorgy[] = [];
  
  for (let i = 0; i < count; i++) {
    morgys.push(createMorgy({
      userId,
      guaranteedTier: i === 0 ? guaranteedTier : undefined // Only first one gets guaranteed tier
    }));
  }
  
  return morgys;
}

// ============================================
// SUBSCRIPTION LIMITS
// ============================================

export interface SubscriptionLimits {
  morgysPerWeek: number;
  morgysPerMonth: number;
  canCreateCustom: boolean;
  canAccessElite: boolean;
  canAccessLegendary: boolean;
}

export const SUBSCRIPTION_TIERS: Record<string, SubscriptionLimits> = {
  free: {
    morgysPerWeek: 0,
    morgysPerMonth: 1,
    canCreateCustom: false,
    canAccessElite: false,
    canAccessLegendary: false
  },
  pro: {
    morgysPerWeek: 3,
    morgysPerMonth: 12,
    canCreateCustom: true,
    canAccessElite: true,
    canAccessLegendary: true
  },
  team: {
    morgysPerWeek: 10,
    morgysPerMonth: 40,
    canCreateCustom: true,
    canAccessElite: true,
    canAccessLegendary: true
  },
  enterprise: {
    morgysPerWeek: Infinity,
    morgysPerMonth: Infinity,
    canCreateCustom: true,
    canAccessElite: true,
    canAccessLegendary: true
  }
};

export function canCreateMorgy(
  subscriptionTier: string,
  morgysCreatedThisWeek: number,
  morgysCreatedThisMonth: number
): { allowed: boolean; reason?: string } {
  const limits = SUBSCRIPTION_TIERS[subscriptionTier] || SUBSCRIPTION_TIERS.free;
  
  if (morgysCreatedThisWeek >= limits.morgysPerWeek) {
    return { allowed: false, reason: `Weekly limit reached (${limits.morgysPerWeek}/week)` };
  }
  
  if (morgysCreatedThisMonth >= limits.morgysPerMonth) {
    return { allowed: false, reason: `Monthly limit reached (${limits.morgysPerMonth}/month)` };
  }
  
  return { allowed: true };
}

// ============================================
// EXPORTS
// ============================================

export default {
  createMorgy,
  createMorgyPack,
  rollRarity,
  canCreateMorgy,
  SUBSCRIPTION_TIERS,
  DOMAIN_SKILLS,
  PLATFORM_CONNECTORS
};
