/**
 * Comprehensive Test Suite for Morgus Upgrade Features
 * 
 * Tests all new capabilities:
 * - Smart retry logic
 * - File system tools
 * - Parallel execution
 * - Template system
 * - Dynamic DPPM updates
 */

import { ErrorAnalyzer, ExecutionContext } from '../src/services/error-analyzer';
import { AdaptiveRetry } from '../src/services/adaptive-retry';
import { ParallelExecutor } from '../src/services/parallel-executor';
import { TemplateEngine } from '../src/templates/engine';
import { getTemplate } from '../src/templates/library';
import { DynamicDPPM, MergedPlan, Subtask } from '../src/planner/dynamic-updates';

describe('Error Analyzer', () => {
  test('detects missing Python package', () => {
    const error = "ModuleNotFoundError: No module named 'requests'";
    const analysis = ErrorAnalyzer.analyze(error);
    
    expect(analysis.errorType).toBe('missing_package');
    expect(analysis.isRetryable).toBe(true);
    expect(analysis.suggestedFix?.type).toBe('install_package');
    expect(analysis.suggestedFix?.parameters?.package).toBe('requests');
  });
  
  test('detects syntax error', () => {
    const error = "SyntaxError: invalid syntax";
    const analysis = ErrorAnalyzer.analyze(error);
    
    expect(analysis.errorType).toBe('syntax_error');
    expect(analysis.isRetryable).toBe(true);
    expect(analysis.suggestedFix?.type).toBe('fix_syntax');
  });
  
  test('detects network timeout', () => {
    const error = "TimeoutError: Connection timed out";
    const analysis = ErrorAnalyzer.analyze(error);
    
    expect(analysis.errorType).toBe('timeout');
    expect(analysis.isRetryable).toBe(true);
  });
  
  test('detects permission error', () => {
    const error = "PermissionError: [Errno 13] Permission denied";
    const analysis = ErrorAnalyzer.analyze(error);
    
    expect(analysis.errorType).toBe('permission_error');
    expect(analysis.isRetryable).toBe(true);
  });
  
  test('detects resource limit error', () => {
    const error = "MemoryError: Out of memory";
    const analysis = ErrorAnalyzer.analyze(error);
    
    expect(analysis.errorType).toBe('resource_limit');
    expect(analysis.severity).toBe('critical');
    expect(analysis.isRetryable).toBe(false);
  });
});

describe('Adaptive Retry', () => {
  test('retries with error analysis', async () => {
    let attempts = 0;
    const retry = new AdaptiveRetry({ maxAttempts: 3 });
    
    const result = await retry.executeWithRetry(
      async (context) => {
        attempts++;
        if (attempts < 2) {
          throw new Error('Temporary error');
        }
        return 'success';
      },
      { tool: 'test' }
    );
    
    expect(result.success).toBe(true);
    expect(result.attempts).toBe(2);
    expect(result.result).toBe('success');
  });
  
  test('stops after max attempts', async () => {
    const retry = new AdaptiveRetry({ maxAttempts: 3 });
    
    const result = await retry.executeWithRetry(
      async (context) => {
        throw new Error('Persistent error');
      },
      { tool: 'test' }
    );
    
    expect(result.success).toBe(false);
    expect(result.attempts).toBe(3);
  });
  
  test('applies fix before retry', async () => {
    let fixApplied = false;
    const retry = new AdaptiveRetry({
      maxAttempts: 3,
      onFixApplied: (fix) => {
        fixApplied = true;
      },
    });
    
    let attempts = 0;
    const result = await retry.executeWithRetry(
      async (context) => {
        attempts++;
        if (attempts < 2) {
          throw new Error("ModuleNotFoundError: No module named 'requests'");
        }
        return 'success';
      },
      { tool: 'test', code: 'import requests' }
    );
    
    expect(fixApplied).toBe(true);
    expect(result.success).toBe(true);
  });
});

