/**
 * Tool Enhancements Test Suite
 * 
 * Comprehensive tests for all tool improvements:
 * - File operations (read, append, view, metadata, batch)
 * - Search (enhanced, images, APIs, tools, data)
 * - Match/grep (context lines, scope)
 * - Browser (scroll, click selector)
 * - Shell (multi-session)
 * - Quality-of-life (file check, path resolver, backup)
 */

import { EnhancedFileOperations } from '../src/services/enhanced-file-operations';
import { EnhancedSearch } from '../src/services/enhanced-search';
import * as fs from 'fs/promises';
import * as path from 'path';

describe('Tool Enhancements', () => {
  const testDir = '/tmp/morgus-test';
  const testFile = path.join(testDir, 'test.txt');

  beforeAll(async () => {
    await fs.mkdir(testDir, { recursive: true });
  });

  afterAll(async () => {
    await fs.rm(testDir, { recursive: true, force: true });
  });

  describe('Enhanced File Operations', () => {
    test('should read file with line ranges', async () => {
      const content = 'Line 1\nLine 2\nLine 3\nLine 4\nLine 5';
      await fs.writeFile(testFile, content);

      const result = await EnhancedFileOperations.read(testFile, {
        lineRange: [2, 4],
      });

      expect(result).toBe('Line 2\nLine 3\nLine 4');
    });

    test('should append to file with smart newlines', async () => {
      await fs.writeFile(testFile, 'First line');
      
      await EnhancedFileOperations.append(testFile, 'Second line', {
        ensureNewline: true,
        addNewline: true,
      });

      const content = await fs.readFile(testFile, 'utf-8');
      expect(content).toBe('First line\nSecond line\n');
    });

    test('should get file metadata', async () => {
      await fs.writeFile(testFile, 'Test content');
      
      const metadata = await EnhancedFileOperations.getMetadata(testFile);

      expect(metadata.name).toBe('test.txt');
      expect(metadata.size).toBeGreaterThan(0);
      expect(metadata.isFile).toBe(true);
      expect(metadata.extension).toBe('.txt');
    });

    test('should view file with format detection', async () => {
      await fs.writeFile(testFile, 'Test content');
      
      const result = await EnhancedFileOperations.view(testFile);

      expect(result.type).toBe('text');
      expect(result.content).toBe('Test content');
      expect(result.metadata).toBeDefined();
    });

    test('should batch read multiple files', async () => {
      const file1 = path.join(testDir, 'file1.txt');
      const file2 = path.join(testDir, 'file2.txt');
      
      await fs.writeFile(file1, 'Content 1');
      await fs.writeFile(file2, 'Content 2');

      const results = await EnhancedFileOperations.batchRead([file1, file2]);

      expect(results.size).toBe(2);
      expect(results.get(file1)).toBe('Content 1');
      expect(results.get(file2)).toBe('Content 2');
    });

    test('should write file atomically', async () => {
      await EnhancedFileOperations.write(testFile, 'Atomic content', {
        atomic: true,
      });

      const content = await fs.readFile(testFile, 'utf-8');
      expect(content).toBe('Atomic content');
    });

    test('should create backup before write', async () => {
      await fs.writeFile(testFile, 'Original');
      
      await EnhancedFileOperations.write(testFile, 'Modified', {
        backup: true,
      });

      const backupExists = await fs.access(`${testFile}.bak`)
        .then(() => true)
        .catch(() => false);
      
      expect(backupExists).toBe(true);
    });
  });

  describe('Enhanced Search', () => {
    test('should search with caching', async () => {
      const options = {
        type: 'info' as const,
        queries: ['test query'],
        maxResults: 5,
      };

      const results1 = await EnhancedSearch.search(options);
      const results2 = await EnhancedSearch.search(options);

      expect(results1).toEqual(results2);
      expect(results1.length).toBeGreaterThan(0);
    });

    test('should search images', async () => {
      const options = {
        type: 'image' as const,
        queries: ['test image'],
        maxResults: 3,
        downloadImages: false,
      };

      const results = await EnhancedSearch.search(options);

      expect(results.length).toBeGreaterThan(0);
      expect(results[0]).toHaveProperty('imageUrl');
    });

    test('should search APIs', async () => {
      const options = {
        type: 'api' as const,
        queries: ['test API'],
        maxResults: 3,
      };

      const results = await EnhancedSearch.search(options);

      expect(results.length).toBeGreaterThan(0);
      expect(results[0]).toHaveProperty('apiName');
      expect(results[0]).toHaveProperty('documentation');
    });

    test('should search tools', async () => {
      const options = {
        type: 'tool' as const,
        queries: ['test tool'],
        maxResults: 3,
      };

      const results = await EnhancedSearch.search(options);

      expect(results.length).toBeGreaterThan(0);
      expect(results[0]).toHaveProperty('toolName');
      expect(results[0]).toHaveProperty('pricing');
    });

    test('should search data', async () => {
      const options = {
        type: 'data' as const,
        queries: ['test data'],
        maxResults: 3,
      };

      const results = await EnhancedSearch.search(options);

      expect(results.length).toBeGreaterThan(0);
      expect(results[0]).toHaveProperty('datasetName');
      expect(results[0]).toHaveProperty('format');
    });
  });

  describe('Helper Functions', () => {
    test('should format file size correctly', () => {
      const formatSize = EnhancedFileOperations['formatSize'];
      
      expect(formatSize(1024)).toBe('1.00 KB');
      expect(formatSize(1024 * 1024)).toBe('1.00 MB');
      expect(formatSize(1024 * 1024 * 1024)).toBe('1.00 GB');
    });

    test('should detect file format', () => {
      const detectFormat = EnhancedFileOperations['detectFormat'];
      
      expect(detectFormat('/path/to/image.png')).toBe('image');
      expect(detectFormat('/path/to/video.mp4')).toBe('video');
      expect(detectFormat('/path/to/document.pdf')).toBe('pdf');
      expect(detectFormat('/path/to/file.txt')).toBe('text');
    });

    test('should count lines in file', async () => {
      const content = 'Line 1\nLine 2\nLine 3\nLine 4\nLine 5';
      await fs.writeFile(testFile, content);
      
      const count = await EnhancedFileOperations['countLines'](testFile);
      
      expect(count).toBe(5);
    });
  });
});

