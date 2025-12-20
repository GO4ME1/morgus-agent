/**
 * Context Engineering Utilities
 * 
 * Implements best practices from Manus for optimal context management:
 * 1. KV-Cache optimization (stable prefixes, append-only)
 * 2. Tool masking (state machine for tool availability)
 * 3. Error preservation (keep failures in context)
 * 4. Variation injection (prevent few-shot traps)
 */

/**
 * Deterministic JSON serialization
 * Ensures consistent key ordering for KV-cache optimization
 */
export function deterministicStringify(obj: any): string {
  if (obj === null || typeof obj !== 'object') {
    return JSON.stringify(obj);
  }

  if (Array.isArray(obj)) {
    return '[' + obj.map(deterministicStringify).join(',') + ']';
  }

  const keys = Object.keys(obj).sort();
  const pairs = keys.map(key => {
    const value = deterministicStringify(obj[key]);
    return `"${key}":${value}`;
  });

  return '{' + pairs.join(',') + '}';
}

/**
 * Tool State Machine
 * Manages which tools are available based on current context
 */
export type ToolState = 
  | 'initial'           // Start of conversation
  | 'browsing'          // Currently in browser session
  | 'coding'            // Executing code
  | 'deploying'         // Deploying website
  | 'waiting_user'      // Waiting for user input
  | 'completing';       // Wrapping up task

export interface ToolAvailability {
  available: string[];
  required?: string;
  blocked: string[];
}

/**
 * Get tool availability based on current state
 */
export function getToolAvailability(state: ToolState): ToolAvailability {
  switch (state) {
    case 'initial':
      return {
        available: ['search_web', 'fetch_url', 'execute_code', 'browse_web', 
                    'create_chart', 'search_images', 'generate_image', 
                    'deploy_website', 'list_skills', 'load_skill', 'think'],
        blocked: []
      };

    case 'browsing':
      return {
        available: ['browse_web', 'think'],
        required: 'browse_web',
        blocked: ['deploy_website', 'execute_code']
      };

    case 'coding':
      return {
        available: ['execute_code', 'think'],
        blocked: ['browse_web', 'deploy_website']
      };

    case 'deploying':
      return {
        available: ['deploy_website', 'think'],
        required: 'deploy_website',
        blocked: ['browse_web', 'execute_code']
      };

    case 'waiting_user':
      return {
        available: ['think'],
        blocked: ['browse_web', 'execute_code', 'deploy_website']
      };

    case 'completing':
      return {
        available: ['think'],
        blocked: ['browse_web', 'execute_code', 'deploy_website', 'search_web']
      };

    default:
      return {
        available: [],
        blocked: []
      };
  }
}

/**
 * Determine tool state from recent actions
 */
export function inferToolState(recentToolCalls: string[]): ToolState {
  if (recentToolCalls.length === 0) {
    return 'initial';
  }

  const lastTool = recentToolCalls[recentToolCalls.length - 1];

  if (lastTool.startsWith('browse_')) {
    return 'browsing';
  }

  if (lastTool === 'execute_code') {
    return 'coding';
  }

  if (lastTool === 'deploy_website') {
    return 'deploying';
  }

  return 'initial';
}

/**
 * Variation Templates
 * Prevents few-shot traps by varying serialization
 */
const TOOL_RESULT_TEMPLATES = [
  (name: string, result: string) => `Tool "${name}" returned: ${result}`,
  (name: string, result: string) => `[${name}] Result: ${result}`,
  (name: string, result: string) => `Output from ${name}: ${result}`,
  (name: string, result: string) => `${name} completed with: ${result}`,
];

const STATUS_TEMPLATES = [
  (msg: string) => `🔧 ${msg}`,
  (msg: string) => `⚙️ ${msg}`,
  (msg: string) => `🛠️ ${msg}`,
  (msg: string) => `💡 ${msg}`,
];

/**
 * Get a varied tool result format
 */
export function formatToolResult(name: string, result: string, iteration: number): string {
  const template = TOOL_RESULT_TEMPLATES[iteration % TOOL_RESULT_TEMPLATES.length];
  return template(name, result);
}

/**
 * Get a varied status format
 */
export function formatStatus(message: string, iteration: number): string {
  const template = STATUS_TEMPLATES[iteration % STATUS_TEMPLATES.length];
  return template(message);
}

/**
 * Error Context Preservation
 * Formats errors to be useful for learning
 */
export function formatErrorForContext(
  toolName: string,
  args: any,
  error: string
): string {
  return `⚠️ **Tool Error (${toolName})**
Arguments: ${deterministicStringify(args)}
Error: ${error}

This error should inform future attempts. Consider:
- Different approach or parameters
- Breaking into smaller steps
- Checking prerequisites`;
}

/**
 * Context Compression
 * Compresses old context while preserving restorability
 */
export interface CompressedContext {
  summary: string;
  preservedUrls: string[];
  preservedFilePaths: string[];
  toolCallCount: number;
}

export function compressOldContext(
  messages: Array<{ role: string; content: string }>,
  keepRecent: number = 5
): { compressed: CompressedContext; recent: typeof messages } {
  if (messages.length <= keepRecent) {
    return {
      compressed: {
        summary: '',
        preservedUrls: [],
        preservedFilePaths: [],
        toolCallCount: 0
      },
      recent: messages
    };
  }

  const oldMessages = messages.slice(0, -keepRecent);
  const recentMessages = messages.slice(-keepRecent);

  // Extract URLs and file paths for restoration
  const urlPattern = /https?:\/\/[^\s)]+/g;
  const filePattern = /\/[a-zA-Z0-9_\-./]+\.[a-zA-Z0-9]+/g;

  const urls: string[] = [];
  const files: string[] = [];
  let toolCalls = 0;

  for (const msg of oldMessages) {
    const content = typeof msg.content === 'string' ? msg.content : '';
    
    const foundUrls = content.match(urlPattern) || [];
    urls.push(...foundUrls);

    const foundFiles = content.match(filePattern) || [];
    files.push(...foundFiles);

    if (msg.role === 'tool') {
      toolCalls++;
    }
  }

  return {
    compressed: {
      summary: `[Previous context: ${oldMessages.length} messages, ${toolCalls} tool calls]`,
      preservedUrls: [...new Set(urls)],
      preservedFilePaths: [...new Set(files)],
      toolCallCount: toolCalls
    },
    recent: recentMessages
  };
}

/**
 * Generate restoration hint for compressed context
 */
export function generateRestorationHint(compressed: CompressedContext): string {
  if (!compressed.summary) return '';

  let hint = `\n📦 **Previous Context Summary:**\n${compressed.summary}\n`;

  if (compressed.preservedUrls.length > 0) {
    hint += `\n**Referenced URLs:** ${compressed.preservedUrls.slice(0, 5).join(', ')}`;
    if (compressed.preservedUrls.length > 5) {
      hint += ` (+${compressed.preservedUrls.length - 5} more)`;
    }
  }

  if (compressed.preservedFilePaths.length > 0) {
    hint += `\n**Referenced Files:** ${compressed.preservedFilePaths.slice(0, 5).join(', ')}`;
    if (compressed.preservedFilePaths.length > 5) {
      hint += ` (+${compressed.preservedFilePaths.length - 5} more)`;
    }
  }

  hint += '\n\n*Note: Full content can be re-fetched if needed.*\n';

  return hint;
}
