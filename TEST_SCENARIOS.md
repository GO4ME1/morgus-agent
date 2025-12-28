# Morgy Marketplace Test Scenarios

## Overview

This document provides comprehensive test scenarios for the Morgy marketplace, including API testing, payment flows, webhook testing, and end-to-end user journeys.

---

## Test Environment Setup

### Prerequisites
- Backend deployed and running
- Frontend deployed and accessible
- Stripe account in test mode
- Database migrations run
- Webhook configured in Stripe Dashboard
- Test API keys configured

### Environment Variables
```bash
# Backend
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
SUPABASE_URL=https://...supabase.co
SUPABASE_SERVICE_KEY=...

# Frontend
VITE_SUPABASE_URL=https://...supabase.co
VITE_SUPABASE_ANON_KEY=...
VITE_API_URL=https://morgus-deploy.fly.dev
```

### Test Cards
```
Success: 4242 4242 4242 4242
Decline: 4000 0000 0000 0002
Insufficient funds: 4000 0000 0000 9995
3D Secure: 4000 0025 0000 3155
```

---

## Scenario 1: Create Morgy

### Objective
Test the complete Morgy creation flow through the enhanced 7-step wizard.

### Steps

#### 1. Basic Info
```json
POST /api/morgys
Authorization: Bearer <token>

{
  "name": "Test Marketing Maven",
  "description": "Expert marketing strategist for testing",
  "category": "business",
  "tags": ["marketing", "test", "demo"]
}
```

**Expected Result:**
- Status: 201 Created
- Response includes Morgy ID
- Morgy appears in user's list

#### 2. AI Configuration
```json
PUT /api/morgys/{morgyId}

{
  "aiConfig": {
    "primaryModel": "gpt-4",
    "temperature": 0.7,
    "maxTokens": 2000,
    "systemPrompt": "You are a marketing expert...",
    "fallbackModels": ["gpt-3.5-turbo"]
  }
}
```

#### 3. Personality
```json
PUT /api/morgys/{morgyId}

{
  "personality": {
    "tone": "professional",
    "verbosity": "balanced",
    "emojiUsage": "minimal",
    "responseStyle": "Clear and actionable"
  }
}
```

#### 4. Appearance
```json
PUT /api/morgys/{morgyId}

{
  "appearance": {
    "avatar": "📊",
    "color": "#8B5CF6",
    "icon": "chart"
  }
}
```

#### 5. Capabilities
```json
PUT /api/morgys/{morgyId}

{
  "capabilities": {
    "webSearch": true,
    "codeExecution": false,
    "fileProcessing": true,
    "imageGeneration": false,
    "voiceInteraction": false,
    "mcpTools": []
  }
}
```

#### 6. Knowledge Base
```json
PUT /api/morgys/{morgyId}

{
  "knowledgeBase": {
    "documents": [],
    "urls": ["https://example.com/guide"],
    "customData": "Test data..."
  }
}
```

#### 7. Marketplace Settings
```json
PUT /api/morgys/{morgyId}

{
  "isPublic": true,
  "licenseType": "paid",
  "price": 9.99,
  "isPremium": false
}
```

**Expected Final Result:**
- Morgy fully configured
- Appears in marketplace
- All fields saved correctly
- View count = 0
- Purchase count = 0

---

## Scenario 2: Browse Marketplace

### Objective
Test marketplace filtering, searching, and sorting.

### Test Cases

#### 2.1 Basic Browse
```bash
GET /api/marketplace/morgys?page=1&limit=20
```

**Expected:**
- Returns list of public Morgys
- Pagination info included
- Premium Morgys listed first (default sort)

#### 2.2 Filter by Category
```bash
GET /api/marketplace/morgys?category=business&page=1
```

**Expected:**
- Only business category Morgys returned
- Correct count in pagination

#### 2.3 Filter by Price
```bash
GET /api/marketplace/morgys?minPrice=5&maxPrice=15
```

**Expected:**
- Only Morgys priced between $5-$15
- Free Morgys excluded

#### 2.4 Search by Name
```bash
GET /api/marketplace/morgys?search=marketing
```

**Expected:**
- Morgys with "marketing" in name or description
- Case-insensitive matching

#### 2.5 Sort by Popular
```bash
GET /api/marketplace/morgys?sortBy=popular
```

**Expected:**
- Morgys sorted by total_purchases DESC
- Most purchased first

#### 2.6 Sort by Rating
```bash
GET /api/marketplace/morgys?sortBy=rating
```

**Expected:**
- Morgys sorted by rating DESC
- Highest rated first

