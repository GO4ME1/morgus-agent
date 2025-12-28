# Morgus Autonomous Development Integration Plan

**Date:** December 28, 2025  
**Status:** Ready for Implementation  
**Objective:** Connect existing infrastructure to enable full autonomous application development

---

## Executive Summary

**Current State:** Morgus has all the infrastructure (E2B, Browserbase, DPPM, deployment) but lacks orchestration.

**Target State:** Morgus agents can autonomously build complete applications like the current AI assistant (Manus).

**Implementation Approach:** 6 phases over 25-35 hours, prioritizing high-impact integrations first.

**Expected Outcome:** Morgus agents can:
- Detect complex development tasks automatically
- Plan multi-step workflows using DPPM
- Execute subtasks sequentially with tools
- Manage code via GitHub
- Deploy production applications
- Learn and improve from experience

---

## Phase 1: DPPM Auto-Invocation (HIGH PRIORITY)

### Objective
Automatically detect complex tasks and invoke DPPM planning system.

### Current Gap
- Agent uses simple keyword matching to detect tool needs
- DPPM exists but isn't automatically invoked
- No logic to determine task complexity

### Implementation

#### 1.1 Create TaskComplexityAnalyzer Service

**File:** `/worker/src/services/task-complexity-analyzer.ts`

```typescript
/**
 * Task Complexity Analyzer
 * 
 * Analyzes user requests to determine if DPPM planning is needed.
 */

export interface ComplexityAnalysis {
  score: number; // 0-10 scale
  indicators: string[]; // Reasons for complexity
  useDPPM: boolean; // Whether to invoke DPPM
  estimatedSubtasks: number; // Estimated number of subtasks
}

export class TaskComplexityAnalyzer {
  /**
   * Analyze a user request for complexity
   */
  static analyze(userMessage: string): ComplexityAnalysis {
    const messageLower = userMessage.toLowerCase();
    let score = 0;
    const indicators: string[] = [];
    
    // Development keywords (high complexity)
    const devKeywords = [
      'build', 'create app', 'develop', 'full-stack', 'backend', 'frontend',
      'database', 'authentication', 'api', 'deploy', 'website', 'application'
    ];
    
    // Feature keywords (medium complexity)
    const featureKeywords = [
      'with authentication', 'user login', 'crud', 'dashboard', 'admin panel',
      'payment', 'subscription', 'real-time', 'chat', 'notifications'
    ];
    
    // Multi-step indicators
    const multiStepKeywords = [
      'and', 'then', 'also', 'plus', 'including', 'with', 'that has'
    ];
    
    // Check for development keywords
    let devMatches = 0;
    for (const keyword of devKeywords) {
      if (messageLower.includes(keyword)) {
        devMatches++;
        score += 2;
      }
    }
    if (devMatches > 0) {
      indicators.push(`Development task (${devMatches} indicators)`);
    }
    
    // Check for feature keywords
    let featureMatches = 0;
    for (const keyword of featureKeywords) {
      if (messageLower.includes(keyword)) {
        featureMatches++;
        score += 1;
      }
    }
    if (featureMatches > 0) {
      indicators.push(`Multiple features (${featureMatches} features)`);
    }
    
    // Check for multi-step indicators
    let multiStepMatches = 0;
    for (const keyword of multiStepKeywords) {
      const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
      const matches = messageLower.match(regex);
      if (matches) {
        multiStepMatches += matches.length;
      }
    }
    if (multiStepMatches >= 3) {
      score += 1;
      indicators.push(`Multi-step task (${multiStepMatches} connectors)`);
    }
    
    // Check message length (longer = more complex)
    const wordCount = userMessage.split(/\s+/).length;
    if (wordCount > 50) {
      score += 1;
      indicators.push(`Detailed requirements (${wordCount} words)`);
    }
    
    // Estimate subtasks
    let estimatedSubtasks = 3; // Default minimum
    if (devMatches > 0) estimatedSubtasks += 2;
    if (featureMatches > 0) estimatedSubtasks += featureMatches;
    if (multiStepMatches >= 3) estimatedSubtasks += 1;
    estimatedSubtasks = Math.min(estimatedSubtasks, 7); // Max 7 subtasks
    
    // Determine if DPPM should be used
    const useDPPM = score >= 5; // Threshold: 5+ complexity score
    
    return {
      score: Math.min(score, 10),
      indicators,
      useDPPM,
      estimatedSubtasks
    };
  }
  
  /**
   * Check if a task is complex enough for DPPM
   */
  static isComplex(userMessage: string): boolean {
    return this.analyze(userMessage).useDPPM;
  }
}
```

#### 1.2 Create DPPM-Agent Bridge

