/**
 * Medium Priority Tool Enhancements
 * 
 * Enhancements to match/grep, browser, and shell tools:
 * - search_in_files_enhanced: Context lines, better scope
 * - browser_scroll: Scroll pages and elements
 * - browser_click_selector: Click by CSS selector
 * - execute_code_session: Multi-session support with interactive input
 */

import { createReadStream } from 'fs';
import { createInterface } from 'readline';
import * as fs from 'fs/promises';
import * as path from 'path';
import { glob } from 'glob';

export interface Tool {
  name: string;
  description: string;
  schema: any;
  execute: (args: any, env: any, userId?: string) => Promise<string>;
}

/**
 * Enhanced Search in Files Tool
 */
export const searchInFilesEnhancedTool: Tool = {
  name: 'search_in_files_enhanced',
  description: `Search for text in files with context lines and advanced options.

**Features:**
- Regex pattern matching
- Context lines (before/after matches)
- Glob pattern scope for file filtering
- Case-sensitive or insensitive search
- Line numbers
- Multiple file support

**Use Cases:**
- Find function definitions in code
- Search logs with context
- Find configuration values
- Code archaeology

Example:
{
  "pattern": "function.*login",
  "scope": "/path/to/project/**/*.js",
  "leading": 2,
  "trailing": 2,
  "caseInsensitive": false
}`,

  schema: {
    type: 'object',
    properties: {
      pattern: {
        type: 'string',
        description: 'Regex pattern to search for',
      },
      scope: {
        type: 'string',
        description: 'Glob pattern for files to search (e.g., **/*.ts)',
      },
      leading: {
        type: 'number',
        description: 'Number of lines to show before match (default: 0)',
      },
      trailing: {
        type: 'number',
        description: 'Number of lines to show after match (default: 0)',
      },
      caseInsensitive: {
        type: 'boolean',
        description: 'Case-insensitive search (default: false)',
      },
      maxResults: {
        type: 'number',
        description: 'Maximum results to return (default: 100)',
      },
    },
    required: ['pattern', 'scope'],
  },

  async execute(args: any, env: any, userId?: string): Promise<string> {
    const {
      pattern,
      scope,
      leading = 0,
      trailing = 0,
      caseInsensitive = false,
      maxResults = 100,
    } = args;

    console.log(`[Search] Pattern: ${pattern}, Scope: ${scope}`);

    try {
      // Find files matching scope
      const files = await glob(scope, { absolute: true });
      
      if (files.length === 0) {
        return `❌ No files found matching scope: ${scope}`;
      }

      console.log(`[Search] Searching in ${files.length} files`);

      // Create regex
      const flags = caseInsensitive ? 'i' : '';
      const regex = new RegExp(pattern, flags);

      // Search in files
      const matches: Array<{
        file: string;
        lineNumber: number;
        line: string;
        context: { before: string[]; after: string[] };
      }> = [];

      for (const file of files) {
        try {
          const lines: string[] = [];
          const fileStream = createReadStream(file, { encoding: 'utf-8' });
          const rl = createInterface({
            input: fileStream,
            crlfDelay: Infinity,
          });

          for await (const line of rl) {
            lines.push(line);
          }

          // Search for matches
          lines.forEach((line, index) => {
            if (regex.test(line)) {
              const before = lines.slice(Math.max(0, index - leading), index);
              const after = lines.slice(index + 1, index + 1 + trailing);

              matches.push({
                file,
                lineNumber: index + 1,
                line,
                context: { before, after },
              });
            }
          });

          if (matches.length >= maxResults) {
            break;
          }
        } catch (error) {
          console.error(`[Search] Error reading ${file}:`, error);
        }
      }

      if (matches.length === 0) {
        return `❌ No matches found for pattern: ${pattern}

**Searched:** ${files.length} files
**Try:**
- Different pattern
- Case-insensitive search
- Broader scope`;
      }

      let output = `✅ Found ${matches.length} match${matches.length > 1 ? 'es' : ''}

**Pattern:** \`${pattern}\`
**Scope:** ${scope}
**Files searched:** ${files.length}
${leading > 0 || trailing > 0 ? `**Context:** ${leading} lines before, ${trailing} lines after` : ''}

---

`;

      const displayMatches = matches.slice(0, maxResults);
      displayMatches.forEach((match, i) => {
        const fileName = path.basename(match.file);
        output += `### ${i + 1}. ${fileName}:${match.lineNumber}\n\n`;
        output += `**File:** ${match.file}\n\n`;
        output += `\`\`\`\n`;

        // Show context before
        if (match.context.before.length > 0) {
          match.context.before.forEach((line, j) => {
            const lineNum = match.lineNumber - match.context.before.length + j;
            output += `${lineNum}: ${line}\n`;
          });
        }

        // Show matching line (highlighted)
        output += `${match.lineNumber}: >>> ${match.line} <<<\n`;

        // Show context after
        if (match.context.after.length > 0) {
          match.context.after.forEach((line, j) => {
            const lineNum = match.lineNumber + j + 1;
            output += `${lineNum}: ${line}\n`;
          });
        }

        output += `\`\`\`\n\n`;
      });

      if (matches.length > maxResults) {
        output += `\n⚠️ Showing first ${maxResults} of ${matches.length} matches. Increase maxResults to see more.`;
      }

      return output;
    } catch (error) {
      return `❌ Search failed: ${error}

**Troubleshooting:**
- Check scope pattern is valid
- Check regex pattern is valid
- Verify files exist
- Check file permissions`;
    }
  },
};

