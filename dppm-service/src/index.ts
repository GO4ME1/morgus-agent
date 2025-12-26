/**
 * Morgus DPPM Deep Thinking Service - OPTIMIZED
 * 
 * Target: 30-60 seconds response time
 * 
 * Optimizations:
 * - Max 3 subtasks (not 7)
 * - Single fast model for decomposition (skip MOE)
 * - Parallel subtask execution where possible
 * - Lower majority threshold (2 models)
 * - 15 second timeout per model
 */

import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

const PORT = process.env.PORT || 8080;

// Configuration
const MAX_SUBTASKS = 5;
const MODEL_TIMEOUT = 15000; // 15 seconds per model
const MAJORITY_THRESHOLD = 4; // Same as main MOE - 4 of 6 models

// Types
interface DPPMRequest {
  message: string;
  history?: Array<{ role: string; content: string }>;
  user_id?: string;
  conversation_id?: string;
  config: {
    openrouter_api_key: string;
    gemini_api_key: string;
    openai_api_key: string;
    anthropic_api_key?: string;
    supabase_url: string;
    supabase_key: string;
  };
}

interface Subtask {
  id: number;
  title: string;
  description: string;
  dependencies: number[];
}

interface SubtaskResult {
  id: number;
  title: string;
  output: string;
  model: string;
  latency: number;
  status: 'success' | 'failed';
}

interface DPPMResponse {
  output: string;
  dppmSummary: {
    totalSubtasks: number;
    completedSubtasks: number;
    totalTime: number;
    decomposition: Subtask[];
  };
  subtaskResults: SubtaskResult[];
  lessonsLearned: string[];
  reflection: string;
}

// Fast single model query (for decomposition - skip MOE)
async function queryFast(
  prompt: string,
  systemPrompt: string,
  config: DPPMRequest['config']
): Promise<string> {
  // Use Gemini - fastest model
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), MODEL_TIMEOUT);
    
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${config.gemini_api_key}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `${systemPrompt}\n\n${prompt}` }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 2048 }
        }),
        signal: controller.signal
      }
    );
    clearTimeout(timeout);
    
    const data = await response.json() as any;
    return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  } catch (e) {
    // Fallback to GPT-4o-mini
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
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 2048
      })
    });
    const data = await response.json() as any;
    return data.choices?.[0]?.message?.content || '';
  }
}

// Full MOE Competition - all 6 models, majority of 4
async function runMOECompetition(
  prompt: string,
  systemPrompt: string,
  config: DPPMRequest['config']
): Promise<{ content: string; model: string; latency: number }> {
  const startTime = Date.now();
  
  // All 6 models compete
  const models = [
    { name: 'gemini', fn: () => queryWithTimeout(
      () => queryGemini(prompt, systemPrompt, config.gemini_api_key),
      MODEL_TIMEOUT
    )},
    { name: 'gpt-4o-mini', fn: () => queryWithTimeout(
      () => queryOpenAI(prompt, systemPrompt, config.openai_api_key),
      MODEL_TIMEOUT
    )},
    { name: 'mistral-free', fn: () => queryWithTimeout(
      () => queryOpenRouter(prompt, systemPrompt, config.openrouter_api_key, 'mistralai/mistral-7b-instruct:free'),
      MODEL_TIMEOUT
    )},
    { name: 'llama-3.3-8b', fn: () => queryWithTimeout(
      () => queryOpenRouter(prompt, systemPrompt, config.openrouter_api_key, 'meta-llama/llama-3.3-8b-instruct:free'),
      MODEL_TIMEOUT
    )},
    { name: 'kat-coder', fn: () => queryWithTimeout(
      () => queryOpenRouter(prompt, systemPrompt, config.openrouter_api_key, 'kwaipilot/kat-coder-pro-v1:free'),
      MODEL_TIMEOUT
    )},
  ];
  
  // Add Claude if API key available
  if (config.anthropic_api_key) {
    models.push({ name: 'claude', fn: () => queryWithTimeout(
      () => queryClaude(prompt, systemPrompt, config.anthropic_api_key!),
      MODEL_TIMEOUT
    )});
  }
  
  // Race - return first successful response
  const results: Array<{ name: string; content: string; latency: number }> = [];
  
  return new Promise((resolve) => {
    let resolved = false;
    
    models.forEach(({ name, fn }) => {
      fn()
        .then((content) => {
          if (resolved || !content) return;
          
          const latency = Date.now() - startTime;
          results.push({ name, content, latency });
          
          console.log(`[MOE] ${name} responded in ${latency}ms (${results.length}/${MAJORITY_THRESHOLD} needed)`);
          
          // Return as soon as we have enough responses
          if (results.length >= MAJORITY_THRESHOLD && !resolved) {
            resolved = true;
            const best = results.reduce((a, b) => a.content.length > b.content.length ? a : b);
            resolve({ content: best.content, model: best.name, latency: best.latency });
          }
        })
        .catch((err) => {
          console.error(`[MOE] ${name} failed:`, err.message);
        });
    });
    
    // Timeout after 20 seconds - return whatever we have
    setTimeout(() => {
      if (!resolved) {
        resolved = true;
        if (results.length > 0) {
          const best = results.reduce((a, b) => a.content.length > b.content.length ? a : b);
          resolve({ content: best.content, model: best.name, latency: Date.now() - startTime });
        } else {
          resolve({ content: 'Models timed out. Please try again.', model: 'none', latency: 20000 });
        }
      }
    }, 20000);
  });
}

