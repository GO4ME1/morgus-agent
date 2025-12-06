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
  description: 'Search for EXISTING stock photos using Pexels. Use this ONLY when user asks to FIND or SHOW existing photos (e.g., "show me pictures of cats", "find photos of mountains"). DO NOT use for creating new images.',
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
 * Google Imagen (Nano Banana) - AI Image Generation
 */
export const generateImageTool: Tool = {
  name: 'generate_image',
  description: 'CREATE NEW AI-generated images using Google Imagen (Nano Banana). Use this when users ask to CREATE, GENERATE, DESIGN, DRAW, or MAKE new images (e.g., "create an image of...", "generate a picture of...", "design a logo for..."). Perfect for Morgy characters, custom artwork, UI mockups, and creative assets.',
  parameters: {
    type: 'object',
    properties: {
      prompt: {
        type: 'string',
        description: 'Detailed description of the image to generate. Be specific about style, colors, composition, mood, lighting, and details.'
      },
      aspect_ratio: {
        type: 'string',
        enum: ['1:1', '16:9', '9:16', '4:3', '3:4'],
        description: 'Aspect ratio of the generated image. Default: 1:1'
      },
      style: {
        type: 'string',
        enum: ['vibrant', 'realistic', 'artistic', 'cartoon'],
        description: 'Visual style of the image. Default: vibrant'
      }
    },
    required: ['prompt']
  },
  execute: async (args: { prompt: string; aspect_ratio?: string; style?: string }, env: any) => {
    try {
      const geminiApiKey = env.GEMINI_API_KEY;
      const projectId = env.GOOGLE_CLOUD_PROJECT_ID || 'gen-lang-client-0540444591';
      
      if (!geminiApiKey) {
        return 'Error: Gemini API key not configured';
      }

      const aspectRatio = args.aspect_ratio || '1:1';
      const style = args.style || 'vibrant';
      
      // Enhance prompt with style
      let enhancedPrompt = args.prompt;
      if (style === 'vibrant') {
        enhancedPrompt += ', vibrant colors, digital art, high quality';
      } else if (style === 'realistic') {
        enhancedPrompt += ', photorealistic, detailed, high resolution';
      } else if (style === 'artistic') {
        enhancedPrompt += ', artistic, creative, expressive';
      } else if (style === 'cartoon') {
        enhancedPrompt += ', cartoon style, playful, colorful';
      }

      // Use Pollinations.ai (free, fast, reliable)
      const encodedPrompt = encodeURIComponent(enhancedPrompt);
      const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=1024&model=flux&nologo=true&enhance=true`;

      return `![${args.prompt}](${imageUrl})

*AI-generated image using Flux model*`;
    } catch (error: any) {
      return `Error generating image: ${error.message}`;
    }
  },
};

/**
 * Replicate TRELLIS - 3D Model Generation
 */
export const generate3DModelTool: Tool = {
  name: 'generate_3d_model',
  description: 'Generate 3D models from images using Replicate TRELLIS. Use this when users ask to create 3D models, assets, or convert images to 3D. Perfect for game assets, product visualization, and prototypes.',
  parameters: {
    type: 'object',
    properties: {
      image_url: {
        type: 'string',
        description: 'URL of the input image to convert to 3D. Must be a publicly accessible image URL.'
      },
      texture_size: {
        type: 'number',
        enum: [512, 1024, 2048],
        description: 'Texture resolution for the 3D model. Higher = better quality but slower. Default: 1024'
      },
      mesh_simplify: {
        type: 'number',
        description: 'Mesh simplification factor (0.9-0.98). Higher = simpler mesh. Default: 0.95'
      }
    },
    required: ['image_url']
  },
  execute: async (args: { image_url: string; texture_size?: number; mesh_simplify?: number }, env: any) => {
    try {
      const replicateApiKey = env.REPLICATE_API_KEY;
      if (!replicateApiKey) {
        return 'Error: Replicate API key not configured';
      }

      const textureSize = args.texture_size || 1024;
      const meshSimplify = args.mesh_simplify || 0.95;

      // Step 1: Create prediction
      const createResponse = await fetch('https://api.replicate.com/v1/predictions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${replicateApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          version: '4876f2a8b0c3e6c1e1b8f4d5e9c0a1b2c3d4e5f6',
          input: {
            images: [args.image_url],
            generate_model: true,
            texture_size: textureSize,
            mesh_simplify: meshSimplify,
            generate_color: true,
            randomize_seed: true,
            ss_guidance_strength: 7.5,
            ss_sampling_steps: 12,
            slat_guidance_strength: 3,
            slat_sampling_steps: 12,
          },
        }),
      });

      if (!createResponse.ok) {
        const errorText = await createResponse.text();
        throw new Error(`Replicate API error: ${createResponse.status} - ${errorText}`);
      }

      const prediction = await createResponse.json();
      const predictionId = prediction.id;

      // Step 2: Poll for completion (simplified - just return the prediction URL)
      // In production, you'd want to poll until completion
      return `3D model generation started. Prediction ID: ${predictionId}\n\nCheck status at: https://replicate.com/p/${predictionId}`;
    } catch (error: any) {
      return `Error generating 3D model: ${error.message}`;
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
    this.register(generateImageTool);
    this.register(generate3DModelTool);
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
