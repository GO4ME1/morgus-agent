/**
 * Morgus Notion MCP Server
 * 
 * Provides tools for interacting with Notion workspaces:
 * - Search pages and databases
 * - Read page content
 * - Create and update pages
 * - Query databases
 * - Create database entries
 */

interface Env {
  ENVIRONMENT: string;
}

interface MCPRequest {
  method: string;
  params?: {
    name?: string;
    arguments?: Record<string, unknown>;
  };
  config?: {
    notion_api_key?: string;
  };
}

interface MCPResponse {
  result?: unknown;
  error?: {
    code: number;
    message: string;
  };
}

// Tool definitions
const TOOLS = [
  {
    name: 'search_notion',
    description: 'Search for pages and databases in Notion by query text',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search query text'
        },
        filter: {
          type: 'string',
          enum: ['page', 'database'],
          description: 'Filter results by type (optional)'
        },
        page_size: {
          type: 'number',
          description: 'Number of results to return (default: 10, max: 100)'
        }
      },
      required: ['query']
    }
  },
  {
    name: 'get_page',
    description: 'Get a Notion page by ID, including its properties and content blocks',
    inputSchema: {
      type: 'object',
      properties: {
        page_id: {
          type: 'string',
          description: 'The Notion page ID (UUID format or URL)'
        },
        include_content: {
          type: 'boolean',
          description: 'Whether to include page content blocks (default: true)'
        }
      },
      required: ['page_id']
    }
  },
  {
    name: 'create_page',
    description: 'Create a new page in Notion under a parent page or database',
    inputSchema: {
      type: 'object',
      properties: {
        parent_id: {
          type: 'string',
          description: 'Parent page or database ID'
        },
        parent_type: {
          type: 'string',
          enum: ['page', 'database'],
          description: 'Type of parent (page or database)'
        },
        title: {
          type: 'string',
          description: 'Page title'
        },
        content: {
          type: 'string',
          description: 'Page content in markdown format (will be converted to Notion blocks)'
        },
        properties: {
          type: 'object',
          description: 'Database properties (only for database parents)'
        }
      },
      required: ['parent_id', 'parent_type', 'title']
    }
  },
  {
    name: 'update_page',
    description: 'Update an existing Notion page properties or archive it',
    inputSchema: {
      type: 'object',
      properties: {
        page_id: {
          type: 'string',
          description: 'The Notion page ID to update'
        },
        properties: {
          type: 'object',
          description: 'Properties to update'
        },
        archived: {
          type: 'boolean',
          description: 'Set to true to archive the page'
        }
      },
      required: ['page_id']
    }
  },
  {
    name: 'append_blocks',
    description: 'Append content blocks to an existing Notion page',
    inputSchema: {
      type: 'object',
      properties: {
        page_id: {
          type: 'string',
          description: 'The Notion page ID'
        },
        content: {
          type: 'string',
          description: 'Content to append in markdown format'
        }
      },
      required: ['page_id', 'content']
    }
  },
  {
    name: 'query_database',
    description: 'Query a Notion database with filters and sorts',
    inputSchema: {
      type: 'object',
      properties: {
        database_id: {
          type: 'string',
          description: 'The Notion database ID'
        },
        filter: {
          type: 'object',
          description: 'Notion filter object (see Notion API docs)'
        },
        sorts: {
          type: 'array',
          description: 'Array of sort objects'
        },
        page_size: {
          type: 'number',
          description: 'Number of results (default: 100)'
        }
      },
      required: ['database_id']
    }
  },
  {
    name: 'get_database',
    description: 'Get database schema and properties',
    inputSchema: {
      type: 'object',
      properties: {
        database_id: {
          type: 'string',
          description: 'The Notion database ID'
        }
      },
      required: ['database_id']
    }
  },
  {
    name: 'list_users',
    description: 'List all users in the Notion workspace',
    inputSchema: {
      type: 'object',
      properties: {},
      required: []
    }
  }
];

