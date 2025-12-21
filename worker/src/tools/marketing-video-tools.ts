/**
 * Marketing Video Tools for Bill the Marketing Hog
 * 
 * Conversion-focused video generation tools for:
 * - Ad creatives (Facebook, Google, YouTube ads)
 * - Product demos
 * - Explainer videos
 * - Landing page hero videos
 */

export interface Tool {
  name: string;
  description: string;
  parameters: {
    type: string;
    properties: Record<string, any>;
    required: string[];
  };
  execute: (args: any, env: any) => Promise<string>;
}

/**
 * Generate Marketing Video
 * Bill's signature tool for conversion-focused video content
 */
export const generateMarketingVideoTool: Tool = {
  name: 'generate_marketing_video',
  description: `Bill the Marketing Hog generates conversion-focused marketing videos. Creates professional ad creatives, product demos, explainers, and landing page videos optimized for conversions.

Use this when users need:
- Facebook/Instagram/Google ad videos
- Product demonstration videos
- Explainer/how-it-works videos
- Landing page hero videos
- Sales funnel video content`,
  parameters: {
    type: 'object',
    properties: {
      product_or_service: {
        type: 'string',
        description: 'The product or service to create a video about'
      },
      video_type: {
        type: 'string',
        enum: ['ad-creative', 'product-demo', 'explainer', 'landing-page-hero', 'testimonial-style', 'before-after'],
        description: 'Type of marketing video to create'
      },
      target_platform: {
        type: 'string',
        enum: ['facebook-ads', 'instagram-ads', 'google-ads', 'youtube-ads', 'landing-page', 'email-campaign'],
        description: 'Where the video will be used'
      },
      duration: {
        type: 'number',
        enum: [6, 15, 30, 60],
        description: 'Video duration in seconds (6s for bumper ads, 15s for social, 30s standard, 60s for explainers)'
      },
      hook: {
        type: 'string',
        description: 'The attention-grabbing hook for the first 3 seconds'
      },
      unique_selling_point: {
        type: 'string',
        description: 'The main USP or value proposition to highlight'
      },
      call_to_action: {
        type: 'string',
        description: 'The CTA (e.g., "Shop Now", "Learn More", "Get Started")'
      },
      tone: {
        type: 'string',
        enum: ['professional', 'playful', 'urgent', 'luxurious', 'friendly', 'bold'],
        description: 'The tone/mood of the video'
      },
      target_audience: {
        type: 'string',
        description: 'Description of the target audience'
      }
    },
    required: ['product_or_service', 'video_type', 'target_platform']
  },
  execute: async (args: {
    product_or_service: string;
    video_type: string;
    target_platform: string;
    duration?: number;
    hook?: string;
    unique_selling_point?: string;
    call_to_action?: string;
    tone?: string;
    target_audience?: string;
  }, env: any) => {
    try {
      const duration = args.duration || 15;
      const tone = args.tone || 'professional';
      const cta = args.call_to_action || 'Learn More';
      
      // Determine aspect ratio based on platform
      const aspectRatios: Record<string, string> = {
        'facebook-ads': '1:1 or 4:5',
        'instagram-ads': '1:1 or 9:16',
        'google-ads': '16:9',
        'youtube-ads': '16:9',
        'landing-page': '16:9',
        'email-campaign': '16:9'
      };
      const aspectRatio = aspectRatios[args.target_platform] || '16:9';

      // Generate hook based on video type if not provided
      let hook = args.hook;
      if (!hook) {
        const hooks: Record<string, string> = {
          'ad-creative': `Stop scrolling! Here's why ${args.product_or_service} is a game-changer...`,
          'product-demo': `Watch ${args.product_or_service} in action...`,
          'explainer': `Ever wondered how ${args.product_or_service} works? Let me show you...`,
          'landing-page-hero': `Introducing ${args.product_or_service} - the solution you've been waiting for`,
          'testimonial-style': `"I can't believe the difference ${args.product_or_service} made..."`,
          'before-after': `Before ${args.product_or_service} vs After - the results speak for themselves`
        };
        hook = hooks[args.video_type] || hooks['ad-creative'];
      }

      // Video structure templates based on type
      const structures: Record<string, string> = {
        'ad-creative': `
**HOOK (0-3s):** Attention-grabbing statement or question
**PROBLEM (3-8s):** Identify the pain point
**SOLUTION (8-${duration - 5}s):** Show how ${args.product_or_service} solves it
**CTA (last 3s):** "${cta}" with urgency`,
        'product-demo': `
**INTRO (0-3s):** Product reveal with brand
**FEATURES (3-${duration - 10}s):** Showcase key features in action
**BENEFITS (${duration - 10}-${duration - 3}s):** Highlight main benefits
**CTA (last 3s):** "${cta}"`,
        'explainer': `
**HOOK (0-5s):** Problem statement
**EXPLANATION (5-${duration - 15}s):** Step-by-step how it works
**BENEFITS (${duration - 15}-${duration - 5}s):** Key advantages
**CTA (last 5s):** "${cta}" with next steps`,
        'landing-page-hero': `
**BRAND INTRO (0-3s):** Logo + tagline
**VALUE PROP (3-${duration - 8}s):** Main benefit visualization
**SOCIAL PROOF (${duration - 8}-${duration - 3}s):** Trust indicators
**CTA (last 3s):** "${cta}"`,
        'testimonial-style': `
**QUOTE HOOK (0-3s):** Powerful testimonial snippet
**STORY (3-${duration - 8}s):** Customer journey
**RESULTS (${duration - 8}-${duration - 3}s):** Transformation/outcomes
**CTA (last 3s):** "${cta}"`,
        'before-after': `
**BEFORE (0-${Math.floor(duration / 3)}s):** Show the problem state
**TRANSFORMATION (${Math.floor(duration / 3)}-${Math.floor(2 * duration / 3)}s):** The change process
**AFTER (${Math.floor(2 * duration / 3)}-${duration - 3}s):** Amazing results
**CTA (last 3s):** "${cta}"`
      };

      // Check if we have Replicate API key for actual video generation
      const replicateKey = env.REPLICATE_API_KEY;
      
      // Build the video prompt
      let videoPrompt = `Create a ${tone} ${args.video_type} marketing video for ${args.product_or_service}. `;
      videoPrompt += `Target platform: ${args.target_platform}. `;
      videoPrompt += `Start with: "${hook}". `;
      if (args.unique_selling_point) {
        videoPrompt += `Highlight USP: ${args.unique_selling_point}. `;
      }
      if (args.target_audience) {
        videoPrompt += `Target audience: ${args.target_audience}. `;
      }
      videoPrompt += `End with CTA: "${cta}". `;
      videoPrompt += `Tone: ${tone}, professional marketing quality.`;

      if (replicateKey) {
        // Actually generate the video using Replicate
        try {
          const createResponse = await fetch('https://api.replicate.com/v1/predictions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${replicateKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              version: 'minimax/video-01',
              input: {
                prompt: videoPrompt,
                prompt_optimizer: true,
              },
            }),
          });

          if (createResponse.ok) {
            const prediction = await createResponse.json();
            
            // Poll for completion
            let status = 'starting';
            let output = null;
            let attempts = 0;
            const maxAttempts = 120;

            while (status !== 'succeeded' && status !== 'failed' && attempts < maxAttempts) {
              await new Promise(resolve => setTimeout(resolve, 2000));

              const statusResponse = await fetch(
                `https://api.replicate.com/v1/predictions/${prediction.id}`,
                {
                  headers: {
                    'Authorization': `Bearer ${replicateKey}`,
                  },
                }
              );

              if (statusResponse.ok) {
                const statusData = await statusResponse.json();
                status = statusData.status;
                output = statusData.output;
              }
              attempts++;
            }

            if (status === 'succeeded' && output) {
              return `🐷📈 **Bill's Marketing Video is Ready!**

**Product/Service:** ${args.product_or_service}
**Video Type:** ${args.video_type}
**Platform:** ${args.target_platform}
**Duration:** ${duration}s
**Aspect Ratio:** ${aspectRatio}

🎬 **Download Your Video:**
${output}

---

**Bill's Marketing Tips:**
- A/B test this against 2-3 variations
- First 3 seconds are CRITICAL - test different hooks
- Add captions - 85% of social videos are watched muted
- Track CTR and conversion rate, not just views

Ready to create more variations? 🐷📈`;
            }
          }
        } catch (videoError) {
          console.error('Video generation error:', videoError);
        }
      }
      
      // Fallback: Return detailed video plan
      return `🐷📈 **Bill's Marketing Video Blueprint Ready!**

**Product/Service:** ${args.product_or_service}
**Video Type:** ${args.video_type}
**Platform:** ${args.target_platform}
**Duration:** ${duration} seconds
**Aspect Ratio:** ${aspectRatio}
**Tone:** ${tone}
${args.target_audience ? `**Target Audience:** ${args.target_audience}` : ''}
${args.unique_selling_point ? `**USP:** ${args.unique_selling_point}` : ''}

---

### 🎬 Video Structure:
${structures[args.video_type] || structures['ad-creative']}

---

### 🎣 Opening Hook:
> "${hook}"

### 📢 Call-to-Action:
> "${cta}"

---

### 🎨 Visual Recommendations:

**Color Palette:** Match your brand colors with high contrast for mobile
**Text Overlays:** Large, readable fonts (minimum 24pt for mobile)
**Pacing:** Quick cuts every 2-3 seconds to maintain attention
**Sound:** ${args.target_platform.includes('ads') ? 'Design for sound-off (captions essential)' : 'Upbeat background music + voiceover'}

---

### 📊 Platform-Specific Tips for ${args.target_platform}:
${args.target_platform === 'facebook-ads' ? `
- Square (1:1) or vertical (4:5) performs best
- Front-load your message - most drop off after 10s
- Include your logo in first 3 seconds
- Add captions (85% watch without sound)` : ''}
${args.target_platform === 'instagram-ads' ? `
- Vertical (9:16) for Stories/Reels, Square (1:1) for Feed
- Use native Instagram aesthetics
- Keep text minimal and impactful
- Leverage trending audio when possible` : ''}
${args.target_platform === 'google-ads' ? `
- 16:9 horizontal format required
- Include clear branding throughout
- Strong CTA in final frame
- Consider bumper (6s) versions for YouTube` : ''}
${args.target_platform === 'youtube-ads' ? `
- Hook viewers in first 5 seconds (before skip button)
- 16:9 format, HD quality minimum
- Include end screen with CTA
- Consider TrueView vs Bumper formats` : ''}
${args.target_platform === 'landing-page' ? `
- Autoplay muted with captions
- Loop seamlessly if under 30s
- Compress for fast loading (<5MB ideal)
- Include play button overlay for sound` : ''}
${args.target_platform === 'email-campaign' ? `
- Use GIF preview that links to full video
- Keep under 30 seconds
- Host on fast CDN
- Include thumbnail fallback for email clients` : ''}

---

**To generate the actual video, add REPLICATE_API_KEY to your Cloudflare Worker secrets.**

Want me to create the script, storyboard, or ad copy to go with this? 🐷📈`;
    } catch (error: any) {
      return `🐷 Bill encountered an error: ${error.message}`;
    }
  }
};

