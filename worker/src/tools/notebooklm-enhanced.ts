/**
 * Enhanced NotebookLM Browser Automation Tool
 * 
 * Improvements over basic version:
 * - Streaming response detection
 * - Response stability checks
 * - Smart response cleaning (removes UI artifacts)
 * - Enhanced selector fallbacks
 * - Audio overview generation
 * - Export capabilities
 */

import { createBrowserSession, executeBrowserAction, closeBrowserSession } from './browserbase-tool';

export interface NotebookLMRequest {
  purpose: 'deep_research' | 'infographic_generation' | 'roadmap' | 'study_guide' | 'faq' | 'timeline' | 'audio_overview';
  title: string;
  sources: NotebookSource[];
  customInstructions?: string;
  generateAudio?: boolean; // Generate audio overview podcast
  exportFormat?: 'pdf' | 'doc' | 'txt';
}

export interface NotebookSource {
  type: 'url' | 'youtube' | 'text' | 'pdf' | 'doc';
  content: string;
  label?: string;
}

export interface NotebookLMResponse {
  notebookId: string;
  title: string;
  summary: string;
  sections: NotebookSection[];
  mindmap?: any;
  flowchart?: any;
  assets: NotebookAsset[];
  audioOverview?: AudioOverview;
  exportedFile?: string; // Base64 encoded file
  rawNotebook: string;
}

export interface NotebookSection {
  title: string;
  bullets: string[];
}

export interface NotebookAsset {
  type: 'infographic_svg' | 'image_png' | 'pdf';
  label: string;
  content: string;
}

export interface AudioOverview {
  audioUrl: string;
  duration: number;
  transcript?: string;
}

/**
 * Enhanced chat selectors with multiple fallbacks
 */
const CHAT_SELECTORS = [
  "textarea[placeholder*='Ask']",
  "textarea[data-testid*='chat']",
  "textarea[aria-label*='message']",
  "[contenteditable='true'][role='textbox']",
  "input[type='text'][placeholder*='Ask']",
  "textarea:not([disabled])",
  "[data-testid='chat-input']",
  "[aria-label='Chat input']",
  ".chat-input textarea",
  "#chat-input"
];

/**
 * Response selectors for extracting AI responses
 */
const RESPONSE_SELECTORS = [
  "[data-testid*='response']",
  "[data-testid*='message']",
  "[role='article']",
  "[class*='message']:last-child",
  "[class*='response']:last-child",
  "[class*='chat-message']:last-child",
  ".message:last-child",
  ".chat-bubble:last-child",
  "[class*='ai-response']",
  "[class*='assistant-message']"
];

/**
 * Streaming indicators to check if response is still generating
 */
const STREAMING_INDICATORS = [
  "[class*='loading']",
  "[class*='typing']",
  "[class*='generating']",
  "[class*='spinner']",
  ".dots",
  "[data-testid='loading']",
  "[aria-label*='loading']"
];

/**
 * UI artifacts to remove from responses
 */
const UI_ARTIFACTS = [
  'copy_all',
  'thumb_up',
  'thumb_down',
  'share',
  'more_options',
  'like',
  'dislike',
  'Copy',
  'Share',
  'Like',
  'Dislike'
];

/**
 * AI response indicators to detect start of AI content
 */
const AI_RESPONSE_INDICATORS = [
  'Based on',
  'According to',
  "Here's",
  'Let me',
  'I can',
  'The answer',
  'To answer',
  'In summary',
  'From the sources'
];

/**
 * Main function to create a notebook using NotebookLM
 */
