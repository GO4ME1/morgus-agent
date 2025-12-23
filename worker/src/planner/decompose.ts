/**
 * Task Decomposition Module
 * 
 * Breaks down complex, high-level goals into 3-7 smaller, manageable subtasks
 * that can be planned independently by specialized Morgys.
 */

import type { DecomposedTask, Subtask, Dependency, ModelType, Complexity } from './types';

export interface DecomposeOptions {
  maxSubtasks?: number; // Default: 7
  minSubtasks?: number; // Default: 3
  preferredModels?: ModelType[];
}

/**
 * Decompose a high-level goal into subtasks
 */
export async function decompose(
  goal: string,
  llmCall: (prompt: string) => Promise<string>,
  options: DecomposeOptions = {}
): Promise<DecomposedTask> {
  const { maxSubtasks = 7, minSubtasks = 3 } = options;

  const prompt = buildDecomposePrompt(goal, minSubtasks, maxSubtasks);
  const response = await llmCall(prompt);
  
  const decomposed = parseDecomposeResponse(response, goal);
  
  // Validate the decomposition
  validateDecomposition(decomposed, minSubtasks, maxSubtasks);
  
  return decomposed;
}

/**
 * Build the prompt for task decomposition
 */
function buildDecomposePrompt(goal: string, minSubtasks: number, maxSubtasks: number): string {
  return `You are Morgus, an advanced AI agent with a team of specialized Morgy assistants. You need to decompose a complex goal into ${minSubtasks}-${maxSubtasks} manageable subtasks.

**Your MOE (Mixture of Experts) Models:**
- **GPT-4o Mini**: Fast, general-purpose, good at reasoning and planning
- **Claude 3 Haiku**: Excellent at analysis, writing, and following instructions
- **Gemini Pro 1.5**: Strong at research, data processing, and multi-modal tasks
- **Mistral 7B**: Fast, efficient, good at code and technical tasks
- **DeepSeek R1T2**: Specialized in deep reasoning and complex problem-solving
- **KAT-Coder-Pro**: Optimized for coding and development tasks

**Goal:** ${goal}

**Instructions:**
1. Break down the goal into ${minSubtasks}-${maxSubtasks} subtasks
2. Each subtask should be:
   - Independent enough to be planned separately
   - Specific and actionable
   - Assigned to the most appropriate model from your MOE
3. Identify dependencies between subtasks
4. Estimate complexity for each subtask (low/medium/high)

**Output Format (JSON):**
\`\`\`json
{
  "subtasks": [
    {
      "id": "subtask-1",
      "title": "Brief title",
      "description": "Detailed description of what needs to be done",
      "assignedModel": "gpt-4o-mini|claude-3-haiku|gemini-pro-1.5|mistral-7b|deepseek-r1t2|kat-coder-pro|auto",
      "estimatedComplexity": "low|medium|high",
      "dependencies": []
    }
  ],
  "dependencies": [
    {
      "subtaskId": "subtask-2",
      "dependsOn": ["subtask-1"]
    }
  ]
}
\`\`\`

Think step-by-step:
1. What are the major components of this goal?
2. What needs to happen first? (dependencies)
3. Which model is best suited for each component?
4. How complex is each subtask?

Now decompose the goal:`;
}

/**
 * Parse the LLM response into a DecomposedTask
 */
function parseDecomposeResponse(response: string, goal: string): DecomposedTask {
  // Extract JSON from response (handle markdown code blocks)
  const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/) || 
                    response.match(/```\s*([\s\S]*?)\s*```/) ||
                    [null, response];
  
  const jsonStr = jsonMatch[1] || response;
  
  try {
    const parsed = JSON.parse(jsonStr.trim());
    
    return {
      goal,
      subtasks: parsed.subtasks || [],
      dependencies: parsed.dependencies || []
    };
  } catch (error) {
    throw new Error(`Failed to parse decomposition response: ${error.message}\n\nResponse: ${response}`);
  }
}

/**
 * Validate the decomposition
 */
