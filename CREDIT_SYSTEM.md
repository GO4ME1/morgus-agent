# Morgus Credit System Documentation

## Overview

The Morgus credit system provides à la carte pricing for AI-generated images and videos. Users receive a free tier allocation and can purchase additional credits as needed.

---

## Free Tier

Every new user automatically receives:
- **5 image credits** (GPT-Image-1.5)
- **1 video credit** (Sora 2, 5-second videos)

Credits are initialized automatically when a user signs up via the `initialize_user_credits()` database trigger.

---

## Credit Packages

### Image Pack
- **Price**: $10.00
- **Credits**: 50 images
- **Cost per image**: $0.20

### Video Pack
- **Price**: $15.00
- **Credits**: 20 videos (5-sec each)
- **Cost per video**: $0.75

### Creator Bundle ⭐ (Featured)
- **Price**: $20.00
- **Credits**: 50 images + 20 videos
- **Savings**: $5.00 (20% discount)

---

## Database Schema

### Tables

#### 1. `user_credits`
Tracks image and video credits for each user.

**Columns:**
- `id` (UUID, PK)
- `user_id` (UUID, FK → auth.users)
- `image_credits_total` (INTEGER)
- `image_credits_used` (INTEGER)
- `image_credits_remaining` (INTEGER, computed)
- `video_credits_total` (INTEGER)
- `video_credits_used` (INTEGER)
- `video_credits_remaining` (INTEGER, computed)
- `created_at` (TIMESTAMPTZ)
- `updated_at` (TIMESTAMPTZ)

**Indexes:**
- `idx_user_credits_user_id` on `user_id`

**RLS Policies:**
- Users can view their own credits
- Service role can manage all credits

#### 2. `credit_transactions`
Records all credit additions and usage for audit trail.

**Columns:**
- `id` (UUID, PK)
- `user_id` (UUID, FK → auth.users)
- `transaction_type` (TEXT: purchase, usage, refund, bonus, promo)
- `credit_type` (TEXT: image, video)
- `amount` (INTEGER, positive for additions, negative for usage)
- `description` (TEXT)
- `metadata` (JSONB)
- `task_id` (UUID, FK → tasks)
- `payment_id` (TEXT, Stripe payment ID)
- `promo_code` (TEXT)
- `balance_after` (INTEGER)
- `created_at` (TIMESTAMPTZ)

**Indexes:**
- `idx_credit_transactions_user_id` on `user_id`
- `idx_credit_transactions_task_id` on `task_id`
- `idx_credit_transactions_created_at` on `created_at DESC`
- `idx_credit_transactions_type` on `transaction_type, credit_type`

**RLS Policies:**
- Users can view their own transactions
- Service role can manage all transactions

#### 3. `credit_packages`
Available credit packages for purchase.

**Columns:**
- `id` (UUID, PK)
- `name` (TEXT)
- `description` (TEXT)
- `package_type` (TEXT: image_only, video_only, bundle)
- `image_credits` (INTEGER)
- `video_credits` (INTEGER)
- `price_cents` (INTEGER)
- `currency` (TEXT, default: 'usd')
- `stripe_price_id` (TEXT)
- `stripe_product_id` (TEXT)
- `active` (BOOLEAN)
- `featured` (BOOLEAN)
- `sort_order` (INTEGER)
- `created_at` (TIMESTAMPTZ)
- `updated_at` (TIMESTAMPTZ)

**Indexes:**
- `idx_credit_packages_active` on `active, sort_order`

**RLS Policies:**
- Anyone can view active packages
- Service role can manage packages

#### 4. `credit_confirmations`
Pending user confirmations for credit usage (primarily for video generation).

**Columns:**
- `id` (UUID, PK)
- `user_id` (UUID, FK → auth.users)
- `task_id` (UUID, FK → tasks)
- `credit_type` (TEXT: image, video)
- `credits_required` (INTEGER)
- `status` (TEXT: pending, approved, rejected, expired)
- `description` (TEXT)
- `metadata` (JSONB)
- `confirmed_at` (TIMESTAMPTZ)
- `expires_at` (TIMESTAMPTZ, default: NOW() + 5 minutes)
- `created_at` (TIMESTAMPTZ)

**Indexes:**
- `idx_credit_confirmations_user_id` on `user_id`
- `idx_credit_confirmations_status` on `status, expires_at`
- `idx_credit_confirmations_task_id` on `task_id`

**RLS Policies:**
- Users can view and update their own confirmations
- Service role can manage all confirmations

---

### Database Functions

#### `initialize_user_credits()`
Automatically creates credit record for new users with free tier allocation.
- Triggered on `auth.users` INSERT
- Grants 5 image credits + 1 video credit

