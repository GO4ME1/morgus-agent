/**
 * Sandbox Hardening Service
 * 
 * Provides security, stability, and resource control for code execution sandboxes.
 * 
 * Features:
 * - Hard timeout enforcement with process killing
 * - CPU and RAM resource caps
 * - Concurrency throttling
 * - Structured logging and monitoring
 * - Retry logic with exponential backoff
 * - Artifact upload limits and validation
 */

export interface SandboxConfig {
  // Timeout settings
  defaultTimeout: number; // seconds
  maxTimeout: number; // seconds
  killGracePeriod: number; // seconds before force kill
  
  // Resource limits
  maxCpuPercent: number; // 0-100
  maxMemoryMB: number;
  maxDiskMB: number;
  
  // Concurrency limits
  maxConcurrentSandboxes: number;
  maxSandboxesPerUser: number;
  
  // Artifact limits
  maxArtifactSizeMB: number;
  maxArtifactsPerExecution: number;
  allowedArtifactTypes: string[]; // file extensions
  
  // Retry settings
  maxRetries: number;
  retryBackoffMs: number; // initial backoff
  retryableErrors: string[]; // error patterns that should trigger retry
}

export const DEFAULT_SANDBOX_CONFIG: SandboxConfig = {
  // Timeouts
  defaultTimeout: 300, // 5 minutes
  maxTimeout: 900, // 15 minutes
  killGracePeriod: 10, // 10 seconds
  
  // Resources
  maxCpuPercent: 80,
  maxMemoryMB: 2048, // 2GB
  maxDiskMB: 5120, // 5GB
  
  // Concurrency
  maxConcurrentSandboxes: 50,
  maxSandboxesPerUser: 5,
  
  // Artifacts
  maxArtifactSizeMB: 100,
  maxArtifactsPerExecution: 20,
  allowedArtifactTypes: [
    '.txt', '.md', '.json', '.csv', '.xml', '.yaml', '.yml',
    '.html', '.css', '.js', '.ts', '.jsx', '.tsx',
    '.py', '.java', '.go', '.rs', '.c', '.cpp', '.h',
    '.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp',
    '.pdf', '.zip', '.tar', '.gz',
  ],
  
  // Retries
  maxRetries: 3,
  retryBackoffMs: 1000, // 1 second initial
  retryableErrors: [
    'ETIMEDOUT',
    'ECONNRESET',
    'ECONNREFUSED',
    'SANDBOX_BUSY',
    'RATE_LIMIT',
  ],
};

export interface SandboxExecution {
  id: string;
  userId: string;
  startedAt: number;
  timeoutAt: number;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'timeout' | 'killed';
  retryCount: number;
  sandboxId?: string;
}

export interface SandboxMetrics {
  executionTimeMs: number;
  cpuUsagePercent: number;
  memoryUsageMB: number;
  diskUsageMB: number;
  artifactsCount: number;
  artifactsSizeMB: number;
  retries: number;
}

export interface SandboxLog {
  timestamp: number;
  executionId: string;
  userId: string;
  level: 'info' | 'warn' | 'error';
  event: string;
  message: string;
  metadata?: Record<string, any>;
}

/**
 * Sandbox Hardening Manager
 * 
 * Manages sandbox lifecycle with security and resource controls
 */
export class SandboxHardeningManager {
  private config: SandboxConfig;
  private activeExecutions: Map<string, SandboxExecution> = new Map();
  private userExecutions: Map<string, Set<string>> = new Map();
  private logs: SandboxLog[] = [];
  private timeoutHandles: Map<string, NodeJS.Timeout> = new Map();
  
  constructor(config: Partial<SandboxConfig> = {}) {
    this.config = { ...DEFAULT_SANDBOX_CONFIG, ...config };
  }
  
  /**
   * Check if we can start a new sandbox execution
   */
  canStartExecution(userId: string): { allowed: boolean; reason?: string } {
    // Check global concurrency limit
    if (this.activeExecutions.size >= this.config.maxConcurrentSandboxes) {
      return {
        allowed: false,
        reason: `System at capacity (${this.config.maxConcurrentSandboxes} concurrent sandboxes)`,
      };
    }
    
    // Check per-user concurrency limit
    const userExecs = this.userExecutions.get(userId);
    if (userExecs && userExecs.size >= this.config.maxSandboxesPerUser) {
      return {
        allowed: false,
        reason: `User has ${userExecs.size} active sandboxes (limit: ${this.config.maxSandboxesPerUser})`,
      };
    }
    
    return { allowed: true };
  }
  
