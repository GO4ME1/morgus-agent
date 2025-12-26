/**
 * Template Engine for Landing Page Generation
 * 
 * Features:
 * - Pre-made illustration library
 * - AI-generated illustrations fallback
 * - Section-based surgical editing
 * - 20+ template types
 */

// ============================================
// TYPES
// ============================================

export interface TemplateRequest {
  template: TemplateType;
  data: Record<string, any>;
  preferences?: {
    preferPreMade?: boolean;
    generateMissing?: boolean;
    cacheGenerated?: boolean;
    illustrationStyle?: IllustrationStyle;
  };
}

export type TemplateType = 
  | 'ai-saas-v1' 
  | 'minimal-launch-v1' 
  | 'creator-tool-v1'
  | 'agency-v1'
  | 'marketplace-v1'
  | 'dev-tool-v1'
  | 'mobile-app-v1'
  | 'web-app-v1'
  | 'game-landing-v1'
  | 'portfolio-v1'
  | 'ecommerce-v1'
  | 'blog-v1'
  | 'docs-v1'
  | 'community-v1'
  | 'event-v1'
  | 'restaurant-v1'
  | 'real-estate-v1'
  | 'education-v1'
  | 'crypto-v1'
  | 'nft-v1'
  | 'dashboard-v1'
  | 'onboarding-v1';

export type IllustrationStyle = 'minimal' | 'gradient' | 'isometric' | 'hand-drawn' | 'geometric';

export interface GeneratedPage {
  html: string;
  css: string;
  assets: string[];
  sections: SectionInfo[];
}

export interface SectionInfo {
  id: string;
  type: string;
  locked: boolean;
  editable: boolean;
}

export interface EditRequest {
  pageId: string;
  section: string;
  edits: Edit[];
}

export interface Edit {
  type: 'text' | 'image' | 'color' | 'layout' | 'add' | 'remove';
  selector: string;
  value: any;
}

// ============================================
// ILLUSTRATION LIBRARY
// ============================================

const ILLUSTRATION_LIBRARY: Record<string, Record<string, string[]>> = {
  hero: {
    minimal: [
      'hero-saas-dashboard',
      'hero-mobile-app',
      'hero-analytics',
      'hero-collaboration',
      'hero-automation'
    ],
    gradient: [
      'hero-ai-agent',
      'hero-cloud-platform',
      'hero-data-flow',
      'hero-integration',
      'hero-workflow'
    ],
    isometric: [
      'hero-office-3d',
      'hero-server-3d',
      'hero-mobile-3d',
      'hero-team-3d',
      'hero-growth-3d'
    ],
    'hand-drawn': [
      'hero-creative',
      'hero-startup',
      'hero-community',
      'hero-learning',
      'hero-journey'
    ],
    geometric: [
      'hero-tech-abstract',
      'hero-network',
      'hero-blocks',
      'hero-connections',
      'hero-patterns'
    ]
  },
  features: {
    icons: [
      'speed', 'security', 'scalability', 'analytics', 'automation',
      'integration', 'collaboration', 'customization', 'support', 'api',
      'cloud', 'mobile', 'desktop', 'sync', 'backup',
      'notifications', 'search', 'filter', 'export', 'import',
      'users', 'teams', 'roles', 'permissions', 'audit',
      'dashboard', 'reports', 'charts', 'metrics', 'kpi',
      'ai', 'ml', 'bot', 'assistant', 'chat',
      'payment', 'billing', 'subscription', 'invoice', 'receipt',
      'email', 'sms', 'push', 'webhook', 'api-key',
      'settings', 'config', 'theme', 'language', 'timezone'
    ]
  },
  process: {
    steps: [
      '3-step-horizontal',
      '3-step-vertical',
      '4-step-horizontal',
      '4-step-vertical',
      '5-step-timeline',
      'circular-process',
      'funnel',
      'pipeline'
    ]
  },
  devices: {
    mockups: [
      'laptop-macbook',
      'laptop-generic',
      'phone-iphone',
      'phone-android',
      'tablet-ipad',
      'desktop-imac',
      'multi-device',
      'browser-window'
    ]
  },
  people: {
    illustrations: [
      'team-collaboration',
      'remote-work',
      'customer-success',
      'support-agent',
      'developer',
      'designer',
      'manager',
      'founder'
    ]
  },
  abstract: {
    backgrounds: [
      'gradient-mesh',
      'wave-pattern',
      'dot-grid',
      'line-pattern',
      'blob-shapes',
      'geometric-shapes',
      'noise-texture',
      'aurora'
    ]
  }
};

