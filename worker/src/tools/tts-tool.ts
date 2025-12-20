/**
 * Text-to-Speech tool using ElevenLabs (Morgan Freeman voice)
 */

export async function generateSpeech(
  text: string,
  elevenLabsApiKey: string,
  voiceId: string
): Promise<string> {
  try {
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': elevenLabsApiKey,
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_monolingual_v1',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`ElevenLabs API error: ${response.statusText}`);
    }

    // Convert audio to base64 data URL
    const audioBuffer = await response.arrayBuffer();
    const base64Audio = btoa(String.fromCharCode(...new Uint8Array(audioBuffer)));
    const audioDataUrl = `data:audio/mpeg;base64,${base64Audio}`;

    return audioDataUrl;
  } catch (error: any) {
    throw new Error(`Failed to generate speech: ${error.message}`);
  }
}
