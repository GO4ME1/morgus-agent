// Usage Tracking API for Morgus
// Provides endpoints for checking and reporting usage

import { createSubscriptionMiddleware, FeatureType } from './subscription-middleware';

interface UsageEnv {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_KEY: string;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function handleUsageAPI(request: Request, env: UsageEnv): Promise<Response> {
  const url = new URL(request.url);
  const path = url.pathname;

  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const middleware = createSubscriptionMiddleware(env);

  // GET /api/usage/:userId - Get user's current usage
  if (path.match(/^\/api\/usage\/[\w-]+$/) && request.method === 'GET') {
    const userId = path.split('/').pop()!;
    
    try {
      const subscription = await middleware.getUserSubscription(userId);
      const usage = await middleware.getUserUsage(userId);
      
      return new Response(JSON.stringify({
        subscription: subscription ? {
          plan: subscription.plan,
          isActive: subscription.isActive,
          expiresAt: subscription.expiresAt?.toISOString(),
          dayPassBalance: subscription.dayPassBalance,
        } : null,
        usage,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch (error: any) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  }

  // POST /api/usage/check - Check if user can use a feature
  if (path === '/api/usage/check' && request.method === 'POST') {
    try {
      const body = await request.json() as { userId: string; feature: FeatureType };
      const result = await middleware.checkAndUseFeature(body.userId, body.feature);
      
      if (!result.allowed) {
        return middleware.createPaywallResponse(result);
      }
      
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch (error: any) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  }

  // POST /api/usage/increment - Increment usage for a feature (internal use)
  if (path === '/api/usage/increment' && request.method === 'POST') {
    try {
      const body = await request.json() as { userId: string; feature: FeatureType };
      const result = await middleware.checkAndUseFeature(body.userId, body.feature);
      
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch (error: any) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  }

  // GET /api/subscription/:userId - Get user's subscription details
  if (path.match(/^\/api\/subscription\/[\w-]+$/) && request.method === 'GET') {
    const userId = path.split('/').pop()!;
    
    try {
      const subscription = await middleware.getUserSubscription(userId);
      
      if (!subscription) {
        return new Response(JSON.stringify({ error: 'User not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      return new Response(JSON.stringify({
        plan: subscription.plan,
        isActive: subscription.isActive,
        expiresAt: subscription.expiresAt?.toISOString(),
        dayPassBalance: subscription.dayPassBalance,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch (error: any) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  }

  return new Response('Not Found', { status: 404, headers: corsHeaders });
}