// ============================================
// AI GENERATION PROMPTS
// ============================================

const AI_PROMPTS: Record<string, Record<string, string>> = {
  hero: {
    saas: "Modern minimalist illustration of {description}, clean lines, gradient colors {primaryColor} and {accentColor}, white background, vector style, professional, no text",
    app: "Isometric 3D illustration of {description} interface on smartphone, vibrant colors, modern design, floating UI elements, no text",
    game: "Epic {genre} game art featuring {description}, dramatic lighting, detailed environment, cinematic composition, no text",
    ecommerce: "Professional product photography style illustration of {description}, clean studio lighting, white background, high-end feel",
    creative: "Hand-drawn style illustration of {description}, organic lines, warm colors, friendly and approachable, no text"
  },
  icon: {
    minimal: "Simple line icon representing {concept}, monochrome, clean design, 64x64, transparent background",
    gradient: "Modern gradient icon for {concept}, {primaryColor} to {accentColor}, rounded corners, soft shadows",
    '3d': "3D rendered icon for {concept}, soft shadows, isometric view, vibrant colors, transparent background"
  },
  mockup: {
    laptop: "Professional product shot of {product} displayed on MacBook Pro screen, clean desk, natural lighting, 4K",
    phone: "iPhone 15 Pro mockup showing {product} interface, hand holding phone, lifestyle setting, professional",
    dashboard: "Modern dashboard UI screenshot for {product}, clean design, data visualizations, {primaryColor} accent"
  },
  character: {
    mascot: "Friendly cartoon mascot for {brand}, {description}, expressive, vector style, transparent background, full body",
    avatar: "Professional avatar, {description}, minimalist style, circular frame, modern art style",
    game: "Detailed game character, {description}, full body, action pose, {style} art style, high detail, transparent background"
  }
};

// ============================================
// TEMPLATE DEFINITIONS
// ============================================

