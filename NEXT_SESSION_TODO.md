# Next Session TODO - Dec 7, 2025

## Priority 1: Fix Vision/PDF Analysis (30-45 min)

### Problem
Files upload successfully to backend, but don't reach vision models due to:
1. **Frontend race condition** - `uploadedFiles` cleared before upload completes
2. **Missing Supabase env vars** - New deployments show blank page

### Solution

#### Step 1: Set Cloudflare Pages Environment Variables
```bash
# Go to Cloudflare Dashboard
# Pages → morgus-console → Settings → Environment Variables
# Add these variables for Production:

VITE_SUPABASE_URL=<your-supabase-url>
VITE_SUPABASE_ANON_KEY=<your-supabase-anon-key>
```

#### Step 2: Redeploy with Fix
The fix is already committed (commit 6d0371f):
- Changed `const files = uploadedFiles` to `const filesToUpload = [...uploadedFiles]`
- Creates copy before clearing UI state

```bash
cd /home/ubuntu/morgus-agent/console
pnpm run build
pnpm wrangler pages deploy dist --project-name=morgus-console
```

#### Step 3: Test
1. Upload screenshot + PDF
2. Check browser console for: `[FRONTEND] Sending to MOE with 2 files`
3. Check backend logs for: `[MOE-CHAT] Files received: 2`
4. Verify Gemini/Claude analyze the documents

---

## Priority 2: Enable Full Web Browsing (45-60 min)

### Problem
Autonomous agent says "I cannot surf the internet" even though it should have browser tools.

### Current State
- Agent has: `search_images`, `execute_code`, `generate_image`, `think`
- Agent missing: Browser tools, web search, date/time

### Solution

#### Add Browser Tools to Agent
File: `/home/ubuntu/morgus-agent/worker/src/agent.ts`

Add these tools to the agent's tool definitions:
1. **`get_current_time`** - Returns current date/time
2. **`web_search`** - Search the web (Tavily API)
3. **`navigate_to_url`** - Open a webpage
4. **`read_page_content`** - Extract text from current page
5. **`click_element`** - Click buttons/links
6. **`fill_form`** - Fill input fields
7. **`take_screenshot`** - Capture page screenshot

#### Implementation Plan

**Option A: Use E2B Browser (Recommended)**
E2B already supports browser automation. Enable it in the agent:

```typescript
// In agent.ts, add browser tools
const browserTools = [
  {
    type: "function",
    function: {
      name: "navigate_to_url",
      description: "Navigate to a URL and read the page content",
      parameters: {
        type: "object",
        properties: {
          url: { type: "string", description: "The URL to visit" }
        },
        required: ["url"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "web_search",
      description: "Search the web for current information",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "Search query" }
        },
        required: ["query"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_current_time",
      description: "Get the current date and time",
      parameters: { type: "object", properties: {} }
    }
  }
];
```

**Option B: Use Playwright in E2B**
More powerful but requires more setup:
- Install Playwright in E2B sandbox
- Create browser automation functions
- Pass to agent as tools

#### Test Cases
1. "What time is it?" → Should return current date/time
2. "What's the weather in Buffalo?" → Should search web and return answer
3. "Go to example.com and tell me what it says" → Should navigate and read page
4. "Find the latest news about AI" → Should search and summarize

---

## Priority 3: Run Model Stats Migration (10 min)

### Problem
Stats tracking is implemented but database tables don't exist yet.

### Solution
```bash
# Connect to Supabase and run:
psql -h <supabase-host> -U postgres -d postgres -f /home/ubuntu/morgus-agent/database/migrations/004_model_stats.sql

# Or use Supabase SQL Editor:
# 1. Go to Supabase Dashboard → SQL Editor
# 2. Copy contents of database/migrations/004_model_stats.sql
# 3. Run the SQL
```

### Verify
```sql
SELECT * FROM model_stats;
SELECT * FROM model_leaderboard;
```

