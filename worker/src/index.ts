import { createClient } from '@supabase/supabase-js';
import { AutonomousAgent } from './agent';

interface Env {
  SUPABASE_URL: string;
  SUPABASE_KEY: string;
  OPENAI_API_KEY: string;
  E2B_API_KEY: string;
  TAVILY_API_KEY?: string;
}

interface ChatMessage {
  message: string;
  task_id?: string;
  conversation_id?: string;
  stream?: boolean;
  history?: Array<{role: string, content: string}>;
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

      // Feedback endpoint for self-improvement
      if (path === '/feedback' && request.method === 'POST') {
        const body = await request.json();
        const { message_id, feedback_type, input, output, task_id } = body;

        // Calculate score based on feedback type
        const score = feedback_type === 'positive' ? 1.0 : feedback_type === 'negative' ? 0.0 : 0.0;

        // Store feedback in database (will create table later)
        try {
          await supabase.from('agent_evaluations').insert({
            task_id: task_id || null,
            agent_version: 'v1.0.0', // Will be dynamic later
            input_text: input,
            output_text: output,
            score: score,
            feedback_type: feedback_type === 'glitch' ? 'human_glitch' : 'human',
            feedback_text: feedback_type === 'glitch' ? 'User reported a glitch/bug' : null,
            metadata: { message_id },
            created_at: new Date().toISOString(),
          });
        } catch (error) {
          console.error('Failed to store feedback (table may not exist yet):', error);
        }

        return new Response(JSON.stringify({ success: true, message: 'Feedback recorded' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Chat endpoint with streaming and conversation history
      if (path === '/chat' && request.method === 'POST') {
        const body = await request.json() as ChatMessage;
        
        // Use history from request body (sent by frontend)
        const conversationHistory = body.history || [];

        // Add user message to history
        conversationHistory.push({
          role: 'user',
          content: body.message
        });

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
                maxIterations: 10, // Increased to allow task completion
                model: 'gpt-4o-mini',
              });

              let finalResponse = '';
              let stepNumber = 1;

              // Pass conversation history to agent
              for await (const message of agent.executeTask(body.message, env, conversationHistory)) {
                // Send message to client
                await writer.write(encoder.encode(`data: ${JSON.stringify(message)}\n\n`));

                // Collect final response
                if (message.type === 'response') {
                  finalResponse += message.content + '\n';
                }

                // Save step to database
                await supabase.from('task_steps').insert({
                  task_id: taskId,
                  step_number: stepNumber++,
                  step_type: message.type,
                  content: message.content,
                  metadata: message.metadata,
                  created_at: new Date().toISOString(),
                });
              }

              // No need to save conversation - frontend maintains history

              // Update task status
              await supabase
                .from('tasks')
                .update({ status: 'completed', updated_at: new Date().toISOString() })
                .eq('id', taskId);

              await writer.close();
            } catch (error: any) {
              console.error('Agent execution error:', error);
              await writer.write(encoder.encode(`data: ${JSON.stringify({
                type: 'error',
                content: `Error: ${error.message}`
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
          maxIterations: 10, // Increased to allow task completion
          model: 'gpt-4o-mini',
        });

        let finalResponse = '';
        let stepNumber = 1;

        for await (const message of agent.executeTask(body.message, env, conversationHistory)) {
          if (message.type === 'response') {
            finalResponse += message.content + '\n';
          }

          // Save step to database
          await supabase.from('task_steps').insert({
            task_id: taskId,
            step_number: stepNumber++,
            step_type: message.type,
            content: message.content,
            metadata: message.metadata,
            created_at: new Date().toISOString(),
          });
        }

        // No need to save conversation - frontend maintains history

        // Update task status
        await supabase
          .from('tasks')
          .update({ status: 'completed', updated_at: new Date().toISOString() })
          .eq('id', taskId);

        return new Response(JSON.stringify({
          task_id: taskId,
          message: finalResponse.trim(),
          status: 'completed',
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // 404 for unknown routes
      return new Response('Not Found', { status: 404, headers: corsHeaders });

    } catch (error: any) {
      console.error('Worker error:', error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  },
};
