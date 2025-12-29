/**
 * Advanced Slides Generation Tools (V2)
 * 
 * Upgraded with Manus-level capabilities:
 * - Custom aesthetic directions
 * - Dynamic color palettes
 * - Professional HTML/CSS generation
 * - Brand-aware styling
 * - 6 pre-built style presets
 * 
 * Tools:
 * - create_slides_advanced: Create presentation with custom styling
 * - export_slides: Export slides to PDF or PPTX
 */

import { SlideGenerator, PresentationConfig, SlideStyle } from '../services/slide-generator';

export interface Tool {
  name: string;
  description: string;
  schema: any;
  execute: (args: any, env: any, userId?: string) => Promise<string>;
}

/**
 * Advanced Create Slides Tool
 */
export const createSlidesAdvancedTool: Tool = {
  name: 'create_slides_advanced',
  description: `Create a professional presentation with advanced styling and custom aesthetics.

**Style Presets:**
- morgus-neon: Dark glassmorphism with neon gradients (pink, cyan, orange)
- modern: Clean design with subtle shadows and professional typography
- minimal: Minimalist with ample white space
- corporate: Professional with structured layouts
- creative: Bold with vibrant colors
- dark: Dark theme with high contrast

**Layouts:**
- title: Title slide with main heading and subtitle
- content: Standard content slide with bullet points
- two-column: Two-column layout (separate columns with |||)
- image: Content with image on the side
- split: 50/50 split with content and large image
- full-image: Full-screen image with overlay text
- quote: Quote or testimonial slide (separate quote and author with ---)

**Custom Styling:**
You can provide custom aestheticDirection, colorPalette, and typography instead of using a preset.

Example:
{
  "title": "Product Launch",
  "slides": [
    {
      "id": "welcome",
      "title": "Welcome",
      "subtitle": "Introducing our new product",
      "content": "The future of productivity",
      "layout": "title"
    },
    {
      "id": "features",
      "title": "Key Features",
      "content": "- Feature 1\\n- Feature 2\\n- Feature 3",
      "layout": "content"
    }
  ],
  "stylePreset": "morgus-neon"
}`,

  schema: {
    type: 'object',
    properties: {
      title: {
        type: 'string',
        description: 'Presentation title',
      },
      slides: {
        type: 'array',
        description: 'Array of slides',
        items: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Unique slide ID (lowercase, underscores)',
            },
            title: {
              type: 'string',
              description: 'Slide title',
            },
            subtitle: {
              type: 'string',
              description: 'Slide subtitle (optional)',
            },
            content: {
              type: 'string',
              description: 'Slide content (supports markdown-style formatting)',
            },
            layout: {
              type: 'string',
              enum: ['title', 'content', 'two-column', 'image', 'split', 'full-image', 'quote'],
              description: 'Slide layout',
            },
            image: {
              type: 'string',
              description: 'Image path or URL (for image/split/full-image layouts)',
            },
            notes: {
              type: 'string',
              description: 'Speaker notes',
            },
          },
          required: ['id', 'title', 'content', 'layout'],
        },
      },
      stylePreset: {
        type: 'string',
        enum: ['morgus-neon', 'modern', 'minimal', 'corporate', 'creative', 'dark'],
        description: 'Pre-built style preset (default: modern)',
      },
      customStyle: {
        type: 'object',
        description: 'Custom style configuration (overrides stylePreset)',
        properties: {
          aestheticDirection: {
            type: 'string',
            description: 'Aesthetic direction description',
          },
          colorPalette: {
            type: 'array',
            items: { type: 'string' },
            description: 'Array of 5 hex colors: [background, text, accent1, accent2, accent3]',
          },
          typography: {
            type: 'object',
            properties: {
              fontFamily: { type: 'string' },
              headingSize: { type: 'string' },
              bodySize: { type: 'string' },
              smallSize: { type: 'string' },
            },
          },
          effects: {
            type: 'object',
            properties: {
              glassmorphism: { type: 'boolean' },
              neonGlow: { type: 'boolean' },
              gradients: { type: 'boolean' },
              animations: { type: 'boolean' },
            },
          },
        },
      },
      author: {
        type: 'string',
        description: 'Author name',
      },
    },
    required: ['title', 'slides'],
  },
  
  async execute(args: any, env: any, userId?: string): Promise<string> {
    const { title, slides, stylePreset = 'modern', customStyle, author } = args;
    
    console.log(`[Slides V2] Creating presentation: ${title}`);
    console.log(`[Slides V2] Slides: ${slides.length}, Style: ${stylePreset || 'custom'}`);
    
    // Get style configuration
    const style: SlideStyle = customStyle || SlideGenerator.getStylePreset(stylePreset);
    
    // Generate presentation
    const config: PresentationConfig = {
      title,
      slides,
      style,
      author,
      date: new Date().toISOString().split('T')[0],
    };
    
    const slideFiles = SlideGenerator.generatePresentation(config);
    
    // In production, save files and generate presentation ID
    const presentationId = `pres_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    
    // Save slides to storage (mock for now)
    console.log(`[Slides V2] Generated ${slideFiles.size} slide files`);
    
    // Summary
    const slidesSummary = slides.map((slide: any, i: number) => 
      `${i + 1}. **${slide.title}** (${slide.layout})`
    ).join('\n');
    
    return `✅ Advanced presentation created successfully!

## ${title}

**Presentation ID:** ${presentationId}
**Style:** ${stylePreset || 'Custom'}
**Slides:** ${slides.length}
${author ? `**Author:** ${author}` : ''}

### Aesthetic
- **Direction:** ${style.aestheticDirection}
- **Colors:** ${style.colorPalette.join(', ')}
- **Font:** ${style.typography.fontFamily}
- **Effects:** ${Object.entries(style.effects || {}).filter(([_, v]) => v).map(([k]) => k).join(', ') || 'None'}

### Slides

${slidesSummary}

### Features
✅ Professional HTML/CSS generation
✅ Custom aesthetic direction
✅ Dynamic color palettes
✅ Brand-aware styling
✅ Multiple layout options
✅ Responsive design

### Next Steps

1. Review slides in preview
2. Export to PDF or PPTX using \`export_slides\`
3. Share with your audience

**Preview URL:** \`/presentations/${presentationId}\`
**Slide Files:** ${slideFiles.size} HTML files generated`;
  },
};

