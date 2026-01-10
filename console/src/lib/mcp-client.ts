// MCP Client - Model Context Protocol client for tool execution

export interface MCPToolResult {
  success: boolean;
  result?: unknown;
  error?: string;
  content?: unknown;
}

export interface MCPTool {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
}

export interface MCPToolCall {
  serverName: string;
  toolName: string;
  arguments: Record<string, unknown>;
}

export interface MCPClient {
  getAvailableTools: () => MCPTool[];
  getToolsForPrompt: () => string;
  parseToolCalls: (message: string) => MCPToolCall[];
  callTool: (call: MCPToolCall) => Promise<MCPToolResult>;
  executeTool: (toolName: string, args: Record<string, unknown>) => Promise<MCPToolResult>;
}

class MCPClientImpl implements MCPClient {
  private tools: MCPTool[] = [];
  private userId: string;
  private accessToken: string;
  private serverUrl: string;

  constructor(userId: string, accessToken: string, serverUrl?: string) {
    this.userId = userId;
    this.accessToken = accessToken;
    // Use production URL by default, fallback to localhost for development
    this.serverUrl = serverUrl || 'https://morgus-deploy.fly.dev';
  }

  async initialize(): Promise<void> {
    console.log('[MCP] Initializing client for user:', this.userId);
    
    try {
      // Fetch available tools from MCP servers
      const response = await fetch(`${this.serverUrl}/api/mcp/tools`, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'x-user-id': this.userId,
        },
      });

      if (!response.ok) {
        console.warn(`[MCP] Failed to fetch tools: ${response.status} ${response.statusText}`);
        this.tools = [];
        return;
      }

      const data = await response.json();
      this.tools = data.tools || [];
      
      console.log(`[MCP] Initialized with ${this.tools.length} tools available`);
    } catch (error) {
      console.warn('[MCP] Failed to initialize, continuing without MCP tools:', error);
      // Don't throw - gracefully degrade if MCP servers aren't available
      this.tools = [];
    }
  }

  getAvailableTools(): MCPTool[] {
    return this.tools;
  }

  getToolsForPrompt(): string {
    if (this.tools.length === 0) {
      return '';
    }
    
    const toolList = this.tools.map(tool => 
      `- ${tool.name}: ${tool.description}`
    ).join('\n');
    
    return `\n\nAvailable MCP Tools:\n${toolList}\n\nTo use a tool, respond with: USE_TOOL: tool_name(arg1="value1", arg2="value2")`;
  }

  parseToolCalls(message: string): MCPToolCall[] {
    const calls: MCPToolCall[] = [];
    
    // Pattern: USE_TOOL: server_name.tool_name(arg1="value1", arg2="value2")
    // Or simpler: USE_TOOL: tool_name(arg1="value1", arg2="value2")
    const toolCallRegex = /USE_TOOL:\s*(?:(\w+)\.)?(\w+)\((.*?)\)/g;
    
    let match;
    while ((match = toolCallRegex.exec(message)) !== null) {
      const serverName = match[1] || 'default';
      const toolName = match[2];
      const argsString = match[3];
      
      // Parse arguments
      const args: Record<string, unknown> = {};
      const argRegex = /(\w+)=["']([^"']+)["']/g;
      let argMatch;
      
      while ((argMatch = argRegex.exec(argsString)) !== null) {
        args[argMatch[1]] = argMatch[2];
      }
      
      calls.push({
        serverName,
        toolName,
        arguments: args,
      });
    }
    
    // Also support JSON format for tool calls
    // Pattern: ```json\n{"tool": "tool_name", "args": {...}}\n```
    const jsonToolRegex = /```json\s*\n\s*\{\s*"tool"\s*:\s*"([^"]+)"\s*,\s*"args"\s*:\s*(\{[^}]+\})\s*\}\s*\n\s*```/g;
    
    while ((match = jsonToolRegex.exec(message)) !== null) {
      try {
        const toolName = match[1];
        const args = JSON.parse(match[2]);
        
        calls.push({
          serverName: 'default',
          toolName,
          arguments: args,
        });
      } catch (error) {
        console.error('[MCP] Failed to parse JSON tool call:', error);
      }
    }
    
    return calls;
  }

  async callTool(call: MCPToolCall): Promise<MCPToolResult> {
    console.log('[MCP] Calling tool:', call.serverName, call.toolName, call.arguments);
    
    try {
      const response = await fetch(`${this.serverUrl}/api/mcp/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.accessToken}`,
        },
        body: JSON.stringify({
          serverName: call.serverName,
          toolName: call.toolName,
          arguments: call.arguments,
        }),
      });

      if (!response.ok) {
        throw new Error(`Tool execution failed: ${response.statusText}`);
      }

      const result = await response.json();
      
      return {
        success: true,
        result: result.result,
        content: result.content,
      };
    } catch (error) {
      console.error('[MCP] Tool execution failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        content: null,
      };
    }
  }

  async executeTool(toolName: string, args: Record<string, unknown>): Promise<MCPToolResult> {
    console.log('[MCP] Executing tool:', toolName, args);
    
    // Find the tool to determine which server it belongs to
    const tool = this.tools.find(t => t.name === toolName);
    
    if (!tool) {
      return {
        success: false,
        error: `Tool not found: ${toolName}`,
        content: null,
      };
    }
    
    // Extract server name from tool name if it's in format "server.tool"
    const parts = toolName.split('.');
    const serverName = parts.length > 1 ? parts[0] : 'default';
    const actualToolName = parts.length > 1 ? parts[1] : toolName;
    
    return this.callTool({
      serverName,
      toolName: actualToolName,
      arguments: args,
    });
  }
}

export async function getMCPClient(userId: string, accessToken: string, serverUrl?: string): Promise<MCPClient> {
  const client = new MCPClientImpl(userId, accessToken, serverUrl);
  await client.initialize();
  return client;
}

// Helper function to format MCP tool results for display
export function formatMCPResult(result: MCPToolResult): string {
  if (!result.success) {
    return `❌ Error: ${result.error}`;
  }
  
  if (typeof result.content === 'string') {
    return result.content;
  }
  
  if (result.result) {
    return JSON.stringify(result.result, null, 2);
  }
  
  return '✅ Tool executed successfully';
}

// Helper function to check if a message contains tool calls
export function hasToolCalls(message: string): boolean {
  return message.includes('USE_TOOL:') || /```json\s*\n\s*\{\s*"tool"\s*:/.test(message);
}
