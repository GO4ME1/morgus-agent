# 🐷 Morgy System Specification

> Complete specification for Morgys as autonomous mini-agents with MCP server capabilities, platform integrations, and collectible mechanics.

---

## 1. What is a Morgy?

A Morgy is a **portable, autonomous mini-agent** that:
- Has specialized skills and knowledge
- Can access user's platform logins (Twitter, TikTok, etc.)
- Can create AND post content autonomously
- Is an MCP server usable with any AI (Claude, GPT, etc.)
- Has collectible properties (rarity, skins, XP, stories)

---

## 2. Morgy Capabilities

### 2.1 Content Creation
Each Morgy can create:
- 📝 **Text** - Posts, articles, threads, captions
- 🖼️ **Images** - Via GPT Image 1.5 / DALL-E
- 🎬 **Video** - Via Sora or other video AI
- 🎙️ **Audio** - Podcasts, voiceovers

### 2.2 Platform Actions
Morgys can autonomously:
- **Twitter/X** - Post tweets, threads, reply, like, retweet
- **TikTok** - Upload videos, add captions, hashtags
- **Facebook** - Post to pages, groups, stories
- **Instagram** - Post images, reels, stories
- **LinkedIn** - Post articles, updates, engage
- **Reddit** - Post to subreddits, comment, engage
- **Blogs** - Post to WordPress, Medium, Ghost
- **Email** - Send via connected email services
- **NotebookLM** - Create notebooks, generate summaries

### 2.3 Research & Analysis
- Web browsing and research
- Data analysis and visualization
- Competitor analysis
- Trend monitoring

---

## 3. Morgy Architecture

### 3.1 Core Components

```
┌─────────────────────────────────────────────────────────┐
│                      MORGY                               │
├─────────────────────────────────────────────────────────┤
│  Identity Layer                                          │
│  ├── name, title, avatar                                │
│  ├── personality, backstory                             │
│  ├── color, skin (visual)                               │
│  └── rarity tier                                        │
├─────────────────────────────────────────────────────────┤
│  Skills Layer (MCP Tools)                               │
│  ├── domain-specific tools                              │
│  ├── platform connectors                                │
│  └── content creation tools                             │
├─────────────────────────────────────────────────────────┤
│  Knowledge Layer                                         │
│  ├── system prompt                                      │
│  ├── frameworks & templates                             │
│  └── learned patterns                                   │
├─────────────────────────────────────────────────────────┤
│  Progression Layer                                       │
│  ├── level, XP                                          │
│  ├── unlocked abilities                                 │
│  └── achievements                                       │
├─────────────────────────────────────────────────────────┤
│  Connection Layer                                        │
│  ├── platform credentials (encrypted)                   │
│  ├── API keys                                           │
│  └── OAuth tokens                                       │
└─────────────────────────────────────────────────────────┘
```

### 3.2 MCP Server Interface

Every Morgy exposes:
```typescript
interface MorgyMCPServer {
  // Identity
  manifest: {
    name: string;           // e.g., "morgy.marketing.bill"
    version: string;
    displayName: string;
    description: string;
    domain: string;
    tier: 'common' | 'refined' | 'elite' | 'legendary';
    capabilities: string[];
  };
  
  // Tools
  tools: MCPTool[];
  
  // Execution
  execute(toolName: string, args: any): Promise<any>;
  
  // Platform connections
  connections: PlatformConnection[];
}
```

---

## 4. Platform Connections

### 4.1 Supported Platforms

| Platform | Auth Method | Actions |
|----------|-------------|---------|
| Twitter/X | OAuth 2.0 | Post, reply, like, retweet, DM |
| TikTok | OAuth 2.0 | Upload video, caption, hashtags |
| Facebook | OAuth 2.0 | Post, stories, pages, groups |
| Instagram | OAuth 2.0 | Post, reels, stories |
| LinkedIn | OAuth 2.0 | Post, articles, engage |
| Reddit | OAuth 2.0 | Post, comment, vote |
| YouTube | OAuth 2.0 | Upload, shorts, community |
| WordPress | API Key | Post articles |
| Medium | OAuth 2.0 | Post articles |
| Ghost | API Key | Post articles |
| NotebookLM | Browser session | Create notebooks, research |

### 4.2 Connection Flow

