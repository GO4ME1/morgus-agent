/**
 * Advanced Slide Generation Engine
 * 
 * Provides Manus-level slide generation capabilities:
 * - Custom aesthetic directions
 * - Dynamic color palettes
 * - Professional HTML/CSS generation
 * - Brand-aware styling
 * - Multiple output formats
 */

export interface SlideStyle {
  aestheticDirection: string;
  colorPalette: string[];
  typography: {
    fontFamily: string;
    headingSize: string;
    bodySize: string;
    smallSize: string;
  };
  effects?: {
    glassmorphism?: boolean;
    neonGlow?: boolean;
    gradients?: boolean;
    animations?: boolean;
  };
}

export interface SlideContent {
  id: string;
  title: string;
  subtitle?: string;
  content: string;
  layout: 'title' | 'content' | 'two-column' | 'image' | 'split' | 'full-image' | 'quote';
  image?: string;
  images?: string[];
  notes?: string;
}

export interface PresentationConfig {
  title: string;
  slides: SlideContent[];
  style: SlideStyle;
  author?: string;
  date?: string;
}

export class SlideGenerator {
  /**
   * Generate complete presentation HTML
   */
  static generatePresentation(config: PresentationConfig): Map<string, string> {
    const slideFiles = new Map<string, string>();
    
    config.slides.forEach((slide, index) => {
      const html = this.generateSlideHTML(slide, config.style, index === 0);
      slideFiles.set(`${slide.id}.html`, html);
    });
    
    return slideFiles;
  }
  
