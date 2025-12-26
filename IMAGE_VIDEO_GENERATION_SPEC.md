# 🎨 Image & Video Generation Integration Spec

> Integrating OpenAI's GPT Image 1.5 and Sora 2 for Morgus content creation

## Overview

Morgus will support AI-generated images and videos for:
- Marketing content (Bill the Marketing Hog)
- Landing page illustrations
- Social media posts
- Product demos
- Promotional videos

---

## 📸 Image Generation: GPT Image 1.5

### Pricing (December 2024)
Based on latest OpenAI announcements:

| Model | Input Tokens | Output Tokens | Notes |
|-------|--------------|---------------|-------|
| gpt-image-1 | $2.50/1M | $10.00/1M | Original model |
| gpt-image-1.5 | $2.00/1M | $8.00/1M | **20% cheaper!** |
| gpt-image-1-mini | $2.00/1M | $8.00/1M | Cost-optimized |

### Per-Image Estimates
| Quality | Resolution | Est. Cost |
|---------|------------|-----------|
| Standard | 1024x1024 | ~$0.02-0.04 |
| HD | 1024x1792 | ~$0.04-0.08 |
| HD | 1792x1024 | ~$0.04-0.08 |

### Key Features (GPT Image 1.5)
- **4x faster** generation than previous models
- **Better text rendering** in images
- **More precise edits** - change specific elements
- **Consistent details** - maintains style across edits
- **Multimodal input** - accepts text + reference images

### API Integration

```typescript
// worker/src/services/image-generation.ts

import OpenAI from 'openai';

interface ImageGenerationOptions {
  prompt: string;
  size?: '1024x1024' | '1024x1792' | '1792x1024';
  quality?: 'standard' | 'hd';
  style?: 'vivid' | 'natural';
  n?: number;
  referenceImage?: string; // base64 or URL
}

interface ImageGenerationResult {
  url: string;
  revisedPrompt: string;
  cost: number;
}

export class ImageGenerationService {
  private openai: OpenAI;
  
  constructor(apiKey: string) {
    this.openai = new OpenAI({ apiKey });
  }
  
  async generateImage(options: ImageGenerationOptions): Promise<ImageGenerationResult> {
    const response = await this.openai.images.generate({
      model: 'gpt-image-1.5', // or 'dall-e-3' for fallback
      prompt: options.prompt,
      size: options.size || '1024x1024',
      quality: options.quality || 'standard',
      style: options.style || 'vivid',
      n: options.n || 1,
    });
    
    // Estimate cost based on size and quality
    const cost = this.estimateCost(options);
    
    return {
      url: response.data[0].url!,
      revisedPrompt: response.data[0].revised_prompt || options.prompt,
      cost,
    };
  }
  
  async editImage(
    image: string, // base64 or URL
    prompt: string,
    mask?: string
  ): Promise<ImageGenerationResult> {
    const response = await this.openai.images.edit({
      model: 'gpt-image-1.5',
      image: image,
      prompt: prompt,
      mask: mask,
      size: '1024x1024',
    });
    
    return {
      url: response.data[0].url!,
      revisedPrompt: prompt,
      cost: 0.04, // Estimate
    };
  }
  
  private estimateCost(options: ImageGenerationOptions): number {
    const baseCost = 0.02;
    const hdMultiplier = options.quality === 'hd' ? 2 : 1;
    const sizeMultiplier = options.size?.includes('1792') ? 1.5 : 1;
    return baseCost * hdMultiplier * sizeMultiplier * (options.n || 1);
  }
}
```

### Use Cases in Morgus

1. **Landing Page Illustrations**
   - Hero images
   - Feature icons
   - Background patterns
   - Team/mascot images

2. **Marketing Content (Bill)**
   - Social media graphics
   - Ad creatives
   - Blog post headers
   - Email banners

3. **Morgy Avatars**
   - Custom Morgy skins
   - Profile pictures
   - Achievement badges

---

## 🎬 Video Generation: Sora 2

### Pricing (December 2024)

| Access Method | Cost | Notes |
|---------------|------|-------|
| ChatGPT Plus | $20/mo | 1,000 credits (~50 videos at 480p) |
| ChatGPT Pro | $200/mo | 10,000 credits (~500 videos) |
| API (base) | $0.10/sec | sora-2 model |
| API (pro) | $0.50/sec | sora-2-pro, higher quality |

### Per-Video Estimates
| Duration | Resolution | Model | Est. Cost |
|----------|------------|-------|-----------|
| 5 sec | 480p | sora-2 | $0.50 |
| 10 sec | 720p | sora-2 | $1.50 |
| 20 sec | 1080p | sora-2-pro | $10.00 |
| 30 sec | 1080p | sora-2-pro | $15.00 |

