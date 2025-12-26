/**
 * Morgus Prime - The Executive Orchestrator
 * 
 * This is the brain of Morgus. It:
 * 1. Understands the user's goal
 * 2. Decomposes complex tasks into subtasks
 * 3. Routes each subtask to the best Morgy via MOE
 * 4. Manages execution and reflection
 * 5. Learns from outcomes
 * 
 * Morgus Prime does NOT execute tools directly.
 * It THINKS, PLANS, ROUTES, and REFLECTS.
 */

import { getMorgyById, getMorgyForTask, MORGYS } from './morgys';
import { executeDPPM, executeAndReflect, type DPPMConfig, type DPPMResult } from './planner/dppm';
import type { SupabaseClient } from './planner/types';

// ============================================================================
// TYPES
// ============================================================================

export interface MorgusPrimeConfig {
  userId: string;
  supabase: SupabaseClient;
  env: any;
  conversationId?: string;
}

export interface RoutingDecision {
  goal: string;
  isComplex: boolean;
  selectedMorgy: string | null;
  candidateMorgys: string[];
  selectionRationale: string;
  confidence: number;
  fallback: string[];
  requiresDecomposition: boolean;
}

export interface WorldState {
  goals: string[];
  currentGoal: string | null;
  progress: ProgressItem[];
  failures: FailureItem[];
  context: Record<string, any>;
  morgysUsed: string[];
  startTime: number;
}

export interface ProgressItem {
  step: string;
  morgy: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  result?: string;
  timestamp: number;
}

export interface FailureItem {
  step: string;
  morgy: string;
  error: string;
  recoveryAction: string;
  timestamp: number;
}

export interface PrimeResponse {
  type: 'simple' | 'complex' | 'routed';
  routing: RoutingDecision;
  worldState: WorldState;
  dppmResult?: DPPMResult;
  response?: string;
}

// ============================================================================
// MORGUS PRIME CLASS
// ============================================================================

export class MorgusPrime {
  private config: MorgusPrimeConfig;
  private worldState: WorldState;
  private llmCall: (prompt: string, morgy?: string) => Promise<string>;

  constructor(config: MorgusPrimeConfig) {
    this.config = config;
    this.worldState = this.initWorldState();
    this.llmCall = this.createLLMCaller();
  }

  /**
   * Initialize the world state
   */
  private initWorldState(): WorldState {
    return {
      goals: [],
      currentGoal: null,
      progress: [],
      failures: [],
      context: {},
      morgysUsed: [],
      startTime: Date.now()
    };
  }