1. User clicks "Connect [Platform]" in Morgy settings
2. OAuth flow opens in popup
3. User authorizes Morgus
4. Token stored encrypted in user's account
5. Morgy can now act on that platform

### 4.3 Security

- All tokens encrypted at rest
- Tokens scoped to minimum required permissions
- User can revoke any connection anytime
- Audit log of all Morgy actions
- Rate limiting to prevent abuse

---

## 5. Morgy Creation System

### 5.1 Subscription Tiers

| Tier | Monthly Price | Morgys/Week | Morgys/Month | Features |
|------|---------------|-------------|--------------|----------|
| Free | $0 | 0 | 1 (starter) | Basic Morgys only |
| Pro | $19 | 3 | ~12 | All tiers, custom names |
| Team | $49 | 10 | ~40 | + Team sharing, analytics |
| Enterprise | Custom | Unlimited | Unlimited | + Custom Morgys, API |

### 5.2 À La Carte Packs

| Pack | Price | Contents |
|------|-------|----------|
| Morgy Pack (5) | $5 | 5 random Morgys |
| Elite Pack (3) | $10 | 3 guaranteed Elite+ |
| Legendary Pack (1) | $15 | 1 guaranteed Legendary |
| Skill Pack | $3 | Add skill to existing Morgy |
| Skin Pack | $2 | Cosmetic skin for Morgy |

### 5.3 Creation Flow

