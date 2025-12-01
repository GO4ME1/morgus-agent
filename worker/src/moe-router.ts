/**
 * MoE (Mixture of Experts) Router with Nash Equilibrium
 * 
 * This router uses game theory to select the optimal model(s) for each task,
 * balancing quality, speed, and cost to find the Nash Equilibrium.
 */

export interface ModelCapabilities {
  name: string;
  quality: number;      // 0-1 score for quality
  speed: number;        // 0-1 score for speed (1 = fastest)
  cost: number;         // 0-1 score for cost (1 = most expensive)
  specialties: string[]; // Task types this model excels at
}

export interface TaskContext {
  type: string;         // 'simple', 'complex', 'code', 'research', 'vision'
  priority: 'quality' | 'speed' | 'balanced' | 'cost';
  requiresParallel?: boolean;
  conversationHistory?: Array<{role: string, content: string}>;
}

export interface RoutingDecision {
  primaryModel: string;
  fallbackModel?: string;
  useParallel: boolean;
  parallelModels?: string[];
  confidence: number;
}

// Model capabilities matrix
const MODELS: ModelCapabilities[] = [
  {
    name: 'gpt-4o-mini',
    quality: 0.95,
    speed: 0.6,
    cost: 0.8,
    specialties: ['complex', 'code', 'vision', 'reasoning']
  },
  {
    name: 'gemini-2.0-flash-exp',
    quality: 0.85,
    speed: 0.95,
    cost: 0.3,
    specialties: ['simple', 'research', 'speed']
  },
  {
    name: 'gpt-4o',
    quality: 1.0,
    speed: 0.4,
    cost: 1.0,
    specialties: ['complex', 'vision', 'critical']
  }
];

// Payoff matrix for Nash Equilibrium calculation
const PAYOFF_MATRIX: Record<string, Record<string, number>> = {
  'simple': {
    'gpt-4o-mini': 0.7,
    'gemini-2.0-flash-exp': 0.9,
    'gpt-4o': 0.6
  },
  'complex': {
    'gpt-4o-mini': 0.95,
    'gemini-2.0-flash-exp': 0.7,
    'gpt-4o': 1.0
  },
  'code': {
    'gpt-4o-mini': 0.9,
    'gemini-2.0-flash-exp': 0.75,
    'gpt-4o': 0.95
  },
  'research': {
    'gpt-4o-mini': 0.8,
    'gemini-2.0-flash-exp': 0.85,
    'gpt-4o': 0.75
  },
  'vision': {
    'gpt-4o-mini': 0.9,
    'gemini-2.0-flash-exp': 0.6,
    'gpt-4o': 0.95
  }
};

/**
 * Classify task type based on user message
 */
export function classifyTask(message: string, history?: Array<{role: string, content: string}>): TaskContext {
  const lowerMessage = message.toLowerCase();
  
  // Check for code-related keywords
  if (lowerMessage.match(/\b(code|function|class|debug|error|programming|python|javascript|typescript)\b/)) {
    return { type: 'code', priority: 'quality' };
  }
  
  // Check for research keywords
  if (lowerMessage.match(/\b(search|find|research|information|what is|who is|tell me about)\b/)) {
    return { type: 'research', priority: 'speed' };
  }
  
  // Check for vision keywords
  if (lowerMessage.match(/\b(image|picture|photo|visual|look at|analyze)\b/)) {
    return { type: 'vision', priority: 'quality' };
  }
  
  // Check for complex reasoning
  if (lowerMessage.length > 200 || lowerMessage.match(/\b(explain|analyze|compare|evaluate|design|plan)\b/)) {
    return { type: 'complex', priority: 'balanced' };
  }
  
  // Default to simple
  return { type: 'simple', priority: 'speed' };
}

/**
 * Calculate Nash Equilibrium score for a model given task context
 */
function calculateNashScore(model: ModelCapabilities, context: TaskContext): number {
  // Get base payoff from matrix
  const basePayoff = PAYOFF_MATRIX[context.type]?.[model.name] || 0.5;
  
  // Apply priority weights
  let score = basePayoff;
  
  switch (context.priority) {
    case 'quality':
      score = score * 0.4 + model.quality * 0.6;
      break;
    case 'speed':
      score = score * 0.4 + model.speed * 0.6;
      break;
    case 'cost':
      score = score * 0.4 + (1 - model.cost) * 0.6;
      break;
    case 'balanced':
      // Nash Equilibrium: maximize quality × speed / cost
      const efficiency = (model.quality * model.speed) / (model.cost + 0.1);
      score = score * 0.5 + efficiency * 0.5;
      break;
  }
  
  // Bonus for specialty match
  if (model.specialties.includes(context.type)) {
    score *= 1.2;
  }
  
  return Math.min(score, 1.0);
}

/**
 * Find Nash Equilibrium and select optimal model(s)
 */
export function routeToOptimalModel(context: TaskContext): RoutingDecision {
  // Calculate scores for all models
  const scores = MODELS.map(model => ({
    model: model.name,
    score: calculateNashScore(model, context)
  })).sort((a, b) => b.score - a.score);
  
  const primaryModel = scores[0].model;
  const fallbackModel = scores[1].model;
  const confidence = scores[0].score;
  
  // Determine if parallel execution is beneficial
  const useParallel = context.requiresParallel || 
    (context.type === 'complex' && confidence < 0.85) ||
    (context.priority === 'quality' && scores[0].score - scores[1].score < 0.15);
  
  const parallelModels = useParallel ? [scores[0].model, scores[1].model] : undefined;
  
  return {
    primaryModel,
    fallbackModel,
    useParallel,
    parallelModels,
    confidence
  };
}

/**
 * Update payoff matrix based on feedback (autonomous learning)
 */
export function updatePayoffMatrix(
  taskType: string,
  modelUsed: string,
  rating: 'good' | 'bad' | 'glitch',
  responseTime: number
): void {
  if (!PAYOFF_MATRIX[taskType] || !PAYOFF_MATRIX[taskType][modelUsed]) {
    return;
  }
  
  const currentPayoff = PAYOFF_MATRIX[taskType][modelUsed];
  
  // Learning rate
  const alpha = 0.1;
  
  // Calculate reward
  let reward = 0;
  if (rating === 'good') {
    reward = 1.0;
  } else if (rating === 'bad') {
    reward = -0.5;
  } else if (rating === 'glitch') {
    reward = -1.0;
  }
  
  // Penalize slow responses
  if (responseTime > 10000) { // > 10 seconds
    reward -= 0.2;
  }
  
  // Update payoff using reinforcement learning
  const newPayoff = currentPayoff + alpha * (reward - currentPayoff);
  PAYOFF_MATRIX[taskType][modelUsed] = Math.max(0, Math.min(1, newPayoff));
  
  console.log(`Updated payoff for ${modelUsed} on ${taskType}: ${currentPayoff.toFixed(3)} -> ${newPayoff.toFixed(3)}`);
}

/**
 * Get current payoff matrix (for debugging/monitoring)
 */
export function getPayoffMatrix(): Record<string, Record<string, number>> {
  return JSON.parse(JSON.stringify(PAYOFF_MATRIX));
}
