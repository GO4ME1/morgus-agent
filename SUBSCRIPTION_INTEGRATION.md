# Subscription + Credit System Integration Guide

**How to integrate the credit system with your existing subscription plans**

---

## Overview

Your current pricing has **subscription plans with unlimited images**. The credit system needs to respect these plans while still tracking usage for free users and allowing à la carte purchases.

---

## Current Plans & Credit Mapping

### **Free Tier ($0)**
- **Image Credits**: 5 (one-time grant)
- **Video Credits**: 1 (one-time grant)
- **Unlimited Flags**: Both `false`
- **Can Purchase**: Credit packs separately

### **Day Pass ($3 one-time, 24 hours)**
- **Image Credits**: Unlimited (`unlimited_image_credits = true`)
- **Video Credits**: 2 per day
- **Implementation**: Set unlimited flag for images, grant 2 video credits

### **Weekly ($21/week)**
- **Image Credits**: Unlimited (`unlimited_image_credits = true`)
- **Video Credits**: 10 per day
- **Implementation**: Set unlimited flag for images, grant 10 video credits daily

### **Monthly ($75/month)**
- **Image Credits**: Unlimited (`unlimited_image_credits = true`)
- **Video Credits**: Unlimited (`unlimited_video_credits = true`)
- **Implementation**: Set both unlimited flags to true

---

## Implementation Steps

### **Step 1: When User Subscribes**

Add this to your Stripe webhook handler (when subscription is created/updated):

```typescript
// After successful subscription payment
async function handleSubscriptionCreated(subscription: any) {
  const userId = subscription.metadata.userId;
  const planId = subscription.metadata.planId; // 'daily', 'weekly', 'monthly'
  
  // Grant unlimited credits based on plan
  if (planId === 'daily') {
    // Day Pass: Unlimited images, 2 videos
    await grantSubscriptionCredits(userId, {
      unlimited_images: true,
      unlimited_videos: false,
      video_credits: 2
    });
  } else if (planId === 'weekly') {
    // Weekly: Unlimited images, 10 videos per day
    await grantSubscriptionCredits(userId, {
      unlimited_images: true,
      unlimited_videos: false,
      video_credits: 10
    });
  } else if (planId === 'monthly') {
    // Monthly: Unlimited everything
    await grantSubscriptionCredits(userId, {
      unlimited_images: true,
      unlimited_videos: true,
      video_credits: 0 // Not needed, unlimited
    });
  }
}

async function grantSubscriptionCredits(userId: string, options: {
  unlimited_images: boolean;
  unlimited_videos: boolean;
  video_credits: number;
}) {
  // Update unlimited flags
  await supabase
    .from('user_credits')
    .update({
      unlimited_image_credits: options.unlimited_images,
      unlimited_video_credits: options.unlimited_videos
    })
    .eq('user_id', userId);
  
  // Add video credits if needed
  if (options.video_credits > 0) {
    await supabase.rpc('add_credits', {
      p_user_id: userId,
      p_credit_type: 'video',
      p_amount: options.video_credits,
      p_transaction_type: 'subscription',
      p_description: 'Subscription video credits'
    });
  }
}
```

### **Step 2: When Subscription Expires/Cancels**

```typescript
async function handleSubscriptionCanceled(subscription: any) {
  const userId = subscription.metadata.userId;
  
  // Remove unlimited flags
  await supabase
    .from('user_credits')
    .update({
      unlimited_image_credits: false,
      unlimited_video_credits: false
    })
    .eq('user_id', userId);
  
  // Note: Don't remove existing credit balance
  // User keeps any purchased credits
}
```

### **Step 3: Daily Video Credit Refresh (Weekly Plan)**

For the Weekly plan, users get 10 video credits per day. You need a daily cron job:

```typescript
// Run daily at midnight
async function refreshWeeklyVideoCredits() {
  // Get all active weekly subscribers
  const { data: weeklyUsers } = await supabase
    .from('subscriptions')
    .select('user_id')
    .eq('plan_id', 'weekly')
    .eq('status', 'active');
  
  // Grant 10 video credits to each
  for (const user of weeklyUsers) {
    await supabase.rpc('add_credits', {
      p_user_id: user.user_id,
      p_credit_type: 'video',
      p_amount: 10,
      p_transaction_type: 'subscription',
      p_description: 'Daily video credits refresh (Weekly plan)'
    });
  }
}
```

### **Step 4: Day Pass Expiry (24 hours)**

For Day Pass, remove unlimited after 24 hours:

```typescript
// Run every hour
async function checkDayPassExpiry() {
  // Get all day passes that expired
  const { data: expiredPasses } = await supabase
    .from('subscriptions')
    .select('user_id, created_at')
    .eq('plan_id', 'daily')
    .eq('status', 'active')
    .lt('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());
  
  // Remove unlimited flags
  for (const pass of expiredPasses) {
    await supabase
      .from('user_credits')
      .update({
        unlimited_image_credits: false,
        unlimited_video_credits: false
      })
      .eq('user_id', pass.user_id);
    
    // Mark subscription as expired
    await supabase
      .from('subscriptions')
      .update({ status: 'expired' })
      .eq('user_id', pass.user_id)
      .eq('plan_id', 'daily');
  }
}
```

