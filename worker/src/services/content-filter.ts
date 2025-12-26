/**
 * Content Filter Service
 * Prevents harmful, dangerous, or inappropriate content generation
 * 
 * This service provides multiple layers of content filtering:
 * 1. Input filtering - Block harmful prompts before they reach the AI
 * 2. Output filtering - Scan AI responses for dangerous content
 * 3. Category-based blocking - Different severity levels for different content types
 */

export interface ContentFilterResult {
  allowed: boolean;
  category?: ContentCategory;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  reason?: string;
  flaggedTerms?: string[];
}

export type ContentCategory = 
  | 'violence'
  | 'self_harm'
  | 'illegal_activity'
  | 'malware'
  | 'personal_data'
  | 'hate_speech'
  | 'sexual_content'
  | 'weapons'
  | 'drugs'
  | 'financial_fraud'
  | 'impersonation'
  | 'spam';

interface FilterPattern {
  pattern: RegExp;
  category: ContentCategory;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
}

// Patterns for detecting harmful content
const FILTER_PATTERNS: FilterPattern[] = [
  // Violence & Self-Harm (Critical)
  {
    pattern: /\b(how to|ways to|methods? (to|for)|steps? (to|for))\s+(kill|murder|assassinate|harm|hurt)\s+(someone|people|person|myself|yourself|themselves)\b/i,
    category: 'violence',
    severity: 'critical',
    description: 'Instructions for violence'
  },
  {
    pattern: /\b(suicide|self[- ]?harm|cut (myself|yourself)|end (my|your) life)\b/i,
    category: 'self_harm',
    severity: 'critical',
    description: 'Self-harm content'
  },
  
  // Malware & Hacking (Critical)
  {
    pattern: /\b(create|write|generate|make)\s+(a\s+)?(virus|malware|ransomware|trojan|keylogger|rootkit|botnet)\b/i,
    category: 'malware',
    severity: 'critical',
    description: 'Malware creation request'
  },
  {
    pattern: /\b(hack|exploit|bypass|crack)\s+(into|password|security|authentication|firewall)\b/i,
    category: 'malware',
    severity: 'high',
    description: 'Hacking instructions'
  },
  {
    pattern: /\b(sql injection|xss attack|buffer overflow|privilege escalation)\s+(tutorial|guide|how to)\b/i,
    category: 'malware',
    severity: 'high',
    description: 'Security exploit instructions'
  },
  
  // Weapons (High)
  {
    pattern: /\b(how to|instructions? (for|to)|build|make|create)\s+(a\s+)?(bomb|explosive|weapon|gun|firearm)\b/i,
    category: 'weapons',
    severity: 'critical',
    description: 'Weapon creation instructions'
  },
  {
    pattern: /\b(3d print|manufacture|assemble)\s+(a\s+)?(gun|firearm|weapon)\b/i,
    category: 'weapons',
    severity: 'critical',
    description: '3D printed weapon instructions'
  },
  
  // Illegal Drugs (High)
  {
    pattern: /\b(how to|synthesize|manufacture|cook|make)\s+(meth|methamphetamine|cocaine|heroin|fentanyl|lsd|mdma)\b/i,
    category: 'drugs',
    severity: 'critical',
    description: 'Drug manufacturing instructions'
  },
  
  // Financial Fraud (High)
  {
    pattern: /\b(credit card|bank account)\s+(fraud|scam|steal|hack)\b/i,
    category: 'financial_fraud',
    severity: 'high',
    description: 'Financial fraud instructions'
  },
  {
    pattern: /\b(phishing|social engineering)\s+(attack|scam|template|email)\b/i,
    category: 'financial_fraud',
    severity: 'high',
    description: 'Phishing/scam instructions'
  },
  {
    pattern: /\b(money laundering|tax evasion|wire fraud)\s+(how to|guide|tutorial)\b/i,
    category: 'financial_fraud',
    severity: 'high',
    description: 'Financial crime instructions'
  },
  
  // Personal Data (Medium)
  {
    pattern: /\b(find|get|lookup|dox)\s+(someone'?s?|person'?s?)\s+(address|phone|ssn|social security|credit card)\b/i,
    category: 'personal_data',
    severity: 'high',
    description: 'Personal data harvesting'
  },
  {
    pattern: /\b(dox|doxx|doxing|doxxing)\b/i,
    category: 'personal_data',
    severity: 'high',
    description: 'Doxxing request'
  },
  
  // Hate Speech (Medium)
  {
    pattern: /\b(hate|kill|eliminate|exterminate)\s+(all\s+)?(jews|muslims|christians|blacks|whites|asians|gays|trans)\b/i,
    category: 'hate_speech',
    severity: 'critical',
    description: 'Hate speech targeting groups'
  },
  
  // Impersonation (Medium)
  {
    pattern: /\b(pretend|act|pose)\s+(to be|as)\s+(a\s+)?(doctor|lawyer|police|officer|government|official)\b/i,
    category: 'impersonation',
    severity: 'medium',
    description: 'Professional impersonation'
  },
  
  // Illegal Activity (Medium)
  {
    pattern: /\b(how to|ways to)\s+(steal|shoplift|rob|burglarize|break into)\b/i,
    category: 'illegal_activity',
    severity: 'high',
    description: 'Theft instructions'
  },
  {
    pattern: /\b(fake|forge|counterfeit)\s+(id|passport|license|documents?|money|currency)\b/i,
    category: 'illegal_activity',
    severity: 'high',
    description: 'Document forgery'
  }
];

