/**
 * Parallel Execution Engine
 * 
 * Execute up to 2000 tasks in parallel with intelligent concurrency control,
 * progress tracking, error handling, and result aggregation.
 * 
 * Similar to Manus's map tool but optimized for Morgus architecture.
 * 
 * Features:
 * - Massive parallelization (up to 2000 tasks)
 * - Intelligent concurrency control
 * - Real-time progress tracking
 * - Automatic retry on failures
 * - Resource monitoring
 * - Result aggregation
 */

export interface ParallelTask<TInput = any, TOutput = any> {
  id: string;
  input: TInput;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'retrying';
  result?: TOutput;
  error?: string;
  startTime?: number;
  endTime?: number;
  attempts: number;
  retries: number;
}

export interface ParallelExecutionConfig {
  maxConcurrency: number; // Max parallel executions (default: 50)
  timeout: number; // Per-task timeout in seconds (default: 300)
  retryFailedTasks: boolean; // Retry failed tasks (default: true)
  maxRetries: number; // Max retries per task (default: 2)
  continueOnError: boolean; // Continue if some tasks fail (default: true)
  onProgress?: (progress: ParallelProgress) => void;
  onTaskComplete?: (task: ParallelTask) => void;
  onTaskFailed?: (task: ParallelTask) => void;
}

export interface ParallelProgress {
  total: number;
  pending: number;
  running: number;
  completed: number;
  failed: number;
  retrying: number;
  percentComplete: number;
  elapsedTime: number;
  estimatedTimeRemaining: number;
  tasksPerSecond: number;
}

export interface ParallelResult<TOutput = any> {
  success: boolean;
  tasks: ParallelTask<any, TOutput>[];
  completed: number;
  failed: number;
  totalTime: number;
  errors: Array<{ taskId: string; error: string }>;
  results: TOutput[];
}

export const DEFAULT_PARALLEL_CONFIG: ParallelExecutionConfig = {
  maxConcurrency: 50,
  timeout: 300,
  retryFailedTasks: true,
  maxRetries: 2,
  continueOnError: true,
};

export class ParallelExecutor {
  private config: ParallelExecutionConfig;
  
  constructor(config: Partial<ParallelExecutionConfig> = {}) {
    this.config = { ...DEFAULT_PARALLEL_CONFIG, ...config };
  }
  
  /**
   * Execute tasks in parallel
   */
  async executeInParallel<TInput, TOutput>(
    inputs: TInput[],
    executor: (input: TInput, taskId: string) => Promise<TOutput>,
    config?: Partial<ParallelExecutionConfig>
  ): Promise<ParallelResult<TOutput>> {
    // Merge config
    const finalConfig = { ...this.config, ...config };
    
    // Validate input
    if (inputs.length === 0) {
      return {
        success: true,
        tasks: [],
        completed: 0,
        failed: 0,
        totalTime: 0,
        errors: [],
        results: [],
      };
    }
    
    if (inputs.length > 2000) {
      throw new Error(`Too many tasks: ${inputs.length}. Maximum is 2000.`);
    }
    
    // Initialize tasks
    const tasks: ParallelTask<TInput, TOutput>[] = inputs.map((input, index) => ({
      id: `task-${index + 1}`,
      input,
      status: 'pending',
      attempts: 0,
      retries: 0,
    }));
    
    const startTime = Date.now();
    const queue = [...tasks];
    const running = new Map<string, Promise<void>>();
    
    console.log(`[ParallelExecutor] Starting ${inputs.length} tasks with max concurrency ${finalConfig.maxConcurrency}`);
    
    // Execute tasks
    while (queue.length > 0 || running.size > 0) {
      // Start new tasks up to maxConcurrency
      while (queue.length > 0 && running.size < finalConfig.maxConcurrency) {
        const task = queue.shift()!;
        
        const promise = this.executeTask(
          task,
          executor,
          finalConfig
        ).finally(() => {
          running.delete(task.id);
          
          // Report progress
          this.reportProgress(tasks, startTime, finalConfig);
          
          // Check if task should be retried
          if (task.status === 'failed' && 
              finalConfig.retryFailedTasks && 
              task.retries < finalConfig.maxRetries) {
            task.status = 'retrying';
            task.retries++;
            queue.push(task);
          }
        });
        
        running.set(task.id, promise);
      }
      
      // Wait for at least one task to complete
      if (running.size > 0) {
        await Promise.race(running.values());
      }
    }
    
    const totalTime = Date.now() - startTime;
    
    // Aggregate results
    const completed = tasks.filter(t => t.status === 'completed').length;
    const failed = tasks.filter(t => t.status === 'failed').length;
    const errors = tasks
      .filter(t => t.status === 'failed')
      .map(t => ({ taskId: t.id, error: t.error || 'Unknown error' }));
    const results = tasks
      .filter(t => t.status === 'completed' && t.result !== undefined)
      .map(t => t.result!);
    
    console.log(`[ParallelExecutor] Completed: ${completed}/${tasks.length} tasks in ${(totalTime / 1000).toFixed(1)}s`);
    
    return {
      success: failed === 0 || finalConfig.continueOnError,
      tasks,
      completed,
      failed,
      totalTime,
      errors,
      results,
    };
  }
  