#### `add_credits(p_user_id, p_credit_type, p_amount, p_transaction_type, ...)`
Add credits to user account (purchase, bonus, promo, refund).
- Updates `user_credits` table
- Records transaction in `credit_transactions`
- Returns transaction ID

#### `use_credits(p_user_id, p_credit_type, p_amount, p_task_id, ...)`
Deduct credits from user account with validation.
- Checks if user has sufficient credits
- Updates `user_credits` table
- Records transaction in `credit_transactions`
- Returns transaction ID
- Raises exception if insufficient credits

#### `check_credits(p_user_id, p_credit_type, p_amount)`
Check if user has sufficient credits without deducting.
- Returns BOOLEAN
- Used for pre-flight checks

---

## Credit Service API

### TypeScript Service (`credit-service.ts`)

#### Class: `CreditService`

**Constructor:**
```typescript
constructor(supabase: SupabaseClient)
```

**Methods:**

##### `getBalance(userId: string): Promise<CreditBalance | null>`
Get user's current credit balance.

**Returns:**
```typescript
{
  imageCredits: number,
  videoCredits: number,
  imageCreditsUsed: number,
  videoCreditsUsed: number,
  imageCreditsTotal: number,
  videoCreditsTotal: number
}
```

##### `checkCredits(userId, creditType, amount): Promise<CreditCheckResult>`
Check if user has sufficient credits.

**Returns:**
```typescript
{
  hasCredits: boolean,
  available: number,
  required: number,
  creditType: 'image' | 'video'
}
```

##### `useCredits(userId, creditType, amount, taskId?, description?): Promise<Result>`
Deduct credits from user account.

**Returns:**
```typescript
{
  success: boolean,
  transactionId?: string,
  error?: string
}
```

##### `addCredits(userId, creditType, amount, transactionType, ...): Promise<Result>`
Add credits to user account.

**Transaction Types:** `purchase`, `bonus`, `promo`, `refund`

##### `createConfirmation(userId, creditType, creditsRequired, description, taskId?): Promise<CreditConfirmation | null>`
Create a confirmation request for video generation.

**Returns:**
```typescript
{
  id: string,
  userId: string,
  creditType: 'image' | 'video',
  creditsRequired: number,
  description: string,
  status: 'pending',
  expiresAt: string  // 5 minutes from creation
}
```

##### `getConfirmation(confirmationId): Promise<CreditConfirmation | null>`
Get confirmation status.

##### `updateConfirmation(confirmationId, status): Promise<boolean>`
Update confirmation status to `approved` or `rejected`.

##### `getPackages(): Promise<any[]>`
Get all active credit packages.

##### `getTransactions(userId, limit?): Promise<any[]>`
Get user's transaction history.

---

## REST API Endpoints

### Base URL: `/api/credits`

#### `GET /balance?user_id={userId}`
Get user's credit balance.

**Response:**
```json
{
  "success": true,
  "balance": {
    "images": {
      "total": 55,
      "used": 12,
      "remaining": 43
    },
    "videos": {
      "total": 21,
      "used": 5,
      "remaining": 16
    }
  }
}
```

#### `POST /check`
Check if user has sufficient credits.

**Request:**
```json
{
  "user_id": "uuid",
  "credit_type": "image",
  "amount": 1
}
```

**Response:**
```json
{
  "success": true,
  "hasCredits": true,
  "available": 43,
  "required": 1,
  "creditType": "image"
}
```

#### `POST /use`
Use credits (deduct from balance).

**Request:**
```json
{
  "user_id": "uuid",
  "credit_type": "image",
  "amount": 1,
  "task_id": "uuid",
  "description": "Generated hero image for landing page"
}
```

**Response:**
```json
{
  "success": true,
  "transactionId": "uuid"
}
```

#### `POST /add`
Add credits to user account.

**Request:**
```json
{
  "user_id": "uuid",
  "credit_type": "image",
  "amount": 50,
  "transaction_type": "purchase",
  "description": "Image Pack purchase",
  "payment_id": "pi_xxx"
}
```

**Response:**
```json
{
  "success": true,
  "transactionId": "uuid"
}
```

#### `POST /confirm/create`
Create a credit confirmation request.

**Request:**
```json
{
  "user_id": "uuid",
  "credit_type": "video",
  "credits_required": 1,
  "description": "Generate hero video for landing page",
  "task_id": "uuid"
}
```

**Response:**
```json
{
  "success": true,
  "confirmation": {
    "id": "uuid",
    "creditType": "video",
    "creditsRequired": 1,
    "description": "Generate hero video for landing page",
    "expiresAt": "2025-12-26T12:35:00Z"
  }
}
```

