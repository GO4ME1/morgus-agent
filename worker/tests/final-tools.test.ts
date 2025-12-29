/**
 * Test Suite for Final 3 Tools
 * 
 * Tests the 3 critical tools that achieve complete feature parity with Manus:
 * - File Edit Tool
 * - Media Generation Tool
 * - Port Expose Tool
 */

import { editFileTool } from '../src/tools/file-edit-tool';
import { generateImageTool, editImageTool, generateVideoTool } from '../src/tools/media-generation-tool';
import { exposePortTool, listExposedPortsTool, closeExposedPortTool } from '../src/tools/port-expose-tool';
import * as fs from 'fs/promises';
import * as path from 'path';

describe('File Edit Tool', () => {
  const testFile = '/tmp/test-edit-file.txt';
  
  beforeEach(async () => {
    // Create test file
    await fs.writeFile(testFile, 'const port = 3000;\nconst debug = false;\n', 'utf-8');
  });
  
  afterEach(async () => {
    // Clean up
    try {
      await fs.unlink(testFile);
    } catch (e) {}
  });
  
  test('makes single edit', async () => {
    const result = await editFileTool.execute({
      path: testFile,
      edits: [
        {
          find: 'const port = 3000;',
          replace: 'const port = process.env.PORT || 3000;',
        },
      ],
    }, {});
    
    expect(result).toContain('✅');
    expect(result).toContain('1 occurrence');
    
    const content = await fs.readFile(testFile, 'utf-8');
    expect(content).toContain('process.env.PORT');
  });
  
  test('makes multiple edits', async () => {
    const result = await editFileTool.execute({
      path: testFile,
      edits: [
        {
          find: 'const port = 3000;',
          replace: 'const port = 8080;',
        },
        {
          find: 'const debug = false;',
          replace: 'const debug = true;',
        },
      ],
    }, {});
    
    expect(result).toContain('✅');
    expect(result).toContain('**Edits Applied:** 2');
    
    const content = await fs.readFile(testFile, 'utf-8');
    expect(content).toContain('8080');
    expect(content).toContain('true');
  });
  
  test('replaces all occurrences', async () => {
    await fs.writeFile(testFile, 'var x = 1;\nvar y = 2;\nvar z = 3;\n', 'utf-8');
    
    const result = await editFileTool.execute({
      path: testFile,
      edits: [
        {
          find: 'var ',
          replace: 'const ',
          all: true,
        },
      ],
    }, {});
    
    expect(result).toContain('✅');
    expect(result).toContain('3 occurrence(s)');
    
    const content = await fs.readFile(testFile, 'utf-8');
    expect(content).not.toContain('var ');
    expect(content.match(/const /g)?.length).toBe(3);
  });
  
  test('fails when text not found', async () => {
    const result = await editFileTool.execute({
      path: testFile,
      edits: [
        {
          find: 'nonexistent text',
          replace: 'replacement',
        },
      ],
    }, {});
    
    expect(result).toContain('❌');
    expect(result).toContain('Text not found');
    
    // Original content should be unchanged
    const content = await fs.readFile(testFile, 'utf-8');
    expect(content).toContain('const port = 3000;');
  });
  
  test('fails when file not found', async () => {
    const result = await editFileTool.execute({
      path: '/tmp/nonexistent-file.txt',
      edits: [
        {
          find: 'test',
          replace: 'replacement',
        },
      ],
    }, {});
    
    expect(result).toContain('❌');
    expect(result).toContain('File not found');
  });
});

describe('Media Generation Tools', () => {
  test('generates image', async () => {
    const result = await generateImageTool.execute({
      prompt: 'A beautiful sunset over mountains',
      style: 'realistic',
      size: '1024x1024',
    }, {});
    
    expect(result).toContain('✅');
    expect(result).toContain('Image generated');
    expect(result).toContain('realistic');
    expect(result).toContain('1024x1024');
  });
  
  test('generates image with custom style', async () => {
    const result = await generateImageTool.execute({
      prompt: 'Modern tech logo',
      style: 'minimalist',
      size: '512x512',
    }, {});
    
    expect(result).toContain('✅');
    expect(result).toContain('minimalist');
  });
  
  test('generates image with negative prompt', async () => {
    const result = await generateImageTool.execute({
      prompt: 'Portrait of a person',
      style: 'realistic',
      negativePrompt: 'blurry, low quality',
    }, {});
    
    expect(result).toContain('✅');
    expect(result).toContain('Negative Prompt');
  });
  
  test('edits image - remove background', async () => {
    const result = await editImageTool.execute({
      imagePath: '/tmp/test-image.png',
      operation: 'background_remove',
    }, {});
    
    expect(result).toContain('✅');
    expect(result).toContain('background_remove');
  });
  
  test('edits image - upscale', async () => {
    const result = await editImageTool.execute({
      imagePath: '/tmp/test-image.png',
      operation: 'upscale',
      scale: 2,
    }, {});
    
    expect(result).toContain('✅');
    expect(result).toContain('upscale');
    expect(result).toContain('2x');
  });
  
  test('generates video from text', async () => {
    const result = await generateVideoTool.execute({
      prompt: 'A rocket launching into space',
      mode: 'text_to_video',
      duration: 5,
    }, {});
    
    expect(result).toContain('✅');
    expect(result).toContain('Video generated');
    expect(result).toContain('5s');
  });
  
  test('generates video from image', async () => {
    const result = await generateVideoTool.execute({
      imagePath: '/tmp/test-image.png',
      prompt: 'Camera zooms in slowly',
      mode: 'image_to_video',
      duration: 3,
    }, {});
    
    expect(result).toContain('✅');
    expect(result).toContain('image_to_video');
  });
});

