/**
 * Google Imagen (Nano Banana) - Proper Implementation
 * Based on https://ai.google.dev/gemini-api/docs/imagen
 */

export async function generateImageWithImagen(
  prompt: string,
  apiKey: string,
  options: {
    sampleCount?: number;
    aspectRatio?: string;
    negativePrompt?: string;
  } = {}
): Promise<string> {
  const {
    sampleCount = 1,
    aspectRatio = '1:1',
    negativePrompt = '',
  } = options;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-fast-generate-001:predict`,
    {
      method: 'POST',
      headers: {
        'x-goog-api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        instances: [
          {
            prompt: prompt,
          },
        ],
        parameters: {
          sampleCount: sampleCount,
          aspectRatio: aspectRatio,
          negativePrompt: negativePrompt || undefined,
        },
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Imagen API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();

  // Extract generated images from response
  if (data.predictions && data.predictions.length > 0) {
    const images = data.predictions
      .map((pred: any) => {
        if (pred.bytesBase64Encoded) {
          return `data:image/png;base64,${pred.bytesBase64Encoded}`;
        }
        return null;
      })
      .filter(Boolean);

    if (images.length > 0) {
      return images[0]; // Return first image
    }
  }

  throw new Error('No images generated');
}
