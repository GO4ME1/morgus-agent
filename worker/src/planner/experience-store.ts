/**
 * Experience Store Module
 * 
 * Manages storage and retrieval of experiences and workflows in Supabase.
 * Enables Morgus to learn from past executions and reuse successful patterns.
 */

import type {
  Experience,
  Workflow,
  MergedPlan,
  ExecutionResult,
  PostExecutionReflection
} from './types';

export interface SupabaseClient {
  from: (table: string) => any;
}

/**
 * Store an experience in the database
 */
export async function storeExperience(
  supabase: SupabaseClient,
  userId: string,
  plan: MergedPlan,
  result: ExecutionResult,
  reflection: PostExecutionReflection
): Promise<string> {
  const { data, error } = await supabase
    .from('experiences')
    .insert({
      user_id: userId,
      goal: plan.goal,
      plan: plan,
      execution_result: result,
      reflection: reflection,
      success: reflection.overallSuccess
    })
    .select('id')
    .single();
  
  if (error) {
    throw new Error(`Failed to store experience: ${error.message}`);
  }
  
  return data.id;
}

/**
 * Retrieve relevant experiences for a goal
 */
export async function retrieveRelevantExperiences(
  supabase: SupabaseClient,
  userId: string,
  goal: string,
  limit: number = 5
): Promise<Experience[]> {
  // For now, use simple text matching
  // In the future, this could use vector embeddings for semantic search
  const { data, error } = await supabase
    .from('experiences')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit * 2); // Get more to filter
  
  if (error) {
    throw new Error(`Failed to retrieve experiences: ${error.message}`);
  }
  
  // Filter by goal similarity (simple keyword matching for now)
  const goalKeywords = extractKeywords(goal);
  const scored = data.map((exp: any) => {
    const expKeywords = extractKeywords(exp.goal);
    const similarity = calculateSimilarity(goalKeywords, expKeywords);
    return { experience: exp, similarity };
  });
  
  // Sort by similarity and take top N
  scored.sort((a, b) => b.similarity - a.similarity);
  return scored.slice(0, limit).map(s => s.experience);
}

/**
 * Save a successful plan as a reusable workflow
 */
export async function saveWorkflow(
  supabase: SupabaseClient,
  userId: string,
  reflection: PostExecutionReflection,
  plan: MergedPlan
): Promise<string> {
  const title = generateWorkflowTitle(plan.goal);
  const description = generateWorkflowDescription(reflection);
  
  const { data, error } = await supabase
    .from('workflows')
    .insert({
      user_id: userId,
      title,
      description,
      pattern: plan,
      success_count: 1,
      failure_count: 0
    })
    .select('id')
    .single();
  
  if (error) {
    throw new Error(`Failed to save workflow: ${error.message}`);
  }
  
  return data.id;
}

/**
 * Retrieve a workflow that matches the goal
 */
export async function retrieveWorkflow(
  supabase: SupabaseClient,
  userId: string,
  goal: string
): Promise<Workflow | null> {
  const { data, error } = await supabase
    .from('workflows')
    .select('*')
    .eq('user_id', userId)
    .order('success_count', { ascending: false })
    .limit(10);
  
  if (error) {
    throw new Error(`Failed to retrieve workflows: ${error.message}`);
  }
  
  if (!data || data.length === 0) {
    return null;
  }
  
  // Find the best matching workflow
  const goalKeywords = extractKeywords(goal);
  let bestMatch: any = null;
  let bestSimilarity = 0;
  
  for (const workflow of data) {
    const workflowKeywords = extractKeywords(workflow.title + ' ' + workflow.description);
    const similarity = calculateSimilarity(goalKeywords, workflowKeywords);
    
    if (similarity > bestSimilarity) {
      bestSimilarity = similarity;
      bestMatch = workflow;
    }
  }
  
  // Only return if similarity is above threshold
  if (bestSimilarity < 0.3) {
    return null;
  }
  
  return bestMatch;
}

/**
 * Update workflow success/failure count
 */
export async function updateWorkflowStats(
  supabase: SupabaseClient,
  workflowId: string,
  success: boolean
): Promise<void> {
  const field = success ? 'success_count' : 'failure_count';
  
  const { error } = await supabase
    .from('workflows')
    .update({
      [field]: supabase.raw(`${field} + 1`),
      last_used_at: new Date().toISOString()
    })
    .eq('id', workflowId);
  
  if (error) {
    throw new Error(`Failed to update workflow stats: ${error.message}`);
  }
}

/**
 * Get all workflows for a user
 */
export async function getAllWorkflows(
  supabase: SupabaseClient,
  userId: string
): Promise<Workflow[]> {
  const { data, error } = await supabase
    .from('workflows')
    .select('*')
    .eq('user_id', userId)
    .order('success_count', { ascending: false });
  
  if (error) {
    throw new Error(`Failed to get workflows: ${error.message}`);
  }
  
  return data || [];
}

/**
 * Get successful experiences for learning
 */
export async function getSuccessfulExperiences(
  supabase: SupabaseClient,
  userId: string,
  limit: number = 10
): Promise<Experience[]> {
  const { data, error } = await supabase
    .from('experiences')
    .select('*')
    .eq('user_id', userId)
    .eq('success', true)
    .order('created_at', { ascending: false })
    .limit(limit);
  
  if (error) {
    throw new Error(`Failed to get successful experiences: ${error.message}`);
  }
  
  return data || [];
}

/**
 * Get failed experiences for learning from mistakes
 */
export async function getFailedExperiences(
  supabase: SupabaseClient,
  userId: string,
  limit: number = 10
): Promise<Experience[]> {
  const { data, error } = await supabase
    .from('experiences')
    .select('*')
    .eq('user_id', userId)
    .eq('success', false)
    .order('created_at', { ascending: false })
    .limit(limit);
  
  if (error) {
    throw new Error(`Failed to get failed experiences: ${error.message}`);
  }
  
  return data || [];
}

// Helper functions

/**
 * Extract keywords from a text string
 */
function extractKeywords(text: string): Set<string> {
  const stopWords = new Set(['a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can']);
  
  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2 && !stopWords.has(word));
  
  return new Set(words);
}

/**
 * Calculate similarity between two keyword sets (Jaccard similarity)
 */
function calculateSimilarity(set1: Set<string>, set2: Set<string>): number {
  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);
  
  if (union.size === 0) {
    return 0;
  }
  
  return intersection.size / union.size;
}

/**
 * Generate a workflow title from a goal
 */
function generateWorkflowTitle(goal: string): string {
  // Take first 50 characters and capitalize
  const title = goal.slice(0, 50).trim();
  return title.charAt(0).toUpperCase() + title.slice(1);
}

/**
 * Generate a workflow description from reflection
 */
function generateWorkflowDescription(reflection: PostExecutionReflection): string {
  if (reflection.lessonsLearned.length > 0) {
    return reflection.lessonsLearned.slice(0, 3).join('. ') + '.';
  }
  
  return 'A successful workflow pattern.';
}

/**
 * Search experiences by keyword
 */
export async function searchExperiences(
  supabase: SupabaseClient,
  userId: string,
  keyword: string,
  limit: number = 10
): Promise<Experience[]> {
  const { data, error } = await supabase
    .from('experiences')
    .select('*')
    .eq('user_id', userId)
    .ilike('goal', `%${keyword}%`)
    .order('created_at', { ascending: false })
    .limit(limit);
  
  if (error) {
    throw new Error(`Failed to search experiences: ${error.message}`);
  }
  
  return data || [];
}
