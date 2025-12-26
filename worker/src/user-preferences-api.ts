/**
 * User Preferences API
 * 
 * Endpoints for managing user preferences and learning data
 */

import { UserLearningService, UserPreferences, USER_LEARNING_MIGRATION } from './services/user-learning';

interface Env {
  SUPABASE_URL: string;
  SUPABASE_KEY: string;
  SUPABASE_SERVICE_KEY?: string;
}

export async function handleUserPreferencesAPI(
  request: Request,
  env: Env,
  corsHeaders: Record<string, string>
): Promise<Response | null> {
  const url = new URL(request.url);
  const path = url.pathname;
  
  const learningService = new UserLearningService(
    env.SUPABASE_URL,
    env.SUPABASE_SERVICE_KEY || env.SUPABASE_KEY
  );

  // Get user preferences
  if (path === '/api/user/preferences' && request.method === 'GET') {
    const userId = url.searchParams.get('user_id');
    
    if (!userId) {
      return new Response(JSON.stringify({ error: 'user_id is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    try {
      const preferences = await learningService.getPreferences(userId);
      return new Response(JSON.stringify(preferences), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch (error: any) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  }

  // Update user preferences
  if (path === '/api/user/preferences' && request.method === 'POST') {
    try {
      const body = await request.json() as { user_id: string; preferences: Partial<UserPreferences> };
      
      if (!body.user_id) {
        return new Response(JSON.stringify({ error: 'user_id is required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      await learningService.updatePreferences(body.user_id, body.preferences);
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch (error: any) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  }

  // Get user patterns
  if (path === '/api/user/patterns' && request.method === 'GET') {
    const userId = url.searchParams.get('user_id');
    const minConfidence = parseFloat(url.searchParams.get('min_confidence') || '0.5');
    
    if (!userId) {
      return new Response(JSON.stringify({ error: 'user_id is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    try {
      const patterns = await learningService.getPatterns(userId, minConfidence);
      return new Response(JSON.stringify(patterns), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch (error: any) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  }

  // Get lessons for a task type
  if (path === '/api/user/lessons' && request.method === 'GET') {
    const userId = url.searchParams.get('user_id');
    const taskType = url.searchParams.get('task_type') || 'general';
    
    if (!userId) {
      return new Response(JSON.stringify({ error: 'user_id is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    try {
      const lessons = await learningService.getLessonsForTask(userId, taskType);
      return new Response(JSON.stringify(lessons), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch (error: any) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  }

  // Get personalization context for prompts
  if (path === '/api/user/personalization' && request.method === 'GET') {
    const userId = url.searchParams.get('user_id');
    const taskType = url.searchParams.get('task_type');
    
    if (!userId) {
      return new Response(JSON.stringify({ error: 'user_id is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    try {
      const context = await learningService.buildPersonalizationContext(userId, taskType || undefined);
      return new Response(JSON.stringify({ personalization_context: context }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch (error: any) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  }

  // Get migration SQL (for admin setup)
  if (path === '/api/user/migration' && request.method === 'GET') {
    return new Response(JSON.stringify({ 
      migration_sql: USER_LEARNING_MIGRATION,
      instructions: 'Run this SQL in your Supabase SQL Editor to create the user learning tables.'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  return null; // Not handled
}
