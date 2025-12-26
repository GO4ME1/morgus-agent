/**
 * MOE Endpoint for Morgus
 * 
 * Integrates MOE into the chat system
 */

import { MOEService, type MOEResponse } from './service';
import type { OpenRouterMessage } from './openrouter';

export interface MOEChatRequest {
  messages: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
  }>;
}

export interface MOEChatResponse {
  content: string; // The winner's response
  moeMetadata: {
    winner: {
      model: string;
      latency: number;
      tokens: number;
      cost: number;
    };
    allModels: Array<{
      model: string;
      latency: number;
      tokens: number;
      cost: number;
      score: number;
    }>;
    tooSlowModels?: string[]; // Models that didn't respond before majority threshold
    nashExplanation: string;
    totalLatency: number;
    totalCost: number;
  };
}

export class MOEEndpoint {
  private moe: MOEService;

  constructor(openrouterApiKey: string) {
    this.moe = new MOEService(openrouterApiKey);
  }

  /**
   * Process chat request through MOE
   */
  async chat(request: MOEChatRequest): Promise<MOEChatResponse> {
    // Convert to OpenRouter format
    const messages: OpenRouterMessage[] = request.messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    // Query MOE
    const result: MOEResponse = await this.moe.query({ messages });

    // Format response with MOE visualization data
    return {
      content: this.formatWinnerResponse(result),
      moeMetadata: {
        winner: {
          model: result.winner.model,
          latency: result.winner.latency,
          tokens: result.winner.tokens.total,
          cost: result.winner.cost,
        },
        allModels: result.allResponses.map((r) => ({
          model: r.model,
          latency: r.latency,
          tokens: r.tokens.total,
          cost: r.cost,
          score: result.nashResult.scores.get(r.model) || 0,
        })),
        nashExplanation: result.nashResult.explanation,
        totalLatency: result.metadata.totalLatency,
        totalCost: result.metadata.totalCost,
      },
    };
  }

  /**
   * Process chat request through MOE with Gemini as third model
   */
  async chatWithGemini(request: MOEChatRequest & { geminiApiKey: string }): Promise<MOEChatResponse> {
    // Convert to OpenRouter format
    const messages: OpenRouterMessage[] = request.messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    // Query OpenRouter models in parallel with Gemini
    const startTime = Date.now();
    
    // Import Gemini helper
    const { queryGeminiForMOE } = await import('../gemini');
    
    // Query OpenRouter models
    const openrouterPromise = this.moe.query({ messages });
    
    // Query Gemini
    const geminiPromise = queryGeminiForMOE(
      request.geminiApiKey,
      'gemini-2.0-flash-exp',
      request.messages,
      request.files // Pass files for vision support
    ).catch((error) => {
      console.error('Gemini query failed:', error);
      return null;
    });
    
    // Wait for all
    const [openrouterResult, geminiResponse, gptResponse, claudeResponse] = await Promise.all([
      openrouterPromise,
      geminiPromise,
      gptPromise,
      claudePromise
    ]);
    
    // Combine responses
    const allResponses = [...openrouterResult.allResponses];
    if (geminiResponse) {
      allResponses.push(geminiResponse);
    }
    if (gptResponse) {
      allResponses.push(gptResponse);
    }
    if (claudeResponse) {
      allResponses.push(claudeResponse);
    }
    
    // Re-run Nash Equilibrium with all 3 models
    const { NashEquilibriumSelector } = await import('./nash');
    const nash = new NashEquilibriumSelector();
    const nashResult = nash.select(allResponses);
    
    const totalLatency = Date.now() - startTime;
    const totalCost = allResponses.reduce((sum, r) => sum + r.cost, 0);
    
    // Format response
    return {
      content: nashResult.winner.content,
      moeMetadata: {
        winner: {
          model: nashResult.winner.model,
          latency: nashResult.winner.latency,
          tokens: nashResult.winner.tokens.total,
          cost: nashResult.winner.cost,
        },
        allModels: allResponses.map((r) => ({
          model: r.model,
          latency: r.latency,
          tokens: r.tokens.total,
          cost: r.cost,
          score: nashResult.scores.get(r.model) || 0,
        })),
        nashExplanation: nashResult.explanation,
        totalLatency,
        totalCost,
      },
    };
  }

