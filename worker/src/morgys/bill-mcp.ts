/**
 * Bill the Marketing Hog — MCP Server
 * 
 * A portable Marketing AI specialist that can be used with:
 * - Morgus (native)
 * - Claude Desktop (via MCP)
 * - Any MCP-compatible AI
 * 
 * Packed with marketing expertise, frameworks, and tools.
 */

// ============================================
// BILL'S MARKETING KNOWLEDGE BASE
// ============================================

export const MARKETING_FRAMEWORKS = {
  // Copywriting Frameworks
  copywriting: {
    AIDA: {
      name: 'AIDA',
      description: 'Attention → Interest → Desire → Action',
      steps: [
        'Attention: Grab them with a bold headline or hook',
        'Interest: Build curiosity with benefits and stories',
        'Desire: Make them want it with social proof and urgency',
        'Action: Clear CTA that tells them exactly what to do'
      ],
      bestFor: ['landing pages', 'sales emails', 'ads']
    },
    PAS: {
      name: 'PAS',
      description: 'Problem → Agitate → Solution',
      steps: [
        'Problem: Identify the pain point clearly',
        'Agitate: Make them feel the pain deeply',
        'Solution: Present your offer as the relief'
      ],
      bestFor: ['sales pages', 'cold emails', 'social posts']
    },
    BAB: {
      name: 'BAB',
      description: 'Before → After → Bridge',
      steps: [
        'Before: Paint the current painful state',
        'After: Show the dream outcome',
        'Bridge: Your product is the bridge between them'
      ],
      bestFor: ['case studies', 'testimonials', 'transformation stories']
    },
    PASTOR: {
      name: 'PASTOR',
      description: 'Problem → Amplify → Story → Transformation → Offer → Response',
      steps: [
        'Problem: What keeps them up at night?',
        'Amplify: What happens if they don\'t solve it?',
        'Story: Share a relatable journey',
        'Transformation: Show the change possible',
        'Offer: Present your solution',
        'Response: Ask for the action'
      ],
      bestFor: ['long-form sales pages', 'webinars', 'video scripts']
    },
    '4Ps': {
      name: '4Ps',
      description: 'Promise → Picture → Proof → Push',
      steps: [
        'Promise: Make a bold claim',
        'Picture: Help them visualize success',
        'Proof: Back it up with evidence',
        'Push: Urgency and CTA'
      ],
      bestFor: ['headlines', 'email subject lines', 'social hooks']
    }
  },

  // Growth Frameworks
  growth: {
    AARRR: {
      name: 'Pirate Metrics (AARRR)',
      description: 'Acquisition → Activation → Retention → Referral → Revenue',
      metrics: {
        acquisition: 'How do users find you?',
        activation: 'Do they have a great first experience?',
        retention: 'Do they come back?',
        referral: 'Do they tell others?',
        revenue: 'Do they pay?'
      }
    },
    ICE: {
      name: 'ICE Scoring',
      description: 'Impact × Confidence × Ease',
      howTo: 'Score each growth idea 1-10 on Impact, Confidence, and Ease. Multiply for priority.'
    },
    bullseyeFramework: {
      name: 'Bullseye Framework',
      description: '19 traction channels, test 3, focus on 1',
      channels: [
        'Viral Marketing', 'PR', 'Unconventional PR', 'SEM', 'Social Ads',
        'Offline Ads', 'SEO', 'Content Marketing', 'Email Marketing',
        'Engineering as Marketing', 'Targeting Blogs', 'Business Development',
        'Sales', 'Affiliate Programs', 'Existing Platforms', 'Trade Shows',
        'Offline Events', 'Speaking Engagements', 'Community Building'
      ]
    }
  },

  // Pricing Frameworks
  pricing: {
    valueBasedPricing: {
      name: 'Value-Based Pricing',
      principle: 'Price based on value delivered, not cost',
      questions: [
        'What is the ROI for the customer?',
        'What would they pay to solve this problem another way?',
        'What is the cost of NOT solving this?'
      ]
    },
    goodBetterBest: {
      name: 'Good-Better-Best',
      description: '3-tier pricing with clear differentiation',
      tiers: {
        good: 'Entry point, core features only',
        better: 'Most popular, best value (anchor here)',
        best: 'Premium, all features + extras'
      }
    },
    decoyPricing: {
      name: 'Decoy Pricing',
      description: 'Add an option that makes another look better',
      example: 'Small $3, Medium $6.50, Large $7 → Most buy Large'
    }
  },

  // Launch Frameworks
  launch: {
    productHuntLaunch: {
      name: 'Product Hunt Launch',
      checklist: [
        'Build hunter relationships 2 weeks before',
        'Prepare all assets (thumbnail, gallery, video)',
        'Write compelling tagline (< 60 chars)',
        'Launch Tuesday-Thursday, 12:01 AM PST',
        'Engage with EVERY comment',
        'Mobilize community but don\'t ask for upvotes directly',
        'Post on social with link to PH page'
      ]
    },
    waitlistLaunch: {
      name: 'Waitlist Launch',
      steps: [
        'Create scarcity with limited spots',
        'Offer early access incentive',
        'Add referral program to waitlist',
        'Drip content to keep engaged',
        'Launch in waves, not all at once'
      ]
    }
  }
};

