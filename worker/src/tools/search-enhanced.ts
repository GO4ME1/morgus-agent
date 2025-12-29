/**
 * Enhanced Search Tools
 * 
 * Comprehensive search with specialized types:
 * - search_enhanced: Universal search with type selection
 * - search_images: Dedicated image search with auto-download
 * - search_apis: Find APIs with documentation
 * - search_tools: Find tools and services
 * - search_data: Find datasets
 */

import { EnhancedSearch, SearchOptions } from '../services/enhanced-search';

export interface Tool {
  name: string;
  description: string;
  schema: any;
  execute: (args: any, env: any, userId?: string) => Promise<string>;
}

/**
 * Enhanced Universal Search Tool
 */
export const searchEnhancedTool: Tool = {
  name: 'search_enhanced',
  description: `Universal search with specialized types and time filters.

**Search Types:**
- **info**: General web information (default)
- **image**: Find images with auto-download
- **api**: Find APIs with documentation
- **tool**: Find tools and services
- **data**: Find datasets
- **news**: Time-sensitive news
- **research**: Academic papers

**Time Filters:**
- all: No time restriction (default)
- past_day: Last 24 hours
- past_week: Last 7 days
- past_month: Last 30 days
- past_year: Last 365 days

**Features:**
- Multiple query variants for better coverage
- Automatic result ranking
- Caching for performance
- Structured results

Example:
{
  "type": "api",
  "queries": ["weather API", "weather data API"],
  "timeFilter": "past_year",
  "maxResults": 10
}`,

  schema: {
    type: 'object',
    properties: {
      type: {
        type: 'string',
        enum: ['info', 'image', 'api', 'tool', 'data', 'news', 'research'],
        description: 'Type of search',
      },
      queries: {
        type: 'array',
        items: { type: 'string' },
        description: 'Search queries (up to 3 variants)',
        maxItems: 3,
      },
      timeFilter: {
        type: 'string',
        enum: ['all', 'past_day', 'past_week', 'past_month', 'past_year'],
        description: 'Time filter for results',
      },
      maxResults: {
        type: 'number',
        description: 'Maximum results to return (default: 10)',
      },
    },
    required: ['type', 'queries'],
  },

  async execute(args: any, env: any, userId?: string): Promise<string> {
    const { type, queries, timeFilter = 'all', maxResults = 10 } = args;

    console.log(`[Search] Enhanced search: ${type}, queries: ${queries.join(', ')}`);

    try {
      const options: SearchOptions = {
        type,
        queries,
        timeFilter,
        maxResults,
      };

      const results = await EnhancedSearch.search(options);

      if (results.length === 0) {
        return `❌ No results found for "${queries.join(', ')}"

**Try:**
- Different search terms
- Broader queries
- Different search type
- Remove time filter`;
      }

      let output = `✅ Found ${results.length} result${results.length > 1 ? 's' : ''}

**Search Type:** ${type}
**Queries:** ${queries.join(', ')}
${timeFilter !== 'all' ? `**Time Filter:** ${timeFilter}` : ''}

---

`;

      results.forEach((result, i) => {
        output += `### ${i + 1}. ${result.title}\n\n`;
        output += `**URL:** ${result.url}\n\n`;
        output += `${result.snippet}\n\n`;
        
        if (result.source) {
          output += `**Source:** ${result.source}\n`;
        }
        
        if (result.date) {
          output += `**Date:** ${result.date.toISOString().split('T')[0]}\n`;
        }
        
        if (result.relevance) {
          output += `**Relevance:** ${(result.relevance * 100).toFixed(0)}%\n`;
        }

        // Type-specific metadata
        if (type === 'api' && 'apiName' in result) {
          const apiResult = result as any;
          output += `\n**API Details:**\n`;
          output += `- Documentation: ${apiResult.documentation}\n`;
          output += `- Authentication: ${apiResult.authentication}\n`;
          output += `- Pricing: ${apiResult.pricing}\n`;
          output += `- Rate Limit: ${apiResult.rateLimit}\n`;
          if (apiResult.endpoints) {
            output += `- Endpoints: ${apiResult.endpoints.length}\n`;
          }
        }

        if (type === 'tool' && 'toolName' in result) {
          const toolResult = result as any;
          output += `\n**Tool Details:**\n`;
          output += `- Category: ${toolResult.category}\n`;
          output += `- Pricing: ${toolResult.pricing}\n`;
          output += `- Features: ${toolResult.features.length}\n`;
        }

        if (type === 'data' && 'datasetName' in result) {
          const dataResult = result as any;
          output += `\n**Dataset Details:**\n`;
          output += `- Format: ${dataResult.format}\n`;
          output += `- Size: ${dataResult.size}\n`;
          output += `- License: ${dataResult.license}\n`;
          output += `- Download: ${dataResult.downloadUrl}\n`;
        }

        output += `\n---\n\n`;
      });

      return output;
    } catch (error) {
      return `❌ Search failed: ${error}

**Troubleshooting:**
- Check internet connection
- Try simpler queries
- Reduce maxResults
- Try different search type`;
    }
  },
};

