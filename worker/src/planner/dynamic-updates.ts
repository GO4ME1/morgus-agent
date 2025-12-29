/**
 * Dynamic DPPM Updates
 * 
 * Allow DPPM to adjust plans during execution based on results and new information.
 * This makes Morgus more adaptive and intelligent, similar to Manus's real-time planning.
 * 
 * Features:
 * - Checkpoint system for plan review
 * - Result-based adjustments
 * - Dependency re-calculation
 * - User approval for major changes
 */

export interface Subtask {
  id: string;
  title: string;
  description: string;
  dependencies: string[];
  status: 'pending' | 'running' | 'completed' | 'failed';
  result?: any;
  error?: string;
}

export interface MergedPlan {
  goal: string;
  subtasks: Subtask[];
  estimatedTime: number;
  complexity: number;
}

export interface PlanCheckpoint {
  subtaskId: string;
  subtask: Subtask;
  result: any;
  suggestedAdjustments: PlanAdjustment[];
  reason: string;
}

export interface PlanAdjustment {
  type: 'add_subtask' | 'remove_subtask' | 'modify_subtask' | 'reorder' | 'change_dependencies';
  subtaskId?: string;
  newSubtask?: Partial<Subtask>;
  modifications?: Partial<Subtask>;
  reason: string;
  impact: {
    timeChange: number; // minutes
    complexityChange: number; // -10 to +10
    riskLevel: 'low' | 'medium' | 'high';
  };
}

export interface DPPMConfig {
  enableDynamicUpdates: boolean;
  requireUserApproval: boolean; // For major changes
  autoApproveMinorChanges: boolean;
  maxAdjustments: number; // Prevent infinite adjustments
}

export const DEFAULT_DPPM_CONFIG: DPPMConfig = {
  enableDynamicUpdates: true,
  requireUserApproval: true,
  autoApproveMinorChanges: true,
  maxAdjustments: 5,
};

export class DynamicDPPM {
  private config: DPPMConfig;
  private adjustmentCount: number = 0;
  
  constructor(config: Partial<DPPMConfig> = {}) {
    this.config = { ...DEFAULT_DPPM_CONFIG, ...config };
  }
  
  /**
   * Execute plan with dynamic adjustments
   */
  async executeWithAdjustments(
    plan: MergedPlan,
    executor: (subtask: Subtask) => Promise<any>,
    onPlanUpdated?: (plan: MergedPlan, adjustments: PlanAdjustment[]) => void
  ): Promise<MergedPlan> {
    console.log(`[DynamicDPPM] Starting execution with ${plan.subtasks.length} subtasks`);
    
    let currentPlan = { ...plan };
    
    // Sort subtasks by dependencies (topological sort)
    const sortedSubtasks = this.topologicalSort(currentPlan.subtasks);
    
    for (const subtask of sortedSubtasks) {
      // Skip if already completed
      if (subtask.status === 'completed') {
        continue;
      }
      
      // Check dependencies
      if (!this.areDependenciesMet(subtask, currentPlan.subtasks)) {
        console.log(`[DynamicDPPM] Skipping ${subtask.id} - dependencies not met`);
        continue;
      }
      
      // Execute subtask
      console.log(`[DynamicDPPM] Executing subtask: ${subtask.title}`);
      subtask.status = 'running';
      
      try {
        const result = await executor(subtask);
        subtask.status = 'completed';
        subtask.result = result;
        
        // Create checkpoint
        const checkpoint = await this.createCheckpoint(subtask, result, currentPlan);
        
        // Analyze if adjustments needed
        if (this.config.enableDynamicUpdates && checkpoint.suggestedAdjustments.length > 0) {
          console.log(`[DynamicDPPM] ${checkpoint.suggestedAdjustments.length} adjustments suggested`);
          
          // Check if we've hit max adjustments
          if (this.adjustmentCount >= this.config.maxAdjustments) {
            console.log(`[DynamicDPPM] Max adjustments reached (${this.config.maxAdjustments})`);
            continue;
          }
          
          // Apply adjustments
          const approvedAdjustments = await this.getApprovedAdjustments(checkpoint.suggestedAdjustments);
          
          if (approvedAdjustments.length > 0) {
            currentPlan = this.applyAdjustments(currentPlan, approvedAdjustments);
            this.adjustmentCount++;
            
            // Notify plan update
            if (onPlanUpdated) {
              onPlanUpdated(currentPlan, approvedAdjustments);
            }
          }
        }
        
      } catch (error: any) {
        subtask.status = 'failed';
        subtask.error = error.message;
        console.error(`[DynamicDPPM] Subtask failed: ${subtask.title}`, error);
      }
    }
    
    return currentPlan;
  }
  