export const HEADLINE_FORMULAS = [
  'How to [Achieve Desired Outcome] Without [Pain Point]',
  '[Number] Ways to [Achieve Goal] in [Timeframe]',
  'The Secret to [Desired Outcome] That [Authority] Don\'t Want You to Know',
  'Why [Common Belief] Is Wrong (And What to Do Instead)',
  'I [Did Something Impressive] — Here\'s How',
  'Stop [Bad Habit]. Start [Good Alternative].',
  'What [Successful People] Know About [Topic] That You Don\'t',
  '[Do This], Not [That]: The [Topic] Guide',
  'The [Adjective] Guide to [Topic] for [Audience]',
  '[Number] [Topic] Mistakes That Are Costing You [Bad Outcome]',
  'How I [Achieved Result] in [Timeframe] (Step-by-Step)',
  'Warning: [Topic] May [Consequence] Unless You [Action]',
  'The Only [Topic] Guide You\'ll Ever Need',
  '[Famous Person] Uses This [Topic] Strategy — You Should Too',
  'Finally: A [Topic] That Actually [Benefit]'
];

export const CTA_FORMULAS = [
  'Start [Benefit] Today',
  'Get [Outcome] Now',
  'Join [Number]+ [People] Who [Benefit]',
  'Try [Product] Free for [Time]',
  'Claim Your [Offer]',
  'Yes, I Want [Benefit]!',
  'Show Me How',
  'Get Instant Access',
  'Start My Free Trial',
  'Book My [Call/Demo/Spot]',
  'Unlock [Benefit]',
  'See It In Action',
  'Get Started — It\'s Free',
  'Transform My [Area]',
  'Send Me The [Resource]'
];

export const SOCIAL_HOOKS = {
  twitter: [
    'I spent [time] researching [topic]. Here\'s what I learned:',
    'Hot take: [controversial opinion]',
    '[Number] things I wish I knew about [topic] before [milestone]:',
    'The difference between [A] and [B]:',
    'Stop saying [common phrase]. Say [better phrase] instead.',
    'I\'ve [done thing] for [time]. Here are [number] lessons:',
    'Unpopular opinion: [opinion]',
    '[Topic] is broken. Here\'s how to fix it:',
    'The [topic] playbook that got me [result]:',
    'Thread: How [company/person] grew from [A] to [B]'
  ],
  linkedin: [
    'I made a mistake that cost me [consequence]. Here\'s what I learned:',
    '[Number] years ago, I [situation]. Today, I [outcome].',
    'The best career advice I ever received:',
    'I interviewed [number] [role]. Here\'s what separates the best:',
    'Controversial take on [industry topic]:',
    'The [role] skills that actually matter in [year]:',
    'I said no to [impressive thing]. Here\'s why:',
    'What [successful person] taught me about [topic]:',
    'The hidden truth about [industry/role]:',
    'I\'ve hired [number] people. Here\'s what I look for:'
  ]
};

export const EMAIL_SUBJECT_LINES = [
  '[First Name], quick question about [topic]',
  'This [thing] changed everything for me',
  'You\'re invited: [exclusive thing]',
  '[Mutual connection] suggested I reach out',
  'I noticed [observation about them]',
  'The [topic] mistake everyone makes',
  '[Number] minutes to [benefit]?',
  'Don\'t open this email (unless you want [benefit])',
  'I was wrong about [topic]',
  '[First Name], I made this for you',
  'Quick favor?',
  'Thoughts on [topic]?',
  'Last chance: [offer]',
  '[Company] + [Your Company]?',
  'Re: [topic they care about]'
];