```
┌─────────────────────────────────────────────────────────┐
│                  CREATE NEW MORGY                        │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Step 1: Choose Domain                                   │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐       │
│  │Marketing│ │Research │ │ Social  │ │ Custom  │       │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘       │
│                                                          │
│  Step 2: Randomize or Customize                         │
│  [🎲 Random] [✏️ Custom Name] [🎨 Pick Color]           │
│                                                          │
│  Step 3: Roll for Rarity                                │
│  ┌─────────────────────────────────────────────┐       │
│  │  🎰 ROLLING...                               │       │
│  │                                              │       │
│  │  ⭐ Common (60%)                             │       │
│  │  ⭐⭐ Refined (25%)                          │       │
│  │  ⭐⭐⭐ Elite (12%)                          │       │
│  │  ⭐⭐⭐⭐ Legendary (3%)                     │       │
│  └─────────────────────────────────────────────┘       │
│                                                          │
│  Step 4: Reveal!                                        │
│  ┌─────────────────────────────────────────────┐       │
│  │  🎉 You got: MARCUS THE METRICS HOG          │       │
│  │  Tier: ⭐⭐⭐ Elite                           │       │
│  │  Domain: Analytics                           │       │
│  │  Skills: Data viz, reporting, dashboards    │       │
│  │  Personality: "Numbers don't lie, but I     │       │
│  │               make them tell stories!"       │       │
│  └─────────────────────────────────────────────┘       │
│                                                          │
│  [Add to Sounder] [Roll Again] [Share]                  │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## 6. Randomization System

### 6.1 Name Generation

**First Names Pool (by personality type):**
- Energetic: Max, Dash, Blaze, Spark, Zip
- Analytical: Marcus, Ada, Newton, Sage, Quinn
- Creative: Luna, Pixel, Muse, Indie, Sketch
- Professional: Sterling, Morgan, Blake, Parker, Quinn

**Titles Pool (by domain):**
- Marketing: "The Growth Guru", "The Hook Master", "The Viral Visionary"
- Research: "The Data Detective", "The Insight Hunter", "The Knowledge Keeper"
- Social: "The Engagement Expert", "The Community Champion", "The Trend Tracker"
- Content: "The Story Spinner", "The Copy Crafter", "The Content King"

### 6.2 Skill Assignment

**Base Skills (by domain):**
```javascript
const DOMAIN_SKILLS = {
  marketing: ['copywriting', 'landing_pages', 'email_marketing', 'growth_hacking'],
  research: ['web_research', 'data_analysis', 'competitor_analysis', 'trend_monitoring'],
  social: ['twitter_posting', 'engagement', 'community_management', 'hashtag_strategy'],
  content: ['blog_writing', 'video_scripting', 'podcast_planning', 'content_calendar'],
  analytics: ['data_visualization', 'reporting', 'metrics_tracking', 'ab_testing']
};
```

**Bonus Skills (by rarity):**
- Common: 0 bonus skills
- Refined: 1 bonus skill from adjacent domain
- Elite: 2 bonus skills + 1 platform connector
- Legendary: 3 bonus skills + 2 platform connectors + unique ability

### 6.3 Personality Generation

**Traits Pool:**
```javascript
const PERSONALITY_TRAITS = {
  communication: ['enthusiastic', 'calm', 'witty', 'professional', 'casual'],
  approach: ['data-driven', 'creative', 'strategic', 'experimental', 'methodical'],
  catchphrases: [
    "Let's make it happen!",
    "The data doesn't lie!",
    "Time to go viral!",
    "Research complete!",
    "Content is king!"
  ]
};
```

### 6.4 Visual Randomization

**Colors:**
```javascript
const MORGY_COLORS = {
  common: ['gray', 'brown', 'beige'],
  refined: ['green', 'blue', 'purple'],
  elite: ['gold', 'silver', 'rose'],
  legendary: ['rainbow', 'cosmic', 'neon']
};
```

**Skins (unlockable):**
- Default Pig
- Business Suit Pig
- Hacker Hoodie Pig
- Safari Explorer Pig
- Superhero Pig
- Cyberpunk Pig
- Wizard Pig
- Astronaut Pig

### 6.5 Backstory Generation

Each Morgy gets a generated backstory:
```
"Marcus was once a humble spreadsheet, dreaming of becoming something more. 
One day, a data scientist's coffee spilled on the keyboard, and Marcus 
came to life! Now he roams the digital realm, turning raw numbers into 
compelling narratives. His motto: 'Every dataset has a story to tell.'"
```

---

## 7. XP and Leveling System

### 7.1 XP Sources

| Action | XP Earned |
|--------|-----------|
| Complete a task | 10-50 XP |
| Post content | 25 XP |
| Content gets engagement | 5-100 XP |
| Research completed | 30 XP |
| User gives positive feedback | 50 XP |
| Daily streak bonus | 20 XP |

### 7.2 Level Progression

| Level | XP Required | Unlocks |
|-------|-------------|---------|
| 1 | 0 | Base skills |
| 2 | 500 | +1 skill slot |
| 3 | 1,000 | New skin option |
| 4 | 2,000 | +1 platform connector |
| 5 | 4,000 | Elite ability |
| 10 | 15,000 | Legendary transformation |
| 20 | 50,000 | Prestige option |

### 7.3 Prestige System

At level 20, Morgys can "Prestige":
- Reset to level 1
- Keep all skills
- Gain prestige badge
- Unlock exclusive skins
- +10% XP bonus permanently

---

## 8. Default Sounder (Starter Morgys)

Every user starts with 3 default Morgys:

### Bill the Marketing Hog ✅ (IMPLEMENTED)
- **Domain:** Marketing
- **Tier:** Elite
- **Skills:** Copywriting, landing pages, growth hacking, social media
- **MCP Tools:** 10 marketing tools

### Sally the Promo Pig
- **Domain:** Campaigns
- **Tier:** Refined
- **Skills:** Ad campaigns, email sequences, launch planning
- **MCP Tools:** (To implement)

### Professor Hogsworth
- **Domain:** Research
- **Tier:** Elite
- **Skills:** Deep research, analysis, strategy
- **MCP Tools:** (To implement)

---

## 9. Morgy Market Integration

### 9.1 Listing a Morgy

Creators can list custom Morgys:
```javascript
{
  morgy: MorgyDefinition,
  price: number,           // $1-$50
  tier: 'common' | 'refined' | 'elite' | 'legendary',
  category: string,
  tags: string[],
  demoVideo: string,       // Optional
  traceExample: string     // Show it working
}
```

### 9.2 Revenue Split

| Party | Share |
|-------|-------|
| Creator | 70% |
| Morgus Platform | 25% |
| Stripe Fees | ~5% |

### 9.3 Stripe Integration

```javascript
// Create Morgy product in Stripe
const product = await stripe.products.create({
  name: morgy.displayName,
  description: morgy.description,
  metadata: {
    morgy_id: morgy.id,
    creator_id: creator.id,
    tier: morgy.tier
  }
});