### Key Features
- **Text-to-video** - Generate from prompts
- **Image-to-video** - Animate still images
- **Video-to-video** - Style transfer, extend clips
- **Storyboard mode** - Multi-scene generation
- **Remix/blend** - Combine multiple videos

### API Integration

```typescript
// worker/src/services/video-generation.ts

interface VideoGenerationOptions {
  prompt: string;
  duration?: 5 | 10 | 15 | 20;
  resolution?: '480p' | '720p' | '1080p';
  model?: 'sora-2' | 'sora-2-pro';
  aspectRatio?: '16:9' | '9:16' | '1:1';
  sourceImage?: string; // For image-to-video
}

interface VideoGenerationResult {
  videoUrl: string;
  thumbnailUrl: string;
  duration: number;
  cost: number;
}

export class VideoGenerationService {
  private apiKey: string;
  private baseUrl = 'https://api.openai.com/v1/videos';
  
  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }
  
  async generateVideo(options: VideoGenerationOptions): Promise<VideoGenerationResult> {
    const response = await fetch(`${this.baseUrl}/generations`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: options.model || 'sora-2',
        prompt: options.prompt,
        duration: options.duration || 5,
        resolution: options.resolution || '720p',
        aspect_ratio: options.aspectRatio || '16:9',
      }),
    });
    
    const data = await response.json();
    const cost = this.estimateCost(options);
    
    return {
      videoUrl: data.video_url,
      thumbnailUrl: data.thumbnail_url,
      duration: options.duration || 5,
      cost,
    };
  }
  
  async animateImage(
    imageUrl: string,
    prompt: string,
    duration: number = 5
  ): Promise<VideoGenerationResult> {
    const response = await fetch(`${this.baseUrl}/image-to-video`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'sora-2',
        image: imageUrl,
        prompt: prompt,
        duration: duration,
      }),
    });
    
    const data = await response.json();
    
    return {
      videoUrl: data.video_url,
      thumbnailUrl: data.thumbnail_url,
      duration: duration,
      cost: duration * 0.10,
    };
  }
  
  private estimateCost(options: VideoGenerationOptions): number {
    const duration = options.duration || 5;
    const baseRate = options.model === 'sora-2-pro' ? 0.50 : 0.10;
    const resolutionMultiplier = 
      options.resolution === '1080p' ? 1.5 :
      options.resolution === '720p' ? 1.2 : 1.0;
    
    return duration * baseRate * resolutionMultiplier;
  }
}
```

### Use Cases in Morgus

1. **Product Demos**
   - App walkthroughs
   - Feature highlights
   - Before/after comparisons

2. **Social Media (Bill)**
   - TikTok videos
   - Instagram Reels
   - YouTube Shorts
   - Twitter/X video posts

3. **Marketing**
   - Promo videos
   - Testimonial animations
   - Explainer videos

4. **Morgy Content**
   - Morgy introduction videos
   - Skill demonstration clips
   - Achievement celebrations

---

## 🔧 Integration with Morgus

### Unified Media Generation Service

```typescript
// worker/src/services/media-generation.ts

import { ImageGenerationService } from './image-generation';
import { VideoGenerationService } from './video-generation';

export class MediaGenerationService {
  private imageService: ImageGenerationService;
  private videoService: VideoGenerationService;
  
  constructor(openaiApiKey: string) {
    this.imageService = new ImageGenerationService(openaiApiKey);
    this.videoService = new VideoGenerationService(openaiApiKey);
  }
  
  // Smart generation - picks best format for use case
  async generateMedia(request: {
    type: 'image' | 'video' | 'auto';
    purpose: 'social' | 'landing' | 'marketing' | 'avatar';
    prompt: string;
    platform?: 'twitter' | 'tiktok' | 'instagram' | 'linkedin' | 'web';
  }) {
    // Auto-detect best format
    if (request.type === 'auto') {
      if (['tiktok', 'instagram'].includes(request.platform || '')) {
        request.type = 'video';
      } else {
        request.type = 'image';
      }
    }
    
    // Get optimal settings for platform
    const settings = this.getOptimalSettings(request.platform, request.purpose);
    
    if (request.type === 'video') {
      return this.videoService.generateVideo({
        prompt: request.prompt,
        ...settings.video,
      });
    } else {
      return this.imageService.generateImage({
        prompt: request.prompt,
        ...settings.image,
      });
    }
  }
  
  private getOptimalSettings(platform?: string, purpose?: string) {
    const settings: any = {
      image: { size: '1024x1024', quality: 'standard' },
      video: { duration: 5, resolution: '720p', model: 'sora-2' },
    };
    
    switch (platform) {
      case 'tiktok':
        settings.video = { duration: 15, resolution: '1080p', aspectRatio: '9:16', model: 'sora-2' };
        settings.image = { size: '1024x1792', quality: 'hd' };
        break;
      case 'instagram':
        settings.video = { duration: 10, resolution: '1080p', aspectRatio: '1:1', model: 'sora-2' };
        settings.image = { size: '1024x1024', quality: 'hd' };
        break;
      case 'twitter':
        settings.video = { duration: 5, resolution: '720p', aspectRatio: '16:9', model: 'sora-2' };
        settings.image = { size: '1792x1024', quality: 'standard' };
        break;
      case 'linkedin':
        settings.image = { size: '1792x1024', quality: 'hd' };
        settings.video = { duration: 10, resolution: '1080p', aspectRatio: '16:9', model: 'sora-2' };
        break;
    }
    
    return settings;
  }
}
```

