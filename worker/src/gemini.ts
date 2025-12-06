/**
 * Gemini API integration for Morgus
 */

export interface GeminiMessage {
  role: 'user' | 'model';
  parts: Array<{ text: string }>;
}

export interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{ text: string }>;
      role: string;
    };
    finishReason: string;
  }>;
  usageMetadata?: {
    promptTokenCount: number;
    candidatesTokenCount: number;
    totalTokenCount: number;
  };
}

/**
 * Call Gemini API with streaming support
 */
export async function callGemini(
  apiKey: string,
  model: string,
  messages: Array<{ role: string; content: string }>,
  systemPrompt?: string
): Promise<string> {
  // Convert OpenAI format to Gemini format
  const geminiMessages: GeminiMessage[] = messages
    .filter(m => m.role !== 'system')
    .map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

  // Build request body
  const requestBody: any = {
    contents: geminiMessages,
    generationConfig: {
      temperature: 0.7,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 8192,
    },
  };

  // Add system instruction if provided
  if (systemPrompt) {
    requestBody.systemInstruction = {
      parts: [{ text: systemPrompt }],
    };
  }

  // Call Gemini API
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Gemini API error: ${response.status} - ${error}`);
  }

  const data: GeminiResponse = await response.json();

  if (!data.candidates || data.candidates.length === 0) {
    throw new Error('No response from Gemini');
  }

  return data.candidates[0].content.parts[0].text;
}

/**
 * Query Gemini for MOE competition (returns OpenRouter-compatible response)
 */
export async function queryGeminiForMOE(
  apiKey: string,
  model: string,
  messages: Array<{ role: string; content: string }>
): Promise<{
  model: string;
  content: string;
  tokens: { prompt: number; completion: number; total: number };
  cost: number;
  latency: number;
  timestamp: number;
}> {
  const startTime = Date.now();
  
  try {
    const content = await callGemini(apiKey, model, messages);
    const latency = Date.now() - startTime;
    
    // Estimate tokens (rough approximation: 1 token ≈ 4 chars)
    const promptTokens = messages.reduce((sum, m) => sum + Math.ceil(m.content.length / 4), 0);
    const completionTokens = Math.ceil(content.length / 4);
    
    return {
      model: `google/${model}`,
      content,
      tokens: {
        prompt: promptTokens,
        completion: completionTokens,
        total: promptTokens + completionTokens,
      },
      cost: 0, // Free tier
      latency,
      timestamp: Date.now(),
    };
  } catch (error: any) {
    console.error(`Error querying Gemini for MOE:`, error);
    throw error;
  }
}

/**
 * Call Gemini API with streaming
 */
export async function* callGeminiStream(
  apiKey: string,
  model: string,
  messages: Array<{ role: string; content: string }>,
  systemPrompt?: string
): AsyncGenerator<string> {
  // Convert OpenAI format to Gemini format
  const geminiMessages: GeminiMessage[] = messages
    .filter(m => m.role !== 'system')
    .map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

  // Build request body
  const requestBody: any = {
    contents: geminiMessages,
    generationConfig: {
      temperature: 0.7,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 8192,
    },
  };

  // Add system instruction if provided
  if (systemPrompt) {
    requestBody.systemInstruction = {
      parts: [{ text: systemPrompt }],
    };
  }

  // Call Gemini streaming API
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?key=${apiKey}&alt=sse`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Gemini API error: ${response.status} - ${error}`);
  }

  // Parse SSE stream
  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error('No response body');
  }

  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const jsonStr = line.slice(6);
        if (jsonStr.trim() === '[DONE]') continue;

        try {
          const data: GeminiResponse = JSON.parse(jsonStr);
          if (data.candidates && data.candidates[0]?.content?.parts[0]?.text) {
            yield data.candidates[0].content.parts[0].text;
          }
        } catch (e) {
          // Skip invalid JSON
        }
      }
    }
  }
}