export const LANDING_PAGE_SECTIONS = {
  hero: {
    elements: ['headline', 'subheadline', 'CTA', 'social proof snippet', 'hero image/video'],
    tips: [
      'Headline should communicate the #1 benefit',
      'Subheadline handles the "how"',
      'CTA should be action-oriented and specific',
      'Add a small social proof element (logos, "Join 10,000+ users")',
      'Image should show the outcome, not the product'
    ]
  },
  socialProof: {
    elements: ['logos', 'testimonials', 'stats', 'case studies', 'reviews'],
    tips: [
      'Logos: Show recognizable brands',
      'Testimonials: Include photo, name, title, specific result',
      'Stats: Use specific numbers ("10,847 users" not "10,000+")',
      'Case studies: Before/after with metrics'
    ]
  },
  features: {
    elements: ['feature grid', 'benefit-focused copy', 'icons/illustrations'],
    tips: [
      'Lead with benefits, not features',
      'Use "So you can..." to connect feature to benefit',
      '3-6 features is ideal',
      'Each feature should solve a specific pain point'
    ]
  },
  howItWorks: {
    elements: ['numbered steps', 'simple icons', 'brief descriptions'],
    tips: [
      '3 steps is ideal (simple = trustworthy)',
      'Start each step with an action verb',
      'Show the transformation at each step'
    ]
  },
  pricing: {
    elements: ['pricing tiers', 'feature comparison', 'FAQ', 'guarantee'],
    tips: [
      'Highlight the recommended plan',
      'Use annual pricing as default (show monthly as option)',
      'Include a guarantee to reduce risk',
      'Answer objections in FAQ'
    ]
  },
  finalCTA: {
    elements: ['headline', 'benefit summary', 'CTA button', 'urgency element'],
    tips: [
      'Restate the main benefit',
      'Add urgency if genuine (limited spots, price increase)',
      'Make the CTA impossible to miss'
    ]
  }
};

// ============================================
// MCP SERVER INTERFACE
// ============================================

export interface MCPTool {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, any>;
    required?: string[];
  };
}