const TEMPLATES: Record<TemplateType, TemplateDefinition> = {
  'ai-saas-v1': {
    name: 'AI SaaS Landing Page',
    sections: ['hero', 'features', 'how-it-works', 'pricing', 'testimonials', 'cta'],
    defaultStyle: 'gradient',
    schema: {
      hero: {
        headline: 'string',
        subheadline: 'string',
        cta: 'string',
        illustration: 'image'
      },
      features: {
        title: 'string',
        items: 'array'
      },
      'how-it-works': {
        title: 'string',
        steps: 'array',
        diagram: 'image'
      },
      pricing: {
        title: 'string',
        plans: 'array'
      },
      testimonials: {
        title: 'string',
        items: 'array'
      },
      cta: {
        headline: 'string',
        subheadline: 'string',
        button: 'string'
      }
    }
  },
  'mobile-app-v1': {
    name: 'Mobile App Landing Page',
    sections: ['hero', 'screenshots', 'features', 'testimonials', 'download'],
    defaultStyle: 'gradient',
    schema: {
      hero: {
        headline: 'string',
        subheadline: 'string',
        appStoreButton: 'boolean',
        playStoreButton: 'boolean',
        heroPhone: 'image'
      },
      screenshots: {
        title: 'string',
        images: 'array'
      },
      features: {
        title: 'string',
        items: 'array'
      },
      testimonials: {
        title: 'string',
        items: 'array'
      },
      download: {
        headline: 'string',
        qrCode: 'boolean'
      }
    }
  },
  'game-landing-v1': {
    name: 'Game Landing Page',
    sections: ['hero', 'gameplay', 'characters', 'features', 'roadmap', 'community', 'download'],
    defaultStyle: 'geometric',
    schema: {
      hero: {
        logo: 'image',
        tagline: 'string',
        trailerVideo: 'string',
        background: 'image'
      },
      gameplay: {
        title: 'string',
        media: 'array'
      },
      characters: {
        title: 'string',
        items: 'array'
      },
      features: {
        title: 'string',
        items: 'array'
      },
      roadmap: {
        title: 'string',
        phases: 'array'
      },
      community: {
        title: 'string',
        links: 'object'
      },
      download: {
        headline: 'string',
        platforms: 'array'
      }
    }
  },
  'dashboard-v1': {
    name: 'Dashboard Template',
    sections: ['sidebar', 'header', 'stats', 'charts', 'tables', 'activity'],
    defaultStyle: 'minimal',
    schema: {
      sidebar: {
        logo: 'image',
        navigation: 'array'
      },
      header: {
        search: 'boolean',
        notifications: 'boolean',
        userMenu: 'boolean'
      },
      stats: {
        items: 'array'
      },
      charts: {
        items: 'array'
      },
      tables: {
        items: 'array'
      },
      activity: {
        title: 'string',
        items: 'array'
      }
    }
  },
  'ecommerce-v1': {
    name: 'E-Commerce Store',
    sections: ['header', 'hero', 'categories', 'featured', 'features', 'testimonials', 'footer'],
    defaultStyle: 'minimal',
    schema: {
      header: {
        logo: 'image',
        navigation: 'array',
        cart: 'boolean'
      },
      hero: {
        slides: 'array'
      },
      categories: {
        title: 'string',
        items: 'array'
      },
      featured: {
        title: 'string',
        products: 'array'
      },
      features: {
        items: 'array'
      },
      testimonials: {
        title: 'string',
        items: 'array'
      },
      footer: {
        links: 'array',
        social: 'array'
      }
    }
  },
  // Add remaining templates with basic definitions
  'minimal-launch-v1': { name: 'Minimal Launch', sections: ['hero', 'problem', 'solution', 'waitlist'], defaultStyle: 'minimal', schema: {} },
  'creator-tool-v1': { name: 'Creator Tool', sections: ['hero', 'showcase', 'features', 'pricing', 'cta'], defaultStyle: 'gradient', schema: {} },
  'agency-v1': { name: 'Agency', sections: ['hero', 'services', 'portfolio', 'team', 'contact'], defaultStyle: 'minimal', schema: {} },
  'marketplace-v1': { name: 'Marketplace', sections: ['hero', 'categories', 'featured', 'how-it-works', 'cta'], defaultStyle: 'gradient', schema: {} },
  'dev-tool-v1': { name: 'Developer Tool', sections: ['hero', 'code-example', 'features', 'docs', 'pricing'], defaultStyle: 'minimal', schema: {} },
  'web-app-v1': { name: 'Web App', sections: ['hero', 'features', 'integrations', 'use-cases', 'pricing'], defaultStyle: 'gradient', schema: {} },
  'portfolio-v1': { name: 'Portfolio', sections: ['hero', 'projects', 'about', 'skills', 'contact'], defaultStyle: 'minimal', schema: {} },
  'blog-v1': { name: 'Blog', sections: ['header', 'featured', 'posts', 'sidebar', 'footer'], defaultStyle: 'minimal', schema: {} },
  'docs-v1': { name: 'Documentation', sections: ['sidebar', 'content', 'toc', 'footer'], defaultStyle: 'minimal', schema: {} },
  'community-v1': { name: 'Community', sections: ['hero', 'forums', 'members', 'events', 'join'], defaultStyle: 'gradient', schema: {} },
  'event-v1': { name: 'Event', sections: ['hero', 'agenda', 'speakers', 'sponsors', 'register'], defaultStyle: 'gradient', schema: {} },
  'restaurant-v1': { name: 'Restaurant', sections: ['hero', 'menu', 'gallery', 'about', 'reservations'], defaultStyle: 'hand-drawn', schema: {} },
  'real-estate-v1': { name: 'Real Estate', sections: ['hero', 'search', 'listings', 'agents', 'contact'], defaultStyle: 'minimal', schema: {} },
  'education-v1': { name: 'Education', sections: ['hero', 'courses', 'instructors', 'testimonials', 'enroll'], defaultStyle: 'gradient', schema: {} },
  'crypto-v1': { name: 'Crypto', sections: ['hero', 'tokenomics', 'roadmap', 'team', 'whitepaper'], defaultStyle: 'geometric', schema: {} },
  'nft-v1': { name: 'NFT', sections: ['hero', 'collection', 'mint', 'roadmap', 'faq'], defaultStyle: 'geometric', schema: {} },
  'onboarding-v1': { name: 'Onboarding', sections: ['welcome', 'steps', 'progress', 'complete'], defaultStyle: 'gradient', schema: {} }
};

