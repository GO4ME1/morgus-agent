/**
 * Skill Generator - Creates new skills from successful task completions
 * 
 * This implements the "self-improving loop" where the agent learns from
 * successful executions and generates reusable skills.
 */

import { Skill } from './index';

export interface TaskExecution {
  userQuery: string;
  toolCalls: Array<{
    name: string;
    args: any;
    result: string;
  }>;
  finalResponse: string;
  success: boolean;
  timestamp: string;
}

/**
 * Analyze a successful task execution and generate a skill if appropriate
 */
export async function generateSkillFromExecution(
  execution: TaskExecution,
  openaiApiKey: string
): Promise<Skill | null> {
  // Only generate skills from successful executions with multiple tool calls
  if (!execution.success || execution.toolCalls.length < 2) {
    return null;
  }

  // Check if this is a generalizable pattern
  const isGeneralizable = checkGeneralizability(execution);
  if (!isGeneralizable) {
    return null;
  }

  try {
    const prompt = buildSkillGenerationPrompt(execution);
    
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
            content: `You are a skill generator for an AI agent. Your job is to analyze successful task executions and create reusable skill documents that can help the agent perform similar tasks in the future.

A skill document should:
1. Have a clear, descriptive name
2. Include a concise description
3. List relevant keywords for matching
4. Contain step-by-step instructions
5. Include code templates or patterns where applicable
6. Note any gotchas or best practices learned

Output your response as JSON with this structure:
{
  "name": "Skill Name",
  "description": "Brief description",
  "keywords": ["keyword1", "keyword2"],
  "content": "# Skill Name\\n\\n## Overview\\n..."
}`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      console.error('[SkillGen] API error:', response.statusText);
      return null;
    }

    const data = await response.json();
    const content = data.choices[0].message.content;

    // Parse the JSON response
    const skillData = JSON.parse(content);

    const skill: Skill = {
      id: `gen-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      name: skillData.name,
      description: skillData.description,
      keywords: skillData.keywords,
      content: skillData.content,
      createdAt: new Date().toISOString(),
      source: 'generated'
    };

    return skill;
  } catch (error) {
    console.error('[SkillGen] Error generating skill:', error);
    return null;
  }
}

/**
 * Check if a task execution represents a generalizable pattern
 */
function checkGeneralizability(execution: TaskExecution): boolean {
  const query = execution.userQuery.toLowerCase();
  
  // Patterns that are likely generalizable
  const generalizablePatterns = [
    // Website building
    /build|create|make.*website|page|site/,
    // Data processing
    /analyze|process|extract.*data|file|document/,
    // Automation
    /automate|scrape|crawl/,
    // Integration
    /connect|integrate|api/,
    // Visualization
    /chart|graph|visualize/,
  ];

  // Check if query matches any generalizable pattern
  for (const pattern of generalizablePatterns) {
    if (pattern.test(query)) {
      return true;
    }
  }

  // Check if multiple different tools were used (indicates complex workflow)
  const uniqueTools = new Set(execution.toolCalls.map(tc => tc.name));
  if (uniqueTools.size >= 3) {
    return true;
  }

  return false;
}

/**
 * Build the prompt for skill generation
 */
function buildSkillGenerationPrompt(execution: TaskExecution): string {
  let prompt = `Analyze this successful task execution and create a reusable skill document.

## User Query
${execution.userQuery}

## Tool Calls Made
`;

  for (const toolCall of execution.toolCalls) {
    prompt += `\n### ${toolCall.name}
Arguments: ${JSON.stringify(toolCall.args, null, 2)}
Result: ${toolCall.result.substring(0, 500)}${toolCall.result.length > 500 ? '...' : ''}
`;
  }

  prompt += `
## Final Response
${execution.finalResponse.substring(0, 1000)}${execution.finalResponse.length > 1000 ? '...' : ''}

## Instructions
Create a skill document that captures the workflow, patterns, and best practices demonstrated in this execution. The skill should be general enough to apply to similar tasks, not specific to this exact query.

Focus on:
1. The overall workflow pattern
2. Tool usage sequence
3. Any code patterns or templates used
4. Error handling approaches
5. Best practices demonstrated
`;

  return prompt;
}

/**
 * Suggest skill generation to user after successful complex task
 */
export function shouldSuggestSkillGeneration(execution: TaskExecution): boolean {
  // Only suggest for successful executions
  if (!execution.success) {
    return false;
  }

  // Require at least 3 tool calls
  if (execution.toolCalls.length < 3) {
    return false;
  }

  // Check for complex patterns
  const uniqueTools = new Set(execution.toolCalls.map(tc => tc.name));
  
  // Suggest if multiple different tools were used
  if (uniqueTools.size >= 2) {
    return true;
  }

  return false;
}

/**
 * Format skill generation suggestion message
 */
export function formatSkillSuggestion(execution: TaskExecution): string {
  return `
💡 **Learn from this success?**

I noticed this task involved a complex workflow. Would you like me to save this as a reusable skill so I can handle similar tasks faster in the future?

**What I learned:**
- Used ${execution.toolCalls.length} tool calls
- Tools: ${[...new Set(execution.toolCalls.map(tc => tc.name))].join(', ')}

Reply "save skill" to create a reusable skill from this workflow.
`;
}