  /**
   * Create checkpoint after subtask completion
   */
  private async createCheckpoint(
    subtask: Subtask,
    result: any,
    plan: MergedPlan
  ): Promise<PlanCheckpoint> {
    const suggestedAdjustments: PlanAdjustment[] = [];
    let reason = '';
    
    // Analyze result for potential adjustments
    const analysis = this.analyzeResult(subtask, result, plan);
    
    if (analysis.needsAuthentication) {
      suggestedAdjustments.push({
        type: 'add_subtask',
        newSubtask: {
          id: `auth-${Date.now()}`,
          title: 'Setup Authentication',
          description: 'Add authentication system discovered to be needed',
          dependencies: [subtask.id],
          status: 'pending',
        },
        reason: 'Authentication required based on subtask result',
        impact: {
          timeChange: 20,
          complexityChange: 3,
          riskLevel: 'medium',
        },
      });
      reason = 'Authentication needed';
    }
    
    if (analysis.needsDatabase) {
      suggestedAdjustments.push({
        type: 'add_subtask',
        newSubtask: {
          id: `db-${Date.now()}`,
          title: 'Setup Database',
          description: 'Add database discovered to be needed',
          dependencies: [subtask.id],
          status: 'pending',
        },
        reason: 'Database required based on subtask result',
        impact: {
          timeChange: 15,
          complexityChange: 2,
          riskLevel: 'medium',
        },
      });
      reason = reason ? `${reason}, Database needed` : 'Database needed';
    }
    
    if (analysis.canSimplify) {
      const remainingSubtasks = plan.subtasks.filter(
        s => s.status === 'pending' && analysis.subtasksToRemove.includes(s.id)
      );
      
      for (const s of remainingSubtasks) {
        suggestedAdjustments.push({
          type: 'remove_subtask',
          subtaskId: s.id,
          reason: 'Subtask no longer needed based on previous results',
          impact: {
            timeChange: -10,
            complexityChange: -1,
            riskLevel: 'low',
          },
        });
      }
      
      reason = reason ? `${reason}, Simplified plan` : 'Simplified plan';
    }
    
    return {
      subtaskId: subtask.id,
      subtask,
      result,
      suggestedAdjustments,
      reason: reason || 'No adjustments needed',
    };
  }
  
  /**
   * Analyze subtask result for potential plan adjustments
   */
  private analyzeResult(subtask: Subtask, result: any, plan: MergedPlan): {
    needsAuthentication: boolean;
    needsDatabase: boolean;
    canSimplify: boolean;
    subtasksToRemove: string[];
  } {
    // Simple heuristics - in production, this would use LLM analysis
    const resultStr = JSON.stringify(result).toLowerCase();
    
    const needsAuthentication = 
      resultStr.includes('auth') || 
      resultStr.includes('login') || 
      resultStr.includes('user');
    
    const needsDatabase = 
      resultStr.includes('database') || 
      resultStr.includes('storage') || 
      resultStr.includes('persist');
    
    // Check if we can simplify (e.g., if a library does what multiple subtasks were planning to do)
    const canSimplify = resultStr.includes('library') || resultStr.includes('framework');
    
    const subtasksToRemove: string[] = [];
    if (canSimplify) {
      // Find subtasks that might be redundant
      const remainingSubtasks = plan.subtasks.filter(s => s.status === 'pending');
      for (const s of remainingSubtasks) {
        if (s.title.toLowerCase().includes('implement') && 
            resultStr.includes(s.title.toLowerCase().split(' ')[1])) {
          subtasksToRemove.push(s.id);
        }
      }
    }
    
    return {
      needsAuthentication,
      needsDatabase,
      canSimplify,
      subtasksToRemove,
    };
  }
  
