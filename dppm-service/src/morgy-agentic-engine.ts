/**
 * Morgy Agentic Engine
 * Integrates templates, workflows, and platform integrations for truly agentic Morgys
 */

import { TemplateEngine, ActionTemplate } from './template-engine';
import { WorkflowEngine, Workflow } from './workflow-engine';
import { OAuthManager } from './oauth-manager';
import { RedditClient } from './integrations/reddit-client';
import { GmailClient } from './integrations/gmail-client';
import { YouTubeClient } from './integrations/youtube-client';
import { DIDClient } from './integrations/did-client';
import { LumaClient } from './integrations/luma-client';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface AgenticRequest {
  morgyId: string;
  userId: string;
  message: string;
  conversationHistory?: Array<{ role: string; content: string }>;
}

export interface AgenticResponse {
  response: string;
  actions?: ActionResult[];
  workflow?: WorkflowResult;
  executionMode: 'chat' | 'template' | 'workflow';
}

export interface ActionResult {
  template: string;
  inputs: Record<string, any>;
  outputs: Record<string, any>;
  status: 'success' | 'failed';
  error?: string;
}

export interface WorkflowResult {
  workflow: string;
  steps: Array<{
    step: number;
    title: string;
    status: 'completed' | 'failed' | 'pending';
    output?: any;
  }>;
  status: 'completed' | 'failed' | 'in_progress';
}

// ============================================================================
// MORGY AGENTIC ENGINE
// ============================================================================

export class MorgyAgenticEngine {
  private templateEngine: TemplateEngine;
  private workflowEngine: WorkflowEngine;
  private oauthManager: OAuthManager;
  
  // Platform clients
  private redditClient: RedditClient;
  private gmailClient: GmailClient;
  private youtubeClient: YouTubeClient;
  private didClient: DIDClient;
  private lumaClient: LumaClient;

  constructor() {
    this.templateEngine = new TemplateEngine();
    this.workflowEngine = new WorkflowEngine();
    this.oauthManager = new OAuthManager();
    
    // Initialize platform clients
    this.redditClient = new RedditClient();
    this.gmailClient = new GmailClient();
    this.youtubeClient = new YouTubeClient();
    this.didClient = new DIDClient();
    this.lumaClient = new LumaClient();
  }

  /**
   * Process agentic request from Morgy
   */
  async process(request: AgenticRequest): Promise<AgenticResponse> {
    const { morgyId, userId, message, conversationHistory } = request;

    // Step 1: Detect intent (chat, template, workflow)
    const intent = await this.detectIntent(message, conversationHistory);

    if (intent.type === 'chat') {
      // Simple chat - no action needed
      return {
        response: await this.generateChatResponse(morgyId, message, conversationHistory),
        executionMode: 'chat',
      };
    }

    if (intent.type === 'template') {
      // Execute single action template
      const result = await this.executeTemplate(
        morgyId,
        userId,
        intent.template!,
        intent.inputs!
      );

      return {
        response: this.formatTemplateResponse(result),
        actions: [result],
        executionMode: 'template',
      };
    }

    if (intent.type === 'workflow') {
      // Execute multi-step workflow
      const result = await this.executeWorkflow(
        morgyId,
        userId,
        intent.workflow!,
        intent.inputs!
      );

      return {
        response: this.formatWorkflowResponse(result),
        workflow: result,
        executionMode: 'workflow',
      };
    }

    // Fallback to chat
    return {
      response: await this.generateChatResponse(morgyId, message, conversationHistory),
      executionMode: 'chat',
    };
  }

  /**
   * Detect user intent from message
   */
  private async detectIntent(
    message: string,
    history?: Array<{ role: string; content: string }>
  ): Promise<{
    type: 'chat' | 'template' | 'workflow';
    template?: string;
    workflow?: string;
    inputs?: Record<string, any>;
  }> {
    const lowerMessage = message.toLowerCase();

    // Detect workflow keywords
    if (
      lowerMessage.includes('campaign') ||
      lowerMessage.includes('research blitz') ||
      lowerMessage.includes('competitor analysis') ||
      lowerMessage.includes('literature review') ||
      lowerMessage.includes('content series')
    ) {
      return {
        type: 'workflow',
        workflow: this.detectWorkflow(message),
        inputs: await this.extractInputs(message),
      };
    }

    // Detect template keywords
    if (
      lowerMessage.includes('post to reddit') ||
      lowerMessage.includes('send email') ||
      lowerMessage.includes('create tiktok') ||
      lowerMessage.includes('search youtube') ||
      lowerMessage.includes('monitor subreddit')
    ) {
      return {
        type: 'template',
        template: this.detectTemplate(message),
        inputs: await this.extractInputs(message),
      };
    }

    // Default to chat
    return { type: 'chat' };
  }

