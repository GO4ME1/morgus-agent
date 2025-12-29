/**
 * Morgy Template Engine
 * Provides structured workflows with constraints for consistent, high-quality results
 */

import { MorgyService } from './morgy-service';
import { RedditClient } from './integrations/reddit-client';
import { GmailClient } from './integrations/gmail-client';
import { YouTubeClient } from './integrations/youtube-client';
import { DIDClient } from './integrations/did-client';
import { LumaClient } from './integrations/luma-client';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface ActionTemplate {
  id: string;
  name: string;
  description: string;
  category: 'social' | 'communication' | 'research' | 'content';
  inputs: Record<string, InputSchema>;
  outputs: Record<string, OutputSchema>;
  constraints: Record<string, any>;
  isDefault?: boolean; // Default template for this category
}

export interface InputSchema {
  type: 'string' | 'number' | 'boolean' | 'enum' | 'array';
  required: boolean;
  default?: any;
  min?: number;
  max?: number;
  maxLength?: number;
  values?: string[]; // For enum type
  items?: string; // For array type
  format?: string; // e.g., "email", "url"
  description?: string;
}

export interface OutputSchema {
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  description?: string;
}

export interface PersonalityAdaptation {
  tone?: string;
  style?: string;
  quirks?: string[];
  constraints?: Record<string, any>;
}

export interface TemplateExecution {
  id: string;
  morgyId: string;
  templateId: string;
  inputs: Record<string, any>;
  outputs?: Record<string, any>;
  status: 'pending' | 'running' | 'completed' | 'failed';
  error?: string;
  startedAt: Date;
  completedAt?: Date;
}

// ============================================================================
// DEFAULT ACTION TEMPLATES
// ============================================================================

