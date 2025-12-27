/**
 * Website Templates - Professional, Manus-quality templates
 * 
 * ALL websites MUST use these templates. AI only fills in content.
 */

export type WebsiteTemplateType = 
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
  | 'product'
  | 'nonprofit'
  | 'education'
  | 'healthcare'
  | 'realestate'
  | 'fitness'
  | 'entertainment';

export interface WebsiteData {
  title: string;
  tagline: string;
  description: string;
  primaryColor?: string;
  accentColor?: string;
  features?: Array<{ title: string; description: string; icon?: string }>;
  pricing?: Array<{ name: string; price: string; features: string[]; highlighted?: boolean; period?: string }>;
  testimonials?: Array<{ name: string; role: string; quote: string; avatar?: string; company?: string }>;
  cta?: { text: string; url?: string; secondaryText?: string; secondaryUrl?: string };
  images?: { hero?: string; logo?: string; screenshots?: string[]; gallery?: string[] };
  sections?: Array<{ type: string; data: any }>;
  socialLinks?: { twitter?: string; github?: string; linkedin?: string; instagram?: string; facebook?: string };
  contact?: { email?: string; phone?: string; address?: string };
  year: number;
}

/**
 * Detect the best website template type from user message
 */
export function detectWebsiteTemplate(message: string): WebsiteTemplateType {
  const lower = message.toLowerCase();
  
  const patterns: Array<{ type: WebsiteTemplateType; keywords: string[] }> = [
    { type: 'saas', keywords: ['saas', 'software', 'platform', 'dashboard', 'analytics', 'b2b', 'enterprise', 'crm', 'erp'] },
    { type: 'mobile-app', keywords: ['mobile app', 'ios app', 'android app', 'app store', 'play store', 'download app'] },
    { type: 'game', keywords: ['game', 'gaming', 'video game', 'play', 'rpg', 'mmorpg', 'indie game', 'steam'] },
    { type: 'portfolio', keywords: ['portfolio', 'personal website', 'cv', 'resume', 'showcase', 'work samples'] },
    { type: 'ecommerce', keywords: ['ecommerce', 'e-commerce', 'shop', 'store', 'buy', 'sell', 'products', 'cart'] },
    { type: 'restaurant', keywords: ['restaurant', 'cafe', 'food', 'menu', 'dining', 'bistro', 'eatery', 'bar', 'coffee'] },
    { type: 'agency', keywords: ['agency', 'marketing', 'design agency', 'creative agency', 'consulting', 'studio'] },
    { type: 'blog', keywords: ['blog', 'news', 'articles', 'magazine', 'publication', 'journal'] },
    { type: 'event', keywords: ['event', 'conference', 'meetup', 'webinar', 'summit', 'festival', 'concert', 'workshop'] },
    { type: 'startup', keywords: ['startup', 'launch', 'coming soon', 'waitlist', 'beta', 'pre-launch'] },
    { type: 'personal', keywords: ['personal', 'about me', 'bio', 'profile', 'personal brand'] },
    { type: 'product', keywords: ['product', 'feature', 'new release', 'announcement'] },
    { type: 'nonprofit', keywords: ['nonprofit', 'charity', 'donation', 'cause', 'volunteer', 'foundation'] },
    { type: 'education', keywords: ['education', 'school', 'course', 'learning', 'university', 'academy', 'training'] },
    { type: 'healthcare', keywords: ['healthcare', 'medical', 'clinic', 'doctor', 'hospital', 'health', 'wellness'] },
    { type: 'realestate', keywords: ['real estate', 'property', 'homes', 'apartments', 'rental', 'housing'] },
    { type: 'fitness', keywords: ['fitness', 'gym', 'workout', 'training', 'yoga', 'sports', 'athletic'] },
    { type: 'entertainment', keywords: ['entertainment', 'movie', 'music', 'show', 'tv', 'streaming', 'podcast'] },
  ];
  
  for (const pattern of patterns) {
    if (pattern.keywords.some(keyword => lower.includes(keyword))) {
      return pattern.type;
    }
  }
  
  // Default to startup for generic landing page requests
  return 'startup';
}

