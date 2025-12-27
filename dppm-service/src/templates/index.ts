/**
 * Morgus Templates System
 * 
 * ALL outputs MUST use templates. AI only fills in content.
 * This ensures consistent, professional quality every time.
 */

export * from './website-templates';
export * from './app-templates';

import { 
  WebsiteTemplateType, 
  WebsiteData, 
  detectWebsiteTemplate, 
  generateWebsite 
} from './website-templates';

import { 
  AppTemplateType, 
  AppData, 
  detectAppTemplate, 
  generateApp 
} from './app-templates';

export type OutputType = 'website' | 'app' | 'document' | 'code';

export interface TemplateResult {
  type: OutputType;
  templateType: string;
  content: string;
  files: Array<{ name: string; content: string }>;
}

/**
 * Detect what type of output the user wants
 */
export function detectOutputType(message: string): OutputType {
  const lower = message.toLowerCase();
  
  // Check for app keywords
  if (
    lower.includes('mobile app') ||
    lower.includes('ios app') ||
    lower.includes('android app') ||
    lower.includes('react native') ||
    lower.includes('expo app') ||
    (lower.includes('app') && !lower.includes('web app'))
  ) {
    return 'app';
  }
  
  // Check for website keywords
  if (
    lower.includes('website') ||
    lower.includes('landing page') ||
    lower.includes('web page') ||
    lower.includes('web app') ||
    lower.includes('site') ||
    lower.includes('homepage') ||
    lower.includes('portfolio site') ||
    lower.includes('blog site')
  ) {
    return 'website';
  }
  
  // Check for document keywords
  if (
    lower.includes('document') ||
    lower.includes('report') ||
    lower.includes('article') ||
    lower.includes('essay') ||
    lower.includes('paper')
  ) {
    return 'document';
  }
  
  // Default to code for other requests
  return 'code';
}

/**
 * Generate output from template based on user message and AI-generated content
 */
export function generateFromTemplate(
  message: string,
  aiContent: {
    title?: string;
    tagline?: string;
    description?: string;
    features?: Array<{ title: string; description: string; icon?: string }>;
    pricing?: Array<{ name: string; price: string; features: string[]; highlighted?: boolean }>;
    testimonials?: Array<{ name: string; role: string; quote: string }>;
    primaryColor?: string;
    accentColor?: string;
    cta?: { text: string; secondaryText?: string };
    [key: string]: any;
  }
): TemplateResult {
  const outputType = detectOutputType(message);
  const year = new Date().getFullYear();
  
  if (outputType === 'website') {
    const templateType = detectWebsiteTemplate(message);
    const websiteData: WebsiteData = {
      title: aiContent.title || 'My Website',
      tagline: aiContent.tagline || 'Welcome to our website',
      description: aiContent.description || 'A modern website built with Morgus',
      primaryColor: aiContent.primaryColor || '#6366f1',
      accentColor: aiContent.accentColor || '#8b5cf6',
      features: aiContent.features,
      pricing: aiContent.pricing,
      testimonials: aiContent.testimonials,
      cta: aiContent.cta,
      images: aiContent.images,
      socialLinks: aiContent.socialLinks,
      contact: aiContent.contact,
      year,
    };
    
    const html = generateWebsite(templateType, websiteData);
    
    return {
      type: 'website',
      templateType,
      content: html,
      files: [
        { name: 'index.html', content: html },
      ],
    };
  }
  
  if (outputType === 'app') {
    const templateType = detectAppTemplate(message);
    const appData: AppData = {
      name: aiContent.title || 'My App',
      description: aiContent.description || 'A mobile app built with Morgus',
      theme: {
        primaryColor: aiContent.primaryColor || '#6366f1',
        accentColor: aiContent.accentColor || '#8b5cf6',
      },
      features: aiContent.features,
      year,
    };
    
    const appCode = generateApp(templateType, appData);
    
    return {
      type: 'app',
      templateType,
      content: appCode,
      files: [
        { name: 'App.tsx', content: appCode },
      ],
    };
  }
  
  // For document and code, return the AI content as-is
  return {
    type: outputType,
    templateType: 'custom',
    content: aiContent.content || '',
    files: [],
  };
}

/**
 * Extract content requirements from user message for AI to fill
 */
export function getContentPrompt(message: string, outputType: OutputType): string {
  const year = new Date().getFullYear();
  
  if (outputType === 'website') {
    return `Based on the user's request, generate ONLY the content for a website. Do NOT generate HTML/CSS code.

User Request: ${message}

Respond with a JSON object containing:
{
  "title": "The website/company name",
  "tagline": "A compelling one-line tagline (max 100 chars)",
  "description": "A brief description of the website/product (max 200 chars)",
  "primaryColor": "A hex color code that fits the brand (e.g., #6366f1)",
  "accentColor": "A complementary hex color (e.g., #8b5cf6)",
  "features": [
    { "title": "Feature 1", "description": "Description of feature 1", "icon": "emoji" },
    { "title": "Feature 2", "description": "Description of feature 2", "icon": "emoji" },
    { "title": "Feature 3", "description": "Description of feature 3", "icon": "emoji" }
  ],
  "pricing": [
    { "name": "Free", "price": "$0", "features": ["Feature 1", "Feature 2"], "highlighted": false },
    { "name": "Pro", "price": "$29", "features": ["All Free features", "Feature 3", "Feature 4"], "highlighted": true },
    { "name": "Enterprise", "price": "$99", "features": ["All Pro features", "Feature 5", "Priority support"], "highlighted": false }
  ],
  "testimonials": [
    { "name": "Customer Name", "role": "Job Title", "company": "Company", "quote": "A positive testimonial about the product" }
  ],
  "cta": { "text": "Primary CTA button text", "secondaryText": "Secondary CTA text" }
}

IMPORTANT:
- The current year is ${year}. Use this for any date references.
- Generate realistic, professional content that matches the user's request.
- Choose colors that fit the brand/industry.
- Make features specific and valuable.
- Create believable testimonials.
- Respond with ONLY the JSON object, no markdown or explanation.`;
  }
  
  if (outputType === 'app') {
    return `Based on the user's request, generate ONLY the content for a mobile app. Do NOT generate code.

User Request: ${message}

Respond with a JSON object containing:
{
  "title": "The app name",
  "description": "A brief description of the app (max 200 chars)",
  "primaryColor": "A hex color code that fits the brand (e.g., #6366f1)",
  "accentColor": "A complementary hex color (e.g., #8b5cf6)",
  "features": [
    { "title": "Feature 1", "description": "Description of feature 1", "icon": "emoji" },
    { "title": "Feature 2", "description": "Description of feature 2", "icon": "emoji" },
    { "title": "Feature 3", "description": "Description of feature 3", "icon": "emoji" }
  ]
}

IMPORTANT:
- The current year is ${year}. Use this for any date references.
- Generate realistic, professional content that matches the user's request.
- Choose colors that fit the app's purpose.
- Make features specific and valuable.
- Respond with ONLY the JSON object, no markdown or explanation.`;
  }
  
  return message;
}

/**
 * Parse AI response to extract content JSON
 */
export function parseAIContent(response: string): Record<string, any> {
  try {
    // Try to find JSON in the response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (e) {
    console.error('Failed to parse AI content:', e);
  }
  
  return {};
}
