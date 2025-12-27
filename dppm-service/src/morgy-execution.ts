import type { Morgy, MorgyMessage } from './types/morgy';
import { KnowledgeBaseService } from './knowledge-base-service';

export interface ExecutionConfig {
  gemini_api_key: string;
  openai_api_key?: string;
  openrouter_api_key?: string;
  anthropic_api_key?: string;
}

export type ExecutionMode = 'fast' | 'quality' | 'agent' | 'dppm' | 'auto';

export interface ExecutionResult {
  response: string;
  mode: ExecutionMode;
  model: string;
  latency: number;
  cost: number;
  metadata?: any;
}

/**
 * Morgy Execution Engine
 * Routes Morgy requests to appropriate execution mode based on task complexity
 */
export class MorgyExecutionEngine {
  
  private knowledgeBaseService?: KnowledgeBaseService;

  /**
   * Set knowledge base service for RAG
   */
  setKnowledgeBaseService(service: KnowledgeBaseService) {
    this.knowledgeBaseService = service;
  }

  /**
   * Main execution entry point
   */
  async execute(
    morgy: Morgy,
    userMessage: string,
    history: MorgyMessage[],
    config: ExecutionConfig,
    requestedMode?: ExecutionMode
  ): Promise<ExecutionResult> {
    
    const startTime = Date.now();
    
    // Determine execution mode
    const mode = requestedMode || 
                 (morgy.skills_config as any)?.execution_mode || 
                 'auto';
    
    let actualMode: ExecutionMode;
    
    if (mode === 'auto') {
      // Smart routing based on task type
      actualMode = this.detectExecutionMode(userMessage);
    } else {
      actualMode = mode;
    }
    
    console.log(`[Morgy ${morgy.name}] Executing in ${actualMode} mode`);
    
    // Execute based on mode
    let response: string;
    let model: string;
    let cost: number;
    
    switch (actualMode) {
      case 'fast':
        const fastResult = await this.executeFast(morgy, userMessage, history, config);
        response = fastResult.response;
        model = fastResult.model;
        cost = fastResult.cost;
        break;
        
      case 'quality':
        const qualityResult = await this.executeQuality(morgy, userMessage, history, config);
        response = qualityResult.response;
        model = qualityResult.model;
        cost = qualityResult.cost;
        break;
        
      case 'agent':
        const agentResult = await this.executeAgent(morgy, userMessage, history, config);
        response = agentResult.response;
        model = agentResult.model;
        cost = agentResult.cost;
        break;
        
      case 'dppm':
        const dppmResult = await this.executeDPPM(morgy, userMessage, history, config);
        response = dppmResult.response;
        model = dppmResult.model;
        cost = dppmResult.cost;
        break;
        
      default:
        const defaultResult = await this.executeFast(morgy, userMessage, history, config);
        response = defaultResult.response;
        model = defaultResult.model;
        cost = defaultResult.cost;
    }
    
    const latency = Date.now() - startTime;
    
    return {
      response,
      mode: actualMode,
      model,
      latency,
      cost
    };
  }
  
  /**
   * Detect appropriate execution mode based on task complexity
   */
  private detectExecutionMode(message: string): ExecutionMode {
    const lower = message.toLowerCase();
    
    // Tool-required keywords
    const toolKeywords = [
      'search', 'find', 'look up', 'google',
      'calculate', 'compute', 'solve',
      'code', 'script', 'program', 'execute',
      'github', 'repo', 'deploy'
    ];
    
    if (toolKeywords.some(kw => lower.includes(kw))) {
      return 'agent';
    }
    
    // Complex task keywords
    const complexKeywords = [
      'create a plan', 'analyze', 'research',
      'comprehensive', 'detailed analysis',
      'step by step', 'break down'
    ];
    
    if (complexKeywords.some(kw => lower.includes(kw)) || message.length > 1000) {
      return 'dppm';
    }
    
    // Quality keywords
    const qualityKeywords = [
      'best answer', 'important', 'critical',
      'give me your best', 'high quality'
    ];
    
    if (qualityKeywords.some(kw => lower.includes(kw))) {
      return 'quality';
    }
    
    // Default: fast
    return 'fast';
  }
  