// Helper to extract page ID from URL or ID string
function extractPageId(input: string): string {
  // If it's a URL, extract the ID
  const urlMatch = input.match(/([a-f0-9]{32}|[a-f0-9-]{36})/i);
  if (urlMatch) {
    return urlMatch[1].replace(/-/g, '');
  }
  return input.replace(/-/g, '');
}

// Convert markdown to Notion blocks (simplified)
function markdownToBlocks(markdown: string): object[] {
  const lines = markdown.split('\n');
  const blocks: object[] = [];
  
  for (const line of lines) {
    if (!line.trim()) continue;
    
    // Headings
    if (line.startsWith('### ')) {
      blocks.push({
        type: 'heading_3',
        heading_3: {
          rich_text: [{ type: 'text', text: { content: line.slice(4) } }]
        }
      });
    } else if (line.startsWith('## ')) {
      blocks.push({
        type: 'heading_2',
        heading_2: {
          rich_text: [{ type: 'text', text: { content: line.slice(3) } }]
        }
      });
    } else if (line.startsWith('# ')) {
      blocks.push({
        type: 'heading_1',
        heading_1: {
          rich_text: [{ type: 'text', text: { content: line.slice(2) } }]
        }
      });
    }
    // Bullet points
    else if (line.startsWith('- ') || line.startsWith('* ')) {
      blocks.push({
        type: 'bulleted_list_item',
        bulleted_list_item: {
          rich_text: [{ type: 'text', text: { content: line.slice(2) } }]
        }
      });
    }
    // Numbered lists
    else if (/^\d+\.\s/.test(line)) {
      blocks.push({
        type: 'numbered_list_item',
        numbered_list_item: {
          rich_text: [{ type: 'text', text: { content: line.replace(/^\d+\.\s/, '') } }]
        }
      });
    }
    // Code blocks
    else if (line.startsWith('```')) {
      // Skip code fence markers
      continue;
    }
    // Todo items
    else if (line.startsWith('- [ ] ')) {
      blocks.push({
        type: 'to_do',
        to_do: {
          rich_text: [{ type: 'text', text: { content: line.slice(6) } }],
          checked: false
        }
      });
    } else if (line.startsWith('- [x] ')) {
      blocks.push({
        type: 'to_do',
        to_do: {
          rich_text: [{ type: 'text', text: { content: line.slice(6) } }],
          checked: true
        }
      });
    }
    // Regular paragraph
    else {
      blocks.push({
        type: 'paragraph',
        paragraph: {
          rich_text: [{ type: 'text', text: { content: line } }]
        }
      });
    }
  }
  
  return blocks;
}

// Extract text from Notion rich text
function extractText(richText: Array<{ plain_text?: string }>): string {
  return richText.map(t => t.plain_text || '').join('');
}

// Tool implementations
async function searchNotion(apiKey: string, args: { query: string; filter?: string; page_size?: number }) {
  const body: Record<string, unknown> = {
    query: args.query,
    page_size: Math.min(args.page_size || 10, 100)
  };
  
  if (args.filter) {
    body.filter = { value: args.filter, property: 'object' };
  }
  
  const response = await fetch('https://api.notion.com/v1/search', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Notion-Version': '2022-06-28',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Notion API error: ${error}`);
  }
  
  const data = await response.json() as { results: Array<{ id: string; object: string; properties?: Record<string, { title?: Array<{ plain_text: string }> }> }> };
  
  return {
    results: data.results.map((item: { id: string; object: string; properties?: Record<string, { title?: Array<{ plain_text: string }> }> }) => ({
      id: item.id,
      type: item.object,
      title: item.properties?.title ? extractText(item.properties.title.title || []) : 
             item.properties?.Name ? extractText((item.properties.Name as { title?: Array<{ plain_text: string }> }).title || []) : 'Untitled'
    })),
    count: data.results.length
  };
}

