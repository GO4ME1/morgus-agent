# 🔄 Morgus Self-Improvement System Specification

## Overview

Based on OpenAI's self-evolving agents cookbook, this system enables Morgus to **learn from its mistakes** and **continuously improve** through automated feedback loops.

**Core Concept**: Morgus evaluates its own outputs, identifies failures, generates improved prompts, and automatically updates itself when performance exceeds thresholds.

---

## Architecture

### Self-Evolving Loop

```
┌─────────────────┐
│  Baseline Agent │
│  (Current Morgus)│
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Task Execution │
│  (User Query)   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Output         │
│  (Response)     │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────┐
│  Evaluation                 │
│  • Human Feedback (👍/👎)  │
│  • LLM-as-Judge             │
│  • Automated Metrics        │
└────────┬────────────────────┘
         │
         ▼
┌─────────────────┐
│  Score < 0.8?   │
└────────┬────────┘
         │
    Yes  │  No
         │  └──> Keep Current Agent
         ▼
┌─────────────────┐
│  Meta-Prompt    │
│  Generator      │
│  (Improve)      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  New Candidate  │
│  Prompts (3-5)  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Eval Suite     │
│  (Test Dataset) │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Best Score     │
│  > 0.8?         │
└────────┬────────┘
         │
    Yes  │  No (max 10 retries)
         │  └──> Alert Engineer
         ▼
┌─────────────────┐
│  Update Agent   │
│  (New Baseline) │
└─────────────────┘
```

---

## Components

### 1. Feedback Collection

**Human Feedback** (Production):
- Thumbs up/down on responses
- Qualitative comments
- Severity ratings (minor, major, critical)

**LLM-as-Judge** (Automated):
- Evaluate response quality (0-1 score)
- Check for hallucinations
- Verify task completion
- Assess tone/style

**Automated Metrics**:
- Response time
- Token usage
- Tool call success rate
- Error rate

### 2. Evaluation Database

```sql
CREATE TABLE agent_evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES tasks(id),
  agent_version VARCHAR(50) NOT NULL,
  input_text TEXT NOT NULL,
  output_text TEXT NOT NULL,
  score DECIMAL(3,2),  -- 0.00 to 1.00
  feedback_type VARCHAR(20),  -- 'human' | 'llm_judge' | 'automated'
  feedback_text TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_evaluations_score ON agent_evaluations(score);
CREATE INDEX idx_evaluations_version ON agent_evaluations(agent_version);
```

### 3. Prompt Versions

```sql
CREATE TABLE agent_prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version VARCHAR(50) UNIQUE NOT NULL,
  system_prompt TEXT NOT NULL,
  tool_instructions JSONB,
  avg_score DECIMAL(3,2),
  eval_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT false,
  parent_version VARCHAR(50),  -- Which version it was derived from
  improvement_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  activated_at TIMESTAMPTZ
);

CREATE INDEX idx_prompts_active ON agent_prompts(is_active);
CREATE INDEX idx_prompts_score ON agent_prompts(avg_score DESC);
```

### 4. Meta-Prompt Generator

**Input**: Failed evaluations + current prompt
**Output**: 3-5 candidate improved prompts

```typescript
async function generateImprovedPrompts(
  currentPrompt: string,
  failedEvals: Evaluation[],
  count: number = 3
): Promise<string[]> {
  const metaPrompt = `
You are a prompt engineering expert. Analyze these failures and generate ${count} improved versions of the system prompt.

CURRENT PROMPT:
${currentPrompt}

FAILURES:
${failedEvals.map(e => `
Input: ${e.input}
Output: ${e.output}
Feedback: ${e.feedback}
Score: ${e.score}
`).join('\n---\n')}

Generate ${count} improved prompts that address these specific failures while maintaining the agent's core capabilities.

Format each as:
## Candidate 1
[improved prompt]

## Candidate 2
[improved prompt]

etc.
`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'user', content: metaPrompt }]
  });

  return extractCandidates(response.choices[0].message.content);
}
```

### 5. Evaluation Suite

**Test Dataset**: 20-50 representative queries

