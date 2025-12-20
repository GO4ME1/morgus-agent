/**
 * Skills System for Morgus Agent
 * 
 * A skill is a reusable, domain-specific capability that teaches the agent
 * how to perform specialized tasks. Skills are stored as markdown files
 * with optional supporting resources.
 * 
 * Based on patterns from Anthropic and OpenAI's skills implementations.
 */

export interface Skill {
  id: string;
  name: string;
  description: string;
  content: string;
  keywords: string[];
  createdAt: string;
  source?: 'builtin' | 'generated' | 'user';
}

export interface SkillMatch {
  skill: Skill;
  relevanceScore: number;
  matchedKeywords: string[];
}

/**
 * Built-in skills that come with Morgus
 */
export const BUILTIN_SKILLS: Skill[] = [
  {
    id: 'website-builder',
    name: 'Professional Website Builder',
    description: 'Creates modern, responsive websites with best practices',
    keywords: ['website', 'web', 'landing page', 'portfolio', 'business site', 'html', 'css', 'deploy'],
    createdAt: '2024-12-19',
    source: 'builtin',
    content: `# Website Builder Skill

## Overview
This skill guides the creation of professional, modern websites.

## Best Practices

### Structure
1. **Always start with a logo** - Use generate_image or search_images to create/find a logo
2. **Use semantic HTML** - header, nav, main, section, footer
3. **Mobile-first design** - Start with mobile layout, then expand
4. **Consistent spacing** - Use a spacing scale (4px, 8px, 16px, 24px, 32px)

### Visual Design
- Use a cohesive color palette (primary, secondary, accent, neutral)
- Limit fonts to 2-3 families max
- Ensure sufficient contrast (WCAG AA minimum)
- Add subtle shadows and rounded corners for depth

### Sections to Include
1. Hero section with headline, subheadline, and CTA
2. Features/Services section with icons
3. About section with story/mission
4. Testimonials or social proof
5. Contact form or CTA section
6. Footer with links and copyright

### Performance
- Optimize images (use appropriate sizes)
- Minimize CSS/JS
- Use lazy loading for images below the fold

### Deployment
- Deploy to Cloudflare Pages using deploy_website tool
- Provide custom domain instructions
- Include SSL (automatic with Cloudflare)

## Template Structure
\`\`\`html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{TITLE}}</title>
  <style>/* Modern CSS with variables */</style>
</head>
<body>
  <header><!-- Logo + Navigation --></header>
  <main>
    <section class="hero"><!-- Hero content --></section>
    <section class="features"><!-- Features grid --></section>
    <section class="about"><!-- About content --></section>
    <section class="testimonials"><!-- Social proof --></section>
    <section class="cta"><!-- Call to action --></section>
  </main>
  <footer><!-- Footer content --></footer>
</body>
</html>
\`\`\`
`
  },
  {
    id: 'data-analysis',
    name: 'Data Analysis & Visualization',
    description: 'Analyzes data and creates insightful visualizations',
    keywords: ['analyze', 'data', 'chart', 'graph', 'statistics', 'visualization', 'compare', 'trend'],
    createdAt: '2024-12-19',
    source: 'builtin',
    content: `# Data Analysis Skill

## Overview
This skill guides data analysis and visualization tasks.

## Analysis Process

### 1. Understand the Data
- Identify data types (numerical, categorical, temporal)
- Check for missing values
- Look for outliers
- Understand the domain context

### 2. Choose the Right Visualization
| Data Type | Best Chart |
|-----------|------------|
| Comparison | Bar chart |
| Trend over time | Line chart |
| Part of whole | Pie chart |
| Distribution | Histogram |
| Correlation | Scatter plot |

### 3. Create Clear Visualizations
- Use descriptive titles
- Label axes clearly
- Include units
- Use color purposefully
- Add legends when needed

### 4. Interpret Results
- State key findings clearly
- Provide context
- Note limitations
- Suggest actionable insights

## Using create_chart Tool
\`\`\`
create_chart({
  type: "bar" | "line" | "pie",
  labels: ["Label1", "Label2", ...],
  data: [value1, value2, ...],
  title: "Descriptive Title"
})
\`\`\`

## Best Practices
- Always verify data accuracy before visualizing
- Round numbers appropriately for readability
- Use consistent formatting
- Tell a story with your data
`
  },
  {
    id: 'code-execution',
    name: 'Code Execution & Development',
    description: 'Executes code and helps with programming tasks',
    keywords: ['code', 'python', 'javascript', 'bash', 'script', 'program', 'execute', 'run', 'debug'],
    createdAt: '2024-12-19',
    source: 'builtin',
    content: `# Code Execution Skill

## Overview
This skill guides code execution and development tasks.

## Available Languages
- **Python 3.11** - Data analysis, automation, web scraping
- **JavaScript (Node.js 18)** - Web development, APIs
- **Bash** - System operations, file management, Git

## Pre-installed Libraries

### Python
- requests, beautifulsoup4 (web scraping)
- pandas, numpy (data analysis)
- matplotlib, pillow (visualization/images)
- PyPDF2 (PDF processing)
- python-docx (Word documents)

### Node.js
- Standard library
- npm packages can be installed

## Best Practices

### Error Handling
\`\`\`python
try:
    result = risky_operation()
except Exception as e:
    print(f"Error: {e}")
\`\`\`

### Output
- Always print results for visibility
- Use formatted output for readability
- Truncate large outputs (first 5000 chars)

### File Processing
- Use base64 decoding for uploaded files
- Handle different file types appropriately
- Clean up temporary files

## Common Patterns

### Read PDF
\`\`\`python
import base64, io
from PyPDF2 import PdfReader
data_url = "data:application/pdf;base64,..."
base64_data = data_url.split(',')[1]
pdf_bytes = base64.b64decode(base64_data)
reader = PdfReader(io.BytesIO(pdf_bytes))
text = ''.join(page.extract_text() for page in reader.pages)
print(text[:5000])
\`\`\`

### Web Scraping
\`\`\`python
import requests
from bs4 import BeautifulSoup
response = requests.get(url)
soup = BeautifulSoup(response.text, 'html.parser')
\`\`\`

### Data Analysis
\`\`\`python
import pandas as pd
df = pd.read_csv('data.csv')
print(df.describe())
\`\`\`
`
  },
  {
    id: 'browser-automation',
    name: 'Browser Automation',
    description: 'Automates web browsing and interactions',
    keywords: ['browse', 'navigate', 'click', 'type', 'website', 'automation', 'scrape', 'login'],
    createdAt: '2024-12-19',
    source: 'builtin',
    content: `# Browser Automation Skill

## Overview
This skill guides browser automation tasks using BrowserBase + Playwright.

## Available Actions
- **navigate** - Go to a URL
- **get_content** - Extract page content
- **click** - Click an element
- **type** - Enter text in a field
- **screenshot** - Capture the page

## CSS Selectors

### By Text Content
\`\`\`
button:has-text("Sign In")
a:has-text("Login")
\`\`\`

### By ID
\`\`\`
#login-button
#search-input
\`\`\`

### By Class
\`\`\`
.sign-in-btn
.nav-link
\`\`\`

### By Attribute
\`\`\`
[data-testid="signin"]
[href="/login"]
[type="submit"]
\`\`\`

## Workflow Pattern

1. **Navigate** to the target URL
2. **Wait** for page to load (automatic)
3. **Get content** to understand the page
4. **Interact** (click, type) as needed
5. **Verify** the result

## Handling Special Cases

### CAPTCHAs & Login
When encountering CAPTCHAs or login forms:
1. STOP automation
2. Inform user to complete manually
3. Provide the live view link
4. Wait for user confirmation
5. Continue with the task

### Dynamic Content
- Wait for elements to appear
- Use specific selectors
- Handle loading states

## Session Management
- Sessions persist for 14 minutes
- Reuse sessions across messages
- Close sessions when done to save costs

## Best Practices
- Start with navigation
- Get content before interacting
- Use specific selectors
- Handle errors gracefully
- Respect rate limits
`
  },
  {
    id: 'full-stack-app',
    name: 'Full-Stack App Development',
    description: 'Creates database-backed applications with Supabase',
    keywords: ['app', 'database', 'supabase', 'crud', 'authentication', 'full-stack', 'todo', 'blog'],
    createdAt: '2024-12-19',
    source: 'builtin',
    content: `# Full-Stack App Development Skill

## Overview
This skill guides creation of database-backed apps using Supabase.

## Supabase Features
- PostgreSQL database with auto-generated APIs
- Built-in authentication (email, OAuth, magic links)
- File storage
- Realtime subscriptions
- FREE tier: 500MB database, 1GB storage, 50K users

## Architecture Pattern

### Frontend (Cloudflare Pages)
- HTML/CSS/JavaScript
- Supabase JS client via CDN
- Responsive design

### Backend (Supabase)
- PostgreSQL database
- Row Level Security (RLS)
- Auto-generated REST API

## Implementation Steps

### 1. Create Frontend
Include Supabase client:
\`\`\`html
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
\`\`\`

Initialize:
\`\`\`javascript
const supabase = window.supabase.createClient(
  'YOUR-SUPABASE-URL',
  'YOUR-ANON-KEY'
);
\`\`\`

### 2. Provide SQL Schema
\`\`\`sql
-- Create table
CREATE TABLE todos (
  id bigint primary key generated always as identity,
  task text not null,
  is_complete boolean default false,
  created_at timestamp with time zone default now()
);

-- Enable RLS
ALTER TABLE todos ENABLE ROW LEVEL SECURITY;

-- Create policy (for demo - allows all access)
CREATE POLICY "Allow public access" ON public.todos
  FOR ALL TO anon USING (true);
\`\`\`

### 3. CRUD Operations
\`\`\`javascript
// Fetch
const { data } = await supabase.from('todos').select('*');

// Insert
await supabase.from('todos').insert([{ task: 'Buy milk' }]);

// Update
await supabase.from('todos').update({ is_complete: true }).eq('id', 1);

// Delete
await supabase.from('todos').delete().eq('id', 1);
\`\`\`

### 4. User Setup Instructions
1. Go to https://database.new
2. Create new project
3. Run SQL in SQL Editor
4. Get URL and anon key from Settings > API
5. Update frontend with credentials

## Security Best Practices
- Always enable Row Level Security
- Use proper auth-based policies in production
- Never hardcode real credentials in public code
`
  }
];

