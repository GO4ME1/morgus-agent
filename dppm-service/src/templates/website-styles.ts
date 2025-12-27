/**
 * Visual Styles for Website Templates
 * 
 * Multiple layout/design variations for each template type
 */

export type VisualStyle = 
  | 'modern-minimal'
  | 'bold-dynamic'
  | 'classic-professional'
  | 'creative-artistic'
  | 'elegant-luxury';

export interface StyleConfig {
  name: VisualStyle;
  description: string;
  keywords: string[]; // Keywords that trigger this style
  layout: 'centered' | 'asymmetric' | 'grid' | 'overlapping' | 'split';
  heroStyle: 'fullscreen' | 'split' | 'centered' | 'minimal' | 'immersive';
  colorIntensity: 'subtle' | 'moderate' | 'vibrant';
  spacing: 'tight' | 'normal' | 'spacious';
  typography: 'modern' | 'classic' | 'bold' | 'elegant' | 'playful';
  animations: 'subtle' | 'moderate' | 'dynamic';
}

export const VISUAL_STYLES: Record<VisualStyle, StyleConfig> = {
  'modern-minimal': {
    name: 'modern-minimal',
    description: 'Clean, lots of whitespace, centered content, minimalist aesthetic',
    keywords: ['minimal', 'clean', 'simple', 'modern', 'sleek', 'professional'],
    layout: 'centered',
    heroStyle: 'centered',
    colorIntensity: 'subtle',
    spacing: 'spacious',
    typography: 'modern',
    animations: 'subtle'
  },
  
  'bold-dynamic': {
    name: 'bold-dynamic',
    description: 'Asymmetric layouts, large images, vibrant colors, energetic',
    keywords: ['bold', 'dynamic', 'energetic', 'vibrant', 'exciting', 'powerful', 'strong'],
    layout: 'asymmetric',
    heroStyle: 'fullscreen',
    colorIntensity: 'vibrant',
    spacing: 'tight',
    typography: 'bold',
    animations: 'dynamic'
  },
  
  'classic-professional': {
    name: 'classic-professional',
    description: 'Traditional grid, balanced sections, corporate feel',
    keywords: ['professional', 'corporate', 'business', 'traditional', 'formal', 'enterprise'],
    layout: 'grid',
    heroStyle: 'split',
    colorIntensity: 'moderate',
    spacing: 'normal',
    typography: 'classic',
    animations: 'subtle'
  },
  
  'creative-artistic': {
    name: 'creative-artistic',
    description: 'Unique layouts, overlapping elements, playful and creative',
    keywords: ['creative', 'artistic', 'unique', 'playful', 'fun', 'quirky', 'whimsical'],
    layout: 'overlapping',
    heroStyle: 'immersive',
    colorIntensity: 'vibrant',
    spacing: 'normal',
    typography: 'playful',
    animations: 'dynamic'
  },
  
  'elegant-luxury': {
    name: 'elegant-luxury',
    description: 'Sophisticated, refined, premium feel, high-end aesthetic',
    keywords: ['luxury', 'elegant', 'premium', 'sophisticated', 'refined', 'exclusive', 'high-end', 'spa', 'retreat'],
    layout: 'split',
    heroStyle: 'minimal',
    colorIntensity: 'subtle',
    spacing: 'spacious',
    typography: 'elegant',
    animations: 'subtle'
  }
};

/**
 * Detect visual style based on keywords in the goal/description
 */
export function detectVisualStyle(goal: string, templateType: string): VisualStyle {
  const goalLower = goal.toLowerCase();
  
  // Check each style's keywords
  for (const [styleName, config] of Object.entries(VISUAL_STYLES)) {
    for (const keyword of config.keywords) {
      if (goalLower.includes(keyword)) {
        console.log(`[Style] Detected "${styleName}" style from keyword: "${keyword}"`);
        return styleName as VisualStyle;
      }
    }
  }
  
  // Default styles based on template type
  const templateDefaults: Record<string, VisualStyle> = {
    'startup': 'bold-dynamic',
    'saas': 'modern-minimal',
    'dating': 'elegant-luxury',
    'creative': 'creative-artistic',
    'personal': 'modern-minimal',
    'restaurant': 'elegant-luxury',
    'ecommerce': 'classic-professional',
    'fitness': 'bold-dynamic',
    'healthcare': 'classic-professional',
    'education': 'modern-minimal',
  };
  
  const defaultStyle = templateDefaults[templateType] || 'modern-minimal';
  console.log(`[Style] Using default "${defaultStyle}" style for template type: ${templateType}`);
  return defaultStyle;
}

/**
 * Get CSS variables for a visual style
 */
export function getStyleCSS(style: VisualStyle, primaryColor: string, accentColor: string): string {
  const config = VISUAL_STYLES[style];
  
  // Spacing values
  const spacingMap = {
    'tight': { section: '80px', element: '40px' },
    'normal': { section: '120px', element: '60px' },
    'spacious': { section: '160px', element: '80px' }
  };
  const spacing = spacingMap[config.spacing];
  
  // Animation durations
  const animationMap = {
    'subtle': '0.3s',
    'moderate': '0.5s',
    'dynamic': '0.7s'
  };
  const animationDuration = animationMap[config.animations];
  
  // Color intensity adjustments
  const intensityMap = {
    'subtle': { saturation: '0.7', brightness: '1.1' },
    'moderate': { saturation: '1.0', brightness: '1.0' },
    'vibrant': { saturation: '1.3', brightness: '0.9' }
  };
  const intensity = intensityMap[config.colorIntensity];
  
  return `
    /* Visual Style: ${style} */
    --section-padding: ${spacing.section};
    --element-spacing: ${spacing.element};
    --animation-duration: ${animationDuration};
    --color-saturation: ${intensity.saturation};
    --color-brightness: ${intensity.brightness};
  `;
}

/**
 * Get layout-specific HTML structure modifications
 */
export function getLayoutStructure(style: VisualStyle): {
  heroLayout: string;
  featuresLayout: string;
  ctaLayout: string;
} {
  const config = VISUAL_STYLES[style];
  
  const layouts = {
    'modern-minimal': {
      heroLayout: 'centered-single-column',
      featuresLayout: 'grid-3-column',
      ctaLayout: 'centered-simple'
    },
    'bold-dynamic': {
      heroLayout: 'fullscreen-overlay',
      featuresLayout: 'asymmetric-cards',
      ctaLayout: 'split-action'
    },
    'classic-professional': {
      heroLayout: 'split-50-50',
      featuresLayout: 'grid-2-column',
      ctaLayout: 'traditional-banner'
    },
    'creative-artistic': {
      heroLayout: 'immersive-diagonal',
      featuresLayout: 'masonry-overlapping',
      ctaLayout: 'creative-floating'
    },
    'elegant-luxury': {
      heroLayout: 'minimal-centered',
      featuresLayout: 'elegant-showcase',
      ctaLayout: 'refined-subtle'
    }
  };
  
  return layouts[style];
}
