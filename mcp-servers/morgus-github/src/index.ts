/**
 * @morgus/mcp-github
 * 
 * MCP Server for GitHub integration
 * Provides tools for interacting with GitHub repos, issues, PRs, and more
 */

interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_KEY: string;
}

// CORS headers for cross-origin requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-User-ID, X-GitHub-Token',
};

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    const url = new URL(request.url);
    const path = url.pathname;

    // Get GitHub token from header (user provides their own token)
    const githubToken = request.headers.get('X-GitHub-Token');

    // Health check
    if (path === '/health') {
      return new Response(JSON.stringify({ 
        status: 'healthy', 
        server: '@morgus/mcp-github',
        version: '1.0.0'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // List available tools
    if (path === '/tools' && request.method === 'GET') {
      return new Response(JSON.stringify({
        tools: [
          {
            name: 'search_repos',
            description: 'Search GitHub repositories by query',
            inputSchema: {
              type: 'object',
              properties: {
                query: {
                  type: 'string',
                  description: 'Search query (e.g., "react stars:>1000")'
                },
                sort: {
                  type: 'string',
                  enum: ['stars', 'forks', 'updated', 'help-wanted-issues'],
                  description: 'Sort order'
                },
                per_page: {
                  type: 'number',
                  description: 'Results per page (max 30)',
                  default: 10
                }
              },
              required: ['query']
            }
          },
          {
            name: 'get_repo',
            description: 'Get detailed information about a repository',
            inputSchema: {
              type: 'object',
              properties: {
                owner: {
                  type: 'string',
                  description: 'Repository owner (username or org)'
                },
                repo: {
                  type: 'string',
                  description: 'Repository name'
                }
              },
              required: ['owner', 'repo']
            }
          },
          {
            name: 'list_issues',
            description: 'List issues for a repository',
            inputSchema: {
              type: 'object',
              properties: {
                owner: {
                  type: 'string',
                  description: 'Repository owner'
                },
                repo: {
                  type: 'string',
                  description: 'Repository name'
                },
                state: {
                  type: 'string',
                  enum: ['open', 'closed', 'all'],
                  default: 'open'
                },
                labels: {
                  type: 'string',
                  description: 'Comma-separated list of labels'
                },
                per_page: {
                  type: 'number',
                  default: 10
                }
              },
              required: ['owner', 'repo']
            }
          },
          {
            name: 'create_issue',
            description: 'Create a new issue (requires GitHub token)',
            inputSchema: {
              type: 'object',
              properties: {
                owner: {
                  type: 'string',
                  description: 'Repository owner'
                },
                repo: {
                  type: 'string',
                  description: 'Repository name'
                },
                title: {
                  type: 'string',
                  description: 'Issue title'
                },
                body: {
                  type: 'string',
                  description: 'Issue body (markdown supported)'
                },
                labels: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Labels to add'
                }
              },
              required: ['owner', 'repo', 'title']
            }
          },
          {
            name: 'get_file_contents',
            description: 'Get the contents of a file from a repository',
            inputSchema: {
              type: 'object',
              properties: {
                owner: {
                  type: 'string',
                  description: 'Repository owner'
                },
                repo: {
                  type: 'string',
                  description: 'Repository name'
                },
                path: {
                  type: 'string',
                  description: 'Path to the file'
                },
                ref: {
                  type: 'string',
                  description: 'Branch, tag, or commit SHA (default: main)'
                }
              },
              required: ['owner', 'repo', 'path']
            }
          },
          {
            name: 'list_pull_requests',
            description: 'List pull requests for a repository',
            inputSchema: {
              type: 'object',
              properties: {
                owner: {
                  type: 'string',
                  description: 'Repository owner'
                },
                repo: {
                  type: 'string',
                  description: 'Repository name'
                },
                state: {
                  type: 'string',
                  enum: ['open', 'closed', 'all'],
                  default: 'open'
                },
                per_page: {
                  type: 'number',
                  default: 10
                }
              },
              required: ['owner', 'repo']
            }
          }
        ]
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Search repositories
    if (path === '/tools/search_repos' && request.method === 'POST') {
      try {
        const body = await request.json() as { arguments: { query: string; sort?: string; per_page?: number } };
        const { query, sort, per_page = 10 } = body.arguments;

        const params = new URLSearchParams({
          q: query,
          per_page: Math.min(per_page, 30).toString()
        });
        if (sort) params.set('sort', sort);

        const response = await githubAPI(`/search/repositories?${params}`, githubToken);
        
        return new Response(JSON.stringify({
          content: {
            total_count: response.total_count,
            items: response.items.slice(0, per_page).map((repo: any) => ({
              full_name: repo.full_name,
              description: repo.description,
              stars: repo.stargazers_count,
              forks: repo.forks_count,
              language: repo.language,
              url: repo.html_url,
              updated_at: repo.updated_at
            }))
          }
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

      } catch (error) {
        return errorResponse(error);
      }
    }

    // Get repository details
    if (path === '/tools/get_repo' && request.method === 'POST') {
      try {
        const body = await request.json() as { arguments: { owner: string; repo: string } };
        const { owner, repo } = body.arguments;

        const response = await githubAPI(`/repos/${owner}/${repo}`, githubToken);
        
        return new Response(JSON.stringify({
          content: {
            full_name: response.full_name,
            description: response.description,
            stars: response.stargazers_count,
            forks: response.forks_count,
            watchers: response.watchers_count,
            language: response.language,
            topics: response.topics,
            license: response.license?.name,
            default_branch: response.default_branch,
            open_issues: response.open_issues_count,
            created_at: response.created_at,
            updated_at: response.updated_at,
            url: response.html_url
          }
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

      } catch (error) {
        return errorResponse(error);
      }
    }

    // List issues
    if (path === '/tools/list_issues' && request.method === 'POST') {
      try {
        const body = await request.json() as { arguments: { owner: string; repo: string; state?: string; labels?: string; per_page?: number } };
        const { owner, repo, state = 'open', labels, per_page = 10 } = body.arguments;

        const params = new URLSearchParams({
          state,
          per_page: Math.min(per_page, 30).toString()
        });
        if (labels) params.set('labels', labels);

        const response = await githubAPI(`/repos/${owner}/${repo}/issues?${params}`, githubToken);
        
        return new Response(JSON.stringify({
          content: {
            issues: response.map((issue: any) => ({
              number: issue.number,
              title: issue.title,
              state: issue.state,
              author: issue.user?.login,
              labels: issue.labels?.map((l: any) => l.name),
              comments: issue.comments,
              created_at: issue.created_at,
              url: issue.html_url
            }))
          }
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

      } catch (error) {
        return errorResponse(error);
      }
    }

    // Create issue
    if (path === '/tools/create_issue' && request.method === 'POST') {
      if (!githubToken) {
        return new Response(JSON.stringify({ 
          error: 'GitHub token required for creating issues. Please configure your GitHub token in MCP server settings.' 
        }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      try {
        const body = await request.json() as { arguments: { owner: string; repo: string; title: string; body?: string; labels?: string[] } };
        const { owner, repo, title, body: issueBody, labels } = body.arguments;

        const response = await githubAPI(`/repos/${owner}/${repo}/issues`, githubToken, 'POST', {
          title,
          body: issueBody,
          labels
        });
        
        return new Response(JSON.stringify({
          content: {
            number: response.number,
            title: response.title,
            url: response.html_url,
            created: true
          }
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

      } catch (error) {
        return errorResponse(error);
      }
    }

    // Get file contents
    if (path === '/tools/get_file_contents' && request.method === 'POST') {
      try {
        const body = await request.json() as { arguments: { owner: string; repo: string; path: string; ref?: string } };
        const { owner, repo, path: filePath, ref } = body.arguments;

        const params = ref ? `?ref=${ref}` : '';
        const response = await githubAPI(`/repos/${owner}/${repo}/contents/${filePath}${params}`, githubToken);
        
        // Decode base64 content
        let content = '';
        if (response.content) {
          content = atob(response.content.replace(/\n/g, ''));
        }

        return new Response(JSON.stringify({
          content: {
            name: response.name,
            path: response.path,
            size: response.size,
            content: content.substring(0, 50000), // Limit content size
            sha: response.sha,
            url: response.html_url
          }
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

      } catch (error) {
        return errorResponse(error);
      }
    }

    // List pull requests
    if (path === '/tools/list_pull_requests' && request.method === 'POST') {
      try {
        const body = await request.json() as { arguments: { owner: string; repo: string; state?: string; per_page?: number } };
        const { owner, repo, state = 'open', per_page = 10 } = body.arguments;

        const params = new URLSearchParams({
          state,
          per_page: Math.min(per_page, 30).toString()
        });

        const response = await githubAPI(`/repos/${owner}/${repo}/pulls?${params}`, githubToken);
        
        return new Response(JSON.stringify({
          content: {
            pull_requests: response.map((pr: any) => ({
              number: pr.number,
              title: pr.title,
              state: pr.state,
              author: pr.user?.login,
              head: pr.head?.ref,
              base: pr.base?.ref,
              created_at: pr.created_at,
              url: pr.html_url
            }))
          }
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

      } catch (error) {
        return errorResponse(error);
      }
    }

    // 404 for unknown routes
    return new Response(JSON.stringify({ error: 'Not found' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
};

// GitHub API helper
async function githubAPI(endpoint: string, token?: string | null, method = 'GET', body?: unknown): Promise<any> {
  const headers: Record<string, string> = {
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': 'Morgus-MCP-GitHub/1.0'
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const options: RequestInit = {
    method,
    headers
  };

  if (body) {
    options.body = JSON.stringify(body);
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(`https://api.github.com${endpoint}`, options);

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`GitHub API error: ${response.status} - ${errorText}`);
  }

  return response.json();
}

// Error response helper
function errorResponse(error: unknown): Response {
  console.error('GitHub MCP error:', error);
  return new Response(JSON.stringify({ 
    error: 'Request failed',
    details: error instanceof Error ? error.message : 'Unknown error'
  }), {
    status: 500,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}
