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
 * Query Claude 3.5 Haiku with cost controls
 */
export async function queryClaude(
  prompt: string,
  apiKey: string
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
            content: prompt,
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
