/**
 * Template-Based Generation
 * 
 * ALL websites and apps MUST use templates.
 * AI only generates content, not structure.
 */

import { 
  detectOutputType,
  detectWebsiteTemplate,
  detectAppTemplate,
  generateWebsite,
  generateApp,
  WebsiteData,
  AppData
} from './templates';

/**
 * Generate an image using Pollinations.ai (FREE, no API key needed)
 */
async function generateImage(prompt: string, width: number = 1024, height: number = 768): Promise<string> {
  try {
    const encodedPrompt = encodeURIComponent(prompt);
    const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${width}&height=${height}&nologo=true&enhance=true`;
    
    // Verify the image is accessible
    const response = await fetch(imageUrl, { method: 'HEAD' });
    if (response.ok) {
      console.log(`[Image] Generated: ${prompt.substring(0, 50)}...`);
      return imageUrl;
    }
  } catch (e) {
    console.error('[Image] Generation failed:', e);
  }
  return '';
}

/**
 * Generate hero image for a website based on template type and content
 */
async function generateHeroImage(templateType: string, title: string, description: string): Promise<string> {
  const styleMap: Record<string, string> = {
    'dating': 'romantic, hearts, love, soft pink and red colors, dreamy atmosphere',
    'creative': 'artistic, colorful, whimsical, fantasy, magical, creative',
    'personal': 'professional portrait style, friendly, approachable, warm lighting',
    'startup': 'modern tech, futuristic, clean design, professional, blue tones',
    'saas': 'dashboard interface, data visualization, professional, modern',
    'restaurant': 'delicious food photography, warm lighting, appetizing',
    'ecommerce': 'product showcase, clean background, professional photography',
    'fitness': 'athletic, energetic, healthy lifestyle, dynamic',
    'healthcare': 'medical, clean, trustworthy, caring, professional',
    'education': 'learning, books, knowledge, bright, inspiring',
  };
  
  const style = styleMap[templateType] || 'modern, professional, clean design';
  const prompt = `Hero image for ${title}: ${description}. Style: ${style}. High quality, professional, suitable for website hero section.`;
  
  return await generateImage(prompt, 1200, 800);
}

/**
 * Generate logo for a website
 */
async function generateLogo(title: string, templateType: string, primaryColor: string): Promise<string> {
  const styleMap: Record<string, string> = {
    'dating': 'romantic, heart shape, elegant',
    'creative': 'artistic, colorful, unique, playful',
    'personal': 'minimalist, professional, monogram style',
    'startup': 'modern, tech, geometric, clean',
    'restaurant': 'elegant, food-related, warm',
    'fitness': 'dynamic, energetic, strong',
  };
  
  const style = styleMap[templateType] || 'modern, minimalist, professional';
  const prompt = `Logo design for "${title}". Style: ${style}. Clean vector-style logo, simple, memorable, ${primaryColor} color scheme. White background, centered.`;
  
  return await generateImage(prompt, 512, 512);
}

export interface GenerationResult {
  type: 'website' | 'app' | 'document' | 'code';
  templateType: string;
  html?: string;
  code?: string;
  files: Array<{ name: string; content: string }>;
}

/**
 * Generate website/app from AI-generated content using templates
 */
export async function generateFromContent(
  goal: string,
  aiContent: string,
  config: { openrouter_api_key: string; gemini_api_key: string; openai_api_key: string }
): Promise<GenerationResult> {
  const outputType = detectOutputType(goal);
  const year = new Date().getFullYear();
  
  // Parse the AI content to extract structured data
  const contentData = parseContentFromAI(aiContent, goal);
  
  if (outputType === 'website') {
    const templateType = detectWebsiteTemplate(goal);
    console.log(`[Template] Using website template: ${templateType}`);
    
    const title = contentData.title || extractTitle(goal);
    const tagline = contentData.tagline || extractTagline(goal);
    const description = contentData.description || goal;
    const primaryColor = contentData.primaryColor || getDefaultColor(templateType);
    
    // Generate images in parallel for speed
    console.log('[Template] Generating hero image and logo...');
    const [heroImage, logoImage] = await Promise.all([
      generateHeroImage(templateType, title, description),
      generateLogo(title, templateType, primaryColor)
    ]);
    console.log(`[Template] Images generated: hero=${!!heroImage}, logo=${!!logoImage}`);
    
    const websiteData: WebsiteData = {
      title,
      tagline,
      description,
      primaryColor,
      accentColor: contentData.accentColor || getAccentColor(primaryColor),
      features: contentData.features || generateDefaultFeatures(goal),
      pricing: contentData.pricing,
      testimonials: contentData.testimonials || generateDefaultTestimonials(),
      cta: contentData.cta || { text: 'Get Started', secondaryText: 'Learn More' },
      images: {
        hero: heroImage || contentData.images?.hero,
        logo: logoImage || contentData.images?.logo,
        ...contentData.images
      },
      socialLinks: contentData.socialLinks,
      contact: contentData.contact,
      year,
    };
    
    const html = generateWebsite(templateType, websiteData);
    
    return {
      type: 'website',
      templateType,
      html,
      files: [{ name: 'index.html', content: html }],
    };
  }
  
  if (outputType === 'app') {
    const templateType = detectAppTemplate(goal);
    console.log(`[Template] Using app template: ${templateType}`);
    
    const appData: AppData = {
      name: contentData.title || extractTitle(goal),
      description: contentData.description || goal,
      theme: {
        primaryColor: contentData.primaryColor || '#6366f1',
        accentColor: contentData.accentColor || '#8b5cf6',
      },
      features: contentData.features,
      year,
    };
    
    const code = generateApp(templateType, appData);
    
    return {
      type: 'app',
      templateType,
      code,
      files: [{ name: 'App.tsx', content: code }],
    };
  }
  
  // For documents and code, return the AI content as-is
  return {
    type: outputType,
    templateType: 'custom',
    files: [],
  };
}

/**
 * Parse structured content from AI response
 */
function parseContentFromAI(aiContent: string, goal: string): Record<string, any> {
  const result: Record<string, any> = {};
  
  // Try to extract JSON if present
  try {
    const jsonMatch = aiContent.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return { ...result, ...parsed };
    }
  } catch (e) {
    // Not JSON, try to extract from text
  }
  
  // Extract title from various patterns
  const titlePatterns = [
    /(?:title|name|heading):\s*["']?([^"'\n]+)["']?/i,
    /^#\s+(.+)$/m,
    /^(.+?)\s*[-–—]\s/,
  ];
  
  for (const pattern of titlePatterns) {
    const match = aiContent.match(pattern);
    if (match) {
      result.title = match[1].trim();
      break;
    }
  }
  
  // Extract tagline
  const taglinePatterns = [
    /(?:tagline|subtitle|slogan):\s*["']?([^"'\n]+)["']?/i,
    /^>\s*(.+)$/m,
  ];
  
  for (const pattern of taglinePatterns) {
    const match = aiContent.match(pattern);
    if (match) {
      result.tagline = match[1].trim();
      break;
    }
  }
  
  // Extract features from bullet points
  const featureMatches = aiContent.match(/[-*]\s+\*?\*?([^*\n]+)\*?\*?:\s*([^\n]+)/g);
  if (featureMatches && featureMatches.length >= 2) {
    result.features = featureMatches.slice(0, 6).map((match, i) => {
      const parts = match.replace(/^[-*]\s+/, '').split(':');
      return {
        title: parts[0].replace(/\*+/g, '').trim(),
        description: parts[1]?.trim() || '',
        icon: getFeatureIcon(i),
      };
    });
  }
  
  // Extract colors
  const colorMatch = aiContent.match(/#[0-9a-fA-F]{6}/g);
  if (colorMatch) {
    result.primaryColor = colorMatch[0];
    if (colorMatch[1]) result.accentColor = colorMatch[1];
  }
  
  return result;
}

/**
 * Extract title from goal
 */
function extractTitle(goal: string): string {
  // Remove common prefixes
  let title = goal
    .replace(/^(create|build|make|design|develop)\s+(a|an|the)?\s*/i, '')
    .replace(/\s+(landing page|website|web page|site|app|application).*$/i, '')
    .trim();
  
  // Capitalize first letter of each word
  title = title.replace(/\b\w/g, c => c.toUpperCase());
  
  return title || 'My Project';
}

/**
 * Extract tagline from goal
 */
function extractTagline(goal: string): string {
  const lower = goal.toLowerCase();
  
  // Try to extract purpose
  if (lower.includes('for')) {
    const forMatch = goal.match(/for\s+(.+?)(?:\.|$)/i);
    if (forMatch) {
      return `The best solution for ${forMatch[1].trim()}`;
    }
  }
  
  // Generate based on keywords
  if (lower.includes('saas') || lower.includes('software')) {
    return 'Powerful software to transform your workflow';
  }
  if (lower.includes('restaurant') || lower.includes('food')) {
    return 'Delicious food, unforgettable experiences';
  }
  if (lower.includes('portfolio')) {
    return 'Showcasing creative excellence';
  }
  if (lower.includes('ecommerce') || lower.includes('shop')) {
    return 'Shop the best products at amazing prices';
  }
  
  return 'Welcome to the future of innovation';
}

/**
 * Get default color based on template type
 */
function getDefaultColor(templateType: string): string {
  const colors: Record<string, string> = {
    saas: '#6366f1',
    'mobile-app': '#3b82f6',
    game: '#8b5cf6',
    portfolio: '#10b981',
    ecommerce: '#f59e0b',
    restaurant: '#ef4444',
    agency: '#ec4899',
    blog: '#14b8a6',
    event: '#f97316',
    startup: '#6366f1',
    personal: '#8b5cf6',
    product: '#3b82f6',
    nonprofit: '#10b981',
    education: '#0ea5e9',
    healthcare: '#06b6d4',
    realestate: '#84cc16',
    fitness: '#ef4444',
    entertainment: '#a855f7',
  };
  
  return colors[templateType] || '#6366f1';
}

/**
 * Get accent color based on primary color
 */
function getAccentColor(primaryColor: string): string {
  // Simple hue shift for accent
  const hex = primaryColor.replace('#', '');
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  
  // Shift hue by rotating RGB
  const newR = Math.min(255, Math.max(0, g + 30));
  const newG = Math.min(255, Math.max(0, b + 30));
  const newB = Math.min(255, Math.max(0, r + 30));
  
  return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
}

/**
 * Generate default features based on goal
 */
function generateDefaultFeatures(goal: string): Array<{ title: string; description: string; icon: string }> {
  const lower = goal.toLowerCase();
  
  if (lower.includes('saas') || lower.includes('software')) {
    return [
      { title: 'Lightning Fast', description: 'Optimized performance for the best user experience', icon: '⚡' },
      { title: 'Secure by Default', description: 'Enterprise-grade security to protect your data', icon: '🔒' },
      { title: 'Easy Integration', description: 'Connect with your favorite tools in minutes', icon: '🔗' },
      { title: 'Analytics Dashboard', description: 'Real-time insights to drive better decisions', icon: '📊' },
      { title: '24/7 Support', description: 'Our team is always here to help you succeed', icon: '💬' },
      { title: 'Scalable Infrastructure', description: 'Grows with your business without limits', icon: '🚀' },
    ];
  }
  
  if (lower.includes('restaurant') || lower.includes('food')) {
    return [
      { title: 'Fresh Ingredients', description: 'Locally sourced, always fresh', icon: '🥗' },
      { title: 'Expert Chefs', description: 'Culinary masters crafting every dish', icon: '👨‍🍳' },
      { title: 'Cozy Atmosphere', description: 'Perfect ambiance for any occasion', icon: '🕯️' },
      { title: 'Online Ordering', description: 'Easy ordering for pickup or delivery', icon: '📱' },
      { title: 'Private Events', description: 'Host your special occasions with us', icon: '🎉' },
      { title: 'Loyalty Rewards', description: 'Earn points with every visit', icon: '⭐' },
    ];
  }
  
  if (lower.includes('portfolio')) {
    return [
      { title: 'Creative Design', description: 'Unique and memorable visual experiences', icon: '🎨' },
      { title: 'Attention to Detail', description: 'Every pixel crafted with precision', icon: '🔍' },
      { title: 'User-Centered', description: 'Designs that put users first', icon: '👥' },
      { title: 'Modern Techniques', description: 'Using the latest design trends and tools', icon: '✨' },
      { title: 'Fast Delivery', description: 'Quality work delivered on time', icon: '⏱️' },
      { title: 'Collaborative Process', description: 'Working together to achieve your vision', icon: '🤝' },
    ];
  }
  
  // Default features
  return [
    { title: 'Easy to Use', description: 'Intuitive design that anyone can master', icon: '✨' },
    { title: 'Reliable', description: 'Built to work flawlessly every time', icon: '🎯' },
    { title: 'Secure', description: 'Your data is protected and private', icon: '🔒' },
    { title: 'Fast', description: 'Optimized for speed and performance', icon: '⚡' },
    { title: 'Support', description: 'Help when you need it most', icon: '💬' },
    { title: 'Affordable', description: 'Great value for your investment', icon: '💎' },
  ];
}

/**
 * Generate default testimonials
 */
function generateDefaultTestimonials(): Array<{ name: string; role: string; quote: string; company?: string }> {
  return [
    {
      name: 'Sarah Johnson',
      role: 'CEO',
      company: 'TechStart Inc.',
      quote: 'This has completely transformed how we work. The results speak for themselves.',
    },
    {
      name: 'Michael Chen',
      role: 'Product Manager',
      company: 'Innovation Labs',
      quote: 'Incredible quality and attention to detail. Highly recommended!',
    },
    {
      name: 'Emily Rodriguez',
      role: 'Founder',
      company: 'Creative Studio',
      quote: 'The best decision we made this year. Our team loves it.',
    },
  ];
}

/**
 * Get feature icon by index
 */
function getFeatureIcon(index: number): string {
  const icons = ['⚡', '🎯', '🔒', '📊', '💬', '🚀', '✨', '🔗', '💎', '🌟'];
  return icons[index % icons.length];
}

/**
 * Get the content generation prompt for AI
 */
export function getContentGenerationPrompt(goal: string): string {
  const outputType = detectOutputType(goal);
  const year = new Date().getFullYear();
  
  if (outputType === 'website') {
    const templateType = detectWebsiteTemplate(goal);
    
    return `You are generating CONTENT for a ${templateType} website. Do NOT generate any HTML, CSS, or code.

User Request: ${goal}

Generate a JSON object with the following content:
{
  "title": "The website/company name",
  "tagline": "A compelling one-line tagline (max 100 chars)",
  "description": "A brief description (max 200 chars)",
  "primaryColor": "A hex color that fits the brand (e.g., #6366f1)",
  "accentColor": "A complementary hex color",
  "features": [
    { "title": "Feature Name", "description": "Feature description", "icon": "emoji" }
  ],
  "pricing": [
    { "name": "Plan Name", "price": "$X", "features": ["Feature 1", "Feature 2"], "highlighted": false }
  ],
  "testimonials": [
    { "name": "Person Name", "role": "Job Title", "company": "Company", "quote": "Testimonial text" }
  ],
  "cta": { "text": "Primary button text", "secondaryText": "Secondary button text" }
}

IMPORTANT:
- Current year is ${year}
- Generate realistic, professional content
- Choose colors that fit the ${templateType} industry
- Create 4-6 specific, valuable features
- Include 2-3 pricing tiers if appropriate
- Generate 2-3 believable testimonials
- Respond with ONLY the JSON object`;
  }
  
  if (outputType === 'app') {
    const templateType = detectAppTemplate(goal);
    
    return `You are generating CONTENT for a ${templateType} mobile app. Do NOT generate any code.

User Request: ${goal}

Generate a JSON object with:
{
  "title": "The app name",
  "description": "Brief app description (max 200 chars)",
  "primaryColor": "A hex color (e.g., #6366f1)",
  "accentColor": "A complementary hex color",
  "features": [
    { "title": "Feature Name", "description": "Feature description", "icon": "emoji" }
  ]
}

Current year is ${year}. Respond with ONLY the JSON object.`;
  }
  
  return goal;
}
