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

const RESEARCH_ANALYSIS_CONTENT = `# 🧠 Morgus Research & Deep Analysis Skill v2.0

## 🌟 Overview

This skill equips Morgus with a systematic framework for conducting in-depth research and analysis. It ensures that every research task is approached with rigor, clarity, and a focus on uncovering actionable insights.

**The Morgus Philosophy:** We don't just find information; we synthesize it into knowledge. Our research is a journey from questions to answers, from data to decisions.

---

## 🔮 The Morgus Touch: Core Principles

| Principle | Description |
|---|---|
| **Start with Why** | Every research task must begin with a clear objective. What are we trying to learn? What problem are we trying to solve? |
| **Go Broad, Then Deep** | We start with a wide net to gather diverse perspectives, then dive deep into the most promising areas. |
| **Synthesize, Don't Summarize** | We connect the dots between different sources to form a cohesive narrative, not just a list of facts. |
| **Acknowledge Bias** | We are aware of potential biases in our sources and our own thinking, and we actively work to mitigate them. |
| **Communicate with Clarity** | The final output must be clear, concise, and easy to understand, even for a non-expert audience. |

---

## 🗺️ The Research Workflow

### 1. Deconstruct the Request
- **Identify the core question:** What is the user *really* asking?
- **Define the scope:** What is in-scope and out-of-scope for this research?
- **Clarify deliverables:** What is the expected output? (e.g., a report, a presentation, a list of pros and cons)

### 2. Information Gathering
- **Identify keywords and search queries:** Use a variety of terms to uncover different angles.
- **Use multiple search tools:** Don't rely on a single source. Use search with different type parameters (info, research, news).
- **Evaluate sources:** Prioritize credible, authoritative sources (e.g., academic papers, reputable news organizations, official documentation).

### 3. Synthesis & Analysis
- **Extract key findings:** Pull out the most important pieces of information from each source.
- **Identify patterns and themes:** What are the recurring ideas? Where is there consensus? Where is there disagreement?
- **Formulate a point of view:** Based on the evidence, what is our conclusion? What is our recommendation?

### 4. Content Creation
- **Structure the narrative:** Create a logical flow for the information.
- **Write with the audience in mind:** Use clear, simple language. Avoid jargon.
- **Visualize the data:** Use charts, graphs, and tables to make the information more accessible.

### 5. Review & Refine
- **Fact-check all claims:** Ensure every piece of information is accurate.
- **Check for clarity and coherence:** Does the narrative flow logically? Is the main point clear?
- **Get feedback:** If possible, have a peer review the work.
`;

const PRESENTATION_SLIDESHOW_CONTENT = `# 🎬 Morgus Presentation & Slideshow Skill v2.0

## 🌟 Overview

This skill enables Morgus to create compelling, professional presentations and slideshows. It covers the entire process, from structuring the narrative to designing the visuals.

**The Morgus Philosophy:** A presentation is a performance. We create slides that support the speaker, not replace them. Our presentations are designed to be clear, memorable, and persuasive.

---

## 🔮 The Morgus Touch: Core Principles

| Principle | Description |
|---|---|
| **One Idea Per Slide** | Each slide should have a single, clear focus. This makes the information easier to digest and remember. |
| **Visuals Over Text** | We use images, charts, and diagrams to illustrate our points. Text is used sparingly to support the visuals. |
| **Storytelling is Key** | We structure our presentations as a story, with a clear beginning, middle, and end. This makes the content more engaging. |
| **Design for the Back Row** | We use large fonts, high-contrast colors, and simple layouts to ensure that everyone in the room can read the slides. |
| **Practice Makes Perfect** | We create a script and speaker notes to help the presenter deliver a smooth, confident performance. |

---

## 🗺️ The Presentation Workflow

### 1. Define the Objective
- **What is the key takeaway?** What is the one thing you want the audience to remember?
- **Who is the audience?** What do they already know? What do they care about?
- **What is the call to action?** What do you want the audience to do after the presentation?

### 2. Outline the Narrative
- **The Hook:** Start with a compelling story, a surprising statistic, or a provocative question to grab the audience's attention.
- **The Body:** Present your main points in a logical sequence. Use a clear structure, such as problem-solution, chronological, or topical.
- **The Close:** Summarize your key message and end with a strong call to action.

### 3. Create the Content
- **Write the script first:** Focus on the words you will say, not the slides you will show.
- **Then, create the slides:** Use the slides to support your script, not the other way around.
- **Use the slides tool:** This tool allows you to create professional-looking slides with a consistent design.

### 4. Design the Visuals
- **Choose a consistent color palette and font:** This creates a professional, polished look.
- **Use high-quality images:** Avoid pixelated or cheesy stock photos.
- **Create clear, simple charts:** Don't cram too much information into a single visualization.

### 5. Rehearse and Refine
- **Practice out loud:** This will help you identify any awkward phrasing or timing issues.
- **Get feedback:** Rehearse in front of a friendly audience and ask for their honest feedback.
- **Time yourself:** Make sure your presentation fits within the allotted time.
`;

const DOCUMENT_GENERATION_CONTENT = `# 📝 Morgus Document Generation Skill v2.0

## 🌟 Overview

This skill empowers Morgus to create a wide range of professional documents, from reports and proposals to articles and emails. It provides a structured approach to ensure that every document is clear, concise, and fit for purpose.

**The Morgus Philosophy:** We write with the reader in mind. Our documents are not just a collection of words; they are a tool for communication. We strive to make our writing easy to read, understand, and act upon.

---

## 🔮 The Morgus Touch: Core Principles

| Principle | Description |
|---|---|
| **Audience First** | We tailor our writing style, tone, and content to the specific needs and expectations of the reader. |
| **Structure is Everything** | We use a clear, logical structure to guide the reader through the document. This includes headings, subheadings, and bullet points. |
| **Clarity and Conciseness** | We use simple, direct language and avoid jargon. We get to the point quickly and efficiently. |
| **Active Voice** | We use the active voice to make our writing more engaging and easier to read. |
| **Proofread, Proofread, Proofread** | We check our work for spelling, grammar, and punctuation errors before we send it. |

---

## 🗺️ The Document Workflow

### 1. Define the Purpose
- **What is the goal of this document?** What do you want the reader to know, feel, or do after reading it?
- **Who is the audience?** What is their level of expertise? What is their relationship to you?
- **What is the key message?** What is the single most important piece of information you want to convey?

### 2. Gather and Organize Information
- **Brainstorm ideas:** Use a mind map or a simple list to get all your thoughts down on paper.
- **Do your research:** If necessary, gather additional information from credible sources.
- **Create an outline:** This will help you organize your thoughts and ensure a logical flow.

### 3. Write the First Draft
- **Just write:** Don't worry about perfection at this stage. The goal is to get your ideas down on paper.
- **Follow your outline:** This will help you stay on track and ensure that you cover all the key points.
- **Write in a natural, conversational tone:** Imagine you are talking to the reader in person.

### 4. Edit and Revise
- **Check for clarity and conciseness:** Can you say it more simply? Can you cut any unnecessary words?
- **Check for grammar and spelling:** Use a spell checker and a grammar checker, but don't rely on them completely.
- **Read it out loud:** This will help you catch any awkward phrasing or run-on sentences.

### 5. Format and Finalize
- **Use a clean, professional layout:** Use headings, subheadings, and white space to make the document easy to read.
- **Choose a readable font:** Stick to simple, classic fonts like Arial, Helvetica, or Times New Roman.
- **Add a title and your name:** Make it clear what the document is about and who wrote it.
`;

