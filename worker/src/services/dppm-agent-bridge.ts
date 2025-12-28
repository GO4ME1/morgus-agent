/**
 * DPPM-Agent Bridge
 * 
 * Connects DPPM planning system to agent execution loop.
 * Orchestrates the full workflow: Plan → Execute → Reflect → Learn
 */

import { executeDPPM, executeAndReflect, getDPPMSummary, type DPPMConfig, type DPPMResult } from '../planner/dppm';
import type { AutonomousAgent } from '../agent';
import type { SupabaseClient } from '../planner/types';

export interface DPPMExecutionResult {
  success: boolean;
  result?: DPPMResult;
  error?: string;
  outputs: string[]; // Outputs from each phase
  summary?: string; // Human-readable summary
}

export class DPPMAgentBridge {
  /**
   * Execute a complex task using DPPM + Agent loop
   * 
   * Workflow:
   * 1. DPPM Planning (Phases 1-4): Decompose, Plan, Merge, Pre-Flight
   * 2. Agent Execution (Phase 5): Execute each subtask via agent loop
   * 3. DPPM Reflection (Phase 6): Post-execution reflection and learning
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
      console.log('[DPPM-Agent Bridge] Starting complex task execution');
      console.log('[DPPM-Agent Bridge] Goal:', goal);
      console.log('[DPPM-Agent Bridge] User ID:', userId);
      
      // ===== PHASE 1-4: DPPM PLANNING =====
      outputs.push('🧠 **Starting DPPM Planning System...**\n');
      
      const dppmConfig: DPPMConfig = {
        userId,
        supabase,
        llmCall: async (prompt: string, morgy?: string) => {
          // Use OpenAI for DPPM planning
          try {
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${env.OPENAI_API_KEY}`
              },
              body: JSON.stringify({
                model: 'gpt-4o-mini', // Cost-effective model for planning
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.7
              })
            });
            
            if (!response.ok) {
              throw new Error(`OpenAI API error: ${response.statusText}`);
            }
            
            const data = await response.json();
            return data.choices[0].message.content;
          } catch (error: any) {
            console.error('[DPPM-Agent Bridge] LLM call failed:', error);
            throw error;
          }
        },
        maxSubtasks: 7,
        minSubtasks: 3,
        skipPreFlight: false,
        skipPostReflection: false
      };
      
      // Execute DPPM planning
      console.log('[DPPM-Agent Bridge] Running DPPM planning...');
      const dppmResult = await executeDPPM(goal, dppmConfig);
      
      console.log('[DPPM-Agent Bridge] Planning complete:', {
        subtasks: dppmResult.decomposed.subtasks.length,
        phases: dppmResult.plan.executionOrder.length,
        duration: dppmResult.plan.totalEstimatedDuration
      });
      
      // Report planning results
      outputs.push(`✅ **Planning Complete**\n\n` +
        `📋 **Decomposition:**\n` +
        `- Subtasks: ${dppmResult.decomposed.subtasks.length}\n` +
        `- Execution Phases: ${dppmResult.plan.executionOrder.length}\n` +
        `- Estimated Duration: ${dppmResult.plan.totalEstimatedDuration} minutes\n\n`
      );
      
      // Show subtasks
      outputs.push(`**Subtasks:**\n`);
      for (const subtask of dppmResult.decomposed.subtasks) {
        outputs.push(`${subtask.id}. ${subtask.title}\n`);
      }
      outputs.push(`\n`);
      
      // Show pre-flight reflection
      if (dppmResult.preFlight) {
        outputs.push(`⚠️ **Pre-Flight Reflection:**\n` +
          `- Risks Identified: ${dppmResult.preFlight.risks.length}\n` +
          `- Mitigations Applied: ${dppmResult.preFlight.mitigations.length}\n\n`
        );
        
        if (dppmResult.preFlight.risks.length > 0) {
          outputs.push(`**Key Risks:**\n`);
          for (const risk of dppmResult.preFlight.risks.slice(0, 3)) {
            outputs.push(`- ${risk.description} (${risk.severity})\n`);
          }
          outputs.push(`\n`);
        }
      }
      
      // ===== PHASE 5: AGENT EXECUTION =====
      outputs.push(`\n🚀 **Starting Execution...**\n\n`);
      console.log('[DPPM-Agent Bridge] Executing subtasks via agent loop...');
      
      const completedSteps: any[] = [];
      const errors: string[] = [];
      let currentPhaseNum = 1;
      
      for (const phase of dppmResult.plan.executionOrder) {
        outputs.push(`**Phase ${currentPhaseNum}/${dppmResult.plan.executionOrder.length}**\n\n`);
        
        for (const subtaskId of phase) {
          const subtask = dppmResult.decomposed.subtasks.find(s => s.id === subtaskId);
          if (!subtask) {
            console.warn(`[DPPM-Agent Bridge] Subtask not found: ${subtaskId}`);
            continue;
          }
          
          console.log(`[DPPM-Agent Bridge] Executing subtask: ${subtask.title}`);
          outputs.push(`🔄 **Executing:** ${subtask.title}\n\n`);
          
          const startTime = Date.now();
          
          try {
            // Build subtask prompt with context
            const subtaskPrompt = `${subtask.title}\n\n` +
              `**Description:** ${subtask.description}\n\n` +
              `**Context:** This is part of the larger goal: "${goal}"\n\n` +
              `**Expected Outcome:** ${subtask.estimatedDuration} minutes estimated\n\n` +
              `Please complete this subtask and provide detailed output.`;
            
            // Execute subtask using agent
            let subtaskOutput = '';
            const messages: any[] = [];
            
            for await (const message of agent.executeTask(subtaskPrompt, env, [])) {
              messages.push(message);
              
              if (message.type === 'response') {
                subtaskOutput += message.content + '\n';
              } else if (message.type === 'error') {
                throw new Error(message.content);
              }
            }
            
            const duration = Math.floor((Date.now() - startTime) / 1000);
            
            completedSteps.push({
              stepId: subtask.id,
              status: 'success',
              actualOutcome: subtaskOutput,
              duration,
              usedFallback: false
            });
            
            outputs.push(`✅ **Completed:** ${subtask.title} (${duration}s)\n\n`);
            
            // Show output (truncated if too long)
            const truncatedOutput = subtaskOutput.length > 500 
              ? subtaskOutput.substring(0, 500) + '...' 
              : subtaskOutput;
            outputs.push(`**Output:**\n${truncatedOutput}\n\n`);
            
          } catch (error: any) {
            console.error(`[DPPM-Agent Bridge] Subtask failed:`, error);
            
            const duration = Math.floor((Date.now() - startTime) / 1000);
            const errorMessage = error.message || 'Unknown error';
            
            errors.push(`${subtask.title}: ${errorMessage}`);
            
            completedSteps.push({
              stepId: subtask.id,
              status: 'failed',
              actualOutcome: errorMessage,
              duration,
              usedFallback: false
            });
            
            outputs.push(`❌ **Failed:** ${subtask.title} (${duration}s)\n\n`);
            outputs.push(`**Error:** ${errorMessage}\n\n`);
            
            // Continue with other subtasks even if one fails
            console.log('[DPPM-Agent Bridge] Continuing with remaining subtasks...');
          }
        }
        
        currentPhaseNum++;
      }
      
      // ===== PHASE 6: POST-EXECUTION REFLECTION =====
      outputs.push(`\n📊 **Running Post-Execution Reflection...**\n\n`);
      console.log('[DPPM-Agent Bridge] Running post-execution reflection...');
      
      const executionResult = {
        planId: `dppm-${Date.now()}`,
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
      
      // Report reflection results
      if (reflectionResult.postReflection) {
        const successRate = completedSteps.filter(s => s.status === 'success').length / completedSteps.length;
        
        outputs.push(`✅ **Reflection Complete**\n\n` +
          `- Overall Success: ${reflectionResult.postReflection.overallSuccess ? '✅ Yes' : '❌ No'}\n` +
          `- Success Rate: ${(successRate * 100).toFixed(1)}%\n` +
          `- Lessons Learned: ${reflectionResult.postReflection.lessonsLearned.length}\n` +
          `- Workflow Candidate: ${reflectionResult.postReflection.workflowCandidate ? 'Yes' : 'No'}\n\n`
        );
        
        if (reflectionResult.workflowId) {
          outputs.push(`💾 **Workflow Saved:** ${reflectionResult.workflowId}\n` +
            `This successful pattern can be reused for similar tasks.\n\n`
          );
        }
        
        if (reflectionResult.experienceId) {
          outputs.push(`📚 **Experience Stored:** ${reflectionResult.experienceId}\n` +
            `Lessons learned have been saved for future improvement.\n\n`
          );
        }
        
        // Show key lessons
        if (reflectionResult.postReflection.lessonsLearned.length > 0) {
          outputs.push(`**Key Lessons Learned:**\n`);
          for (const lesson of reflectionResult.postReflection.lessonsLearned.slice(0, 3)) {
            outputs.push(`- ${lesson}\n`);
          }
          outputs.push(`\n`);
        }
      }
      
      // Generate summary
      const summary = getDPPMSummary(reflectionResult);
      
      // Final status
      if (errors.length === 0) {
        outputs.push(`\n🎉 **Task Completed Successfully!**\n\n`);
      } else {
        outputs.push(`\n⚠️ **Task Completed with Errors**\n\n` +
          `${errors.length} subtask(s) failed:\n`
        );
        for (const error of errors) {
          outputs.push(`- ${error}\n`);
        }
        outputs.push(`\n`);
      }
      
      console.log('[DPPM-Agent Bridge] Execution complete');
      console.log('[DPPM-Agent Bridge] Success:', errors.length === 0);
      
      return {
        success: errors.length === 0,
        result: reflectionResult,
        outputs,
        summary
      };
      
    } catch (error: any) {
      console.error('[DPPM-Agent Bridge] Fatal error:', error);
      
      outputs.push(`\n❌ **Fatal Error**\n\n${error.message}\n`);
      
      return {
        success: false,
        error: error.message,
        outputs
      };
    }
  }
  
  /**
   * Check if DPPM execution is available
   */
  static isAvailable(env: any): boolean {
    return !!(env.OPENAI_API_KEY && env.SUPABASE_CLIENT);
  }
  
  /**
   * Get required environment variables
   */
  static getRequiredEnv(): string[] {
    return ['OPENAI_API_KEY', 'SUPABASE_CLIENT', 'USER_ID'];
  }
}