  /**
   * Format winner response with MOE context
   */
  private formatWinnerResponse(result: MOEResponse): string {
    // Return only the winner's content - MOE visualization handled by frontend
    return result.winner.content;
  }

  /**
   * Process chat request through MOE with Gemini + GPT-4o-mini + Claude
   * Uses majority-based early exit - returns when 4+ models respond
   */
  async chatWithMultipleAPIs(request: MOEChatRequest & { geminiApiKey: string; openaiApiKey: string; anthropicApiKey?: string; files?: string[] }): Promise<MOEChatResponse> {
    const startTime = Date.now();
    const allModels = ['openrouter-models', 'gemini-2.0-flash-exp', 'gpt-4o-mini', 'claude-3-5-haiku-20241022'];
    const responses: OpenRouterResponse[] = [];
    const tooSlowModels: string[] = [];
    let resolved = false;
    const MAJORITY_THRESHOLD = 4; // Need 4 of 6 models to respond
    
    // Import helpers
    const { queryGeminiForMOE } = await import('../gemini');
    const { queryGPT4oMiniForMOE } = await import('../openai-moe');
    const { queryClaude } = await import('../claude-moe');
    const { NashEquilibriumSelector } = await import('./nash');
    
    console.log(`[MOE] Starting competition with ${allModels.length} model groups, majority threshold: ${MAJORITY_THRESHOLD}`);

    return new Promise(async (resolve) => {
      const checkMajorityAndResolve = () => {
        if (responses.length >= MAJORITY_THRESHOLD && !resolved) {
          resolved = true;
          const totalLatency = Date.now() - startTime;
          
          // Find models that didn't respond in time
          const respondedModels = responses.map(r => r.model);
          // Note: OpenRouter returns multiple models, so we track at response level
          
          console.log(`[MOE] Majority reached! ${responses.length} responses in ${totalLatency}ms`);
          if (tooSlowModels.length > 0) {
            console.log(`[MOE] Too slow models: ${tooSlowModels.join(', ')}`);
          }
          
          // Run Nash Equilibrium with too-slow tracking
          const nash = new NashEquilibriumSelector();
          const nashResult = nash.select(responses, tooSlowModels);
          
          const totalCost = responses.reduce((sum, r) => sum + r.cost, 0);
          
          resolve({
            content: nashResult.winner.content,
            moeMetadata: {
              winner: {
                model: nashResult.winner.model,
                latency: nashResult.winner.latency,
                tokens: nashResult.winner.tokens.total,
                cost: nashResult.winner.cost,
              },
              allModels: responses.map((r) => ({
                model: r.model,
                latency: r.latency,
                tokens: r.tokens.total,
                cost: r.cost,
                score: nashResult.scores.get(r.model) || 0,
              })),
              tooSlowModels: tooSlowModels.length > 0 ? tooSlowModels : undefined,
              nashExplanation: nashResult.explanation,
              totalLatency,
              totalCost,
            },
          });
        }
      };
      
      const addResponse = (response: OpenRouterResponse | null, modelName: string) => {
        if (resolved) {
          if (response) {
            tooSlowModels.push(response.model);
            console.log(`[MOE] ${response.model} responded AFTER majority (too slow: ${Date.now() - startTime}ms)`);
          }
          return;
        }
        
        if (response) {
          responses.push(response);
          console.log(`[MOE] ${response.model} responded in ${response.latency}ms (${responses.length}/${MAJORITY_THRESHOLD} needed)`);
          checkMajorityAndResolve();
        }
      };
      
      const addResponses = (newResponses: OpenRouterResponse[], sourceName: string) => {
        if (resolved) {
          for (const r of newResponses) {
            tooSlowModels.push(r.model);
          }
          console.log(`[MOE] ${sourceName} responded AFTER majority with ${newResponses.length} models (too slow)`);
          return;
        }
        
        for (const response of newResponses) {
          responses.push(response);
          console.log(`[MOE] ${response.model} responded in ${response.latency}ms (${responses.length}/${MAJORITY_THRESHOLD} needed)`);
        }
        checkMajorityAndResolve();
      };
      
      // Convert messages
      const messages: OpenRouterMessage[] = request.messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));
      
      // Fire all queries in parallel (don't await)
      
      // OpenRouter models (returns multiple)
      this.moe.query({ messages })
        .then((result) => addResponses(result.allResponses, 'OpenRouter'))
        .catch((error) => console.error('[MOE] OpenRouter query failed:', error));
      
      // Gemini
      queryGeminiForMOE(
        request.geminiApiKey,
        'gemini-2.0-flash-exp',
        request.messages,
        request.files
      )
        .then((response) => addResponse(response, 'Gemini'))
        .catch((error) => console.error('[MOE] Gemini query failed:', error));
      
      // GPT-4o-mini
      queryGPT4oMiniForMOE(
        request.openaiApiKey,
        request.messages.map((m) => ({ role: m.role, content: m.content }))
      )
        .then((response) => addResponse(response, 'GPT-4o-mini'))
        .catch((error) => console.error('[MOE] GPT-4o-mini query failed:', error));
      
      // Claude (if API key provided)
      if (request.anthropicApiKey) {
        queryClaude(
          request.messages[request.messages.length - 1].content,
          request.anthropicApiKey,
          request.files
        )
          .then((response) => {
            addResponse({
              model: 'claude-3-5-haiku-20241022',
              content: response.content,
              tokens: { prompt: 0, completion: response.tokens, total: response.tokens },
              latency: response.latency,
              cost: (response.tokens / 1000000) * 1.5,
              timestamp: Date.now(),
            }, 'Claude');
          })
          .catch((error) => console.error('[MOE] Claude query failed:', error));
      }
      
      // Safety timeout: if we don't have majority in 25 seconds, return what we have
      setTimeout(() => {
        if (!resolved) {
          resolved = true;
          console.log(`[MOE] Timeout! Returning ${responses.length} responses`);
          
          if (responses.length === 0) {
            resolve({
              content: 'I apologize, but all models timed out. Please try again.',
              moeMetadata: {
                winner: { model: 'none', latency: 25000, tokens: 0, cost: 0 },
                allModels: [],
                tooSlowModels: allModels,
                nashExplanation: 'All models timed out',
                totalLatency: 25000,
                totalCost: 0,
              },
            });
            return;
          }
          
          const nash = new NashEquilibriumSelector();
          const nashResult = nash.select(responses, tooSlowModels);
          const totalLatency = Date.now() - startTime;
          const totalCost = responses.reduce((sum, r) => sum + r.cost, 0);
          
          resolve({
            content: nashResult.winner.content,
            moeMetadata: {
              winner: {
                model: nashResult.winner.model,
                latency: nashResult.winner.latency,
                tokens: nashResult.winner.tokens.total,
                cost: nashResult.winner.cost,
              },
              allModels: responses.map((r) => ({
                model: r.model,
                latency: r.latency,
                tokens: r.tokens.total,
                cost: r.cost,
                score: nashResult.scores.get(r.model) || 0,
              })),
              tooSlowModels: tooSlowModels.length > 0 ? tooSlowModels : undefined,
              nashExplanation: nashResult.explanation,
              totalLatency,
              totalCost,
            },
          });
        }
      }, 25000);
    });
  }

  /**
   * Get friendly model name
   */
  private getModelName(modelId: string): string {
    const names: Record<string, string> = {
      'mistralai/mistral-7b-instruct:free': 'Mistral 7B',
      'x-ai/grok-4.1-fast:free': 'Grok 4.1 Fast',
      'kwaipilot/kat-coder-pro-v1:free': 'KAT-Coder-Pro',
    };
    return names[modelId] || modelId;
  }
}