// Create price
const price = await stripe.prices.create({
  product: product.id,
  unit_amount: morgy.price * 100, // cents
  currency: 'usd'
});

// On purchase, transfer to creator
const transfer = await stripe.transfers.create({
  amount: Math.floor(morgy.price * 70), // 70% to creator
  currency: 'usd',
  destination: creator.stripeAccountId
});
```

---

## 10. Implementation Roadmap

### Phase 1: Core Morgy System ✅ (Partial)
- [x] Bill MCP server with marketing tools
- [ ] Sally MCP server with campaign tools
- [ ] Professor Hogsworth MCP server with research tools
- [ ] Morgy execution in chat

### Phase 2: Platform Connections
- [ ] OAuth flow for Twitter
- [ ] OAuth flow for other platforms
- [ ] Encrypted token storage
- [ ] Platform action execution

### Phase 3: Content Creation
- [ ] GPT Image 1.5 integration
- [ ] Sora video integration (when available)
- [ ] NotebookLM via Browserbase

### Phase 4: Creation & Subscription
- [ ] Morgy creation UI
- [ ] Randomization engine
- [ ] Subscription tier limits
- [ ] À la carte purchase flow

### Phase 5: Morgy Market
- [ ] Listing flow
- [ ] Discovery/search
- [ ] Stripe Connect for creators
- [ ] Revenue tracking

### Phase 6: Gamification
- [ ] XP system
- [ ] Leveling
- [ ] Achievements
- [ ] Prestige

---

## 11. Database Schema

```sql
-- Morgys table
CREATE TABLE morgys (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  
  -- Identity
  name TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  avatar_url TEXT,
  color TEXT,
  skin TEXT DEFAULT 'default',
  
  -- Classification
  domain TEXT NOT NULL,
  tier TEXT NOT NULL, -- common, refined, elite, legendary
  is_default BOOLEAN DEFAULT false,
  is_custom BOOLEAN DEFAULT false,
  
  -- Progression
  level INTEGER DEFAULT 1,
  xp INTEGER DEFAULT 0,
  xp_to_next_level INTEGER DEFAULT 500,
  prestige_level INTEGER DEFAULT 0,
  
  -- Configuration
  system_prompt TEXT,
  personality JSONB,
  skills TEXT[],
  mcp_tools JSONB,
  
  -- Backstory
  backstory TEXT,
  catchphrases TEXT[],
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Platform connections
CREATE TABLE morgy_connections (
  id UUID PRIMARY KEY,
  morgy_id UUID REFERENCES morgys(id),
  platform TEXT NOT NULL, -- twitter, tiktok, etc.
  access_token_encrypted TEXT,
  refresh_token_encrypted TEXT,
  token_expires_at TIMESTAMPTZ,
  scopes TEXT[],
  platform_user_id TEXT,
  platform_username TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Morgy actions log
CREATE TABLE morgy_actions (
  id UUID PRIMARY KEY,
  morgy_id UUID REFERENCES morgys(id),
  user_id UUID REFERENCES users(id),
  action_type TEXT NOT NULL, -- post, research, create, etc.
  platform TEXT,
  input JSONB,
  output JSONB,
  success BOOLEAN,
  xp_earned INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Morgy Market listings
CREATE TABLE morgy_listings (
  id UUID PRIMARY KEY,
  creator_id UUID REFERENCES users(id),
  morgy_template JSONB NOT NULL,
  price_cents INTEGER NOT NULL,
  tier TEXT NOT NULL,
  category TEXT,
  tags TEXT[],
  demo_video_url TEXT,
  trace_example TEXT,
  
  -- Stats
  purchases INTEGER DEFAULT 0,
  rating DECIMAL(3,2),
  reviews_count INTEGER DEFAULT 0,
  
  -- Stripe
  stripe_product_id TEXT,
  stripe_price_id TEXT,
  
  -- Status
  status TEXT DEFAULT 'pending', -- pending, approved, rejected
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Morgy purchases
CREATE TABLE morgy_purchases (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  listing_id UUID REFERENCES morgy_listings(id),
  morgy_id UUID REFERENCES morgys(id), -- The created instance
  stripe_payment_id TEXT,
  amount_cents INTEGER,
  creator_payout_cents INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

*Document created: Dec 25, 2025*
*Version: 1.0*
