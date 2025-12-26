# NotebookLM Integration Setup Guide

## Overview

Morgus can automate Google NotebookLM to create study guides, FAQs, timelines, infographics, and research reports. Since NotebookLM has no public API, we use **browser automation via Browserbase** with your Google account.

---

## Prerequisites

- ✅ Google account with NotebookLM access
- ✅ Browserbase account (you already have this)
- ✅ Cloudflare Worker access (for storing secrets)

---

## Setup Steps

### 1. Capture Your Google Session

You need to run this **once** on your local machine to capture your Google authentication:

```bash
cd /path/to/morgus-agent/worker
npm install
npx tsx src/tools/notebooklm-auth-setup.ts
```

This will:
1. Open a Browserbase session
2. Navigate to NotebookLM
3. Wait for you to log in manually
4. Capture your session cookies
5. Output a session token

### 2. Store Session Token in Cloudflare

Once you have the session token, store it as a secret:

```bash
export CLOUDFLARE_API_TOKEN="your-token"
cd /path/to/morgus-agent/worker
npx wrangler secret put GOOGLE_SESSION_STATE
# Paste the session token when prompted
```

### 3. Test the Integration

```bash
curl -X POST https://morgus-orchestrator.morgan-426.workers.dev/api/notebook \
  -H "Content-Type: application/json" \
  -d '{
    "purpose": "study_guide",
    "title": "Test Notebook",
    "sources": [
      {
        "type": "url",
        "content": "https://en.wikipedia.org/wiki/Artificial_intelligence"
      }
    ]
  }'
```

---

## How It Works

1. **User requests a notebook** (via chat or API)
2. **Morgus creates a Browserbase session**
3. **Navigates to NotebookLM** and restores your Google session
4. **Adds sources** (URLs, YouTube, text)
5. **Generates content** (study guide, FAQ, etc.)
6. **Extracts the result** (sections, summaries, assets)
7. **Stores in database** for future reference
8. **Closes browser session**

---

## Supported Features

| Feature | Status | Description |
|---------|--------|-------------|
| Study Guides | ✅ Ready | Structured learning materials |
| FAQs | ✅ Ready | Question/answer format |
| Timelines | ✅ Ready | Chronological event sequences |
| Briefing Docs | ✅ Ready | Executive summaries |
| Deep Research | ✅ Ready | Comprehensive analysis |
| Audio Overviews | 🔜 Coming | AI podcast generation |

---

## Usage in Chat

Users can request notebooks like this:

```
"Create a study guide about quantum computing using these sources: [URLs]"
"Make an FAQ from this YouTube video: [link]"
"Generate a timeline of the Roman Empire"
```

Morgus will automatically:
1. Detect it's a notebook request
2. Call the NotebookLM tool
3. Generate the content
4. Store it in the database
5. Show the user the result

---

## Pricing

- **Browserbase**: ~$0.01 per session (you have credits)
- **NotebookLM**: Free (using your Google account)
- **Total cost per notebook**: ~$0.01

---

## Troubleshooting

### "Session expired" error
Your Google session token expired. Re-run the auth setup:
```bash
npx tsx src/tools/notebooklm-auth-setup.ts
```

### "Selector not found" error
NotebookLM UI changed. Update selectors in `notebooklm-tool.ts`:
- Check current UI with browser inspector
- Update selectors in the tool code
- Redeploy worker

### "Rate limit exceeded"
NotebookLM has usage limits. Implement rate limiting:
- Track notebooks created per user per day
- Limit to 10-20 per day for free users
- Higher limits for paid tiers

---

## Security

- ✅ Session token stored in Cloudflare secrets (encrypted)
- ✅ Never exposed to frontend
- ✅ Only used server-side in worker
- ✅ Audit logging of all NotebookLM actions

---

## Next Steps

1. Run the auth setup script
2. Store the session token
3. Test with a simple notebook
4. Monitor usage and costs
5. Add rate limiting if needed

---

## Questions?

Check the full implementation in:
- `worker/src/tools/notebooklm-tool.ts` - Main tool
- `worker/src/tools/notebooklm-auth-setup.ts` - Auth setup
- `worker/src/tools/NOTEBOOKLM_README.md` - Technical docs
