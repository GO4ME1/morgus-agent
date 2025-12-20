/**
 * Model Stats API
 * Endpoints for retrieving model performance statistics
 */

import { ModelStatsService } from './services/model-stats';

export async function handleStatsAPI(request: Request, env: any): Promise<Response> {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(request.url);
  const path = url.pathname;

  try {
    const statsService = new ModelStatsService(env.SUPABASE_URL, env.SUPABASE_KEY);

    // GET /api/stats/leaderboard
    if (path === '/api/stats/leaderboard' && request.method === 'GET') {
      const limit = parseInt(url.searchParams.get('limit') || '10');
      const leaderboard = await statsService.getLeaderboard(limit);

      return new Response(JSON.stringify({ stats: leaderboard }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // GET /api/stats/model/:modelName
    if (path.startsWith('/api/stats/model/') && request.method === 'GET') {
      const modelName = decodeURIComponent(path.split('/').pop() || '');
      const stats = await statsService.getModelStats(modelName);

      if (!stats) {
        return new Response(JSON.stringify({ error: 'Model not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify(stats), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // GET /api/stats/recent
    if (path === '/api/stats/recent' && request.method === 'GET') {
      const recent = await statsService.getRecentPerformance();

      return new Response(JSON.stringify(recent), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // GET /api/stats/history/:modelName
    if (path.startsWith('/api/stats/history/') && request.method === 'GET') {
      const modelName = decodeURIComponent(path.split('/').pop() || '');
      const limit = parseInt(url.searchParams.get('limit') || '50');
      const history = await statsService.getModelHistory(modelName, limit);

      return new Response(JSON.stringify(history), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // GET /api/stats/streaks/:modelName
    if (path.startsWith('/api/stats/streaks/') && request.method === 'GET') {
      const modelName = decodeURIComponent(path.split('/').pop() || '');
      const streaks = await statsService.getStreaks(modelName);

      return new Response(JSON.stringify(streaks), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // GET /api/stats/head-to-head?model1=X&model2=Y
    if (path === '/api/stats/head-to-head' && request.method === 'GET') {
      const model1 = url.searchParams.get('model1');
      const model2 = url.searchParams.get('model2');

      if (!model1 || !model2) {
        return new Response(
          JSON.stringify({ error: 'Both model1 and model2 parameters required' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      const comparison = await statsService.getHeadToHead(model1, model2);

      return new Response(JSON.stringify(comparison), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Not found
    return new Response(JSON.stringify({ error: 'Endpoint not found' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('[STATS_API] Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}
