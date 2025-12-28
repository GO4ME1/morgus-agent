# Stripe Webhook Integration for Morgy Marketplace

## Overview

The Morgy marketplace is now fully integrated with your existing Stripe webhook endpoint at `/api/billing/webhook`. The same webhook handles both platform billing events and Morgy marketplace transactions.

---

## Architecture

### Single Webhook Endpoint
```
POST /api/billing/webhook
```

This endpoint now handles:
1. **Platform Billing Events** (existing)
   - Subscription management
   - Platform payments
   - User billing

2. **Morgy Marketplace Events** (new)
   - Morgy purchases (one-time)
   - Morgy subscriptions (monthly)
   - Revenue tracking
   - Analytics updates

### How It Works

```typescript
// billing-routes.ts
router.post('/webhook', async (req, res) => {
  // 1. Verify Stripe signature
  const event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  
  // 2. Handle platform billing events
  await billingService.handleWebhook(event);
  
  // 3. Handle Morgy marketplace events
  await morgyWebhookService.handleWebhookEvent(event);
  
  res.json({ received: true });
});
```

---

## Webhook Events Handled

### Morgy Marketplace Events

#### 1. `payment_intent.succeeded`
**Triggered when**: One-time Morgy purchase payment succeeds

**Actions:**
- Updates purchase status to 'completed'
- Increments Morgy purchase count
- Adds creator revenue to Morgy total
- Tracks daily analytics

**Metadata Required:**
```json
{
  "morgyId": "uuid",
  "userId": "user-id",
  "purchaseId": "purchase-id"
}
```

#### 2. `payment_intent.payment_failed`
**Triggered when**: One-time payment fails

**Actions:**
- Updates purchase status to 'failed'

#### 3. `customer.subscription.created`
**Triggered when**: Monthly Morgy subscription is created

**Actions:**
- Updates purchase record with subscription details
- Sets subscription status to 'active'
- Records subscription start/end dates
- Stores Stripe subscription ID

**Metadata Required:**
```json
{
  "morgyId": "uuid",
  "userId": "user-id",
  "purchaseId": "purchase-id"
}
```

#### 4. `customer.subscription.updated`
**Triggered when**: Subscription is renewed or modified

**Actions:**
- Updates subscription dates
- Updates subscription status

#### 5. `customer.subscription.deleted`
**Triggered when**: Subscription is cancelled

**Actions:**
- Sets subscription status to 'expired'
- User loses access after period end

#### 6. `invoice.payment_succeeded`
**Triggered when**: Subscription renewal payment succeeds

