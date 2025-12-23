# DPPM Planner Module

This module implements the **Decompose, Plan in Parallel, Merge (DPPM)** workflow with reflection mechanisms for Morgus V2.

## Overview

The DPPM workflow enables Morgus to handle complex, multi-step tasks more effectively by:

1. **Decomposing** complex goals into 3-7 manageable subtasks
2. **Planning in Parallel** by leveraging specialized Morgy expertise
3. **Merging** mini-plans into a coherent execution plan
4. **Pre-Flight Reflection** to identify and mitigate risks
5. **Executing** the plan step-by-step
6. **Post-Execution Reflection** to learn from successes and failures

## Modules

### `types.ts`
Type definitions for all DPPM components.

### `decompose.ts`
Task decomposition logic. Breaks down complex goals into subtasks and identifies dependencies.

**Key Functions:**
- `decompose(goal, llmCall, options)` - Decompose a goal into subtasks
- `getExecutionOrder(decomposed)` - Get execution order based on dependencies
- `getSubtasksByMorgy(decomposed)` - Group subtasks by assigned Morgy

### `parallel-plan.ts`
Parallel planning logic. Generates detailed mini-plans for each subtask simultaneously.

**Key Functions:**
- `planInParallel(subtasks, context, llmCall)` - Plan all subtasks in parallel
- `mergePlans(miniPlans, subtasks, goal, executionOrder)` - Merge mini-plans into unified plan
- `getAllRequiredTools(miniPlans)` - Get all tools needed across plans
- `getAllPotentialRisks(miniPlans)` - Get all risks identified across plans

### `reflection.ts`
Reflection mechanisms for continuous learning and improvement.

**Key Functions:**
- `preFlightReflection(plan, llmCall)` - "Devil's Advocate" risk analysis
- `postExecutionReflection(plan, result, llmCall)` - Learn from execution
- `calculateRiskScore(risk)` - Calculate risk priority
- `shouldSaveAsWorkflow(reflection)` - Determine if plan should be saved

### `experience-store.ts`
Database operations for storing and retrieving experiences and workflows.

**Key Functions:**
- `storeExperience(supabase, userId, plan, result, reflection)` - Save execution experience
- `retrieveRelevantExperiences(supabase, userId, goal)` - Find similar past experiences
- `saveWorkflow(supabase, userId, reflection, plan)` - Save successful plan as workflow
- `retrieveWorkflow(supabase, userId, goal)` - Find reusable workflow
- `updateWorkflowStats(supabase, workflowId, success)` - Update workflow success/failure count

### `dppm.ts`
Main orchestrator that integrates all modules.

**Key Functions:**
- `executeDPPM(goal, config)` - Execute phases 1-4 (decompose, plan, merge, pre-flight)
- `executeAndReflect(plan, executionResult, config)` - Execute phases 5-6 (execute, reflect)
- `executeDPPMWithMockExecution(goal, config)` - Full workflow with mocked execution (for testing)
- `getDPPMSummary(result)` - Generate human-readable summary

## Usage

### Basic Usage

```typescript
import { executeDPPM, executeAndReflect } from './planner/dppm';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// LLM call function
async function llmCall(prompt: string, morgy?: string): Promise<string> {
  // Your LLM integration here
  // Use different system prompts based on morgy type
  return await callLLM(prompt);
}

// Execute DPPM workflow
const result = await executeDPPM('Build a landing page for my startup', {
  userId: 'user-123',
  supabase,
  llmCall,
  maxSubtasks: 7,
  minSubtasks: 3
});

console.log(`Plan created with ${result.plan.executionOrder.length} phases`);
console.log(`Estimated duration: ${result.plan.totalEstimatedDuration} minutes`);

// Execute the plan (your execution logic here)
const executionResult = await executeThePlan(result.plan);

// Perform post-execution reflection
const finalResult = await executeAndReflect(result.plan, executionResult, {
  userId: 'user-123',
  supabase,
  llmCall
});

if (finalResult.workflowId) {
  console.log(`Workflow saved: ${finalResult.workflowId}`);
}
```

### Testing with Mock Execution

```typescript
import { executeDPPMWithMockExecution } from './planner/dppm';

const result = await executeDPPMWithMockExecution(
  'Build a landing page for my startup',
  {
    userId: 'user-123',
    supabase,
    llmCall
  }
);

console.log(getDPPMSummary(result));
```

### Retrieving Past Experiences

```typescript
import { retrieveRelevantExperiences, retrieveWorkflow } from './planner/experience-store';

// Get similar past experiences
const experiences = await retrieveRelevantExperiences(
  supabase,
  'user-123',
  'Build a landing page',
  5
);

// Get reusable workflow
const workflow = await retrieveWorkflow(
  supabase,
  'user-123',
  'Build a landing page'
);

if (workflow) {
  console.log(`Found workflow: ${workflow.title}`);
  console.log(`Success rate: ${workflow.successCount}/${workflow.successCount + workflow.failureCount}`);
}
```

## Database Schema

The DPPM module requires two tables in Supabase:

### `experiences` Table

```sql
CREATE TABLE experiences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  goal TEXT NOT NULL,
  plan JSONB NOT NULL,
  execution_result JSONB NOT NULL,
  reflection JSONB NOT NULL,
  success BOOLEAN NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_experiences_user_id ON experiences(user_id);
CREATE INDEX idx_experiences_success ON experiences(success);
CREATE INDEX idx_experiences_created_at ON experiences(created_at DESC);
```

### `workflows` Table

```sql
CREATE TABLE workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  title TEXT NOT NULL,
  description TEXT,
  pattern JSONB NOT NULL,
  success_count INT DEFAULT 0,
  failure_count INT DEFAULT 0,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_workflows_user_id ON workflows(user_id);
CREATE INDEX idx_workflows_success_count ON workflows(success_count DESC);
```

**Note:** These tables are already included in `worker/database/002_memory_system.sql`.

## Integration with Morgus

To integrate DPPM into the main Morgus agent:

1. **Import the DPPM orchestrator:**
   ```typescript
   import { executeDPPM, executeAndReflect } from './planner/dppm';
   ```

2. **Replace the current planner with DPPM:**
   ```typescript
   // Old way
   const plan = await createPlan(goal);
   
   // New way
   const dppmResult = await executeDPPM(goal, {
     userId,
     supabase,
     llmCall
   });
   const plan = dppmResult.plan;
   ```

3. **Execute the plan and reflect:**
   ```typescript
   const executionResult = await executeThePlan(plan);
   const finalResult = await executeAndReflect(plan, executionResult, {
     userId,
     supabase,
     llmCall
   });
   ```

## Benefits

1. **Better Plans**: Multiple Morgy perspectives lead to more robust solutions
2. **Faster Planning**: Parallel planning reduces time to first action
3. **Graceful Failure Recovery**: Pre-flight reflection catches issues early
4. **Continuous Learning**: Post-execution reflection builds knowledge over time
5. **Reusable Patterns**: Successful plans become workflows for future use
6. **Specialized Expertise**: Morgys focus on their strengths

## Next Steps

1. Apply the database migration (`worker/database/002_memory_system.sql`)
2. Integrate DPPM into the main Morgus orchestrator
3. Test with real tasks
4. Monitor and optimize based on real-world usage
5. Implement Morgy-specific system prompts for better specialization
6. Add vector embeddings for semantic experience search

## Testing

To test the DPPM module:

```bash
cd worker
npx tsx src/planner/test-dppm.ts
```

(Test file to be created)