export const DEFAULT_TEMPLATES: ActionTemplate[] = [
  // ========== SOCIAL MEDIA ==========
  {
    id: 'post_to_reddit',
    name: 'Post to Reddit',
    description: 'Create and post content to a subreddit with personality-driven style',
    category: 'social',
    isDefault: true,
    inputs: {
      subreddit: {
        type: 'string',
        required: true,
        description: 'Subreddit name (without r/)',
      },
      topic: {
        type: 'string',
        required: true,
        description: 'What to post about',
      },
      tone: {
        type: 'enum',
        required: false,
        default: 'helpful',
        values: ['professional', 'casual', 'humorous', 'helpful', 'enthusiastic'],
        description: 'Tone of the post',
      },
      length: {
        type: 'enum',
        required: false,
        default: 'medium',
        values: ['short', 'medium', 'long'],
        description: 'Post length',
      },
      include_cta: {
        type: 'boolean',
        required: false,
        default: true,
        description: 'Include call-to-action',
      },
    },
    outputs: {
      post_id: { type: 'string', description: 'Reddit post ID' },
      url: { type: 'string', description: 'Post URL' },
      title: { type: 'string', description: 'Generated title' },
      body: { type: 'string', description: 'Generated body' },
    },
    constraints: {
      title_max_length: 300,
      body_max_length: 40000,
      check_subreddit_rules: true,
      avoid_spam: true,
    },
  },

  {
    id: 'create_tiktok_talking_head',
    name: 'Create TikTok (Talking Head)',
    description: 'Create a talking head TikTok video where your Morgy speaks',
    category: 'content',
    isDefault: true,
    inputs: {
      topic: {
        type: 'string',
        required: true,
        description: 'What the video is about',
      },
      duration: {
        type: 'number',
        required: false,
        default: 30,
        min: 15,
        max: 60,
        description: 'Video duration in seconds',
      },
      tone: {
        type: 'enum',
        required: false,
        default: 'energetic',
        values: ['energetic', 'professional', 'casual', 'educational'],
        description: 'Video tone',
      },
      call_to_action: {
        type: 'string',
        required: false,
        description: 'Call to action at the end',
      },
    },
    outputs: {
      video_url: { type: 'string', description: 'URL to download video' },
      script: { type: 'string', description: 'Video script' },
      duration: { type: 'number', description: 'Actual duration' },
      caption: { type: 'string', description: 'Suggested caption' },
      hashtags: { type: 'array', description: 'Suggested hashtags' },
    },
    constraints: {
      hook_first_3_seconds: true,
      max_script_words: 150,
      tiktok_optimized: true,
      include_subtitles: true,
    },
  },

  {
    id: 'create_tiktok_visual',
    name: 'Create TikTok (Visual)',
    description: 'Create a visual TikTok video with AI-generated visuals',
    category: 'content',
    inputs: {
      concept: {
        type: 'string',
        required: true,
        description: 'Visual concept to create',
      },
      style: {
        type: 'enum',
        required: false,
        default: 'energetic',
        values: ['modern', 'cinematic', 'energetic', 'professional'],
        description: 'Visual style',
      },
      music_mood: {
        type: 'enum',
        required: false,
        default: 'upbeat',
        values: ['upbeat', 'calm', 'dramatic', 'fun'],
        description: 'Music mood',
      },
    },
    outputs: {
      video_url: { type: 'string', description: 'URL to download video' },
      prompt_used: { type: 'string', description: 'AI prompt used' },
      caption: { type: 'string', description: 'Suggested caption' },
      hashtags: { type: 'array', description: 'Suggested hashtags' },
    },
    constraints: {
      aspect_ratio: '9:16',
      duration_range: [15, 30],
      eye_catching_first_frame: true,
    },
  },

  // ========== COMMUNICATION ==========
  {
    id: 'send_email',
    name: 'Send Email',
    description: 'Compose and send a purpose-driven email',
    category: 'communication',
    isDefault: true,
    inputs: {
      to: {
        type: 'string',
        required: true,
        format: 'email',
        description: 'Recipient email address',
      },
      purpose: {
        type: 'enum',
        required: true,
        values: ['outreach', 'follow-up', 'notification', 'newsletter', 'thank-you'],
        description: 'Purpose of the email',
      },
      key_points: {
        type: 'array',
        required: true,
        items: 'string',
        description: 'Key points to include',
      },
      tone: {
        type: 'enum',
        required: false,
        default: 'professional',
        values: ['professional', 'friendly', 'formal', 'casual'],
        description: 'Email tone',
      },
      length: {
        type: 'enum',
        required: false,
        default: 'standard',
        values: ['brief', 'standard', 'detailed'],
        description: 'Email length',
      },
    },
    outputs: {
      message_id: { type: 'string', description: 'Gmail message ID' },
      subject: { type: 'string', description: 'Generated subject' },
      body: { type: 'string', description: 'Generated body' },
      sent: { type: 'boolean', description: 'Successfully sent' },
    },
    constraints: {
      include_signature: true,
      check_spelling: true,
      professional_formatting: true,
    },
  },

  // ========== RESEARCH ==========
  {
    id: 'search_youtube',
    name: 'Search YouTube',
    description: 'Search YouTube and get AI-generated insights',
    category: 'research',
    isDefault: true,
    inputs: {
      query: {
        type: 'string',
        required: true,
        description: 'Search query',
      },
      max_results: {
        type: 'number',
        required: false,
        default: 10,
        min: 1,
        max: 50,
        description: 'Maximum results',
      },
      order_by: {
        type: 'enum',
        required: false,
        default: 'relevance',
        values: ['relevance', 'date', 'viewCount', 'rating'],
        description: 'Sort order',
      },
      analyze: {
        type: 'boolean',
        required: false,
        default: true,
        description: 'Generate AI insights',
      },
    },
    outputs: {
      videos: { type: 'array', description: 'Video results' },
      insights: { type: 'string', description: 'AI-generated insights' },
      trends: { type: 'array', description: 'Identified trends' },
      recommendations: { type: 'array', description: 'Action recommendations' },
    },
    constraints: {
      analyze_trends: true,
      identify_patterns: true,
      suggest_opportunities: true,
    },
  },

  {
    id: 'monitor_subreddit',
    name: 'Monitor Subreddit',
    description: 'Monitor a subreddit for relevant discussions',
    category: 'research',
    inputs: {
      subreddit: {
        type: 'string',
        required: true,
        description: 'Subreddit to monitor',
      },
      keywords: {
        type: 'array',
        required: true,
        items: 'string',
        description: 'Keywords to look for',
      },
      time_period: {
        type: 'enum',
        required: false,
        default: 'day',
        values: ['hour', 'day', 'week', 'month'],
        description: 'Time period to search',
      },
    },
    outputs: {
      relevant_posts: { type: 'array', description: 'Relevant posts found' },
      summary: { type: 'string', description: 'Summary of discussions' },
      sentiment: { type: 'string', description: 'Overall sentiment' },
      opportunities: { type: 'array', description: 'Engagement opportunities' },
    },
    constraints: {
      analyze_sentiment: true,
      identify_opportunities: true,
      respect_community_rules: true,
    },
  },
];

