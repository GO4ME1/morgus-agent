# Morgus - Agentic AI Platform with Morgy System

**Morgus** is an autonomous AI platform that creates websites, apps, presentations, AND deploys customizable AI employees (Morgys) that can autonomously perform tasks across multiple platforms.

## 🎯 Current Status: Morgy System MVP (Production-Ready)

**Last Updated:** December 27, 2024

### ✅ Completed Features

**Core Platform:**
- Template-based website generation (18+ templates, 5 visual styles each)
- GPT-Image-1.5 integration for AI-generated images
- Cloudflare Pages deployment
- Credit system database (Supabase)
- User authentication and profiles
- Task history and monitoring

**Morgy System (NEW!):**
- 🐷 **Agentic Morgys** - Customizable AI employees with unique personalities
- 🎨 **Avatar System** - Cyberpunk pig characters with DALL-E 3 generation
- 💬 **Smart Execution** - Auto-routing between Fast/MOE/Agent/DPPM modes
- 📚 **Knowledge Base** - Upload documents, semantic search with pgvector, RAG
- 🏪 **Morgy Market** - Buy, sell, and license custom Morgys
- 🔌 **MCP Export** - Export Morgys to Claude Desktop and other platforms
- 🐦 **Social Media Integration** - Twitter, TikTok, YouTube, Reddit (in progress)
- 📧 **Email Integration** - Gmail sending and automation (in progress)

### 🚧 In Progress (Priority Order)

1. **Platform Integrations** - Twitter, TikTok, YouTube, Reddit, Gmail APIs
2. **OAuth System** - User authorization for platform connections
3. **Video Creation** - Sally can create and post TikTok videos
4. **Scheduling System** - Schedule posts and tasks
5. **Analytics Dashboard** - Track Morgy performance and engagement

---

## 🐷 What Are Morgys?

**Morgys are autonomous AI employees** - not just chatbots, but true agents that can:

- 💬 **Chat** with personality and context
- 📚 **Learn** from uploaded documents and websites
- 🤖 **Execute** tasks autonomously
- 🐦 **Post** to social media (Twitter, TikTok, LinkedIn, Facebook)
- 📧 **Send** emails and manage communications
- 📊 **Analyze** data and generate reports
- 🎥 **Create** videos and visual content
- 🔄 **Schedule** recurring tasks

### Meet the Starter Morgys

**Bill the Marketing Hog** 🟢
- Enthusiastic business strategist (lovable oaf energy!)
- Sometimes gets ahead of himself with big ideas
- Needs Sally to refine his strategies
- Color: Neon green with pink sunglasses

**Sally the Promo Pig** 🩷
- Vibrant social media expert (gentle mentor)
- Polishes Bill's ideas into actionable plans
- Creates and posts TikTok videos!
- Color: Hot pink with purple robot parts

**Professor Hogsworth** 🔵
- Distinguished research scholar
- Academic and thorough
- Finds credible sources and citations
- Color: Cyan with monocle and tweed jacket

**Maxine** 💜
- Marketing automation specialist
- Data-driven and results-focused
- ROI-obsessed with creative flair
- Color: Vibrant magenta with orange accents

---

## Architecture

Morgus uses a **distributed architecture** with multiple specialized services:

### Services

1. **Cloudflare Pages** (Frontend)
   - React-based web console
   - Morgy Pen interface (expandable 320px-1080px)
   - Avatar customizer
   - Market and creator tools
   - URL: https://morgus-console.pages.dev

2. **Fly.io Backend** (`dppm-service`)
   - Morgy execution engine
   - Platform integrations (Twitter, TikTok, YouTube, Reddit, Gmail)
   - OAuth manager
   - Video creation (D-ID integration)
   - Knowledge base service
   - URL: https://morgus-deploy.fly.dev

3. **Cloudflare Worker** (`morgus-orchestrator`)
   - Main orchestrator for routing requests
   - Analyzes complexity and routes to appropriate service
   - Handles chat interface
   - URL: https://morgus-orchestrator.morgan-426.workers.dev

4. **Supabase Backend**
   - User authentication and data storage
   - Morgy database (30+ tables)
   - Vector-based knowledge base (pgvector)
   - Platform connections and OAuth tokens
   - Credit system

---

## Morgy System Architecture

### Database Schema

**Core Tables:**
- `morgys` - Morgy configurations and metadata
- `morgy_conversations` - Chat conversations
- `morgy_messages` - Individual messages
- `morgy_knowledge_base` - Uploaded documents and embeddings
- `morgy_platform_connections` - OAuth tokens for platforms
- `morgy_platform_actions` - Audit log of platform actions
- `morgy_market_listings` - Marketplace listings
- `morgy_purchases` - Purchase history
- `morgy_reviews` - User reviews and ratings

### Execution Modes

Morgys automatically choose the best execution mode:

