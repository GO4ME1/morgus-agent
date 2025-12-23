/**
 * Sandbox Monitoring API
 * 
 * Provides endpoints for monitoring sandbox health, metrics, and logs
 */

import { sandboxHardening } from './hardening';

export async function handleSandboxMonitoring(request: Request, env: any): Promise<Response> {
  const url = new URL(request.url);
  const path = url.pathname;
  
  // Authentication check (admin only)
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !await verifyAdminAuth(authHeader, env)) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  
  try {
    // GET /api/sandbox/metrics - System-wide metrics
    if (path === '/api/sandbox/metrics' && request.method === 'GET') {
      const metrics = sandboxHardening.getSystemMetrics();
      return new Response(JSON.stringify(metrics), {
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    // GET /api/sandbox/metrics/:userId - User-specific metrics
    if (path.startsWith('/api/sandbox/metrics/') && request.method === 'GET') {
      const userId = path.split('/').pop();
      if (!userId) {
        return new Response(JSON.stringify({ error: 'User ID required' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      
      const metrics = sandboxHardening.getUserMetrics(userId);
      return new Response(JSON.stringify(metrics), {
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    // GET /api/sandbox/logs/:executionId - Execution logs
    if (path.startsWith('/api/sandbox/logs/') && request.method === 'GET') {
      const executionId = path.split('/').pop();
      if (!executionId) {
        return new Response(JSON.stringify({ error: 'Execution ID required' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      
      const logs = sandboxHardening.getLogs(executionId);
      return new Response(JSON.stringify(logs), {
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    // GET /api/sandbox/logs/user/:userId - User logs
    if (path.startsWith('/api/sandbox/logs/user/') && request.method === 'GET') {
      const userId = path.split('/').pop();
      if (!userId) {
        return new Response(JSON.stringify({ error: 'User ID required' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      
      const logs = sandboxHardening.getUserLogs(userId);
      return new Response(JSON.stringify(logs), {
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    // POST /api/sandbox/kill/:executionId - Kill execution
    if (path.startsWith('/api/sandbox/kill/') && request.method === 'POST') {
      const executionId = path.split('/').pop();
      if (!executionId) {
        return new Response(JSON.stringify({ error: 'Execution ID required' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      
      await sandboxHardening.killExecution(executionId, 'user_request');
      return new Response(JSON.stringify({ success: true }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    return new Response(JSON.stringify({ error: 'Not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
    
  } catch (error: any) {
    console.error('[Sandbox Monitoring] Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

/**
 * Verify admin authentication
 */
async function verifyAdminAuth(authHeader: string, env: any): Promise<boolean> {
  // Extract token from "Bearer <token>"
  const token = authHeader.replace('Bearer ', '');
  
  // Check against admin token in environment
  if (env.ADMIN_API_TOKEN && token === env.ADMIN_API_TOKEN) {
    return true;
  }
  
  // Or verify against Supabase (check if user is admin)
  try {
    const response = await fetch(`${env.SUPABASE_URL}/rest/v1/profiles?select=is_admin`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'apikey': env.SUPABASE_ANON_KEY,
      },
    });
    
    if (response.ok) {
      const data = await response.json();
      return data.length > 0 && data[0].is_admin === true;
    }
  } catch (error) {
    console.error('[Auth] Failed to verify admin:', error);
  }
  
  return false;
}