/**
 * Skills Manager - handles skill discovery, matching, and context injection
 */
export class SkillsManager {
  private skills: Map<string, Skill> = new Map();
  private generatedSkills: Skill[] = [];

  constructor() {
    // Load built-in skills
    BUILTIN_SKILLS.forEach(skill => {
      this.skills.set(skill.id, skill);
    });
  }

  /**
   * Add a new skill (generated or user-provided)
   */
  addSkill(skill: Skill): void {
    this.skills.set(skill.id, skill);
    if (skill.source === 'generated') {
      this.generatedSkills.push(skill);
    }
  }

  /**
   * Get all skills
   */
  getAllSkills(): Skill[] {
    return Array.from(this.skills.values());
  }

  /**
   * Find skills relevant to a user query
   */
  findRelevantSkills(query: string, maxResults: number = 3): SkillMatch[] {
    const queryLower = query.toLowerCase();
    const queryWords = queryLower.split(/\s+/);
    
    const matches: SkillMatch[] = [];

    for (const skill of this.skills.values()) {
      const matchedKeywords: string[] = [];
      let score = 0;

      // Check keyword matches
      for (const keyword of skill.keywords) {
        if (queryLower.includes(keyword.toLowerCase())) {
          matchedKeywords.push(keyword);
          score += 2; // Direct keyword match
        }
      }

      // Check word overlap
      for (const word of queryWords) {
        if (word.length > 3) { // Skip short words
          for (const keyword of skill.keywords) {
            if (keyword.toLowerCase().includes(word)) {
              score += 0.5; // Partial match
            }
          }
        }
      }

      // Check description match
      if (skill.description.toLowerCase().includes(queryLower.substring(0, 20))) {
        score += 1;
      }

      if (score > 0) {
        matches.push({
          skill,
          relevanceScore: score,
          matchedKeywords
        });
      }
    }

    // Sort by relevance and return top matches
    return matches
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, maxResults);
  }

  /**
   * Generate context injection for relevant skills
   */
  generateSkillContext(query: string): string {
    const matches = this.findRelevantSkills(query, 2);
    
    if (matches.length === 0) {
      return '';
    }

    let context = '\n\n📚 **RELEVANT SKILLS LOADED:**\n';
    
    for (const match of matches) {
      context += `\n### ${match.skill.name}\n`;
      context += match.skill.content;
      context += '\n---\n';
    }

    return context;
  }

  /**
   * List available skills (for agent to report)
   */
  listSkills(): string {
    const skills = this.getAllSkills();
    let list = '## Available Skills\n\n';
    
    for (const skill of skills) {
      list += `- **${skill.name}** (${skill.source}): ${skill.description}\n`;
      list += `  Keywords: ${skill.keywords.join(', ')}\n\n`;
    }

    return list;
  }
}

// Export singleton instance
export const skillsManager = new SkillsManager();