---

## SQL Queries for Manual Management

### **Grant Unlimited Images (Day Pass, Weekly, Monthly)**

```sql
-- Give user unlimited image credits
UPDATE user_credits
SET unlimited_image_credits = true
WHERE user_id = 'USER_ID_HERE';
```

### **Grant Unlimited Videos (Monthly)**

```sql
-- Give user unlimited video credits
UPDATE user_credits
SET unlimited_video_credits = true
WHERE user_id = 'USER_ID_HERE';
```

### **Add Video Credits (Day Pass: 2, Weekly: 10)**

```sql
-- Add 2 video credits (Day Pass)
SELECT add_credits(
  'USER_ID_HERE'::uuid,
  'video',
  2,
  'subscription',
  'Day Pass video credits'
);

-- Add 10 video credits (Weekly)
SELECT add_credits(
  'USER_ID_HERE'::uuid,
  'video',
  10,
  'subscription',
  'Weekly video credits'
);
```

### **Remove Unlimited (When subscription expires)**

```sql
-- Remove unlimited flags
UPDATE user_credits
SET 
  unlimited_image_credits = false,
  unlimited_video_credits = false
WHERE user_id = 'USER_ID_HERE';
```

### **Check User's Credit Status**

```sql
-- See user's credit status
SELECT 
  user_id,
  image_credits_remaining,
  video_credits_remaining,
  unlimited_image_credits,
  unlimited_video_credits,
  created_at,
  updated_at
FROM user_credits
WHERE user_id = 'USER_ID_HERE';
```

---

## How Credit Checks Work

### **For Subscription Users**

1. User requests image generation
2. System calls `check_credits(user_id, 'image', 1)`
3. Function checks `unlimited_image_credits` flag
4. If `true` → Returns `true` (no credit deduction)
5. If `false` → Checks actual balance

### **For Free Users**

1. User requests image generation
2. System calls `check_credits(user_id, 'image', 1)`
3. Function checks `unlimited_image_credits` flag (false)
4. Checks actual balance (5 credits initially)
5. If sufficient → Returns `true`
6. After generation → Deduct 1 credit

### **Video Credits**

- **Monthly users**: `unlimited_video_credits = true` → Always pass
- **Weekly users**: Check actual balance (10 per day)
- **Day Pass users**: Check actual balance (2 total)
- **Free users**: Check actual balance (1 initially, can buy more)

---

## Testing

### **Test Unlimited Images**

```sql
-- Give yourself unlimited images
UPDATE user_credits
SET unlimited_image_credits = true
WHERE user_id = 'YOUR_USER_ID';

-- Test: Generate 100 images, should all work
-- Check balance: image_credits_remaining should not decrease
```

### **Test Video Credits**

```sql
-- Give yourself 2 video credits (Day Pass simulation)
SELECT add_credits(
  'YOUR_USER_ID'::uuid,
  'video',
  2,
  'subscription',
  'Test Day Pass'
);

-- Generate 2 videos: Should work
-- Generate 3rd video: Should fail (insufficient credits)
```

### **Test Free Tier**

```sql
-- Reset to free tier
UPDATE user_credits
SET 
  unlimited_image_credits = false,
  unlimited_video_credits = false,
  image_credits_total = 5,
  image_credits_used = 0,
  video_credits_total = 1,
  video_credits_used = 0
WHERE user_id = 'YOUR_USER_ID';

-- Generate 5 images: Should work
-- Generate 6th image: Should fail
```

---

## UI Display

### **Credit Balance Widget**

The `CreditBalance` component should show:

**For Subscription Users:**
```
🖼️ ∞  🎥 10
```
(Infinity symbol for unlimited images, actual count for videos)

**For Free Users:**
```
🖼️ 5  🎥 1
```
(Actual counts for both)

**Implementation:**

```typescript
// In CreditBalance.tsx
const displayImageCredits = balance.unlimited_image_credits 
  ? '∞' 
  : balance.images.remaining;

const displayVideoCredits = balance.unlimited_video_credits 
  ? '∞' 
  : balance.videos.remaining;
```

---

## Summary

**Subscription Plans:**
- ✅ Day Pass → Unlimited images, 2 videos
- ✅ Weekly → Unlimited images, 10 videos/day
- ✅ Monthly → Unlimited images, unlimited videos

**Free Tier:**
- ✅ 5 image credits (one-time)
- ✅ 1 video credit (one-time)
- ✅ Can purchase credit packs

**Integration Points:**
1. Stripe webhook → Grant unlimited flags
2. Daily cron → Refresh weekly video credits
3. Hourly cron → Expire day passes
4. Cancellation webhook → Remove unlimited flags

**Database Changes:**
- ✅ `unlimited_image_credits` column
- ✅ `unlimited_video_credits` column
- ✅ `check_credits()` function respects both flags

---

**Next Step**: Update your Stripe webhook handler to call `grantSubscriptionCredits()` when a subscription is created! 🚀