/**
 * Image Search Tool
 */
export const searchImagesTool: Tool = {
  name: 'search_images',
  description: `Search for images with automatic download.

**Features:**
- Find high-quality images
- Auto-download to local storage
- Get image metadata (size, dimensions, format)
- Multiple query variants for better results

**Use Cases:**
- Find images for presentations
- Get logos and icons
- Find stock photos
- Download reference images

Example:
{
  "queries": ["mountain landscape", "mountain scenery"],
  "maxResults": 5,
  "downloadPath": "/path/to/images"
}`,

  schema: {
    type: 'object',
    properties: {
      queries: {
        type: 'array',
        items: { type: 'string' },
        description: 'Search queries (up to 3 variants)',
        maxItems: 3,
      },
      maxResults: {
        type: 'number',
        description: 'Maximum images to return (default: 10)',
      },
      downloadImages: {
        type: 'boolean',
        description: 'Auto-download images (default: true)',
      },
      downloadPath: {
        type: 'string',
        description: 'Path to save images (default: /tmp/images)',
      },
    },
    required: ['queries'],
  },

  async execute(args: any, env: any, userId?: string): Promise<string> {
    const {
      queries,
      maxResults = 10,
      downloadImages = true,
      downloadPath = '/tmp/images',
    } = args;

    console.log(`[Search] Image search: ${queries.join(', ')}`);

    try {
      const options: SearchOptions = {
        type: 'image',
        queries,
        maxResults,
        downloadImages,
        downloadPath,
      };

      const results = await EnhancedSearch.search(options);

      if (results.length === 0) {
        return `❌ No images found for "${queries.join(', ')}"`;
      }

      let output = `✅ Found ${results.length} image${results.length > 1 ? 's' : ''}

**Queries:** ${queries.join(', ')}
${downloadImages ? `**Downloaded to:** ${downloadPath}` : ''}

---

`;

      results.forEach((result, i) => {
        const imgResult = result as any;
        output += `### ${i + 1}. ${imgResult.title}\n\n`;
        
        if (imgResult.localPath) {
          output += `**Local Path:** \`${imgResult.localPath}\`\n`;
        }
        
        output += `**Image URL:** ${imgResult.imageUrl}\n`;
        output += `**Dimensions:** ${imgResult.width}x${imgResult.height}\n`;
        output += `**Format:** ${imgResult.format}\n`;
        output += `**Size:** ${(imgResult.size / 1024).toFixed(2)} KB\n`;
        output += `**Source:** ${imgResult.url}\n`;
        output += `\n---\n\n`;
      });

      if (downloadImages) {
        output += `\n💡 **Tip:** Images are ready to use in presentations, websites, or other tools.`;
      }

      return output;
    } catch (error) {
      return `❌ Image search failed: ${error}`;
    }
  },
};

/**
 * API Search Tool
 */
export const searchAPIsTool: Tool = {
  name: 'search_apis',
  description: `Search for APIs with documentation and details.

**Features:**
- Find REST APIs, GraphQL APIs, etc.
- Get documentation links
- See authentication methods
- Check pricing and rate limits
- View available SDKs

**Use Cases:**
- Find APIs for integration
- Compare API options
- Get API documentation
- Check API pricing

Example:
{
  "queries": ["weather API", "weather data"],
  "maxResults": 5
}`,

  schema: {
    type: 'object',
    properties: {
      queries: {
        type: 'array',
        items: { type: 'string' },
        description: 'Search queries (up to 3 variants)',
        maxItems: 3,
      },
      maxResults: {
        type: 'number',
        description: 'Maximum APIs to return (default: 10)',
      },
    },
    required: ['queries'],
  },

  async execute(args: any, env: any, userId?: string): Promise<string> {
    const { queries, maxResults = 10 } = args;

    console.log(`[Search] API search: ${queries.join(', ')}`);

    try {
      const options: SearchOptions = {
        type: 'api',
        queries,
        maxResults,
      };

      const results = await EnhancedSearch.search(options);

      if (results.length === 0) {
        return `❌ No APIs found for "${queries.join(', ')}"`;
      }

      let output = `✅ Found ${results.length} API${results.length > 1 ? 's' : ''}

**Queries:** ${queries.join(', ')}

---

`;

      results.forEach((result, i) => {
        const apiResult = result as any;
        output += `### ${i + 1}. ${apiResult.apiName}\n\n`;
        output += `${apiResult.snippet}\n\n`;
        output += `**Documentation:** ${apiResult.documentation}\n`;
        output += `**Website:** ${apiResult.url}\n\n`;
        
        output += `**Details:**\n`;
        output += `- Authentication: ${apiResult.authentication}\n`;
        output += `- Pricing: ${apiResult.pricing}\n`;
        output += `- Rate Limit: ${apiResult.rateLimit}\n`;
        
        if (apiResult.endpoints && apiResult.endpoints.length > 0) {
          output += `\n**Example Endpoints:**\n`;
          apiResult.endpoints.slice(0, 4).forEach((endpoint: string) => {
            output += `- \`${endpoint}\`\n`;
          });
        }
        
        if (apiResult.sdks && apiResult.sdks.length > 0) {
          output += `\n**Available SDKs:** ${apiResult.sdks.join(', ')}\n`;
        }
        
        output += `\n---\n\n`;
      });

      return output;
    } catch (error) {
      return `❌ API search failed: ${error}`;
    }
  },
};