export async function createNotebookEnhanced(
  request: NotebookLMRequest,
  env: {
    BROWSERBASE_API_KEY: string;
    BROWSERBASE_PROJECT_ID: string;
    GOOGLE_EMAIL?: string;
    GOOGLE_SESSION_STATE?: string;
  }
): Promise<NotebookLMResponse> {
  let sessionId: string | null = null;

  try {
    // Step 1: Create browser session
    const session = await createBrowserSession(
      env.BROWSERBASE_API_KEY,
      env.BROWSERBASE_PROJECT_ID
    );
    sessionId = session.id;

    // Step 2: Navigate to NotebookLM
    await executeBrowserAction(
      sessionId,
      'navigate',
      { url: 'https://notebooklm.google.com' },
      env.BROWSERBASE_API_KEY
    );

    // Step 3: Restore session if available
    if (env.GOOGLE_SESSION_STATE) {
      await executeBrowserAction(
        sessionId,
        'executeScript',
        {
          script: `localStorage.setItem('google_session', '${env.GOOGLE_SESSION_STATE}');`
        },
        env.BROWSERBASE_API_KEY
      );
      
      await executeBrowserAction(
        sessionId,
        'navigate',
        { url: 'https://notebooklm.google.com' },
        env.BROWSERBASE_API_KEY
      );
    }

    // Step 4: Wait for page to load
    await executeBrowserAction(
      sessionId,
      'waitForSelector',
      { selector: 'button[aria-label*="Create"]', timeout: 10000 },
      env.BROWSERBASE_API_KEY
    );

    // Step 5: Create new notebook
    await executeBrowserAction(
      sessionId,
      'click',
      { selector: 'button[aria-label*="Create"]' },
      env.BROWSERBASE_API_KEY
    );

    // Step 6: Set notebook title
    await executeBrowserAction(
      sessionId,
      'waitForSelector',
      { selector: 'input[placeholder*="title"]', timeout: 5000 },
      env.BROWSERBASE_API_KEY
    );

    await executeBrowserAction(
      sessionId,
      'type',
      { selector: 'input[placeholder*="title"]', text: request.title },
      env.BROWSERBASE_API_KEY
    );

    // Step 7: Add sources
    for (const source of request.sources) {
      await addSourceEnhanced(sessionId, source, env.BROWSERBASE_API_KEY);
    }

    // Step 8: Wait for processing with stability check
    await waitForProcessingComplete(sessionId, env.BROWSERBASE_API_KEY);

    // Step 9: Generate content based on purpose
    const content = await generateContentEnhanced(
      sessionId,
      request.purpose,
      request.customInstructions,
      env.BROWSERBASE_API_KEY
    );

    // Step 10: Generate audio overview if requested
    let audioOverview: AudioOverview | undefined;
    if (request.generateAudio) {
      audioOverview = await generateAudioOverview(sessionId, env.BROWSERBASE_API_KEY);
    }

    // Step 11: Export if requested
    let exportedFile: string | undefined;
    if (request.exportFormat) {
      exportedFile = await exportContent(sessionId, request.exportFormat, env.BROWSERBASE_API_KEY);
    }

    // Step 12: Parse and extract notebook data
    const notebookData = await extractNotebookDataEnhanced(sessionId, env.BROWSERBASE_API_KEY);

    // Step 13: Close browser session
    if (sessionId) {
      await closeBrowserSession(sessionId, env.BROWSERBASE_API_KEY);
    }

    return {
      notebookId: generateNotebookId(),
      title: request.title,
      summary: content.summary,
      sections: content.sections,
      mindmap: content.mindmap,
      flowchart: content.flowchart,
      assets: content.assets,
      audioOverview,
      exportedFile,
      rawNotebook: content.raw
    };

  } catch (error) {
    if (sessionId) {
      await closeBrowserSession(sessionId, env.BROWSERBASE_API_KEY);
    }
    throw new Error(`NotebookLM automation failed: ${error.message}`);
  }
}

/**
 * Enhanced source adding with better error handling
 */