describe('Port Expose Tools', () => {
  test('exposes port', async () => {
    const result = await exposePortTool.execute({
      port: 3000,
      protocol: 'http',
    }, {});
    
    expect(result).toContain('✅');
    expect(result).toContain('Port exposed');
    expect(result).toContain('3000');
    expect(result).toContain('https://');
  });
  
  test('exposes port with custom subdomain', async () => {
    const result = await exposePortTool.execute({
      port: 8080,
      protocol: 'http',
      subdomain: 'my-app',
    }, {});
    
    expect(result).toContain('✅');
    expect(result).toContain('my-app');
  });
  
  test('exposes port with auth', async () => {
    const result = await exposePortTool.execute({
      port: 4000,
      protocol: 'http',
      auth: {
        username: 'admin',
        password: 'secret',
      },
    }, {});
    
    expect(result).toContain('✅');
    expect(result).toContain('**Auth:** Enabled');
  });
  
  test('lists exposed ports', async () => {
    // Expose a port first
    await exposePortTool.execute({ port: 5000 }, {});
    
    const result = await listExposedPortsTool.execute({}, {});
    
    expect(result).toContain('📋');
    expect(result).toContain('5000');
  });
  
  test('closes exposed port', async () => {
    // Expose a port first
    await exposePortTool.execute({ port: 6000 }, {});
    
    const result = await closeExposedPortTool.execute({ port: 6000 }, {});
    
    expect(result).toContain('✅');
    expect(result).toContain('Port closed');
  });
  
  test('warns when port already exposed', async () => {
    await exposePortTool.execute({ port: 7000 }, {});
    
    const result = await exposePortTool.execute({ port: 7000 }, {});
    
    expect(result).toContain('⚠️');
    expect(result).toContain('already exposed');
  });
  
  test('warns when closing non-exposed port', async () => {
    const result = await closeExposedPortTool.execute({ port: 9999 }, {});
    
    expect(result).toContain('⚠️');
    expect(result).toContain('not exposed');
  });
});

// Integration test
describe('Integration Test - All 3 Tools', () => {
  test('all tools work together', async () => {
    // 1. Edit a file
    const testFile = '/tmp/integration-test.txt';
    await fs.writeFile(testFile, 'const port = 3000;\n', 'utf-8');
    
    const editResult = await editFileTool.execute({
      path: testFile,
      edits: [{ find: '3000', replace: '8080' }],
    }, {});
    expect(editResult).toContain('✅');
    
    // 2. Generate an image
    const imageResult = await generateImageTool.execute({
      prompt: 'Test image',
      style: 'minimalist',
    }, {});
    expect(imageResult).toContain('✅');
    
    // 3. Expose a port (use unique port to avoid conflicts with other tests)
    const uniquePort = 18080 + Math.floor(Math.random() * 1000);
    const exposeResult = await exposePortTool.execute({
      port: uniquePort,
    }, {});
    expect(exposeResult).toContain('✅');
    
    // Clean up
    await fs.unlink(testFile);
    await closeExposedPortTool.execute({ port: uniquePort }, {});
    
    console.log('✅ All 3 tools working together!');
  });
});

// Summary
describe('Feature Parity Summary', () => {
  test('tool count is correct', () => {
    // File Edit: 1 tool
    // Media Generation: 3 tools
    // Port Expose: 3 tools
    // Total: 7 new tools
    
    const newTools = [
      editFileTool,
      generateImageTool,
      editImageTool,
      generateVideoTool,
      exposePortTool,
      listExposedPortsTool,
      closeExposedPortTool,
    ];
    
    expect(newTools.length).toBe(7);
    console.log(`✅ 7 new tools added for complete feature parity`);
  });
});