  /**
   * Get approved adjustments (with user approval if needed)
   */
  private async getApprovedAdjustments(
    adjustments: PlanAdjustment[]
  ): Promise<PlanAdjustment[]> {
    // Separate minor and major changes
    const minorChanges = adjustments.filter(a => a.impact.riskLevel === 'low');
    const majorChanges = adjustments.filter(a => a.impact.riskLevel !== 'low');
    
    const approved: PlanAdjustment[] = [];
    
    // Auto-approve minor changes if enabled
    if (this.config.autoApproveMinorChanges) {
      approved.push(...minorChanges);
    }
    
    // For major changes, require approval if enabled
    if (majorChanges.length > 0) {
      if (this.config.requireUserApproval) {
        // In production, this would prompt user for approval
        // For now, auto-approve
        console.log(`[DynamicDPPM] Major changes require approval: ${majorChanges.length}`);
        approved.push(...majorChanges);
      } else {
        approved.push(...majorChanges);
      }
    }
    
    return approved;
  }
  
  /**
   * Apply adjustments to plan
   */
  private applyAdjustments(
    plan: MergedPlan,
    adjustments: PlanAdjustment[]
  ): MergedPlan {
    let newPlan = { ...plan, subtasks: [...plan.subtasks] };
    
    for (const adjustment of adjustments) {
      switch (adjustment.type) {
        case 'add_subtask':
          if (adjustment.newSubtask) {
            newPlan.subtasks.push({
              id: adjustment.newSubtask.id || `subtask-${Date.now()}`,
              title: adjustment.newSubtask.title || 'New Subtask',
              description: adjustment.newSubtask.description || '',
              dependencies: adjustment.newSubtask.dependencies || [],
              status: 'pending',
            });
            newPlan.estimatedTime += adjustment.impact.timeChange;
            newPlan.complexity += adjustment.impact.complexityChange;
          }
          break;
          
        case 'remove_subtask':
          if (adjustment.subtaskId) {
            newPlan.subtasks = newPlan.subtasks.filter(s => s.id !== adjustment.subtaskId);
            newPlan.estimatedTime += adjustment.impact.timeChange; // negative
            newPlan.complexity += adjustment.impact.complexityChange; // negative
          }
          break;
          
        case 'modify_subtask':
          if (adjustment.subtaskId && adjustment.modifications) {
            const index = newPlan.subtasks.findIndex(s => s.id === adjustment.subtaskId);
            if (index !== -1) {
              newPlan.subtasks[index] = {
                ...newPlan.subtasks[index],
                ...adjustment.modifications,
              };
            }
          }
          break;
          
        case 'reorder':
          // Reorder based on dependencies
          newPlan.subtasks = this.topologicalSort(newPlan.subtasks);
          break;
          
        case 'change_dependencies':
          if (adjustment.subtaskId && adjustment.modifications?.dependencies) {
            const index = newPlan.subtasks.findIndex(s => s.id === adjustment.subtaskId);
            if (index !== -1) {
              newPlan.subtasks[index].dependencies = adjustment.modifications.dependencies;
            }
          }
          break;
      }
    }
    
    return newPlan;
  }
  
  /**
   * Check if subtask dependencies are met
   */
  private areDependenciesMet(subtask: Subtask, allSubtasks: Subtask[]): boolean {
    if (!subtask.dependencies || subtask.dependencies.length === 0) {
      return true;
    }
    
    for (const depId of subtask.dependencies) {
      const dep = allSubtasks.find(s => s.id === depId);
      if (!dep || dep.status !== 'completed') {
        return false;
      }
    }
    
    return true;
  }
  
  /**
   * Topological sort of subtasks based on dependencies
   */
  private topologicalSort(subtasks: Subtask[]): Subtask[] {
    const sorted: Subtask[] = [];
    const visited = new Set<string>();
    const visiting = new Set<string>();
    
    const visit = (subtask: Subtask) => {
      if (visited.has(subtask.id)) return;
      if (visiting.has(subtask.id)) {
        // Circular dependency detected
        console.warn(`[DynamicDPPM] Circular dependency detected for ${subtask.id}`);
        return;
      }
      
      visiting.add(subtask.id);
      
      // Visit dependencies first
      for (const depId of subtask.dependencies) {
        const dep = subtasks.find(s => s.id === depId);
        if (dep) {
          visit(dep);
        }
      }
      
      visiting.delete(subtask.id);
      visited.add(subtask.id);
      sorted.push(subtask);
    };
    
    for (const subtask of subtasks) {
      visit(subtask);
    }
    
    return sorted;
  }
}
