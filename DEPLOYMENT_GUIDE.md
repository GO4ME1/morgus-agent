# Morgy System Deployment Guide

## Quick Start (6 Hours to Live!)

This guide will get your Morgy system live and operational.

---

## Prerequisites

### Required Accounts:
1. **Supabase** - Database and auth (free tier)
2. **Fly.io** - Backend hosting (free tier: $5/month)
3. **Cloudflare** - Frontend hosting (free tier)
4. **Reddit** - API access (instant, free)
5. **Google Cloud** - Gmail + YouTube APIs (instant, free)
6. **D-ID** - Video creation (20 videos/month free)
7. **Luma AI** - Video creation (30 videos/month free)

### Optional (Apply Now):
8. **Twitter** - Elevated API access (1-2 days, free tier)
9. **TikTok** - Content Posting API (2-4 weeks, free)

---

## Step 1: Database Setup (30 min)

### 1.1 Create Supabase Project

```bash
# Go to https://supabase.com
# Click "New Project"
# Name: morgus-production
# Database Password: [generate strong password]
# Region: [closest to your users]
```

### 1.2 Enable pgvector Extension

```sql
-- In Supabase SQL Editor
CREATE EXTENSION IF NOT EXISTS vector;
```

### 1.3 Run Migration

```bash
cd morgus-agent/supabase/migrations
# Copy the SQL from 20251227_morgy_system.sql
# Paste into Supabase SQL Editor
# Run the migration
```

### 1.4 Get Connection Details

```bash
# In Supabase Settings > API
# Copy these values:
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.your-project.supabase.co:5432/postgres
```

---

## Step 2: Platform API Setup (60 min)

### 2.1 Reddit API (10 min)

```bash
# 1. Go to https://www.reddit.com/prefs/apps
# 2. Click "Create App"
# 3. Fill in:
#    - Name: Morgus Morgys
#    - Type: web app
#    - Redirect URI: https://your-domain.com/api/oauth/callback/reddit
# 4. Copy credentials:
REDDIT_CLIENT_ID=your_client_id
REDDIT_CLIENT_SECRET=your_client_secret
```

### 2.2 Google Cloud APIs (30 min)

```bash
# 1. Go to https://console.cloud.google.com
# 2. Create new project: "Morgus"
# 3. Enable APIs:
#    - Gmail API
#    - YouTube Data API v3
# 4. Create OAuth 2.0 credentials:
#    - Application type: Web application
#    - Authorized redirect URIs:
#      https://your-domain.com/api/oauth/callback/gmail
#      https://your-domain.com/api/oauth/callback/youtube
# 5. Copy credentials:
GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_client_secret
```

### 2.3 D-ID Video API (10 min)

```bash
# 1. Go to https://www.d-id.com
# 2. Sign up for free account
# 3. Go to API Keys section
# 4. Create new API key
# 5. Copy:
DID_API_KEY=your_api_key
```

### 2.4 Luma AI API (10 min)

```bash
# 1. Go to https://lumalabs.ai
# 2. Sign up for free account
# 3. Go to API section
# 4. Create API key
# 5. Copy:
LUMA_API_KEY=your_api_key
```

---

## Step 3: Backend Deployment (60 min)

### 3.1 Install Fly.io CLI

```bash
# macOS/Linux
curl -L https://fly.io/install.sh | sh

# Windows
iwr https://fly.io/install.ps1 -useb | iex
```

### 3.2 Login to Fly.io

```bash
fly auth login
```

### 3.3 Create fly.toml

```toml
# morgus-agent/dppm-service/fly.toml
app = "morgus-production"
primary_region = "sjc"

[build]
  builder = "paketobuildpacks/builder:base"
  buildpacks = ["gcr.io/paketo-buildpacks/nodejs"]

[env]
  PORT = "8080"
  NODE_ENV = "production"

[http_service]
  internal_port = 8080
  force_https = true
  auto_stop_machines = true
  auto_start_machines = true
  min_machines_running = 0

[[vm]]
  cpu_kind = "shared"
  cpus = 1
  memory_mb = 256
```

### 3.4 Set Environment Variables

```bash
cd morgus-agent/dppm-service

# Database
fly secrets set DATABASE_URL="postgresql://..."
fly secrets set SUPABASE_URL="https://..."
fly secrets set SUPABASE_ANON_KEY="eyJ..."
fly secrets set SUPABASE_SERVICE_ROLE_KEY="eyJ..."

# Platform APIs
fly secrets set REDDIT_CLIENT_ID="..."
fly secrets set REDDIT_CLIENT_SECRET="..."
fly secrets set GOOGLE_CLIENT_ID="..."
fly secrets set GOOGLE_CLIENT_SECRET="..."
fly secrets set DID_API_KEY="..."
fly secrets set LUMA_API_KEY="..."

# OpenAI (for AI generation)
fly secrets set OPENAI_API_KEY="sk-..."

# JWT Secret (generate random string)
fly secrets set JWT_SECRET="$(openssl rand -base64 32)"
```

