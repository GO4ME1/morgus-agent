/**
 * @morgus/mcp-web-search
 * 
 * MCP Server for web search capabilities
 * Provides tools for searching the web and fetching webpage content
 */

interface Env {
  TAVILY_API_KEY: string;
  SUPABASE_URL: string;
  SUPABASE_SERVICE_KEY: string;
}

interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  score?: number;
}

interface TavilyResponse {
  results: Array<{
    title: string;
    url: string;
    content: string;
    score: number;
  }>;
  answer?: string;
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
        server: '@morgus/mcp-web-search',
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
            name: 'web_search',
            description: 'Search the web for information using Tavily AI search. Returns relevant results with titles, snippets, and URLs.',
            inputSchema: {
              type: 'object',
              properties: {
                query: {
                  type: 'string',
                  description: 'The search query'
                },
                num_results: {
                  type: 'number',
                  description: 'Number of results to return (default: 5, max: 10)',
                  default: 5
                },
                include_answer: {
                  type: 'boolean',
                  description: 'Whether to include an AI-generated answer summary',
                  default: true
                }
              },
              required: ['query']
            }
          },
          {
            name: 'fetch_webpage',
            description: 'Fetch and extract the main text content from a webpage URL',
            inputSchema: {
              type: 'object',
              properties: {
                url: {
                  type: 'string',
                  description: 'The URL of the webpage to fetch'
                },
                extract_links: {
                  type: 'boolean',
                  description: 'Whether to extract links from the page',
                  default: false
                }
              },
              required: ['url']
            }
          }
        ]
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Execute web_search tool
    if (path === '/tools/web_search' && request.method === 'POST') {
      try {
        const body = await request.json() as { arguments: { query: string; num_results?: number; include_answer?: boolean } };
        const { query, num_results = 5, include_answer = true } = body.arguments;

        if (!query) {
          return new Response(JSON.stringify({ error: 'Query is required' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        // Use Tavily API for search
        const tavilyResponse = await fetch('https://api.tavily.com/search', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            api_key: env.TAVILY_API_KEY,
            query,
            max_results: Math.min(num_results, 10),
            include_answer,
            search_depth: 'advanced'
          })
        });

        if (!tavilyResponse.ok) {
          const errorText = await tavilyResponse.text();
          console.error('Tavily API error:', errorText);
          return new Response(JSON.stringify({ 
            error: 'Search failed',
            details: errorText 
          }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        const tavilyData = await tavilyResponse.json() as TavilyResponse;

        const results: SearchResult[] = tavilyData.results.map(r => ({
          title: r.title,
          url: r.url,
          snippet: r.content.substring(0, 500),
          score: r.score
        }));

        return new Response(JSON.stringify({
          content: {
            results,
            answer: tavilyData.answer,
            query,
            total_results: results.length
          }
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

      } catch (error) {
        console.error('web_search error:', error);
        return new Response(JSON.stringify({ 
          error: 'Search failed',
          details: error instanceof Error ? error.message : 'Unknown error'
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    // Execute fetch_webpage tool
    if (path === '/tools/fetch_webpage' && request.method === 'POST') {
      try {
        const body = await request.json() as { arguments: { url: string; extract_links?: boolean } };
        const { url: targetUrl, extract_links = false } = body.arguments;

        if (!targetUrl) {
          return new Response(JSON.stringify({ error: 'URL is required' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        // Fetch the webpage
        const pageResponse = await fetch(targetUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; MorgusBot/1.0; +https://morgus.ai)',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
          }
        });

        if (!pageResponse.ok) {
          return new Response(JSON.stringify({ 
            error: `Failed to fetch URL: ${pageResponse.status} ${pageResponse.statusText}` 
          }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        const html = await pageResponse.text();

        // Extract text content (simple extraction)
        const textContent = extractTextFromHTML(html);
        const links = extract_links ? extractLinksFromHTML(html, targetUrl) : [];

        return new Response(JSON.stringify({
          content: {
            url: targetUrl,
            title: extractTitle(html),
            text: textContent.substring(0, 10000), // Limit to 10k chars
            links: links.slice(0, 20), // Limit to 20 links
            content_length: textContent.length
          }
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

      } catch (error) {
        console.error('fetch_webpage error:', error);
        return new Response(JSON.stringify({ 
          error: 'Failed to fetch webpage',
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

// Helper function to extract text from HTML
function extractTextFromHTML(html: string): string {
  // Remove script and style elements
  let text = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
  text = text.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
  text = text.replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '');
  text = text.replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '');
  text = text.replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '');
  
  // Remove HTML tags
  text = text.replace(/<[^>]+>/g, ' ');
  
  // Decode HTML entities
  text = text.replace(/&nbsp;/g, ' ');
  text = text.replace(/&amp;/g, '&');
  text = text.replace(/&lt;/g, '<');
  text = text.replace(/&gt;/g, '>');
  text = text.replace(/&quot;/g, '"');
  text = text.replace(/&#39;/g, "'");
  
  // Clean up whitespace
  text = text.replace(/\s+/g, ' ').trim();
  
  return text;
}

// Helper function to extract title from HTML
function extractTitle(html: string): string {
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  return titleMatch ? titleMatch[1].trim() : 'Untitled';
}

// Helper function to extract links from HTML
function extractLinksFromHTML(html: string, baseUrl: string): Array<{ text: string; href: string }> {
  const links: Array<{ text: string; href: string }> = [];
  const linkRegex = /<a[^>]+href=["']([^"']+)["'][^>]*>([^<]*)<\/a>/gi;
  let match;
  
  while ((match = linkRegex.exec(html)) !== null) {
    let href = match[1];
    const text = match[2].trim();
    
    // Skip empty links, anchors, and javascript
    if (!href || href.startsWith('#') || href.startsWith('javascript:')) continue;
    
    // Convert relative URLs to absolute
    if (href.startsWith('/')) {
      const base = new URL(baseUrl);
      href = `${base.origin}${href}`;
    } else if (!href.startsWith('http')) {
      continue; // Skip other relative URLs for simplicity
    }
    
    if (text && href) {
      links.push({ text: text.substring(0, 100), href });
    }
  }
  
  return links;
}