// Timeout wrapper
async function queryWithTimeout<T>(fn: () => Promise<T>, timeout: number): Promise<T | null> {
  return Promise.race([
    fn(),
    new Promise<null>((resolve) => setTimeout(() => resolve(null), timeout))
  ]);
}

// Model query functions
async function queryGemini(prompt: string, systemPrompt: string, apiKey: string): Promise<string> {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: `${systemPrompt}\n\n${prompt}` }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 4096 }
      })
    }
  );
  const data = await response.json() as any;
  return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

async function queryOpenAI(prompt: string, systemPrompt: string, apiKey: string): Promise<string> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 4096
    })
  });
  const data = await response.json() as any;
  return data.choices?.[0]?.message?.content || '';
}

async function queryOpenRouter(prompt: string, systemPrompt: string, apiKey: string, model: string): Promise<string> {
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'HTTP-Referer': 'https://morgus.ai',
      'X-Title': 'Morgus DPPM'
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 4096
    })
  });
  const data = await response.json() as any;
  return data.choices?.[0]?.message?.content || '';
}

async function queryClaude(prompt: string, systemPrompt: string, apiKey: string): Promise<string> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-3-5-haiku-20241022',
      max_tokens: 4096,
      system: systemPrompt,
      messages: [{ role: 'user', content: prompt }]
    })
  });
  const data = await response.json() as any;
  return data.content?.[0]?.text || '';
}

// DPPM Phase 1: Decompose (FAST - single model)
async function decompose(goal: string, config: DPPMRequest['config']): Promise<Subtask[]> {
  console.log('[DPPM] Phase 1: Decomposing task (fast mode)...');
  
  const prompt = `Decompose this task into exactly ${MAX_SUBTASKS} subtasks. Return ONLY valid JSON array.

Task: ${goal}

Return format:
[
  {"id": 1, "title": "Short title", "description": "What to do", "dependencies": []},
  {"id": 2, "title": "Short title", "description": "What to do", "dependencies": []},
  {"id": 3, "title": "Short title", "description": "What to do", "dependencies": [1, 2]}
]

Rules:
- EXACTLY ${MAX_SUBTASKS} subtasks
- Keep them high-level and actionable
- Last subtask should synthesize the others`;

  const result = await queryFast(prompt, 'You are a task decomposition expert. Return only valid JSON.', config);
  
  try {
    const jsonMatch = result.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return parsed.slice(0, MAX_SUBTASKS); // Ensure max 3
    }
    throw new Error('No JSON array found');
  } catch (e) {
    console.error('[DPPM] Decomposition parse error, using default');
    return [
      { id: 1, title: 'Analyze & Plan', description: 'Understand requirements and create approach', dependencies: [] },
      { id: 2, title: 'Execute', description: 'Complete the main work', dependencies: [] },
      { id: 3, title: 'Synthesize', description: 'Combine results into final response', dependencies: [1, 2] }
    ];
  }
}