#### 2.7 Combined Filters
```bash
GET /api/marketplace/morgys?category=business&sortBy=popular&minPrice=5&search=marketing
```

**Expected:**
- All filters applied correctly
- Results match all criteria

---

## Scenario 3: One-Time Purchase

### Objective
Test complete one-time purchase flow with Stripe payment.

### Steps

#### 3.1 View Morgy Details
```bash
GET /api/morgys/{morgyId}
```

**Expected:**
- Full Morgy details returned
- `hasPurchased: false`
- `isOwner: false`
- Knowledge base NOT included (not purchased)

#### 3.2 Initiate Purchase
```bash
POST /api/marketplace/morgys/{morgyId}/purchase
Authorization: Bearer <token>

{
  "paymentMethodId": "pm_card_visa"
}
```

**Expected:**
- Payment intent created in Stripe
- Purchase record created with status 'pending'
- Metadata includes morgyId, userId, purchaseId
- Returns client_secret for confirmation

#### 3.3 Confirm Payment (Frontend)
```javascript
// Frontend code
const {error} = await stripe.confirmCardPayment(clientSecret);
```

**Expected:**
- Payment processes successfully
- Stripe fires `payment_intent.succeeded` webhook

#### 3.4 Webhook Processing
**Webhook receives:**
```json
{
  "type": "payment_intent.succeeded",
  "data": {
    "object": {
      "id": "pi_...",
      "amount": 999,
      "metadata": {
        "morgyId": "...",
        "userId": "...",
        "purchaseId": "..."
      }
    }
  }
}
```

**Expected Actions:**
1. Purchase status → 'completed'
2. Morgy purchases → +1
3. Morgy revenue → +$6.99
4. Analytics updated
5. Webhook returns 200 OK

#### 3.5 Verify Purchase
```bash
GET /api/morgys/{morgyId}
Authorization: Bearer <token>
```

**Expected:**
- `hasPurchased: true`
- Knowledge base NOW included
- Full access granted

#### 3.6 Check Creator Revenue
```bash
GET /api/creators/{creatorId}/revenue
Authorization: Bearer <creator-token>
```

**Expected:**
- `totalRevenue: 6.99`
- `pendingPayout: 6.99`
- Recent transaction listed
- Breakdown shows this Morgy

---

## Scenario 4: Monthly Subscription

### Objective
Test subscription creation, renewal, and cancellation.

### Steps

#### 4.1 Create Subscription
```bash
POST /api/marketplace/morgys/{morgyId}/subscribe
Authorization: Bearer <token>

{
  "paymentMethodId": "pm_card_visa"
}
```

**Expected:**
- Stripe subscription created
- Purchase record created
- Webhook fires: `customer.subscription.created`
- Status: 'active'
- Subscription dates set

#### 4.2 Verify Subscription
```bash
GET /api/morgys/{morgyId}
```

**Expected:**
- `hasPurchased: true`
- Access granted
- Subscription active

#### 4.3 Simulate Renewal (30 days later)
```bash
# Use Stripe CLI
stripe trigger invoice.payment_succeeded
```

**Expected:**
- Webhook fires: `invoice.payment_succeeded`
- Revenue added: +$6.99
- Purchase count NOT incremented (renewal)
- Analytics updated
- Subscription dates extended

#### 4.4 Cancel Subscription
```bash
POST /api/marketplace/morgys/{morgyId}/cancel-subscription
Authorization: Bearer <token>
```

**Expected:**
- Subscription cancelled in Stripe
- Status: 'cancelled'
- Access maintained until period end
- Webhook fires: `customer.subscription.updated`

#### 4.5 After Period Ends
**Webhook fires:** `customer.subscription.deleted`

**Expected:**
- Status: 'expired'
- Access revoked
- User must re-subscribe for access

---

## Scenario 5: Failed Payment

### Objective
Test payment failure handling.

### Steps

#### 5.1 Attempt Purchase with Declined Card
```bash
POST /api/marketplace/morgys/{morgyId}/purchase

{
  "paymentMethodId": "pm_card_chargeDeclined"
}
```

**Expected:**
- Payment fails
- Webhook fires: `payment_intent.payment_failed`
- Purchase status: 'failed'
- No revenue added
- User notified of failure

#### 5.2 Verify No Access
```bash
GET /api/morgys/{morgyId}
```

**Expected:**
- `hasPurchased: false`
- Knowledge base NOT included
- No access granted

---

## Scenario 6: Creator Revenue & Payouts

### Objective
Test revenue tracking and payout system.

### Setup
- Creator has sold 10 Morgys at $9.99 each
- Total revenue: $99.90
- Creator revenue (70%): $69.93
- Platform fee (30%): $29.97

