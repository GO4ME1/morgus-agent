/**
 * D-ID API Client
 * Free: 20 videos/month (5 min total)
 * Lite: $49/month for 100 videos (10 min)
 */

import axios from 'axios';

export interface CreateVideoOptions {
  sourceUrl: string; // URL to Sally's avatar image
  script: string; // What Sally will say
  voice?: {
    type: 'microsoft' | 'amazon';
    voiceId: string;
  };
  config?: {
    fluent?: boolean;
    padAudio?: number;
    stitch?: boolean;
  };
}

export interface VideoStatus {
  id: string;
  status: 'created' | 'processing' | 'done' | 'error';
  resultUrl?: string;
  duration?: number;
  error?: string;
}

export class DIDClient {
  private apiKey: string;
  private baseUrl: string = 'https://api.d-id.com';

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.DID_API_KEY!;
  }

  /**
   * Create a talking head video
   */
  async createVideo(options: CreateVideoOptions): Promise<{ id: string }> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/talks`,
        {
          source_url: options.sourceUrl,
          script: {
            type: 'text',
            input: options.script,
            provider: options.voice || {
              type: 'microsoft',
              voice_id: 'en-US-JennyNeural', // Female, friendly voice
            },
          },
          config: {
            fluent: options.config?.fluent !== false,
            pad_audio: options.config?.padAudio || 0,
            stitch: options.config?.stitch !== false,
          },
        },
        {
          headers: {
            'Authorization': `Basic ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return {
        id: response.data.id,
      };
    } catch (error: any) {
      throw new Error(`Failed to create video: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Get video status
   */
  async getVideoStatus(videoId: string): Promise<VideoStatus> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/talks/${videoId}`,
        {
          headers: {
            'Authorization': `Basic ${this.apiKey}`,
          },
        }
      );

      return {
        id: response.data.id,
        status: response.data.status,
        resultUrl: response.data.result_url,
        duration: response.data.duration,
        error: response.data.error,
      };
    } catch (error: any) {
      throw new Error(`Failed to get video status: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Wait for video to be ready
   */
  async waitForVideo(
    videoId: string,
    maxWaitTime: number = 120000, // 2 minutes
    pollInterval: number = 5000 // 5 seconds
  ): Promise<VideoStatus> {
    const startTime = Date.now();

    while (Date.now() - startTime < maxWaitTime) {
      const status = await this.getVideoStatus(videoId);

      if (status.status === 'done') {
        return status;
      }

      if (status.status === 'error') {
        throw new Error(`Video generation failed: ${status.error}`);
      }

      // Wait before polling again
      await new Promise(resolve => setTimeout(resolve, pollInterval));
    }

    throw new Error('Video generation timed out');
  }

  /**
   * Create video and wait for completion
   */
  async createVideoAndWait(options: CreateVideoOptions): Promise<VideoStatus> {
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
   * Delete a video
   */
  async deleteVideo(videoId: string): Promise<void> {
    try {
      await axios.delete(
        `${this.baseUrl}/talks/${videoId}`,
        {
          headers: {
            'Authorization': `Basic ${this.apiKey}`,
          },
        }
      );
    } catch (error: any) {
      throw new Error(`Failed to delete video: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Get available voices
   */
  async getVoices(): Promise<Array<{ id: string; name: string; language: string }>> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/tts/voices`,
        {
          headers: {
            'Authorization': `Basic ${this.apiKey}`,
          },
        }
      );

      return response.data;
    } catch (error: any) {
      throw new Error(`Failed to get voices: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Get account credits
   */
  async getCredits(): Promise<{ remaining: number; total: number }> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/credits`,
        {
          headers: {
            'Authorization': `Basic ${this.apiKey}`,
          },
        }
      );

      return {
        remaining: response.data.remaining,
        total: response.data.total,
      };
    } catch (error: any) {
      throw new Error(`Failed to get credits: ${error.response?.data?.message || error.message}`);
    }
  }
}

/**
 * Recommended voices for Sally (friendly, energetic female voices)
 */
export const SALLY_VOICES = {
  // Microsoft voices (recommended)
  microsoft: [
    { id: 'en-US-JennyNeural', name: 'Jenny', description: 'Friendly, warm female voice' },
    { id: 'en-US-AriaNeural', name: 'Aria', description: 'Energetic, upbeat female voice' },
    { id: 'en-US-SaraNeural', name: 'Sara', description: 'Professional, clear female voice' },
  ],
  // Amazon Polly voices
  amazon: [
    { id: 'Joanna', name: 'Joanna', description: 'Natural, friendly female voice' },
    { id: 'Kendra', name: 'Kendra', description: 'Warm, conversational female voice' },
    { id: 'Salli', name: 'Salli', description: 'Clear, professional female voice' },
  ],
};

/**
 * Helper function to create Sally's TikTok video
 */
export async function createSallyTikTok(
  client: DIDClient,
  sallyAvatarUrl: string,
  script: string
): Promise<VideoStatus> {
  return client.createVideoAndWait({
    sourceUrl: sallyAvatarUrl,
    script,
    voice: {
      type: 'microsoft',
      voiceId: 'en-US-AriaNeural', // Energetic voice for Sally
    },
    config: {
      fluent: true,
      stitch: true,
    },
  });
}
