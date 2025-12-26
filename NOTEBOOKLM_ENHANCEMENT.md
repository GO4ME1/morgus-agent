# NotebookLM Enhancement Plan

## Current State vs. Selenium MCP Server

### What We Have (Browserbase)
Our existing `/worker/src/tools/notebooklm-tool.ts`:
- ✅ Browserbase integration (cloud browser)
- ✅ Google session state restoration
- ✅ Basic chat interaction
- ✅ Source adding (URL, YouTube, text)
- ✅ Content generation (study guide, FAQ, timeline)
- ✅ Notebook data extraction

### What Selenium MCP Has (That We Don't)
From analyzing `khengyun/notebooklm-mcp`:

| Feature | Selenium MCP | Our Tool | Priority |
|---------|--------------|----------|----------|
| **Persistent Sessions** | ✅ Chrome profile persistence | ❌ Session state only | HIGH |
| **Streaming Response Detection** | ✅ Checks for loading indicators | ❌ Basic wait | HIGH |
| **Response Stability Checks** | ✅ Waits for stable content | ❌ Fixed timeout | HIGH |
| **Smart Response Cleaning** | ✅ Removes UI artifacts | ❌ Basic extraction | MEDIUM |
| **AI Response Indicators** | ✅ Detects AI vs user text | ❌ Gets everything | MEDIUM |
| **Multiple Selector Fallbacks** | ✅ 10+ fallback selectors | ✅ We have some | LOW |
| **Undetected ChromeDriver** | ✅ Anti-detection | ❌ Standard browser | LOW |

---

## Key Features to Add

### 1. Streaming Response Detection
**What it does:** Checks if NotebookLM is still generating content

```typescript
private async waitForStreamingComplete(): Promise<boolean> {
  const indicators = [
    "[class*='loading']",
    "[class*='typing']",
    "[class*='generating']",
    "[class*='spinner']",
    ".dots"
  ];
  
  for (const indicator of indicators) {
    const elements = await page.$$(indicator);
    for (const elem of elements) {
      if (await elem.isVisible()) return false;
    }
  }
  return true;
}
```

### 2. Response Stability Checks
**What it does:** Waits until content stops changing

```typescript
private async waitForStableResponse(maxWait: number = 60): Promise<string> {
  let lastResponse = "";
  let stableCount = 0;
  const requiredStableChecks = 3;
  
  while (stableCount < requiredStableChecks) {
    const current = await this.getCurrentResponse();
    if (current === lastResponse) {
      stableCount++;
    } else {
      stableCount = 0;
      lastResponse = current;
    }
    await sleep(1000);
  }
  
  return lastResponse;
}
```

### 3. Smart Response Cleaning
**What it does:** Removes UI artifacts and extracts only AI content

```typescript
private cleanResponse(text: string): string {
  // Remove UI artifacts
  const artifacts = ['copy_all', 'thumb_up', 'thumb_down', 'share'];
  for (const artifact of artifacts) {
    text = text.replace(new RegExp(artifact, 'gi'), '');
  }
  
  // Find AI response start
  const aiIndicators = [
    'Based on',
    'According to',
    "Here's",
    'Let me',
    'I can',
    'The answer'
  ];
  
  const lines = text.split('\n');
  for (let i = 0; i < lines.length; i++) {
    if (aiIndicators.some(ind => lines[i].includes(ind))) {
      return lines.slice(i).join('\n').trim();
    }
  }
  
  return text.trim();
}
```

### 4. Enhanced Selector Fallbacks
**Current:** 3-4 selectors
**Target:** 10+ selectors with priority ordering

```typescript
const chatSelectors = [
  "textarea[placeholder*='Ask']",
  "textarea[data-testid*='chat']",
  "textarea[aria-label*='message']",
  "[contenteditable='true'][role='textbox']",
  "input[type='text'][placeholder*='Ask']",
  "textarea:not([disabled])",
  "[data-testid='chat-input']",
  "[aria-label='Chat input']",
  ".chat-input textarea",
  "#chat-input"
];
```

