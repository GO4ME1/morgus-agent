/**
 * Parallel Planning Module
 * 
 * Generates detailed mini-plans for each subtask simultaneously,
 * leveraging specialized expertise from different Morgys.
 */

import type { Subtask, MiniPlan, PlanStep, AlternativeApproach } from './types';

export interface PlanningContext {
  goal: string;
  allSubtasks: Subtask[];
  userContext?: string;
}

/**
 * Plan all subtasks in parallel
 */
export async function planInParallel(
  subtasks: Subtask[],
  context: PlanningContext,
  llmCall: (prompt: string, morgy: string) => Promise<string>
): Promise<MiniPlan[]> {
  // Execute planning for all subtasks in parallel
  const planningPromises = subtasks.map(subtask =>
    planSubtask(subtask, context, llmCall)
  );
  
  const miniPlans = await Promise.all(planningPromises);
  
  // Validate all plans
  for (const plan of miniPlans) {
    validateMiniPlan(plan);
  }
  
  return miniPlans;
}

/**
 * Plan a single subtask
 */
async function planSubtask(
  subtask: Subtask,
  context: PlanningContext,
  llmCall: (prompt: string, morgy: string) => Promise<string>
): Promise<MiniPlan> {
  const prompt = buildPlanningPrompt(subtask, context);
  const response = await llmCall(prompt, subtask.assignedMorgy);
  
  return parsePlanningResponse(response, subtask);
}

/**
 * Build the planning prompt for a subtask
 */
function buildPlanningPrompt(subtask: Subtask, context: PlanningContext): string {
  const morgyPersonalities: Record<string, string> = {
    research: `You are Research Morgy, an expert in deep research, competitor analysis, and data gathering. You excel at finding information, analyzing trends, and synthesizing insights.`,
    dev: `You are Dev Morgy, a coding and DevOps expert. You excel at building applications, writing clean code, deploying services, and solving technical challenges.`,
    bill: `You are Bill Morgy, a marketing and branding expert. You excel at copywriting, design, creating compelling narratives, and building brand identity.`,
    sally: `You are Sally Morgy, a promotions and distribution expert. You excel at social media marketing, influencer outreach, viral campaigns, and getting products in front of audiences.`,
    main: `You are the Main Morgus planner, a generalist who can handle any task with expertise across all domains.`
  };
  
  const personality = morgyPersonalities[subtask.assignedMorgy] || morgyPersonalities.main;
  
  return `${personality}

**Overall Goal:** ${context.goal}

**Your Subtask:**
- **ID:** ${subtask.id}
- **Title:** ${subtask.title}
- **Description:** ${subtask.description}
- **Complexity:** ${subtask.estimatedComplexity}
- **Dependencies:** ${subtask.dependencies.length > 0 ? subtask.dependencies.join(', ') : 'None'}

${context.userContext ? `**User Context:**\n${context.userContext}\n` : ''}

**Your Task:**
Create a detailed mini-plan for this subtask. Include:
1. Your approach (strategy/methodology)
2. Step-by-step actions with expected outcomes
3. Tools you'll need (shell, file, browser, search, etc.)
4. Potential risks and how to mitigate them
5. Estimated duration in minutes
6. (Optional) Alternative approaches if applicable

**Available Tools:**
- \`shell\`: Execute shell commands
- \`file\`: Read/write/edit files
- \`browser\`: Navigate web, click, fill forms
- \`search\`: Web search for information
- \`deploy\`: Deploy to Cloudflare Pages/Workers
- \`notebookLM\`: Create structured knowledge notebooks
- \`github\`: Git operations
- \`media\`: Generate images, videos, audio

**Output Format (JSON):**
\`\`\`json
{
  "approach": "Brief description of your strategy",
  "steps": [
    {
      "id": "${subtask.id}-step-1",
      "action": "What you'll do",
      "tool": "tool_name",
      "expectedOutcome": "What should happen",
      "fallbackStrategy": "What to do if this fails (optional)"
    }
  ],
  "estimatedDuration": 30,
  "requiredTools": ["shell", "file"],
  "potentialRisks": [
    "Risk 1: Description",
    "Risk 2: Description"
  ],
  "alternativeApproaches": [
    {
      "description": "Alternative strategy",
      "pros": ["Pro 1", "Pro 2"],
      "cons": ["Con 1", "Con 2"]
    }
  ]
}
\`\`\`

Think through the subtask carefully and create a robust plan:`;
}

/**
 * Parse the planning response into a MiniPlan
 */
