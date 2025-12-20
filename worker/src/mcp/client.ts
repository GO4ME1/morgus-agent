/**
 * MCP (Model Context Protocol) Client for Morgus
 * 
 * Enables Morgus to connect to external MCP servers and use their tools.
 * Since Morgus runs on Cloudflare Workers, we only support HTTP-based transports.
 * 
 * Based on the MCP specification: https://modelcontextprotocol.io
 */

export interface MCPServerConfig {
  id: string;
  name: string;
  url: string;
  apiKey?: string;
  enabled: boolean;
}

export interface MCPTool {
  name: string;
  description: string;
  inputSchema: {
    type: string;
    properties: Record<string, unknown>;
    required?: string[];
  };
  serverId: string;
}

export interface MCPResource {
  uri: string;
  name: string;
  description?: string;
  mimeType?: string;
  serverId: string;
}

export interface MCPPrompt {
  name: string;
  description?: string;
  arguments?: Array<{
    name: string;
    description?: string;
    required?: boolean;
  }>;
  serverId: string;
}

interface JSONRPCRequest {
  jsonrpc: '2.0';
  id: number;
  method: string;
  params?: Record<string, unknown>;
}

interface JSONRPCResponse {
  jsonrpc: '2.0';
  id: number;
  result?: unknown;
  error?: {
    code: number;
    message: string;
    data?: unknown;
  };
}

/**
 * MCP Client for connecting to MCP servers via HTTP
 */
export class MCPClient {
  private servers: Map<string, MCPServerConfig> = new Map();
  private tools: Map<string, MCPTool> = new Map();
  private resources: Map<string, MCPResource> = new Map();
  private prompts: Map<string, MCPPrompt> = new Map();
  private requestId = 0;

  constructor() {}

  /**
   * Add an MCP server configuration
   */
  addServer(config: MCPServerConfig): void {
    this.servers.set(config.id, config);
  }

  /**
   * Remove an MCP server
   */
  removeServer(serverId: string): void {
    this.servers.delete(serverId);
    // Remove tools from this server
    for (const [key, tool] of this.tools) {
      if (tool.serverId === serverId) {
        this.tools.delete(key);
      }
    }
  }

  /**
   * Get all configured servers
   */
  getServers(): MCPServerConfig[] {
    return Array.from(this.servers.values());
  }

  /**
   * Send a JSON-RPC request to an MCP server
   */
  private async sendRequest(
    server: MCPServerConfig,
    method: string,
    params?: Record<string, unknown>
  ): Promise<unknown> {
    const request: JSONRPCRequest = {
      jsonrpc: '2.0',
      id: ++this.requestId,
      method,
      params
    };

    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };

    if (server.apiKey) {
      headers['Authorization'] = `Bearer ${server.apiKey}`;
    }

