/**
 * Media Generation Tools for Morgus
 * 
 * Implements:
 * - Google Imagen (image generation)
 * - Seedance (video generation)
 * - Seed1.6 (advanced video)
 * - Seed3D (3D model generation)
 */

export interface MediaToolSchema {
  name: string;
  description: string;
  parameters: {
    type: string;
    properties: Record<string, any>;
    required: string[];
  };
}

/**
 * Google Imagen - Static Image Generation
 */
export const generateImageGoogle: MediaToolSchema = {
  name: 'generate_image_google',
  description: `Generate static images using Google Imagen AI.
  
  Use this tool when users ask to:
  - "create an image of..."
  - "generate a picture of..."
  - "make an illustration of..."
  - "design a graphic for..."
  
  Perfect for:
  - Morgy character designs
  - UI mockups
  - Social media graphics
  - Thumbnails
  - Creative assets`,
  parameters: {
    type: 'object',
    properties: {
      prompt: {
        type: 'string',
        description: 'Detailed description of the image to generate. Be specific about style, colors, composition, mood.',
      },
      style: {
        type: 'string',
        enum: ['photorealistic', 'illustration', 'anime', 'cartoon', '3d-render', 'pixel-art', 'watercolor'],
        description: 'Visual style for the generated image',
      },
      aspect_ratio: {
        type: 'string',
        enum: ['1:1', '16:9', '9:16', '4:3', '3:4'],
        description: 'Aspect ratio of the generated image',
      },
    },
    required: ['prompt'],
  },
};

/**
 * Seedance - TikTok-style Video Generation
 */
export const generateSeedVideo: MediaToolSchema = {
  name: 'generate_seed_video',
  description: `Generate short-form videos using ByteDance Seedance AI.
  
  Use this tool when users ask to:
  - "create a video of..."
  - "make a TikTok about..."
  - "generate a clip showing..."
  - "animate this scene..."
  
  Perfect for:
  - TikTok-style content
  - Daily Morgus recaps
  - Promotional clips
  - Creative storytelling
  - Social media content`,
  parameters: {
    type: 'object',
    properties: {
      prompt: {
        type: 'string',
        description: 'Detailed description of the video scene. Include camera movements, actions, mood, setting.',
      },
      duration: {
        type: 'number',
        enum: [3, 5, 10, 15],
        description: 'Video duration in seconds',
      },
      aspect_ratio: {
        type: 'string',
        enum: ['9:16', '16:9', '1:1'],
        description: 'Video aspect ratio (9:16 for TikTok/Reels, 16:9 for YouTube)',
      },
      style: {
        type: 'string',
        enum: ['realistic', 'anime', 'cartoon', 'cinematic', 'abstract'],
        description: 'Visual style of the video',
      },
    },
    required: ['prompt'],
  },
};

/**
 * Seed1.6 - Advanced Video Generation
 */
export const generateSeed16Video: MediaToolSchema = {
  name: 'generate_seed16_video',
  description: `Generate high-quality videos using Seed1.6 (advanced Seedance).
  
  Use this for more complex video generation tasks requiring:
  - Longer duration (up to 30s)
  - Higher quality
  - More complex scenes
  - Professional content`,
  parameters: {
    type: 'object',
    properties: {
      prompt: {
        type: 'string',
        description: 'Detailed video description with scene composition, lighting, camera work',
      },
      duration: {
        type: 'number',
        enum: [5, 10, 15, 20, 30],
        description: 'Video duration in seconds',
      },
      aspect_ratio: {
        type: 'string',
        enum: ['9:16', '16:9', '1:1', '21:9'],
        description: 'Video aspect ratio',
      },
      quality: {
        type: 'string',
        enum: ['standard', 'high', 'ultra'],
        description: 'Output quality level',
      },
    },
    required: ['prompt'],
  },
};

/**
 * Seed3D - 3D Model Generation
 */
export const generateSeed3DModel: MediaToolSchema = {
  name: 'generate_seed3d_model',
  description: `Generate 3D models using Seed3D AI.
  
  Use this tool when users ask to:
  - "create a 3D model of..."
  - "generate a 3D Morgy character..."
  - "make a 3D scene with..."
  - "build a 3D environment..."
  
  Perfect for:
  - 3D Morgy avatars
  - Character models
  - Environment assets
  - Product visualizations
  - Immersive experiences`,
  parameters: {
    type: 'object',
    properties: {
      prompt: {
        type: 'string',
        description: 'Detailed description of the 3D model. Include shape, texture, materials, style.',
      },
      format: {
        type: 'string',
        enum: ['glb', 'obj', 'fbx', 'usdz'],
        description: '3D model output format',
      },
      style: {
        type: 'string',
        enum: ['realistic', 'stylized', 'low-poly', 'high-poly', 'cartoon'],
        description: 'Visual style of the 3D model',
      },
      texture_quality: {
        type: 'string',
        enum: ['low', 'medium', 'high', 'ultra'],
        description: 'Texture resolution quality',
      },
    },
    required: ['prompt'],
  },
};

/**
 * Chart Generation (using Python/Matplotlib)
 */
export const generateChart: MediaToolSchema = {
  name: 'generate_chart',
  description: `Generate data visualizations and charts.
  
  Use this tool when users ask for:
  - "create a chart showing..."
  - "visualize this data..."
  - "make a graph of..."
  - "plot this information..."`,
  parameters: {
    type: 'object',
    properties: {
      data_json: {
        type: 'string',
        description: 'JSON string containing the data to visualize',
      },
      chart_type: {
        type: 'string',
        enum: ['bar', 'line', 'pie', 'scatter', 'histogram', 'heatmap', 'area'],
        description: 'Type of chart to generate',
      },
      title: {
        type: 'string',
        description: 'Chart title',
      },
      x_label: {
        type: 'string',
        description: 'X-axis label',
      },
      y_label: {
        type: 'string',
        description: 'Y-axis label',
      },
    },
    required: ['data_json', 'chart_type'],
  },
};

/**
 * All media tool schemas
 */
export const MEDIA_TOOLS: MediaToolSchema[] = [
  generateImageGoogle,
  generateSeedVideo,
  generateSeed16Video,
  generateSeed3DModel,
  generateChart,
];
