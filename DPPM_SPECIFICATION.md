# DPPM Workflow Specification for Morgus V2

## Overview

The **Decompose, Plan in Parallel, Merge (DPPM)** workflow is an advanced planning mechanism that enables Morgus to handle complex, multi-step tasks more effectively. By breaking down tasks, exploring multiple solution approaches simultaneously, and combining the best elements, Morgus can generate higher-quality plans and adapt to failures more gracefully.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     DPPM WORKFLOW                            │
└─────────────────────────────────────────────────────────────┘

    User Goal
        │
        ▼
┌───────────────────┐
│   DECOMPOSE       │  Break down into 3-7 subtasks
│   Main Planner    │  Identify dependencies
└─────────┬─────────┘  Assign to best MOE model
          │
          ├──────────┬──────────┬──────────┐
          ▼          ▼          ▼          ▼
    ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐
    │ Subtask │ │ Subtask │ │ Subtask │ │ Subtask │
    │    1    │ │    2    │ │    3    │ │    4    │
    └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘
         │           │           │           │
         ▼           ▼           ▼           ▼
    ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐
    │  PLAN   │ │  PLAN   │ │  PLAN   │ │  PLAN   │
    │  (MOE)  │ │  (MOE)  │ │  (MOE)  │ │  (MOE)  │
    └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘
         │           │           │           │
         └───────────┴───────────┴───────────┘
                     │
                     ▼
            ┌───────────────────┐
            │      MERGE        │  Combine mini-plans
            │   Main Planner    │  Resolve conflicts
            └─────────┬─────────┘  Create final plan
                      │
                      ▼
            ┌───────────────────┐
            │   PRE-FLIGHT      │  "Devil's Advocate"
            │   REFLECTION      │  What could go wrong?
            └─────────┬─────────┘  Patch vulnerabilities
                      │
                      ▼
            ┌───────────────────┐
            │    EXECUTE        │  Run the plan
            └─────────┬─────────┘
                      │
                      ▼
            ┌───────────────────┐
            │  POST-EXECUTION   │  What worked/failed?
            │   REFLECTION      │  Store in experiences
            └───────────────────┘  Learn for next time
```

## Phase 1: Decompose

### Purpose
Break down a complex, high-level goal into 3-7 smaller, manageable subtasks that can be planned independently.

### Process
1. **Analyze the goal**: Understand the user's intent and desired outcome
2. **Identify major components**: Break down into logical chunks (e.g., "Build a landing page" → "Design UI", "Write copy", "Deploy")
3. **Determine dependencies**: Identify which subtasks must be completed before others
4. **Assign specialists**: Route each subtask to the appropriate Morgy based on expertise

### Output
```typescript
interface DecomposedTask {
  goal: string;
  subtasks: Subtask[];
  dependencies: Dependency[];
}

interface Subtask {
  id: string;
  title: string;
  description: string;
  assignedModel: 'gpt-4o-mini' | 'claude-3-haiku' | 'gemini-pro-1.5' | 'mistral-7b' | 'deepseek-r1t2' | 'kat-coder-pro' | 'auto';
  estimatedComplexity: 'low' | 'medium' | 'high';
  dependencies: string[]; // IDs of subtasks that must complete first
}

interface Dependency {
  subtaskId: string;
  dependsOn: string[];
}
```

### Example
**Goal:** "Build and launch a landing page for my AI startup"

**Decomposed Subtasks:**
1. **Research & Strategy** (Gemini Pro 1.5)
   - Analyze competitor landing pages
   - Identify key messaging points
   - Define target audience

2. **Design & Copywriting** (Claude 3 Haiku)
   - Create wireframe and design mockup
   - Write compelling copy
   - Design call-to-action elements

3. **Development** (KAT-Coder-Pro)
   - Build responsive HTML/CSS/JS
   - Integrate analytics
   - Optimize for performance

4. **Deployment & Distribution** (GPT-4o Mini)
   - Deploy to Cloudflare Pages
   - Set up custom domain
   - Submit to directories

**Dependencies:**
- Design depends on Research
- Development depends on Design
- Deployment depends on Development

## Phase 2: Plan in Parallel

### Purpose
Generate detailed mini-plans for each subtask simultaneously, leveraging specialized expertise from different Morgys.

### Process
1. **Distribute subtasks**: Send each subtask to its assigned Morgy
2. **Parallel planning**: Each Morgy independently creates a detailed plan for their subtask
3. **Explore alternatives**: Morgys can propose multiple approaches if beneficial
4. **Include resource estimates**: Time, tools, and dependencies

### Output
```typescript
interface MiniPlan {
  subtaskId: string;
  model: string;
  approach: string;
  steps: PlanStep[];
  estimatedDuration: number; // minutes
  requiredTools: string[];
  potentialRisks: string[];
  alternativeApproaches?: AlternativeApproach[];
}

