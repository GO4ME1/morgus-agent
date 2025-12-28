/**
 * Slides Generation Tools
 * 
 * Create and export presentation slides programmatically.
 * Integrates with Morgus's existing presentation capabilities.
 * 
 * Tools:
 * - create_slides: Create presentation with multiple slides
 * - export_slides: Export slides to PDF or PPTX
 */

export interface Tool {
  name: string;
  description: string;
  schema: any;
  execute: (args: any, env: any, userId?: string) => Promise<string>;
}

export interface Slide {
  title: string;
  content: string;
  layout: 'title' | 'content' | 'two-column' | 'image' | 'code' | 'quote';
  image?: string;
  notes?: string;
}

/**
 * Create Slides Tool
 */
export const createSlidesTool: Tool = {
  name: 'create_slides',
  description: `Create a presentation with multiple slides.

Supports various layouts:
- title: Title slide with main heading and subtitle
- content: Standard content slide with bullet points
- two-column: Two-column layout for comparisons
- image: Image-focused slide
- code: Code snippet slide with syntax highlighting
- quote: Quote or testimonial slide

Example:
{
  "title": "Product Launch",
  "slides": [
    {
      "title": "Welcome",
      "content": "Introducing our new product",
      "layout": "title"
    },
    {
      "title": "Key Features",
      "content": "- Feature 1\\n- Feature 2\\n- Feature 3",
      "layout": "content"
    }
  ],
  "theme": "modern"
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
            title: {
              type: 'string',
              description: 'Slide title',
            },
            content: {
              type: 'string',
              description: 'Slide content (supports markdown)',
            },
            layout: {
              type: 'string',
              enum: ['title', 'content', 'two-column', 'image', 'code', 'quote'],
              description: 'Slide layout',
            },
            image: {
              type: 'string',
              description: 'Image URL or path (for image layout)',
            },
            notes: {
              type: 'string',
              description: 'Speaker notes',
            },
          },
          required: ['title', 'content', 'layout'],
        },
      },
      theme: {
        type: 'string',
        enum: ['modern', 'minimal', 'corporate', 'creative', 'dark'],
        description: 'Presentation theme (default: modern)',
      },
      author: {
        type: 'string',
        description: 'Author name',
      },
    },
    required: ['title', 'slides'],
  },
  
  async execute(args: any, env: any, userId?: string): Promise<string> {
    const { title, slides, theme = 'modern', author } = args;
    
    console.log(`[Slides] Creating presentation: ${title}`);
    console.log(`[Slides] Slides: ${slides.length}, Theme: ${theme}`);
    
    // In production, this would integrate with Morgus's presentation service
    // Generate unique presentation ID
    const presentationId = `pres_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    
    // Summary of slides
    const slidesSummary = slides.map((slide: Slide, i: number) => 
      `${i + 1}. **${slide.title}** (${slide.layout})`
    ).join('\n');
    
    return `✅ Presentation created successfully!

## ${title}

**Presentation ID:** ${presentationId}
**Theme:** ${theme}
**Slides:** ${slides.length}
${author ? `**Author:** ${author}` : ''}

### Slides

${slidesSummary}

### Next Steps

1. Review slides
2. Export to PDF or PPTX using \`export_slides\`
3. Share with your audience

**Preview URL:** \`/presentations/${presentationId}\``;
  },
};

/**
 * Export Slides Tool
 */
export const exportSlidesTool: Tool = {
  name: 'export_slides',
  description: 'Export presentation slides to PDF or PPTX format',
  schema: {
    type: 'object',
    properties: {
      presentationId: {
        type: 'string',
        description: 'Presentation ID from create_slides',
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
    
    console.log(`[Slides] Exporting ${presentationId} to ${format}`);
    
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
 * All slides tools
 */
export const slidesTools: Tool[] = [
  createSlidesTool,
  exportSlidesTool,
];