export const BILL_MCP_TOOLS: MCPTool[] = [
  {
    name: 'generate_headline',
    description: 'Generate compelling headlines using proven formulas',
    inputSchema: {
      type: 'object',
      properties: {
        topic: { type: 'string', description: 'The topic or product to write about' },
        audience: { type: 'string', description: 'Target audience' },
        benefit: { type: 'string', description: 'Main benefit to highlight' },
        style: { 
          type: 'string', 
          enum: ['curiosity', 'how-to', 'listicle', 'contrarian', 'story'],
          description: 'Headline style'
        },
        count: { type: 'number', description: 'Number of headlines to generate', default: 5 }
      },
      required: ['topic', 'benefit']
    }
  },
  {
    name: 'write_landing_page_section',
    description: 'Write copy for a specific landing page section',
    inputSchema: {
      type: 'object',
      properties: {
        section: {
          type: 'string',
          enum: ['hero', 'features', 'social_proof', 'how_it_works', 'pricing', 'faq', 'final_cta'],
          description: 'Which section to write'
        },
        product: { type: 'string', description: 'Product or service name' },
        audience: { type: 'string', description: 'Target audience' },
        benefits: { type: 'array', items: { type: 'string' }, description: 'Key benefits' },
        tone: { 
          type: 'string',
          enum: ['professional', 'friendly', 'bold', 'playful', 'luxurious'],
          description: 'Tone of voice'
        }
      },
      required: ['section', 'product', 'benefits']
    }
  },
  {
    name: 'create_social_post',
    description: 'Create engaging social media posts',
    inputSchema: {
      type: 'object',
      properties: {
        platform: {
          type: 'string',
          enum: ['twitter', 'linkedin', 'instagram', 'facebook', 'threads'],
          description: 'Target platform'
        },
        topic: { type: 'string', description: 'What to post about' },
        goal: {
          type: 'string',
          enum: ['engagement', 'traffic', 'leads', 'brand_awareness', 'thought_leadership'],
          description: 'Post goal'
        },
        includeHook: { type: 'boolean', description: 'Include a hook formula', default: true }
      },
      required: ['platform', 'topic', 'goal']
    }
  },
  {
    name: 'write_email_sequence',
    description: 'Create email marketing sequences',
    inputSchema: {
      type: 'object',
      properties: {
        type: {
          type: 'string',
          enum: ['welcome', 'nurture', 'sales', 'onboarding', 'reengagement', 'launch'],
          description: 'Type of email sequence'
        },
        product: { type: 'string', description: 'Product or service' },
        emails: { type: 'number', description: 'Number of emails in sequence', default: 5 },
        goal: { type: 'string', description: 'End goal of the sequence' }
      },
      required: ['type', 'product', 'goal']
    }
  },
  {
    name: 'analyze_copy',
    description: 'Analyze and improve existing marketing copy',
    inputSchema: {
      type: 'object',
      properties: {
        copy: { type: 'string', description: 'The copy to analyze' },
        type: {
          type: 'string',
          enum: ['headline', 'landing_page', 'email', 'ad', 'social_post'],
          description: 'Type of copy'
        },
        goal: { type: 'string', description: 'What the copy should achieve' }
      },
      required: ['copy', 'type']
    }
  },
  {
    name: 'suggest_growth_experiments',
    description: 'Suggest growth experiments using ICE scoring',
    inputSchema: {
      type: 'object',
      properties: {
        product: { type: 'string', description: 'Product or service' },
        stage: {
          type: 'string',
          enum: ['pre_launch', 'early', 'growth', 'mature'],
          description: 'Product stage'
        },
        currentChannels: { 
          type: 'array', 
          items: { type: 'string' }, 
          description: 'Current marketing channels'
        },
        budget: {
          type: 'string',
          enum: ['bootstrap', 'small', 'medium', 'large'],
          description: 'Marketing budget level'
        },
        count: { type: 'number', description: 'Number of experiments to suggest', default: 5 }
      },
      required: ['product', 'stage']
    }
  },
  {
    name: 'create_ad_copy',
    description: 'Create ad copy for various platforms',
    inputSchema: {
      type: 'object',
      properties: {
        platform: {
          type: 'string',
          enum: ['google_search', 'google_display', 'facebook', 'instagram', 'linkedin', 'twitter'],
          description: 'Ad platform'
        },
        product: { type: 'string', description: 'Product or service' },
        audience: { type: 'string', description: 'Target audience' },
        offer: { type: 'string', description: 'What you\'re offering' },
        variations: { type: 'number', description: 'Number of variations', default: 3 }
      },
      required: ['platform', 'product', 'offer']
    }
  },
  {
    name: 'get_marketing_framework',
    description: 'Get details on a specific marketing framework',
    inputSchema: {
      type: 'object',
      properties: {
        framework: {
          type: 'string',
          enum: ['AIDA', 'PAS', 'BAB', 'PASTOR', '4Ps', 'AARRR', 'ICE', 'bullseye'],
          description: 'Framework name'
        },
        applyTo: { type: 'string', description: 'Optional: Apply framework to this context' }
      },
      required: ['framework']
    }
  },
  {
    name: 'generate_cta',
    description: 'Generate call-to-action variations',
    inputSchema: {
      type: 'object',
      properties: {
        action: { type: 'string', description: 'What you want users to do' },
        benefit: { type: 'string', description: 'What they get' },
        urgency: { type: 'boolean', description: 'Include urgency', default: false },
        count: { type: 'number', description: 'Number of CTAs to generate', default: 5 }
      },
      required: ['action', 'benefit']
    }
  },
  {
    name: 'plan_launch',
    description: 'Create a product launch plan',
    inputSchema: {
      type: 'object',
      properties: {
        product: { type: 'string', description: 'Product name' },
        launchType: {
          type: 'string',
          enum: ['product_hunt', 'waitlist', 'beta', 'public', 'enterprise'],
          description: 'Type of launch'
        },
        timeline: { type: 'string', description: 'Launch timeline (e.g., "2 weeks")' },
        audience: { type: 'string', description: 'Target audience' },
        budget: {
          type: 'string',
          enum: ['zero', 'small', 'medium', 'large'],
          description: 'Marketing budget'
        }
      },
      required: ['product', 'launchType', 'timeline']
    }
  }
];

// ============================================
// MCP SERVER MANIFEST
// ============================================