/**
 * Generate a complete website HTML from template
 */
export function generateWebsite(type: WebsiteTemplateType, data: WebsiteData): string {
  const css = generateCSS(data.primaryColor || '#6366f1', data.accentColor || '#8b5cf6', type);
  const html = generateHTML(type, data);
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="${escapeHtml(data.description)}">
  <meta name="theme-color" content="${data.primaryColor || '#6366f1'}">
  <meta property="og:title" content="${escapeHtml(data.title)}">
  <meta property="og:description" content="${escapeHtml(data.description)}">
  <meta property="og:type" content="website">
  <title>${escapeHtml(data.title)}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>${css}</style>
</head>
<body>
${html}
<script>
// Smooth scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});

// Navbar scroll effect
const nav = document.querySelector('.nav');
window.addEventListener('scroll', () => {
  if (window.scrollY > 50) {
    nav.classList.add('scrolled');
  } else {
    nav.classList.remove('scrolled');
  }
});

// Mobile menu toggle
const menuToggle = document.querySelector('.menu-toggle');
const navLinks = document.querySelector('.nav-links');
if (menuToggle) {
  menuToggle.addEventListener('click', () => {
    navLinks.classList.toggle('active');
    menuToggle.classList.toggle('active');
  });
}

// Animate on scroll
const observerOptions = {
  threshold: 0.1,
  rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('animate-in');
    }
  });
}, observerOptions);

document.querySelectorAll('.animate-on-scroll').forEach(el => observer.observe(el));
</script>
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

