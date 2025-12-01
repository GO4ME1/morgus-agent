/**
 * PromptCannon - Parallel Prompt Execution and Response Synthesis
 * 
 * Executes the same prompt across multiple models simultaneously and
 * synthesizes the best response through voting, consensus, and merging.
 */

interface ModelResponse {
  model: string;
  content: string;
  confidence: number;
  responseTime: number;
  error?: string;
}

interface SynthesizedResponse {
  content: string;
  models: string[];
  method: 'consensus' | 'best' | 'merged';
  confidence: number;
}

/**
 * Execute prompt across multiple models in parallel
 */
export async function firePromptCannon(
  prompt: string,
  models: string[],
  env: any,
  conversationHistory?: Array<{role: string, content: string}>
): Promise<SynthesizedResponse> {
  console.log(`🎯 PromptCannon: Firing at ${models.length} models`);
  
  const startTime = Date.now();
  
  // Execute all models in parallel
  const responses = await Promise.allSettled(
    models.map(async (model) => {
      const modelStartTime = Date.now();
      try {
        const response = await callModel(model, prompt, env, conversationHistory);
        const responseTime = Date.now() - modelStartTime;
        
        return {
          model,
          content: response,
          confidence: calculateConfidence(response),
          responseTime
        } as ModelResponse;
      } catch (error: any) {
        console.error(`Model ${model} failed:`, error.message);
        return {
          model,
          content: '',
          confidence: 0,
          responseTime: Date.now() - modelStartTime,
          error: error.message
        } as ModelResponse;
      }
    })
  );
  
  // Extract successful responses
  const successfulResponses = responses
    .filter((r): r is PromiseFulfilledResult<ModelResponse> => r.status === 'fulfilled')
    .map(r => r.value)
    .filter(r => !r.error && r.content.length > 0);
  
  if (successfulResponses.length === 0) {
    throw new Error('All models failed to respond');
  }
  
  console.log(`✅ PromptCannon: Got ${successfulResponses.length}/${models.length} successful responses in ${Date.now() - startTime}ms`);
  
  // Synthesize responses
  return synthesizeResponses(successfulResponses, prompt);
}

/**
 * Call a specific model with the prompt
 */
async function callModel(
  model: string,
  prompt: string,
  env: any,
  conversationHistory?: Array<{role: string, content: string}>
): Promise<string> {
  const messages = [
    ...(conversationHistory || []),
    { role: 'user', content: prompt }
  ];
  
  // Use Gemini for gemini models, OpenAI for others
  if (model.startsWith('gemini')) {
    return await callGemini(model, messages, env);
  } else {
    return await callOpenAI(model, messages, env);
  }
}

/**
 * Call OpenAI-compatible API
 */
async function callOpenAI(
  model: string,
  messages: Array<{role: string, content: string}>,
  env: any
): Promise<string> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.7,
    }),
  });
  
  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.statusText}`);
  }
  
  const data = await response.json();
  return data.choices[0].message.content;
}

/**
 * Call Gemini API
 */
async function callGemini(
  model: string,
  messages: Array<{role: string, content: string}>,
  env: any
): Promise<string> {
  // Convert messages to Gemini format
  const contents = messages.map(msg => ({
    role: msg.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: msg.content }]
  }));
  
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${env.GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents }),
    }
  );
  
  if (!response.ok) {
    throw new Error(`Gemini API error: ${response.statusText}`);
  }
  
  const data = await response.json();
  return data.candidates[0].content.parts[0].text;
}

/**
 * Calculate confidence score for a response
 */
function calculateConfidence(response: string): number {
  let confidence = 0.5;
  
  // Longer responses tend to be more detailed
  if (response.length > 500) confidence += 0.1;
  if (response.length > 1000) confidence += 0.1;
  
  // Structured responses (lists, code blocks) are often better
  if (response.includes('```')) confidence += 0.1;
  if (response.match(/^[\s]*[-*•]\s/m)) confidence += 0.05;
  
  // Hedging language reduces confidence
  if (response.match(/\b(maybe|perhaps|possibly|might|could be)\b/i)) confidence -= 0.1;
  
  // Definitive language increases confidence
  if (response.match(/\b(definitely|certainly|clearly|obviously)\b/i)) confidence += 0.05;
  
  return Math.max(0, Math.min(1, confidence));
}

/**
 * Synthesize multiple responses into one optimal response
 */
function synthesizeResponses(
  responses: ModelResponse[],
  originalPrompt: string
): SynthesizedResponse {
  // If only one response, return it
  if (responses.length === 1) {
    return {
      content: responses[0].content,
      models: [responses[0].model],
      method: 'best',
      confidence: responses[0].confidence
    };
  }
  
  // Check for consensus (similar responses)
  const consensus = findConsensus(responses);
  if (consensus) {
    return {
      content: consensus.content,
      models: consensus.models,
      method: 'consensus',
      confidence: consensus.confidence
    };
  }
  
  // Use best response by confidence
  const best = responses.reduce((a, b) => a.confidence > b.confidence ? a : b);
  
  return {
    content: best.content,
    models: [best.model],
    method: 'best',
    confidence: best.confidence
  };
}

/**
 * Find consensus among responses
 */
function findConsensus(responses: ModelResponse[]): SynthesizedResponse | null {
  // Calculate similarity between responses
  const similarities: number[][] = [];
  
  for (let i = 0; i < responses.length; i++) {
    similarities[i] = [];
    for (let j = 0; j < responses.length; j++) {
      if (i === j) {
        similarities[i][j] = 1.0;
      } else {
        similarities[i][j] = calculateSimilarity(responses[i].content, responses[j].content);
      }
    }
  }
  
  // Find response with highest average similarity (consensus)
  let bestConsensusIdx = 0;
  let bestConsensusScore = 0;
  
  for (let i = 0; i < responses.length; i++) {
    const avgSimilarity = similarities[i].reduce((a, b) => a + b, 0) / responses.length;
    if (avgSimilarity > bestConsensusScore) {
      bestConsensusScore = avgSimilarity;
      bestConsensusIdx = i;
    }
  }
  
  // Require at least 70% similarity for consensus
  if (bestConsensusScore < 0.7) {
    return null;
  }
  
  // Find all responses similar to consensus
  const consensusModels = responses
    .filter((_, idx) => similarities[bestConsensusIdx][idx] > 0.7)
    .map(r => r.model);
  
  return {
    content: responses[bestConsensusIdx].content,
    models: consensusModels,
    method: 'consensus',
    confidence: bestConsensusScore
  };
}

/**
 * Calculate similarity between two strings (simple Jaccard similarity)
 */
function calculateSimilarity(a: string, b: string): number {
  const wordsA = new Set(a.toLowerCase().split(/\s+/));
  const wordsB = new Set(b.toLowerCase().split(/\s+/));
  
  const intersection = new Set([...wordsA].filter(x => wordsB.has(x)));
  const union = new Set([...wordsA, ...wordsB]);
  
  return intersection.size / union.size;
}
