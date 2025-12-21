// Subscription Enforcement Middleware for Morgus
// Checks user subscription status and enforces limits

interface SubscriptionEnv {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_KEY: string;
}

// Feature types that can be limited
export type FeatureType = 'message' | 'build' | 'deployment' | 'image' | 'search' | 'video' | 'github' | 'morgy_tools';

// Plan limits configuration (mirrors database)
const PLAN_LIMITS = {
  free: {
    daily_messages: 20,
    daily_builds: 1,
    daily_deployments: 1,
    daily_images: 3,
    daily_searches: 10,
    daily_videos: 0,
    github_access: false,
    morgy_tools_access: false,
  },
  daily: {
    daily_messages: -1, // unlimited
    daily_builds: -1,
    daily_deployments: -1,
    daily_images: -1,
    daily_searches: -1,
    daily_videos: 2,
    github_access: true,
    morgy_tools_access: true,
  },
  weekly: {
    daily_messages: -1,
    daily_builds: -1,
    daily_deployments: -1,
    daily_images: -1,
    daily_searches: -1,
    daily_videos: 10,
    github_access: true,
    morgy_tools_access: true,
  },
  monthly: {
    daily_messages: -1,
    daily_builds: -1,
    daily_deployments: -1,
    daily_images: -1,
    daily_searches: -1,
    daily_videos: -1,
    github_access: true,
    morgy_tools_access: true,
  },
};

export interface UsageCheckResult {
  allowed: boolean;
  current: number;
  limit: number;
  remaining: number;
  error?: string;
  upgradeMessage?: string;
  plan: string;
}

export interface UserSubscription {
  userId: string;
  email: string;
  plan: 'free' | 'daily' | 'weekly' | 'monthly';
  isActive: boolean;
  expiresAt: Date | null;
  dayPassBalance: number;
}

export class SubscriptionMiddleware {
  private supabaseUrl: string;
  private supabaseKey: string;

  constructor(env: SubscriptionEnv) {
    this.supabaseUrl = env.SUPABASE_URL;
    this.supabaseKey = env.SUPABASE_SERVICE_KEY;
  }

  // Get user's subscription status
  async getUserSubscription(userId: string): Promise<UserSubscription | null> {
    try {
      const response = await fetch(
        `${this.supabaseUrl}/rest/v1/profiles?id=eq.${userId}&select=id,email,subscription_status,subscription_tier,subscription_ends_at,day_pass_balance,day_pass_expires_at`,
        {
          headers: {
            'apikey': this.supabaseKey,
            'Authorization': `Bearer ${this.supabaseKey}`,
          },
        }
      );

      const profiles = await response.json() as any[];
      
      if (!profiles.length) {
        return null;
      }

      const profile = profiles[0];
      const now = new Date();
      
      // Check if subscription is active
      let isActive = false;
      let effectivePlan: 'free' | 'daily' | 'weekly' | 'monthly' = 'free';

      // Check day pass first
      if (profile.day_pass_balance > 0) {
        const dayPassExpires = profile.day_pass_expires_at ? new Date(profile.day_pass_expires_at) : null;
        if (!dayPassExpires || dayPassExpires > now) {
          isActive = true;
          effectivePlan = 'daily';
        }
      }

      // Check subscription
      if (!isActive && profile.subscription_ends_at) {
        const subscriptionEnds = new Date(profile.subscription_ends_at);
        if (subscriptionEnds > now && profile.subscription_status !== 'cancelled') {
          isActive = true;
          effectivePlan = profile.subscription_tier || 'weekly';
        }
      }

      return {
        userId: profile.id,
        email: profile.email,
        plan: effectivePlan,
        isActive,
        expiresAt: profile.subscription_ends_at ? new Date(profile.subscription_ends_at) : null,
        dayPassBalance: profile.day_pass_balance || 0,
      };
    } catch (error) {
      console.error('Error fetching user subscription:', error);
      return null;
    }
  }

