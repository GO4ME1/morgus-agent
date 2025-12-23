/**
 * DPPM Orchestrator
 * 
 * Main entry point for the Decompose, Plan in Parallel, Merge workflow.
 * Integrates decomposition, parallel planning, merging, and reflection.
 */

import { decompose, getExecutionOrder } from './decompose';
import { planInParallel, mergePlans } from './parallel-plan';
import { preFlightReflection, postExecutionReflection, shouldSaveAsWorkflow } from './reflection';
import {
  storeExperience,
  saveWorkflow,
  retrieveWorkflow,
  updateWorkflowStats
} from './experience-store';
import type {
  DecomposedTask,
  MergedPlan,
  PreFlightReflection,
  ExecutionResult,
  PostExecutionReflection,
  SupabaseClient
} from './types';

export interface DPPMConfig {
  userId: string;
  supabase: SupabaseClient;
  llmCall: (prompt: string, morgy?: string) => Promise<string>;
  maxSubtasks?: number;
  minSubtasks?: number;
  skipPreFlight?: boolean;
  skipPostReflection?: boolean;
}

export interface DPPMResult {
  decomposed: DecomposedTask;
  plan: MergedPlan;
  preFlight?: PreFlightReflection;
  execution?: ExecutionResult;
  postReflection?: PostExecutionReflection;
  workflowId?: string;
  experienceId?: string;
}

/**
 * Execute the full DPPM workflow
 */
export async function executeDPPM(
  goal: string,
  config: DPPMConfig
): Promise<DPPMResult> {
  const {
    userId,
    supabase,
    llmCall,
    maxSubtasks = 7,
    minSubtasks = 3,
    skipPreFlight = false,
    skipPostReflection = false
  } = config;
  
  console.log(`[DPPM] Starting workflow for goal: ${goal}`);
  
  // Check if we have a reusable workflow for this goal
  const existingWorkflow = await retrieveWorkflow(supabase, userId, goal);
  if (existingWorkflow) {
    console.log(`[DPPM] Found existing workflow: ${existingWorkflow.title}`);
    // Could optionally use the existing workflow pattern
    // For now, we'll proceed with fresh decomposition
  }
  
  // Phase 1: Decompose
  console.log('[DPPM] Phase 1: Decompose');
  const decomposed = await decompose(goal, llmCall, { maxSubtasks, minSubtasks });
  console.log(`[DPPM] Decomposed into ${decomposed.subtasks.length} subtasks`);
  
  // Phase 2: Plan in Parallel
  console.log('[DPPM] Phase 2: Plan in Parallel');
  const miniPlans = await planInParallel(
    decomposed.subtasks,
    {
      goal,
      allSubtasks: decomposed.subtasks
    },
    llmCall
  );
  console.log(`[DPPM] Generated ${miniPlans.length} mini-plans`);
  
  // Phase 3: Merge
  console.log('[DPPM] Phase 3: Merge');
  const executionOrder = getExecutionOrder(decomposed);
  const mergedPlan = mergePlans(miniPlans, decomposed.subtasks, goal, executionOrder);
  console.log(`[DPPM] Merged into ${mergedPlan.executionOrder.length} execution phases`);
  console.log(`[DPPM] Total estimated duration: ${mergedPlan.totalEstimatedDuration} minutes`);
  
  // Phase 4: Pre-Flight Reflection
  let preFlight: PreFlightReflection | undefined;
  let finalPlan = mergedPlan;
  
  if (!skipPreFlight) {
    console.log('[DPPM] Phase 4: Pre-Flight Reflection');
    preFlight = await preFlightReflection(mergedPlan, llmCall);
    console.log(`[DPPM] Identified ${preFlight.risks.length} risks with ${preFlight.mitigations.length} mitigations`);
    finalPlan = preFlight.updatedPlan;
  }
  
  return {
    decomposed,
    plan: finalPlan,
    preFlight
  };
}

/**
 * Execute a plan and perform post-execution reflection
 */
