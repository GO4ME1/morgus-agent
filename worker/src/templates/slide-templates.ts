/**
 * Brand-Aware Slide Template Library
 * 
 * Pre-built slide templates with brand-specific styling for common use cases.
 * Each template includes complete slide structure, content guidance, and styling.
 */

import { SlideContent, SlideStyle } from '../services/slide-generator';

export interface SlideTemplate {
  id: string;
  name: string;
  description: string;
  category: 'business' | 'technical' | 'creative' | 'educational';
  slides: SlideContent[];
  style: SlideStyle;
  tags: string[];
}

/**
 * Morgus Brand Templates
 */
export const morgusTemplates: SlideTemplate[] = [
  {
    id: 'morgus-product-launch',
    name: 'Morgus Product Launch',
    description: 'Launch a new product or feature with Morgus neon branding',
    category: 'business',
    slides: [
      {
        id: 'title',
        title: 'Product Launch',
        subtitle: 'Introducing the Future',
        content: 'Your product name here',
        layout: 'title',
      },
      {
        id: 'problem',
        title: 'The Challenge',
        content: '- Current pain point 1\n- Current pain point 2\n- Current pain point 3',
        layout: 'content',
      },
      {
        id: 'solution',
        title: 'Our Solution',
        subtitle: 'Powered by AI',
        content: 'Describe your solution here',
        layout: 'split',
      },
      {
        id: 'features',
        title: 'Key Features',
        content: '- Feature 1: Description\n- Feature 2: Description\n- Feature 3: Description',
        layout: 'content',
      },
      {
        id: 'cta',
        title: 'Get Started Today',
        content: 'Visit our website or contact us for a demo',
        layout: 'title',
      },
    ],
    style: {
      aestheticDirection: 'Dark glassmorphism with vibrant neon gradients in cyan and magenta',
      colorPalette: ['#121212', '#FFFFFF', '#FF00FF', '#00FFFF', '#FF8800'],
      typography: {
        fontFamily: 'Inter',
        headingSize: '48px',
        bodySize: '20px',
        smallSize: '16px',
      },
      effects: {
        glassmorphism: true,
        neonGlow: true,
        gradients: true,
        animations: false,
      },
    },
    tags: ['product', 'launch', 'business', 'neon'],
  },
  
  {
    id: 'morgus-technical-deep-dive',
    name: 'Technical Deep Dive',
    description: 'Present technical architecture with Morgus styling',
    category: 'technical',
    slides: [
      {
        id: 'title',
        title: 'Technical Architecture',
        subtitle: 'Deep Dive',
        content: 'System overview and design',
        layout: 'title',
      },
      {
        id: 'overview',
        title: 'System Overview',
        content: 'High-level architecture description|||Component breakdown',
        layout: 'two-column',
      },
      {
        id: 'tech-stack',
        title: 'Technology Stack',
        content: '- Frontend: React + TypeScript\n- Backend: Node.js + PostgreSQL\n- Infrastructure: Cloudflare + Fly.io\n- AI: OpenAI + Custom Models',
        layout: 'content',
      },
      {
        id: 'performance',
        title: 'Performance Metrics',
        content: 'Key performance indicators and benchmarks',
        layout: 'content',
      },
      {
        id: 'roadmap',
        title: 'Technical Roadmap',
        content: 'Q1: Feature A\nQ2: Feature B\nQ3: Feature C',
        layout: 'content',
      },
    ],
    style: {
      aestheticDirection: 'Dark theme with cyan accents and technical precision',
      colorPalette: ['#1a1a1a', '#FFFFFF', '#00D9FF', '#00FF88', '#FFAA00'],
      typography: {
        fontFamily: 'Roboto Mono',
        headingSize: '44px',
        bodySize: '18px',
        smallSize: '14px',
      },
      effects: {
        glassmorphism: true,
        neonGlow: true,
        gradients: false,
        animations: false,
      },
    },
    tags: ['technical', 'architecture', 'development'],
  },
  
  {
    id: 'morgus-brand-identity',
    name: 'Brand Identity Showcase',
    description: 'Present brand identity with full Morgus aesthetic',
    category: 'creative',
    slides: [
      {
        id: 'title',
        title: 'Brand Identity',
        subtitle: 'Neon Cyberpunk Meets Autonomous AI',
        content: 'Visual identity and design system',
        layout: 'title',
      },
      {
        id: 'colors',
        title: 'Color Palette',
        subtitle: 'Vibrant Neon Gradients',
        content: 'Primary: Pink → Orange → Yellow\nAccents: Green, Cyan, Magenta',
        layout: 'content',
      },
      {
        id: 'visual-elements',
        title: 'Visual Elements',
        content: '- Glassmorphism (frosted glass)\n- Neon glowing borders\n- Animated gradient shifts\n- Pulsing status indicators',
        layout: 'content',
      },
      {
        id: 'applications',
        title: 'Brand Applications',
        content: 'How the brand identity applies across touchpoints',
        layout: 'split',
      },
      {
        id: 'impact',
        title: 'Strategic Impact',
        content: '3-5x brand recall|||Premium positioning|||High engagement',
        layout: 'two-column',
      },
    ],
    style: {
      aestheticDirection: 'Full neon cyberpunk with maximum visual impact',
      colorPalette: ['#121212', '#FFFFFF', '#FF00FF', '#00FFFF', '#FF8800'],
      typography: {
        fontFamily: 'Inter',
        headingSize: '52px',
        bodySize: '20px',
        smallSize: '16px',
      },
      effects: {
        glassmorphism: true,
        neonGlow: true,
        gradients: true,
        animations: false,
      },
    },
    tags: ['brand', 'identity', 'design', 'creative'],
  },
  
  {
    id: 'morgus-investor-pitch',
    name: 'Investor Pitch',
    description: 'Professional investor pitch with Morgus branding',
    category: 'business',
    slides: [
      {
        id: 'title',
        title: 'Company Name',
        subtitle: 'Investor Pitch',
        content: 'Series A Fundraising',
        layout: 'title',
      },
      {
        id: 'problem',
        title: 'The Problem',
        content: 'Market pain point and opportunity size',
        layout: 'content',
      },
      {
        id: 'solution',
        title: 'Our Solution',
        content: 'Unique value proposition and competitive advantage',
        layout: 'split',
      },
      {
        id: 'traction',
        title: 'Traction',
        content: 'Revenue: $X MRR|||Users: X,XXX active|||Growth: XX% MoM',
        layout: 'two-column',
      },
      {
        id: 'market',
        title: 'Market Opportunity',
        content: '- TAM: $X billion\n- SAM: $X billion\n- SOM: $X million',
        layout: 'content',
      },
      {
        id: 'business-model',
        title: 'Business Model',
        content: 'Revenue streams and unit economics',
        layout: 'content',
      },
      {
        id: 'team',
        title: 'Team',
        content: 'Founding team and key hires',
        layout: 'content',
      },
      {
        id: 'ask',
        title: 'The Ask',
        subtitle: 'Join Us on This Journey',
        content: 'Raising $X million for Y purpose',
        layout: 'title',
      },
    ],
    style: {
      aestheticDirection: 'Professional with subtle neon accents for credibility and innovation',
      colorPalette: ['#1a1a1a', '#FFFFFF', '#00D9FF', '#FF00D9', '#00FF88'],
      typography: {
        fontFamily: 'Inter',
        headingSize: '46px',
        bodySize: '19px',
        smallSize: '15px',
      },
      effects: {
        glassmorphism: true,
        neonGlow: false,
        gradients: true,
        animations: false,
      },
    },
    tags: ['business', 'investor', 'pitch', 'fundraising'],
  },
  
  {
    id: 'morgus-tutorial',
    name: 'Tutorial / How-To',
    description: 'Educational tutorial with clear step-by-step guidance',
    category: 'educational',
    slides: [
      {
        id: 'title',
        title: 'Tutorial Title',
        subtitle: 'Learn in 5 Easy Steps',
        content: 'Master this skill today',
        layout: 'title',
      },
      {
        id: 'overview',
        title: 'What You\'ll Learn',
        content: '- Skill 1\n- Skill 2\n- Skill 3\n- Skill 4',
        layout: 'content',
      },
      {
        id: 'step1',
        title: 'Step 1: Getting Started',
        content: 'Detailed instructions for step 1',
        layout: 'split',
      },
      {
        id: 'step2',
        title: 'Step 2: Core Concepts',
        content: 'Key concepts to understand|||Practical examples',
        layout: 'two-column',
      },
      {
        id: 'step3',
        title: 'Step 3: Advanced Techniques',
        content: 'Advanced tips and tricks',
        layout: 'content',
      },
      {
        id: 'conclusion',
        title: 'You\'re Ready!',
        subtitle: 'Start Building Today',
        content: 'Resources and next steps',
        layout: 'title',
      },
    ],
    style: {
      aestheticDirection: 'Clean and educational with neon highlights for key points',
      colorPalette: ['#FFFFFF', '#1a1a1a', '#00D9FF', '#00FF88', '#FFAA00'],
      typography: {
        fontFamily: 'Inter',
        headingSize: '44px',
        bodySize: '19px',
        smallSize: '15px',
      },
      effects: {
        glassmorphism: false,
        neonGlow: false,
        gradients: true,
        animations: false,
      },
    },
    tags: ['tutorial', 'education', 'how-to', 'learning'],
  },
];

/**
 * Get template by ID
 */
export function getTemplate(id: string): SlideTemplate | undefined {
  return morgusTemplates.find(t => t.id === id);
}

/**
 * Get templates by category
 */
export function getTemplatesByCategory(category: string): SlideTemplate[] {
  return morgusTemplates.filter(t => t.category === category);
}

/**
 * Get templates by tag
 */
export function getTemplatesByTag(tag: string): SlideTemplate[] {
  return morgusTemplates.filter(t => t.tags.includes(tag));
}

/**
 * Search templates
 */
export function searchTemplates(query: string): SlideTemplate[] {
  const lowerQuery = query.toLowerCase();
  return morgusTemplates.filter(t => 
    t.name.toLowerCase().includes(lowerQuery) ||
    t.description.toLowerCase().includes(lowerQuery) ||
    t.tags.some(tag => tag.includes(lowerQuery))
  );
}