  // Check if user can use a feature and increment usage
  async checkAndUseFeature(userId: string, feature: FeatureType): Promise<UsageCheckResult> {
    const subscription = await this.getUserSubscription(userId);
    
    if (!subscription) {
      return {
        allowed: false,
        current: 0,
        limit: 0,
        remaining: 0,
        error: 'User not found',
        plan: 'free',
      };
    }

    const plan = subscription.plan;
    const limits = PLAN_LIMITS[plan];

    // Check boolean features (github, morgy_tools)
    if (feature === 'github') {
      return {
        allowed: limits.github_access,
        current: 0,
        limit: limits.github_access ? 1 : 0,
        remaining: limits.github_access ? 1 : 0,
        error: limits.github_access ? undefined : 'GitHub access requires a paid subscription',
        upgradeMessage: limits.github_access ? undefined : 'Upgrade to unlock GitHub integration!',
        plan,
      };
    }

    if (feature === 'morgy_tools') {
      return {
        allowed: limits.morgy_tools_access,
        current: 0,
        limit: limits.morgy_tools_access ? 1 : 0,
        remaining: limits.morgy_tools_access ? 1 : 0,
        error: limits.morgy_tools_access ? undefined : 'Morgy tools require a paid subscription',
        upgradeMessage: limits.morgy_tools_access ? undefined : 'Upgrade to unlock Morgy superpowers!',
        plan,
      };
    }

    // Get or create today's usage record
    const today = new Date().toISOString().split('T')[0];
    
    // Upsert usage record
    await fetch(
      `${this.supabaseUrl}/rest/v1/usage_tracking`,
      {
        method: 'POST',
        headers: {
          'apikey': this.supabaseKey,
          'Authorization': `Bearer ${this.supabaseKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'resolution=merge-duplicates',
        },
        body: JSON.stringify({
          user_id: userId,
          date: today,
        }),
      }
    );

    // Get current usage
    const usageResponse = await fetch(
      `${this.supabaseUrl}/rest/v1/usage_tracking?user_id=eq.${userId}&date=eq.${today}`,
      {
        headers: {
          'apikey': this.supabaseKey,
          'Authorization': `Bearer ${this.supabaseKey}`,
        },
      }
    );

    const usageRecords = await usageResponse.json() as any[];
    const usage = usageRecords[0] || {};

    // Map feature to column and limit
    const featureMap: Record<string, { column: string; limitKey: keyof typeof limits }> = {
      message: { column: 'messages_count', limitKey: 'daily_messages' },
      build: { column: 'builds_count', limitKey: 'daily_builds' },
      deployment: { column: 'deployments_count', limitKey: 'daily_deployments' },
      image: { column: 'images_count', limitKey: 'daily_images' },
      search: { column: 'searches_count', limitKey: 'daily_searches' },
      video: { column: 'videos_count', limitKey: 'daily_videos' },
    };

    const { column, limitKey } = featureMap[feature];
    const currentCount = usage[column] || 0;
    const limit = limits[limitKey] as number;

    // Check if unlimited (-1) or within limit
    if (limit === -1 || currentCount < limit) {
      // Increment usage
      await fetch(
        `${this.supabaseUrl}/rest/v1/usage_tracking?user_id=eq.${userId}&date=eq.${today}`,
        {
          method: 'PATCH',
          headers: {
            'apikey': this.supabaseKey,
            'Authorization': `Bearer ${this.supabaseKey}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal',
          },
          body: JSON.stringify({
            [column]: currentCount + 1,
            updated_at: new Date().toISOString(),
          }),
        }
      );

      return {
        allowed: true,
        current: currentCount + 1,
        limit,
        remaining: limit === -1 ? -1 : limit - currentCount - 1,
        plan,
      };
    }

    // Limit reached
    const featureNames: Record<string, string> = {
      message: 'messages',
      build: 'website builds',
      deployment: 'deployments',
      image: 'image generations',
      search: 'web searches',
      video: 'video generations',
    };

    return {
      allowed: false,
      current: currentCount,
      limit,
      remaining: 0,
      error: `Daily ${featureNames[feature]} limit reached (${limit}/${limit})`,
      upgradeMessage: `Upgrade to unlock unlimited ${featureNames[feature]}!`,
      plan,
    };
  }

  // Get user's current usage for all features
  async getUserUsage(userId: string): Promise<Record<string, { current: number; limit: number; remaining: number }>> {
    const subscription = await this.getUserSubscription(userId);
    const plan = subscription?.plan || 'free';
    const limits = PLAN_LIMITS[plan];

    const today = new Date().toISOString().split('T')[0];
    
    const usageResponse = await fetch(
      `${this.supabaseUrl}/rest/v1/usage_tracking?user_id=eq.${userId}&date=eq.${today}`,
      {
        headers: {
          'apikey': this.supabaseKey,
          'Authorization': `Bearer ${this.supabaseKey}`,
        },
      }
    );

    const usageRecords = await usageResponse.json() as any[];
    const usage = usageRecords[0] || {};

    return {
      messages: {
        current: usage.messages_count || 0,
        limit: limits.daily_messages,
        remaining: limits.daily_messages === -1 ? -1 : Math.max(0, limits.daily_messages - (usage.messages_count || 0)),
      },
      builds: {
        current: usage.builds_count || 0,
        limit: limits.daily_builds,
        remaining: limits.daily_builds === -1 ? -1 : Math.max(0, limits.daily_builds - (usage.builds_count || 0)),
      },
      deployments: {
        current: usage.deployments_count || 0,
        limit: limits.daily_deployments,
        remaining: limits.daily_deployments === -1 ? -1 : Math.max(0, limits.daily_deployments - (usage.deployments_count || 0)),
      },
      images: {
        current: usage.images_count || 0,
        limit: limits.daily_images,
        remaining: limits.daily_images === -1 ? -1 : Math.max(0, limits.daily_images - (usage.images_count || 0)),
      },
      searches: {
        current: usage.searches_count || 0,
        limit: limits.daily_searches,
        remaining: limits.daily_searches === -1 ? -1 : Math.max(0, limits.daily_searches - (usage.searches_count || 0)),
      },
      videos: {
        current: usage.videos_count || 0,
        limit: limits.daily_videos,
        remaining: limits.daily_videos === -1 ? -1 : Math.max(0, limits.daily_videos - (usage.videos_count || 0)),
      },
    };
  }

  // Create paywall response
  createPaywallResponse(result: UsageCheckResult): Response {
    return new Response(JSON.stringify({
      error: 'subscription_required',
      message: result.error,
      upgradeMessage: result.upgradeMessage,
      currentPlan: result.plan,
      usage: {
        current: result.current,
        limit: result.limit,
        remaining: result.remaining,
      },
    }), {
      status: 402, // Payment Required
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
}

// Export singleton factory
export function createSubscriptionMiddleware(env: SubscriptionEnv): SubscriptionMiddleware {
  return new SubscriptionMiddleware(env);
}