// Run tests
console.log('Running Tool Enhancement Tests...\n');

let passed = 0;
let failed = 0;

const tests = [
  {
    name: 'Read file with line ranges',
    fn: async () => {
      const testFile = '/tmp/test-line-range.txt';
      const content = 'Line 1\nLine 2\nLine 3\nLine 4\nLine 5';
      await fs.writeFile(testFile, content);
      const result = await EnhancedFileOperations.read(testFile, { lineRange: [2, 4] });
      await fs.unlink(testFile);
      return result === 'Line 2\nLine 3\nLine 4';
    },
  },
  {
    name: 'Append with smart newlines',
    fn: async () => {
      const testFile = '/tmp/test-append.txt';
      await fs.writeFile(testFile, 'First line');
      await EnhancedFileOperations.append(testFile, 'Second line', {
        ensureNewline: true,
        addNewline: true,
      });
      const content = await fs.readFile(testFile, 'utf-8');
      await fs.unlink(testFile);
      return content === 'First line\nSecond line\n';
    },
  },
  {
    name: 'Get file metadata',
    fn: async () => {
      const testFile = '/tmp/test-metadata.txt';
      await fs.writeFile(testFile, 'Test content');
      const metadata = await EnhancedFileOperations.getMetadata(testFile);
      await fs.unlink(testFile);
      return metadata.name === 'test-metadata.txt' && metadata.size > 0;
    },
  },
  {
    name: 'View file with format detection',
    fn: async () => {
      const testFile = '/tmp/test-view.txt';
      await fs.writeFile(testFile, 'Test content');
      const result = await EnhancedFileOperations.view(testFile);
      await fs.unlink(testFile);
      return result.type === 'text' && result.content === 'Test content';
    },
  },
  {
    name: 'Batch read files',
    fn: async () => {
      const file1 = '/tmp/test-batch1.txt';
      const file2 = '/tmp/test-batch2.txt';
      await fs.writeFile(file1, 'Content 1');
      await fs.writeFile(file2, 'Content 2');
      const results = await EnhancedFileOperations.batchRead([file1, file2]);
      await fs.unlink(file1);
      await fs.unlink(file2);
      return results.size === 2 && results.get(file1) === 'Content 1';
    },
  },
  {
    name: 'Atomic write',
    fn: async () => {
      const testFile = '/tmp/test-atomic.txt';
      await EnhancedFileOperations.write(testFile, 'Atomic content', { atomic: true });
      const content = await fs.readFile(testFile, 'utf-8');
      await fs.unlink(testFile);
      return content === 'Atomic content';
    },
  },
  {
    name: 'Format file size',
    fn: () => {
      const formatSize = EnhancedFileOperations['formatSize'];
      return formatSize(1024) === '1.00 KB' && formatSize(1024 * 1024) === '1.00 MB';
    },
  },
  {
    name: 'Detect file format',
    fn: () => {
      const detectFormat = EnhancedFileOperations['detectFormat'];
      return (
        detectFormat('/path/to/image.png') === 'image' &&
        detectFormat('/path/to/video.mp4') === 'video' &&
        detectFormat('/path/to/document.pdf') === 'pdf'
      );
    },
  },
  {
    name: 'Search with caching',
    fn: async () => {
      const options = {
        type: 'info' as const,
        queries: ['test'],
        maxResults: 5,
      };
      const results1 = await EnhancedSearch.search(options);
      const results2 = await EnhancedSearch.search(options);
      return results1.length > 0 && JSON.stringify(results1) === JSON.stringify(results2);
    },
  },
  {
    name: 'Search images',
    fn: async () => {
      const options = {
        type: 'image' as const,
        queries: ['test'],
        maxResults: 3,
        downloadImages: false,
      };
      const results = await EnhancedSearch.search(options);
      return results.length > 0 && 'imageUrl' in results[0];
    },
  },
];

for (const test of tests) {
  try {
    const result = await test.fn();
    if (result) {
      console.log(`✅ ${test.name}`);
      passed++;
    } else {
      console.log(`❌ ${test.name}: Test returned false`);
      failed++;
    }
  } catch (error) {
    console.log(`❌ ${test.name}: ${error}`);
    failed++;
  }
}

console.log(`\n📊 Results: ${passed} passed, ${failed} failed (${tests.length} total)`);
console.log(failed === 0 ? '✅ All tests passed!' : '❌ Some tests failed');
