/**
 * Agent orchestrator for autonomous task execution
 */

import { ToolRegistry } from './tools';

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
      maxIterations: config.maxIterations || 10, // Allow full task completion
      temperature: config.temperature || 0.7,
      model: config.model || 'gpt-4o-mini', // Switched from gpt-4-turbo-preview to save 95% on costs
    };
  }

  /**
   * Execute a task with streaming updates
   */
  async *executeTask(
    userMessage: string,
    env: any,
    conversationHistory: Array<{role: string, content: string}> = []
  ): AsyncGenerator<AgentMessage> {
    yield {
      type: 'status',
      content: '🤖 Starting task execution...',
    };

    // Build conversation with history
    this.conversationHistory = [
      ...conversationHistory.slice(0, -1), // Include previous messages (except the last user message which we'll add with system prompt)
      {
        role: 'system',
        content: `You are Morgus, an autonomous AI agent that helps users accomplish tasks.

You have access to tools that allow you to:
- Search the web for current information
- Fetch content from URLs
- Execute Python or JavaScript code
- Think through problems step by step

When given a task:
1. First, think about what information or actions you need
2. Use tools to gather information or execute actions
3. Reason through the results
4. Provide a clear, helpful response to the user

Always use tools when you need current information or need to perform actions. Don't just say you'll do something - actually do it using the available tools.

Be conversational and helpful. Show your work and explain what you're doing.`,
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
        // Call OpenAI with tool support
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${env.OPENAI_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: this.config.model,
            messages: this.conversationHistory,
            tools: this.toolRegistry.getSchemas(),
            tool_choice: 'auto',
            temperature: this.config.temperature,
          }),
        });

        if (!response.ok) {
          const error = await response.text();
          throw new Error(`OpenAI API error: ${response.status} - ${error}`);
        }

        const data = await response.json();
        const message = data.choices[0].message;

        // Add assistant message to history
        this.conversationHistory.push(message);

        // Check if there are tool calls
        if (message.tool_calls && message.tool_calls.length > 0) {
          // Execute each tool call
          for (const toolCall of message.tool_calls) {
            const toolName = toolCall.function.name;
            const toolArgs = JSON.parse(toolCall.function.arguments);

            yield {
              type: 'tool_call',
              content: `🔧 Using tool: ${toolName}`,
              metadata: { name: toolName, args: toolArgs },
            };

            // Execute tool
            const result = await this.toolRegistry.execute(toolName, toolArgs, env);

            yield {
              type: 'tool_result',
              content: `✅ Tool result: ${result.substring(0, 200)}${result.length > 200 ? '...' : ''}`,
              metadata: { name: toolName, result },
            };

            // Add tool result to conversation
            this.conversationHistory.push({
              role: 'tool',
              tool_call_id: toolCall.id,
              name: toolName,
              content: result,
            });
          }

          // Continue loop to get next response
          continue;
        }

        // No tool calls - check if we have a response
        if (message.content) {
          yield {
            type: 'response',
            content: message.content,
          };

          // Check if task seems complete
          const contentLower = message.content.toLowerCase();
          const completionIndicators = [
            'here is',
            'here are',
            'the answer is',
            'i found',
            'according to',
            'based on',
          ];

          if (completionIndicators.some(indicator => contentLower.includes(indicator))) {
            taskComplete = true;
          }
        }

        // If no tool calls and no content, something went wrong
        if (!message.content && (!message.tool_calls || message.tool_calls.length === 0)) {
          yield {
            type: 'error',
            content: 'No response from AI',
          };
          break;
        }

      } catch (error: any) {
        yield {
          type: 'error',
          content: `Error: ${error.message}`,
        };
        break;
      }
    }

    if (iteration >= this.config.maxIterations) {
      yield {
        type: 'status',
        content: '⚠️ Reached maximum iterations',
      };
    }

    yield {
      type: 'complete',
      content: '✅ Task execution complete',
    };
  }

  /**
   * Simple chat without tool execution (for basic queries)
   */
  async chat(userMessage: string, env: any): Promise<string> {
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini', // Cost-optimized model
          messages: [
            {
              role: 'system',
              content: 'You are Morgus, a helpful AI assistant. Be conversational and helpful.',
            },
            {
              role: 'user',
              content: userMessage,
            },
          ],
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.choices[0].message.content;
    } catch (error: any) {
      return `Error: ${error.message}`;
    }
  }
}
