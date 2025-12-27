/**
 * Morgy Workflow Engine
 * Multi-step automation with specialized workflows for each Morgy
 */

import { TemplateEngine } from './template-engine';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: 'business' | 'social' | 'research';
  morgyType?: 'bill' | 'sally' | 'hogsworth'; // Optimized for specific Morgy
  inputs: Record<string, any>;
  steps: WorkflowStep[];
  estimatedDuration: number; // minutes
}

export interface WorkflowStep {
  id: string;
  action: string; // Template ID or custom action
  inputs: Record<string, any>; // Can reference variables with {{var}}
  outputVar: string; // Store result in this variable
  parallel?: boolean; // Run in parallel with other parallel steps
  requiresApproval?: boolean; // Wait for user approval before executing
  condition?: string; // Only run if condition is met
}

export interface WorkflowExecution {
  id: string;
  workflowId: string;
  morgyId: string;
  inputs: Record<string, any>;
  context: Record<string, any>; // Variables from previous steps
  currentStep: number;
  status: 'pending' | 'running' | 'waiting_approval' | 'completed' | 'failed';
  error?: string;
  startedAt: Date;
  completedAt?: Date;
}

// ============================================================================
// SPECIALIZED WORKFLOWS
// ============================================================================

export const BILL_WORKFLOWS: WorkflowTemplate[] = [
  // ========== BILL'S BUSINESS WORKFLOWS ==========
  {
    id: 'market_research_blitz',
    name: 'Market Research Blitz',
    description: 'Comprehensive market research with YouTube, Reddit, and competitor analysis',
    category: 'business',
    morgyType: 'bill',
    estimatedDuration: 15,
    inputs: {
      industry: { type: 'string', required: true },
      competitors: { type: 'array', required: false },
      focus_areas: { type: 'array', required: false },
    },
    steps: [
      {
        id: 'step_1',
        action: 'search_youtube',
        inputs: {
          query: '{{industry}} trends 2025',
          max_results: 20,
          order_by: 'viewCount',
          analyze: true,
        },
        outputVar: 'youtube_trends',
      },
      {
        id: 'step_2',
        action: 'monitor_subreddit',
        inputs: {
          subreddit: 'business',
          keywords: ['{{industry}}'],
          time_period: 'week',
        },
        outputVar: 'reddit_discussions',
      },
      {
        id: 'step_3',
        action: 'monitor_subreddit',
        inputs: {
          subreddit: 'entrepreneur',
          keywords: ['{{industry}}'],
          time_period: 'week',
        },
        outputVar: 'entrepreneur_discussions',
        parallel: true, // Run parallel with step_2
      },
      {
        id: 'step_4',
        action: 'synthesize_market_insights',
        inputs: {
          youtube_data: '{{youtube_trends}}',
          reddit_data: '{{reddit_discussions}}',
          entrepreneur_data: '{{entrepreneur_discussions}}',
          industry: '{{industry}}',
        },
        outputVar: 'market_insights',
      },
      {
        id: 'step_5',
        action: 'generate_business_report',
        inputs: {
          insights: '{{market_insights}}',
          industry: '{{industry}}',
          format: 'market_research',
          bill_enthusiasm: 'high', // Bill's personality!
        },
        outputVar: 'report',
      },
      {
        id: 'step_6',
        action: 'send_email',
        inputs: {
          to: '{{user_email}}',
          purpose: 'business_report',
          key_points: ['{{market_insights.top_opportunities}}'],
          tone: 'enthusiastic',
          length: 'detailed',
        },
        outputVar: 'email_sent',
        requiresApproval: true, // User approves before sending
      },
    ],
  },

  {
    id: 'competitor_analysis',
    name: 'Competitor Analysis Deep-Dive',
    description: 'Analyze competitors across multiple platforms and identify opportunities',
    category: 'business',
    morgyType: 'bill',
    estimatedDuration: 20,
    inputs: {
      competitors: { type: 'array', required: true },
      focus_areas: { type: 'array', required: false },
    },
    steps: [
      {
        id: 'step_1',
        action: 'search_youtube',
        inputs: {
          query: '{{competitor}} review',
          max_results: 10,
          analyze: true,
        },
        outputVar: 'competitor_videos',
      },
      {
        id: 'step_2',
        action: 'search_reddit',
        inputs: {
          query: '{{competitor}}',
          subreddits: ['business', 'entrepreneur', 'startups'],
        },
        outputVar: 'competitor_mentions',
      },
      {
        id: 'step_3',
        action: 'analyze_competitor_strategy',
        inputs: {
          competitor: '{{competitor}}',
          videos: '{{competitor_videos}}',
          mentions: '{{competitor_mentions}}',
        },
        outputVar: 'competitor_analysis',
      },
      {
        id: 'step_4',
        action: 'identify_gaps',
        inputs: {
          analysis: '{{competitor_analysis}}',
          bill_optimism: 'high', // "We can TOTALLY beat them!"
        },
        outputVar: 'opportunities',
      },
      {
        id: 'step_5',
        action: 'generate_action_plan',
        inputs: {
          opportunities: '{{opportunities}}',
          ambitious: true, // Bill's style!
        },
        outputVar: 'action_plan',
      },
    ],
  },

  {
    id: 'business_plan_generator',
    name: 'Business Plan Generator',
    description: 'Create a comprehensive business plan with market research and projections',
    category: 'business',
    morgyType: 'bill',
    estimatedDuration: 30,
    inputs: {
      business_idea: { type: 'string', required: true },
      target_market: { type: 'string', required: true },
      budget: { type: 'number', required: false },
    },
    steps: [
      {
        id: 'step_1',
        action: 'market_research_blitz',
        inputs: {
          industry: '{{target_market}}',
        },
        outputVar: 'market_research',
      },
      {
        id: 'step_2',
        action: 'generate_business_model',
        inputs: {
          idea: '{{business_idea}}',
          market: '{{market_research}}',
          bill_optimism: 'very_high', // Optimistic projections!
        },
        outputVar: 'business_model',
      },
      {
        id: 'step_3',
        action: 'create_revenue_projections',
        inputs: {
          model: '{{business_model}}',
          realistic: false, // Bill's projections are... ambitious
        },
        outputVar: 'projections',
      },
      {
        id: 'step_4',
        action: 'generate_business_plan',
        inputs: {
          idea: '{{business_idea}}',
          research: '{{market_research}}',
          model: '{{business_model}}',
          projections: '{{projections}}',
          enthusiasm: 'maximum', // "LET'S DO THIS!"
        },
        outputVar: 'business_plan',
      },
    ],
  },
];