  /**
   * Execute a single task
   */
  private async executeTask<TInput, TOutput>(
    task: ParallelTask<TInput, TOutput>,
    executor: (input: TInput, taskId: string) => Promise<TOutput>,
    config: ParallelExecutionConfig
  ): Promise<void> {
    task.status = 'running';
    task.startTime = Date.now();
    task.attempts++;
    
    try {
      // Execute with timeout
      const result = await this.executeWithTimeout(
        () => executor(task.input, task.id),
        config.timeout * 1000
      );
      
      task.status = 'completed';
      task.result = result;
      task.endTime = Date.now();
      
      if (config.onTaskComplete) {
        config.onTaskComplete(task);
      }
      
    } catch (error: any) {
      task.status = 'failed';
      task.error = error.message || String(error);
      task.endTime = Date.now();
      
      if (config.onTaskFailed) {
        config.onTaskFailed(task);
      }
    }
  }
  
  /**
   * Execute with timeout
   */
  private async executeWithTimeout<T>(
    fn: () => Promise<T>,
    timeoutMs: number
  ): Promise<T> {
    return Promise.race([
      fn(),
      new Promise<T>((_, reject) => 
        setTimeout(() => reject(new Error('Task timeout')), timeoutMs)
      ),
    ]);
  }
  
  /**
   * Report progress
   */
  private reportProgress(
    tasks: ParallelTask[],
    startTime: number,
    config: ParallelExecutionConfig
  ): void {
    if (!config.onProgress) return;
    
    const pending = tasks.filter(t => t.status === 'pending').length;
    const running = tasks.filter(t => t.status === 'running').length;
    const completed = tasks.filter(t => t.status === 'completed').length;
    const failed = tasks.filter(t => t.status === 'failed').length;
    const retrying = tasks.filter(t => t.status === 'retrying').length;
    
    const elapsedTime = Date.now() - startTime;
    const percentComplete = (completed / tasks.length) * 100;
    const tasksPerSecond = completed / (elapsedTime / 1000);
    const estimatedTimeRemaining = tasksPerSecond > 0 
      ? ((tasks.length - completed) / tasksPerSecond) * 1000 
      : 0;
    
    config.onProgress({
      total: tasks.length,
      pending,
      running,
      completed,
      failed,
      retrying,
      percentComplete,
      elapsedTime,
      estimatedTimeRemaining,
      tasksPerSecond,
    });
  }
}

/**
 * Helper function for quick parallel execution
 */
export async function executeParallel<TInput, TOutput>(
  inputs: TInput[],
  executor: (input: TInput, taskId: string) => Promise<TOutput>,
  config?: Partial<ParallelExecutionConfig>
): Promise<TOutput[]> {
  const parallelExecutor = new ParallelExecutor(config);
  const result = await parallelExecutor.executeInParallel(inputs, executor, config);
  
  if (!result.success) {
    throw new Error(`Parallel execution failed: ${result.failed}/${result.tasks.length} tasks failed`);
  }
  
  return result.results;
}