interface TemplateDefinition {
  name: string;
  sections: string[];
  defaultStyle: IllustrationStyle;
  schema: Record<string, any>;
}

// ============================================
// TEMPLATE ENGINE CLASS
// ============================================

export class TemplateEngine {
  private env: {
    OPENAI_API_KEY?: string;
    ILLUSTRATION_CDN_URL?: string;
  };

  constructor(env: any) {
    this.env = env;
  }

  /**
   * Generate a complete landing page from template
   */
  async generatePage(request: TemplateRequest): Promise<GeneratedPage> {
    const template = TEMPLATES[request.template];
    if (!template) {
      throw new Error(`Unknown template: ${request.template}`);
    }

    const style = request.preferences?.illustrationStyle || template.defaultStyle;
    const assets: string[] = [];
    const sections: SectionInfo[] = [];

    // Process each section
    let html = this.getBaseHTML(request.template, request.data);
    
    for (const sectionName of template.sections) {
      const sectionData = request.data[sectionName] || {};
      
      // Get illustrations for section
      const sectionAssets = await this.getAssetsForSection(
        sectionName,
        sectionData,
        style,
        request.preferences
      );
      assets.push(...sectionAssets);

      // Build section HTML
      const sectionHtml = this.buildSection(sectionName, sectionData, sectionAssets);
      html = html.replace(`{{section:${sectionName}}}`, sectionHtml);

      sections.push({
        id: sectionName,
        type: sectionName,
        locked: false,
        editable: true
      });
    }

    const css = this.getTemplateCSS(request.template, style, request.data.theme);

    return { html, css, assets, sections };
  }

  /**
   * Edit a specific section of an existing page
   */
  async editSection(pageHtml: string, request: EditRequest): Promise<string> {
    // Parse HTML
    const sectionRegex = new RegExp(
      `<section[^>]*data-morgus-section="${request.section}"[^>]*>([\\s\\S]*?)<\\/section>`,
      'i'
    );

    const match = pageHtml.match(sectionRegex);
    if (!match) {
      throw new Error(`Section not found: ${request.section}`);
    }

    // Check if section is locked
    if (match[0].includes('data-morgus-lock="true"')) {
      throw new Error(`Section is locked: ${request.section}`);
    }

    let sectionHtml = match[0];

    // Apply each edit
    for (const edit of request.edits) {
      sectionHtml = this.applyEdit(sectionHtml, edit);
    }

    // Replace section in page
    return pageHtml.replace(sectionRegex, sectionHtml);
  }

  /**
   * Lock/unlock a section
   */
  toggleSectionLock(pageHtml: string, section: string, locked: boolean): string {
    const sectionRegex = new RegExp(
      `(<section[^>]*data-morgus-section="${section}"[^>]*)data-morgus-lock="(true|false)"`,
      'i'
    );

    if (pageHtml.match(sectionRegex)) {
      return pageHtml.replace(sectionRegex, `$1data-morgus-lock="${locked}"`);
    } else {
      const insertRegex = new RegExp(
        `(<section[^>]*data-morgus-section="${section}")`,
        'i'
      );
      return pageHtml.replace(insertRegex, `$1 data-morgus-lock="${locked}"`);
    }
  }

  // ============================================
  // PRIVATE METHODS
  // ============================================

  private async getAssetsForSection(
    section: string,
    data: any,
    style: IllustrationStyle,
    preferences?: TemplateRequest['preferences']
  ): Promise<string[]> {
    const assets: string[] = [];
    const preferPreMade = preferences?.preferPreMade !== false;
    const generateMissing = preferences?.generateMissing !== false;

    // Check for illustration fields in data
    if (data.illustration) {
      const asset = await this.getIllustration(
        section,
        style,
        data.illustration,
        preferPreMade,
        generateMissing
      );
      if (asset) assets.push(asset);
    }

    // Check for icon fields
    if (data.items && Array.isArray(data.items)) {
      for (const item of data.items) {
        if (item.icon) {
          const iconAsset = await this.getIcon(item.icon, style, preferPreMade, generateMissing);
          if (iconAsset) assets.push(iconAsset);
        }
      }
    }

    return assets;
  }

