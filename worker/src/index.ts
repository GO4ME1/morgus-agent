import { createClient } from '@supabase/supabase-js';
import { AutonomousAgent } from './agent';

interface Env {
  SUPABASE_URL: string;
  SUPABASE_KEY: string;
  OPENAI_API_KEY: string;
  E2B_API_KEY: string;
  TAVILY_API_KEY?: string;
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
          hasTavily: !!env.TAVILY_API_KEY,
          openaiKeyPrefix: keyPrefix
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Chat endpoint with streaming
      if (path === '/chat' && request.method === 'POST') {
        const body = await request.json() as { message: string; task_id?: string; stream?: boolean };
        
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

        // Check if streaming is requested
        if (body.stream) {
          // Return streaming response
          const { readable, writable } = new TransformStream();
          const writer = writable.getWriter();
          const encoder = new TextEncoder();

          // Start agent execution in background
          (async () => {
            try {
              const agent = new AutonomousAgent({
                maxIterations: 10,
                model: 'gpt-4-turbo-preview',
              });

              let finalResponse = '';
              let stepNumber = 1;

              for await (const message of agent.executeTask(body.message, env)) {
                // Send message to client
                await writer.write(encoder.encode(`data: ${JSON.stringify(message)}\n\n`));

                // Save step to database
                await supabase.from('task_steps').insert({
                  task_id: taskId,
                  phase: 'execution',
                  step_number: stepNumber++,
                  description: message.content,
                  result: JSON.stringify(message.metadata || {}),
                  status: message.type === 'error' ? 'error' : 'completed',
                  created_at: new Date().toISOString(),
                });

                if (message.type === 'response') {
                  finalResponse = message.content;
                }
              }

              // Update task as completed
              await supabase
                .from('tasks')
                .update({ 
                  status: 'completed', 
                  result: finalResponse,
                  updated_at: new Date().toISOString() 
                })
                .eq('id', taskId);

              await writer.close();
            } catch (error: any) {
              await writer.write(encoder.encode(`data: ${JSON.stringify({
                type: 'error',
                content: error.message
              })}\n\n`));
              await writer.close();
            }
          })();

          return new Response(readable, {
            headers: {
              ...corsHeaders,
              'Content-Type': 'text/event-stream',
              'Cache-Control': 'no-cache',
              'Connection': 'keep-alive',
            },
          });
        }

        // Non-streaming response (for compatibility)
        const agent = new AutonomousAgent({
          maxIterations: 10,
          model: 'gpt-4-turbo-preview',
        });

        let finalResponse = '';
        let stepNumber = 1;

        for await (const message of agent.executeTask(body.message, env)) {
          // Save step to database
          await supabase.from('task_steps').insert({
            task_id: taskId,
            phase: 'execution',
            step_number: stepNumber++,
            description: message.content,
            result: JSON.stringify(message.metadata || {}),
            status: message.type === 'error' ? 'error' : 'completed',
            created_at: new Date().toISOString(),
          });

          if (message.type === 'response') {
            finalResponse = message.content;
          }
        }

        // Update task
        await supabase
          .from('tasks')
          .update({ 
            status: 'completed',
            result: finalResponse,
            updated_at: new Date().toISOString() 
          })
          .eq('id', taskId);

        return new Response(JSON.stringify({
          task_id: taskId,
          message: finalResponse,
          status: 'completed'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Not found
      return new Response(JSON.stringify({ error: 'Not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } catch (error: any) {
      console.error('Worker error:', error);
      return new Response(JSON.stringify({ 
        error: error.message || 'Internal server error',
        details: error.stack
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  },
};