export const SALLY_WORKFLOWS: WorkflowTemplate[] = [
  // ========== SALLY'S SOCIAL MEDIA WORKFLOWS ==========
  {
    id: 'tiktok_campaign_domination',
    name: 'TikTok Campaign Domination',
    description: 'Create and schedule 5 viral TikTok videos on a topic',
    category: 'social',
    morgyType: 'sally',
    estimatedDuration: 25,
    inputs: {
      topic: { type: 'string', required: true },
      num_videos: { type: 'number', default: 5 },
      posting_schedule: { type: 'array', required: false },
    },
    steps: [
      {
        id: 'step_1',
        action: 'search_youtube',
        inputs: {
          query: '{{topic}} TikTok viral',
          max_results: 20,
          order_by: 'viewCount',
        },
        outputVar: 'trending_content',
      },
      {
        id: 'step_2',
        action: 'monitor_subreddit',
        inputs: {
          subreddit: 'TikTok',
          keywords: ['{{topic}}'],
          time_period: 'day',
        },
        outputVar: 'tiktok_discussions',
      },
      {
        id: 'step_3',
        action: 'analyze_viral_patterns',
        inputs: {
          trending: '{{trending_content}}',
          discussions: '{{tiktok_discussions}}',
          sally_intuition: 'expert', // Sally KNOWS what goes viral
        },
        outputVar: 'viral_insights',
      },
      {
        id: 'step_4',
        action: 'generate_video_concepts',
        inputs: {
          topic: '{{topic}}',
          insights: '{{viral_insights}}',
          count: '{{num_videos}}',
          sally_creativity: 'high', // "This will pop! 🔥"
        },
        outputVar: 'concepts',
      },
      {
        id: 'step_5',
        action: 'create_tiktok_videos',
        inputs: {
          concepts: '{{concepts}}',
          mix_formats: true, // Mix talking head + visual
        },
        outputVar: 'videos',
        parallel: true, // Create all videos in parallel!
      },
      {
        id: 'step_6',
        action: 'optimize_posting_schedule',
        inputs: {
          videos: '{{videos}}',
          target_audience: '{{topic}}',
          sally_timing: 'perfect', // Sally knows the algorithm
        },
        outputVar: 'schedule',
      },
      {
        id: 'step_7',
        action: 'create_campaign_report',
        inputs: {
          videos: '{{videos}}',
          schedule: '{{schedule}}',
          expected_performance: 'viral', // Sally's confidence!
        },
        outputVar: 'campaign_report',
      },
    ],
  },

  {
    id: 'social_media_monitoring',
    name: 'Social Media Monitoring & Engagement',
    description: 'Monitor multiple platforms and engage strategically',
    category: 'social',
    morgyType: 'sally',
    estimatedDuration: 15,
    inputs: {
      platforms: { type: 'array', required: true }, // ['reddit', 'youtube']
      keywords: { type: 'array', required: true },
      engagement_type: { type: 'enum', values: ['comment', 'post', 'both'] },
    },
    steps: [
      {
        id: 'step_1',
        action: 'monitor_reddit',
        inputs: {
          keywords: '{{keywords}}',
          subreddits: ['all'], // Sally monitors everything
        },
        outputVar: 'reddit_opportunities',
      },
      {
        id: 'step_2',
        action: 'search_youtube',
        inputs: {
          query: '{{keywords}}',
          order_by: 'date',
          max_results: 20,
        },
        outputVar: 'youtube_content',
        parallel: true,
      },
      {
        id: 'step_3',
        action: 'identify_engagement_opportunities',
        inputs: {
          reddit: '{{reddit_opportunities}}',
          youtube: '{{youtube_content}}',
          sally_intuition: 'expert', // Knows when to engage
        },
        outputVar: 'opportunities',
      },
      {
        id: 'step_4',
        action: 'generate_responses',
        inputs: {
          opportunities: '{{opportunities}}',
          tone: 'friendly',
          sally_charm: 'high', // Always authentic, never spammy
        },
        outputVar: 'responses',
      },
      {
        id: 'step_5',
        action: 'post_responses',
        inputs: {
          responses: '{{responses}}',
        },
        outputVar: 'posted',
        requiresApproval: true, // User approves engagement
      },
    ],
  },

  {
    id: 'viral_content_strategy',
    name: 'Viral Content Strategy',
    description: 'Create multi-platform content calendar optimized for virality',
    category: 'social',
    morgyType: 'sally',
    estimatedDuration: 30,
    inputs: {
      topic: { type: 'string', required: true },
      duration: { type: 'enum', values: ['week', 'month'] },
      platforms: { type: 'array', required: true },
    },
    steps: [
      {
        id: 'step_1',
        action: 'analyze_current_trends',
        inputs: {
          topic: '{{topic}}',
          platforms: '{{platforms}}',
        },
        outputVar: 'trends',
      },
      {
        id: 'step_2',
        action: 'identify_content_gaps',
        inputs: {
          topic: '{{topic}}',
          trends: '{{trends}}',
          sally_creativity: 'maximum',
        },
        outputVar: 'gaps',
      },
      {
        id: 'step_3',
        action: 'generate_content_calendar',
        inputs: {
          topic: '{{topic}}',
          gaps: '{{gaps}}',
          duration: '{{duration}}',
          platforms: '{{platforms}}',
        },
        outputVar: 'calendar',
      },
      {
        id: 'step_4',
        action: 'create_content_assets',
        inputs: {
          calendar: '{{calendar}}',
          quality: 'viral', // Sally's standard
        },
        outputVar: 'assets',
        parallel: true,
      },
      {
        id: 'step_5',
        action: 'setup_ab_testing',
        inputs: {
          assets: '{{assets}}',
          metrics: ['engagement', 'shares', 'saves'],
        },
        outputVar: 'testing_plan',
      },
    ],
  },
];

