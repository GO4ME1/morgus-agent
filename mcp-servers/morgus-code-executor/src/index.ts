/**
 * @morgus/mcp-code-executor
 * 
 * MCP Server for executing code in a sandboxed environment
 * Supports Python and JavaScript execution via E2B or fallback services
 */

interface Env {
  E2B_API_KEY?: string;
  SUPABASE_URL: string;
  SUPABASE_SERVICE_KEY: string;
}

interface ExecutionResult {
  success: boolean;
  stdout: string;
  stderr: string;
  error?: string;
  execution_time_ms: number;
}

// CORS headers for cross-origin requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-User-ID',
};

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    const url = new URL(request.url);
    const path = url.pathname;

    // Health check
    if (path === '/health') {
      return new Response(JSON.stringify({ 
        status: 'healthy', 
        server: '@morgus/mcp-code-executor',
        version: '1.0.0',
        has_e2b: !!env.E2B_API_KEY
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // List available tools
    if (path === '/tools' && request.method === 'GET') {
      return new Response(JSON.stringify({
        tools: [
          {
            name: 'execute_python',
            description: 'Execute Python code in a sandboxed environment. Supports common libraries like numpy, pandas, requests, etc.',
            inputSchema: {
              type: 'object',
              properties: {
                code: {
                  type: 'string',
                  description: 'The Python code to execute'
                },
                timeout: {
                  type: 'number',
                  description: 'Timeout in seconds (default: 30, max: 60)',
                  default: 30
                }
              },
              required: ['code']
            }
          },
          {
            name: 'execute_javascript',
            description: 'Execute JavaScript code in a sandboxed Node.js environment',
            inputSchema: {
              type: 'object',
              properties: {
                code: {
                  type: 'string',
                  description: 'The JavaScript code to execute'
                },
                timeout: {
                  type: 'number',
                  description: 'Timeout in seconds (default: 30, max: 60)',
                  default: 30
                }
              },
              required: ['code']
            }
          },
          {
            name: 'execute_shell',
            description: 'Execute shell commands in a sandboxed Linux environment',
            inputSchema: {
              type: 'object',
              properties: {
                command: {
                  type: 'string',
                  description: 'The shell command to execute'
                },
                timeout: {
                  type: 'number',
                  description: 'Timeout in seconds (default: 30, max: 60)',
                  default: 30
                }
              },
              required: ['command']
            }
          }
        ]
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Execute Python code
    if (path === '/tools/execute_python' && request.method === 'POST') {
      try {
        const body = await request.json() as { arguments: { code: string; timeout?: number } };
        const { code, timeout = 30 } = body.arguments;

        if (!code) {
          return new Response(JSON.stringify({ error: 'Code is required' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        const result = await executeCode(env, 'python', code, Math.min(timeout, 60));

        return new Response(JSON.stringify({
          content: result
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

      } catch (error) {
        console.error('execute_python error:', error);
        return new Response(JSON.stringify({ 
          error: 'Execution failed',
          details: error instanceof Error ? error.message : 'Unknown error'
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    // Execute JavaScript code
    if (path === '/tools/execute_javascript' && request.method === 'POST') {
      try {
        const body = await request.json() as { arguments: { code: string; timeout?: number } };
        const { code, timeout = 30 } = body.arguments;

        if (!code) {
          return new Response(JSON.stringify({ error: 'Code is required' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        const result = await executeCode(env, 'javascript', code, Math.min(timeout, 60));

        return new Response(JSON.stringify({
          content: result
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

      } catch (error) {
        console.error('execute_javascript error:', error);
        return new Response(JSON.stringify({ 
          error: 'Execution failed',
          details: error instanceof Error ? error.message : 'Unknown error'
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    // Execute shell command
    if (path === '/tools/execute_shell' && request.method === 'POST') {
      try {
        const body = await request.json() as { arguments: { command: string; timeout?: number } };
        const { command, timeout = 30 } = body.arguments;

        if (!command) {
          return new Response(JSON.stringify({ error: 'Command is required' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        const result = await executeCode(env, 'shell', command, Math.min(timeout, 60));

        return new Response(JSON.stringify({
          content: result
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

      } catch (error) {
        console.error('execute_shell error:', error);
        return new Response(JSON.stringify({ 
          error: 'Execution failed',
          details: error instanceof Error ? error.message : 'Unknown error'
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    // 404 for unknown routes
    return new Response(JSON.stringify({ error: 'Not found' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
};

// Execute code using available execution service
async function executeCode(env: Env, language: string, code: string, timeout: number): Promise<ExecutionResult> {
  const startTime = Date.now();

  // Try E2B if API key is available
  if (env.E2B_API_KEY) {
    try {
      return await executeWithE2B(env.E2B_API_KEY, language, code, timeout);
    } catch (error) {
      console.error('E2B execution failed, falling back:', error);
    }
  }

  // Fallback to Morgus deploy service
  try {
    return await executeWithMorgusDeploy(language, code, timeout);
  } catch (error) {
    console.error('Morgus deploy execution failed:', error);
    return {
      success: false,
      stdout: '',
      stderr: '',
      error: error instanceof Error ? error.message : 'Execution failed',
      execution_time_ms: Date.now() - startTime
    };
  }
}

// Execute using E2B sandboxed environment
async function executeWithE2B(apiKey: string, language: string, code: string, timeout: number): Promise<ExecutionResult> {
  const startTime = Date.now();

  // Map language to E2B template
  const templateMap: Record<string, string> = {
    'python': 'Python3',
    'javascript': 'Node',
    'shell': 'Bash'
  };

  const template = templateMap[language] || 'Python3';

  const response = await fetch('https://api.e2b.dev/v1/sandboxes', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      template,
      timeout: timeout * 1000
    })
  });

  if (!response.ok) {
    throw new Error(`E2B sandbox creation failed: ${response.status}`);
  }

  const sandbox = await response.json() as { sandboxId: string };

  // Execute code in sandbox
  const execResponse = await fetch(`https://api.e2b.dev/v1/sandboxes/${sandbox.sandboxId}/code`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      code,
      language
    })
  });

  const result = await execResponse.json() as { stdout: string; stderr: string; error?: string };

  // Clean up sandbox
  await fetch(`https://api.e2b.dev/v1/sandboxes/${sandbox.sandboxId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${apiKey}`
    }
  });

  return {
    success: !result.error,
    stdout: result.stdout || '',
    stderr: result.stderr || '',
    error: result.error,
    execution_time_ms: Date.now() - startTime
  };
}

// Execute using Morgus deploy service (fallback)
async function executeWithMorgusDeploy(language: string, code: string, timeout: number): Promise<ExecutionResult> {
  const startTime = Date.now();

  const response = await fetch('https://morgus-deploy.fly.dev/execute', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      language,
      code,
      timeout
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Execution service error: ${response.status} - ${errorText}`);
  }

  const result = await response.json() as { success: boolean; stdout: string; stderr: string; error?: string };

  return {
    success: result.success,
    stdout: result.stdout || '',
    stderr: result.stderr || '',
    error: result.error,
    execution_time_ms: Date.now() - startTime
  };
}
