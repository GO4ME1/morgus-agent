import { createClient } from '@supabase/supabase-js';
import { AutonomousAgent } from './agent';
import { handleThoughtsAPI } from './thoughts-api';
import { MOEEndpoint } from './moe/endpoint';
import { handleStripeWebhook, StripeService } from './stripe';
import { handleUsageAPI } from './usage-api';
import { handlePromoAPI } from './promo-api';
import { handleReferralAPI } from './referral-api';
import { handleAdminAPI } from './admin-api';
import { handleNotebooksAPI } from './notebooks-api';
import { handleUserPreferencesAPI } from './user-preferences-api';
import { createSubscriptionMiddleware } from './subscription-middleware';
import { contentFilter } from './services/content-filter';
import { categorizeQuery, QueryCategory } from './services/query-categorizer';
import { analyzeComplexity, executeDPPMMOE, type ProgressUpdate } from './dppm-moe-integration';
import { MorgusPrime, isComplexTask, createMorgusPrime } from './morgus-prime';

interface Env {
  SUPABASE_URL: string;
  SUPABASE_KEY: string;
  SUPABASE_SERVICE_KEY: string;
  OPENAI_API_KEY: string;
  E2B_API_KEY: string;
  OPENROUTER_API_KEY: string;
  TAVILY_API_KEY?: string;
  PEXELS_API_KEY?: string;
  GEMINI_API_KEY?: string;
  ELEVENLABS_API_KEY?: string;
  ELEVENLABS_VOICE_ID?: string;
  STRIPE_SECRET_KEY?: string;
  STRIPE_PUBLISHABLE_KEY?: string;
  STRIPE_WEBHOOK_SECRET?: string;
  RESEND_API_KEY?: string;
  GITHUB_TOKEN?: string;
}

interface ChatMessage {
  message: string;
  task_id?: string;
  thought_id?: string;
  conversation_id?: string;
  stream?: boolean;
  history?: Array<{role: string, content: string}>;
  files?: string[]; // Base64 data URLs for images/PDFs
  mcp_tools_prompt?: string; // MCP tools system prompt to include
  is_tool_synthesis?: boolean; // Flag to skip MCP tools in synthesis requests
  user_id?: string;
  dont_train_on_me?: boolean;
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