// Blocked terms that should never appear in output
const BLOCKED_OUTPUT_TERMS = [
  // Dangerous chemicals/compounds
  /\b(synthesis of|how to make|recipe for)\s+(ricin|sarin|vx gas|mustard gas|anthrax)\b/i,
  // Specific exploit code patterns
  /\b(shellcode|payload|exploit code):\s*[a-f0-9]{20,}/i,
  // Credit card patterns (shouldn't be generating these)
  /\b4[0-9]{15}\b|\b5[1-5][0-9]{14}\b|\b3[47][0-9]{13}\b/,
  // SSN patterns
  /\b[0-9]{3}-[0-9]{2}-[0-9]{4}\b/,
];

export class ContentFilterService {
  private enabled: boolean;
  private logViolations: boolean;
  
  constructor(options: { enabled?: boolean; logViolations?: boolean } = {}) {
    this.enabled = options.enabled ?? true;
    this.logViolations = options.logViolations ?? true;
  }
  
  /**
   * Filter user input before sending to AI
   */
  filterInput(input: string): ContentFilterResult {
    if (!this.enabled) {
      return { allowed: true };
    }
    
    // Check against all filter patterns
    for (const filter of FILTER_PATTERNS) {
      if (filter.pattern.test(input)) {
        const result: ContentFilterResult = {
          allowed: false,
          category: filter.category,
          severity: filter.severity,
          reason: filter.description,
          flaggedTerms: input.match(filter.pattern)?.slice(0, 3) || []
        };
        
        if (this.logViolations) {
          this.logViolation('input', result, input.substring(0, 100));
        }
        
        return result;
      }
    }
    
    return { allowed: true };
  }
  
  /**
   * Filter AI output before returning to user
   */
  filterOutput(output: string): ContentFilterResult {
    if (!this.enabled) {
      return { allowed: true };
    }
    
    // Check for blocked output terms
    for (const pattern of BLOCKED_OUTPUT_TERMS) {
      if (pattern.test(output)) {
        const result: ContentFilterResult = {
          allowed: false,
          category: 'illegal_activity',
          severity: 'critical',
          reason: 'Output contains blocked content pattern',
          flaggedTerms: output.match(pattern)?.slice(0, 3) || []
        };
        
        if (this.logViolations) {
          this.logViolation('output', result, '[REDACTED]');
        }
        
        return result;
      }
    }
    
    // Also check filter patterns on output
    for (const filter of FILTER_PATTERNS) {
      if (filter.severity === 'critical' && filter.pattern.test(output)) {
        const result: ContentFilterResult = {
          allowed: false,
          category: filter.category,
          severity: filter.severity,
          reason: `Output contains ${filter.description}`,
          flaggedTerms: []
        };
        
        if (this.logViolations) {
          this.logViolation('output', result, '[REDACTED]');
        }
        
        return result;
      }
    }
    
    return { allowed: true };
  }
  
