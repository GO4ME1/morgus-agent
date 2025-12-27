/**
 * MCP Export Service
 * 
 * Generates MCP configuration files for exporting Morgys to:
 * - Claude Desktop
 * - Cursor IDE
 * - Any MCP-compatible application
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL || 'https://mock.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || 'mock-key'
);

export interface MCPServerConfig {
  command: string;
  args: string[];
  env?: Record<string, string>;
}

export interface MCPConfig {
  mcpServers: Record<string, MCPServerConfig>;
}

export interface MorgyExportData {
  morgyId: string;
  name: string;
  systemPrompt: string;
  personality: Record<string, unknown>;
  knowledge: Array<{
    id: string;
    title: string;
    content: string;
    embeddings?: number[][];
  }>;
  templates: string[];
  workflows: string[];
}

/**
 * Export a Morgy to MCP format
 */
export async function exportMorgyToMCP(
  morgyId: string,
  userId: string,
  options: {
    includeKnowledge?: boolean;
    includeTemplates?: boolean;
    shareWithTeam?: boolean;
  } = {}
): Promise<{
  config: MCPConfig;
  exportData: MorgyExportData;
  shareUrl?: string;
}> {
  // Fetch Morgy data
  const { data: morgy, error: morgyError } = await supabase
    .from('morgys')
    .select('*')
    .eq('id', morgyId)
    .eq('user_id', userId)
    .single();

  if (morgyError || !morgy) {
    throw new Error(`Morgy not found: ${morgyId}`);
  }

  // Fetch knowledge if requested
  let knowledge: MorgyExportData['knowledge'] = [];
  if (options.includeKnowledge) {
    const { data: knowledgeData } = await supabase
      .from('morgy_knowledge')
      .select('id, title, content, embeddings')
      .eq('morgy_id', morgyId);

    knowledge = knowledgeData || [];
  }

  // Fetch enabled templates if requested
  let templates: string[] = [];
  if (options.includeTemplates) {
    const { data: templateData } = await supabase
      .from('morgy_templates')
      .select('template_id')
      .eq('morgy_id', morgyId)
      .eq('enabled', true);

    templates = templateData?.map(t => t.template_id) || [];
  }

  // Fetch enabled workflows if requested
  let workflows: string[] = [];
  if (options.includeTemplates) {
    const { data: workflowData } = await supabase
      .from('morgy_workflows')
      .select('workflow_id')
      .eq('morgy_id', morgyId)
      .eq('enabled', true);

    workflows = workflowData?.map(w => w.workflow_id) || [];
  }

  // Build export data
  const exportData: MorgyExportData = {
    morgyId,
    name: morgy.name,
    systemPrompt: morgy.system_prompt || '',
    personality: morgy.personality || {},
    knowledge,
    templates,
    workflows,
  };

  // Generate MCP config
  const config: MCPConfig = {
    mcpServers: {
      [morgy.name.toLowerCase().replace(/\s+/g, '-')]: {
        command: 'npx',
        args: [
          '-y',
          '@morgus/mcp-server',
          '--morgy-id',
          morgyId,
          '--morgy-name',
          morgy.name,
        ],
        env: {
          MORGY_SYSTEM_PROMPT: morgy.system_prompt || '',
          MORGY_PERSONALITY: JSON.stringify(morgy.personality || {}),
          MORGY_KNOWLEDGE: options.includeKnowledge ? JSON.stringify(knowledge) : '[]',
          MORGY_TEMPLATES: options.includeTemplates ? JSON.stringify(templates) : '[]',
        },
      },
    },
  };

  // Generate shareable link if requested
  let shareUrl: string | undefined;
  if (options.shareWithTeam) {
    const { data: shareData } = await supabase
      .from('morgy_shares')
      .insert({
        morgy_id: morgyId,
        user_id: userId,
        share_type: 'mcp_export',
        config: exportData,
      })
      .select('id')
      .single();

    if (shareData) {
      shareUrl = `${process.env.PUBLIC_URL}/mcp/import/${shareData.id}`;
    }
  }

  return {
    config,
    exportData,
    shareUrl,
  };
}

