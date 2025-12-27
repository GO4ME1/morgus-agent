/**
 * Landing Page Templates for DPPM Service
 * 
 * Professional, Manus-quality templates for various website types.
 * These templates provide a solid foundation that AI can customize.
 */

export type TemplateType = 
  | 'saas' 
  | 'mobile-app' 
  | 'game' 
  | 'portfolio' 
  | 'ecommerce' 
  | 'restaurant' 
  | 'agency' 
  | 'blog'
  | 'event'
  | 'startup'
  | 'personal'
  | 'product';

export interface TemplateData {
  title: string;
  tagline: string;
  description: string;
  primaryColor?: string;
  accentColor?: string;
  features?: Array<{ title: string; description: string; icon?: string }>;
  pricing?: Array<{ name: string; price: string; features: string[]; highlighted?: boolean }>;
  testimonials?: Array<{ name: string; role: string; quote: string; avatar?: string }>;
  cta?: { text: string; url?: string };
  images?: { hero?: string; logo?: string; screenshots?: string[] };
  footer?: { copyright: string; links?: Array<{ text: string; url: string }> };
}

/**
 * Detect the best template type based on user request
 */
export function detectTemplateType(message: string): TemplateType | null {
  const lowerMessage = message.toLowerCase();
  
  const patterns: Array<{ type: TemplateType; keywords: string[] }> = [
    { type: 'saas', keywords: ['saas', 'software', 'platform', 'dashboard', 'analytics', 'b2b', 'enterprise'] },
    { type: 'mobile-app', keywords: ['mobile app', 'ios app', 'android app', 'app store', 'play store'] },
    { type: 'game', keywords: ['game', 'gaming', 'video game', 'play', 'rpg', 'mmorpg', 'indie game'] },
    { type: 'portfolio', keywords: ['portfolio', 'personal website', 'cv', 'resume', 'showcase'] },
    { type: 'ecommerce', keywords: ['ecommerce', 'e-commerce', 'shop', 'store', 'buy', 'sell', 'products'] },
    { type: 'restaurant', keywords: ['restaurant', 'cafe', 'food', 'menu', 'dining', 'bistro', 'eatery'] },
    { type: 'agency', keywords: ['agency', 'marketing', 'design agency', 'creative agency', 'consulting'] },
    { type: 'blog', keywords: ['blog', 'news', 'articles', 'magazine', 'publication'] },
    { type: 'event', keywords: ['event', 'conference', 'meetup', 'webinar', 'summit', 'festival'] },
    { type: 'startup', keywords: ['startup', 'launch', 'coming soon', 'waitlist', 'beta'] },
    { type: 'personal', keywords: ['personal', 'about me', 'bio', 'profile'] },
    { type: 'product', keywords: ['product', 'landing page', 'launch', 'feature'] },
  ];
  
  for (const pattern of patterns) {
    if (pattern.keywords.some(keyword => lowerMessage.includes(keyword))) {
      return pattern.type;
    }
  }
  
  // Default to startup/product for generic landing page requests
  if (lowerMessage.includes('landing') || lowerMessage.includes('website')) {
    return 'startup';
  }
  
  return null;
}

/**
 * Generate a complete landing page HTML from template
 */