function generateCSS(primaryColor: string, accentColor: string, type: WebsiteTemplateType): string {
  // Get type-specific styles
  const typeStyles = getTypeSpecificStyles(type);
  
  return `
:root {
  --primary: ${primaryColor};
  --primary-dark: ${darkenColor(primaryColor, 15)};
  --primary-light: ${lightenColor(primaryColor, 15)};
  --accent: ${accentColor};
  --text: #1f2937;
  --text-light: #6b7280;
  --text-lighter: #9ca3af;
  --bg: #ffffff;
  --bg-alt: #f9fafb;
  --bg-dark: #111827;
  --border: #e5e7eb;
  --success: #10b981;
  --warning: #f59e0b;
  --error: #ef4444;
  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  --shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  --radius: 12px;
  --radius-lg: 16px;
  --radius-xl: 24px;
  --transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
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
  -moz-osx-font-smoothing: grayscale;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
}

.container-lg {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 24px;
}

/* Animations */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideInLeft {
  from {
    opacity: 0;
    transform: translateX(-30px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

.animate-on-scroll {
  opacity: 0;
  transform: translateY(30px);
  transition: var(--transition);
}

.animate-on-scroll.animate-in {
  opacity: 1;
  transform: translateY(0);
}

/* Navigation */
.nav {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-bottom: 1px solid transparent;
  z-index: 1000;
  padding: 16px 0;
  transition: var(--transition);
}

.nav.scrolled {
  background: rgba(255, 255, 255, 0.95);
  border-bottom-color: var(--border);
  box-shadow: var(--shadow-sm);
}

.nav-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.nav-logo {
  font-size: 1.5rem;
  font-weight: 800;
  color: var(--text);
  text-decoration: none;
  display: flex;
  align-items: center;
  gap: 8px;
}

.nav-logo img {
  height: 32px;
  width: auto;
}

.nav-links {
  display: flex;
  gap: 32px;
  list-style: none;
  align-items: center;
}

.nav-links a {
  color: var(--text-light);
  text-decoration: none;
  font-weight: 500;
  font-size: 0.95rem;
  transition: var(--transition);
  position: relative;
}

.nav-links a::after {
  content: '';
  position: absolute;
  bottom: -4px;
  left: 0;
  width: 0;
  height: 2px;
  background: var(--primary);
  transition: var(--transition);
}

.nav-links a:hover {
  color: var(--primary);
}

.nav-links a:hover::after {
  width: 100%;
}

.nav-cta {
  background: var(--primary) !important;
  color: white !important;
  padding: 10px 24px !important;
  border-radius: var(--radius) !important;
  font-weight: 600 !important;
}

.nav-cta:hover {
  background: var(--primary-dark) !important;
  transform: translateY(-1px);
}

.nav-cta::after {
  display: none !important;
}

.menu-toggle {
  display: none;
  flex-direction: column;
  gap: 5px;
  cursor: pointer;
  padding: 8px;
}

.menu-toggle span {
  width: 24px;
  height: 2px;
  background: var(--text);
  transition: var(--transition);
}

/* Hero Section */
.hero {
  padding: 160px 0 120px;
  background: linear-gradient(135deg, var(--bg) 0%, var(--bg-alt) 100%);
  position: relative;
  overflow: hidden;
}

.hero::before {
  content: '';
  position: absolute;
  top: -50%;
  right: -20%;
  width: 80%;
  height: 150%;
  background: radial-gradient(circle, ${lightenColor(primaryColor, 40)}20 0%, transparent 70%);
  pointer-events: none;
}

.hero::after {
  content: '';
  position: absolute;
  bottom: -30%;
  left: -10%;
  width: 50%;
  height: 100%;
  background: radial-gradient(circle, ${lightenColor(accentColor, 40)}15 0%, transparent 70%);
  pointer-events: none;
}

.hero-content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 80px;
  align-items: center;
  position: relative;
  z-index: 1;
}

.hero-text {
  animation: fadeInUp 0.8s ease-out;
}

.hero-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: ${lightenColor(primaryColor, 40)}30;
  color: var(--primary);
  padding: 8px 16px;
  border-radius: 100px;
  font-size: 0.875rem;
  font-weight: 600;
  margin-bottom: 24px;
  border: 1px solid ${lightenColor(primaryColor, 30)}50;
}

.hero-badge svg {
  width: 16px;
  height: 16px;
}

.hero h1 {
  font-size: 4rem;
  font-weight: 800;
  line-height: 1.1;
  margin-bottom: 24px;
  letter-spacing: -0.02em;
}

.hero h1 .gradient-text {
  background: linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.hero-tagline {
  font-size: 1.25rem;
  color: var(--text-light);
  margin-bottom: 40px;
  max-width: 500px;
  line-height: 1.7;
}

.hero-buttons {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.hero-stats {
  display: flex;
  gap: 48px;
  margin-top: 48px;
  padding-top: 32px;
  border-top: 1px solid var(--border);
}

.hero-stat {
  text-align: left;
}

.hero-stat-value {
  font-size: 2rem;
  font-weight: 800;
  color: var(--primary);
}

.hero-stat-label {
  font-size: 0.875rem;
  color: var(--text-light);
  margin-top: 4px;
}

.hero-image {
  position: relative;
  animation: fadeIn 1s ease-out 0.3s both;
}

.hero-image img {
  width: 100%;
  height: auto;
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-xl);
}

.hero-image-decoration {
  position: absolute;
  width: 100%;
  height: 100%;
  top: 20px;
  left: 20px;
  background: linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%);
  border-radius: var(--radius-xl);
  z-index: -1;
  opacity: 0.2;
}

/* Buttons */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 14px 28px;
  border-radius: var(--radius);
  font-size: 1rem;
  font-weight: 600;
  text-decoration: none;
  transition: var(--transition);
  cursor: pointer;
  border: none;
  white-space: nowrap;
}

.btn-primary {
  background: linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%);
  color: white;
  box-shadow: 0 4px 14px ${primaryColor}50;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px ${primaryColor}60;
}

.btn-secondary {
  background: white;
  color: var(--text);
  border: 1px solid var(--border);
}

.btn-secondary:hover {
  border-color: var(--primary);
  color: var(--primary);
  background: ${lightenColor(primaryColor, 45)};
}

.btn-outline {
  background: transparent;
  color: var(--primary);
  border: 2px solid var(--primary);
}

.btn-outline:hover {
  background: var(--primary);
  color: white;
}

.btn-lg {
  padding: 18px 36px;
  font-size: 1.1rem;
}

.btn-sm {
  padding: 10px 20px;
  font-size: 0.875rem;
}

/* Sections */
.section {
  padding: 100px 0;
}

.section-alt {
  background: var(--bg-alt);
}

.section-dark {
  background: var(--bg-dark);
  color: white;
}

.section-dark .section-subtitle {
  color: var(--text-lighter);
}

.section-header {
  text-align: center;
  max-width: 700px;
  margin: 0 auto 64px;
}

.section-badge {
  display: inline-block;
  background: ${lightenColor(primaryColor, 40)}30;
  color: var(--primary);
  padding: 6px 14px;
  border-radius: 100px;
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 16px;
}

.section-header h2 {
  font-size: 2.75rem;
  font-weight: 800;
  margin-bottom: 16px;
  letter-spacing: -0.02em;
}

.section-subtitle {
  font-size: 1.125rem;
  color: var(--text-light);
  line-height: 1.7;
}

/* Features */
.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 32px;
}

.feature-card {
  background: white;
  padding: 40px;
  border-radius: var(--radius-lg);
  border: 1px solid var(--border);
  transition: var(--transition);
  position: relative;
  overflow: hidden;
}

.feature-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, var(--primary), var(--accent));
  transform: scaleX(0);
  transform-origin: left;
  transition: var(--transition);
}

.feature-card:hover {
  transform: translateY(-8px);
  box-shadow: var(--shadow-xl);
  border-color: transparent;
}

.feature-card:hover::before {
  transform: scaleX(1);
}

.feature-icon {
  width: 64px;
  height: 64px;
  background: linear-gradient(135deg, ${lightenColor(primaryColor, 35)} 0%, ${lightenColor(accentColor, 35)} 100%);
  border-radius: var(--radius);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 24px;
  font-size: 1.75rem;
}

.feature-card h3 {
  font-size: 1.25rem;
  font-weight: 700;
  margin-bottom: 12px;
}

.feature-card p {
  color: var(--text-light);
  line-height: 1.7;
}

/* Pricing */
.pricing-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 32px;
  max-width: 1100px;
  margin: 0 auto;
}

.pricing-card {
  background: white;
  padding: 48px 40px;
  border-radius: var(--radius-xl);
  border: 1px solid var(--border);
  text-align: center;
  transition: var(--transition);
  position: relative;
}

.pricing-card.highlighted {
  border-color: var(--primary);
  transform: scale(1.05);
  box-shadow: var(--shadow-xl);
}

.pricing-card.highlighted::before {
  content: 'Most Popular';
  position: absolute;
  top: -12px;
  left: 50%;
  transform: translateX(-50%);
  background: linear-gradient(135deg, var(--primary), var(--accent));
  color: white;
  padding: 6px 20px;
  border-radius: 100px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
}

.pricing-card h3 {
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 8px;
  color: var(--text-light);
}

.pricing-card .price {
  font-size: 4rem;
  font-weight: 800;
  color: var(--text);
  margin: 16px 0;
  line-height: 1;
}

.pricing-card .price span {
  font-size: 1rem;
  color: var(--text-light);
  font-weight: 400;
}

.pricing-card .price-description {
  font-size: 0.9rem;
  color: var(--text-light);
  margin-bottom: 32px;
}

.pricing-card ul {
  list-style: none;
  margin: 32px 0;
  text-align: left;
}

.pricing-card li {
  padding: 12px 0;
  color: var(--text);
  border-bottom: 1px solid var(--border);
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 0.95rem;
}

.pricing-card li:last-child {
  border-bottom: none;
}

.pricing-card li::before {
  content: '✓';
  color: var(--success);
  font-weight: 700;
  font-size: 1rem;
}

.pricing-card .btn {
  width: 100%;
  margin-top: 8px;
}

/* Testimonials */
.testimonials-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(380px, 1fr));
  gap: 32px;
}

.testimonial-card {
  background: white;
  padding: 40px;
  border-radius: var(--radius-xl);
  border: 1px solid var(--border);
  transition: var(--transition);
}

.testimonial-card:hover {
  box-shadow: var(--shadow-lg);
}

.testimonial-stars {
  color: #fbbf24;
  font-size: 1.25rem;
  margin-bottom: 20px;
}

.testimonial-card .quote {
  font-size: 1.1rem;
  color: var(--text);
  margin-bottom: 28px;
  line-height: 1.8;
  font-style: italic;
}

.testimonial-author {
  display: flex;
  align-items: center;
  gap: 16px;
}

.testimonial-author img {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid var(--bg-alt);
}

.testimonial-author-placeholder {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--primary), var(--accent));
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 700;
  font-size: 1.25rem;
}

.testimonial-author .name {
  font-weight: 700;
  font-size: 1rem;
}

.testimonial-author .role {
  font-size: 0.875rem;
  color: var(--text-light);
}

/* CTA Section */
.cta {
  padding: 120px 0;
  background: linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%);
  text-align: center;
  color: white;
  position: relative;
  overflow: hidden;
}

.cta::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
}

.cta-content {
  position: relative;
  z-index: 1;
}

.cta h2 {
  font-size: 3rem;
  font-weight: 800;
  margin-bottom: 20px;
}

.cta p {
  font-size: 1.25rem;
  opacity: 0.9;
  margin-bottom: 40px;
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
  padding: 80px 0 40px;
}

.footer-content {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr;
  gap: 64px;
  margin-bottom: 64px;
}

.footer-brand {
  max-width: 320px;
}

.footer-brand h3 {
  font-size: 1.5rem;
  font-weight: 800;
  margin-bottom: 16px;
}

.footer-brand p {
  color: var(--text-lighter);
  margin-bottom: 24px;
  line-height: 1.7;
}

.footer-social {
  display: flex;
  gap: 12px;
}

.footer-social a {
  width: 40px;
  height: 40px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: var(--radius);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  text-decoration: none;
  transition: var(--transition);
}

.footer-social a:hover {
  background: var(--primary);
  transform: translateY(-2px);
}

.footer-links h4 {
  font-size: 1rem;
  font-weight: 700;
  margin-bottom: 24px;
  color: white;
}

.footer-links ul {
  list-style: none;
}

.footer-links li {
  margin-bottom: 14px;
}

.footer-links a {
  color: var(--text-lighter);
  text-decoration: none;
  transition: var(--transition);
  font-size: 0.95rem;
}

.footer-links a:hover {
  color: white;
}

.footer-bottom {
  padding-top: 40px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: var(--text-lighter);
  font-size: 0.875rem;
}

.footer-legal {
  display: flex;
  gap: 24px;
}

.footer-legal a {
  color: var(--text-lighter);
  text-decoration: none;
  transition: var(--transition);
}

.footer-legal a:hover {
  color: white;
}

/* Responsive */
@media (max-width: 1024px) {
  .hero-content {
    grid-template-columns: 1fr;
    gap: 48px;
    text-align: center;
  }
  
  .hero-tagline {
    margin-left: auto;
    margin-right: auto;
  }
  
  .hero-buttons {
    justify-content: center;
  }
  
  .hero-stats {
    justify-content: center;
  }
  
  .hero-image {
    order: -1;
    max-width: 500px;
    margin: 0 auto;
  }
  
  .footer-content {
    grid-template-columns: 1fr 1fr;
  }
}

@media (max-width: 768px) {
  .nav-links {
    display: none;
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background: white;
    flex-direction: column;
    padding: 24px;
    gap: 16px;
    border-bottom: 1px solid var(--border);
    box-shadow: var(--shadow-lg);
  }
  
  .nav-links.active {
    display: flex;
  }
  
  .menu-toggle {
    display: flex;
  }
  
  .menu-toggle.active span:nth-child(1) {
    transform: rotate(45deg) translate(5px, 5px);
  }
  
  .menu-toggle.active span:nth-child(2) {
    opacity: 0;
  }
  
  .menu-toggle.active span:nth-child(3) {
    transform: rotate(-45deg) translate(5px, -5px);
  }
  
  .hero {
    padding: 120px 0 80px;
  }
  
  .hero h1 {
    font-size: 2.5rem;
  }
  
  .hero-stats {
    flex-direction: column;
    gap: 24px;
    align-items: center;
  }
  
  .section {
    padding: 64px 0;
  }
  
  .section-header h2 {
    font-size: 2rem;
  }
  
  .features-grid,
  .testimonials-grid {
    grid-template-columns: 1fr;
  }
  
  .pricing-card.highlighted {
    transform: none;
  }
  
  .cta h2 {
    font-size: 2rem;
  }
  
  .footer-content {
    grid-template-columns: 1fr;
    gap: 40px;
  }
  
  .footer-bottom {
    flex-direction: column;
    gap: 20px;
    text-align: center;
  }
}

${typeStyles}
`;
}

