/**
 * Query Categorization Service
 * Analyzes user queries to categorize them for better model routing and analytics
 */

export interface QueryCategory {
  primary: string;           // Main category: coding, research, creative, math, analysis, conversation, task
  secondary?: string;        // Sub-category for more granular tracking
  complexity: 'simple' | 'medium' | 'complex';
  intent: 'question' | 'instruction' | 'conversation' | 'creation';
  domain?: string;           // Domain-specific: finance, science, tech, etc.
  requiresReasoning: boolean;
  requiresCreativity: boolean;
  requiresFactualAccuracy: boolean;
  estimatedTokens: 'short' | 'medium' | 'long';
  confidence: number;        // 0-1 confidence in categorization
}

export interface QueryMetadata {
  wordCount: number;
  hasCode: boolean;
  hasNumbers: boolean;
  hasUrls: boolean;
  questionType?: 'what' | 'how' | 'why' | 'when' | 'where' | 'who' | 'which' | 'other';
  language: string;
  sentiment: 'positive' | 'neutral' | 'negative';
}

// Category patterns for classification
const CATEGORY_PATTERNS: Record<string, RegExp[]> = {
  coding: [
    /\b(code|function|class|method|variable|debug|error|bug|programming|python|javascript|typescript|java|c\+\+|rust|go|sql|html|css|api|endpoint|database|query|algorithm|data structure)\b/i,
    /\b(write|create|build|implement|fix|refactor|optimize)\b.*\b(code|function|script|program|app|application)\b/i,
    /```[\s\S]*```/,  // Code blocks
    /\b(npm|pip|yarn|git|docker|kubernetes)\b/i,
  ],
  research: [
    /\b(research|find|search|look up|information about|tell me about|what is|who is|explain|define|describe)\b/i,
    /\b(history|background|overview|summary|facts|statistics|data)\b/i,
    /\b(compare|contrast|difference between|similarities)\b/i,
  ],
  creative: [
    /\b(write|create|compose|generate|draft|brainstorm)\b.*\b(story|poem|essay|article|blog|content|copy|script|dialogue)\b/i,
    /\b(creative|imaginative|fiction|narrative|character|plot)\b/i,
    /\b(marketing|slogan|tagline|headline|caption)\b/i,
  ],
  math: [
    /\b(calculate|compute|solve|equation|formula|math|mathematics|algebra|calculus|geometry|statistics|probability)\b/i,
    /\b(\d+\s*[\+\-\*\/\^]\s*\d+|\d+%|\$\d+)\b/,  // Math expressions
    /\b(sum|average|mean|median|total|percentage|ratio|fraction)\b/i,
  ],
  analysis: [
    /\b(analyze|analyse|evaluate|assess|review|examine|investigate|interpret)\b/i,
    /\b(data|trends|patterns|insights|metrics|performance|results)\b/i,
    /\b(pros and cons|advantages|disadvantages|benefits|drawbacks)\b/i,
  ],
  task: [
    /\b(help me|can you|please|need to|want to|how do i|how can i)\b/i,
    /\b(schedule|plan|organize|manage|track|list|todo|reminder)\b/i,
    /\b(email|message|letter|document|report|presentation)\b/i,
  ],
  conversation: [
    /^(hi|hello|hey|thanks|thank you|bye|goodbye|good morning|good evening)\b/i,
    /\b(how are you|what do you think|your opinion|agree|disagree)\b/i,
    /^.{1,30}$/,  // Very short messages often conversational
  ],
};

// Domain patterns
const DOMAIN_PATTERNS: Record<string, RegExp[]> = {
  finance: [/\b(stock|investment|trading|portfolio|market|crypto|bitcoin|ethereum|forex|dividend|roi|revenue|profit)\b/i],
  science: [/\b(biology|chemistry|physics|experiment|hypothesis|scientific|research|study|molecule|atom|cell)\b/i],
  technology: [/\b(software|hardware|computer|internet|ai|machine learning|cloud|server|network|cybersecurity)\b/i],
  health: [/\b(health|medical|doctor|symptom|disease|treatment|medicine|therapy|diagnosis|patient)\b/i],
  legal: [/\b(law|legal|contract|agreement|court|attorney|lawyer|regulation|compliance|liability)\b/i],
  education: [/\b(learn|study|course|class|student|teacher|school|university|degree|curriculum)\b/i],
  business: [/\b(business|company|startup|entrepreneur|management|strategy|marketing|sales|customer|client)\b/i],
};

// Question type patterns
const QUESTION_PATTERNS: Record<string, RegExp> = {
  what: /^what\b/i,
  how: /^how\b/i,
  why: /^why\b/i,
  when: /^when\b/i,
  where: /^where\b/i,
  who: /^who\b/i,
  which: /^which\b/i,
};

/**
 * Categorize a user query
 */