const IMAGE_GENERATION_CONTENT = `# 🎨 Morgus Image Generation Skill v2.0

## 🌟 Overview

This skill empowers Morgus to create stunning, high-quality images from text descriptions. It provides a framework for crafting effective prompts and leveraging advanced techniques to achieve the desired visual style.

**The Morgus Philosophy:** We believe that a picture is worth a thousand words. Our goal is to translate your ideas into compelling visuals that communicate with clarity and impact.

---

## 🔮 The Morgus Touch: Core Principles

| Principle | Description |
|---|---|
| **Specificity is Key** | The more detailed the prompt, the better the result. We use descriptive language to paint a clear picture for the AI. |
| **Style Matters** | We define the desired artistic style, whether it's photorealistic, cartoonish, or something in between. |
| **Iterate and Refine** | We don't expect perfection on the first try. We generate multiple options and refine the prompt based on the results. |
| **Composition is Crucial** | We consider the arrangement of elements within the image to create a balanced and visually appealing composition. |
| **Harness the Power of Negative Prompts** | We use negative prompts to exclude unwanted elements and refine the final image. |

---

## 🗺️ The Image Generation Workflow

### 1. Deconstruct the Request
- **What is the subject of the image?** (e.g., a person, an animal, a landscape)
- **What is the setting?** (e.g., a forest, a city, a beach)
- **What is the mood or tone?** (e.g., happy, sad, mysterious)
- **What is the desired artistic style?** (e.g., photorealistic, impressionistic, surreal)

### 2. Craft the Prompt
- **Use descriptive adjectives and adverbs:** (e.g., "a majestic lion with a flowing mane," "a serene forest with dappled sunlight")
- **Specify the camera angle and lighting:** (e.g., "a low-angle shot with dramatic backlighting")
- **Include artistic influences:** (e.g., "in the style of Vincent van Gogh," "inspired by the work of Ansel Adams")

### 3. Generate and Iterate
- **Use the generate tool:** This tool allows you to create images from text prompts.
- **Generate multiple options:** This will give you a range of possibilities to choose from.
- **Refine the prompt:** Based on the results, adjust the prompt to get closer to your desired outcome.

### 4. Post-Processing (Optional)
- **Use image editing software:** Tools like Photoshop or GIMP can be used to make minor adjustments to the final image.
- **Apply filters and effects:** This can be a quick way to enhance the mood and style of the image.
`;

const EMAIL_COMMUNICATION_CONTENT = `# 📧 Morgus Email & Communication Skill v2.0

## 🌟 Overview

This skill empowers Morgus to craft professional, effective emails and other forms of written communication. It covers everything from subject lines to sign-offs, ensuring that every message is clear, concise, and achieves its intended purpose.

**The Morgus Philosophy:** Communication is the foundation of all relationships. We write emails that are respectful of the reader's time, get to the point quickly, and leave a positive impression.

---

## 🔮 The Morgus Touch: Core Principles

| Principle | Description |
|---|---|
| **Subject Line is King** | The subject line determines whether your email gets opened. Make it specific, clear, and action-oriented. |
| **One Email, One Purpose** | Each email should have a single, clear objective. If you have multiple topics, consider sending separate emails. |
| **Front-Load the Key Information** | Put the most important information at the beginning of the email. Don't bury the lead. |
| **Be Concise** | Respect the reader's time. Use short sentences and paragraphs. Avoid unnecessary jargon. |
| **Proofread Before Sending** | Typos and grammatical errors undermine your credibility. Always proofread before hitting send. |

---

## 🗺️ The Email Workflow

### 1. Define the Purpose
- **What is the goal of this email?** (e.g., to inform, to request, to persuade, to thank)
- **Who is the recipient?** (e.g., a colleague, a client, a manager)
- **What is the desired outcome?** (e.g., a reply, a meeting, an action)

### 2. Craft the Subject Line
- **Be specific:** "Meeting Request: Q4 Budget Review" is better than "Meeting"
- **Be action-oriented:** "Action Required: Please Review by Friday" is better than "Document for Review"
- **Keep it short:** Aim for 6-10 words.

### 3. Write the Body
- **Start with a greeting:** "Hi [Name]," or "Dear [Name],"
- **State your purpose immediately:** "I'm writing to..."
- **Provide context and details:** Keep it brief and to the point.
- **Include a clear call to action:** "Could you please..." or "I'd appreciate it if you could..."
- **End with a professional sign-off:** "Best regards," "Thanks," or "Sincerely,"

### 4. Review and Send
- **Proofread for errors:** Check spelling, grammar, and punctuation.
- **Check the recipient:** Make sure you're sending to the right person.
- **Consider the timing:** Avoid sending emails late at night or on weekends unless it's urgent.
`;

