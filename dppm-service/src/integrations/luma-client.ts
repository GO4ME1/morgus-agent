/**
 * Luma AI API Client
 * Free: 30 videos/month
 * Text-to-video generation
 */

import axios from 'axios';

export interface CreateLumaVideoOptions {
  prompt: string; // Description of the video to generate
  aspectRatio?: '16:9' | '9:16' | '4:3' | '3:4' | '1:1';
  loop?: boolean;
  keyframes?: {
    frame0?: {
      type: 'image';
      url: string;
    };
    frame1?: {
      type: 'image';
      url: string;
    };
  };
}

export interface LumaVideoStatus {
  id: string;
  state: 'queued' | 'dreaming' | 'completed' | 'failed';
  video?: {
    url: string;
    width: number;
    height: number;
    duration: number;
  };
  failure_reason?: string;
}

export class LumaClient {
  private apiKey: string;
  private baseUrl: string = 'https://api.lumalabs.ai/dream-machine/v1';

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.LUMA_API_KEY!;
  }

  /**
   * Create a video from text prompt
   */
  async createVideo(options: CreateLumaVideoOptions): Promise<{ id: string }> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/generations`,
        {
          prompt: options.prompt,
          aspect_ratio: options.aspectRatio || '9:16', // TikTok format
          loop: options.loop || false,
          keyframes: options.keyframes,
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return {
        id: response.data.id,
      };
    } catch (error: any) {
      throw new Error(`Failed to create video: ${error.response?.data?.detail || error.message}`);
    }
  }

  /**
   * Get video status
   */
  async getVideoStatus(videoId: string): Promise<LumaVideoStatus> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/generations/${videoId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
          },
        }
      );

      return {
        id: response.data.id,
        state: response.data.state,
        video: response.data.assets?.video ? {
          url: response.data.assets.video,
          width: response.data.assets.video_width,
          height: response.data.assets.video_height,
          duration: response.data.assets.video_duration,
        } : undefined,
        failure_reason: response.data.failure_reason,
      };
    } catch (error: any) {
      throw new Error(`Failed to get video status: ${error.response?.data?.detail || error.message}`);
    }
  }

  /**
   * Wait for video to be ready
   */
  async waitForVideo(
    videoId: string,
    maxWaitTime: number = 180000, // 3 minutes
    pollInterval: number = 10000 // 10 seconds
  ): Promise<LumaVideoStatus> {
    const startTime = Date.now();

    while (Date.now() - startTime < maxWaitTime) {
      const status = await this.getVideoStatus(videoId);

      if (status.state === 'completed') {
        return status;
      }

      if (status.state === 'failed') {
        throw new Error(`Video generation failed: ${status.failure_reason}`);
      }

      // Wait before polling again
      await new Promise(resolve => setTimeout(resolve, pollInterval));
    }

    throw new Error('Video generation timed out');
  }

  /**
   * Create video and wait for completion
   */
  async createVideoAndWait(options: CreateLumaVideoOptions): Promise<LumaVideoStatus> {
    const { id } = await this.createVideo(options);
    return this.waitForVideo(id);
  }

  /**
   * Download video
   */
  async downloadVideo(videoUrl: string): Promise<Buffer> {
    try {
      const response = await axios.get(videoUrl, {
        responseType: 'arraybuffer',
      });

      return Buffer.from(response.data);
    } catch (error: any) {
      throw new Error(`Failed to download video: ${error.message}`);
    }
  }

  /**
   * List all generations
   */
  async listGenerations(limit: number = 10, offset: number = 0): Promise<LumaVideoStatus[]> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/generations`,
        {
          params: { limit, offset },
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
          },
        }
      );

      return response.data.generations.map((gen: any) => ({
        id: gen.id,
        state: gen.state,
        video: gen.assets?.video ? {
          url: gen.assets.video,
          width: gen.assets.video_width,
          height: gen.assets.video_height,
          duration: gen.assets.video_duration,
        } : undefined,
        failure_reason: gen.failure_reason,
      }));
    } catch (error: any) {
      throw new Error(`Failed to list generations: ${error.response?.data?.detail || error.message}`);
    }
  }

  /**
   * Delete a generation
   */
  async deleteGeneration(videoId: string): Promise<void> {
    try {
      await axios.delete(
        `${this.baseUrl}/generations/${videoId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
          },
        }
      );
    } catch (error: any) {
      throw new Error(`Failed to delete generation: ${error.response?.data?.detail || error.message}`);
    }
  }

  /**
   * Get camera motion presets
   */
  getCameraMotions(): string[] {
    return [
      'Static',
      'Zoom in',
      'Zoom out',
      'Pan left',
      'Pan right',
      'Tilt up',
      'Tilt down',
      'Orbit left',
      'Orbit right',
      'Crane up',
      'Crane down',
    ];
  }
}

/**
 * Helper function to create Sally's visual TikTok video
 */
export async function createSallyVisualTikTok(
  client: LumaClient,
  concept: string,
  style: 'modern' | 'cinematic' | 'energetic' | 'professional' = 'energetic'
): Promise<LumaVideoStatus> {
  // Enhance prompt with style
  const stylePrompts = {
    modern: 'modern, sleek, minimalist aesthetic, clean design',
    cinematic: 'cinematic, dramatic lighting, film-like quality, professional',
    energetic: 'vibrant, dynamic, fast-paced, colorful, eye-catching',
    professional: 'professional, corporate, polished, high-quality',
  };

  const enhancedPrompt = `${concept}, ${stylePrompts[style]}, TikTok style, vertical video, engaging, social media optimized`;

  return client.createVideoAndWait({
    prompt: enhancedPrompt,
    aspectRatio: '9:16', // TikTok format
    loop: false,
  });
}

/**
 * TikTok-optimized prompt templates for Sally
 */
export const SALLY_TIKTOK_PROMPTS = {
  marketing: (topic: string) => 
    `Marketing concept visualization: ${topic}, modern office setting, digital screens showing analytics, vibrant colors, professional yet energetic, TikTok style vertical video`,
  
  trend: (trend: string) => 
    `Social media trend visualization: ${trend}, dynamic motion graphics, colorful overlays, fast-paced, eye-catching, TikTok aesthetic, vertical format`,
  
  tutorial: (subject: string) => 
    `Tutorial visualization: ${subject}, step-by-step animation, clear and simple, modern graphics, educational yet engaging, TikTok style`,
  
  transformation: (before: string, after: string) => 
    `Before and after transformation: from ${before} to ${after}, dramatic reveal, smooth transition, impressive results, TikTok style vertical video`,
  
  stats: (statistic: string) => 
    `Data visualization: ${statistic}, animated charts and graphs, modern infographic style, bold numbers, eye-catching colors, TikTok optimized`,
};