export function generateLandingPage(type: TemplateType, data: TemplateData): string {
  const currentYear = new Date().getFullYear();
  const primaryColor = data.primaryColor || '#6366f1';
  const accentColor = data.accentColor || '#8b5cf6';
  
  const css = generateCSS(primaryColor, accentColor);
  const html = generateHTML(type, data, currentYear);
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="${escapeHtml(data.description)}">
  <title>${escapeHtml(data.title)}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>${css}</style>
</head>
<body>
${html}
</body>
</html>`;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function generateCSS(primaryColor: string, accentColor: string): string {
  return `
:root {
  --primary: ${primaryColor};
  --accent: ${accentColor};
  --text: #1f2937;
  --text-light: #6b7280;
  --text-lighter: #9ca3af;
  --bg: #ffffff;
  --bg-alt: #f9fafb;
  --bg-dark: #111827;
  --border: #e5e7eb;
  --shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  --radius: 12px;
  --radius-lg: 16px;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html {
  scroll-behavior: smooth;
}

body {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  color: var(--text);
  line-height: 1.6;
  background: var(--bg);
  -webkit-font-smoothing: antialiased;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
}

/* Navigation */
.nav {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid var(--border);
  z-index: 1000;
  padding: 16px 0;
}

.nav-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.nav-logo {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text);
  text-decoration: none;
}

.nav-links {
  display: flex;
  gap: 32px;
  list-style: none;
}

.nav-links a {
  color: var(--text-light);
  text-decoration: none;
  font-weight: 500;
  transition: color 0.2s;
}

.nav-links a:hover {
  color: var(--primary);
}

.nav-cta {
  background: var(--primary);
  color: white !important;
  padding: 10px 20px;
  border-radius: var(--radius);
  font-weight: 600;
}

.nav-cta:hover {
  background: var(--accent) !important;
}

/* Hero Section */
.hero {
  padding: 160px 0 100px;
  background: linear-gradient(135deg, var(--bg) 0%, var(--bg-alt) 100%);
  position: relative;
  overflow: hidden;
}

.hero::before {
  content: '';
  position: absolute;
  top: -50%;
  right: -20%;
  width: 60%;
  height: 150%;
  background: radial-gradient(circle, rgba(99, 102, 241, 0.1) 0%, transparent 70%);
  pointer-events: none;
}

.hero-content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 64px;
  align-items: center;
}

.hero-text {
  position: relative;
  z-index: 1;
}

.hero-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: rgba(99, 102, 241, 0.1);
  color: var(--primary);
  padding: 8px 16px;
  border-radius: 100px;
  font-size: 0.875rem;
  font-weight: 500;
  margin-bottom: 24px;
}

.hero h1 {
  font-size: 3.5rem;
  font-weight: 700;
  line-height: 1.1;
  margin-bottom: 24px;
  background: linear-gradient(135deg, var(--text) 0%, var(--text-light) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.hero-tagline {
  font-size: 1.25rem;
  color: var(--text-light);
  margin-bottom: 32px;
  max-width: 500px;
}

.hero-buttons {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 14px 28px;
  border-radius: var(--radius);
  font-size: 1rem;
  font-weight: 600;
  text-decoration: none;
  transition: all 0.2s;
  cursor: pointer;
  border: none;
}

.btn-primary {
  background: linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%);
  color: white;
  box-shadow: 0 4px 14px rgba(99, 102, 241, 0.4);
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(99, 102, 241, 0.5);
}

.btn-secondary {
  background: white;
  color: var(--text);
  border: 1px solid var(--border);
}

.btn-secondary:hover {
  border-color: var(--primary);
  color: var(--primary);
}

.hero-image {
  position: relative;
}

.hero-image img {
  width: 100%;
  height: auto;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
}

/* Features Section */
.features {
  padding: 100px 0;
}

.section-header {
  text-align: center;
  max-width: 600px;
  margin: 0 auto 64px;
}

.section-header h2 {
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 16px;
}

.section-header p {
  font-size: 1.125rem;
  color: var(--text-light);
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 32px;
}

.feature-card {
  background: white;
  padding: 32px;
  border-radius: var(--radius-lg);
  border: 1px solid var(--border);
  transition: all 0.3s;
}

.feature-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
  border-color: var(--primary);
}

.feature-icon {
  width: 56px;
  height: 56px;
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%);
  border-radius: var(--radius);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20px;
  font-size: 1.5rem;
}

.feature-card h3 {
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 12px;
}

.feature-card p {
  color: var(--text-light);
}

/* Pricing Section */
.pricing {
  padding: 100px 0;
  background: var(--bg-alt);
}

.pricing-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 32px;
  max-width: 1000px;
  margin: 0 auto;
}

