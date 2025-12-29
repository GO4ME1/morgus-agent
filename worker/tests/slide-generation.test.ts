/**
 * Advanced Slide Generation Tests
 * 
 * Test suite for Manus-level slide generation capabilities
 */

import { SlideGenerator, PresentationConfig, SlideStyle } from '../src/services/slide-generator';
import { createSlidesAdvancedTool } from '../src/tools/slides-tools-v2';
import { useSlideTemplateTool, listSlideTemplatesTool } from '../src/tools/slide-template-tool';
import { getTemplate, morgusTemplates } from '../src/templates/slide-templates';

describe('Slide Generation System', () => {
  describe('SlideGenerator', () => {
    test('should generate presentation with custom style', () => {
      const style: SlideStyle = {
        aestheticDirection: 'Test aesthetic',
        colorPalette: ['#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF'],
        typography: {
          fontFamily: 'Arial',
          headingSize: '48px',
          bodySize: '20px',
          smallSize: '16px',
        },
        effects: {
          glassmorphism: true,
          neonGlow: false,
          gradients: true,
          animations: false,
        },
      };
      
      const config: PresentationConfig = {
        title: 'Test Presentation',
        slides: [
          {
            id: 'slide1',
            title: 'Test Slide',
            content: 'Test content',
            layout: 'title',
          },
        ],
        style,
      };
      
      const result = SlideGenerator.generatePresentation(config);
      
      expect(result.size).toBe(1);
      expect(result.has('slide1.html')).toBe(true);
      
      const html = result.get('slide1.html')!;
      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('Test Slide');
      expect(html).toContain('Arial');
      expect(html).toContain('#000000');
    });
    
    test('should generate all layout types', () => {
      const style = SlideGenerator.getStylePreset('modern');
      const layouts = ['title', 'content', 'two-column', 'image', 'split', 'full-image', 'quote'];
      
      layouts.forEach(layout => {
        const config: PresentationConfig = {
          title: 'Test',
          slides: [{
            id: `slide_${layout}`,
            title: `Test ${layout}`,
            content: 'Test content|||Second column',
            layout: layout as any,
            image: '/test/image.png',
          }],
          style,
        };
        
        const result = SlideGenerator.generatePresentation(config);
        expect(result.size).toBe(1);
        
        const html = result.get(`slide_${layout}.html`)!;
        expect(html).toContain(`Test ${layout}`);
      });
    });
    
    test('should apply glassmorphism effects', () => {
      const style = SlideGenerator.getStylePreset('morgus-neon');
      const config: PresentationConfig = {
        title: 'Test',
        slides: [{
          id: 'test',
          title: 'Test',
          content: 'Test',
          layout: 'content',
        }],
        style,
      };
      
      const result = SlideGenerator.generatePresentation(config);
      const html = result.get('test.html')!;
      
      expect(html).toContain('backdrop-filter: blur');
      expect(html).toContain('glass-card');
    });
    
    test('should apply neon glow effects', () => {
      const style = SlideGenerator.getStylePreset('morgus-neon');
      const config: PresentationConfig = {
        title: 'Test',
        slides: [{
          id: 'test',
          title: 'Test',
          content: 'Test',
          layout: 'title',
        }],
        style,
      };
      
      const result = SlideGenerator.generatePresentation(config);
      const html = result.get('test.html')!;
      
      expect(html).toContain('glow-text');
      expect(html).toContain('text-shadow');
    });
    
    test('should apply gradient effects', () => {
      const style = SlideGenerator.getStylePreset('morgus-neon');
      const config: PresentationConfig = {
        title: 'Test',
        slides: [{
          id: 'test',
          title: 'Test',
          content: 'Test',
          layout: 'title',
        }],
        style,
      };
      
      const result = SlideGenerator.generatePresentation(config);
      const html = result.get('test.html')!;
      
      expect(html).toContain('gradient-text');
      expect(html).toContain('linear-gradient');
    });
    
    test('should format markdown-style content', () => {
      const style = SlideGenerator.getStylePreset('modern');
      const config: PresentationConfig = {
        title: 'Test',
        slides: [{
          id: 'test',
          title: 'Test',
          content: '- Item 1\n- Item 2\n# Heading\nParagraph',
          layout: 'content',
        }],
        style,
      };
      
      const result = SlideGenerator.generatePresentation(config);
      const html = result.get('test.html')!;
      
      expect(html).toContain('<ul');
      expect(html).toContain('<li');
      expect(html).toContain('Item 1');
      expect(html).toContain('<h3');
      expect(html).toContain('Heading');
      expect(html).toContain('<p');
      expect(html).toContain('Paragraph');
    });
  });
  
  describe('Style Presets', () => {
    test('should have all required presets', () => {
      const presets = ['morgus-neon', 'modern', 'minimal', 'corporate', 'creative', 'dark'];
      
      presets.forEach(preset => {
        const style = SlideGenerator.getStylePreset(preset);
        
        expect(style.aestheticDirection).toBeTruthy();
        expect(style.colorPalette).toHaveLength(5);
        expect(style.typography.fontFamily).toBeTruthy();
        expect(style.typography.headingSize).toBeTruthy();
        expect(style.typography.bodySize).toBeTruthy();
        expect(style.typography.smallSize).toBeTruthy();
        expect(style.effects).toBeDefined();
      });
    });
    
    test('morgus-neon preset should have correct colors', () => {
      const style = SlideGenerator.getStylePreset('morgus-neon');
      
      expect(style.colorPalette[0]).toBe('#121212'); // Dark background
      expect(style.colorPalette[1]).toBe('#FFFFFF'); // White text
      expect(style.colorPalette[2]).toBe('#FF00FF'); // Magenta
      expect(style.colorPalette[3]).toBe('#00FFFF'); // Cyan
      expect(style.colorPalette[4]).toBe('#FF8800'); // Orange
    });
  });
  
  describe('Slide Templates', () => {
    test('should have all required templates', () => {
      expect(morgusTemplates.length).toBeGreaterThanOrEqual(5);
      
      const requiredIds = [
        'morgus-product-launch',
        'morgus-technical-deep-dive',
        'morgus-brand-identity',
        'morgus-investor-pitch',
        'morgus-tutorial',
      ];
      
      requiredIds.forEach(id => {
        const template = getTemplate(id);
        expect(template).toBeDefined();
        expect(template!.name).toBeTruthy();
        expect(template!.description).toBeTruthy();
        expect(template!.slides.length).toBeGreaterThan(0);
        expect(template!.style).toBeDefined();
      });
    });
    
    test('templates should have valid structure', () => {
      morgusTemplates.forEach(template => {
        expect(template.id).toBeTruthy();
        expect(template.name).toBeTruthy();
        expect(template.description).toBeTruthy();
        expect(['business', 'technical', 'creative', 'educational']).toContain(template.category);
        expect(template.slides.length).toBeGreaterThan(0);
        expect(template.style.colorPalette).toHaveLength(5);
        expect(template.tags.length).toBeGreaterThan(0);
        
        template.slides.forEach(slide => {
          expect(slide.id).toBeTruthy();
          expect(slide.title).toBeTruthy();
          expect(slide.content).toBeTruthy();
          expect(['title', 'content', 'two-column', 'image', 'split', 'full-image', 'quote']).toContain(slide.layout);
        });
      });
    });
  });
  
  describe('Tools', () => {
    test('create_slides_advanced tool should work', async () => {
      const args = {
        title: 'Test Presentation',
        slides: [
          {
            id: 'test',
            title: 'Test Slide',
            content: 'Test content',
            layout: 'title',
          },
        ],
        stylePreset: 'morgus-neon',
      };
      
      const result = await createSlidesAdvancedTool.execute(args, {}, 'test-user');
      
      expect(result).toContain('✅');
      expect(result).toContain('Test Presentation');
      expect(result).toContain('morgus-neon');
      expect(result).toContain('pres_');
    });
    
    test('use_slide_template tool should work', async () => {
      const args = {
        templateId: 'morgus-product-launch',
        customizations: {
          title: 'My Product',
          author: 'Test Author',
        },
      };
      
      const result = await useSlideTemplateTool.execute(args, {}, 'test-user');
      
      expect(result).toContain('✅');
      expect(result).toContain('My Product');
      expect(result).toContain('Test Author');
      expect(result).toContain('morgus-product-launch');
    });
    
    test('list_slide_templates tool should work', async () => {
      const result = await listSlideTemplatesTool.execute({}, {}, 'test-user');
      
      expect(result).toContain('Available Slide Templates');
      expect(result).toContain('morgus-product-launch');
      expect(result).toContain('morgus-technical-deep-dive');
      expect(result).toContain('use_slide_template');
    });
    
    test('list_slide_templates should filter by category', async () => {
      const result = await listSlideTemplatesTool.execute(
        { category: 'business' },
        {},
        'test-user'
      );
      
      expect(result).toContain('morgus-product-launch');
      expect(result).toContain('morgus-investor-pitch');
    });
  });
});

