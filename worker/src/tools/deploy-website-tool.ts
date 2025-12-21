/**
 * Deploy Website Tool - Simplified website deployment
 */

import { Tool } from '../tools';
// Deployment now handled by Fly.io service
type DeploymentFile = { path: string; content: string };

export const deployWebsiteTool: Tool = {
  name: 'deploy_website',
  description: 'Deploy a website to Cloudflare Pages. Use this when user asks to BUILD or CREATE a website. Provide HTML, CSS, and optionally JS files.',
  parameters: {
    type: 'object',
    properties: {
      project_name: {
        type: 'string',
        description: 'Project name (lowercase, hyphens only, e.g., "my-bakery-site")'
      },
      html: {
        type: 'string',
        description: 'Complete HTML content for index.html'
      },
      css: {
        type: 'string',
        description: 'Complete CSS content for style.css'
      },
      js: {
        type: 'string',
        description: 'Optional JavaScript content for script.js'
      }
    },
    required: ['project_name', 'html', 'css']
  },
  execute: async (args: { project_name: string; html: string; css: string; js?: string }, env: any) => {
    try {
      console.log('[DEPLOY_WEBSITE] Starting deployment for:', args.project_name);
      console.log('[DEPLOY_WEBSITE] HTML length:', args.html?.length || 0);
      console.log('[DEPLOY_WEBSITE] CSS length:', args.css?.length || 0);
      console.log('[DEPLOY_WEBSITE] HTML preview (first 200 chars):', args.html?.substring(0, 200));
      
      // VALIDATION: Check for empty or invalid HTML
      if (!args.html || args.html.trim().length === 0) {
        return `❌ **DEPLOYMENT BLOCKED - EMPTY HTML**

The HTML content is empty. This usually happens when:
1. The AI response was truncated due to token limits
2. There was an error generating the HTML

Please try again with a simpler request, or ask me to generate the HTML step by step.`;
      }
      
      // VALIDATION: Check for suspiciously short HTML (likely corrupted)
      if (args.html.trim().length < 50) {
        return `❌ **DEPLOYMENT BLOCKED - INVALID HTML**

The HTML content is too short (${args.html.trim().length} characters). Received: "${args.html.substring(0, 100)}"

This usually happens when the AI response was truncated. Please try again.`;
      }
      
      // VALIDATION: Check if HTML looks valid (should start with DOCTYPE or html tag)
      const htmlTrimmed = args.html.trim().toLowerCase();
      if (!htmlTrimmed.startsWith('<!doctype') && !htmlTrimmed.startsWith('<html') && !htmlTrimmed.startsWith('<')) {
        return `❌ **DEPLOYMENT BLOCKED - MALFORMED HTML**

The HTML content doesn't appear to be valid HTML. It starts with: "${args.html.substring(0, 50)}..."

Please try again and ensure the HTML is properly formatted.`;
      }

      // Validate project name
      const projectName = args.project_name.toLowerCase().replace(/[^a-z0-9-]/g, '-');
      
      // Prepare files
      const files: DeploymentFile[] = [
        { path: 'index.html', content: args.html },
        { path: 'style.css', content: args.css },
      ];

      if (args.js) {
        files.push({ path: 'script.js', content: args.js });
      }

      // Get Cloudflare credentials from environment
      const apiToken = env.CLOUDFLARE_API_TOKEN;
      const accountId = env.CLOUDFLARE_ACCOUNT_ID;

      if (!apiToken || !accountId) {
        throw new Error('Cloudflare credentials not configured in Worker environment');
      }

      // Deploy via Fly.io service
      console.log('[DEPLOY_WEBSITE] Calling deployment service...');
      const response = await fetch('https://morgus-deploy.fly.dev/deploy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectName,
          files,
          apiToken,
          accountId,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Deployment service error: ${error.message || error.error}`);
      }

      const result = await response.json();
      const deploymentUrl = result.productionUrl;

      return `🚀 **WEBSITE DEPLOYED SUCCESSFULLY!**

**Live URL:** ${deploymentUrl}

Your website is now live and accessible worldwide on Cloudflare's global network!

**Files deployed:**
- index.html (${args.html.length} bytes)
- style.css (${args.css.length} bytes)
${args.js ? `- script.js (${args.js.length} bytes)` : ''}

**Next steps:**
- Visit the URL to see your live website
- The site is automatically HTTPS-secured
- Updates can be made by deploying again with the same project name`;

    } catch (error: any) {
      console.error('[DEPLOY_WEBSITE] Error:', error);
      return `❌ **DEPLOYMENT FAILED**

Error: ${error.message}

**Troubleshooting:**
- Check that Cloudflare credentials are configured
- Ensure project name is valid (lowercase, hyphens only)
- Verify HTML and CSS are valid

**Debug info:** ${error.stack || 'No stack trace available'}`;
    }
  }
};
