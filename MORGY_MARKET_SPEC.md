# 🥩 Morgy Market Specification

> "Like a meat market, but for AI agents" 🐷

## Overview

The Morgy Market is a marketplace where users can:
- **Buy** pre-made Morgys with specialized skills
- **Sell** their own custom Morgys
- **Trade** Morgys with other users
- **Earn** from Morgy usage (creator royalties)

---

## Business Model

### Revenue Streams

| Stream | Description | Take Rate |
|--------|-------------|-----------|
| **Morgy Sales** | One-time purchase of Morgys | 30% |
| **Skin Sales** | Cosmetic customizations | 30% |
| **Skill Packs** | Additional abilities | 30% |
| **Subscriptions** | Monthly Morgy creation limits | 100% |
| **À La Carte Packs** | Extra Morgy creation credits | 100% |
| **Usage Royalties** | Per-use fees for premium Morgys | 20% |

### Pricing Tiers

#### Pre-Made Morgys

| Rarity | Price | Creator Payout | Morgus Take |
|--------|-------|----------------|-------------|
| **Common** | $1 | $0.70 | $0.30 |
| **Refined** | $2 | $1.40 | $0.60 |
| **Elite** | $3 | $2.10 | $0.90 |
| **Legendary** | $5-10 | $3.50-7.00 | $1.50-3.00 |

#### Skins & Cosmetics

| Type | Price | Notes |
|------|-------|-------|
| **Basic Skin** | $0.50 | Color variations |
| **Premium Skin** | $1.00 | Animated effects |
| **Legendary Skin** | $2.00 | Unique animations + sound |
| **Seasonal Skin** | $1.50 | Limited time |

#### Skill Packs

| Pack | Price | Contents |
|------|-------|----------|
| **Skill Pack (3)** | $3 | 3 random skills |
| **Skill Pack (5)** | $5 | 5 random skills |
| **Specific Skill** | $2 | Choose exact skill |
| **Legendary Skill** | $5 | Rare powerful skill |

#### À La Carte Packs

| Pack | Price | Contents |
|------|-------|----------|
| **Morgy Pack (5)** | $5 | 5 creation credits |
| **Elite Pack (3)** | $10 | 3 guaranteed Elite+ |
| **Legendary Pack (1)** | $15 | 1 guaranteed Legendary |
| **Skill Pack** | $3 | 3 random skills |
| **Skin Pack** | $2 | 3 random skins |

---

## Stripe Integration

### Products & Prices

```typescript
// Stripe Product IDs
const STRIPE_PRODUCTS = {
  // Subscription Plans
  subscriptions: {
    pro: 'prod_morgus_pro',
    team: 'prod_morgus_team',
    enterprise: 'prod_morgus_enterprise'
  },
  
  // One-time Purchases
  packs: {
    morgy_5: 'prod_morgy_pack_5',
    elite_3: 'prod_elite_pack_3',
    legendary_1: 'prod_legendary_pack_1',
    skill_3: 'prod_skill_pack_3',
    skin_3: 'prod_skin_pack_3'
  },
  
  // Dynamic Products (created per Morgy)
  morgys: {
    // Created dynamically when Morgy is listed
    // prod_morgy_{morgy_id}
  }
};

// Price IDs
const STRIPE_PRICES = {
  subscriptions: {
    pro_monthly: 'price_pro_monthly_19',
    pro_yearly: 'price_pro_yearly_190',
    team_monthly: 'price_team_monthly_49',
    team_yearly: 'price_team_yearly_490'
  },
  packs: {
    morgy_5: 'price_morgy_pack_500',
    elite_3: 'price_elite_pack_1000',
    legendary_1: 'price_legendary_pack_1500',
    skill_3: 'price_skill_pack_300',
    skin_3: 'price_skin_pack_200'
  }
};
```

### Checkout Flow

```typescript
// Create checkout session for Morgy purchase
async function createMorgyCheckout(
  morgyId: string,
  userId: string,
  env: Env
): Promise<string> {
  const morgy = await getMorgy(morgyId, env);
  const stripe = new Stripe(env.STRIPE_SECRET_KEY);
  
  // Get or create Stripe product for this Morgy
  let productId = morgy.stripe_product_id;
  if (!productId) {
    const product = await stripe.products.create({
      name: morgy.name,
      description: `${morgy.rarity} Morgy - ${morgy.domain}`,
      metadata: {
        morgy_id: morgyId,
        creator_id: morgy.creator_id,
        rarity: morgy.rarity
      }
    });
    productId = product.id;
    
    // Create price
    await stripe.prices.create({
      product: productId,
      unit_amount: morgy.price * 100, // cents
      currency: 'usd'
    });
    
    // Save product ID to Morgy
    await updateMorgy(morgyId, { stripe_product_id: productId }, env);
  }
  
  // Create checkout session
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    line_items: [{
      price_data: {
        currency: 'usd',
        product: productId,
        unit_amount: morgy.price * 100
      },
      quantity: 1
    }],
    metadata: {
      type: 'morgy_purchase',
      morgy_id: morgyId,
      buyer_id: userId,
      creator_id: morgy.creator_id
    },
    success_url: `${env.APP_URL}/market/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${env.APP_URL}/market/morgy/${morgyId}`
  });
  
  return session.url;
}
```

