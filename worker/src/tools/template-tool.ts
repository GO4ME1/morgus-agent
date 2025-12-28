/**
 * Template Tool
 * 
 * Use pre-built templates for common development patterns.
 * Dramatically speeds up development by providing tested, production-ready code.
 */

import { getTemplate, searchTemplates, templates } from '../templates/library';
import { TemplateEngine } from '../templates/engine';

export interface Tool {
  name: string;
  description: string;
  schema: any;
  execute: (args: any, env: any, userId?: string) => Promise<string>;
}

export const useTemplateTool: Tool = {
  name: 'use_template',
  description: `Use a pre-built template for common development patterns.

Available templates:
- landing-page: Modern responsive landing page
- todo-app-fullstack: Full-stack todo app (React + Express + PostgreSQL)
- rest-api-express: REST API with authentication

Use this to quickly bootstrap projects with production-ready code.

Example:
{
  "templateId": "landing-page",
  "projectName": "my-product",
  "config": {
    "HERO_TITLE": "Welcome to My Product",
    "HERO_SUBTITLE": "The best solution for your needs"
  }
}`,

  schema: {
    type: 'object',
    properties: {
      templateId: {
        type: 'string',
        description: 'Template ID (e.g., "landing-page", "todo-app-fullstack")',
      },
      projectName: {
        type: 'string',
        description: 'Project name (used for directory and config)',
      },
      config: {
        type: 'object',
        description: 'Template-specific configuration (optional)',
      },
      listOnly: {
        type: 'boolean',
        description: 'If true, only list available templates without creating project',
      },
    },
  },

  async execute(args: any, env: any, userId?: string): Promise<string> {
    const { templateId, projectName, config = {}, listOnly = false } = args;

    // List templates only
    if (listOnly) {
      return this.listTemplates();
    }

    // Validate inputs
    if (!templateId) {
      return '❌ Error: templateId is required';
    }

    if (!projectName) {
      return '❌ Error: projectName is required';
    }

    // Get template
    const template = getTemplate(templateId);
    if (!template) {
      return `❌ Error: Template "${templateId}" not found\n\n${this.listTemplates()}`;
    }

    console.log(`[Template] Using template: ${template.name}`);

    // Merge config with defaults
    const finalConfig = {
      PROJECT_NAME: projectName,
      ...template.config,
      ...config,
    };

    // Render files
    const renderedFiles = template.files.map(file => {
      const content = file.template 
        ? TemplateEngine.render(file.content, finalConfig)
        : file.content;
      
      return {
        ...file,
        content,
        fullPath: `${projectName}/${file.path}`,
      };
    });

    // Generate summary
    const summary = `
## ✅ Template Applied: ${template.name}

**Category:** ${template.category}
**Difficulty:** ${template.difficulty}
**Estimated Time:** ${template.estimatedTime} minutes

### Description
${template.description}

### Files Created (${renderedFiles.length})

${renderedFiles.map(f => `- \`${f.fullPath}\`${f.description ? ` - ${f.description}` : ''}`).join('\n')}

### Dependencies

${template.dependencies.npm ? `**npm:** ${template.dependencies.npm.join(', ')}` : ''}
${template.dependencies.pip ? `**pip:** ${template.dependencies.pip.join(', ')}` : ''}

### Setup Steps

${template.setup.map((step, i) => 
  `${i + 1}. ${step.description}${step.optional ? ' (optional)' : ''}\n   \`${step.command}\``
).join('\n\n')}

${template.envVars && template.envVars.length > 0 ? `
### Environment Variables

${template.envVars.map(v => `- \`${v}\`: ${finalConfig[v] || 'Not set'}`).join('\n')}
` : ''}

### Configuration

\`\`\`json
${JSON.stringify(finalConfig, null, 2)}
\`\`\`

### Next Steps

1. Review the generated files
2. Install dependencies
3. Configure environment variables
4. Run setup commands
5. Start development!

**Tags:** ${template.tags.join(', ')}
`;

    return summary;
  },

  listTemplates(): string {
    return `
## 📚 Available Templates

${templates.map(t => `
### ${t.name} (\`${t.id}\`)
**Category:** ${t.category} | **Difficulty:** ${t.difficulty} | **Time:** ${t.estimatedTime}min

${t.description}

**Tags:** ${t.tags.join(', ')}
`).join('\n')}

---

**Usage:**
\`\`\`json
{
  "templateId": "landing-page",
  "projectName": "my-project",
  "config": {
    "HERO_TITLE": "Custom Title"
  }
}
\`\`\`
`;
  },
};
