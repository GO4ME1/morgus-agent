/**
 * Presentation Templates - Professional Slide Decks
 * 
 * Generates styled HTML presentations with reveal.js
 */

export type PresentationTemplateType = 
  | 'pitch-deck'
  | 'sales'
  | 'educational'
  | 'report'
  | 'proposal'
  | 'keynote'
  | 'workshop'
  | 'product-launch'
  | 'company-overview'
  | 'portfolio';

export interface SlideData {
  type: 'title' | 'content' | 'image' | 'split' | 'quote' | 'stats' | 'team' | 'timeline' | 'comparison' | 'cta';
  title?: string;
  subtitle?: string;
  content?: string | string[];
  image?: string;
  stats?: Array<{ value: string; label: string }>;
  items?: Array<{ title: string; description?: string; image?: string }>;
  quote?: { text: string; author: string; role?: string };
  left?: { title: string; content: string };
  right?: { title: string; content: string };
  cta?: { text: string; url?: string };
  background?: string;
  notes?: string;
}

export interface PresentationData {
  title: string;
  subtitle?: string;
  author?: string;
  company?: string;
  logo?: string;
  date?: string;
  slides: SlideData[];
  theme?: 'dark' | 'light' | 'neon' | 'corporate';
  brandColor?: string;
}

// Presentation themes
const PRESENTATION_THEMES = {
  dark: {
    background: '#1a1a2e',
    slideBackground: '#16213e',
    text: '#ffffff',
    muted: '#a0a0a0',
    primary: '#6366f1',
    accent: '#8b5cf6',
    gradient: 'linear-gradient(135deg, #1a1a2e, #16213e)',
  },
  light: {
    background: '#ffffff',
    slideBackground: '#f8fafc',
    text: '#1a202c',
    muted: '#64748b',
    primary: '#6366f1',
    accent: '#8b5cf6',
    gradient: 'linear-gradient(135deg, #f8fafc, #e2e8f0)',
  },
  neon: {
    background: '#0a0a0f',
    slideBackground: '#0f0f1a',
    text: '#ffffff',
    muted: '#a0a0a0',
    primary: '#00f5ff',
    accent: '#ff00ff',
    gradient: 'linear-gradient(135deg, #0a0a0f, #1a1a2e)',
  },
  corporate: {
    background: '#1e3a5f',
    slideBackground: '#0d2137',
    text: '#ffffff',
    muted: '#94a3b8',
    primary: '#3b82f6',
    accent: '#60a5fa',
    gradient: 'linear-gradient(135deg, #1e3a5f, #0d2137)',
  },
};

/**
 * Detect presentation type from user message
 */
export function detectPresentationTemplate(message: string): PresentationTemplateType {
  const lower = message.toLowerCase();
  
  const patterns: Array<{ type: PresentationTemplateType; keywords: string[] }> = [
    { type: 'pitch-deck', keywords: ['pitch deck', 'pitch', 'investor', 'funding', 'startup pitch', 'vc'] },
    { type: 'sales', keywords: ['sales', 'sales deck', 'client presentation', 'proposal deck', 'deal'] },
    { type: 'educational', keywords: ['educational', 'teaching', 'lesson', 'course', 'training', 'tutorial'] },
    { type: 'report', keywords: ['report', 'quarterly', 'annual', 'status', 'results', 'performance'] },
    { type: 'proposal', keywords: ['proposal', 'project proposal', 'business proposal', 'rfp'] },
    { type: 'keynote', keywords: ['keynote', 'conference', 'talk', 'speech', 'ted'] },
    { type: 'workshop', keywords: ['workshop', 'hands-on', 'interactive', 'session'] },
    { type: 'product-launch', keywords: ['product launch', 'launch', 'new product', 'release', 'announcement'] },
    { type: 'company-overview', keywords: ['company overview', 'about us', 'company profile', 'introduction'] },
    { type: 'portfolio', keywords: ['portfolio', 'showcase', 'work samples', 'case studies', 'projects'] },
  ];
  
  for (const pattern of patterns) {
    if (pattern.keywords.some(keyword => lower.includes(keyword))) {
      return pattern.type;
    }
  }
  
  return 'pitch-deck'; // Default
}

/**
 * Generate HTML presentation using reveal.js
 */
