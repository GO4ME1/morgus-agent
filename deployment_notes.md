# Deployment Notes

## Key Findings from Cloudflare Worker Settings

The morgus-orchestrator worker has the following secrets configured:
- ADMIN_API_TOKEN
- ANTHROPIC_API_KEY
- BROWSERBASE_API_KEY
- BROWSERBASE_PROJECT_ID
- CLOUDFLARE_ACCOUNT_ID (value: 4265ab2d0ff6b1d95610b887788bdfaf)
- CLOUDFLARE_API_TOKEN (encrypted - need to get this)
- E2B_API_KEY
- ELEVENLABS_API_KEY
- ELEVENLABS_VOICE_ID
- ENVIRONMENT (plaintext: production)
- GEMINI_API_KEY
- GITHUB_TOKEN
- GOOGLE_CLOUD_PROJECT_ID

## Deployment Strategy

Since the browser upload interface is difficult to automate, and we don't have direct access to the CLOUDFLARE_API_TOKEN value (it's encrypted), we need to either:
1. Create a new API token with Pages deployment permissions
2. Use the existing deployment workflow through the worker

The morgus-console Pages project already exists and has been deployed successfully multiple times.