      // Webhook health monitoring endpoint
      if (path === '/api/webhook-health' && request.method === 'GET') {
        try {
          const healthResponse = await fetch(
            `${env.SUPABASE_URL}/rest/v1/rpc/get_system_health`,
            {
              method: 'POST',
              headers: {
                'apikey': env.SUPABASE_SERVICE_KEY || env.SUPABASE_KEY,
                'Authorization': `Bearer ${env.SUPABASE_SERVICE_KEY || env.SUPABASE_KEY}`,
                'Content-Type': 'application/json',
              },
              body: '{}',
            }
          );
          const healthData = await healthResponse.json();
          return new Response(JSON.stringify(healthData), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        } catch (err: any) {
          return new Response(JSON.stringify({ error: err.message, status: 'error' }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      }

      // Webhook stats endpoint
      if (path === '/api/webhook-stats' && request.method === 'GET') {
        try {
          const statsResponse = await fetch(
            `${env.SUPABASE_URL}/rest/v1/rpc/get_webhook_health_stats`,
            {
              method: 'POST',
              headers: {
                'apikey': env.SUPABASE_SERVICE_KEY || env.SUPABASE_KEY,
                'Authorization': `Bearer ${env.SUPABASE_SERVICE_KEY || env.SUPABASE_KEY}`,
                'Content-Type': 'application/json',
              },
              body: '{}',
            }
          );
          const statsData = await statsResponse.json();
          return new Response(JSON.stringify(statsData), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        } catch (err: any) {
          return new Response(JSON.stringify({ error: err.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      }

      // Subscription stats endpoint
      if (path === '/api/subscription-stats' && request.method === 'GET') {
        try {
          const statsResponse = await fetch(
            `${env.SUPABASE_URL}/rest/v1/rpc/get_subscription_stats`,
            {
              method: 'POST',
              headers: {
                'apikey': env.SUPABASE_SERVICE_KEY || env.SUPABASE_KEY,
                'Authorization': `Bearer ${env.SUPABASE_SERVICE_KEY || env.SUPABASE_KEY}`,
                'Content-Type': 'application/json',
              },
              body: '{}',
            }
          );
          const statsData = await statsResponse.json();
          return new Response(JSON.stringify(statsData), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        } catch (err: any) {
          return new Response(JSON.stringify({ error: err.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      }

      // Active alerts endpoint
      if (path === '/api/alerts' && request.method === 'GET') {
        try {
          const alertsResponse = await fetch(
            `${env.SUPABASE_URL}/rest/v1/rpc/get_active_alerts`,
            {
              method: 'POST',
              headers: {
                'apikey': env.SUPABASE_SERVICE_KEY || env.SUPABASE_KEY,
                'Authorization': `Bearer ${env.SUPABASE_SERVICE_KEY || env.SUPABASE_KEY}`,
                'Content-Type': 'application/json',
              },
              body: '{}',
            }
          );
          const alertsData = await alertsResponse.json();
          return new Response(JSON.stringify(alertsData), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        } catch (err: any) {
          return new Response(JSON.stringify({ error: err.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      }

      // Acknowledge alert endpoint
      if (path === '/api/alerts/acknowledge' && request.method === 'POST') {
        try {
          const body = await request.json() as { alertId: string; userId: string };
          const ackResponse = await fetch(
            `${env.SUPABASE_URL}/rest/v1/rpc/acknowledge_alert`,
            {
              method: 'POST',
              headers: {
                'apikey': env.SUPABASE_SERVICE_KEY || env.SUPABASE_KEY,
                'Authorization': `Bearer ${env.SUPABASE_SERVICE_KEY || env.SUPABASE_KEY}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ alert_id: body.alertId, user_id: body.userId }),
            }
          );
          const result = await ackResponse.json();
          return new Response(JSON.stringify({ success: result }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        } catch (err: any) {
          return new Response(JSON.stringify({ error: err.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      }

      // Alert notification endpoint (called by Supabase Database Webhook)
      if (path === '/api/alert-notification' && request.method === 'POST') {
        try {
          const payload = await request.json() as any;
          const record = payload.record || payload;
          
          console.log('🚨 ALERT RECEIVED:', JSON.stringify({
            event_id: record.event_id,
            event_type: record.event_type,
            severity: record.severity,
            error_message: record.error_message,
            created_at: record.created_at,
          }));
          
          // Send email alert via Resend
          // Temporary fallback for testing - remove after confirming secrets work
          const resendApiKey = env.RESEND_API_KEY || 're_REUiV8mR_LJ6zi1sH3BfWePhaWmETj5FP';
          let emailSent = false;
          let emailError: any = null;
          
          if (resendApiKey) {
            try {
              const emailResponse = await fetch('https://api.resend.com/emails', {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${resendApiKey}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  from: 'Morgus Alerts <alerts@themorgus.com>',
                  to: ['lawyers@themorgus.com'],
                  subject: `[${(record.severity || 'ALERT').toUpperCase()}] Webhook Alert: ${record.event_type || 'Unknown Event'}`,
                  html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                      <h2 style="color: #e53e3e;">🚨 Webhook Alert</h2>
                      <table style="width: 100%; border-collapse: collapse;">
                        <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Severity:</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${record.severity || 'Unknown'}</td></tr>
                        <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Event Type:</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${record.event_type || 'Unknown'}</td></tr>
                        <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Event ID:</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${record.event_id || 'Unknown'}</td></tr>
                        <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Error:</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${record.error_message || 'No error message'}</td></tr>
                        <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Time:</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${record.created_at || new Date().toISOString()}</td></tr>
                      </table>
                      <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;">
                      <p><a href="https://supabase.com/dashboard/project/dnxqgphaisdxvdyeiwnh/editor/webhook_alerts" style="color: #3182ce;">View all alerts in Supabase Dashboard</a></p>
                      <p style="color: #718096; font-size: 12px;">This is an automated alert from Morgus monitoring system.</p>
                    </div>
                  `,
                }),
              });
              
              if (emailResponse.ok) {
                console.log('✅ Alert email sent successfully via Resend');
                emailSent = true;
              } else {
                const errorData = await emailResponse.json();
                emailError = { status: emailResponse.status, data: errorData };
                console.error('❌ Failed to send alert email:', emailResponse.status, JSON.stringify(errorData));
              }
            } catch (emailErr: any) {
              emailError = { message: emailErr.message };
              console.error('❌ Email sending error:', emailErr.message);
            }
          } else {
            console.warn('⚠️ RESEND_API_KEY not configured - email not sent');
          }
          
          return new Response(JSON.stringify({ received: true, alert_logged: true, email_sent: emailSent, has_resend_key: !!resendApiKey, key_length: resendApiKey ? resendApiKey.length : 0, email_error: emailError }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        } catch (err: any) {
          console.error('Alert notification error:', err.message);
          return new Response(JSON.stringify({ error: err.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      }

      // Stripe webhook endpoint
      if (path === '/stripe-webhook' && request.method === 'POST') {
        if (!env.STRIPE_SECRET_KEY || !env.STRIPE_WEBHOOK_SECRET) {
          return new Response('Stripe not configured', { status: 500 });
        }
        return handleStripeWebhook(request, {
          STRIPE_SECRET_KEY: env.STRIPE_SECRET_KEY,
          STRIPE_WEBHOOK_SECRET: env.STRIPE_WEBHOOK_SECRET,
          STRIPE_PUBLISHABLE_KEY: env.STRIPE_PUBLISHABLE_KEY || '',
          SUPABASE_URL: env.SUPABASE_URL,
          SUPABASE_SERVICE_KEY: env.SUPABASE_SERVICE_KEY || env.SUPABASE_KEY,
        });
      }

      // Stripe checkout session endpoint
      if (path === '/api/checkout' && request.method === 'POST') {
        if (!env.STRIPE_SECRET_KEY) {
          return new Response(JSON.stringify({ error: 'Stripe not configured' }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        
        const body = await request.json() as {
          userId: string;
          email: string;
          planId: 'daily' | 'weekly' | 'monthly';
          successUrl: string;
          cancelUrl: string;
        };
        
        const stripeService = new StripeService({
          STRIPE_SECRET_KEY: env.STRIPE_SECRET_KEY,
          STRIPE_WEBHOOK_SECRET: env.STRIPE_WEBHOOK_SECRET || '',
          STRIPE_PUBLISHABLE_KEY: env.STRIPE_PUBLISHABLE_KEY || '',
          SUPABASE_URL: env.SUPABASE_URL,
          SUPABASE_SERVICE_KEY: env.SUPABASE_SERVICE_KEY || env.SUPABASE_KEY,
        });
        
        try {
          const session = await stripeService.createCheckoutSession(
            body.userId,
            body.email,
            body.planId,
            body.successUrl,
            body.cancelUrl
          );
          return new Response(JSON.stringify(session), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        } catch (err: any) {
          return new Response(JSON.stringify({ error: err.message }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      }

      // Stripe billing portal endpoint
      if (path === '/api/billing-portal' && request.method === 'POST') {
        if (!env.STRIPE_SECRET_KEY) {
          return new Response(JSON.stringify({ error: 'Stripe not configured' }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        
        const body = await request.json() as { userId: string; returnUrl: string };
        
        const stripeService = new StripeService({
          STRIPE_SECRET_KEY: env.STRIPE_SECRET_KEY,
          STRIPE_WEBHOOK_SECRET: env.STRIPE_WEBHOOK_SECRET || '',
          STRIPE_PUBLISHABLE_KEY: env.STRIPE_PUBLISHABLE_KEY || '',
          SUPABASE_URL: env.SUPABASE_URL,
          SUPABASE_SERVICE_KEY: env.SUPABASE_SERVICE_KEY || env.SUPABASE_KEY,
        });
        
        try {
          const url = await stripeService.createPortalSession(body.userId, body.returnUrl);
          return new Response(JSON.stringify({ url }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        } catch (err: any) {
          return new Response(JSON.stringify({ error: err.message }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      }

      // Notebooks API routing
      if (path.startsWith('/api/notebooks')) {
        return handleNotebooksAPI(request, {
          SUPABASE_URL: env.SUPABASE_URL,
          SUPABASE_SERVICE_KEY: env.SUPABASE_SERVICE_KEY || env.SUPABASE_KEY,
        });
      }

      // User Preferences API routing
      if (path.startsWith('/api/user')) {
        const corsHeaders = {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        };
        const response = await handleUserPreferencesAPI(request, {
          SUPABASE_URL: env.SUPABASE_URL,
          SUPABASE_KEY: env.SUPABASE_KEY,
          SUPABASE_SERVICE_KEY: env.SUPABASE_SERVICE_KEY,
        }, corsHeaders);
        if (response) return response;
      }

      // Thoughts API routing
      if (path.startsWith('/api/thoughts')) {
        return handleThoughtsAPI(request, env);
      }

      // Usage API routing
      if (path.startsWith('/api/usage') || path.startsWith('/api/subscription')) {
        return handleUsageAPI(request, {
          SUPABASE_URL: env.SUPABASE_URL,
          SUPABASE_SERVICE_KEY: env.SUPABASE_SERVICE_KEY || env.SUPABASE_KEY,
        });
      }

      // Promo code API routing
      if (path.startsWith('/api/promo') || path.startsWith('/api/wallet')) {
        return handlePromoAPI(request, {
          SUPABASE_URL: env.SUPABASE_URL,
          SUPABASE_SERVICE_KEY: env.SUPABASE_SERVICE_KEY || env.SUPABASE_KEY,
        });
      }

      // Referral API routing
      if (path.startsWith('/api/referral')) {
        return handleReferralAPI(request, {
          SUPABASE_URL: env.SUPABASE_URL,
          SUPABASE_SERVICE_KEY: env.SUPABASE_SERVICE_KEY || env.SUPABASE_KEY,
        });
      }

      // Admin API routing
      if (path.startsWith('/api/admin') || (path.startsWith('/api/promo') && (path.includes('/list') || path.includes('/create') || path.includes('/toggle') || request.method === 'DELETE'))) {
        return handleAdminAPI(request, {
          SUPABASE_URL: env.SUPABASE_URL,
          SUPABASE_SERVICE_KEY: env.SUPABASE_SERVICE_KEY || env.SUPABASE_KEY,
        });
      }
      
      // Sandbox monitoring API routing
      if (path.startsWith('/api/sandbox')) {
        const { handleSandboxMonitoring } = await import('./sandbox/monitoring-api');
        return handleSandboxMonitoring(request, env);
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
              const bytes = new Uint8Array(buffer);
              
              // Convert to base64 in chunks to avoid stack overflow
              let base64 = '';
              const chunkSize = 8192;
              for (let i = 0; i < bytes.length; i += chunkSize) {
                const chunk = bytes.slice(i, i + chunkSize);
                base64 += String.fromCharCode(...chunk);
              }
              base64 = btoa(base64);
              
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
          hasGemini: !!env.GEMINI_API_KEY,
          hasAnthropic: !!env.ANTHROPIC_API_KEY,
          hasOpenRouter: !!env.OPENROUTER_API_KEY,
          hasBrowserBase: !!env.BROWSERBASE_API_KEY && !!env.BROWSERBASE_PROJECT_ID,
          hasSupabase: !!env.SUPABASE_URL && !!env.SUPABASE_KEY,
          hasE2B: !!env.E2B_API_KEY,
          hasTavily: !!env.TAVILY_API_KEY,
          hasPexels: !!env.PEXELS_API_KEY,
          openaiKeyPrefix: keyPrefix
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Feedback endpoint for self-improvement with user learning
      if (path === '/feedback' && request.method === 'POST') {
        const body = await request.json();
        const { message_id, feedback_type, input, output, task_id, user_id, model_used, task_type } = body;

        // Calculate score based on feedback type
        const score = feedback_type === 'positive' ? 1.0 : feedback_type === 'negative' ? 0.0 : 0.0;

        // Store feedback in database
        try {
          await supabase.from('agent_evaluations').insert({
            task_id: task_id || null,
            agent_version: 'v1.0.0', // Will be dynamic later
            input_text: input,
            output_text: output,
            score: score,
            feedback_type: feedback_type === 'glitch' ? 'human_glitch' : 'human',
            feedback_text: feedback_type === 'glitch' ? 'User reported a glitch/bug' : null,
            metadata: { message_id, user_id, model_used },
            created_at: new Date().toISOString(),
          });
        } catch (error) {
          console.error('Failed to store feedback (table may not exist yet):', error);
        }

        // Wire feedback to user learning system
        if (user_id) {
          try {
            const { UserLearningService } = await import('./services/user-learning');
            const learningService = new UserLearningService(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY || env.SUPABASE_KEY);
            
            await learningService.learnFromFeedback(
              user_id,
              feedback_type as 'positive' | 'negative' | 'glitch',
              task_type || 'general',
              model_used || 'unknown',
              input || '',
              output || ''
            );
            console.log('[FEEDBACK] User learning updated for user:', user_id);
          } catch (error) {
            console.error('[FEEDBACK] Failed to update user learning:', error);
          }
        }

        return new Response(JSON.stringify({ success: true, message: 'Feedback recorded and learning updated' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // MOE Chat endpoint - Model competition + Gemini agent execution
      if (path === '/moe-chat' && request.method === 'POST') {
        const body = await request.json() as ChatMessage;
        
        // Content safety filter - check input before processing
        const inputFilterResult = contentFilter.filterInput(body.message);
        if (!inputFilterResult.allowed) {
          return new Response(JSON.stringify({
            error: 'content_blocked',
            message: contentFilter.getBlockedResponse(inputFilterResult),
            category: inputFilterResult.category,
            severity: inputFilterResult.severity,
          }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        
        // Check usage limits before processing message
        if (body.user_id && !body.is_tool_synthesis) {
          const subscriptionMiddleware = createSubscriptionMiddleware({
            SUPABASE_URL: env.SUPABASE_URL,
            SUPABASE_SERVICE_KEY: env.SUPABASE_SERVICE_KEY || env.SUPABASE_KEY,
          });
          
          const usageCheck = await subscriptionMiddleware.checkAndUseFeature(body.user_id, 'message');
          
          if (!usageCheck.allowed) {
            return new Response(JSON.stringify({
              error: 'usage_limit_reached',
              message: usageCheck.error,
              upgradeMessage: usageCheck.upgradeMessage,
              currentPlan: usageCheck.plan,
              usage: {
                current: usageCheck.current,
                limit: usageCheck.limit,
                remaining: usageCheck.remaining,
              },
              showUpgradeModal: true,
            }), {
              status: 402, // Payment Required
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }
        }
        
        try {
          // Categorize the query for analytics and smart routing
          const fileTypes = body.files?.map(f => {
            const match = f.match(/^data:([^;]+)/);
            return match ? match[1] : 'unknown';
          }) || [];
          const queryCategory = categorizeQuery(body.message, (body.files?.length || 0) > 0, fileTypes);
          console.log('[MOE-CHAT] Query categorized:', queryCategory.primary, queryCategory.complexity, queryCategory.confidence);
          
          // Analyze if task is complex enough for DPPM orchestration
          const complexityAnalysis = analyzeComplexity(body.message, {
            primary: queryCategory.primary,
            complexity: queryCategory.complexity,
            intent: queryCategory.intent
          });
          console.log('[MOE-CHAT] Complexity analysis:', complexityAnalysis.score, complexityAnalysis.recommendedApproach, complexityAnalysis.reasons);
          
          // Detect if this is a website/app request that should ALWAYS use templates
          const lowerMessage = body.message.toLowerCase();
          const isWebsiteRequest = [
            'website', 'landing page', 'web page', 'web app', 'homepage',
            'portfolio site', 'blog site', 'ecommerce', 'online store'
          ].some(kw => lowerMessage.includes(kw));
          const isAppRequest = [
            'mobile app', 'ios app', 'android app', 'react native', 'expo app'
          ].some(kw => lowerMessage.includes(kw)) && !lowerMessage.includes('web app');
          const forceTemplateMode = (isWebsiteRequest || isAppRequest) && !body.skip_dppm;
          
          if (forceTemplateMode) {
            console.log('[MOE-CHAT] 🎨 Website/App request detected - forcing template mode via DPPM');
          }
          
          // If complex task OR website/app request, route to Fly.dev DPPM service for template-based generation
          if ((complexityAnalysis.isComplex || forceTemplateMode) && !body.skip_dppm) {
            console.log('[MOE-CHAT] 🧠 Complex task detected - routing to Deep Thinking mode on Fly.dev');
            
            try {
              // Call Fly.dev DPPM service (no time limit)
              const dppmResponse = await fetch('https://morgus-deploy.fly.dev/dppm', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  message: body.message,
                  history: body.history || [],
                  user_id: body.user_id,
                  conversation_id: body.conversation_id,
                  config: {
                    openrouter_api_key: env.OPENROUTER_API_KEY,
                    gemini_api_key: env.GEMINI_API_KEY,
                    openai_api_key: env.OPENAI_API_KEY,
                    anthropic_api_key: env.ANTHROPIC_API_KEY,
                    supabase_url: env.SUPABASE_URL,
                    supabase_key: env.SUPABASE_KEY
                  }
                })
              });
              
              if (!dppmResponse.ok) {
                throw new Error(`DPPM service returned ${dppmResponse.status}`);
              }
              
              const dppmResult = await dppmResponse.json() as any;
              
              // Check if DPPM generated deployable artifacts
              let deployedUrl: string | undefined;
              if (dppmResult.requiresDeployment && dppmResult.artifacts?.length > 0) {
                console.log('[DPPM] Deploying generated website...');
                try {
                  // Convert artifacts to deployment format
                  const files = dppmResult.artifacts.map((a: any) => ({
                    name: a.filename,
                    content: a.content
                  }));
                  
                  // Generate project name from message
                  const projectName = body.message
                    .toLowerCase()
                    .replace(/[^a-z0-9]+/g, '-')
                    .substring(0, 30) + '-' + Date.now().toString(36);
                  
                  // Call GitHub Pages deployment service
                  const deployResponse = await fetch('https://morgus-deploy.fly.dev/deploy-github', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      projectName,
                      files: files.map((f: any) => ({ path: f.name, content: f.content })),
                      githubToken: env.GITHUB_TOKEN
                    })
                  });
                  
                  if (deployResponse.ok) {
                    const deployResult = await deployResponse.json() as any;
                    deployedUrl = deployResult.url;
                    console.log('[DPPM] Website deployed to:', deployedUrl);
                  }
                } catch (deployError: any) {
                  console.error('[DPPM] Deployment failed:', deployError.message);
                }
              }
              
              // Build response message
              let responseMessage = dppmResult.output;
              if (deployedUrl) {
                responseMessage = `🚀 **Your website is live!**\n\n**URL:** ${deployedUrl}\n\n---\n\n${dppmResult.output}`;
              }
              
              // Return DPPM orchestrated result
              return new Response(JSON.stringify({
                message: responseMessage,
                dppmOrchestrated: true,
                dppmSummary: dppmResult.dppmSummary,
                subtaskResults: dppmResult.subtaskResults,
                lessonsLearned: dppmResult.lessonsLearned,
                reflection: dppmResult.reflection,
                artifacts: dppmResult.artifacts,
                deployedUrl,
                complexityAnalysis: {
                  score: complexityAnalysis.score,
                  reasons: complexityAnalysis.reasons
                },
                deepThinkingMode: true
              }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              });
            } catch (dppmError: any) {
              console.error('[DPPM] Fly.dev service failed, falling back to direct MOE:', dppmError.message);
              // Fall through to regular MOE flow
            }
          }
          
          // Step 1: Run MOE competition to get best answer (simple tasks or DPPM fallback)
          const moe = new MOEEndpoint(env.OPENROUTER_API_KEY);
          
          // Enhance prompt when files are attached
          let userMessage = body.message;
          let processedFiles = body.files || [];
          console.log('[MOE-CHAT] Files received:', body.files?.length || 0);
          
          if (body.files && body.files.length > 0) {
            const fileCount = body.files.length;
            const fileTypes = body.files.map(f => {
              const match = f.match(/^data:([^;]+)/);
              return match ? match[1] : 'unknown';
            });
            
            console.log('[MOE-CHAT] File types:', fileTypes);
            console.log('[MOE-CHAT] File sizes:', body.files.map(f => f.length));
            
            // Extract text from Word documents for models that don't support them
            const extractedTexts: string[] = [];
            for (let i = 0; i < body.files.length; i++) {
              const file = body.files[i];
              const fileType = fileTypes[i];
              
              if (fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
                console.log('[MOE-CHAT] Extracting text from Word document...');
                try {
                  // Extract base64 data
                  const base64Data = file.split(',')[1];
                  
                  // Call code execution service to extract text
                  const extractResponse = await fetch('https://morgus-deploy.fly.dev/execute', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      language: 'python',
                      code: `import base64, io\nfrom docx import Document\nbase64_data = '''${base64Data}'''\ndoc_bytes = base64.b64decode(base64_data)\ndoc = Document(io.BytesIO(doc_bytes))\ntext = []\nfor para in doc.paragraphs:\n    if para.text.strip():\n        text.append(para.text)\nfor table in doc.tables:\n    for row in table.rows:\n        for cell in row.cells:\n            if cell.text.strip():\n                text.append(cell.text)\nprint('\\n'.join(text))`
                    })
                  });
                  
                  const extractResult = await extractResponse.json();
                  
                  if (extractResult.success && extractResult.stdout) {
                    const extractedText = extractResult.stdout.trim();
                    console.log('[MOE-CHAT] Extracted text length:', extractedText.length);
                    extractedTexts.push(`[Document ${i + 1} content]:\n${extractedText}`);
                  } else {
                    console.error('[MOE-CHAT] Failed to extract text:', extractResult.error);
                    extractedTexts.push(`[Document ${i + 1}: Failed to extract text]`);
                  }
                } catch (error: any) {
                  console.error('[MOE-CHAT] Word extraction error:', error);
                  extractedTexts.push(`[Document ${i + 1}: Error extracting text]`);
                }
              }
            }
            
            // Add file info and extracted text to message
            let fileInfo = `\n\n[${fileCount} file(s) attached: ${fileTypes.join(', ')}]`;
            if (extractedTexts.length > 0) {
              fileInfo += `\n\n${extractedTexts.join('\n\n')}`;
              // Remove Word docs from files array since we extracted text
              processedFiles = body.files.filter((_, i) => fileTypes[i] !== 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
            }
            
            userMessage = `${body.message}${fileInfo}\n\nIMPORTANT: Carefully examine the attached image(s)/document(s). Read ALL visible text exactly as shown. Identify the actual source/website/brand visible in the image. Do NOT guess or make assumptions. Only state what you can clearly see in the image. If you're unsure about something, say so.`;
            console.log('[MOE-CHAT] Enhanced message length:', userMessage.length);
          }
          
          // Build messages array with optional MCP tools system prompt
          let messages: Array<{role: string, content: string}> = [];
          
          // Add MCP tools system prompt if available and not a synthesis request
          if (body.mcp_tools_prompt && !body.is_tool_synthesis) {
            messages.push({
              role: 'system',
              content: `You are Morgus, an intelligent AI assistant. You have access to MCP (Model Context Protocol) tools that extend your capabilities.${body.mcp_tools_prompt}`
            });
            console.log('[MOE-CHAT] Added MCP tools to system prompt');
          }
          
          messages = messages.concat(body.history || []).concat([{
            role: 'user',
            content: userMessage
          }]);
          
          // Run MOE with OpenRouter models + Gemini + GPT-4o-mini + Claude
          const moeResult = await moe.chatWithMultipleAPIs({ 
            messages, 
            geminiApiKey: env.GEMINI_API_KEY,
            openaiApiKey: env.OPENAI_API_KEY,
            anthropicApiKey: env.ANTHROPIC_API_KEY,
            files: processedFiles // Pass processed files (Word docs removed, text extracted)
          });
          
          // Record competition stats in background (don't await)
          console.log('[MOE-CHAT] Starting stats recording...');
          try {
            const { ModelStatsService } = await import('./services/model-stats');
            const statsService = new ModelStatsService(env.SUPABASE_URL, env.SUPABASE_KEY);
            console.log('[MOE-CHAT] ModelStatsService initialized');
            
            // Extract file types if present
            const fileTypes = body.files?.map(f => {
              const match = f.match(/^data:([^;]+)/);
              return match ? match[1] : 'unknown';
            }) || [];
            
            // Prepare competition results with category data
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
              // Enhanced tracking with query categorization
              query_category: queryCategory.primary,
              query_subcategory: queryCategory.secondary,
              query_complexity: queryCategory.complexity,
              query_intent: queryCategory.intent,
              query_domain: queryCategory.domain,
              requires_reasoning: queryCategory.requiresReasoning,
              requires_creativity: queryCategory.requiresCreativity,
              requires_accuracy: queryCategory.requiresFactualAccuracy,
              estimated_tokens: queryCategory.estimatedTokens,
              category_confidence: queryCategory.confidence,
            }));
            
            // Record asynchronously (don't block response)
            console.log('[MOE-CHAT] Recording competition with', competitionResults.length, 'results');
            statsService.recordCompetition(competitionResults).then(() => {
              console.log('[MOE-CHAT] Stats recorded successfully!');
            }).catch(err => {
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
          
          // Add conversation ID to env for browser session reuse
          env.CONVERSATION_ID = body.conversation_id || body.thought_id || 'default';
          
          // Create action-oriented prompt that executes tasks
          const enhancedPrompt = `User query: ${body.message}

MOE expert analysis: ${moeResult.content}

Your task: EXECUTE what the user asked for, don't just explain it.

- If user asks to BUILD/CREATE a website/app: Use execute_code to actually generate files and deploy it
- If user asks for images/pictures: Use search_images to find and show them
- If user asks for charts/graphs: Use create_chart to generate them
- If user asks for calculations/code: Use execute_code to run it
- If user asks to search/find information: Use search_web to get current data

DO NOT just provide code snippets or instructions. ACTUALLY DO THE TASK using the available tools.
The MOE analysis above is just a plan - now you must execute it.`;
          
          console.log('[MOE-CHAT] User message:', body.message);
          console.log('[MOE-CHAT] Has PEXELS_API_KEY:', !!env.PEXELS_API_KEY);
          
          // Collect all streamed messages from agent execution
          let finalResponse = '';
          let toolExecutionLog = '';
          const conversationHistory = body.history || [];
          
          for await (const message of agent.executeTask(enhancedPrompt, env, conversationHistory)) {
            console.log('[MOE-CHAT] Agent message:', message.type, message.content?.substring(0, 100));
            
            // Capture tool execution details for debugging
            if (message.type === 'tool_call') {
              toolExecutionLog += `\n\n🔧 ${message.content}`;
            } else if (message.type === 'tool_result') {
              // Include FULL tool result, not truncated
              const fullResult = message.metadata?.result || message.content;
              toolExecutionLog += `\n\n📋 Tool Output:\n${fullResult}`;
            } else if (message.type === 'response') {
              finalResponse = message.content;
            }
          }
          
          const responseContent = finalResponse || moeResult.content;
          
          // Save messages to database - use conversation_id if provided, otherwise thought_id
          const conversationId = body.conversation_id || body.thought_id;
          if (conversationId) {
            try {
              // Determine if this is a conversation or thought
              const isConversation = !!body.conversation_id;
              const messageTable = isConversation ? 'conversation_messages' : 'thought_messages';
              const idField = isConversation ? 'conversation_id' : 'thought_id';
              const parentTable = isConversation ? 'conversations' : 'thoughts';
              
              // Save user message
              await supabase.from(messageTable).insert({
                [idField]: conversationId,
                role: 'user',
                content: body.message,
                created_at: new Date().toISOString(),
              });
              
              // Save assistant response with MOE metadata
              await supabase.from(messageTable).insert({
                [idField]: conversationId,
                role: 'assistant',
                content: responseContent,
                metadata: moeResult.moeMetadata ? { moeMetadata: moeResult.moeMetadata } : null,
                created_at: new Date().toISOString(),
              });
              
              // Auto-generate title if this is the first exchange
              const { count } = await supabase
                .from(messageTable)
                .select('*', { count: 'exact', head: true })
                .eq(idField, conversationId);
              
              if (count === 2) {
                // First user message + first assistant response = generate title
                try {
                  const titlePrompt = `Generate a short, descriptive title (3-5 words max) for a conversation that starts with: "${body.message.substring(0, 100)}..."`;
                  const titleResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      'Authorization': `Bearer ${env.OPENROUTER_API_KEY}`,
                    },
                    body: JSON.stringify({
                      model: 'mistralai/mistral-7b-instruct:free',
                      messages: [{ role: 'user', content: titlePrompt }],
                      max_tokens: 20,
                    }),
                  });
                  
                  if (titleResponse.ok) {
                    const titleData = await titleResponse.json();
                    const title = titleData.choices[0]?.message?.content?.trim().replace(/["|']/g, '') || 'New Chat';
                    
                    await supabase
                      .from(parentTable)
                      .update({ 
                        title,
                        updated_at: new Date().toISOString() 
                      })
                      .eq('id', conversationId);
                    
                    console.log('[MOE-CHAT] Generated title:', title);
                  }
                } catch (error) {
                  console.error('[MOE-CHAT] Failed to generate title:', error);
                }
              }
            } catch (error) {
              console.error('[MOE-CHAT] Failed to save messages:', error);
            }
          }
          
          // Extract browser Live View URL if present in tool execution log
          const liveViewMatch = toolExecutionLog.match(/https:\/\/www\.browserbase\.com\/devtools-fullscreen\/[^\s)]+/);
          const browserViewSection = liveViewMatch ? 
            `🌐 **Live Browser View:**\n\n[Click here to watch and control the browser](${liveViewMatch[0]})\n\n---\n\n` : '';
          
          // Append tool execution log to response if there were tool calls (collapsible)
          const debugSection = toolExecutionLog ? 
            `\n\n<details>\n<summary>🔧 Debug Info (click to expand)</summary>\n${toolExecutionLog}\n</details>` : '';
          
          const fullResponse = browserViewSection + responseContent + debugSection;
          
          return new Response(JSON.stringify({
            message: fullResponse,
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
        
        // Content safety filter - check input before processing
        const inputFilterResult = contentFilter.filterInput(body.message);
        if (!inputFilterResult.allowed) {
          return new Response(JSON.stringify({
            error: 'content_blocked',
            message: contentFilter.getBlockedResponse(inputFilterResult),
            category: inputFilterResult.category,
            severity: inputFilterResult.severity,
          }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        
        // Check usage limits before processing message
        if (body.user_id) {
          const subscriptionMiddleware = createSubscriptionMiddleware({
            SUPABASE_URL: env.SUPABASE_URL,
            SUPABASE_SERVICE_KEY: env.SUPABASE_SERVICE_KEY || env.SUPABASE_KEY,
          });
          
          const usageCheck = await subscriptionMiddleware.checkAndUseFeature(body.user_id, 'message');
          
          if (!usageCheck.allowed) {
            return new Response(JSON.stringify({
              error: 'usage_limit_reached',
              message: usageCheck.error,
              upgradeMessage: usageCheck.upgradeMessage,
              currentPlan: usageCheck.plan,
              usage: {
                current: usageCheck.current,
                limit: usageCheck.limit,
                remaining: usageCheck.remaining,
              },
              showUpgradeModal: true,
            }), {
              status: 402, // Payment Required
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }
        }
        
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
                  
                  // Auto-generate title if this is the first exchange
                  const { data: messageCount } = await supabase
                    .from('thought_messages')
                    .select('id', { count: 'exact', head: true })
                    .eq('thought_id', body.thought_id);
                  
                  if (messageCount && (messageCount as any).count === 2) {
                    // First user message + first assistant response = generate title
                    try {
                      const titlePrompt = `Generate a short, descriptive title (3-5 words max) for a conversation that starts with: "${body.message.substring(0, 100)}..."`;
                      const titleResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                          'Authorization': `Bearer ${env.OPENROUTER_API_KEY}`,
                        },
                        body: JSON.stringify({
                          model: 'mistralai/mistral-7b-instruct:free',
                          messages: [{ role: 'user', content: titlePrompt }],
                          max_tokens: 20,
                        }),
                      });
                      
                      if (titleResponse.ok) {
                        const titleData = await titleResponse.json();
                        const title = titleData.choices[0]?.message?.content?.trim().replace(/["|']/g, '') || 'New Chat';
                        
                        await supabase
                          .from('thoughts')
                          .update({ 
                            title,
                            updated_at: new Date().toISOString() 
                          })
                          .eq('id', body.thought_id);
                        
                        console.log('Generated title:', title);
                      }
                    } catch (error) {
                      console.error('Failed to generate title:', error);
                    }
                  }
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

      // Root path - Landing page
      if (path === '/' && request.method === 'GET') {
        const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Morgus - Autonomous AI Agent</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
    }
    .container {
      max-width: 800px;
      padding: 2rem;
      text-align: center;
    }
    h1 {
      font-size: 3rem;
      margin-bottom: 1rem;
      text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
    }
    .tagline {
      font-size: 1.5rem;
      margin-bottom: 2rem;
      opacity: 0.9;
    }
    .features {
      background: rgba(255,255,255,0.1);
      backdrop-filter: blur(10px);
      border-radius: 20px;
      padding: 2rem;
      margin: 2rem 0;
      text-align: left;
    }
    .feature {
      margin: 1rem 0;
      padding: 0.5rem 0;
    }
    .feature strong {
      color: #ffd700;
    }
    .endpoints {
      background: rgba(0,0,0,0.2);
      border-radius: 10px;
      padding: 1.5rem;
      margin: 2rem 0;
      text-align: left;
      font-family: 'Courier New', monospace;
      font-size: 0.9rem;
    }
    .endpoint {
      margin: 0.5rem 0;
      padding: 0.5rem;
      background: rgba(255,255,255,0.05);
      border-radius: 5px;
    }
    .status {
      display: inline-block;
      width: 10px;
      height: 10px;
      background: #00ff00;
      border-radius: 50%;
      margin-right: 0.5rem;
      animation: pulse 2s infinite;
    }
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }
    a {
      color: #ffd700;
      text-decoration: none;
    }
    a:hover {
      text-decoration: underline;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>🤖 Morgus</h1>
    <p class="tagline">Autonomous AI Agent with MOE System</p>
    
    <div class="features">
      <h2>✨ Capabilities</h2>
      <div class="feature"><strong>🌐 Website Generation:</strong> Build & deploy modern websites with AI-generated logos</div>
      <div class="feature"><strong>💻 Code Execution:</strong> Run Python, JavaScript, and Bash scripts</div>
      <div class="feature"><strong>🔧 GitHub Integration:</strong> Clone repos, create PRs, manage code</div>
      <div class="feature"><strong>🌍 Browser Automation:</strong> Navigate websites, fill forms, extract data</div>
      <div class="feature"><strong>📦 Full-Stack Apps:</strong> Build database-backed apps with Supabase</div>
      <div class="feature"><strong>🎯 MOE System:</strong> 6 AI models compete for best responses</div>
    </div>

    <div class="endpoints">
      <h3><span class="status"></span>API Endpoints</h3>
      <div class="endpoint"><strong>GET</strong> /health - Health check</div>
      <div class="endpoint"><strong>POST</strong> /chat - Chat with Morgus</div>
      <div class="endpoint"><strong>POST</strong> /moe-chat - MOE system chat</div>
      <div class="endpoint"><strong>GET</strong> /moe - MOE system status</div>
      <div class="endpoint"><strong>POST</strong> /upload - File upload</div>
    </div>

    <p style="margin-top: 2rem; opacity: 0.8;">
      <a href="/health">Check Health</a> | 
      <a href="/moe">MOE Status</a> | 
      <a href="https://github.com" target="_blank">Documentation</a>
    </p>
    
    <p style="margin-top: 1rem; font-size: 0.9rem; opacity: 0.7;">
      Version 2.0 | All Features Complete
    </p>
  </div>
</body>
</html>`;
        return new Response(html, {
          headers: { ...corsHeaders, 'Content-Type': 'text/html' },
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
