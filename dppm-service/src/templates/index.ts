/**
 * Morgus Templates System
 * 
 * ALL outputs MUST use templates. AI only fills in content.
 * This ensures consistent, professional quality every time.
 */

export * from './website-templates';
export * from './app-templates';
export * from './chart-templates';
export * from './spreadsheet-templates';
export * from './document-templates';
export * from './email-templates';
export * from './presentation-templates';

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

import {
  ChartTemplateType,
  ChartData,
  detectChartTemplate,
  generateChart,
  generateDashboard,
} from './chart-templates';

import {
  SpreadsheetTemplateType,
  SpreadsheetData,
  detectSpreadsheetTemplate,
  generateSpreadsheet,
} from './spreadsheet-templates';

import {
  DocumentTemplateType,
  DocumentData,
  detectDocumentTemplate,
  generateDocument,
} from './document-templates';

import {
  EmailTemplateType,
  EmailData,
  detectEmailTemplate,
  generateEmail,
  generatePlainTextEmail,
} from './email-templates';

import {
  PresentationTemplateType,
  PresentationData,
  detectPresentationTemplate,
  generatePresentation,
} from './presentation-templates';

export type OutputType = 
  | 'website' 
  | 'app' 
  | 'chart' 
  | 'spreadsheet' 
  | 'document' 
  | 'email' 
  | 'presentation' 
  | 'code';

export interface TemplateResult {
  type: OutputType;
  templateType: string;
  content: string;
  files: Array<{ name: string; content: string }>;
  plainText?: string; // For emails
}

/**
 * Detect what type of output the user wants
 */
export function detectOutputType(message: string): OutputType {
  const lower = message.toLowerCase();
  
  // Check for chart keywords
  if (
    lower.includes('chart') ||
    lower.includes('graph') ||
    lower.includes('visualization') ||
    lower.includes('pie chart') ||
    lower.includes('bar chart') ||
    lower.includes('line chart') ||
    lower.includes('dashboard') ||
    lower.includes('kpi')
  ) {
    return 'chart';
  }
  
  // Check for spreadsheet keywords
  if (
    lower.includes('spreadsheet') ||
    lower.includes('excel') ||
    lower.includes('csv') ||
    lower.includes('budget') ||
    lower.includes('invoice') ||
    lower.includes('expense') ||
    lower.includes('inventory') ||
    lower.includes('tracker') ||
    lower.includes('table') ||
    lower.includes('data table')
  ) {
    return 'spreadsheet';
  }
  
  // Check for presentation keywords
  if (
    lower.includes('presentation') ||
    lower.includes('slide') ||
    lower.includes('deck') ||
    lower.includes('pitch deck') ||
    lower.includes('powerpoint') ||
    lower.includes('ppt') ||
    lower.includes('keynote')
  ) {
    return 'presentation';
  }
  
  // Check for email keywords
  if (
    lower.includes('email') ||
    lower.includes('newsletter') ||
    lower.includes('mail') ||
    lower.includes('outreach')
  ) {
    return 'email';
  }
  
  // Check for document keywords
  if (
    lower.includes('document') ||
    lower.includes('report') ||
    lower.includes('proposal') ||
    lower.includes('contract') ||
    lower.includes('resume') ||
    lower.includes('cv') ||
    lower.includes('cover letter') ||
    lower.includes('letter') ||
    lower.includes('memo') ||
    lower.includes('whitepaper') ||
    lower.includes('case study') ||
    lower.includes('pdf')
  ) {
    return 'document';
  }
  
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
  
  // Default to code for other requests
  return 'code';
}

/**
 * Generate output from template based on user message and AI-generated content
 */