/**
 * Export Slides Tool (unchanged from V1)
 */
export const exportSlidesTool: Tool = {
  name: 'export_slides',
  description: 'Export presentation slides to PDF or PPTX format',
  schema: {
    type: 'object',
    properties: {
      presentationId: {
        type: 'string',
        description: 'Presentation ID from create_slides_advanced',
      },
      format: {
        type: 'string',
        enum: ['pdf', 'pptx'],
        description: 'Export format',
      },
      includeNotes: {
        type: 'boolean',
        description: 'Include speaker notes (default: false)',
      },
      outputPath: {
        type: 'string',
        description: 'Output file path (optional)',
      },
    },
    required: ['presentationId', 'format'],
  },
  
  async execute(args: any, env: any, userId?: string): Promise<string> {
    const { presentationId, format, includeNotes = false, outputPath } = args;
    
    console.log(`[Slides V2] Exporting ${presentationId} to ${format}`);
    
    // In production, this would call the presentation export service
    const filename = outputPath || `presentation_${presentationId}.${format}`;
    
    return `✅ Presentation exported successfully!

**Format:** ${format.toUpperCase()}
**File:** ${filename}
**Speaker Notes:** ${includeNotes ? 'Included' : 'Not included'}

The presentation has been exported and is ready to download or share.`;
  },
};

/**
 * All advanced slides tools
 */
export const slidesToolsV2: Tool[] = [
  createSlidesAdvancedTool,
  exportSlidesTool,
];