export const HOGSWORTH_WORKFLOWS: WorkflowTemplate[] = [
  // ========== HOGSWORTH'S RESEARCH WORKFLOWS ==========
  {
    id: 'literature_review_generator',
    name: 'Literature Review Generator',
    description: 'Comprehensive academic literature review with citations',
    category: 'research',
    morgyType: 'hogsworth',
    estimatedDuration: 30,
    inputs: {
      topic: { type: 'string', required: true },
      depth: { type: 'enum', values: ['overview', 'comprehensive', 'deep-dive'] },
      min_sources: { type: 'number', default: 10 },
    },
    steps: [
      {
        id: 'step_1',
        action: 'search_youtube',
        inputs: {
          query: '{{topic}} academic lecture',
          max_results: 20,
          order_by: 'relevance',
        },
        outputVar: 'lectures',
      },
      {
        id: 'step_2',
        action: 'monitor_subreddit',
        inputs: {
          subreddit: 'science',
          keywords: ['{{topic}}'],
          time_period: 'month',
        },
        outputVar: 'science_discussions',
      },
      {
        id: 'step_3',
        action: 'monitor_subreddit',
        inputs: {
          subreddit: 'askscience',
          keywords: ['{{topic}}'],
          time_period: 'month',
        },
        outputVar: 'askscience_discussions',
        parallel: true,
      },
      {
        id: 'step_4',
        action: 'extract_key_concepts',
        inputs: {
          lectures: '{{lectures}}',
          discussions: ['{{science_discussions}}', '{{askscience_discussions}}'],
          hogsworth_thoroughness: 'maximum', // No stone unturned
        },
        outputVar: 'concepts',
      },
      {
        id: 'step_5',
        action: 'organize_by_theme',
        inputs: {
          concepts: '{{concepts}}',
          structure: 'academic',
          british_style: true, // Hogsworth's touch
        },
        outputVar: 'organized',
      },
      {
        id: 'step_6',
        action: 'generate_literature_review',
        inputs: {
          findings: '{{organized}}',
          citations: true,
          depth: '{{depth}}',
          hogsworth_eloquence: 'high', // "Quite fascinating!"
        },
        outputVar: 'review',
      },
    ],
  },

  {
    id: 'research_deep_dive',
    name: 'Research Deep-Dive',
    description: 'Thorough research analysis with multiple sources and synthesis',
    category: 'research',
    morgyType: 'hogsworth',
    estimatedDuration: 25,
    inputs: {
      research_question: { type: 'string', required: true },
      sources: { type: 'array', required: false },
    },
    steps: [
      {
        id: 'step_1',
        action: 'define_research_scope',
        inputs: {
          question: '{{research_question}}',
          hogsworth_precision: 'high',
        },
        outputVar: 'scope',
      },
      {
        id: 'step_2',
        action: 'search_multiple_sources',
        inputs: {
          question: '{{research_question}}',
          scope: '{{scope}}',
          platforms: ['youtube', 'reddit'],
        },
        outputVar: 'raw_data',
      },
      {
        id: 'step_3',
        action: 'extract_and_categorize',
        inputs: {
          data: '{{raw_data}}',
          categories: 'auto', // Hogsworth identifies patterns
        },
        outputVar: 'categorized',
      },
      {
        id: 'step_4',
        action: 'analyze_patterns',
        inputs: {
          data: '{{categorized}}',
          question_assumptions: true, // Hogsworth questions everything
        },
        outputVar: 'patterns',
      },
      {
        id: 'step_5',
        action: 'synthesize_insights',
        inputs: {
          patterns: '{{patterns}}',
          historical_context: true, // Hogsworth provides context
        },
        outputVar: 'insights',
      },
      {
        id: 'step_6',
        action: 'create_research_report',
        inputs: {
          question: '{{research_question}}',
          insights: '{{insights}}',
          format: 'academic',
          british_expressions: true, // "Indeed!"
        },
        outputVar: 'report',
      },
    ],
  },

  {
    id: 'educational_content_series',
    name: 'Educational Content Series',
    description: 'Multi-part educational series with progressive learning',
    category: 'research',
    morgyType: 'hogsworth',
    estimatedDuration: 40,
    inputs: {
      topic: { type: 'string', required: true },
      num_modules: { type: 'number', default: 5 },
      format: { type: 'enum', values: ['video', 'text', 'both'] },
    },
    steps: [
      {
        id: 'step_1',
        action: 'break_into_modules',
        inputs: {
          topic: '{{topic}}',
          num_modules: '{{num_modules}}',
          progressive: true, // Build knowledge step by step
        },
        outputVar: 'modules',
      },
      {
        id: 'step_2',
        action: 'research_each_module',
        inputs: {
          modules: '{{modules}}',
          depth: 'comprehensive',
        },
        outputVar: 'module_research',
        parallel: true,
      },
      {
        id: 'step_3',
        action: 'create_educational_videos',
        inputs: {
          modules: '{{modules}}',
          research: '{{module_research}}',
          hogsworth_teaching_style: 'engaging', // Makes learning fun
        },
        outputVar: 'videos',
        condition: '{{format}} == "video" || {{format}} == "both"',
      },
      {
        id: 'step_4',
        action: 'write_accompanying_materials',
        inputs: {
          modules: '{{modules}}',
          research: '{{module_research}}',
        },
        outputVar: 'materials',
      },
      {
        id: 'step_5',
        action: 'create_learning_sequence',
        inputs: {
          videos: '{{videos}}',
          materials: '{{materials}}',
          include_quizzes: true,
        },
        outputVar: 'series',
      },
    ],
  },
];

