# Vision/PDF Support Documentation

## Overview

Morgus now supports **vision and PDF analysis** through two AI models:
- **Gemini 2.0 Flash** (Google) - Full vision support for images and PDFs
- **Claude 3.5 Haiku** (Anthropic) - Vision support for images

Non-vision models (Mistral, DeepSeek, KAT-Coder, GPT-4o-mini) receive text-only prompts and compete alongside vision models in the MOE system.

---

## How It Works

### Frontend
The file upload button in the chat interface allows users to attach images and PDFs. Files are:
1. Uploaded to `/upload` endpoint
2. Converted to base64 data URLs
3. Sent to `/moe-chat` endpoint in the `files` array

### Backend
The MOE system processes files as follows:
1. **Vision models (Gemini, Claude)** receive both text prompt and image data
2. **Non-vision models** receive only the text prompt
3. All models compete in parallel
4. Nash Equilibrium selects the best response

---

## Supported File Types

### Images
- **JPEG** (.jpg, .jpeg)
- **PNG** (.png)
- **GIF** (.gif)
- **WebP** (.webp)

### Documents
- **PDF** (.pdf) - Gemini only (Claude has limited PDF support)

---

## Technical Implementation

### Gemini Vision
Uses the `callGeminiWithVision` function in `/worker/src/gemini.ts`:
```typescript
// Converts base64 data URLs to Gemini's inlineData format
{
  inlineData: {
    mimeType: "image/jpeg",
    data: base64String
  }
}
```

### Claude Vision
Uses the `buildClaudeVisionContent` function in `/worker/src/claude-moe.ts`:
```typescript
// Converts base64 data URLs to Claude's image format
{
  type: "image",
  source: {
    type: "base64",
    media_type: "image/jpeg",
    data: base64String
  }
}
```

---

## Testing Vision Support

### Method 1: Frontend (Recommended)
1. Open https://e4339fb7.morgus-console.pages.dev
2. Click the **📎 attachment button**
3. Upload an image or PDF
4. Type a question like "What do you see in this image?"
5. Send the message
6. View MOE competition results showing which models analyzed the image

### Method 2: API Test (cURL)
```bash
# 1. Convert image to base64
base64 your_image.jpg > image_base64.txt

# 2. Create data URL
DATA_URL="data:image/jpeg;base64,$(cat image_base64.txt)"

# 3. Test the API
curl -X POST https://morgus-orchestrator.morgan-426.workers.dev/moe-chat \
  -H "Content-Type: application/json" \
  -d "{
    \"message\": \"What do you see in this image?\",
    \"files\": [\"$DATA_URL\"]
  }"
```

### Method 3: Test Script
Use the provided test script:
```bash
cd /home/ubuntu/morgus-agent
./test_vision.sh
```

---

## Limitations

### File Size
- **Cloudflare Workers limit:** 100 MB request size
- **Recommended max:** 5 MB per image for fast processing
- **PDFs:** Keep under 10 MB for best results

### Token Limits
- **Claude 3.5 Haiku:** Limited to 500 tokens output (cost control)
- **Gemini 2.0 Flash:** 8,192 tokens max output
- Large images/PDFs consume more input tokens

### PDF Support
- **Gemini:** Full PDF support (text extraction + visual analysis)
- **Claude:** Limited PDF support (converts to images internally)
- **Recommendation:** Use Gemini for PDF analysis

---

## Cost Considerations

### Vision API Costs
- **Gemini 2.0 Flash:** Free tier (rate limited)
- **Claude 3.5 Haiku:** ~$0.001 per image analysis (500 token limit)

### MOE Competition
All 6 models run in parallel, but only vision models process images:
- **Vision models:** Gemini, Claude (2/6 models)
- **Text-only models:** Mistral, DeepSeek, KAT-Coder, GPT-4o-mini (4/6 models)

Total cost per query with image: ~$0.002-0.003

---

## Troubleshooting

### "PDF not being read"
**Possible causes:**
1. **File too large:** Reduce PDF size to under 10 MB
2. **Base64 encoding issue:** Ensure proper data URL format (`data:application/pdf;base64,...`)
3. **Timeout:** Large PDFs may exceed Cloudflare Worker timeout (30s)

