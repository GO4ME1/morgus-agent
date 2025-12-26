# Illustration Library & Template System

## The Manus Secret: Why Their Pages Don't Break

**Problem:** AI-generated pages break when you ask for changes because the AI regenerates the entire page.

**Manus Solution:**
1. **Pre-made illustration library** - Not AI-generated, curated SVG assets
2. **Section-based editing** - Change ONE section, freeze everything else
3. **Constrained diffs** - Surgical edits, not full regeneration
4. **Template system** - Proven structures that work

---

## Illustration Library Structure

### Categories

| Category | Count | Use Cases |
|----------|-------|-----------|
| **Hero Illustrations** | 20 | Landing page heroes, above-the-fold |
| **Feature Icons** | 50 | Feature lists, benefit grids |
| **Process Diagrams** | 15 | How it works, step-by-step |
| **Abstract Shapes** | 30 | Backgrounds, decorative elements |
| **Device Mockups** | 10 | App screenshots, product demos |
| **People & Teams** | 15 | About pages, testimonials |
| **Data Viz** | 20 | Charts, graphs, infographics |
| **Logos & Badges** | 25 | Trust signals, integrations |

**Total:** 185 curated SVG illustrations

### Style Themes

1. **Minimal** - Clean lines, simple shapes, 2-3 colors
2. **Gradient** - Modern gradients, depth, shadows
3. **Isometric** - 3D-style, technical feel
4. **Hand-drawn** - Organic, friendly, approachable
5. **Geometric** - Sharp angles, bold colors, tech-forward

### File Structure

```
/worker/src/assets/illustrations/
├── hero/
│   ├── minimal/
│   │   ├── hero-saas-dashboard.svg
│   │   ├── hero-mobile-app.svg
│   │   └── hero-analytics.svg
│   ├── gradient/
│   ├── isometric/
│   ├── hand-drawn/
│   └── geometric/
├── features/
│   ├── icons/
│   │   ├── speed.svg
│   │   ├── security.svg
│   │   ├── scalability.svg
│   │   └── ...
│   └── illustrations/
├── process/
│   ├── 3-step.svg
│   ├── 4-step.svg
│   └── timeline.svg
├── abstract/
│   ├── backgrounds/
│   └── shapes/
├── devices/
│   ├── laptop-mockup.svg
│   ├── phone-mockup.svg
│   └── tablet-mockup.svg
├── people/
│   ├── team-collaboration.svg
│   ├── customer-success.svg
│   └── remote-work.svg
├── data/
│   ├── line-chart.svg
│   ├── bar-chart.svg
│   └── pie-chart.svg
└── logos/
    ├── trust-badges.svg
    ├── payment-methods.svg
    └── integrations.svg
```

---

## Template System

### Template Categories

| Template | Sections | Best For |
|----------|----------|----------|
| **ai-saas-v1** | Hero, Features, How It Works, Pricing, CTA | AI tools, SaaS products |
| **minimal-launch-v1** | Hero, Problem/Solution, Waitlist | Product launches, MVPs |
| **creator-tool-v1** | Hero, Showcase, Features, Pricing | Creator economy tools |
| **agency-v1** | Hero, Services, Portfolio, Contact | Agencies, consultants |
| **marketplace-v1** | Hero, Categories, How It Works, CTA | Marketplaces, platforms |
| **dev-tool-v1** | Hero, Code Example, Features, Docs | Developer tools, APIs |

### Template Structure (Example: ai-saas-v1)

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{title}}</title>
  <style>
    /* Tailwind CSS or custom styles */
  </style>