function parsePlanningResponse(response: string, subtask: Subtask): MiniPlan {
  // Extract JSON from response
  const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/) || 
                    response.match(/```\s*([\s\S]*?)\s*```/) ||
                    [null, response];
  
  const jsonStr = jsonMatch[1] || response;
  
  try {
    const parsed = JSON.parse(jsonStr.trim());
    
    return {
      subtaskId: subtask.id,
      morgy: subtask.assignedMorgy,
      approach: parsed.approach || '',
      steps: parsed.steps || [],
      estimatedDuration: parsed.estimatedDuration || 30,
      requiredTools: parsed.requiredTools || [],
      potentialRisks: parsed.potentialRisks || [],
      alternativeApproaches: parsed.alternativeApproaches || []
    };
  } catch (error) {
    throw new Error(`Failed to parse planning response for ${subtask.id}: ${error.message}\n\nResponse: ${response}`);
  }
}

/**
 * Validate a mini-plan
 */
function validateMiniPlan(plan: MiniPlan): void {
  if (!plan.approach) {
    throw new Error(`Mini-plan ${plan.subtaskId} missing approach`);
  }
  
  if (!plan.steps || plan.steps.length === 0) {
    throw new Error(`Mini-plan ${plan.subtaskId} has no steps`);
  }
  
  for (const step of plan.steps) {
    if (!step.id || !step.action || !step.expectedOutcome) {
      throw new Error(`Invalid step in mini-plan ${plan.subtaskId}: ${JSON.stringify(step)}`);
    }
  }
  
  if (plan.estimatedDuration <= 0) {
    throw new Error(`Mini-plan ${plan.subtaskId} has invalid duration: ${plan.estimatedDuration}`);
  }
}

/**
 * Merge mini-plans into a unified execution plan
 */
export function mergePlans(
  miniPlans: MiniPlan[],
  subtasks: Subtask[],
  goal: string,
  executionOrder: string[][]
): import('./types').MergedPlan {
  // Calculate total estimated duration
  const totalEstimatedDuration = miniPlans.reduce((sum, plan) => sum + plan.estimatedDuration, 0);
  
  // Build execution phases based on execution order
  const executionPhases: import('./types').ExecutionPhase[] = executionOrder.map((level, index) => {
    const levelPlans = miniPlans.filter(plan => level.includes(plan.subtaskId));
    const maxDuration = Math.max(...levelPlans.map(p => p.estimatedDuration), 0);
    const levelSubtasks = subtasks.filter(s => level.includes(s.id));
    
    return {
      phaseNumber: index + 1,
      subtasks: level,
      estimatedDuration: maxDuration, // Parallel execution, so use max
      milestone: generateMilestone(levelSubtasks)
    };
  });
  
  // Identify critical path (longest path through dependencies)
  const criticalPath = identifyCriticalPath(miniPlans, executionOrder);
  
  // Identify parallelizable groups
  const parallelizable = executionOrder.filter(level => level.length > 1);
  
  return {
    goal,
    totalEstimatedDuration,
    executionOrder: executionPhases,
    criticalPath,
    parallelizable,
    miniPlans
  };
}

/**
 * Generate a milestone description for a phase
 */
function generateMilestone(subtasks: Subtask[]): string {
  if (subtasks.length === 1) {
    return `${subtasks[0].title} complete`;
  }
  
  const titles = subtasks.map(s => s.title).join(', ');
  return `${titles} complete`;
}

/**
 * Identify the critical path (longest path through dependencies)
 */
function identifyCriticalPath(miniPlans: MiniPlan[], executionOrder: string[][]): string[] {
  // For simplicity, use the first subtask in each level as the critical path
  // In a more sophisticated implementation, this would calculate the actual longest path
  return executionOrder.map(level => level[0]);
}

/**
 * Get all required tools across all mini-plans
 */
export function getAllRequiredTools(miniPlans: MiniPlan[]): string[] {
  const toolsSet = new Set<string>();
  
  for (const plan of miniPlans) {
    for (const tool of plan.requiredTools) {
      toolsSet.add(tool);
    }
  }
  
  return Array.from(toolsSet);
}

/**
 * Get all potential risks across all mini-plans
 */
export function getAllPotentialRisks(miniPlans: MiniPlan[]): string[] {
  const risks: string[] = [];
  
  for (const plan of miniPlans) {
    for (const risk of plan.potentialRisks) {
      risks.push(`[${plan.subtaskId}] ${risk}`);
    }
  }
  
  return risks;
}

/**
 * Find alternative approaches for a subtask
 */
export function getAlternativeApproaches(
  miniPlans: MiniPlan[],
  subtaskId: string
): AlternativeApproach[] {
  const plan = miniPlans.find(p => p.subtaskId === subtaskId);
  return plan?.alternativeApproaches || [];
}