  /**
   * Detect which workflow to use
   */
  private detectWorkflow(message: string): string {
    const lower = message.toLowerCase();

    // Sally's workflows
    if (lower.includes('tiktok campaign')) return 'tiktok_campaign_domination';
    if (lower.includes('social media monitoring')) return 'social_media_monitoring';
    if (lower.includes('viral content strategy')) return 'viral_content_strategy';

    // Bill's workflows
    if (lower.includes('market research')) return 'market_research_blitz';
    if (lower.includes('competitor analysis')) return 'competitor_analysis';
    if (lower.includes('business plan')) return 'business_plan_generator';

    // Hogsworth's workflows
    if (lower.includes('literature review')) return 'literature_review_generator';
    if (lower.includes('research deep')) return 'research_deep_dive';
    if (lower.includes('educational content')) return 'educational_content_series';

    return 'market_research_blitz'; // Default
  }

  /**
   * Detect which template to use
   */
  private detectTemplate(message: string): string {
    const lower = message.toLowerCase();

    if (lower.includes('post to reddit')) return 'post_to_reddit';
    if (lower.includes('send email')) return 'send_email';
    if (lower.includes('create tiktok') && lower.includes('talking')) return 'create_tiktok_talking_head';
    if (lower.includes('create tiktok')) return 'create_tiktok_visual';
    if (lower.includes('search youtube')) return 'search_youtube';
    if (lower.includes('monitor subreddit')) return 'monitor_subreddit';

    return 'post_to_reddit'; // Default
  }

  /**
   * Extract inputs from message using AI
   */
  private async extractInputs(message: string): Promise<Record<string, any>> {
    // TODO: Use AI to extract structured inputs from natural language
    // For now, return empty object
    return {};
  }

  /**
   * Execute action template
   */
  private async executeTemplate(
    morgyId: string,
    userId: string,
    templateName: string,
    inputs: Record<string, any>
  ): Promise<ActionResult> {
    try {
      // Get Morgy personality
      const personality = await this.getMorgyPersonality(morgyId);

      // Get access tokens for required platforms
      const tokens = await this.getRequiredTokens(userId, morgyId, templateName);

      // Execute template with platform clients
      const outputs = await this.executeTemplateAction(
        templateName,
        inputs,
        tokens,
        personality
      );

      return {
        template: templateName,
        inputs,
        outputs,
        status: 'success',
      };
    } catch (error: any) {
      return {
        template: templateName,
        inputs,
        outputs: {},
        status: 'failed',
        error: error.message,
      };
    }
  }

  /**
   * Execute workflow
   */
  private async executeWorkflow(
    morgyId: string,
    userId: string,
    workflowName: string,
    inputs: Record<string, any>
  ): Promise<WorkflowResult> {
    try {
      // Get Morgy personality
      const personality = await this.getMorgyPersonality(morgyId);

      // Execute workflow
      const result = await this.workflowEngine.execute(
        workflowName,
        inputs,
        personality,
        async (step, stepInputs) => {
          // Execute each workflow step as a template
          const tokens = await this.getRequiredTokens(userId, morgyId, step.action);
          return await this.executeTemplateAction(step.action, stepInputs, tokens, personality);
        }
      );

      return {
        workflow: workflowName,
        steps: result.steps.map((step, i) => ({
          step: i + 1,
          title: step.title,
          status: step.status,
          output: step.output,
        })),
        status: result.status,
      };
    } catch (error: any) {
      return {
        workflow: workflowName,
        steps: [],
        status: 'failed',
      };
    }
  }

