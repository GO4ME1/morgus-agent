/**
 * Execution Logger - Tracks task executions for skill generation
 * 
 * This module logs successful task executions that can be analyzed
 * to generate new skills (the "offline learning path").
 */

import { TaskExecution, generateSkillFromExecution, shouldSuggestSkillGeneration } from './generator';
import { skillsManager, Skill } from './index';

export interface ToolCall {
  name: string;
  args: any;
  result: string;
  timestamp: string;
}

/**
 * Execution Logger tracks tool calls and task outcomes
 */
export class ExecutionLogger {
  private currentExecution: {
    userQuery: string;
    toolCalls: ToolCall[];
    startTime: string;
  } | null = null;

  private recentExecutions: TaskExecution[] = [];
  private maxStoredExecutions = 50;

  /**
   * Start logging a new task execution
   */
  startExecution(userQuery: string): void {
    this.currentExecution = {
      userQuery,
      toolCalls: [],
      startTime: new Date().toISOString()
    };
  }

  /**
   * Log a tool call
   */
  logToolCall(name: string, args: any, result: string): void {
    if (!this.currentExecution) return;

    this.currentExecution.toolCalls.push({
      name,
      args,
      result,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Complete the current execution
   */
  completeExecution(finalResponse: string, success: boolean): TaskExecution | null {
    if (!this.currentExecution) return null;

    const execution: TaskExecution = {
      userQuery: this.currentExecution.userQuery,
      toolCalls: this.currentExecution.toolCalls.map(tc => ({
        name: tc.name,
        args: tc.args,
        result: tc.result
      })),
      finalResponse,
      success,
      timestamp: new Date().toISOString()
    };

    // Store execution
    this.recentExecutions.unshift(execution);
    if (this.recentExecutions.length > this.maxStoredExecutions) {
      this.recentExecutions.pop();
    }

    // Clear current execution
    this.currentExecution = null;

    return execution;
  }

  /**
   * Get recent executions
   */
  getRecentExecutions(): TaskExecution[] {
    return this.recentExecutions;
  }

  /**
   * Check if skill generation should be suggested
   */
  shouldSuggestSkillGeneration(execution: TaskExecution): boolean {
    return shouldSuggestSkillGeneration(execution);
  }

  /**
   * Generate a skill from an execution
   */
  async generateSkill(execution: TaskExecution, openaiApiKey: string): Promise<Skill | null> {
    const skill = await generateSkillFromExecution(execution, openaiApiKey);
    
    if (skill) {
      // Add to skills manager
      skillsManager.addSkill(skill);
      console.log('[ExecutionLogger] Generated new skill:', skill.name);
    }

    return skill;
  }

  /**
   * Get execution statistics
   */
  getStats(): {
    totalExecutions: number;
    successfulExecutions: number;
    averageToolCalls: number;
    mostUsedTools: Array<{ name: string; count: number }>;
  } {
    const total = this.recentExecutions.length;
    const successful = this.recentExecutions.filter(e => e.success).length;
    
    const toolCounts: Record<string, number> = {};
    let totalToolCalls = 0;

    for (const execution of this.recentExecutions) {
      totalToolCalls += execution.toolCalls.length;
      for (const tc of execution.toolCalls) {
        toolCounts[tc.name] = (toolCounts[tc.name] || 0) + 1;
      }
    }

    const mostUsedTools = Object.entries(toolCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      totalExecutions: total,
      successfulExecutions: successful,
      averageToolCalls: total > 0 ? totalToolCalls / total : 0,
      mostUsedTools
    };
  }

  /**
   * Find similar past executions
   */
  findSimilarExecutions(query: string, maxResults: number = 3): TaskExecution[] {
    const queryWords = query.toLowerCase().split(/\s+/);
    
    const scored = this.recentExecutions
      .filter(e => e.success)
      .map(execution => {
        const execWords = execution.userQuery.toLowerCase().split(/\s+/);
        const overlap = queryWords.filter(w => execWords.includes(w)).length;
        return { execution, score: overlap };
      })
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score);

    return scored.slice(0, maxResults).map(item => item.execution);
  }
}

// Export singleton instance
export const executionLogger = new ExecutionLogger();