### Webhook Handler

```typescript
// Handle Stripe webhooks
async function handleStripeWebhook(
  request: Request,
  env: Env
): Promise<Response> {
  const stripe = new Stripe(env.STRIPE_SECRET_KEY);
  const signature = request.headers.get('stripe-signature');
  const body = await request.text();
  
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature!,
      env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    return new Response('Webhook signature verification failed', { status: 400 });
  }
  
  switch (event.type) {
    case 'checkout.session.completed':
      await handleCheckoutComplete(event.data.object, env);
      break;
    
    case 'customer.subscription.created':
    case 'customer.subscription.updated':
      await handleSubscriptionUpdate(event.data.object, env);
      break;
    
    case 'customer.subscription.deleted':
      await handleSubscriptionCanceled(event.data.object, env);
      break;
    
    case 'invoice.payment_succeeded':
      await handlePaymentSuccess(event.data.object, env);
      break;
    
    case 'invoice.payment_failed':
      await handlePaymentFailed(event.data.object, env);
      break;
  }
  
  return new Response('OK', { status: 200 });
}

// Handle completed checkout
async function handleCheckoutComplete(
  session: Stripe.Checkout.Session,
  env: Env
): Promise<void> {
  const { type, morgy_id, buyer_id, creator_id } = session.metadata || {};
  
  switch (type) {
    case 'morgy_purchase':
      await processMorgyPurchase(morgy_id!, buyer_id!, creator_id!, session.amount_total!, env);
      break;
    
    case 'pack_purchase':
      await processPackPurchase(session.metadata!, env);
      break;
    
    case 'skin_purchase':
      await processSkinPurchase(session.metadata!, env);
      break;
    
    case 'skill_purchase':
      await processSkillPurchase(session.metadata!, env);
      break;
  }
}

// Process Morgy purchase with creator payout
async function processMorgyPurchase(
  morgyId: string,
  buyerId: string,
  creatorId: string,
  amountCents: number,
  env: Env
): Promise<void> {
  const stripe = new Stripe(env.STRIPE_SECRET_KEY);
  
  // Calculate split (70% creator, 30% Morgus)
  const creatorAmount = Math.floor(amountCents * 0.7);
  const platformAmount = amountCents - creatorAmount;
  
  // Record purchase
  await recordPurchase({
    morgy_id: morgyId,
    buyer_id: buyerId,
    creator_id: creatorId,
    amount: amountCents / 100,
    creator_payout: creatorAmount / 100,
    platform_fee: platformAmount / 100,
    status: 'completed'
  }, env);
  
  // Grant Morgy to buyer
  await grantMorgyToUser(morgyId, buyerId, env);
  
  // Update creator earnings
  await updateCreatorEarnings(creatorId, creatorAmount / 100, env);
  
  // If creator has Stripe Connect, transfer funds
  const creator = await getUser(creatorId, env);
  if (creator.stripe_connect_id) {
    await stripe.transfers.create({
      amount: creatorAmount,
      currency: 'usd',
      destination: creator.stripe_connect_id,
      metadata: {
        morgy_id: morgyId,
        buyer_id: buyerId
      }
    });
  }
}
```

### Stripe Connect for Creators

```typescript
// Onboard creator to Stripe Connect
async function onboardCreator(
  userId: string,
  env: Env
): Promise<string> {
  const stripe = new Stripe(env.STRIPE_SECRET_KEY);
  
  // Create Connect account
  const account = await stripe.accounts.create({
    type: 'express',
    country: 'US',
    email: (await getUser(userId, env)).email,
    capabilities: {
      card_payments: { requested: true },
      transfers: { requested: true }
    },
    metadata: {
      user_id: userId
    }
  });
  
  // Save account ID
  await updateUser(userId, { stripe_connect_id: account.id }, env);
  
  // Create onboarding link
  const accountLink = await stripe.accountLinks.create({
    account: account.id,
    refresh_url: `${env.APP_URL}/profile/connect/refresh`,
    return_url: `${env.APP_URL}/profile/connect/complete`,
    type: 'account_onboarding'
  });
  
  return accountLink.url;
}

// Check creator payout status
async function getCreatorPayoutStatus(
  userId: string,
  env: Env
): Promise<{
  connected: boolean;
  balance: number;
  pendingPayouts: number;
}> {
  const user = await getUser(userId, env);
  
  if (!user.stripe_connect_id) {
    return { connected: false, balance: 0, pendingPayouts: 0 };
  }
  
  const stripe = new Stripe(env.STRIPE_SECRET_KEY);
  const balance = await stripe.balance.retrieve({
    stripeAccount: user.stripe_connect_id
  });
  
  return {
    connected: true,
    balance: balance.available[0]?.amount || 0,
    pendingPayouts: balance.pending[0]?.amount || 0
  };
}
```