async function addSourceEnhanced(
  sessionId: string,
  source: NotebookSource,
  apiKey: string
): Promise<void> {
  // Try multiple selectors for "Add source" button
  const addSourceSelectors = [
    'button[aria-label*="Add source"]',
    'button:has-text("Add source")',
    '[data-testid="add-source"]',
    'button[class*="add-source"]'
  ];

  let clicked = false;
  for (const selector of addSourceSelectors) {
    try {
      await executeBrowserAction(
        sessionId,
        'click',
        { selector },
        apiKey
      );
      clicked = true;
      break;
    } catch (e) {
      continue;
    }
  }

  if (!clicked) {
    throw new Error('Could not find "Add source" button');
  }

  // Wait for source type selector
  await executeBrowserAction(
    sessionId,
    'waitForSelector',
    { selector: '[role="menu"]', timeout: 3000 },
    apiKey
  );

  // Select source type
  const typeMap: Record<string, string> = {
    url: 'Website',
    youtube: 'YouTube',
    text: 'Paste text',
    pdf: 'Upload PDF',
    doc: 'Upload document'
  };

  await executeBrowserAction(
    sessionId,
    'click',
    { selector: `[role="menuitem"]:has-text("${typeMap[source.type]}")` },
    apiKey
  );

  // Enter source content
  await executeBrowserAction(
    sessionId,
    'waitForSelector',
    { selector: 'input[type="url"], textarea', timeout: 3000 },
    apiKey
  );

  await executeBrowserAction(
    sessionId,
    'type',
    { selector: 'input[type="url"], textarea', text: source.content },
    apiKey
  );

  // Click "Insert" or "Add" button
  await executeBrowserAction(
    sessionId,
    'click',
    { selector: 'button:has-text("Insert"), button:has-text("Add")' },
    apiKey
  );

  // Wait for source to be added
  await executeBrowserAction(
    sessionId,
    'waitForTimeout',
    { timeout: 2000 },
    apiKey
  );
}

/**
 * Wait for processing to complete with stability checks
 */
async function waitForProcessingComplete(
  sessionId: string,
  apiKey: string,
  maxWait: number = 60
): Promise<void> {
  const startTime = Date.now();
  let stableCount = 0;
  const requiredStableChecks = 3;

  while ((Date.now() - startTime) / 1000 < maxWait) {
    // Check if still processing
    const isProcessing = await checkIfProcessing(sessionId, apiKey);
    
    if (!isProcessing) {
      stableCount++;
      if (stableCount >= requiredStableChecks) {
        return; // Processing complete
      }
    } else {
      stableCount = 0;
    }

    // Wait 1 second before next check
    await executeBrowserAction(
      sessionId,
      'waitForTimeout',
      { timeout: 1000 },
      apiKey
    );
  }

  throw new Error('Processing timeout - sources may still be processing');
}

/**
 * Check if NotebookLM is still processing sources
 */
async function checkIfProcessing(
  sessionId: string,
  apiKey: string
): Promise<boolean> {
  const processingIndicators = [
    '[data-status="processing"]',
    '[aria-label*="processing"]',
    '[class*="processing"]',
    '.spinner',
    '[class*="loading"]'
  ];

  for (const indicator of processingIndicators) {
    try {
      const result = await executeBrowserAction(
        sessionId,
        'querySelector',
        { selector: indicator },
        apiKey
      );
      if (result) return true;
    } catch (e) {
      continue;
    }
  }

  return false;
}

/**
 * Enhanced content generation with streaming detection
 */
async function generateContentEnhanced(
  sessionId: string,
  purpose: string,
  customInstructions: string | undefined,
  apiKey: string
): Promise<any> {
  const generationType = getGenerationType(purpose);

  // Find and click the generation button
  await executeBrowserAction(
    sessionId,
    'click',
    { selector: `button:has-text("${generationType}")` },
    apiKey
  );

  // If custom instructions provided, enter them
  if (customInstructions) {
    await executeBrowserAction(
      sessionId,
      'waitForSelector',
      { selector: 'textarea[placeholder*="instructions"]', timeout: 3000 },
      apiKey
    );

    await executeBrowserAction(
      sessionId,
      'type',
      { selector: 'textarea[placeholder*="instructions"]', text: customInstructions },
      apiKey
    );
  }

  // Wait for generation to complete with streaming detection
  const response = await waitForStreamingComplete(sessionId, apiKey);

  // Clean and parse the response
  const cleanedResponse = cleanResponse(response);

  return parseNotebookContent(cleanedResponse);
}

/**
 * Wait for streaming response to complete
 */
async function waitForStreamingComplete(
  sessionId: string,
  apiKey: string,
  maxWait: number = 120
): Promise<string> {
  const startTime = Date.now();
  let lastResponse = "";
  let stableCount = 0;
  const requiredStableChecks = 3;

  while ((Date.now() - startTime) / 1000 < maxWait) {
    // Get current response
    const currentResponse = await getCurrentResponse(sessionId, apiKey);

    // Check if response is stable
    if (currentResponse === lastResponse) {
      stableCount++;
      
      // Check if still streaming
      const isStreaming = await checkIfStreaming(sessionId, apiKey);
      
      if (!isStreaming && stableCount >= requiredStableChecks) {
        return currentResponse; // Response complete
      }
    } else {
      stableCount = 0;
      lastResponse = currentResponse;
    }

    // Wait 1 second before next check
    await executeBrowserAction(
      sessionId,
      'waitForTimeout',
      { timeout: 1000 },
      apiKey
    );
  }

  return lastResponse || "Response timeout - no content retrieved";
}

