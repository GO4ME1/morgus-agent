/**
 * Vision & PDF Service for Morgus
 * 
 * Handles:
 * - Screenshot understanding via Gemini Vision
 * - PDF extraction and analysis
 * - Image OCR
 * - Diagram understanding
 */

export interface VisionToolSchema {
  name: string;
  description: string;
  parameters: {
    type: string;
    properties: Record<string, any>;
    required: string[];
  };
}

/**
 * Vision Tools
 */
export const VISION_TOOLS: VisionToolSchema[] = [
  {
    name: 'analyze_screenshot',
    description: `Analyze a screenshot using Gemini Vision.
    
    Use this when users upload screenshots to:
    - Extract text (OCR)
    - Identify UI elements
    - Detect errors or bugs
    - Understand layouts
    - Read code from images
    - Analyze diagrams`,
    parameters: {
      type: 'object',
      properties: {
        image_url: {
          type: 'string',
          description: 'URL or base64 data URL of the screenshot',
        },
        focus: {
          type: 'string',
          description: 'What to focus on (e.g., "extract code", "find errors", "describe UI")',
        },
      },
      required: ['image_url'],
    },
  },
  {
    name: 'extract_pdf_text',
    description: `Extract and analyze text from PDF files.
    
    Use this when users upload PDFs to:
    - Extract all text content
    - Summarize documents
    - Find specific information
    - Analyze reports`,
    parameters: {
      type: 'object',
      properties: {
        pdf_url: {
          type: 'string',
          description: 'URL or file path to the PDF',
        },
        extract_images: {
          type: 'boolean',
          description: 'Whether to also extract images from the PDF',
        },
      },
      required: ['pdf_url'],
    },
  },
  {
    name: 'ocr_image',
    description: `Perform OCR (Optical Character Recognition) on an image.
    
    Extracts all visible text from images.`,
    parameters: {
      type: 'object',
      properties: {
        image_url: {
          type: 'string',
          description: 'URL or base64 data URL of the image',
        },
        language: {
          type: 'string',
          description: 'Language of the text (default: auto-detect)',
        },
      },
      required: ['image_url'],
    },
  },
];

/**
 * Vision Service Implementation
 */
export class VisionService {
  private geminiApiKey: string;

  constructor(geminiApiKey: string) {
    this.geminiApiKey = geminiApiKey;
  }

  /**
   * Analyze a screenshot using Gemini Vision
   */
  async analyzeScreenshot(imageUrl: string, focus?: string): Promise<string> {
    try {
      // Prepare the prompt
      const prompt = focus
        ? `Analyze this screenshot. Focus on: ${focus}`
        : `Analyze this screenshot and describe what you see in detail. Include:
- Any visible text (OCR)
- UI elements and layout
- Any errors or issues
- Code snippets if present
- Overall purpose and context`;

      // Call Gemini Vision API
      const response = await this.callGeminiVision(imageUrl, prompt);
      return response;
    } catch (error: any) {
      throw new Error(`Screenshot analysis failed: ${error.message}`);
    }
  }

  /**
   * Extract text from PDF
   */
  async extractPdfText(pdfUrl: string, extractImages: boolean = false): Promise<string> {
    try {
      // TODO: Implement PDF text extraction
      // Options:
      // 1. Use pdf-parse library
      // 2. Use Gemini Vision on PDF pages
      // 3. Use external PDF API

      return `Extracted text from PDF: ${pdfUrl}`;
    } catch (error: any) {
      throw new Error(`PDF extraction failed: ${error.message}`);
    }
  }

  /**
   * Perform OCR on an image
   */
  async ocrImage(imageUrl: string, language?: string): Promise<string> {
    try {
      const prompt = `Extract all visible text from this image. Return only the text, nothing else.`;
      const response = await this.callGeminiVision(imageUrl, prompt);
      return response;
    } catch (error: any) {
      throw new Error(`OCR failed: ${error.message}`);
    }
  }

  /**
   * Call Gemini Vision API
   */
  private async callGeminiVision(imageUrl: string, prompt: string): Promise<string> {
    // Convert image URL to base64 if needed
    let imageData: string;
    let mimeType: string = 'image/jpeg';

    if (imageUrl.startsWith('data:')) {
      // Already a data URL
      const parts = imageUrl.split(',');
      const header = parts[0];
      imageData = parts[1];
      
      // Extract mime type
      const mimeMatch = header.match(/data:([^;]+);/);
      if (mimeMatch) {
        mimeType = mimeMatch[1];
      }
    } else {
      // Fetch and convert to base64
      const response = await fetch(imageUrl);
      const arrayBuffer = await response.arrayBuffer();
      const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
      imageData = base64;
      
      // Determine mime type from URL or response
      const contentType = response.headers.get('content-type');
      if (contentType) {
        mimeType = contentType;
      }
    }

    // Call Gemini Vision API
    const apiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${this.geminiApiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
                {
                  inline_data: {
                    mime_type: mimeType,
                    data: imageData,
                  },
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.4,
            topK: 32,
            topP: 1,
            maxOutputTokens: 4096,
          },
        }),
      }
    );

    if (!apiResponse.ok) {
      const error = await apiResponse.text();
      throw new Error(`Gemini Vision API error: ${apiResponse.status} - ${error}`);
    }

    const data = await apiResponse.json();

    if (!data.candidates || data.candidates.length === 0) {
      throw new Error('No response from Gemini Vision');
    }

    return data.candidates[0].content.parts[0].text;
  }

  /**
   * Analyze multiple images in sequence
   */
  async analyzeMultipleImages(imageUrls: string[], prompt: string): Promise<string[]> {
    const results: string[] = [];
    
    for (const imageUrl of imageUrls) {
      const result = await this.callGeminiVision(imageUrl, prompt);
      results.push(result);
    }
    
    return results;
  }

  /**
   * Compare two images
   */
  async compareImages(imageUrl1: string, imageUrl2: string): Promise<string> {
    const prompt = `Compare these two images and describe:
1. What's different between them
2. What's similar
3. Any notable changes or improvements`;

    // TODO: Implement multi-image vision call
    // Gemini supports multiple images in one request
    return `Comparison of images`;
  }
}
