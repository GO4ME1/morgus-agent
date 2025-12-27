/**
 * NotebookLM Infographic Generation Service
 * 
 * Generates infographics, charts, and visualizations via NotebookLM conduit
 */

export interface InfographicRequest {
  userId: string;
  sources: string[];
  title?: string;
  notebookId?: string;
  chartType?: 'timeline' | 'comparison' | 'process' | 'hierarchy' | 'auto';
}

export interface InfographicResponse {
  success: boolean;
  notebookId: string;
  notebookUrl?: string;
  instructions?: string;
  tips?: string[];
  estimatedTime?: number;
  error?: string;
}

/**
 * Generate infographic from sources
 */
export async function generateInfographic(request: InfographicRequest): Promise<InfographicResponse> {
  try {
    const { userId, sources, title, notebookId, chartType = 'auto' } = request;

    console.log('📊 Infographic generation request:', {
      userId,
      sourceCount: sources.length,
      title,
      chartType,
    });

    // Validate sources
    if (!sources || sources.length === 0) {
      return {
        success: false,
        notebookId: notebookId || '',
        error: 'No content provided for infographic generation',
      };
    }

    // Use existing notebook or create identifier
    const targetNotebookId = notebookId || `infographic-${userId}-${Date.now()}`;

    // In Phase 1 (semi-automatic), we guide user to NotebookLM
    // In Phase 2 (automatic), we'll use browser automation

    const instructions = getInfographicInstructions(chartType);
    const tips = getInfographicTips(chartType);
    const estimatedTime = getEstimatedGenerationTime(sources, chartType);

    return {
      success: true,
      notebookId: targetNotebookId,
      notebookUrl: `https://notebooklm.google.com/notebook/${targetNotebookId}`,
      instructions,
      tips,
      estimatedTime,
    };

  } catch (error) {
    console.error('❌ Infographic generation error:', error);
    return {
      success: false,
      notebookId: request.notebookId || '',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get infographic generation instructions
 */
export function getInfographicInstructions(chartType: string): string {
  const baseInstructions = `
1. Click "Open in NotebookLM" below
2. Your content has been saved as sources
3. In NotebookLM, click "Generate" in the right panel
4. Select "Chart" or "Infographic" from options
5. Choose your preferred visualization style
6. Download the generated infographic
  `.trim();

  const typeSpecific: Record<string, string> = {
    timeline: '\n7. For timeline: Select "Timeline View" for chronological data',
    comparison: '\n7. For comparison: Select "Comparison Chart" to show differences',
    process: '\n7. For process: Select "Flow Diagram" to show steps',
    hierarchy: '\n7. For hierarchy: Select "Tree Diagram" to show structure',
    auto: '\n7. Let NotebookLM automatically choose the best visualization',
  };

  return baseInstructions + (typeSpecific[chartType] || typeSpecific.auto);
}

/**
 * Get infographic generation tips
 */
export function getInfographicTips(chartType: string): string[] {
  const baseTips = [
    'Include clear data points and labels in your sources',
    'Specify what you want to visualize (trends, comparisons, etc.)',
    'Add context about your audience and purpose',
  ];

  const typeTips: Record<string, string[]> = {
    timeline: [
      'Include dates and events in chronological order',
      'Mention key milestones and turning points',
      'Add context for each time period',
    ],
    comparison: [
      'List items to compare side-by-side',
      'Include specific metrics and data points',
      'Highlight key differences and similarities',
    ],
    process: [
      'Break down steps in sequential order',
      'Include decision points and branches',
      'Add details for each step',
    ],
    hierarchy: [
      'Define parent-child relationships',
      'Include all levels of the structure',
      'Show connections between elements',
    ],
  };

  return [...baseTips, ...(typeTips[chartType] || [])];
}

/**
 * Get estimated generation time
 */
export function getEstimatedGenerationTime(sources: string[], chartType: string): number {
  // Base time: 60 seconds
  let time = 60;

  // Add time based on source count
  time += sources.length * 10;

  // Add time based on chart complexity
  const complexityTime: Record<string, number> = {
    timeline: 30,
    comparison: 20,
    process: 40,
    hierarchy: 50,
    auto: 30,
  };

  time += complexityTime[chartType] || 30;

  return time;
}

/**
 * Check infographic generation status
 */
export async function getInfographicStatus(notebookId: string): Promise<{
  status: 'pending' | 'generating' | 'completed' | 'failed';
  progress?: number;
  result?: string;
  error?: string;
}> {
  // In Phase 1, we can't check status automatically
  // In Phase 2, we'll use browser automation to check
  
  return {
    status: 'pending',
    progress: 0,
  };
}

/**
 * Get supported chart types
 */
export function getSupportedChartTypes(): Array<{
  type: string;
  name: string;
  description: string;
  icon: string;
}> {
  return [
    {
      type: 'auto',
      name: 'Auto',
      description: 'Let NotebookLM choose the best visualization',
      icon: '✨',
    },
    {
      type: 'timeline',
      name: 'Timeline',
      description: 'Chronological events and milestones',
      icon: '📅',
    },
    {
      type: 'comparison',
      name: 'Comparison',
      description: 'Side-by-side comparison of items',
      icon: '⚖️',
    },
    {
      type: 'process',
      name: 'Process Flow',
      description: 'Step-by-step process or workflow',
      icon: '🔄',
    },
    {
      type: 'hierarchy',
      name: 'Hierarchy',
      description: 'Organizational or tree structure',
      icon: '🌳',
    },
  ];
}