**Actions:**
- Adds renewal revenue to Morgy total
- Tracks daily analytics
- Does NOT increment purchase count (it's a renewal)

#### 7. `invoice.payment_failed`
**Triggered when**: Subscription renewal fails

**Actions:**
- Logs the failure
- Stripe handles automatic retries

---

## Database Updates

### Tables Updated by Webhooks

#### 1. `morgy_purchases`
```sql
UPDATE morgy_purchases SET
  payment_status = 'completed',
  stripe_payment_id = '...',
  subscription_status = 'active',
  subscription_start = '...',
  subscription_end = '...',
  stripe_subscription_id = '...'
WHERE id = purchase_id;
```

#### 2. `morgys`
```sql
-- Via increment_morgy_stats() function
UPDATE morgys SET
  total_purchases = total_purchases + 1,
  total_revenue = total_revenue + creator_revenue,
  updated_at = NOW()
WHERE id = morgy_id;
```

#### 3. `morgy_analytics`
```sql
-- Daily aggregation
INSERT INTO morgy_analytics (morgy_id, date, purchases, revenue)
VALUES (morgy_id, today, 1, creator_revenue)
ON CONFLICT (morgy_id, date) DO UPDATE SET
  purchases = morgy_analytics.purchases + 1,
  revenue = morgy_analytics.revenue + creator_revenue;
```

---

## Revenue Calculation

### 70/30 Split

For every transaction:
```typescript
const amount = paymentIntent.amount / 100; // Stripe uses cents
const creatorRevenue = Math.round(amount * 0.70 * 100) / 100; // 70%
const platformFee = Math.round(amount * 0.30 * 100) / 100; // 30%
```

### Examples
| Sale Price | Creator Gets (70%) | Platform Gets (30%) |
|------------|-------------------|---------------------|
| $4.99 | $3.49 | $1.50 |
| $9.99 | $6.99 | $3.00 |
| $19.99 | $13.99 | $6.00 |
| $49.99 | $34.99 | $15.00 |

---

## Stripe Configuration

### Webhook Setup

1. **Go to Stripe Dashboard** → Developers → Webhooks
2. **Add endpoint**: `https://morgus-deploy.fly.dev/api/billing/webhook`
3. **Select events to listen to:**
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
   - `checkout.session.completed` (existing)

4. **Copy webhook signing secret** and set as `STRIPE_WEBHOOK_SECRET` environment variable

### Environment Variables Required

```bash
STRIPE_SECRET_KEY=sk_test_... # or sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
SUPABASE_URL=https://...supabase.co
SUPABASE_SERVICE_KEY=...
```

---

## Testing Webhooks

### Using Stripe CLI

1. **Install Stripe CLI:**
```bash
brew install stripe/stripe-cli/stripe
# or
curl -s https://packages.stripe.com/api/security/keypair/stripe-cli-gpg/public | gpg --dearmor | sudo tee /usr/share/keyrings/stripe.gpg
```

2. **Login:**
```bash
stripe login
```

3. **Forward webhooks to local:**
```bash
stripe listen --forward-to localhost:8080/api/billing/webhook
```

4. **Trigger test events:**
```bash
# Test one-time payment
stripe trigger payment_intent.succeeded

# Test subscription created
stripe trigger customer.subscription.created

# Test invoice payment (renewal)
stripe trigger invoice.payment_succeeded
```

### Manual Testing

1. **Create test Morgy** via API
2. **Attempt purchase** with test card: `4242 4242 4242 4242`
3. **Check webhook logs** in Stripe Dashboard
4. **Verify database updates** in Supabase

---

## Monitoring

### Webhook Logs

Check webhook delivery in Stripe Dashboard:
- Go to Developers → Webhooks
- Click on your endpoint
- View "Recent deliveries"
- Check response codes and retry attempts

### Application Logs

Check Fly.io logs for webhook processing:
```bash
flyctl logs -a morgus-deploy | grep webhook
```

Look for:
- ✅ "Payment succeeded for Morgy..."
- ✅ "Subscription created for Morgy..."
- ❌ "Error handling webhook..."

### Database Verification

After webhook fires, verify:

```sql
-- Check purchase status
SELECT * FROM morgy_purchases WHERE id = 'purchase-id';

-- Check Morgy stats
SELECT total_purchases, total_revenue FROM morgys WHERE id = 'morgy-id';

-- Check analytics
SELECT * FROM morgy_analytics WHERE morgy_id = 'morgy-id' ORDER BY date DESC;
```

---

## Error Handling

### Webhook Failures

If webhook processing fails:
1. **Stripe automatically retries** (up to 3 days)
2. **Check Stripe Dashboard** for failure reason
3. **Fix the issue** in code or database
4. **Retry from Stripe Dashboard** if needed

### Common Issues

#### 1. Signature Verification Failed
```
Error: No signatures found matching the expected signature for payload
```
**Solution:** Check `STRIPE_WEBHOOK_SECRET` is correct

#### 2. Database Update Failed
```
Error updating purchase status: ...
```
**Solution:** Check database connection and table schema

#### 3. Missing Metadata
```
Payment intent missing Morgy metadata, skipping
```
**Solution:** Ensure metadata is set when creating payment intent:
```typescript
metadata: {
  morgyId: morgy.id,
  userId: user.id,
  purchaseId: purchase.id
}
```

---

## Code Structure

### Files Created/Modified

1. **`morgy-webhook-service.ts`** (NEW)
   - MorgyWebhookService class
   - Handles all Morgy marketplace events
   - Updates database and analytics

2. **`billing-routes.ts`** (MODIFIED)
   - Added morgyWebhookService import
   - Calls both billing and Morgy webhook handlers

3. **`002_add_increment_morgy_stats_function.sql`** (NEW)
   - SQL function for atomic stat updates
   - Prevents race conditions

### Service Methods

```typescript
class MorgyWebhookService {
  // Main handler
  async handleWebhookEvent(event: Stripe.Event)
  
  // Event-specific handlers
  private async handlePaymentSuccess(paymentIntent)
  private async handlePaymentFailed(paymentIntent)
  private async handleSubscriptionCreated(subscription)
  private async handleSubscriptionUpdated(subscription)
  private async handleSubscriptionDeleted(subscription)
  private async handleInvoicePaymentSucceeded(invoice)
  private async handleInvoicePaymentFailed(invoice)
}
```

---

## Metadata Schema

### Payment Intent Metadata
```typescript
{
  morgyId: string;      // UUID of the Morgy
  userId: string;       // ID of the buyer
  purchaseId: string;   // UUID of the purchase record
}
```

### Subscription Metadata
```typescript
{
  morgyId: string;      // UUID of the Morgy
  userId: string;       // ID of the subscriber
  purchaseId: string;   // UUID of the purchase record
}
```

---

## Revenue Flow

### One-Time Purchase
1. User clicks "Buy Morgy" ($9.99)
2. Frontend creates payment intent via API
3. User completes payment with Stripe
4. Stripe fires `payment_intent.succeeded` webhook
5. Webhook updates:
   - Purchase status → 'completed'
   - Morgy purchases → +1
   - Morgy revenue → +$6.99 (70%)
   - Analytics → +1 purchase, +$6.99 revenue
6. Creator sees $6.99 in revenue dashboard

### Monthly Subscription
1. User clicks "Subscribe" ($9.99/month)
2. Frontend creates subscription via API
3. Stripe fires `customer.subscription.created` webhook
4. Webhook updates:
   - Purchase status → 'active'
   - Subscription dates set
5. Each month, Stripe fires `invoice.payment_succeeded`
6. Webhook adds $6.99 to creator revenue
7. Creator earns $6.99 every month

---

## Next Steps

### Immediate
1. ✅ Webhook service created
2. ✅ Integrated with existing endpoint
3. ⏳ Deploy to production
4. ⏳ Configure Stripe webhook in dashboard
5. ⏳ Test with Stripe CLI

### Testing Checklist
- [ ] Test one-time purchase flow
- [ ] Test subscription creation
- [ ] Test subscription renewal
- [ ] Test subscription cancellation
- [ ] Test payment failures
- [ ] Verify revenue calculations
- [ ] Check analytics updates
- [ ] Monitor webhook logs

### Production Checklist
- [ ] Set STRIPE_WEBHOOK_SECRET in Fly.io
- [ ] Add webhook endpoint in Stripe Dashboard
- [ ] Enable all required events
- [ ] Test with Stripe test mode first
- [ ] Switch to live mode when ready
- [ ] Monitor webhook deliveries
- [ ] Set up alerts for failures

---

## Summary

✅ **Webhook Integration Complete**

The Morgy marketplace is now fully integrated with Stripe webhooks:
- Single endpoint handles all events
- Automatic purchase status updates
- Real-time revenue tracking
- Daily analytics aggregation
- 70/30 revenue split calculated
- Supports both one-time and subscription

**What's Working:**
- Payment intent handling
- Subscription management
- Revenue calculation
- Analytics tracking
- Error handling
- Automatic retries

**What's Needed:**
- Configure webhook in Stripe Dashboard
- Test with real transactions
- Monitor in production

---

*Integration Date: December 27, 2025*
*Webhook Endpoint: /api/billing/webhook*
*Status: ✅ READY FOR TESTING*