// DPPM Phase 2: Execute subtasks (PARALLEL where possible)
async function executeSubtasks(
  subtasks: Subtask[],
  goal: string,
  config: DPPMRequest['config']
): Promise<SubtaskResult[]> {
  console.log(`[DPPM] Phase 2: Executing ${subtasks.length} subtasks...`);
  
  const results: SubtaskResult[] = [];
  const completedOutputs: Map<number, string> = new Map();
  
  // Group subtasks by dependency level for parallel execution
  const independentTasks = subtasks.filter(t => t.dependencies.length === 0);
  const dependentTasks = subtasks.filter(t => t.dependencies.length > 0);
  
  // Execute independent tasks in parallel
  console.log(`[DPPM] Running ${independentTasks.length} independent subtasks in parallel`);
  const independentResults = await Promise.all(
    independentTasks.map(async (subtask) => {
      console.log(`[DPPM] Executing subtask ${subtask.id}: ${subtask.title}`);
      
      const prompt = `You are working on: "${goal}"

Your subtask: ${subtask.title}
Description: ${subtask.description}

Provide a focused, actionable response. Be concise but thorough.`;

      try {
        const result = await runMOECompetition(prompt, 'You are an expert assistant.', config);
        completedOutputs.set(subtask.id, result.content);
        return {
          id: subtask.id,
          title: subtask.title,
          output: result.content,
          model: result.model,
          latency: result.latency,
          status: 'success' as const
        };
      } catch (error: any) {
        return {
          id: subtask.id,
          title: subtask.title,
          output: `Failed: ${error.message}`,
          model: 'none',
          latency: 0,
          status: 'failed' as const
        };
      }
    })
  );
  results.push(...independentResults);
  
  // Execute dependent tasks sequentially
  for (const subtask of dependentTasks) {
    console.log(`[DPPM] Executing subtask ${subtask.id}: ${subtask.title}`);
    
    const dependencyContext = subtask.dependencies
      .map(depId => completedOutputs.get(depId))
      .filter(Boolean)
      .join('\n\n---\n\n');
    
    const prompt = `You are working on: "${goal}"

Your subtask: ${subtask.title}
Description: ${subtask.description}

Previous work to build on:
${dependencyContext}

Synthesize the above into a cohesive final response.`;

    try {
      const result = await runMOECompetition(prompt, 'You are an expert at synthesizing information.', config);
      completedOutputs.set(subtask.id, result.content);
      results.push({
        id: subtask.id,
        title: subtask.title,
        output: result.content,
        model: result.model,
        latency: result.latency,
        status: 'success'
      });
    } catch (error: any) {
      results.push({
        id: subtask.id,
        title: subtask.title,
        output: `Failed: ${error.message}`,
        model: 'none',
        latency: 0,
        status: 'failed'
      });
    }
  }
  
  return results;
}

// DPPM Phase 3: Quick reflection (single model)
async function quickReflect(
  goal: string,
  subtaskResults: SubtaskResult[],
  config: DPPMRequest['config']
): Promise<{ reflection: string; lessons: string[] }> {
  console.log('[DPPM] Phase 3: Quick reflection...');
  
  const successCount = subtaskResults.filter(r => r.status === 'success').length;
  const models = [...new Set(subtaskResults.map(r => r.model))].join(', ');
  
  // Skip reflection if all succeeded - just return summary
  if (successCount === subtaskResults.length) {
    return {
      reflection: `Task completed successfully with ${subtaskResults.length} subtasks. Models used: ${models}`,
      lessons: ['Task decomposition improved response quality', 'Parallel execution reduced latency']
    };
  }
  
  // Only do reflection if something failed
  const prompt = `Brief reflection on task: "${goal}"
Completed: ${successCount}/${subtaskResults.length} subtasks
Models: ${models}

What could improve? (2 sentences max)`;

  const result = await queryFast(prompt, 'Be brief.', config);
  
  return {
    reflection: result.substring(0, 200),
    lessons: ['Some subtasks need retry', 'Consider simpler decomposition']
  };
}

// Main DPPM endpoint
app.post('/dppm', async (req, res) => {
  const startTime = Date.now();
  const request: DPPMRequest = req.body;
  
  console.log('[DPPM] Starting deep thinking for:', request.message.substring(0, 100));
  
  try {
    // Phase 1: Decompose (fast - single model)
    const subtasks = await decompose(request.message, request.config);
    console.log(`[DPPM] Decomposed into ${subtasks.length} subtasks`);
    
    // Phase 2: Execute (parallel where possible)
    const subtaskResults = await executeSubtasks(subtasks, request.message, request.config);
    console.log(`[DPPM] Executed ${subtaskResults.filter(r => r.status === 'success').length}/${subtasks.length} subtasks`);
    
    // Get the final output from the last subtask (synthesis)
    const finalSubtask = subtaskResults.find(r => r.id === Math.max(...subtaskResults.map(s => s.id)));
    const finalOutput = finalSubtask?.output || subtaskResults.map(r => r.output).join('\n\n');
    
    // Phase 3: Quick reflection
    const { reflection, lessons } = await quickReflect(request.message, subtaskResults, request.config);
    
    const totalTime = Date.now() - startTime;
    console.log(`[DPPM] Completed in ${totalTime}ms`);
    
    const response: DPPMResponse = {
      output: finalOutput,
      dppmSummary: {
        totalSubtasks: subtasks.length,
        completedSubtasks: subtaskResults.filter(r => r.status === 'success').length,
        totalTime,
        decomposition: subtasks
      },
      subtaskResults,
      lessonsLearned: lessons,
      reflection
    };
    
    res.json(response);
  } catch (error: any) {
    console.error('[DPPM] Error:', error);
    res.status(500).json({
      error: 'DPPM processing failed',
      message: error.message,
      fallback: true
    });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'morgus-dppm', version: '2.0.0-optimized' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🧠 Morgus DPPM Service (Optimized) running on port ${PORT}`);
  console.log(`Config: ${MAX_SUBTASKS} subtasks max, ${MODEL_TIMEOUT}ms timeout, ${MAJORITY_THRESHOLD} model majority`);
});
