/**
 * Claude API client for MOE integration
 * Uses Anthropic's Messages API with strict cost controls
 */

export interface ClaudeMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ClaudeResponse {
  content: string;
  tokens: number;
  latency: number;
}

/**
 * Build Claude vision content with images
 */
function buildClaudeVisionContent(prompt: string, files: string[]): any[] {
  const content: any[] = [];
  
  // Add text prompt first
  content.push({
    type: 'text',
    text: prompt
  });
  
  // Add images
  for (const fileUrl of files) {
    // Extract mime type and base64 data from data URL
    const matches = fileUrl.match(/^data:([^;]+);base64,(.+)$/);
    if (matches) {
      const [, mimeType, base64Data] = matches;
      
      // Claude supports specific image formats: jpeg, png, gif, webp
      // For PDFs and other formats, treat as image/png
      if (mimeType.startsWith('image/') || mimeType === 'application/pdf') {
        // Normalize mime type to Claude-supported formats
        let claudeMimeType = mimeType;
        if (mimeType === 'application/pdf') {
          claudeMimeType = 'image/png'; // PDFs work as PNG
        } else if (!['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(mimeType)) {
          // Convert unsupported image formats to PNG
          claudeMimeType = 'image/png';
        }
        
        content.push({
          type: 'image',
          source: {
            type: 'base64',
            media_type: claudeMimeType,
            data: base64Data
          }
        });
      }
    }
  }
  
  return content;
}

/**
 * Query Claude 3.5 Haiku with cost controls
 */
export async function queryClaude(
  prompt: string,
  apiKey: string,
  files?: string[] // Base64 data URLs for images/PDFs
): Promise<ClaudeResponse> {
  const startTime = Date.now();

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-5-haiku-20241022',
        max_tokens: 500, // Hard limit to control costs
        temperature: 0.7,
        messages: [
          {
            role: 'user',
            content: files && files.length > 0 ? buildClaudeVisionContent(prompt, files) : prompt,
          },
        ],
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Claude API error: ${error}`);
    }

    const data = await response.json();
    const latency = Date.now() - startTime;

    // Extract text content from Claude's response format
    const content = data.content?.[0]?.text || '';
    const tokens = (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0);

    return {
      content,
      tokens,
      latency,
    };
  } catch (error) {
    console.error('[CLAUDE] Error:', error);
    throw error;
  }
}
