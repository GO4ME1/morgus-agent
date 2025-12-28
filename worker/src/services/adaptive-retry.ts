/**
 * Adaptive Retry Service
 * 
 * Implements intelligent retry logic that analyzes errors and applies fixes
 * before retrying, rather than just repeating the same action.
 * 
 * Features:
 * - Error analysis before retry
 * - Automatic fix application
 * - Alternative approach attempts
 * - Exponential backoff
 * - Progress tracking
 */

import { ErrorAnalyzer, ErrorAnalysis, CorrectiveAction, ExecutionContext } from './error-analyzer';

export interface RetryConfig {
  maxAttempts: number;
  initialBackoffMs: number;
  maxBackoffMs: number;
  backoffMultiplier: number;
  onProgress?: (progress: RetryProgress) => void;
  onFixApplied?: (fix: CorrectiveAction, attempt: number) => void;
  executeCode?: (code: string, language: string) => Promise<any>; // For executing fixes
}

export interface RetryProgress {
  attempt: number;
  maxAttempts: number;
  lastError?: string;
  lastFix?: CorrectiveAction;
  elapsedTime: number;
}

export interface RetryResult<T> {
  success: boolean;
  result?: T;
  error?: string;
  attempts: number;
  fixes: CorrectiveAction[];
  totalTime: number;
}

export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  initialBackoffMs: 1000,
  maxBackoffMs: 10000,
  backoffMultiplier: 2,
};

export class AdaptiveRetry {
  private config: RetryConfig;
  
  constructor(config: Partial<RetryConfig> = {}) {
    this.config = { ...DEFAULT_RETRY_CONFIG, ...config };
  }
  
  /**
   * Execute action with intelligent retry
   */
  async executeWithRetry<T>(
    action: (context: ExecutionContext) => Promise<T>,
    context: ExecutionContext
  ): Promise<RetryResult<T>> {
    const startTime = Date.now();
    const fixes: CorrectiveAction[] = [];
    let lastError: any;
    let currentContext = { ...context };
    
    for (let attempt = 1; attempt <= this.config.maxAttempts; attempt++) {
      try {
        // Report progress
        this.reportProgress({
          attempt,
          maxAttempts: this.config.maxAttempts,
          lastError: lastError?.message,
          lastFix: fixes[fixes.length - 1],
          elapsedTime: Date.now() - startTime
        });
        
        // Execute action
        const result = await action(currentContext);
        
        // Success!
        return {
          success: true,
          result,
          attempts: attempt,
          fixes,
          totalTime: Date.now() - startTime
        };
        
      } catch (error: any) {
        lastError = error;
        
        // Track previous errors
        if (!currentContext.previousErrors) {
          currentContext.previousErrors = [];
        }
        currentContext.previousErrors.push(error.message);
        currentContext.previousAttempts = attempt;
        
        // Analyze error
        const analysis = ErrorAnalyzer.analyze(error.message, currentContext);
        
        // Check if we should retry
        if (!ErrorAnalyzer.shouldRetry(analysis, attempt, this.config.maxAttempts)) {
          // Don't retry
          return {
            success: false,
            error: error.message,
            attempts: attempt,
            fixes,
            totalTime: Date.now() - startTime
          };
        }
        
        // Apply fix before retrying
        if (analysis.suggestedFix) {
          try {
            currentContext = await this.applyFix(analysis.suggestedFix, currentContext);
            fixes.push(analysis.suggestedFix);
            
            // Notify fix applied
            if (this.config.onFixApplied) {
              this.config.onFixApplied(analysis.suggestedFix, attempt);
            }
          } catch (fixError: any) {
            console.error(`[AdaptiveRetry] Failed to apply fix:`, fixError);
            // Continue to retry even if fix fails
          }
        }
        
        // Wait before retry (exponential backoff)
        if (attempt < this.config.maxAttempts) {
          const backoff = this.calculateBackoff(attempt, analysis);
          await this.wait(backoff);
        }
      }
    }
    
    // All attempts failed
    return {
      success: false,
      error: lastError?.message || 'Unknown error',
      attempts: this.config.maxAttempts,
      fixes,
      totalTime: Date.now() - startTime
    };
  }
  
  /**
   * Apply corrective action
   */
  private async applyFix(fix: CorrectiveAction, context: ExecutionContext): Promise<ExecutionContext> {
    const newContext = { ...context };
    
    switch (fix.type) {
      case 'install_package':
        await this.installPackage(fix);
        break;
        
      case 'fix_syntax':
        newContext.code = await this.fixSyntax(fix, context);
        break;
        
      case 'change_permissions':
        await this.changePermissions(fix);
        break;
        
      case 'increase_timeout':
        if (newContext.parameters) {
          newContext.parameters.timeout = fix.parameters?.timeout || (newContext.parameters.timeout || 30) * 2;
        }
        break;
        
      case 'fix_import':
        newContext.code = await this.fixImport(fix, context);
        break;
        
      case 'add_error_handling':
        newContext.code = await this.addErrorHandling(fix, context);
        break;
        
      case 'optimize_code':
        newContext.code = await this.optimizeCode(fix, context);
        break;
        
      case 'retry_with_backoff':
        // Just wait, no context change needed
        break;
        
      case 'use_alternative_tool':
        newContext.tool = fix.parameters?.alternativeTool;
        break;
        
      default:
        console.warn(`[AdaptiveRetry] Unknown fix type: ${fix.type}`);
    }
    
    return newContext;
  }
  
