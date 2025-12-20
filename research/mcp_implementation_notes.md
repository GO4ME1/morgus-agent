# MCP Implementation Notes for Morgus

## Overview

The Model Context Protocol (MCP) is an open standard that enables AI applications to connect to external data sources and tools in a standardized way.

## Key Packages

For v1 (production-ready):
- `@modelcontextprotocol/sdk` - Combined client/server SDK

For v2 (in development, Q1 2026):
- `@modelcontextprotocol/server` - Build MCP servers
- `@modelcontextprotocol/client` - Build MCP clients

**Recommendation:** Use v1.x for production since v2 is pre-alpha.

## MCP Architecture

MCP uses JSON-RPC 2.0 as its underlying protocol. Key concepts:

1. **Hosts** - Applications that use LLMs (like Morgus)
2. **Clients** - Protocol clients that maintain connections to servers
3. **Servers** - Services that provide tools, resources, and prompts

## Transport Options

1. **stdio** - Standard input/output for local processes
2. **Streamable HTTP** - HTTP-based transport for remote servers
3. **SSE** - Server-Sent Events for streaming

## Implementation Plan for Morgus

### Phase 1: Basic MCP Client
1. Install `@modelcontextprotocol/sdk` (v1.x)
2. Create MCP client module in worker
3. Support stdio transport for local MCP servers
4. Support HTTP transport for remote MCP servers

### Phase 2: Tool Discovery
1. Connect to MCP servers
2. Discover available tools
3. Register tools with Morgus tool registry
4. Execute tools via MCP protocol

### Phase 3: User Configuration
1. Allow users to configure MCP servers
2. Store server configurations
3. Auto-connect on task start

## Code Example (v1.x)

```typescript
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

// Create client
const client = new Client({
  name: "morgus-agent",
  version: "1.0.0"
});

// Connect via stdio
const transport = new StdioClientTransport({
  command: "npx",
  args: ["-y", "@modelcontextprotocol/server-filesystem", "/path/to/dir"]
});

await client.connect(transport);

// List available tools
const tools = await client.listTools();

// Call a tool
const result = await client.callTool({
  name: "read_file",
  arguments: { path: "/path/to/file.txt" }
});
```

## Available MCP Servers

Popular pre-built MCP servers:
- `@modelcontextprotocol/server-filesystem` - File system access
- `@modelcontextprotocol/server-github` - GitHub integration
- `@modelcontextprotocol/server-postgres` - PostgreSQL access
- `@modelcontextprotocol/server-slack` - Slack integration
- `@modelcontextprotocol/server-google-drive` - Google Drive access

## Cloudflare Worker Considerations

Since Morgus runs on Cloudflare Workers:
1. **No stdio support** - Workers can't spawn local processes
2. **HTTP transport only** - Must use Streamable HTTP or SSE
3. **External MCP servers** - Users must run MCP servers externally

Alternative approach:
- Create a "MCP Proxy" service that users can self-host
- Proxy connects to local MCP servers and exposes them via HTTP
- Morgus connects to the proxy via HTTP