1. **Fast Mode** (Default)
   - Gemini 2.0 Flash
   - Cost: **$0 (FREE)**
   - Latency: 1-2 seconds
   - Use: 90% of queries

2. **Quality Mode** (MOE)
   - 6 models compete (Nash Equilibrium)
   - Cost: ~$0.0005 per query
   - Latency: 2-5 seconds
   - Use: When quality matters

3. **Agent Mode**
   - GPT-4o-mini with tools
   - Cost: ~$0.001-0.01 per task
   - Latency: 5-30 seconds
   - Use: When tools needed (search, code, etc.)

4. **DPPM Mode**
   - Deep parallel processing
   - Cost: ~$0.01-0.05 per task
   - Latency: 30-60 seconds
   - Use: Complex multi-step tasks

### Platform Integrations

**Twitter API v2:**
- Read tweets, user profiles, timelines
- Post tweets, reply, retweet
- OAuth 2.0 authentication
- Cost: Free tier (1,500 tweets/month) or $100/month

**TikTok API:**
- Create videos with D-ID (Sally's avatar talks!)
- Post videos to TikTok
- Generate captions and hashtags
- OAuth 2.0 authentication
- Cost: Free API + $0.30 per video (D-ID)

**YouTube API:**
- Search videos and channels
- Get video metadata
- Upload videos (future)
- OAuth 2.0 authentication
- Cost: Free (10,000 quota units/day)

**Reddit API:**
- Read subreddit posts
- Post to subreddits
- Comment on posts
- OAuth 2.0 authentication
- Cost: Free

**Gmail API:**
- Send emails
- Read emails
- Manage inbox
- OAuth 2.0 authentication
- Cost: Free

### Knowledge Base (RAG)

**Features:**
- Upload text files, PDFs, Word documents
- Scrape websites for content
- Semantic search with pgvector
- Automatic chunking and embedding
- Context injection into AI responses

**How it works:**
1. User uploads document or URL
2. System extracts text content
3. Chunks text into manageable pieces
4. Generates embeddings (OpenAI)
5. Stores in Supabase with pgvector
6. Searches semantically when Morgy responds
7. Injects relevant context into prompt

### Avatar System

**Generation:**
- DALL-E 3 HD quality
- Cyberpunk pig characters
- 100+ customization options
- Cost: $0.08 per avatar

**Customization:**
- 10 vibrant colors (neon green, hot pink, cyan, etc.)
- Character types (business, creative, technical, academic, casual)
- Glasses (sunglasses, round, monocle, none)
- Headwear (hat, cap, headphones, none)
- Clothing (suit, hoodie, t-shirt, jacket, robot body)
- Personality (energetic, professional, friendly, serious, playful)

### Pig Name Generator

**Features:**
- 3 auto-generated suggestions per category
- Clever pig names (Hamsworth, Pigcasso, Hamlet)
- Robot names (Byte-hog, Swinebot, Cyberpork)
- Hybrid names (Technohog, Pixelpig, Viral-hog)
- Category-specific pools (business, creative, technical, social media, research, marketing)
- Custom name validation
- Name availability checking

**Examples:**
- **Business:** Hamsworth, Porkinton, Baconberg, Snoutford, Bristlewood
- **Creative:** Pigcasso, Hamvinci, Snoutsy, Oinkmuse, Truffart
- **Technical:** Byte-hog, Cyberpork, Swinebot, Technohog, Pixelpig
- **Social Media:** Squeakfluencer, Viral-hog, Trendypig, Hashtagham, Likesalot
- **Research:** Professor Hogsworth, Dr. Snoutstein, Hamlet, Bristlebury, Dataswine
- **Marketing:** Brandpig, Campaignham, Conversionpork, Growthog, Funnelpig

---

## Technology Stack

**Backend:**
- Node.js + TypeScript (DPPM service)
- Twitter API v2 (twitter-api-v2 npm package)
- TikTok API (Content Posting API)
- YouTube Data API v3 (googleapis npm package)
- Reddit API (snoowrap npm package)
- Gmail API (googleapis npm package)
- D-ID API (video creation)

**Worker:**
- Cloudflare Workers (orchestrator)

**Database:**
- Supabase (PostgreSQL + pgvector)
- Row Level Security policies
- Real-time subscriptions

**Frontend:**
- React + TypeScript + Vite
- TailwindCSS (styling)
- React Router (navigation)

**Deployment:**
- Cloudflare Pages (frontend, websites)
- Fly.io (DPPM service)
- Cloudflare Workers (orchestrator)

**AI Models:**
- OpenAI GPT-4 (reasoning)
- OpenAI GPT-4o-mini (agent mode)
- Gemini 2.0 Flash (fast mode, FREE)
- OpenAI text-embedding-3-small (embeddings)
- DALL-E 3 (avatar generation)
- D-ID (video creation)

---

## Project Structure

```
morgus-agent/
├── dppm-service/              # Node.js backend service
│   ├── src/
│   │   ├── morgy-service.ts              # Core Morgy business logic
│   │   ├── morgy-execution.ts            # Smart execution engine
│   │   ├── knowledge-base-service.ts     # RAG implementation
│   │   ├── avatar-generator.ts           # DALL-E 3 avatar creation
│   │   ├── pig-name-generator.ts         # Clever name generation
│   │   ├── document-extractors.ts        # PDF/Word extraction
│   │   ├── error-handler.ts              # Error handling & logging
│   │   ├── auth-middleware.ts            # Supabase authentication
│   │   ├── integrations/
│   │   │   ├── twitter-client.ts         # Twitter API v2 client
│   │   │   ├── tiktok-client.ts          # TikTok API client
│   │   │   ├── video-creator.ts          # D-ID video creation
│   │   │   ├── youtube-client.ts         # YouTube API client
│   │   │   ├── reddit-client.ts          # Reddit API client
│   │   │   └── gmail-client.ts           # Gmail API client
│   │   ├── oauth/
│   │   │   └── oauth-manager.ts          # OAuth 2.0 flow manager
│   │   └── types/
│   │       └── morgy.ts                  # TypeScript interfaces
│   └── fly.toml
├── worker/                    # Cloudflare Worker orchestrator
│   ├── src/
│   │   ├── index.ts
│   │   └── tools/
│   └── wrangler.toml
├── console/                   # React web console
│   ├── src/
│   │   ├── components/
│   │   │   ├── MorgyPenExpandable.tsx    # Main Morgy interface
│   │   │   ├── MorgyChat.tsx             # Chat component
│   │   │   ├── MorgyCreator.tsx          # Morgy creation form
│   │   │   ├── MorgyDashboard.tsx        # Morgy list view
│   │   │   ├── MorgyMarket.tsx           # Marketplace
│   │   │   ├── MorgyKnowledgeBase.tsx    # Knowledge management
│   │   │   └── AvatarCustomizer.tsx      # Avatar customization
│   │   ├── pages/
│   │   │   └── Pricing.tsx               # Pricing page
│   │   ├── lib/
│   │   └── App.tsx
│   └── public/
│       └── avatars/
│           ├── bill.png                  # Bill's avatar
│           ├── sally.png                 # Sally's avatar
│           ├── professor.png             # Hogsworth's avatar
│           └── maxine.png                # Maxine's avatar
├── supabase/                  # Database schema and migrations
│   └── migrations/
│       ├── 20251226_credit_system.sql
│       └── 20251227_morgy_system.sql     # Complete Morgy schema
├── setup-morgy-system.sh      # Automated setup script
├── MORGY_SYSTEM_HANDOFF.md    # Complete handoff document
├── MORGY_README.md            # Morgy system guide
└── README.md                  # This file
```

---

## Setup and Installation

### Prerequisites

- Node.js 18+
- Cloudflare account with API token
- Fly.io account (for backend)
- Supabase project
- OpenAI API key
- Platform API keys:
  - Twitter API v2 (https://developer.twitter.com/)
  - TikTok for Developers (https://developers.tiktok.com/)
  - Google Cloud (YouTube + Gmail APIs)
  - Reddit API (https://www.reddit.com/prefs/apps)
  - D-ID API (https://www.d-id.com/)

### Environment Variables

**DPPM Service** (`dppm-service/.env`):
```bash
# OpenAI
OPENAI_API_KEY=your_openai_key

# Cloudflare
CLOUDFLARE_API_TOKEN=your_cloudflare_token
CLOUDFLARE_ACCOUNT_ID=your_account_id

# Supabase
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_supabase_service_key

# Twitter API v2
TWITTER_API_KEY=your_twitter_api_key
TWITTER_API_SECRET=your_twitter_api_secret
TWITTER_BEARER_TOKEN=your_twitter_bearer_token

# TikTok API
TIKTOK_CLIENT_KEY=your_tiktok_client_key
TIKTOK_CLIENT_SECRET=your_tiktok_client_secret

# YouTube API
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_API_KEY=your_google_api_key

# Reddit API
REDDIT_CLIENT_ID=your_reddit_client_id
REDDIT_CLIENT_SECRET=your_reddit_client_secret

# D-ID (Video Creation)
DID_API_KEY=your_did_api_key
```

**Worker** (configured as secrets):
```bash
wrangler secret put OPENAI_API_KEY
wrangler secret put CLOUDFLARE_API_TOKEN
wrangler secret put CLOUDFLARE_ACCOUNT_ID
wrangler secret put SUPABASE_URL
wrangler secret put SUPABASE_SERVICE_KEY
```

**Console** (`console/.env`):
```bash
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_API_URL=https://morgus-orchestrator.morgan-426.workers.dev
```

### Database Setup

**1. Apply Morgy System Migration:**
```bash
cd supabase
supabase db push
```

Or manually in Supabase SQL Editor:
1. Go to: https://supabase.com/dashboard/project/YOUR_PROJECT/sql
2. Run: `supabase/migrations/20251227_morgy_system.sql`
3. Verify tables created (30+ tables)

**2. Enable pgvector Extension:**
```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

**3. Initialize Starter Morgys:**
```bash
curl -X POST https://morgus-deploy.fly.dev/api/morgys/init-starters \
  -H "Authorization: Bearer YOUR_SUPABASE_TOKEN"
```

### Deployment

**1. Deploy DPPM Service to Fly.io:**
```bash
cd dppm-service
fly deploy
```

**2. Deploy Worker to Cloudflare:**
```bash
cd worker
wrangler deploy
```

**3. Deploy Console to Cloudflare Pages:**
```bash
cd console
npm run build
wrangler pages deploy dist
```

---

## Usage

### Creating a Morgy

1. Open Morgy Pen (click pig icon)
2. Click "✨ Create" tab
3. Fill in details:
   - **Name:** Click 🎲 for suggestions or enter custom name
   - **Description:** What your Morgy does
   - **Category:** Business, Marketing, Development, etc.
   - **System Prompt:** Define personality and behavior
   - **Traits:** Add personality traits
   - **Expertise:** Add skills and knowledge areas
4. Customize avatar (optional)
5. Click "Create Morgy"

### Chatting with a Morgy

1. Open Morgy Pen
2. Click on a Morgy card
3. Chat interface opens automatically
4. Type your message and press Enter
5. Morgy responds with personality!

### Adding Knowledge

1. Open Morgy Pen
2. Select a Morgy
3. Click "📚 Knowledge" tab
4. Upload files or add website URLs
5. Morgy learns from your content!

### Connecting Platforms

1. Open Morgy Pen
2. Select a Morgy
3. Click "🔌 Connect" button
4. Choose platform (Twitter, TikTok, etc.)
5. Authorize with OAuth
6. Morgy can now post autonomously!

### Sally Creates a TikTok Video

1. Chat with Sally
2. Say: "Create a TikTok video about [topic]"
3. Sally generates script
4. Sally creates video (her avatar talks!)
5. Sally generates caption + hashtags
6. Sally posts to TikTok
7. Sally reports engagement!

---

## Pricing

### Morgy System

**Free Tier:**
- 3 Morgys
- 100 messages/day
- Basic knowledge base (10 documents)
- Read-only social media

**Pro Tier ($15/month):**
- Unlimited Morgys
- Unlimited messages
- Unlimited knowledge base
- Full social media posting
- Video creation (100 videos/month)
- Priority support

**Enterprise (Custom):**
- Custom Morgy count
- Dedicated infrastructure
- White-label option
- Custom integrations
- SLA guarantee

### Platform Costs (Pass-through)

- **Twitter API:** Free tier or $100/month
- **TikTok Videos:** $0.30 per video (D-ID)
- **YouTube/Reddit/Gmail:** Free
- **Avatar Generation:** $0.08 per avatar

---

## Roadmap

### Phase 1: Foundation (Weeks 1-2) ✅ COMPLETE
- [x] Database schema
- [x] Backend service layer
- [x] Execution engine
- [x] Chat interface
- [x] Character personalities
- [x] API endpoints
- [x] Knowledge base service
- [x] Marketplace structure

### Phase 2: Platform Integrations (Weeks 3-4) 🚧 IN PROGRESS
- [ ] Twitter API v2 integration
- [ ] TikTok video creation (D-ID)
- [ ] TikTok posting API
- [ ] YouTube API integration
- [ ] Reddit API integration
- [ ] Gmail API integration
- [ ] OAuth system

### Phase 3: Advanced Features (Weeks 5-6)
- [ ] Scheduling system
- [ ] Analytics dashboard
- [ ] Multi-platform cross-posting
- [ ] Video templates
- [ ] Email templates
- [ ] Workflow automation

### Phase 4: Market & Community (Weeks 7-8)
- [ ] Morgy Market launch
- [ ] Creator dashboard
- [ ] Revenue sharing
- [ ] Reviews and ratings
- [ ] Featured Morgys
- [ ] Creator certification

---

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

---

## License

MIT License - see [LICENSE](./LICENSE) for details.

---

## Support

- **Documentation:** https://docs.morgus.ai
- **Discord:** https://discord.gg/morgus
- **Email:** support@morgus.ai
- **Twitter:** @MorgusAI

---

## Acknowledgments

- Inspired by Sintra AI's specialized AI employees
- Built with love by the Morgus team
- Special thanks to Bill, Sally, and Professor Hogsworth for being such good sports! 🐷

---

**Made with 🐷 by Morgus**
