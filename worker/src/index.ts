import { createClient } from '@supabase/supabase-js';
import { AutonomousAgent } from './agent';
import { handleThoughtsAPI } from './thoughts-api';
import { MOEEndpoint } from './moe/endpoint';

interface Env {
  SUPABASE_URL: string;
  SUPABASE_KEY: string;
  OPENAI_API_KEY: string;
  E2B_API_KEY: string;
  OPENROUTER_API_KEY: string;
  TAVILY_API_KEY?: string;
  PEXELS_API_KEY?: string;
  GEMINI_API_KEY?: string;
  ELEVENLABS_API_KEY?: string;
  ELEVENLABS_VOICE_ID?: string;
}

interface ChatMessage {
  message: string;
  task_id?: string;
  thought_id?: string;
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

      // Thoughts API routing
      if (path.startsWith('/api/thoughts')) {
        return handleThoughtsAPI(request, env);
      }

      // File upload endpoint
      if (path === '/upload' && request.method === 'POST') {
        try {
          const formData = await request.formData();
          const files = formData.getAll('files');
          
          if (files.length === 0) {
            return new Response(JSON.stringify({ error: 'No files provided' }), {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }

          // Convert files to base64 data URLs for the agent to process
          const fileData = await Promise.all(
            files.map(async (file: any) => {
              const buffer = await file.arrayBuffer();
              const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));
              return {
                name: file.name,
                type: file.type,
                size: file.size,
                data: `data:${file.type};base64,${base64}`,
              };
            })
          );

          return new Response(JSON.stringify({ 
            success: true,
            files: fileData,
            urls: fileData.map(f => f.data) // Return data URLs
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

      // Text-to-Speech endpoint
      if (path === '/api/tts' && request.method === 'POST') {
        const body = await request.json();
        const { text } = body;

        if (!text) {
          return new Response(JSON.stringify({ error: 'Text is required' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        if (!env.ELEVENLABS_API_KEY || !env.ELEVENLABS_VOICE_ID) {
          return new Response(JSON.stringify({ error: 'ElevenLabs not configured' }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        try {
          const response = await fetch(
            `https://api.elevenlabs.io/v1/text-to-speech/${env.ELEVENLABS_VOICE_ID}`,
            {
              method: 'POST',
              headers: {
                'xi-api-key': env.ELEVENLABS_API_KEY,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                text: text,
                model_id: 'eleven_multilingual_v2',
              }),
            }
          );

          if (!response.ok) {
            const error = await response.text();
            return new Response(JSON.stringify({ error: `ElevenLabs API error: ${error}` }), {
              status: response.status,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }

          const audioData = await response.arrayBuffer();
          return new Response(audioData, {
            headers: {
              ...corsHeaders,
              'Content-Type': 'audio/mpeg',
            },
          });
        } catch (error: any) {
          return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
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

      // MOE Chat endpoint - Model competition with Nash Equilibrium
      if (path === '/moe-chat' && request.method === 'POST') {
        const body = await request.json() as ChatMessage;
        
        try {
          const moe = new MOEEndpoint(env.OPENROUTER_API_KEY);
          
          // Convert conversation history to MOE format
          const messages = (body.history || []).concat([{
            role: 'user',
            content: body.message
          }]);
          
          // Query MOE system
          const result = await moe.chat({ messages });
          
          return new Response(JSON.stringify({
            message: result.content,
            moeMetadata: result.moeMetadata,
            status: 'completed'
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        } catch (error: any) {
          console.error('MOE error:', error);
          return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      }

      // Chat endpoint with streaming and conversation history
      if (path === '/chat' && request.method === 'POST') {
        const body = await request.json() as ChatMessage;
        
        // Use history from request body (sent by frontend)
        const conversationHistory = body.history || [];

        // If thought_id is provided, save message to thought
        if (body.thought_id) {
          try {
            await supabase.from('thought_messages').insert({
              thought_id: body.thought_id,
              role: 'user',
              content: body.message,
              created_at: new Date().toISOString(),
            });
          } catch (error) {
            console.error('Failed to save user message to thought:', error);
          }
        }

        // Add user message to history with files if provided
        let userMessage = body.message;
        if (body.files && body.files.length > 0) {
          userMessage += '\n\n**Attached Files:**\n';
          body.files.forEach((fileUrl: string, index: number) => {
            // Include the actual data URL so the agent can process it
            userMessage += `\n${index + 1}. [File ${index + 1}](${fileUrl})`;
          });
        }
        
        conversationHistory.push({
          role: 'user',
          content: userMessage
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

                // Collect final response (only keep the LAST one)
                if (message.type === 'response') {
                  finalResponse = message.content;
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

              // Save assistant response to thought if thought_id is provided
              if (body.thought_id && finalResponse) {
                try {
                  await supabase.from('thought_messages').insert({
                    thought_id: body.thought_id,
                    role: 'assistant',
                    content: finalResponse.trim(),
                    created_at: new Date().toISOString(),
                  });
                } catch (error) {
                  console.error('Failed to save assistant response to thought:', error);
                }
              }

              // Update task status
              const { error: updateError } = await supabase
                .from('tasks')
                .update({ status: 'completed', updated_at: new Date().toISOString() })
                .eq('id', taskId);
              
              if (updateError) {
                console.error('Failed to update task status:', updateError);
              } else {
                console.log('Task status updated to completed:', taskId);
              }

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
            // Only keep the LAST response, don't accumulate
            finalResponse = message.content;
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
        const { error: updateError } = await supabase
          .from('tasks')
          .update({ status: 'completed', updated_at: new Date().toISOString() })
          .eq('id', taskId);
        
        if (updateError) {
          console.error('Failed to update task status:', updateError);
        } else {
          console.log('Task status updated to completed:', taskId);
        }

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