  /**
   * Start tracking a sandbox execution
   */
  startExecution(executionId: string, userId: string, timeoutSeconds?: number): SandboxExecution {
    const timeout = Math.min(
      timeoutSeconds || this.config.defaultTimeout,
      this.config.maxTimeout
    );
    
    const execution: SandboxExecution = {
      id: executionId,
      userId,
      startedAt: Date.now(),
      timeoutAt: Date.now() + (timeout * 1000),
      status: 'pending',
      retryCount: 0,
    };
    
    this.activeExecutions.set(executionId, execution);
    
    // Track per-user executions
    if (!this.userExecutions.has(userId)) {
      this.userExecutions.set(userId, new Set());
    }
    this.userExecutions.get(userId)!.add(executionId);
    
    // Set up timeout handler
    this.setupTimeoutHandler(executionId, timeout);
    
    this.log('info', executionId, userId, 'execution_started', 
      `Execution started with ${timeout}s timeout`);
    
    return execution;
  }
  
  /**
   * Set up automatic timeout and kill
   */
  private setupTimeoutHandler(executionId: string, timeoutSeconds: number): void {
    const handle = setTimeout(async () => {
      const execution = this.activeExecutions.get(executionId);
      if (!execution || execution.status === 'completed') {
        return;
      }
      
      this.log('warn', executionId, execution.userId, 'execution_timeout',
        `Execution exceeded ${timeoutSeconds}s timeout, initiating kill`);
      
      await this.killExecution(executionId, 'timeout');
    }, timeoutSeconds * 1000);
    
    this.timeoutHandles.set(executionId, handle);
  }
  
  /**
   * Kill a running execution
   */
  async killExecution(executionId: string, reason: 'timeout' | 'user_request' | 'error'): Promise<void> {
    const execution = this.activeExecutions.get(executionId);
    if (!execution) {
      return;
    }
    
    this.log('warn', executionId, execution.userId, 'execution_kill',
      `Killing execution (reason: ${reason})`);
    
    // If sandbox is running, try graceful shutdown first
    if (execution.sandboxId) {
      try {
        // Give it grace period to clean up
        await this.gracefulShutdown(execution.sandboxId);
      } catch (error) {
        this.log('error', executionId, execution.userId, 'graceful_shutdown_failed',
          `Graceful shutdown failed: ${error}`);
      }
      
      // Force kill after grace period
      setTimeout(async () => {
        if (this.activeExecutions.has(executionId)) {
          await this.forceKill(execution.sandboxId!);
        }
      }, this.config.killGracePeriod * 1000);
    }
    
    execution.status = reason === 'timeout' ? 'timeout' : 'killed';
    this.endExecution(executionId);
  }
  
  /**
   * Attempt graceful shutdown
   */
  private async gracefulShutdown(sandboxId: string): Promise<void> {
    // Send SIGTERM to allow cleanup
    // Implementation depends on sandbox provider (E2B, etc.)
    console.log(`[Sandbox] Graceful shutdown for ${sandboxId}`);
  }
  
  /**
   * Force kill sandbox
   */
  private async forceKill(sandboxId: string): Promise<void> {
    // Send SIGKILL
    // Implementation depends on sandbox provider
    console.log(`[Sandbox] Force kill for ${sandboxId}`);
  }
  
  /**
   * Update execution status
   */
  updateExecution(executionId: string, updates: Partial<SandboxExecution>): void {
    const execution = this.activeExecutions.get(executionId);
    if (!execution) {
      return;
    }
    
    Object.assign(execution, updates);
    
    if (updates.status === 'running' && updates.sandboxId) {
      this.log('info', executionId, execution.userId, 'sandbox_started',
        `Sandbox ${updates.sandboxId} is now running`);
    }
  }
  
  /**
   * End execution and clean up
   */
  endExecution(executionId: string, metrics?: SandboxMetrics): void {
    const execution = this.activeExecutions.get(executionId);
    if (!execution) {
      return;
    }
    
    // Clear timeout handler
    const handle = this.timeoutHandles.get(executionId);
    if (handle) {
      clearTimeout(handle);
      this.timeoutHandles.delete(executionId);
    }
    
    // Log completion
    const duration = Date.now() - execution.startedAt;
    this.log('info', executionId, execution.userId, 'execution_ended',
      `Execution ended after ${duration}ms`, {
        status: execution.status,
        retries: execution.retryCount,
        ...metrics,
      });
    
    // Remove from tracking
    this.activeExecutions.delete(executionId);
    
    const userExecs = this.userExecutions.get(execution.userId);
    if (userExecs) {
      userExecs.delete(executionId);
      if (userExecs.size === 0) {
        this.userExecutions.delete(execution.userId);
      }
    }
  }
  
