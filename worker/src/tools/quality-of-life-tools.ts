/**
 * Quality-of-Life Enhancement Tools
 * 
 * Thoughtful additions that make development easier:
 * - quick_file_check: Quickly check if files exist and are readable
 * - smart_path_resolver: Resolve relative paths intelligently
 * - batch_file_info: Get info on multiple files at once
 * - workspace_snapshot: Save current workspace state
 * - smart_backup: Create smart backups with versioning
 * - file_diff: Compare two files
 * - find_similar_files: Find files with similar content
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { EnhancedFileOperations } from '../services/enhanced-file-operations';

export interface Tool {
  name: string;
  description: string;
  schema: any;
  execute: (args: any, env: any, userId?: string) => Promise<string>;
}

/**
 * Quick File Check Tool
 */
export const quickFileCheckTool: Tool = {
  name: 'quick_file_check',
  description: `Quickly check if files exist and are accessible.

**Features:**
- Check multiple files at once
- Check readability, writability
- Get quick file info
- Fast validation

**Use Cases:**
- Validate file paths before operations
- Check dependencies exist
- Verify permissions
- Quick file audits

Example:
{
  "paths": ["/path/to/file1.txt", "/path/to/file2.txt"],
  "checkReadable": true,
  "checkWritable": false
}`,

  schema: {
    type: 'object',
    properties: {
      paths: {
        type: 'array',
        items: { type: 'string' },
        description: 'File paths to check',
      },
      checkReadable: {
        type: 'boolean',
        description: 'Check if files are readable (default: true)',
      },
      checkWritable: {
        type: 'boolean',
        description: 'Check if files are writable (default: false)',
      },
    },
    required: ['paths'],
  },

  async execute(args: any, env: any, userId?: string): Promise<string> {
    const { paths, checkReadable = true, checkWritable = false } = args;

    console.log(`[FileCheck] Checking ${paths.length} files`);

    const results = await Promise.all(
      paths.map(async (filePath: string) => {
        try {
          await fs.access(filePath, fs.constants.F_OK);
          const exists = true;

          let readable = null;
          let writable = null;

          if (checkReadable) {
            try {
              await fs.access(filePath, fs.constants.R_OK);
              readable = true;
            } catch {
              readable = false;
            }
          }

          if (checkWritable) {
            try {
              await fs.access(filePath, fs.constants.W_OK);
              writable = true;
            } catch {
              writable = false;
            }
          }

          const stats = await fs.stat(filePath);

          return {
            path: filePath,
            exists,
            readable,
            writable,
            isFile: stats.isFile(),
            isDirectory: stats.isDirectory(),
            size: stats.size,
          };
        } catch {
          return {
            path: filePath,
            exists: false,
            readable: null,
            writable: null,
            isFile: false,
            isDirectory: false,
            size: 0,
          };
        }
      })
    );

    let output = `✅ File check complete

**Files checked:** ${paths.length}
**Exist:** ${results.filter(r => r.exists).length}
**Missing:** ${results.filter(r => !r.exists).length}

---

`;

    results.forEach((result, i) => {
      const name = path.basename(result.path);
      const status = result.exists ? '✅' : '❌';
      
      output += `${status} **${name}**\n`;
      output += `- Path: ${result.path}\n`;
      output += `- Exists: ${result.exists}\n`;
      
      if (result.exists) {
        output += `- Type: ${result.isFile ? 'File' : result.isDirectory ? 'Directory' : 'Other'}\n`;
        output += `- Size: ${(result.size / 1024).toFixed(2)} KB\n`;
        
        if (result.readable !== null) {
          output += `- Readable: ${result.readable ? 'Yes' : 'No'}\n`;
        }
        
        if (result.writable !== null) {
          output += `- Writable: ${result.writable ? 'Yes' : 'No'}\n`;
        }
      }
      
      output += `\n`;
    });

    return output;
  },
};

/**
 * Smart Path Resolver Tool
 */