  private async getIllustration(
    category: string,
    style: IllustrationStyle,
    description: string,
    preferPreMade: boolean,
    generateMissing: boolean
  ): Promise<string | null> {
    // Try pre-made library first
    if (preferPreMade) {
      const libraryCategory = ILLUSTRATION_LIBRARY[category];
      if (libraryCategory && libraryCategory[style]) {
        const illustrations = libraryCategory[style];
        // Find best match or random
        const selected = illustrations[Math.floor(Math.random() * illustrations.length)];
        return `${this.env.ILLUSTRATION_CDN_URL || '/assets/illustrations'}/${category}/${style}/${selected}.svg`;
      }
    }

    // Generate with AI if not found and allowed
    if (generateMissing && this.env.OPENAI_API_KEY) {
      return await this.generateIllustration(category, style, description);
    }

    return null;
  }

  private async getIcon(
    iconName: string,
    style: IllustrationStyle,
    preferPreMade: boolean,
    generateMissing: boolean
  ): Promise<string | null> {
    // Check library
    if (preferPreMade && ILLUSTRATION_LIBRARY.features?.icons?.includes(iconName)) {
      return `${this.env.ILLUSTRATION_CDN_URL || '/assets/illustrations'}/features/icons/${iconName}.svg`;
    }

    // Generate if needed
    if (generateMissing && this.env.OPENAI_API_KEY) {
      return await this.generateIcon(iconName, style);
    }

    // Return default icon
    return `${this.env.ILLUSTRATION_CDN_URL || '/assets/illustrations'}/features/icons/default.svg`;
  }

  private async generateIllustration(
    category: string,
    style: IllustrationStyle,
    description: string
  ): Promise<string> {
    const promptTemplate = AI_PROMPTS.hero?.[category] || AI_PROMPTS.hero?.saas;
    const prompt = promptTemplate
      .replace('{description}', description)
      .replace('{primaryColor}', '#6366f1')
      .replace('{accentColor}', '#8b5cf6');

    // Call DALL-E 3 or similar
    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'dall-e-3',
        prompt,
        n: 1,
        size: '1024x1024',
        quality: 'standard'
      })
    });

    const data = await response.json();
    return data.data?.[0]?.url || '';
  }

  private async generateIcon(iconName: string, style: IllustrationStyle): Promise<string> {
    const promptTemplate = AI_PROMPTS.icon?.[style] || AI_PROMPTS.icon?.minimal;
    const prompt = promptTemplate.replace('{concept}', iconName);

    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'dall-e-3',
        prompt,
        n: 1,
        size: '1024x1024',
        quality: 'standard'
      })
    });

    const data = await response.json();
    return data.data?.[0]?.url || '';
  }

  private getBaseHTML(template: TemplateType, data: any): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${data.meta?.title || 'Landing Page'}</title>
  <meta name="description" content="${data.meta?.description || ''}">
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  ${TEMPLATES[template].sections.map(s => `{{section:${s}}}`).join('\n  ')}
  <script src="script.js"></script>
</body>
</html>`;
  }

  private buildSection(name: string, data: any, assets: string[]): string {
    // This would be expanded with full section templates
    return `<section data-morgus-section="${name}" data-morgus-lock="false" class="section section-${name}">
    <div class="container">
      ${this.buildSectionContent(name, data, assets)}
    </div>
  </section>`;
  }

  private buildSectionContent(name: string, data: any, assets: string[]): string {
    switch (name) {
      case 'hero':
        return `
          <h1>${data.headline || 'Your Headline Here'}</h1>
          <p class="subheadline">${data.subheadline || 'Your subheadline here'}</p>
          <button class="cta-button">${data.cta || 'Get Started'}</button>
          ${assets[0] ? `<img src="${assets[0]}" alt="Hero illustration" class="hero-illustration">` : ''}
        `;
      case 'features':
        return `
          <h2>${data.title || 'Features'}</h2>
          <div class="features-grid">
            ${(data.items || []).map((item: any, i: number) => `
              <div class="feature-card">
                ${assets[i] ? `<img src="${assets[i]}" alt="${item.title}" class="feature-icon">` : ''}
                <h3>${item.title}</h3>
                <p>${item.description}</p>
              </div>
            `).join('')}
          </div>
        `;
      case 'pricing':
        return `
          <h2>${data.title || 'Pricing'}</h2>
          <div class="pricing-grid">
            ${(data.plans || []).map((plan: any) => `
              <div class="pricing-card ${plan.highlighted ? 'highlighted' : ''}">
                <h3>${plan.name}</h3>
                <div class="price">${plan.price}</div>
                <ul>
                  ${(plan.features || []).map((f: string) => `<li>${f}</li>`).join('')}
                </ul>
                <button>${plan.cta || 'Choose Plan'}</button>
              </div>
            `).join('')}
          </div>
        `;
      default:
        return `<p>Section: ${name}</p>`;
    }
  }

  private getTemplateCSS(template: TemplateType, style: IllustrationStyle, theme?: any): string {
    const primaryColor = theme?.primaryColor || '#6366f1';
    const accentColor = theme?.accentColor || '#8b5cf6';

    return `
