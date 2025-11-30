import { createClient } from '@supabase/supabase-js';

interface Env {
  SUPABASE_URL: string;
  SUPABASE_KEY: string;
  OPENAI_API_KEY: string;
  E2B_API_KEY: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    const url = new URL(request.url);
    const path = url.pathname;

    try {
      // Initialize clients
      const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_KEY);

      // Health check
      if (path === '/health' && request.method === 'GET') {
        return new Response(JSON.stringify({ status: 'healthy', timestamp: new Date().toISOString() }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Debug endpoint
      if (path === '/debug' && request.method === 'GET') {
        const keyPrefix = env.OPENAI_API_KEY ? env.OPENAI_API_KEY.substring(0, 10) : 'missing';
        return new Response(JSON.stringify({ 
          hasOpenAI: !!env.OPENAI_API_KEY,
          hasSupabase: !!env.SUPABASE_URL && !!env.SUPABASE_KEY,
          hasE2B: !!env.E2B_API_KEY,
          openaiKeyPrefix: keyPrefix
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Create task
      if (path === '/tasks' && request.method === 'POST') {
        const body = await request.json() as { description: string };
        
        const { data: task, error } = await supabase
          .from('tasks')
          .insert({
            description: body.description,
            status: 'pending',
            created_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (error) throw error;

        return new Response(JSON.stringify(task), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 201,
        });
      }

      // Get task
      if (path.startsWith('/tasks/') && request.method === 'GET') {
        const taskId = path.split('/')[2];
        
        const { data: task, error } = await supabase
          .from('tasks')
          .select('*, task_steps(*)')
          .eq('id', taskId)
          .single();

        if (error) throw error;

        return new Response(JSON.stringify(task), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Execute task (chat-based)
      if (path === '/chat' && request.method === 'POST') {
        const body = await request.json() as { message: string; task_id?: string };
        
        // Create or get task
        let taskId = body.task_id;
        if (!taskId) {
          const { data: task, error } = await supabase
            .from('tasks')
            .insert({
              title: body.message.substring(0, 100),
              description: body.message,
              status: 'processing',
              created_at: new Date().toISOString(),
            })
            .select()
            .single();

          if (error) throw error;
          taskId = task.id;
        }

        // Call OpenAI API to process the message
        const systemPrompt = `You are Morgus, an autonomous AI agent that helps users accomplish tasks. 
You can:
- Research information
- Plan complex projects
- Write code
- Execute commands
- Deploy applications

Respond conversationally and break down complex tasks into steps.`;

        console.log('Making OpenAI API call...');
        console.log('API Key prefix:', env.OPENAI_API_KEY ? env.OPENAI_API_KEY.substring(0, 15) : 'missing');
        
        const openaiResponse = await fetch(
          'https://api.openai.com/v1/chat/completions',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${env.OPENAI_API_KEY}`,
            },
            body: JSON.stringify({
              model: 'gpt-3.5-turbo',
              messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: body.message }
              ],
              temperature: 0.7,
              max_tokens: 2048,
            }),
          }
        );

        if (!openaiResponse.ok) {
          const errorData = await openaiResponse.json() as any;
          console.error('OpenAI API Error:', errorData);
          console.error('Status:', openaiResponse.status);
          throw new Error(`OpenAI API error: ${errorData.error?.message || openaiResponse.statusText}`);
        }

        const data = await openaiResponse.json() as any;
        const response = data.choices?.[0]?.message?.content || 
          'I apologize, but I encountered an error processing your request.';

        // Save step
        await supabase.from('task_steps').insert({
          task_id: taskId,
          phase: 'chat',
          step_number: 1,
          description: body.message,
          result: response,
          status: 'completed',
          created_at: new Date().toISOString(),
        });

        // Update task
        await supabase
          .from('tasks')
          .update({ status: 'completed', updated_at: new Date().toISOString() })
          .eq('id', taskId);

        return new Response(JSON.stringify({
          task_id: taskId,
          message: response,
          status: 'completed'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // 404
      return new Response(JSON.stringify({ error: 'Not found' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 404,
      });

    } catch (error: any) {
      console.error('Error:', error);
      return new Response(JSON.stringify({ error: error.message || 'Internal server error' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }
  },
};
