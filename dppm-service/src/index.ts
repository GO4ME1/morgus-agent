// Set default environment variables before any imports
if (!process.env.SUPABASE_URL) {
  process.env.SUPABASE_URL = 'https://mock.supabase.co';
}
if (!process.env.SUPABASE_SERVICE_ROLE_KEY && !process.env.SUPABASE_SERVICE_KEY) {
  process.env.SUPABASE_SERVICE_KEY = 'mock-key';
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'mock-key';
}

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
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { deployToGitHubPages, GitHubDeployRequest } from './github-pages-deploy';
import { 
  detectOutputType, 
  detectWebsiteTemplate, 
  detectAppTemplate,
  generateWebsite, 
  generateApp,
  generateFromTemplate,
  getContentPrompt,
  parseAIContent,
  WebsiteData,
  AppData
} from './templates';
import { generateFromContent, getContentGenerationPrompt } from './template-generator';
import { MorgyService } from './morgy-service';
import { MorgyExecutionEngine } from './morgy-execution';
import { KnowledgeBaseService } from './knowledge-base-service';
import multer from 'multer';
import { authMiddleware, optionalAuthMiddleware, adminMiddleware } from './auth-middleware';
import avatarRoutes from './avatar-routes';
import nameGeneratorRoutes from './name-generator-routes';
import oauthRoutes from './oauth-routes';
import marketplaceRoutes from './marketplace-routes';
import mcpRoutes from './mcp-routes';
import knowledgeRoutes from './knowledge-routes';
import billingRoutes from './billing-routes';
import analyticsRoutes from './analytics-routes';
import supportRoutes from './support-routes';
import morgyCrudRoutes from './morgy-crud-routes';
import morgyMarketplaceRoutes from './morgy-marketplace-routes';
import morgyRevenueRoutes from './morgy-revenue-routes';
import mcpExportRoutes from './mcp-export-routes';
import apiKeyRoutes from './api-key-routes';
import knowledgeBaseRoutes from './knowledge-base-routes';
import memoryRoutes from './routes/memory-routes';
import { securityHeaders, corsMiddleware, sanitizeInput, requestId, requestLogger, errorHandler, notFoundHandler, healthCheck } from './middleware/security';
import { rateLimitMiddleware, strictRateLimitMiddleware } from './middleware/rate-limiting';
import { usageTrackingMiddleware, quotaCheckMiddleware } from './middleware/usage-tracking';
import { optionalAuth, requireAuth } from './middleware/auth';

const upload = multer({ storage: multer.memoryStorage() });

const app = express();

// Security middleware (must be first)
app.use(requestId);
app.use(requestLogger);
app.use(securityHeaders);
app.use(corsMiddleware);
app.use(express.json({ limit: '10mb' }));
app.use(sanitizeInput);

// Rate limiting (global)
app.use(rateLimitMiddleware);

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
  allow_learning?: boolean; // User opt-in/out for learning data collection
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

