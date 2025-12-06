/**
 * Hugging Face Stable Diffusion Integration
 * 
 * FREE image generation using Hugging Face Inference API
 */

export interface HuggingFaceToolSchema {
  name: string;
  description: string;
  parameters: {
    type: string;
    properties: Record<string, any>;
    required: string[];
  };
}

/**
 * Hugging Face Stable Diffusion - FREE Image Generation Tool
 */
export const generateImageHuggingFace: HuggingFaceToolSchema = {
  name: 'generate_image',
  description: `Generate AI images using Stable Diffusion via Hugging Face (completely FREE).
  
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
        description: 'What to avoid in the image (e.g., "blurry, low quality, distorted, ugly, bad anatomy")',
      },
    },
    required: ['prompt'],
  },
};

/**
 * Generate image using Hugging Face Stable Diffusion (FREE)
 */
export async function executeHuggingFaceGeneration(
  prompt: string,
  apiKey: string,
  options?: {
    negativePrompt?: string;
  }
): Promise<{ imageUrl: string; prompt: string }> {
  try {
    // Use Stable Diffusion XL model (best quality on HF)
    const model = 'stabilityai/stable-diffusion-xl-base-1.0';
    
    const response = await fetch(
      `https://api-inference.huggingface.co/models/${model}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: prompt,
          parameters: {
            negative_prompt: options?.negativePrompt || 'blurry, low quality, distorted, ugly, bad anatomy',
            num_inference_steps: 30,
            guidance_scale: 7.5,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      
      // Check if model is loading
      if (response.status === 503) {
        throw new Error('Model is loading, please try again in a few seconds');
      }
      
      throw new Error(`Hugging Face API error: ${response.status} - ${errorText}`);
    }

    // Response is the image blob
    const imageBlob = await response.arrayBuffer();
    
    // Convert to base64
    const base64 = btoa(
      new Uint8Array(imageBlob).reduce(
        (data, byte) => data + String.fromCharCode(byte),
        ''
      )
    );
    
    const imageUrl = `data:image/png;base64,${base64}`;

    return {
      imageUrl,
      prompt,
    };
  } catch (error: any) {
    throw new Error(`Image generation failed: ${error.message}`);
  }
}

/**
 * Format Hugging Face result for display in chat
 */
export function formatHuggingFaceResult(result: { imageUrl: string; prompt: string }): string {
  let markdown = `### 🎨 Generated Image\n\n`;
  markdown += `**Prompt:** ${result.prompt}\n\n`;
  markdown += `![Generated Image](${result.imageUrl})\n\n`;
  markdown += `*Generated with Stable Diffusion XL (FREE via Hugging Face)*\n`;

  return markdown;
}
