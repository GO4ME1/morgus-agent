# Browser Automation Fix - BrowserBase Integration

**Date:** December 11, 2025  
**Issue:** "Too Many Requests" error on first browser use

---

## 🐛 The Problem

**Root Cause:** The BrowserBase integration is fundamentally broken.

### What's Wrong:

1. **Wrong API approach**: Code tries to use REST endpoints that don't exist
   - ❌ `POST /sessions/{id}/actions` - **Doesn't exist**
   - ✅ `POST /sessions` - Creates session (this works)

2. **Missing Playwright connection**: BrowserBase requires:
   - Create session via API → Get WebSocket URL
   - Connect via Playwright/Puppeteer → Control browser
   - Send commands via Playwright API → Not REST

3. **Runtime incompatibility**: 
   - Playwright needs Node.js runtime
   - Cloudflare Workers = V8 isolates (no Node.js)
   - **Can't run Playwright in Workers!**

---

## ✅ The Solution

**Move browser automation to Fly.io service** (which has Node.js)

### Architecture:

```
User → Morgus Worker → Fly.io Service → BrowserBase
                         ↓
                    Playwright/Puppeteer
                         ↓
                    Browser Actions
```

### Implementation Plan:

1. **Add `/browse` endpoint to Fly.io service**
2. **Install Playwright** in Dockerfile
3. **Implement BrowserBase connection** with Playwright
4. **Update Worker tool** to call Fly.io `/browse` endpoint

---

## 🔧 How It Should Work

### Step 1: Create Session
```bash
curl -X POST https://api.browserbase.com/v1/sessions \
  -H "x-bb-api-key: $API_KEY" \
  -d '{"projectId": "$PROJECT_ID"}'
```

Response:
```json
{
  "id": "session_123",
  "connectUrl": "wss://connect.browserbase.com/..."
}
```

### Step 2: Connect with Playwright
```javascript
const { chromium } = require('playwright');
const browser = await chromium.connectOverCDP(connectUrl);
const page = await browser.newPage();
```

### Step 3: Control Browser
```javascript
await page.goto('https://example.com');
await page.click('button');
const content = await page.content();
```

---

## 📦 What Needs to Be Done

### 1. Update Fly.io Dockerfile
```dockerfile
# Add Playwright
RUN pip3 install --break-system-packages playwright
RUN playwright install chromium
```

### 2. Add /browse Endpoint
```javascript
app.post('/browse', async (req, res) => {
  const { action, url, selector, text } = req.body;
  
  // Create BrowserBase session
  const session = await createSession();
  
  // Connect with Playwright
  const browser = await chromium.connectOverCDP(session.connectUrl);
  const page = await browser.newPage();
  
  // Execute action
  switch (action) {
    case 'navigate':
      await page.goto(url);
      break;
    case 'click':
      await page.click(selector);
      break;
    case 'type':
      await page.fill(selector, text);
      break;
    case 'screenshot':
      return await page.screenshot();
    case 'get_content':
      return await page.content();
  }
  
  await browser.close();
});
```

### 3. Update Worker Tool
```typescript
execute: async (args, env) => {
  const response = await fetch('https://morgus-deploy.fly.dev/browse', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: args.action,
      url: args.url,
      selector: args.selector,
      text: args.text,
      apiKey: env.BROWSERBASE_API_KEY,
      projectId: env.BROWSERBASE_PROJECT_ID
    })
  });
  
  return await response.json();
}
```

---

## 🎯 Alternative: Simpler Solution

**Use a different browser service that has HTTP API:**

### Option A: ScrapingBee
- ✅ Simple HTTP API
- ✅ JavaScript rendering
- ✅ No Playwright needed
- ❌ $49/month

### Option B: Browserless.io
- ✅ HTTP API for browser control
- ✅ Playwright compatible
- ✅ $20/month
- ✅ Easier integration

### Option C: Keep BrowserBase, Fix Integration
- ✅ Already have credentials
- ✅ Good pricing
- ❌ Requires Playwright (complex)
- ❌ Need Fly.io service update

---

## 💡 Recommendation

**Implement browser automation in Fly.io service** with BrowserBase + Playwright.

**Why:**
1. Already have BrowserBase credentials
2. Fly.io service already exists
3. Most flexible solution
4. Can add more browser features later

**Timeline:**
- Add Playwright to Dockerfile: 5 min
- Implement /browse endpoint: 15 min
- Update Worker tool: 5 min
- Test and deploy: 10 min
- **Total: ~35 minutes**

---

## 🚀 Next Steps

1. Update Fly.io Dockerfile with Playwright
2. Implement /browse endpoint
3. Update Worker browse_web tool
4. Test with simple navigation
5. Deploy and verify

---

**Status:** 🔴 **BROKEN** (needs implementation)

**Current Error:** "Too Many Requests" (misleading - actually wrong API)

**Real Issue:** Using non-existent REST endpoints instead of Playwright

---

*Analysis completed: December 11, 2025*  
*Awaiting implementation decision*
