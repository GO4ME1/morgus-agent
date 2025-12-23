// Tool Enforcement Wrapper for Morgus
// Wraps tool execution with subscription checks and usage tracking

import { createSubscriptionMiddleware, FeatureType } from './subscription-middleware';

interface ToolEnforcementEnv {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_KEY: string;
}

export interface ToolExecutionContext {
  userId: string;
  toolName: string;
  arguments: any;
}

export interface ToolExecutionResult {
  allowed: boolean;
  result?: any;
  error?: string;
  upgradeMessage?: string;
  currentPlan?: string;
  usage?: {
    current: number;
    limit: number;
    remaining: number;
  };
}

/**
 * Map tool names to feature types for usage tracking
 */
const TOOL_TO_FEATURE_MAP: Record<string, FeatureType> = {
  // Build tools
  'create_website': 'build',
  'deploy_website': 'deployment',
  'create_landing_page': 'build',
  'create_fullstack_app': 'build',
  'execute_code': 'build',
  
  // Image tools
  'generate_image': 'image',
  'create_logo': 'image',
  'edit_image': 'image',
  
  // Search tools
  'web_search': 'search',
  'browse_url': 'search',
  
  // Video tools
  'generate_video': 'video',
  'create_marketing_video': 'video',
  
  // GitHub tools
  'github_create_repo': 'github',
  'github_create_pr': 'github',
  'github_commit': 'github',
  'github_read_file': 'github',
  
  // Morgy tools
  'activate_morgy': 'morgy',
  'morgy_mission': 'morgy',
  
  // Browser tools
  'browser_navigate': 'browser',
  'browser_click': 'browser',
  'browser_input': 'browser',
};

/**
 * Tools that require paid plans
 */
const PAID_ONLY_TOOLS = new Set([
  'github_create_repo',
  'github_create_pr',
  'github_commit',
  'github_push',
  'deploy_website',
  'create_fullstack_app',
  'generate_video',
  'activate_morgy',
  'morgy_mission',
]);

/**
 * Tools that require specific plan tiers
 */
const TIER_RESTRICTED_TOOLS: Record<string, ('daily' | 'weekly' | 'monthly')[]> = {
  'generate_video': ['weekly', 'monthly'],
  'create_fullstack_app': ['weekly', 'monthly'],
  'morgy_mission': ['daily', 'weekly', 'monthly'],
};

export class ToolEnforcementService {
  private middleware: ReturnType<typeof createSubscriptionMiddleware>;

  constructor(env: ToolEnforcementEnv) {
    this.middleware = createSubscriptionMiddleware(env);
  }

  /**
   * Check if a user can execute a tool and track usage
   */
  async checkAndExecuteTool(
    context: ToolExecutionContext,
    toolFunction: () => Promise<any>
  ): Promise<ToolExecutionResult> {
    const { userId, toolName } = context;

    // 1. Check if tool requires a paid plan
    if (PAID_ONLY_TOOLS.has(toolName)) {
      const subscription = await this.middleware.getUserSubscription(userId);
      
      if (!subscription || subscription.plan === 'free') {
        return {
          allowed: false,
          error: `${toolName} requires a paid subscription`,
          upgradeMessage: 'Upgrade to unlock this powerful feature!',
          currentPlan: 'free',
        };
      }
    }

    // 2. Check if tool requires specific tier
    if (TIER_RESTRICTED_TOOLS[toolName]) {
      const subscription = await this.middleware.getUserSubscription(userId);
      const allowedTiers = TIER_RESTRICTED_TOOLS[toolName];
      
      if (!subscription || !allowedTiers.includes(subscription.plan as any)) {
        return {
          allowed: false,
          error: `${toolName} requires ${allowedTiers.join(' or ')} plan`,
          upgradeMessage: `Upgrade to ${allowedTiers[0]} or higher to use this feature!`,
          currentPlan: subscription?.plan || 'free',
        };
      }
    }

    // 3. Check feature-specific usage limits
    const feature = TOOL_TO_FEATURE_MAP[toolName];
    
    if (feature) {
      const usageCheck = await this.middleware.checkAndUseFeature(userId, feature);
      
      if (!usageCheck.allowed) {
        return {
          allowed: false,
          error: usageCheck.error,
          upgradeMessage: usageCheck.upgradeMessage,
          currentPlan: usageCheck.plan,
          usage: {
            current: usageCheck.current || 0,
            limit: usageCheck.limit || 0,
            remaining: usageCheck.remaining || 0,
          },
        };
      }
    }

    // 4. Execute the tool
    try {
      const result = await toolFunction();
      return {
        allowed: true,
        result,
      };
    } catch (error: any) {
      return {
        allowed: true,
        error: error.message || 'Tool execution failed',
      };
    }
  }

  /**
   * Check if a user can use a feature without executing
   */
  async canUseFeature(userId: string, feature: FeatureType): Promise<ToolExecutionResult> {
    const usageCheck = await this.middleware.checkAndUseFeature(userId, feature);
    
    return {
      allowed: usageCheck.allowed,
      error: usageCheck.error,
      upgradeMessage: usageCheck.upgradeMessage,
      currentPlan: usageCheck.plan,
      usage: {
        current: usageCheck.current || 0,
        limit: usageCheck.limit || 0,
        remaining: usageCheck.remaining || 0,
      },
    };
  }

  /**
   * Get user's subscription and usage summary
   */
  async getUserSummary(userId: string): Promise<{
    subscription: any;
    usage: any;
  }> {
    const subscription = await this.middleware.getUserSubscription(userId);
    const usage = await this.middleware.getUserUsage(userId);
    
    return {
      subscription: subscription ? {
        plan: subscription.plan,
        isActive: subscription.isActive,
        expiresAt: subscription.expiresAt?.toISOString(),
        dayPassBalance: subscription.dayPassBalance,
      } : null,
      usage,
    };
  }

  /**
   * Create a paywall response for the frontend
   */
  createPaywallResponse(result: ToolExecutionResult): Response {
    return this.middleware.createPaywallResponse({
      allowed: result.allowed,
      error: result.error,
      upgradeMessage: result.upgradeMessage,
      plan: result.currentPlan || 'free',
      current: result.usage?.current,
      limit: result.usage?.limit,
      remaining: result.usage?.remaining,
    });
  }
}

/**
 * Helper function to wrap tool execution with enforcement
 */
export async function enforceToolExecution<T>(
  env: ToolEnforcementEnv,
  userId: string,
  toolName: string,
  toolArguments: any,
  toolFunction: () => Promise<T>
): Promise<ToolExecutionResult> {
  const service = new ToolEnforcementService(env);
  
  return service.checkAndExecuteTool(
    { userId, toolName, arguments: toolArguments },
    toolFunction
  );
}

/**
 * Decorator function for tool methods
 * Usage:
 * 
 * @enforceSubscription('generate_image')
 * async generateImage(params) {
 *   // Tool implementation
 * }
 */
export function enforceSubscription(toolName: string) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const userId = this.userId || args[0]?.userId;
      
      if (!userId) {
        throw new Error('User ID required for subscription enforcement');
      }

      const env = this.env || args[0]?.env;
      const service = new ToolEnforcementService(env);

      const result = await service.checkAndExecuteTool(
        { userId, toolName, arguments: args },
        () => originalMethod.apply(this, args)
      );

      if (!result.allowed) {
        throw new Error(result.error || 'Subscription required');
      }

      return result.result;
    };

    return descriptor;
  };
}

// Export for use in main worker
export function createToolEnforcementService(env: ToolEnforcementEnv): ToolEnforcementService {
  return new ToolEnforcementService(env);
}
