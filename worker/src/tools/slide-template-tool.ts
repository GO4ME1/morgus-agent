/**
 * Slide Template Tool
 * 
 * Use pre-built slide templates with customization options.
 * Provides instant access to professional presentations.
 */

import { SlideGenerator, PresentationConfig } from '../services/slide-generator';
import { getTemplate, searchTemplates, morgusTemplates } from '../templates/slide-templates';

export interface Tool {
  name: string;
  description: string;
  schema: any;
  execute: (args: any, env: any, userId?: string) => Promise<string>;
}

/**
 * Use Slide Template Tool
 */
export const useSlideTemplateTool: Tool = {
  name: 'use_slide_template',
  description: `Use a pre-built slide template and customize it for your needs.

**Available Templates:**
- morgus-product-launch: Launch a new product with neon branding
- morgus-technical-deep-dive: Present technical architecture
- morgus-brand-identity: Showcase brand identity
- morgus-investor-pitch: Professional investor pitch
- morgus-tutorial: Educational tutorial/how-to

**Customization Options:**
- Replace title and content
- Add/remove slides
- Override colors
- Change fonts
- Add images

Example:
{
  "templateId": "morgus-product-launch",
  "customizations": {
    "title": "My Product Launch",
    "slides": {
      "title": {
        "title": "My Product",
        "subtitle": "Revolutionary AI Platform"
      },
      "problem": {
        "content": "- Pain point 1\\n- Pain point 2"
      }
    }
  }
}`,

  schema: {
    type: 'object',
    properties: {
      templateId: {
        type: 'string',
        description: 'Template ID to use',
      },
      customizations: {
        type: 'object',
        description: 'Customizations to apply',
        properties: {
          title: {
            type: 'string',
            description: 'Override presentation title',
          },
          author: {
            type: 'string',
            description: 'Author name',
          },
          slides: {
            type: 'object',
            description: 'Slide-specific customizations (key = slide ID)',
          },
          colorPalette: {
            type: 'array',
            items: { type: 'string' },
            description: 'Override color palette [bg, text, accent1, accent2, accent3]',
          },
          fontFamily: {
            type: 'string',
            description: 'Override font family',
          },
        },
      },
    },
    required: ['templateId'],
  },
  
  async execute(args: any, env: any, userId?: string): Promise<string> {
    const { templateId, customizations = {} } = args;
    
    console.log(`[Slide Template] Using template: ${templateId}`);
    
    // Get template
    const template = getTemplate(templateId);
    if (!template) {
      return `❌ Template not found: ${templateId}

Available templates:
${morgusTemplates.map(t => `- ${t.id}: ${t.name}`).join('\n')}`;
    }
    
    // Apply customizations
    const config: PresentationConfig = {
      title: customizations.title || template.name,
      slides: template.slides.map(slide => {
        const custom = customizations.slides?.[slide.id] || {};
        return {
          ...slide,
          ...custom,
        };
      }),
      style: {
        ...template.style,
        ...(customizations.colorPalette && {
          colorPalette: customizations.colorPalette,
        }),
        ...(customizations.fontFamily && {
          typography: {
            ...template.style.typography,
            fontFamily: customizations.fontFamily,
          },
        }),
      },
      author: customizations.author,
      date: new Date().toISOString().split('T')[0],
    };
    
    // Generate presentation
    const slideFiles = SlideGenerator.generatePresentation(config);
    
    // Generate presentation ID
    const presentationId = `pres_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    
    console.log(`[Slide Template] Generated ${slideFiles.size} slides`);
    
    // Summary
    const slidesSummary = config.slides.map((slide, i) => 
      `${i + 1}. **${slide.title}** (${slide.layout})`
    ).join('\n');
    
    return `✅ Presentation created from template!

## ${config.title}

**Template:** ${template.name}
**Presentation ID:** ${presentationId}
**Slides:** ${config.slides.length}
${config.author ? `**Author:** ${config.author}` : ''}

### Template Details
- **Category:** ${template.category}
- **Description:** ${template.description}
- **Tags:** ${template.tags.join(', ')}

### Aesthetic
- **Direction:** ${config.style.aestheticDirection}
- **Colors:** ${config.style.colorPalette.join(', ')}
- **Font:** ${config.style.typography.fontFamily}

### Slides

${slidesSummary}

### Customizations Applied
${Object.keys(customizations).length > 0 ? 
  Object.entries(customizations).map(([k, v]) => `- ${k}: ${typeof v === 'object' ? 'Custom' : v}`).join('\n') :
  'None - using template defaults'}

### Next Steps

1. Review slides in preview
2. Make additional customizations if needed
3. Export to PDF or PPTX using \`export_slides\`

**Preview URL:** \`/presentations/${presentationId}\``;
  },
};

/**
 * List Slide Templates Tool
 */
export const listSlideTemplatesTool: Tool = {
  name: 'list_slide_templates',
  description: 'List all available slide templates or search for specific ones',
  schema: {
    type: 'object',
    properties: {
      category: {
        type: 'string',
        enum: ['business', 'technical', 'creative', 'educational', 'all'],
        description: 'Filter by category (default: all)',
      },
      search: {
        type: 'string',
        description: 'Search query',
      },
    },
  },
  
  async execute(args: any, env: any, userId?: string): Promise<string> {
    const { category = 'all', search } = args;
    
    let templates = morgusTemplates;
    
    // Filter by category
    if (category !== 'all') {
      templates = templates.filter(t => t.category === category);
    }
    
    // Search
    if (search) {
      templates = searchTemplates(search);
    }
    
    if (templates.length === 0) {
      return `No templates found matching your criteria.`;
    }
    
    const templateList = templates.map(t => 
      `### ${t.name} (\`${t.id}\`)
**Category:** ${t.category}
**Description:** ${t.description}
**Slides:** ${t.slides.length}
**Tags:** ${t.tags.join(', ')}
`
    ).join('\n');
    
    return `## Available Slide Templates (${templates.length})

${templateList}

### Usage

Use \`use_slide_template\` with the template ID to create a presentation:

\`\`\`json
{
  "templateId": "morgus-product-launch",
  "customizations": {
    "title": "Your Title",
    "author": "Your Name"
  }
}
\`\`\``;
  },
};

/**
 * All slide template tools
 */
export const slideTemplateTools: Tool[] = [
  useSlideTemplateTool,
  listSlideTemplatesTool,
];