async function getPage(apiKey: string, args: { page_id: string; include_content?: boolean }) {
  const pageId = extractPageId(args.page_id);
  
  // Get page properties
  const pageResponse = await fetch(`https://api.notion.com/v1/pages/${pageId}`, {
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Notion-Version': '2022-06-28'
    }
  });
  
  if (!pageResponse.ok) {
    const error = await pageResponse.text();
    throw new Error(`Notion API error: ${error}`);
  }
  
  const page = await pageResponse.json() as { id: string; properties: Record<string, unknown>; created_time: string; last_edited_time: string };
  
  let content: string[] = [];
  
  // Get page content blocks if requested
  if (args.include_content !== false) {
    const blocksResponse = await fetch(`https://api.notion.com/v1/blocks/${pageId}/children?page_size=100`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Notion-Version': '2022-06-28'
      }
    });
    
    if (blocksResponse.ok) {
      const blocks = await blocksResponse.json() as { results: Array<{ type: string; [key: string]: unknown }> };
      content = blocks.results.map((block: { type: string; [key: string]: unknown }) => {
        const blockData = block[block.type] as { rich_text?: Array<{ plain_text: string }> };
        if (blockData?.rich_text) {
          return extractText(blockData.rich_text);
        }
        return '';
      }).filter(Boolean);
    }
  }
  
  return {
    id: page.id,
    properties: page.properties,
    content: content.join('\n'),
    created_time: page.created_time,
    last_edited_time: page.last_edited_time
  };
}

async function createPage(apiKey: string, args: { parent_id: string; parent_type: string; title: string; content?: string; properties?: Record<string, unknown> }) {
  const parentId = extractPageId(args.parent_id);
  
  const body: Record<string, unknown> = {
    parent: args.parent_type === 'database' 
      ? { database_id: parentId }
      : { page_id: parentId },
    properties: args.parent_type === 'database' && args.properties
      ? { ...args.properties, title: { title: [{ text: { content: args.title } }] } }
      : { title: { title: [{ text: { content: args.title } }] } }
  };
  
  if (args.content) {
    body.children = markdownToBlocks(args.content);
  }
  
  const response = await fetch('https://api.notion.com/v1/pages', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Notion-Version': '2022-06-28',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Notion API error: ${error}`);
  }
  
  const page = await response.json() as { id: string; url: string };
  
  return {
    id: page.id,
    url: page.url,
    message: 'Page created successfully'
  };
}

async function updatePage(apiKey: string, args: { page_id: string; properties?: Record<string, unknown>; archived?: boolean }) {
  const pageId = extractPageId(args.page_id);
  
  const body: Record<string, unknown> = {};
  if (args.properties) body.properties = args.properties;
  if (args.archived !== undefined) body.archived = args.archived;
  
  const response = await fetch(`https://api.notion.com/v1/pages/${pageId}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Notion-Version': '2022-06-28',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Notion API error: ${error}`);
  }
  
  return { message: 'Page updated successfully' };
}

async function appendBlocks(apiKey: string, args: { page_id: string; content: string }) {
  const pageId = extractPageId(args.page_id);
  const blocks = markdownToBlocks(args.content);
  
  const response = await fetch(`https://api.notion.com/v1/blocks/${pageId}/children`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Notion-Version': '2022-06-28',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ children: blocks })
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Notion API error: ${error}`);
  }
  
  return { message: 'Content appended successfully', blocks_added: blocks.length };
}

async function queryDatabase(apiKey: string, args: { database_id: string; filter?: object; sorts?: object[]; page_size?: number }) {
  const databaseId = extractPageId(args.database_id);
  
  const body: Record<string, unknown> = {
    page_size: args.page_size || 100
  };
  if (args.filter) body.filter = args.filter;
  if (args.sorts) body.sorts = args.sorts;
  
  const response = await fetch(`https://api.notion.com/v1/databases/${databaseId}/query`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Notion-Version': '2022-06-28',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Notion API error: ${error}`);
  }
  
  const data = await response.json() as { results: Array<{ id: string; properties: Record<string, unknown> }> };
  
  return {
    results: data.results.map((item: { id: string; properties: Record<string, unknown> }) => ({
      id: item.id,
      properties: item.properties
    })),
    count: data.results.length
  };
}

