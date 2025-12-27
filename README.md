# Morgus Autonomous Agent System

**Morgus** is an autonomous AI agent system that creates and deploys websites, landing pages, apps, and presentations using AI-powered templates. The system uses a Mixture of Experts (MOE) architecture with multiple AI models, deploys to Cloudflare Pages, and includes template-based generation with AI-generated images and videos.

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

## Architecture

Morgus uses a **distributed architecture** with multiple specialized services:

### Services

1. **Cloudflare Worker** (`morgus-orchestrator`)
   - Main orchestrator for routing requests
   - Analyzes complexity and routes to appropriate service
   - Handles chat interface and user interactions

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

### AI-Powered Asset Generation

- **Images**: GPT-Image-1.5 for hero images and logos
- **Videos**: Sora 2 framework ready (opt-in with user confirmation)
- **Credit System**: 
  - Images: 50 for $10 ($0.20 each)
  - Videos: 20 for $15 ($0.75 each, 5-sec)
  - Bundle: 50 images + 20 videos for $20

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

## Project Structure

```
morgus-agent/
├── dppm-service/              # Node.js DPPM service with template system
│   ├── src/
│   │   ├── template-generator.ts          # Main template generation logic
│   │   ├── cloudflare-pages-deployer.ts   # Cloudflare Pages deployment
│   │   ├── image-generator.ts             # GPT-Image-1.5 integration
│   │   ├── video-generator.ts             # Sora 2 integration (framework)
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
│   │   ├── lib/                           # Utilities
│   │   └── App.tsx                        # Main app
│   └── wrangler.toml
└── supabase/                  # Supabase schema and migrations
    └── migrations/
```

## Recent Updates

### December 26, 2025
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

### Environment Variables

**DPPM Service** (`dppm-service/.env`):
```bash
OPENAI_API_KEY=your_openai_key
CLOUDFLARE_API_TOKEN=your_cloudflare_token
CLOUDFLARE_ACCOUNT_ID=your_account_id
```

**Worker** (configured as secrets):
```bash
wrangler secret put OPENAI_API_KEY
wrangler secret put CLOUDFLARE_API_TOKEN
wrangler secret put CLOUDFLARE_ACCOUNT_ID
wrangler secret put SUPABASE_URL
wrangler secret put SUPABASE_SERVICE_KEY
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
3. Generate hero image and logo using GPT-Image-1.5
4. Generate professional HTML/CSS from template
5. Deploy to Cloudflare Pages
6. Return deployment URL

### Example Prompts

- "Create a startup landing page for NeuralMind AI" → startup template, bold-dynamic style
- "Build a dating profile page for Carl the Unicorn" → dating template, creative-artistic style
- "Make a professional portfolio for a photographer" → portfolio template, modern-minimal style
- "Create an e-commerce site for handmade jewelry" → ecommerce template, elegant-luxury style

## Learning System

The Morgus learning system enables the agent to learn from its experiences and improve over time:

- **`dppm_reflections`**: Stores task outcomes and lessons learned
- **`model_performance`**: Tracks aggregate performance metrics by task category
- **`user_learning_preferences`**: Stores personalized preferences
- **`task_patterns`**: Remembers successful task decomposition patterns
- **Answer Caching**: Semantic search for frequently accessed answers

## Known Issues

### Current Blockers
- **Fly.io Deployment**: `flyctl deploy` sometimes hangs on "Waiting for depot builder" (Fly.io infrastructure issue)
- **Worker DNS**: Need to verify worker deployment and DNS configuration

### Workarounds
- Code is committed to GitHub, can redeploy when Fly.io is responsive
- Worker secrets are configured, only CLI operations affected

## Development Status

The project is under active development. Recent focus areas:

- ✅ Template system with 18+ types and 5 visual styles
- ✅ GPT-Image-1.5 integration for images
- ✅ Cloudflare Pages deployment with correct hash calculation
- 🚧 Sora 2 video generation (framework ready, not enabled)
- 🚧 Credit system implementation (designed, not deployed)
- 🚧 User confirmation for video generation

## Contributing

Contributions are welcome! Please ensure:
- Code follows TypeScript best practices
- Templates are responsive and accessible
- Security checks pass (pre-commit hooks)
- Documentation is updated

## License

MIT License - See LICENSE file for details

## Credits

Inspired by the Manus autonomous agent system and built with modern web technologies.
