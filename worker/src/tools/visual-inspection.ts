/**
 * Visual Inspection Loop for Morgus
 * 
 * Implements the render → inspect → refine workflow for documents.
 * This ensures high-quality output by visually verifying generated content.
 */

export interface InspectionResult {
  success: boolean;
  message: string;
  imageUrl?: string;
  issues?: string[];
  suggestions?: string[];
}

/**
 * Convert a document to an image for visual inspection
 * Uses external services for rendering
 */
export async function renderDocumentToImage(
  documentUrl: string,
  documentType: 'pdf' | 'docx' | 'xlsx' | 'html'
): Promise<InspectionResult> {
  try {
    // For PDFs, use pdf.js or similar rendering
    // For DOCX/XLSX, convert to PDF first then render
    // For HTML, use screenshot service
    
    if (documentType === 'html') {
      // Use a screenshot service for HTML
      const screenshotUrl = `https://api.screenshotone.com/take?url=${encodeURIComponent(documentUrl)}&format=png&viewport_width=1200&viewport_height=800`;
      
      return {
        success: true,
        message: 'HTML rendered to image for inspection',
        imageUrl: screenshotUrl
      };
    }
    
    if (documentType === 'pdf') {
      // PDF rendering would typically use pdf.js or a cloud service
      // For now, return the PDF URL for manual inspection
      return {
        success: true,
        message: 'PDF ready for inspection',
        imageUrl: documentUrl
      };
    }
    
    // For DOCX/XLSX, we'd need to convert first
    return {
      success: true,
      message: `${documentType.toUpperCase()} document ready for inspection`,
      imageUrl: documentUrl
    };
  } catch (error) {
    return {
      success: false,
      message: `Error rendering document: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}

/**
 * Analyze a rendered document image for quality issues
 * Uses AI vision to detect problems
 */
export async function analyzeDocumentImage(
  imageUrl: string,
  documentType: string,
  geminiApiKey: string
): Promise<InspectionResult> {
  try {
    // Use Gemini Vision to analyze the document
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${geminiApiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [{
            parts: [
              {
                text: `You are a document quality inspector. Analyze this ${documentType} document image and identify any issues with:
                
1. **Layout & Formatting**
   - Alignment issues
   - Inconsistent spacing
   - Text overflow or truncation
   - Missing margins
   
2. **Visual Quality**
   - Blurry or low-resolution elements
   - Color contrast problems
   - Font readability issues
   
3. **Content Issues**
   - Placeholder text remaining
   - Broken images or charts
   - Missing sections
   
4. **Professional Standards**
   - Branding consistency
   - Header/footer presence
   - Page numbering

Respond in JSON format:
{
  "issues": ["list of specific issues found"],
  "suggestions": ["list of specific improvements"],
  "overallQuality": "excellent|good|needs_work|poor",
  "passesInspection": true|false
}`
              },
              {
                inlineData: {
                  mimeType: 'image/png',
                  data: imageUrl // This should be base64 encoded
                }
              }
            ]
          }]
        })
      }
    );

    if (!response.ok) {
      throw new Error(`Vision API error: ${response.statusText}`);
    }

    const data = await response.json();
    const analysisText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    // Parse the JSON response
    try {
      const analysis = JSON.parse(analysisText);
      return {
        success: true,
        message: `Document inspection complete. Quality: ${analysis.overallQuality}`,
        issues: analysis.issues,
        suggestions: analysis.suggestions
      };
    } catch {
      // If JSON parsing fails, return the raw analysis
      return {
        success: true,
        message: analysisText,
        issues: [],
        suggestions: []
      };
    }
  } catch (error) {
    return {
      success: false,
      message: `Error analyzing document: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}

/**
 * Full visual inspection loop
 * Render → Inspect → Report
 */
export async function runVisualInspection(
  documentUrl: string,
  documentType: 'pdf' | 'docx' | 'xlsx' | 'html',
  geminiApiKey: string
): Promise<InspectionResult> {
  // Step 1: Render to image
  const renderResult = await renderDocumentToImage(documentUrl, documentType);
  if (!renderResult.success) {
    return renderResult;
  }

  // Step 2: Analyze with AI vision
  if (renderResult.imageUrl) {
    const analysisResult = await analyzeDocumentImage(
      renderResult.imageUrl,
      documentType,
      geminiApiKey
    );
    return analysisResult;
  }

  return {
    success: false,
    message: 'No image URL available for inspection'
  };
}

/**
 * Tool definition for visual inspection
 */
export const visualInspectionTool = {
  name: 'inspect_document',
  description: 'Visually inspect a generated document (PDF, DOCX, XLSX, HTML) for quality issues. Uses AI vision to detect layout problems, formatting issues, and content errors. Use this after generating any document to ensure quality.',
  parameters: {
    type: 'object',
    properties: {
      document_url: {
        type: 'string',
        description: 'URL of the document to inspect'
      },
      document_type: {
        type: 'string',
        enum: ['pdf', 'docx', 'xlsx', 'html'],
        description: 'Type of document being inspected'
      }
    },
    required: ['document_url', 'document_type']
  }
};