interface CodeArtifact {
  filename: string;
  content: string;
  language: string;
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
  // New: Code artifacts for deployment
  artifacts?: CodeArtifact[];
  requiresDeployment?: boolean;
  projectType?: 'website' | 'app' | 'script' | 'document';
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
    { name: 'qwen3-4b', fn: () => queryWithTimeout(
      () => queryOpenRouter(prompt, systemPrompt, config.openrouter_api_key, 'qwen/qwen3-4b:free'),
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
      
      const isWebsiteTask = goal.toLowerCase().includes('landing page') || 
                            goal.toLowerCase().includes('website') ||
                            goal.toLowerCase().includes('web page');
      
      const currentYear = new Date().getFullYear();
      const prompt = isWebsiteTask 
        ? `You are building: "${goal}"

Your subtask: ${subtask.title}
Description: ${subtask.description}

IMPORTANT: Generate complete, production-ready code. Use markdown code blocks with language specifiers:
- \`\`\`html for HTML
- \`\`\`css for CSS  
- \`\`\`javascript for JS

IMPORTANT DATES: The current year is ${currentYear}. Use ${currentYear} for all copyright notices, footer dates, and any year references.

Make the code modern, responsive, and visually appealing. Include all necessary code - no placeholders or "add your content here".`
        : `You are working on: "${goal}"

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
    
    const isWebsiteTask = goal.toLowerCase().includes('landing page') || 
                          goal.toLowerCase().includes('website') ||
                          goal.toLowerCase().includes('web page');
    
    const currentYear = new Date().getFullYear();
    const prompt = isWebsiteTask
      ? `You are building: "${goal}"

Your subtask: ${subtask.title}
Description: ${subtask.description}

Previous code generated:
${dependencyContext}

Combine all the code into a complete, working website. Output the final complete HTML file that includes:
1. All CSS (inline in <style> or combined)
2. All JavaScript (inline in <script> or combined)
3. Complete responsive design

IMPORTANT DATES: The current year is ${currentYear}. Use ${currentYear} for all copyright notices, footer dates, and any year references.

Output ONLY the final combined code in a single \`\`\`html code block.`
      : `You are working on: "${goal}"

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

// Extract code artifacts from subtask outputs
function extractCodeArtifacts(subtaskResults: SubtaskResult[]): CodeArtifact[] {
  const artifacts: CodeArtifact[] = [];
  
  for (const result of subtaskResults) {
    if (result.status !== 'success') continue;
    
    // Match code blocks with language specifier
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
    let match;
    
    while ((match = codeBlockRegex.exec(result.output)) !== null) {
      const language = match[1] || 'text';
      const content = match[2].trim();
      
      // Determine filename based on language and content
      let filename = 'code';
      if (language === 'html' || content.includes('<!DOCTYPE') || content.includes('<html')) {
        filename = 'index.html';
      } else if (language === 'css' || content.includes('{') && content.includes(':') && !content.includes('function')) {
        filename = 'styles.css';
      } else if (language === 'javascript' || language === 'js') {
        filename = 'script.js';
      } else if (language === 'json') {
        filename = 'data.json';
      }
      
      // Avoid duplicates
      const existing = artifacts.find(a => a.filename === filename);
      if (existing) {
        // Append or replace based on content length
        if (content.length > existing.content.length) {
          existing.content = content;
        }
      } else {
        artifacts.push({ filename, content, language });
      }
    }
  }
  
  return artifacts;
}

// Detect project type from message and artifacts
function detectProjectType(message: string, artifacts: CodeArtifact[]): 'website' | 'app' | 'script' | 'document' {
  const lowerMessage = message.toLowerCase();
  
  // Check message for project type indicators
  if (lowerMessage.includes('landing page') || 
      lowerMessage.includes('website') || 
      lowerMessage.includes('web page') ||
      lowerMessage.includes('html') ||
      lowerMessage.includes('portfolio')) {
    return 'website';
  }
  
  if (lowerMessage.includes('mobile app') || 
      lowerMessage.includes('react native') ||
      lowerMessage.includes('ios app') ||
      lowerMessage.includes('android app')) {
    return 'app';
  }
  
  // Check artifacts
  const hasHtml = artifacts.some(a => a.filename.endsWith('.html'));
  const hasCss = artifacts.some(a => a.filename.endsWith('.css'));
  
  if (hasHtml || hasCss) {
    return 'website';
  }
  
  const hasJs = artifacts.some(a => a.filename.endsWith('.js'));
  if (hasJs) {
    return 'script';
  }
  
  return 'document';
}

// Sensitivity filter to prevent caching sensitive data
// Returns true if the content contains potentially sensitive information
function containsSensitiveData(text: string): boolean {
  const lowerText = text.toLowerCase();
  
  // Patterns that indicate sensitive data
  const sensitivePatterns = [
    // API keys and secrets
    /api[_-]?key/i,
    /secret[_-]?key/i,
    /access[_-]?token/i,
    /bearer\s+[a-z0-9]/i,
    /sk-[a-z0-9]{20,}/i, // OpenAI keys
    /ghp_[a-z0-9]{36}/i, // GitHub tokens
    /xox[baprs]-[a-z0-9-]+/i, // Slack tokens
    
    // Passwords and credentials
    /password[\s:=]/i,
    /passwd[\s:=]/i,
    /my password is/i,
    /login credentials/i,
    
    // Personal identifiable information (PII)
    /social security/i,
    /ssn[\s:=]/i,
    /\b\d{3}-\d{2}-\d{4}\b/, // SSN format
    /credit card/i,
    /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/, // Credit card format
    /cvv[\s:=]/i,
    /bank account/i,
    /routing number/i,
    
    // Medical information (HIPAA)
    /medical record/i,
    /patient id/i,
    /diagnosis[\s:]/i,
    /prescription[\s:]/i,
    /health insurance/i,
    
    // Financial information
    /tax return/i,
    /income[\s:=]\$?\d/i,
    /salary[\s:=]\$?\d/i,
    /net worth/i,
    
    // Private keys and certificates
    /-----BEGIN.*PRIVATE KEY-----/i,
    /-----BEGIN CERTIFICATE-----/i,
    
    // Database credentials
    /connection string/i,
    /mongodb\+srv:\/\//i,
    /postgres:\/\//i,
    /mysql:\/\//i,
    
    // Personal contact info patterns
    /my phone number is/i,
    /my address is/i,
    /my email is/i,
    /date of birth/i,
    /\bdob[\s:=]/i,
  ];
  
  // Check for sensitive patterns
  for (const pattern of sensitivePatterns) {
    if (pattern.test(text)) {
      return true;
    }
  }
  
  // Check for email addresses in personal context
  const emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/;
  if (emailPattern.test(text) && (lowerText.includes('my email') || lowerText.includes('contact me'))) {
    return true;
  }
  
  return false;
}

// Store learning data in Supabase using service role key from environment
async function storeLearningData(
  userId: string | undefined,
  conversationId: string | undefined,
  goal: string,
  output: string, // The actual answer/output
  subtaskResults: SubtaskResult[],
  reflection: string,
  lessons: string[],
  totalTime: number,
  allowLearning: boolean | undefined, // User's opt-in/out preference
  config: DPPMRequest['config']
): Promise<void> {
  // Use environment variables for Supabase credentials (service role key bypasses RLS)
  const supabaseUrl = process.env.SUPABASE_URL || config.supabase_url;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || config.supabase_key;
  
  // Respect user's privacy preference - if they opted out, don't store anything
  if (allowLearning === false) {
    console.log('[DPPM] Skipping learning data storage - user opted out (snake mode)');
    return;
  }
  
  if (!userId || !supabaseUrl || !supabaseKey) {
    console.log('[DPPM] Skipping learning data storage - missing user_id or Supabase config');
    return;
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Determine goal category based on keywords
    const lowerGoal = goal.toLowerCase();
    let goalCategory = 'general';
    if (lowerGoal.includes('code') || lowerGoal.includes('program') || lowerGoal.includes('script') || lowerGoal.includes('function')) {
      goalCategory = 'coding';
    } else if (lowerGoal.includes('write') || lowerGoal.includes('essay') || lowerGoal.includes('article') || lowerGoal.includes('blog')) {
      goalCategory = 'writing';
    } else if (lowerGoal.includes('analyze') || lowerGoal.includes('research') || lowerGoal.includes('data')) {
      goalCategory = 'analysis';
    } else if (lowerGoal.includes('website') || lowerGoal.includes('landing page') || lowerGoal.includes('web')) {
      goalCategory = 'web_development';
    } else if (lowerGoal.includes('math') || lowerGoal.includes('calculate') || lowerGoal.includes('equation')) {
      goalCategory = 'math';
    }

    // Calculate success rate and winning model
    const successfulResults = subtaskResults.filter(r => r.status === 'success');
    const successRate = subtaskResults.length > 0 ? successfulResults.length / subtaskResults.length : 0;
    
    // Find the model that won most subtasks
    const modelCounts: Record<string, number> = {};
    successfulResults.forEach(r => {
      modelCounts[r.model] = (modelCounts[r.model] || 0) + 1;
    });
    const winningModel = Object.entries(modelCounts)
      .sort((a, b) => b[1] - a[1])[0]?.[0] || 'unknown';

    // Store the DPPM reflection
    const { error: reflectionError } = await supabase
      .from('dppm_reflections')
      .insert({
        user_id: userId,
        conversation_id: conversationId,
        goal: goal.substring(0, 1000),
        goal_category: goalCategory,
        subtask_count: subtaskResults.length,
        completed_subtasks: subtaskResults.filter(r => r.status === 'success').length,
        total_time_ms: totalTime,
        success: successRate >= 0.5,
        subtask_results: subtaskResults.map(r => ({
          id: r.id,
          title: r.title,
          model: r.model,
          latency_ms: r.latency,
          status: r.status
        })),
        lessons_learned: lessons,
        reflection_text: reflection,
        output_text: output.substring(0, 10000), // Store output for caching (max 10KB)
        is_cacheable: !containsSensitiveData(goal) && !containsSensitiveData(output) // Don't cache sensitive data
      });

    if (reflectionError) {
      console.error('[DPPM] Error storing reflection:', reflectionError.message);
    } else {
      console.log(`[DPPM] Stored learning data: category=${goalCategory}, winner=${winningModel}, success=${(successRate * 100).toFixed(0)}%`);
    }

    // Note: model_performance is updated automatically via database trigger
  } catch (error: any) {
    console.error('[DPPM] Error storing learning data:', error.message);
  }
}

// Main DPPM endpoint
app.post('/dppm', async (req, res) => {
  const startTime = Date.now();
  const request: DPPMRequest = req.body;
  
  // Ensure config exists with fallback to environment variables
  if (!request.config) {
    request.config = {
      openrouter_api_key: process.env.OPENROUTER_API_KEY || '',
      gemini_api_key: process.env.GEMINI_API_KEY || '',
      openai_api_key: process.env.OPENAI_API_KEY || '',
      anthropic_api_key: process.env.ANTHROPIC_API_KEY || '',
      supabase_url: process.env.SUPABASE_URL || '',
      supabase_key: process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    };
  } else {
    // Fill in any missing keys from environment
    request.config.openrouter_api_key = request.config.openrouter_api_key || process.env.OPENROUTER_API_KEY || '';
    request.config.gemini_api_key = request.config.gemini_api_key || process.env.GEMINI_API_KEY || '';
    request.config.openai_api_key = request.config.openai_api_key || process.env.OPENAI_API_KEY || '';
    request.config.anthropic_api_key = request.config.anthropic_api_key || process.env.ANTHROPIC_API_KEY || '';
    request.config.supabase_url = request.config.supabase_url || process.env.SUPABASE_URL || '';
    request.config.supabase_key = request.config.supabase_key || process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  }
  
  console.log('[DPPM] Starting deep thinking for:', request.message.substring(0, 100));
  console.log('[DPPM] Config keys present:', Object.keys(request.config).filter(k => request.config[k as keyof typeof request.config]));
  
  try {
    // Detect output type to determine processing path
    const outputType = detectOutputType(request.message);
    console.log(`[DPPM] Detected output type: ${outputType}`);
    
    let finalOutput: string;
    let subtasks: Subtask[];
    let subtaskResults: SubtaskResult[];
    let artifacts: CodeArtifact[] = [];
    let projectType: 'website' | 'app' | 'script' | 'document' = 'document';
    let requiresDeployment = false;
    
    // For websites and apps, use template-based generation
    if (outputType === 'website' || outputType === 'app') {
      console.log(`[DPPM] Using template-based generation for ${outputType}`);
      
      // Phase 1: Generate content prompt for AI
      const contentPrompt = getContentGenerationPrompt(request.message);
      
      // Phase 2: Get content from AI (fast single model)
      const contentResult = await queryFast(
        contentPrompt,
        'You are a content strategist. Generate only JSON, no explanations.',
        request.config
      );
      console.log('[DPPM] AI generated content for template');
      
      // Phase 3: Generate from template
      const templateResult = await generateFromContent(
        request.message,
        contentResult,
        request.config,
        {
          generateVideo: false // Default to no video for now, will add user confirmation later
        }
      );
      console.log(`[DPPM] Generated ${outputType} using ${templateResult.templateType} template`);
      
      // Create artifacts from template output
      if (templateResult.html) {
        artifacts = [{
          language: 'html',
          filename: 'index.html',
          content: templateResult.html
        }];
        finalOutput = `✨ Your ${outputType} has been generated using the **${templateResult.templateType}** template!\n\nThe site will be deployed automatically.`;
      } else if (templateResult.code) {
        artifacts = [{
          language: 'tsx',
          filename: 'App.tsx',
          content: templateResult.code
        }];
        finalOutput = `✨ Your ${outputType} has been generated using the **${templateResult.templateType}** template!\n\nThe app is ready to deploy.`;
      } else {
        finalOutput = 'Template generation completed.';
      }
      
      projectType = outputType as 'website' | 'app';
      requiresDeployment = outputType === 'website';
      
      // Create synthetic subtask results for consistency
      subtasks = [
        { id: 1, title: 'Content Generation', description: 'Generate content for template', dependencies: [] },
        { id: 2, title: 'Template Application', description: 'Apply template with content', dependencies: [1] }
      ];
      subtaskResults = [
        { id: 1, title: 'Content Generation', output: contentResult, model: 'fast', latency: 0, status: 'success' },
        { id: 2, title: 'Template Application', output: finalOutput, model: 'template', latency: 0, status: 'success' }
      ];
      
    } else {
      // For documents and code, use the standard DPPM flow
      console.log('[DPPM] Using standard DPPM flow');
      
      // Phase 1: Decompose (fast - single model)
      subtasks = await decompose(request.message, request.config);
      console.log(`[DPPM] Decomposed into ${subtasks.length} subtasks`);
      
      // Phase 2: Execute (parallel where possible)
      subtaskResults = await executeSubtasks(subtasks, request.message, request.config);
      console.log(`[DPPM] Executed ${subtaskResults.filter(r => r.status === 'success').length}/${subtasks.length} subtasks`);
      
      // Get the final output from the last subtask (synthesis)
      const finalSubtask = subtaskResults.find(r => r.id === Math.max(...subtaskResults.map(s => s.id)));
      finalOutput = finalSubtask?.output || subtaskResults.map(r => r.output).join('\n\n');
      
      // Extract code artifacts from subtask outputs
      artifacts = extractCodeArtifacts(subtaskResults);
      projectType = detectProjectType(request.message, artifacts);
      requiresDeployment = projectType === 'website' && artifacts.length > 0;
    }
    
    // Phase 3: Quick reflection
    const { reflection, lessons } = await quickReflect(request.message, subtaskResults, request.config);
    
    const totalTime = Date.now() - startTime;
    console.log(`[DPPM] Completed in ${totalTime}ms`);
    console.log(`[DPPM] Extracted ${artifacts.length} code artifacts, projectType: ${projectType}, requiresDeployment: ${requiresDeployment}`);
    
    // Phase 4: Store learning data (non-blocking)
    // Respects user's privacy preference (allow_learning flag)
    storeLearningData(
      request.user_id,
      request.conversation_id,
      request.message,
      finalOutput, // Store the actual output for caching
      subtaskResults,
      reflection,
      lessons,
      totalTime,
      request.allow_learning, // User's opt-in/out preference
      request.config
    ).catch(err => console.error('[DPPM] Learning data storage failed:', err.message));
    
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
      reflection,
      artifacts,
      requiresDeployment,
      projectType
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

// Deploy endpoint - handles Cloudflare Pages deployment
interface DeployRequest {
  projectName: string;
  files: Array<{ path: string; content: string }>;
  apiToken: string;
  accountId: string;
}

app.post('/deploy', async (req, res) => {
  const startTime = Date.now();
  const request: DeployRequest = req.body;
  
  console.log('[DEPLOY] Starting deployment for:', request.projectName);
  console.log('[DEPLOY] Files:', request.files?.length || 0);
  
  try {
    if (!request.projectName || !request.files || !request.apiToken || !request.accountId) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        required: ['projectName', 'files', 'apiToken', 'accountId']
      });
    }
    
    const projectName = request.projectName.toLowerCase().replace(/[^a-z0-9-]/g, '-');
    
    // Step 1: Create project if it doesn't exist
    console.log('[DEPLOY] Checking/creating project...');
    const projectResponse = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${request.accountId}/pages/projects/${projectName}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${request.apiToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!projectResponse.ok && projectResponse.status === 404) {
      console.log('[DEPLOY] Creating new project...');
      const createResponse = await fetch(
        `https://api.cloudflare.com/client/v4/accounts/${request.accountId}/pages/projects`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${request.apiToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: projectName,
            production_branch: 'main',
          }),
        }
      );

      if (!createResponse.ok) {
        const error = await createResponse.text();
        throw new Error(`Failed to create project: ${error}`);
      }
    }

    // Step 2: Get upload JWT token
    console.log('[DEPLOY] Getting upload token...');
    const tokenResponse = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${request.accountId}/pages/projects/${projectName}/upload-token`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${request.apiToken}`,
        },
      }
    );

    if (!tokenResponse.ok) {
      const error = await tokenResponse.text();
      throw new Error(`Failed to get upload token: ${error}`);
    }

    const tokenData: any = await tokenResponse.json();
    const uploadToken = tokenData.result.jwt;

    // Step 3: Prepare files with hashes
    const fileData: Array<{
      path: string;
      hash: string;
      content: string;
      contentType: string;
    }> = [];

    const crypto = await import('crypto');
    
    for (const file of request.files) {
      let contentType = 'text/html';
      if (file.path.endsWith('.css')) contentType = 'text/css';
      if (file.path.endsWith('.js')) contentType = 'application/javascript';
      if (file.path.endsWith('.json')) contentType = 'application/json';

      const base64Content = Buffer.from(file.content).toString('base64');
      // Hash = SHA-256(base64Content + extension), truncated to 32 hex chars
      // Reference: https://developers.cloudflare.com/workers/static-assets/direct-upload/
      const extension = file.path.includes('.') ? file.path.split('.').pop() || '' : '';
      const hash = crypto.createHash('sha256').update(base64Content + extension).digest('hex').slice(0, 32);

      fileData.push({
        path: file.path.startsWith('/') ? file.path : `/${file.path}`,
        hash,
        content: base64Content,
        contentType,
      });
    }

    // Step 4: Upload files
    console.log('[DEPLOY] Uploading', fileData.length, 'files...');
    const uploadBatch = fileData.map(f => ({
      key: f.hash,
      value: f.content,
      metadata: { contentType: f.contentType },
      base64: true,
    }));

    const uploadResponse = await fetch(
      'https://api.cloudflare.com/client/v4/pages/assets/upload',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${uploadToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(uploadBatch),
      }
    );

    if (!uploadResponse.ok) {
      const error = await uploadResponse.text();
      throw new Error(`File upload failed: ${error}`);
    }

    // Step 5: Register file hashes
    console.log('[DEPLOY] Registering hashes...');
    const hashes = fileData.map(f => f.hash);
    
    const hashResponse = await fetch(
      'https://api.cloudflare.com/client/v4/pages/assets/upsert-hashes',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${uploadToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ hashes }),
      }
    );

    if (!hashResponse.ok) {
      const error = await hashResponse.text();
      throw new Error(`Hash registration failed: ${error}`);
    }

    // Step 6: Create manifest and deployment
    console.log('[DEPLOY] Creating deployment...');
    const manifest: Record<string, string> = {};
    for (const file of fileData) {
      manifest[file.path] = file.hash;
    }

    const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);
    const parts: string[] = [];
    parts.push(`--${boundary}\r\n`);
    parts.push(`Content-Disposition: form-data; name="manifest"\r\n\r\n`);
    parts.push(`${JSON.stringify(manifest)}\r\n`);
    parts.push(`--${boundary}--\r\n`);

    const deployResponse = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${request.accountId}/pages/projects/${projectName}/deployments`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${request.apiToken}`,
          'Content-Type': `multipart/form-data; boundary=${boundary}`,
        },
        body: parts.join(''),
      }
    );

    if (!deployResponse.ok) {
      const error = await deployResponse.text();
      throw new Error(`Deployment creation failed: ${error}`);
    }

    const result: any = await deployResponse.json();
    const deploymentUrl = result.result?.url;
    const productionUrl = `https://${projectName}.pages.dev`;
    
    const totalTime = Date.now() - startTime;
    console.log(`[DEPLOY] Success! URL: ${productionUrl} (${totalTime}ms)`);

    res.json({
      success: true,
      productionUrl,
      deploymentUrl,
      projectName,
      filesDeployed: fileData.length,
      totalTime
    });

  } catch (error: any) {
    console.error('[DEPLOY] Error:', error.message);
    res.status(500).json({
      error: 'Deployment failed',
      message: error.message
    });
  }
});