export async function executeAndReflect(
  plan: MergedPlan,
  executionResult: ExecutionResult,
  config: DPPMConfig
): Promise<DPPMResult> {
  const { userId, supabase, llmCall, skipPostReflection = false } = config;
  
  let postReflection: PostExecutionReflection | undefined;
  let workflowId: string | undefined;
  let experienceId: string | undefined;
  
  // Phase 6: Post-Execution Reflection
  if (!skipPostReflection) {
    console.log('[DPPM] Phase 6: Post-Execution Reflection');
    postReflection = await postExecutionReflection(plan, executionResult, llmCall);
    console.log(`[DPPM] Reflection complete. Overall success: ${postReflection.overallSuccess}`);
    console.log(`[DPPM] Lessons learned: ${postReflection.lessonsLearned.length}`);
    
    // Store experience
    experienceId = await storeExperience(supabase, userId, plan, executionResult, postReflection);
    console.log(`[DPPM] Experience stored: ${experienceId}`);
    
    // Save as workflow if successful
    if (shouldSaveAsWorkflow(postReflection)) {
      workflowId = await saveWorkflow(supabase, userId, postReflection, plan);
      console.log(`[DPPM] Workflow saved: ${workflowId}`);
    }
  }
  
  return {
    decomposed: { goal: plan.goal, subtasks: [], dependencies: [] }, // Not available here
    plan,
    execution: executionResult,
    postReflection,
    workflowId,
    experienceId
  };
}

/**
 * Full DPPM workflow with execution (for testing/simulation)
 */
export async function executeDPPMWithMockExecution(
  goal: string,
  config: DPPMConfig
): Promise<DPPMResult> {
  // Phase 1-4: Decompose, Plan, Merge, Pre-Flight
  const result = await executeDPPM(goal, config);
  
  // Phase 5: Execute (mocked for now)
  console.log('[DPPM] Phase 5: Execute (mocked)');
  const executionResult: ExecutionResult = {
    planId: 'mock-plan-id',
    status: 'completed',
    completedSteps: result.plan.miniPlans.flatMap(mp =>
      mp.steps.map(step => ({
        stepId: step.id,
        status: 'success' as const,
        actualOutcome: step.expectedOutcome,
        duration: 30,
        usedFallback: false
      }))
    ),
    currentStep: '',
    errors: []
  };
  
  // Phase 6: Post-Execution Reflection
  const reflectionResult = await executeAndReflect(result.plan, executionResult, config);
  
  return {
    ...result,
    ...reflectionResult
  };
}

/**
 * Get a summary of the DPPM result
 */
export function getDPPMSummary(result: DPPMResult): string {
  const lines: string[] = [];
  
  lines.push(`**Goal:** ${result.plan.goal}`);
  lines.push(`**Subtasks:** ${result.decomposed?.subtasks.length || 'N/A'}`);
  lines.push(`**Execution Phases:** ${result.plan.executionOrder.length}`);
  lines.push(`**Estimated Duration:** ${result.plan.totalEstimatedDuration} minutes`);
  
  if (result.preFlight) {
    lines.push(`**Risks Identified:** ${result.preFlight.risks.length}`);
    lines.push(`**Mitigations Applied:** ${result.preFlight.mitigations.length}`);
  }
  
  if (result.execution) {
    const successRate = result.execution.completedSteps.filter(s => s.status === 'success').length / result.execution.completedSteps.length;
    lines.push(`**Execution Status:** ${result.execution.status}`);
    lines.push(`**Success Rate:** ${(successRate * 100).toFixed(1)}%`);
  }
  
  if (result.postReflection) {
    lines.push(`**Overall Success:** ${result.postReflection.overallSuccess ? 'Yes' : 'No'}`);
    lines.push(`**Lessons Learned:** ${result.postReflection.lessonsLearned.length}`);
    lines.push(`**Workflow Candidate:** ${result.postReflection.workflowCandidate ? 'Yes' : 'No'}`);
  }
  
  if (result.workflowId) {
    lines.push(`**Workflow Saved:** ${result.workflowId}`);
  }
  
  if (result.experienceId) {
    lines.push(`**Experience Stored:** ${result.experienceId}`);
  }
  
  return lines.join('\n');
}

/**
 * Export all DPPM modules for external use
 */
export * from './types';
export * from './decompose';
export * from './parallel-plan';
export * from './reflection';
export * from './experience-store';