function getTypeSpecificStyles(type: WebsiteTemplateType): string {
  // Add type-specific CSS customizations
  switch (type) {
    case 'game':
      return `
        body { background: #0a0a0a; color: #fff; }
        .nav { background: rgba(10, 10, 10, 0.9); }
        .nav.scrolled { background: rgba(10, 10, 10, 0.98); }
        .hero { background: linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%); }
        .section-alt { background: #111; }
        .feature-card { background: #1a1a1a; border-color: #333; }
        .pricing-card { background: #1a1a1a; border-color: #333; }
        .testimonial-card { background: #1a1a1a; border-color: #333; }
      `;
    case 'restaurant':
      return `
        body { font-family: 'Playfair Display', Georgia, serif; }
        h1, h2, h3 { font-family: 'Playfair Display', Georgia, serif; }
      `;
    case 'portfolio':
      return `
        .hero { min-height: 100vh; display: flex; align-items: center; }
      `;
    default:
      return '';
  }
}

function generateHTML(type: WebsiteTemplateType, data: WebsiteData): string {
  const nav = generateNav(data);
  const hero = generateHero(type, data);
  const features = data.features && data.features.length > 0 ? generateFeatures(data) : '';
  const pricing = data.pricing && data.pricing.length > 0 ? generatePricing(data) : '';
  const testimonials = data.testimonials && data.testimonials.length > 0 ? generateTestimonials(data) : '';
  const cta = generateCTA(data);
  const footer = generateFooter(data);
  
  return nav + hero + features + pricing + testimonials + cta + footer;
}