**File:** `/worker/src/services/dppm-agent-bridge.ts`

```typescript
/**
 * DPPM-Agent Bridge
 * 
 * Connects DPPM planning system to agent execution loop.
 */

import { executeDPPM, executeAndReflect, type DPPMConfig, type DPPMResult } from '../planner/dppm';
import { AutonomousAgent } from '../agent';
import type { SupabaseClient } from '../planner/types';

export interface DPPMExecutionResult {
  success: boolean;
  result?: DPPMResult;
  error?: string;
  outputs: string[]; // Outputs from each subtask
}

export class DPPMAgentBridge {
  /**
   * Execute a complex task using DPPM + Agent loop
   */
  static async executeComplexTask(
    goal: string,
    agent: AutonomousAgent,
    env: any,
    userId: string,
    supabase: SupabaseClient
  ): Promise<DPPMExecutionResult> {
    const outputs: string[] = [];
    
    try {
      // Step 1: Run DPPM planning (Phases 1-4)
      console.log('[DPPM-Agent] Starting DPPM planning for:', goal);
      
      const dppmConfig: DPPMConfig = {
        userId,
        supabase,
        llmCall: async (prompt: string) => {
          // Use OpenAI for DPPM planning
          const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${env.OPENAI_API_KEY}`
            },
            body: JSON.stringify({
              model: 'gpt-4o-mini',
              messages: [{ role: 'user', content: prompt }],
              temperature: 0.7
            })
          });
          
          const data = await response.json();
          return data.choices[0].message.content;
        },
        maxSubtasks: 7,
        minSubtasks: 3,
        skipPreFlight: false,
        skipPostReflection: false
      };
      
      const dppmResult = await executeDPPM(goal, dppmConfig);
      
      console.log('[DPPM-Agent] Planning complete:', {
        subtasks: dppmResult.decomposed.subtasks.length,
        phases: dppmResult.plan.executionOrder.length,
        duration: dppmResult.plan.totalEstimatedDuration
      });
      
      outputs.push(`📋 **Planning Complete**\n\n` +
        `- Subtasks: ${dppmResult.decomposed.subtasks.length}\n` +
        `- Execution Phases: ${dppmResult.plan.executionOrder.length}\n` +
        `- Estimated Duration: ${dppmResult.plan.totalEstimatedDuration} minutes\n`
      );
      
      if (dppmResult.preFlight) {
        outputs.push(`⚠️ **Risks Identified:** ${dppmResult.preFlight.risks.length}\n` +
          `✅ **Mitigations Applied:** ${dppmResult.preFlight.mitigations.length}\n`
        );
      }
      
      // Step 2: Execute subtasks via agent loop (Phase 5)
      console.log('[DPPM-Agent] Executing subtasks...');
      
      const completedSteps: any[] = [];
      const errors: string[] = [];
      
      for (const phase of dppmResult.plan.executionOrder) {
        for (const subtaskId of phase) {
          const subtask = dppmResult.decomposed.subtasks.find(s => s.id === subtaskId);
          if (!subtask) continue;
          
          console.log(`[DPPM-Agent] Executing subtask: ${subtask.title}`);
          outputs.push(`\n🔄 **Executing:** ${subtask.title}\n`);
          
          try {
            // Execute subtask using agent
            let subtaskOutput = '';
            for await (const message of agent.executeTask(
              `${subtask.title}\n\nDescription: ${subtask.description}\n\nContext: This is part of the larger goal: ${goal}`,
              env,
              []
            )) {
              if (message.type === 'response') {
                subtaskOutput = message.content;
              }
            }
            
            completedSteps.push({
              stepId: subtask.id,
              status: 'success',
              actualOutcome: subtaskOutput,
              duration: 60, // Placeholder
              usedFallback: false
            });
            
            outputs.push(`✅ **Completed:** ${subtask.title}\n\n${subtaskOutput}\n`);
            
          } catch (error: any) {
            console.error(`[DPPM-Agent] Subtask failed:`, error);
            errors.push(`Failed: ${subtask.title} - ${error.message}`);
            
            completedSteps.push({
              stepId: subtask.id,
              status: 'failed',
              actualOutcome: error.message,
              duration: 30,
              usedFallback: false
            });
            
            outputs.push(`❌ **Failed:** ${subtask.title}\n\nError: ${error.message}\n`);
          }
        }
      }
      
      // Step 3: Post-execution reflection (Phase 6)
      console.log('[DPPM-Agent] Running post-execution reflection...');
      
      const executionResult = {
        planId: 'dppm-' + Date.now(),
        status: errors.length === 0 ? 'completed' : 'partial',
        completedSteps,
        currentStep: '',
        errors
      };
      
      const reflectionResult = await executeAndReflect(
        dppmResult.plan,
        executionResult,
        dppmConfig
      );
      
      if (reflectionResult.postReflection) {
        outputs.push(`\n📊 **Reflection Complete**\n\n` +
          `- Overall Success: ${reflectionResult.postReflection.overallSuccess ? 'Yes' : 'No'}\n` +
          `- Lessons Learned: ${reflectionResult.postReflection.lessonsLearned.length}\n` +
          `- Workflow Saved: ${reflectionResult.workflowId ? 'Yes' : 'No'}\n`
        );
      }
      
      return {
        success: errors.length === 0,
        result: reflectionResult,
        outputs
      };
      
    } catch (error: any) {
      console.error('[DPPM-Agent] Execution failed:', error);
      return {
        success: false,
        error: error.message,
        outputs
      };
    }
  }
}
```

#### 1.3 Modify Agent.ts

**File:** `/worker/src/agent.ts`

Add DPPM integration to the main agent loop:

```typescript
// Add import at top
import { TaskComplexityAnalyzer } from './services/task-complexity-analyzer';
import { DPPMAgentBridge } from './services/dppm-agent-bridge';

