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


---

## Priority 6: Add Live Model Leaderboard to UI (30-45 min)

### Concept
Display real-time model performance stats on the front page to show users which models are winning the MOE competition.

### Design Options

#### Option 1: Compact Header Bar (Minimal)
```
🏆 Leader: Gemini 2.0 (43.3%) | 2nd: Claude (38.2%) | 3rd: Mistral (35.1%)
```
- Always visible at top
- Updates after each query
- Minimal space usage

#### Option 2: Expandable Widget (Detailed)
```
📊 Model Leaderboard ▼
┌──────────────────────────────────────┐
│ 1. 🥇 Gemini 2.0 Flash  43.3% (150) │
│    ⚡ 542ms  💰 $0.00  📊 82.1/100   │
│ 2. 🥈 Claude Haiku      38.2% (150) │
│    ⚡ 976ms  💰 $0.05  📊 75.3/100   │
│ 3. 🥉 Mistral 7B        35.1% (150) │
│    ⚡ 381ms  💰 $0.00  📊 71.2/100   │
└──────────────────────────────────────┘
```
- Click to expand/collapse
- Shows detailed stats
- Positioned below header

#### Option 3: Live Stats Ticker (Minimal + Dynamic)
```
⚡ 1,247 battles | 🏆 Gemini leading | 💰 $0.12 total | ⏱️ 2.3s avg
```
- Scrolling ticker style
- Updates in real-time
- Very compact

#### Option 4: Dashboard Card (Prominent)
```
┌─────────────────────────────────────────┐
│  🏆 Model Performance Leaderboard       │
├─────────────────────────────────────────┤
│  Rank  Model           Win Rate  Battles│
│  🥇 1   Gemini 2.0      43.3%      150  │
│  🥈 2   Claude Haiku    38.2%      150  │
│  🥉 3   Mistral 7B      35.1%      150  │
│  4      GPT-4o-mini     32.5%      150  │
│  5      KAT-Coder       28.9%      150  │
│  6      DeepSeek        25.0%      150  │
│                                          │
│  [View Detailed Stats →]                │
└─────────────────────────────────────────┘
```
- Prominent placement on homepage
- Full leaderboard visible
- Link to detailed analytics

### Recommended: Hybrid Approach
1. **Compact ticker** at top (always visible)
2. **Expandable widget** in sidebar
3. **Full dashboard** on dedicated stats page

### Implementation

#### Step 1: Add Leaderboard Component
File: `/home/ubuntu/morgus-agent/console/src/components/ModelLeaderboard.tsx`

```typescript
import { useEffect, useState } from 'react';

interface ModelStats {
  model_name: string;
  win_rate: number;
  total_competitions: number;
  avg_score: number;
  avg_latency: number;
  rank: number;
}

export function ModelLeaderboard({ compact = false }) {
  const [stats, setStats] = useState<ModelStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
    const interval = setInterval(fetchLeaderboard, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  async function fetchLeaderboard() {
    try {
      const response = await fetch(
        'https://morgus-orchestrator.morgan-426.workers.dev/api/stats/leaderboard?limit=6'
      );
      const data = await response.json();
      setStats(data);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error);
    }
  }

  if (loading) return <div>Loading stats...</div>;

  if (compact) {
    // Compact ticker view
    const top3 = stats.slice(0, 3);
    return (
      <div className="leaderboard-ticker">
        🏆 Leader: {top3[0]?.model_name.split('/')[1]} ({top3[0]?.win_rate}%) 
        | 2nd: {top3[1]?.model_name.split('/')[1]} ({top3[1]?.win_rate}%)
        | 3rd: {top3[2]?.model_name.split('/')[1]} ({top3[2]?.win_rate}%)
      </div>
    );
  }

  // Full leaderboard view
  return (
    <div className="leaderboard-card">
      <h3>🏆 Model Performance Leaderboard</h3>
      <table>
        <thead>
          <tr>
            <th>Rank</th>
            <th>Model</th>
            <th>Win Rate</th>
            <th>Battles</th>
            <th>Avg Score</th>
          </tr>
        </thead>
        <tbody>
          {stats.map((model, idx) => (
            <tr key={model.model_name}>
              <td>
                {idx === 0 && '🥇'}
                {idx === 1 && '🥈'}
                {idx === 2 && '🥉'}
                {idx > 2 && model.rank}
              </td>
              <td>{model.model_name.split('/')[1]}</td>
              <td>{model.win_rate}%</td>
              <td>{model.total_competitions}</td>
              <td>{model.avg_score}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

#### Step 2: Add to App.tsx
```typescript
import { ModelLeaderboard } from './components/ModelLeaderboard';

