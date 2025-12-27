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
  AppData,
  OutputType
} from './templates';

// Store OpenAI API key for image generation
let openaiApiKey: string = '';

/**
 * Set the OpenAI API key for image generation
 */
export function setOpenAIKey(key: string) {
  openaiApiKey = key;
}

/**
 * Generate an image using OpenAI DALL-E 3
 */
async function generateImageWithDALLE(prompt: string, size: '1024x1024' | '1792x1024' | '1024x1792' = '1792x1024'): Promise<string> {
  if (!openaiApiKey) {
    console.log('[Image] No OpenAI API key, skipping image generation');
    return '';
  }
  
  try {
    console.log(`[Image] Generating with DALL-E: ${prompt.substring(0, 50)}...`);
    
    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model: 'dall-e-3',
        prompt: prompt,
        n: 1,
        size: size,
        quality: 'standard',
        response_format: 'url',
      }),
    });
    
    if (!response.ok) {
      const error = await response.text();
      console.error('[Image] DALL-E API error:', error);
      return '';
    }
    
    const data = await response.json() as { data: Array<{ url: string }> };
    const imageUrl = data.data?.[0]?.url;
    
    if (imageUrl) {
      console.log('[Image] DALL-E generated successfully');
      return imageUrl;
    }
  } catch (e) {
    console.error('[Image] DALL-E generation failed:', e);
  }
  return '';
}

/**
 * Generate hero image for a website based on template type and content
 */
async function generateHeroImage(templateType: string, title: string, description: string): Promise<string> {
  const styleMap: Record<string, string> = {
    'dating': 'romantic illustration with hearts, love theme, soft pink and red colors, dreamy magical atmosphere, cute cartoon style',
    'creative': 'artistic colorful illustration, whimsical fantasy style, magical creative design, vibrant colors',
    'personal': 'professional modern illustration, friendly approachable style, warm lighting, clean design',
    'startup': 'modern tech illustration, futuristic clean design, professional blue tones, innovation theme',
    'saas': 'dashboard interface illustration, data visualization, professional modern software theme',
    'restaurant': 'delicious food illustration, warm inviting atmosphere, appetizing presentation',
    'ecommerce': 'product showcase illustration, clean modern design, shopping theme',
    'fitness': 'athletic energetic illustration, healthy lifestyle, dynamic movement',
    'healthcare': 'medical illustration, clean trustworthy caring professional style',
    'education': 'learning illustration, books knowledge theme, bright inspiring colors',
  };
  
  const style = styleMap[templateType] || 'modern professional clean design illustration';
  const prompt = `Create a hero illustration for "${title}": ${description.substring(0, 100)}. Style: ${style}. Make it suitable for a website hero section, no text in the image.`;
  
  return await generateImageWithDALLE(prompt, '1792x1024');
}

/**
 * Generate logo for a website
 */
async function generateLogo(title: string, templateType: string, primaryColor: string): Promise<string> {
  const styleMap: Record<string, string> = {
    'dating': 'romantic heart-shaped elegant logo',
    'creative': 'artistic colorful unique playful logo',
    'personal': 'minimalist professional monogram style logo',
    'startup': 'modern tech geometric clean logo',
    'restaurant': 'elegant food-related warm logo',
    'fitness': 'dynamic energetic strong logo',
  };
  
  const style = styleMap[templateType] || 'modern minimalist professional logo';
  const prompt = `Create a simple ${style} for "${title}". Clean vector-style, memorable design, ${primaryColor} color scheme, white background, centered, no text.`;
  
  return await generateImageWithDALLE(prompt, '1024x1024');
}

export interface GenerationResult {
  type: OutputType;
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
  // Set the OpenAI key for image generation
  if (config.openai_api_key) {
    setOpenAIKey(config.openai_api_key);
  }
  
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
    console.log('[Template] Generating hero image and logo with DALL-E...');
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
  
  // For other types (chart, spreadsheet, email, presentation, document, code), return as-is
  return {
    type: outputType as OutputType,
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
    travel: '#0ea5e9',
    music: '#a855f7',
    gaming: '#ef4444',
    dating: '#E91E63',
    creative: '#8b5cf6',
  };
  return colors[templateType] || '#6366f1';
}

/**
 * Get accent color based on primary color
 */
function getAccentColor(primaryColor: string): string {
  // Simple complementary color logic
  const accents: Record<string, string> = {
    '#6366f1': '#8b5cf6',
    '#3b82f6': '#0ea5e9',
    '#8b5cf6': '#a855f7',
    '#10b981': '#14b8a6',
    '#f59e0b': '#f97316',
    '#ef4444': '#f97316',
    '#ec4899': '#f472b6',
    '#14b8a6': '#06b6d4',
    '#f97316': '#f59e0b',
    '#0ea5e9': '#3b82f6',
    '#06b6d4': '#0ea5e9',
    '#84cc16': '#22c55e',
    '#a855f7': '#c084fc',
    '#E91E63': '#FFC107',
  };
  return accents[primaryColor] || '#8b5cf6';
}

/**
 * Get feature icon based on index
 */
function getFeatureIcon(index: number): string {
  const icons = ['✨', '🚀', '💡', '🎯', '⚡', '🔒', '📊', '🎨', '💪', '🌟'];
  return icons[index % icons.length];
}

/**
 * Generate default features based on goal
 */
function generateDefaultFeatures(goal: string): Array<{ title: string; description: string; icon: string }> {
  const lower = goal.toLowerCase();
  
  if (lower.includes('dating') || lower.includes('love')) {
    return [
      { title: 'Sparkling Profiles', description: 'Create a dazzling profile that showcases your unique personality', icon: '✨' },
      { title: 'Magical Matching', description: 'Our algorithm connects you with compatible matches', icon: '🌈' },
      { title: 'Enchanted Messaging', description: 'Communicate through our secure messaging system', icon: '💌' },
      { title: 'Crystal Ball Compatibility', description: 'See your compatibility percentage with other users', icon: '🔮' },
      { title: 'Rainbow Road Events', description: 'Attend exclusive virtual and in-person events', icon: '🦄' },
      { title: 'Safe & Secure', description: 'Your safety is our top priority with rigorous verification', icon: '🛡️' },
    ];
  }
  
  // Default features
  return [
    { title: 'Lightning Fast', description: 'Experience blazing fast performance that keeps you productive', icon: '⚡' },
    { title: 'Secure by Design', description: 'Enterprise-grade security to protect your data', icon: '🔒' },
    { title: 'Easy Integration', description: 'Connect with your favorite tools in minutes', icon: '🔗' },
    { title: 'Smart Analytics', description: 'Gain insights with powerful analytics dashboard', icon: '📊' },
    { title: '24/7 Support', description: 'Our team is always here to help you succeed', icon: '💬' },
    { title: 'Scalable', description: 'Grows with your business from startup to enterprise', icon: '🚀' },
  ];
}

/**
 * Generate default testimonials
 */
function generateDefaultTestimonials(): Array<{ quote: string; author: string; role: string; avatar?: string }> {
  return [
    {
      quote: "This product has completely transformed how we work. The results speak for themselves!",
      author: "Alex Johnson",
      role: "CEO at TechCorp",
    },
    {
      quote: "I was skeptical at first, but now I can't imagine going back. Absolutely incredible!",
      author: "Sarah Chen",
      role: "Product Manager at StartupXYZ",
    },
    {
      quote: "The best investment we've made this year. Our team productivity has skyrocketed.",
      author: "Michael Brown",
      role: "CTO at InnovateCo",
    },
  ];
}
