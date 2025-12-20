/**
 * Skills System for Morgus Agent v2.0
 * 
 * A skill is a reusable, domain-specific capability that teaches the agent
 * how to perform specialized tasks. Skills are stored as markdown files
 * with optional supporting resources.
 * 
 * Based on patterns from Manus Context Engineering, Anthropic, and OpenAI.
 * Enhanced with the Morgus Flair: clarity, purpose, and user-centric design.
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

// Skill content stored as separate constants for cleaner code
const WEBSITE_BUILDER_CONTENT = `# 🚀 Morgus Website Builder Skill v2.0

## 🌟 Overview

This skill empowers Morgus to architect and construct cutting-edge, professional websites. It's not just about code; it's about creating an experience. This guide ensures every website is built with a foundation of modern best practices, from initial concept to final deployment.

**The Morgus Philosophy:** We build websites that are not only visually stunning but also performant, accessible, and scalable. Every project is a testament to quality and innovation.

---

## 🔮 The Morgus Touch: Core Principles

| Principle | Description |
|---|---|
| **Clarity & Purpose** | Every website must have a clear goal. What should the user do? Learn, buy, sign up? This dictates the entire structure. |
| **User-Centric Design** | We design for the user first. The experience should be intuitive, engaging, and seamless across all devices. |
| **Performance is Key** | A slow website is a broken website. We prioritize speed through optimization at every step. |
| **Secure by Default** | Security is not an afterthought. We build with security in mind from the ground up. |
| **Future-Proof** | We use modern, stable technologies to ensure the website is maintainable and scalable for the future. |

---

## 🛠️ The Build Process: A Step-by-Step Guide

### Phase 1: Discovery & Planning

1.  **Define the Goal:** Use ask to clarify the primary objective of the website (e.g., lead generation, e-commerce, portfolio).
2.  **Identify the Target Audience:** Who is this website for? Understanding the user helps tailor the design and content.
3.  **Content Strategy:** What information needs to be on the site? Plan the key sections (Home, About, Services, Contact, etc.).
4.  **Tech Stack Selection:** For most static sites, **Vite + React + TypeScript + TailwindCSS** is the recommended stack. Use webdev_init_project with the web-static scaffold.

### Phase 2: Design & Prototyping

1.  **Logo & Branding:** Use generate to create a unique logo. Establish a color palette (primary, secondary, accent) and typography.
2.  **Layout & Wireframing:** Create a low-fidelity layout for each page. Focus on structure and user flow.
3.  **Visual Design:** Apply the branding to the wireframes. Ensure visual hierarchy, contrast, and a clean, modern aesthetic.

### Phase 3: Development

1.  **Component-Based Architecture:** Break down the design into reusable React components (e.g., Navbar, Hero, Footer, Card).
2.  **Semantic HTML:** Use meaningful HTML tags (header, nav, main, section, footer) for accessibility and SEO.
3.  **Responsive Design with TailwindCSS:** Use Tailwind's mobile-first utility classes to ensure the site looks great on all devices.
4.  **Accessibility (a11y):** Ensure all images have alt tags. Use proper heading structure (H1, H2, H3). Ensure sufficient color contrast.

### Phase 4: Optimization & Deployment

1.  **Image Optimization:** Use modern formats like WebP. Compress images to reduce file size.
2.  **Performance Tuning:** Minify CSS and JavaScript (Vite handles this automatically in the build process). Use lazy loading for images and videos below the fold.
3.  **Deployment:** Use wrangler pages deploy to deploy to Cloudflare Pages for global distribution and free SSL. Provide instructions for connecting a custom domain.

---

## ✨ The Morgus Flair: Signature Elements

*   **Subtle Animations & Transitions:** Use CSS transitions to add a touch of elegance to hover states and interactions.
*   **Engaging Micro-interactions:** Provide feedback for user actions (e.g., button clicks, form submissions).
*   **Dark Mode:** Always offer a dark mode option for user preference and comfort.
*   **Custom 404 Page:** Create a unique and helpful 404 page that guides users back on track.

---

## 🎨 Modern CSS Best Practices

Use CSS custom properties for theming:
- Color System: primary, secondary, accent, background, surface, text, text-muted
- Spacing Scale: 0.25rem, 0.5rem, 0.75rem, 1rem, 1.5rem, 2rem, 3rem, 4rem
- Typography: Use Inter or system-ui for body, Cal Sans for display
- Shadows: sm, md, lg for depth
- Border Radius: sm (0.375rem), md (0.5rem), lg (1rem), full (9999px)

Support dark mode with @media (prefers-color-scheme: dark)

---

## 📐 Responsive Breakpoints

| Breakpoint | Width | Use Case |
|---|---|---|
| sm | 640px | Large phones |
| md | 768px | Tablets |
| lg | 1024px | Laptops |
| xl | 1280px | Desktops |
| 2xl | 1536px | Large screens |

---

## 📚 Resources & References

*   React Documentation: https://react.dev/
*   TailwindCSS Documentation: https://tailwindcss.com/docs
*   Vite Documentation: https://vitejs.dev/
*   Web Content Accessibility Guidelines (WCAG): https://www.w3.org/WAI/standards-guidelines/wcag/
`;

const LANDING_PAGE_CONTENT = `# 🔥 Morgus High-Conversion Landing Page Skill v2.0

## 🎯 Overview

This skill is designed to create high-impact, conversion-focused landing pages. A landing page has one job: to convert visitors into customers, leads, or users. This guide ensures every landing page is a finely-tuned conversion machine.

**The Morgus Philosophy:** We don't just build pages; we build pathways. Every element is meticulously crafted to guide the user towards a single, clear call-to-action (CTA).

---

## 🚀 The Conversion Framework: Key Components

| Component | Description | Purpose |
|---|---|---|
| **Hero Section** | The first impression. A compelling headline, a clear sub-headline, and a prominent CTA. | Capture attention in < 5 seconds |
| **Social Proof** | Testimonials, logos of companies you've worked with, or user reviews. | Build trust and credibility |
| **Problem/Solution** | Clearly articulate the problem your product solves and how it solves it. | Create emotional connection |
| **Features & Benefits** | Don't just list features; explain the benefits. How does it make the user's life better? | Demonstrate value |
| **The Offer** | What are you offering? A free trial, a discount, a demo? Make it irresistible. | Reduce friction |
| **The CTA** | The final ask. Use strong, action-oriented language. There should be one primary CTA. | Drive conversion |

---

## 🎨 The Art of Persuasion: Design & Copywriting

### 1. Visual Hierarchy

*   Guide the user's eye down the page towards the CTA.
*   Use size, color, and spacing to create a clear flow.
*   The CTA button should be the most visually prominent element.

### 2. Compelling Copywriting

*   **Headline:** Grab attention and communicate the core value proposition in under 5 seconds.
    *   BAD: "Welcome to Our Website"
    *   GOOD: "Double Your Sales in 30 Days or Your Money Back"
*   **Sub-headline:** Elaborate on the headline and provide more context.
*   **Body Copy:** Use clear, concise language. Focus on benefits, not just features.
*   **CTA Button:** Use action words (e.g., "Get Started Free," "Claim Your Discount," "Join 10,000+ Users").

### 3. Trust & Credibility

*   **Testimonials:** Use real quotes from real customers. Include photos and names if possible.
*   **Trust Badges:** Security seals, industry awards, or money-back guarantees.
*   **Stats & Numbers:** "Trusted by 50,000+ businesses" or "4.9/5 stars from 2,000+ reviews"

---

## 🧪 The Science of Optimization: A/B Testing

A landing page is never truly "done." Continuously test different elements to improve conversion rates.

**Elements to Test:**
*   Headlines (biggest impact)
*   CTA button text and color
*   Hero images and videos
*   Form length and fields
*   Page layout and structure
*   Social proof placement

**Morgus Pro-Tip:** Change only one element at a time to accurately measure its impact.

---

## 💡 The Morgus Flair: Conversion Boosters

*   **Urgency & Scarcity:** Limited-time offers, countdown timers, or "only X spots left" can encourage immediate action.
*   **Exit-Intent Popups:** Offer a last-chance deal before the user leaves the page.
*   **Sticky CTA:** Keep the CTA button visible as the user scrolls.
*   **Video Demonstrations:** Show, don't just tell. A short video can be incredibly persuasive.
*   **Animated Statistics:** Animate numbers counting up to draw attention to impressive stats.

---

## 📐 Landing Page Structure Template

1. HERO SECTION - Compelling headline, sub-headline, primary CTA, social proof snippet
2. LOGOS / SOCIAL PROOF - Company logos or "As seen in"
3. PROBLEM / SOLUTION - Problem statement and solution description
4. FEATURES / BENEFITS - Feature icons with benefit descriptions
5. TESTIMONIALS - Real customer quotes with photos
6. FINAL CTA - Reinforced value proposition with CTA button
7. FOOTER - Copyright and minimal links

---

## 📚 Resources & References

*   Unbounce Landing Page Analyzer: https://unbounce.com/landing-page-analyzer/
*   Copyblogger - Landing Pages: https://copyblogger.com/landing-pages/
*   HubSpot - Landing Page Best Practices: https://blog.hubspot.com/marketing/landing-page-best-practices
`;

const FULLSTACK_APP_CONTENT = `# 🌌 Morgus Full-Stack App Development Skill v2.0

## 🚀 Overview

This skill provides a comprehensive framework for building robust, scalable, and secure full-stack applications. It goes beyond basic CRUD and covers the entire lifecycle of a modern web application, from database design to deployment and maintenance.

**The Morgus Philosophy:** We build applications that are not just functional but also delightful to use. We combine powerful backend architecture with a seamless frontend experience to create products that users love.

---

## 🏗️ The Modern Full-Stack Architecture

| Layer | Technology | Rationale |
|---|---|---|
| **Frontend** | Vite + React + TypeScript + TailwindCSS | A modern, performant, and type-safe stack for building beautiful user interfaces. |
| **Backend** | Drizzle ORM + MySQL/TiDB | A powerful and scalable database solution with a type-safe ORM for easy and secure database access. |
| **Authentication** | Manus-Oauth | A secure and easy-to-use authentication solution that handles user management and social logins. |
| **Deployment** | Cloudflare Pages (Frontend) & Fly.io (Backend) | A globally distributed and scalable deployment solution for both the frontend and backend. |

---

## 🗺️ The Development Roadmap

### Phase 1: Project Scaffolding

1.  **Initialize the Project:** Use webdev_init_project with the web-db-user scaffold. This will set up the entire project structure with all the necessary dependencies and configurations.

### Phase 2: Database Design

1.  **Define the Schema:** Identify the data models for your application (e.g., users, posts, comments). Define the relationships between them (one-to-one, one-to-many, many-to-many).
2.  **Write the Drizzle Schema:** Use Drizzle's TypeScript-based schema definition to create your database tables with proper types, constraints, and relationships.

### Phase 3: Backend Development

1.  **Create the API Endpoints:** Use a framework like Express or Hono to create your API endpoints. Use Drizzle to interact with the database in a type-safe way.
2.  **Implement Authentication:** Use the Manus-Oauth library to handle user registration, login, and session management.
3.  **Business Logic:** Implement the core business logic of your application.

### Phase 4: Frontend Development

1.  **Build the UI Components:** Create reusable React components for your application's UI.
2.  **Connect to the Backend:** Use a library like axios or fetch to make API calls to your backend.
3.  **State Management:** Use a state management library like Zustand or Redux Toolkit to manage your application's state.

### Phase 5: Deployment

1.  **Deploy the Backend:** Use flyctl to deploy your backend to Fly.io.
2.  **Deploy the Frontend:** Use wrangler pages deploy to deploy your frontend to Cloudflare Pages.

---

## 🔒 Security Best Practices

| Threat | Mitigation |
|---|---|
| **SQL Injection** | Use an ORM like Drizzle. Never concatenate user input into SQL queries. |
| **Cross-Site Scripting (XSS)** | Sanitize user-generated content before rendering. Use React's built-in escaping. |
| **Cross-Site Request Forgery (CSRF)** | Use CSRF tokens for state-changing requests. |
| **Broken Authentication** | Use a secure authentication library. Implement rate limiting. Use strong password policies. |
| **Sensitive Data Exposure** | Never store sensitive data in plain text. Use HTTPS. Encrypt data at rest. |

---

## ✨ The Morgus Flair: Advanced Features

*   **Real-time Updates:** Use WebSockets or a service like Pusher to provide real-time updates to your users.
*   **Background Jobs:** Use a queueing system like BullMQ to run background jobs for long-running tasks.
*   **Email & Notifications:** Integrate with an email service like SendGrid or a notification service like OneSignal.
*   **File Uploads:** Use Cloudflare R2 or AWS S3 for scalable file storage.
*   **Caching:** Use Redis or Cloudflare KV for caching frequently accessed data.

---

## 📐 API Design Best Practices

RESTful API Conventions:
- GET    /api/posts          - List all posts
- GET    /api/posts/:id      - Get a single post
- POST   /api/posts          - Create a new post
- PUT    /api/posts/:id      - Update a post
- DELETE /api/posts/:id      - Delete a post

Response Format:
- success: boolean
- data: object or null
- error: object with code and message, or null

---

## 📚 Resources & References

*   Drizzle ORM Documentation: https://orm.drizzle.team/
*   Fly.io Documentation: https://fly.io/docs/
*   Cloudflare Pages Documentation: https://developers.cloudflare.com/pages/
*   OWASP Top 10: https://owasp.org/www-project-top-ten/
`;

const DATA_ANALYSIS_CONTENT = `# 📊 Morgus Data Analysis & Visualization Skill v2.0

## 🎯 Overview

This skill guides data analysis and visualization tasks to produce actionable insights and publication-ready charts.

**The Morgus Philosophy:** Data tells a story. Our job is to find that story and tell it clearly, compellingly, and accurately.

---

## 📈 Analysis Process

### 1. Understand the Data
- Identify data types (numerical, categorical, temporal)
- Check for missing values and outliers
- Understand the domain context and business questions

### 2. Choose the Right Visualization

| Data Type | Best Chart | When to Use |
|-----------|------------|-------------|
| Comparison | Bar chart | Comparing categories |
| Trend over time | Line chart | Showing changes over time |
| Part of whole | Pie/Donut chart | Showing proportions (< 6 categories) |
| Distribution | Histogram | Understanding data spread |
| Correlation | Scatter plot | Finding relationships |
| Ranking | Horizontal bar | Showing ordered comparisons |

### 3. Create Clear Visualizations
- Use descriptive titles that state the insight
- Label axes clearly with units
- Use color purposefully (not decoratively)
- Add legends when needed
- Include data source attribution

### 4. Interpret Results
- State key findings clearly
- Provide context and comparisons
- Note limitations and caveats
- Suggest actionable next steps

---

## 🐍 Python Data Analysis Patterns

Load and explore data with pandas:
- df.head() - View first rows
- df.describe() - Summary statistics
- df.info() - Data types and missing values

Handle missing values:
- df.dropna() - Remove rows with missing values
- df.fillna(value) - Fill missing values

Create visualizations with matplotlib/seaborn:
- Set figure size with figsize=(10, 6)
- Use descriptive titles and labels
- Save with plt.savefig('chart.png', dpi=150)

---

## 📚 Resources

*   Pandas Documentation: https://pandas.pydata.org/docs/
*   Matplotlib Gallery: https://matplotlib.org/stable/gallery/
*   Seaborn Tutorial: https://seaborn.pydata.org/tutorial.html
`;

const CODE_EXECUTION_CONTENT = `# 💻 Morgus Code Execution & Development Skill v2.0

## 🎯 Overview

This skill guides code execution and development tasks across multiple programming languages.

**The Morgus Philosophy:** Code is a tool to solve problems. We write clean, efficient, and well-documented code that gets the job done.

---

## 🛠️ Available Languages

| Language | Version | Best For |
|---|---|---|
| **Python** | 3.11 | Data analysis, automation, web scraping, AI/ML |
| **JavaScript** | Node.js 22 | Web development, APIs, scripting |
| **Bash** | 5.x | System operations, file management, Git |

---

## 📦 Pre-installed Python Libraries

- **Web:** requests, beautifulsoup4, httpx
- **Data:** pandas, numpy, openpyxl
- **Visualization:** matplotlib, seaborn, plotly
- **Documents:** PyPDF2, python-docx, reportlab
- **Images:** pillow, pdf2image

---

## 🔧 Best Practices

### Error Handling
Always wrap risky operations in try/except blocks:
- Catch specific exceptions first (FileNotFoundError, ValueError)
- Use a general Exception catch as fallback
- Print helpful error messages

### Output
- Always print results for visibility
- Use formatted output for readability
- Truncate large outputs (first 5000 chars)

---

## 📚 Common Patterns

### Read PDF
Use PyPDF2 to extract text from PDF files:
- Create PdfReader with file path
- Iterate through pages and extract text
- Print first 5000 characters

### Web Scraping
Use requests + BeautifulSoup:
- Set User-Agent header to avoid blocks
- Parse HTML with BeautifulSoup
- Use CSS selectors to find elements

### Data Analysis
Use pandas for data manipulation:
- Read CSV with pd.read_csv()
- Get summary with df.describe()
- Group and aggregate with df.groupby()
`;

const BROWSER_AUTOMATION_CONTENT = `# 🌐 Morgus Browser Automation Skill v2.0

## 🎯 Overview

This skill guides browser automation tasks using BrowserBase + Playwright for reliable web interactions.

**The Morgus Philosophy:** We automate thoughtfully, respecting rate limits and handling edge cases gracefully.

---

## 🛠️ Available Actions

| Action | Description | Use Case |
|---|---|---|
| **navigate** | Go to a URL | Starting point for any automation |
| **get_content** | Extract page content | Understanding page structure |
| **click** | Click an element | Interacting with buttons, links |
| **type** | Enter text in a field | Filling forms, search boxes |
| **screenshot** | Capture the page | Documentation, debugging |

---

## 🎯 CSS Selectors

By Text Content:
- button:has-text("Sign In")
- a:has-text("Login")

By ID:
- #login-button
- #search-input

By Class:
- .sign-in-btn
- .nav-link

By Attribute:
- [data-testid="signin"]
- [href="/login"]
- [type="submit"]

---

## 🔄 Workflow Pattern

1. **Navigate** to the target URL
2. **Wait** for page to load (automatic)
3. **Get content** to understand the page
4. **Interact** (click, type) as needed
5. **Verify** the result

---

## ⚠️ Handling Special Cases

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

---

## 📚 Best Practices

- Start with navigation
- Get content before interacting
- Use specific selectors
- Handle errors gracefully
- Respect rate limits
- Close sessions when done
`;

/**
 * Built-in skills that come with Morgus v2.0
 * These are comprehensive, production-ready skills with the Morgus Flair
 */