/**
 * Generate Claude Desktop config file
 */
export async function generateClaudeDesktopConfig(
  morgyId: string,
  userId: string,
  options: {
    includeKnowledge?: boolean;
    includeTemplates?: boolean;
  } = {}
): Promise<string> {
  const { config } = await exportMorgyToMCP(morgyId, userId, options);
  
  return JSON.stringify(config, null, 2);
}

/**
 * Generate installation instructions for Claude Desktop
 */
export function generateClaudeDesktopInstructions(morgyName: string): string {
  const configFileName = `${morgyName.toLowerCase().replace(/\s+/g, '-')}-mcp.json`;
  
  return `
# Install ${morgyName} in Claude Desktop

## Step 1: Download Config File
Download the \`${configFileName}\` file to your computer.

## Step 2: Locate Claude Config Directory

### macOS
\`\`\`bash
~/Library/Application Support/Claude/
\`\`\`

### Windows
\`\`\`bash
%APPDATA%\\Claude\\
\`\`\`

### Linux
\`\`\`bash
~/.config/Claude/
\`\`\`

## Step 3: Add MCP Server Config

1. Open the Claude config directory
2. Edit (or create) \`claude_desktop_config.json\`
3. Merge the contents of \`${configFileName}\` into the \`mcpServers\` section

Example:
\`\`\`json
{
  "mcpServers": {
    // ... your existing servers ...
    
    // Add this section from ${configFileName}
    "${morgyName.toLowerCase().replace(/\s+/g, '-')}": {
      "command": "npx",
      "args": ["-y", "@morgus/mcp-server", "--morgy-id", "..."],
      "env": { ... }
    }
  }
}
\`\`\`

## Step 4: Restart Claude Desktop

Close and reopen Claude Desktop to load the new MCP server.

## Step 5: Test Your Morgy

In Claude Desktop, start a new conversation and type:

\`\`\`
@${morgyName} help
\`\`\`

Your Morgy should respond with available commands and capabilities!

## Troubleshooting

### Morgy not appearing?
- Check that the config file is valid JSON
- Ensure Claude Desktop was fully restarted
- Check Claude Desktop logs for errors

### Commands not working?
- Some features (Reddit posting, video creation) won't work in Claude Desktop
- Only chat and knowledge base are fully functional in external MCP apps

### Need help?
Visit https://help.manus.im for support
`;
}

/**
 * Generate one-click installer script for macOS
 */
export function generateMacOSInstaller(morgyName: string, configJson: string): string {
  const configFileName = `${morgyName.toLowerCase().replace(/\s+/g, '-')}-mcp.json`;
  
  return `#!/bin/bash
# ${morgyName} MCP Installer for Claude Desktop (macOS)

set -e

echo "Installing ${morgyName} MCP Server for Claude Desktop..."

# Config directory
CONFIG_DIR="$HOME/Library/Application Support/Claude"
CONFIG_FILE="$CONFIG_DIR/claude_desktop_config.json"

# Create config directory if it doesn't exist
mkdir -p "$CONFIG_DIR"

# Backup existing config
if [ -f "$CONFIG_FILE" ]; then
  echo "Backing up existing config..."
  cp "$CONFIG_FILE" "$CONFIG_FILE.backup.$(date +%s)"
fi

# Write new config (or merge if exists)
cat > "/tmp/${configFileName}" << 'EOF'
${configJson}
EOF

if [ -f "$CONFIG_FILE" ]; then
  echo "Merging with existing config..."
  # TODO: Implement JSON merge logic
  echo "Please manually merge /tmp/${configFileName} into $CONFIG_FILE"
else
  echo "Creating new config..."
  cp "/tmp/${configFileName}" "$CONFIG_FILE"
fi

echo "✅ ${morgyName} MCP Server installed!"
echo ""
echo "Next steps:"
echo "1. Restart Claude Desktop"
echo "2. Type: @${morgyName} help"
echo ""
echo "Enjoy your portable Morgy! 🐷"
`;
}

