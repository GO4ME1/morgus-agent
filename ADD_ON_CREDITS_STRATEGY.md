# Add-On Credits Strategy for Subscription Users

**Flexible credit system that allows subscription users to purchase additional credits when needed**

---

## 🎯 Goal

Allow users on **Day Pass** and **Weekly** plans to purchase additional video credits when they need more than their daily allowance, without forcing them to upgrade to Monthly.

---

## 💡 How It Works

### **Current System**

| Plan | Images | Videos | Price |
|------|--------|--------|-------|
| Free | 5 (one-time) | 1 (one-time) | $0 |
| Day Pass | **Unlimited** | 2 per 24h | $3 |
| Weekly | **Unlimited** | 10 per day | $21/week |
| Monthly | **Unlimited** | **Unlimited** | $75/month |

### **Add-On Credit Packs** (Available to ALL users)

| Package | Images | Videos | Price | Best For |
|---------|--------|--------|-------|----------|
| **Image Pack** | 50 | 0 | $10 | Free users who need more images |
| **Video Pack** | 20 | 0 | $15 | Anyone who needs more videos |
| **Creator Bundle** | 50 | 20 | $20 | Free users (best value) |

---

## 📊 Use Cases

### **Scenario 1: Day Pass User Needs More Videos**

**User**: Has Day Pass ($3)
- ✅ Unlimited images
- ✅ 2 videos included
- ❌ Needs 10 videos today for a project

**Solution**: Buy Video Pack
- **Cost**: $3 (Day Pass) + $15 (Video Pack) = **$18 total**
- **Gets**: Unlimited images + 22 videos (2 included + 20 from pack)
- **Saves**: $3 vs upgrading to Weekly ($21)

### **Scenario 2: Weekly User Has a Video-Heavy Day**

**User**: Has Weekly subscription ($21/week)
- ✅ Unlimited images
- ✅ 10 videos per day
- ❌ Already used 10 videos today, needs 15 more

**Solution**: Buy Video Pack
- **Cost**: $21/week + $15 (one-time) = **$36 this week**
- **Gets**: Unlimited images + 30 videos today (10 daily + 20 from pack)
- **Saves**: $39 vs upgrading to Monthly ($75)

### **Scenario 3: Free User Wants to Test Videos**

**User**: Free tier
- ✅ 5 images (used 2, 3 remaining)
- ✅ 1 video (not used yet)
- ❌ Wants to try 5 videos before committing to subscription

**Solution**: Buy Video Pack
- **Cost**: $0 (Free) + $15 (Video Pack) = **$15 total**
- **Gets**: 3 images + 21 videos (1 free + 20 from pack)
- **Saves**: Can test videos without $21/week commitment

---

## 🔧 Implementation

### **Credit Balance Logic**

The system tracks:
1. **Unlimited flags** (from subscription)
2. **Credit balance** (from purchases + daily allowances)

**Example for Weekly user:**
```typescript
{
  unlimited_image_credits: true,      // From Weekly subscription
  unlimited_video_credits: false,     // Not unlimited
  image_credits_remaining: 0,         // Not used (unlimited)
  video_credits_remaining: 25,        // 10 daily + 15 purchased
  image_credits_total: 0,
  video_credits_total: 25,
  image_credits_used: 0,
  video_credits_used: 0
}
```

### **Credit Check Flow**

```typescript
async function checkVideoCredits(userId: string) {
  const balance = await getBalance(userId);
  
  // Check unlimited flag first
  if (balance.unlimited_video_credits) {
    return { hasCredits: true, available: Infinity };
  }
  
  // Otherwise check actual balance (daily allowance + purchased)
  const available = balance.video_credits_remaining;
  return { hasCredits: available >= 1, available };
}
```

### **When User Purchases Video Pack**

```typescript
// User on Weekly plan buys Video Pack
await supabase.rpc('add_credits', {
  p_user_id: userId,
  p_credit_type: 'video',
  p_amount: 20,
  p_transaction_type: 'purchase',
  p_description: 'Video Pack purchase',
  p_payment_id: stripePaymentId
});

// Result: video_credits_remaining = 10 (daily) + 20 (purchased) = 30
```

---

## 💰 Pricing Strategy

### **Why This Works**

**Flexibility for users:**
- Don't need to commit to Monthly ($75) for occasional video-heavy days
- Can buy exactly what they need, when they need it
- Encourages experimentation without big commitment

**Revenue optimization:**
- Day Pass ($3) + Video Pack ($15) = $18 → Good for one-time users
- Weekly ($21) + Video Pack ($15) = $36/week → Still cheaper than Monthly
- Encourages users to stay on lower tiers and buy add-ons