// Run tests
console.log('Running Advanced Slide Generation Tests...\n');

let passed = 0;
let failed = 0;

const tests = [
  { name: 'Generate presentation with custom style', fn: () => {
    const style = SlideGenerator.getStylePreset('morgus-neon');
    const config: PresentationConfig = {
      title: 'Test',
      slides: [{ id: 'test', title: 'Test', content: 'Test', layout: 'title' }],
      style,
    };
    const result = SlideGenerator.generatePresentation(config);
    return result.size === 1 && result.has('test.html');
  }},
  { name: 'All style presets exist', fn: () => {
    const presets = ['morgus-neon', 'modern', 'minimal', 'corporate', 'creative', 'dark'];
    return presets.every(p => SlideGenerator.getStylePreset(p).colorPalette.length === 5);
  }},
  { name: 'All templates exist', fn: () => {
    return morgusTemplates.length >= 5 && getTemplate('morgus-product-launch') !== undefined;
  }},
  { name: 'Glassmorphism effects applied', fn: () => {
    const style = SlideGenerator.getStylePreset('morgus-neon');
    const config: PresentationConfig = {
      title: 'Test',
      slides: [{ id: 'test', title: 'Test', content: 'Test', layout: 'content' }],
      style,
    };
    const result = SlideGenerator.generatePresentation(config);
    const html = result.get('test.html')!;
    return html.includes('backdrop-filter') && html.includes('blur');
  }},
  { name: 'Gradient effects applied', fn: () => {
    const style = SlideGenerator.getStylePreset('morgus-neon');
    const config: PresentationConfig = {
      title: 'Test',
      slides: [{ id: 'test', title: 'Test', content: 'Test', layout: 'title' }],
      style,
    };
    const result = SlideGenerator.generatePresentation(config);
    const html = result.get('test.html')!;
    return html.includes('linear-gradient');
  }},
  { name: 'Markdown formatting works', fn: () => {
    const style = SlideGenerator.getStylePreset('modern');
    const config: PresentationConfig = {
      title: 'Test',
      slides: [{ id: 'test', title: 'Test', content: '- Item 1\n- Item 2', layout: 'content' }],
      style,
    };
    const result = SlideGenerator.generatePresentation(config);
    const html = result.get('test.html')!;
    return html.includes('<ul') && html.includes('<li') && html.includes('Item 1');
  }},
];

tests.forEach(test => {
  try {
    const result = test.fn();
    if (result) {
      console.log(`✅ ${test.name}`);
      passed++;
    } else {
      console.log(`❌ ${test.name}: Test returned false`);
      failed++;
    }
  } catch (error) {
    console.log(`❌ ${test.name}: ${error}`);
    failed++;
  }
});

console.log(`\n📊 Results: ${passed} passed, ${failed} failed (${tests.length} total)`);
console.log(failed === 0 ? '✅ All tests passed!' : '❌ Some tests failed');