---

## Database Schema

### Tables

```sql
-- Morgy Market Listings
CREATE TABLE morgy_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  morgy_id UUID REFERENCES morgys(id) ON DELETE CASCADE,
  creator_id UUID REFERENCES auth.users(id),
  
  -- Listing Info
  title TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  
  -- Status
  status TEXT DEFAULT 'active', -- active, sold, delisted
  featured BOOLEAN DEFAULT false,
  verified BOOLEAN DEFAULT false,
  
  -- Stats
  views INTEGER DEFAULT 0,
  purchases INTEGER DEFAULT 0,
  rating DECIMAL(3, 2),
  review_count INTEGER DEFAULT 0,
  
  -- Stripe
  stripe_product_id TEXT,
  stripe_price_id TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Purchases
CREATE TABLE morgy_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID REFERENCES morgy_listings(id),
  morgy_id UUID REFERENCES morgys(id),
  buyer_id UUID REFERENCES auth.users(id),
  creator_id UUID REFERENCES auth.users(id),
  
  -- Transaction
  amount DECIMAL(10, 2) NOT NULL,
  creator_payout DECIMAL(10, 2) NOT NULL,
  platform_fee DECIMAL(10, 2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  
  -- Stripe
  stripe_session_id TEXT,
  stripe_payment_intent_id TEXT,
  stripe_transfer_id TEXT,
  
  -- Status
  status TEXT DEFAULT 'pending', -- pending, completed, refunded
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Creator Earnings
CREATE TABLE creator_earnings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID REFERENCES auth.users(id),
  
  -- Totals
  total_earnings DECIMAL(10, 2) DEFAULT 0,
  total_paid_out DECIMAL(10, 2) DEFAULT 0,
  pending_payout DECIMAL(10, 2) DEFAULT 0,
  
  -- Stats
  total_sales INTEGER DEFAULT 0,
  total_morgys_sold INTEGER DEFAULT 0,
  
  -- Timestamps
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Skin Purchases
CREATE TABLE skin_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  skin_id TEXT NOT NULL,
  morgy_id UUID REFERENCES morgys(id),
  
  -- Transaction
  amount DECIMAL(10, 2) NOT NULL,
  stripe_session_id TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Skill Purchases
CREATE TABLE skill_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  skill_id TEXT NOT NULL,
  morgy_id UUID REFERENCES morgys(id),
  
  -- Transaction
  amount DECIMAL(10, 2) NOT NULL,
  stripe_session_id TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reviews
CREATE TABLE morgy_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID REFERENCES morgy_listings(id),
  buyer_id UUID REFERENCES auth.users(id),
  
  -- Review
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  title TEXT,
  body TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_listings_status ON morgy_listings(status);
CREATE INDEX idx_listings_creator ON morgy_listings(creator_id);
CREATE INDEX idx_listings_featured ON morgy_listings(featured) WHERE featured = true;
CREATE INDEX idx_purchases_buyer ON morgy_purchases(buyer_id);
CREATE INDEX idx_purchases_creator ON morgy_purchases(creator_id);
```

---

## API Endpoints

### Market Browsing

```typescript
// GET /api/market/listings
// Browse all listings with filters
interface ListingsQuery {
  rarity?: 'common' | 'refined' | 'elite' | 'legendary';
  domain?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: 'newest' | 'popular' | 'price_low' | 'price_high' | 'rating';
  page?: number;
  limit?: number;
}

// GET /api/market/listings/:id
// Get single listing details

// GET /api/market/listings/:id/reviews
// Get listing reviews

// GET /api/market/featured
// Get featured listings

// GET /api/market/trending
// Get trending listings (most purchases this week)

// GET /api/market/new
// Get newest listings
```

### Selling

```typescript
// POST /api/market/listings
// Create new listing
interface CreateListingRequest {
  morgy_id: string;
  title: string;
  description: string;
  price: number;
}

// PUT /api/market/listings/:id
// Update listing

// DELETE /api/market/listings/:id
// Delist (soft delete)

// GET /api/market/my-listings
// Get creator's listings

// GET /api/market/my-sales
// Get creator's sales history

// GET /api/market/my-earnings
// Get creator's earnings summary
```

