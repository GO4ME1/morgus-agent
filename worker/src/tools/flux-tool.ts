/**
 * Replicate Flux Integration
 * 
 * Uses Replicate API to generate images via Flux Schnell (fast & cheap)
 */

export interface FluxToolSchema {
  name: string;
  description: string;
  parameters: {
    type: string;
    properties: Record<string, any>;
    required: string[];
  };
}

/**
 * Replicate Flux - Image Generation Tool
 */
export const generateImageFlux: FluxToolSchema = {
  name: 'generate_image',
  description: `Generate AI images using Flux Schnell (fast, high-quality image generation).
  
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
      aspect_ratio: {
        type: 'string',
        enum: ['1:1', '16:9', '9:16', '4:3', '3:4', '3:2', '2:3'],
        description: 'Aspect ratio of the generated image. Default: 1:1',
      },
    },
    required: ['prompt'],
  },
};

/**
 * Generate image using Replicate Flux Schnell
 */
export async function executeFluxGeneration(
  prompt: string,
  replicateApiKey: string,
  options?: {
    aspectRatio?: string;
  }
): Promise<{ imageUrl: string; prompt: string }> {
  const aspectRatio = options?.aspectRatio || '1:1';

  try {
    // Call Replicate API to start prediction
    const response = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${replicateApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        version: 'black-forest-labs/flux-schnell',
        input: {
          prompt: prompt,
          aspect_ratio: aspectRatio,
          num_outputs: 1,
          output_format: 'png',
          output_quality: 90,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Replicate API error: ${response.status} - ${errorText}`);
    }

    const prediction = await response.json();

    // Poll for completion (Replicate is async)
    let result = prediction;
    let attempts = 0;
    const maxAttempts = 30; // 30 seconds max

    while (result.status !== 'succeeded' && result.status !== 'failed' && attempts < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait 1 second

      const pollResponse = await fetch(
        `https://api.replicate.com/v1/predictions/${result.id}`,
        {
          headers: {
            'Authorization': `Bearer ${replicateApiKey}`,
          },
        }
      );

      result = await pollResponse.json();
      attempts++;
    }

    if (result.status === 'failed') {
      throw new Error(`Image generation failed: ${result.error}`);
    }

    if (result.status !== 'succeeded') {
      throw new Error('Image generation timed out');
    }

    // Extract image URL
    const imageUrl = result.output && result.output[0] ? result.output[0] : null;

    if (!imageUrl) {
      throw new Error('No image URL in response');
    }

    return {
      imageUrl,
      prompt,
    };
  } catch (error: any) {
    throw new Error(`Image generation failed: ${error.message}`);
  }
}

/**
 * Format Flux result for display in chat
 */
export function formatFluxResult(result: { imageUrl: string; prompt: string }): string {
  let markdown = `### 🎨 Generated Image\n\n`;
  markdown += `**Prompt:** ${result.prompt}\n\n`;
  markdown += `![Generated Image](${result.imageUrl})\n\n`;

  return markdown;
}
