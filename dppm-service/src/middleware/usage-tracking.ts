/**
 * Usage Tracking Middleware
 * 
 * Tracks all API usage for:
 * - Billing (usage-based pricing)
 * - Analytics
 * - Quota management
 * - Rate limiting
 * 
 * Security features:
 * - Async tracking (doesn't slow down requests)
 * - Graceful degradation (continues even if tracking fails)
 * - Cost calculation per action
 */

import { Request, Response, NextFunction } from 'express';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_KEY || ''
);

/**
 * Action costs in credits
 * 1 credit = $0.01
 */
const ACTION_COSTS: Record<string, number> = {
  // Morgy operations
  'morgy:create': 10,
  'morgy:update': 2,
  'morgy:delete': 1,
  'morgy:read': 0.1,
  'morgy:execute': 5,
  
  // Knowledge base
  'knowledge:add': 3,
  'knowledge:update': 1,
  'knowledge:delete': 0.5,
  'knowledge:read': 0.1,
  
  // Marketplace
  'marketplace:list': 5,
  'marketplace:purchase': 0,  // No cost to purchase
  'marketplace:browse': 0.1,
  
  // MCP exports
  'mcp:export': 2,
  'mcp:download': 0,  // No cost to download
  
  // API keys
  'api_key:create': 1,
  'api_key:revoke': 0.5,
  
  // Analytics
  'analytics:read': 0.5,
  
  // Default
  'default': 0.1
};

/**
 * Map route to action type
 */
const getActionType = (method: string, path: string): string => {
  // Morgy operations
  if (path.startsWith('/api/morgys')) {
    if (method === 'POST') return 'morgy:create';
    if (method === 'PUT' || method === 'PATCH') return 'morgy:update';
    if (method === 'DELETE') return 'morgy:delete';
    if (path.includes('/execute')) return 'morgy:execute';
    return 'morgy:read';
  }
  
  // Knowledge base
  if (path.startsWith('/api/knowledge')) {
    if (method === 'POST') return 'knowledge:add';
    if (method === 'PUT' || method === 'PATCH') return 'knowledge:update';
    if (method === 'DELETE') return 'knowledge:delete';
    return 'knowledge:read';
  }
  
  // Marketplace
  if (path.startsWith('/api/marketplace')) {
    if (path.includes('/purchase')) return 'marketplace:purchase';
    if (method === 'POST' && path.includes('/listings')) return 'marketplace:list';
    return 'marketplace:browse';
  }
  
  // MCP exports
  if (path.startsWith('/api/mcp-exports')) {
    if (method === 'POST') return 'mcp:export';
    return 'mcp:download';
  }
  
  // API keys
  if (path.startsWith('/api/api-keys')) {
    if (method === 'POST') return 'api_key:create';
    if (method === 'DELETE') return 'api_key:revoke';
    return 'default';
  }
  
  // Analytics
  if (path.startsWith('/api/analytics')) {
    return 'analytics:read';
  }
  
  return 'default';
};

/**
 * Track usage for a request
 */
export const trackUsage = async (
  userId: string,
  action: string,
  metadata: any = {}
): Promise<void> => {
  try {
    const cost = ACTION_COSTS[action] || ACTION_COSTS['default'];
    
    // Insert usage record
    await supabase.from('user_usage').insert({
      user_id: userId,
      action_type: action,
      cost_credits: cost,
      metadata
    });
    
    // Update monthly quota
    const currentMonth = new Date().toISOString().substring(0, 7); // YYYY-MM
    
    const { data: quota, error: quotaError } = await supabase
      .from('usage_quotas')
      .select('*')
      .eq('user_id', userId)
      .eq('month', currentMonth)
      .single();
    
    if (quotaError || !quota) {
      // Create new quota record
      await supabase.from('usage_quotas').insert({
        user_id: userId,
        month: currentMonth,
        credits_used: cost,
        credits_limit: 1000, // Default limit
        api_calls: 1
      });
    } else {
      // Update existing quota
      await supabase
        .from('usage_quotas')
        .update({
          credits_used: quota.credits_used + cost,
          api_calls: quota.api_calls + 1
        })
        .eq('id', quota.id);
    }
    
  } catch (error) {
    // Log error but don't throw (graceful degradation)
    console.error('Error tracking usage:', error);
  }
};

/**
 * Check if user has exceeded quota
 */
export const checkQuota = async (userId: string): Promise<{
  allowed: boolean;
  remaining: number;
  limit: number;
}> => {
  try {
    const currentMonth = new Date().toISOString().substring(0, 7);
    
    const { data: quota, error } = await supabase
      .from('usage_quotas')
      .select('*')
      .eq('user_id', userId)
      .eq('month', currentMonth)
      .single();
    
    if (error || !quota) {
      // No quota record, allow with default limit
      return {
        allowed: true,
        remaining: 1000,
        limit: 1000
      };
    }
    
    const remaining = quota.credits_limit - quota.credits_used;
    
    return {
      allowed: remaining > 0,
      remaining: Math.max(0, remaining),
      limit: quota.credits_limit
    };
    
  } catch (error) {
    console.error('Error checking quota:', error);
    // On error, allow request (fail open for stability)
    return {
      allowed: true,
      remaining: 0,
      limit: 0
    };
  }
};

/**
 * Usage tracking middleware
 * 
 * Tracks all API usage asynchronously
 */
export const usageTrackingMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const userId = req.headers['x-user-id'] as string;
  
  // Skip tracking if no user ID
  if (!userId) {
    return next();
  }
  
  // Get action type
  const action = getActionType(req.method, req.path);
  
  // Track usage asynchronously (don't wait)
  trackUsage(userId, action, {
    method: req.method,
    path: req.path,
    ip: req.ip,
    user_agent: req.headers['user-agent']
  }).catch(err => {
    console.error('Failed to track usage:', err);
  });
  
  next();
};

/**
 * Quota checking middleware
 * 
 * Blocks requests if user has exceeded quota
 */
export const quotaCheckMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const userId = req.headers['x-user-id'] as string;
  
  // Skip quota check if no user ID
  if (!userId) {
    return next();
  }
  
  // Check quota
  const quotaStatus = await checkQuota(userId);
  
  // Add quota info to response headers
  res.setHeader('X-Quota-Limit', quotaStatus.limit.toString());
  res.setHeader('X-Quota-Remaining', quotaStatus.remaining.toString());
  
  // Block if quota exceeded
  if (!quotaStatus.allowed) {
    return res.status(429).json({
      success: false,
      error: 'Monthly quota exceeded',
      quota: {
        limit: quotaStatus.limit,
        remaining: 0,
        used: quotaStatus.limit
      },
      message: 'You have exceeded your monthly usage quota. Please upgrade your plan or wait until next month.'
    });
  }
  
  next();
};

export default {
  trackUsage,
  checkQuota,
  usageTrackingMiddleware,
  quotaCheckMiddleware
};
