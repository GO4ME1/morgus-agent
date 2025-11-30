// Thoughts API endpoints
import { createClient } from '@supabase/supabase-js';

export interface Thought {
  id: string;
  title: string;
  description?: string;
  custom_instructions?: string;
  model_preference?: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface ThoughtMessage {
  id: string;
  thought_id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

export async function handleThoughtsAPI(request: Request, env: any): Promise<Response> {
  const url = new URL(request.url);
  const path = url.pathname;
  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_KEY);

  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // GET /api/thoughts - List all thoughts
    if (path === '/api/thoughts' && request.method === 'GET') {
      const { data, error } = await supabase
        .from('thoughts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // POST /api/thoughts - Create new thought
    if (path === '/api/thoughts' && request.method === 'POST') {
      const body = await request.json();
      const { data, error } = await supabase
        .from('thoughts')
        .insert([
          {
            title: body.title,
            description: body.description || null,
            custom_instructions: body.custom_instructions || null,
            model_preference: body.model_preference || 'gpt-4o-mini',
            is_default: false,
          }
        ])
        .select()
        .single();

      if (error) throw error;

      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // GET /api/thoughts/:id - Get specific thought
    if (path.match(/^\/api\/thoughts\/[^/]+$/) && request.method === 'GET') {
      const thoughtId = path.split('/').pop();
      const { data, error } = await supabase
        .from('thoughts')
        .select('*')
        .eq('id', thoughtId)
        .single();

      if (error) throw error;

      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // PUT /api/thoughts/:id - Update thought
    if (path.match(/^\/api\/thoughts\/[^/]+$/) && request.method === 'PUT') {
      const thoughtId = path.split('/').pop();
      const body = await request.json();
      
      const { data, error } = await supabase
        .from('thoughts')
        .update({
          title: body.title,
          description: body.description,
          custom_instructions: body.custom_instructions,
          model_preference: body.model_preference,
          updated_at: new Date().toISOString(),
        })
        .eq('id', thoughtId)
        .select()
        .single();

      if (error) throw error;

      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // DELETE /api/thoughts/:id - Delete thought
    if (path.match(/^\/api\/thoughts\/[^/]+$/) && request.method === 'DELETE') {
      const thoughtId = path.split('/').pop();
      
      // Don't allow deleting default thought
      const { data: thought } = await supabase
        .from('thoughts')
        .select('is_default')
        .eq('id', thoughtId)
        .single();

      if (thought?.is_default) {
        return new Response(JSON.stringify({ error: 'Cannot delete default thought' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { error } = await supabase
        .from('thoughts')
        .delete()
        .eq('id', thoughtId);

      if (error) throw error;

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // GET /api/thoughts/:id/messages - Get messages for a thought
    if (path.match(/^\/api\/thoughts\/[^/]+\/messages$/) && request.method === 'GET') {
      const thoughtId = path.split('/')[3];
      const { data, error } = await supabase
        .from('thought_messages')
        .select('*')
        .eq('thought_id', thoughtId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // POST /api/thoughts/:id/messages - Add message to thought
    if (path.match(/^\/api\/thoughts\/[^/]+\/messages$/) && request.method === 'POST') {
      const thoughtId = path.split('/')[3];
      const body = await request.json();
      
      const { data, error } = await supabase
        .from('thought_messages')
        .insert([
          {
            thought_id: thoughtId,
            role: body.role,
            content: body.content,
          }
        ])
        .select()
        .single();

      if (error) throw error;

      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response('Not found', { status: 404, headers: corsHeaders });
  } catch (error: any) {
    console.error('Thoughts API error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}