### 3.5 Deploy Backend

```bash
cd morgus-agent/dppm-service
fly launch
# Follow prompts, use defaults
fly deploy
```

### 3.6 Verify Deployment

```bash
fly status
fly logs
# Check: https://morgus-production.fly.dev/health
```

---

## Step 4: Frontend Deployment (30 min)

### 4.1 Update Environment Variables

```bash
# morgus-agent/console/.env.production
VITE_API_URL=https://morgus-production.fly.dev
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

### 4.2 Build Frontend

```bash
cd morgus-agent/console
pnpm install
pnpm build
```

### 4.3 Deploy to Cloudflare Pages

```bash
# Option 1: Cloudflare Dashboard
# 1. Go to https://dash.cloudflare.com
# 2. Pages > Create a project
# 3. Connect to Git (GitHub)
# 4. Select morgus-agent repository
# 5. Build settings:
#    - Framework: Vite
#    - Build command: cd console && pnpm build
#    - Build output: console/dist
# 6. Environment variables: (paste from .env.production)
# 7. Deploy!

# Option 2: Wrangler CLI
npx wrangler pages publish dist --project-name=morgus-console
```

### 4.4 Configure Custom Domain (Optional)

```bash
# In Cloudflare Pages:
# 1. Go to Custom domains
# 2. Add your domain: morgus.yourdomain.com
# 3. Follow DNS setup instructions
```

---

## Step 5: Initialize Starter Morgys (10 min)

### 5.1 Create Starter Morgys

```bash
# Use the API or Supabase SQL Editor:
curl -X POST https://morgus-production.fly.dev/api/morgys/init-starters \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"

# Or run SQL directly:
INSERT INTO morgys (name, category, description, system_prompt, avatar_url, is_starter)
VALUES
  ('Bill', 'business', 'Enthusiastic business strategist', '...', '/avatars/bill.png', true),
  ('Sally', 'social_media', 'Vibrant social media expert', '...', '/avatars/sally.png', true),
  ('Professor Hogsworth', 'research', 'Distinguished research scholar', '...', '/avatars/professor.png', true);
```

---

## Step 6: Test the System (60 min)

### 6.1 Test Authentication

```bash
# 1. Go to https://morgus.yourdomain.com
# 2. Sign up with email
# 3. Verify email
# 4. Log in
```

### 6.2 Test Morgy Chat

```bash
# 1. Click pig icon to open Morgy Pen
# 2. Select Bill
# 3. Send message: "Hello Bill!"
# 4. Verify response with Bill's personality
```

### 6.3 Test OAuth Connections

```bash
# 1. Go to Settings > Connections
# 2. Click "Connect Reddit"
# 3. Authorize Reddit access
# 4. Verify connection successful
# 5. Repeat for Gmail, YouTube
```

### 6.4 Test Action Template

```bash
# 1. Chat with Sally
# 2. Say: "Post about AI marketing to r/marketing"
# 3. Sally should detect template intent
# 4. Execute post_to_reddit template
# 5. Verify post on Reddit
```

### 6.5 Test Video Creation

```bash
# 1. Chat with Sally
# 2. Say: "Create a TikTok about AI trends"
# 3. Sally should use create_tiktok_talking_head template
# 4. Wait for D-ID to generate video (~30 seconds)
# 5. Download and verify video
```

### 6.6 Test Workflow

```bash
# 1. Chat with Sally
# 2. Say: "Run a TikTok campaign about AI marketing"
# 3. Sally should detect workflow intent
# 4. Execute tiktok_campaign_domination workflow
# 5. Monitor progress (5 steps)
# 6. Verify all 5 videos created
```

---

## Step 7: Monitor and Debug (30 min)

### 7.1 Check Logs

```bash
# Backend logs
fly logs -a morgus-production

