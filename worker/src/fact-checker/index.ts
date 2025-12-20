/**
 * Fact Checker / Hallucination Filter for Morgus
 * 
 * This module provides fact verification capabilities to reduce hallucinations
 * by cross-referencing claims against web sources.
 */

export interface VerificationResult {
  claim: string;
  isVerified: boolean;
  confidence: number;
  source?: string;
}

export interface FactCheckReport {
  totalClaims: number;
  verifiedClaims: number;
  unverifiedClaims: number;
  results: VerificationResult[];
}

export class FactChecker {
  private enabled: boolean = true;

  /**
   * Enable or disable fact checking
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  /**
   * Extract factual claims from text
   * Focuses on statements with numbers, dates, proper nouns, or specific facts
   */
  extractClaims(text: string): string[] {
    if (!this.enabled) return [];

    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 10);
    const claims: string[] = [];

    for (const sentence of sentences) {
      const trimmed = sentence.trim();
      
      // Look for sentences with factual indicators
      const hasNumber = /\d+/.test(trimmed);
      const hasProperNoun = /[A-Z][a-z]+/.test(trimmed);
      const hasDate = /\d{4}|January|February|March|April|May|June|July|August|September|October|November|December/i.test(trimmed);
      const hasFactualVerb = /is|was|were|are|has|have|founded|created|invented|discovered|published|released/i.test(trimmed);

      // Only extract claims that look factual
      if ((hasNumber || hasDate) && (hasProperNoun || hasFactualVerb)) {
        claims.push(trimmed);
      }
    }

    return claims.slice(0, 5); // Limit to 5 claims to avoid excessive verification
  }

  /**
   * Process a response and add verification markers
   * Note: Actual web verification would require search tool integration
   * For now, this marks claims that should be verified
   */
  async processResponse(response: string): Promise<string> {
    if (!this.enabled) return response;

    const claims = this.extractClaims(response);
    
    if (claims.length === 0) {
      return response;
    }

    // Add a verification note at the end if there are factual claims
    let verifiedResponse = response;
    
    // Mark potential factual claims with a subtle indicator
    // In a full implementation, this would actually verify against web sources
    const verificationNote = `\n\n---\n*Note: This response contains ${claims.length} factual claim(s) that may benefit from verification.*`;
    
    // Only add the note for responses with multiple factual claims
    if (claims.length >= 2) {
      verifiedResponse += verificationNote;
    }

    return verifiedResponse;
  }

  /**
   * Generate a fact-check report for a given text
   */
  generateReport(text: string): FactCheckReport {
    const claims = this.extractClaims(text);
    
    return {
      totalClaims: claims.length,
      verifiedClaims: 0, // Would be populated after actual verification
      unverifiedClaims: claims.length,
      results: claims.map(claim => ({
        claim,
        isVerified: false,
        confidence: 0,
      }))
    };
  }
}

// Export a singleton instance
export const factChecker = new FactChecker();
