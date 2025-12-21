/**
 * @morgus/mcp-github
 * 
 * MCP Server for GitHub integration
 * Provides tools for interacting with GitHub repos, issues, PRs, and more
 * Includes write capabilities: create/update files, branches, PRs, issues
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
        version: '2.0.0'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // List available tools
    if (path === '/tools' && request.method === 'GET') {
      return new Response(JSON.stringify({
        tools: [
          // READ OPERATIONS
          {
            name: 'search_repos',
            description: 'Search GitHub repositories by query',
            inputSchema: {
              type: 'object',
              properties: {
                query: { type: 'string', description: 'Search query (e.g., "react stars:>1000")' },
                sort: { type: 'string', enum: ['stars', 'forks', 'updated', 'help-wanted-issues'] },
                per_page: { type: 'number', description: 'Results per page (max 30)', default: 10 }
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
                owner: { type: 'string', description: 'Repository owner' },
                repo: { type: 'string', description: 'Repository name' }
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
                owner: { type: 'string' },
                repo: { type: 'string' },
                state: { type: 'string', enum: ['open', 'closed', 'all'], default: 'open' },
                labels: { type: 'string', description: 'Comma-separated labels' },
                per_page: { type: 'number', default: 10 }
              },
              required: ['owner', 'repo']
            }
          },
          {
            name: 'get_file_contents',
            description: 'Get the contents of a file from a repository',
            inputSchema: {
              type: 'object',
              properties: {
                owner: { type: 'string' },
                repo: { type: 'string' },
                path: { type: 'string', description: 'Path to the file' },
                ref: { type: 'string', description: 'Branch, tag, or commit SHA' }
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
                owner: { type: 'string' },
                repo: { type: 'string' },
                state: { type: 'string', enum: ['open', 'closed', 'all'], default: 'open' },
                per_page: { type: 'number', default: 10 }
              },
              required: ['owner', 'repo']
            }
          },
          {
            name: 'list_branches',
            description: 'List branches in a repository',
            inputSchema: {
              type: 'object',
              properties: {
                owner: { type: 'string' },
                repo: { type: 'string' },
                per_page: { type: 'number', default: 30 }
              },
              required: ['owner', 'repo']
            }
          },
          {
            name: 'get_commit',
            description: 'Get details of a specific commit',
            inputSchema: {
              type: 'object',
              properties: {
                owner: { type: 'string' },
                repo: { type: 'string' },
                sha: { type: 'string', description: 'Commit SHA' }
              },
              required: ['owner', 'repo', 'sha']
            }
          },
          {
            name: 'list_commits',
            description: 'List commits in a repository',
            inputSchema: {
              type: 'object',
              properties: {
                owner: { type: 'string' },
                repo: { type: 'string' },
                branch: { type: 'string', description: 'Branch name (default: main)' },
                path: { type: 'string', description: 'Only commits containing this file path' },
                per_page: { type: 'number', default: 10 }
              },
              required: ['owner', 'repo']
            }
          },
          // WRITE OPERATIONS (require GitHub token)
          {
            name: 'create_issue',
            description: 'Create a new issue (requires GitHub token)',
            inputSchema: {
              type: 'object',
              properties: {
                owner: { type: 'string' },
                repo: { type: 'string' },
                title: { type: 'string', description: 'Issue title' },
                body: { type: 'string', description: 'Issue body (markdown)' },
                labels: { type: 'array', items: { type: 'string' } },
                assignees: { type: 'array', items: { type: 'string' } }
              },
              required: ['owner', 'repo', 'title']
            }
          },
          {
            name: 'create_or_update_file',
            description: 'Create or update a file in a repository (requires GitHub token)',
            inputSchema: {
              type: 'object',
              properties: {
                owner: { type: 'string' },
                repo: { type: 'string' },
                path: { type: 'string', description: 'File path in the repository' },
                content: { type: 'string', description: 'File content' },
                message: { type: 'string', description: 'Commit message' },
                branch: { type: 'string', description: 'Branch name (default: main)' },
                sha: { type: 'string', description: 'SHA of file being replaced (required for updates)' }
              },
              required: ['owner', 'repo', 'path', 'content', 'message']
            }
          },
          {
            name: 'create_branch',
            description: 'Create a new branch from an existing ref (requires GitHub token)',
            inputSchema: {
              type: 'object',
              properties: {
                owner: { type: 'string' },
                repo: { type: 'string' },
                branch: { type: 'string', description: 'New branch name' },
                from_branch: { type: 'string', description: 'Source branch (default: main)' }
              },
              required: ['owner', 'repo', 'branch']
            }
          },
          {
            name: 'create_pull_request',
            description: 'Create a pull request (requires GitHub token)',
            inputSchema: {
              type: 'object',
              properties: {
                owner: { type: 'string' },
                repo: { type: 'string' },
                title: { type: 'string', description: 'PR title' },
                body: { type: 'string', description: 'PR description (markdown)' },
                head: { type: 'string', description: 'Branch containing changes' },
                base: { type: 'string', description: 'Branch to merge into (default: main)' },
                draft: { type: 'boolean', description: 'Create as draft PR', default: false }
              },
              required: ['owner', 'repo', 'title', 'head']
            }
          },
          {
            name: 'comment_on_issue',
            description: 'Add a comment to an issue or PR (requires GitHub token)',
            inputSchema: {
              type: 'object',
              properties: {
                owner: { type: 'string' },
                repo: { type: 'string' },
                issue_number: { type: 'number', description: 'Issue or PR number' },
                body: { type: 'string', description: 'Comment body (markdown)' }
              },
              required: ['owner', 'repo', 'issue_number', 'body']
            }
          },
          {
            name: 'close_issue',
            description: 'Close an issue (requires GitHub token)',
            inputSchema: {
              type: 'object',
              properties: {
                owner: { type: 'string' },
                repo: { type: 'string' },
                issue_number: { type: 'number' }
              },
              required: ['owner', 'repo', 'issue_number']
            }
          },
          {
            name: 'merge_pull_request',
            description: 'Merge a pull request (requires GitHub token)',
            inputSchema: {
              type: 'object',
              properties: {
                owner: { type: 'string' },
                repo: { type: 'string' },
                pull_number: { type: 'number' },
                commit_title: { type: 'string', description: 'Merge commit title' },
                merge_method: { type: 'string', enum: ['merge', 'squash', 'rebase'], default: 'merge' }
              },
              required: ['owner', 'repo', 'pull_number']
            }
          },
          {
            name: 'fork_repo',
            description: 'Fork a repository to your account (requires GitHub token)',
            inputSchema: {
              type: 'object',
              properties: {
                owner: { type: 'string' },
                repo: { type: 'string' },
                organization: { type: 'string', description: 'Fork to organization (optional)' }
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
            content: content.substring(0, 50000),
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

    // List branches
    if (path === '/tools/list_branches' && request.method === 'POST') {
      try {
        const body = await request.json() as { arguments: { owner: string; repo: string; per_page?: number } };
        const { owner, repo, per_page = 30 } = body.arguments;

        const response = await githubAPI(`/repos/${owner}/${repo}/branches?per_page=${per_page}`, githubToken);
        
        return new Response(JSON.stringify({
          content: {
            branches: response.map((branch: any) => ({
              name: branch.name,
              sha: branch.commit?.sha,
              protected: branch.protected
            }))
          }
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

      } catch (error) {
        return errorResponse(error);
      }
    }

    // Get commit
    if (path === '/tools/get_commit' && request.method === 'POST') {
      try {
        const body = await request.json() as { arguments: { owner: string; repo: string; sha: string } };
        const { owner, repo, sha } = body.arguments;

        const response = await githubAPI(`/repos/${owner}/${repo}/commits/${sha}`, githubToken);
        
        return new Response(JSON.stringify({
          content: {
            sha: response.sha,
            message: response.commit?.message,
            author: response.commit?.author?.name,
            date: response.commit?.author?.date,
            files_changed: response.files?.length,
            additions: response.stats?.additions,
            deletions: response.stats?.deletions,
            url: response.html_url
          }
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

      } catch (error) {
        return errorResponse(error);
      }
    }

    // List commits
    if (path === '/tools/list_commits' && request.method === 'POST') {
      try {
        const body = await request.json() as { arguments: { owner: string; repo: string; branch?: string; path?: string; per_page?: number } };
        const { owner, repo, branch, path: filePath, per_page = 10 } = body.arguments;

        const params = new URLSearchParams({ per_page: per_page.toString() });
        if (branch) params.set('sha', branch);
        if (filePath) params.set('path', filePath);

        const response = await githubAPI(`/repos/${owner}/${repo}/commits?${params}`, githubToken);
        
        return new Response(JSON.stringify({
          content: {
            commits: response.map((commit: any) => ({
              sha: commit.sha.substring(0, 7),
              message: commit.commit?.message?.split('\n')[0],
              author: commit.commit?.author?.name,
              date: commit.commit?.author?.date,
              url: commit.html_url
            }))
          }
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

      } catch (error) {
        return errorResponse(error);
      }
    }

    // ========== WRITE OPERATIONS (require GitHub token) ==========

    // Create issue
    if (path === '/tools/create_issue' && request.method === 'POST') {
      if (!githubToken) {
        return new Response(JSON.stringify({ 
          error: 'GitHub token required',
          details: 'Please provide a GitHub token via X-GitHub-Token header'
        }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      try {
        const body = await request.json() as { arguments: { owner: string; repo: string; title: string; body?: string; labels?: string[]; assignees?: string[] } };
        const { owner, repo, title, body: issueBody, labels, assignees } = body.arguments;

        const response = await githubAPI(`/repos/${owner}/${repo}/issues`, githubToken, 'POST', {
          title,
          body: issueBody,
          labels,
          assignees
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

    // Create or update file
    if (path === '/tools/create_or_update_file' && request.method === 'POST') {
      if (!githubToken) {
        return new Response(JSON.stringify({ 
          error: 'GitHub token required',
          details: 'Please provide a GitHub token via X-GitHub-Token header'
        }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      try {
        const body = await request.json() as { arguments: { owner: string; repo: string; path: string; content: string; message: string; branch?: string; sha?: string } };
        const { owner, repo, path: filePath, content, message, branch, sha } = body.arguments;

        // Encode content to base64
        const encodedContent = btoa(content);

        const payload: any = {
          message,
          content: encodedContent
        };
        if (branch) payload.branch = branch;
        if (sha) payload.sha = sha;

        const response = await githubAPI(`/repos/${owner}/${repo}/contents/${filePath}`, githubToken, 'PUT', payload);
        
        return new Response(JSON.stringify({
          content: {
            path: response.content?.path,
            sha: response.content?.sha,
            commit_sha: response.commit?.sha,
            commit_url: response.commit?.html_url,
            created: !sha,
            updated: !!sha
          }
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

      } catch (error) {
        return errorResponse(error);
      }
    }

    // Create branch
    if (path === '/tools/create_branch' && request.method === 'POST') {
      if (!githubToken) {
        return new Response(JSON.stringify({ 
          error: 'GitHub token required'
        }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      try {
        const body = await request.json() as { arguments: { owner: string; repo: string; branch: string; from_branch?: string } };
        const { owner, repo, branch, from_branch = 'main' } = body.arguments;

        // First get the SHA of the source branch
        const refResponse = await githubAPI(`/repos/${owner}/${repo}/git/refs/heads/${from_branch}`, githubToken);
        const sha = refResponse.object.sha;

        // Create new branch
        const response = await githubAPI(`/repos/${owner}/${repo}/git/refs`, githubToken, 'POST', {
          ref: `refs/heads/${branch}`,
          sha
        });
        
        return new Response(JSON.stringify({
          content: {
            branch: branch,
            sha: response.object?.sha,
            created: true,
            from_branch
          }
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

      } catch (error) {
        return errorResponse(error);
      }
    }

    // Create pull request
    if (path === '/tools/create_pull_request' && request.method === 'POST') {
      if (!githubToken) {
        return new Response(JSON.stringify({ 
          error: 'GitHub token required'
        }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      try {
        const body = await request.json() as { arguments: { owner: string; repo: string; title: string; body?: string; head: string; base?: string; draft?: boolean } };
        const { owner, repo, title, body: prBody, head, base = 'main', draft = false } = body.arguments;

        const response = await githubAPI(`/repos/${owner}/${repo}/pulls`, githubToken, 'POST', {
          title,
          body: prBody,
          head,
          base,
          draft
        });
        
        return new Response(JSON.stringify({
          content: {
            number: response.number,
            title: response.title,
            url: response.html_url,
            state: response.state,
            draft: response.draft,
            created: true
          }
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

      } catch (error) {
        return errorResponse(error);
      }
    }

    // Comment on issue
    if (path === '/tools/comment_on_issue' && request.method === 'POST') {
      if (!githubToken) {
        return new Response(JSON.stringify({ 
          error: 'GitHub token required'
        }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      try {
        const body = await request.json() as { arguments: { owner: string; repo: string; issue_number: number; body: string } };
        const { owner, repo, issue_number, body: commentBody } = body.arguments;

        const response = await githubAPI(`/repos/${owner}/${repo}/issues/${issue_number}/comments`, githubToken, 'POST', {
          body: commentBody
        });
        
        return new Response(JSON.stringify({
          content: {
            id: response.id,
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

    // Close issue
    if (path === '/tools/close_issue' && request.method === 'POST') {
      if (!githubToken) {
        return new Response(JSON.stringify({ 
          error: 'GitHub token required'
        }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      try {
        const body = await request.json() as { arguments: { owner: string; repo: string; issue_number: number } };
        const { owner, repo, issue_number } = body.arguments;

        const response = await githubAPI(`/repos/${owner}/${repo}/issues/${issue_number}`, githubToken, 'PATCH', {
          state: 'closed'
        });
        
        return new Response(JSON.stringify({
          content: {
            number: response.number,
            state: response.state,
            closed: true,
            url: response.html_url
          }
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

      } catch (error) {
        return errorResponse(error);
      }
    }

    // Merge pull request
    if (path === '/tools/merge_pull_request' && request.method === 'POST') {
      if (!githubToken) {
        return new Response(JSON.stringify({ 
          error: 'GitHub token required'
        }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      try {
        const body = await request.json() as { arguments: { owner: string; repo: string; pull_number: number; commit_title?: string; merge_method?: string } };
        const { owner, repo, pull_number, commit_title, merge_method = 'merge' } = body.arguments;

        const payload: any = { merge_method };
        if (commit_title) payload.commit_title = commit_title;

        const response = await githubAPI(`/repos/${owner}/${repo}/pulls/${pull_number}/merge`, githubToken, 'PUT', payload);
        
        return new Response(JSON.stringify({
          content: {
            merged: response.merged,
            message: response.message,
            sha: response.sha
          }
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

      } catch (error) {
        return errorResponse(error);
      }
    }

    // Fork repository
    if (path === '/tools/fork_repo' && request.method === 'POST') {
      if (!githubToken) {
        return new Response(JSON.stringify({ 
          error: 'GitHub token required'
        }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      try {
        const body = await request.json() as { arguments: { owner: string; repo: string; organization?: string } };
        const { owner, repo, organization } = body.arguments;

        const payload: any = {};
        if (organization) payload.organization = organization;

        const response = await githubAPI(`/repos/${owner}/${repo}/forks`, githubToken, 'POST', payload);
        
        return new Response(JSON.stringify({
          content: {
            full_name: response.full_name,
            url: response.html_url,
            clone_url: response.clone_url,
            forked: true
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
    'User-Agent': 'Morgus-MCP-GitHub/2.0'
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