  /**
   * Execute template action with platform clients
   */
  private async executeTemplateAction(
    templateName: string,
    inputs: Record<string, any>,
    tokens: Record<string, string>,
    personality: string
  ): Promise<Record<string, any>> {
    switch (templateName) {
      case 'post_to_reddit':
        return await this.redditClient.post(
          tokens.reddit,
          inputs.subreddit,
          inputs.title,
          inputs.body
        );

      case 'send_email':
        return await this.gmailClient.send(
          tokens.gmail,
          inputs.to,
          inputs.subject,
          inputs.body
        );

      case 'create_tiktok_talking_head':
        const talkingHeadVideo = await this.didClient.createVideo(
          tokens.did,
          inputs.script,
          inputs.avatar_url
        );
        return { video_url: talkingHeadVideo.url };

      case 'create_tiktok_visual':
        const visualVideo = await this.lumaClient.createVideo(
          tokens.luma,
          inputs.prompt
        );
        return { video_url: visualVideo.url };

      case 'search_youtube':
        return await this.youtubeClient.search(
          tokens.youtube,
          inputs.query,
          inputs.max_results || 10
        );

      case 'monitor_subreddit':
        return await this.redditClient.getSubredditPosts(
          tokens.reddit,
          inputs.subreddit,
          inputs.limit || 25
        );

      default:
        throw new Error(`Unknown template: ${templateName}`);
    }
  }

  /**
   * Get required OAuth tokens for template
   */
  private async getRequiredTokens(
    userId: string,
    morgyId: string,
    templateName: string
  ): Promise<Record<string, string>> {
    const platformMap: Record<string, string> = {
      post_to_reddit: 'reddit',
      monitor_subreddit: 'reddit',
      send_email: 'gmail',
      create_tiktok_talking_head: 'did',
      create_tiktok_visual: 'luma',
      search_youtube: 'youtube',
    };

    const platform = platformMap[templateName];
    if (!platform) {
      throw new Error(`No platform mapping for template: ${templateName}`);
    }

    const token = await this.oauthManager.getValidToken(userId, platform, morgyId);
    return { [platform]: token };
  }

  /**
   * Get Morgy personality
   */
  private async getMorgyPersonality(morgyId: string): Promise<string> {
    // TODO: Fetch from database
    // For now, return default based on morgyId
    if (morgyId.includes('bill')) return 'bill';
    if (morgyId.includes('sally')) return 'sally';
    if (morgyId.includes('hogsworth')) return 'hogsworth';
    return 'default';
  }

  /**
   * Generate chat response (no action)
   */
  private async generateChatResponse(
    morgyId: string,
    message: string,
    history?: Array<{ role: string; content: string }>
  ): Promise<string> {
    // TODO: Use Morgy execution engine for chat
    return `I understand you said: "${message}". How can I help you with that?`;
  }

  /**
   * Format template response
   */
  private formatTemplateResponse(result: ActionResult): string {
    if (result.status === 'failed') {
      return `Oops! I tried to ${result.template} but encountered an error: ${result.error}`;
    }

    switch (result.template) {
      case 'post_to_reddit':
        return `✅ Posted to r/${result.inputs.subreddit}! Check it out: ${result.outputs.url}`;
      
      case 'send_email':
        return `✅ Email sent to ${result.inputs.to}!`;
      
      case 'create_tiktok_talking_head':
      case 'create_tiktok_visual':
        return `✅ TikTok video created! Download it here: ${result.outputs.video_url}`;
      
      case 'search_youtube':
        return `✅ Found ${result.outputs.results?.length || 0} YouTube videos!`;
      
      case 'monitor_subreddit':
        return `✅ Monitoring r/${result.inputs.subreddit}. Found ${result.outputs.posts?.length || 0} recent posts.`;
      
      default:
        return `✅ Action completed: ${result.template}`;
    }
  }

  /**
   * Format workflow response
   */
  private formatWorkflowResponse(result: WorkflowResult): string {
    if (result.status === 'failed') {
      return `Workflow "${result.workflow}" encountered an error.`;
    }

    const completedSteps = result.steps.filter(s => s.status === 'completed').length;
    return `✅ Workflow "${result.workflow}" completed! ${completedSteps}/${result.steps.length} steps successful.`;
  }
}
