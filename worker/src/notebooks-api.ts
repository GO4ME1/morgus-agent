/**
 * Notebooks API Handler
 * Handles CRUD operations for user notebooks
 */

interface NotebooksEnv {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_KEY: string;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function handleNotebooksAPI(request: Request, env: NotebooksEnv): Promise<Response> {
  const url = new URL(request.url);
  const path = url.pathname;

  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // GET /api/notebooks?user_id=xxx - List notebooks for a user
    if (path === '/api/notebooks' && request.method === 'GET') {
      const userId = url.searchParams.get('user_id');
      
      if (!userId) {
        return new Response(JSON.stringify({ error: 'user_id is required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const response = await fetch(
        `${env.SUPABASE_URL}/rest/v1/notebooks?user_id=eq.${userId}&order=created_at.desc`,
        {
          headers: {
            'apikey': env.SUPABASE_SERVICE_KEY,
            'Authorization': `Bearer ${env.SUPABASE_SERVICE_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        // Table might not exist yet - return empty array
        console.log('[Notebooks API] Table may not exist, returning empty array');
        return new Response(JSON.stringify({ notebooks: [] }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const notebooks = await response.json();
      return new Response(JSON.stringify({ notebooks: notebooks || [] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // GET /api/notebooks/daily-limit?user_id=xxx - Get daily notebook limit
    if (path === '/api/notebooks/daily-limit' && request.method === 'GET') {
      const userId = url.searchParams.get('user_id');
      
      if (!userId) {
        return new Response(JSON.stringify({ error: 'user_id is required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Get user's subscription tier to determine limit
      const profileResponse = await fetch(
        `${env.SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}&select=subscription_tier`,
        {
          headers: {
            'apikey': env.SUPABASE_SERVICE_KEY,
            'Authorization': `Bearer ${env.SUPABASE_SERVICE_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );

      let totalLimit = 5; // Default for free tier
      if (profileResponse.ok) {
        const profiles = await profileResponse.json();
        if (profiles && profiles.length > 0) {
          const tier = profiles[0].subscription_tier || 'free';
          if (tier === 'daily' || tier === 'weekly') {
            totalLimit = 20;
          } else if (tier === 'monthly') {
            totalLimit = 50;
          }
        }
      }

      // Count notebooks created today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayISO = today.toISOString();

      const countResponse = await fetch(
        `${env.SUPABASE_URL}/rest/v1/notebooks?user_id=eq.${userId}&created_at=gte.${todayISO}&select=id`,
        {
          headers: {
            'apikey': env.SUPABASE_SERVICE_KEY,
            'Authorization': `Bearer ${env.SUPABASE_SERVICE_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'count=exact',
          },
        }
      );

      let used = 0;
      if (countResponse.ok) {
        const notebooks = await countResponse.json();
        used = notebooks?.length || 0;
      }

      return new Response(JSON.stringify({ used, total: totalLimit }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // GET /api/notebooks/:id/assets - Get assets for a notebook
    const assetsMatch = path.match(/^\/api\/notebooks\/([^/]+)\/assets$/);
    if (assetsMatch && request.method === 'GET') {
      const notebookId = assetsMatch[1];

      const response = await fetch(
        `${env.SUPABASE_URL}/rest/v1/notebook_assets?notebook_id=eq.${notebookId}&order=created_at.asc`,
        {
          headers: {
            'apikey': env.SUPABASE_SERVICE_KEY,
            'Authorization': `Bearer ${env.SUPABASE_SERVICE_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        // Table might not exist yet - return empty array
        return new Response(JSON.stringify({ assets: [] }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const assets = await response.json();
      return new Response(JSON.stringify({ assets: assets || [] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // DELETE /api/notebooks/:id - Delete a notebook
    const deleteMatch = path.match(/^\/api\/notebooks\/([^/]+)$/);
    if (deleteMatch && request.method === 'DELETE') {
      const notebookId = deleteMatch[1];

      // Delete associated assets first
      await fetch(
        `${env.SUPABASE_URL}/rest/v1/notebook_assets?notebook_id=eq.${notebookId}`,
        {
          method: 'DELETE',
          headers: {
            'apikey': env.SUPABASE_SERVICE_KEY,
            'Authorization': `Bearer ${env.SUPABASE_SERVICE_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );

      // Delete the notebook
      const response = await fetch(
        `${env.SUPABASE_URL}/rest/v1/notebooks?id=eq.${notebookId}`,
        {
          method: 'DELETE',
          headers: {
            'apikey': env.SUPABASE_SERVICE_KEY,
            'Authorization': `Bearer ${env.SUPABASE_SERVICE_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        return new Response(JSON.stringify({ error: 'Failed to delete notebook' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // POST /api/notebooks - Create a new notebook
    if (path === '/api/notebooks' && request.method === 'POST') {
      const body = await request.json() as {
        user_id: string;
        purpose: string;
        title: string;
        summary?: string;
        raw_notebook?: string;
        sections?: any[];
        mindmap?: any;
        flowchart?: any;
      };

      const response = await fetch(
        `${env.SUPABASE_URL}/rest/v1/notebooks`,
        {
          method: 'POST',
          headers: {
            'apikey': env.SUPABASE_SERVICE_KEY,
            'Authorization': `Bearer ${env.SUPABASE_SERVICE_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation',
          },
          body: JSON.stringify({
            user_id: body.user_id,
            purpose: body.purpose,
            title: body.title,
            summary: body.summary || '',
            raw_notebook: body.raw_notebook || '',
            sections: body.sections || [],
            mindmap: body.mindmap || null,
            flowchart: body.flowchart || null,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.text();
        return new Response(JSON.stringify({ error: `Failed to create notebook: ${error}` }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const notebook = await response.json();
      return new Response(JSON.stringify({ notebook: notebook[0] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Not found' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('[Notebooks API] Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}