function validateDecomposition(
  decomposed: DecomposedTask,
  minSubtasks: number,
  maxSubtasks: number
): void {
  const { subtasks, dependencies } = decomposed;
  
  // Check subtask count
  if (subtasks.length < minSubtasks) {
    throw new Error(`Too few subtasks: ${subtasks.length} (minimum: ${minSubtasks})`);
  }
  
  if (subtasks.length > maxSubtasks) {
    throw new Error(`Too many subtasks: ${subtasks.length} (maximum: ${maxSubtasks})`);
  }
  
  // Check that all subtasks have required fields
  for (const subtask of subtasks) {
    if (!subtask.id || !subtask.title || !subtask.description || !subtask.assignedMorgy) {
      throw new Error(`Invalid subtask: ${JSON.stringify(subtask)}`);
    }
  }
  
  // Check that all dependencies reference valid subtasks
  const subtaskIds = new Set(subtasks.map(s => s.id));
  for (const dep of dependencies) {
    if (!subtaskIds.has(dep.subtaskId)) {
      throw new Error(`Dependency references unknown subtask: ${dep.subtaskId}`);
    }
    
    for (const dependsOn of dep.dependsOn) {
      if (!subtaskIds.has(dependsOn)) {
        throw new Error(`Dependency references unknown subtask: ${dependsOn}`);
      }
    }
  }
  
  // Check for circular dependencies
  detectCircularDependencies(subtasks, dependencies);
}

/**
 * Detect circular dependencies using topological sort
 */
function detectCircularDependencies(subtasks: Subtask[], dependencies: Dependency[]): void {
  const graph = new Map<string, string[]>();
  const inDegree = new Map<string, number>();
  
  // Initialize graph
  for (const subtask of subtasks) {
    graph.set(subtask.id, []);
    inDegree.set(subtask.id, 0);
  }
  
  // Build graph
  for (const dep of dependencies) {
    for (const dependsOn of dep.dependsOn) {
      graph.get(dependsOn)!.push(dep.subtaskId);
      inDegree.set(dep.subtaskId, (inDegree.get(dep.subtaskId) || 0) + 1);
    }
  }
  
  // Topological sort (Kahn's algorithm)
  const queue: string[] = [];
  const sorted: string[] = [];
  
  for (const [id, degree] of inDegree.entries()) {
    if (degree === 0) {
      queue.push(id);
    }
  }
  
  while (queue.length > 0) {
    const current = queue.shift()!;
    sorted.push(current);
    
    for (const neighbor of graph.get(current)!) {
      inDegree.set(neighbor, inDegree.get(neighbor)! - 1);
      if (inDegree.get(neighbor) === 0) {
        queue.push(neighbor);
      }
    }
  }
  
  if (sorted.length !== subtasks.length) {
    throw new Error('Circular dependency detected in subtasks');
  }
}

/**
 * Get the execution order of subtasks based on dependencies
 */
export function getExecutionOrder(decomposed: DecomposedTask): string[][] {
  const { subtasks, dependencies } = decomposed;
  
  const graph = new Map<string, string[]>();
  const inDegree = new Map<string, number>();
  
  // Initialize
  for (const subtask of subtasks) {
    graph.set(subtask.id, []);
    inDegree.set(subtask.id, 0);
  }
  
  // Build graph
  for (const dep of dependencies) {
    for (const dependsOn of dep.dependsOn) {
      graph.get(dependsOn)!.push(dep.subtaskId);
      inDegree.set(dep.subtaskId, (inDegree.get(dep.subtaskId) || 0) + 1);
    }
  }
  
  // Topological sort by levels (for parallel execution)
  const levels: string[][] = [];
  const queue: string[] = [];
  
  for (const [id, degree] of inDegree.entries()) {
    if (degree === 0) {
      queue.push(id);
    }
  }
  
  while (queue.length > 0) {
    const currentLevel: string[] = [];
    const levelSize = queue.length;
    
    for (let i = 0; i < levelSize; i++) {
      const current = queue.shift()!;
      currentLevel.push(current);
      
      for (const neighbor of graph.get(current)!) {
        inDegree.set(neighbor, inDegree.get(neighbor)! - 1);
        if (inDegree.get(neighbor) === 0) {
          queue.push(neighbor);
        }
      }
    }
    
    levels.push(currentLevel);
  }
  
  return levels;
}

/**
 * Get subtasks by model type
 */
export function getSubtasksByModel(decomposed: DecomposedTask): Map<ModelType, Subtask[]> {
  const byModel = new Map<ModelType, Subtask[]>();
  
  for (const subtask of decomposed.subtasks) {
    if (!byModel.has(subtask.assignedModel)) {
      byModel.set(subtask.assignedModel, []);
    }
    byModel.get(subtask.assignedModel)!.push(subtask);
  }
  
  return byModel;
}

/**
 * Estimate total complexity score
 */
export function estimateTotalComplexity(decomposed: DecomposedTask): number {
  const complexityScores: Record<Complexity, number> = {
    low: 1,
    medium: 3,
    high: 5
  };
  
  return decomposed.subtasks.reduce((total, subtask) => {
    return total + complexityScores[subtask.estimatedComplexity];
  }, 0);
}