  /**
   * FAST MODE: Single fast model (Gemini 2.0 Flash)
   * Cost: $0 (free)
   * Latency: 1-2s
   */
  private async executeFast(
    morgy: Morgy,
    userMessage: string,
    history: MorgyMessage[],
    config: ExecutionConfig
  ): Promise<{ response: string; model: string; cost: number }> {
    
    // Search knowledge base for relevant context
    let knowledgeContext = '';
    if (this.knowledgeBaseService) {
      try {
        const relevantKnowledge = await this.knowledgeBaseService.searchKnowledge(
          morgy.id,
          userMessage,
          3 // Top 3 most relevant pieces
        );
        
        if (relevantKnowledge.length > 0) {
          knowledgeContext = `\n\nRELEVANT KNOWLEDGE:\n${relevantKnowledge.map(k => 
            `[${k.source}] ${k.content.substring(0, 500)}...`
          ).join('\n\n')}`;
        }
      } catch (error) {
        console.error('Knowledge search failed:', error);
        // Continue without knowledge context
      }
    }
    
    // Build conversation with Morgy's personality and knowledge
    const systemPrompt = morgy.system_prompt + knowledgeContext;
    const conversationText = history.map(m => 
      `${m.role}: ${m.content}`
    ).join('\n');
    
    const fullPrompt = `${systemPrompt}\n\nConversation:\n${conversationText}\n\nuser: ${userMessage}\nassistant:`;
    
    try {
      // Try Gemini 2.0 Flash first (free, fast)
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${config.gemini_api_key}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: fullPrompt }] }],
            generationConfig: { 
              temperature: 0.7, 
              maxOutputTokens: 2048 
            }
          })
        }
      );
      
      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (text) {
        return {
          response: text,
          model: 'gemini-2.0-flash',
          cost: 0
        };
      }
    } catch (error) {
      console.error('Gemini failed, falling back to GPT-4o-mini:', error);
    }
    
    // Fallback to GPT-4o-mini
    if (config.openai_api_key) {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.openai_api_key}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: systemPrompt },
            ...history.map(m => ({ role: m.role, content: m.content })),
            { role: 'user', content: userMessage }
          ],
          temperature: 0.7,
          max_tokens: 2048
        })
      });
      
      const data = await response.json();
      return {
        response: data.choices?.[0]?.message?.content || 'Sorry, I had trouble responding.',
        model: 'gpt-4o-mini',
        cost: 0.0001 // Approximate
      };
    }
    
    throw new Error('No API keys available for execution');
  }
  
  /**
   * QUALITY MODE: MOE system (6 models compete)
   * Cost: ~$0.0005
   * Latency: 2-5s
   */
  private async executeQuality(
    morgy: Morgy,
    userMessage: string,
    history: MorgyMessage[],
    config: ExecutionConfig
  ): Promise<{ response: string; model: string; cost: number }> {
    
    // For now, use fast mode as placeholder
    // TODO: Integrate with MOE system from worker/src/moe/
    console.log('[Morgy] Quality mode requested, using fast mode as fallback');
    return this.executeFast(morgy, userMessage, history, config);
  }
  
  /**
   * AGENT MODE: Agent with tools
   * Cost: ~$0.001-0.01
   * Latency: 5-30s
   */
  private async executeAgent(
    morgy: Morgy,
    userMessage: string,
    history: MorgyMessage[],
    config: ExecutionConfig
  ): Promise<{ response: string; model: string; cost: number }> {
    
    // For now, use fast mode as placeholder
    // TODO: Integrate with agent system from worker/src/agent.ts
    console.log('[Morgy] Agent mode requested, using fast mode as fallback');
    return this.executeFast(morgy, userMessage, history, config);
  }
  
  /**
   * DPPM MODE: Deep parallel processing
   * Cost: ~$0.01-0.05
   * Latency: 30-60s
   */
  private async executeDPPM(
    morgy: Morgy,
    userMessage: string,
    history: MorgyMessage[],
    config: ExecutionConfig
  ): Promise<{ response: string; model: string; cost: number }> {
    
    // For now, use fast mode as placeholder
    // TODO: Integrate with DPPM system
    console.log('[Morgy] DPPM mode requested, using fast mode as fallback');
    return this.executeFast(morgy, userMessage, history, config);
  }
}

/**
 * Convenience function for simple execution
 */
export async function executeMorgy(
  morgy: Morgy,
  userMessage: string,
  history: MorgyMessage[],
  config: ExecutionConfig
): Promise<string> {
  const engine = new MorgyExecutionEngine();
  const result = await engine.execute(morgy, userMessage, history, config);
  return result.response;
}
