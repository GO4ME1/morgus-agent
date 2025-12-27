# Morgus Autonomous Agent System

**Morgus** is an autonomous AI agent system that creates and deploys websites, landing pages, apps, and presentations using AI-powered templates. The system uses a Mixture of Experts (MOE) architecture with multiple AI models, deploys to Cloudflare Pages, and includes template-based generation with AI-generated images and videos.

## 🎯 Current Status: Building Phase (Pre-Production)

**Last Updated:** December 26, 2024

### ✅ Completed Features
- Template-based website generation (18+ templates, 5 visual styles each)
- GPT-Image-1.5 integration for AI-generated images
- Cloudflare Pages deployment
- Credit system database (Supabase)
- Affordable pricing ($5, $10, $15, $25 tiers)
- User authentication and profiles
- Task history and monitoring

### 🚧 In Progress (Priority Order)
1. **NotebookLM Integration** - AI-powered research and note-taking
2. **Agentic Morgys** - Truly autonomous AI companions with personality, memory, and skills
3. **MCP Servers** - Model Context Protocol for extensibility and persistent memory
4. **Morgy Market** - Marketplace for custom Morgys, tools, and templates

### 📋 See Full Roadmap
Check [MORGUS_ROADMAP.md](./MORGUS_ROADMAP.md) for complete task breakdown, effort estimates, and success metrics.

---

## Overview

Morgus is designed to **deliver results** – producing running applications, professional websites, and presentations autonomously. The system analyzes user requests, selects appropriate templates, generates visual assets, and deploys to production with minimal human intervention.

### Key Features

- **Template-Based Generation**: 18+ professional templates (startup, SaaS, dating, e-commerce, restaurant, portfolio, creative, etc.)
- **Visual Style Variants**: 5 different visual styles per template type (modern-minimal, bold-dynamic, classic-professional, creative-artistic, elegant-luxury)
- **AI-Generated Assets**: Automatic hero images and logos using GPT-Image-1.5
- **Video Generation**: Sora 2 integration framework (ready for opt-in)
- **Cloudflare Pages Deployment**: Automated deployment with correct hash calculation
- **Keyword-Based Detection**: Automatically selects template type and visual style from user prompts
- **Multi-Model Support**: Flexible model routing (GPT-4, GPT-5.1, future Gemini/Grok)
- **Real-Time Updates**: Live task monitoring via Supabase subscriptions
- **Credit System**: À la carte pricing for images and videos
- **Agentic Morgys**: AI companions with personality, memory, and autonomous capabilities (coming soon)
- **NotebookLM Integration**: AI-powered research and note-taking (coming soon)
- **MCP Servers**: Extensible tool system via Model Context Protocol (coming soon)

## Architecture

Morgus uses a **distributed architecture** with multiple specialized services:

### Services

1. **Cloudflare Worker** (`morgus-orchestrator`)
   - Main orchestrator for routing requests
   - Analyzes complexity and routes to appropriate service
   - Handles chat interface and user interactions
   - URL: https://morgus-orchestrator.morgan-426.workers.dev

2. **Fly.io DPPM Service** (`morgus-deploy`)
   - Template generation and deployment service
   - URL: https://morgus-deploy.fly.dev
   - Handles website/app/presentation generation
   - Integrates with OpenAI for image/video generation

3. **Cloudflare Pages**
   - Deployment target for generated websites
   - Automatic SSL and CDN
   - Custom domains supported

4. **Supabase Backend**
   - User authentication and data storage
   - Task history and learning system
   - Vector-based knowledge base (pgvector)
   - Credit system (user_credits, credit_transactions, credit_packages)

5. **Console** (`morgus-console`)
   - React-based web interface
   - URL: https://morgus-console.pages.dev
   - User dashboard, pricing, settings

### Template System

The template system provides professional, production-ready designs:

- **18+ Template Types**: startup, saas, mobile-app, game, portfolio, ecommerce, restaurant, agency, blog, event, dating, creative, personal, product, nonprofit, education, healthcare, realestate, fitness, entertainment
- **5 Visual Styles**: Each template type has 5 visual style variants
  - **modern-minimal**: Clean, lots of whitespace, centered content
  - **bold-dynamic**: Asymmetric layouts, large images, vibrant colors
  - **classic-professional**: Traditional grid, balanced sections, corporate feel
  - **creative-artistic**: Unique layouts, overlapping elements, playful
  - **elegant-luxury**: Sophisticated, refined, premium feel
- **Keyword Detection**: Automatically selects style based on prompt keywords
  - "luxury", "spa", "elegant" → elegant-luxury
  - "cutting-edge", "bold", "dynamic" → bold-dynamic
  - "professional", "corporate" → classic-professional
  - "creative", "artistic", "fun" → creative-artistic
  - "modern", "minimal", "clean" → modern-minimal

### Credit System

**Affordable Pricing Structure:**

**Video Packs:**
- Small: $5 for 5 videos ($1.00 each)
- Medium: $10 for 15 videos ($0.67 each) ⭐ POPULAR
- Large: $15 for 25 videos ($0.60 each) 💎 BEST VALUE