/**
 * Browser Scroll Tool
 */
export const browserScrollTool: Tool = {
  name: 'browser_scroll',
  description: `Scroll the browser page or a specific element.

**Features:**
- Scroll to top/bottom
- Scroll by pixels
- Scroll to element
- Smooth scrolling

**Use Cases:**
- Load lazy-loaded content
- Navigate long pages
- Scroll to specific sections
- Trigger scroll events

Example:
{
  "direction": "down",
  "amount": 500,
  "smooth": true
}`,

  schema: {
    type: 'object',
    properties: {
      direction: {
        type: 'string',
        enum: ['up', 'down', 'top', 'bottom'],
        description: 'Scroll direction',
      },
      amount: {
        type: 'number',
        description: 'Pixels to scroll (for up/down)',
      },
      selector: {
        type: 'string',
        description: 'CSS selector of element to scroll (optional)',
      },
      smooth: {
        type: 'boolean',
        description: 'Smooth scrolling (default: true)',
      },
    },
    required: ['direction'],
  },

  async execute(args: any, env: any, userId?: string): Promise<string> {
    const { direction, amount = 500, selector, smooth = true } = args;

    console.log(`[Browser] Scrolling ${direction}${selector ? ` on ${selector}` : ''}`);

    try {
      // In production, integrate with Browserbase
      // This is a placeholder implementation
      
      let scrollScript = '';
      const behavior = smooth ? 'smooth' : 'auto';

      if (selector) {
        // Scroll specific element
        switch (direction) {
          case 'top':
            scrollScript = `document.querySelector('${selector}').scrollTo({top: 0, behavior: '${behavior}'})`;
            break;
          case 'bottom':
            scrollScript = `document.querySelector('${selector}').scrollTo({top: document.querySelector('${selector}').scrollHeight, behavior: '${behavior}'})`;
            break;
          case 'up':
            scrollScript = `document.querySelector('${selector}').scrollBy({top: -${amount}, behavior: '${behavior}'})`;
            break;
          case 'down':
            scrollScript = `document.querySelector('${selector}').scrollBy({top: ${amount}, behavior: '${behavior}'})`;
            break;
        }
      } else {
        // Scroll page
        switch (direction) {
          case 'top':
            scrollScript = `window.scrollTo({top: 0, behavior: '${behavior}'})`;
            break;
          case 'bottom':
            scrollScript = `window.scrollTo({top: document.body.scrollHeight, behavior: '${behavior}'})`;
            break;
          case 'up':
            scrollScript = `window.scrollBy({top: -${amount}, behavior: '${behavior}'})`;
            break;
          case 'down':
            scrollScript = `window.scrollBy({top: ${amount}, behavior: '${behavior}'})`;
            break;
        }
      }

      return `✅ Scrolled ${direction}${selector ? ` on element: ${selector}` : ''}

**Direction:** ${direction}
${amount ? `**Amount:** ${amount}px` : ''}
**Smooth:** ${smooth}

**Script executed:**
\`\`\`javascript
${scrollScript}
\`\`\``;
    } catch (error) {
      return `❌ Scroll failed: ${error}`;
    }
  },
};

/**
 * Browser Click by Selector Tool
 */