export function generatePresentation(type: PresentationTemplateType, data: PresentationData): string {
  const themeKey = data.theme || 'dark';
  const theme = { ...PRESENTATION_THEMES[themeKey] };
  if (data.brandColor) {
    theme.primary = data.brandColor;
  }
  
  const isNeon = themeKey === 'neon';
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(data.title)}</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/reveal.js@4.5.0/dist/reveal.css">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/reveal.js@4.5.0/dist/theme/black.css">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    :root {
      --r-background-color: ${theme.background};
      --r-main-font: 'Inter', sans-serif;
      --r-main-font-size: 38px;
      --r-main-color: ${theme.text};
      --r-heading-font: 'Inter', sans-serif;
      --r-heading-color: ${theme.text};
      --r-heading-text-transform: none;
      --r-link-color: ${theme.primary};
    }
    
    .reveal {
      font-family: 'Inter', sans-serif;
    }
    
    .reveal .slides {
      text-align: left;
    }
    
    .reveal .slides section {
      padding: 40px 60px;
    }
    
    /* Slide backgrounds */
    .reveal .slides section {
      background: ${theme.slideBackground};
      ${isNeon ? `
        background-image: 
          radial-gradient(ellipse at top left, rgba(0, 245, 255, 0.05) 0%, transparent 50%),
          radial-gradient(ellipse at bottom right, rgba(255, 0, 255, 0.05) 0%, transparent 50%);
      ` : ''}
    }
    
    /* Title slide */
    .title-slide {
      text-align: center !important;
      display: flex !important;
      flex-direction: column;
      justify-content: center;
      align-items: center;
    }
    
    .title-slide h1 {
      font-size: 3em;
      font-weight: 800;
      margin-bottom: 0.3em;
      ${isNeon ? `
        background: linear-gradient(135deg, ${theme.primary}, ${theme.accent});
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        text-shadow: 0 0 40px rgba(0, 245, 255, 0.3);
      ` : `color: ${theme.primary};`}
    }
    
    .title-slide h2 {
      font-size: 1.5em;
      font-weight: 400;
      color: ${theme.muted};
      margin-bottom: 2em;
    }
    
    .title-slide .meta {
      font-size: 0.8em;
      color: ${theme.muted};
    }
    
    .title-slide .logo {
      max-height: 80px;
      margin-bottom: 2em;
    }
    
    /* Content slides */
    .reveal h1, .reveal h2 {
      font-weight: 700;
      margin-bottom: 0.5em;
      ${isNeon ? `color: ${theme.primary};` : ''}
    }
    
    .reveal h3 {
      font-weight: 600;
      color: ${theme.accent};
      margin-bottom: 0.5em;
    }
    
    .reveal p {
      line-height: 1.6;
      margin-bottom: 1em;
    }
    
    .reveal ul, .reveal ol {
      margin-left: 1em;
    }
    
    .reveal li {
      margin-bottom: 0.5em;
      line-height: 1.5;
    }
    
    /* Stats grid */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 40px;
      margin-top: 40px;
    }
    
    .stat-item {
      text-align: center;
      padding: 30px;
      background: rgba(255, 255, 255, 0.05);
      border-radius: 16px;
      ${isNeon ? `
        border: 1px solid rgba(0, 245, 255, 0.2);
        box-shadow: 0 0 30px rgba(0, 245, 255, 0.1);
      ` : ''}
    }
    
    .stat-value {
      font-size: 3em;
      font-weight: 800;
      color: ${theme.primary};
      ${isNeon ? 'text-shadow: 0 0 20px rgba(0, 245, 255, 0.5);' : ''}
    }
    
    .stat-label {
      font-size: 0.9em;
      color: ${theme.muted};
      margin-top: 10px;
    }
    
    /* Split layout */
    .split-slide {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 60px;
      align-items: center;
    }
    
    .split-content h3 {
      margin-bottom: 1em;
    }
    
    /* Quote slide */
    .quote-slide {
      text-align: center !important;
      display: flex !important;
      flex-direction: column;
      justify-content: center;
    }
    
    .quote-text {
      font-size: 1.8em;
      font-style: italic;
      line-height: 1.5;
      margin-bottom: 1em;
      color: ${theme.text};
      ${isNeon ? `
        background: linear-gradient(135deg, ${theme.primary}, ${theme.accent});
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
      ` : ''}
    }
    
    .quote-author {
      font-size: 1em;
      color: ${theme.muted};
    }
    
    /* Team grid */
    .team-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 30px;
      margin-top: 30px;
    }
    
    .team-member {
      text-align: center;
    }
    
    .team-member img {
      width: 120px;
      height: 120px;
      border-radius: 50%;
      object-fit: cover;
      margin-bottom: 15px;
      ${isNeon ? 'border: 3px solid rgba(0, 245, 255, 0.3);' : ''}
    }
    
    .team-member h4 {
      font-size: 1em;
      margin-bottom: 5px;
    }
    
    .team-member p {
      font-size: 0.8em;
      color: ${theme.muted};
    }
    
    /* CTA slide */
    .cta-slide {
      text-align: center !important;
      display: flex !important;
      flex-direction: column;
      justify-content: center;
      align-items: center;
    }
    
    .cta-button {
      display: inline-block;
      padding: 20px 50px;
      background: ${theme.primary};
      color: white;
      font-size: 1.2em;
      font-weight: 600;
      border-radius: 12px;
      text-decoration: none;
      margin-top: 40px;
      ${isNeon ? 'box-shadow: 0 0 30px rgba(0, 245, 255, 0.4);' : ''}
    }
    
    /* Timeline */
    .timeline {
      position: relative;
      padding-left: 40px;
    }
    
    .timeline::before {
      content: '';
      position: absolute;
      left: 10px;
      top: 0;
      bottom: 0;
      width: 3px;
      background: ${theme.primary};
    }
    
    .timeline-item {
      position: relative;
      margin-bottom: 30px;
    }
    
    .timeline-item::before {
      content: '';
      position: absolute;
      left: -36px;
      top: 5px;
      width: 16px;
      height: 16px;
      border-radius: 50%;
      background: ${theme.primary};
      ${isNeon ? 'box-shadow: 0 0 15px rgba(0, 245, 255, 0.5);' : ''}
    }
    
    /* Image slide */
    .image-slide img {
      max-width: 100%;
      max-height: 70vh;
      border-radius: 12px;
      ${isNeon ? 'box-shadow: 0 0 40px rgba(0, 245, 255, 0.2);' : 'box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);'}
    }
    
    /* Comparison */
    .comparison-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 40px;
    }
    
    .comparison-item {
      padding: 30px;
      background: rgba(255, 255, 255, 0.05);
      border-radius: 16px;
    }
    
    .comparison-item h3 {
      text-align: center;
      margin-bottom: 20px;
    }
    
    /* Neon effects */
    ${isNeon ? `
    @keyframes neonPulse {
      0%, 100% { box-shadow: 0 0 20px rgba(0, 245, 255, 0.2); }
      50% { box-shadow: 0 0 40px rgba(0, 245, 255, 0.4); }
    }
    
    .stat-item, .team-member img, .cta-button {
      animation: neonPulse 3s ease-in-out infinite;
    }
    ` : ''}
    
    /* Progress bar */
    .reveal .progress {
      background: rgba(255, 255, 255, 0.1);
      height: 4px;
    }
    
    .reveal .progress span {
      background: ${theme.primary};
      ${isNeon ? 'box-shadow: 0 0 10px rgba(0, 245, 255, 0.5);' : ''}
    }
  </style>