export const BUILTIN_SKILLS: Skill[] = [
  {
    id: 'website-builder-v2',
    name: 'Morgus Website Builder',
    description: 'Architects and constructs cutting-edge, professional websites with modern best practices',
    keywords: ['website', 'web', 'portfolio', 'business site', 'html', 'css', 'deploy', 'react', 'vite', 'tailwind', 'responsive', 'seo'],
    createdAt: '2024-12-20',
    source: 'builtin',
    content: WEBSITE_BUILDER_CONTENT
  },
  {
    id: 'landing-page-v2',
    name: 'Morgus High-Conversion Landing Page',
    description: 'Creates high-impact, conversion-focused landing pages that turn visitors into customers',
    keywords: ['landing page', 'conversion', 'marketing', 'cta', 'lead generation', 'sales page', 'signup', 'hero', 'testimonials'],
    createdAt: '2024-12-20',
    source: 'builtin',
    content: LANDING_PAGE_CONTENT
  },
  {
    id: 'full-stack-app-v2',
    name: 'Morgus Full-Stack App Development',
    description: 'Creates robust, scalable, and secure full-stack applications with modern architecture',
    keywords: ['app', 'database', 'supabase', 'crud', 'authentication', 'full-stack', 'todo', 'blog', 'api', 'backend', 'frontend', 'drizzle', 'mysql'],
    createdAt: '2024-12-20',
    source: 'builtin',
    content: FULLSTACK_APP_CONTENT
  },
  {
    id: 'data-analysis-v2',
    name: 'Morgus Data Analysis & Visualization',
    description: 'Analyzes data and creates insightful, publication-ready visualizations',
    keywords: ['analyze', 'data', 'chart', 'graph', 'statistics', 'visualization', 'compare', 'trend', 'excel', 'csv', 'pandas'],
    createdAt: '2024-12-20',
    source: 'builtin',
    content: DATA_ANALYSIS_CONTENT
  },
  {
    id: 'code-execution-v2',
    name: 'Morgus Code Execution & Development',
    description: 'Executes code and helps with programming tasks across multiple languages',
    keywords: ['code', 'python', 'javascript', 'bash', 'script', 'program', 'execute', 'run', 'debug', 'automation'],
    createdAt: '2024-12-20',
    source: 'builtin',
    content: CODE_EXECUTION_CONTENT
  },
  {
    id: 'browser-automation-v2',
    name: 'Morgus Browser Automation',
    description: 'Automates web browsing and interactions with intelligent page understanding',
    keywords: ['browse', 'navigate', 'click', 'type', 'website', 'automation', 'scrape', 'login', 'form', 'screenshot'],
    createdAt: '2024-12-20',
    source: 'builtin',
    content: BROWSER_AUTOMATION_CONTENT
  }
];