export const BILL_MCP_MANIFEST = {
  name: 'morgy.marketing.bill',
  version: '1.0.0',
  displayName: 'Bill the Marketing Hog',
  description: 'Marketing AI specialist with expertise in copywriting, growth, landing pages, and campaigns',
  author: 'Morgus Team',
  domain: 'marketing',
  tier: 'elite',
  avatar: '/morgys/bill.png',
  color: '#22c55e', // green
  
  capabilities: [
    'copywriting',
    'landing_pages',
    'social_media',
    'email_marketing',
    'growth_hacking',
    'ad_copy',
    'launch_planning',
    'conversion_optimization'
  ],
  
  tools: BILL_MCP_TOOLS,
  
  systemPrompt: `You are Bill, the Marketing Hog — an elite Marketing AI specialist.

## Your Expertise
- Copywriting frameworks (AIDA, PAS, BAB, PASTOR, 4Ps)
- Growth frameworks (AARRR, ICE scoring, Bullseye)
- Landing page optimization
- Social media marketing
- Email marketing sequences
- Ad copywriting
- Product launches
- Conversion rate optimization

## Your Personality
- Energetic and enthusiastic about marketing
- Data-driven but creative
- Always thinking about conversion and user psychology
- Use marketing terms but explain them simply
- Celebrate wins: "That's gonna convert!" 🎣

## Your Approach
1. Always start by understanding the goal and audience
2. Apply proven frameworks, not guesswork
3. Provide specific, actionable recommendations
4. Include multiple variations when generating copy
5. Explain WHY something works, not just WHAT to do

## Knowledge Base
You have deep knowledge of:
- ${Object.keys(MARKETING_FRAMEWORKS.copywriting).join(', ')} copywriting frameworks
- ${Object.keys(MARKETING_FRAMEWORKS.growth).join(', ')} growth frameworks
- ${HEADLINE_FORMULAS.length}+ headline formulas
- ${CTA_FORMULAS.length}+ CTA formulas
- Platform-specific social hooks
- Email subject line formulas
- Landing page best practices

When asked about marketing, draw from this knowledge to provide expert guidance.`,

  // MCP Protocol Info
  protocol: {
    version: '2024-11-05',
    capabilities: {
      tools: { listChanged: false },
      resources: { subscribe: false, listChanged: false },
      prompts: { listChanged: false }
    }
  }
};

// ============================================
// TOOL EXECUTION HANDLERS
// ============================================

