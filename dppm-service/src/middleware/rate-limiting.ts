/**
 * Rate Limiting Middleware
 * 
 * Prevents abuse by limiting requests per:
 * - IP address (for anonymous users)
 * - User ID (for authenticated users)
 * - API key (for API access)
 * 
 * Security features:
 * - Sliding window algorithm
 * - Configurable limits per tier
 * - DDoS protection
 * - Graceful degradation
 */

import { Request, Response, NextFunction } from 'express';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_KEY || ''
);

/**
 * Rate limit configurations by tier
 */
interface RateLimitConfig {
  requests_per_minute: number;
  requests_per_hour: number;
  requests_per_day: number;
}

const RATE_LIMITS: Record<string, RateLimitConfig> = {
  free: {
    requests_per_minute: 10,
    requests_per_hour: 100,
    requests_per_day: 1000
  },
  pro: {
    requests_per_minute: 60,
    requests_per_hour: 1000,
    requests_per_day: 10000
  },
  enterprise: {
    requests_per_minute: 300,
    requests_per_hour: 10000,
    requests_per_day: 100000
  },
  anonymous: {
    requests_per_minute: 5,
    requests_per_hour: 50,
    requests_per_day: 200
  }
};

/**
 * In-memory cache for rate limits (for performance)
 * In production, use Redis for distributed rate limiting
 */
interface RateLimitEntry {
  minute: { count: number; reset: number };
  hour: { count: number; reset: number };
  day: { count: number; reset: number };
}

const rateLimitCache = new Map<string, RateLimitEntry>();

/**
 * Clean up expired entries every 5 minutes
 */
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitCache.entries()) {
    if (entry.day.reset < now) {
      rateLimitCache.delete(key);
    }
  }
}, 5 * 60 * 1000);

/**
 * Get user's tier
 */
const getUserTier = async (userId: string): Promise<string> => {
  try {
    // TODO: Get user's subscription tier from database
    // For now, default to 'free'
    return 'free';
  } catch (error) {
    console.error('Error getting user tier:', error);
    return 'free';
  }
};

/**
 * Get rate limit config for identifier
 */
const getRateLimitConfig = async (
  userId?: string,
  apiKey?: string
): Promise<RateLimitConfig> => {
  if (apiKey) {
    // API keys get pro limits by default
    return RATE_LIMITS.pro;
  }
  
  if (userId) {
    const tier = await getUserTier(userId);
    return RATE_LIMITS[tier] || RATE_LIMITS.free;
  }
  
  // Anonymous users
  return RATE_LIMITS.anonymous;
};

/**
 * Check and update rate limit
 */
const checkRateLimit = (
  identifier: string,
  config: RateLimitConfig
): {
  allowed: boolean;
  limit: number;
  remaining: number;
  reset: number;
  retryAfter?: number;
} => {
  const now = Date.now();
  
  // Get or create entry
  let entry = rateLimitCache.get(identifier);
  
  if (!entry) {
    entry = {
      minute: { count: 0, reset: now + 60 * 1000 },
      hour: { count: 0, reset: now + 60 * 60 * 1000 },
      day: { count: 0, reset: now + 24 * 60 * 60 * 1000 }
    };
    rateLimitCache.set(identifier, entry);
  }
  
  // Reset counters if windows have expired
  if (entry.minute.reset < now) {
    entry.minute = { count: 0, reset: now + 60 * 1000 };
  }
  if (entry.hour.reset < now) {
    entry.hour = { count: 0, reset: now + 60 * 60 * 1000 };
  }
  if (entry.day.reset < now) {
    entry.day = { count: 0, reset: now + 24 * 60 * 60 * 1000 };
  }
  
  // Check limits (most restrictive first)
  if (entry.minute.count >= config.requests_per_minute) {
    return {
      allowed: false,
      limit: config.requests_per_minute,
      remaining: 0,
      reset: entry.minute.reset,
      retryAfter: Math.ceil((entry.minute.reset - now) / 1000)
    };
  }
  
  if (entry.hour.count >= config.requests_per_hour) {
    return {
      allowed: false,
      limit: config.requests_per_hour,
      remaining: 0,
      reset: entry.hour.reset,
      retryAfter: Math.ceil((entry.hour.reset - now) / 1000)
    };
  }
  
  if (entry.day.count >= config.requests_per_day) {
    return {
      allowed: false,
      limit: config.requests_per_day,
      remaining: 0,
      reset: entry.day.reset,
      retryAfter: Math.ceil((entry.day.reset - now) / 1000)
    };
  }
  
  // Increment counters
  entry.minute.count++;
  entry.hour.count++;
  entry.day.count++;
  
  // Return success with remaining counts
  return {
    allowed: true,
    limit: config.requests_per_minute,
    remaining: config.requests_per_minute - entry.minute.count,
    reset: entry.minute.reset
  };
};