</head>
<body>
  <div class="reveal">
    <div class="slides">
      ${data.slides.map(slide => generateSlide(slide, data, theme, isNeon)).join('\n')}
    </div>
  </div>
  
  <script src="https://cdn.jsdelivr.net/npm/reveal.js@4.5.0/dist/reveal.js"></script>
  <script>
    Reveal.initialize({
      hash: true,
      slideNumber: true,
      progress: true,
      center: false,
      transition: 'slide',
      backgroundTransition: 'fade',
    });
  </script>
</body>
</html>`;
}

function generateSlide(slide: SlideData, data: PresentationData, theme: any, isNeon: boolean): string {
  const bgStyle = slide.background ? `data-background="${slide.background}"` : '';
  
  switch (slide.type) {
    case 'title':
      return `
        <section class="title-slide" ${bgStyle}>
          ${data.logo ? `<img src="${escapeHtml(data.logo)}" alt="Logo" class="logo">` : ''}
          <h1>${escapeHtml(slide.title || data.title)}</h1>
          ${slide.subtitle || data.subtitle ? `<h2>${escapeHtml(slide.subtitle || data.subtitle || '')}</h2>` : ''}
          <div class="meta">
            ${data.author ? `<span>${escapeHtml(data.author)}</span>` : ''}
            ${data.author && data.company ? ` | ` : ''}
            ${data.company ? `<span>${escapeHtml(data.company)}</span>` : ''}
            ${data.date ? `<br><span>${escapeHtml(data.date)}</span>` : ''}
          </div>
        </section>
      `;
    
    case 'content':
      return `
        <section ${bgStyle}>
          ${slide.title ? `<h2>${escapeHtml(slide.title)}</h2>` : ''}
          ${Array.isArray(slide.content) 
            ? `<ul>${slide.content.map(item => `<li>${escapeHtml(item)}</li>`).join('')}</ul>`
            : `<p>${escapeHtml(slide.content || '')}</p>`
          }
        </section>
      `;
    
    case 'image':
      return `
        <section class="image-slide" ${bgStyle}>
          ${slide.title ? `<h2>${escapeHtml(slide.title)}</h2>` : ''}
          ${slide.image ? `<img src="${escapeHtml(slide.image)}" alt="${escapeHtml(slide.title || '')}">` : ''}
          ${slide.content ? `<p>${escapeHtml(typeof slide.content === 'string' ? slide.content : '')}</p>` : ''}
        </section>
      `;
    
    case 'split':
      return `
        <section ${bgStyle}>
          ${slide.title ? `<h2>${escapeHtml(slide.title)}</h2>` : ''}
          <div class="split-slide">
            <div class="split-content">
              ${slide.left?.title ? `<h3>${escapeHtml(slide.left.title)}</h3>` : ''}
              <p>${escapeHtml(slide.left?.content || '')}</p>
            </div>
            <div class="split-content">
              ${slide.right?.title ? `<h3>${escapeHtml(slide.right.title)}</h3>` : ''}
              <p>${escapeHtml(slide.right?.content || '')}</p>
            </div>
          </div>
        </section>
      `;
    
    case 'quote':
      return `
        <section class="quote-slide" ${bgStyle}>
          <div class="quote-text">"${escapeHtml(slide.quote?.text || '')}"</div>
          <div class="quote-author">
            — ${escapeHtml(slide.quote?.author || '')}
            ${slide.quote?.role ? `, ${escapeHtml(slide.quote.role)}` : ''}
          </div>
        </section>
      `;
    
    case 'stats':
      return `
        <section ${bgStyle}>
          ${slide.title ? `<h2>${escapeHtml(slide.title)}</h2>` : ''}
          <div class="stats-grid">
            ${(slide.stats || []).map(stat => `
              <div class="stat-item">
                <div class="stat-value">${escapeHtml(stat.value)}</div>
                <div class="stat-label">${escapeHtml(stat.label)}</div>
              </div>
            `).join('')}
          </div>
        </section>
      `;
    
    case 'team':
      return `
        <section ${bgStyle}>
          ${slide.title ? `<h2>${escapeHtml(slide.title)}</h2>` : ''}
          <div class="team-grid">
            ${(slide.items || []).map(member => `
              <div class="team-member">
                ${member.image ? `<img src="${escapeHtml(member.image)}" alt="${escapeHtml(member.title)}">` : ''}
                <h4>${escapeHtml(member.title)}</h4>
                ${member.description ? `<p>${escapeHtml(member.description)}</p>` : ''}
              </div>
            `).join('')}
          </div>
        </section>
      `;
    
    case 'timeline':
      return `
        <section ${bgStyle}>
          ${slide.title ? `<h2>${escapeHtml(slide.title)}</h2>` : ''}
          <div class="timeline">
            ${(slide.items || []).map(item => `
              <div class="timeline-item">
                <h4>${escapeHtml(item.title)}</h4>
                ${item.description ? `<p>${escapeHtml(item.description)}</p>` : ''}
              </div>
            `).join('')}
          </div>
        </section>
      `;
    
    case 'comparison':
      return `
        <section ${bgStyle}>
          ${slide.title ? `<h2>${escapeHtml(slide.title)}</h2>` : ''}
          <div class="comparison-grid">
            <div class="comparison-item">
              ${slide.left?.title ? `<h3>${escapeHtml(slide.left.title)}</h3>` : ''}
              <p>${escapeHtml(slide.left?.content || '')}</p>
            </div>
            <div class="comparison-item">
              ${slide.right?.title ? `<h3>${escapeHtml(slide.right.title)}</h3>` : ''}
              <p>${escapeHtml(slide.right?.content || '')}</p>
            </div>
          </div>
        </section>
      `;
    
    case 'cta':
      return `
        <section class="cta-slide" ${bgStyle}>
          ${slide.title ? `<h2>${escapeHtml(slide.title)}</h2>` : ''}
          ${slide.content ? `<p>${escapeHtml(typeof slide.content === 'string' ? slide.content : '')}</p>` : ''}
          ${slide.cta ? `<a href="${escapeHtml(slide.cta.url || '#')}" class="cta-button">${escapeHtml(slide.cta.text)}</a>` : ''}
        </section>
      `;
    
    default:
      return `
        <section ${bgStyle}>
          ${slide.title ? `<h2>${escapeHtml(slide.title)}</h2>` : ''}
          ${slide.content ? `<p>${escapeHtml(typeof slide.content === 'string' ? slide.content : '')}</p>` : ''}
        </section>
      `;
  }
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