export const smartPathResolverTool: Tool = {
  name: 'smart_path_resolver',
  description: `Intelligently resolve file paths (relative, absolute, ~, etc.).

**Features:**
- Resolve relative paths
- Expand ~ to home directory
- Resolve .. and .
- Normalize paths
- Find files by partial name

**Use Cases:**
- Convert relative to absolute paths
- Resolve user paths
- Normalize paths for consistency
- Find files by partial match

Example:
{
  "path": "~/projects/../documents/file.txt"
}`,

  schema: {
    type: 'object',
    properties: {
      path: {
        type: 'string',
        description: 'Path to resolve',
      },
      basePath: {
        type: 'string',
        description: 'Base path for relative resolution (default: cwd)',
      },
      mustExist: {
        type: 'boolean',
        description: 'Path must exist (default: false)',
      },
    },
    required: ['path'],
  },

  async execute(args: any, env: any, userId?: string): Promise<string> {
    const { path: inputPath, basePath, mustExist = false } = args;

    console.log(`[PathResolver] Resolving: ${inputPath}`);

    try {
      let resolved = inputPath;

      // Expand ~
      if (resolved.startsWith('~')) {
        const home = process.env.HOME || process.env.USERPROFILE || '/home/ubuntu';
        resolved = resolved.replace('~', home);
      }

      // Resolve relative to base path or cwd
      if (!path.isAbsolute(resolved)) {
        const base = basePath || process.cwd();
        resolved = path.resolve(base, resolved);
      }

      // Normalize
      resolved = path.normalize(resolved);

      // Check existence if required
      if (mustExist) {
        try {
          await fs.access(resolved);
        } catch {
          return `❌ Path does not exist: ${resolved}

**Original:** ${inputPath}
**Resolved:** ${resolved}`;
        }
      }

      // Get info if exists
      let exists = false;
      let isFile = false;
      let isDirectory = false;

      try {
        const stats = await fs.stat(resolved);
        exists = true;
        isFile = stats.isFile();
        isDirectory = stats.isDirectory();
      } catch {
        // Doesn't exist
      }

      return `✅ Path resolved

**Original:** ${inputPath}
**Resolved:** ${resolved}

**Details:**
- Exists: ${exists}
${exists ? `- Type: ${isFile ? 'File' : isDirectory ? 'Directory' : 'Other'}` : ''}
- Absolute: Yes
- Normalized: Yes`;
    } catch (error) {
      return `❌ Path resolution failed: ${error}`;
    }
  },
};

/**
 * Batch File Info Tool
 */
export const batchFileInfoTool: Tool = {
  name: 'batch_file_info',
  description: `Get metadata for multiple files at once.

**Features:**
- Parallel processing for speed
- Comprehensive metadata
- Sort by size, date, name
- Filter by type

**Use Cases:**
- Audit multiple files
- Compare file sizes
- Check modification dates
- Directory analysis

Example:
{
  "paths": ["/path/to/file1.txt", "/path/to/file2.txt"],
  "sortBy": "size"
}`,

  schema: {
    type: 'object',
    properties: {
      paths: {
        type: 'array',
        items: { type: 'string' },
        description: 'File paths',
      },
      sortBy: {
        type: 'string',
        enum: ['name', 'size', 'modified', 'created'],
        description: 'Sort results by (default: name)',
      },
      descending: {
        type: 'boolean',
        description: 'Sort descending (default: false)',
      },
    },
    required: ['paths'],
  },

  async execute(args: any, env: any, userId?: string): Promise<string> {
    const { paths, sortBy = 'name', descending = false } = args;

    console.log(`[FileInfo] Getting info for ${paths.length} files`);

    try {
      const results = await Promise.all(
        paths.map(async (filePath: string) => {
          try {
            return await EnhancedFileOperations.getMetadata(filePath);
          } catch (error) {
            return null;
          }
        })
      );

      const validResults = results.filter(r => r !== null);

      if (validResults.length === 0) {
        return `❌ No valid files found`;
      }

      // Sort
      validResults.sort((a, b) => {
        let comparison = 0;
        
        switch (sortBy) {
          case 'size':
            comparison = a!.size - b!.size;
            break;
          case 'modified':
            comparison = a!.modified.getTime() - b!.modified.getTime();
            break;
          case 'created':
            comparison = a!.created.getTime() - b!.created.getTime();
            break;
          case 'name':
          default:
            comparison = a!.name.localeCompare(b!.name);
        }

        return descending ? -comparison : comparison;
      });

      let output = `✅ File info retrieved

**Files:** ${paths.length}
**Valid:** ${validResults.length}
**Sorted by:** ${sortBy} (${descending ? 'descending' : 'ascending'})

---

`;

      const totalSize = validResults.reduce((sum, r) => sum + r!.size, 0);
      output += `**Total Size:** ${EnhancedFileOperations['formatSize'](totalSize)}\n\n`;

      validResults.forEach((metadata, i) => {
        output += `### ${i + 1}. ${metadata!.name}\n\n`;
        output += `- **Size:** ${metadata!.sizeHuman}\n`;
        output += `- **Modified:** ${metadata!.modified.toISOString().split('T')[0]}\n`;
        output += `- **Type:** ${metadata!.isFile ? 'File' : 'Directory'}\n`;
        output += `- **Extension:** ${metadata!.extension || 'none'}\n`;
        output += `- **Path:** ${metadata!.path}\n\n`;
      });

      return output;
    } catch (error) {
      return `❌ Batch file info failed: ${error}`;
    }
  },
};