### Test
After a few queries, check the leaderboard:
```bash
curl https://morgus-orchestrator.morgan-426.workers.dev/api/stats/leaderboard
```

---

## Priority 4: Add Date/Time Tool (Quick Win - 15 min)

### Implementation
File: `/home/ubuntu/morgus-agent/worker/src/agent.ts`

Add to tool definitions:
```typescript
{
  type: "function",
  function: {
    name: "get_current_time",
    description: "Get the current date, time, and timezone. Use this when the user asks about the current time, date, day of week, or any time-related queries.",
    parameters: {
      type: "object",
      properties: {
        timezone: {
          type: "string",
          description: "Optional timezone (e.g., 'America/New_York', 'UTC'). Defaults to UTC.",
          default: "UTC"
        }
      }
    }
  }
}
```

Add to tool execution:
```typescript
case 'get_current_time':
  const timezone = args.timezone || 'UTC';
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    dateStyle: 'full',
    timeStyle: 'long'
  });
  toolResult = formatter.format(now);
  break;
```

### Test
- "What time is it?"
- "What's today's date?"
- "What day of the week is it?"

---

## Priority 5: Fix OpenRouter Model IDs (Quick Fix - 10 min)

### Problem
Logs show errors for invalid model IDs:
- `google/gemma-3-27b:free` - Not valid
- `nvidia/nemotron-nano-12b-2-vl:free` - Not valid

### Solution
File: `/home/ubuntu/morgus-agent/worker/src/moe/endpoint.ts`

Replace with valid free models:
```typescript
const models = [
  'mistralai/mistral-7b-instruct:free',
  'meta-llama/llama-3.2-3b-instruct:free', // Replace gemma
  'google/gemma-2-9b-it:free', // Replace nemotron
];
```

Check valid models at: https://openrouter.ai/models?order=newest&supported_parameters=tools&max_price=0

---

## Optional: GitHub Integration (1-2 hours)

If time permits, add GitHub tools to the agent:
- Clone repositories
- Read files
- Create branches
- Commit changes
- Create pull requests

Uses GitHub CLI (`gh`) which is already authenticated.

---

## Session Summary Template

After completing the above, create a session summary with:
1. What was fixed
2. What was added
3. Test results
4. Next priorities
5. Known issues

---

## Quick Reference

### Useful Commands
```bash
# Deploy worker
cd /home/ubuntu/morgus-agent/worker && pnpm wrangler deploy

# Deploy frontend
cd /home/ubuntu/morgus-agent/console && pnpm run build && pnpm wrangler pages deploy dist

# View logs
cd /home/ubuntu/morgus-agent/worker && pnpm wrangler tail --format pretty

# Test API
curl https://morgus-orchestrator.morgan-426.workers.dev/api/stats/leaderboard
```

### Current Working URLs
- Frontend: https://e4339fb7.morgus-console.pages.dev (old, has race condition bug)
- Backend: https://morgus-orchestrator.morgan-426.workers.dev
- Main URL: https://morgus-console.pages.dev (needs env vars)

### Files to Edit
- `/home/ubuntu/morgus-agent/worker/src/agent.ts` - Add browser/time tools
- `/home/ubuntu/morgus-agent/worker/src/moe/endpoint.ts` - Fix model IDs
- `/home/ubuntu/morgus-agent/console/src/App.tsx` - Already fixed (race condition)

---

## Success Criteria

By end of session:
- ✅ Upload screenshot/PDF and get actual analysis (not generic response)
- ✅ Ask "What time is it?" and get correct answer
- ✅ Ask "Search the web for X" and get current information
- ✅ Model stats tracking working (leaderboard shows data)
- ✅ No invalid model ID errors in logs

---

## Budget Planning

Estimated credit usage:
- Vision/PDF fix: ~500 credits (testing)
- Web browsing: ~1,000 credits (implementation + testing)
- Stats migration: ~100 credits
- Date/time tool: ~200 credits
- Total: ~2,000 credits

Leave buffer for debugging: ~1,000 credits
**Total budget: 3,000 credits**
