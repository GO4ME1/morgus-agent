# Setup Guide: Getting API Keys

This guide walks through obtaining all API keys needed for the Morgus Creator Economy.

---

## 🎯 Required Keys (Core Functionality)

### 1. Supabase (Database & Auth)

**What it's for**: Database, authentication, storage

**How to get**:
1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Go to Settings → API
4. Copy:
   - `SUPABASE_URL` (Project URL)
   - `SUPABASE_ANON_KEY` (anon/public key)
   - `SUPABASE_SERVICE_KEY` (service_role key)

**Cost**: Free tier includes 500MB database, 50,000 monthly active users

---

### 2. OpenAI (Avatar Generation & DPPM)

**What it's for**: DALL-E 3 avatar generation, GPT-4o-mini for DPPM

**How to get**:
1. Go to [platform.openai.com](https://platform.openai.com)
2. Sign up and add payment method
3. Go to API Keys
4. Create new key
5. Copy `OPENAI_API_KEY`

**Cost**: 
- DALL-E 3: $0.04 per image (1024x1024)
- GPT-4o-mini: $0.15 per 1M input tokens

---

### 3. OpenRouter (DPPM MOE)

**What it's for**: Access to multiple free AI models for DPPM

**How to get**:
1. Go to [openrouter.ai](https://openrouter.ai)
2. Sign up
3. Go to Keys
4. Create new key
5. Copy `OPENROUTER_API_KEY`

**Cost**: Free models available (Mistral, Qwen, etc.)

---

### 4. Google Gemini (DPPM MOE)

**What it's for**: Gemini 2.0 Flash for fast DPPM responses

**How to get**:
1. Go to [ai.google.dev](https://ai.google.dev)
2. Sign in with Google
3. Get API Key
4. Copy `GEMINI_API_KEY`

**Cost**: Free tier includes 1500 requests/day

---

### 5. Stripe (Marketplace Payments)

**What it's for**: Processing marketplace payments

**How to get**:
1. Go to [stripe.com](https://stripe.com)
2. Sign up
3. Go to Developers → API Keys
4. Copy:
   - `STRIPE_SECRET_KEY` (sk_test_...)
   - `STRIPE_PUBLISHABLE_KEY` (pk_test_...)
5. Go to Developers → Webhooks
6. Add endpoint: `https://your-domain.com/api/webhooks/stripe`
7. Copy `STRIPE_WEBHOOK_SECRET` (whsec_...)

**Cost**: 2.9% + $0.30 per transaction

---

## 🔌 Optional Keys (Platform Integrations)

### 6. Reddit API (Post to Reddit Template)

**What it's for**: Posting to Reddit from Morgys

**How to get**:
1. Go to [reddit.com/prefs/apps](https://reddit.com/prefs/apps)
2. Create app (type: web app)
3. Set redirect URI: `http://localhost:3000/oauth/reddit/callback`
4. Copy:
   - `REDDIT_CLIENT_ID` (under app name)
   - `REDDIT_CLIENT_SECRET` (secret)

**Cost**: Free

**Status**: Requires Reddit API approval (pending)

---

### 7. Gmail API (Send Email Template)

**What it's for**: Sending emails from Morgys

**How to get**:
1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create new project
3. Enable Gmail API
4. Go to Credentials → Create OAuth 2.0 Client ID
5. Application type: Web application
6. Add redirect URI: `http://localhost:3000/oauth/gmail/callback`
7. Copy:
   - `GMAIL_CLIENT_ID`
   - `GMAIL_CLIENT_SECRET`

**Cost**: Free (500 emails/day limit)

---

### 8. YouTube API (Search YouTube Template)

**What it's for**: Searching YouTube from Morgys

**How to get**:
1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Enable YouTube Data API v3
3. Go to Credentials → Create API Key
4. Copy `YOUTUBE_API_KEY`

**Cost**: Free (10,000 quota units/day)

---

## 🎥 Optional Keys (Video Creation)

### 9. D-ID API (AI Video Creation)

**What it's for**: Creating AI avatar videos

**How to get**:
1. Go to [d-id.com](https://d-id.com)
2. Sign up
3. Go to Settings → API
4. Copy `DID_API_KEY`

**Cost**: 20 free videos/month, then $0.10-$0.30 per video

---

### 10. Luma AI (AI Video Generation)

**What it's for**: Text-to-video generation

**How to get**:
1. Go to [lumalabs.ai](https://lumalabs.ai)
2. Sign up for API access
3. Copy `LUMA_API_KEY`

**Cost**: 30 free generations/month, then paid

---

## 🚀 Quick Start (Minimum Required)

To get started with basic functionality, you need:

1. ✅ **Supabase** (database & auth)
2. ✅ **OpenAI** (avatar generation)
3. ✅ **OpenRouter** (DPPM)
4. ✅ **Gemini** (DPPM)
5. ✅ **Stripe** (marketplace)

**Total minimum cost**: ~$5-10/month for light usage

---

## 📝 Setup Steps

1. **Copy environment file**:
   ```bash
   cp .env.example .env
   ```

2. **Fill in required keys** (Supabase, OpenAI, OpenRouter, Gemini, Stripe)

3. **Run database migration**:
   ```bash
   # Using Supabase CLI
   supabase db push
   
   # Or manually run the SQL file in Supabase dashboard
   # supabase/migrations/20250127_creator_economy.sql
   ```

4. **Install dependencies**:
   ```bash
   # Backend
   cd dppm-service && npm install
   
   # Frontend
   cd console && npm install
   ```

5. **Start services**:
   ```bash
   # Backend (terminal 1)
   cd dppm-service && npm run dev
   
   # Frontend (terminal 2)
   cd console && npm run dev
   ```

6. **Open browser**: http://localhost:3000

---

## 🧪 Testing

Follow `TESTING_GUIDE.md` for comprehensive testing scenarios.

---

## 💡 Tips

### Free Tier Limits

- **Supabase**: 500MB database, 50K MAU
- **OpenAI**: Pay-as-you-go (no free tier)
- **OpenRouter**: Free models available
- **Gemini**: 1500 requests/day free
- **Stripe**: No monthly fee, just transaction fees
- **D-ID**: 20 videos/month free
- **Luma**: 30 generations/month free

### Cost Optimization

1. **Use free models** in OpenRouter for DPPM (Mistral, Qwen)
2. **Cache avatar images** to avoid regenerating
3. **Batch knowledge processing** to reduce embedding costs
4. **Use Gemini** for fast, free responses

### Security

- ⚠️ **Never commit `.env` file** to git
- ⚠️ **Use test keys** in development
- ⚠️ **Rotate keys** periodically
- ⚠️ **Use environment variables** in production

---

## 🆘 Troubleshooting

### "Unauthorized" errors
- Check that API keys are correct
- Verify keys are in `.env` file
- Restart backend after changing `.env`

### Database errors
- Run migrations: `supabase db push`
- Check Supabase project is active
- Verify `SUPABASE_URL` and keys are correct

### Stripe webhook errors
- Use Stripe CLI for local testing: `stripe listen --forward-to localhost:8080/api/webhooks/stripe`
- Verify webhook secret matches

### Platform integration errors
- Check OAuth redirect URIs match exactly
- Verify API keys are enabled
- Check rate limits

---

## 📞 Support

- **Documentation**: See `CUSTOM_MORGY_CREATOR_SYSTEM.md`
- **Testing**: See `TESTING_GUIDE.md`
- **Deployment**: See `DEPLOYMENT_GUIDE.md`
- **Issues**: https://github.com/morgus/issues
- **Help**: https://help.manus.im
