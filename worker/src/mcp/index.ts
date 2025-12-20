/**
 * MCP (Model Context Protocol) Module for Morgus
 * 
 * Provides MCP client functionality for connecting to external MCP servers
 * and using their tools, resources, and prompts.
 */

export { MCPClient, mcpClient } from './client';
export type { MCPServerConfig, MCPTool, MCPResource, MCPPrompt } from './client';

export {
  listMCPServers,
  addMCPServer,
  removeMCPServer,
  callMCPTool,
  readMCPResource,
  getMCPPrompt,
  mcpToolDefinitions,
  executeMCPTool
} from './tools';
export type { MCPToolResult } from './tools';