### Steps

#### 6.1 View Revenue Dashboard
```bash
GET /api/creators/{creatorId}/revenue
```

**Expected:**
```json
{
  "totalRevenue": 69.93,
  "platformFees": 29.97,
  "netRevenue": 69.93,
  "pendingPayout": 69.93,
  "paidOut": 0,
  "breakdown": [
    {
      "morgyId": "...",
      "morgyName": "Test Morgy",
      "totalSales": 10,
      "revenue": 69.93
    }
  ]
}
```

#### 6.2 Request Payout
```bash
POST /api/creators/{creatorId}/request-payout

{
  "amount": 69.93
}
```

**Expected:**
- Payout record created
- Status: 'pending'
- Estimated arrival date provided
- (In production: Stripe Transfer initiated)

#### 6.3 View Payout History
```bash
GET /api/creators/{creatorId}/payouts
```

**Expected:**
```json
{
  "payouts": [
    {
      "id": "...",
      "amount": 69.93,
      "status": "pending",
      "createdAt": "..."
    }
  ],
  "summary": {
    "totalPaid": 0,
    "pendingAmount": 69.93
  }
}
```

#### 6.4 Attempt Payout Below Minimum
```bash
POST /api/creators/{creatorId}/request-payout

{
  "amount": 25.00
}
```

**Expected:**
- Status: 400 Bad Request
- Error: "Minimum payout amount is $50"

---

## Scenario 7: Analytics

### Objective
Test analytics tracking and dashboard.

### Steps

#### 7.1 View Morgy Analytics
```bash
GET /api/morgys/{morgyId}/analytics?startDate=2025-12-01&endDate=2025-12-31
```

**Expected:**
```json
{
  "summary": {
    "totalViews": 1234,
    "totalPurchases": 45,
    "totalRevenue": 314.55,
    "avgRating": 4.8,
    "conversionRate": 3.65
  },
  "timeSeries": [
    {
      "date": "2025-12-27",
      "views": 45,
      "purchases": 2,
      "revenue": 13.98
    }
  ]
}
```

#### 7.2 View Creator Dashboard
```bash
GET /api/creators/{creatorId}/dashboard
```

**Expected:**
```json
{
  "totalMorgys": 5,
  "publicMorgys": 3,
  "totalSales": 120,
  "totalRevenue": 839.88,
  "avgRating": 4.7,
  "topMorgy": {
    "id": "...",
    "name": "Marketing Maven",
    "sales": 45,
    "revenue": 314.55
  }
}
```

---

## Scenario 8: Update Morgy

### Objective
Test Morgy updates and versioning.

### Steps

#### 8.1 Update Morgy Price
```bash
PUT /api/morgys/{morgyId}

{
  "price": 14.99
}
```

**Expected:**
- Price updated
- Version incremented
- Updated_at timestamp changed
- Existing purchases unaffected

#### 8.2 Make Morgy Private
```bash
PUT /api/morgys/{morgyId}

{
  "isPublic": false
}
```

**Expected:**
- Morgy removed from marketplace
- Existing purchases still have access
- No new purchases allowed

#### 8.3 Update AI Config
```bash
PUT /api/morgys/{morgyId}

{
  "aiConfig": {
    "primaryModel": "gpt-4-turbo",
    "temperature": 0.8
  }
}
```

**Expected:**
- AI config updated
- Other fields unchanged
- Partial update works correctly

---

## Scenario 9: Delete Morgy

### Objective
Test Morgy deletion with active subscriptions.

### Steps

#### 9.1 Attempt Delete with Active Subscriptions
```bash
DELETE /api/morgys/{morgyId}
```

**Expected:**
- Status: 400 Bad Request
- Error: "Cannot delete Morgy with active subscriptions"
- Morgy NOT deleted

#### 9.2 Cancel All Subscriptions
```bash
# Cancel each active subscription
POST /api/marketplace/morgys/{morgyId}/cancel-subscription
```

#### 9.3 Delete Morgy
```bash
DELETE /api/morgys/{morgyId}
```

**Expected:**
- Status: 200 OK
- Morgy soft deleted (is_active = false)
- Removed from marketplace
- Purchase history preserved
- Analytics preserved

---

## Scenario 10: Edge Cases

### 10.1 Duplicate Purchase Attempt
```bash
# User already owns this Morgy
POST /api/marketplace/morgys/{morgyId}/purchase
```

**Expected:**
- Status: 400 Bad Request
- Error: "You already own this Morgy"

### 10.2 Purchase Own Morgy
```bash
# Creator tries to buy their own Morgy
POST /api/marketplace/morgys/{morgyId}/purchase
```

