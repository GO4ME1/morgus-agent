/**
 * Tool system for Morgus autonomous agent
 */

export interface Tool {
  name: string;
  description: string;
  parameters: {
    type: string;
    properties: Record<string, any>;
    required: string[];
  };
  execute: (args: any, env: any) => Promise<string>;
}

/**
 * Web search tool using Tavily API
 */
export const searchWebTool: Tool = {
  name: 'search_web',
  description: 'Search the web for information. Use this when you need current information, facts, or data that requires research.',
  parameters: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'The search query'
      },
      max_results: {
        type: 'number',
        description: 'Maximum number of results to return (default: 5)',
        default: 5
      }
    },
    required: ['query']
  },
  execute: async (args: { query: string; max_results?: number }, env: any) => {
    try {
      // Use Tavily API for web search
      const apiKey = env.TAVILY_API_KEY || 'tvly-demo'; // Demo key for testing
      const response = await fetch('https://api.tavily.com/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          api_key: apiKey,
          query: args.query,
          max_results: args.max_results || 5,
          include_answer: true,
          include_raw_content: false,
        }),
      });

      if (!response.ok) {
        throw new Error(`Tavily API error: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Format results
      let result = '';
      if (data.answer) {
        result += `Answer: ${data.answer}\n\n`;
      }
      
      if (data.results && data.results.length > 0) {
        result += 'Search Results:\n';
        data.results.forEach((item: any, index: number) => {
          result += `\n${index + 1}. ${item.title}\n`;
          result += `   URL: ${item.url}\n`;
          result += `   ${item.content}\n`;
        });
      }
      
      return result || 'No results found.';
    } catch (error: any) {
      return `Error searching web: ${error.message}`;
    }
  },
};

/**
 * Fetch URL content tool
 */
export const fetchUrlTool: Tool = {
  name: 'fetch_url',
  description: 'Fetch and extract content from a specific URL. Use this to read documentation, articles, or web pages.',
  parameters: {
    type: 'object',
    properties: {
      url: {
        type: 'string',
        description: 'The URL to fetch'
      }
    },
    required: ['url']
  },
  execute: async (args: { url: string }, env: any) => {
    try {
      const response = await fetch(args.url, {
        headers: {
          'User-Agent': 'Morgus-Agent/1.0',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const html = await response.text();
      
      // Basic HTML to text conversion (remove tags)
      const text = html
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      
      // Truncate to reasonable length
      return text.substring(0, 5000);
    } catch (error: any) {
      return `Error fetching URL: ${error.message}`;
    }
  },
};

/**
 * Execute code tool using E2B sandbox
 */
export const executeCodeTool: Tool = {
  name: 'execute_code',
  description: 'Execute Python or JavaScript code in a secure sandbox. Use this to run calculations, test code, or process data.',
  parameters: {
    type: 'object',
    properties: {
      language: {
        type: 'string',
        enum: ['python', 'javascript'],
        description: 'Programming language'
      },
      code: {
        type: 'string',
        description: 'The code to execute'
      }
    },
    required: ['language', 'code']
  },
  execute: async (args: { language: string; code: string }, env: any) => {
    try {
      // Use E2B API for code execution
      const apiKey = env.E2B_API_KEY;
      if (!apiKey) {
        return 'Error: E2B API key not configured';
      }

      const response = await fetch('https://api.e2b.dev/v1/sandboxes', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          template: args.language === 'python' ? 'python3' : 'nodejs',
          timeout: 30,
        }),
      });

      if (!response.ok) {
        throw new Error(`E2B API error: ${response.statusText}`);
      }

      const sandbox = await response.json();
      const sandboxId = sandbox.id;

      // Execute code
      const execResponse = await fetch(`https://api.e2b.dev/v1/sandboxes/${sandboxId}/execute`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: args.code,
        }),
      });

      const result = await execResponse.json();

      // Check if there are any image files created (for charts/visualizations)
      let imageData = '';
      try {
        // List files in the sandbox
        const filesResponse = await fetch(`https://api.e2b.dev/v1/sandboxes/${sandboxId}/files`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
          },
        });
        
        if (filesResponse.ok) {
          const files = await filesResponse.json();
          // Look for image files (png, jpg, jpeg, svg)
          const imageFile = files.find((f: any) => 
            f.name.match(/\.(png|jpg|jpeg|svg)$/i)
          );
          
          if (imageFile) {
            // Download the image file
            const imageResponse = await fetch(`https://api.e2b.dev/v1/sandboxes/${sandboxId}/files/${imageFile.name}`, {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${apiKey}`,
              },
            });
            
            if (imageResponse.ok) {
              const imageBuffer = await imageResponse.arrayBuffer();
              const base64 = btoa(String.fromCharCode(...new Uint8Array(imageBuffer)));
              imageData = `\n\n![Generated Chart](data:image/png;base64,${base64})`;
            }
          }
        }
      } catch (e) {
        // Ignore file listing errors
      }

      // Clean up sandbox
      await fetch(`https://api.e2b.dev/v1/sandboxes/${sandboxId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        },
      });

      return `Output:\n${result.stdout || ''}\n${result.stderr || ''}${imageData}`;
    } catch (error: any) {
      return `Error executing code: ${error.message}`;
    }
  },
};

