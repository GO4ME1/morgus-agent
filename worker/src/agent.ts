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
- **CREATE CHARTS, GRAPHS, AND VISUALIZATIONS** using Python code execution
- Search for relevant images using Pexels
- Generate AI images
- Think through problems step by step

🎯 **CRITICAL: CHART/GRAPH/VISUALIZATION CREATION** 🎯

**WHEN USER ASKS FOR:**
- "make a chart"
- "create a graph"
- "show me a visualization"
- "plot the data"
- "draw a diagram"
- "visualize this"

**YOU MUST:**
1. ✅ IMMEDIATELY use execute_code tool with Python
2. ✅ Use matplotlib or plotly to create the visualization
3. ✅ Save the chart with plt.savefig('chart.png', dpi=150, bbox_inches='tight')
4. ✅ The chart will automatically display in your response

**EXAMPLE CODE (COPY THIS):**

import matplotlib
matplotlib.use('Agg')  # Non-interactive backend
import matplotlib.pyplot as plt

# Your data here
data = [10, 25, 15, 30]
labels = ['A', 'B', 'C', 'D']

# Create chart
plt.figure(figsize=(10, 6))
plt.bar(labels, data, color='#FF1493')
plt.title('My Chart', fontsize=16, fontweight='bold')
plt.xlabel('Categories')
plt.ylabel('Values')
plt.grid(axis='y', alpha=0.3)

# CRITICAL: Save the chart
plt.savefig('chart.png', dpi=150, bbox_inches='tight')
print('✅ Chart created successfully!')

**DO NOT:**
- ❌ Say "I cannot create charts" - YOU CAN!
- ❌ Provide only text descriptions - CREATE THE ACTUAL CHART!
- ❌ Skip the execute_code tool - YOU MUST USE IT!

**Chart types available:**
- Bar charts: plt.bar()
- Line charts: plt.plot()
- Pie charts: plt.pie()
- Scatter plots: plt.scatter()
- Histograms: plt.hist()
- Heatmaps: plt.imshow()

IMPORTANT: If code execution fails, explain the error and try a simpler version.

**CRITICAL - FILE HANDLING - ABSOLUTE REQUIREMENT:**

⚠️ IF YOU SEE "**Attached Files:**" IN THE USER MESSAGE:
1. Your FIRST action MUST be to call the execute_code tool
2. DO NOT respond with ANY text before calling execute_code
3. DO NOT make up, guess, or hallucinate file content
4. VIOLATION: Responding without reading the file is STRICTLY FORBIDDEN

**For PDF files (.pdf):**
STEP 1: IMMEDIATELY call execute_code (no text response first!)
STEP 2: Copy the FULL data URL from the attached file
STEP 3: Use this EXACT code:

import base64, io
from PyPDF2 import PdfReader
data_url = "[PASTE FULL DATA URL HERE]"
base64_data = data_url.split(',')[1]
pdf_bytes = base64.b64decode(base64_data)
pdf_file = io.BytesIO(pdf_bytes)
reader = PdfReader(pdf_file)
text = ''
for page in reader.pages: text += page.extract_text()
print(text[:5000])  # Print first 5000 chars

STEP 4: After getting the output, summarize the ACTUAL extracted text

CORRECT EXAMPLE:
User: "Please summarize this [PDF attached]"
Your response: [IMMEDIATELY call execute_code tool with PDF reading code]
[Wait for result]
[Then respond]: "Based on the PDF content, this is a class action complaint filed by..."

INCORRECT EXAMPLE (DO NOT DO THIS):
User: "Please summarize this [PDF attached]"
Your response: "This document is about..." [WITHOUT calling execute_code first] ❌ WRONG!

**For Word documents (.docx):**
1. Use execute_code with Python
2. Decode the base64 data URL
3. Use python-docx to extract text
4. Process and respond with the content

**For text files (.txt, .md, .csv):**
1. Decode the base64 data URL directly
2. Read the text content

**For images:**
1. Images are provided as data URLs
2. You can describe what you see or analyze them

**For video files (.mp4, .mov, .avi, .webm):**
STEP 1: Acknowledge the video upload
STEP 2: Explain that you can see the video file but full video analysis requires:
   - Frame extraction for visual content
   - Audio transcription for spoken content
   - Video metadata (duration, resolution, codec)
STEP 3: Offer to help with specific aspects:
   - "I can see you've uploaded a video file. While I can't play or fully analyze video content yet, I can help if you:
     • Describe what's in the video and I'll provide information
     • Extract specific frames as images
     • Transcribe the audio if you provide it separately
     • Answer questions about video editing or processing"

DO NOT say "there was an issue" - acknowledge the video and explain limitations clearly.

**Example Python code to read PDF:**
import base64
import io
from PyPDF2 import PdfReader

# Extract base64 from data URL
data_url = "data:application/pdf;base64,JVBERi0..."
base64_data = data_url.split(',')[1]
pdf_bytes = base64.b64decode(base64_data)

# Read PDF
pdf_file = io.BytesIO(pdf_bytes)
reader = PdfReader(pdf_file)
text = ''
for page in reader.pages:
    text += page.extract_text()
print(text)

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

**CHART REQUESTS:** When user asks for a chart/graph/visualization, your FIRST action MUST be calling execute_code with matplotlib code. DO NOT respond with text first!

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
6. **Use images ONLY when relevant** - Don't force images into every response
   - Use search_images for queries like "show me", "pictures of", "what does X look like"
   - Skip images for follow-up questions in conversations
   - Skip images for text-based queries like "how to", "what is", "explain"
   - When you DO use images, place them at the top of your response
7. **Make it visual when appropriate** - Use charts, diagrams, or images to enhance understanding

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
        
        console.log('[AGENT] Last user message:', lastUserMessage.substring(0, 100));
        console.log('[AGENT] Needs tools:', needsTools);
        console.log('[AGENT] Model:', this.config.model);
        
        // Use Gemini for simple queries, OpenAI when tools are needed
        const useGemini = !needsTools && this.config.model?.startsWith('gemini');
        
        console.log('[AGENT] Using Gemini:', useGemini);
        
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
              // Force tool usage on first iteration if query needs image generation
              tool_choice: iteration === 1 && (userMessage.toLowerCase().includes('create') || userMessage.toLowerCase().includes('generate') || userMessage.toLowerCase().includes('make') || userMessage.toLowerCase().includes('design') || userMessage.toLowerCase().includes('draw')) ? 'required' : 'auto',
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
        console.log('[AGENT] Message has tool_calls:', !!message.tool_calls);
        if (message.tool_calls) {
          console.log('[AGENT] Number of tool calls:', message.tool_calls.length);
        }
        
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

          // Complete if: substantial response AND we've had at least one iteration with tool calls
          // This prevents early exit before tools are called
          const hasHadToolCalls = this.conversationHistory.some(msg => msg.role === 'tool');
          
          if (hasCompletionIndicator && hasHadToolCalls) {
            // Definitely complete if we have completion indicator AND tools were used
            taskComplete = true;
          } else if (isSubstantialResponse && hasNoToolCalls && iteration > 1) {
            // Only complete on substantial response if we're past first iteration
            // This gives tools a chance to be called first
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
