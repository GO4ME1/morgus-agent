// @ts-nocheck
/**
 * Usage Tracking Service
 * Tracks user actions, enforces quotas, and manages billing
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || 'https://mock.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || 'mock-key';
const supabase = createClient(supabaseUrl, supabaseKey);

// Pricing tiers and limits
export const PRICING_TIERS = {
  free: {
    name: 'Free',
    price: 0,
    messages_per_month: 100,
    tokens_per_month: 100000,
    tools_allowed: ['search_web', 'fetch_url', 'think'],
    features: ['Basic chat', 'Web search', 'Limited tools']
  },
  pro: {
    name: 'Pro',
    price: 20,
    messages_per_month: 1000,
    tokens_per_month: 1000000,
    tools_allowed: 'all',
    features: ['Unlimited tools', 'Priority support', 'Custom Morgys', 'API access']
  },
  business: {
    name: 'Business',
    price: 99,
    messages_per_month: 10000,
    tokens_per_month: 10000000,
    tools_allowed: 'all',
    features: ['Everything in Pro', 'Team collaboration', 'Advanced analytics', 'White-label']
  },
  enterprise: {
    name: 'Enterprise',
    price: 'custom',
    messages_per_month: Infinity,
    tokens_per_month: Infinity,
    tools_allowed: 'all',
    features: ['Everything in Business', 'Custom integrations', 'Dedicated support', 'SLA']
  }
};

// Cost per action (in USD)
const COST_PER_TOKEN = 0.00002; // $0.02 per 1K tokens
const COST_PER_IMAGE = 0.04; // DALL-E 3
const COST_PER_VIDEO = 0.20; // D-ID
const COST_PER_BROWSER_SESSION = 0.01; // BrowserBase

export class UsageTrackingService {
  /**
   * Track a user action
   */
  async trackUsage(userId: string, action: {
    action_type: string;
    tokens_used?: number;
    cost_usd?: number;
    metadata?: any;
  }) {
    try {
      // Calculate cost if not provided
      let cost = action.cost_usd || 0;
      if (!cost && action.tokens_used) {
        cost = action.tokens_used * COST_PER_TOKEN;
      }

      // Insert usage record
      const { error } = await supabase
        .from('user_usage')
        .insert({
          user_id: userId,
          action_type: action.action_type,
          tokens_used: action.tokens_used || 0,
          cost_usd: cost,
          metadata: action.metadata || {}
        });

      if (error) throw error;

      // Update monthly quota
      await this.updateMonthlyQuota(userId, {
        messages_used: action.action_type === 'chat' ? 1 : 0,
        tokens_used: action.tokens_used || 0,
        cost_usd: cost,
        tool_used: action.action_type
      });

      return { success: true, cost };
    } catch (error) {
      console.error('Error tracking usage:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Update monthly usage quota
   */
  async updateMonthlyQuota(userId: string, usage: {
    messages_used?: number;
    tokens_used?: number;
    cost_usd?: number;
    tool_used?: string;
  }) {
    const month = new Date().toISOString().slice(0, 7); // YYYY-MM

    try {
      // Get current quota
      const { data: existing } = await supabase
        .from('usage_quotas')
        .select('*')
        .eq('user_id', userId)
        .eq('month', month)
        .single();

      if (existing) {
        // Update existing quota
        const tools_used = existing.tools_used || {};
        if (usage.tool_used) {
          tools_used[usage.tool_used] = (tools_used[usage.tool_used] || 0) + 1;
        }

        await supabase
          .from('usage_quotas')
          .update({
            messages_used: existing.messages_used + (usage.messages_used || 0),
            tokens_used: existing.tokens_used + (usage.tokens_used || 0),
            cost_usd: existing.cost_usd + (usage.cost_usd || 0),
            tools_used,
            updated_at: new Date().toISOString()
          })
          .eq('id', existing.id);
      } else {
        // Create new quota
        const tools_used = {};
        if (usage.tool_used) {
          tools_used[usage.tool_used] = 1;
        }

        await supabase
          .from('usage_quotas')
          .insert({
            user_id: userId,
            month,
            messages_used: usage.messages_used || 0,
            tokens_used: usage.tokens_used || 0,
            cost_usd: usage.cost_usd || 0,
            tools_used
          });
      }

      return { success: true };
    } catch (error) {
      console.error('Error updating monthly quota:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Check if user can perform action (quota enforcement)
   */
  async checkQuota(userId: string, actionType: string): Promise<{
    allowed: boolean;
    reason?: string;
    usage?: any;
    limit?: any;
  }> {
    try {
      // Get user profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('subscription_tier')
        .eq('id', userId)
        .single();

      const tier = profile?.subscription_tier || 'free';
      const limits = PRICING_TIERS[tier];

      // Get current month usage
      const month = new Date().toISOString().slice(0, 7);
      const { data: quota } = await supabase
        .from('usage_quotas')
        .select('*')
        .eq('user_id', userId)
        .eq('month', month)
        .single();

      const usage = quota || {
        messages_used: 0,
        tokens_used: 0,
        cost_usd: 0,
        tools_used: {}
      };

      // Check message limit
      if (actionType === 'chat' && usage.messages_used >= limits.messages_per_month) {
        return {
          allowed: false,
          reason: `Monthly message limit reached (${limits.messages_per_month}). Upgrade to Pro for more!`,
          usage,
          limit: limits
        };
      }

      // Check token limit
      if (usage.tokens_used >= limits.tokens_per_month) {
        return {
          allowed: false,
          reason: `Monthly token limit reached (${limits.tokens_per_month}). Upgrade to continue!`,
          usage,
          limit: limits
        };
      }

      // Check tool access
      if (actionType !== 'chat' && limits.tools_allowed !== 'all') {
        if (!limits.tools_allowed.includes(actionType)) {
          return {
            allowed: false,
            reason: `Tool "${actionType}" not available in ${tier} tier. Upgrade to Pro!`,
            usage,
            limit: limits
          };
        }
      }

      return {
        allowed: true,
        usage,
        limit: limits
      };
    } catch (error) {
      console.error('Error checking quota:', error);
      // Allow on error (fail open)
      return { allowed: true };
    }
  }

  /**
   * Get user usage stats
   */
  async getUsageStats(userId: string, month?: string) {
    const targetMonth = month || new Date().toISOString().slice(0, 7);

    try {
      // Get quota
      const { data: quota } = await supabase
        .from('usage_quotas')
        .select('*')
        .eq('user_id', userId)
        .eq('month', targetMonth)
        .single();

      // Get profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('subscription_tier')
        .eq('id', userId)
        .single();

      const tier = profile?.subscription_tier || 'free';
      const limits = PRICING_TIERS[tier];

      return {
        tier,
        limits,
        usage: quota || {
          messages_used: 0,
          tokens_used: 0,
          cost_usd: 0,
          tools_used: {}
        },
        percentage: {
          messages: ((quota?.messages_used || 0) / limits.messages_per_month) * 100,
          tokens: ((quota?.tokens_used || 0) / limits.tokens_per_month) * 100
        }
      };
    } catch (error) {
      console.error('Error getting usage stats:', error);
      return null;
    }
  }

  /**
   * Calculate cost for an action
   */
  calculateCost(actionType: string, metadata: any = {}): number {
    switch (actionType) {
      case 'chat':
        return (metadata.tokens_used || 0) * COST_PER_TOKEN;
      case 'generate_image':
        return COST_PER_IMAGE;
      case 'generate_video':
        return COST_PER_VIDEO;
      case 'browser_automation':
      case 'signup_account':
        return COST_PER_BROWSER_SESSION;
      default:
        return (metadata.tokens_used || 0) * COST_PER_TOKEN;
    }
  }
}

export const usageTracker = new UsageTrackingService();
