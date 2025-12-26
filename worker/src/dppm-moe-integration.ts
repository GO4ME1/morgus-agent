/**
 * DPPM-MOE Integration Layer
 * 
 * Orchestrates complex tasks using DPPM (Decompose, Plan, Parallel-execute, Merge)
 * with MOE (Mixture of Experts) competition for each subtask.
 * 
 * Flow:
 * 1. Detect if task is complex enough for DPPM
 * 2. If complex: Decompose → MOE per subtask → Merge → Reflect
 * 3. If simple: Skip to direct MOE competition
 */

import { executeDPPM, executeAndReflect, getDPPMSummary } from './planner/dppm';
import type { MergedPlan, ExecutionResult, StepResult } from './planner/types';

export interface DPPMMOEConfig {
  userId: string;
  supabaseUrl: string;
  supabaseKey: string;
  openrouterApiKey: string;
  geminiApiKey?: string;
  openaiApiKey?: string;
  anthropicApiKey?: string;
  conversationId?: string;
  onProgress?: (update: ProgressUpdate) => void;
}

export interface ProgressUpdate {
  phase: 'analyzing' | 'decomposing' | 'planning' | 'executing' | 'reflecting' | 'complete';
  message: string;
  subtasks?: SubtaskProgress[];
  currentSubtask?: string;
  progress?: number; // 0-100
}

export interface SubtaskProgress {
  id: string;
  title: string;
  status: 'pending' | 'running' | 'success' | 'failed' | 'retrying';
  winningModel?: string;
  attempts?: number;
}

export interface ComplexityAnalysis {
  isComplex: boolean;
  score: number; // 0-10
  reasons: string[];
  recommendedApproach: 'direct_moe' | 'dppm_orchestrated';
  estimatedSubtasks?: number;
}

/**
 * Analyze if a task is complex enough to warrant DPPM orchestration
 */
export function analyzeComplexity(
  message: string,
  queryCategory?: { primary: string; complexity: string; intent: string }
): ComplexityAnalysis {
  let score = 0;
  const reasons: string[] = [];
  
  // Factor 1: Message length (longer = more complex)
  if (message.length > 500) {
    score += 2;
    reasons.push('Long, detailed request');
  } else if (message.length > 200) {
    score += 1;
    reasons.push('Moderate length request');
  }
  
  // Factor 2: Multiple action verbs (indicates multi-step task)
  const actionVerbs = [
    'create', 'build', 'make', 'design', 'develop', 'write', 'generate',
    'analyze', 'research', 'find', 'search', 'compare',
    'deploy', 'publish', 'launch', 'setup', 'configure',
    'fix', 'debug', 'optimize', 'improve', 'refactor',
    'convert', 'transform', 'migrate', 'integrate'
  ];
  const verbCount = actionVerbs.filter(verb => 
    message.toLowerCase().includes(verb)
  ).length;
  
  if (verbCount >= 3) {
    score += 3;
    reasons.push(`Multiple actions requested (${verbCount} action verbs)`);
  } else if (verbCount >= 2) {
    score += 2;
    reasons.push('Two actions requested');
  }
  
  // Factor 3: Explicit multi-step indicators
  const multiStepIndicators = [
    'and then', 'after that', 'next', 'finally', 'first', 'second', 'third',
    'step 1', 'step 2', 'steps:', 'multiple', 'several', 'various',
    'complete', 'full', 'entire', 'comprehensive', 'end-to-end'
  ];
  const hasMultiStep = multiStepIndicators.some(indicator => 
    message.toLowerCase().includes(indicator)
  );
  
  if (hasMultiStep) {
    score += 2;
    reasons.push('Explicit multi-step language detected');
  }
  
  // Factor 4: Complex task types
  const complexTaskTypes = [
    'website', 'landing page', 'application', 'app', 'dashboard',
    'api', 'backend', 'frontend', 'full stack', 'fullstack',
    'business plan', 'marketing strategy', 'research report',
    'presentation', 'pitch deck', 'proposal',
    'automation', 'workflow', 'pipeline', 'integration'
  ];
  const hasComplexType = complexTaskTypes.some(type => 
    message.toLowerCase().includes(type)
  );
  
  if (hasComplexType) {
    score += 2;
    reasons.push('Complex deliverable type requested');
  }
  
  // Factor 5: Query categorization hints
  if (queryCategory) {
    if (queryCategory.complexity === 'complex') {
      score += 2;
      reasons.push('Query categorizer marked as complex');
    } else if (queryCategory.complexity === 'medium') {
      score += 1;
    }
    
    // Certain intents are inherently complex
    if (['creation', 'instruction'].includes(queryCategory.intent)) {
      score += 1;
      reasons.push(`Intent: ${queryCategory.intent}`);
    }
  }
  
  // Factor 6: Explicit quality requirements
  const qualityIndicators = [
    'professional', 'production', 'high quality', 'polished',
    'best practices', 'scalable', 'maintainable', 'secure'
  ];
  const hasQualityReq = qualityIndicators.some(indicator => 
    message.toLowerCase().includes(indicator)
  );
  
  if (hasQualityReq) {
    score += 1;
    reasons.push('High quality requirements specified');
  }
  
  // Determine recommendation
  const isComplex = score >= 5;
  const estimatedSubtasks = isComplex ? Math.min(7, Math.max(3, Math.floor(score / 2) + 2)) : undefined;
  
  return {
    isComplex,
    score,
    reasons,
    recommendedApproach: isComplex ? 'dppm_orchestrated' : 'direct_moe',
    estimatedSubtasks
  };
}

