/**
 * Replicate TRELLIS 3D Model Generation
 * 
 * Generates 3D models from images using TRELLIS on Replicate
 */

export interface TrellisToolSchema {
  name: string;
  description: string;
  parameters: {
    type: string;
    properties: Record<string, any>;
    required: string[];
  };
}

/**
 * TRELLIS - 3D Model Generation Tool
 */
export const generate3DModelTrellis: TrellisToolSchema = {
  name: 'generate_3d_model',
  description: `Generate 3D models from images using Replicate TRELLIS.
  
  Use this tool when users ask to:
  - "create a 3D model of..."
  - "generate a 3D asset from..."
  - "make a 3D version of..."
  - "convert this to 3D..."
  
  Perfect for:
  - Game assets
  - Product visualization
  - Character models
  - Props and objects
  - Concept prototypes`,
  parameters: {
    type: 'object',
    properties: {
      image_url: {
        type: 'string',
        description: 'URL of the input image to convert to 3D. Must be a publicly accessible image URL.',
      },
      generate_model: {
        type: 'boolean',
        description: 'Generate 3D model file (GLB format). Default: true',
      },
      texture_size: {
        type: 'number',
        enum: [512, 1024, 2048],
        description: 'Texture resolution for the 3D model. Higher = better quality but slower. Default: 1024',
      },
      mesh_simplify: {
        type: 'number',
        description: 'Mesh simplification factor (0.9-0.98). Higher = simpler mesh. Default: 0.95',
      },
    },
    required: ['image_url'],
  },
};

/**
 * Generate 3D model using Replicate TRELLIS
 */
export async function executeTrellis3DGeneration(
  imageUrl: string,
  replicateApiKey: string,
  options?: {
    generateModel?: boolean;
    textureSize?: number;
    meshSimplify?: number;
  }
): Promise<{ model_url: string; preview_url?: string }> {
  const generateModel = options?.generateModel !== false;
  const textureSize = options?.textureSize || 1024;
  const meshSimplify = options?.meshSimplify || 0.95;

  try {
    // Step 1: Create prediction
    const createResponse = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${replicateApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        version: '4876f2a8b0c3e6c1e1b8f4d5e9c0a1b2c3d4e5f6', // TRELLIS version
        input: {
          images: [imageUrl],
          generate_model: generateModel,
          texture_size: textureSize,
          mesh_simplify: meshSimplify,
          generate_color: true,
          randomize_seed: true,
          ss_guidance_strength: 7.5,
          ss_sampling_steps: 12,
          slat_guidance_strength: 3,
          slat_sampling_steps: 12,
        },
      }),
    });

    if (!createResponse.ok) {
      const errorText = await createResponse.text();
      throw new Error(`Replicate API error: ${createResponse.status} - ${errorText}`);
    }

    const prediction = await createResponse.json();
    const predictionId = prediction.id;

    // Step 2: Poll for completion
    let status = 'starting';
    let output = null;
    let attempts = 0;
    const maxAttempts = 60; // 60 attempts * 2 seconds = 2 minutes max

    while (status !== 'succeeded' && status !== 'failed' && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds

      const statusResponse = await fetch(
        `https://api.replicate.com/v1/predictions/${predictionId}`,
        {
          headers: {
            'Authorization': `Bearer ${replicateApiKey}`,
          },
        }
      );

      if (!statusResponse.ok) {
        throw new Error(`Failed to check status: ${statusResponse.statusText}`);
      }

      const statusData = await statusResponse.json();
      status = statusData.status;
      output = statusData.output;

      attempts++;
    }

    if (status === 'failed') {
      throw new Error('3D model generation failed');
    }

    if (status !== 'succeeded') {
      throw new Error('3D model generation timed out');
    }

    // Extract output URLs
    const modelUrl = output?.model_file || '';
    const previewUrl = output?.color_video || '';

    if (!modelUrl) {
      throw new Error('No model file generated');
    }

    return {
      model_url: modelUrl,
      preview_url: previewUrl,
    };
  } catch (error: any) {
    throw new Error(`3D generation failed: ${error.message}`);
  }
}

/**
 * Format TRELLIS result for display in chat
 */
export function formatTrellisResult(result: { model_url: string; preview_url?: string }): string {
  let markdown = `### 🧊 Generated 3D Model\n\n`;
  markdown += `**Download**: [3D Model (GLB)](${result.model_url})\n\n`;

  if (result.preview_url) {
    markdown += `**Preview**:\n\n`;
    markdown += `![3D Model Preview](${result.preview_url})\n\n`;
  }

  markdown += `*You can import the GLB file into Blender, Unity, Unreal Engine, or any 3D software.*\n`;

  return markdown;
}