  /**
   * Generate individual slide HTML
   */
  private static generateSlideHTML(
    slide: SlideContent,
    style: SlideStyle,
    isFirst: boolean
  ): string {
    const css = this.generateCSS(style);
    const body = this.generateSlideBody(slide, style, isFirst);
    
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css" rel="stylesheet">
    <link href="https://fonts.googleapis.com/css2?family=${style.typography.fontFamily.replace(' ', '+')}:wght@400;600;800&display=swap" rel="stylesheet">
    <style>
${css}
    </style>
</head>
<body>
${body}
</body>
</html>`;
  }
  
  /**
   * Generate CSS based on style configuration
   */
  private static generateCSS(style: SlideStyle): string {
    const [bg, text, accent1, accent2, accent3] = style.colorPalette;
    
    let css = `        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: '${style.typography.fontFamily}', sans-serif; overflow: hidden; }
        .slide-container {
            width: 1280px;
            min-height: 720px;
            background-color: ${bg};
            color: ${text};
            padding: 60px;
            position: relative;
            display: flex;
            flex-direction: column;
        }`;
    
    // Add glassmorphism effects
    if (style.effects?.glassmorphism) {
      css += `
        .glass-card {
            background: rgba(255, 255, 255, 0.05);
            backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 16px;
            padding: 40px;
        }`;
    }
    
    // Add neon glow effects
    if (style.effects?.neonGlow) {
      css += `
        .glow-text {
            text-shadow: 0 0 10px ${accent1}, 0 0 20px ${accent1};
        }
        .glow-border {
            border: 2px solid ${accent1};
            box-shadow: 0 0 20px ${accent1};
        }`;
    }
    
    // Add gradient effects
    if (style.effects?.gradients) {
      css += `
        .gradient-text {
            background: linear-gradient(135deg, ${accent1} 0%, ${accent2} 50%, ${accent3} 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }
        .gradient-bg {
            background: linear-gradient(135deg, ${accent1} 0%, ${accent2} 100%);
        }`;
    }
    
    // Typography
    css += `
        h1 { font-size: ${style.typography.headingSize}; font-weight: 800; line-height: 1.2; }
        h2 { font-size: calc(${style.typography.headingSize} * 0.75); font-weight: 700; line-height: 1.3; }
        h3 { font-size: calc(${style.typography.headingSize} * 0.5); font-weight: 600; line-height: 1.4; }
        p { font-size: ${style.typography.bodySize}; line-height: 1.6; }
        .small { font-size: ${style.typography.smallSize}; }`;
    
    return css;
  }
  
  /**
   * Generate slide body HTML based on layout
   */
  private static generateSlideBody(
    slide: SlideContent,
    style: SlideStyle,
    isFirst: boolean
  ): string {
    switch (slide.layout) {
      case 'title':
        return this.generateTitleSlide(slide, style);
      case 'content':
        return this.generateContentSlide(slide, style);
      case 'two-column':
        return this.generateTwoColumnSlide(slide, style);
      case 'image':
        return this.generateImageSlide(slide, style);
      case 'split':
        return this.generateSplitSlide(slide, style);
      case 'full-image':
        return this.generateFullImageSlide(slide, style);
      case 'quote':
        return this.generateQuoteSlide(slide, style);
      default:
        return this.generateContentSlide(slide, style);
    }
  }
  
  /**
   * Layout generators
   */
  private static generateTitleSlide(slide: SlideContent, style: SlideStyle): string {
    const hasGradient = style.effects?.gradients;
    const titleClass = hasGradient ? 'gradient-text' : '';
    
    return `    <div class="slide-container" style="align-items: center; justify-content: center;">
        <div style="text-align: center; max-width: 900px;">
            <h1 class="${titleClass}">${slide.title}</h1>
            ${slide.subtitle ? `<h2 style="margin-top: 30px; opacity: 0.8;">${slide.subtitle}</h2>` : ''}
            ${slide.content ? `<p style="margin-top: 40px; font-size: 20px;">${slide.content}</p>` : ''}
        </div>
    </div>`;
  }
  
  private static generateContentSlide(slide: SlideContent, style: SlideStyle): string {
    const hasGlass = style.effects?.glassmorphism;
    const cardClass = hasGlass ? 'glass-card' : '';
    
    return `    <div class="slide-container">
        <div style="border-bottom: 2px solid rgba(255,255,255,0.1); padding-bottom: 20px; margin-bottom: 40px;">
            <h2>${slide.title}</h2>
            ${slide.subtitle ? `<p class="small" style="margin-top: 10px; opacity: 0.7;">${slide.subtitle}</p>` : ''}
        </div>
        <div class="${cardClass}" style="flex: 1;">
            ${this.formatContent(slide.content)}
        </div>
    </div>`;
  }
  
  private static generateTwoColumnSlide(slide: SlideContent, style: SlideStyle): string {
    const [col1, col2] = slide.content.split('|||');
    
    return `    <div class="slide-container">
        <div style="border-bottom: 2px solid rgba(255,255,255,0.1); padding-bottom: 20px; margin-bottom: 40px;">
            <h2>${slide.title}</h2>
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 40px; flex: 1;">
            <div>${this.formatContent(col1 || '')}</div>
            <div>${this.formatContent(col2 || '')}</div>
        </div>
    </div>`;
  }
  
  private static generateImageSlide(slide: SlideContent, style: SlideStyle): string {
    return `    <div class="slide-container">
        <div style="border-bottom: 2px solid rgba(255,255,255,0.1); padding-bottom: 20px; margin-bottom: 40px;">
            <h2>${slide.title}</h2>
        </div>
        <div style="flex: 1; display: flex; gap: 30px;">
            <div style="flex: 1;">
                ${this.formatContent(slide.content)}
            </div>
            ${slide.image ? `
            <div style="flex: 1;">
                <img src="${slide.image}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 16px;" alt="${slide.title}">
            </div>` : ''}
        </div>
    </div>`;
  }
  
  private static generateSplitSlide(slide: SlideContent, style: SlideStyle): string {
    const hasGlass = style.effects?.glassmorphism;
    
    return `    <div class="slide-container" style="flex-direction: row; align-items: center; gap: 60px;">
        <div style="flex: 1;">
            <h1>${slide.title}</h1>
            ${slide.subtitle ? `<h3 style="margin-top: 20px; opacity: 0.8;">${slide.subtitle}</h3>` : ''}
            <div style="margin-top: 30px;">
                ${this.formatContent(slide.content)}
            </div>
        </div>
        ${slide.image ? `
        <div style="flex: 1; height: 500px;">
            <img src="${slide.image}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 24px; ${hasGlass ? 'box-shadow: 0 0 40px rgba(0,0,0,0.3);' : ''}" alt="${slide.title}">
        </div>` : ''}
    </div>`;
  }
  
  private static generateFullImageSlide(slide: SlideContent, style: SlideStyle): string {
    return `    <div class="slide-container" style="padding: 0; position: relative;">
        ${slide.image ? `<img src="${slide.image}" style="width: 100%; height: 100%; object-fit: cover;" alt="${slide.title}">` : ''}
        <div style="position: absolute; bottom: 60px; left: 60px; right: 60px; background: rgba(0,0,0,0.7); backdrop-filter: blur(10px); padding: 40px; border-radius: 16px;">
            <h2>${slide.title}</h2>
            ${slide.content ? `<p style="margin-top: 20px;">${slide.content}</p>` : ''}
        </div>
    </div>`;
  }
  
  private static generateQuoteSlide(slide: SlideContent, style: SlideStyle): string {
    const [quote, author] = slide.content.split('---');
    
    return `    <div class="slide-container" style="align-items: center; justify-content: center;">
        <div style="max-width: 900px; text-align: center;">
            <div style="font-size: 72px; opacity: 0.3; margin-bottom: 20px;">"</div>
            <h2 style="font-style: italic; font-weight: 400; line-height: 1.6;">${quote?.trim() || slide.content}</h2>
            ${author ? `<p style="margin-top: 40px; font-weight: 600; opacity: 0.7;">— ${author.trim()}</p>` : ''}
        </div>
    </div>`;
  }
  
  /**
   * Format content (markdown-like)
   */
  private static formatContent(content: string): string {
    if (!content) return '';
    
    // Convert markdown-style lists to HTML
    const lines = content.split('\n');
    let html = '';
    let inList = false;
    
    for (const line of lines) {
      const trimmed = line.trim();
      
      if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        if (!inList) {
          html += '<ul style="list-style: none; padding: 0;">';
          inList = true;
        }
        html += `<li style="margin-bottom: 15px; padding-left: 30px; position: relative;">
          <span style="position: absolute; left: 0; color: currentColor; opacity: 0.5;">•</span>
          ${trimmed.slice(2)}
        </li>`;
      } else if (trimmed.startsWith('# ')) {
        if (inList) {
          html += '</ul>';
          inList = false;
        }
        html += `<h3 style="margin-top: 20px; margin-bottom: 10px;">${trimmed.slice(2)}</h3>`;
      } else if (trimmed) {
        if (inList) {
          html += '</ul>';
          inList = false;
        }
        html += `<p style="margin-bottom: 15px;">${trimmed}</p>`;
      }
    }
    
    if (inList) {
      html += '</ul>';
    }
    
    return html;
  }
  
  /**
   * Pre-defined style presets
   */
  static getStylePreset(name: string): SlideStyle {
    const presets: Record<string, SlideStyle> = {
      'morgus-neon': {
        aestheticDirection: 'Dark Glassmorphism with vibrant neon gradients in cyan and magenta, glowing border accents',
        colorPalette: ['#121212', '#FFFFFF', '#FF00FF', '#00FFFF', '#FF8800'],
        typography: {
          fontFamily: 'Inter',
          headingSize: '48px',
          bodySize: '20px',
          smallSize: '16px',
        },
        effects: {
          glassmorphism: true,
          neonGlow: true,
          gradients: true,
          animations: false,
        },
      },
      'modern': {
        aestheticDirection: 'Clean modern design with subtle shadows and professional typography',
        colorPalette: ['#FFFFFF', '#1a1a1a', '#0066cc', '#00cc66', '#ff6600'],
        typography: {
          fontFamily: 'Inter',
          headingSize: '48px',
          bodySize: '20px',
          smallSize: '16px',
        },
        effects: {
          glassmorphism: false,
          neonGlow: false,
          gradients: true,
          animations: false,
        },
      },
      'minimal': {
        aestheticDirection: 'Minimalist design with ample white space and subtle accents',
        colorPalette: ['#FAFAFA', '#2a2a2a', '#4a4a4a', '#6a6a6a', '#8a8a8a'],
        typography: {
          fontFamily: 'Roboto',
          headingSize: '44px',
          bodySize: '18px',
          smallSize: '14px',
        },
        effects: {
          glassmorphism: false,
          neonGlow: false,
          gradients: false,
          animations: false,
        },
      },
      'corporate': {
        aestheticDirection: 'Professional corporate design with structured layouts and brand colors',
        colorPalette: ['#F5F5F5', '#1a1a1a', '#003366', '#0066cc', '#336699'],
        typography: {
          fontFamily: 'Open Sans',
          headingSize: '42px',
          bodySize: '18px',
          smallSize: '14px',
        },
        effects: {
          glassmorphism: false,
          neonGlow: false,
          gradients: true,
          animations: false,
        },
      },
      'creative': {
        aestheticDirection: 'Bold creative design with vibrant colors and dynamic layouts',
        colorPalette: ['#FFE5E5', '#1a1a1a', '#FF006E', '#8338EC', '#3A86FF'],
        typography: {
          fontFamily: 'Poppins',
          headingSize: '52px',
          bodySize: '20px',
          smallSize: '16px',
        },
        effects: {
          glassmorphism: false,
          neonGlow: false,
          gradients: true,
          animations: false,
        },
      },
      'dark': {
        aestheticDirection: 'Dark theme with high contrast and modern aesthetics',
        colorPalette: ['#1a1a1a', '#FFFFFF', '#00D9FF', '#FF00D9', '#FFAA00'],
        typography: {
          fontFamily: 'Inter',
          headingSize: '48px',
          bodySize: '20px',
          smallSize: '16px',
        },
        effects: {
          glassmorphism: true,
          neonGlow: true,
          gradients: true,
          animations: false,
        },
      },
    };
    
    return presets[name] || presets['modern'];
  }
}
