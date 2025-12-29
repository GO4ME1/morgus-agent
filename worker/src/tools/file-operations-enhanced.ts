/**
 * Enhanced File Operation Tools
 * 
 * Comprehensive file operations with thoughtful enhancements:
 * - read_file_enhanced: Read with line ranges, encoding detection
 * - append_file: Append with smart newline handling
 * - view_file: Multimodal viewing (images, PDFs, videos)
 * - get_file_metadata: Comprehensive file information
 * - batch_read_files: Read multiple files efficiently
 * - batch_write_files: Write multiple files at once
 */

import { EnhancedFileOperations } from '../services/enhanced-file-operations';

export interface Tool {
  name: string;
  description: string;
  schema: any;
  execute: (args: any, env: any, userId?: string) => Promise<string>;
}

/**
 * Enhanced Read File Tool
 */
export const readFileEnhancedTool: Tool = {
  name: 'read_file_enhanced',
  description: `Read file content with advanced options.

**Features:**
- Read entire file or specific line ranges
- Automatic encoding detection
- Size limits to prevent memory issues
- Line count information
- Smart error handling

**Line Ranges:**
- [10, 20]: Read lines 10-20
- [1, 50]: Read first 50 lines
- [100, -1]: Read from line 100 to end
- [-50, -1]: Read last 50 lines (not supported yet, read full file)

**Use Cases:**
- Read configuration files
- Read source code
- Read logs (with line ranges)
- Read data files

Example:
{
  "path": "/path/to/file.txt",
  "lineRange": [1, 100],
  "detectEncoding": true
}`,

  schema: {
    type: 'object',
    properties: {
      path: {
        type: 'string',
        description: 'Absolute file path',
      },
      lineRange: {
        type: 'array',
        items: { type: 'number' },
        description: 'Line range [start, end] (1-indexed, -1 for end)',
      },
      encoding: {
        type: 'string',
        enum: ['utf-8', 'utf16le', 'latin1', 'ascii'],
        description: 'File encoding (default: utf-8)',
      },
      detectEncoding: {
        type: 'boolean',
        description: 'Auto-detect encoding (default: false)',
      },
      maxSize: {
        type: 'number',
        description: 'Max file size in bytes (default: 10MB)',
      },
    },
    required: ['path'],
  },

  async execute(args: any, env: any, userId?: string): Promise<string> {
    const { path, lineRange, encoding, detectEncoding, maxSize } = args;

    console.log(`[File] Reading: ${path}`);
    if (lineRange) {
      console.log(`[File] Line range: ${lineRange[0]}-${lineRange[1]}`);
    }

    try {
      const content = await EnhancedFileOperations.read(path, {
        lineRange,
        encoding,
        detectEncoding,
        maxSize,
      });

      const metadata = await EnhancedFileOperations.getMetadata(path);
      const lines = content.split('\n').length;

      return `✅ File read successfully

**File:** ${metadata.name}
**Path:** ${path}
**Size:** ${metadata.sizeHuman}
**Lines:** ${lines}${lineRange ? ` (showing ${lineRange[0]}-${lineRange[1] === -1 ? metadata.lineCount : lineRange[1]})` : ''}
**Encoding:** ${encoding || 'utf-8'}${detectEncoding ? ' (auto-detected)' : ''}

**Content:**

\`\`\`
${content}
\`\`\``;
    } catch (error) {
      return `❌ Failed to read file: ${error}

**Troubleshooting:**
- Check if file exists
- Check file permissions
- Try with lineRange if file is too large
- Try detectEncoding if encoding issues`;
    }
  },
};

/**
 * Append File Tool
 */