</head>
<body>
  <!-- Section markers for surgical editing -->
  <section data-morgus-section="hero" data-morgus-lock="false">
    <div class="container">
      <h1>{{hero.headline}}</h1>
      <p>{{hero.subheadline}}</p>
      <button>{{hero.cta}}</button>
      <img src="{{hero.illustration}}" alt="Hero illustration">
    </div>
  </section>

  <section data-morgus-section="features" data-morgus-lock="false">
    <div class="container">
      <h2>{{features.title}}</h2>
      <div class="grid">
        {{#each features.items}}
        <div class="feature-card">
          <img src="{{icon}}" alt="{{title}}">
          <h3>{{title}}</h3>
          <p>{{description}}</p>
        </div>
        {{/each}}
      </div>
    </div>
  </section>

  <section data-morgus-section="how-it-works" data-morgus-lock="false">
    <div class="container">
      <h2>{{howItWorks.title}}</h2>
      <div class="steps">
        {{#each howItWorks.steps}}
        <div class="step">
          <div class="step-number">{{number}}</div>
          <h3>{{title}}</h3>
          <p>{{description}}</p>
        </div>
        {{/each}}
      </div>
      <img src="{{howItWorks.diagram}}" alt="Process diagram">
    </div>
  </section>

  <section data-morgus-section="pricing" data-morgus-lock="false">
    <div class="container">
      <h2>{{pricing.title}}</h2>
      <div class="pricing-grid">
        {{#each pricing.plans}}
        <div class="pricing-card">
          <h3>{{name}}</h3>
          <div class="price">{{price}}</div>
          <ul>
            {{#each features}}
            <li>{{this}}</li>
            {{/each}}
          </ul>
          <button>{{cta}}</button>
        </div>
        {{/each}}
      </div>
    </div>
  </section>

  <section data-morgus-section="cta" data-morgus-lock="false">
    <div class="container">
      <h2>{{cta.headline}}</h2>
      <p>{{cta.subheadline}}</p>
      <button>{{cta.button}}</button>
    </div>
  </section>
</body>
</html>
```

---

## Section-Based Editor

### How It Works

1. **User Request:** "Change the hero headline to 'Build AI Agents in Minutes'"

2. **AI Identifies Section:**
   ```typescript
   const section = 'hero';
   const field = 'headline';
   const newValue = 'Build AI Agents in Minutes';
   ```

3. **Surgical Edit (NOT Full Regeneration):**
   ```typescript
   // Find the section
   const heroSection = document.querySelector('[data-morgus-section="hero"]');
   
   // Check if locked
   if (heroSection.dataset.morgusLock === 'true') {
     throw new Error('Section is locked');
   }
   
   // Make surgical edit
   const h1 = heroSection.querySelector('h1');
   h1.textContent = newValue;
   
   // Leave everything else untouched
   ```

4. **Result:** Only the headline changes, illustration stays, layout stays, everything else frozen.

### Section Lock System

Users can lock sections to prevent changes:

```html
<section data-morgus-section="hero" data-morgus-lock="true">
  <!-- This section cannot be edited -->
</section>
```

### Edit Types

| Type | Description | Example |
|------|-------------|---------|
| **text** | Change text content | Headline, paragraph, button text |
| **image** | Swap illustration | Change hero image |
| **color** | Update color scheme | Primary color, accent |
| **layout** | Rearrange elements | Move CTA above features |
| **add** | Add new element | Add testimonial card |
| **remove** | Delete element | Remove pricing tier |

---

## Template Data Schema

### ai-saas-v1 Schema

```typescript
interface AISaaSTemplate {
  meta: {
    title: string;
    description: string;
    favicon?: string;
  };
  hero: {
    headline: string;
    subheadline: string;
    cta: string;
    illustration: string; // Path to SVG from library
    illustrationStyle: 'minimal' | 'gradient' | 'isometric' | 'hand-drawn' | 'geometric';
  };
  features: {
    title: string;
    items: Array<{
      icon: string; // Path to icon SVG
      title: string;
      description: string;
    }>;
  };
  howItWorks: {
    title: string;
    steps: Array<{
      number: number;
      title: string;
      description: string;
    }>;
    diagram: string; // Path to process diagram SVG
  };
  pricing: {
    title: string;
    plans: Array<{
      name: string;
      price: string;
      features: string[];
      cta: string;
      highlighted?: boolean;
    }>;
  };
  cta: {
    headline: string;
    subheadline: string;
    button: string;
  };
  theme: {
    primaryColor: string;
    accentColor: string;
    font: string;
  };
}
```

---

## Implementation Plan

### Phase 1: Illustration Library (4-6 hours)
1. ✅ Create directory structure
2. ✅ Generate/curate 185 SVG illustrations
3. ✅ Organize by category and style
4. ✅ Create illustration manifest JSON

### Phase 2: Template System (3-4 hours)
5. ✅ Create 6 base templates (HTML + CSS)
6. ✅ Add section markers
7. ✅ Create template schemas
8. ✅ Build template renderer

### Phase 3: Section Editor (2-3 hours)
9. ✅ Build section parser
10. ✅ Implement surgical edit logic
11. ✅ Add section lock system
12. ✅ Create diff-based updates

### Phase 4: Integration (2 hours)
13. ✅ Integrate with Morgus agent
14. ✅ Add to landing page generation tool
15. ✅ Test with real examples

---

## API Design

### Generate Landing Page

```typescript
POST /api/generate-landing-page

{
  "template": "ai-saas-v1",
  "data": {
    "hero": {
      "headline": "Build AI Agents in Minutes",
      "subheadline": "No code required. Deploy autonomous agents that work 24/7.",
      "cta": "Start Free Trial",
      "illustrationStyle": "gradient"
    },
    "features": {
      "title": "Everything you need",
      "items": [
        {
          "title": "Fast",
          "description": "Deploy in seconds"
        },
        {
          "title": "Secure",
          "description": "Enterprise-grade security"
        },
        {
          "title": "Scalable",
          "description": "Grows with you"
        }
      ]
    },
    // ... rest of data
  }
}

Response:
{
  "html": "<html>...</html>",
  "css": "...",
  "assets": [
    "/illustrations/hero/gradient/hero-saas-dashboard.svg",
    "/illustrations/features/icons/speed.svg",
    // ...
  ]
}
```

### Edit Section

```typescript
POST /api/edit-landing-page

{
  "pageId": "page_123",
  "section": "hero",
  "edits": [
    {
      "type": "text",
      "selector": "h1",
      "value": "New Headline"
    },
    {
      "type": "image",
      "selector": "img",
      "value": "/illustrations/hero/minimal/hero-mobile-app.svg"
    }
  ]
}

Response:
{
  "success": true,
  "updatedHtml": "<section data-morgus-section=\"hero\">...</section>"
}
```

---

## Advantages Over AI-Generated Pages

| Approach | Manus/Morgus | Traditional AI |
|----------|--------------|----------------|
| **Consistency** | ✅ Pre-made assets | ❌ Varies each time |
| **Quality** | ✅ Curated, professional | ❌ Hit or miss |
| **Speed** | ✅ Instant (no generation) | ❌ 10-30 seconds |
| **Editability** | ✅ Surgical edits | ❌ Full regeneration |
| **Stability** | ✅ Sections stay intact | ❌ Everything changes |
| **Cost** | ✅ No image generation API | ❌ $0.01-0.10 per image |

---

## Next Steps

1. **Start with 20 hero illustrations** (5 per style theme)
2. **Create ai-saas-v1 template** (most requested)
3. **Build section editor** (core differentiator)
4. **Test with real landing pages**
5. **Expand library** based on usage data

This system will make Morgus landing pages as good as Manus, with the added benefit of being **inspectable and modifiable**.
