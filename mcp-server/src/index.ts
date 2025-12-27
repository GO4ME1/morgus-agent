/**
 * Morgy MCP Server
 * Exports Morgys to Claude Desktop and other MCP-compatible platforms
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { createClient } from '@supabase/supabase-js';

// ============================================================================
// CONFIGURATION
// ============================================================================

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const API_URL = process.env.API_URL || 'https://morgus-production.fly.dev';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// ============================================================================
// MCP SERVER
// ============================================================================

const server = new Server(
  {
    name: 'morgy-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
      resources: {},
    },
  }
);

// ============================================================================
// TOOLS (Actions Morgys can perform)
// ============================================================================

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      // Reddit Tools
      {
        name: 'post_to_reddit',
        description: 'Post content to a subreddit',
        inputSchema: {
          type: 'object',
          properties: {
            subreddit: {
              type: 'string',
              description: 'Subreddit name (without r/)',
            },
            title: {
              type: 'string',
              description: 'Post title (max 300 characters)',
            },
            body: {
              type: 'string',
              description: 'Post body content',
            },
            tone: {
              type: 'string',
              enum: ['professional', 'casual', 'enthusiastic', 'educational'],
              description: 'Tone of the post',
            },
          },
          required: ['subreddit', 'title', 'body'],
        },
      },
      {
        name: 'monitor_subreddit',
        description: 'Monitor a subreddit for recent posts',
        inputSchema: {
          type: 'object',
          properties: {
            subreddit: {
              type: 'string',
              description: 'Subreddit name (without r/)',
            },
            limit: {
              type: 'number',
              description: 'Number of posts to retrieve (default: 25)',
            },
          },
          required: ['subreddit'],
        },
      },

      // Email Tools
      {
        name: 'send_email',
        description: 'Send an email via Gmail',
        inputSchema: {
          type: 'object',
          properties: {
            to: {
              type: 'string',
              description: 'Recipient email address',
            },
            subject: {
              type: 'string',
              description: 'Email subject line',
            },
            body: {
              type: 'string',
              description: 'Email body content',
            },
            purpose: {
              type: 'string',
              enum: ['outreach', 'follow_up', 'newsletter', 'notification'],
              description: 'Purpose of the email',
            },
          },
          required: ['to', 'subject', 'body'],
        },
      },

      // Video Creation Tools
      {
        name: 'create_tiktok_talking_head',
        description: 'Create a TikTok video with talking head (Morgy avatar speaks)',
        inputSchema: {
          type: 'object',
          properties: {
            topic: {
              type: 'string',
              description: 'Topic of the TikTok video',
            },
            duration: {
              type: 'number',
              description: 'Video duration in seconds (15-60)',
              minimum: 15,
              maximum: 60,
            },
            tone: {
              type: 'string',
              enum: ['energetic', 'professional', 'educational', 'entertaining'],
              description: 'Tone of the video',
            },
            call_to_action: {
              type: 'string',
              description: 'Call to action at the end',
            },
          },
          required: ['topic'],
        },
      },
      {
        name: 'create_tiktok_visual',
        description: 'Create a visual TikTok video (no talking head)',
        inputSchema: {
          type: 'object',
          properties: {
            concept: {
              type: 'string',
              description: 'Visual concept for the video',
            },
            style: {
              type: 'string',
              enum: ['cinematic', 'animated', 'abstract', 'realistic'],
              description: 'Visual style',
            },
            music_mood: {
              type: 'string',
              description: 'Mood for background music',
            },
          },
          required: ['concept'],
        },
      },

      // Research Tools
      {
        name: 'search_youtube',
        description: 'Search YouTube for videos and generate insights',
        inputSchema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'Search query',
            },
            max_results: {
              type: 'number',
              description: 'Maximum number of results (default: 10)',
            },
          },
          required: ['query'],
        },
      },

      // Workflow Tools
      {
        name: 'run_workflow',
        description: 'Execute a multi-step workflow',
        inputSchema: {
          type: 'object',
          properties: {
            workflow_name: {
              type: 'string',
              enum: [
                'tiktok_campaign_domination',
                'social_media_monitoring',
                'viral_content_strategy',
                'market_research_blitz',
                'competitor_analysis',
                'business_plan_generator',
                'literature_review_generator',
                'research_deep_dive',
                'educational_content_series',
              ],
              description: 'Name of the workflow to execute',
            },
            inputs: {
              type: 'object',
              description: 'Workflow-specific inputs',
            },
          },
          required: ['workflow_name'],
        },
      },
    ],
  };
});

// ============================================================================
// TOOL EXECUTION
// ============================================================================

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    // Get Morgy ID from environment or args
    const morgyId = process.env.MORGY_ID || (args as any).morgy_id;
    const userId = process.env.USER_ID || (args as any).user_id;

    if (!morgyId || !userId) {
      throw new Error('MORGY_ID and USER_ID must be set');
    }

    // Call the Morgy API
    const response = await fetch(`${API_URL}/api/morgys/${morgyId}/execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.API_TOKEN}`,
      },
      body: JSON.stringify({
        action: name,
        inputs: args,
        user_id: userId,
      }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }

    const result = await response.json();

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  } catch (error: any) {
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
});

// ============================================================================
// RESOURCES (Morgy data and knowledge)
// ============================================================================

server.setRequestHandler(ListResourcesRequestSchema, async () => {
  try {
    // Get Morgy ID from environment
    const morgyId = process.env.MORGY_ID;

    if (!morgyId) {
      return { resources: [] };
    }

    // Fetch Morgy data
    const { data: morgy } = await supabase
      .from('morgys')
      .select('*')
      .eq('id', morgyId)
      .single();

    if (!morgy) {
      return { resources: [] };
    }

    // Fetch Morgy knowledge base
    const { data: knowledge } = await supabase
      .from('morgy_knowledge')
      .select('*')
      .eq('morgy_id', morgyId);

    const resources = [
      {
        uri: `morgy://${morgyId}/profile`,
        name: `${morgy.name} Profile`,
        description: `Personality, expertise, and configuration for ${morgy.name}`,
        mimeType: 'application/json',
      },
      {
        uri: `morgy://${morgyId}/system-prompt`,
        name: `${morgy.name} System Prompt`,
        description: `System prompt that defines ${morgy.name}'s personality`,
        mimeType: 'text/plain',
      },
    ];

    // Add knowledge base resources
    if (knowledge && knowledge.length > 0) {
      knowledge.forEach((item: any) => {
        resources.push({
          uri: `morgy://${morgyId}/knowledge/${item.id}`,
          name: item.title || item.source_type,
          description: `Knowledge from ${item.source_type}: ${item.title || 'Untitled'}`,
          mimeType: 'text/plain',
        });
      });
    }

    return { resources };
  } catch (error: any) {
    console.error('Error listing resources:', error);
    return { resources: [] };
  }
});

// ============================================================================
// RESOURCE READING
// ============================================================================

server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const { uri } = request.params;

  try {
    const match = uri.match(/^morgy:\/\/([^\/]+)\/(.+)$/);
    if (!match) {
      throw new Error('Invalid resource URI');
    }

    const [, morgyId, resourcePath] = match;

    if (resourcePath === 'profile') {
      // Return Morgy profile
      const { data: morgy } = await supabase
        .from('morgys')
        .select('*')
        .eq('id', morgyId)
        .single();

      if (!morgy) {
        throw new Error('Morgy not found');
      }

      return {
        contents: [
          {
            uri,
            mimeType: 'application/json',
            text: JSON.stringify(morgy, null, 2),
          },
        ],
      };
    }

    if (resourcePath === 'system-prompt') {
      // Return system prompt
      const { data: morgy } = await supabase
        .from('morgys')
        .select('system_prompt')
        .eq('id', morgyId)
        .single();

      if (!morgy) {
        throw new Error('Morgy not found');
      }

      return {
        contents: [
          {
            uri,
            mimeType: 'text/plain',
            text: morgy.system_prompt,
          },
        ],
      };
    }

    if (resourcePath.startsWith('knowledge/')) {
      // Return knowledge base item
      const knowledgeId = resourcePath.split('/')[1];
      const { data: knowledge } = await supabase
        .from('morgy_knowledge')
        .select('*')
        .eq('id', knowledgeId)
        .single();

      if (!knowledge) {
        throw new Error('Knowledge item not found');
      }

      return {
        contents: [
          {
            uri,
            mimeType: 'text/plain',
            text: knowledge.content,
          },
        ],
      };
    }

    throw new Error('Unknown resource path');
  } catch (error: any) {
    return {
      contents: [
        {
          uri,
          mimeType: 'text/plain',
          text: `Error: ${error.message}`,
        },
      ],
    };
  }
});

// ============================================================================
// START SERVER
// ============================================================================

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Morgy MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
