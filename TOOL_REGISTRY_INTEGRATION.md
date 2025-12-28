# Tool Registry Integration Guide

**Purpose:** How to integrate all new tools into Morgus's tool registry

**Date:** December 28, 2025

---

## Overview

This guide shows how to register all 19 new tools we've created into Morgus's existing tool registry.

**New Tools:**
- 6 File System Tools
- 5 Advanced Browser Tools
- 2 Slides Tools
- 3 Scheduling Tools
- 3 Web Development Tools

**Total:** 19 new tools (bringing Morgus from 26 to 45+ tools)

---

## Step 1: Import Tool Modules

Add imports to `/worker/src/tools.ts`:

```typescript
// Existing imports...

// NEW: Import new tool modules
import { filesystemTools } from './tools/filesystem-tools';
import { advancedBrowserTools } from './tools/browser-advanced';
import { slidesTools } from './tools/slides-tools';
import { schedulingTools } from './tools/scheduling-tools';
import { webdevTools } from './tools/webdev-tools';
import { executeParallelTool } from './tools/parallel-execution-tool';
import { useTemplateTool } from './tools/template-tool';
```

---

## Step 2: Register Tools

Add tool registration in the `ToolRegistry` class:

```typescript
export class ToolRegistry {
  private tools: Map<string, Tool> = new Map();
  
  constructor() {
    this.registerDefaultTools();
  }
  
  private registerDefaultTools() {
    // Existing tools...
    
    // NEW: Register file system tools
    filesystemTools.forEach(tool => {
      this.register(tool);
    });
    
    // NEW: Register advanced browser tools
    advancedBrowserTools.forEach(tool => {
      this.register(tool);
    });
    
    // NEW: Register slides tools
    slidesTools.forEach(tool => {
      this.register(tool);
    });
    
    // NEW: Register scheduling tools
    schedulingTools.forEach(tool => {
      this.register(tool);
    });
    
    // NEW: Register web development tools
    webdevTools.forEach(tool => {
      this.register(tool);
    });
    
    // NEW: Register parallel execution tool
    this.register(executeParallelTool);
    
    // NEW: Register template tool
    this.register(useTemplateTool);
  }
  
  register(tool: Tool) {
    this.tools.set(tool.name, tool);
    console.log(`[ToolRegistry] Registered tool: ${tool.name}`);
  }
  
  // ... rest of the class
}
```

---

## Step 3: Feature Flags (Optional)

Add feature flags to control tool availability:

```typescript
// /worker/src/config.ts

export const FEATURE_FLAGS = {
  ENABLE_FILE_TOOLS: process.env.ENABLE_FILE_TOOLS !== 'false', // default: true
  ENABLE_BROWSER_ADVANCED: process.env.ENABLE_BROWSER_ADVANCED !== 'false',
  ENABLE_SLIDES_TOOLS: process.env.ENABLE_SLIDES_TOOLS !== 'false',
  ENABLE_SCHEDULING: process.env.ENABLE_SCHEDULING !== 'false',
  ENABLE_WEBDEV_TOOLS: process.env.ENABLE_WEBDEV_TOOLS !== 'false',
  ENABLE_PARALLEL_EXECUTION: process.env.ENABLE_PARALLEL_EXECUTION !== 'false',
  ENABLE_TEMPLATES: process.env.ENABLE_TEMPLATES !== 'false',
};
```

Update tool registration:

```typescript
private registerDefaultTools() {
  // Existing tools...
  
  if (FEATURE_FLAGS.ENABLE_FILE_TOOLS) {
    filesystemTools.forEach(tool => this.register(tool));
  }
  
  if (FEATURE_FLAGS.ENABLE_BROWSER_ADVANCED) {
    advancedBrowserTools.forEach(tool => this.register(tool));
  }
  
  if (FEATURE_FLAGS.ENABLE_SLIDES_TOOLS) {
    slidesTools.forEach(tool => this.register(tool));
  }
  
  if (FEATURE_FLAGS.ENABLE_SCHEDULING) {
    schedulingTools.forEach(tool => this.register(tool));
  }
  
  if (FEATURE_FLAGS.ENABLE_WEBDEV_TOOLS) {
    webdevTools.forEach(tool => this.register(tool));
  }
  
  if (FEATURE_FLAGS.ENABLE_PARALLEL_EXECUTION) {
    this.register(executeParallelTool);
  }
  
  if (FEATURE_FLAGS.ENABLE_TEMPLATES) {
    this.register(useTemplateTool);
  }
}
```