export function categorizeQuery(message: string, hasFiles: boolean = false, fileTypes: string[] = []): QueryCategory {
  const metadata = extractMetadata(message);
  
  // Determine primary category
  let primaryCategory = 'conversation';
  let maxMatches = 0;
  let confidence = 0.5;
  
  for (const [category, patterns] of Object.entries(CATEGORY_PATTERNS)) {
    const matches = patterns.filter(p => p.test(message)).length;
    if (matches > maxMatches) {
      maxMatches = matches;
      primaryCategory = category;
      confidence = Math.min(0.5 + (matches * 0.15), 0.95);
    }
  }
  
  // Adjust for files
  if (hasFiles) {
    if (fileTypes.some(t => t.includes('image'))) {
      primaryCategory = 'analysis';
      confidence = Math.max(confidence, 0.7);
    } else if (fileTypes.some(t => t.includes('pdf') || t.includes('document'))) {
      primaryCategory = 'research';
      confidence = Math.max(confidence, 0.7);
    }
  }
  
  // Determine complexity
  const complexity = determineComplexity(message, metadata, primaryCategory);
  
  // Determine intent
  const intent = determineIntent(message, metadata);
  
  // Determine domain
  let domain: string | undefined;
  for (const [d, patterns] of Object.entries(DOMAIN_PATTERNS)) {
    if (patterns.some(p => p.test(message))) {
      domain = d;
      break;
    }
  }
  
  // Determine requirements
  const requiresReasoning = ['analysis', 'math', 'coding'].includes(primaryCategory) || 
    complexity === 'complex' ||
    /\b(why|explain|reason|logic|think|consider)\b/i.test(message);
    
  const requiresCreativity = primaryCategory === 'creative' ||
    /\b(creative|imaginative|unique|original|innovative)\b/i.test(message);
    
  const requiresFactualAccuracy = ['research', 'math', 'analysis'].includes(primaryCategory) ||
    /\b(fact|accurate|correct|true|verify|source)\b/i.test(message);
  
  // Estimate response length
  const estimatedTokens = estimateResponseLength(message, primaryCategory, complexity);
  
  return {
    primary: primaryCategory,
    secondary: getSecondaryCategory(message, primaryCategory),
    complexity,
    intent,
    domain,
    requiresReasoning,
    requiresCreativity,
    requiresFactualAccuracy,
    estimatedTokens,
    confidence,
  };
}

/**
 * Extract metadata from the query
 */