/**
 * Manages skill discovery, matching, and retrieval
 */
export class SkillsManager {
  private skills: Map<string, Skill> = new Map();

  constructor() {
    // Load built-in skills
    for (const skill of BUILTIN_SKILLS) {
      this.skills.set(skill.id, skill);
    }
  }

  /**
   * Get all available skills
   */
  getAllSkills(): Skill[] {
    return Array.from(this.skills.values());
  }

  /**
   * Get a skill by ID
   */
  getSkill(id: string): Skill | undefined {
    return this.skills.get(id);
  }

  /**
   * Find skills relevant to a query
   */
  findRelevantSkills(query: string, maxResults: number = 3): SkillMatch[] {
    const queryLower = query.toLowerCase();
    const matches: SkillMatch[] = [];

    for (const skill of this.skills.values()) {
      const matchedKeywords: string[] = [];
      let score = 0;

      // Check keyword matches
      for (const keyword of skill.keywords) {
        if (queryLower.includes(keyword.toLowerCase())) {
          matchedKeywords.push(keyword);
          score += 10;
        }
      }

      // Check name match
      if (queryLower.includes(skill.name.toLowerCase())) {
        score += 20;
      }

      // Check description match
      const descWords = skill.description.toLowerCase().split(' ');
      for (const word of descWords) {
        if (word.length > 3 && queryLower.includes(word)) {
          score += 2;
        }
      }

      if (score > 0) {
        matches.push({
          skill,
          relevanceScore: score,
          matchedKeywords
        });
      }
    }

    // Sort by relevance and return top results
    return matches
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, maxResults);
  }

  /**
   * Add a new skill (for generated or user skills)
   */
  addSkill(skill: Skill): void {
    this.skills.set(skill.id, skill);
  }

  /**
   * Generate skill context for the system prompt
   */
  generateSkillContext(query: string): string {
    const relevantSkills = this.findRelevantSkills(query);
    
    if (relevantSkills.length === 0) {
      return '';
    }

    let context = '\n## 🎯 Relevant Skills for This Task\n\n';
    
    for (const match of relevantSkills) {
      context += `### ${match.skill.name}\n`;
      context += `${match.skill.content}\n\n`;
    }

    return context;
  }
}

// Export singleton instance
export const skillsManager = new SkillsManager();
