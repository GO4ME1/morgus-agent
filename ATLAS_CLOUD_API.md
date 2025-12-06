# Atlas Cloud API Integration

## Overview
Atlas Cloud is an AI API aggregation platform providing access to 300+ models including:
- Image generation (Flux, Stable Diffusion, etc.)
- Video generation (Seedream 4.5, Kling, etc.)
- LLMs (DeepSeek, GPT, Claude, etc.)
- ByteDance models

## API Details

**Base URL**: `https://api.atlascloud.ai`

**Authentication**: Bearer token in Authorization header
```
Authorization: Bearer <your-api-key>
```

**Your API Key**: `019af21f-68cb-7a22-a105-12614b2ec88f`

## Endpoints

### 1. Chat Completions (LLMs)
```
POST /api/v1/chat/completions
```

**Request Body**:
```json
{
  "model": "deepseek-ai/DeepSeek-V3.1",
  "messages": [
    {
      "role": "user",
      "content": "your prompt here"
    }
  ],
  "max_tokens": 32767,
  "temperature": 1,
  "top_p": 0.9,
  "stream": false
}
```

### 2. Image/Video Generation
```
POST /api/v1/chat/completions
```

(Uses same endpoint but with different model IDs)

**Video Generation Models**:
- `bytedance/seedream-4.5` - Latest Seedream model
- `kling/kling-v1` - Kling video generation
- Other video models available

**Image Generation Models**:
- `flux/flux-pro` - High quality images
- `stable-diffusion-xl` - SD XL
- Other image models available

## Performance
- **Video generation**: ~2 minutes
- **Image generation**: <5 seconds

## Next Steps
1. Test API with your key
2. Find exact model IDs for Seedream/Kling
3. Integrate into Morgus tools
4. Add to agent's tool registry