function generateNav(data: WebsiteData): string {
  return `
  <nav class="nav">
    <div class="container nav-content">
      <a href="#" class="nav-logo">
        ${data.images?.logo ? `<img src="${escapeHtml(data.images.logo)}" alt="${escapeHtml(data.title)}">` : escapeHtml(data.title)}
      </a>
      <ul class="nav-links">
        <li><a href="#features">Features</a></li>
        ${data.pricing ? '<li><a href="#pricing">Pricing</a></li>' : ''}
        ${data.testimonials ? '<li><a href="#testimonials">Testimonials</a></li>' : ''}
        <li><a href="#contact">Contact</a></li>
        <li><a href="#" class="nav-cta">${data.cta?.text || 'Get Started'}</a></li>
      </ul>
      <div class="menu-toggle">
        <span></span>
        <span></span>
        <span></span>
      </div>
    </div>
  </nav>`;
}

function generateHero(type: WebsiteTemplateType, data: WebsiteData): string {
  const badge = getHeroBadge(type);
  
  return `
  <section class="hero">
    <div class="container hero-content">
      <div class="hero-text">
        <div class="hero-badge">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.456 1.405 1.02L10 15.591l4.069 2.485c.713.436 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.831-4.401z" clip-rule="evenodd" />
          </svg>
          ${badge}
        </div>
        <h1>${escapeHtml(data.title)}</h1>
        <p class="hero-tagline">${escapeHtml(data.tagline)}</p>
        <div class="hero-buttons">
          <a href="${data.cta?.url || '#'}" class="btn btn-primary btn-lg">${data.cta?.text || 'Get Started'} →</a>
          ${data.cta?.secondaryText ? `<a href="${data.cta.secondaryUrl || '#features'}" class="btn btn-secondary btn-lg">${data.cta.secondaryText}</a>` : '<a href="#features" class="btn btn-secondary btn-lg">Learn More</a>'}
        </div>
      </div>
      <div class="hero-image">
        ${data.images?.hero 
          ? `<img src="${escapeHtml(data.images.hero)}" alt="${escapeHtml(data.title)}">`
          : generatePlaceholderHero(type)}
        <div class="hero-image-decoration"></div>
      </div>
    </div>
  </section>`;
}