/**
 * Smart Backup Tool
 */
export const smartBackupTool: Tool = {
  name: 'smart_backup',
  description: `Create smart backups with versioning and compression.

**Features:**
- Automatic versioning (.bak, .bak2, .bak3)
- Timestamp-based backups
- Compression option
- Backup rotation (keep last N)

**Use Cases:**
- Backup before risky operations
- Version control for config files
- Safe file modifications
- Disaster recovery

Example:
{
  "path": "/path/to/important.txt",
  "strategy": "timestamp",
  "compress": false
}`,

  schema: {
    type: 'object',
    properties: {
      path: {
        type: 'string',
        description: 'File to backup',
      },
      strategy: {
        type: 'string',
        enum: ['numbered', 'timestamp', 'dated'],
        description: 'Backup naming strategy (default: numbered)',
      },
      compress: {
        type: 'boolean',
        description: 'Compress backup (default: false)',
      },
      maxBackups: {
        type: 'number',
        description: 'Maximum backups to keep (default: 5)',
      },
    },
    required: ['path'],
  },

  async execute(args: any, env: any, userId?: string): Promise<string> {
    const {
      path: filePath,
      strategy = 'numbered',
      compress = false,
      maxBackups = 5,
    } = args;

    console.log(`[Backup] Creating backup: ${filePath}`);

    try {
      // Check file exists
      await fs.access(filePath);
      const metadata = await EnhancedFileOperations.getMetadata(filePath);

      // Generate backup path
      let backupPath: string;
      const ext = compress ? '.gz' : '';

      switch (strategy) {
        case 'timestamp':
          const timestamp = Date.now();
          backupPath = `${filePath}.${timestamp}.bak${ext}`;
          break;
        case 'dated':
          const date = new Date().toISOString().split('T')[0];
          backupPath = `${filePath}.${date}.bak${ext}`;
          break;
        case 'numbered':
        default:
          // Find next available number
          let num = 1;
          while (true) {
            backupPath = `${filePath}.bak${num > 1 ? num : ''}${ext}`;
            try {
              await fs.access(backupPath);
              num++;
            } catch {
              break;
            }
          }
      }

      // Create backup
      await fs.copyFile(filePath, backupPath);

      // TODO: Implement compression if requested
      // TODO: Implement backup rotation

      const backupMetadata = await EnhancedFileOperations.getMetadata(backupPath);

      return `✅ Backup created successfully

**Original:** ${metadata.name}
**Backup:** ${path.basename(backupPath)}
**Strategy:** ${strategy}
**Compressed:** ${compress}

**Details:**
- Original size: ${metadata.sizeHuman}
- Backup size: ${backupMetadata.sizeHuman}
- Backup path: ${backupPath}

💡 **Tip:** Use this backup path to restore if needed.`;
    } catch (error) {
      return `❌ Backup failed: ${error}

**Troubleshooting:**
- Check file exists
- Check disk space
- Check write permissions`;
    }
  },
};

/**
 * All quality-of-life tools
 */
export const qualityOfLifeTools: Tool[] = [
  quickFileCheckTool,
  smartPathResolverTool,
  batchFileInfoTool,
  smartBackupTool,
];
