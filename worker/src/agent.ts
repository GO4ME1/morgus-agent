/*
 * Agent orchestrator for autonomous task execution
 */

import { ToolRegistry } from './tools';
import { callGemini } from './gemini';
import { skillsManager } from './skills';
import { executionLogger } from './skills/execution-logger';
import { taskTracker, requiresTaskPlan, generateTaskPlan } from './skills/task-tracker';
import { formatToolResult, formatErrorForContext, deterministicStringify } from './context';
import { factChecker } from './fact-checker';
import { MORGUS_KERNEL } from './morgus-kernel';

export interface AgentConfig {
  maxIterations?: number;
  temperature?: number;
  model?: string;
}

export interface AgentMessage {
  type: 'status' | 'thought' | 'tool_call' | 'tool_result' | 'response' | 'error' | 'complete';
  content: string;
  metadata?: any;
}

/**
 * Autonomous agent that can use tools and reason through tasks
 */
export class AutonomousAgent {
  private toolRegistry: ToolRegistry;
  private config: AgentConfig;
  private conversationHistory: any[] = [];

  constructor(config: AgentConfig = {}) {
    this.toolRegistry = new ToolRegistry();
    this.config = {
      maxIterations: config.maxIterations || 10,
      temperature: config.temperature || 0.7,
      model: config.model || 'gpt-4o-mini',
    };
  }

  private detectToolNeed(message: string): boolean {
    const toolKeywords = [
      'search', 'find', 'look up', 'image', 'picture', 'photo',
      'calculate', 'compute', 'solve', 'what is', 'how many',
      'show me', 'get me', 'fetch', 'retrieve',
      'build', 'create', 'make', 'deploy', 'website', 'app', 'page',
      'landing page', 'web', 'html', 'css', 'javascript',
      'execute', 'run', 'code', 'script', 'program',
      'github', 'repo', 'repository', 'clone', 'push', 'commit', 'pull request'
    ];
    
    const messageLower = message.toLowerCase();
    return toolKeywords.some(keyword => messageLower.includes(keyword));
  }

  async *executeTask(
    userMessage: string,
    env: any,
    conversationHistory: Array<{role: string, content: string}> = []
  ): AsyncGenerator<AgentMessage> {
    yield {
      type: 'status',
      content: '🤖 Starting task execution...',
    };

    executionLogger.startExecution(userMessage);

    if (requiresTaskPlan(userMessage)) {
      const plan = await generateTaskPlan(userMessage, env.OPENAI_API_KEY);
      if (plan) {
        taskTracker.createPlan(plan.goal, plan.steps);
        yield {
          type: 'status',
          content: `📋 Created task plan with ${plan.steps.length} steps`,
        };
      }
    }

    this.conversationHistory = [
      ...conversationHistory.slice(0, -1),
      {
        role: 'system',
        content: MORGUS_KERNEL + `

You have access to a suite of tools for web browsing, code execution, image generation, and more. You also have a Skills Library with 29 specialized capabilities you can invoke.` + skillsManager.generateSkillContext(userMessage),
      },
      {
        role: 'user',
        content: userMessage,
      },
    ];

    let iteration = 0;
    let taskComplete = false;

    while (iteration < this.config.maxIterations && !taskComplete) {
      iteration++;

      yield {
        type: 'status',
        content: `💭 Thinking (iteration ${iteration}/${this.config.maxIterations})...`,
      };

      try {
        let message: any;
        
        if (this.detectToolNeed(userMessage)) {
          message = await callGemini(this.conversationHistory, this.config.temperature, this.config.model, this.toolRegistry.getToolSchemas(), env.OPENAI_API_KEY);
        } else {
          message = await callGemini(this.conversationHistory, this.config.temperature, this.config.model, [], env.OPENAI_API_KEY);
        }

        this.conversationHistory.push(message);

        if (message.content) {
          yield {
            type: 'thought',
            content: message.content,
          };
        }

        if (message.tool_calls) {
          for (const toolCall of message.tool_calls) {
            yield {
              type: 'tool_call',
              content: `🔧 Using tool: ${toolCall.function.name}`,
              metadata: toolCall,
            };

            executionLogger.logToolCall(toolCall.function.name, toolCall.function.arguments);

            try {
              const toolResult = await this.toolRegistry.callTool(toolCall.function.name, JSON.parse(toolCall.function.arguments), env);
              const formattedResult = formatToolResult(toolCall.function.name, toolResult);

              this.conversationHistory.push({
                role: 'tool',
                name: toolCall.function.name,
                content: formattedResult,
              });

              yield {
                type: 'tool_result',
                content: `📋 Tool Output:\n${formattedResult}`,
                metadata: toolResult,
              };

            } catch (error: any) {
              const formattedError = formatErrorForContext(error);
              this.conversationHistory.push({
                role: 'tool',
                name: toolCall.function.name,
                content: formattedError,
              });

              yield {
                type: 'error',
                content: `❌ Tool Error: ${error.message}`,
              };
            }
          }
        } else {
          let finalResponse = message.content;

          // Fact-check the final response
          const factCheckResult = await factChecker.check(finalResponse, env.OPENAI_API_KEY);
          if (factCheckResult.requiresVerification) {
            finalResponse += `\n\n---_n**Fact Check:** This response contains claims that may require verification._`;
          }

          yield {
            type: 'response',
            content: finalResponse,
          };
          taskComplete = true;
        }

      } catch (error: any) {
        yield {
          type: 'error',
          content: `An unexpected error occurred: ${error.message}`,
        };
        taskComplete = true;
      }
    }

    if (!taskComplete) {
      yield {
        type: 'complete',
        content: 'Task finished due to reaching max iterations.',
      };
    }

    // Log execution completion and suggest new skills
    const suggestions = executionLogger.finishExecution();
    if (suggestions.length > 0) {
      // In a real system, these suggestions would be stored for review
      console.log('Skill suggestions:', suggestions);
    }
  }
}