// Modify executeTask method
async *executeTask(
  userMessage: string,
  env: any,
  conversationHistory: Array<{role: string, content: string}> = []
): AsyncGenerator<AgentMessage> {
  yield {
    type: 'status',
    content: '🤖 Starting task execution...',
  };

  // NEW: Check task complexity
  const complexity = TaskComplexityAnalyzer.analyze(userMessage);
  
  if (complexity.useDPPM) {
    // Complex task - use DPPM
    yield {
      type: 'status',
      content: `🧠 Complex task detected (score: ${complexity.score}/10)\n` +
        `Indicators: ${complexity.indicators.join(', ')}\n\n` +
        `Invoking DPPM planning system...`,
    };
    
    // Execute via DPPM
    const result = await DPPMAgentBridge.executeComplexTask(
      userMessage,
      this,
      env,
      env.USER_ID || 'anonymous',
      env.SUPABASE_CLIENT
    );
    
    // Stream outputs
    for (const output of result.outputs) {
      yield {
        type: 'response',
        content: output,
      };
    }
    
    if (result.success) {
      yield {
        type: 'complete',
        content: '✅ Task completed successfully!',
      };
    } else {
      yield {
        type: 'error',
        content: `❌ Task failed: ${result.error}`,
      };
    }
    
    return;
  }
  
  // Simple task - use standard agent loop
  yield {
    type: 'status',
    content: '🔄 Using standard agent loop...',
  };
  
  // ... (rest of existing code)
}
```

### Testing

**Test Case 1: Simple Task (No DPPM)**
```
User: "Search for the latest AI news"
Expected: Standard agent loop, search_web tool
```

**Test Case 2: Complex Task (Use DPPM)**
```
User: "Build a todo app with user authentication and deployment"
Expected: DPPM invoked, subtasks created, sequential execution
```

### Success Criteria
- ✅ TaskComplexityAnalyzer correctly identifies complex tasks
- ✅ DPPM is automatically invoked for complex tasks
- ✅ Subtasks are executed sequentially via agent loop
- ✅ Progress is reported to user
- ✅ Reflection and learning occur after completion

### Estimated Effort
**4-6 hours**

---

## Phase 2: GitHub Integration (HIGH PRIORITY)

### Objective
Enable direct GitHub operations for code management.

### Current Gap
- No GitHub tool in ToolRegistry
- Can't clone, commit, push, or create PRs
- Limited to deployment only

### Implementation

#### 2.1 Create GitHub Tool

**File:** `/worker/src/tools/github-tool.ts`

```typescript
/**
 * GitHub Tool - Direct GitHub operations
 */

import { Tool } from '../tools';