// ============================================================================
// TEMPLATE ENGINE
// ============================================================================

export class TemplateEngine {
  private morgyService: MorgyService;
  private templates: Map<string, ActionTemplate>;

  constructor(morgyService: MorgyService) {
    this.morgyService = morgyService;
    this.templates = new Map();
    
    // Load default templates
    DEFAULT_TEMPLATES.forEach(template => {
      this.templates.set(template.id, template);
    });
  }

  /**
   * Get all templates
   */
  getAllTemplates(): ActionTemplate[] {
    return Array.from(this.templates.values());
  }

  /**
   * Get templates by category
   */
  getTemplatesByCategory(category: string): ActionTemplate[] {
    return Array.from(this.templates.values())
      .filter(t => t.category === category);
  }

  /**
   * Get default template for category
   */
  getDefaultTemplate(category: string): ActionTemplate | undefined {
    return Array.from(this.templates.values())
      .find(t => t.category === category && t.isDefault);
  }

  /**
   * Get template by ID
   */
  getTemplate(templateId: string): ActionTemplate | undefined {
    return this.templates.get(templateId);
  }

  /**
   * Validate inputs against template schema
   */
  validateInputs(template: ActionTemplate, inputs: Record<string, any>): void {
    for (const [key, schema] of Object.entries(template.inputs)) {
      const value = inputs[key];

      // Check required
      if (schema.required && (value === undefined || value === null)) {
        throw new Error(`Missing required input: ${key}`);
      }

      // Use default if not provided
      if (value === undefined && schema.default !== undefined) {
        inputs[key] = schema.default;
        continue;
      }

      if (value === undefined) continue;

      // Type validation
      if (schema.type === 'string' && typeof value !== 'string') {
        throw new Error(`Input ${key} must be a string`);
      }
      if (schema.type === 'number' && typeof value !== 'number') {
        throw new Error(`Input ${key} must be a number`);
      }
      if (schema.type === 'boolean' && typeof value !== 'boolean') {
        throw new Error(`Input ${key} must be a boolean`);
      }
      if (schema.type === 'array' && !Array.isArray(value)) {
        throw new Error(`Input ${key} must be an array`);
      }

      // Range validation
      if (schema.type === 'number') {
        if (schema.min !== undefined && value < schema.min) {
          throw new Error(`Input ${key} must be >= ${schema.min}`);
        }
        if (schema.max !== undefined && value > schema.max) {
          throw new Error(`Input ${key} must be <= ${schema.max}`);
        }
      }

      // Length validation
      if (schema.type === 'string' && schema.maxLength) {
        if (value.length > schema.maxLength) {
          throw new Error(`Input ${key} must be <= ${schema.maxLength} characters`);
        }
      }

      // Enum validation
      if (schema.type === 'enum' && schema.values) {
        if (!schema.values.includes(value)) {
          throw new Error(`Input ${key} must be one of: ${schema.values.join(', ')}`);
        }
      }

      // Format validation
      if (schema.format === 'email') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          throw new Error(`Input ${key} must be a valid email`);
        }
      }
    }
  }

  /**
   * Apply personality adaptation to template
   */
  async applyPersonality(
    template: ActionTemplate,
    morgyId: string
  ): Promise<PersonalityAdaptation> {
    const morgy = await this.morgyService.getMorgy(morgyId);

    // Extract personality traits
    const personality: PersonalityAdaptation = {
      tone: (morgy as any).personality_traits?.tone || 'professional',
      style: (morgy as any).personality_traits?.style || 'standard',
      quirks: (morgy as any).personality_traits?.quirks || [],
    };

    // Apply template-specific constraints
    personality.constraints = template.constraints;

    return personality;
  }

  /**
   * Build AI prompt from template
   */
  buildPrompt(
    template: ActionTemplate,
    inputs: Record<string, any>,
    personality: PersonalityAdaptation
  ): string {
    const lines: string[] = [];

    lines.push(`# Task: ${template.name}`);
    lines.push(`${template.description}`);
    lines.push('');

    lines.push('## Inputs:');
    for (const [key, value] of Object.entries(inputs)) {
      lines.push(`- ${key}: ${JSON.stringify(value)}`);
    }
    lines.push('');

    lines.push('## Personality:');
    lines.push(`- Tone: ${personality.tone}`);
    lines.push(`- Style: ${personality.style}`);
    if (personality.quirks && personality.quirks.length > 0) {
      lines.push(`- Quirks: ${personality.quirks.join(', ')}`);
    }
    lines.push('');

    lines.push('## Constraints:');
    for (const [key, value] of Object.entries(personality.constraints || {})) {
      lines.push(`- ${key}: ${JSON.stringify(value)}`);
    }
    lines.push('');

    lines.push('## Required Outputs:');
    for (const [key, schema] of Object.entries(template.outputs)) {
      lines.push(`- ${key} (${schema.type}): ${schema.description || ''}`);
    }
    lines.push('');

    lines.push('## Instructions:');
    lines.push('1. Follow the personality traits and constraints strictly');
    lines.push('2. Generate high-quality output that matches the template requirements');
    lines.push('3. Return outputs in JSON format with the exact keys specified');
    lines.push('');

    lines.push('Generate the outputs now:');

    return lines.join('\n');
  }

  /**
   * Execute action template
   */
  async executeAction(
    morgyId: string,
    templateId: string,
    inputs: Record<string, any>
  ): Promise<Record<string, any>> {
    // Get template
    const template = this.getTemplate(templateId);
    if (!template) {
      throw new Error(`Template not found: ${templateId}`);
    }

    // Validate inputs
    this.validateInputs(template, inputs);

    // Apply personality
    const personality = await this.applyPersonality(template, morgyId);

    // Build prompt
    const prompt = this.buildPrompt(template, inputs, personality);

    // Execute with AI (using existing Morgy execution engine)
    // This would integrate with your morgy-execution.ts
    const aiResponse = await this.executeWithAI(morgyId, prompt);

    // Parse and validate outputs
    const outputs = this.parseOutputs(aiResponse, template);

    return outputs;
  }

  /**
   * Execute with AI (placeholder - integrate with your execution engine)
   */
  private async executeWithAI(
    morgyId: string,
    prompt: string
  ): Promise<string> {
    // This would call your morgy-execution.ts
    // For now, return placeholder
    throw new Error('Integrate with morgy-execution.ts');
  }

  /**
   * Parse AI outputs
   */
  private parseOutputs(
    aiResponse: string,
    template: ActionTemplate
  ): Record<string, any> {
    try {
      // Try to parse as JSON
      const outputs = JSON.parse(aiResponse);

      // Validate output keys
      for (const key of Object.keys(template.outputs)) {
        if (!(key in outputs)) {
          throw new Error(`Missing required output: ${key}`);
        }
      }

      return outputs;
    } catch (error: any) {
      throw new Error(`Failed to parse outputs: ${error.message}`);
    }
  }

  /**
   * Register custom template
   */
  registerTemplate(template: ActionTemplate): void {
    this.templates.set(template.id, template);
  }

  /**
   * Get template usage stats
   */
  async getTemplateStats(templateId: string): Promise<{
    total_executions: number;
    success_rate: number;
    avg_duration: number;
  }> {
    // This would query your database
    // Placeholder for now
    return {
      total_executions: 0,
      success_rate: 0,
      avg_duration: 0,
    };
  }
}