:root {
  --primary: ${primaryColor};
  --accent: ${accentColor};
  --text: #1f2937;
  --text-light: #6b7280;
  --bg: #ffffff;
  --bg-alt: #f9fafb;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  color: var(--text);
  line-height: 1.6;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
}

.section {
  padding: 80px 0;
}

.section:nth-child(even) {
  background: var(--bg-alt);
}

h1 {
  font-size: 3.5rem;
  font-weight: 700;
  line-height: 1.2;
  margin-bottom: 24px;
}

h2 {
  font-size: 2.5rem;
  font-weight: 600;
  margin-bottom: 48px;
  text-align: center;
}

h3 {
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 12px;
}

.subheadline {
  font-size: 1.25rem;
  color: var(--text-light);
  margin-bottom: 32px;
  max-width: 600px;
}

.cta-button {
  background: linear-gradient(135deg, var(--primary), var(--accent));
  color: white;
  border: none;
  padding: 16px 32px;
  font-size: 1rem;
  font-weight: 600;
  border-radius: 8px;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.cta-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 20px rgba(99, 102, 241, 0.3);
}

.hero-illustration {
  max-width: 100%;
  height: auto;
  margin-top: 48px;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 32px;
}

.feature-card {
  background: white;
  padding: 32px;
  border-radius: 16px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  transition: transform 0.2s, box-shadow 0.2s;
}

.feature-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.1);
}

.feature-icon {
  width: 48px;
  height: 48px;
  margin-bottom: 16px;
}

.pricing-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 32px;
  max-width: 1000px;
  margin: 0 auto;
}

.pricing-card {
  background: white;
  padding: 40px;
  border-radius: 16px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  text-align: center;
}

.pricing-card.highlighted {
  border: 2px solid var(--primary);
  transform: scale(1.05);
}

.price {
  font-size: 3rem;
  font-weight: 700;
  color: var(--primary);
  margin: 16px 0;
}

.pricing-card ul {
  list-style: none;
  margin: 24px 0;
}

.pricing-card li {
  padding: 8px 0;
  color: var(--text-light);
}

.pricing-card button {
  width: 100%;
  padding: 16px;
  background: var(--primary);
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
}

@media (max-width: 768px) {
  h1 { font-size: 2.5rem; }
  h2 { font-size: 2rem; }
  .section { padding: 48px 0; }
}
`;
  }

  private applyEdit(sectionHtml: string, edit: Edit): string {
    switch (edit.type) {
      case 'text':
        // Find element by selector and replace text
        const textRegex = new RegExp(`(<${edit.selector}[^>]*>)[^<]*(</`, 'i');
        return sectionHtml.replace(textRegex, `$1${edit.value}$2`);
      
      case 'image':
        // Find img by selector and replace src
        const imgRegex = new RegExp(`(<img[^>]*${edit.selector}[^>]*src=")[^"]*"`, 'i');
        return sectionHtml.replace(imgRegex, `$1${edit.value}"`);
      
      case 'color':
        // Add inline style
        const colorRegex = new RegExp(`(<[^>]*${edit.selector}[^>]*)>`, 'i');
        return sectionHtml.replace(colorRegex, `$1 style="color: ${edit.value}">`);
      
      default:
        return sectionHtml;
    }
  }
}

// ============================================
// EXPORTS
// ============================================

export function createTemplateEngine(env: any): TemplateEngine {
  return new TemplateEngine(env);
}