/**
 * Generate Ad Copy
 * Complementary tool for Bill to create ad copy that goes with videos
 */
export const generateAdCopyTool: Tool = {
  name: 'generate_ad_copy',
  description: 'Bill creates high-converting ad copy for Facebook, Google, Instagram ads. Includes headlines, primary text, and CTAs optimized for each platform.',
  parameters: {
    type: 'object',
    properties: {
      product_or_service: {
        type: 'string',
        description: 'The product or service to write ad copy for'
      },
      platform: {
        type: 'string',
        enum: ['facebook', 'instagram', 'google-search', 'google-display', 'linkedin', 'twitter'],
        description: 'Ad platform'
      },
      goal: {
        type: 'string',
        enum: ['awareness', 'consideration', 'conversion', 'lead-gen'],
        description: 'Campaign objective'
      },
      unique_selling_point: {
        type: 'string',
        description: 'Main USP or value proposition'
      },
      target_audience: {
        type: 'string',
        description: 'Who the ad is targeting'
      },
      tone: {
        type: 'string',
        enum: ['professional', 'casual', 'urgent', 'playful', 'luxurious'],
        description: 'Tone of the copy'
      }
    },
    required: ['product_or_service', 'platform', 'goal']
  },
  execute: async (args: {
    product_or_service: string;
    platform: string;
    goal: string;
    unique_selling_point?: string;
    target_audience?: string;
    tone?: string;
  }, env: any) => {
    const tone = args.tone || 'professional';
    const usp = args.unique_selling_point || `the best ${args.product_or_service} solution`;
    
    // Platform-specific copy templates
    const copyTemplates: Record<string, any> = {
      'facebook': {
        headlines: [
          `🚀 ${args.product_or_service} - ${usp}`,
          `Stop Scrolling! ${args.product_or_service} Changes Everything`,
          `Why Everyone's Talking About ${args.product_or_service}`
        ],
        primary_text: [
          `Tired of [pain point]? ${args.product_or_service} is here to help.\n\n✅ Benefit 1\n✅ Benefit 2\n✅ Benefit 3\n\nJoin thousands who've already made the switch. 👇`,
          `Here's the thing about ${args.product_or_service}...\n\nIt actually works. 🎯\n\n[Insert specific result or testimonial]\n\nReady to see for yourself?`
        ],
        ctas: ['Learn More', 'Shop Now', 'Get Started', 'Sign Up']
      },
      'instagram': {
        headlines: [
          `${args.product_or_service} ✨`,
          `This changes everything 👀`,
          `You need this 🙌`
        ],
        primary_text: [
          `POV: You just discovered ${args.product_or_service} 🤯\n\nThe game-changer you didn't know you needed.\n\nTap the link to learn more 👆`,
          `Not your average ${args.product_or_service}.\n\n💫 [Benefit 1]\n💫 [Benefit 2]\n💫 [Benefit 3]\n\nLink in bio ✨`
        ],
        ctas: ['Shop Now', 'Learn More', 'Swipe Up']
      },
      'google-search': {
        headlines: [
          `${args.product_or_service} - ${usp}`,
          `Best ${args.product_or_service} | Free Shipping`,
          `${args.product_or_service} Sale - Up to 50% Off`,
          `Try ${args.product_or_service} Today`
        ],
        descriptions: [
          `Discover why customers love ${args.product_or_service}. ${usp}. Shop now & get free shipping on orders over $50.`,
          `Looking for ${args.product_or_service}? We've got you covered. Premium quality, fast delivery. Order today!`
        ],
        ctas: ['Shop Now', 'Get Quote', 'Learn More', 'Buy Now']
      },
      'google-display': {
        headlines: [
          `${args.product_or_service}`,
          `${usp}`,
          `Limited Time Offer`
        ],
        descriptions: [
          `${args.product_or_service} - ${usp}. Click to learn more.`
        ],
        ctas: ['Learn More', 'Shop Now', 'Get Started']
      },
      'linkedin': {
        headlines: [
          `Transform Your Business with ${args.product_or_service}`,
          `${args.product_or_service}: The Professional's Choice`,
          `Why Industry Leaders Choose ${args.product_or_service}`
        ],
        primary_text: [
          `In today's competitive landscape, ${args.product_or_service} isn't just nice to have—it's essential.\n\nHere's what our clients are saying:\n\n"[Testimonial quote]"\n\nReady to elevate your business?`,
          `The data is clear: Companies using ${args.product_or_service} see [X%] improvement in [metric].\n\nDon't get left behind. Learn how ${args.product_or_service} can transform your operations.`
        ],
        ctas: ['Learn More', 'Request Demo', 'Download Guide', 'Contact Us']
      },
      'twitter': {
        headlines: [
          `${args.product_or_service} just dropped 🔥`,
          `This is why you need ${args.product_or_service} 👇`,
          `${args.product_or_service} thread 🧵`
        ],
        primary_text: [
          `${args.product_or_service} is changing the game.\n\nHere's why:\n\n→ [Benefit 1]\n→ [Benefit 2]\n→ [Benefit 3]\n\nLink below 👇`,
          `Hot take: ${args.product_or_service} is the best investment you'll make this year.\n\nDon't @ me. 😎`
        ],
        ctas: ['Check it out', 'Learn more', 'Shop now']
      }
    };

    const template = copyTemplates[args.platform] || copyTemplates['facebook'];

    return `🐷📝 **Bill's Ad Copy for ${args.platform.toUpperCase()}**

**Product/Service:** ${args.product_or_service}
**Campaign Goal:** ${args.goal}
**Tone:** ${tone}
${args.target_audience ? `**Target Audience:** ${args.target_audience}` : ''}
${args.unique_selling_point ? `**USP:** ${args.unique_selling_point}` : ''}

---

### 📰 Headlines (pick your favorite):
${template.headlines.map((h: string, i: number) => `${i + 1}. ${h}`).join('\n')}

---

### 📝 Primary Text Options:
${template.primary_text ? template.primary_text.map((t: string, i: number) => `**Option ${i + 1}:**\n${t}`).join('\n\n') : ''}
${template.descriptions ? template.descriptions.map((d: string, i: number) => `**Description ${i + 1}:**\n${d}`).join('\n\n') : ''}

---

### 🎯 Recommended CTAs:
${template.ctas.map((c: string) => `• ${c}`).join('\n')}

---

### 💡 Bill's Pro Tips for ${args.platform}:
${args.platform === 'facebook' ? `
- Test 3-5 headline variations
- Use emojis sparingly but strategically
- Include social proof when possible
- Keep primary text under 125 characters for mobile` : ''}
${args.platform === 'instagram' ? `
- Emojis are your friend here 🎉
- Keep it casual and authentic
- Use line breaks for readability
- Always include a clear CTA` : ''}
${args.platform === 'google-search' ? `
- Include keywords in headlines
- Use all available headline slots
- Add price/offer in descriptions
- Include location if relevant` : ''}
${args.platform === 'linkedin' ? `
- Professional tone is key
- Data and stats perform well
- Longer copy is acceptable here
- Focus on business outcomes` : ''}

Want me to create more variations or A/B test options? 🐷📈`;
  }
};

// Export all marketing video tools
export const marketingVideoTools = [
  generateMarketingVideoTool,
  generateAdCopyTool
];

/**
 * Register marketing video tools with the ToolRegistry
 */
export function registerMarketingVideoTools(registry: any) {
  marketingVideoTools.forEach(tool => {
    registry.tools.set(tool.name, tool);
  });
}