/**
 * Execute a task using DPPM + MOE orchestration
 */
export async function executeDPPMMOE(
  goal: string,
  config: DPPMMOEConfig,
  moeCompetition: (messages: any[], subtaskContext?: string) => Promise<any>
): Promise<DPPMMOEResult> {
  const { userId, supabaseUrl, supabaseKey, onProgress } = config;
  
  // Initialize Supabase client
  const supabase = createSupabaseClient(supabaseUrl, supabaseKey);
  
  // Progress: Analyzing
  onProgress?.({
    phase: 'analyzing',
    message: '🧠 Analyzing task complexity...',
    progress: 5
  });
  
  // Create LLM call function that uses MOE
  const llmCall = async (prompt: string, morgy?: string): Promise<string> => {
    const result = await moeCompetition([
      { role: 'system', content: 'You are a helpful AI assistant. Respond concisely and accurately.' },
      { role: 'user', content: prompt }
    ], morgy);
    return result.content;
  };
  
  // Progress: Decomposing
  onProgress?.({
    phase: 'decomposing',
    message: '📋 Breaking down task into subtasks...',
    progress: 15
  });
  
  // Execute DPPM decomposition and planning
  const dppmResult = await executeDPPM(goal, {
    userId,
    supabase,
    llmCall,
    maxSubtasks: 7,
    minSubtasks: 3,
    skipPreFlight: false,
    skipPostReflection: false
  });
  
  // Progress: Planning
  const subtaskProgress: SubtaskProgress[] = dppmResult.decomposed.subtasks.map(st => ({
    id: st.id,
    title: st.title,
    status: 'pending' as const
  }));
  
  onProgress?.({
    phase: 'planning',
    message: `📝 Created ${dppmResult.decomposed.subtasks.length} subtasks`,
    subtasks: subtaskProgress,
    progress: 30
  });
  
  // Execute each subtask with MOE competition
  const executionResults: StepResult[] = [];
  let currentProgress = 30;
  const progressPerSubtask = 50 / dppmResult.decomposed.subtasks.length;
  
  for (const subtask of dppmResult.decomposed.subtasks) {
    const subtaskIndex = subtaskProgress.findIndex(sp => sp.id === subtask.id);
    
    // Update progress: executing this subtask
    subtaskProgress[subtaskIndex].status = 'running';
    onProgress?.({
      phase: 'executing',
      message: `⚡ Executing: ${subtask.title}`,
      subtasks: subtaskProgress,
      currentSubtask: subtask.id,
      progress: Math.round(currentProgress)
    });
    
    // Run MOE competition for this subtask
    let attempts = 0;
    let success = false;
    let lastError: string | undefined;
    let result: any;
    
    while (attempts < 3 && !success) {
      attempts++;
      
      if (attempts > 1) {
        subtaskProgress[subtaskIndex].status = 'retrying';
        subtaskProgress[subtaskIndex].attempts = attempts;
        onProgress?.({
          phase: 'executing',
          message: `🔄 Retrying: ${subtask.title} (attempt ${attempts}/3)`,
          subtasks: subtaskProgress,
          currentSubtask: subtask.id,
          progress: Math.round(currentProgress)
        });
      }
      
      try {
        // Build context-aware prompt for this subtask
        const subtaskPrompt = buildSubtaskPrompt(subtask, dppmResult.plan, executionResults);
        
        result = await moeCompetition([
          { role: 'user', content: subtaskPrompt }
        ], subtask.assignedMorgy);
        
        // Validate result (basic check - not empty, not error)
        if (result.content && result.content.length > 10) {
          success = true;
          subtaskProgress[subtaskIndex].status = 'success';
          subtaskProgress[subtaskIndex].winningModel = result.moeMetadata?.winner?.model;
        } else {
          lastError = 'Response too short or empty';
        }
      } catch (error: any) {
        lastError = error.message;
        console.error(`[DPPM-MOE] Subtask ${subtask.id} attempt ${attempts} failed:`, error);
      }
    }
    
    // Record result
    executionResults.push({
      stepId: subtask.id,
      status: success ? 'success' : 'failed',
      actualOutcome: success ? result.content : lastError,
      duration: 0, // Would need timing
      usedFallback: attempts > 1,
      error: success ? undefined : lastError
    });
    
    if (!success) {
      subtaskProgress[subtaskIndex].status = 'failed';
    }
    
    currentProgress += progressPerSubtask;
  }
  
  // Progress: Reflecting
  onProgress?.({
    phase: 'reflecting',
    message: '🔍 Analyzing results and learning...',
    subtasks: subtaskProgress,
    progress: 85
  });
  
  // Build execution result for reflection
  const executionResult: ExecutionResult = {
    planId: dppmResult.plan.goal,
    status: executionResults.every(r => r.status === 'success') ? 'completed' : 
            executionResults.some(r => r.status === 'success') ? 'partial' : 'failed',
    completedSteps: executionResults,
    currentStep: '',
    errors: executionResults.filter(r => r.error).map(r => r.error!)
  };
  
  // Post-execution reflection
  const reflectionResult = await executeAndReflect(dppmResult.plan, executionResult, {
    userId,
    supabase,
    llmCall,
    skipPostReflection: false
  });
  
  // Merge all subtask outputs into final response
  const mergedOutput = mergeSubtaskOutputs(
    dppmResult.decomposed.subtasks,
    executionResults,
    goal
  );
  
  // Progress: Complete
  onProgress?.({
    phase: 'complete',
    message: '✅ Task completed!',
    subtasks: subtaskProgress,
    progress: 100
  });
  
  return {
    success: executionResult.status === 'completed',
    output: mergedOutput,
    dppmSummary: getDPPMSummary(reflectionResult),
    subtaskResults: executionResults.map((r, i) => ({
      id: dppmResult.decomposed.subtasks[i].id,
      title: dppmResult.decomposed.subtasks[i].title,
      status: r.status,
      output: r.actualOutcome,
      winningModel: subtaskProgress[i].winningModel,
      attempts: subtaskProgress[i].attempts || 1
    })),
    lessonsLearned: reflectionResult.postReflection?.lessonsLearned || [],
    experienceId: reflectionResult.experienceId,
    workflowId: reflectionResult.workflowId
  };
}

