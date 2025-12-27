/**
 * Podcast Generation Tool
 * 
 * Detects podcast requests and routes through NotebookLM conduit
 */

import { detectNotebookLMFeature, isFeatureSupported, getUnsupportedMessage } from '../conduit/notebooklm-detector';

export interface PodcastRequest {
  userId: string;
  messages: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
  title?: string;
}

export interface PodcastResponse {
  type: 'podcast_generation';
  success: boolean;
  notebookId?: string;
  notebookUrl?: string;
  instructions?: string;
  tips?: string[];
  estimatedTime?: number;
  error?: string;
}

/**
 * Check if message requests podcast generation
 */
export function isPodcastRequest(message: string): boolean {
  const detection = detectNotebookLMFeature(message);
  return detection?.feature === 'podcast' && detection.confidence > 50;
}

/**
 * Generate podcast from conversation
 */
export async function generatePodcast(request: PodcastRequest): Promise<PodcastResponse> {
  try {
    console.log('🎧 Podcast request detected:', {
      userId: request.userId,
      messageCount: request.messages.length,
    });

    // Check if feature is supported
    if (!isFeatureSupported('podcast')) {
      return {
        type: 'podcast_generation',
        success: false,
        error: getUnsupportedMessage('podcast'),
      };
    }

    // Extract text sources from messages
    const sources = request.messages
      .filter(msg => msg.content && msg.content.trim().length > 0)
      .map(msg => {
        const role = msg.role === 'user' ? 'User' : 'Assistant';
        return `${role}: ${msg.content}`;
      });

    if (sources.length === 0) {
      return {
        type: 'podcast_generation',
        success: false,
        error: 'No content to generate podcast from. Please have a conversation first!',
      };
    }

    // Call DPPM service to generate podcast
    const response = await fetch(`${process.env.DPPM_SERVICE_URL}/api/podcast/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: request.userId,
        sources,
        title: request.title || 'Morgus Conversation Podcast',
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      return {
        type: 'podcast_generation',
        success: false,
        error: error.error || 'Failed to generate podcast',
      };
    }

    const result = await response.json();

    return {
      type: 'podcast_generation',
      success: true,
      notebookId: result.notebookId,
      notebookUrl: result.notebookUrl,
      instructions: result.instructions,
      tips: result.tips,
      estimatedTime: result.estimatedTime,
    };

  } catch (error) {
    console.error('❌ Podcast generation error:', error);
    return {
      type: 'podcast_generation',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Format podcast response for user
 */
export function formatPodcastResponse(response: PodcastResponse): string {
  if (!response.success) {
    return `❌ ${response.error}`;
  }

  const minutes = response.estimatedTime ? Math.round(response.estimatedTime / 60) : 3;

  return `
🎧 **Podcast Generation Started!**

Your conversation has been saved to NotebookLM and is ready for podcast generation.

**Next Steps:**
${response.instructions}

**Estimated Time:** ${minutes} minutes

**Tips:**
${response.tips?.map(tip => `• ${tip}`).join('\n')}

---

**Notebook URL:** ${response.notebookUrl}

🚀 **Coming soon:** Automatic podcast generation right in Morgus chat!
  `.trim();
}

/**
 * Get podcast generation help message
 */
export function getPodcastHelp(): string {
  return `
🎧 **Podcast Generation**

Turn your conversations into AI-generated podcasts!

**How it works:**
1. Have a conversation with Morgus
2. Say "turn this into a podcast" or "create a podcast"
3. Morgus saves your conversation to NotebookLM
4. Generate the Audio Overview in NotebookLM
5. Get a 5-15 minute podcast with 2 AI hosts!

**Example requests:**
• "Turn our conversation into a podcast"
• "Create an audio overview of my research"
• "Make a podcast about this topic"
• "Generate an audio summary"

**What you'll get:**
🎙️ 2 AI hosts discussing your content
⏱️ 5-15 minute podcast
🎧 Natural conversation style
📥 Downloadable MP3

**Tips for best results:**
• Include 3-10 messages in your conversation
• Focus on a specific topic
• Add more details for deeper discussion
• Use clear, well-structured messages

Ready to try it? Just ask!
  `.trim();
}