// GitHub Pages deployment endpoint
app.post('/deploy-github', async (req, res) => {
  const startTime = Date.now();
  
  try {
    const { projectName, files, githubToken } = req.body;
    
    if (!projectName || !files || !githubToken) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['projectName', 'files', 'githubToken']
      });
    }
    
    console.log('[GITHUB-DEPLOY] Starting deployment for:', projectName);
    
    const result = await deployToGitHubPages({
      projectName,
      files,
      githubToken,
    });
    
    const totalTime = Date.now() - startTime;
    
    if (result.success) {
      res.json({
        success: true,
        url: result.url,
        repoUrl: result.repoUrl,
        totalTime,
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error,
        totalTime,
      });
    }
  } catch (error: any) {
    console.error('[GITHUB-DEPLOY] Error:', error.message);
    res.status(500).json({
      error: 'GitHub deployment failed',
      message: error.message,
    });
  }
});

// ============================================================================
// MORGY ROUTES
// ============================================================================

// Authentication middleware
// Public routes don't need auth, protected routes use authMiddleware

const morgyService = new MorgyService(
  process.env.SUPABASE_URL || 'https://mock.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || 'mock-key'
);

const knowledgeBaseService = new KnowledgeBaseService(
  process.env.SUPABASE_URL || 'https://mock.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || 'mock-key',
  process.env.OPENAI_API_KEY || ''
);