### Buying

```typescript
// POST /api/market/checkout
// Create checkout session
interface CheckoutRequest {
  listing_id: string;
}

// GET /api/market/my-purchases
// Get user's purchase history

// POST /api/market/reviews
// Leave a review
interface ReviewRequest {
  listing_id: string;
  rating: number;
  title?: string;
  body?: string;
}
```

### Creator Payouts

```typescript
// POST /api/market/connect/onboard
// Start Stripe Connect onboarding

// GET /api/market/connect/status
// Get Connect account status

// POST /api/market/connect/payout
// Request manual payout (if balance > $25)
```

---

## UI Components (Frontend)

### Market Browse Page

```typescript
// Components needed:
// - ListingCard (thumbnail, name, rarity, price, rating)
// - FilterSidebar (rarity, domain, price range)
// - SortDropdown (newest, popular, price)
// - SearchBar
// - Pagination
// - FeaturedCarousel
// - TrendingSection
```

### Listing Detail Page

```typescript
// Components needed:
// - MorgyPreview (3D/animated preview)
// - PriceTag
// - BuyButton (opens Stripe checkout)
// - CreatorCard (avatar, name, rating, other listings)
// - SkillsList
// - ReviewsList
// - RelatedMorgys
```

### Creator Dashboard

```typescript
// Components needed:
// - EarningsSummary (total, pending, paid)
// - SalesChart (over time)
// - ListingsTable (manage listings)
// - PayoutButton (request payout)
// - ConnectOnboarding (if not connected)
```

### Checkout Flow

```
1. User clicks "Buy" on listing
2. Frontend calls POST /api/market/checkout
3. Backend creates Stripe checkout session
4. User redirected to Stripe checkout
5. User completes payment
6. Stripe webhook fires checkout.session.completed
7. Backend:
   - Records purchase
   - Grants Morgy to buyer
   - Updates creator earnings
   - Transfers funds to creator (if Connect)
8. User redirected to success page
9. Morgy appears in user's collection
```

---

## Trust & Safety

### Verification System

| Level | Requirements | Badge |
|-------|--------------|-------|
| **New** | Just joined | None |
| **Verified** | Email verified, 1+ sale | ✓ |
| **Trusted** | 10+ sales, 4.5+ rating | ⭐ |
| **Top Creator** | 50+ sales, 4.8+ rating, featured | 👑 |

### Content Moderation

```typescript
// Auto-moderation checks before listing goes live:
// 1. Morgy name - no profanity, no impersonation
// 2. Description - no spam, no external links
// 3. Skills - no harmful capabilities
// 4. Pricing - within allowed range ($1-$100)

async function moderateListing(listing: CreateListingRequest): Promise<{
  approved: boolean;
  issues: string[];
}> {
  const issues: string[] = [];
  
  // Check name
  if (containsProfanity(listing.title)) {
    issues.push('Title contains inappropriate language');
  }
  
  // Check description
  if (containsSpam(listing.description)) {
    issues.push('Description appears to be spam');
  }
  
  // Check price
  if (listing.price < 1 || listing.price > 100) {
    issues.push('Price must be between $1 and $100');
  }
  
  return {
    approved: issues.length === 0,
    issues
  };
}
```

### Refund Policy

- **Within 24 hours:** Full refund if Morgy not used
- **Within 7 days:** 50% refund if Morgy used < 5 times
- **After 7 days:** No refund (dispute through Stripe)

---

## Launch Plan

### Phase 1: MVP (Week 1-2)
- [ ] Basic listing creation
- [ ] Stripe checkout integration
- [ ] Purchase flow
- [ ] My purchases page

### Phase 2: Creators (Week 3-4)
- [ ] Stripe Connect onboarding
- [ ] Creator dashboard
- [ ] Earnings tracking
- [ ] Payout requests

### Phase 3: Discovery (Week 5-6)
- [ ] Search & filters
- [ ] Featured listings
- [ ] Trending algorithm
- [ ] Reviews & ratings

### Phase 4: Growth (Week 7-8)
- [ ] Skins & cosmetics
- [ ] Skill packs
- [ ] Referral rewards
- [ ] Creator promotions

---

## Metrics to Track

| Metric | Description | Target |
|--------|-------------|--------|
| **GMV** | Gross merchandise value | $10k/month |
| **Take Rate** | Platform revenue / GMV | 30% |
| **Listings** | Total active listings | 500+ |
| **Creators** | Unique sellers | 100+ |
| **Conversion** | Views → Purchases | 5% |
| **Repeat Rate** | Buyers who buy again | 30% |
| **Avg Order Value** | Average purchase | $3 |
| **Creator Retention** | Creators who list again | 50% |