/**
 * Tool Search Tool
 */
export const searchToolsTool: Tool = {
  name: 'search_tools',
  description: `Search for tools, services, and software.

**Features:**
- Find SaaS tools and services
- Compare features and pricing
- See alternatives
- Get tool categories

**Use Cases:**
- Find tools for specific tasks
- Compare tool options
- Discover alternatives
- Check pricing

Example:
{
  "queries": ["project management tool", "task management"],
  "maxResults": 5
}`,

  schema: {
    type: 'object',
    properties: {
      queries: {
        type: 'array',
        items: { type: 'string' },
        description: 'Search queries (up to 3 variants)',
        maxItems: 3,
      },
      maxResults: {
        type: 'number',
        description: 'Maximum tools to return (default: 10)',
      },
    },
    required: ['queries'],
  },

  async execute(args: any, env: any, userId?: string): Promise<string> {
    const { queries, maxResults = 10 } = args;

    console.log(`[Search] Tool search: ${queries.join(', ')}`);

    try {
      const options: SearchOptions = {
        type: 'tool',
        queries,
        maxResults,
      };

      const results = await EnhancedSearch.search(options);

      if (results.length === 0) {
        return `❌ No tools found for "${queries.join(', ')}"`;
      }

      let output = `✅ Found ${results.length} tool${results.length > 1 ? 's' : ''}

**Queries:** ${queries.join(', ')}

---

`;

      results.forEach((result, i) => {
        const toolResult = result as any;
        output += `### ${i + 1}. ${toolResult.toolName}\n\n`;
        output += `${toolResult.snippet}\n\n`;
        output += `**Category:** ${toolResult.category}\n`;
        output += `**Pricing:** ${toolResult.pricing}\n`;
        output += `**Website:** ${toolResult.url}\n\n`;
        
        if (toolResult.features && toolResult.features.length > 0) {
          output += `**Key Features:**\n`;
          toolResult.features.forEach((feature: string) => {
            output += `- ${feature}\n`;
          });
        }
        
        if (toolResult.alternatives && toolResult.alternatives.length > 0) {
          output += `\n**Alternatives:** ${toolResult.alternatives.join(', ')}\n`;
        }
        
        output += `\n---\n\n`;
      });

      return output;
    } catch (error) {
      return `❌ Tool search failed: ${error}`;
    }
  },
};

/**
 * Data Search Tool
 */
export const searchDataTool: Tool = {
  name: 'search_data',
  description: `Search for datasets and data sources.

**Features:**
- Find public datasets
- Get dataset metadata (size, format, license)
- See update frequency
- Get download links

**Use Cases:**
- Find data for analysis
- Get training data for ML
- Find public datasets
- Research data sources

Example:
{
  "queries": ["COVID-19 data", "coronavirus statistics"],
  "maxResults": 5
}`,

  schema: {
    type: 'object',
    properties: {
      queries: {
        type: 'array',
        items: { type: 'string' },
        description: 'Search queries (up to 3 variants)',
        maxItems: 3,
      },
      maxResults: {
        type: 'number',
        description: 'Maximum datasets to return (default: 10)',
      },
    },
    required: ['queries'],
  },

  async execute(args: any, env: any, userId?: string): Promise<string> {
    const { queries, maxResults = 10 } = args;

    console.log(`[Search] Data search: ${queries.join(', ')}`);

    try {
      const options: SearchOptions = {
        type: 'data',
        queries,
        maxResults,
      };

      const results = await EnhancedSearch.search(options);

      if (results.length === 0) {
        return `❌ No datasets found for "${queries.join(', ')}"`;
      }

      let output = `✅ Found ${results.length} dataset${results.length > 1 ? 's' : ''}

**Queries:** ${queries.join(', ')}

---

`;

      results.forEach((result, i) => {
        const dataResult = result as any;
        output += `### ${i + 1}. ${dataResult.datasetName}\n\n`;
        output += `${dataResult.snippet}\n\n`;
        output += `**Format:** ${dataResult.format}\n`;
        output += `**Size:** ${dataResult.size}\n`;
        output += `**Update Frequency:** ${dataResult.updateFrequency}\n`;
        output += `**License:** ${dataResult.license}\n`;
        output += `**Source:** ${dataResult.url}\n`;
        output += `**Download:** ${dataResult.downloadUrl}\n`;
        output += `\n---\n\n`;
      });

      return output;
    } catch (error) {
      return `❌ Data search failed: ${error}`;
    }
  },
};

/**
 * All enhanced search tools
 */
export const searchEnhancedTools: Tool[] = [
  searchEnhancedTool,
  searchImagesTool,
  searchAPIsTool,
  searchToolsTool,
  searchDataTool,
];
