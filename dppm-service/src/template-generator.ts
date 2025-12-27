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
 * Generate an image using OpenAI GPT-Image-1.5
 */
async function generateImageWithGPT(prompt: string, size: '1024x1024' | '1792x1024' | '1024x1792' = '1792x1024'): Promise<string> {
  if (!openaiApiKey) {
    console.log('[Image] No OpenAI API key, skipping image generation');
    return '';
  }
  
  try {
    console.log(`[Image] Generating with GPT-Image-1.5: ${prompt.substring(0, 50)}...`);
    
    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-image-1.5',
        prompt: prompt,
        n: 1,
        size: size,
        quality: 'standard',
        response_format: 'url',
      }),
    });
    
    if (!response.ok) {
      const error = await response.text();
      console.error('[Image] GPT-Image-1.5 API error:', error);
      return '';
    }
    
    const data = await response.json() as { data: Array<{ url: string }> };
    const imageUrl = data.data?.[0]?.url;
    
    if (imageUrl) {
      console.log('[Image] GPT-Image-1.5 generated successfully');
      return imageUrl;
    }
  } catch (e) {
    console.error('[Image] GPT-Image-1.5 generation failed:', e);
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
  
  return await generateImageWithGPT(prompt, '1792x1024');
}

/**
 * Generate a video using OpenAI Sora 2
 */
async function generateVideoWithSora(prompt: string, duration: number = 5): Promise<string> {
  if (!openaiApiKey) {
    console.log('[Video] No OpenAI API key, skipping video generation');
    return '';
  }
  
  try {
    console.log(`[Video] Generating with Sora 2: ${prompt.substring(0, 50)}...`);
    
    const response = await fetch('https://api.openai.com/v1/videos/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model: 'sora-2',
        prompt: prompt,
        duration: duration,
        quality: 'standard',
        response_format: 'url',
      }),
    });
    
    if (!response.ok) {
      const error = await response.text();
      console.error('[Video] Sora 2 API error:', error);
      return '';
    }
    
    const data = await response.json() as { data: Array<{ url: string }> };
    const videoUrl = data.data?.[0]?.url;
    
    if (videoUrl) {
      console.log('[Video] Sora 2 generated successfully');
      return videoUrl;
    }
  } catch (e) {
    console.error('[Video] Sora 2 generation failed:', e);
  }
  return '';
}

/**
 * Generate hero video for a website based on template type and content
 */
async function generateHeroVideo(templateType: string, title: string, description: string): Promise<string> {
  const styleMap: Record<string, string> = {
    'dating': 'romantic dreamy atmosphere with hearts floating, soft pink lighting, magical sparkles, love theme',
    'creative': 'artistic colorful paint splashes, creative energy, vibrant colors flowing, whimsical magical atmosphere',
    'personal': 'professional modern office environment, friendly welcoming vibe, warm natural lighting',
    'startup': 'futuristic tech environment, holographic interfaces, blue neon lights, innovation and progress',
    'saas': 'animated dashboard with data flowing, charts updating, modern software interface, professional blue tones',
    'restaurant': 'delicious food being prepared, steam rising, warm inviting kitchen, appetizing presentation',
    'ecommerce': 'products showcased elegantly, smooth camera movement, clean modern environment',
    'fitness': 'energetic workout scenes, dynamic movement, healthy lifestyle, motivating atmosphere',
    'healthcare': 'clean medical environment, caring professionals, trustworthy calming atmosphere',
    'education': 'inspiring learning environment, books and knowledge, bright encouraging atmosphere',
  };
  
  const style = styleMap[templateType] || 'modern professional clean environment with smooth camera movement';
  const prompt = `Create a cinematic hero video for "${title}": ${description.substring(0, 100)}. Style: ${style}. Smooth camera movement, no text, suitable for website hero background. High quality, professional.`;
  
  return await generateVideoWithSora(prompt, 5);
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
  
  return await generateImageWithGPT(prompt, '1024x1024');
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
    
    // Generate images and video in parallel for speed
    console.log('[Template] Generating hero image, logo, and video with GPT-Image-1.5 and Sora 2...');
    const [heroImage, logoImage, heroVideo] = await Promise.all([
      generateHeroImage(templateType, title, description),
      generateLogo(title, templateType, primaryColor),
      generateHeroVideo(templateType, title, description)
    ]);
    console.log(`[Template] Media generated: hero=${!!heroImage}, logo=${!!logoImage}, video=${!!heroVideo}`);
    
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
        heroVideo: heroVideo || contentData.images?.heroVideo,
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

/**
 * Get content generation prompt for AI
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
- Return ONLY the JSON object, no markdown, no code blocks, no explanations
- Make the content relevant to: ${goal}
- Use appropriate colors for ${templateType} template
- Generate 4-6 features
- Include 2-3 pricing tiers if relevant (omit if not applicable)
- Include 3 testimonials with realistic names and roles
- Make it professional and compelling`;
  }
  
  if (outputType === 'app') {
    const templateType = detectAppTemplate(goal);
    
    return `You are generating CONTENT for a ${templateType} app. Do NOT generate any code.

User Request: ${goal}

Generate a JSON object with the following content:
{
  "name": "App name",
  "description": "App description",
  "primaryColor": "#hex",
  "accentColor": "#hex",
  "features": [
    { "title": "Feature Name", "description": "Feature description" }
  ]
}

Return ONLY the JSON object, no markdown, no explanations.`;
  }
  
  return `Generate content for: ${goal}`;
}