interface PlanStep {
  id: string;
  action: string;
  tool?: string;
  expectedOutcome: string;
  fallbackStrategy?: string;
}

interface AlternativeApproach {
  description: string;
  pros: string[];
  cons: string[];
}
```

### Example
**Subtask:** "Development" (KAT-Coder-Pro)

**Mini-Plan:**
```json
{
  "subtaskId": "dev-001",
  "model": "kat-coder-pro",
  "approach": "Use Vite + React + TailwindCSS for fast development",
  "steps": [
    {
      "id": "dev-001-1",
      "action": "Initialize Vite project with React template",
      "tool": "shell",
      "expectedOutcome": "Project scaffolding created"
    },
    {
      "id": "dev-001-2",
      "action": "Install TailwindCSS and configure",
      "tool": "shell",
      "expectedOutcome": "Styling framework ready"
    },
    {
      "id": "dev-001-3",
      "action": "Build Hero section component",
      "tool": "file",
      "expectedOutcome": "Hero.tsx created with responsive design"
    }
  ],
  "estimatedDuration": 45,
  "requiredTools": ["shell", "file", "browser"],
  "potentialRisks": [
    "Design assets may not be ready",
    "TailwindCSS config may conflict with existing styles"
  ]
}
```

## Phase 3: Merge

### Purpose
Combine the mini-plans from all Morgys into a single, coherent, executable plan that respects dependencies and resolves conflicts.

### Process
1. **Collect mini-plans**: Gather all plans from the parallel planning phase
2. **Resolve conflicts**: If two Morgys propose conflicting approaches, choose the best one
3. **Respect dependencies**: Ensure subtasks are ordered correctly
4. **Optimize execution order**: Parallelize independent tasks where possible
5. **Create unified timeline**: Estimate total duration and milestones

### Output
```typescript
interface MergedPlan {
  goal: string;
  totalEstimatedDuration: number;
  executionOrder: ExecutionPhase[];
  criticalPath: string[]; // Subtask IDs that cannot be delayed
  parallelizable: string[][]; // Groups of subtasks that can run simultaneously
}

interface ExecutionPhase {
  phaseNumber: number;
  subtasks: string[]; // Can be executed in parallel
  estimatedDuration: number;
  milestone: string;
}
```

### Example
**Merged Plan for Landing Page:**
```json
{
  "goal": "Build and launch a landing page for my AI startup",
  "totalEstimatedDuration": 120,
  "executionOrder": [
    {
      "phaseNumber": 1,
      "subtasks": ["research-001"],
      "estimatedDuration": 30,
      "milestone": "Research complete"
    },
    {
      "phaseNumber": 2,
      "subtasks": ["design-001"],
      "estimatedDuration": 40,
      "milestone": "Design and copy ready"
    },
    {
      "phaseNumber": 3,
      "subtasks": ["dev-001"],
      "estimatedDuration": 45,
      "milestone": "Development complete"
    },
    {
      "phaseNumber": 4,
      "subtasks": ["deploy-001"],
      "estimatedDuration": 15,
      "milestone": "Deployed and live"
    }
  ],
  "criticalPath": ["research-001", "design-001", "dev-001", "deploy-001"]
}
```

## Phase 4: Pre-Flight Reflection ("Devil's Advocate")

### Purpose
Before executing the plan, proactively identify potential issues and patch the plan to mitigate risks.

### Process
1. **Generate "What could go wrong?" list**: Analyze each step for potential failures
2. **Assess likelihood and impact**: Prioritize risks
3. **Create mitigation strategies**: Add fallback steps or alternative approaches
4. **Update the plan**: Inject defensive measures

### Output
```typescript
interface PreFlightReflection {
  risks: Risk[];
  mitigations: Mitigation[];
  updatedPlan: MergedPlan;
}

interface Risk {
  id: string;
  description: string;
  likelihood: 'low' | 'medium' | 'high';
  impact: 'low' | 'medium' | 'high';
  affectedSteps: string[];
}

interface Mitigation {
  riskId: string;
  strategy: string;
  fallbackAction: string;
}
```

### Example
**Risks Identified:**
1. **Design assets may not match development expectations**
   - Likelihood: Medium
   - Impact: High
   - Mitigation: Add a design review step before development starts

2. **Deployment may fail due to DNS configuration**
   - Likelihood: Low
   - Impact: Medium
   - Mitigation: Add DNS verification step and fallback to subdomain

## Phase 5: Execute

### Purpose
Execute the plan step-by-step, monitoring progress and adapting to failures.

### Process
1. **Execute in order**: Follow the execution phases from the merged plan
2. **Monitor outcomes**: Check if each step achieves its expected outcome
3. **Trigger fallbacks**: If a step fails, use the fallback strategy
4. **Update user**: Provide progress updates at each milestone

### Output
```typescript
interface ExecutionResult {
  planId: string;
  status: 'in_progress' | 'completed' | 'failed';
  completedSteps: StepResult[];
  currentStep: string;
  errors: ExecutionError[];
}