export function extractMetadata(message: string): QueryMetadata {
  const words = message.split(/\s+/).filter(w => w.length > 0);
  
  // Detect question type
  let questionType: QueryMetadata['questionType'];
  for (const [type, pattern] of Object.entries(QUESTION_PATTERNS)) {
    if (pattern.test(message.trim())) {
      questionType = type as QueryMetadata['questionType'];
      break;
    }
  }
  if (!questionType && message.includes('?')) {
    questionType = 'other';
  }
  
  // Simple sentiment detection
  const positiveWords = /\b(good|great|awesome|excellent|love|thanks|helpful|amazing)\b/i;
  const negativeWords = /\b(bad|terrible|awful|hate|frustrated|annoying|broken|wrong)\b/i;
  let sentiment: QueryMetadata['sentiment'] = 'neutral';
  if (positiveWords.test(message)) sentiment = 'positive';
  if (negativeWords.test(message)) sentiment = 'negative';
  
  return {
    wordCount: words.length,
    hasCode: /```|`[^`]+`|\b(function|const|let|var|class|def|import)\b/.test(message),
    hasNumbers: /\d+/.test(message),
    hasUrls: /https?:\/\/[^\s]+/.test(message),
    questionType,
    language: 'en', // Could be enhanced with language detection
    sentiment,
  };
}

/**
 * Determine query complexity
 */
function determineComplexity(
  message: string, 
  metadata: QueryMetadata, 
  category: string
): 'simple' | 'medium' | 'complex' {
  let complexityScore = 0;
  
  // Word count factor
  if (metadata.wordCount > 100) complexityScore += 2;
  else if (metadata.wordCount > 50) complexityScore += 1;
  
  // Code presence
  if (metadata.hasCode) complexityScore += 1;
  
  // Multiple questions
  const questionMarks = (message.match(/\?/g) || []).length;
  if (questionMarks > 2) complexityScore += 1;
  
  // Complex keywords
  if (/\b(analyze|evaluate|compare|design|architect|optimize|debug|refactor)\b/i.test(message)) {
    complexityScore += 1;
  }
  
  // Multi-step indicators
  if (/\b(then|after that|next|finally|step by step|first.*then)\b/i.test(message)) {
    complexityScore += 1;
  }
  
  // Category-based adjustment
  if (['coding', 'analysis', 'math'].includes(category)) {
    complexityScore += 1;
  }
  
  if (complexityScore >= 4) return 'complex';
  if (complexityScore >= 2) return 'medium';
  return 'simple';
}

/**
 * Determine user intent
 */
function determineIntent(
  message: string, 
  metadata: QueryMetadata
): 'question' | 'instruction' | 'conversation' | 'creation' {
  if (metadata.questionType) return 'question';
  
  if (/^(create|write|generate|make|build|design|draft)\b/i.test(message.trim())) {
    return 'creation';
  }
  
  if (/^(please|can you|could you|help me|i need|i want)\b/i.test(message.trim())) {
    return 'instruction';
  }
  
  if (message.length < 50 && /^(hi|hello|hey|thanks|ok|sure|yes|no)\b/i.test(message.trim())) {
    return 'conversation';
  }
  
  return 'instruction';
}

/**
 * Get secondary category for more granular tracking
 */
function getSecondaryCategory(message: string, primary: string): string | undefined {
  const secondaryPatterns: Record<string, Record<string, RegExp>> = {
    coding: {
      'web-development': /\b(html|css|javascript|react|vue|angular|frontend|backend|api|rest|graphql)\b/i,
      'data-science': /\b(python|pandas|numpy|machine learning|ml|ai|data|model|training)\b/i,
      'devops': /\b(docker|kubernetes|ci\/cd|deployment|aws|azure|gcp|cloud)\b/i,
      'mobile': /\b(ios|android|react native|flutter|mobile app)\b/i,
      'database': /\b(sql|mysql|postgres|mongodb|database|query|schema)\b/i,
    },
    research: {
      'academic': /\b(paper|study|journal|research|academic|citation|peer review)\b/i,
      'market': /\b(market|industry|competitor|trend|forecast|analysis)\b/i,
      'general': /\b(what is|who is|tell me about|explain|define)\b/i,
    },
    creative: {
      'writing': /\b(story|article|blog|essay|content|copy)\b/i,
      'marketing': /\b(marketing|ad|advertisement|campaign|slogan|brand)\b/i,
      'social': /\b(social media|post|tweet|caption|instagram|linkedin)\b/i,
    },
  };
  
  const patterns = secondaryPatterns[primary];
  if (!patterns) return undefined;
  
  for (const [secondary, pattern] of Object.entries(patterns)) {
    if (pattern.test(message)) {
      return secondary;
    }
  }
  
  return undefined;
}

/**
 * Estimate expected response length
 */
function estimateResponseLength(
  message: string, 
  category: string, 
  complexity: 'simple' | 'medium' | 'complex'
): 'short' | 'medium' | 'long' {
  // Explicit length requests
  if (/\b(brief|short|quick|concise|summary|tldr)\b/i.test(message)) return 'short';
  if (/\b(detailed|comprehensive|thorough|in-depth|explain fully)\b/i.test(message)) return 'long';
  
  // Category-based defaults
  if (category === 'conversation') return 'short';
  if (category === 'creative') return 'long';
  
  // Complexity-based
  if (complexity === 'complex') return 'long';
  if (complexity === 'simple') return 'short';
  
  return 'medium';
}

/**
 * Get model recommendation based on category
 */
export function getModelRecommendation(category: QueryCategory): {
  recommendedModels: string[];
  reason: string;
} {
  const recommendations: Record<string, { models: string[]; reason: string }> = {
    coding: {
      models: ['gpt-4o', 'claude-3-sonnet', 'gemini-2.0-flash-exp'],
      reason: 'Strong code generation and debugging capabilities',
    },
    research: {
      models: ['gemini-2.0-flash-exp', 'gpt-4o-mini', 'claude-3-haiku'],
      reason: 'Fast information retrieval and synthesis',
    },
    creative: {
      models: ['claude-3-sonnet', 'gpt-4o', 'gemini-2.0-flash-exp'],
      reason: 'Strong creative writing and ideation',
    },
    math: {
      models: ['gpt-4o', 'claude-3-sonnet', 'gemini-2.0-flash-exp'],
      reason: 'Accurate mathematical reasoning',
    },
    analysis: {
      models: ['gpt-4o', 'claude-3-sonnet', 'gemini-2.0-flash-exp'],
      reason: 'Strong analytical and reasoning capabilities',
    },
    task: {
      models: ['gpt-4o-mini', 'gemini-2.0-flash-exp', 'claude-3-haiku'],
      reason: 'Efficient task completion',
    },
    conversation: {
      models: ['gemini-2.0-flash-exp', 'gpt-4o-mini', 'claude-3-haiku'],
      reason: 'Fast, natural conversational responses',
    },
  };
  
  const rec = recommendations[category.primary] || recommendations.conversation;
  
  // Adjust for complexity
  if (category.complexity === 'complex') {
    // Prefer more capable models for complex tasks
    return {
      recommendedModels: ['gpt-4o', 'claude-3-sonnet', rec.models[0]],
      reason: rec.reason + ' (upgraded for complexity)',
    };
  }
  
  return {
    recommendedModels: rec.models,
    reason: rec.reason,
  };
}