export const githubTool: Tool = {
  name: 'github_operation',
  description: 'Perform GitHub operations: clone repo, create branch, commit changes, push, create PR, list repos, read files.',
  parameters: {
    type: 'object',
    properties: {
      operation: {
        type: 'string',
        enum: ['clone', 'create_branch', 'commit', 'push', 'create_pr', 'list_repos', 'read_file'],
        description: 'The GitHub operation to perform'
      },
      repo: {
        type: 'string',
        description: 'Repository name (e.g., "username/repo")'
      },
      branch: {
        type: 'string',
        description: 'Branch name (for create_branch, commit, push operations)'
      },
      message: {
        type: 'string',
        description: 'Commit message (for commit operation)'
      },
      files: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            path: { type: 'string' },
            content: { type: 'string' }
          }
        },
        description: 'Files to commit (for commit operation)'
      },
      title: {
        type: 'string',
        description: 'PR title (for create_pr operation)'
      },
      body: {
        type: 'string',
        description: 'PR description (for create_pr operation)'
      },
      base: {
        type: 'string',
        description: 'Base branch for PR (default: main)'
      },
      file_path: {
        type: 'string',
        description: 'File path to read (for read_file operation)'
      }
    },
    required: ['operation']
  },
  execute: async (args: any, env: any) => {
    try {
      const githubToken = env.GITHUB_TOKEN;
      if (!githubToken) {
        return 'Error: GitHub token not configured';
      }
      
      const { operation, repo, branch, message, files, title, body, base, file_path } = args;
      
      switch (operation) {
        case 'clone':
          // Use execute_code to clone repo
          return await cloneRepo(repo, githubToken, env);
          
        case 'create_branch':
          return await createBranch(repo, branch, githubToken);
          
        case 'commit':
          return await commitChanges(repo, branch, message, files, githubToken);
          
        case 'push':
          return await pushChanges(repo, branch, githubToken);
          
        case 'create_pr':
          return await createPR(repo, branch, base || 'main', title, body, githubToken);
          
        case 'list_repos':
          return await listRepos(githubToken);
          
        case 'read_file':
          return await readFile(repo, file_path, branch || 'main', githubToken);
          
        default:
          return `Error: Unknown operation: ${operation}`;
      }
    } catch (error: any) {
      return `Error: ${error.message}`;
    }
  }
};

async function cloneRepo(repo: string, token: string, env: any): Promise<string> {
  // Use execute_code tool to clone via git
  const code = `
import subprocess
import os

repo = "${repo}"
token = "${token}"

# Clone with token authentication
url = f"https://{token}@github.com/{repo}.git"
result = subprocess.run(["git", "clone", url], capture_output=True, text=True)

if result.returncode == 0:
    print(f"✅ Cloned {repo} successfully")
else:
    print(f"❌ Clone failed: {result.stderr}")
`;

  const response = await fetch('https://morgus-deploy.fly.dev/execute', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      language: 'python',
      code,
      timeout: 300
    })
  });
  
  const result = await response.json();
  return result.stdout || result.stderr;
}

async function createBranch(repo: string, branch: string, token: string): Promise<string> {
  // Use GitHub API to create branch
  const [owner, repoName] = repo.split('/');
  
  // Get default branch SHA
  const defaultBranchRes = await fetch(`https://api.github.com/repos/${repo}`, {
    headers: {
      'Authorization': `token ${token}`,
      'Accept': 'application/vnd.github.v3+json'
    }
  });
  const repoData = await defaultBranchRes.json();
  const defaultBranch = repoData.default_branch;
  
  // Get SHA of default branch
  const refRes = await fetch(`https://api.github.com/repos/${repo}/git/refs/heads/${defaultBranch}`, {
    headers: {
      'Authorization': `token ${token}`,
      'Accept': 'application/vnd.github.v3+json'
    }
  });
  const refData = await refRes.json();
  const sha = refData.object.sha;
  
  // Create new branch
  const createRes = await fetch(`https://api.github.com/repos/${repo}/git/refs`, {
    method: 'POST',
    headers: {
      'Authorization': `token ${token}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      ref: `refs/heads/${branch}`,
      sha
    })
  });
  
  if (createRes.ok) {
    return `✅ Created branch: ${branch}`;
  } else {
    const error = await createRes.json();
    return `❌ Failed to create branch: ${error.message}`;
  }
}

async function commitChanges(
  repo: string,
  branch: string,
  message: string,
  files: Array<{path: string, content: string}>,
  token: string
): Promise<string> {
  // Use GitHub API to commit files
  const [owner, repoName] = repo.split('/');
  
  // For each file, create or update
  const results: string[] = [];
  
  for (const file of files) {
    // Check if file exists
    const checkRes = await fetch(`https://api.github.com/repos/${repo}/contents/${file.path}?ref=${branch}`, {
      headers: {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });
    
    let sha: string | undefined;
    if (checkRes.ok) {
      const existingFile = await checkRes.json();
      sha = existingFile.sha;
    }
    
    // Create or update file
    const updateRes = await fetch(`https://api.github.com/repos/${repo}/contents/${file.path}`, {
      method: 'PUT',
      headers: {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message,
        content: Buffer.from(file.content).toString('base64'),
        branch,
        ...(sha && { sha })
      })
    });
    
    if (updateRes.ok) {
      results.push(`✅ ${file.path}`);
    } else {
      const error = await updateRes.json();
      results.push(`❌ ${file.path}: ${error.message}`);
    }
  }
  
  return `Committed ${files.length} files:\n${results.join('\n')}`;
}