    try {
      const response = await fetch(server.url, {
        method: 'POST',
        headers,
        body: JSON.stringify(request)
      });

      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status} ${response.statusText}`);
      }

      const jsonResponse = await response.json() as JSONRPCResponse;

      if (jsonResponse.error) {
        throw new Error(`MCP error: ${jsonResponse.error.message}`);
      }

      return jsonResponse.result;
    } catch (error) {
      console.error(`MCP request failed for ${server.name}:`, error);
      throw error;
    }
  }

  /**
   * Initialize connection to an MCP server
   */
  async initializeServer(serverId: string): Promise<void> {
    const server = this.servers.get(serverId);
    if (!server) {
      throw new Error(`Server ${serverId} not found`);
    }

    // Send initialize request
    await this.sendRequest(server, 'initialize', {
      protocolVersion: '2024-11-05',
      capabilities: {
        tools: {},
        resources: {},
        prompts: {}
      },
      clientInfo: {
        name: 'morgus-agent',
        version: '2.0.0'
      }
    });

    // Send initialized notification
    await this.sendRequest(server, 'notifications/initialized', {});
  }

  /**
   * Discover tools from an MCP server
   */
  async discoverTools(serverId: string): Promise<MCPTool[]> {
    const server = this.servers.get(serverId);
    if (!server) {
      throw new Error(`Server ${serverId} not found`);
    }

    const result = await this.sendRequest(server, 'tools/list', {}) as {
      tools: Array<{
        name: string;
        description: string;
        inputSchema: {
          type: string;
          properties: Record<string, unknown>;
          required?: string[];
        };
      }>;
    };

    const tools: MCPTool[] = result.tools.map(tool => ({
      ...tool,
      serverId
    }));

    // Register tools
    for (const tool of tools) {
      const toolKey = `${serverId}:${tool.name}`;
      this.tools.set(toolKey, tool);
    }

    return tools;
  }

  /**
   * Discover resources from an MCP server
   */
  async discoverResources(serverId: string): Promise<MCPResource[]> {
    const server = this.servers.get(serverId);
    if (!server) {
      throw new Error(`Server ${serverId} not found`);
    }

    const result = await this.sendRequest(server, 'resources/list', {}) as {
      resources: Array<{
        uri: string;
        name: string;
        description?: string;
        mimeType?: string;
      }>;
    };

    const resources: MCPResource[] = result.resources.map(resource => ({
      ...resource,
      serverId
    }));

    // Register resources
    for (const resource of resources) {
      const resourceKey = `${serverId}:${resource.uri}`;
      this.resources.set(resourceKey, resource);
    }

    return resources;
  }

  /**
   * Discover prompts from an MCP server
   */
  async discoverPrompts(serverId: string): Promise<MCPPrompt[]> {
    const server = this.servers.get(serverId);
    if (!server) {
      throw new Error(`Server ${serverId} not found`);
    }

    const result = await this.sendRequest(server, 'prompts/list', {}) as {
      prompts: Array<{
        name: string;
        description?: string;
        arguments?: Array<{
          name: string;
          description?: string;
          required?: boolean;
        }>;
      }>;
    };

    const prompts: MCPPrompt[] = result.prompts.map(prompt => ({
      ...prompt,
      serverId
    }));

    // Register prompts
    for (const prompt of prompts) {
      const promptKey = `${serverId}:${prompt.name}`;
      this.prompts.set(promptKey, prompt);
    }

    return prompts;
  }

  /**
   * Call a tool on an MCP server
   */
  async callTool(
    serverId: string,
    toolName: string,
    args: Record<string, unknown>
  ): Promise<unknown> {
    const server = this.servers.get(serverId);
    if (!server) {
      throw new Error(`Server ${serverId} not found`);
    }

    const result = await this.sendRequest(server, 'tools/call', {
      name: toolName,
      arguments: args
    });

    return result;
  }

  /**
   * Read a resource from an MCP server
   */
  async readResource(serverId: string, uri: string): Promise<unknown> {
    const server = this.servers.get(serverId);
    if (!server) {
      throw new Error(`Server ${serverId} not found`);
    }

    const result = await this.sendRequest(server, 'resources/read', {
      uri
    });

    return result;
  }

  /**
   * Get a prompt from an MCP server
   */
  async getPrompt(
    serverId: string,
    promptName: string,
    args?: Record<string, string>
  ): Promise<unknown> {
    const server = this.servers.get(serverId);
    if (!server) {
      throw new Error(`Server ${serverId} not found`);
    }

    const result = await this.sendRequest(server, 'prompts/get', {
      name: promptName,
      arguments: args
    });

    return result;
  }

  /**
   * Get all discovered tools
   */
  getAllTools(): MCPTool[] {
    return Array.from(this.tools.values());
  }

  /**
   * Get all discovered resources
   */
  getAllResources(): MCPResource[] {
    return Array.from(this.resources.values());
  }

  /**
   * Get all discovered prompts
   */
  getAllPrompts(): MCPPrompt[] {
    return Array.from(this.prompts.values());
  }

  /**
   * Connect to all enabled servers and discover their capabilities
   */
  async connectAll(): Promise<{
    tools: MCPTool[];
    resources: MCPResource[];
    prompts: MCPPrompt[];
    errors: Array<{ serverId: string; error: string }>;
  }> {
    const tools: MCPTool[] = [];
    const resources: MCPResource[] = [];
    const prompts: MCPPrompt[] = [];
    const errors: Array<{ serverId: string; error: string }> = [];

    for (const server of this.servers.values()) {
      if (!server.enabled) continue;

      try {
        await this.initializeServer(server.id);
        
        const serverTools = await this.discoverTools(server.id);
        tools.push(...serverTools);

        try {
          const serverResources = await this.discoverResources(server.id);
          resources.push(...serverResources);
        } catch {
          // Resources might not be supported
        }

        try {
          const serverPrompts = await this.discoverPrompts(server.id);
          prompts.push(...serverPrompts);
        } catch {
          // Prompts might not be supported
        }
      } catch (error) {
        errors.push({
          serverId: server.id,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }

    return { tools, resources, prompts, errors };
  }

  /**
   * Generate tool definitions for the agent's tool registry
   */
  generateToolDefinitions(): Array<{
    name: string;
    description: string;
    parameters: {
      type: string;
      properties: Record<string, unknown>;
      required?: string[];
    };
    handler: (args: Record<string, unknown>) => Promise<unknown>;
  }> {
    const definitions = [];

    for (const tool of this.tools.values()) {
      definitions.push({
        name: `mcp_${tool.serverId}_${tool.name}`,
        description: `[MCP: ${tool.serverId}] ${tool.description}`,
        parameters: tool.inputSchema,
        handler: async (args: Record<string, unknown>) => {
          return this.callTool(tool.serverId, tool.name, args);
        }
      });
    }

    return definitions;
  }

  /**
   * List all MCP capabilities in a formatted string
   */
  listCapabilities(): string {
    let output = '# 🔌 MCP (Model Context Protocol) Connections\n\n';

    const servers = this.getServers();
    if (servers.length === 0) {
      output += 'No MCP servers configured.\n\n';
      output += 'To connect to MCP servers, configure them in your settings.\n';
      return output;
    }

    output += `Connected to **${servers.filter(s => s.enabled).length}** MCP servers.\n\n`;

    // List tools by server
    output += '## 🛠️ Available Tools\n\n';
    for (const server of servers) {
      if (!server.enabled) continue;
      
      const serverTools = Array.from(this.tools.values()).filter(t => t.serverId === server.id);
      if (serverTools.length > 0) {
        output += `### ${server.name}\n`;
        for (const tool of serverTools) {
          output += `- **${tool.name}**: ${tool.description}\n`;
        }
        output += '\n';
      }
    }

    // List resources by server
    const allResources = this.getAllResources();
    if (allResources.length > 0) {
      output += '## 📁 Available Resources\n\n';
      for (const server of servers) {
        if (!server.enabled) continue;
        
        const serverResources = allResources.filter(r => r.serverId === server.id);
        if (serverResources.length > 0) {
          output += `### ${server.name}\n`;
          for (const resource of serverResources) {
            output += `- **${resource.name}**: ${resource.uri}\n`;
          }
          output += '\n';
        }
      }
    }

    return output;
  }
}

// Export singleton instance
export const mcpClient = new MCPClient();