.pricing-card {
  background: white;
  padding: 40px;
  border-radius: var(--radius-lg);
  border: 1px solid var(--border);
  text-align: center;
  transition: all 0.3s;
}

.pricing-card.highlighted {
  border-color: var(--primary);
  transform: scale(1.05);
  box-shadow: var(--shadow-lg);
}

.pricing-card h3 {
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 8px;
}

.pricing-card .price {
  font-size: 3rem;
  font-weight: 700;
  color: var(--primary);
  margin: 16px 0;
}

.pricing-card .price span {
  font-size: 1rem;
  color: var(--text-light);
  font-weight: 400;
}

.pricing-card ul {
  list-style: none;
  margin: 24px 0;
  text-align: left;
}

.pricing-card li {
  padding: 12px 0;
  color: var(--text-light);
  border-bottom: 1px solid var(--border);
  display: flex;
  align-items: center;
  gap: 12px;
}

.pricing-card li::before {
  content: '✓';
  color: var(--primary);
  font-weight: 600;
}

.pricing-card .btn {
  width: 100%;
  justify-content: center;
  margin-top: 16px;
}

/* Testimonials Section */
.testimonials {
  padding: 100px 0;
}

.testimonials-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 32px;
}

.testimonial-card {
  background: white;
  padding: 32px;
  border-radius: var(--radius-lg);
  border: 1px solid var(--border);
}

.testimonial-card .quote {
  font-size: 1.125rem;
  color: var(--text);
  margin-bottom: 24px;
  font-style: italic;
}

.testimonial-author {
  display: flex;
  align-items: center;
  gap: 16px;
}

.testimonial-author img {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  object-fit: cover;
}

.testimonial-author .name {
  font-weight: 600;
}

.testimonial-author .role {
  font-size: 0.875rem;
  color: var(--text-light);
}

/* CTA Section */
.cta {
  padding: 100px 0;
  background: linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%);
  text-align: center;
  color: white;
}

.cta h2 {
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 16px;
}

.cta p {
  font-size: 1.25rem;
  opacity: 0.9;
  margin-bottom: 32px;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
}

.cta .btn-primary {
  background: white;
  color: var(--primary);
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.2);
}

.cta .btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
}

/* Footer */
.footer {
  background: var(--bg-dark);
  color: white;
  padding: 64px 0 32px;
}

.footer-content {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr;
  gap: 48px;
  margin-bottom: 48px;
}

.footer-brand {
  max-width: 300px;
}

.footer-brand h3 {
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: 16px;
}

.footer-brand p {
  color: var(--text-lighter);
  margin-bottom: 24px;
}

.footer-links h4 {
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: 20px;
}

.footer-links ul {
  list-style: none;
}

.footer-links li {
  margin-bottom: 12px;
}

.footer-links a {
  color: var(--text-lighter);
  text-decoration: none;
  transition: color 0.2s;
}

.footer-links a:hover {
  color: white;
}

.footer-bottom {
  padding-top: 32px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: var(--text-lighter);
  font-size: 0.875rem;
}

.social-links {
  display: flex;
  gap: 16px;
}

.social-links a {
  color: var(--text-lighter);
  text-decoration: none;
  transition: color 0.2s;
}

.social-links a:hover {
  color: white;
}

/* Responsive */
@media (max-width: 968px) {
  .hero-content {
    grid-template-columns: 1fr;
    text-align: center;
  }
  
  .hero-tagline {
    margin-left: auto;
    margin-right: auto;
  }
  
  .hero-buttons {
    justify-content: center;
  }
  
  .hero-image {
    order: -1;
  }
  
  .nav-links {
    display: none;
  }
  
  .footer-content {
    grid-template-columns: 1fr 1fr;
  }
}