  /**
   * Create an LLM caller function
   */
  private createLLMCaller(): (prompt: string, morgy?: string) => Promise<string> {
    return async (prompt: string, morgy?: string) => {
      // This will be connected to the actual LLM call
      // For now, we use the existing infrastructure
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.env.OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: this.getPrimeSystemPrompt(morgy) },
            { role: 'user', content: prompt }
          ],
          temperature: 0.7,
          max_tokens: 2000
        })
      });

      const data = await response.json() as any;
      return data.choices?.[0]?.message?.content || '';
    };
  }

  /**
   * Get the system prompt for Morgus Prime
   */
  private getPrimeSystemPrompt(morgy?: string): string {
    const morgyContext = morgy ? getMorgyById(morgy) : null;
    
    return `You are Morgus Prime, the executive intelligence of the Morgus agent system.

Your role is to:
1. UNDERSTAND - Deeply comprehend what the user wants to achieve
2. DECOMPOSE - Break complex goals into manageable subtasks
3. ROUTE - Select the best Morgy (expert agent) for each subtask
4. ORCHESTRATE - Manage execution flow and handle failures
5. REFLECT - Learn from outcomes and improve future routing

You do NOT execute tools directly. You THINK, PLAN, and ROUTE.

Available Morgys (Expert Agents):
${Object.values(MORGYS).map(m => `- ${m.name} (@${m.id}): ${m.specialty} - ${m.personality}`).join('\n')}

${morgyContext ? `
Currently routing to: ${morgyContext.name}
Specialty: ${morgyContext.specialty}
` : ''}

When analyzing a task:
1. Determine if it's simple (single Morgy) or complex (needs decomposition)
2. Identify which Morgy(s) are best suited
3. Explain your routing rationale
4. Assign confidence scores

Always be transparent about your reasoning.`;
  }

  /**
   * Main entry point - process a user message
   */
  async process(userMessage: string): Promise<PrimeResponse> {
    console.log('[MorgusPrime] Processing message:', userMessage.substring(0, 100));

    // Step 1: Analyze and route
    const routing = await this.analyzeAndRoute(userMessage);
    console.log('[MorgusPrime] Routing decision:', routing);

    // Update world state
    this.worldState.currentGoal = routing.goal;
    this.worldState.goals.push(routing.goal);

    // Step 2: Handle based on complexity
    if (routing.isComplex && routing.requiresDecomposition) {
      // Complex task - use full DPPM orchestration
      return await this.handleComplexTask(userMessage, routing);
    } else if (routing.selectedMorgy) {
      // Simple task - route to single Morgy
      return await this.handleSimpleTask(userMessage, routing);
    } else {
      // Direct response (conversational)
      return await this.handleDirectResponse(userMessage, routing);
    }
  }

  /**
   * Analyze the user message and decide routing
   */
  private async analyzeAndRoute(userMessage: string): Promise<RoutingDecision> {
    const analysisPrompt = `Analyze this user request and decide how to route it:

USER REQUEST: "${userMessage}"

Respond in JSON format:
{
  "goal": "The user's actual goal in one sentence",
  "isComplex": true/false (needs multiple steps or Morgys?),
  "requiresDecomposition": true/false (needs DPPM orchestration?),
  "candidateMorgys": ["morgy_id_1", "morgy_id_2"],
  "selectedMorgy": "best_morgy_id" or null if conversational,
  "selectionRationale": "Why this Morgy is best for this task",
  "confidence": 0.0-1.0,
  "fallback": ["alternative_morgy_ids"]
}

Available Morgy IDs: ${Object.keys(MORGYS).join(', ')}

Consider:
- billthemarketinghog: Marketing, copywriting, social media, ads
- sallythepromo: Promotions, campaigns, launches, engagement
- profhogsworth: Research, analysis, deep thinking, academic work

If the request is just conversation (hi, thanks, etc.), set selectedMorgy to null.`;

    const response = await this.llmCall(analysisPrompt);
    
    try {
      // Extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          goal: parsed.goal || userMessage,
          isComplex: parsed.isComplex || false,
          selectedMorgy: parsed.selectedMorgy || null,
          candidateMorgys: parsed.candidateMorgys || [],
          selectionRationale: parsed.selectionRationale || 'Default routing',
          confidence: parsed.confidence || 0.5,
          fallback: parsed.fallback || [],
          requiresDecomposition: parsed.requiresDecomposition || false
        };
      }
    } catch (e) {
      console.error('[MorgusPrime] Failed to parse routing decision:', e);
    }

    // Default routing
    return {
      goal: userMessage,
      isComplex: false,
      selectedMorgy: null,
      candidateMorgys: [],
      selectionRationale: 'Could not parse routing, using default',
      confidence: 0.3,
      fallback: [],
      requiresDecomposition: false
    };
  }

  /**
   * Handle complex tasks using DPPM orchestration
   */
  private async handleComplexTask(userMessage: string, routing: RoutingDecision): Promise<PrimeResponse> {
    console.log('[MorgusPrime] Handling complex task with DPPM');

    const dppmConfig: DPPMConfig = {
      userId: this.config.userId,
      supabase: this.config.supabase,
      llmCall: this.llmCall,
      maxSubtasks: 7,
      minSubtasks: 3,
      skipPreFlight: false,
      skipPostReflection: false
    };

    try {
      const dppmResult = await executeDPPM(routing.goal, dppmConfig);
      
      // Update world state with decomposed tasks
      for (const subtask of dppmResult.decomposed.subtasks) {
        this.worldState.progress.push({
          step: subtask.description,
          morgy: subtask.morgy || 'prime',
          status: 'pending',
          timestamp: Date.now()
        });
      }

      return {
        type: 'complex',
        routing,
        worldState: this.worldState,
        dppmResult
      };
    } catch (error) {
      console.error('[MorgusPrime] DPPM execution failed:', error);
      
      // Fallback to simple routing
      return await this.handleSimpleTask(userMessage, routing);
    }
  }

  /**
   * Handle simple tasks by routing to a single Morgy
   */
  private async handleSimpleTask(userMessage: string, routing: RoutingDecision): Promise<PrimeResponse> {
    console.log('[MorgusPrime] Routing to Morgy:', routing.selectedMorgy);

    // Track Morgy usage
    if (routing.selectedMorgy) {
      this.worldState.morgysUsed.push(routing.selectedMorgy);
    }

    // Update progress
    this.worldState.progress.push({
      step: routing.goal,
      morgy: routing.selectedMorgy || 'prime',
      status: 'in_progress',
      timestamp: Date.now()
    });

    return {
      type: 'routed',
      routing,
      worldState: this.worldState
    };
  }

  /**
   * Handle direct conversational responses
   */
  private async handleDirectResponse(userMessage: string, routing: RoutingDecision): Promise<PrimeResponse> {
    console.log('[MorgusPrime] Direct response (conversational)');

    const response = await this.llmCall(userMessage);

    return {
      type: 'simple',
      routing,
      worldState: this.worldState,
      response
    };
  }

  /**
   * Reflect on a completed task
   */
  async reflect(taskResult: any): Promise<void> {
    console.log('[MorgusPrime] Reflecting on task result');

    // Update progress status
    const lastProgress = this.worldState.progress[this.worldState.progress.length - 1];
    if (lastProgress) {
      lastProgress.status = taskResult.success ? 'completed' : 'failed';
      lastProgress.result = taskResult.result;
    }

    // If failed, record failure
    if (!taskResult.success) {
      this.worldState.failures.push({
        step: lastProgress?.step || 'unknown',
        morgy: lastProgress?.morgy || 'unknown',
        error: taskResult.error || 'Unknown error',
        recoveryAction: taskResult.recoveryAction || 'Retry with different approach',
        timestamp: Date.now()
      });
    }

    // TODO: Store experience in database for learning
  }

  /**
   * Get current world state
   */
  getWorldState(): WorldState {
    return this.worldState;
  }

  /**
   * Get routing explanation for transparency
   */
  getRoutingExplanation(routing: RoutingDecision): string {
    return `
**🧠 Morgus Prime Routing Decision**

**Goal:** ${routing.goal}
**Complexity:** ${routing.isComplex ? 'Complex (multi-step)' : 'Simple (single-step)'}
**Selected Morgy:** ${routing.selectedMorgy ? `@${routing.selectedMorgy}` : 'Direct response'}
**Confidence:** ${(routing.confidence * 100).toFixed(0)}%

**Rationale:** ${routing.selectionRationale}

${routing.candidateMorgys.length > 1 ? `**Candidates considered:** ${routing.candidateMorgys.join(', ')}` : ''}
${routing.fallback.length > 0 ? `**Fallback options:** ${routing.fallback.join(', ')}` : ''}
`.trim();
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Detect if a task is complex enough to need DPPM
 */
export function isComplexTask(message: string): boolean {
  const complexIndicators = [
    // Multi-step tasks
    'build', 'create', 'develop', 'design', 'implement',
    'research and', 'analyze and', 'compare and',
    // Explicit multi-part
    'first', 'then', 'after that', 'finally',
    'step 1', 'step 2', 'multiple',
    // Large scope
    'entire', 'complete', 'full', 'comprehensive',
    'website', 'app', 'application', 'system',
    // Planning
    'plan', 'strategy', 'roadmap', 'campaign'
  ];

  const messageLower = message.toLowerCase();
  const matchCount = complexIndicators.filter(ind => messageLower.includes(ind)).length;
  
  // Complex if 2+ indicators or message is long
  return matchCount >= 2 || message.length > 500;
}

/**
 * Create a Morgus Prime instance
 */
export function createMorgusPrime(config: MorgusPrimeConfig): MorgusPrime {
  return new MorgusPrime(config);
}

// ============================================================================
// EXPORTS
// ============================================================================

export default MorgusPrime;
