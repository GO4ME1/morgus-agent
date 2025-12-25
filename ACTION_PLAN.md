# Morgus Action Plan

**Date:** December 24, 2025  
**Goal:** Transform Morgus from "advanced agent stack" to "transparent, self-hostable Manus"

---

## Priority 1: Deploy What's Ready (30 minutes total)

These items are code-complete and just need deployment. This unblocks monetization and security.

### 1.1 Billing System Deployment (20 min)

| Step | Action | Time |
| :--- | :--- | :---: |
| 1 | Apply SQL migration to Supabase | 5 min |
| 2 | Configure Stripe webhook | 5 min |
| 3 | Set environment variables | 2 min |
| 4 | Deploy worker | 3 min |
| 5 | Test billing flow | 5 min |

**Files:** `worker/migrations/001_billing_enforcement.sql`, `DEPLOYMENT_HANDOFF.md`

### 1.2 Sandbox Hardening Deployment (10 min)

| Step | Action | Time |
| :--- | :--- | :---: |
| 1 | Generate admin token | 1 min |
| 2 | Add `ADMIN_API_TOKEN` to wrangler.toml | 1 min |
| 3 | Deploy worker | 3 min |
| 4 | Test monitoring API | 5 min |

**Files:** `SANDBOX_SETUP.md`, `worker/src/sandbox/hardening.ts`

---

## Priority 2: Formalize Morgys (1-2 days)

Make the Morgys first-class citizens with a proper interface and registry.

### 2.1 Create Morgy Interface

```typescript
interface Morgy {
  id: string;
  name: string;
  role: string;
  personality: string;
  tools: string[];
  memoryAccess: 'none' | 'read' | 'write';
  successCriteria: string[];
  level: number;
  xp: number;
}
```

### 2.2 Create Morgy Registry

- Central registry of all available Morgys
- Ability to add/remove Morgys dynamically
- Morgy discovery for task assignment

### 2.3 Update Console UI

- Show Morgy status (idle, working, completed)
- Display which Morgy is handling which subtask
- Morgy leveling and XP visualization

---

## Priority 3: Introduce Morgus Prime (3-5 days)

Create the executive agent that coordinates all Morgys.

### 3.1 Task Decomposition

Morgus Prime breaks high-level goals into subtasks:

```json
{
  "goal": "Research competitors and create a comparison report",
  "subtasks": [
    {"id": 1, "description": "Search for competitor information", "assignedTo": "Prof. Hogsworth"},
    {"id": 2, "description": "Analyze market positioning", "assignedTo": "Bill"},
    {"id": 3, "description": "Create promotional summary", "assignedTo": "Sally"}
  ]
}
```

### 3.2 Assignment & Monitoring

- Assign subtasks to appropriate Morgys based on their roles
- Monitor progress and status
- Handle failures and reassignment

### 3.3 Reflection Loop

After each action:
- "Did this move us closer to the goal?"
- "Should we continue, retry, or replan?"
- Store lessons learned for future tasks

---

## Priority 4: Shared World State (1 week)

Create a central state that all agents can read/write.

### 4.1 Task Graph

```json
{
  "taskId": "abc123",
  "goal": "...",
  "status": "in_progress",
  "subtasks": [
    {"id": 1, "status": "completed", "result": "..."},
    {"id": 2, "status": "in_progress", "agent": "Bill"},
    {"id": 3, "status": "blocked", "blockedBy": [2]}
  ],
  "artifacts": [],
  "errors": [],
  "reflections": []
}
```

### 4.2 Agent Status

- Which agent is doing what
- Current progress percentage
- Estimated time remaining

### 4.3 Failure Tracking

- What failed and why
- Retry count
- Alternative approaches tried

---

## Priority 5: Safety & Content Filtering (3-5 days)

Prevent harmful content generation.

### 5.1 Input Filtering

- Block harmful prompts
- Detect jailbreak attempts
- Rate limit suspicious users

### 5.2 Output Filtering

- Scan generated content for harmful material
- Block code that could be malicious
- Validate artifacts before delivery

### 5.3 Audit Logging

- Log all inputs and outputs
- Flag suspicious activity
- Enable manual review

---

## Priority 6: Observability (1 week)

Make Morgus inspectable and debuggable.

### 6.1 Run Traces

- Unique run ID for each task
- Step-by-step event stream
- Token and cost tracking

### 6.2 Tool Invocation Logs

- What tool was called
- Input parameters
- Output results
- Latency

### 6.3 Dashboard

- Real-time task monitoring
- Historical performance
- Cost analysis

---

## Priority 7: Killer Demos (Ongoing)

Create 3 polished demos that showcase Morgus capabilities.

### Demo 1: Research & Report

"Morgus researches a company and creates a competitive analysis report"

- Uses Prof. Hogsworth for research
- Uses Bill for market analysis
- Produces a polished PDF report

### Demo 2: Web Automation

"Morgus navigates a website and fills out a form"

- Uses browser automation with live view
- Shows visual feedback
- Handles errors gracefully

### Demo 3: Code & Deploy

"Morgus builds a simple website and deploys it to Cloudflare"

- Uses code execution sandbox
- Uses GitHub integration
- Deploys to Cloudflare Pages

---

## Timeline Summary

| Phase | Duration | Outcome |
| :--- | :---: | :--- |
| Deploy Ready Items | 30 min | Billing + Security live |
| Formalize Morgys | 1-2 days | First-class agent system |
| Morgus Prime | 3-5 days | Executive coordination |
| Shared World State | 1 week | Unified task tracking |
| Safety Filtering | 3-5 days | Content protection |
| Observability | 1 week | Full tracing |
| Killer Demos | Ongoing | Market validation |

---

## Success Metrics

1. **Billing Active:** Users can purchase subscriptions
2. **Sandbox Secure:** No runaway processes or resource exhaustion
3. **Morgys Visible:** Users can see which Morgy is working
4. **Tasks Decomposed:** Complex goals broken into subtasks
5. **Failures Handled:** Automatic retry and replan
6. **Content Safe:** No harmful outputs
7. **Fully Observable:** Every action logged and traceable

---

## What I Can Do Right Now

1. **Deploy billing system** - If you sign into Supabase, I can guide you through the migration
2. **Deploy sandbox hardening** - Set the admin token and deploy
3. **Start building Morgy interface** - Create the TypeScript interfaces and registry
4. **Create demo workflows** - Build the 3 killer demos
5. **Implement safety filtering** - Start the content filtering system

**Which priority would you like to tackle first?**
