/**
 * File Edit Tool
 * 
 * Make targeted edits to text files using find-and-replace.
 * Essential for debugging and fixing code without rewriting entire files.
 * 
 * This is one of Manus's most-used tools (~40% of tasks).
 */

import * as fs from 'fs/promises';
import * as path from 'path';

export interface Tool {
  name: string;
  description: string;
  schema: any;
  execute: (args: any, env: any, userId?: string) => Promise<string>;
}

export interface FileEdit {
  find: string;
  replace: string;
  all?: boolean; // Replace all occurrences (default: false, only first)
}

/**
 * Edit File Tool
 */
export const editFileTool: Tool = {
  name: 'edit_file',
  description: `Make targeted edits to a text file using find-and-replace.

This tool is essential for:
- Fixing bugs in code
- Updating configuration
- Making small changes without rewriting entire files
- Multiple edits in one atomic operation

All edits are applied sequentially. If any edit fails, none are applied (atomic).

Example - Fix a bug:
{
  "path": "/path/to/server.js",
  "edits": [
    {
      "find": "const port = 3000;",
      "replace": "const port = process.env.PORT || 3000;"
    }
  ]
}

Example - Multiple edits:
{
  "path": "/path/to/config.js",
  "edits": [
    {
      "find": "debug: false",
      "replace": "debug: true"
    },
    {
      "find": "logLevel: 'error'",
      "replace": "logLevel: 'debug'"
    }
  ]
}

Example - Replace all occurrences:
{
  "path": "/path/to/app.js",
  "edits": [
    {
      "find": "var ",
      "replace": "const ",
      "all": true
    }
  ]
}

Tips:
- Be specific with 'find' text to avoid unintended replacements
- Use exact text including whitespace and formatting
- For multiple edits, order matters (they're applied sequentially)
- If a 'find' text is not found, the edit fails and nothing is changed`,

  schema: {
    type: 'object',
    properties: {
      path: {
        type: 'string',
        description: 'Absolute path to the file to edit',
      },
      edits: {
        type: 'array',
        description: 'Array of edits to apply sequentially',
        items: {
          type: 'object',
          properties: {
            find: {
              type: 'string',
              description: 'Exact text to find (must match exactly)',
            },
            replace: {
              type: 'string',
              description: 'Text to replace with',
            },
            all: {
              type: 'boolean',
              description: 'Replace all occurrences (default: false, only first)',
            },
          },
          required: ['find', 'replace'],
        },
      },
    },
    required: ['path', 'edits'],
  },
  
  async execute(args: any, env: any, userId?: string): Promise<string> {
    const { path: filePath, edits } = args;
    
    console.log(`[FileEdit] Editing file: ${filePath}`);
    console.log(`[FileEdit] Edits: ${edits.length}`);
    
    try {
      // Read file content
      let content: string;
      try {
        content = await fs.readFile(filePath, 'utf-8');
      } catch (error: any) {
        return `❌ Error: File not found: ${filePath}`;
      }
      
      // Store original content for rollback
      const originalContent = content;
      
      // Apply edits sequentially
      const appliedEdits: string[] = [];
      const failedEdits: string[] = [];
      
      for (let i = 0; i < edits.length; i++) {
        const edit: FileEdit = edits[i];
        const { find, replace, all = false } = edit;
        
        // Check if find text exists
        if (!content.includes(find)) {
          failedEdits.push(`Edit ${i + 1}: Text not found: "${find.substring(0, 50)}${find.length > 50 ? '...' : ''}"`);
          continue;
        }
        
        // Apply edit
        if (all) {
          // Replace all occurrences
          const count = (content.match(new RegExp(escapeRegex(find), 'g')) || []).length;
          content = content.split(find).join(replace);
          appliedEdits.push(`Edit ${i + 1}: Replaced ${count} occurrence(s)`);
        } else {
          // Replace only first occurrence
          const index = content.indexOf(find);
          content = content.substring(0, index) + replace + content.substring(index + find.length);
          appliedEdits.push(`Edit ${i + 1}: Replaced 1 occurrence`);
        }
      }
      
      // If any edit failed, rollback
      if (failedEdits.length > 0) {
        return `❌ Edit failed - no changes made

**Failed Edits:**
${failedEdits.map(f => `- ${f}`).join('\n')}

**Tip:** Make sure the 'find' text matches exactly (including whitespace and formatting).`;
      }
      
      // Write updated content
      await fs.writeFile(filePath, content, 'utf-8');
      
      // Calculate changes
      const originalLines = originalContent.split('\n').length;
      const newLines = content.split('\n').length;
      const linesDiff = newLines - originalLines;
      
      return `✅ File edited successfully!

**File:** ${filePath}
**Edits Applied:** ${appliedEdits.length}

${appliedEdits.map(e => `- ${e}`).join('\n')}

**Changes:**
- Original lines: ${originalLines}
- New lines: ${newLines}
- Difference: ${linesDiff > 0 ? '+' : ''}${linesDiff}

The file has been updated with all edits.`;
      
    } catch (error: any) {
      console.error('[FileEdit] Error:', error);
      return `❌ Error editing file: ${error.message}`;
    }
  },
};

/**
 * Escape special regex characters
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Export tool
 */
export const fileEditTools: Tool[] = [editFileTool];