```json
{
  "eval_cases": [
    {
      "id": "simple_math",
      "input": "What is 15 + 27?",
      "expected_behavior": "Calculate correctly and respond concisely",
      "grading_criteria": {
        "correctness": 1.0,
        "conciseness": 0.8,
        "tone": 0.9
      }
    },
    {
      "id": "web_search",
      "input": "What is the population of Boonville NY?",
      "expected_behavior": "Search web and provide current data with source",
      "grading_criteria": {
        "used_tool": 1.0,
        "cited_source": 1.0,
        "accuracy": 1.0
      }
    },
    {
      "id": "complex_reasoning",
      "input": "Plan a 3-day itinerary for Tokyo with budget constraints",
      "expected_behavior": "Multi-step planning with research and calculations",
      "grading_criteria": {
        "completeness": 1.0,
        "feasibility": 0.9,
        "budget_awareness": 1.0
      }
    }
  ]
}
```

### 6. Grading System

**LLM-as-Judge Prompt**:

```typescript
async function gradeResponse(
  input: string,
  output: string,
  criteria: GradingCriteria
): Promise<{ score: number; feedback: string }> {
  const prompt = `
You are evaluating an AI agent's response.

USER INPUT:
${input}

AGENT OUTPUT:
${output}

GRADING CRITERIA:
${JSON.stringify(criteria, null, 2)}

Evaluate the response on a scale of 0.0 to 1.0 for each criterion.
Provide an overall score (average) and specific feedback.

Format:
{
  "scores": {
    "criterion1": 0.8,
    "criterion2": 0.9
  },
  "overall_score": 0.85,
  "feedback": "Detailed explanation of strengths and weaknesses"
}
`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' }
  });

  return JSON.parse(response.choices[0].message.content);
}
```

---

## Implementation Phases

### Phase 1: Feedback Collection (Week 1)
- Add thumbs up/down buttons to UI
- Create evaluations table
- Log all responses with metadata
- Implement basic scoring

### Phase 2: LLM-as-Judge (Week 1-2)
- Build grading system
- Create eval test suite (20 cases)
- Automate scoring on test dataset
- Dashboard for viewing scores

### Phase 3: Meta-Prompt Generation (Week 2)
- Implement meta-prompt generator
- Test candidate prompt generation
- Manual review and selection

### Phase 4: Automated Loop (Week 3)
- Fully automated improvement cycle
- Threshold-based activation (score > 0.8)
- Version control for prompts
- Rollback capability

### Phase 5: Production Integration (Week 4)
- A/B testing framework
- Gradual rollout (10% → 50% → 100%)
- Monitoring and alerting
- Human-in-the-loop for critical changes

---

## Workflow Example

### Scenario: Morgus gives wrong answer

