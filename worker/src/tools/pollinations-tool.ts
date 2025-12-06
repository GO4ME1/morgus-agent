/**
 * Pollinations.ai Integration
 * 
 * FREE image generation - no API key required!
 */

export interface PollinationsToolSchema {
  name: string;
  description: string;
  parameters: {
    type: string;
    properties: Record<string, any>;
    required: string[];
  };
}

/**
 * Pollinations.ai - FREE Image Generation Tool
 */
export const generateImagePollinations: PollinationsToolSchema = {
  name: 'generate_image',
  description: `Generate AI images using Pollinations.ai (completely FREE, no API key needed).
  
  Use this tool when users ask to:
  - "create an image of..."
  - "generate a picture of..."
  - "make an illustration of..."
  - "design a graphic for..."
  - "draw me..."
  
  Perfect for:
  - Morgy character designs
  - UI mockups
  - Social media graphics
  - Thumbnails
  - Creative assets
  - Concept art`,
  parameters: {
    type: 'object',
    properties: {
      prompt: {
        type: 'string',
        description: 'Detailed description of the image to generate. Be specific about style, colors, composition, mood, lighting, and details.',
      },
      width: {
        type: 'number',
        enum: [512, 768, 1024],
        description: 'Width of the generated image in pixels. Default: 1024',
      },
      height: {
        type: 'number',
        enum: [512, 768, 1024],
        description: 'Height of the generated image in pixels. Default: 1024',
      },
      model: {
        type: 'string',
        enum: ['flux', 'flux-realism', 'flux-anime', 'flux-3d', 'turbo'],
        description: 'Model to use for generation. Default: flux',
      },
    },
    required: ['prompt'],
  },
};

/**
 * Generate image using Pollinations.ai (FREE) with enhanced quality
 * Uses higher resolution and enhanced parameters for better quality
 */
export async function executePollinationsGeneration(
  prompt: string,
  options?: {
    width?: number;
    height?: number;
    model?: string;
  }
): Promise<{ imageUrl: string; prompt: string }> {
  // Default to higher resolution for better quality (1536x1536 instead of 1024x1024)
  const width = options?.width || 1536;
  const height = options?.height || 1536;
  const model = options?.model || 'flux';

  try {
    // Pollinations.ai uses a simple URL-based API
    // The image is generated on-the-fly when you request the URL
    // Using higher resolution + enhance=true for better quality
    const encodedPrompt = encodeURIComponent(prompt);
    const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${width}&height=${height}&model=${model}&nologo=true&enhance=true&seed=-1`;

    // Verify the image is accessible
    const response = await fetch(imageUrl, { method: 'HEAD' });
    
    if (!response.ok) {
      throw new Error(`Failed to generate image: ${response.status}`);
    }

    console.log(`[IMAGE] Generated at ${width}x${height} with enhanced quality`);

    return {
      imageUrl,
      prompt,
    };
  } catch (error: any) {
    throw new Error(`Image generation failed: ${error.message}`);
  }
}

/**
 * Format Pollinations result for display in chat
 */
export function formatPollinationsResult(result: { imageUrl: string; prompt: string }): string {
  let markdown = `### 🎨 Generated Image (High Quality)\n\n`;
  markdown += `**Prompt:** ${result.prompt}\n\n`;
  markdown += `![Generated Image](${result.imageUrl})\n\n`;
  markdown += `*Generated at 1536x1536 with Pollinations.ai (100% FREE) ✨*\n`;

  return markdown;
}