async function getDatabase(apiKey: string, args: { database_id: string }) {
  const databaseId = extractPageId(args.database_id);
  
  const response = await fetch(`https://api.notion.com/v1/databases/${databaseId}`, {
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Notion-Version': '2022-06-28'
    }
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Notion API error: ${error}`);
  }
  
  const database = await response.json() as { id: string; title: Array<{ plain_text: string }>; properties: Record<string, unknown> };
  
  return {
    id: database.id,
    title: extractText(database.title),
    properties: database.properties
  };
}

async function listUsers(apiKey: string) {
  const response = await fetch('https://api.notion.com/v1/users', {
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Notion-Version': '2022-06-28'
    }
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Notion API error: ${error}`);
  }
  
  const data = await response.json() as { results: Array<{ id: string; type: string; name: string; avatar_url?: string }> };
  
  return {
    users: data.results.map((user: { id: string; type: string; name: string; avatar_url?: string }) => ({
      id: user.id,
      type: user.type,
      name: user.name,
      avatar_url: user.avatar_url
    }))
  };
}

// Main request handler
async function handleMCPRequest(request: MCPRequest): Promise<MCPResponse> {
  const { method, params, config } = request;
  
  switch (method) {
    case 'tools/list':
      return { result: { tools: TOOLS } };
      
    case 'tools/call':
      if (!params?.name) {
        return { error: { code: -32602, message: 'Missing tool name' } };
      }
      
      const apiKey = config?.notion_api_key;
      if (!apiKey) {
        return { 
          error: { 
            code: -32602, 
            message: 'Notion API key not configured. Please add your Notion integration token in the MCP server settings.' 
          } 
        };
      }
      
      const args = params.arguments || {};
      
      try {
        let result;
        switch (params.name) {
          case 'search_notion':
            result = await searchNotion(apiKey, args as { query: string; filter?: string; page_size?: number });
            break;
          case 'get_page':
            result = await getPage(apiKey, args as { page_id: string; include_content?: boolean });
            break;
          case 'create_page':
            result = await createPage(apiKey, args as { parent_id: string; parent_type: string; title: string; content?: string; properties?: Record<string, unknown> });
            break;
          case 'update_page':
            result = await updatePage(apiKey, args as { page_id: string; properties?: Record<string, unknown>; archived?: boolean });
            break;
          case 'append_blocks':
            result = await appendBlocks(apiKey, args as { page_id: string; content: string });
            break;
          case 'query_database':
            result = await queryDatabase(apiKey, args as { database_id: string; filter?: object; sorts?: object[]; page_size?: number });
            break;
          case 'get_database':
            result = await getDatabase(apiKey, args as { database_id: string });
            break;
          case 'list_users':
            result = await listUsers(apiKey);
            break;
          default:
            return { error: { code: -32601, message: `Unknown tool: ${params.name}` } };
        }
        
        return { result: { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] } };
      } catch (error) {
        return { 
          error: { 
            code: -32603, 
            message: error instanceof Error ? error.message : 'Unknown error' 
          } 
        };
      }
      
    default:
      return { error: { code: -32601, message: `Unknown method: ${method}` } };
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // Handle CORS
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type'
        }
      });
    }
    
    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }
    
    try {
      const mcpRequest = await request.json() as MCPRequest;
      const response = await handleMCPRequest(mcpRequest);
      
      return new Response(JSON.stringify(response), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    } catch (error) {
      return new Response(JSON.stringify({
        error: {
          code: -32700,
          message: 'Parse error'
        }
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
  }
};
