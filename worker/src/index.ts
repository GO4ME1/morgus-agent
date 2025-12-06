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
  files?: string[]; // Base64 data URLs for images/PDFs
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
      
      // Stats API routing
      if (path.startsWith('/api/stats')) {
        const { handleStatsAPI } = await import('./stats-api');
        return handleStatsAPI(request, env);
      }

      // File upload endpoint
      if (path === '/upload' && request.method === 'POST') {
        try {
          const formData = await request.formData();
          const files = formData.getAll('files');
          console.log('[UPLOAD] Received', files.length, 'files');
          
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

          console.log('[UPLOAD] Converted files:', fileData.map(f => ({ name: f.name, type: f.type, size: f.size, dataLength: f.data.length })));
          
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

      // MOE Chat endpoint - Model competition + Gemini agent execution
      if (path === '/moe-chat' && request.method === 'POST') {
        const body = await request.json() as ChatMessage;
        
        try {
          // Step 1: Run MOE competition to get best answer
          const moe = new MOEEndpoint(env.OPENROUTER_API_KEY);
          
          // Enhance prompt when files are attached
          let userMessage = body.message;
          console.log('[MOE-CHAT] Files received:', body.files?.length || 0);
          if (body.files && body.files.length > 0) {
            const fileCount = body.files.length;
            const fileTypes = body.files.map(f => {
              const match = f.match(/^data:([^;]+)/);
              return match ? match[1] : 'unknown';
            });
            
            console.log('[MOE-CHAT] File types:', fileTypes);
            console.log('[MOE-CHAT] File sizes:', body.files.map(f => f.length));
            
            // Add explicit instruction to analyze the documents
            userMessage = `${body.message}\n\n[${fileCount} file(s) attached: ${fileTypes.join(', ')}]\n\nPlease analyze the attached document(s) in detail and answer the user's question based on the content.`;
            console.log('[MOE-CHAT] Enhanced message:', userMessage.substring(0, 200));
          }
          
          const messages = (body.history || []).concat([{
            role: 'user',
            content: userMessage
          }]);
          
          // Run MOE with OpenRouter models + Gemini + GPT-4o-mini + Claude
          const moeResult = await moe.chatWithMultipleAPIs({ 
            messages, 
            geminiApiKey: env.GEMINI_API_KEY,
            openaiApiKey: env.OPENAI_API_KEY,
            anthropicApiKey: env.ANTHROPIC_API_KEY,
            files: body.files // Pass uploaded files for vision models
          });
          
          // Record competition stats in background (don't await)
          try {
            const { ModelStatsService } = await import('./services/model-stats');
            const statsService = new ModelStatsService(env.SUPABASE_URL, env.SUPABASE_KEY);
            
            // Extract file types if present
            const fileTypes = body.files?.map(f => {
              const match = f.match(/^data:([^;]+)/);
              return match ? match[1] : 'unknown';
            }) || [];
            
            // Prepare competition results
            const competitionResults = moeResult.moeMetadata.allModels.map((model, index) => ({
              model_name: model.model,
              is_winner: model.model === moeResult.moeMetadata.winner.model,
              score: model.score,
              rank: index + 1,
              latency: model.latency,
              tokens: model.tokens,
              cost: model.cost,
              user_message: body.message,
              model_response: model.model === moeResult.moeMetadata.winner.model ? moeResult.content : undefined,
              had_files: (body.files?.length || 0) > 0,
              file_types: fileTypes.length > 0 ? fileTypes : undefined,
            }));
            
            // Record asynchronously (don't block response)
            statsService.recordCompetition(competitionResults).catch(err => {
              console.error('[MOE-CHAT] Failed to record stats:', err);
            });
          } catch (error) {
            console.error('[MOE-CHAT] Error setting up stats tracking:', error);
          }
          
          // Step 2: Pass MOE winner's answer to autonomous agent for tool execution
          const agent = new AutonomousAgent({ 
            maxIterations: 10,
            model: 'gpt-4o-mini' // Use OpenAI for tool support
          });
          
          // Create enhanced prompt that encourages tool use when appropriate
          const enhancedPrompt = `User query: ${body.message}

MOE expert analysis: ${moeResult.content}

Enhance this response if needed:
- If user asks for images/pictures, use search_images tool
- If user asks for charts/data visualization, use execute_code tool
- Otherwise, provide a helpful response based on the expert analysis

Be smart about when to use tools - don't force them if not needed.`;
          
          console.log('[MOE-CHAT] User message:', body.message);
          console.log('[MOE-CHAT] Has PEXELS_API_KEY:', !!env.PEXELS_API_KEY);
          
          // Collect all streamed messages from agent execution
          let finalResponse = '';
          const conversationHistory = body.history || [];
          
          for await (const message of agent.executeTask(enhancedPrompt, env, conversationHistory)) {
            console.log('[MOE-CHAT] Agent message:', message.type, message.content?.substring(0, 100));
            
            // Only capture actual response content, not status messages
            if (message.type === 'response') {
              finalResponse = message.content;
            }
          }
          
          return new Response(JSON.stringify({
            message: finalResponse || moeResult.content,
            moeMetadata: moeResult.moeMetadata,
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