---

## Step 4: Update Tool Descriptions for LLM

Create a tool catalog for the LLM to understand available tools:

```typescript
// /worker/src/tools/catalog.ts

export const TOOL_CATALOG = {
  // File Operations
  'create_file': 'Create a new file with content',
  'read_file': 'Read file content (text or base64)',
  'update_file': 'Update file (append/replace/insert)',
  'delete_file': 'Delete file or directory',
  'list_files': 'List files with glob patterns',
  'search_in_files': 'Search for text in files (grep-like)',
  
  // Browser Automation (Advanced)
  'browser_click_coordinates': 'Click at specific x,y coordinates',
  'browser_fill_form': 'Fill multiple form fields at once',
  'browser_wait_for_element': 'Wait for element to appear',
  'browser_execute_script': 'Execute JavaScript in browser',
  'browser_save_screenshot': 'Take and save screenshot',
  
  // Presentations
  'create_slides': 'Create presentation with multiple slides',
  'export_slides': 'Export slides to PDF or PPTX',
  
  // Scheduling
  'schedule_task': 'Schedule task for future execution',
  'list_scheduled_tasks': 'List all scheduled tasks',
  'cancel_scheduled_task': 'Cancel a scheduled task',
  
  // Web Development
  'init_web_project': 'Initialize web project with scaffolding',
  'install_dependencies': 'Install npm/pip packages',
  'run_dev_server': 'Start development server',
  
  // Advanced Features
  'execute_parallel': 'Execute up to 2000 tasks in parallel',
  'use_template': 'Use pre-built template for common patterns',
};
```

---

## Step 5: Test Tool Registration

Create a test to verify all tools are registered:

```typescript
// /worker/tests/tool-registry.test.ts

import { ToolRegistry } from '../src/tools';

describe('Tool Registry', () => {
  test('all new tools are registered', () => {
    const registry = new ToolRegistry();
    
    // File system tools
    expect(registry.getTool('create_file')).toBeDefined();
    expect(registry.getTool('read_file')).toBeDefined();
    expect(registry.getTool('update_file')).toBeDefined();
    expect(registry.getTool('delete_file')).toBeDefined();
    expect(registry.getTool('list_files')).toBeDefined();
    expect(registry.getTool('search_in_files')).toBeDefined();
    
    // Advanced browser tools
    expect(registry.getTool('browser_click_coordinates')).toBeDefined();
    expect(registry.getTool('browser_fill_form')).toBeDefined();
    expect(registry.getTool('browser_wait_for_element')).toBeDefined();
    expect(registry.getTool('browser_execute_script')).toBeDefined();
    expect(registry.getTool('browser_save_screenshot')).toBeDefined();
    
    // Slides tools
    expect(registry.getTool('create_slides')).toBeDefined();
    expect(registry.getTool('export_slides')).toBeDefined();
    
    // Scheduling tools
    expect(registry.getTool('schedule_task')).toBeDefined();
    expect(registry.getTool('list_scheduled_tasks')).toBeDefined();
    expect(registry.getTool('cancel_scheduled_task')).toBeDefined();
    
    // Web dev tools
    expect(registry.getTool('init_web_project')).toBeDefined();
    expect(registry.getTool('install_dependencies')).toBeDefined();
    expect(registry.getTool('run_dev_server')).toBeDefined();
    
    // Special tools
    expect(registry.getTool('execute_parallel')).toBeDefined();
    expect(registry.getTool('use_template')).toBeDefined();
  });
  
  test('tool count is correct', () => {
    const registry = new ToolRegistry();
    const toolCount = registry.getAllTools().length;
    
    // Should be 26 (existing) + 19 (new) = 45+
    expect(toolCount).toBeGreaterThanOrEqual(45);
  });
});
```

---

