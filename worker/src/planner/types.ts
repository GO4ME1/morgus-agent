/**
 * Type definitions for the DPPM (Decompose, Plan in Parallel, Merge) workflow
 */

export type MorgyType = 'research' | 'dev' | 'bill' | 'sally' | 'main';
export type Complexity = 'low' | 'medium' | 'high';
export type Likelihood = 'low' | 'medium' | 'high';
export type Impact = 'low' | 'medium' | 'high';
export type Sentiment = 'positive' | 'negative' | 'neutral';
export type StepStatus = 'success' | 'failed' | 'skipped';
export type ExecutionStatus = 'in_progress' | 'completed' | 'failed';

export interface Subtask {
  id: string;
  title: string;
  description: string;
  assignedMorgy: MorgyType;
  estimatedComplexity: Complexity;
  dependencies: string[]; // IDs of subtasks that must complete first
}

export interface Dependency {
  subtaskId: string;
  dependsOn: string[];
}

export interface DecomposedTask {
  goal: string;
  subtasks: Subtask[];
  dependencies: Dependency[];
}

export interface PlanStep {
  id: string;
  action: string;
  tool?: string;
  expectedOutcome: string;
  fallbackStrategy?: string;
}

export interface AlternativeApproach {
  description: string;
  pros: string[];
  cons: string[];
}

export interface MiniPlan {
  subtaskId: string;
  morgy: string;
  approach: string;
  steps: PlanStep[];
  estimatedDuration: number; // minutes
  requiredTools: string[];
  potentialRisks: string[];
  alternativeApproaches?: AlternativeApproach[];
}

export interface ExecutionPhase {
  phaseNumber: number;
  subtasks: string[]; // Can be executed in parallel
  estimatedDuration: number;
  milestone: string;
}

export interface MergedPlan {
  goal: string;
  totalEstimatedDuration: number;
  executionOrder: ExecutionPhase[];
  criticalPath: string[]; // Subtask IDs that cannot be delayed
  parallelizable: string[][]; // Groups of subtasks that can run simultaneously
  miniPlans: MiniPlan[]; // Store the original mini-plans for reference
}

export interface Risk {
  id: string;
  description: string;
  likelihood: Likelihood;
  impact: Impact;
  affectedSteps: string[];
}

export interface Mitigation {
  riskId: string;
  strategy: string;
  fallbackAction: string;
}

export interface PreFlightReflection {
  risks: Risk[];
  mitigations: Mitigation[];
  updatedPlan: MergedPlan;
}

export interface StepResult {
  stepId: string;
  status: StepStatus;
  actualOutcome: string;
  duration: number;
  usedFallback: boolean;
}

export interface ExecutionError {
  stepId: string;
  error: string;
  recoveryAction: string;
}

export interface ExecutionResult {
  planId: string;
  status: ExecutionStatus;
  completedSteps: StepResult[];
  currentStep: string;
  errors: ExecutionError[];
}

export interface ReflectionNote {
  stepId: string;
  note: string;
  sentiment: Sentiment;
}

export interface PostExecutionReflection {
  planId: string;
  goal: string;
  overallSuccess: boolean;
  reflectionNotes: ReflectionNote[];
  lessonsLearned: string[];
  workflowCandidate: boolean;
}

export interface Experience {
  id: string;
  userId: string;
  goal: string;
  plan: MergedPlan;
  executionResult: ExecutionResult;
  reflection: PostExecutionReflection;
  success: boolean;
  createdAt: string;
}

export interface Workflow {
  id: string;
  userId: string;
  title: string;
  description: string;
  pattern: MergedPlan; // The plan template
  successCount: number;
  failureCount: number;
  lastUsedAt: string | null;
  createdAt: string;
}