// ============================================================================
// WORKFLOW ENGINE
// ============================================================================

export class WorkflowEngine {
  private templateEngine: TemplateEngine;
  private workflows: Map<string, WorkflowTemplate>;

  constructor(templateEngine: TemplateEngine) {
    this.templateEngine = templateEngine;
    this.workflows = new Map();

    // Load all workflows
    [...BILL_WORKFLOWS, ...SALLY_WORKFLOWS, ...HOGSWORTH_WORKFLOWS].forEach(workflow => {
      this.workflows.set(workflow.id, workflow);
    });
  }

  /**
   * Get all workflows
   */
  getAllWorkflows(): WorkflowTemplate[] {
    return Array.from(this.workflows.values());
  }

  /**
   * Get workflows by Morgy type
   */
  getWorkflowsByMorgy(morgyType: 'bill' | 'sally' | 'hogsworth'): WorkflowTemplate[] {
    return Array.from(this.workflows.values())
      .filter(w => w.morgyType === morgyType);
  }

  /**
   * Get workflow by ID
   */
  getWorkflow(workflowId: string): WorkflowTemplate | undefined {
    return this.workflows.get(workflowId);
  }

  /**
   * Execute workflow
   */
  async executeWorkflow(
    morgyId: string,
    workflowId: string,
    inputs: Record<string, any>
  ): Promise<WorkflowExecution> {
    const workflow = this.getWorkflow(workflowId);
    if (!workflow) {
      throw new Error(`Workflow not found: ${workflowId}`);
    }

    const execution: WorkflowExecution = {
      id: this.generateId(),
      workflowId,
      morgyId,
      inputs,
      context: { ...inputs },
      currentStep: 0,
      status: 'running',
      startedAt: new Date(),
    };

    try {
      // Execute each step
      for (let i = 0; i < workflow.steps.length; i++) {
        const step = workflow.steps[i];
        execution.currentStep = i;

        // Check condition
        if (step.condition && !this.evaluateCondition(step.condition, execution.context)) {
          continue;
        }

        // Resolve variables in inputs
        const resolvedInputs = this.resolveVariables(step.inputs, execution.context);

        // Check if requires approval
        if (step.requiresApproval) {
          execution.status = 'waiting_approval';
          // In real implementation, this would wait for user approval
          // For now, we'll just log it
          console.log(`Step ${step.id} requires approval`);
        }

        // Execute step (using template engine)
        const result = await this.templateEngine.executeAction(
          morgyId,
          step.action,
          resolvedInputs
        );

        // Store result in context
        execution.context[step.outputVar] = result;
      }

      execution.status = 'completed';
      execution.completedAt = new Date();
    } catch (error: any) {
      execution.status = 'failed';
      execution.error = error.message;
      execution.completedAt = new Date();
    }

    return execution;
  }

  /**
   * Resolve variables in inputs (e.g., {{variable}})
   */
  private resolveVariables(
    inputs: Record<string, any>,
    context: Record<string, any>
  ): Record<string, any> {
    const resolved: Record<string, any> = {};

    for (const [key, value] of Object.entries(inputs)) {
      if (typeof value === 'string' && value.includes('{{')) {
        // Replace {{variable}} with actual value
        resolved[key] = value.replace(/\{\{([^}]+)\}\}/g, (_, varName) => {
          return context[varName.trim()] || '';
        });
      } else {
        resolved[key] = value;
      }
    }

    return resolved;
  }

  /**
   * Evaluate condition
   */
  private evaluateCondition(condition: string, context: Record<string, any>): boolean {
    // Simple condition evaluation
    // In real implementation, use a proper expression evaluator
    try {
      const resolved = this.resolveVariables({ condition }, context).condition;
      return eval(resolved);
    } catch {
      return false;
    }
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `wf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Register custom workflow
   */
  registerWorkflow(workflow: WorkflowTemplate): void {
    this.workflows.set(workflow.id, workflow);
  }
}
