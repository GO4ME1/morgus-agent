/**
 * Agent orchestrator for autonomous task execution
 */

import { ToolRegistry } from './tools';
import { callGemini } from './gemini';

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
   * Detect if a query likely needs tool use
   */
  private detectToolNeed(message: string): boolean {
    const toolKeywords = [
      'search', 'find', 'look up', 'image', 'picture', 'photo',
      'calculate', 'compute', 'solve', 'what is', 'how many',
      'show me', 'get me', 'fetch', 'retrieve'
    ];
    
    const messageLower = message.toLowerCase();
    return toolKeywords.some(keyword => messageLower.includes(keyword));
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
        content: `You are Morgus, an autonomous AI agent that provides comprehensive, detailed, and helpful responses.

You have access to tools that allow you to:
- Search the web for current information
- Fetch content from URLs
- Execute Python or JavaScript code
- Search for relevant images using Pexels
- Think through problems step by step

**IMPORTANT - FILE HANDLING:**
If the user attaches files (you'll see "**Attached Files:**" with data URLs), you CANNOT currently read file contents.
- For images: You cannot see image content
- For PDFs: You cannot read PDF text
- For other files: You cannot access file data

**WHEN FILES ARE ATTACHED:**
- DO NOT hallucinate or make up content
- DO NOT pretend you can read the files
- Instead, respond honestly: "I'm currently unable to read attached files. I can only process text messages. Please copy and paste the text content, or describe what you need help with."
- Be apologetic and helpful about the limitation

When given a task:
1. First, think about what information or actions you need
2. Use tools to gather information or execute actions
3. Reason through the results
4. Provide a COMPREHENSIVE, DETAILED response with:
   - Complete explanations, not just brief summaries
   - Multiple paragraphs with depth and context
   - Specific examples and details
   - Background information when relevant
   - Step-by-step breakdowns for complex topics

Always use tools when you need current information or need to perform actions. Don't just say you'll do something - actually do it using the available tools.

**RESPONSE LENGTH:** Aim for substantial, information-rich responses (300-500+ words for most queries). Don't be brief unless the question is extremely simple.

**RESPONSE FORMATTING RULES:**
1. **START WITH THE ANSWER IN BOLD** - Put the main answer at the very top in bold with emojis
2. **Use neon/retro style** - Add emojis like 🎯, ✨, 🚀, 💡, 🔥
3. **Break up text** - Use **bold** for key points, bullet points, and short paragraphs
4. **ALWAYS ADD SOURCE HYPERLINKS** - Every fact, price, statistic, or claim MUST include a clickable source link
   - **For PRICES**: Link to the STORE PRODUCT PAGE where users can BUY, not articles
     - Example: "$2.59 at [Save A Lot](https://www.savealot.com/products/milk)" 
     - Example: "$4.99 at [Walmart](https://www.walmart.com/browse/food/milk/976759_976782_1001340)"
     - Use search_web tool to find actual product pages
   - **For FACTS**: Link to authoritative sources like NASA, Wikipedia, government sites
     - Example: "According to [NASA](https://www.nasa.gov), the moon is 238,855 miles away"
     - Example: "[Wikipedia](https://en.wikipedia.org/wiki/Bolivia) states that La Paz is the capital"
5. **Make ALL store names, websites, and URLs clickable** using markdown links: [text](url)
6. **ALWAYS ADD 3 IMAGES AT THE TOP** - Use search_images tool for EVERY response
   - Call search_images with a relevant query based on the topic
   - The tool returns markdown images like: ![alt](url) ![alt](url) ![alt](url)
   - Copy the EXACT markdown from the tool result and paste it at the TOP of your response
   - DO NOT modify, escape, or wrap the images - just paste them directly
   - Place the images at the VERY BEGINNING of your response, before any text
   - Example: For "What is the capital of France?", search for "paris france eiffel tower"
   - Example: For "How to code in Python?", search for "python programming code"
7. **Make it visual** - Every response should START with the images from search_images

Example format:
🎯 **THE ANSWER: 4** 🎯

**Why?** Because 2 + 2 = 4

**How it works:**
• Addition combines two numbers
• 2 apples + 2 apples = 4 apples

**Visual representation:** [image would go here]

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
        let message: any;
        
        // MoE (Mixture of Experts) routing: Intelligent model selection
        // Analyze the user message to determine if tools are likely needed
        const lastUserMessage = this.conversationHistory[this.conversationHistory.length - 1]?.content || '';
        const needsTools = this.detectToolNeed(lastUserMessage);
        
        // Use Gemini for simple queries, OpenAI when tools are needed
        const useGemini = !needsTools && this.config.model?.startsWith('gemini');
        
        if (useGemini) {
          // Use Gemini for this request
          const systemPrompt = this.conversationHistory.find(m => m.role === 'system')?.content || '';
          const messages = this.conversationHistory.filter(m => m.role !== 'system' && m.role !== 'tool');
          
          const geminiResponse = await callGemini(
            env.GEMINI_API_KEY,
            this.config.model || 'gemini-2.0-flash-exp',
            messages,
            systemPrompt
          );
          
          message = {
            role: 'assistant',
            content: geminiResponse,
          };
          
          // Gemini doesn't support tools, so complete after first response
          taskComplete = true;
        } else {
          // Use OpenAI with tool support
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
          message = data.choices[0].message;
        }

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
          // Smart completion detection:
          // 1. If response is substantial (>100 chars) AND no tool calls, likely complete
          // 2. If response contains completion indicators, definitely complete
          const completionIndicators = [
            'here is',
            'here are',
            'the answer is',
            'i found',
            'according to',
            'based on',
            'if you have any',
            'feel free to ask',
            'let me know',
          ];

          const hasCompletionIndicator = completionIndicators.some(indicator => contentLower.includes(indicator));
          const isSubstantialResponse = message.content.length > 100;
          const hasNoToolCalls = !message.tool_calls || message.tool_calls.length === 0;

          // Complete if: substantial response with no tool calls, OR has completion indicator
          if ((isSubstantialResponse && hasNoToolCalls) || hasCompletionIndicator) {
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