**Image Packs:**
- Small: $5 for 25 images ($0.20 each)
- Medium: $10 for 60 images ($0.17 each) ⭐ POPULAR
- Large: $15 for 100 images ($0.15 each) 💎 BEST VALUE

**Bundles:**
- Starter: $10 (25 images + 5 videos)
- Creator: $15 (60 images + 15 videos) ⭐ SAVE $5
- Pro: $25 (100 images + 25 videos) 💎 SAVE $5

**Subscription Plans:**
- Free: 3 images/day, no videos
- Day Pass ($3): Unlimited images, 2 videos
- Weekly ($21/week): Unlimited images, 10 videos/day
- Monthly ($75/month): Unlimited everything

**Features:**
- Credits never expire
- Subscription users can buy add-on packs
- Unlimited flags for testing/admin
- Complete transaction audit trail

### AI-Powered Asset Generation

- **Images**: GPT-Image-1.5 for hero images and logos
- **Videos**: Sora 2 framework ready (opt-in with user confirmation)
- **Credit Tracking**: Automatic deduction with unlimited bypass for subscriptions

## Technology Stack

- **Backend**: Node.js + TypeScript (DPPM service)
- **Worker**: Cloudflare Workers (orchestrator)
- **Database**: Supabase (PostgreSQL + pgvector)
- **Frontend**: React + TypeScript + Vite
- **Deployment**: 
  - Cloudflare Pages (websites, console)
  - Fly.io (DPPM service)
  - Cloudflare Workers (orchestrator)
- **AI Models**: 
  - OpenAI GPT-Image-1.5 (images)
  - OpenAI Sora 2 (videos)
  - OpenAI GPT-4/GPT-5.1 (reasoning)
  - Google NotebookLM (research, coming soon)

## Project Structure

```
morgus-agent/
├── dppm-service/              # Node.js DPPM service with template system
│   ├── src/
│   │   ├── template-generator.ts          # Main template generation logic
│   │   ├── cloudflare-pages-deployer.ts   # Cloudflare Pages deployment
│   │   ├── image-generator.ts             # GPT-Image-1.5 integration
│   │   ├── video-generator.ts             # Sora 2 integration (framework)
│   │   ├── credit-service.ts              # Credit tracking and validation
│   │   ├── credit-routes.ts               # Credit API endpoints
│   │   └── templates/
│   │       ├── website-templates.ts       # 18+ website templates
│   │       ├── website-styles.ts          # 5 visual style variants
│   │       ├── app-templates.ts           # App templates
│   │       └── index.ts                   # Template exports
│   └── fly.toml
├── worker/                    # Cloudflare Worker orchestrator
│   ├── src/
│   │   ├── index.ts                       # Main worker logic
│   │   └── tools/
│   │       └── deploy-website.ts          # Cloudflare Pages API
│   └── wrangler.toml
├── console/                   # React web console
│   ├── src/
│   │   ├── components/                    # UI components
│   │   ├── pages/
│   │   │   ├── Pricing.tsx                # Pricing page with credit packs
│   │   │   └── PricingCreditPacks.css     # Credit packs styling
│   │   ├── lib/                           # Utilities
│   │   └── App.tsx                        # Main app
│   └── wrangler.toml
├── supabase/                  # Supabase schema and migrations
│   └── migrations/
│       └── 20251226_credit_system.sql     # Credit system tables
├── MORGUS_ROADMAP.md          # Complete development roadmap
├── CHANGELOG.md               # Version history
└── README.md                  # This file
```

## Recent Updates

### December 26, 2024 - Credit System & Roadmap
- ✅ **Implemented complete credit system** with Supabase migration
- ✅ **Created affordable pricing** ($5, $10, $15, $25 tiers)
- ✅ **Added credit packs to pricing page** (9 packs: video, image, bundles)
- ✅ **Implemented unlimited credits** for subscriptions and testing
- ✅ **Created comprehensive roadmap** with priority tasks
- ✅ **Committed all changes to GitHub**
- 🚧 **NotebookLM integration** (starting now)
- 🚧 **Agentic Morgys system** (next)
- 🚧 **MCP servers** (next)
- 🚧 **Morgy Market** (next)