/**
 * Check if response is still streaming
 */
async function checkIfStreaming(
  sessionId: string,
  apiKey: string
): Promise<boolean> {
  for (const indicator of STREAMING_INDICATORS) {
    try {
      const result = await executeBrowserAction(
        sessionId,
        'querySelector',
        { selector: indicator },
        apiKey
      );
      if (result) return true;
    } catch (e) {
      continue;
    }
  }
  return false;
}

/**
 * Get current response text with multiple fallback selectors
 */
async function getCurrentResponse(
  sessionId: string,
  apiKey: string
): Promise<string> {
  let bestResponse = "";

  for (const selector of RESPONSE_SELECTORS) {
    try {
      const result = await executeBrowserAction(
        sessionId,
        'textContent',
        { selector },
        apiKey
      );
      
      if (result && result.length > bestResponse.length) {
        bestResponse = result;
      }
    } catch (e) {
      continue;
    }
  }

  return bestResponse;
}

/**
 * Clean response text by removing UI artifacts and extracting AI content
 */
function cleanResponse(text: string): string {
  if (!text) return text;

  // Remove UI artifacts
  for (const artifact of UI_ARTIFACTS) {
    text = text.replace(new RegExp(artifact, 'gi'), '');
  }

  // Split into lines
  const lines = text.split('\n').filter(line => {
    const cleaned = line.trim().toLowerCase();
    // Skip lines that are just UI artifacts
    return !UI_ARTIFACTS.some(artifact => 
      cleaned === artifact.toLowerCase() && cleaned.length < 50
    );
  });

  // Find AI response start
  let startIndex = 0;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (AI_RESPONSE_INDICATORS.some(indicator => line.includes(indicator))) {
      startIndex = i;
      break;
    } else if (line.length > 50 && !line.endsWith('?')) {
      startIndex = i;
      break;
    }
  }

  // Join from AI response start
  let cleaned = lines.slice(startIndex).join('\n').trim();

  // If still no good content, try paragraph approach
  if (!cleaned || cleaned.length < 50) {
    const paragraphs = text.split('\n\n');
    for (const paragraph of paragraphs) {
      if (paragraph.trim().length > 100) {
        cleaned = paragraph.trim();
        break;
      }
    }
  }

  return cleaned || text;
}

/**
 * Generate audio overview (NotebookLM's podcast feature)
 */
async function generateAudioOverview(
  sessionId: string,
  apiKey: string
): Promise<AudioOverview> {
  // Click "Generate audio overview" button
  const audioButtonSelectors = [
    'button:has-text("Generate audio overview")',
    'button[aria-label*="audio overview"]',
    '[data-testid="generate-audio"]'
  ];

  let clicked = false;
  for (const selector of audioButtonSelectors) {
    try {
      await executeBrowserAction(
        sessionId,
        'click',
        { selector },
        apiKey
      );
      clicked = true;
      break;
    } catch (e) {
      continue;
    }
  }

  if (!clicked) {
    throw new Error('Could not find "Generate audio overview" button');
  }

  // Wait for audio generation (can take 2-5 minutes)
  await waitForAudioGeneration(sessionId, apiKey, 300); // 5 min max

  // Extract audio URL
  const audioUrl = await extractAudioUrl(sessionId, apiKey);

  return {
    audioUrl,
    duration: 0, // Would need to fetch audio to get duration
    transcript: undefined // NotebookLM doesn't provide transcript directly
  };
}

/**
 * Wait for audio generation to complete
 */
async function waitForAudioGeneration(
  sessionId: string,
  apiKey: string,
  maxWait: number = 300
): Promise<void> {
  const startTime = Date.now();

  while ((Date.now() - startTime) / 1000 < maxWait) {
    // Check if audio is ready
    const audioReady = await checkIfAudioReady(sessionId, apiKey);
    if (audioReady) return;

    // Wait 5 seconds before next check (audio generation is slow)
    await executeBrowserAction(
      sessionId,
      'waitForTimeout',
      { timeout: 5000 },
      apiKey
    );
  }

  throw new Error('Audio generation timeout');
}

