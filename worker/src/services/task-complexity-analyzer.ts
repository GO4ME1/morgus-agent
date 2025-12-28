/**
 * Task Complexity Analyzer
 * 
 * Analyzes user requests to determine if DPPM planning is needed.
 * Uses keyword matching and heuristics to detect complex development tasks.
 */

export interface ComplexityAnalysis {
  score: number; // 0-10 scale
  indicators: string[]; // Reasons for complexity
  useDPPM: boolean; // Whether to invoke DPPM
  estimatedSubtasks: number; // Estimated number of subtasks
  reasoning: string; // Human-readable explanation
}

export class TaskComplexityAnalyzer {
  /**
   * Analyze a user request for complexity
   */
  static analyze(userMessage: string): ComplexityAnalysis {
    const messageLower = userMessage.toLowerCase();
    let score = 0;
    const indicators: string[] = [];
    
    // Development keywords (high complexity)
    const devKeywords = [
      'build', 'create app', 'develop', 'full-stack', 'backend', 'frontend',
      'database', 'authentication', 'api', 'deploy', 'website', 'application',
      'system', 'platform', 'service', 'microservice', 'architecture'
    ];
    
    // Feature keywords (medium complexity)
    const featureKeywords = [
      'with authentication', 'user login', 'crud', 'dashboard', 'admin panel',
      'payment', 'subscription', 'real-time', 'chat', 'notifications',
      'email', 'search', 'filter', 'sort', 'pagination', 'upload',
      'profile', 'settings', 'analytics', 'reporting', 'export'
    ];
    
    // Multi-step indicators
    const multiStepKeywords = [
      'and', 'then', 'also', 'plus', 'including', 'with', 'that has',
      'as well as', 'along with', 'together with', 'followed by'
    ];
    
    // Technology stack indicators (suggests complex project)
    const techStackKeywords = [
      'react', 'vue', 'angular', 'node', 'express', 'fastapi', 'django',
      'postgres', 'mysql', 'mongodb', 'redis', 'supabase', 'firebase',
      'aws', 'gcp', 'azure', 'docker', 'kubernetes', 'ci/cd'
    ];
    
    // Integration indicators
    const integrationKeywords = [
      'integrate', 'connect', 'api integration', 'third-party', 'webhook',
      'oauth', 'stripe', 'paypal', 'twilio', 'sendgrid', 'aws s3'
    ];
    
    // Check for development keywords
    let devMatches = 0;
    for (const keyword of devKeywords) {
      if (messageLower.includes(keyword)) {
        devMatches++;
        score += 2;
      }
    }
    if (devMatches > 0) {
      indicators.push(`Development task (${devMatches} indicators)`);
    }
    
    // Check for feature keywords
    let featureMatches = 0;
    for (const keyword of featureKeywords) {
      if (messageLower.includes(keyword)) {
        featureMatches++;
        score += 1;
      }
    }
    if (featureMatches > 0) {
      indicators.push(`Multiple features (${featureMatches} features)`);
    }
    
    // Check for multi-step indicators
    let multiStepMatches = 0;
    for (const keyword of multiStepKeywords) {
      const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
      const matches = messageLower.match(regex);
      if (matches) {
        multiStepMatches += matches.length;
      }
    }
    if (multiStepMatches >= 3) {
      score += 1;
      indicators.push(`Multi-step task (${multiStepMatches} connectors)`);
    }
    
    // Check for technology stack mentions
    let techMatches = 0;
    for (const keyword of techStackKeywords) {
      if (messageLower.includes(keyword)) {
        techMatches++;
        score += 1;
      }
    }
    if (techMatches > 0) {
      indicators.push(`Technology stack specified (${techMatches} technologies)`);
    }
    
    // Check for integration requirements
    let integrationMatches = 0;
    for (const keyword of integrationKeywords) {
      if (messageLower.includes(keyword)) {
        integrationMatches++;
        score += 1.5;
      }
    }
    if (integrationMatches > 0) {
      indicators.push(`External integrations (${integrationMatches} integrations)`);
    }
    
    // Check message length (longer = more complex)
    const wordCount = userMessage.split(/\s+/).length;
    if (wordCount > 50) {
      score += 1;
      indicators.push(`Detailed requirements (${wordCount} words)`);
    } else if (wordCount > 100) {
      score += 2;
      indicators.push(`Very detailed requirements (${wordCount} words)`);
    }
    
    // Check for deployment requirements
    if (messageLower.includes('deploy') || messageLower.includes('production') || messageLower.includes('live')) {
      score += 1;
      indicators.push('Deployment required');
    }
    
    // Check for testing requirements
    if (messageLower.includes('test') || messageLower.includes('testing') || messageLower.includes('unit test')) {
      score += 0.5;
      indicators.push('Testing required');
    }
    
    // Check for documentation requirements
    if (messageLower.includes('document') || messageLower.includes('readme') || messageLower.includes('docs')) {
      score += 0.5;
      indicators.push('Documentation required');
    }
    
    // Estimate subtasks based on complexity
    let estimatedSubtasks = 3; // Default minimum
    if (devMatches > 0) estimatedSubtasks += 2;
    if (featureMatches > 0) estimatedSubtasks += Math.min(featureMatches, 3);
    if (integrationMatches > 0) estimatedSubtasks += integrationMatches;
    if (techMatches > 2) estimatedSubtasks += 1;
    estimatedSubtasks = Math.min(estimatedSubtasks, 7); // Max 7 subtasks
    
    // Determine if DPPM should be used
    // Threshold: 5+ complexity score
    const useDPPM = score >= 5;
    
    // Generate reasoning
    let reasoning = '';
    if (useDPPM) {
      reasoning = `This is a complex task (score: ${score.toFixed(1)}/10) that requires structured planning. ` +
        `DPPM will decompose it into ${estimatedSubtasks} subtasks and execute them sequentially.`;
    } else {
      reasoning = `This is a simple task (score: ${score.toFixed(1)}/10) that can be handled by the standard agent loop.`;
    }
    
    return {
      score: Math.min(score, 10),
      indicators,
      useDPPM,
      estimatedSubtasks,
      reasoning
    };
  }
  
  /**
   * Check if a task is complex enough for DPPM
   */
  static isComplex(userMessage: string): boolean {
    return this.analyze(userMessage).useDPPM;
  }
  
  /**
   * Get a human-readable summary of the analysis
   */
  static getSummary(userMessage: string): string {
    const analysis = this.analyze(userMessage);
    
    let summary = `**Task Complexity Analysis**\n\n`;
    summary += `- **Complexity Score:** ${analysis.score.toFixed(1)}/10\n`;
    summary += `- **Use DPPM:** ${analysis.useDPPM ? 'Yes' : 'No'}\n`;
    summary += `- **Estimated Subtasks:** ${analysis.estimatedSubtasks}\n\n`;
    
    if (analysis.indicators.length > 0) {
      summary += `**Complexity Indicators:**\n`;
      for (const indicator of analysis.indicators) {
        summary += `- ${indicator}\n`;
      }
      summary += `\n`;
    }
    
    summary += `**Reasoning:** ${analysis.reasoning}`;
    
    return summary;
  }
}