1. **User Query**: "What is the capital of Australia?"
2. **Morgus Response**: "Sydney" (WRONG - it's Canberra)
3. **User Feedback**: 👎 "That's incorrect, it's Canberra"

### Automated Improvement Cycle

```
Step 1: Log Evaluation
- Input: "What is the capital of Australia?"
- Output: "Sydney"
- Feedback: "That's incorrect, it's Canberra"
- Score: 0.0 (completely wrong)

Step 2: Check if improvement needed
- Current agent avg score: 0.75
- Target threshold: 0.8
- Decision: Yes, needs improvement

Step 3: Generate improved prompts
Meta-prompt analyzes failure:
- Issue: Agent didn't verify factual information
- Improvement: Add instruction to verify facts before responding

Candidate 1: "...Always verify factual claims using web search..."
Candidate 2: "...For factual questions, search for authoritative sources..."
Candidate 3: "...Cross-reference facts from multiple sources..."

Step 4: Evaluate candidates on test suite
- Candidate 1: 0.82 (BEST)
- Candidate 2: 0.79
- Candidate 3: 0.81

Step 5: Activate Candidate 1
- Save as version "v1.2.3"
- Mark as active
- Deploy to production
- Monitor for 24 hours

Step 6: Verify improvement
- Re-test: "What is the capital of Australia?"
- New response: "The capital of Australia is Canberra (verified via web search)"
- Score: 1.0 ✅
```

---

## Integration with Thoughts System

Each **Thought** can have its own:
- Evaluation history
- Prompt versions
- Improvement cycles
- Performance metrics

This enables **specialized optimization** per project type.

```sql
ALTER TABLE agent_prompts ADD COLUMN thought_id UUID REFERENCES thoughts(id);
ALTER TABLE agent_evaluations ADD COLUMN thought_id UUID REFERENCES thoughts(id);
```

---

## Integration with MOE

Self-improvement can work **per model** in the MOE:

```
┌─────────────┐
│  GPT-4o     │──> Self-improve GPT-4o prompts
├─────────────┤
│  Gemini     │──> Self-improve Gemini prompts
├─────────────┤
│  Claude     │──> Self-improve Claude prompts
└─────────────┘
       │
       ▼
┌─────────────┐
│  MOE Judge  │──> Self-improve judging criteria
└─────────────┘
```

Each model learns independently, and the MOE judge learns which model to trust for which tasks.

---

## Metrics & Monitoring

### Key Metrics

| Metric | Target | Alert |
|--------|--------|-------|
| Average Score | > 0.8 | < 0.7 |
| Improvement Rate | +5% per week | Negative |
| Eval Coverage | > 80% of queries | < 50% |
| False Positive Rate | < 5% | > 10% |
| Rollback Rate | < 2% | > 5% |

### Dashboard

```
┌────────────────────────────────────┐
│  Morgus Self-Improvement Dashboard │
├────────────────────────────────────┤
│  Current Version: v1.2.3           │
│  Average Score: 0.82 ↑             │
│  Evaluations: 1,247                │
│  Last Improvement: 2 days ago      │
├────────────────────────────────────┤
│  Score Trend:                      │
│  v1.0.0: 0.65                      │
│  v1.1.0: 0.72 (+7%)                │
│  v1.2.0: 0.78 (+6%)                │
│  v1.2.3: 0.82 (+4%) ← Current      │
├────────────────────────────────────┤
│  Top Failure Categories:           │
│  • Math calculations: 12%          │
│  • Date/time queries: 8%           │
│  • Multi-step reasoning: 6%        │
└────────────────────────────────────┘
```

---

## Safety & Guardrails

### Automatic Rollback Triggers

- Score drops > 10% after deployment
- Error rate increases > 2x
- User complaints > 5 in 1 hour
- Tool call failures > 20%

### Human Review Required

- Changes to core safety instructions
- Modifications to tool permissions
- Adjustments to user data handling
- Score improvements > 20% (too good to be true?)

### Rate Limiting

- Max 1 improvement per day
- Max 10 retries per improvement cycle
- Minimum 100 evaluations before improvement
- 24-hour monitoring period after activation

---

## Future Enhancements

1. **Reinforcement Learning** - Beyond prompt engineering
2. **Fine-tuning** - Create custom models from best prompts
3. **Multi-objective Optimization** - Balance speed, cost, quality
4. **Adversarial Testing** - Red team attacks to find weaknesses
5. **Transfer Learning** - Share improvements across Thoughts
6. **Ensemble Learning** - Combine multiple improved versions

---

## Success Criteria

| Milestone | Target | Timeline |
|-----------|--------|----------|
| Feedback Collection | 100 evaluations | Week 1 |
| LLM-as-Judge Working | 0.8 correlation with human | Week 2 |
| First Auto-Improvement | Score +5% | Week 3 |
| Production Deployment | 0 rollbacks | Week 4 |
| Continuous Improvement | +10% score in 30 days | Month 1 |

---

## Resources

- **OpenAI Cookbook**: https://cookbook.openai.com/examples/partners/self_evolving_agents/autonomous_agent_retraining
- **Evals Framework**: https://github.com/openai/evals
- **Prompt Engineering Guide**: https://platform.openai.com/docs/guides/prompt-engineering

---

**Status**: Ready for implementation  
**Priority**: High - Enables continuous improvement  
**Dependencies**: Thoughts system (for per-project optimization)  
**Estimated Time**: 4 weeks for full implementation