/**
 * Check if audio overview is ready
 */
async function checkIfAudioReady(
  sessionId: string,
  apiKey: string
): Promise<boolean> {
  const readySelectors = [
    'audio[src]',
    '[data-audio-status="ready"]',
    'button:has-text("Play audio")',
    '[aria-label*="Play audio"]'
  ];

  for (const selector of readySelectors) {
    try {
      const result = await executeBrowserAction(
        sessionId,
        'querySelector',
        { selector },
        apiKey
      );
      if (result) return true;
    } catch (e) {
      continue;
    }
  }

  return false;
}

/**
 * Extract audio URL from page
 */
async function extractAudioUrl(
  sessionId: string,
  apiKey: string
): Promise<string> {
  try {
    const result = await executeBrowserAction(
      sessionId,
      'getAttribute',
      { selector: 'audio[src]', attribute: 'src' },
      apiKey
    );
    return result || '';
  } catch (e) {
    throw new Error('Could not extract audio URL');
  }
}

/**
 * Export notebook content
 */
async function exportContent(
  sessionId: string,
  format: 'pdf' | 'doc' | 'txt',
  apiKey: string
): Promise<string> {
  // Click export/download button
  const exportSelectors = [
    'button:has-text("Export")',
    'button:has-text("Download")',
    'button[aria-label*="export"]',
    '[data-testid="export-button"]'
  ];

  let clicked = false;
  for (const selector of exportSelectors) {
    try {
      await executeBrowserAction(
        sessionId,
        'click',
        { selector },
        apiKey
      );
      clicked = true;
      break;
    } catch (e) {
      continue;
    }
  }

  if (!clicked) {
    throw new Error('Could not find export button');
  }

  // Select format
  const formatMap: Record<string, string> = {
    pdf: 'PDF',
    doc: 'Word',
    txt: 'Text'
  };

  await executeBrowserAction(
    sessionId,
    'click',
    { selector: `button:has-text("${formatMap[format]}")` },
    apiKey
  );

  // Wait for download
  await executeBrowserAction(
    sessionId,
    'waitForTimeout',
    { timeout: 3000 },
    apiKey
  );

  // Get downloaded file (would need to implement file download handling)
  return ""; // Placeholder - would return base64 encoded file
}

/**
 * Enhanced notebook data extraction
 */
async function extractNotebookDataEnhanced(
  sessionId: string,
  apiKey: string
): Promise<any> {
  // Extract all text content
  const content = await executeBrowserAction(
    sessionId,
    'textContent',
    { selector: 'body' },
    apiKey
  );

  return {
    raw: cleanResponse(content)
  };
}

/**
 * Helper functions
 */
function getGenerationType(purpose: string): string {
  const map: Record<string, string> = {
    study_guide: 'Study guide',
    faq: 'FAQ',
    timeline: 'Timeline',
    infographic_generation: 'Briefing doc',
    deep_research: 'Study guide',
    roadmap: 'Timeline'
  };
  return map[purpose] || 'Study guide';
}

function generateNotebookId(): string {
  return `nb_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function parseNotebookContent(content: string): any {
  // Parse the cleaned content into structured format
  const sections: NotebookSection[] = [];
  const lines = content.split('\n');
  
  let currentSection: NotebookSection | null = null;
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    // Detect section headers (lines that look like titles)
    if (trimmed.length > 0 && trimmed.length < 100 && !trimmed.startsWith('-') && !trimmed.startsWith('•')) {
      if (currentSection) {
        sections.push(currentSection);
      }
      currentSection = {
        title: trimmed,
        bullets: []
      };
    } else if (currentSection && (trimmed.startsWith('-') || trimmed.startsWith('•'))) {
      currentSection.bullets.push(trimmed.substring(1).trim());
    }
  }
  
  if (currentSection) {
    sections.push(currentSection);
  }

  return {
    summary: content.substring(0, 500),
    sections,
    mindmap: null,
    flowchart: null,
    assets: [],
    raw: content
  };
}