**Solutions:**
- Compress PDF before uploading
- Extract text from PDF and send as plain text
- Use Gemini (better PDF support than Claude)

### "Image not recognized"
**Possible causes:**
1. **Unsupported format:** Use JPEG, PNG, or WebP
2. **Corrupted base64:** Check data URL format
3. **Image too large:** Resize to under 5 MB

**Solutions:**
- Convert to JPEG format
- Resize image to 1920x1080 or smaller
- Check browser console for upload errors

### "Vision model not winning"
This is normal! The MOE system selects the best response based on:
- **Quality** (70% weight)
- **Speed** (10% weight)
- **Cost** (10% weight)
- **Preference** (10% weight)

If a text-only model provides a better response (based on Nash Equilibrium scoring), it will win even when an image is uploaded.

---

## Example Use Cases

### 1. Screenshot Analysis
**User:** "What's wrong with this error message?" [uploads screenshot]  
**Gemini/Claude:** Analyzes the screenshot and explains the error

### 2. Diagram Understanding
**User:** "Explain this architecture diagram" [uploads diagram]  
**Gemini/Claude:** Describes the components and relationships

### 3. PDF Document Analysis
**User:** "Summarize this research paper" [uploads PDF]  
**Gemini:** Extracts text and provides summary

### 4. Code Review from Screenshot
**User:** "Review this code" [uploads code screenshot]  
**Gemini/Claude:** Analyzes code and suggests improvements

### 5. Data Visualization
**User:** "What trends do you see?" [uploads chart]  
**Gemini/Claude:** Interprets the chart and explains trends

---

## Future Enhancements

### Planned Features
- [ ] Multi-page PDF support (process each page separately)
- [ ] OCR for scanned documents
- [ ] Image generation based on uploaded references
- [ ] Video frame analysis
- [ ] Audio transcription from video files

### Model Additions
- [ ] GPT-4 Vision (when cost-effective)
- [ ] LLaVA (open-source vision model)
- [ ] Gemini Pro Vision (higher quality)

---

## API Reference

### POST /upload
Uploads files and converts to base64 data URLs.

**Request:**
```
Content-Type: multipart/form-data
files: File[]
```

**Response:**
```json
{
  "success": true,
  "files": [
    {
      "name": "image.jpg",
      "type": "image/jpeg",
      "size": 123456,
      "data": "data:image/jpeg;base64,..."
    }
  ],
  "urls": ["data:image/jpeg;base64,..."]
}
```

### POST /moe-chat
Processes chat with optional file attachments.

**Request:**
```json
{
  "message": "What do you see?",
  "files": ["data:image/jpeg;base64,..."],
  "history": []
}
```

**Response:**
```json
{
  "message": "I see a cat sitting on a laptop...",
  "moeMetadata": {
    "winner": {
      "model": "google/gemini-2.0-flash-exp",
      "latency": 542,
      "tokens": 29,
      "cost": 0
    },
    "allModels": [...],
    "nashExplanation": "...",
    "totalLatency": 10596,
    "totalCost": 0.0000552
  },
  "status": "completed"
}
```

---

## Code References

### Key Files
- `/worker/src/gemini.ts` - Gemini vision implementation
- `/worker/src/claude-moe.ts` - Claude vision implementation
- `/worker/src/moe/endpoint.ts` - MOE pipeline with vision support
- `/worker/src/index.ts` - Upload and chat endpoints
- `/console/src/App.tsx` - Frontend file upload UI

### Functions
- `callGeminiWithVision()` - Processes images with Gemini
- `buildClaudeVisionContent()` - Formats images for Claude
- `queryGeminiForMOE()` - MOE wrapper for Gemini (with vision)
- `queryClaude()` - MOE wrapper for Claude (with vision)

---

**Status:** ✅ Fully implemented and deployed  
**Last Updated:** Dec 6, 2025  
**Deployment:** https://morgus-orchestrator.morgan-426.workers.dev