function generateFeatures(data: WebsiteData): string {
  return `
  <section class="section" id="features">
    <div class="container">
      <div class="section-header animate-on-scroll">
        <span class="section-badge">Features</span>
        <h2>Everything You Need</h2>
        <p class="section-subtitle">${escapeHtml(data.description)}</p>
      </div>
      <div class="features-grid">
        ${data.features!.map((feature, i) => `
          <div class="feature-card animate-on-scroll" style="animation-delay: ${i * 0.1}s">
            <div class="feature-icon">${feature.icon || getDefaultIcon(i)}</div>
            <h3>${escapeHtml(feature.title)}</h3>
            <p>${escapeHtml(feature.description)}</p>
          </div>
        `).join('')}
      </div>
    </div>
  </section>`;
}

function generatePricing(data: WebsiteData): string {
  return `
  <section class="section section-alt" id="pricing">
    <div class="container">
      <div class="section-header animate-on-scroll">
        <span class="section-badge">Pricing</span>
        <h2>Simple, Transparent Pricing</h2>
        <p class="section-subtitle">Choose the plan that's right for you. No hidden fees.</p>
      </div>
      <div class="pricing-grid">
        ${data.pricing!.map((plan, i) => `
          <div class="pricing-card ${plan.highlighted ? 'highlighted' : ''} animate-on-scroll" style="animation-delay: ${i * 0.1}s">
            <h3>${escapeHtml(plan.name)}</h3>
            <div class="price">${escapeHtml(plan.price)}<span>/${plan.period || 'month'}</span></div>
            <p class="price-description">Perfect for ${plan.highlighted ? 'growing teams' : 'getting started'}</p>
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
  </section>`;
}

function generateTestimonials(data: WebsiteData): string {
  return `
  <section class="section" id="testimonials">
    <div class="container">
      <div class="section-header animate-on-scroll">
        <span class="section-badge">Testimonials</span>
        <h2>Loved by Thousands</h2>
        <p class="section-subtitle">Don't just take our word for it. Here's what our customers say.</p>
      </div>
      <div class="testimonials-grid">
        ${data.testimonials!.map((t, i) => `
          <div class="testimonial-card animate-on-scroll" style="animation-delay: ${i * 0.1}s">
            <div class="testimonial-stars">★★★★★</div>
            <p class="quote">"${escapeHtml(t.quote)}"</p>
            <div class="testimonial-author">
              ${t.avatar 
                ? `<img src="${escapeHtml(t.avatar)}" alt="${escapeHtml(t.name)}">`
                : `<div class="testimonial-author-placeholder">${t.name.charAt(0)}</div>`}
              <div>
                <div class="name">${escapeHtml(t.name)}</div>
                <div class="role">${escapeHtml(t.role)}${t.company ? ` at ${escapeHtml(t.company)}` : ''}</div>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  </section>`;
}

function generateCTA(data: WebsiteData): string {
  return `
  <section class="cta">
    <div class="container cta-content">
      <h2>Ready to Get Started?</h2>
      <p>${escapeHtml(data.tagline)}</p>
      <a href="${data.cta?.url || '#'}" class="btn btn-primary btn-lg">${data.cta?.text || 'Start Free Trial'} →</a>
    </div>
  </section>`;
}

function generateFooter(data: WebsiteData): string {
  return `
  <footer class="footer" id="contact">
    <div class="container">
      <div class="footer-content">
        <div class="footer-brand">
          <h3>${escapeHtml(data.title)}</h3>
          <p>${escapeHtml(data.description)}</p>
          <div class="footer-social">
            ${data.socialLinks?.twitter ? `<a href="${escapeHtml(data.socialLinks.twitter)}" aria-label="Twitter">𝕏</a>` : '<a href="#" aria-label="Twitter">𝕏</a>'}
            ${data.socialLinks?.github ? `<a href="${escapeHtml(data.socialLinks.github)}" aria-label="GitHub">GH</a>` : ''}
            ${data.socialLinks?.linkedin ? `<a href="${escapeHtml(data.socialLinks.linkedin)}" aria-label="LinkedIn">in</a>` : '<a href="#" aria-label="LinkedIn">in</a>'}
          </div>
        </div>
        <div class="footer-links">
          <h4>Product</h4>
          <ul>
            <li><a href="#features">Features</a></li>
            ${data.pricing ? '<li><a href="#pricing">Pricing</a></li>' : ''}
            <li><a href="#">Documentation</a></li>
            <li><a href="#">API</a></li>
          </ul>
        </div>
        <div class="footer-links">
          <h4>Company</h4>
          <ul>
            <li><a href="#">About</a></li>
            <li><a href="#">Blog</a></li>
            <li><a href="#">Careers</a></li>
            <li><a href="#">Press</a></li>
          </ul>
        </div>
        <div class="footer-links">
          <h4>Support</h4>
          <ul>
            <li><a href="#">Help Center</a></li>
            <li><a href="#">Contact Us</a></li>
            <li><a href="#">Status</a></li>
            ${data.contact?.email ? `<li><a href="mailto:${escapeHtml(data.contact.email)}">${escapeHtml(data.contact.email)}</a></li>` : ''}
          </ul>
        </div>
      </div>
      <div class="footer-bottom">
        <p>© ${data.year} ${escapeHtml(data.title)}. All rights reserved.</p>
        <div class="footer-legal">
          <a href="#">Privacy Policy</a>
          <a href="#">Terms of Service</a>
          <a href="#">Cookie Policy</a>
        </div>
      </div>
    </div>
  </footer>`;
}

function getHeroBadge(type: WebsiteTemplateType): string {
  const badges: Record<WebsiteTemplateType, string> = {
    'saas': 'Trusted by 10,000+ teams',
    'mobile-app': 'Available on iOS & Android',
    'game': 'Play Now - Free to Start',
    'portfolio': 'Award-Winning Work',
    'ecommerce': 'Free Shipping Worldwide',
    'restaurant': 'Reserve Your Table',
    'agency': 'Award-Winning Agency',
    'blog': 'Fresh Content Daily',
    'event': 'Limited Seats Available',
    'startup': 'Now in Public Beta',
    'personal': 'Nice to Meet You',
    'product': 'Just Launched',
    'nonprofit': 'Making a Difference',
    'education': 'Start Learning Today',
    'healthcare': 'Your Health Matters',
    'realestate': 'Find Your Dream Home',
    'fitness': 'Transform Your Life',
    'entertainment': 'Endless Entertainment',
  };
  return badges[type] || 'Welcome';
}

function generatePlaceholderHero(type: WebsiteTemplateType): string {
  const icons: Record<WebsiteTemplateType, string> = {
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
    'nonprofit': '💚',
    'education': '📚',
    'healthcare': '🏥',
    'realestate': '🏠',
    'fitness': '💪',
    'entertainment': '🎬',
  };
  
  return `<div style="width:100%;aspect-ratio:16/10;background:linear-gradient(135deg,var(--primary),var(--accent));border-radius:var(--radius-xl);display:flex;align-items:center;justify-content:center;font-size:6rem;color:white;box-shadow:var(--shadow-xl);">
    ${icons[type] || '✨'}
  </div>`;
}

function getDefaultIcon(index: number): string {
  const icons = ['⚡', '🎯', '🔒', '📈', '🎨', '🔧', '💡', '🌟', '🚀', '💎'];
  return icons[index % icons.length];
}

// Color utility functions
function lightenColor(hex: string, percent: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.min(255, (num >> 16) + amt);
  const G = Math.min(255, ((num >> 8) & 0x00FF) + amt);
  const B = Math.min(255, (num & 0x0000FF) + amt);
  return `#${(0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1)}`;
}

function darkenColor(hex: string, percent: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.max(0, (num >> 16) - amt);
  const G = Math.max(0, ((num >> 8) & 0x00FF) - amt);
  const B = Math.max(0, (num & 0x0000FF) - amt);
  return `#${(0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1)}`;
}