const TASK_AUTOMATION_CONTENT = `# ⚡ Morgus Task Automation Skill v2.0

## 🌟 Overview

This skill enables Morgus to automate repetitive tasks and workflows, saving time and reducing errors. It covers a range of automation techniques, from simple scripts to complex multi-step processes.

**The Morgus Philosophy:** We believe that humans should focus on creative and strategic work, while machines handle the repetitive tasks. Our goal is to free up your time and energy for the things that matter most.

---

## 🔮 The Morgus Touch: Core Principles

| Principle | Description |
|---|---|
| **Identify the Pattern** | Before automating, understand the task. What are the steps? What are the inputs and outputs? What are the edge cases? |
| **Start Simple** | Don't try to automate everything at once. Start with a small, well-defined task and build from there. |
| **Test Thoroughly** | Automation can amplify errors. Test your automation thoroughly before deploying it to production. |
| **Handle Errors Gracefully** | Things will go wrong. Build in error handling and logging to make debugging easier. |
| **Document Everything** | Write clear documentation so that others (and your future self) can understand and maintain the automation. |

---

## 🗺️ The Automation Workflow

### 1. Identify the Task
- **What is the task?** Describe it in detail.
- **How often is it performed?** Daily, weekly, monthly?
- **How long does it take?** Estimate the time savings from automation.
- **What are the inputs and outputs?** What data does the task need, and what does it produce?

### 2. Design the Automation
- **Break down the task into steps:** Create a flowchart or a numbered list.
- **Identify the tools:** What tools will you use? (e.g., Python, shell scripts, browser automation)
- **Plan for edge cases:** What happens if an input is missing? What happens if a step fails?

### 3. Build the Automation
- **Write the code:** Use the appropriate tools and languages.
- **Test each step:** Make sure each step works correctly before moving on to the next.
- **Add error handling:** Use try-catch blocks and logging to handle errors gracefully.

### 4. Deploy and Monitor
- **Deploy to production:** Run the automation in a real environment.
- **Monitor for errors:** Set up alerts to notify you if something goes wrong.
- **Iterate and improve:** Continuously refine the automation based on feedback and results.
`;

const WEB_APP_SCAFFOLD_CONTENT = `# 🏗️ Morgus Web App Scaffold Skill v2.0

## 🌟 Overview

This skill empowers Morgus to build production-grade, full-stack web applications from a single prompt. It combines a modern, best-practices tech stack with a seamless, AI-driven workflow.

**The Morgus Philosophy:** We don't just build apps; we build businesses. Every app is built on a foundation of best practices for performance, security, and scalability.

---

## 🛠️ The Modern Full-Stack Architecture

| Layer | Technology | Rationale |
|---|---|---|
| **Frontend** | Vite + React + TypeScript + TailwindCSS | Modern, performant, type-safe UI stack |
| **Backend** | Supabase Edge Functions | Serverless functions for low-latency backend logic |
| **Database** | Supabase (PostgreSQL) | Robust, scalable, open-source SQL database |
| **ORM** | Drizzle ORM | Lightweight, type-safe SQL ORM |
| **Authentication** | Supabase Auth | Secure built-in user authentication |

---

## 🗺️ The Build Process

### Phase 1: Project Initialization
1. Start with a clear prompt describing the application
2. Use webdev_init_project with web-app-supabase scaffold

### Phase 2: Database Schema Design
1. Describe your data requirements
2. Morgus generates the SQL schema
3. Run the SQL in Supabase SQL Editor

### Phase 3: Authentication Setup
1. Request authentication (email/password, social logins)
2. Morgus configures Supabase Auth and creates login/signup pages

### Phase 4: Backend Logic with Edge Functions
1. Describe the desired functionality
2. Morgus creates Supabase Edge Functions

### Phase 5: Frontend Development
1. Build the UI with natural language
2. Morgus creates React components connected to backend

### Phase 6: Deployment
1. Deploy to Cloudflare Pages or Vercel
2. Connect custom domain
`;

const STRIPE_PAYMENTS_CONTENT = `# 💳 Morgus Stripe Payments Skill v2.0

## 🌟 Overview

This skill empowers Morgus to integrate secure, production-ready payment processing using Stripe. It provides a seamless, AI-driven workflow for products, subscriptions, and checkout.

**The Morgus Philosophy:** Accepting payments should be simple, secure, and scalable. We remove the complexity so you can focus on growing your business.

---

## 🔮 Core Principles

| Principle | Description |
|---|---|
| **Build First, Monetize Later** | Build and test payment flows before signing up for Stripe |
| **Secure by Default** | Best-in-class security practices, never handle raw card data |
| **Production-Ready** | Built on best practices for reliability and scalability |

---

## 🗺️ The Stripe Integration Workflow

### Phase 1: Sandbox Setup
1. Tell Morgus your goal (e.g., "sell a $10/month subscription")
2. Morgus creates a Stripe claimable sandbox
3. Test the entire checkout process with test cards

### Phase 2: Going Live
1. Claim your Stripe account
2. Complete KYC process
3. All configurations transfer to your permanent account

### Phase 3: Managing Payments
- Customer Portal for subscription management
- Webhook configuration for payment events
- Automatic invoice generation

---

## 🧪 Testing

- Test Card: 4242 4242 4242 4242
- Any future expiration date
- Any 3-digit CVC
`;

const AUTHENTICATION_CONTENT = `# 🔒 Morgus Authentication & User Management Skill v2.0

## 🌟 Overview

This skill empowers Morgus to integrate secure, production-ready user authentication. It handles signup, login, social logins, and role-based access control.

**The Morgus Philosophy:** Authentication should be simple, secure, and flexible. We remove the complexity so you can focus on building great user experiences.

---

## 🔮 Core Principles

| Principle | Description |
|---|---|
| **Secure by Default** | Industry best practices for password hashing and session management |
| **Flexible and Extensible** | Support for email/password, social logins, and custom providers |
| **Seamless UX** | Smooth, intuitive authentication experience |

---

## 🗺️ The Authentication Workflow

### Phase 1: Basic Setup
1. Request authentication in your app
2. Morgus configures Supabase Auth with email/password

### Phase 2: Social Logins
1. Request Google, GitHub, or other OAuth providers
2. Morgus guides you through provider configuration

### Phase 3: Role-Based Access Control (RBAC)
1. Define user roles (admin, member, etc.)
2. Morgus implements role enforcement

### Phase 4: User Management
- View, edit, and delete users
- Bulk user operations
- User analytics

---

## ✨ Advanced Features

- Magic Links (passwordless login)
- Two-Factor Authentication (2FA)
- Customizable email templates
`;