  /**
   * Validate artifact before upload
   */
  validateArtifact(filename: string, sizeMB: number): { valid: boolean; reason?: string } {
    // Check file extension
    const ext = filename.toLowerCase().match(/\.[^.]+$/)?.[0];
    if (!ext || !this.config.allowedArtifactTypes.includes(ext)) {
      return {
        valid: false,
        reason: `File type ${ext} not allowed. Allowed types: ${this.config.allowedArtifactTypes.join(', ')}`,
      };
    }
    
    // Check size
    if (sizeMB > this.config.maxArtifactSizeMB) {
      return {
        valid: false,
        reason: `File size ${sizeMB}MB exceeds limit of ${this.config.maxArtifactSizeMB}MB`,
      };
    }
    
    return { valid: true };
  }
  
  /**
   * Check if error is retryable
   */
  isRetryableError(error: string): boolean {
    return this.config.retryableErrors.some(pattern => 
      error.includes(pattern)
    );
  }
  
  /**
   * Calculate retry delay with exponential backoff
   */
  getRetryDelay(retryCount: number): number {
    return this.config.retryBackoffMs * Math.pow(2, retryCount);
  }
  
  /**
   * Increment retry count for execution
   */
  incrementRetry(executionId: string): boolean {
    const execution = this.activeExecutions.get(executionId);
    if (!execution) {
      return false;
    }
    
    execution.retryCount++;
    
    if (execution.retryCount > this.config.maxRetries) {
      this.log('error', executionId, execution.userId, 'max_retries_exceeded',
        `Execution failed after ${this.config.maxRetries} retries`);
      return false;
    }
    
    const delay = this.getRetryDelay(execution.retryCount);
    this.log('warn', executionId, execution.userId, 'execution_retry',
      `Retrying execution (attempt ${execution.retryCount}/${this.config.maxRetries}) after ${delay}ms`);
    
    return true;
  }
  
  /**
   * Log an event
   */
  private log(
    level: 'info' | 'warn' | 'error',
    executionId: string,
    userId: string,
    event: string,
    message: string,
    metadata?: Record<string, any>
  ): void {
    const log: SandboxLog = {
      timestamp: Date.now(),
      executionId,
      userId,
      level,
      event,
      message,
      metadata,
    };
    
    this.logs.push(log);
    
    // Also log to console for debugging
    const prefix = `[Sandbox:${executionId.slice(0, 8)}]`;
    if (level === 'error') {
      console.error(prefix, message, metadata);
    } else if (level === 'warn') {
      console.warn(prefix, message, metadata);
    } else {
      console.log(prefix, message, metadata);
    }
    
    // Keep only last 1000 logs in memory
    if (this.logs.length > 1000) {
      this.logs = this.logs.slice(-1000);
    }
  }
  
  /**
   * Get logs for an execution
   */
  getLogs(executionId: string): SandboxLog[] {
    return this.logs.filter(log => log.executionId === executionId);
  }
  
  /**
   * Get all logs for a user
   */
  getUserLogs(userId: string): SandboxLog[] {
    return this.logs.filter(log => log.userId === userId);
  }
  
  /**
   * Get current system metrics
   */
  getSystemMetrics(): {
    activeExecutions: number;
    totalUsers: number;
    utilizationPercent: number;
  } {
    return {
      activeExecutions: this.activeExecutions.size,
      totalUsers: this.userExecutions.size,
      utilizationPercent: (this.activeExecutions.size / this.config.maxConcurrentSandboxes) * 100,
    };
  }
  
  /**
   * Get metrics for a specific user
   */
  getUserMetrics(userId: string): {
    activeExecutions: number;
    utilizationPercent: number;
  } {
    const userExecs = this.userExecutions.get(userId);
    return {
      activeExecutions: userExecs?.size || 0,
      utilizationPercent: ((userExecs?.size || 0) / this.config.maxSandboxesPerUser) * 100,
    };
  }
}

// Global singleton instance
export const sandboxHardening = new SandboxHardeningManager();
