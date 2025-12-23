# Morgus Billing Enforcement System

**Version:** 1.0  
**Date:** December 21, 2025  
**Status:** ✅ Production Ready

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Database Schema](#database-schema)
4. [Installation](#installation)
5. [Configuration](#configuration)
6. [Usage](#usage)
7. [API Reference](#api-reference)
8. [Testing](#testing)
9. [Troubleshooting](#troubleshooting)

---

## Overview

The Morgus Billing Enforcement System is a complete, production-ready subscription management solution that integrates Stripe payments, usage tracking, and automated enforcement of plan limits.

### Key Features

- **✅ Stripe Integration** - Full webhook handling for subscriptions and payments
- **✅ Usage Tracking** - Real-time tracking of daily feature usage
- **✅ Plan Enforcement** - Automatic restriction of tools based on user plan
- **✅ Promo Codes** - Flexible promo code system with redemption tracking
- **✅ Automated Expiration** - Cron jobs to expire old subscriptions
- **✅ Secure** - Row-level security (RLS) on all tables

### Supported Plans

| Plan | Price | Features |
| :--- | :--- | :--- |
| **Free** | $0 | 10 messages/day, 1 build/day, basic features |
| **Daily** | $3/day | 100 messages/day, 10 builds/day, all features |
| **Weekly** | $21/week | Unlimited messages, unlimited builds, all features |
| **Monthly** | $75/month | Unlimited everything, priority support |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Cloudflare Worker                         │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ Stripe       │  │ Tool         │  │ Expiration   │     │
│  │ Webhooks     │  │ Enforcement  │  │ Checker      │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│         │                  │                  │             │
│         └──────────────────┴──────────────────┘             │
│                           │                                 │
└───────────────────────────┼─────────────────────────────────┘
                            │
                            ▼
                   ┌─────────────────┐
                   │   Supabase      │
                   │   PostgreSQL    │
                   │                 │
                   │  - subscriptions│
                   │  - usage_tracking│
                   │  - payment_history│
                   │  - promo_codes  │
                   │  - profiles     │
                   └─────────────────┘
```

### Components

1. **Stripe Service** (`stripe.ts`) - Handles all Stripe operations
2. **Subscription Middleware** (`subscription-middleware.ts`) - Checks plan limits
3. **Tool Enforcement** (`tool-enforcement.ts`) - Wraps tool execution
4. **Expiration Service** (`subscription-expiration.ts`) - Automated cleanup
5. **Promo API** (`promo-api.ts`) - Promo code management
6. **Usage API** (`usage-api.ts`) - Usage tracking endpoints

---

## Database Schema

### Tables Created

1. **`subscriptions`** - Subscription history and status
2. **`usage_tracking`** - Daily usage counters per user
3. **`payment_history`** - Payment transaction records
4. **`promo_codes`** - Promotional codes
5. **`promo_code_redemptions`** - Redemption tracking

### Migration File

Location: `worker/migrations/001_billing_enforcement.sql`

**To apply the migration:**

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the entire migration file
4. Click **Run** to execute

**To verify:**

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('subscriptions', 'usage_tracking', 'payment_history', 'promo_codes', 'promo_code_redemptions');
```

---

## Installation

### Step 1: Apply Database Migration

```bash
# Copy the migration file to your Supabase project
# Then run it in the SQL Editor
```

### Step 2: Configure Environment Variables

Add these to your `wrangler.toml`:

```toml
[vars]
SUPABASE_URL = "https://your-project.supabase.co"

[secrets]
SUPABASE_SERVICE_KEY = "your-service-key"
STRIPE_SECRET_KEY = "sk_test_..."
STRIPE_WEBHOOK_SECRET = "whsec_..."
```

### Step 3: Set Up Stripe Webhook

1. Go to Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://your-worker.workers.dev/api/stripe/webhook`
3. Select events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.paid`
   - `invoice.payment_failed`
4. Copy the webhook secret to your environment variables

### Step 4: Configure Cron Jobs

Add to your `wrangler.toml`:

```toml
[triggers]
crons = [
  "0 * * * *",      # Every hour - check for expired subscriptions
  "0 0 * * *",      # Daily at midnight UTC - reset daily usage
  "0 0 * * 0"       # Weekly on Sunday - cleanup old records
]
```

### Step 5: Update Main Worker

Add to your `index.ts`:

```typescript
import { handleStripeWebhook } from './stripe';
import { handleScheduledEvent } from './subscription-expiration';

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    
    // Stripe webhook handler
    if (url.pathname === '/api/stripe/webhook') {
      return handleStripeWebhook(request, env);
    }
    
    // ... rest of your routes
  },
  
  // Scheduled event handler
  async scheduled(event: ScheduledEvent, env: Env): Promise<void> {
    await handleScheduledEvent(event, env);
  },
};
```

---

## Configuration

### Plan Limits

Edit `subscription-middleware.ts` to customize plan limits:

```typescript
export const PLAN_LIMITS = {
  free: {
    daily_messages: 10,
    daily_builds: 1,
    daily_deployments: 0,
    daily_images: 5,
    daily_searches: 10,
    daily_videos: 0,
    github_access: false,
    morgy_tools_access: false,
    browser_agent_access: false,
  },
  daily: {
    daily_messages: 100,
    daily_builds: 10,
    daily_deployments: 5,
    daily_images: 50,
    daily_searches: 100,
    daily_videos: 5,
    github_access: true,
    morgy_tools_access: true,
    browser_agent_access: true,
  },
  // ... more plans
};
```

### Tool Restrictions

Edit `tool-enforcement.ts` to add new tools:

```typescript
const TOOL_TO_FEATURE_MAP: Record<string, FeatureType> = {
  'your_new_tool': 'build', // or 'image', 'search', etc.
};

const PAID_ONLY_TOOLS = new Set([
  'your_premium_tool',
]);
```

---

## Usage

### In Your Tool Code

Wrap tool execution with enforcement:

```typescript
import { enforceToolExecution } from './tool-enforcement';

async function myTool(userId: string, params: any) {
  const result = await enforceToolExecution(
    env,
    userId,
    'my_tool_name',
    params,
    async () => {
      // Your tool implementation
      return { success: true, data: '...' };
    }
  );
  
  if (!result.allowed) {
    throw new Error(result.error);
  }
  
  return result.result;
}
```

### Using the Decorator

```typescript
import { enforceSubscription } from './tool-enforcement';

class MyToolClass {
  @enforceSubscription('generate_image')
  async generateImage(params: any) {
    // Tool implementation
    // Subscription check happens automatically
  }
}
```

---

## API Reference

### Subscription Endpoints

#### GET `/api/subscription/:userId`

Get user's subscription details.

**Response:**
```json
{
  "plan": "weekly",
  "isActive": true,
  "expiresAt": "2025-12-28T00:00:00Z",
  "dayPassBalance": 0
}
```

#### GET `/api/usage/:userId`

Get user's current usage.

**Response:**
```json
{
  "subscription": { "plan": "weekly", "isActive": true },
  "usage": {
    "messages": { "current": 45, "limit": -1, "remaining": -1 },
    "builds": { "current": 3, "limit": -1, "remaining": -1 }
  }
}
```

### Promo Code Endpoints

#### POST `/api/promo/redeem`

Redeem a promo code.

**Request:**
```json
{
  "userId": "user-uuid",
  "code": "PIGLET"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Promo code redeemed successfully!",
  "reward": {
    "type": "day_pass",
    "value": 1,
    "description": "1 day of full access"
  }
}
```

### Stripe Endpoints

#### POST `/api/stripe/create-checkout`

Create a Stripe checkout session.

**Request:**
```json
{
  "userId": "user-uuid",
  "email": "user@example.com",
  "planId": "weekly",
  "successUrl": "https://morgus.com/success",
  "cancelUrl": "https://morgus.com/cancel"
}
```

**Response:**
```json
{
  "url": "https://checkout.stripe.com/...",
  "sessionId": "cs_test_..."
}
```

---

## Testing

### Test with Stripe Test Mode

Use these test cards:

| Card Number | Scenario |
| :--- | :--- |
| `4242 4242 4242 4242` | Successful payment |
| `4000 0000 0000 9995` | Payment declined |
| `4000 0025 0000 3155` | Requires authentication |

### Test Promo Codes

Pre-seeded codes (from migration):

- `PIGLET` - 1 free day pass
- `HOGWILD21` - 21% discount on weekly
- `MORGANVOICE` - Free Morgy voice feature

### Manual Testing Checklist

- [ ] Create a new user account
- [ ] Redeem a promo code
- [ ] Purchase a day pass
- [ ] Use a feature (should increment usage)
- [ ] Hit usage limit (should show paywall)
- [ ] Wait for day pass to expire (or manually expire)
- [ ] Subscribe to weekly plan
- [ ] Cancel subscription
- [ ] Verify subscription expires at end of period

---

## Troubleshooting

### Issue: Stripe webhook not working

**Solution:**
1. Check webhook secret is correct
2. Verify endpoint URL is accessible
3. Check Cloudflare Worker logs for errors
4. Test webhook in Stripe Dashboard

### Issue: Usage not resetting daily

**Solution:**
1. Verify cron job is configured in `wrangler.toml`
2. Check Cloudflare Worker cron trigger logs
3. Manually trigger: `wrangler publish --triggers`

### Issue: User can use features they shouldn't

**Solution:**
1. Check tool is mapped in `TOOL_TO_FEATURE_MAP`
2. Verify tool is wrapped with `enforceToolExecution`
3. Check user's subscription status in database
4. Verify RLS policies are enabled

### Issue: Promo code not working

**Solution:**
1. Check code exists in `promo_codes` table
2. Verify `is_active = true`
3. Check `valid_from` and `valid_until` dates
4. Verify `uses_count < max_uses`

---

## Next Steps

1. **Test in Production** - Deploy to production and test with real Stripe account
2. **Monitor Usage** - Set up analytics to track subscription conversions
3. **Add More Plans** - Create custom plans for teams or enterprises
4. **Implement Referrals** - Add referral tracking to the promo code system
5. **Build Admin Dashboard** - Create UI for managing subscriptions and promo codes

---

## Support

For issues or questions:
- Check the [Troubleshooting](#troubleshooting) section
- Review Cloudflare Worker logs
- Check Supabase logs for database errors
- Contact the development team

---

**Built with ❤️ by the Morgus Team**