#### `GET /confirm/:id`
Get confirmation status.

**Response:**
```json
{
  "success": true,
  "confirmation": {
    "id": "uuid",
    "userId": "uuid",
    "creditType": "video",
    "creditsRequired": 1,
    "description": "Generate hero video for landing page",
    "status": "pending",
    "expiresAt": "2025-12-26T12:35:00Z"
  }
}
```

#### `POST /confirm/:id/approve`
Approve a credit confirmation.

**Response:**
```json
{
  "success": true,
  "message": "Confirmation approved"
}
```

#### `POST /confirm/:id/reject`
Reject a credit confirmation.

**Response:**
```json
{
  "success": true,
  "message": "Confirmation rejected"
}
```

#### `GET /packages`
Get available credit packages.

**Response:**
```json
{
  "success": true,
  "packages": [
    {
      "id": "uuid",
      "name": "Creator Bundle",
      "description": "Best value: 50 images + 20 videos",
      "type": "bundle",
      "imageCredits": 50,
      "videoCredits": 20,
      "price": {
        "cents": 2000,
        "currency": "usd",
        "display": "$20.00"
      },
      "featured": true
    },
    ...
  ]
}
```

#### `GET /transactions?user_id={userId}&limit={limit}`
Get user's transaction history.

**Response:**
```json
{
  "success": true,
  "transactions": [
    {
      "id": "uuid",
      "type": "usage",
      "creditType": "image",
      "amount": -1,
      "description": "Generated hero image",
      "balanceAfter": 42,
      "createdAt": "2025-12-26T12:30:00Z"
    },
    ...
  ]
}
```

---

## Integration with Template Generator

### Image Generation (GPT-Image-1.5)

**Flow:**
1. Check if user has image credits
2. Generate image via OpenAI API
3. Deduct 1 credit on success
4. Record transaction

**Code:**
```typescript
// Before generation
const check = await creditService.checkCredits(userId, 'image', 1);
if (!check.hasCredits) {
  console.log('Insufficient image credits');
  return '';
}

// After successful generation
await creditService.useCredits(
  userId,
  'image',
  1,
  taskId,
  'Generated hero image'
);
```

### Video Generation (Sora 2)

**Flow:**
1. Check if user has video credits
2. Create confirmation request
3. Wait for user approval (5-minute timeout)
4. Generate video via OpenAI API
5. Deduct 1 credit on success
6. Record transaction

**Code:**
```typescript
// 1. Check credits
const check = await creditService.checkCredits(userId, 'video', 1);
if (!check.hasCredits) {
  return { error: 'Insufficient video credits' };
}

// 2. Create confirmation
const confirmation = await creditService.createConfirmation(
  userId,
  'video',
  1,
  'Generate hero video for landing page',
  taskId
);

// 3. Show confirmation to user (via UI)
// User approves via: POST /api/credits/confirm/:id/approve

// 4. Generate video (after approval)
const videoUrl = await generateVideoWithSora(prompt, 5, confirmation.id);

// 5. Deduct credit (done automatically in generateVideoWithSora)
```

---

## User Confirmation Flow

### Video Generation Confirmation

When a user requests video generation:

1. **System creates confirmation:**
   - Status: `pending`
   - Expires in: 5 minutes
   - Returns confirmation ID

2. **UI shows confirmation dialog:**
   ```
   🎥 Generate Video?
   
   This will use 1 video credit.
   You have 16 video credits remaining.
   
   [Generate Video] [Cancel]
   ```

3. **User approves:**
   - Frontend calls: `POST /api/credits/confirm/:id/approve`
   - Status changes to: `approved`

4. **System generates video:**
   - Checks confirmation status
   - Generates video via Sora 2
   - Deducts credit
   - Returns video URL

5. **User rejects or timeout:**
   - Status changes to: `rejected` or `expired`
   - No credit deducted
   - No video generated

---

## Error Handling

### Insufficient Credits

**Image Generation:**
```json
{
  "error": "Insufficient image credits",
  "available": 0,
  "required": 1,
  "upgradeMessage": "Purchase the Image Pack (50 images for $10) or Creator Bundle to continue."
}
```

**Video Generation:**
```json
{
  "error": "Insufficient video credits",
  "available": 0,
  "required": 1,
  "upgradeMessage": "Purchase the Video Pack (20 videos for $15) or Creator Bundle to continue."
}
```

### Confirmation Expired

```json
{
  "error": "Confirmation expired",
  "message": "Please create a new confirmation request."
}
```

### Confirmation Rejected

```json
{
  "error": "Confirmation rejected",
  "message": "Video generation cancelled by user."
}
```

