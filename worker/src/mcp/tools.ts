/**
 * MCP Tools for Morgus Agent
 * 
 * Provides tools for managing MCP server connections and using MCP capabilities.
 */

import { mcpClient, MCPServerConfig } from './client';

export interface MCPToolResult {
  success: boolean;
  message: string;
  data?: unknown;
}

/**
 * List all configured MCP servers and their capabilities
 */
export async function listMCPServers(): Promise<MCPToolResult> {
  const servers = mcpClient.getServers();
  
  if (servers.length === 0) {
    return {
      success: true,
      message: 'No MCP servers configured. Use add_mcp_server to connect to an MCP server.',
      data: { servers: [] }
    };
  }

  const capabilities = mcpClient.listCapabilities();
  
  return {
    success: true,
    message: capabilities,
    data: {
      servers: servers.map(s => ({
        id: s.id,
        name: s.name,
        url: s.url,
        enabled: s.enabled
      })),
      tools: mcpClient.getAllTools(),
      resources: mcpClient.getAllResources(),
      prompts: mcpClient.getAllPrompts()
    }
  };
}

/**
 * Add a new MCP server connection
 */
export async function addMCPServer(
  id: string,
  name: string,
  url: string,
  apiKey?: string
): Promise<MCPToolResult> {
  try {
    const config: MCPServerConfig = {
      id,
      name,
      url,
      apiKey,
      enabled: true
    };

    mcpClient.addServer(config);
    
    // Try to connect and discover capabilities
    await mcpClient.initializeServer(id);
    const tools = await mcpClient.discoverTools(id);
    
    let resources: unknown[] = [];
    let prompts: unknown[] = [];
    
    try {
      resources = await mcpClient.discoverResources(id);
    } catch {
      // Resources not supported
    }
    
    try {
      prompts = await mcpClient.discoverPrompts(id);
    } catch {
      // Prompts not supported
    }

    return {
      success: true,
      message: `Successfully connected to MCP server "${name}". Discovered ${tools.length} tools, ${resources.length} resources, and ${prompts.length} prompts.`,
      data: {
        serverId: id,
        tools: tools.length,
        resources: resources.length,
        prompts: prompts.length
      }
    };
  } catch (error) {
    // Remove the server if connection failed
    mcpClient.removeServer(id);
    
    return {
      success: false,
      message: `Failed to connect to MCP server: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}

/**
 * Remove an MCP server connection
 */
export async function removeMCPServer(serverId: string): Promise<MCPToolResult> {
  const servers = mcpClient.getServers();
  const server = servers.find(s => s.id === serverId);
  
  if (!server) {
    return {
      success: false,
      message: `MCP server "${serverId}" not found.`
    };
  }

  mcpClient.removeServer(serverId);
  
  return {
    success: true,
    message: `Successfully disconnected from MCP server "${server.name}".`
  };
}

/**
 * Call a tool on an MCP server
 */
export async function callMCPTool(
  serverId: string,
  toolName: string,
  args: Record<string, unknown>
): Promise<MCPToolResult> {
  try {
    const result = await mcpClient.callTool(serverId, toolName, args);
    
    return {
      success: true,
      message: `Successfully called tool "${toolName}" on server "${serverId}".`,
      data: result
    };
  } catch (error) {
    return {
      success: false,
      message: `Failed to call MCP tool: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}

/**
 * Read a resource from an MCP server
 */
export async function readMCPResource(
  serverId: string,
  uri: string
): Promise<MCPToolResult> {
  try {
    const result = await mcpClient.readResource(serverId, uri);
    
    return {
      success: true,
      message: `Successfully read resource "${uri}" from server "${serverId}".`,
      data: result
    };
  } catch (error) {
    return {
      success: false,
      message: `Failed to read MCP resource: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}

/**
 * Get a prompt from an MCP server
 */
export async function getMCPPrompt(
  serverId: string,
  promptName: string,
  args?: Record<string, string>
): Promise<MCPToolResult> {
  try {
    const result = await mcpClient.getPrompt(serverId, promptName, args);
    
    return {
      success: true,
      message: `Successfully retrieved prompt "${promptName}" from server "${serverId}".`,
      data: result
    };
  } catch (error) {
    return {
      success: false,
      message: `Failed to get MCP prompt: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}

/**
 * Tool definitions for the agent
 */
export const mcpToolDefinitions = [
  {
    name: 'list_mcp_servers',
    description: 'List all configured MCP (Model Context Protocol) servers and their available tools, resources, and prompts. Use this to see what external capabilities are available.',
    parameters: {
      type: 'object',
      properties: {},
      required: []
    }
  },
  {
    name: 'add_mcp_server',
    description: 'Connect to a new MCP server. MCP servers provide external tools, resources, and prompts that extend the agent\'s capabilities. Requires the server URL and optionally an API key.',
    parameters: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          description: 'Unique identifier for this server connection (e.g., "github", "filesystem")'
        },
        name: {
          type: 'string',
          description: 'Human-readable name for the server (e.g., "GitHub Integration")'
        },
        url: {
          type: 'string',
          description: 'The HTTP URL of the MCP server endpoint'
        },
        apiKey: {
          type: 'string',
          description: 'Optional API key for authentication'
        }
      },
      required: ['id', 'name', 'url']
    }
  },
  {
    name: 'remove_mcp_server',
    description: 'Disconnect from an MCP server and remove its tools from the available capabilities.',
    parameters: {
      type: 'object',
      properties: {
        serverId: {
          type: 'string',
          description: 'The ID of the server to disconnect'
        }
      },
      required: ['serverId']
    }
  },
  {
    name: 'call_mcp_tool',
    description: 'Call a tool on a connected MCP server. Use list_mcp_servers first to see available tools.',
    parameters: {
      type: 'object',
      properties: {
        serverId: {
          type: 'string',
          description: 'The ID of the MCP server'
        },
        toolName: {
          type: 'string',
          description: 'The name of the tool to call'
        },
        args: {
          type: 'object',
          description: 'Arguments to pass to the tool'
        }
      },
      required: ['serverId', 'toolName', 'args']
    }
  },
  {
    name: 'read_mcp_resource',
    description: 'Read a resource from a connected MCP server. Resources are data sources like files, database records, or API responses.',
    parameters: {
      type: 'object',
      properties: {
        serverId: {
          type: 'string',
          description: 'The ID of the MCP server'
        },
        uri: {
          type: 'string',
          description: 'The URI of the resource to read'
        }
      },
      required: ['serverId', 'uri']
    }
  }
];

/**
 * Execute an MCP tool by name
 */
export async function executeMCPTool(
  toolName: string,
  args: Record<string, unknown>
): Promise<MCPToolResult> {
  switch (toolName) {
    case 'list_mcp_servers':
      return listMCPServers();
    
    case 'add_mcp_server':
      return addMCPServer(
        args.id as string,
        args.name as string,
        args.url as string,
        args.apiKey as string | undefined
      );
    
    case 'remove_mcp_server':
      return removeMCPServer(args.serverId as string);
    
    case 'call_mcp_tool':
      return callMCPTool(
        args.serverId as string,
        args.toolName as string,
        args.args as Record<string, unknown>
      );
    
    case 'read_mcp_resource':
      return readMCPResource(
        args.serverId as string,
        args.uri as string
      );
    
    default:
      return {
        success: false,
        message: `Unknown MCP tool: ${toolName}`
      };
  }
}