export const appendFileTool: Tool = {
  name: 'append_file',
  description: `Append content to an existing file with smart newline handling.

**Features:**
- Automatic newline handling
- Creates file if it doesn't exist
- Ensures proper line endings
- Atomic operations

**Use Cases:**
- Append to log files
- Add entries to data files
- Append to configuration files
- Build files incrementally

Example:
{
  "path": "/path/to/log.txt",
  "content": "New log entry",
  "ensureNewline": true,
  "addNewline": true
}`,

  schema: {
    type: 'object',
    properties: {
      path: {
        type: 'string',
        description: 'Absolute file path',
      },
      content: {
        type: 'string',
        description: 'Content to append',
      },
      encoding: {
        type: 'string',
        enum: ['utf-8', 'utf16le', 'latin1', 'ascii'],
        description: 'File encoding (default: utf-8)',
      },
      ensureNewline: {
        type: 'boolean',
        description: 'Ensure file ends with newline before appending (default: true)',
      },
      addNewline: {
        type: 'boolean',
        description: 'Add newline after appended content (default: true)',
      },
    },
    required: ['path', 'content'],
  },

  async execute(args: any, env: any, userId?: string): Promise<string> {
    const { path, content, encoding, ensureNewline, addNewline } = args;

    console.log(`[File] Appending to: ${path}`);
    console.log(`[File] Content length: ${content.length} chars`);

    try {
      await EnhancedFileOperations.append(path, content, {
        encoding,
        ensureNewline,
        addNewline,
      });

      const metadata = await EnhancedFileOperations.getMetadata(path);

      return `✅ Content appended successfully

**File:** ${metadata.name}
**Path:** ${path}
**New Size:** ${metadata.sizeHuman}
**Lines:** ${metadata.lineCount}
**Appended:** ${content.length} characters

**Preview of appended content:**
\`\`\`
${content.slice(0, 200)}${content.length > 200 ? '...' : ''}
\`\`\``;
    } catch (error) {
      return `❌ Failed to append to file: ${error}

**Troubleshooting:**
- Check file permissions
- Check disk space
- Verify parent directory exists`;
    }
  },
};

/**
 * View File Tool
 */
export const viewFileTool: Tool = {
  name: 'view_file',
  description: `View file with multimodal understanding (images, PDFs, videos, etc.).

**Supported Formats:**
- Images: JPG, PNG, GIF, BMP, WebP, SVG
- PDFs: With optional text extraction
- Videos: MP4, AVI, MOV, MKV, WebM
- Audio: MP3, WAV, OGG, M4A, FLAC
- Text: Any text-based file

**Features:**
- Automatic format detection
- PDF text extraction
- Image metadata
- File information
- Size limits for safety

**Use Cases:**
- View images before using them
- Extract text from PDFs
- Check video files
- Inspect binary files

Example:
{
  "path": "/path/to/image.png",
  "format": "auto",
  "extractText": true
}`,

  schema: {
    type: 'object',
    properties: {
      path: {
        type: 'string',
        description: 'Absolute file path',
      },
      format: {
        type: 'string',
        enum: ['auto', 'text', 'image', 'pdf', 'video', 'audio'],
        description: 'File format (default: auto)',
      },
      extractText: {
        type: 'boolean',
        description: 'Extract text from PDFs (default: true)',
      },
      maxSize: {
        type: 'number',
        description: 'Max file size in bytes (default: 50MB)',
      },
    },
    required: ['path'],
  },

  async execute(args: any, env: any, userId?: string): Promise<string> {
    const { path, format, extractText, maxSize } = args;

    console.log(`[File] Viewing: ${path}`);

    try {
      const result = await EnhancedFileOperations.view(path, {
        format,
        extractText,
        maxSize,
      });

      let output = `✅ File viewed successfully

**File:** ${result.metadata.name}
**Type:** ${result.type}
**Size:** ${result.metadata.sizeHuman}
**Modified:** ${result.metadata.modified.toISOString()}
**MIME:** ${result.metadata.mimeType}
`;

      if (result.type === 'image') {
        output += `
**Image Information:**
- Format: ${result.metadata.extension}
- Path: ${path}

📷 Image file is ready to view or use in other tools.`;
      } else if (result.type === 'pdf') {
        output += `
**PDF Information:**
- Pages: [Would be extracted in production]
- Path: ${path}

${result.content ? `**Extracted Text:**\n\`\`\`\n${result.content}\n\`\`\`` : ''}`;
      } else if (result.type === 'video' || result.type === 'audio') {
        output += `
**Media Information:**
- Duration: [Would be extracted in production]
- Path: ${path}

🎬 Media file is ready to use.`;
      } else if (result.type === 'text' && result.content) {
        const lines = result.content.split('\n').length;
        output += `
**Text Information:**
- Lines: ${lines}
- Encoding: ${result.metadata.encoding || 'utf-8'}

**Content Preview:**
\`\`\`
${result.content.slice(0, 500)}${result.content.length > 500 ? '\n...' : ''}
\`\`\``;
      }

      return output;
    } catch (error) {
      return `❌ Failed to view file: ${error}

**Troubleshooting:**
- Check if file exists
- Check file permissions
- Try with smaller maxSize if file is too large
- Verify file format is supported`;
    }
  },
};

/**
 * Get File Metadata Tool
 */