---

## Migration Instructions

### Apply Database Migration

**Method 1: Supabase Dashboard**
1. Go to: https://supabase.com/dashboard/project/dnxqgphaisdxvdyeiwnh/sql
2. Click "New Query"
3. Copy contents of: `supabase/migrations/20251226_credit_system.sql`
4. Paste into SQL editor
5. Click "Run"

**Method 2: Supabase CLI**
```bash
supabase link --project-ref dnxqgphaisdxvdyeiwnh
supabase db push
```

**Method 3: psql**
```bash
psql "postgresql://..." < supabase/migrations/20251226_credit_system.sql
```

### Verify Migration

```sql
-- Check tables created
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE '%credit%';

-- Check functions created
SELECT routine_name FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name LIKE '%credit%';

-- Check default packages
SELECT * FROM credit_packages;
```

---

## Testing

### Test Credit Balance

```bash
curl -X GET "https://morgus-deploy.fly.dev/api/credits/balance?user_id=YOUR_USER_ID"
```

### Test Credit Check

```bash
curl -X POST "https://morgus-deploy.fly.dev/api/credits/check" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "YOUR_USER_ID",
    "credit_type": "image",
    "amount": 1
  }'
```

### Test Credit Usage

```bash
curl -X POST "https://morgus-deploy.fly.dev/api/credits/use" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "YOUR_USER_ID",
    "credit_type": "image",
    "amount": 1,
    "description": "Test image generation"
  }'
```

### Test Confirmation Flow

```bash
# 1. Create confirmation
curl -X POST "https://morgus-deploy.fly.dev/api/credits/confirm/create" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "YOUR_USER_ID",
    "credit_type": "video",
    "credits_required": 1,
    "description": "Test video generation"
  }'

# 2. Approve confirmation
curl -X POST "https://morgus-deploy.fly.dev/api/credits/confirm/CONFIRMATION_ID/approve"

# 3. Check confirmation status
curl -X GET "https://morgus-deploy.fly.dev/api/credits/confirm/CONFIRMATION_ID"
```

---

## Security

### Row Level Security (RLS)

All tables have RLS enabled:
- Users can only view/update their own data
- Service role has full access for backend operations

### API Authentication

Credit API endpoints require:
- `user_id` parameter (validated against auth)
- Supabase service key for backend operations

### Confirmation Expiry

Video confirmations expire after 5 minutes to prevent:
- Stale confirmations
- Unauthorized credit usage
- UI state inconsistencies

---

## Monitoring

### Credit Usage Analytics

Query credit usage by type:
```sql
SELECT 
  credit_type,
  COUNT(*) as usage_count,
  SUM(ABS(amount)) as total_credits_used
FROM credit_transactions
WHERE transaction_type = 'usage'
GROUP BY credit_type;
```

### Popular Packages

Query package purchases:
```sql
SELECT 
  cp.name,
  COUNT(*) as purchase_count,
  SUM(cp.price_cents) as total_revenue_cents
FROM credit_transactions ct
JOIN credit_packages cp ON ct.metadata->>'package_id' = cp.id::text
WHERE ct.transaction_type = 'purchase'
GROUP BY cp.name
ORDER BY purchase_count DESC;
```

### User Credit Distribution

```sql
SELECT 
  CASE 
    WHEN image_credits_remaining = 0 THEN 'No credits'
    WHEN image_credits_remaining <= 5 THEN '1-5 credits'
    WHEN image_credits_remaining <= 20 THEN '6-20 credits'
    WHEN image_credits_remaining <= 50 THEN '21-50 credits'
    ELSE '50+ credits'
  END as credit_range,
  COUNT(*) as user_count
FROM user_credits
GROUP BY credit_range
ORDER BY MIN(image_credits_remaining);
```

---

## Future Enhancements

### Planned Features

1. **Subscription Plans**
   - Monthly image/video allowances
   - Rollover unused credits
   - Discounted pricing

2. **Credit Gifting**
   - Transfer credits between users
   - Gift credits via promo codes

3. **Bulk Discounts**
   - Volume pricing tiers
   - Enterprise packages

4. **Credit Expiry**
   - Optional expiration dates
   - Notifications before expiry

5. **Usage Analytics Dashboard**
   - Credit usage trends
   - Cost projections
   - Optimization recommendations

---

## Support

For questions or issues:
- **GitHub**: https://github.com/GO4ME1/morgus-agent
- **Issues**: Create an issue on GitHub
- **Documentation**: See README.md and CHANGELOG.md

---

**Last Updated**: December 26, 2025  
**Version**: 1.0.0  
**Status**: ✅ Implemented, pending database migration