## Step 6: Update System Prompt

Add new tools to the agent's system prompt:

```typescript
// /worker/src/agent.ts

const SYSTEM_PROMPT = `
You are Morgus, an autonomous AI agent with access to powerful tools.

Available Tools:

**File Operations:**
- create_file: Create files with content
- read_file: Read file content
- update_file: Update files (append/replace/insert)
- delete_file: Delete files or directories
- list_files: List files with patterns
- search_in_files: Search text in files

**Browser Automation:**
- browser_click_coordinates: Click at x,y coordinates
- browser_fill_form: Fill multiple form fields
- browser_wait_for_element: Wait for element
- browser_execute_script: Run JavaScript
- browser_save_screenshot: Take screenshots

**Presentations:**
- create_slides: Create presentations
- export_slides: Export to PDF/PPTX

**Scheduling:**
- schedule_task: Schedule future tasks
- list_scheduled_tasks: View scheduled tasks
- cancel_scheduled_task: Cancel tasks

**Web Development:**
- init_web_project: Initialize projects
- install_dependencies: Install packages
- run_dev_server: Start dev servers

**Advanced:**
- execute_parallel: Run up to 2000 tasks in parallel
- use_template: Use pre-built templates

... (rest of system prompt)
`;
```

---

## Step 7: Deploy

```bash
# 1. Build
cd /home/ubuntu/morgus-agent/worker
npm run build

# 2. Test
npm test

# 3. Deploy
npm run deploy
```

---

## Verification Checklist

After deployment, verify:

- [ ] All 19 new tools are registered
- [ ] Tool count is 45+
- [ ] Feature flags work correctly
- [ ] Tools can be invoked by agents
- [ ] Tool descriptions are clear
- [ ] Error handling works
- [ ] Tests pass

---

## Tool Summary

### File System Tools (6)

| Tool | Description | Use Case |
|------|-------------|----------|
| create_file | Create new file | Save generated code |
| read_file | Read file content | Load configuration |
| update_file | Update file | Append logs |
| delete_file | Delete file/dir | Clean up temp files |
| list_files | List files | Find project files |
| search_in_files | Search text | Find code references |

### Advanced Browser Tools (5)

| Tool | Description | Use Case |
|------|-------------|----------|
| browser_click_coordinates | Click at x,y | Click unmarked elements |
| browser_fill_form | Fill multiple fields | Submit forms quickly |
| browser_wait_for_element | Wait for element | Handle dynamic content |
| browser_execute_script | Run JavaScript | Extract data |
| browser_save_screenshot | Take screenshot | Document state |

### Slides Tools (2)

| Tool | Description | Use Case |
|------|-------------|----------|
| create_slides | Create presentation | Generate pitch deck |
| export_slides | Export to PDF/PPTX | Share presentation |

### Scheduling Tools (3)

| Tool | Description | Use Case |
|------|-------------|----------|
| schedule_task | Schedule task | Daily reports |
| list_scheduled_tasks | List tasks | View schedule |
| cancel_scheduled_task | Cancel task | Stop automation |

### Web Development Tools (3)

| Tool | Description | Use Case |
|------|-------------|----------|
| init_web_project | Initialize project | Start new app |
| install_dependencies | Install packages | Add libraries |
| run_dev_server | Start server | Test locally |

### Special Tools (2)

| Tool | Description | Use Case |
|------|-------------|----------|
| execute_parallel | Run 2000 tasks | Batch operations |
| use_template | Use template | Quick start projects |

---

## Next Steps

1. **Test Individual Tools** - Verify each tool works correctly
2. **Test Integration** - Test tools working together
3. **Update Documentation** - Add tool docs for users
4. **Monitor Usage** - Track which tools are most used
5. **Iterate** - Add more tools based on user needs

---

## Support

If you encounter issues:

1. Check tool registration in `/worker/src/tools.ts`
2. Verify feature flags in `/worker/src/config.ts`
3. Run tests: `npm test`
4. Check logs for errors
5. Review this guide

---

**Status:** ✅ Ready for Integration  
**Last Updated:** December 28, 2025  
**Tools Added:** 19  
**Total Tools:** 45+