---

## New Features to Add

### 5. Audio Overview Generation
**NotebookLM's killer feature:** AI-generated podcast-style audio overviews

```typescript
async generateAudioOverview(notebookId: string): Promise<{
  audioUrl: string;
  duration: number;
  transcript?: string;
}> {
  // Navigate to notebook
  // Click "Generate audio overview" button
  // Wait for generation (can take 2-5 minutes)
  // Extract audio URL
  // Download and return
}
```

### 6. Source Management
**Better source handling:**

```typescript
async addSource(source: {
  type: 'url' | 'youtube' | 'text' | 'pdf' | 'doc';
  content: string;
  title?: string;
}): Promise<string> {
  // Add source to notebook
  // Wait for processing
  // Return source ID
}

async listSources(notebookId: string): Promise<Source[]> {
  // Get all sources in notebook
}

async deleteSource(sourceId: string): Promise<void> {
  // Remove source from notebook
}
```

### 7. Export Capabilities
**Export generated content:**

```typescript
async exportContent(notebookId: string, format: 'pdf' | 'doc' | 'txt'): Promise<Buffer> {
  // Click export button
  // Select format
  // Download file
  // Return buffer
}
```

---

## Implementation Plan

### Phase 1: Core Improvements (2-3 hours)
1. ✅ Add streaming detection
2. ✅ Add response stability checks
3. ✅ Add smart response cleaning
4. ✅ Enhance selector fallbacks

### Phase 2: New Features (3-4 hours)
5. ✅ Audio overview generation
6. ✅ Enhanced source management
7. ✅ Export capabilities

### Phase 3: Testing & Polish (1-2 hours)
8. ✅ Test with real NotebookLM account
9. ✅ Update selectors if UI changed
10. ✅ Add error handling and retries

---

## Advantages of Our Approach

| Feature | Selenium MCP | Our Browserbase Approach |
|---------|--------------|--------------------------|
| **Infrastructure** | Self-hosted Chrome | ☁️ Cloud-managed |
| **Maintenance** | User manages ChromeDriver | ☁️ Browserbase handles it |
| **Scalability** | Limited by local resources | ☁️ Infinite scale |
| **Cost** | Free but requires server | 💰 Pay per use |
| **Anti-Detection** | Undetected ChromeDriver | ☁️ Residential proxies |
| **Session Persistence** | Local Chrome profile | 🔄 Need to implement |

**Our moat:** We can scale to thousands of concurrent NotebookLM sessions without managing infrastructure.

---

## Next Steps

1. **Implement Phase 1 improvements** (streaming, stability, cleaning)
2. **Test with your Google account** to verify selectors
3. **Add audio overview generation** (the killer feature)
4. **Create Morgy wrapper** - "NotebookLM Morgy" that uses these tools

---

## Morgy Integration

Once enhanced, create **"Prof. Hogsworth the Research Expert"** Morgy with NotebookLM powers:

```typescript
const profHogsworth = {
  name: "Prof. Hogsworth",
  domain: "research",
  description: "Academic research expert with NotebookLM integration",
  tools: [
    "notebooklm_create_notebook",
    "notebooklm_add_sources",
    "notebooklm_generate_study_guide",
    "notebooklm_generate_faq",
    "notebooklm_generate_audio_overview",
    "notebooklm_export_content"
  ],
  personality: "Academic, thorough, citation-focused",
  catchphrase: "@profhogsworth for deep research"
};
```

Users can say: *"@profhogsworth research this topic and create a study guide"*

Prof. Hogsworth will:
1. Create NotebookLM notebook
2. Add relevant sources (URLs, PDFs, videos)
3. Generate study guide, FAQ, timeline
4. Generate audio overview (podcast)
5. Export everything as PDF

**This is the killer feature combo!**
