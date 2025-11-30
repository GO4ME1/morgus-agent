import { createClient } from '@supabase/supabase-js';

interface Env {
  SUPABASE_URL: string;
  SUPABASE_KEY: string;
  GEMINI_API_KEY: string;
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
              description: body.message,
              status: 'processing',
              created_at: new Date().toISOString(),
            })
            .select()
            .single();

          if (error) throw error;
          taskId = task.id;
        }

        // Call Gemini API to process the message
        const systemPrompt = `You are Morgus, an autonomous AI agent that helps users accomplish tasks. 
You can:
- Research information
- Plan complex projects
- Write code
- Execute commands
- Deploy applications

Respond conversationally and break down complex tasks into steps.`;

        const geminiResponse = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${env.GEMINI_API_KEY}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              contents: [{
                parts: [{
                  text: systemPrompt + '\n\nUser: ' + body.message
                }]
              }],
              generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 2048,
              }
            }),
          }
        );

        if (!geminiResponse.ok) {
          throw new Error(`Gemini API error: ${geminiResponse.statusText}`);
        }

        const data = await geminiResponse.json() as any;
        const response = data.candidates?.[0]?.content?.parts?.[0]?.text || 
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