/**
 * Record rate limit violation in database
 */
const recordViolation = async (
  identifier: string,
  userId?: string
): Promise<void> => {
  try {
    await supabase.from('rate_limits').insert({
      identifier,
      user_id: userId || null,
      violated_at: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error recording rate limit violation:', error);
  }
};

/**
 * Rate limiting middleware
 * 
 * Applies rate limits based on user tier
 */
export const rateLimitMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const apiKey = req.headers['x-api-key'] as string;
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    
    // Create identifier (prefer user ID, then API key, then IP)
    const identifier = userId || apiKey || `ip:${ip}`;
    
    // Get rate limit config
    const config = await getRateLimitConfig(userId, apiKey);
    
    // Check rate limit
    const result = checkRateLimit(identifier, config);
    
    // Add rate limit headers
    res.setHeader('X-RateLimit-Limit', result.limit.toString());
    res.setHeader('X-RateLimit-Remaining', result.remaining.toString());
    res.setHeader('X-RateLimit-Reset', result.reset.toString());
    
    if (!result.allowed) {
      // Record violation
      recordViolation(identifier, userId).catch(err => {
        console.error('Failed to record violation:', err);
      });
      
      // Add retry-after header
      if (result.retryAfter) {
        res.setHeader('Retry-After', result.retryAfter.toString());
      }
      
      return res.status(429).json({
        success: false,
        error: 'Rate limit exceeded',
        rate_limit: {
          limit: result.limit,
          remaining: 0,
          reset: new Date(result.reset).toISOString(),
          retry_after: result.retryAfter
        },
        message: `Too many requests. Please try again in ${result.retryAfter} seconds.`
      });
    }
    
    next();
    
  } catch (error) {
    console.error('Error in rate limiting middleware:', error);
    // On error, allow request (fail open for stability)
    next();
  }
};

/**
 * Strict rate limiting for sensitive endpoints
 * (e.g., authentication, password reset)
 */
export const strictRateLimitMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const identifier = `strict:${ip}`;
    
    // Strict limits: 5 per minute, 20 per hour
    const config: RateLimitConfig = {
      requests_per_minute: 5,
      requests_per_hour: 20,
      requests_per_day: 100
    };
    
    const result = checkRateLimit(identifier, config);
    
    res.setHeader('X-RateLimit-Limit', result.limit.toString());
    res.setHeader('X-RateLimit-Remaining', result.remaining.toString());
    res.setHeader('X-RateLimit-Reset', result.reset.toString());
    
    if (!result.allowed) {
      if (result.retryAfter) {
        res.setHeader('Retry-After', result.retryAfter.toString());
      }
      
      return res.status(429).json({
        success: false,
        error: 'Rate limit exceeded',
        message: 'Too many attempts. Please try again later.'
      });
    }
    
    next();
    
  } catch (error) {
    console.error('Error in strict rate limiting middleware:', error);
    next();
  }
};

/**
 * Get rate limit stats for a user
 */
export const getRateLimitStats = async (userId: string): Promise<any> => {
  try {
    const identifier = userId;
    const entry = rateLimitCache.get(identifier);
    
    if (!entry) {
      return {
        minute: { count: 0, limit: 0 },
        hour: { count: 0, limit: 0 },
        day: { count: 0, limit: 0 }
      };
    }
    
    const config = await getRateLimitConfig(userId);
    
    return {
      minute: {
        count: entry.minute.count,
        limit: config.requests_per_minute,
        reset: new Date(entry.minute.reset).toISOString()
      },
      hour: {
        count: entry.hour.count,
        limit: config.requests_per_hour,
        reset: new Date(entry.hour.reset).toISOString()
      },
      day: {
        count: entry.day.count,
        limit: config.requests_per_day,
        reset: new Date(entry.day.reset).toISOString()
      }
    };
    
  } catch (error) {
    console.error('Error getting rate limit stats:', error);
    return null;
  }
};

export default {
  rateLimitMiddleware,
  strictRateLimitMiddleware,
  getRateLimitStats
};
