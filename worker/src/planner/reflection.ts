/**
 * Reflection and Self-Improvement Module
 * 
 * Implements pre-flight ("Devil's Advocate") and post-execution reflection
 * to enable continuous learning and improvement.
 */

import type {
  MergedPlan,
  PreFlightReflection,
  Risk,
  Mitigation,
  ExecutionResult,
  PostExecutionReflection,
  ReflectionNote,
  Likelihood,
  Impact,
  Sentiment
} from './types';

/**
 * Pre-flight reflection: "What could go wrong?"
 * Analyzes the plan and identifies potential risks before execution
 */
export async function preFlightReflection(
  plan: MergedPlan,
  llmCall: (prompt: string) => Promise<string>
): Promise<PreFlightReflection> {
  const prompt = buildPreFlightPrompt(plan);
  const response = await llmCall(prompt);
  
  const reflection = parsePreFlightResponse(response);
  
  // Update the plan with mitigations
  const updatedPlan = applyMitigations(plan, reflection.mitigations);
  
  return {
    ...reflection,
    updatedPlan
  };
}

/**
 * Build the pre-flight reflection prompt
 */
function buildPreFlightPrompt(plan: MergedPlan): string {
  return `You are Morgus, an advanced AI agent about to execute a complex plan. Before execution, you need to perform a "Devil's Advocate" analysis to identify potential risks and create mitigation strategies.

**Goal:** ${plan.goal}

**Execution Plan:**
${JSON.stringify(plan.executionOrder, null, 2)}

**Mini-Plans:**
${plan.miniPlans.map(mp => `
- **${mp.subtaskId}** (${mp.morgy}): ${mp.approach}
  - Duration: ${mp.estimatedDuration} minutes
  - Tools: ${mp.requiredTools.join(', ')}
  - Known Risks: ${mp.potentialRisks.join('; ')}
`).join('\n')}

**Your Task:**
Perform a comprehensive risk analysis. For each potential risk:
1. Describe what could go wrong
2. Assess likelihood (low/medium/high)
3. Assess impact (low/medium/high)
4. Identify which steps would be affected
5. Propose a mitigation strategy
6. Suggest a fallback action

Focus on:
- Technical failures (API errors, deployment issues, etc.)
- Resource constraints (time, rate limits, etc.)
- Data quality issues (missing info, incorrect assumptions, etc.)
- Dependency failures (one step failing cascades to others)
- External factors (service outages, network issues, etc.)

**Output Format (JSON):**
\`\`\`json
{
  "risks": [
    {
      "id": "risk-1",
      "description": "What could go wrong",
      "likelihood": "low|medium|high",
      "impact": "low|medium|high",
      "affectedSteps": ["step-id-1", "step-id-2"]
    }
  ],
  "mitigations": [
    {
      "riskId": "risk-1",
      "strategy": "How to prevent or reduce the risk",
      "fallbackAction": "What to do if the risk occurs"
    }
  ]
}
\`\`\`

Analyze the plan and identify 3-7 key risks:`;
}

/**
 * Parse the pre-flight reflection response
 */
function parsePreFlightResponse(response: string): Omit<PreFlightReflection, 'updatedPlan'> {
  const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/) || 
                    response.match(/```\s*([\s\S]*?)\s*```/) ||
                    [null, response];
  
  const jsonStr = jsonMatch[1] || response;
  
  try {
    const parsed = JSON.parse(jsonStr.trim());
    
    return {
      risks: parsed.risks || [],
      mitigations: parsed.mitigations || []
    };
  } catch (error) {
    throw new Error(`Failed to parse pre-flight reflection: ${error.message}\n\nResponse: ${response}`);
  }
}

/**
 * Apply mitigations to the plan
 */
function applyMitigations(plan: MergedPlan, mitigations: Mitigation[]): MergedPlan {
  // Create a deep copy of the plan
  const updatedPlan: MergedPlan = JSON.parse(JSON.stringify(plan));
  
  // For each mitigation, add fallback strategies to affected steps
  for (const mitigation of mitigations) {
    for (const miniPlan of updatedPlan.miniPlans) {
      for (const step of miniPlan.steps) {
        // If this step doesn't have a fallback and could benefit from one, add it
        if (!step.fallbackStrategy) {
          step.fallbackStrategy = mitigation.fallbackAction;
        }
      }
    }
  }
  
  return updatedPlan;
}

/**
 * Post-execution reflection: "What worked? What failed? Why?"
 * Analyzes the execution result and captures lessons learned
 */
export async function postExecutionReflection(
  plan: MergedPlan,
  result: ExecutionResult,
  llmCall: (prompt: string) => Promise<string>
): Promise<PostExecutionReflection> {
  const prompt = buildPostExecutionPrompt(plan, result);
  const response = await llmCall(prompt);
  
  const reflection = parsePostExecutionResponse(response, plan.goal, result);
  
  return reflection;
}

