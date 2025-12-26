// Admin API for Morgus
// Handles admin-only operations like user management and promo code administration

interface AdminEnv {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_KEY: string;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function handleAdminAPI(request: Request, env: AdminEnv): Promise<Response> {
  const url = new URL(request.url);
  const path = url.pathname;

  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Get admin user ID from authorization header
  const authHeader = request.headers.get('Authorization');
  const adminId = authHeader?.replace('Bearer ', '');

  if (!adminId) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Verify admin status
  const isAdmin = await verifyAdmin(env, adminId);
  if (!isAdmin) {
    return new Response(JSON.stringify({ error: 'Forbidden - Admin access required' }), {
      status: 403,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // GET /api/admin/users - List all users
  if (path === '/api/admin/users' && request.method === 'GET') {
    try {
      const users = await listUsers(env);
      return new Response(JSON.stringify({ users }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch (error: any) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  }

  // POST /api/admin/grant-day-pass - Grant day passes to a user
  if (path === '/api/admin/grant-day-pass' && request.method === 'POST') {
    try {
      const body = await request.json() as { userId: string; count: number };
      await grantDayPasses(env, body.userId, body.count);
      
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch (error: any) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  }

  // GET /api/promo/list - List all promo codes
  if (path === '/api/promo/list' && request.method === 'GET') {
    try {
      const codes = await listPromoCodes(env);
      return new Response(JSON.stringify({ codes }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch (error: any) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  }

  // POST /api/promo/create - Create a new promo code
  if (path === '/api/promo/create' && request.method === 'POST') {
    try {
      const body = await request.json() as {
        code: string;
        type: string;
        value: number;
        maxUses: number | null;
        expiresAt: string | null;
      };
      
      const result = await createPromoCode(env, body);
      return new Response(JSON.stringify(result), {
        status: result.success ? 200 : 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch (error: any) {
      return new Response(JSON.stringify({ success: false, message: error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  }

  // POST /api/promo/:id/toggle - Toggle promo code active status
  const toggleMatch = path.match(/^\/api\/promo\/([\w-]+)\/toggle$/);
  if (toggleMatch && request.method === 'POST') {
    try {
      const promoId = toggleMatch[1];
      const body = await request.json() as { isActive: boolean };
      
      await togglePromoCode(env, promoId, body.isActive);
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch (error: any) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  }

  // DELETE /api/promo/:id - Delete a promo code
  const deleteMatch = path.match(/^\/api\/promo\/([\w-]+)$/);
  if (deleteMatch && request.method === 'DELETE') {
    try {
      const promoId = deleteMatch[1];
      await deletePromoCode(env, promoId);
      
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch (error: any) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  }

  // GET /api/admin/model-insights - Get MOE model performance insights dashboard
  if (path === '/api/admin/model-insights' && request.method === 'GET') {
    try {
      const { ModelStatsService } = await import('./services/model-stats');
      const statsService = new ModelStatsService(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY);
      
      // Get all insights data
      const [insights, categoryPerformance, complexityPerformance, leaderboard] = await Promise.all([
        statsService.getInsightsSummary(),
        statsService.getPerformanceByCategory(),
        statsService.getPerformanceByComplexity(),
        statsService.getLeaderboard(10),
      ]);
      
      return new Response(JSON.stringify({
        summary: insights,
        by_category: categoryPerformance,
        by_complexity: complexityPerformance,
        leaderboard: leaderboard,
        generated_at: new Date().toISOString(),
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch (error: any) {
      console.error('[ADMIN] Error fetching model insights:', error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  }

  // GET /api/admin/model-insights/:model - Get insights for a specific model
  const modelInsightsMatch = path.match(/^\/api\/admin\/model-insights\/([\w.-]+)$/);
  if (modelInsightsMatch && request.method === 'GET') {
    try {
      const modelName = decodeURIComponent(modelInsightsMatch[1]);
      const { ModelStatsService } = await import('./services/model-stats');
      const statsService = new ModelStatsService(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY);
      
      const [stats, categoryPerformance, complexityPerformance, streaks, history] = await Promise.all([
        statsService.getModelStats(modelName),
        statsService.getPerformanceByCategory(modelName),
        statsService.getPerformanceByComplexity(modelName),
        statsService.getStreaks(modelName),
        statsService.getModelHistory(modelName, 20),
      ]);
      
      return new Response(JSON.stringify({
        model: modelName,
        stats,
        by_category: categoryPerformance,
        by_complexity: complexityPerformance,
        streaks,
        recent_history: history,
        generated_at: new Date().toISOString(),
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch (error: any) {
      console.error('[ADMIN] Error fetching model insights:', error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  }

  return new Response('Not Found', { status: 404, headers: corsHeaders });
}

// Helper functions

async function verifyAdmin(env: AdminEnv, userId: string): Promise<boolean> {
  const response = await fetch(
    `${env.SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}&select=is_admin`,
    {
      headers: {
        'apikey': env.SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${env.SUPABASE_SERVICE_KEY}`,
      },
    }
  );
  
  const profiles = await response.json() as any[];
  return profiles[0]?.is_admin === true;
}

async function listUsers(env: AdminEnv): Promise<any[]> {
  const response = await fetch(
    `${env.SUPABASE_URL}/rest/v1/profiles?select=id,email,display_name,subscription_tier,subscription_status,day_pass_balance,created_at&order=created_at.desc`,
    {
      headers: {
        'apikey': env.SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${env.SUPABASE_SERVICE_KEY}`,
      },
    }
  );
  
  return await response.json() as any[];
}

async function grantDayPasses(env: AdminEnv, userId: string, count: number): Promise<void> {
  // Get current balance
  const response = await fetch(
    `${env.SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}&select=day_pass_balance`,
    {
      headers: {
        'apikey': env.SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${env.SUPABASE_SERVICE_KEY}`,
      },
    }
  );
  
  const profiles = await response.json() as any[];
  const currentBalance = profiles[0]?.day_pass_balance || 0;
  
  // Update balance
  await fetch(
    `${env.SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}`,
    {
      method: 'PATCH',
      headers: {
        'apikey': env.SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${env.SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal',
      },
      body: JSON.stringify({
        day_pass_balance: currentBalance + count,
      }),
    }
  );
}

async function listPromoCodes(env: AdminEnv): Promise<any[]> {
  const response = await fetch(
    `${env.SUPABASE_URL}/rest/v1/promo_codes?select=*&order=created_at.desc`,
    {
      headers: {
        'apikey': env.SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${env.SUPABASE_SERVICE_KEY}`,
      },
    }
  );
  
  return await response.json() as any[];
}

async function createPromoCode(env: AdminEnv, data: {
  code: string;
  type: string;
  value: number;
  maxUses: number | null;
  expiresAt: string | null;
}): Promise<{ success: boolean; message: string }> {
  // Check if code already exists
  const existingResponse = await fetch(
    `${env.SUPABASE_URL}/rest/v1/promo_codes?code=eq.${data.code}`,
    {
      headers: {
        'apikey': env.SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${env.SUPABASE_SERVICE_KEY}`,
      },
    }
  );
  
  const existing = await existingResponse.json() as any[];
  if (existing.length > 0) {
    return { success: false, message: 'Promo code already exists' };
  }
  
  // Create the code
  const response = await fetch(
    `${env.SUPABASE_URL}/rest/v1/promo_codes`,
    {
      method: 'POST',
      headers: {
        'apikey': env.SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${env.SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal',
      },
      body: JSON.stringify({
        code: data.code,
        type: data.type,
        value: data.value,
        max_uses: data.maxUses,
        expires_at: data.expiresAt,
        is_active: true,
      }),
    }
  );
  
  if (!response.ok) {
    return { success: false, message: 'Failed to create promo code' };
  }
  
  return { success: true, message: 'Promo code created successfully' };
}

async function togglePromoCode(env: AdminEnv, promoId: string, isActive: boolean): Promise<void> {
  await fetch(
    `${env.SUPABASE_URL}/rest/v1/promo_codes?id=eq.${promoId}`,
    {
      method: 'PATCH',
      headers: {
        'apikey': env.SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${env.SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal',
      },
      body: JSON.stringify({ is_active: isActive }),
    }
  );
}

async function deletePromoCode(env: AdminEnv, promoId: string): Promise<void> {
  await fetch(
    `${env.SUPABASE_URL}/rest/v1/promo_codes?id=eq.${promoId}`,
    {
      method: 'DELETE',
      headers: {
        'apikey': env.SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${env.SUPABASE_SERVICE_KEY}`,
      },
    }
  );
}
