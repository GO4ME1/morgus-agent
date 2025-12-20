import { Tool } from './base';

interface DeployWebsiteArgs {
  projectName: string;
  html: string;
  css?: string;
  javascript?: string;
}

export class DeployWebsiteServiceTool extends Tool<DeployWebsiteArgs> {
  name = 'deploy_website';
  description = `Deploy a website to Cloudflare Pages. Takes HTML, CSS, and JavaScript content and deploys it to a live URL.
  
Use this when the user asks to:
- Build a website
- Create a landing page
- Make a web app
- Deploy a site

The website will be instantly live on Cloudflare Pages with HTTPS.`;

  schema = {
    type: 'object' as const,
    properties: {
      projectName: {
        type: 'string',
        description: 'Project name (lowercase, hyphens only, e.g. "my-website")',
      },
      html: {
        type: 'string',
        description: 'Complete HTML content including <!DOCTYPE html>',
      },
      css: {
        type: 'string',
        description: 'CSS stylesheet content (optional)',
      },
      javascript: {
        type: 'string',
        description: 'JavaScript code (optional)',
      },
    },
    required: ['projectName', 'html'],
  };

  async execute(args: DeployWebsiteArgs, env: any): Promise<string> {
    const { projectName, html, css, javascript } = args;

    // Validate project name
    if (!/^[a-z0-9-]+$/.test(projectName)) {
      return 'Error: Project name must be lowercase letters, numbers, and hyphens only';
    }

    const apiToken = env.CLOUDFLARE_API_TOKEN;
    const accountId = env.CLOUDFLARE_ACCOUNT_ID;

    if (!apiToken || !accountId) {
      return 'Error: Cloudflare credentials not configured';
    }

    try {
      // Prepare files array
      const files = [
        {
          path: 'index.html',
          content: html,
        },
      ];

      if (css) {
        files.push({
          path: 'style.css',
          content: css,
        });
      }

      if (javascript) {
        files.push({
          path: 'script.js',
          content: javascript,
        });
      }

      console.log(`[Deploy] Deploying ${projectName} with ${files.length} files...`);

      // Call the deployment service
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
        console.error('[Deploy] Error:', error);
        return `Deployment failed: ${error.message || error.error}`;
      }

      const result = await response.json();
      console.log('[Deploy] Success:', result);

      return `🚀 **WEBSITE DEPLOYED SUCCESSFULLY!**

**Live URL:** ${result.productionUrl}

Your website is now live and accessible worldwide on Cloudflare's global network!

**Files deployed:**
${files.map(f => `- ${f.path} (${f.content.length} bytes)`).join('\n')}

**Next steps:**
- Visit the URL to see your live website
- The site is automatically HTTPS-secured
- Updates can be made by deploying again with the same project name`;

    } catch (error: any) {
      console.error('[Deploy] Error:', error);
      return `Deployment error: ${error.message || error}`;
    }
  }
}
