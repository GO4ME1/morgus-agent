/**
 * NotebookLM Feature Detector
 * 
 * Detects when users request NotebookLM features (podcasts, infographics, etc.)
 * and routes requests through the NotebookLM conduit.
 */

export type NotebookLMFeature = 
  | 'podcast'
  | 'infographic'
  | 'study_guide'
  | 'faq'
  | 'timeline'
  | 'briefing';

export interface DetectionResult {
  feature: NotebookLMFeature;
  confidence: number;
  keywords: string[];
}

/**
 * Keyword patterns for each NotebookLM feature
 */
const FEATURE_KEYWORDS: Record<NotebookLMFeature, string[]> = {
  podcast: [
    'podcast',
    'audio overview',
    'audio summary',
    'listen to',
    'turn into audio',
    'make a podcast',
    'generate podcast',
    'create podcast',
    'audio discussion',
    'audio version',
  ],
  infographic: [
    'infographic',
    'visual',
    'chart',
    'graph',
    'diagram',
    'visualization',
    'visualize',
    'show me a chart',
    'create a chart',
    'make a graph',
  ],
  study_guide: [
    'study guide',
    'study notes',
    'learning guide',
    'study material',
    'help me study',
    'create study guide',
    'make study guide',
  ],
  faq: [
    'faq',
    'frequently asked',
    'questions and answers',
    'q&a',
    'q and a',
    'common questions',
    'generate faq',
    'create faq',
  ],
  timeline: [
    'timeline',
    'chronology',
    'sequence of events',
    'chronological',
    'create timeline',
    'show timeline',
    'make timeline',
  ],
  briefing: [
    'briefing',
    'executive summary',
    'overview doc',
    'brief me',
    'summarize',
    'summary document',
  ],
};

/**
 * Detect if a message requests a NotebookLM feature
 */
export function detectNotebookLMFeature(message: string): DetectionResult | null {
  const lowerMessage = message.toLowerCase();
  
  for (const [feature, keywords] of Object.entries(FEATURE_KEYWORDS)) {
    const matchedKeywords = keywords.filter(keyword => 
      lowerMessage.includes(keyword.toLowerCase())
    );
    
    if (matchedKeywords.length > 0) {
      // Calculate confidence based on number of matched keywords
      const confidence = Math.min(matchedKeywords.length / keywords.length * 100, 100);
      
      return {
        feature: feature as NotebookLMFeature,
        confidence,
        keywords: matchedKeywords,
      };
    }
  }
  
  return null;
}

/**
 * Check if a feature is currently supported
 */
export function isFeatureSupported(feature: NotebookLMFeature): boolean {
  // Phase 1: Only podcast is supported
  const supportedFeatures: NotebookLMFeature[] = ['podcast'];
  return supportedFeatures.includes(feature);
}

/**
 * Get a user-friendly message for unsupported features
 */
export function getUnsupportedMessage(feature: NotebookLMFeature): string {
  const messages: Record<NotebookLMFeature, string> = {
    podcast: 'Podcast generation is coming soon!',
    infographic: '📊 Infographic generation is coming soon! For now, you can save your conversation to NotebookLM and create charts manually.',
    study_guide: '📚 Study guide generation is coming soon! For now, you can save your conversation to NotebookLM and generate study guides manually.',
    faq: '❓ FAQ generation is coming soon! For now, you can save your conversation to NotebookLM and generate FAQs manually.',
    timeline: '📝 Timeline generation is coming soon! For now, you can save your conversation to NotebookLM and create timelines manually.',
    briefing: '📋 Briefing document generation is coming soon! For now, you can save your conversation to NotebookLM and generate briefings manually.',
  };
  
  return messages[feature];
}

/**
 * Get examples of how to use a feature
 */
export function getFeatureExamples(feature: NotebookLMFeature): string[] {
  const examples: Record<NotebookLMFeature, string[]> = {
    podcast: [
      '"Turn our conversation into a podcast"',
      '"Create an audio overview of my research"',
      '"Make a podcast about this topic"',
    ],
    infographic: [
      '"Create an infographic showing the 5 stages"',
      '"Visualize this data as a chart"',
      '"Make a diagram of this process"',
    ],
    study_guide: [
      '"Create a study guide from our conversation"',
      '"Help me study this topic"',
      '"Generate study notes"',
    ],
    faq: [
      '"Generate FAQs about this topic"',
      '"Create a Q&A document"',
      '"What are common questions about this?"',
    ],
    timeline: [
      '"Create a timeline of events"',
      '"Show me a chronological view"',
      '"Make a timeline of the project"',
    ],
    briefing: [
      '"Create a briefing document"',
      '"Give me an executive summary"',
      '"Brief me on this topic"',
    ],
  };
  
  return examples[feature];
}