/**
 * Build the post-execution reflection prompt
 */
function buildPostExecutionPrompt(plan: MergedPlan, result: ExecutionResult): string {
  const successRate = result.completedSteps.filter(s => s.status === 'success').length / result.completedSteps.length;
  const failedSteps = result.completedSteps.filter(s => s.status === 'failed');
  const usedFallbacks = result.completedSteps.filter(s => s.usedFallback);
  
  return `You are Morgus, an advanced AI agent that just completed (or attempted) a complex task. Now you need to reflect on what happened to learn and improve for future tasks.

**Goal:** ${plan.goal}

**Overall Status:** ${result.status}
**Success Rate:** ${(successRate * 100).toFixed(1)}%

**Completed Steps:** ${result.completedSteps.length}
- Successful: ${result.completedSteps.filter(s => s.status === 'success').length}
- Failed: ${failedSteps.length}
- Used Fallback: ${usedFallbacks.length}

**Execution Details:**
${result.completedSteps.map(step => `
- **${step.stepId}**: ${step.status}
  - Outcome: ${step.actualOutcome}
  - Duration: ${step.duration}s
  ${step.usedFallback ? '  - Used fallback strategy' : ''}
`).join('\n')}

${result.errors.length > 0 ? `
**Errors:**
${result.errors.map(err => `- ${err.stepId}: ${err.error}\n  Recovery: ${err.recoveryAction}`).join('\n')}
` : ''}

**Your Task:**
Reflect on this execution and extract lessons learned. For each major step or phase:
1. Write a 1-3 sentence reflection note
2. Indicate sentiment (positive/negative/neutral)
3. Capture what worked well and what didn't
4. Identify patterns or insights

Then, synthesize overall lessons learned that can be applied to future tasks.

Finally, determine if this execution was successful enough to be saved as a reusable workflow.

**Output Format (JSON):**
\`\`\`json
{
  "overallSuccess": true|false,
  "reflectionNotes": [
    {
      "stepId": "step-id",
      "note": "1-3 sentence reflection",
      "sentiment": "positive|negative|neutral"
    }
  ],
  "lessonsLearned": [
    "Lesson 1: Specific, actionable insight",
    "Lesson 2: Pattern or best practice identified"
  ],
  "workflowCandidate": true|false
}
\`\`\`

Reflect deeply on this execution:`;
}

/**
 * Parse the post-execution reflection response
 */
function parsePostExecutionResponse(
  response: string,
  goal: string,
  result: ExecutionResult
): PostExecutionReflection {
  const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/) || 
                    response.match(/```\s*([\s\S]*?)\s*```/) ||
                    [null, response];
  
  const jsonStr = jsonMatch[1] || response;
  
  try {
    const parsed = JSON.parse(jsonStr.trim());
    
    return {
      planId: result.planId,
      goal,
      overallSuccess: parsed.overallSuccess || false,
      reflectionNotes: parsed.reflectionNotes || [],
      lessonsLearned: parsed.lessonsLearned || [],
      workflowCandidate: parsed.workflowCandidate || false
    };
  } catch (error) {
    throw new Error(`Failed to parse post-execution reflection: ${error.message}\n\nResponse: ${response}`);
  }
}

/**
 * Calculate risk score for a risk
 */
export function calculateRiskScore(risk: Risk): number {
  const likelihoodScores: Record<Likelihood, number> = {
    low: 1,
    medium: 2,
    high: 3
  };
  
  const impactScores: Record<Impact, number> = {
    low: 1,
    medium: 3,
    high: 5
  };
  
  return likelihoodScores[risk.likelihood] * impactScores[risk.impact];
}

/**
 * Get high-priority risks (score >= 6)
 */
export function getHighPriorityRisks(risks: Risk[]): Risk[] {
  return risks.filter(risk => calculateRiskScore(risk) >= 6);
}

/**
 * Calculate sentiment score from reflection notes
 */
export function calculateSentimentScore(notes: ReflectionNote[]): number {
  const sentimentScores: Record<Sentiment, number> = {
    positive: 1,
    neutral: 0,
    negative: -1
  };
  
  const totalScore = notes.reduce((sum, note) => sum + sentimentScores[note.sentiment], 0);
  return totalScore / notes.length;
}

/**
 * Determine if execution was successful enough to save as workflow
 */
export function shouldSaveAsWorkflow(reflection: PostExecutionReflection): boolean {
  // Must be marked as workflow candidate
  if (!reflection.workflowCandidate) {
    return false;
  }
  
  // Must have overall success
  if (!reflection.overallSuccess) {
    return false;
  }
  
  // Must have positive sentiment overall
  const sentimentScore = calculateSentimentScore(reflection.reflectionNotes);
  if (sentimentScore < 0.3) {
    return false;
  }
  
  return true;
}