// In the main layout:
<div className="app-header">
  <ModelLeaderboard compact={true} />
</div>

// In the sidebar or main content:
<ModelLeaderboard compact={false} />
```

#### Step 3: Add Styling
File: `/home/ubuntu/morgus-agent/console/src/index.css`

```css
.leaderboard-ticker {
  background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 8px 16px;
  font-size: 14px;
  text-align: center;
  font-weight: 500;
  animation: slideIn 0.5s ease-out;
}

.leaderboard-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
  margin: 20px 0;
}

.leaderboard-card h3 {
  margin: 0 0 16px 0;
  font-size: 18px;
  font-weight: 600;
}

.leaderboard-card table {
  width: 100%;
  border-collapse: collapse;
}

.leaderboard-card th {
  text-align: left;
  padding: 8px;
  border-bottom: 2px solid #e5e7eb;
  font-weight: 600;
  color: #6b7280;
  font-size: 12px;
  text-transform: uppercase;
}

.leaderboard-card td {
  padding: 12px 8px;
  border-bottom: 1px solid #f3f4f6;
}

.leaderboard-card tr:hover {
  background: #f9fafb;
}

@keyframes slideIn {
  from {
    transform: translateY(-20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}
```

### Features to Add

1. **Real-time Updates** - Refresh every 30 seconds
2. **Animations** - Smooth transitions when rankings change
3. **Tooltips** - Hover for detailed stats
4. **Click to Expand** - Show full stats for each model
5. **Trend Indicators** - ↑ ↓ arrows showing if rank improved/declined
6. **Time Filter** - Toggle between all-time, last 7 days, last 24 hours

### Advanced Features (Optional)

1. **Live Competition View**
   - Show current query being processed
   - Real-time scores as models respond
   - Animated "winner announcement"

2. **Model Comparison Tool**
   - Click two models to see head-to-head stats
   - Win rate when competing directly
   - Strengths/weaknesses analysis

3. **Performance Charts**
   - Line graph showing win rate over time
   - Bar chart comparing average scores
   - Cost vs performance scatter plot

4. **User Favorites**
   - Let users "favorite" models
   - Show how their favorites are performing
   - Get notifications when favorite wins

### Test Cases
1. Load page → Leaderboard appears with current stats
2. Wait 30s → Stats refresh automatically
3. Run a query → Leaderboard updates after response
4. Click model → Show detailed stats modal
5. Hover over rank → Show tooltip with trends

### Benefits
- **Transparency** - Users see which models perform best
- **Engagement** - Gamification keeps users interested
- **Trust** - Real data builds confidence in the system
- **Education** - Users learn about different AI models
- **Marketing** - Unique feature that competitors don't have

---

## Updated Success Criteria

By end of tomorrow's session:
- ✅ Upload screenshot/PDF and get actual analysis
- ✅ Ask "What time is it?" and get correct answer
- ✅ Ask "Search the web for X" and get current information
- ✅ Model stats tracking working (leaderboard shows data)
- ✅ No invalid model ID errors in logs
- ✅ **Live model leaderboard visible on front page** 🆕

---

## Updated Budget

Estimated credit usage:
- Vision/PDF fix: ~500 credits
- Web browsing: ~1,000 credits
- Stats migration: ~100 credits
- Date/time tool: ~200 credits
- **Leaderboard UI: ~500 credits** 🆕
- Total: ~2,500 credits

Leave buffer for debugging: ~1,000 credits
**Total budget: 3,500 credits**
