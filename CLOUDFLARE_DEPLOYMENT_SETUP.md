# Cloudflare Pages Deployment Configuration

## Overview
Morgus can now automatically deploy websites to Cloudflare Pages using Wrangler CLI in the E2B sandbox.

## Configuration Completed (Dec 6, 2024)

### 1. Cloudflare Credentials
- **API Token**: `66b500869b9be6a02cd22408411c0477658c6` (with Cloudflare Pages permissions)
- **Account ID**: `4265ab2d0ff6b1d95610b887788bdfaf`

### 2. Worker Environment Variables
Both credentials have been added as secrets to the `morgus-orchestrator` worker:
```bash
wrangler secret put CLOUDFLARE_API_TOKEN
wrangler secret put CLOUDFLARE_ACCOUNT_ID
```

### 3. Code Changes

#### `/worker/src/tools.ts` - Execute Code Tool
Modified the `executeCodeTool` to pass Cloudflare credentials to E2B sandbox:

```typescript
// Prepare environment variables for the sandbox
const envVars: Record<string, string> = {};

// Pass Cloudflare credentials if available
if (env.CLOUDFLARE_API_TOKEN) {
  envVars.CLOUDFLARE_API_TOKEN = env.CLOUDFLARE_API_TOKEN;
}
if (env.CLOUDFLARE_ACCOUNT_ID) {
  envVars.CLOUDFLARE_ACCOUNT_ID = env.CLOUDFLARE_ACCOUNT_ID;
}

const response = await fetch('https://api.e2b.dev/sandboxes', {
  method: 'POST',
  headers: {
    'X-API-Key': apiKey,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    templateID: 'base',
    timeoutMs: 300000,
    envVars: envVars,  // Pass environment variables to sandbox
  }),
});
```

#### `/worker/src/agent.ts` - System Prompt
Updated the website building instructions to use environment variables:

```
2. Deploy to Cloudflare Pages:
   - Install wrangler: subprocess.run(['npm', 'install', '-g', 'wrangler'], capture_output=True)
   - Authenticate using environment variables (CLOUDFLARE_API_TOKEN and CLOUDFLARE_ACCOUNT_ID are already set)
   - Deploy: subprocess.run(['npx', 'wrangler', 'pages', 'deploy', 'directory', '--project-name=name'], capture_output=True, text=True)
   - Capture the output to get the real URL
```

### 4. Deployment
Worker deployed successfully:
- **URL**: https://morgus-orchestrator.morgan-426.workers.dev
- **Version**: 461ac1f0-68ca-4ac6-8ef3-0052a4aa437a
- **Date**: Dec 6, 2024

## How It Works

### Workflow
1. User asks Morgus to build a website
2. Morgus detects "build/create/website" keywords
3. Morgus calls `execute_code` tool with Python code to:
   - Create project directory
   - Write HTML/CSS/JS files
   - Install Wrangler CLI
   - Run `wrangler pages deploy`
4. E2B sandbox receives credentials via environment variables
5. Wrangler authenticates automatically using env vars
6. Deployment completes and returns live URL
7. Morgus extracts URL from output and shows it to user

### Example Python Code (What Morgus Runs)
```python
import os
import subprocess

# Create project
os.makedirs('my-website', exist_ok=True)

# Write HTML
with open('my-website/index.html', 'w') as f:
    f.write('<html>...</html>')

# Install Wrangler
subprocess.run(['npm', 'install', '-g', 'wrangler'], capture_output=True)

# Deploy (credentials from env vars)
result = subprocess.run(
    ['npx', 'wrangler', 'pages', 'deploy', 'my-website', '--project-name=my-website'],
    capture_output=True,
    text=True
)

# Extract URL from output
print(result.stdout)
```

## Testing

### Test Commands
Try asking Morgus:
- "Build me a landing page for a coffee shop"
- "Create a portfolio website"
- "Make a simple to-do app"

### Expected Behavior
✅ Morgus creates files in E2B sandbox
✅ Morgus runs `wrangler pages deploy`
✅ Deployment succeeds with real URL
✅ User receives live URL like: `https://abc123.my-website.pages.dev`

❌ **Old Behavior (Fixed):**
- Morgus created files but didn't deploy
- User received download link instead of live URL

## Troubleshooting

### If deployment fails:
1. Check Worker logs for errors
2. Verify secrets are set: `wrangler secret list`
3. Test E2B sandbox manually
4. Check Cloudflare API token permissions

### Verify credentials:
```bash
cd /home/ubuntu/morgus-agent/worker
npx wrangler secret list
```

Should show:
- CLOUDFLARE_API_TOKEN
- CLOUDFLARE_ACCOUNT_ID
- E2B_API_KEY
- OPENAI_API_KEY
- SUPABASE_URL
- SUPABASE_KEY
- PEXELS_API_KEY

## Security Notes
- API token has limited permissions (Cloudflare Pages only)
- Credentials stored as Worker secrets (encrypted)
- E2B sandbox is ephemeral (credentials not persisted)
- Token can be revoked at any time from Cloudflare dashboard

## Next Steps
- ✅ Test deployment with real website request
- ⬜ Add GitHub auto-push after deployment
- ⬜ Implement custom domain support
- ⬜ Add deployment history tracking
- ⬜ Populate MOE leaderboard with real data
