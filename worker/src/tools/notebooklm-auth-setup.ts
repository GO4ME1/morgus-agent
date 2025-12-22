/**
 * NotebookLM Authentication Setup
 * 
 * This script helps set up Google authentication for NotebookLM automation.
 * Run this once to store the authentication state in environment variables.
 * 
 * Usage:
 *   npx tsx worker/src/tools/notebooklm-auth-setup.ts
 */

import { createBrowserSession, executeBrowserAction, closeBrowserSession } from './browserbase-tool';

export async function setupGoogleAuth(
  browserbaseApiKey: string,
  browserbaseProjectId: string
): Promise<string> {
  let sessionId: string | null = null;

  try {
    console.log('🔐 Setting up Google authentication for NotebookLM...');
    
    // Create browser session
    const session = await createBrowserSession(browserbaseApiKey, browserbaseProjectId);
    sessionId = session.id;
    console.log(`✅ Browser session created: ${sessionId}`);

    // Navigate to NotebookLM
    await executeBrowserAction(
      sessionId,
      'navigate',
      { url: 'https://notebooklm.google.com' },
      browserbaseApiKey
    );
    console.log('📱 Navigated to NotebookLM');

    // Wait for user to log in manually
    console.log('\n⏳ Please log in to your Google account in the browser...');
    console.log('   The browser should open automatically.');
    console.log('   After logging in, press ENTER here to continue.\n');

    // In a real implementation, you would:
    // 1. Display the debugger URL from the session
    // 2. Wait for user input
    // 3. Extract the session state

    // For now, we'll wait for a manual confirmation
    await new Promise(resolve => {
      process.stdin.once('data', resolve);
    });

    // Extract session state
    const sessionState = await executeBrowserAction(
      sessionId,
      'executeScript',
      {
        script: `
          return JSON.stringify({
            cookies: document.cookie,
            localStorage: Object.entries(localStorage),
            sessionStorage: Object.entries(sessionStorage)
          });
        `
      },
      browserbaseApiKey
    );

    console.log('\n✅ Authentication state captured!');
    console.log('\n📋 Add this to your environment variables:');
    console.log(`GOOGLE_SESSION_STATE="${sessionState}"`);

    // Close browser
    await closeBrowserSession(sessionId, browserbaseApiKey);

    return sessionState;

  } catch (error) {
    console.error('❌ Authentication setup failed:', error);
    if (sessionId) {
      await closeBrowserSession(sessionId, browserbaseApiKey);
    }
    throw error;
  }
}

// CLI execution
if (require.main === module) {
  const BROWSERBASE_API_KEY = process.env.BROWSERBASE_API_KEY;
  const BROWSERBASE_PROJECT_ID = process.env.BROWSERBASE_PROJECT_ID;

  if (!BROWSERBASE_API_KEY || !BROWSERBASE_PROJECT_ID) {
    console.error('❌ Missing required environment variables:');
    console.error('   BROWSERBASE_API_KEY');
    console.error('   BROWSERBASE_PROJECT_ID');
    process.exit(1);
  }

  setupGoogleAuth(BROWSERBASE_API_KEY, BROWSERBASE_PROJECT_ID)
    .then(() => {
      console.log('\n✨ Setup complete!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Setup failed:', error.message);
      process.exit(1);
    });
}
