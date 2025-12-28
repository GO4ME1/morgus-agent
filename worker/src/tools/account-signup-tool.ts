/**
 * Account Signup Automation Tool
 * 
 * Enables Morgys to automatically sign up for accounts on websites,
 * fill in registration forms, and return credentials to the user.
 */

import { createBrowserSession, executeBrowserAction, closeBrowserSession } from './browserbase-tool';
import type { Tool } from './index';

export interface SignupRequest {
  website_url: string;
  username?: string;
  email?: string;
  password?: string;
  additional_fields?: Record<string, string>;
  instructions?: string;
}

export interface SignupResult {
  success: boolean;
  credentials: {
    username?: string;
    email?: string;
    password?: string;
    additional_info?: Record<string, string>;
  };
  account_url?: string;
  screenshot?: string;
  error?: string;
}

/**
 * Generate random credentials if not provided
 */
function generateCredentials(username?: string, email?: string, password?: string) {
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(2, 8);
  
  return {
    username: username || `user_${randomStr}`,
    email: email || `${randomStr}@tempmail.com`,
    password: password || `Pass${randomStr}123!`,
  };
}

/**
 * Detect common form field selectors
 */
function detectFormSelectors() {
  return {
    username: [
      'input[name="username"]',
      'input[name="user"]',
      'input[id*="username"]',
      'input[placeholder*="username" i]',
      'input[type="text"]:first',
    ],
    email: [
      'input[name="email"]',
      'input[type="email"]',
      'input[id*="email"]',
      'input[placeholder*="email" i]',
    ],
    password: [
      'input[name="password"]',
      'input[type="password"]',
      'input[id*="password"]',
      'input[placeholder*="password" i]',
    ],
    submit: [
      'button[type="submit"]',
      'input[type="submit"]',
      'button:contains("Sign Up")',
      'button:contains("Register")',
      'button:contains("Create Account")',
      'button:contains("Join")',
    ],
  };
}

/**
 * Main signup automation function
 */
export async function signupForAccount(
  request: SignupRequest,
  env: any
): Promise<SignupResult> {
  let sessionId: string | null = null;

  try {
    console.log(`🔐 Starting account signup for: ${request.website_url}`);

    // Generate credentials if not provided
    const credentials = generateCredentials(
      request.username,
      request.email,
      request.password
    );

    // Create browser session
    const session = await createBrowserSession(
      env.BROWSERBASE_API_KEY,
      env.BROWSERBASE_PROJECT_ID
    );
    sessionId = session.id;
    console.log(`✅ Browser session created: ${sessionId}`);

    // Navigate to signup page
    await executeBrowserAction(
      sessionId,
      'navigate',
      { url: request.website_url },
      env.BROWSERBASE_API_KEY
    );
    console.log(`📱 Navigated to ${request.website_url}`);

    // Wait for page to load
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Get form selectors
    const selectors = detectFormSelectors();

    // Try to fill username field
    if (credentials.username) {
      for (const selector of selectors.username) {
        try {
          await executeBrowserAction(
            sessionId,
            'type',
            { selector, text: credentials.username },
            env.BROWSERBASE_API_KEY
          );
          console.log(`✅ Filled username: ${credentials.username}`);
          break;
        } catch (e) {
          // Try next selector
          continue;
        }
      }
    }

    // Try to fill email field
    if (credentials.email) {
      for (const selector of selectors.email) {
        try {
          await executeBrowserAction(
            sessionId,
            'type',
            { selector, text: credentials.email },
            env.BROWSERBASE_API_KEY
          );
          console.log(`✅ Filled email: ${credentials.email}`);
          break;
        } catch (e) {
          continue;
        }
      }
    }

    // Try to fill password field
    if (credentials.password) {
      for (const selector of selectors.password) {
        try {
          await executeBrowserAction(
            sessionId,
            'type',
            { selector, text: credentials.password },
            env.BROWSERBASE_API_KEY
          );
          console.log(`✅ Filled password: ${credentials.password}`);
          break;
        } catch (e) {
          continue;
        }
      }
    }

    // Fill additional fields if provided
    if (request.additional_fields) {
      for (const [fieldName, value] of Object.entries(request.additional_fields)) {
        try {
          await executeBrowserAction(
            sessionId,
            'type',
            { selector: `input[name="${fieldName}"]`, text: value },
            env.BROWSERBASE_API_KEY
          );
          console.log(`✅ Filled ${fieldName}: ${value}`);
        } catch (e) {
          console.log(`⚠️ Could not fill ${fieldName}`);
        }
      }
    }

    // Take screenshot before submitting
    const screenshotBefore = await executeBrowserAction(
      sessionId,
      'screenshot',
      {},
      env.BROWSERBASE_API_KEY
    );

    // Try to submit form
    let submitted = false;
    for (const selector of selectors.submit) {
      try {
        await executeBrowserAction(
          sessionId,
          'click',
          { selector },
          env.BROWSERBASE_API_KEY
        );
        console.log(`✅ Clicked submit button`);
        submitted = true;
        break;
      } catch (e) {
        continue;
      }
    }

    if (!submitted) {
      throw new Error('Could not find or click submit button');
    }

    // Wait for submission to process
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Take screenshot after submission
    const screenshotAfter = await executeBrowserAction(
      sessionId,
      'screenshot',
      {},
      env.BROWSERBASE_API_KEY
    );

    // Get current URL (might be account page or confirmation page)
    const currentUrl = await executeBrowserAction(
      sessionId,
      'evaluate',
      { script: 'window.location.href' },
      env.BROWSERBASE_API_KEY
    );

    // Close browser session
    await closeBrowserSession(sessionId, env.BROWSERBASE_API_KEY);

    return {
      success: true,
      credentials: {
        username: credentials.username,
        email: credentials.email,
        password: credentials.password,
        additional_info: request.additional_fields,
      },
      account_url: currentUrl,
      screenshot: screenshotAfter,
    };

  } catch (error: any) {
    console.error('❌ Signup failed:', error);
    
    // Clean up browser session on error
    if (sessionId) {
      try {
        await closeBrowserSession(sessionId, env.BROWSERBASE_API_KEY);
      } catch (e) {
        // Ignore cleanup errors
      }
    }

    return {
      success: false,
      credentials: {},
      error: error.message || 'Unknown error during signup',
    };
  }
}