const SPREADSHEET_CONTENT = `# 📊 Morgus Spreadsheet & Excel Skill v2.0

This skill enables Morgus to perform advanced spreadsheet operations, including data analysis, visualization, and financial modeling, with a focus on creating client-ready, professional-grade Excel workbooks (.xlsx).

## 💡 Core Principles (The Morgus Philosophy)

| Principle | Description |
|---|---|
| Clarity First | Spreadsheets must be easy to understand. A clear model is a correct model. |
| Automate, Don't Obfuscate | Use formulas for all derived values. No magic numbers. |
| Structure is Everything | A well-organized layout is crucial for readability and maintainability. |
| Visualize to Understand | Use charts and conditional formatting to reveal insights. |
| Client-Ready by Default | Every spreadsheet should be polished and professional. |

## 🛠️ Primary Tooling

- **openpyxl**: The primary library for all .xlsx operations (reading, writing, styling, charts).
- **pandas**: For complex data manipulation and analysis before writing to Excel.
- **matplotlib**: For generating complex charts as images to be inserted into the workbook.

## 📐 Formula Requirements

- Use Formulas for Derived Values: All calculations must be done with Excel formulas.
- No Dynamic Array Functions: Avoid FILTER, XLOOKUP, SORT, etc., as they are not universally supported.
- Simple & Legible: Use helper cells for intermediate calculations.
- Use Cell References: No hardcoded numbers in formulas (e.g., =A1 * (1 + \$B\$1), not =A1 * 1.05).
- Error Handling: Use IFERROR to gracefully handle potential errors.

## 🎨 Formatting & Styling

- Number Formats: Use appropriate formats for dates, currencies, percentages, etc.
- Clear Layout: Use headers, fill colors, and borders to create a professional look.
- Standard Colors (for new models): Blue Text = User inputs, Black Text = Formulas, Green Text = Links to other sheets.
- Financial Models: Negative numbers in red with parentheses (500). Zeros formatted as -. Specify units in headers.

## 📊 Charting & Visualization

- Choose the Right Chart: Use bar, line, pie, etc., as appropriate for the data.
- Clear & Concise: Charts should be easy to read with clear titles, labels, and legends.
- Native Charts: Use openpyxl.chart to create native Excel charts whenever possible.

## ✅ Quality Checks

- Recalculate All: Ensure all formulas are calculated and values are up-to-date.
- Error Free: The final workbook must not contain any formula errors (#REF!, #DIV/0!, etc.).
`;

const DOCX_CONTENT = `# 📄 Morgus DOCX Generation Skill v2.0

This skill enables Morgus to create professional Microsoft Word documents (.docx).

## ⚠️ CRITICAL: Single Execution Pattern

**IMPORTANT:** The code sandbox does NOT persist files between executions. You MUST:
1. Create the document AND output it as base64 in a SINGLE execute_code call
2. Return the base64 string so the user can download it

## 🛠️ Required Code Pattern

ALWAYS use this exact pattern for document generation:

\`\`\`python
from docx import Document
from docx.shared import Inches, Pt
from docx.enum.text import WD_ALIGN_PARAGRAPH
import base64
import io

# Create document
doc = Document()

# Add title
title = doc.add_heading('Document Title', 0)
title.alignment = WD_ALIGN_PARAGRAPH.CENTER

# Add content
doc.add_paragraph('Your content here...')

# Add more sections as needed
doc.add_heading('Section 1', level=1)
doc.add_paragraph('Section content...')

# Save to bytes buffer
buffer = io.BytesIO()
doc.save(buffer)
buffer.seek(0)

# Output as base64 for download
base64_doc = base64.b64encode(buffer.read()).decode('utf-8')
print(f"DOCX_BASE64:{base64_doc}")
\`\`\`

## 💡 Core Principles

| Principle | Description |
|---|---|
| Single Execution | Create and output document in ONE code call |
| Base64 Output | Always output as base64 for download |
| Structure First | Use headings, paragraphs, and lists |
| Professional Fonts | Use Calibri, Times New Roman, or Arial |

## 📝 Formatting Tips

- Use doc.add_heading() for titles and sections
- Use doc.add_paragraph() for body text
- Use doc.add_table() for tabular data
- Set font sizes with Pt() from docx.shared
- Align text with WD_ALIGN_PARAGRAPH
`;

const PDF_CONTENT = `# 📑 Morgus PDF Generation Skill v2.0

This skill enables Morgus to create professional PDF documents.

## ⚠️ CRITICAL: Single Execution Pattern

**IMPORTANT:** The code sandbox does NOT persist files between executions. You MUST:
1. Create the PDF AND output it as base64 in a SINGLE execute_code call
2. Return the base64 string so the user can download it

## 🛠️ Required Code Pattern

ALWAYS use this exact pattern for PDF generation:

\`\`\`python
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
import base64
import io

# Create PDF in memory
buffer = io.BytesIO()
doc = SimpleDocTemplate(buffer, pagesize=letter)
styles = getSampleStyleSheet()

# Build content
story = []

# Add title
title_style = ParagraphStyle('Title', parent=styles['Heading1'], fontSize=24, alignment=1)
story.append(Paragraph('Document Title', title_style))
story.append(Spacer(1, 0.5*inch))

# Add body text
story.append(Paragraph('Your content here...', styles['Normal']))
story.append(Spacer(1, 0.25*inch))

# Add more sections as needed
story.append(Paragraph('Section 1', styles['Heading2']))
story.append(Paragraph('Section content...', styles['Normal']))

# Build PDF
doc.build(story)

# Output as base64 for download
buffer.seek(0)
base64_pdf = base64.b64encode(buffer.read()).decode('utf-8')
print(f"PDF_BASE64:{base64_pdf}")
\`\`\`

## 💡 Core Principles

| Principle | Description |
|---|---|
| Single Execution | Create and output PDF in ONE code call |
| Base64 Output | Always output as base64 for download |
| Use Platypus | Use SimpleDocTemplate and story list |
| Professional Layout | Use proper spacing and styles |

## 📝 Formatting Tips

- Use Paragraph() for text with styles
- Use Spacer() for vertical spacing
- Use Table() for tabular data
- Use getSampleStyleSheet() for built-in styles
- Create custom ParagraphStyle for special formatting
`;

const DYNAMIC_VIEW_CONTENT = `# 🎨 Morgus Dynamic View & Interactive Experience Generator v2.0

This skill enables Morgus to generate fully interactive, dynamic user experiences in response to any prompt. Instead of just text, Morgus can create rich, visual, and interactive UIs, mini-apps, games, and simulations on the fly.

## Core Principles

| Principle | Description |
|---|---|
| Beyond Text | Move beyond static text responses to create immersive, engaging experiences |
| Context is King | The generated UI is fully customized to the user's prompt, context, and intent |
| Interactivity First | Users can click, play, explore, and interact with the generated content |
| Agentic Coding | Morgus uses its agentic coding capabilities to design and code the UI in real-time |

## Key Capabilities

| Capability | Description |
|---|---|
| Interactive Learning | Create educational simulations and interactive tutorials |
| Visual Galleries | Generate magazine-style layouts and image galleries |
| Interactive Tools | Build calculators, converters, and planning tools |
| Games & Simulations | Generate simple games, puzzles, and simulations |
| Data Dashboards | Create interactive charts, graphs, and dashboards |
`;

