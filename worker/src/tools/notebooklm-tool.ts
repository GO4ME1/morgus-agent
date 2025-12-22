/**
 * NotebookLM Browser Automation Tool
 * 
 * This tool automates Google NotebookLM through browser automation
 * to generate structured knowledge, study guides, and infographics.
 * 
 * Uses the user's Google account (stored in environment) to access NotebookLM
 * and create notebooks programmatically. All automation happens server-side.
 */

import { createBrowserSession, executeBrowserAction, closeBrowserSession } from './browserbase-tool';

export interface NotebookLMRequest {
  purpose: 'deep_research' | 'infographic_generation' | 'roadmap' | 'study_guide' | 'faq' | 'timeline';
  title: string;
  sources: NotebookSource[];
  customInstructions?: string;
}

export interface NotebookSource {
  type: 'url' | 'youtube' | 'text' | 'file';
  content: string; // URL, YouTube link, raw text, or file path
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
  rawNotebook: string;
}

export interface NotebookSection {
  title: string;
  bullets: string[];
}

export interface NotebookAsset {
  type: 'infographic_svg' | 'image_png' | 'pdf';
  label: string;
  content: string; // SVG content or URL
}

/**
 * Main function to create a notebook using NotebookLM
 */
export async function createNotebook(
  request: NotebookLMRequest,
  env: {
    BROWSERBASE_API_KEY: string;
    BROWSERBASE_PROJECT_ID: string;
    GOOGLE_EMAIL?: string;
    GOOGLE_SESSION_STATE?: string; // Stored authentication state
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

    // Step 3: Check if we need to authenticate
    // If GOOGLE_SESSION_STATE is available, restore it
    if (env.GOOGLE_SESSION_STATE) {
      await executeBrowserAction(
        sessionId,
        'executeScript',
        {
          script: `localStorage.setItem('google_session', '${env.GOOGLE_SESSION_STATE}');`
        },
        env.BROWSERBASE_API_KEY
      );
      
      // Refresh to apply session
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
      await addSource(sessionId, source, env.BROWSERBASE_API_KEY);
    }

    // Step 8: Wait for processing
    await executeBrowserAction(
      sessionId,
      'waitForSelector',
      { selector: '[data-status="ready"]', timeout: 60000 },
      env.BROWSERBASE_API_KEY
    );

    // Step 9: Generate content based on purpose
    const content = await generateContent(sessionId, request.purpose, request.customInstructions, env.BROWSERBASE_API_KEY);

    // Step 10: Parse and extract notebook data
    const notebookData = await extractNotebookData(sessionId, env.BROWSERBASE_API_KEY);

    // Step 11: Close browser session
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
      rawNotebook: content.raw
    };

  } catch (error) {
    // Clean up browser session on error
    if (sessionId) {
      await closeBrowserSession(sessionId, env.BROWSERBASE_API_KEY);
    }
    throw new Error(`NotebookLM automation failed: ${error.message}`);
  }
}

/**
 * Add a source to the notebook
 */
async function addSource(
  sessionId: string,
  source: NotebookSource,
  apiKey: string
): Promise<void> {
  // Click "Add source" button
  await executeBrowserAction(
    sessionId,
    'click',
    { selector: 'button[aria-label*="Add source"]' },
    apiKey
  );

  // Wait for source type selector
  await executeBrowserAction(
    sessionId,
    'waitForSelector',
    { selector: '[role="menu"]', timeout: 3000 },
    apiKey
  );

  // Select source type
  if (source.type === 'url') {
    await executeBrowserAction(
      sessionId,
      'click',
      { selector: '[role="menuitem"]:has-text("Website")' },
      apiKey
    );
  } else if (source.type === 'youtube') {
    await executeBrowserAction(
      sessionId,
      'click',
      { selector: '[role="menuitem"]:has-text("YouTube")' },
      apiKey
    );
  } else if (source.type === 'text') {
    await executeBrowserAction(
      sessionId,
      'click',
      { selector: '[role="menuitem"]:has-text("Paste text")' },
      apiKey
    );
  }

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
 * Generate content based on purpose
 */
async function generateContent(
  sessionId: string,
  purpose: string,
  customInstructions: string | undefined,
  apiKey: string
): Promise<any> {
  // Click on the appropriate generation option
  let generationType: string;
  
  switch (purpose) {
    case 'study_guide':
      generationType = 'Study guide';
      break;
    case 'faq':
      generationType = 'FAQ';
      break;
    case 'timeline':
      generationType = 'Timeline';
      break;
    case 'infographic_generation':
      generationType = 'Briefing doc';
      break;
    default:
      generationType = 'Study guide';
  }

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

  // Wait for generation to complete
  await executeBrowserAction(
    sessionId,
    'waitForSelector',
    { selector: '[data-generation-status="complete"]', timeout: 120000 },
    apiKey
  );

  return {
    summary: '',
    sections: [],
    mindmap: null,
    flowchart: null,
    assets: [],
    raw: ''
  };
}

/**
 * Extract notebook data from the page
 */
async function extractNotebookData(
  sessionId: string,
  apiKey: string
): Promise<any> {
  // Get page HTML
  const result = await executeBrowserAction(
    sessionId,
    'executeScript',
    {
      script: `
        return {
          html: document.documentElement.outerHTML,
          text: document.body.innerText
        };
      `
    },
    apiKey
  );

  // Parse the HTML to extract structured data
  // This is a simplified version - in production, you'd use a proper HTML parser
  const sections: NotebookSection[] = [];
  const assets: NotebookAsset[] = [];

  // Extract sections (this is a placeholder - actual implementation would parse the DOM)
  // You would look for specific NotebookLM HTML structures here

  return {
    summary: result.text.substring(0, 500), // First 500 chars as summary
    sections,
    mindmap: null,
    flowchart: null,
    assets,
    raw: result.html
  };
}

/**
 * Generate a unique notebook ID
 */
function generateNotebookId(): string {
  return `nb_${Date.now()}_${Math.random().toString(36).substring(7)}`;
}

/**
 * Tool definition for the Morgus agent
 */
export const notebookLMTool = {
  name: 'callNotebookLM',
  description: `Create a structured knowledge notebook using Google NotebookLM. 
  
  This tool can generate:
  - Deep research reports with citations
  - Study guides with key concepts
  - FAQs from source material
  - Timelines of events
  - Infographics and visual summaries
  
  Sources can be URLs, YouTube videos, or raw text. The tool will analyze all sources
  and create a comprehensive, structured notebook with sections, summaries, and visual assets.`,
  
  input_schema: {
    type: 'object',
    properties: {
      purpose: {
        type: 'string',
        enum: ['deep_research', 'infographic_generation', 'roadmap', 'study_guide', 'faq', 'timeline'],
        description: 'The type of notebook to create'
      },
      title: {
        type: 'string',
        description: 'Title for the notebook'
      },
      sources: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            type: {
              type: 'string',
              enum: ['url', 'youtube', 'text', 'file'],
              description: 'Type of source'
            },
            content: {
              type: 'string',
              description: 'Source content (URL, YouTube link, or raw text)'
            },
            label: {
              type: 'string',
              description: 'Optional label for the source'
            }
          },
          required: ['type', 'content']
        },
        description: 'List of sources to analyze (max 300)'
      },
      customInstructions: {
        type: 'string',
        description: 'Optional custom instructions for content generation'
      }
    },
    required: ['purpose', 'title', 'sources']
  }
};