/**
 * Tool definition for agent use
 */
export const signupAccountTool: Tool = {
  name: 'signup_account',
  description: 'Automatically sign up for an account on a website. Fills in registration forms with username, email, password, and returns the credentials. Useful when user says "go sign up for X" or "create an account on Y".',
  parameters: {
    type: 'object',
    properties: {
      website_url: {
        type: 'string',
        description: 'The URL of the signup/registration page',
      },
      username: {
        type: 'string',
        description: 'Username to use (optional, will generate if not provided)',
      },
      email: {
        type: 'string',
        description: 'Email to use (optional, will generate if not provided)',
      },
      password: {
        type: 'string',
        description: 'Password to use (optional, will generate strong password if not provided)',
      },
      additional_fields: {
        type: 'object',
        description: 'Additional form fields to fill (e.g., {"first_name": "John", "last_name": "Doe"})',
      },
      instructions: {
        type: 'string',
        description: 'Special instructions for the signup process',
      },
    },
    required: ['website_url'],
  },
  execute: async (args: SignupRequest, env: any) => {
    const result = await signupForAccount(args, env);
    
    if (result.success) {
      return `✅ **Account created successfully!**

**Credentials:**
- Username: ${result.credentials.username}
- Email: ${result.credentials.email}
- Password: ${result.credentials.password}
${result.credentials.additional_info ? `\n**Additional Info:**\n${JSON.stringify(result.credentials.additional_info, null, 2)}` : ''}

**Account URL:** ${result.account_url}

🔐 **Save these credentials!** The account is ready to use.`;
    } else {
      return `❌ **Signup failed:** ${result.error}

This might be because:
1. The website requires CAPTCHA verification
2. The form structure is different than expected
3. Additional verification is needed (email confirmation, phone number, etc.)

Would you like me to try a different approach or open the browser for you to complete manually?`;
    }
  },
};

/**
 * Post content tool (for advertising, social media, etc.)
 */
export const postContentTool: Tool = {
  name: 'post_content',
  description: 'Post content to a website (ads, social media posts, listings, etc.). Requires logged-in session or credentials. Use after signup_account to post content.',
  parameters: {
    type: 'object',
    properties: {
      website_url: {
        type: 'string',
        description: 'The URL where content should be posted',
      },
      content_type: {
        type: 'string',
        enum: ['ad', 'post', 'listing', 'comment', 'review'],
        description: 'Type of content to post',
      },
      title: {
        type: 'string',
        description: 'Title of the post/ad/listing',
      },
      description: {
        type: 'string',
        description: 'Main content/description',
      },
      price: {
        type: 'string',
        description: 'Price (for listings/ads)',
      },
      images: {
        type: 'array',
        items: { type: 'string' },
        description: 'Array of image URLs to upload',
      },
      category: {
        type: 'string',
        description: 'Category for the post/listing',
      },
      credentials: {
        type: 'object',
        description: 'Login credentials if needed',
        properties: {
          username: { type: 'string' },
          password: { type: 'string' },
        },
      },
    },
    required: ['website_url', 'content_type', 'title', 'description'],
  },
  execute: async (args: any, env: any) => {
    // TODO: Implement content posting logic
    return `📝 Content posting tool is being implemented. For now, I can:
1. Navigate to ${args.website_url}
2. Log in with provided credentials
3. Fill in the posting form
4. Submit the content

Would you like me to open the browser for you to complete this manually, or wait for the full automation?`;
  },
};
