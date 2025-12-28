/**
 * Template Engine
 * 
 * Process templates with variable substitution, conditionals, and loops.
 * Simple but powerful templating for code generation.
 * 
 * Features:
 * - Variable substitution: {{VAR}}
 * - Conditionals: {{#if condition}}...{{/if}}
 * - Loops: {{#each items}}...{{/each}}
 * - Functions: {{GENERATE_SECRET}}, {{TIMESTAMP}}, etc.
 */

export interface TemplateContext {
  [key: string]: any;
}

export class TemplateEngine {
  /**
   * Render template with context
   */
  static render(template: string, context: TemplateContext = {}): string {
    let result = template;
    
    // 1. Process functions first ({{GENERATE_SECRET}}, {{TIMESTAMP}}, etc.)
    result = this.processFunctions(result);
    
    // 2. Process conditionals ({{#if}}...{{/if}})
    result = this.processConditionals(result, context);
    
    // 3. Process loops ({{#each}}...{{/each}})
    result = this.processLoops(result, context);
    
    // 4. Process variables ({{VAR}})
    result = this.processVariables(result, context);
    
    return result;
  }
  
  /**
   * Process template functions
   */
  private static processFunctions(template: string): string {
    let result = template;
    
    // {{GENERATE_SECRET}} - Generate random secret
    result = result.replace(/\{\{GENERATE_SECRET\}\}/g, () => {
      return this.generateSecret(32);
    });
    
    // {{TIMESTAMP}} - Current timestamp
    result = result.replace(/\{\{TIMESTAMP\}\}/g, () => {
      return Date.now().toString();
    });
    
    // {{DATE}} - Current date (ISO format)
    result = result.replace(/\{\{DATE\}\}/g, () => {
      return new Date().toISOString().split('T')[0];
    });
    
    // {{DATETIME}} - Current datetime (ISO format)
    result = result.replace(/\{\{DATETIME\}\}/g, () => {
      return new Date().toISOString();
    });
    
    // {{UUID}} - Generate UUID
    result = result.replace(/\{\{UUID\}\}/g, () => {
      return this.generateUUID();
    });
    
    return result;
  }
  
  /**
   * Process conditionals
   */
  private static processConditionals(template: string, context: TemplateContext): string {
    let result = template;
    
    // Match {{#if condition}}...{{/if}}
    const ifRegex = /\{\{#if\s+(\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g;
    
    result = result.replace(ifRegex, (match, condition, content) => {
      const value = context[condition];
      
      // Evaluate condition
      if (this.isTruthy(value)) {
        return content;
      } else {
        return '';
      }
    });
    
    return result;
  }
  
  /**
   * Process loops
   */
  private static processLoops(template: string, context: TemplateContext): string {
    let result = template;
    
    // Match {{#each items}}...{{/each}}
    const eachRegex = /\{\{#each\s+(\w+)\}\}([\s\S]*?)\{\{\/each\}\}/g;
    
    result = result.replace(eachRegex, (match, arrayName, content) => {
      const array = context[arrayName];
      
      if (!Array.isArray(array)) {
        return '';
      }
      
      // Render content for each item
      return array.map((item, index) => {
        // Create item context
        const itemContext = {
          ...context,
          ...item,
          '@index': index,
          '@first': index === 0,
          '@last': index === array.length - 1,
        };
        
        // Render item
        return this.processVariables(content, itemContext);
      }).join('');
    });
    
    return result;
  }
  
  /**
   * Process variables
   */
  private static processVariables(template: string, context: TemplateContext): string {
    let result = template;
    
    // Match {{VAR}}
    const varRegex = /\{\{(\w+)\}\}/g;
    
    result = result.replace(varRegex, (match, varName) => {
      const value = context[varName];
      
      if (value === undefined || value === null) {
        return match; // Keep placeholder if value not found
      }
      
      return String(value);
    });
    
    return result;
  }
  
  /**
   * Check if value is truthy
   */
  private static isTruthy(value: any): boolean {
    if (value === undefined || value === null) return false;
    if (typeof value === 'boolean') return value;
    if (typeof value === 'number') return value !== 0;
    if (typeof value === 'string') return value.length > 0;
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === 'object') return Object.keys(value).length > 0;
    return false;
  }
  
  /**
   * Generate random secret
   */
  private static generateSecret(length: number = 32): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }
  
  /**
   * Generate UUID
   */
  private static generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }
}