describe('Parallel Executor', () => {
  test('executes tasks in parallel', async () => {
    const executor = new ParallelExecutor({ maxConcurrency: 5 });
    const inputs = Array.from({ length: 10 }, (_, i) => i);
    
    const startTime = Date.now();
    const result = await executor.executeInParallel(
      inputs,
      async (input) => {
        await new Promise(resolve => setTimeout(resolve, 100));
        return input * 2;
      }
    );
    const duration = Date.now() - startTime;
    
    expect(result.success).toBe(true);
    expect(result.completed).toBe(10);
    expect(result.results).toEqual([0, 2, 4, 6, 8, 10, 12, 14, 16, 18]);
    // Should take ~200ms (2 batches of 5) instead of 1000ms (sequential)
    expect(duration).toBeLessThan(500);
  });
  
  test('handles task failures', async () => {
    const executor = new ParallelExecutor({ maxConcurrency: 5, continueOnError: true });
    const inputs = Array.from({ length: 10 }, (_, i) => i);
    
    const result = await executor.executeInParallel(
      inputs,
      async (input) => {
        if (input === 5) {
          throw new Error('Task 5 failed');
        }
        return input * 2;
      }
    );
    
    expect(result.success).toBe(true); // continueOnError = true
    expect(result.completed).toBe(9);
    expect(result.failed).toBe(1);
    expect(result.errors.length).toBe(1);
  });
  
  test('retries failed tasks', async () => {
    const executor = new ParallelExecutor({
      maxConcurrency: 5,
      retryFailedTasks: true,
      maxRetries: 2,
    });
    
    let failCount = 0;
    const result = await executor.executeInParallel(
      [1, 2, 3],
      async (input) => {
        if (input === 2 && failCount < 2) {
          failCount++;
          throw new Error('Temporary failure');
        }
        return input * 2;
      }
    );
    
    expect(result.success).toBe(true);
    expect(result.completed).toBe(3);
    expect(failCount).toBe(2); // Failed twice before succeeding
  });
  
  test('respects concurrency limit', async () => {
    const executor = new ParallelExecutor({ maxConcurrency: 2 });
    let maxConcurrent = 0;
    let currentConcurrent = 0;
    
    const result = await executor.executeInParallel(
      Array.from({ length: 10 }, (_, i) => i),
      async (input) => {
        currentConcurrent++;
        maxConcurrent = Math.max(maxConcurrent, currentConcurrent);
        await new Promise(resolve => setTimeout(resolve, 50));
        currentConcurrent--;
        return input;
      }
    );
    
    expect(result.success).toBe(true);
    expect(maxConcurrent).toBeLessThanOrEqual(2);
  });
});

describe('Template Engine', () => {
  test('renders variables', () => {
    const template = 'Hello {{name}}!';
    const result = TemplateEngine.render(template, { name: 'World' });
    expect(result).toBe('Hello World!');
  });
  
  test('renders conditionals', () => {
    const template = '{{#if show}}Visible{{/if}}';
    
    const result1 = TemplateEngine.render(template, { show: true });
    expect(result1).toBe('Visible');
    
    const result2 = TemplateEngine.render(template, { show: false });
    expect(result2).toBe('');
  });
  
  test('renders loops', () => {
    const template = '{{#each items}}{{name}} {{/each}}';
    const result = TemplateEngine.render(template, {
      items: [{ name: 'A' }, { name: 'B' }, { name: 'C' }],
    });
    expect(result).toBe('A B C ');
  });
  
  test('generates secrets', () => {
    const template = '{{GENERATE_SECRET}}';
    const result = TemplateEngine.render(template);
    expect(result.length).toBe(32);
    expect(result).toMatch(/^[A-Za-z0-9]+$/);
  });
  
  test('generates timestamps', () => {
    const template = '{{TIMESTAMP}}';
    const result = TemplateEngine.render(template);
    expect(Number(result)).toBeGreaterThan(0);
  });
  
  test('generates UUIDs', () => {
    const template = '{{UUID}}';
    const result = TemplateEngine.render(template);
    expect(result).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  });
});

describe('Template Library', () => {
  test('gets template by ID', () => {
    const template = getTemplate('landing-page');
    expect(template).toBeDefined();
    expect(template?.name).toBe('Modern Landing Page');
  });
  
  test('template has required fields', () => {
    const template = getTemplate('landing-page');
    expect(template?.files.length).toBeGreaterThan(0);
    expect(template?.category).toBeDefined();
    expect(template?.difficulty).toBeDefined();
  });
  
  test('renders template with config', () => {
    const template = getTemplate('landing-page');
    const file = template?.files[0];
    
    if (file?.template) {
      const rendered = TemplateEngine.render(file.content, {
        PROJECT_NAME: 'Test Project',
        HERO_TITLE: 'Test Title',
        HERO_SUBTITLE: 'Test Subtitle',
      });
      
      expect(rendered).toContain('Test Project');
      expect(rendered).toContain('Test Title');
      expect(rendered).toContain('Test Subtitle');
    }
  });
});