  /**
   * Install missing package
   */
  private async installPackage(fix: CorrectiveAction): Promise<void> {
    const { package: pkg, manager } = fix.parameters || {};
    
    if (!pkg || !manager) {
      throw new Error('Missing package or manager in fix parameters');
    }
    
    console.log(`[AdaptiveRetry] Installing package: ${pkg} via ${manager}`);
    
    // Execute installation command if callback provided
    if (this.config.executeCode && fix.code) {
      try {
        await this.config.executeCode(fix.code, 'bash');
        console.log(`[AdaptiveRetry] Package ${pkg} installed successfully`);
      } catch (error: any) {
        console.error(`[AdaptiveRetry] Failed to install package ${pkg}:`, error);
        throw error;
      }
    }
  }
  
  /**
   * Fix syntax error using LLM
   */
  private async fixSyntax(fix: CorrectiveAction, context: ExecutionContext): Promise<string> {
    console.log(`[AdaptiveRetry] Fixing syntax error`);
    
    // In production, this would call an LLM to fix the syntax
    // For now, return the original code
    // TODO: Integrate with LLM to actually fix syntax
    
    return context.code || '';
  }
  
  /**
   * Fix import error
   */
  private async fixImport(fix: CorrectiveAction, context: ExecutionContext): Promise<string> {
    console.log(`[AdaptiveRetry] Fixing import error`);
    
    // In production, this would analyze imports and fix them
    // For now, return the original code
    // TODO: Implement import fixing logic
    
    return context.code || '';
  }
  
  /**
   * Add error handling to code
   */
  private async addErrorHandling(fix: CorrectiveAction, context: ExecutionContext): Promise<string> {
    console.log(`[AdaptiveRetry] Adding error handling`);
    
    const code = context.code || '';
    
    // Simple error handling wrapper for Python
    if (context.language === 'python') {
      return `try:\n${this.indent(code, 4)}\nexcept Exception as e:\n    print(f"Error: {e}")\n    raise`;
    }
    
    // Simple error handling wrapper for JavaScript
    if (context.language === 'javascript') {
      return `try {\n${this.indent(code, 2)}\n} catch (error) {\n  console.error('Error:', error);\n  throw error;\n}`;
    }
    
    return code;
  }
  
  /**
   * Optimize code for resource usage
   */
  private async optimizeCode(fix: CorrectiveAction, context: ExecutionContext): Promise<string> {
    console.log(`[AdaptiveRetry] Optimizing code`);
    
    // In production, this would use LLM to optimize code
    // For now, return the original code
    // TODO: Implement code optimization logic
    
    return context.code || '';
  }
  
  /**
   * Change file permissions
   */
  private async changePermissions(fix: CorrectiveAction): Promise<void> {
    console.log(`[AdaptiveRetry] Changing permissions`);
    
    // In production, this would execute chmod command
    // For now, just log it
    // TODO: Implement permission changing logic
  }
  
  /**
   * Calculate backoff time
   */
  private calculateBackoff(attempt: number, analysis: ErrorAnalysis): number {
    // Base backoff with exponential increase
    let backoff = this.config.initialBackoffMs * Math.pow(this.config.backoffMultiplier, attempt - 1);
    
    // Adjust based on error type
    if (analysis.errorType === 'network_error' || analysis.errorType === 'timeout') {
      // Longer backoff for network errors
      backoff *= 2;
    } else if (analysis.errorType === 'resource_limit') {
      // Even longer backoff for resource errors
      backoff *= 3;
    }
    
    // Cap at max backoff
    return Math.min(backoff, this.config.maxBackoffMs);
  }
  
  /**
   * Wait for specified duration
   */
  private async wait(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  /**
   * Report progress
   */
  private reportProgress(progress: RetryProgress): void {
    if (this.config.onProgress) {
      this.config.onProgress(progress);
    }
  }
  
  /**
   * Indent code by specified spaces
   */
  private indent(code: string, spaces: number): string {
    const indentation = ' '.repeat(spaces);
    return code.split('\n').map(line => indentation + line).join('\n');
  }
}

/**
 * Helper function for quick retry
 */
export async function retryWithAnalysis<T>(
  action: () => Promise<T>,
  context: ExecutionContext = {},
  config: Partial<RetryConfig> = {}
): Promise<T> {
  const retry = new AdaptiveRetry(config);
  const result = await retry.executeWithRetry(
    async (ctx) => action(),
    context
  );
  
  if (result.success && result.result !== undefined) {
    return result.result;
  }
  
  throw new Error(result.error || 'Retry failed');
}