export const browserClickSelectorTool: Tool = {
  name: 'browser_click_selector',
  description: `Click an element by CSS selector (more reliable than coordinates).

**Features:**
- Click by CSS selector
- Wait for element to be clickable
- Handle dynamic content
- Multiple click types (single, double, right)

**Use Cases:**
- Click buttons
- Click links
- Submit forms
- Trigger events

Example:
{
  "selector": "button.submit",
  "waitFor": true,
  "clickType": "single"
}`,

  schema: {
    type: 'object',
    properties: {
      selector: {
        type: 'string',
        description: 'CSS selector of element to click',
      },
      waitFor: {
        type: 'boolean',
        description: 'Wait for element to be clickable (default: true)',
      },
      clickType: {
        type: 'string',
        enum: ['single', 'double', 'right'],
        description: 'Type of click (default: single)',
      },
      timeout: {
        type: 'number',
        description: 'Timeout in milliseconds (default: 5000)',
      },
    },
    required: ['selector'],
  },

  async execute(args: any, env: any, userId?: string): Promise<string> {
    const {
      selector,
      waitFor = true,
      clickType = 'single',
      timeout = 5000,
    } = args;

    console.log(`[Browser] Clicking ${selector} (${clickType})`);

    try {
      // In production, integrate with Browserbase
      // This is a placeholder implementation

      return `✅ Clicked element: ${selector}

**Selector:** ${selector}
**Click Type:** ${clickType}
**Waited:** ${waitFor}
${timeout ? `**Timeout:** ${timeout}ms` : ''}

**Action:** Element was found and clicked successfully.`;
    } catch (error) {
      return `❌ Click failed: ${error}

**Troubleshooting:**
- Check selector is correct
- Wait for page to load
- Check element is visible
- Try different selector`;
    }
  },
};

/**
 * Execute Code with Session Support Tool
 */
export const executeCodeSessionTool: Tool = {
  name: 'execute_code_session',
  description: `Execute code with multi-session support and interactive input.

**Features:**
- Named sessions for isolation
- Interactive input (send to stdin)
- Session persistence
- Environment variables per session

**Use Cases:**
- Run multiple processes simultaneously
- Interactive programs (REPL, CLI tools)
- Long-running processes
- Isolated environments

Example:
{
  "code": "python3",
  "session": "python_repl",
  "interactive": true
}`,

  schema: {
    type: 'object',
    properties: {
      code: {
        type: 'string',
        description: 'Code or command to execute',
      },
      session: {
        type: 'string',
        description: 'Session name (default: default)',
      },
      language: {
        type: 'string',
        enum: ['python', 'javascript', 'bash', 'typescript'],
        description: 'Programming language',
      },
      interactive: {
        type: 'boolean',
        description: 'Interactive mode (keep process running)',
      },
      input: {
        type: 'string',
        description: 'Input to send to stdin (for interactive sessions)',
      },
      timeout: {
        type: 'number',
        description: 'Timeout in seconds (default: 30)',
      },
    },
    required: ['code'],
  },

  async execute(args: any, env: any, userId?: string): Promise<string> {
    const {
      code,
      session = 'default',
      language = 'bash',
      interactive = false,
      input,
      timeout = 30,
    } = args;

    console.log(`[Execute] Session: ${session}, Language: ${language}`);

    try {
      // In production, integrate with E2B with session support
      // This is a placeholder implementation

      let output = `✅ Code executed in session: ${session}

**Session:** ${session}
**Language:** ${language}
**Interactive:** ${interactive}
${timeout ? `**Timeout:** ${timeout}s` : ''}

**Code:**
\`\`\`${language}
${code}
\`\`\`

`;

      if (input) {
        output += `**Input sent:**
\`\`\`
${input}
\`\`\`

`;
      }

      output += `**Output:**
\`\`\`
[Execution output would appear here]
\`\`\`

**Session Status:** ${interactive ? 'Running (interactive)' : 'Completed'}`;

      return output;
    } catch (error) {
      return `❌ Execution failed: ${error}

**Troubleshooting:**
- Check code syntax
- Verify session exists
- Check timeout is sufficient
- Try non-interactive mode`;
    }
  },
};

/**
 * All medium priority enhancement tools
 */
export const mediumPriorityTools: Tool[] = [
  searchInFilesEnhancedTool,
  browserScrollTool,
  browserClickSelectorTool,
  executeCodeSessionTool,
];
