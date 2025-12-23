# Morgus Billing System - Quick Setup Guide

**Time to complete:** ~15 minutes

## Prerequisites

- ✅ Supabase project set up
- ✅ Stripe account (test mode is fine)
- ✅ Cloudflare Workers account

---

## Step-by-Step Setup

### 1. Apply Database Migration (5 minutes)

1. Open your Supabase project dashboard
2. Go to **SQL Editor**
3. Open the file: `worker/migrations/001_billing_enforcement.sql`
4. Copy the entire contents
5. Paste into the SQL Editor
6. Click **Run**
7. Verify tables were created:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('subscriptions', 'usage_tracking', 'payment_history', 'promo_codes', 'promo_code_redemptions');
```

You should see 5 tables listed.

---

### 2. Configure Stripe (5 minutes)

#### A. Get Your Stripe Keys

1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Click **Developers** → **API Keys**
3. Copy your **Secret key** (starts with `sk_test_` or `sk_live_`)

#### B. Set Up Webhook

1. Go to **Developers** → **Webhooks**
2. Click **Add endpoint**
3. Enter URL: `https://your-worker-name.workers.dev/api/stripe/webhook`
4. Select these events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.paid`
   - `invoice.payment_failed`
5. Click **Add endpoint**
6. Copy the **Signing secret** (starts with `whsec_`)

#### C. Create Products

1. Go to **Products** → **Add product**
2. Create three products:

| Name | Price | Billing |
| :--- | :--- | :--- |
| Morgus Daily Pass | $3.00 | One-time |
| Morgus Weekly | $21.00 | Weekly |
| Morgus Monthly | $75.00 | Monthly |

3. Copy the **Price ID** for each (starts with `price_`)

---

### 3. Update Environment Variables (2 minutes)

Edit your `wrangler.toml`:

```toml
name = "morgus-worker"
main = "src/index.ts"
compatibility_date = "2024-01-01"

[vars]
SUPABASE_URL = "https://your-project.supabase.co"
STRIPE_DAILY_PRICE_ID = "price_xxx"
STRIPE_WEEKLY_PRICE_ID = "price_yyy"
STRIPE_MONTHLY_PRICE_ID = "price_zzz"

[triggers]
crons = [
  "0 * * * *",      # Every hour - expire subscriptions
  "0 0 * * *",      # Daily at midnight - reset usage
  "0 0 * * 0"       # Weekly - cleanup old records
]
```

Then set secrets:

```bash
wrangler secret put SUPABASE_SERVICE_KEY
# Paste your Supabase service role key

wrangler secret put STRIPE_SECRET_KEY
# Paste your Stripe secret key (sk_test_...)

wrangler secret put STRIPE_WEBHOOK_SECRET
# Paste your Stripe webhook signing secret (whsec_...)
```

---

### 4. Update Main Worker (3 minutes)

Edit `worker/src/index.ts`:

```typescript
import { handleStripeWebhook } from './stripe';
import { handleScheduledEvent } from './subscription-expiration';
import { handleUsageAPI } from './usage-api';
import { handlePromoAPI } from './promo-api';

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    // Stripe webhook
    if (path === '/api/stripe/webhook') {
      return handleStripeWebhook(request, env);
    }

    // Usage API
    if (path.startsWith('/api/usage') || path.startsWith('/api/subscription')) {
      return handleUsageAPI(request, env);
    }

    // Promo API
    if (path.startsWith('/api/promo')) {
      return handlePromoAPI(request, env);
    }

    // ... rest of your routes
  },

  // Cron job handler
  async scheduled(event: ScheduledEvent, env: Env): Promise<void> {
    await handleScheduledEvent(event, env);
  },
};
```

---

### 5. Deploy (1 minute)

```bash
cd worker
pnpm install
pnpm run build
wrangler deploy
```

---

## Testing Your Setup

### Test 1: Check Database

```sql
-- Should return 3 promo codes
SELECT * FROM promo_codes WHERE is_active = true;
```

### Test 2: Redeem Promo Code

```bash
curl -X POST https://your-worker.workers.dev/api/promo/redeem \
  -H "Content-Type: application/json" \
  -d '{"userId":"test-user-id","code":"PIGLET"}'
```

Expected response:
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

### Test 3: Create Checkout Session

```bash
curl -X POST https://your-worker.workers.dev/api/stripe/create-checkout \
  -H "Content-Type: application/json" \
  -d '{
    "userId":"test-user-id",
    "email":"test@example.com",
    "planId":"weekly",
    "successUrl":"https://morgus.com/success",
    "cancelUrl":"https://morgus.com/cancel"
  }'
```

Expected response:
```json
{
  "url": "https://checkout.stripe.com/c/pay/cs_test_...",
  "sessionId": "cs_test_..."
}
```

### Test 4: Check Usage

```bash
curl https://your-worker.workers.dev/api/usage/test-user-id
```

Expected response:
```json
{
  "subscription": {
    "plan": "daily",
    "isActive": true,
    "expiresAt": "2025-12-22T00:00:00Z",
    "dayPassBalance": 1
  },
  "usage": {
    "messages": { "current": 0, "limit": 100, "remaining": 100 },
    "builds": { "current": 0, "limit": 10, "remaining": 10 }
  }
}
```

---

## Common Issues

### "Table does not exist"
- **Fix:** Run the database migration again

### "Invalid webhook signature"
- **Fix:** Check your `STRIPE_WEBHOOK_SECRET` is correct

### "Cron jobs not running"
- **Fix:** Verify `[triggers]` section in `wrangler.toml`

### "Promo code not found"
- **Fix:** Check the migration seeded the promo codes correctly

---

## Next Steps

1. **Integrate with Frontend** - Add checkout buttons to your UI
2. **Test Payments** - Use Stripe test cards to test full flow
3. **Monitor Logs** - Check Cloudflare Worker logs for any errors
4. **Go Live** - Switch from test mode to live mode in Stripe

---

## Support

Need help? Check:
- `BILLING_SYSTEM.md` for full documentation
- Cloudflare Worker logs for errors
- Supabase logs for database issues

---

**🎉 You're all set! Your billing system is ready to go.**