interface StepResult {
  stepId: string;
  status: 'success' | 'failed' | 'skipped';
  actualOutcome: string;
  duration: number;
  usedFallback: boolean;
}

interface ExecutionError {
  stepId: string;
  error: string;
  recoveryAction: string;
}
```

## Phase 6: Post-Execution Reflection

### Purpose
After execution, capture what worked, what failed, and why. Store this knowledge for future tasks.

### Process
1. **Analyze outcomes**: Compare expected vs. actual results
2. **Identify patterns**: What strategies worked well? What failed?
3. **Write reflection notes**: 1-3 sentences per major step or phase
4. **Store in experiences table**: Save to Supabase for future retrieval
5. **Update workflow library**: If the plan was successful, save it as a reusable workflow

### Output
```typescript
interface PostExecutionReflection {
  planId: string;
  goal: string;
  overallSuccess: boolean;
  reflectionNotes: ReflectionNote[];
  lessonsLearned: string[];
  workflowCandidate: boolean;
}

interface ReflectionNote {
  stepId: string;
  note: string;
  sentiment: 'positive' | 'negative' | 'neutral';
}
```

### Example
**Reflection Notes:**
1. "Research phase went smoothly. Competitor analysis provided clear differentiation points."
2. "Design phase took longer than expected due to multiple copy revisions. Should allocate more time for copywriting in future."
3. "Development was fast thanks to Vite + React scaffolding. TailwindCSS made styling trivial."
4. "Deployment succeeded on first try. DNS configuration was straightforward."

**Lessons Learned:**
- "Allocate 50% more time for copywriting tasks"
- "Vite + React + TailwindCSS is a winning stack for landing pages"
- "Always verify DNS configuration before announcing launch"

**Workflow Candidate:** Yes → Save as "Build and Launch Landing Page" workflow

## Database Schema

### `experiences` Table
Stores reflection notes and outcomes from past tasks.

```sql
CREATE TABLE experiences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  goal TEXT NOT NULL,
  plan JSONB NOT NULL, -- The merged plan
  execution_result JSONB NOT NULL, -- ExecutionResult
  reflection JSONB NOT NULL, -- PostExecutionReflection
  success BOOLEAN NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### `workflows` Table
Stores reusable procedures that have been successful.

```sql
CREATE TABLE workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  title TEXT NOT NULL,
  description TEXT,
  pattern JSONB NOT NULL, -- The plan template
  success_count INT DEFAULT 0,
  failure_count INT DEFAULT 0,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Integration with Morgus

### 1. Planner Module
**File:** `worker/src/planner/### `dppm.ts`

Implements the DPPM workflow:
- `decompose(goal: string, llmCall, options)` - Decompose a goal into subtasks
- `planInParallel(subtasks, context, llmCall)` - Plan all subtasks in parallel
- `mergePlans(miniPlans, subtasks, goal, executionOrder)` - Merge mini-plans into unified plan
- `preFlightReflection(plan, llmCall)` - "Devil's Advocate" risk analysis
- `postExecutionReflection(plan, result, llmCall)` - Learn from execution ### MOE Router
**File:** `worker/src/moe/service.ts`

Routes subtasks to appropriate models:
- `decompose` function assigns the best model for each subtask
- `planInParallel` calls the assigned model for planning
### 3. Experience Store
**File:** `worker/src/memory/experience-store.ts`

Manages experiences and workflows:
- `storeExperience(reflection: PostExecutionReflection): void`
- `retrieveRelevantExperiences(goal: string): Experience[]`
- `saveWorkflow(reflection: PostExecutionReflection): void`
- `retrieveWorkflow(goal: string): Workflow | null`

## Benefits of DPPM

1. **Better Plans**: Multiple model perspectives lead to more robust solutions
2. **Faster Planning**: Parallel planning reduces time to first action
3. **Graceful Failure Recovery**: Pre-flight reflection catches issues early
4. **Continuous Learning**: Post-execution reflection builds knowledge over time
5. **Reusable Patterns**: Successful plans become workflows for future use
6. **Specialized Expertise**: MOE models focus on their strengths

## Next Steps

1. Implement the planner module with DPPM workflow
2. Create the Morgy router for task delegation
3. Build the experience store for reflection storage
4. Integrate with the existing Morgus agent
5. Test with complex multi-step tasks
6. Monitor and optimize based on real-world usage
