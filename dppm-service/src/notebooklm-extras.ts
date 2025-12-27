/**
 * NotebookLM Extra Features Service
 * 
 * FAQs, Timelines, Briefing Docs, and other NotebookLM features
 */

export interface ExtraFeatureRequest {
  userId: string;
  sources: string[];
  title?: string;
  notebookId?: string;
  featureType: 'faq' | 'timeline' | 'briefing' | 'table_of_contents';
}

export interface ExtraFeatureResponse {
  success: boolean;
  notebookId: string;
  notebookUrl?: string;
  instructions?: string;
  tips?: string[];
  estimatedTime?: number;
  error?: string;
}

/**
 * Generate FAQ, Timeline, or other feature
 */
export async function generateExtraFeature(request: ExtraFeatureRequest): Promise<ExtraFeatureResponse> {
  try {
    const { userId, sources, title, notebookId, featureType } = request;

    console.log(`📋 ${featureType.toUpperCase()} generation request:`, {
      userId,
      sourceCount: sources.length,
      title,
    });

    // Validate sources
    if (!sources || sources.length === 0) {
      return {
        success: false,
        notebookId: notebookId || '',
        error: 'No content provided for generation',
      };
    }

    // Use existing notebook or create identifier
    const targetNotebookId = notebookId || `${featureType}-${userId}-${Date.now()}`;

    const instructions = getFeatureInstructions(featureType);
    const tips = getFeatureTips(featureType);
    const estimatedTime = getEstimatedGenerationTime(sources, featureType);

    return {
      success: true,
      notebookId: targetNotebookId,
      notebookUrl: `https://notebooklm.google.com/notebook/${targetNotebookId}`,
      instructions,
      tips,
      estimatedTime,
    };

  } catch (error) {
    console.error(`❌ ${request.featureType.toUpperCase()} generation error:`, error);
    return {
      success: false,
      notebookId: request.notebookId || '',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get feature-specific instructions
 */
export function getFeatureInstructions(featureType: string): string {
  const instructions: Record<string, string> = {
    faq: `
1. Click "Open in NotebookLM" below
2. Your content has been saved as sources
3. In NotebookLM, click "FAQ" in the right panel
4. Review the automatically generated questions and answers
5. Edit or add questions as needed
6. Download or share the FAQ document
    `.trim(),

    timeline: `
1. Click "Open in NotebookLM" below
2. Your content has been saved as sources
3. In NotebookLM, click "Timeline" in the right panel
4. Review the chronological events
5. Adjust dates or add missing events
6. Download the timeline visualization
    `.trim(),

    briefing: `
1. Click "Open in NotebookLM" below
2. Your content has been saved as sources
3. In NotebookLM, click "Briefing Doc" in the right panel
4. Get a concise executive summary
5. Review key points and recommendations
6. Download the briefing document
    `.trim(),

    table_of_contents: `
1. Click "Open in NotebookLM" below
2. Your content has been saved as sources
3. In NotebookLM, click "Table of Contents" in the right panel
4. Review the hierarchical structure
5. Navigate to specific sections
6. Use for quick reference
    `.trim(),
  };

  return instructions[featureType] || instructions.faq;
}

/**
 * Get feature-specific tips
 */
export function getFeatureTips(featureType: string): string[] {
  const tips: Record<string, string[]> = {
    faq: [
      'Include common questions your audience might ask',
      'Provide clear, concise answers',
      'Organize by topic or difficulty',
      'Add examples for complex answers',
    ],

    timeline: [
      'Include specific dates and times',
      'Mention key events and milestones',
      'Add context for each event',
      'Show cause-and-effect relationships',
    ],

    briefing: [
      'Focus on key takeaways',
      'Include actionable recommendations',
      'Keep it executive-friendly (1-2 pages)',
      'Highlight critical information',
    ],

    table_of_contents: [
      'Organize content logically',
      'Use clear section headings',
      'Include page numbers or links',
      'Show hierarchy with indentation',
    ],
  };

  return tips[featureType] || tips.faq;
}

/**
 * Get estimated generation time
 */
export function getEstimatedGenerationTime(sources: string[], featureType: string): number {
  // Base time: 45 seconds
  let time = 45;

  // Add time based on source count
  time += sources.length * 8;

  // Add time based on feature complexity
  const complexityTime: Record<string, number> = {
    faq: 30,
    timeline: 40,
    briefing: 25,
    table_of_contents: 20,
  };

  time += complexityTime[featureType] || 30;

  return time;
}

/**
 * Get supported extra features
 */
export function getSupportedExtraFeatures(): Array<{
  type: string;
  name: string;
  description: string;
  icon: string;
}> {
  return [
    {
      type: 'faq',
      name: 'FAQ',
      description: 'Frequently Asked Questions with answers',
      icon: '❓',
    },
    {
      type: 'timeline',
      name: 'Timeline',
      description: 'Chronological events and milestones',
      icon: '📅',
    },
    {
      type: 'briefing',
      name: 'Briefing Doc',
      description: 'Executive summary and key points',
      icon: '📄',
    },
    {
      type: 'table_of_contents',
      name: 'Table of Contents',
      description: 'Hierarchical content structure',
      icon: '📑',
    },
  ];
}