export function generateFromTemplate(
  message: string,
  aiContent: Record<string, any>
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
  
  if (outputType === 'chart') {
    const templateType = detectChartTemplate(message);
    const chartData: ChartData = {
      title: aiContent.title || 'Chart',
      subtitle: aiContent.subtitle,
      labels: aiContent.labels || [],
      datasets: aiContent.datasets || [],
      options: aiContent.options,
    };
    
    const html = generateChart(templateType, chartData);
    
    return {
      type: 'chart',
      templateType,
      content: html,
      files: [
        { name: 'chart.html', content: html },
      ],
    };
  }
  
  if (outputType === 'spreadsheet') {
    const templateType = detectSpreadsheetTemplate(message);
    const spreadsheetData: SpreadsheetData = {
      title: aiContent.title || 'Spreadsheet',
      subtitle: aiContent.subtitle,
      headers: aiContent.headers || [],
      rows: aiContent.rows || [],
      totals: aiContent.totals,
      metadata: aiContent.metadata,
      formatting: aiContent.formatting,
    };
    
    const html = generateSpreadsheet(templateType, spreadsheetData);
    
    return {
      type: 'spreadsheet',
      templateType,
      content: html,
      files: [
        { name: 'spreadsheet.html', content: html },
      ],
    };
  }
  
  if (outputType === 'document') {
    const templateType = detectDocumentTemplate(message);
    const documentData: DocumentData = {
      title: aiContent.title || 'Document',
      subtitle: aiContent.subtitle,
      author: aiContent.author,
      date: aiContent.date || new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
      recipient: aiContent.recipient,
      sender: aiContent.sender,
      sections: aiContent.sections || [{ content: aiContent.content || '' }],
      footer: aiContent.footer,
      logo: aiContent.logo,
      theme: aiContent.theme,
    };
    
    const html = generateDocument(templateType, documentData);
    
    return {
      type: 'document',
      templateType,
      content: html,
      files: [
        { name: `${templateType}.html`, content: html },
      ],
    };
  }
  
  if (outputType === 'email') {
    const templateType = detectEmailTemplate(message);
    const emailData: EmailData = {
      subject: aiContent.subject || aiContent.title || 'Email',
      preheader: aiContent.preheader,
      sender: aiContent.sender || { name: 'Sender' },
      recipient: aiContent.recipient,
      greeting: aiContent.greeting,
      body: aiContent.body || aiContent.content || '',
      signature: aiContent.signature,
      cta: aiContent.cta,
      footer: aiContent.footer,
      unsubscribe: aiContent.unsubscribe,
      theme: aiContent.theme,
      brandColor: aiContent.brandColor,
    };
    
    const html = generateEmail(templateType, emailData);
    const plainText = generatePlainTextEmail(emailData);
    
    return {
      type: 'email',
      templateType,
      content: html,
      plainText,
      files: [
        { name: 'email.html', content: html },
        { name: 'email.txt', content: plainText },
      ],
    };
  }
  
  if (outputType === 'presentation') {
    const templateType = detectPresentationTemplate(message);
    const presentationData: PresentationData = {
      title: aiContent.title || 'Presentation',
      subtitle: aiContent.subtitle,
      author: aiContent.author,
      company: aiContent.company,
      logo: aiContent.logo,
      date: aiContent.date,
      slides: aiContent.slides || [],
      theme: aiContent.theme,
      brandColor: aiContent.brandColor,
    };
    
    const html = generatePresentation(templateType, presentationData);
    
    return {
      type: 'presentation',
      templateType,
      content: html,
      files: [
        { name: 'presentation.html', content: html },
      ],
    };
  }
  
  // For code, return the AI content as-is
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
  
  if (outputType === 'chart') {
    return `Based on the user's request, generate ONLY the data for a chart. Do NOT generate code.

User Request: ${message}

Respond with a JSON object containing:
{
  "title": "Chart title",
  "subtitle": "Optional subtitle or description",
  "labels": ["Label 1", "Label 2", "Label 3", ...],
  "datasets": [
    {
      "label": "Dataset name",
      "data": [10, 20, 30, ...],
      "color": "#00f5ff"
    }
  ],
  "options": {
    "showLegend": true,
    "showGrid": true,
    "animate": true
  }
}

IMPORTANT:
- Generate realistic data that matches the user's request.
- Use neon colors like #00f5ff, #ff00ff, #00ff88 for a modern look.
- Ensure data values are appropriate for the chart type.
- Respond with ONLY the JSON object, no markdown or explanation.`;
  }
  
  if (outputType === 'spreadsheet') {
    return `Based on the user's request, generate ONLY the data for a spreadsheet. Do NOT generate code.

User Request: ${message}

Respond with a JSON object containing:
{
  "title": "Spreadsheet title",
  "subtitle": "Optional subtitle",
  "headers": ["Column 1", "Column 2", "Column 3", ...],
  "rows": [
    ["Row 1 Col 1", "Row 1 Col 2", 100],
    ["Row 2 Col 1", "Row 2 Col 2", 200],
    ...
  ],
  "totals": ["Total", "", 300],
  "metadata": {
    "author": "Author name",
    "date": "Date",
    "company": "Company name"
  },
  "formatting": {
    "currencyColumns": [2],
    "percentColumns": [],
    "highlightColumn": 0
  }
}

IMPORTANT:
- Generate realistic data that matches the user's request.
- Use appropriate column types (text, numbers, currency, percentages).
- Include totals row if applicable.
- Respond with ONLY the JSON object, no markdown or explanation.`;
  }
  
  if (outputType === 'document') {
    return `Based on the user's request, generate ONLY the content for a document. Do NOT generate HTML code.

User Request: ${message}

Respond with a JSON object containing:
{
  "title": "Document title",
  "subtitle": "Optional subtitle",
  "author": "Author name",
  "date": "Date",
  "recipient": {
    "name": "Recipient name",
    "title": "Job title",
    "company": "Company",
    "address": "Address"
  },
  "sender": {
    "name": "Sender name",
    "title": "Job title",
    "company": "Company",
    "address": "Address",
    "email": "email@example.com",
    "phone": "Phone number"
  },
  "sections": [
    { "title": "Section Title", "content": "Section content...", "type": "text" },
    { "title": "Key Points", "content": "- Point 1\\n- Point 2\\n- Point 3", "type": "list" }
  ],
  "footer": "Footer text",
  "theme": "professional"
}

IMPORTANT:
- Generate professional, well-written content.
- Use appropriate sections for the document type.
- Theme options: "professional", "modern", "minimal", "creative"
- Respond with ONLY the JSON object, no markdown or explanation.`;
  }
  
  if (outputType === 'email') {
    return `Based on the user's request, generate ONLY the content for an email. Do NOT generate HTML code.

User Request: ${message}

Respond with a JSON object containing:
{
  "subject": "Email subject line",
  "preheader": "Preview text shown in inbox",
  "sender": {
    "name": "Sender name",
    "email": "sender@example.com",
    "company": "Company name",
    "title": "Job title"
  },
  "recipient": {
    "name": "Recipient name",
    "company": "Company"
  },
  "greeting": "Hi [Name],",
  "body": [
    { "type": "text", "content": "Opening paragraph..." },
    { "type": "heading", "content": "Section Heading" },
    { "type": "text", "content": "More content..." },
    { "type": "list", "content": "- Item 1\\n- Item 2\\n- Item 3" },
    { "type": "button", "content": "Click Here", "url": "https://example.com" }
  ],
  "signature": {
    "name": "Your Name",
    "title": "Job Title",
    "company": "Company",
    "phone": "Phone",
    "website": "https://example.com"
  },
  "cta": {
    "text": "Primary CTA",
    "url": "https://example.com"
  },
  "theme": "light"
}

IMPORTANT:
- Write compelling, professional email content.
- Keep paragraphs concise and scannable.
- Theme options: "light", "dark", "branded"
- Respond with ONLY the JSON object, no markdown or explanation.`;
  }
  
  if (outputType === 'presentation') {
    return `Based on the user's request, generate ONLY the content for a presentation. Do NOT generate code.

User Request: ${message}

Respond with a JSON object containing:
{
  "title": "Presentation title",
  "subtitle": "Subtitle or tagline",
  "author": "Presenter name",
  "company": "Company name",
  "date": "Date",
  "theme": "neon",
  "slides": [
    { "type": "title", "title": "Main Title", "subtitle": "Subtitle" },
    { "type": "content", "title": "Slide Title", "content": ["Bullet point 1", "Bullet point 2", "Bullet point 3"] },
    { "type": "stats", "title": "Key Metrics", "stats": [
      { "value": "100K+", "label": "Users" },
      { "value": "$5M", "label": "Revenue" },
      { "value": "50%", "label": "Growth" }
    ]},
    { "type": "quote", "quote": { "text": "Quote text here", "author": "Author Name", "role": "Title" } },
    { "type": "split", "title": "Comparison", "left": { "title": "Before", "content": "Description" }, "right": { "title": "After", "content": "Description" } },
    { "type": "cta", "title": "Get Started", "content": "Ready to begin?", "cta": { "text": "Contact Us", "url": "#" } }
  ]
}

IMPORTANT:
- Create a compelling narrative flow.
- Use 6-12 slides typically.
- Theme options: "dark", "light", "neon", "corporate"
- Slide types: title, content, image, split, quote, stats, team, timeline, comparison, cta
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
