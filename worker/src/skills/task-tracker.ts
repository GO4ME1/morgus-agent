/**
 * Task Tracker - Implements the "todo.md pattern" from Manus
 * 
 * This module helps the agent maintain focus on complex tasks by
 * tracking progress and keeping goals in recent context.
 */

export interface TaskStep {
  id: number;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  result?: string;
}

export interface TaskPlan {
  goal: string;
  steps: TaskStep[];
  currentStepId: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Task Tracker manages the agent's task plan and progress
 */
export class TaskTracker {
  private plan: TaskPlan | null = null;

  /**
   * Create a new task plan
   */
  createPlan(goal: string, steps: string[]): TaskPlan {
    this.plan = {
      goal,
      steps: steps.map((desc, index) => ({
        id: index + 1,
        description: desc,
        status: 'pending'
      })),
      currentStepId: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    return this.plan;
  }

  /**
   * Get current plan
   */
  getPlan(): TaskPlan | null {
    return this.plan;
  }

  /**
   * Mark current step as in progress
   */
  startCurrentStep(): void {
    if (!this.plan) return;
    
    const step = this.plan.steps.find(s => s.id === this.plan!.currentStepId);
    if (step) {
      step.status = 'in_progress';
      this.plan.updatedAt = new Date().toISOString();
    }
  }

  /**
   * Complete current step and advance
   */
  completeCurrentStep(result?: string): void {
    if (!this.plan) return;
    
    const step = this.plan.steps.find(s => s.id === this.plan!.currentStepId);
    if (step) {
      step.status = 'completed';
      step.result = result;
      this.plan.currentStepId++;
      this.plan.updatedAt = new Date().toISOString();
    }
  }

  /**
   * Mark current step as failed
   */
  failCurrentStep(error: string): void {
    if (!this.plan) return;
    
    const step = this.plan.steps.find(s => s.id === this.plan!.currentStepId);
    if (step) {
      step.status = 'failed';
      step.result = error;
      this.plan.updatedAt = new Date().toISOString();
    }
  }

  /**
   * Check if task is complete
   */
  isComplete(): boolean {
    if (!this.plan) return true;
    return this.plan.steps.every(s => s.status === 'completed');
  }

  /**
   * Generate todo.md style context for injection
   * This keeps the task plan in recent attention
   */
  generateContextRecitation(): string {
    if (!this.plan) return '';

    let context = `\n\n📋 **CURRENT TASK PROGRESS:**\n`;
    context += `**Goal:** ${this.plan.goal}\n\n`;

    for (const step of this.plan.steps) {
      const icon = step.status === 'completed' ? '✅' :
                   step.status === 'in_progress' ? '🔄' :
                   step.status === 'failed' ? '❌' : '⬜';
      
      context += `${icon} ${step.id}. ${step.description}`;
      
      if (step.status === 'in_progress') {
        context += ' ← **CURRENT**';
      }
      
      if (step.result && step.status !== 'pending') {
        context += `\n   Result: ${step.result.substring(0, 100)}${step.result.length > 100 ? '...' : ''}`;
      }
      
      context += '\n';
    }

    const completedCount = this.plan.steps.filter(s => s.status === 'completed').length;
    const totalCount = this.plan.steps.length;
    context += `\n**Progress:** ${completedCount}/${totalCount} steps completed\n`;

    return context;
  }

  /**
   * Clear the current plan
   */
  clear(): void {
    this.plan = null;
  }
}

// Export singleton instance
export const taskTracker = new TaskTracker();

/**
 * Detect if a query requires multi-step planning
 */
export function requiresTaskPlan(query: string): boolean {
  const queryLower = query.toLowerCase();
  
  // Patterns that typically require multi-step execution
  const complexPatterns = [
    /build.*website|create.*site|make.*page/,
    /analyze.*and.*visualize/,
    /research.*and.*summarize/,
    /deploy.*to/,
    /automate/,
    /step.?by.?step/,
    /multiple|several|various/,
    /compare.*and/,
    /then|after that|next/,
  ];

  for (const pattern of complexPatterns) {
    if (pattern.test(queryLower)) {
      return true;
    }
  }

  // Also check for explicit multi-part requests
  const parts = query.split(/[,;]|and then|then|after/i);
  if (parts.length >= 3) {
    return true;
  }

  return false;
}

/**
 * Generate a task plan from a complex query
 */
export async function generateTaskPlan(
  query: string,
  openaiApiKey: string
): Promise<{ goal: string; steps: string[] } | null> {
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are a task planner. Given a user request, break it down into clear, actionable steps.

Output JSON with this structure:
{
  "goal": "Clear statement of the overall goal",
  "steps": [
    "Step 1: Description",
    "Step 2: Description",
    ...
  ]
}

Keep steps concise but specific. Typically 3-7 steps for most tasks.
Focus on the logical sequence of actions needed.`
          },
          {
            role: 'user',
            content: query
          }
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    // Parse JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;
    
    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error('[TaskPlan] Error generating plan:', error);
    return null;
  }
}