// Avatar routes
app.use('/api/morgys', avatarRoutes);
app.use('/api/avatar', avatarRoutes);
app.use('/api/morgys', nameGeneratorRoutes);
app.use('/api/oauth', oauthRoutes);

// Get starter Morgys (public)
app.get('/api/morgys/starters', async (req, res) => {
  try {
    const morgys = await morgyService.getStarterMorgys();
    res.json(morgys);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get user's Morgys (protected)
app.get('/api/morgys', authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const morgys = await morgyService.getUserMorgys(userId);
    res.json(morgys);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Create new Morgy (protected)
app.post('/api/morgys', authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const morgy = await morgyService.createMorgy(userId, req.body);
    res.status(201).json(morgy);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get a specific Morgy
app.get('/api/morgys/:id', async (req, res) => {
  try {
    const userId = (req as any).userId;
    const morgy = await morgyService.getMorgy(req.params.id, userId);
    if (!morgy) {
      return res.status(404).json({ error: 'Morgy not found' });
    }
    res.json(morgy);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Create conversation
app.post('/api/morgys/:id/conversations', async (req, res) => {
  try {
    const userId = (req as any).userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const conversation = await morgyService.createConversation(userId, req.params.id, req.body.title);
    res.status(201).json(conversation);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get creator analytics
app.get('/api/creator/analytics', async (req, res) => {
  try {
    const userId = (req as any).userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const analytics = await morgyService.getCreatorAnalytics(userId);
    res.json(analytics);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Browse marketplace
app.get('/api/market/listings', async (req, res) => {
  try {
    const { category, minRating, maxPrice, search, limit, offset } = req.query;
    const filters = {
      category: category as string,
      minRating: minRating ? parseFloat(minRating as string) : undefined,
      maxPrice: maxPrice ? parseFloat(maxPrice as string) : undefined,
      search: search as string
    };
    const listings = await morgyService.browseMarket(
      filters,
      limit ? parseInt(limit as string) : 20,
      offset ? parseInt(offset as string) : 0
    );
    res.json(listings);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Initialize starter Morgys (admin only)
app.post('/api/admin/init-starters', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const userId = (req as any).userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    await morgyService.initializeStarterMorgys(userId);
    res.json({ message: 'Starter Morgys initialized successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Chat with a Morgy (protected)
app.post('/api/morgys/:id/chat', authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id: morgyId } = req.params;
    const { message, history, mode } = req.body;

    // Get Morgy
    const morgy = await morgyService.getMorgy(morgyId, userId);
    if (!morgy) {
      return res.status(404).json({ error: 'Morgy not found' });
    }

    // Execute with Morgy execution engine
    const executionEngine = new MorgyExecutionEngine();
    executionEngine.setKnowledgeBaseService(knowledgeBaseService);
    const result = await executionEngine.execute(
      morgy,
      message,
      history || [],
      {
        gemini_api_key: process.env.GEMINI_API_KEY || '',
        openai_api_key: process.env.OPENAI_API_KEY || '',
        openrouter_api_key: process.env.OPENROUTER_API_KEY || '',
        anthropic_api_key: process.env.ANTHROPIC_API_KEY || ''
      },
      mode
    );

    res.json(result);
  } catch (error: any) {
    console.error('[Morgy Chat] Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// KNOWLEDGE BASE ROUTES
// ============================================================================

// Upload file to knowledge base
app.post('/api/morgys/:id/knowledge/upload', upload.single('file'), async (req, res) => {
  try {
    const userId = (req as any).userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id: morgyId } = req.params;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const knowledge = await knowledgeBaseService.uploadFile(morgyId, userId, {
      name: file.originalname,
      type: file.mimetype,
      buffer: file.buffer
    });

    res.status(201).json(knowledge);
  } catch (error: any) {
    console.error('[Knowledge Upload] Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Add text knowledge
app.post('/api/morgys/:id/knowledge', async (req, res) => {
  try {
    const userId = (req as any).userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id: morgyId } = req.params;
    const { content, source, sourceType, metadata } = req.body;

    const knowledge = await knowledgeBaseService.addKnowledge({
      morgyId,
      content,
      source,
      sourceType: sourceType || 'text',
      metadata
    }, userId);

    res.status(201).json(knowledge);
  } catch (error: any) {
    console.error('[Knowledge Add] Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get knowledge for a Morgy
app.get('/api/morgys/:id/knowledge', async (req, res) => {
  try {
    const userId = (req as any).userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id: morgyId } = req.params;
    const knowledge = await knowledgeBaseService.getKnowledge(morgyId, userId);

    res.json(knowledge);
  } catch (error: any) {
    console.error('[Knowledge Get] Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Search knowledge base
app.get('/api/morgys/:id/knowledge/search', async (req, res) => {
  try {
    const { id: morgyId } = req.params;
    const { query, limit } = req.query;

    if (!query) {
      return res.status(400).json({ error: 'Query parameter required' });
    }

    const results = await knowledgeBaseService.searchKnowledge(
      morgyId,
      query as string,
      limit ? parseInt(limit as string) : 5
    );

    res.json(results);
  } catch (error: any) {
    console.error('[Knowledge Search] Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete knowledge item
app.delete('/api/morgys/knowledge/:knowledgeId', async (req, res) => {
  try {
    const userId = (req as any).userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { knowledgeId } = req.params;
    await knowledgeBaseService.deleteKnowledge(knowledgeId, userId);

    res.status(204).send();
  } catch (error: any) {
    console.error('[Knowledge Delete] Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Scrape website and add to knowledge base
app.post('/api/morgys/:id/knowledge/scrape', async (req, res) => {
  try {
    const userId = (req as any).userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id: morgyId } = req.params;
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({ error: 'URL required' });
    }

    // Scrape website
    const content = await knowledgeBaseService.scrapeWebsite(url);

    // Add to knowledge base
    const knowledge = await knowledgeBaseService.addKnowledge({
      morgyId,
      content,
      source: url,
      sourceType: 'website',
      metadata: { url, scrapedAt: new Date().toISOString() }
    }, userId);

    res.status(201).json(knowledge);
  } catch (error: any) {
    console.error('[Website Scrape] Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Register new routes with middleware

// Public routes (no auth required)
app.get('/health', healthCheck);
app.use('/api/marketplace', optionalAuth, marketplaceRoutes);
app.get('/api/mcp-exports/:shareId', mcpExportRoutes); // Public MCP downloads

// Protected routes (auth required)
app.use('/api/mcp', requireAuth, usageTrackingMiddleware, quotaCheckMiddleware, mcpRoutes);
app.use('/api/knowledge', requireAuth, usageTrackingMiddleware, quotaCheckMiddleware, knowledgeRoutes);
app.use('/api/knowledge-base', requireAuth, usageTrackingMiddleware, quotaCheckMiddleware, knowledgeBaseRoutes);
app.use('/api/memory', requireAuth, usageTrackingMiddleware, memoryRoutes);
app.use('/api/billing', requireAuth, billingRoutes);
app.use('/api/analytics', requireAuth, analyticsRoutes);
app.use('/api/support', requireAuth, supportRoutes);

// API key management (strict rate limiting)
app.use('/api/api-keys', requireAuth, strictRateLimitMiddleware, apiKeyRoutes);

// MCP export routes
app.use('/api/morgys/:morgyId/mcp-export', requireAuth, usageTrackingMiddleware, mcpExportRoutes);
app.use('/api/mcp-exports', requireAuth, mcpExportRoutes);

// Morgy Creator routes
app.use('/api/morgys', optionalAuth, usageTrackingMiddleware, morgyCrudRoutes);
app.use('/api/marketplace', optionalAuth, morgyMarketplaceRoutes);
app.use('/api/creators', requireAuth, morgyRevenueRoutes);

// Error handlers (must be last)
app.use(notFoundHandler);
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`🧠 Morgus DPPM Service (Optimized) running on port ${PORT}`);
  console.log(`Config: ${MAX_SUBTASKS} subtasks max, ${MODEL_TIMEOUT}ms timeout, ${MAJORITY_THRESHOLD} model majority`);
});