### December 26, 2024 - GPT-Image-1.5 & Templates
- ✅ **Updated to GPT-Image-1.5** for image generation (from DALL-E 3)
- ✅ **Fixed Cloudflare Pages hash calculation** (SHA-256 of base64Content + extension, truncated to 32 hex chars)
- ✅ **Verified visual style system** working correctly with keyword detection
- ✅ **Deployed DPPM service** to Fly.io (https://morgus-deploy.fly.dev)
- ✅ **Created comprehensive template system** with 18+ types and 5 visual styles each

### Successful Deployments
- **Sweet Dreams Bakery**: https://sweet-dreams-bakery.pages.dev
- **Carl the Unicorn (dating page)**: https://create-a-landing-page-for-carl-mjnnw1n8.pages.dev

## Setup and Installation

### Prerequisites
- Node.js 18+
- Cloudflare account with API token
- Fly.io account (for DPPM service)
- Supabase project
- OpenAI API key
- Google NotebookLM account (for research features)

### Environment Variables

**DPPM Service** (`dppm-service/.env`):
```bash
OPENAI_API_KEY=your_openai_key
CLOUDFLARE_API_TOKEN=your_cloudflare_token
CLOUDFLARE_ACCOUNT_ID=your_account_id
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_supabase_service_key
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

**Apply Credit System Migration:**
1. Go to Supabase SQL Editor: https://supabase.com/dashboard/project/YOUR_PROJECT/sql
2. Run the migration: `supabase/migrations/20251226_credit_system.sql`
3. Verify tables created: `user_credits`, `credit_transactions`, `credit_packages`, `credit_confirmations`

**Grant Unlimited Credits (for testing):**
```sql
UPDATE user_credits
SET unlimited_image_credits = true,
    unlimited_video_credits = true
WHERE user_id = auth.uid();
```

### Deployment

**Deploy DPPM Service to Fly.io**:
```bash
cd dppm-service
flyctl deploy
```

**Deploy Worker to Cloudflare**:
```bash
cd worker
npm install
npx wrangler deploy
```

**Deploy Console to Cloudflare Pages**:
```bash
cd console
npm install
npm run build
npx wrangler pages deploy dist
```

## Usage

### Creating a Website

Send a natural language request to the Morgus system:

```
"Create a landing page for a luxury spa retreat called Serenity Springs"
```

The system will:
1. Detect template type: `restaurant` (spa/retreat keywords)
2. Detect visual style: `elegant-luxury` (luxury keyword)
3. Check user credits (or bypass if unlimited)
4. Generate hero image and logo using GPT-Image-1.5
5. Deduct image credits (if not unlimited)
6. Generate professional HTML/CSS from template
7. Deploy to Cloudflare Pages
8. Record transaction in credit_transactions
9. Return deployment URL

### Example Prompts

- "Create a startup landing page for NeuralMind AI" → startup template, bold-dynamic style
- "Build a dating profile page for Carl the Unicorn" → dating template, creative-artistic style
- "Make a professional portfolio for a photographer" → portfolio template, modern-minimal style
- "Create an e-commerce site for handmade jewelry" → ecommerce template, elegant-luxury style

### Using NotebookLM (Coming Soon)

```
"Create a research notebook about AI agents"
"Add this PDF to my notebook"
"Generate an audio overview of my notebook"
"What does my notebook say about MCP servers?"
```

### Interacting with Morgys (Coming Soon)

```
"Morgy, help me brainstorm startup ideas"
"Morgy, remember that I prefer modern minimal designs"
"Morgy, proactively suggest improvements to my website"
```

## Learning System

The Morgus learning system enables the agent to learn from its experiences and improve over time:

- **`dppm_reflections`**: Stores task outcomes and lessons learned
- **`model_performance`**: Tracks aggregate performance metrics by task category
- **`user_learning_preferences`**: Stores personalized preferences
- **`task_patterns`**: Remembers successful task decomposition patterns
- **Answer Caching**: Semantic search for frequently accessed answers
- **Morgy Memory**: Per-user, per-Morgy persistent memory (coming soon)

## Development Roadmap

See [MORGUS_ROADMAP.md](./MORGUS_ROADMAP.md) for the complete roadmap.

### 🔥 Priority Tasks (Next 24 Hours)

1. **NotebookLM Integration** (2-3 hours)
   - [ ] Research NotebookLM API
   - [ ] Create NotebookLM service wrapper
   - [ ] Add notebook creation from chat
   - [ ] Implement Q&A from notebooks
   - [ ] Test end-to-end

2. **Agentic Morgys Foundation** (3-4 hours)
   - [ ] Design Morgy architecture
   - [ ] Implement Morgy types
   - [ ] Add Morgy memory system
   - [ ] Create personality engine
   - [ ] Test proactive behaviors

3. **MCP Server Architecture** (2-3 hours)
   - [ ] Research MCP protocol
   - [ ] Set up MCP infrastructure
   - [ ] Implement core MCP servers
   - [ ] Test extensibility

### 📊 Success Metrics

- Daily Active Users (DAU)
- Websites generated per day
- Credit pack conversion rate
- Morgy Market transactions
- User retention (D1, D7, D30)
- Monthly Recurring Revenue (MRR)

## Known Issues

### Current Blockers
- **Fly.io Deployment**: `flyctl deploy` sometimes hangs on "Waiting for depot builder" (Fly.io infrastructure issue)
- **Worker Deployment**: Needs Cloudflare API token for automated deployment

### Workarounds
- Code is committed to GitHub, can redeploy when Fly.io is responsive
- Worker can be deployed manually with `npx wrangler deploy`
- DPPM service already has GPT-Image-1.5 (verified via SSH)

## Contributing

Contributions are welcome! Please ensure:
- Code follows TypeScript best practices
- Templates are responsive and accessible
- Security checks pass (pre-commit hooks)
- Documentation is updated
- Tests are included for new features

## License

MIT License - See LICENSE file for details

## Credits

Inspired by the Manus autonomous agent system and built with modern web technologies.

---

**Built with ❤️ by the Morgus team. Let's build the future of AI agents together!** 🚀