const DASHBOARD_BUILDER_CONTENT = `# 📊 Morgus Dashboard & Visualization Builder v2.0

This skill enables Morgus to create interactive dashboards and data visualizations from various data sources. Users can upload data, connect to databases, or provide data in the prompt, and Morgus will generate a rich, interactive dashboard.

## Core Principles

| Principle | Description |
|---|---|
| Data to Insights | Transform raw data into actionable insights through visualization |
| Interactivity is Key | Users can filter, sort, and drill down into the data |
| Customizable | Dashboards are tailored to the user's specific needs and questions |
| Multiple Data Sources | Supports CSV, Excel, JSON, databases, and direct data input |

## Key Capabilities

| Capability | Description |
|---|---|
| Business Intelligence | Create dashboards for tracking business metrics |
| Financial Analysis | Analyze financial data and create reports |
| Project Management | Track project progress with Gantt charts and burndown charts |
| Scientific Visualization | Plot scientific data and create interactive simulations |
`;

const PRD_TO_PROTOTYPE_CONTENT = `# 📝 Morgus PRD to Prototype v2.0

This skill transforms a Product Requirements Document (PRD) into a working, interactive prototype. Users can provide a PRD in any format, and Morgus will generate a clickable prototype.

## Core Principles

| Principle | Description |
|---|---|
| From Words to Wireframes | Bridge the gap between written requirements and tangible products |
| Rapid Prototyping | Generate prototypes in minutes, not days |
| Interactive Feedback | Allow stakeholders to click through the prototype and provide feedback early |
`;

const CODE_TRANSLATOR_CONTENT = `# 🔄 Morgus Code Translator v2.0

This skill translates code from one programming language to another. It supports a wide range of languages and can handle complex codebases.

## Core Principles

| Principle | Description |
|---|---|
| Language Agnostic | Support for all major programming languages |
| Syntax and Semantics | Translate not just the syntax, but also the underlying logic |
| Library Mapping | Map equivalent libraries and frameworks between languages |
`;

const GAME_BUILDER_CONTENT = `# 🎮 Morgus Interactive Game Builder v2.0

This skill allows users to create simple, interactive games and quizzes on the fly. Users can describe the game they want to create, and Morgus will generate the code and render the game.

## Core Principles

| Principle | Description |
|---|---|
| Fun and Engaging | Create enjoyable experiences for users |
| No-Code Game Development | Allow anyone to create a game without writing code |
| Customizable | Games can be customized with different themes, characters, and rules |
`;

const QR_CODE_GENERATOR_CONTENT = `# 📱 Morgus QR Code Generator v2.0

This skill generates QR codes for URLs, text, contact information, and more. It's a simple but highly useful utility.

## Core Principles

| Principle | Description |
|---|---|
| Simple and Fast | Generate QR codes instantly |
| Versatile | Support for various data types |
| Customizable | Options for colors, logos, and error correction |
`;

const MEETING_NOTES_TRANSFORMER_CONTENT = `# 📋 Morgus Meeting Notes Transformer v2.0

This skill transforms raw, unstructured meeting notes into a professional, organized summary. It identifies action items, key decisions, and discussion points.

## Core Principles

| Principle | Description |
|---|---|
| Clarity from Chaos | Bring structure to messy notes |
| Action-Oriented | Highlight action items and owners |
| Professional Formatting | Generate a polished document suitable for sharing |
`;

const FLASHCARD_GENERATOR_CONTENT = `# 🃏 Morgus Flashcard Generator v2.0

This skill creates study flashcards from any content provided by the user. It can take a document, URL, or text paste and generate a set of flashcards.

## Core Principles

| Principle | Description |
|---|---|
| Active Recall | Facilitate learning through active recall |
| Automated Content Creation | Automatically generate flashcards from any source |
| Exportable | Flashcards can be exported to various formats (Anki, CSV, etc.) |
`;

const MOBILE_APP_CONTENT = `# 📱 Morgus Mobile App Development Skill v2.0

This skill enables Morgus to build and deploy production-grade native mobile applications for iOS and Android from a natural language description.

## Core Principles

| Principle | Description |
|---|---|
| From Idea to App Store | Handle the entire mobile app development lifecycle |
| Native Performance | Build true native applications using Expo + React Native |
| Modern & Maintainable | Use TypeScript, TailwindCSS, and Drizzle ORM |
| Full-Stack Capability | Integrate with Supabase for backend, auth, and database |

## Technology Stack

| Component | Technology |
|---|---|
| Framework | Expo + React Native |
| Language | TypeScript |
| Styling | TailwindCSS |
| Database | Drizzle + Supabase |
| Authentication | OAuth with social logins |

## Key Capabilities

| Capability | Description |
|---|---|
| End-to-End App Generation | Generate complete projects from descriptions |
| Interactive Prototyping | Create clickable prototypes from PRDs |
| UI/UX Design | Create beautiful, responsive interfaces |
| Backend Integration | Connect to databases and APIs |
| Push Notifications | Implement engagement features |
| App Store Deployment | Generate builds for iOS and Android |
`;

const VOICE_TOOLS_CONTENT = `# 🎙️ Morgus Voice & Audio Tools v2.0

This skill provides a suite of tools for working with voice and audio, including text-to-speech, speech-to-text, and voice cloning.

## Core Principles

| Principle | Description |
|---|---|
| Natural Sounding Voices | Use high-quality, natural-sounding voices for TTS |
| Accurate Transcription | Provide highly accurate speech-to-text transcription |
| Ethical Voice Cloning | Voice cloning with a focus on ethics and user consent |
`;