/**
 * Build a context-aware prompt for a subtask
 */
function buildSubtaskPrompt(
  subtask: any,
  plan: MergedPlan,
  previousResults: StepResult[]
): string {
  let prompt = `## Task: ${subtask.title}\n\n`;
  prompt += `**Description:** ${subtask.description}\n\n`;
  prompt += `**Overall Goal:** ${plan.goal}\n\n`;
  
  // Add context from previous subtasks
  if (previousResults.length > 0) {
    prompt += `**Previous Steps Completed:**\n`;
    for (const result of previousResults) {
      if (result.status === 'success') {
        prompt += `- ✅ ${result.stepId}: ${result.actualOutcome?.substring(0, 200)}...\n`;
      }
    }
    prompt += '\n';
  }
  
  prompt += `**Instructions:**\n`;
  prompt += `1. Focus ONLY on this specific subtask\n`;
  prompt += `2. Build upon the previous steps if relevant\n`;
  prompt += `3. Provide a complete, actionable output\n`;
  prompt += `4. If you need to generate code, include the full code\n`;
  prompt += `5. If you need to create content, include the full content\n`;
  
  return prompt;
}

/**
 * Merge outputs from all subtasks into a coherent final response
 */
function mergeSubtaskOutputs(
  subtasks: any[],
  results: StepResult[],
  goal: string
): string {
  const successfulOutputs = results
    .filter(r => r.status === 'success')
    .map((r, i) => ({
      title: subtasks[i]?.title || `Step ${i + 1}`,
      output: r.actualOutcome
    }));
  
  if (successfulOutputs.length === 0) {
    return 'I apologize, but I was unable to complete this task. Please try rephrasing your request or breaking it into smaller parts.';
  }
  
  // If only one subtask, return its output directly
  if (successfulOutputs.length === 1) {
    return successfulOutputs[0].output || '';
  }
  
  // Merge multiple outputs
  let merged = `# ${goal}\n\n`;
  merged += `I've completed this task in ${successfulOutputs.length} steps:\n\n`;
  
  for (const output of successfulOutputs) {
    merged += `## ${output.title}\n\n`;
    merged += `${output.output}\n\n`;
    merged += `---\n\n`;
  }
  
  return merged;
}

/**
 * Simple Supabase client creator
 */
function createSupabaseClient(url: string, key: string): any {
  return {
    from: (table: string) => ({
      select: async (columns?: string) => ({ data: [], error: null }),
      insert: async (data: any) => ({ data: null, error: null }),
      update: async (data: any) => ({ data: null, error: null }),
      upsert: async (data: any) => ({ data: null, error: null }),
      eq: function(col: string, val: any) { return this; },
      order: function(col: string, opts?: any) { return this; },
      limit: function(n: number) { return this; },
      single: function() { return this; }
    })
  };
}

export interface DPPMMOEResult {
  success: boolean;
  output: string;
  dppmSummary: string;
  subtaskResults: {
    id: string;
    title: string;
    status: string;
    output?: string;
    winningModel?: string;
    attempts: number;
  }[];
  lessonsLearned: string[];
  experienceId?: string;
  workflowId?: string;
}