/**
 * Pexels image search tool
 */
export const searchImagesTool: Tool = {
  name: 'search_images',
  description: 'Search for free stock images using Pexels. Use this to find relevant images to enhance your responses with visual content.',
  parameters: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'The search query for images (e.g., "nature", "technology", "business")'
      },
      per_page: {
        type: 'number',
        description: 'Number of images to return (default: 3, max: 10)',
        default: 3
      }
    },
    required: ['query']
  },
  execute: async (args: { query: string; per_page?: number }, env: any) => {
    try {
      const apiKey = env.PEXELS_API_KEY;
      if (!apiKey) {
        return 'Error: Pexels API key not configured';
      }

      const perPage = Math.min(args.per_page || 3, 10);
      const response = await fetch(
        `https://api.pexels.com/v1/search?query=${encodeURIComponent(args.query)}&per_page=${perPage}`,
        {
          headers: {
            'Authorization': apiKey,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Pexels API error: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.photos || data.photos.length === 0) {
        return `No images found for "${args.query}"`;
      }

      // Return structured data that the agent can format
      const images = data.photos.slice(0, 3).map((photo: any) => ({
        url: photo.src.large,
        medium: photo.src.medium,
        alt: photo.alt || 'Image',
        photographer: photo.photographer,
        photographer_url: photo.photographer_url,
        pexels_url: photo.url
      }));
      
      // Return ONLY the markdown images, nothing else
      // The agent will wrap them in the proper format
      let result = '';
      
      images.forEach((img: any, index: number) => {
        result += `![${img.alt}](${img.medium}) `;
      });
      
      return result.trim();
    } catch (error: any) {
      return `Error searching images: ${error.message}`;
    }
  },
};

/**
 * Think/Plan tool - allows the agent to reason and plan
 */
export const thinkTool: Tool = {
  name: 'think',
  description: 'Use this to think through a problem, plan your approach, or reason about the task. This helps break down complex tasks.',
  parameters: {
    type: 'object',
    properties: {
      thought: {
        type: 'string',
        description: 'Your reasoning, analysis, or plan'
      }
    },
    required: ['thought']
  },
  execute: async (args: { thought: string }, env: any) => {
    return `Recorded thought: ${args.thought}`;
  },
};

/**
 * Tool registry
 */
export class ToolRegistry {
  private tools: Map<string, Tool> = new Map();

  constructor() {
    // Register default tools
    this.register(searchWebTool);
    this.register(fetchUrlTool);
    this.register(executeCodeTool);
    this.register(searchImagesTool);
    this.register(thinkTool);
  }

  register(tool: Tool) {
    this.tools.set(tool.name, tool);
  }

  get(name: string): Tool | undefined {
    return this.tools.get(name);
  }

  getAll(): Tool[] {
    return Array.from(this.tools.values());
  }

  getSchemas(): any[] {
    return this.getAll().map(tool => ({
      type: 'function',
      function: {
        name: tool.name,
        description: tool.description,
        parameters: tool.parameters,
      },
    }));
  }

  async execute(name: string, args: any, env: any): Promise<string> {
    const tool = this.get(name);
    if (!tool) {
      throw new Error(`Tool not found: ${name}`);
    }
    return await tool.execute(args, env);
  }
}
