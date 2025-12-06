/**
 * Google Imagen Integration
 * 
 * Uses Gemini API to generate images via Imagen
 */

export interface ImagenToolSchema {
  name: string;
  description: string;
  parameters: {
    type: string;
    properties: Record<string, any>;
    required: string[];
  };
}

/**
 * Google Imagen - Image Generation Tool
 */
export const generateImageImagen: ImagenToolSchema = {
  name: 'generate_image',
  description: `Generate AI images using Google Imagen (via Gemini API).
  
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
      negative_prompt: {
        type: 'string',
        description: 'What to avoid in the image (e.g., "blurry, low quality, distorted")',
      },
      aspect_ratio: {
        type: 'string',
        enum: ['1:1', '16:9', '9:16', '4:3', '3:4'],
        description: 'Aspect ratio of the generated image. Default: 1:1',
      },
      number_of_images: {
        type: 'number',
        enum: [1, 2, 3, 4],
        description: 'Number of images to generate (1-4). Default: 1',
      },
    },
    required: ['prompt'],
  },
};

/**
 * Generate image using Google Imagen via Gemini API
 */
export async function executeImagenGeneration(
  prompt: string,
  geminiApiKey: string,
  options?: {
    negativePrompt?: string;
    aspectRatio?: string;
    numberOfImages?: number;
  }
): Promise<{ images: string[]; prompt: string }> {
  const numberOfImages = options?.numberOfImages || 1;
  const aspectRatio = options?.aspectRatio || '1:1';

  // Build the full prompt with aspect ratio guidance
  let fullPrompt = prompt;
  if (aspectRatio === '16:9') {
    fullPrompt += ' (wide landscape format)';
  } else if (aspectRatio === '9:16') {
    fullPrompt += ' (tall portrait format)';
  } else if (aspectRatio === '4:3') {
    fullPrompt += ' (landscape format)';
  } else if (aspectRatio === '3:4') {
    fullPrompt += ' (portrait format)';
  }

  if (options?.negativePrompt) {
    fullPrompt += `. Avoid: ${options.negativePrompt}`;
  }

  try {
    // Call Google Imagen API via Gemini
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-001:predict?key=${geminiApiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          instances: [
            {
              prompt: fullPrompt,
            },
          ],
          parameters: {
            sampleCount: numberOfImages,
            aspectRatio: aspectRatio,
            safetySetting: 'block_some',
            personGeneration: 'allow_adult',
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Imagen API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();

    // Extract image URLs from response
    const images: string[] = [];
    if (data.predictions && Array.isArray(data.predictions)) {
      for (const prediction of data.predictions) {
        if (prediction.bytesBase64Encoded) {
          // Convert base64 to data URL
          images.push(`data:image/png;base64,${prediction.bytesBase64Encoded}`);
        } else if (prediction.imageUrl) {
          images.push(prediction.imageUrl);
        }
      }
    }

    if (images.length === 0) {
      throw new Error('No images generated');
    }

    return {
      images,
      prompt: fullPrompt,
    };
  } catch (error: any) {
    throw new Error(`Image generation failed: ${error.message}`);
  }
}

/**
 * Format Imagen result for display in chat
 */
export function formatImagenResult(result: { images: string[]; prompt: string }): string {
  let markdown = `### 🎨 Generated Images\n\n`;
  markdown += `**Prompt:** ${result.prompt}\n\n`;

  for (let i = 0; i < result.images.length; i++) {
    markdown += `![Generated Image ${i + 1}](${result.images[i]})\n\n`;
  }

  return markdown;
}