@media (max-width: 640px) {
  .hero h1 {
    font-size: 2.5rem;
  }
  
  .section-header h2 {
    font-size: 2rem;
  }
  
  .footer-content {
    grid-template-columns: 1fr;
  }
  
  .footer-bottom {
    flex-direction: column;
    gap: 16px;
    text-align: center;
  }
}
`;
}

function generateHTML(type: TemplateType, data: TemplateData, currentYear: number): string {
  const nav = `
  <nav class="nav">
    <div class="container nav-content">
      <a href="#" class="nav-logo">${escapeHtml(data.title)}</a>
      <ul class="nav-links">
        <li><a href="#features">Features</a></li>
        ${data.pricing ? '<li><a href="#pricing">Pricing</a></li>' : ''}
        ${data.testimonials ? '<li><a href="#testimonials">Testimonials</a></li>' : ''}
        <li><a href="#" class="nav-cta">${data.cta?.text || 'Get Started'}</a></li>
      </ul>
    </div>
  </nav>`;

  const hero = `
  <section class="hero">
    <div class="container hero-content">
      <div class="hero-text">
        <div class="hero-badge">✨ ${getHeroBadge(type)}</div>
        <h1>${escapeHtml(data.title)}</h1>
        <p class="hero-tagline">${escapeHtml(data.tagline)}</p>
        <div class="hero-buttons">
          <a href="#" class="btn btn-primary">${data.cta?.text || 'Get Started'} →</a>
          <a href="#features" class="btn btn-secondary">Learn More</a>
        </div>
      </div>
      <div class="hero-image">
        ${data.images?.hero ? `<img src="${escapeHtml(data.images.hero)}" alt="${escapeHtml(data.title)}">` : getPlaceholderImage(type)}
      </div>
    </div>
  </section>`;

  const features = data.features && data.features.length > 0 ? `
  <section class="features" id="features">
    <div class="container">
      <div class="section-header">
        <h2>Why Choose ${escapeHtml(data.title)}?</h2>
        <p>${escapeHtml(data.description)}</p>
      </div>
      <div class="features-grid">
        ${data.features.map(feature => `
          <div class="feature-card">
            <div class="feature-icon">${feature.icon || '✨'}</div>
            <h3>${escapeHtml(feature.title)}</h3>
            <p>${escapeHtml(feature.description)}</p>
          </div>
        `).join('')}
      </div>
    </div>
  </section>` : '';

  const pricing = data.pricing && data.pricing.length > 0 ? `
  <section class="pricing" id="pricing">
    <div class="container">
      <div class="section-header">
        <h2>Simple, Transparent Pricing</h2>
        <p>Choose the plan that's right for you</p>
      </div>
      <div class="pricing-grid">
        ${data.pricing.map(plan => `
          <div class="pricing-card ${plan.highlighted ? 'highlighted' : ''}">
            <h3>${escapeHtml(plan.name)}</h3>
            <div class="price">${escapeHtml(plan.price)}<span>/month</span></div>
            <ul>
              ${plan.features.map(f => `<li>${escapeHtml(f)}</li>`).join('')}
            </ul>
            <a href="#" class="btn ${plan.highlighted ? 'btn-primary' : 'btn-secondary'}">
              ${plan.highlighted ? 'Get Started' : 'Choose Plan'}
            </a>
          </div>
        `).join('')}
      </div>
    </div>
  </section>` : '';

  const testimonials = data.testimonials && data.testimonials.length > 0 ? `
  <section class="testimonials" id="testimonials">
    <div class="container">
      <div class="section-header">
        <h2>What Our Customers Say</h2>
        <p>Don't just take our word for it</p>
      </div>
      <div class="testimonials-grid">
        ${data.testimonials.map(t => `
          <div class="testimonial-card">
            <p class="quote">"${escapeHtml(t.quote)}"</p>
            <div class="testimonial-author">
              ${t.avatar ? `<img src="${escapeHtml(t.avatar)}" alt="${escapeHtml(t.name)}">` : '<div style="width:48px;height:48px;background:var(--bg-alt);border-radius:50%;"></div>'}
              <div>
                <div class="name">${escapeHtml(t.name)}</div>
                <div class="role">${escapeHtml(t.role)}</div>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  </section>` : '';

  const cta = `
  <section class="cta">
    <div class="container">
      <h2>Ready to Get Started?</h2>
      <p>${escapeHtml(data.tagline)}</p>
      <a href="#" class="btn btn-primary">${data.cta?.text || 'Start Free Trial'} →</a>
    </div>
  </section>`;

  const footer = `
  <footer class="footer">
    <div class="container">
      <div class="footer-content">
        <div class="footer-brand">
          <h3>${escapeHtml(data.title)}</h3>
          <p>${escapeHtml(data.description)}</p>
        </div>
        <div class="footer-links">
          <h4>Product</h4>
          <ul>
            <li><a href="#features">Features</a></li>
            ${data.pricing ? '<li><a href="#pricing">Pricing</a></li>' : ''}
            <li><a href="#">Documentation</a></li>
          </ul>
        </div>
        <div class="footer-links">
          <h4>Company</h4>
          <ul>
            <li><a href="#">About</a></li>
            <li><a href="#">Blog</a></li>
            <li><a href="#">Careers</a></li>
          </ul>
        </div>
        <div class="footer-links">
          <h4>Legal</h4>
          <ul>
            <li><a href="#">Privacy</a></li>
            <li><a href="#">Terms</a></li>
            <li><a href="#">Contact</a></li>
          </ul>
        </div>
      </div>
      <div class="footer-bottom">
        <p>© ${currentYear} ${escapeHtml(data.title)}. All rights reserved.</p>
        <div class="social-links">
          <a href="#">Twitter</a>
          <a href="#">GitHub</a>
          <a href="#">LinkedIn</a>
        </div>
      </div>
    </div>
  </footer>`;

  return nav + hero + features + pricing + testimonials + cta + footer;
}

function getHeroBadge(type: TemplateType): string {
  const badges: Record<TemplateType, string> = {
    'saas': 'Powerful SaaS Platform',
    'mobile-app': 'Available on iOS & Android',
    'game': 'Play Now',
    'portfolio': 'Creative Portfolio',
    'ecommerce': 'Shop Now',
    'restaurant': 'Reserve a Table',
    'agency': 'Award-Winning Agency',
    'blog': 'Latest Stories',
    'event': 'Join Us',
    'startup': 'Launching Soon',
    'personal': 'Welcome',
    'product': 'New Release',
  };
  return badges[type] || 'Welcome';
}

function getPlaceholderImage(type: TemplateType): string {
  // Return a gradient placeholder with appropriate icon
  return `<div style="width:100%;aspect-ratio:16/10;background:linear-gradient(135deg,var(--primary),var(--accent));border-radius:var(--radius-lg);display:flex;align-items:center;justify-content:center;font-size:4rem;color:white;">
    ${getTypeIcon(type)}
  </div>`;
}

function getTypeIcon(type: TemplateType): string {
  const icons: Record<TemplateType, string> = {
    'saas': '📊',
    'mobile-app': '📱',
    'game': '🎮',
    'portfolio': '🎨',
    'ecommerce': '🛒',
    'restaurant': '🍽️',
    'agency': '💼',
    'blog': '📝',
    'event': '🎉',
    'startup': '🚀',
    'personal': '👤',
    'product': '✨',
  };
  return icons[type] || '✨';
}

/**
 * Extract template data from AI-generated content
 */
export function parseTemplateData(content: string, defaultTitle: string): Partial<TemplateData> {
  const data: Partial<TemplateData> = {
    title: defaultTitle,
  };
  
  // Try to extract structured data from the content
  const titleMatch = content.match(/title[:\s]+["']?([^"'\n]+)["']?/i);
  if (titleMatch) data.title = titleMatch[1].trim();
  
  const taglineMatch = content.match(/tagline[:\s]+["']?([^"'\n]+)["']?/i);
  if (taglineMatch) data.tagline = taglineMatch[1].trim();
  
  const descriptionMatch = content.match(/description[:\s]+["']?([^"'\n]+)["']?/i);
  if (descriptionMatch) data.description = descriptionMatch[1].trim();
  
  return data;
}