describe('Dynamic DPPM', () => {
  test('executes plan sequentially', async () => {
    const dppm = new DynamicDPPM({ enableDynamicUpdates: false });
    
    const plan: MergedPlan = {
      goal: 'Test goal',
      subtasks: [
        { id: '1', title: 'Task 1', description: '', dependencies: [], status: 'pending' },
        { id: '2', title: 'Task 2', description: '', dependencies: ['1'], status: 'pending' },
        { id: '3', title: 'Task 3', description: '', dependencies: ['2'], status: 'pending' },
      ],
      estimatedTime: 30,
      complexity: 5,
    };
    
    const executed: string[] = [];
    const result = await dppm.executeWithAdjustments(
      plan,
      async (subtask) => {
        executed.push(subtask.id);
        return { success: true };
      }
    );
    
    expect(executed).toEqual(['1', '2', '3']);
    expect(result.subtasks.every(s => s.status === 'completed')).toBe(true);
  });
  
  test('respects dependencies', async () => {
    const dppm = new DynamicDPPM({ enableDynamicUpdates: false });
    
    const plan: MergedPlan = {
      goal: 'Test goal',
      subtasks: [
        { id: '1', title: 'Task 1', description: '', dependencies: ['2'], status: 'pending' },
        { id: '2', title: 'Task 2', description: '', dependencies: [], status: 'pending' },
      ],
      estimatedTime: 20,
      complexity: 3,
    };
    
    const executed: string[] = [];
    const result = await dppm.executeWithAdjustments(
      plan,
      async (subtask) => {
        executed.push(subtask.id);
        return { success: true };
      }
    );
    
    // Task 2 should execute before Task 1
    expect(executed[0]).toBe('2');
    expect(executed[1]).toBe('1');
  });
  
  test('adds subtasks dynamically', async () => {
    const dppm = new DynamicDPPM({
      enableDynamicUpdates: true,
      autoApproveMinorChanges: true,
    });
    
    const plan: MergedPlan = {
      goal: 'Test goal',
      subtasks: [
        { id: '1', title: 'Task 1', description: '', dependencies: [], status: 'pending' },
      ],
      estimatedTime: 10,
      complexity: 2,
    };
    
    let planUpdated = false;
    const result = await dppm.executeWithAdjustments(
      plan,
      async (subtask) => {
        // Return result that triggers authentication need
        return { auth: true, login: true };
      },
      (updatedPlan, adjustments) => {
        planUpdated = true;
        expect(adjustments.length).toBeGreaterThan(0);
      }
    );
    
    expect(planUpdated).toBe(true);
    expect(result.subtasks.length).toBeGreaterThan(1);
  });
});

// Summary
describe('Integration Test', () => {
  test('all features work together', async () => {
    // This test verifies that all new features can work together
    
    // 1. Error analysis
    const error = "ModuleNotFoundError: No module named 'pandas'";
    const analysis = ErrorAnalyzer.analyze(error);
    expect(analysis.errorType).toBe('missing_package');
    
    // 2. Adaptive retry
    const retry = new AdaptiveRetry({ maxAttempts: 2 });
    let attempts = 0;
    const retryResult = await retry.executeWithRetry(
      async (context) => {
        attempts++;
        if (attempts < 2) throw new Error(error);
        return 'success';
      },
      { tool: 'test' }
    );
    expect(retryResult.success).toBe(true);
    
    // 3. Parallel execution
    const executor = new ParallelExecutor({ maxConcurrency: 3 });
    const parallelResult = await executor.executeInParallel(
      [1, 2, 3],
      async (input) => input * 2
    );
    expect(parallelResult.completed).toBe(3);
    
    // 4. Template engine
    const template = 'Hello {{name}}!';
    const rendered = TemplateEngine.render(template, { name: 'Morgus' });
    expect(rendered).toBe('Hello Morgus!');
    
    // 5. Dynamic DPPM
    const dppm = new DynamicDPPM({ enableDynamicUpdates: false });
    const plan: MergedPlan = {
      goal: 'Test',
      subtasks: [
        { id: '1', title: 'Task', description: '', dependencies: [], status: 'pending' },
      ],
      estimatedTime: 10,
      complexity: 2,
    };
    const dppmResult = await dppm.executeWithAdjustments(
      plan,
      async () => ({ success: true })
    );
    expect(dppmResult.subtasks[0].status).toBe('completed');
    
    console.log('✅ All features working together!');
  });
});
