# Morgus Credit System Architecture

## Overview
Users get media generation credits (images and videos) that are tracked and displayed in real-time.

## Credit Types

### Image Credits
- **Hero images**: 1 credit
- **Logos**: 1 credit
- **Cost**: ~$0.08 per image (GPT-Image-1.5)

### Video Credits
- **Hero videos** (5 seconds): 1 credit
- **Cost**: ~$0.50 per video (Sora-2, 720p)

## Pricing Packs

### Image Pack
- **50 images** for **$10**
- Price per image: $0.20 (60% markup)

### Video Pack
- **20 videos** (5 sec each) for **$15**
- Price per video: $0.75 (50% markup)

### Bundle Pack
- **50 images + 20 videos** for **$20**
- Best value! (20% discount)

## User Flow

### Landing Page Creation
1. User requests: "Create a landing page for X"
2. Morgus analyzes and routes to DPPM
3. DPPM generates content (free)
4. **DPPM asks**: "Would you like to add images? (Uses 2 image credits: hero + logo)"
   - User: "Yes" → Generate images (deduct 2 credits)
   - User: "No" → Use placeholder images
5. **DPPM asks**: "Would you like to add a video background? (Uses 1 video credit)"
   - User: "Yes" → Generate video (deduct 1 credit)
   - User: "No" → Use static image
6. Deploy website with selected media

### Credit Display
- **Console UI**: Show credit tally in header
  - "📸 Images: 23/50 | 🎥 Videos: 5/20"
- **During generation**: Show credit usage
  - "Generating hero image... (1/2 credits used)"
  - "Generating logo... (2/2 credits used)"
  - "Generating video... (1 video credit used)"

## Database Schema

### User Credits Table
```sql
CREATE TABLE user_credits (
  user_id TEXT PRIMARY KEY,
  image_credits_total INTEGER DEFAULT 0,
  image_credits_used INTEGER DEFAULT 0,
  video_credits_total INTEGER DEFAULT 0,
  video_credits_used INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Credit Transactions Table
```sql
CREATE TABLE credit_transactions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  type TEXT NOT NULL, -- 'image' or 'video'
  amount INTEGER NOT NULL, -- positive for purchase, negative for usage
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Implementation Steps

### Phase 1: Make video generation optional
- Update `template-generator.ts` to accept `generateVideo` flag
- Only call `generateHeroVideo()` if flag is true
- Return placeholder if video not requested

### Phase 2: Add confirmation prompts
- DPPM asks user before generating media
- Parse user response (yes/no)
- Track which media to generate

### Phase 3: Add credit tracking
- Create credit tracking API in worker
- Check credits before generation
- Deduct credits after successful generation
- Return credit balance in response

### Phase 4: Update console UI
- Add credit display in header
- Show real-time credit usage during generation
- Alert user when credits are low

### Phase 5: Add credit purchase flow
- Create Stripe checkout for credit packs
- Add credits to user account after purchase
- Send confirmation email

## API Endpoints

### GET /api/credits
Returns user's current credit balance
```json
{
  "image_credits": {
    "total": 50,
    "used": 27,
    "remaining": 23
  },
  "video_credits": {
    "total": 20,
    "used": 15,
    "remaining": 5
  }
}
```

### POST /api/credits/purchase
Purchase credit pack
```json
{
  "pack": "bundle", // "images", "videos", or "bundle"
  "payment_method": "stripe_token_here"
}
```

### POST /api/credits/use
Deduct credits (internal use only)
```json
{
  "user_id": "user_123",
  "type": "video",
  "amount": 1,
  "description": "Hero video for landing page"
}
```

## Starter Credits
- New users get **10 free image credits** and **2 free video credits**
- Allows them to create 5 landing pages with images
- Or 2 landing pages with images + video

## Notes
- Credits never expire
- Unused credits roll over
- Refunds not available (digital goods)
- Enterprise users get unlimited credits