**Clear upgrade path:**
- Free → Try it out
- Free + Credit Packs → Pay as you go
- Day Pass → Test full features
- Weekly → Regular usage
- Weekly + Add-ons → Heavy usage days
- Monthly → Unlimited everything

---

## 🎨 UI/UX

### **When User Hits Limit**

**Day Pass user (used 2 videos):**
```
⚠️ Video Limit Reached

You've used your 2 included videos today.

Options:
1. Buy Video Pack ($15 for 20 more videos)
2. Upgrade to Weekly ($21/week for 10 videos/day)
3. Upgrade to Monthly ($75/month for unlimited videos)

[Buy Video Pack]  [Upgrade Plan]
```

**Weekly user (used 10 videos today):**
```
⚠️ Daily Video Limit Reached

You've used your 10 videos today. More available tomorrow!

Need more videos now?
• Buy Video Pack: $15 for 20 more videos (available immediately)
• Upgrade to Monthly: $75/month for unlimited videos

[Buy Video Pack]  [Upgrade to Monthly]  [Wait Until Tomorrow]
```

### **Pricing Page Update**

Add a section for add-on credits:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Need Extra Credits?

All plans can purchase add-on credit packs:

📦 Video Pack - $15
   20 video generations
   Perfect for video-heavy projects
   [Buy Now]

📦 Image Pack - $10
   50 image generations
   For free tier users
   [Buy Now]

📦 Creator Bundle - $20 (Save $5!)
   50 images + 20 videos
   Best value for free tier
   [Buy Now]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## 📊 Expected User Behavior

### **Free Tier**
- Try free credits (5 images, 1 video)
- If they like it → Buy credit packs OR upgrade to Day Pass
- Conversion rate: ~15-20%

### **Day Pass**
- Use unlimited images + 2 videos
- If need more videos → Buy Video Pack ($15)
- Occasional users stay here + buy packs as needed
- Conversion to Weekly: ~30%

### **Weekly**
- Use unlimited images + 10 videos/day
- Most days: 10 videos is enough
- Heavy days: Buy Video Pack ($15)
- Average: 1-2 video packs per month = $21/week + $15-30/month
- Conversion to Monthly: ~40% (when consistently buying packs)

### **Monthly**
- Unlimited everything
- No need for add-ons
- Retention: ~80%

---

## 🔢 Revenue Scenarios

### **Scenario A: Free User**
- Month 1: Free ($0)
- Month 2: Buys Creator Bundle ($20)
- Month 3: Upgrades to Weekly ($84/month)
- **Total Year 1**: ~$1,000

### **Scenario B: Day Pass User**
- Uses Day Pass 2x/month ($6)
- Buys Video Pack 1x/month ($15)
- **Total Year 1**: $252

### **Scenario C: Weekly User**
- Weekly subscription ($84/month)
- Buys Video Pack 2x/month ($30)
- **Total Year 1**: $1,368

### **Scenario D: Monthly User**
- Monthly subscription ($75/month)
- No add-ons needed
- **Total Year 1**: $900

**Key Insight**: Weekly + Add-ons generates MORE revenue than Monthly! This is good - it means users who need flexibility pay more, while committed users get better value.

---

## ✅ Implementation Checklist

### **Already Done** ✅
- [x] Database supports credit balance tracking
- [x] Credit service handles purchases
- [x] API endpoints for adding credits
- [x] Unlimited flags work correctly
- [x] Credit packs defined in database

### **To Do** ⏳
- [ ] Update pricing page with add-on section
- [ ] Add "Buy Credits" flow in console
- [ ] Update upgrade prompts to show add-on option
- [ ] Stripe integration for credit pack purchases
- [ ] Email confirmation for credit purchases
- [ ] Transaction history page

---

## 🎯 Summary

**Strategy:**
- ✅ All plans can buy add-on credits
- ✅ Day Pass + Video Pack = $18 (good for occasional users)
- ✅ Weekly + Video Pack = $36/week (cheaper than Monthly for most)
- ✅ Monthly = $75 (best for heavy users, no add-ons needed)

**Benefits:**
- ✅ Flexibility for users (don't force upgrade)
- ✅ Revenue optimization (Weekly + add-ons > Monthly)
- ✅ Clear upgrade path (Free → Packs → Day Pass → Weekly → Monthly)
- ✅ Encourages experimentation

**User Experience:**
- ✅ Hit limit → See options (buy pack OR upgrade)
- ✅ Buy pack → Credits available immediately
- ✅ No commitment required
- ✅ Can always upgrade later

---

**Next Step**: Update the pricing page and add "Buy Credits" flow! 🚀