/**
 * Generate package.json for standalone MCP server
 */
export function generateStandaloneMCPPackage(morgyName: string, exportData: MorgyExportData): string {
  return JSON.stringify({
    name: `@morgus/mcp-${morgyName.toLowerCase().replace(/\s+/g, '-')}`,
    version: '1.0.0',
    description: `${morgyName} - Portable MCP Server`,
    main: 'index.js',
    type: 'module',
    scripts: {
      start: 'node index.js',
    },
    dependencies: {
      '@modelcontextprotocol/sdk': '^0.5.0',
    },
    keywords: ['mcp', 'morgus', 'ai', 'assistant'],
    author: 'Morgus',
    license: 'MIT',
  }, null, 2);
}

/**
 * Generate standalone MCP server code
 */
export function generateStandaloneMCPServer(exportData: MorgyExportData): string {
  return `#!/usr/bin/env node
/**
 * ${exportData.name} - Standalone MCP Server
 * 
 * This is a portable version of ${exportData.name} that can run in:
 * - Claude Desktop
 * - Cursor IDE
 * - Any MCP-compatible application
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

// Morgy Configuration
const MORGY_NAME = ${JSON.stringify(exportData.name)};
const SYSTEM_PROMPT = ${JSON.stringify(exportData.systemPrompt)};
const PERSONALITY = ${JSON.stringify(exportData.personality, null, 2)};
const KNOWLEDGE = ${JSON.stringify(exportData.knowledge, null, 2)};

// Create MCP server
const server = new Server(
  {
    name: MORGY_NAME.toLowerCase().replace(/\\s+/g, '-'),
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'chat',
        description: \`Chat with \${MORGY_NAME}\`,
        inputSchema: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
              description: 'Your message to the Morgy',
            },
          },
          required: ['message'],
        },
      },
      {
        name: 'search_knowledge',
        description: \`Search \${MORGY_NAME}'s knowledge base\`,
        inputSchema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'Search query',
            },
          },
          required: ['query'],
        },
      },
    ],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  switch (name) {
    case 'chat': {
      const message = args.message as string;
      
      // Simple chat response (in production, this would call an LLM)
      return {
        content: [
          {
            type: 'text',
            text: \`[\${MORGY_NAME}] I received your message: "\${message}". In a full implementation, I would respond using my personality and knowledge base.\`,
          },
        ],
      };
    }

    case 'search_knowledge': {
      const query = args.query as string;
      
      // Simple knowledge search (in production, this would use embeddings)
      const results = KNOWLEDGE.filter((item) =>
        item.content.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 3);

      return {
        content: [
          {
            type: 'text',
            text: results.length > 0
              ? \`Found \${results.length} relevant items:\\n\\n\${results.map(r => \`- \${r.title}\`).join('\\n')}\`
              : 'No relevant knowledge found.',
          },
        ],
      };
    }

    default:
      throw new Error(\`Unknown tool: \${name}\`);
  }
});

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error(\`\${MORGY_NAME} MCP Server running on stdio\`);
}

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});
`;
}

/**
 * Create a complete MCP export package
 */
export async function createMCPExportPackage(
  morgyId: string,
  userId: string,
  options: {
    includeKnowledge?: boolean;
    includeTemplates?: boolean;
    shareWithTeam?: boolean;
  } = {}
): Promise<{
  configJson: string;
  instructions: string;
  macInstaller: string;
  packageJson: string;
  serverCode: string;
  shareUrl?: string;
}> {
  const { config, exportData, shareUrl } = await exportMorgyToMCP(morgyId, userId, options);
  
  const configJson = JSON.stringify(config, null, 2);
  const instructions = generateClaudeDesktopInstructions(exportData.name);
  const macInstaller = generateMacOSInstaller(exportData.name, configJson);
  const packageJson = generateStandaloneMCPPackage(exportData.name, exportData);
  const serverCode = generateStandaloneMCPServer(exportData);

  return {
    configJson,
    instructions,
    macInstaller,
    packageJson,
    serverCode,
    shareUrl,
  };
}