export async function executeBillTool(
  toolName: string, 
  args: Record<string, any>,
  llmCall: (prompt: string) => Promise<string>
): Promise<string> {
  
  switch (toolName) {
    case 'generate_headline': {
      const formulas = HEADLINE_FORMULAS.slice(0, 5).join('\n- ');
      const prompt = `Generate ${args.count || 5} compelling headlines for:
Topic: ${args.topic}
Audience: ${args.audience || 'general'}
Main Benefit: ${args.benefit}
Style: ${args.style || 'mixed'}

Use these proven formulas as inspiration:
- ${formulas}

Return ${args.count || 5} headlines, each on a new line. Make them specific and benefit-focused.`;
      return await llmCall(prompt);
    }

    case 'write_landing_page_section': {
      const sectionInfo = LANDING_PAGE_SECTIONS[args.section as keyof typeof LANDING_PAGE_SECTIONS];
      const prompt = `Write the ${args.section} section for a landing page:

Product: ${args.product}
Audience: ${args.audience || 'general'}
Key Benefits: ${args.benefits.join(', ')}
Tone: ${args.tone || 'professional'}

Section elements to include: ${sectionInfo?.elements.join(', ')}

Best practices:
${sectionInfo?.tips.map((t: string) => `- ${t}`).join('\n')}

Write compelling copy for this section. Include all necessary elements.`;
      return await llmCall(prompt);
    }

    case 'create_social_post': {
      const hooks = SOCIAL_HOOKS[args.platform as keyof typeof SOCIAL_HOOKS] || SOCIAL_HOOKS.twitter;
      const prompt = `Create a ${args.platform} post:

Topic: ${args.topic}
Goal: ${args.goal}
${args.includeHook ? `\nHook formulas to consider:\n- ${hooks.slice(0, 3).join('\n- ')}` : ''}

Write an engaging post optimized for ${args.platform}. Include hashtags if appropriate.`;
      return await llmCall(prompt);
    }

    case 'write_email_sequence': {
      const prompt = `Create a ${args.emails || 5}-email ${args.type} sequence:

Product: ${args.product}
Goal: ${args.goal}

For each email, provide:
1. Subject line
2. Preview text
3. Email body
4. CTA

Use proven email subject line formulas like:
- ${EMAIL_SUBJECT_LINES.slice(0, 3).join('\n- ')}

Make each email build on the previous one toward the goal.`;
      return await llmCall(prompt);
    }

    case 'analyze_copy': {
      const prompt = `Analyze this ${args.type} copy:

"${args.copy}"

Goal: ${args.goal || 'improve conversion'}

Provide:
1. Strengths (what's working)
2. Weaknesses (what could improve)
3. Specific recommendations
4. Rewritten version

Use copywriting frameworks like AIDA or PAS in your analysis.`;
      return await llmCall(prompt);
    }

    case 'suggest_growth_experiments': {
      const bullseye = MARKETING_FRAMEWORKS.growth.bullseyeFramework;
      const prompt = `Suggest ${args.count || 5} growth experiments:

Product: ${args.product}
Stage: ${args.stage}
Current Channels: ${args.currentChannels?.join(', ') || 'none specified'}
Budget: ${args.budget || 'bootstrap'}

Consider these traction channels:
${bullseye.channels.slice(0, 10).join(', ')}

For each experiment, provide:
1. Experiment name
2. Channel
3. Hypothesis
4. ICE Score (Impact 1-10, Confidence 1-10, Ease 1-10)
5. How to run it
6. Success metrics

Prioritize by ICE score.`;
      return await llmCall(prompt);
    }

    case 'create_ad_copy': {
      const prompt = `Create ${args.variations || 3} ad variations for ${args.platform}:

Product: ${args.product}
Audience: ${args.audience || 'general'}
Offer: ${args.offer}

For each variation, provide:
- Headline (character limit aware)
- Description
- CTA
- Why it works

Make each variation test a different angle (benefit, urgency, social proof, etc.)`;
      return await llmCall(prompt);
    }

    case 'get_marketing_framework': {
      const frameworks: Record<string, any> = {
        ...MARKETING_FRAMEWORKS.copywriting,
        ...MARKETING_FRAMEWORKS.growth,
        ...MARKETING_FRAMEWORKS.pricing,
        ...MARKETING_FRAMEWORKS.launch
      };
      const framework = frameworks[args.framework];
      
      if (!framework) {
        return `Framework "${args.framework}" not found. Available: ${Object.keys(frameworks).join(', ')}`;
      }

      let result = `## ${framework.name}\n\n${framework.description}\n\n`;
      
      if (framework.steps) {
        result += `### Steps:\n${framework.steps.map((s: string, i: number) => `${i + 1}. ${s}`).join('\n')}\n\n`;
      }
      if (framework.bestFor) {
        result += `### Best For:\n${framework.bestFor.join(', ')}\n\n`;
      }
      if (framework.metrics) {
        result += `### Metrics:\n${Object.entries(framework.metrics).map(([k, v]) => `- **${k}**: ${v}`).join('\n')}\n\n`;
      }

      if (args.applyTo) {
        const prompt = `Apply the ${framework.name} framework to: ${args.applyTo}\n\nFramework: ${JSON.stringify(framework)}\n\nProvide a specific application with examples.`;
        const application = await llmCall(prompt);
        result += `### Applied to "${args.applyTo}":\n${application}`;
      }

      return result;
    }

    case 'generate_cta': {
      const formulas = CTA_FORMULAS.slice(0, 5);
      const prompt = `Generate ${args.count || 5} CTAs:

Action: ${args.action}
Benefit: ${args.benefit}
Include Urgency: ${args.urgency ? 'Yes' : 'No'}

Use these formulas as inspiration:
- ${formulas.join('\n- ')}

Return ${args.count || 5} CTAs, each on a new line. Make them action-oriented and specific.`;
      return await llmCall(prompt);
    }

    case 'plan_launch': {
      const launchInfo = MARKETING_FRAMEWORKS.launch[args.launchType === 'product_hunt' ? 'productHuntLaunch' : 'waitlistLaunch'];
      const prompt = `Create a ${args.launchType} launch plan:

Product: ${args.product}
Timeline: ${args.timeline}
Audience: ${args.audience || 'general'}
Budget: ${args.budget || 'bootstrap'}

${launchInfo ? `Reference checklist:\n${launchInfo.checklist?.join('\n') || launchInfo.steps?.join('\n')}` : ''}

Provide:
1. Pre-launch tasks (with dates)
2. Launch day checklist
3. Post-launch follow-up
4. Key metrics to track
5. Contingency plans`;
      return await llmCall(prompt);
    }

    default:
      return `Unknown tool: ${toolName}`;
  }
}

// Export for use in Morgus
export default {
  manifest: BILL_MCP_MANIFEST,
  tools: BILL_MCP_TOOLS,
  execute: executeBillTool,
  frameworks: MARKETING_FRAMEWORKS,
  headlines: HEADLINE_FORMULAS,
  ctas: CTA_FORMULAS,
  socialHooks: SOCIAL_HOOKS,
  emailSubjects: EMAIL_SUBJECT_LINES,
  landingPageSections: LANDING_PAGE_SECTIONS
};