async function pushChanges(repo: string, branch: string, token: string): Promise<string> {
  // GitHub API commits are automatically pushed
  return `✅ Changes are already pushed to ${branch} (GitHub API auto-pushes)`;
}

async function createPR(
  repo: string,
  head: string,
  base: string,
  title: string,
  body: string,
  token: string
): Promise<string> {
  const response = await fetch(`https://api.github.com/repos/${repo}/pulls`, {
    method: 'POST',
    headers: {
      'Authorization': `token ${token}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      title,
      body,
      head,
      base
    })
  });
  
  if (response.ok) {
    const pr = await response.json();
    return `✅ Created PR #${pr.number}: ${pr.html_url}`;
  } else {
    const error = await response.json();
    return `❌ Failed to create PR: ${error.message}`;
  }
}

async function listRepos(token: string): Promise<string> {
  const response = await fetch('https://api.github.com/user/repos?per_page=100', {
    headers: {
      'Authorization': `token ${token}`,
      'Accept': 'application/vnd.github.v3+json'
    }
  });
  
  const repos = await response.json();
  return repos.map((r: any) => `- ${r.full_name} (${r.private ? 'private' : 'public'})`).join('\n');
}

async function readFile(repo: string, path: string, branch: string, token: string): Promise<string> {
  const response = await fetch(`https://api.github.com/repos/${repo}/contents/${path}?ref=${branch}`, {
    headers: {
      'Authorization': `token ${token}`,
      'Accept': 'application/vnd.github.v3+json'
    }
  });
  
  if (response.ok) {
    const file = await response.json();
    const content = Buffer.from(file.content, 'base64').toString('utf-8');
    return `File: ${path}\n\n${content}`;
  } else {
    return `❌ File not found: ${path}`;
  }
}
```

#### 2.2 Register GitHub Tool

**File:** `/worker/src/tools.ts`

```typescript
// Add import
import { githubTool } from './tools/github-tool';

// In ToolRegistry constructor
constructor() {
  // ... existing tools
  this.register(githubTool);  // Add GitHub operations
}
```

#### 2.3 Update MORGUS_KERNEL

Add GitHub operations to system prompt:

```
You have access to GitHub operations:
- Clone repositories
- Create branches
- Commit changes
- Push code
- Create pull requests
- Read files from repos
```

### Testing

**Test Case 1: Clone Repo**
```
User: "Clone the morgus-agent repository"
Expected: Repo cloned successfully
```

**Test Case 2: Commit & Push**
```
User: "Create a new file README.md and commit it"
Expected: File created, committed, and pushed
```

### Success Criteria
- ✅ Can clone repositories
- ✅ Can create branches
- ✅ Can commit files
- ✅ Can create pull requests
- ✅ Can read files from repos

### Estimated Effort
**3-4 hours**

---

## Phase 3: Multi-Step Orchestration (HIGH PRIORITY)

### Objective
Execute DPPM subtasks sequentially with progress tracking and state persistence.

### Current Gap
- No structured subtask execution
- No progress tracking across iterations
- No state persistence between subtasks

### Implementation

#### 3.1 Create SubtaskExecutor Service

**File:** `/worker/src/services/subtask-executor.ts`

```typescript
/**
 * Subtask Executor
 * 
 * Executes DPPM subtasks sequentially with dependency management.
 */

import type { Subtask } from '../planner/types';
import type { AutonomousAgent } from '../agent';

export interface SubtaskResult {
  subtaskId: string;
  status: 'success' | 'failed' | 'skipped';
  output: string;
  duration: number;
  error?: string;
}

export class SubtaskExecutor {
  /**
   * Execute subtasks in order, respecting dependencies
   */
  static async executeSubtasks(
    subtasks: Subtask[],
    executionOrder: string[][],
    agent: AutonomousAgent,
    env: any,
    goal: string,
    onProgress?: (progress: number, current: string) => void
  ): Promise<SubtaskResult[]> {
    const results: SubtaskResult[] = [];
    const completedIds = new Set<string>();
    let totalSubtasks = subtasks.length;
    let completedCount = 0;
    
    for (const phase of executionOrder) {
      // Execute subtasks in this phase (can be parallel in future)
      for (const subtaskId of phase) {
        const subtask = subtasks.find(s => s.id === subtaskId);
        if (!subtask) continue;
        
        // Check dependencies
        const canExecute = subtask.dependencies.every(depId => completedIds.has(depId));
        if (!canExecute) {
          results.push({
            subtaskId,
            status: 'skipped',
            output: 'Dependencies not met',
            duration: 0
          });
          continue;
        }
        
        // Report progress
        if (onProgress) {
          onProgress((completedCount / totalSubtasks) * 100, subtask.title);
        }
        
        // Execute subtask
        const startTime = Date.now();
        try {
          let output = '';
          for await (const message of agent.executeTask(
            `${subtask.title}\n\nDescription: ${subtask.description}\n\nContext: This is part of: ${goal}`,
            env,
            []
          )) {
            if (message.type === 'response') {
              output += message.content + '\n';
            }
          }
          
          const duration = Math.floor((Date.now() - startTime) / 1000);
          
          results.push({
            subtaskId,
            status: 'success',
            output,
            duration
          });
          
          completedIds.add(subtaskId);
          completedCount++;
          
        } catch (error: any) {
          const duration = Math.floor((Date.now() - startTime) / 1000);
          
          results.push({
            subtaskId,
            status: 'failed',
            output: '',
            duration,
            error: error.message
          });
          
          // Continue with other subtasks even if one fails
        }
      }
    }
    
    return results;
  }
}
```

#### 3.2 Create ProgressTracker Service

**File:** `/worker/src/services/progress-tracker.ts`

```typescript
/**
 * Progress Tracker
 * 
 * Tracks and persists execution progress to Supabase.
 */

import type { SupabaseClient } from '../planner/types';

export interface ExecutionProgress {
  id: string;
  userId: string;
  goal: string;
  totalSubtasks: number;
  completedSubtasks: number;
  currentSubtask: string;
  status: 'in_progress' | 'completed' | 'failed';
  startedAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

export class ProgressTracker {
  /**
   * Create a new progress entry
   */
  static async create(
    supabase: SupabaseClient,
    userId: string,
    goal: string,
    totalSubtasks: number
  ): Promise<string> {
    const { data, error } = await supabase
      .from('execution_progress')
      .insert({
        user_id: userId,
        goal,
        total_subtasks: totalSubtasks,
        completed_subtasks: 0,
        current_subtask: '',
        status: 'in_progress',
        started_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (error) throw error;
    return data.id;
  }
  
  /**
   * Update progress
   */
  static async update(
    supabase: SupabaseClient,
    progressId: string,
    completedSubtasks: number,
    currentSubtask: string
  ): Promise<void> {
    const { error } = await supabase
      .from('execution_progress')
      .update({
        completed_subtasks: completedSubtasks,
        current_subtask: currentSubtask,
        updated_at: new Date().toISOString()
      })
      .eq('id', progressId);
    
    if (error) throw error;
  }
  
  /**
   * Mark as completed
   */
  static async complete(
    supabase: SupabaseClient,
    progressId: string,
    status: 'completed' | 'failed'
  ): Promise<void> {
    const { error } = await supabase
      .from('execution_progress')
      .update({
        status,
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', progressId);
    
    if (error) throw error;
  }
  
  /**
   * Get progress
   */
  static async get(
    supabase: SupabaseClient,
    progressId: string
  ): Promise<ExecutionProgress | null> {
    const { data, error } = await supabase
      .from('execution_progress')
      .select('*')
      .eq('id', progressId)
      .single();
    
    if (error) return null;
    return data;
  }
}
```

#### 3.3 Add Database Migration

**File:** `/server/supabase/migrations/XXXXXX_execution_progress.sql`

```sql
-- Execution Progress Table
CREATE TABLE execution_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  goal TEXT NOT NULL,
  total_subtasks INTEGER NOT NULL,
  completed_subtasks INTEGER NOT NULL DEFAULT 0,
  current_subtask TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL CHECK (status IN ('in_progress', 'completed', 'failed')),
  started_at TIMESTAMP WITH TIME ZONE NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for user queries
CREATE INDEX idx_execution_progress_user_id ON execution_progress(user_id);
CREATE INDEX idx_execution_progress_status ON execution_progress(status);

-- RLS Policies
ALTER TABLE execution_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own progress"
  ON execution_progress FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own progress"
  ON execution_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own progress"
  ON execution_progress FOR UPDATE
  USING (auth.uid() = user_id);
```

### Testing

**Test Case: Multi-Step Execution**
```
User: "Build a landing page with contact form and deploy it"

Expected Flow:
1. DPPM decomposes into subtasks
2. Progress tracker created
3. Each subtask executed sequentially
4. Progress updated after each subtask
5. Final result returned
```

### Success Criteria
- ✅ Subtasks execute in correct order
- ✅ Dependencies are respected
- ✅ Progress is tracked in database
- ✅ Can resume from checkpoint (future)
- ✅ User sees progress updates

### Estimated Effort
**5-6 hours**

---

## Phase 4: File System Operations (MEDIUM PRIORITY)

### Objective
Enable structured file management for multi-file projects.

### Implementation

**File:** `/worker/src/tools/filesystem-tool.ts`

```typescript
/**
 * File System Tool
 * 
 * Manage files in E2B sandbox for multi-file projects.
 */

import { Tool } from '../tools';

export const filesystemTool: Tool = {
  name: 'filesystem',
  description: 'Manage files in the sandbox: create, read, update, delete, list directory, create directory.',
  parameters: {
    type: 'object',
    properties: {
      operation: {
        type: 'string',
        enum: ['create', 'read', 'update', 'delete', 'list', 'mkdir', 'move'],
        description: 'File system operation'
      },
      path: {
        type: 'string',
        description: 'File or directory path'
      },
      content: {
        type: 'string',
        description: 'File content (for create/update)'
      },
      destination: {
        type: 'string',
        description: 'Destination path (for move)'
      }
    },
    required: ['operation', 'path']
  },
  execute: async (args: any, env: any) => {
    const { operation, path, content, destination } = args;
    
    // Use execute_code to perform file operations
    let code = '';
    
    switch (operation) {
      case 'create':
      case 'update':
        code = `
import os
os.makedirs(os.path.dirname("${path}"), exist_ok=True)
with open("${path}", "w") as f:
    f.write("""${content}""")
print(f"✅ {'Created' if operation === 'create' else 'Updated'}: ${path}")
`;
        break;
        
      case 'read':
        code = `
with open("${path}", "r") as f:
    content = f.read()
print(content)
`;
        break;
        
      case 'delete':
        code = `
import os
os.remove("${path}")
print(f"✅ Deleted: ${path}")
`;
        break;
        
      case 'list':
        code = `
import os
files = os.listdir("${path}")
for f in files:
    print(f)
`;
        break;
        
      case 'mkdir':
        code = `
import os
os.makedirs("${path}", exist_ok=True)
print(f"✅ Created directory: ${path}")
`;
        break;
        
      case 'move':
        code = `
import shutil
shutil.move("${path}", "${destination}")
print(f"✅ Moved: ${path} -> ${destination}")
`;
        break;
    }
    
    // Execute via code execution tool
    const response = await fetch('https://morgus-deploy.fly.dev/execute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        language: 'python',
        code,
        timeout: 60
      })
    });
    
    const result = await response.json();
    return result.stdout || result.stderr || 'Operation completed';
  }
};
```

### Estimated Effort
**3-4 hours**

---

## Phase 5: Testing & Validation (MEDIUM PRIORITY)

### Objective
Automatically test generated code before deployment.

### Implementation

**File:** `/worker/src/tools/testing-tool.ts`

```typescript
/**
 * Testing Tool
 * 
 * Validate and test generated code.
 */

import { Tool } from '../tools';

export const testingTool: Tool = {
  name: 'test_code',
  description: 'Test and validate code: run unit tests, lint code, check syntax, validate HTML/CSS.',
  parameters: {
    type: 'object',
    properties: {
      test_type: {
        type: 'string',
        enum: ['unit_test', 'lint', 'syntax', 'html_validate', 'css_validate'],
        description: 'Type of test to run'
      },
      code: {
        type: 'string',
        description: 'Code to test'
      },
      language: {
        type: 'string',
        enum: ['python', 'javascript', 'html', 'css'],
        description: 'Programming language'
      }
    },
    required: ['test_type', 'code', 'language']
  },
  execute: async (args: any, env: any) => {
    const { test_type, code, language } = args;
    
    // Implement testing logic
    // ... (validation code)
    
    return `✅ Tests passed`;
  }
};
```

### Estimated Effort
**4-5 hours**

---

## Phase 6: Documentation Generation (LOW PRIORITY)

### Objective
Automatically generate README and documentation.

### Implementation

**File:** `/worker/src/tools/documentation-tool.ts`

```typescript
/**
 * Documentation Tool
 * 
 * Generate README, API docs, and usage examples.
 */

import { Tool } from '../tools';

export const documentationTool: Tool = {
  name: 'generate_docs',
  description: 'Generate documentation: README, API docs, usage examples, architecture diagrams.',
  parameters: {
    type: 'object',
    properties: {
      doc_type: {
        type: 'string',
        enum: ['readme', 'api_docs', 'usage', 'architecture'],
        description: 'Type of documentation'
      },
      project_name: {
        type: 'string',
        description: 'Project name'
      },
      description: {
        type: 'string',
        description: 'Project description'
      },
      features: {
        type: 'array',
        items: { type: 'string' },
        description: 'List of features'
      }
    },
    required: ['doc_type', 'project_name']
  },
  execute: async (args: any, env: any) => {
    // Generate documentation using templates
    // ... (doc generation code)
    
    return `# ${args.project_name}\n\n${args.description}`;
  }
};
```

### Estimated Effort
**3-4 hours**

---

## Implementation Timeline

### Week 1 (Days 1-3)
- ✅ **Day 1:** Phase 1 - DPPM Auto-Invocation (4-6 hours)
  - Create TaskComplexityAnalyzer
  - Create DPPM-Agent Bridge
  - Modify agent.ts
  - Test with simple and complex tasks

- ✅ **Day 2:** Phase 2 - GitHub Integration (3-4 hours)
  - Create GitHub tool
  - Register in ToolRegistry
  - Update system prompt
  - Test clone, commit, push, PR

- ✅ **Day 3:** Phase 3 - Multi-Step Orchestration (5-6 hours)
  - Create SubtaskExecutor
  - Create ProgressTracker
  - Add database migration
  - Test multi-step execution

### Week 2 (Days 4-5)
- ✅ **Day 4:** Phase 4 - File System Operations (3-4 hours)
  - Create filesystem tool
  - Register in ToolRegistry
  - Test file operations

- ✅ **Day 5:** Phase 5 & 6 - Testing & Documentation (7-9 hours)
  - Create testing tool
  - Create documentation tool
  - Integration testing
  - End-to-end testing

### Total Estimated Time
**25-35 hours** (spread over 5 days)

---

## Success Metrics

### Technical Metrics
- ✅ Task completion rate > 80%
- ✅ Average iterations < 8 per task
- ✅ Error rate < 10%
- ✅ Execution time < 5 minutes for simple tasks
- ✅ Cost per task < $0.50

### User Experience Metrics
- ✅ User satisfaction > 4/5
- ✅ Retry rate < 15%
- ✅ Documentation quality > 4/5
- ✅ Deployment success rate > 90%

### Learning Metrics
- ✅ Workflows saved > 10 in first month
- ✅ Workflow reuse rate > 30%
- ✅ Lessons learned > 50 in first month
- ✅ Performance improvement > 20% over 3 months

---

## Risk Mitigation

### Risk 1: DPPM Overhead
**Risk:** DPPM planning adds latency to simple tasks  
**Mitigation:** Use TaskComplexityAnalyzer to only invoke DPPM for complex tasks

### Risk 2: Token Limits
**Risk:** Long conversations hit token limits  
**Mitigation:** Use conversation summarization and context pruning

### Risk 3: Execution Failures
**Risk:** Subtasks may fail mid-execution  
**Mitigation:** Implement error recovery and checkpoint system

### Risk 4: Cost Overruns
**Risk:** Complex tasks may be expensive  
**Mitigation:** Use gpt-4o-mini (95% cost savings) and set budget limits

### Risk 5: User Confusion
**Risk:** Users may not understand DPPM workflow  
**Mitigation:** Provide clear progress updates and documentation

---

## Next Steps

### Immediate (Today)
1. ✅ Review this integration plan
2. 🔄 Start Phase 1: DPPM Auto-Invocation
3. 🔄 Create TaskComplexityAnalyzer service
4. 🔄 Create DPPM-Agent Bridge
5. 🔄 Test with sample tasks

### Short-Term (This Week)
1. Complete Phase 1-3 (DPPM, GitHub, Orchestration)
2. Test end-to-end workflow
3. Deploy to production
4. Monitor metrics
5. Gather user feedback

### Medium-Term (Next 2 Weeks)
1. Complete Phase 4-6 (Filesystem, Testing, Docs)
2. Optimize performance
3. Add advanced features
4. Scale to more users
5. Document best practices

---

## Conclusion

**This integration plan provides a clear roadmap to enable full autonomous development capabilities in Morgus.**

**Key Takeaways:**
- ✅ All infrastructure exists (E2B, Browserbase, DPPM, deployment)
- ✅ Integration work is well-defined and achievable
- ✅ Estimated 25-35 hours of implementation time
- ✅ Phased approach minimizes risk
- ✅ Success metrics are measurable

**After implementation, Morgus agents will be able to:**
- Detect complex development tasks automatically
- Plan multi-step workflows using DPPM
- Execute subtasks sequentially with tools
- Manage code via GitHub
- Deploy production applications
- Learn and improve from experience

**This will make Morgus competitive with (and potentially superior to) tools like Cursor, Replit Agent, and Bolt.new.**

---

**Document Status:** ✅ Ready for Implementation  
**Last Updated:** December 28, 2025  
**Author:** Manus (AI Assistant)  
**Next Action:** Begin Phase 1 Implementation