### Bill the Marketing Hog Integration

```typescript
// Add to bill-mcp.ts tools

{
  name: 'generate_social_media_visual',
  description: 'Generate an image or video for social media post',
  inputSchema: {
    type: 'object',
    properties: {
      platform: {
        type: 'string',
        enum: ['twitter', 'tiktok', 'instagram', 'linkedin', 'facebook'],
        description: 'Target social media platform',
      },
      content_type: {
        type: 'string',
        enum: ['image', 'video'],
        description: 'Type of visual content to generate',
      },
      description: {
        type: 'string',
        description: 'What the visual should show/convey',
      },
      style: {
        type: 'string',
        enum: ['professional', 'playful', 'minimalist', 'bold', 'elegant'],
        description: 'Visual style',
      },
      include_text: {
        type: 'string',
        description: 'Optional text overlay to include in the image',
      },
    },
    required: ['platform', 'content_type', 'description'],
  },
}
```

---

## 💰 Cost Management

### User Limits by Tier

| Tier | Images/Month | Videos/Month | Est. Cost to Morgus |
|------|--------------|--------------|---------------------|
| Free | 5 | 0 | $0.20 |
| Pro ($19) | 100 | 10 | $6.00 |
| Team ($49) | 500 | 50 | $35.00 |
| Enterprise | Unlimited | Unlimited | Custom |

### Cost Tracking

```typescript
// Track generation costs per user
interface GenerationUsage {
  user_id: string;
  month: string; // YYYY-MM
  images_generated: number;
  videos_generated: number;
  total_cost: number;
}

// Enforce limits before generation
async function checkGenerationLimits(userId: string, type: 'image' | 'video'): Promise<boolean> {
  const usage = await getUsage(userId);
  const limits = await getUserLimits(userId);
  
  if (type === 'image' && usage.images_generated >= limits.images_per_month) {
    throw new Error('Monthly image generation limit reached. Upgrade to continue.');
  }
  
  if (type === 'video' && usage.videos_generated >= limits.videos_per_month) {
    throw new Error('Monthly video generation limit reached. Upgrade to continue.');
  }
  
  return true;
}
```

---

## 🚀 Implementation Phases

### Phase 1: Image Generation (Week 1)
- [ ] Create ImageGenerationService
- [ ] Integrate with landing page templates
- [ ] Add to Bill's marketing tools
- [ ] Set up cost tracking

### Phase 2: Video Generation (Week 2)
- [ ] Create VideoGenerationService
- [ ] Add social media video tools to Bill
- [ ] Implement platform-specific optimizations
- [ ] Add video to Morgy content creation

### Phase 3: Advanced Features (Week 3)
- [ ] Image editing (inpainting, outpainting)
- [ ] Video remixing and blending
- [ ] Batch generation for campaigns
- [ ] A/B testing for ad creatives

---

## 📋 Environment Variables Needed

```bash
# Add to Cloudflare Worker secrets
OPENAI_API_KEY=sk-...  # For image generation
OPENAI_SORA_API_KEY=sk-...  # For video (if separate)
```

---

## 🎯 Summary

| Feature | Model | Cost | Status |
|---------|-------|------|--------|
| Image Generation | gpt-image-1.5 | ~$0.02-0.08/image | Ready to implement |
| Image Editing | gpt-image-1.5 | ~$0.04/edit | Ready to implement |
| Video Generation | sora-2 | $0.10-0.50/sec | API access needed |
| Video from Image | sora-2 | $0.10/sec | API access needed |

**Recommendation:** Start with GPT Image 1.5 (cheap, fast, available now), add Sora when API access is confirmed.