export const getFileMetadataTool: Tool = {
  name: 'get_file_metadata',
  description: `Get comprehensive file metadata and information.

**Information Provided:**
- File name, extension, path
- File size (bytes and human-readable)
- Created, modified, accessed dates
- File type (file, directory, symlink)
- Permissions
- MIME type
- Line count (for text files)
- Encoding detection

**Use Cases:**
- Check file existence
- Get file size before reading
- Check modification date
- Verify file type
- Check permissions

Example:
{
  "path": "/path/to/file.txt"
}`,

  schema: {
    type: 'object',
    properties: {
      path: {
        type: 'string',
        description: 'Absolute file path',
      },
    },
    required: ['path'],
  },

  async execute(args: any, env: any, userId?: string): Promise<string> {
    const { path } = args;

    console.log(`[File] Getting metadata: ${path}`);

    try {
      const metadata = await EnhancedFileOperations.getMetadata(path);

      return `✅ File metadata retrieved

**File Information:**
- **Name:** ${metadata.name}
- **Extension:** ${metadata.extension || 'none'}
- **Path:** ${metadata.path}

**Size:**
- **Bytes:** ${metadata.size.toLocaleString()}
- **Human:** ${metadata.sizeHuman}

**Dates:**
- **Created:** ${metadata.created.toISOString()}
- **Modified:** ${metadata.modified.toISOString()}
- **Accessed:** ${metadata.accessed.toISOString()}

**Type:**
- **Is File:** ${metadata.isFile}
- **Is Directory:** ${metadata.isDirectory}
- **Is Symlink:** ${metadata.isSymlink}

**Additional:**
- **Permissions:** ${metadata.permissions}
- **MIME Type:** ${metadata.mimeType}
${metadata.lineCount !== undefined ? `- **Line Count:** ${metadata.lineCount}` : ''}

**Age:** ${this.formatAge(metadata.modified)}`;
    } catch (error) {
      return `❌ Failed to get metadata: ${error}

**Possible reasons:**
- File does not exist
- No permission to access file
- Path is invalid`;
    }
  },

  formatAge(date: Date): string {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    return `${seconds} second${seconds !== 1 ? 's' : ''} ago`;
  },
};

/**
 * Batch Read Files Tool
 */
export const batchReadFilesTool: Tool = {
  name: 'batch_read_files',
  description: `Read multiple files at once efficiently.

**Features:**
- Parallel reading for speed
- Individual error handling per file
- Same options as read_file_enhanced
- Returns all results even if some fail

**Use Cases:**
- Read multiple configuration files
- Read all files in a directory
- Compare multiple files
- Batch processing

Example:
{
  "paths": ["/path/to/file1.txt", "/path/to/file2.txt"],
  "encoding": "utf-8"
}`,

  schema: {
    type: 'object',
    properties: {
      paths: {
        type: 'array',
        items: { type: 'string' },
        description: 'Array of absolute file paths',
      },
      encoding: {
        type: 'string',
        enum: ['utf-8', 'utf16le', 'latin1', 'ascii'],
        description: 'File encoding (default: utf-8)',
      },
      maxSize: {
        type: 'number',
        description: 'Max file size in bytes per file (default: 10MB)',
      },
    },
    required: ['paths'],
  },

  async execute(args: any, env: any, userId?: string): Promise<string> {
    const { paths, encoding, maxSize } = args;

    console.log(`[File] Batch reading ${paths.length} files`);

    try {
      const results = await EnhancedFileOperations.batchRead(paths, {
        encoding,
        maxSize,
      });

      let output = `✅ Batch read completed

**Files:** ${paths.length}
**Successful:** ${Array.from(results.values()).filter(v => !v.startsWith('Error:')).length}
**Failed:** ${Array.from(results.values()).filter(v => v.startsWith('Error:')).length}

---

`;

      for (const [path, content] of results.entries()) {
        const name = path.split('/').pop();
        if (content.startsWith('Error:')) {
          output += `❌ **${name}**\n${content}\n\n`;
        } else {
          const lines = content.split('\n').length;
          output += `✅ **${name}** (${lines} lines)\n\`\`\`\n${content.slice(0, 200)}${content.length > 200 ? '...' : ''}\n\`\`\`\n\n`;
        }
      }

      return output;
    } catch (error) {
      return `❌ Batch read failed: ${error}`;
    }
  },
};

/**
 * All enhanced file operation tools
 */
export const fileOperationsEnhancedTools: Tool[] = [
  readFileEnhancedTool,
  appendFileTool,
  viewFileTool,
  getFileMetadataTool,
  batchReadFilesTool,
];