const EXTERNAL_API_CONTENT = `# 🔌 Morgus External API Integration Skill v2.0

## 🌟 Overview

This skill empowers Morgus to connect your application to external APIs, unlocking new features and functionality. It handles API key management, data transformation, and error handling.

**The Morgus Philosophy:** Your application should be able to talk to the world. We make it easy to connect to any API.

---

## 🔮 Core Principles

| Principle | Description |
|---|---|
| **Secure by Default** | API keys stored as encrypted secrets, never exposed in frontend |
| **Resilient and Reliable** | Robust error handling for API failures and rate limits |
| **Infinitely Extensible** | Connect to any API with a public specification |

---

## 🗺️ The API Integration Workflow

### Phase 1: API Discovery
1. Tell Morgus what you want to achieve
2. Morgus researches and recommends APIs

### Phase 2: API Key Management
1. Morgus prompts for your API key
2. Key stored securely in Supabase secrets

### Phase 3: Backend Integration
1. Morgus creates Supabase Edge Function
2. Handles data transformation and error handling

### Phase 4: Frontend Integration
1. Morgus creates UI components
2. Connects frontend to backend

---

## ✨ Advanced Features

- Automatic OpenAPI/Swagger import
- AI-powered data mapping
- Built-in caching and rate limiting
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
  },
  {
    id: 'research-analysis-v2',
    name: 'Morgus Research & Deep Analysis',
    description: 'Conducts in-depth research and analysis with systematic methodology',
    keywords: ['research', 'analyze', 'investigate', 'study', 'report', 'findings', 'synthesis', 'deep dive', 'comprehensive', 'sources'],
    createdAt: '2024-12-20',
    source: 'builtin',
    content: RESEARCH_ANALYSIS_CONTENT
  },
  {
    id: 'presentation-slideshow-v2',
    name: 'Morgus Presentation & Slideshow',
    description: 'Creates compelling, professional presentations and slideshows',
    keywords: ['presentation', 'slides', 'slideshow', 'powerpoint', 'ppt', 'deck', 'pitch', 'keynote', 'speaker', 'audience'],
    createdAt: '2024-12-20',
    source: 'builtin',
    content: PRESENTATION_SLIDESHOW_CONTENT
  },
  {
    id: 'document-generation-v2',
    name: 'Morgus Document Generation',
    description: 'Creates professional documents from reports to proposals to articles',
    keywords: ['document', 'report', 'proposal', 'article', 'essay', 'write', 'draft', 'memo', 'brief', 'whitepaper'],
    createdAt: '2024-12-20',
    source: 'builtin',
    content: DOCUMENT_GENERATION_CONTENT
  },
  {
    id: 'image-generation-v2',
    name: 'Morgus Image Generation',
    description: 'Creates stunning images from text descriptions with advanced prompting',
    keywords: ['image', 'picture', 'photo', 'generate', 'create', 'visual', 'art', 'illustration', 'design', 'logo'],
    createdAt: '2024-12-20',
    source: 'builtin',
    content: IMAGE_GENERATION_CONTENT
  },
  {
    id: 'email-communication-v2',
    name: 'Morgus Email & Communication',
    description: 'Crafts professional, effective emails and written communications',
    keywords: ['email', 'message', 'communication', 'write', 'reply', 'respond', 'professional', 'outreach', 'follow-up', 'letter'],
    createdAt: '2024-12-20',
    source: 'builtin',
    content: EMAIL_COMMUNICATION_CONTENT
  },
  {
    id: 'task-automation-v2',
    name: 'Morgus Task Automation',
    description: 'Automates repetitive tasks and workflows to save time and reduce errors',
    keywords: ['automate', 'workflow', 'task', 'schedule', 'repeat', 'batch', 'process', 'efficiency', 'script', 'cron'],
    createdAt: '2024-12-20',
    source: 'builtin',
    content: TASK_AUTOMATION_CONTENT
  },
  {
    id: 'web-app-scaffold-v2',
    name: 'Morgus Web App Scaffold',
    description: 'Builds production-grade, full-stack web applications with Supabase backend',
    keywords: ['web app', 'full-stack', 'supabase', 'database', 'backend', 'frontend', 'scaffold', 'saas', 'startup', 'mvp'],
    createdAt: '2024-12-20',
    source: 'builtin',
    content: WEB_APP_SCAFFOLD_CONTENT
  },
  {
    id: 'stripe-payments-v2',
    name: 'Morgus Stripe Payments',
    description: 'Integrates secure, production-ready payment processing with Stripe',
    keywords: ['stripe', 'payment', 'checkout', 'subscription', 'billing', 'monetize', 'sell', 'ecommerce', 'pricing'],
    createdAt: '2024-12-20',
    source: 'builtin',
    content: STRIPE_PAYMENTS_CONTENT
  },
  {
    id: 'authentication-v2',
    name: 'Morgus Authentication & User Management',
    description: 'Implements secure user authentication with social logins and RBAC',
    keywords: ['auth', 'login', 'signup', 'user', 'oauth', 'google login', 'github login', 'role', 'permission', 'session'],
    createdAt: '2024-12-20',
    source: 'builtin',
    content: AUTHENTICATION_CONTENT
  },
  {
    id: 'external-api-v2',
    name: 'Morgus External API Integration',
    description: 'Connects applications to external APIs with secure key management',
    keywords: ['api', 'integration', 'external', 'connect', 'openai', 'weather', 'third-party', 'webhook', 'rest', 'graphql'],
    createdAt: '2024-12-20',
    source: 'builtin',
    content: EXTERNAL_API_CONTENT
  },
  {
    id: 'spreadsheet-v2',
    name: 'Morgus Spreadsheet & Excel',
    description: 'Creates professional Excel workbooks with formulas, charts, and financial modeling',
    keywords: ['spreadsheet', 'excel', 'xlsx', 'csv', 'financial model', 'dcf', 'lbo', 'data analysis', 'pivot table', 'charts', 'graphs', 'budget', 'forecast', 'openpyxl', 'pandas'],
    createdAt: '2024-12-20',
    source: 'builtin',
    content: SPREADSHEET_CONTENT
  },
  {
    id: 'docx-v2',
    name: 'Morgus DOCX Generation',
    description: 'Creates professional Microsoft Word documents with proper structure and formatting',
    keywords: ['docx', 'word document', 'report', 'proposal', 'document generation', 'create a doc', 'python-docx', 'soffice', 'libreoffice', 'memo', 'letter', 'article', 'paper', 'essay', 'write a paper', 'research paper', 'write me a'],
    createdAt: '2024-12-20',
    source: 'builtin',
    content: DOCX_CONTENT
  },
  {
    id: 'pdf-v2',
    name: 'Morgus PDF Generation',
    description: 'Creates professional PDF documents with precise layout and custom graphics',
    keywords: ['pdf', 'create pdf', 'generate pdf', 'report', 'invoice', 'certificate', 'presentation', 'reportlab', 'pdfplumber', 'custom layout', 'branding', 'paper', 'essay', 'research paper'],
    createdAt: '2024-12-20',
    source: 'builtin',
    content: PDF_CONTENT
  },
  {
    id: 'dynamic-view-v2',
    name: 'Morgus Dynamic View & Interactive Experience',
    description: 'Generates fully interactive, dynamic user experiences, mini-apps, games, and simulations',
    keywords: ['interactive', 'dynamic', 'simulation', 'game', 'quiz', 'tool', 'calculator', 'experience', 'ui', 'app'],
    createdAt: '2024-12-20',
    source: 'builtin',
    content: DYNAMIC_VIEW_CONTENT
  },
  {
    id: 'dashboard-builder-v2',
    name: 'Morgus Dashboard & Visualization Builder',
    description: 'Creates interactive dashboards and data visualizations from various data sources',
    keywords: ['dashboard', 'visualization', 'chart', 'graph', 'kpi', 'metrics', 'gantt', 'analytics', 'bi', 'business intelligence'],
    createdAt: '2024-12-20',
    source: 'builtin',
    content: DASHBOARD_BUILDER_CONTENT
  },
  {
    id: 'prd-to-prototype-v2',
    name: 'Morgus PRD to Prototype',
    description: 'Transforms Product Requirements Documents into working, interactive prototypes',
    keywords: ['prd', 'prototype', 'requirements', 'wireframe', 'mockup', 'product', 'design', 'spec', 'specification'],
    createdAt: '2024-12-20',
    source: 'builtin',
    content: PRD_TO_PROTOTYPE_CONTENT
  },
  {
    id: 'code-translator-v2',
    name: 'Morgus Code Translator',
    description: 'Translates code between programming languages with syntax and library mapping',
    keywords: ['translate', 'convert', 'port', 'python to javascript', 'javascript to python', 'language', 'migration', 'rewrite'],
    createdAt: '2024-12-20',
    source: 'builtin',
    content: CODE_TRANSLATOR_CONTENT
  },
  {
    id: 'game-builder-v2',
    name: 'Morgus Interactive Game Builder',
    description: 'Creates simple, interactive games and quizzes on the fly',
    keywords: ['game', 'quiz', 'trivia', 'puzzle', 'play', 'snake', 'tetris', 'fun', 'interactive'],
    createdAt: '2024-12-20',
    source: 'builtin',
    content: GAME_BUILDER_CONTENT
  },
  {
    id: 'qr-code-generator-v2',
    name: 'Morgus QR Code Generator',
    description: 'Generates QR codes for URLs, text, and contact information',
    keywords: ['qr', 'qr code', 'barcode', 'scan', 'url', 'link', 'contact'],
    createdAt: '2024-12-20',
    source: 'builtin',
    content: QR_CODE_GENERATOR_CONTENT
  },
  {
    id: 'meeting-notes-transformer-v2',
    name: 'Morgus Meeting Notes Transformer',
    description: 'Transforms raw meeting notes into professional, organized summaries',
    keywords: ['meeting', 'notes', 'summary', 'action items', 'minutes', 'transcript', 'organize'],
    createdAt: '2024-12-20',
    source: 'builtin',
    content: MEETING_NOTES_TRANSFORMER_CONTENT
  },
  {
    id: 'flashcard-generator-v2',
    name: 'Morgus Flashcard Generator',
    description: 'Creates study flashcards from any content for active recall learning',
    keywords: ['flashcard', 'study', 'learn', 'anki', 'quiz', 'memorize', 'cards', 'education'],
    createdAt: '2024-12-20',
    source: 'builtin',
    content: FLASHCARD_GENERATOR_CONTENT
  },
  {
    id: 'voice-tools-v2',
    name: 'Morgus Voice & Audio Tools',
    description: 'Text-to-speech, speech-to-text, and voice cloning capabilities',
    keywords: ['voice', 'audio', 'tts', 'stt', 'speech', 'transcribe', 'read aloud', 'clone', 'podcast'],
    createdAt: '2024-12-20',
    source: 'builtin',
    content: VOICE_TOOLS_CONTENT
  },
  {
    id: 'mobile-app-v2',
    name: 'Morgus Mobile App Development',
    description: 'Builds production-grade native mobile apps for iOS and Android using Expo + React Native',
    keywords: ['mobile', 'app', 'ios', 'android', 'expo', 'react native', 'phone', 'smartphone', 'native app', 'app store', 'play store'],
    createdAt: '2024-12-20',
    source: 'builtin',
    content: MOBILE_APP_CONTENT
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
   * List all skills in a formatted string for the list_skills tool
   */
  listSkills(): string {
    const skills = this.getAllSkills();
    
    let output = `# 🎯 Morgus Skills Library v2.0\n\n`;
    output += `Morgus has **${skills.length} specialized skills** that guide task execution with expert-level knowledge.\n\n`;
    output += `| # | Skill | Description |\n`;
    output += `|---|-------|-------------|\n`;
    
    skills.forEach((skill, index) => {
      output += `| ${index + 1} | **${skill.name}** | ${skill.description} |\n`;
    });
    
    output += `\n---\n\n`;
    output += `## 📚 Skill Details\n\n`;
    
    skills.forEach((skill, index) => {
      output += `### ${index + 1}. ${skill.name}\n`;
      output += `- **ID:** \`${skill.id}\`\n`;
      output += `- **Description:** ${skill.description}\n`;
      output += `- **Keywords:** ${skill.keywords.join(', ')}\n`;
      output += `- **Source:** ${skill.source || 'builtin'}\n\n`;
    });
    
    output += `---\n\n`;
    output += `💡 **Pro Tip:** These skills are automatically activated when you ask related questions. `;
    output += `For example, asking "build me a landing page" will activate the Landing Page skill!\n`;
    
    return output;
  }

  /**
   * Generate skill context for the system prompt
   */
  generateSkillContext(query: string): string {
    let context = '';
    
    // Check for Morgy mentions and add their persona context
    const morgyContext = this.getMorgyPersonaContext(query);
    if (morgyContext) {
      context += morgyContext;
    }
    
    const relevantSkills = this.findRelevantSkills(query);
    
    if (relevantSkills.length > 0) {
      context += '\n## 🎯 Relevant Skills for This Task\n\n';
      
      for (const match of relevantSkills) {
        context += `### ${match.skill.name}\n`;
        context += `${match.skill.content}\n\n`;
      }
    }

    return context;
  }

  /**
   * Get Morgy persona context based on @ mentions in the query
   */
  getMorgyPersonaContext(query: string): string {
    const queryLower = query.toLowerCase();
    let context = '';
    
    // Bill the Marketing Hog
    if (queryLower.includes('@billthemarketinghog') || queryLower.includes('@bill') || queryLower.includes('bill the marketing')) {
      context += `\n## 🐷 MORGY ACTIVATED: Bill the Marketing Hog\n\n`;
      context += `You are now channeling **Bill the Marketing Hog** - a Level 3 Marketing Expert Morgy!\n\n`;
      context += `**Bill's Personality:**\n`;
      context += `- Enthusiastic and energetic marketing guru\n`;
      context += `- Speaks with confidence and uses marketing jargon naturally\n`;
      context += `- Always thinking about growth, hooks, and viral potential\n`;
      context += `- Uses phrases like "let's crush it!", "this is gonna be huge!", "growth hack incoming!"\n\n`;
      context += `**Bill's Specialties:**\n`;
      context += `- Growth strategies and viral marketing\n`;
      context += `- Compelling hooks and headlines\n`;
      context += `- Landing page optimization\n`;
      context += `- Call-to-action (CTA) design\n`;
      context += `- Social media marketing\n`;
      context += `- Brand positioning and messaging\n\n`;
      context += `**Bill's Video & Ad Tools:**\n`;
      context += `- 🎬 **Marketing Videos** - Use generate_marketing_video tool (ad creatives, product demos, explainers, landing page videos!)\n`;
      context += `- 📝 **Ad Copy** - Use generate_ad_copy tool (Facebook, Google, Instagram, LinkedIn ad copy)\n\n`;
      context += `**Response Style:** Start responses with a marketing-focused greeting, use 🐷 emoji occasionally, and always tie advice back to growth and conversion.\n\n`;
    }
    
    // Sally the Promo Pig - Social Media Queen
    if (queryLower.includes('@sallythepromo') || queryLower.includes('@sally') || queryLower.includes('sally the promo')) {
      context += `\n## 🐷 MORGY ACTIVATED: Sally the Promo Pig - Social Media Queen\n\n`;
      context += `You are now channeling **Sally the Promo Pig** - a Level 2 Social Media & Promotions Expert Morgy!\n\n`;
      context += `**Sally's Personality:**\n`;
      context += `- Creative and detail-oriented social media specialist\n`;
      context += `- Friendly, energetic, and always ready to engage\n`;
      context += `- Lives and breathes social media trends and viral content\n`;
      context += `- Uses phrases like "let's make some noise!", "time to go viral!", "promo magic incoming!", "engagement incoming! 🔥"\n\n`;
      context += `**Sally's Social Media Superpowers:**\n`;
      context += `- 📱 **Post to Twitter/X** - Use post_to_twitter tool\n`;
      context += `- 💼 **Post to LinkedIn** - Use post_to_linkedin tool\n`;
      context += `- 📸 **Post to Instagram** - Use post_to_instagram tool\n`;
      context += `- 📘 **Post to Facebook** - Use post_to_facebook tool\n`;
      context += `- 📅 **Content Calendar** - Use create_content_calendar tool\n`;
      context += `- 🎬 **Video Scripts** - Use generate_video_script tool\n`;
      context += `- 🎵 **TikTok/Reels Videos** - Use generate_tiktok_reel tool (CREATES ACTUAL VIDEOS!)\n`;
      context += `- 📊 **Engagement Analysis** - Use analyze_social_engagement tool\n\n`;
      context += `**Sally's Specialties:**\n`;
      context += `- Social media strategy and content creation\n`;
      context += `- Video scripts for TikTok, Reels, and YouTube Shorts\n`;
      context += `- Campaign planning and scheduling\n`;
      context += `- Ad copy and creative direction\n`;
      context += `- Hashtag research and optimization\n`;
      context += `- Engagement tactics and community building\n`;
      context += `- Cross-platform promotional campaigns\n\n`;
      context += `**Response Style:** Start responses with an energetic greeting like "Hey there! 🐷✨", use social media lingo naturally, suggest specific tools for posting, and always think about engagement and virality. End with actionable next steps.\n\n`;
      context += `**IMPORTANT:** When asked to post or create content, ALWAYS use the appropriate social media tool (post_to_twitter, post_to_linkedin, etc.) to prepare the content for posting!\n\n`;
    }
    
    // Prof. Hogsworth the Research Expert
    if (queryLower.includes('@profhogsworth') || queryLower.includes('@professor') || queryLower.includes('prof. hogsworth') || queryLower.includes('professor hogsworth')) {
      context += `\n## 🐷 MORGY ACTIVATED: Prof. Hogsworth the Research Expert\n\n`;
      context += `You are now channeling **Prof. Hogsworth the Research Expert** - a Level 5 Research & Analysis Morgy!\n\n`;
      context += `**Prof. Hogsworth's Personality:**\n`;
      context += `- Scholarly and thorough in analysis\n`;
      context += `- Speaks with academic precision but remains accessible\n`;
      context += `- Always digs deeper and considers multiple angles\n`;
      context += `- Uses phrases like "upon careful analysis...", "the data suggests...", "let us examine this further..."\n\n`;
      context += `**Prof. Hogsworth's Specialties:**\n`;
      context += `- Deep research and fact-finding\n`;
      context += `- Data analysis and synthesis\n`;
      context += `- Complex problem solving\n`;
      context += `- Competitive analysis\n`;
      context += `- Market research\n`;
      context += `- Academic-style documentation\n\n`;
      context += `**Prof. Hogsworth's Educational Tools:**\n`;
      context += `- 📊 **Dynamic Views** - Use generate_dynamic_view tool (flowcharts, timelines, mind-maps, step-by-step guides!)\n`;
      context += `- 📖 **Educational Lessons** - Use create_educational_lesson tool (structured lessons with objectives and assessments)\n`;
      context += `- 📈 **Infographics** - Use generate_infographic tool (visual data storytelling and concept breakdowns)\n`;
      context += `- 🧠 **Simple Explanations** - Use explain_simply tool (explain complex topics at any level, from 5-year-old to expert!)\n\n`;
      context += `**Response Style:** Start responses with a thoughtful observation, use 🐷 emoji sparingly, cite sources meticulously, and provide comprehensive, well-structured analysis.\n\n`;
      context += `**IMPORTANT:** When asked to explain, teach, or visualize concepts, ALWAYS use the appropriate educational tool to create engaging, interactive content!\n\n`;
    }
    
    return context;
  }
}

// Export singleton instance
export const skillsManager = new SkillsManager();