  /**
   * Check if a tool call should be allowed
   */
  filterToolCall(toolName: string, args: Record<string, unknown>): ContentFilterResult {
    if (!this.enabled) {
      return { allowed: true };
    }
    
    // Dangerous tool + argument combinations
    const dangerousPatterns: Array<{ tool: string; argPattern: RegExp; reason: string }> = [
      { tool: 'execute_code', argPattern: /rm\s+-rf\s+\/|:(){ :|:& };:|fork\s+bomb/i, reason: 'Destructive system command' },
      { tool: 'execute_code', argPattern: /curl.*\|\s*(bash|sh)|wget.*\|\s*(bash|sh)/i, reason: 'Remote code execution' },
      { tool: 'browser_navigate', argPattern: /javascript:/i, reason: 'JavaScript injection' },
      { tool: 'file_write', argPattern: /\/etc\/passwd|\/etc\/shadow|\.ssh\/authorized_keys/i, reason: 'System file modification' },
    ];
    
    const argsString = JSON.stringify(args);
    
    for (const check of dangerousPatterns) {
      if (toolName === check.tool && check.argPattern.test(argsString)) {
        return {
          allowed: false,
          category: 'malware',
          severity: 'critical',
          reason: check.reason
        };
      }
    }
    
    return { allowed: true };
  }
  
  /**
   * Get a safe response message for blocked content
   */
  getBlockedResponse(result: ContentFilterResult): string {
    const responses: Record<ContentCategory, string> = {
      violence: "I can't help with content that could cause harm to people. If you're having thoughts of harming yourself or others, please reach out to a crisis helpline.",
      self_harm: "I'm concerned about this request. If you're struggling, please reach out to a crisis helpline like 988 (Suicide & Crisis Lifeline) or text HOME to 741741.",
      illegal_activity: "I can't assist with illegal activities. Is there something legal I can help you with instead?",
      malware: "I can't help create malicious software or hacking tools. I'd be happy to help with legitimate security research or ethical hacking education instead.",
      personal_data: "I can't help find or expose people's personal information. This protects everyone's privacy and safety.",
      hate_speech: "I can't generate content that targets or demeans groups of people. Let me know if there's something constructive I can help with.",
      sexual_content: "I can't generate explicit sexual content. Is there something else I can help you with?",
      weapons: "I can't provide instructions for creating weapons. Is there something else I can help you with?",
      drugs: "I can't provide instructions for manufacturing controlled substances. If you're struggling with substance use, SAMHSA's helpline is 1-800-662-4357.",
      financial_fraud: "I can't help with fraud or scams. If you're facing financial difficulties, I'd be happy to suggest legitimate resources.",
      impersonation: "I can't help impersonate professionals or authorities. This could put people at risk.",
      spam: "I can't help generate spam or misleading content."
    };
    
    return result.category ? responses[result.category] : "I can't help with that request.";
  }
  
  private logViolation(type: 'input' | 'output', result: ContentFilterResult, preview: string): void {
    console.log(JSON.stringify({
      event: 'content_filter_violation',
      type,
      category: result.category,
      severity: result.severity,
      reason: result.reason,
      preview: type === 'input' ? preview : '[REDACTED]',
      timestamp: new Date().toISOString()
    }));
  }
}

// Singleton instance for easy import
export const contentFilter = new ContentFilterService({ enabled: true, logViolations: true });