# Frontend logs
# In Cloudflare Pages > Deployments > Logs
```

### 7.2 Monitor Database

```bash
# In Supabase:
# 1. Go to Database > Tables
# 2. Check morgys, conversations, morgy_actions tables
# 3. Verify data is being created
```

### 7.3 Test Error Handling

```bash
# Try invalid requests:
# 1. Post to non-existent subreddit
# 2. Send email without OAuth
# 3. Create video with invalid inputs
# 4. Verify error messages are helpful
```

---

## Step 8: Apply for Additional APIs (10 min)

### 8.1 Twitter API (Optional)

```bash
# 1. Go to https://developer.twitter.com
# 2. Apply for Elevated access
# 3. Fill in application:
#    - Use case: AI agent platform
#    - Description: Morgys post on behalf of users
# 4. Wait 1-2 days for approval
# 5. Once approved, add credentials:
fly secrets set TWITTER_CLIENT_ID="..."
fly secrets set TWITTER_CLIENT_SECRET="..."
```

### 8.2 TikTok API (Optional)

```bash
# 1. Go to https://developers.tiktok.com
# 2. Apply for Content Posting API
# 3. Fill in application:
#    - Use case: AI-generated video posting
#    - Description: Sally creates and posts TikToks
# 4. Wait 2-4 weeks for approval
# 5. Once approved, add credentials:
fly secrets set TIKTOK_CLIENT_ID="..."
fly secrets set TIKTOK_CLIENT_SECRET="..."
```

---

## Troubleshooting

### Backend won't start
```bash
# Check logs
fly logs -a morgus-production

# Common issues:
# 1. Missing environment variables
fly secrets list
# 2. Database connection failed
# Verify DATABASE_URL is correct
# 3. Port binding issue
# Ensure PORT=8080 in fly.toml
```

### OAuth not working
```bash
# Check redirect URIs match exactly:
# Reddit: https://your-domain.com/api/oauth/callback/reddit
# Google: https://your-domain.com/api/oauth/callback/gmail
#         https://your-domain.com/api/oauth/callback/youtube

# Verify state parameter is valid (10 min expiry)
# Check oauth_states table in Supabase
```

### Video creation failing
```bash
# Check API keys:
fly secrets list | grep DID
fly secrets list | grep LUMA

# Verify free tier limits:
# D-ID: 20 videos/month
# Luma: 30 videos/month

# Check logs for specific errors
fly logs | grep "video"
```

### Template not executing
```bash
# Check intent detection:
# 1. Message should contain keywords
# 2. Check morgy-agentic-engine.ts detectIntent()
# 3. Verify template name matches

# Check OAuth tokens:
# 1. User must have connected platform
# 2. Token must not be expired
# 3. Check oauth_tokens table
```

---

## Performance Optimization

### Enable Caching
```typescript
// Add Redis for token caching (optional)
fly redis create
fly secrets set REDIS_URL="redis://..."
```

### Scale Backend
```bash
# Increase resources if needed
fly scale memory 512
fly scale count 2
```

### Enable CDN
```bash
# Cloudflare automatically enables CDN
# For static assets, use Cloudflare R2
```

---

## Security Checklist

- [ ] All secrets set via `fly secrets` (not in code)
- [ ] HTTPS enforced (fly.toml: force_https = true)
- [ ] Row Level Security enabled in Supabase
- [ ] OAuth redirect URIs whitelisted
- [ ] Rate limiting enabled (TODO: add rate limiter)
- [ ] Input validation on all endpoints
- [ ] JWT tokens expire after 24 hours
- [ ] Refresh tokens stored securely

---

## Cost Breakdown

### Free Tier (Current):
- Supabase: $0/month (500MB database, 50MB file storage)
- Fly.io: $0/month (3 shared-cpu-1x VMs, 160GB bandwidth)
- Cloudflare Pages: $0/month (unlimited requests)
- Reddit API: $0/month (60 req/min)
- Gmail API: $0/month (unlimited)
- YouTube API: $0/month (10k quota/day)
- D-ID: $0/month (20 videos)
- Luma AI: $0/month (30 videos)

**Total: $0/month!**

### Paid Tier (When Scaling):
- Supabase Pro: $25/month (8GB database, 100GB storage)
- Fly.io: $5-20/month (dedicated CPU, more memory)
- D-ID: $49/month (100 videos)
- Twitter API: $100/month (elevated access)

**Total: ~$150-200/month**

---

## Next Steps

1. **Test with Beta Users** - Invite 10-20 users to test
2. **Gather Feedback** - What works? What's confusing?
3. **Iterate** - Fix bugs, improve UX
4. **Add More Templates** - Based on user requests
5. **Add More Workflows** - Expand Morgy capabilities
6. **Launch Marketplace** - Let users create and sell Morgys
7. **Build MCP Server** - Export Morgys to Claude Desktop

---

## Support

- **Documentation**: https://morgus.yourdomain.com/docs
- **Discord**: https://discord.gg/morgus
- **Email**: support@yourdomain.com

---

**Congratulations! Your Morgy system is now live!** 🎉🐷✨