**Expected:**
- Status: 400 Bad Request
- Error: "Cannot purchase your own Morgy"

### 10.3 Update Someone Else's Morgy
```bash
# User tries to update Morgy they don't own
PUT /api/morgys/{morgyId}
```

**Expected:**
- Status: 403 Forbidden
- Error: "You do not have permission"

### 10.4 Invalid Price
```bash
PUT /api/morgys/{morgyId}

{
  "price": -5.00
}
```

**Expected:**
- Status: 400 Bad Request
- Error: "Price must be between 0 and 999.99"

### 10.5 Webhook Signature Mismatch
```bash
# Send webhook with wrong signature
POST /api/billing/webhook
Stripe-Signature: invalid
```

**Expected:**
- Status: 400 Bad Request
- Error: "Webhook signature verification failed"

---

## Automated Test Script

### Using curl

```bash
#!/bin/bash

API_URL="https://morgus-deploy.fly.dev"
AUTH_TOKEN="your-test-token"

echo "Testing Morgy Marketplace API..."

# Test 1: Health Check
echo "1. Health Check"
curl -s "$API_URL/health" | jq .

# Test 2: Create Morgy
echo "2. Create Morgy"
MORGY_ID=$(curl -s -X POST "$API_URL/api/morgys" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Morgy",
    "description": "Test description",
    "category": "business",
    "tags": ["test"],
    "isPublic": true,
    "licenseType": "paid",
    "price": 9.99
  }' | jq -r '.morgy.id')

echo "Created Morgy ID: $MORGY_ID"

# Test 3: Browse Marketplace
echo "3. Browse Marketplace"
curl -s "$API_URL/api/marketplace/morgys?page=1&limit=10" | jq '.morgys | length'

# Test 4: Get Morgy Details
echo "4. Get Morgy Details"
curl -s "$API_URL/api/morgys/$MORGY_ID" | jq '.morgy.name'

# Test 5: Purchase Morgy
echo "5. Purchase Morgy"
curl -s -X POST "$API_URL/api/marketplace/morgys/$MORGY_ID/purchase" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"paymentMethodId": "pm_card_visa"}' | jq .

echo "All tests completed!"
```

---

## Performance Testing

### Load Test Scenarios

#### 1. Marketplace Browse
```bash
# 100 concurrent users browsing
ab -n 1000 -c 100 "$API_URL/api/marketplace/morgys?page=1&limit=20"
```

**Expected:**
- Response time < 500ms
- No errors
- Consistent performance

#### 2. Morgy Details
```bash
# 50 concurrent requests
ab -n 500 -c 50 "$API_URL/api/morgys/$MORGY_ID"
```

**Expected:**
- Response time < 300ms
- View count increments correctly
- No race conditions

#### 3. Purchase Flow
```bash
# 10 concurrent purchases
# (Use k6 or similar for complex scenarios)
```

**Expected:**
- All purchases process correctly
- Revenue calculated accurately
- No duplicate purchases

---

## Monitoring Checklist

### During Testing

- [ ] Check Fly.io logs for errors
- [ ] Monitor Stripe Dashboard for webhook deliveries
- [ ] Verify database updates in Supabase
- [ ] Check analytics data accuracy
- [ ] Monitor API response times
- [ ] Verify revenue calculations
- [ ] Test error handling
- [ ] Check webhook retry behavior

### After Testing

- [ ] Review test results
- [ ] Document any issues found
- [ ] Verify all scenarios passed
- [ ] Check for edge cases
- [ ] Review performance metrics
- [ ] Confirm data integrity
- [ ] Validate revenue totals
- [ ] Test cleanup (delete test data)

---

## Success Criteria

### API Tests
- ✅ All endpoints return correct status codes
- ✅ Response data matches schema
- ✅ Error messages are clear
- ✅ Authentication works correctly
- ✅ Validation prevents invalid data

### Payment Tests
- ✅ Purchases process successfully
- ✅ Subscriptions create and renew
- ✅ Failed payments handled gracefully
- ✅ Revenue calculated correctly (70/30)
- ✅ Webhooks fire and process

### Data Integrity
- ✅ Purchase records accurate
- ✅ Morgy stats update correctly
- ✅ Analytics data consistent
- ✅ No duplicate purchases
- ✅ Revenue totals match transactions

### Performance
- ✅ Response times < 500ms
- ✅ No timeouts under load
- ✅ Database queries optimized
- ✅ Webhook processing < 2s

---

*Test Scenarios Version: 1.0*
*Last Updated: December 27, 2025*
*Status: Ready for Execution*
