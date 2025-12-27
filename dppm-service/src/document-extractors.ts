// @ts-nocheck
/**
 * Document Extraction Utilities
 * Extracts text from various document formats
 */

/**
 * Extract text from PDF
 * Uses pdf-parse library
 */
export async function extractPDF(buffer: Buffer): Promise<string> {
  try {
    // Import pdf-parse dynamically
    const pdfParse = await import('pdf-parse');
    const data = await pdfParse.default(buffer);
    return data.text;
  } catch (error) {
    console.error('PDF extraction error:', error);
    throw new Error('Failed to extract text from PDF. Make sure pdf-parse is installed: npm install pdf-parse');
  }
}

/**
 * Extract text from Word document (.docx)
 * Uses mammoth library
 */
export async function extractWord(buffer: Buffer): Promise<string> {
  try {
    // Import mammoth dynamically
    const mammoth = await import('mammoth');
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  } catch (error) {
    console.error('Word extraction error:', error);
    throw new Error('Failed to extract text from Word document. Make sure mammoth is installed: npm install mammoth');
  }
}

/**
 * Extract text from plain text file
 */
export function extractText(buffer: Buffer): string {
  return buffer.toString('utf-8');
}

/**
 * Extract text from Markdown file
 */
export function extractMarkdown(buffer: Buffer): string {
  // For now, just return as text
  // Could use a markdown parser to strip formatting if needed
  return buffer.toString('utf-8');
}

/**
 * Extract text from CSV file
 */
export function extractCSV(buffer: Buffer): string {
  const text = buffer.toString('utf-8');
  // Convert CSV to readable text format
  const lines = text.split('\n');
  return lines.map(line => line.replace(/,/g, ' | ')).join('\n');
}

/**
 * Extract text from JSON file
 */
export function extractJSON(buffer: Buffer): string {
  try {
    const json = JSON.parse(buffer.toString('utf-8'));
    // Convert JSON to readable text format
    return JSON.stringify(json, null, 2);
  } catch (error) {
    return buffer.toString('utf-8');
  }
}

/**
 * Extract text from code file
 */
export function extractCode(buffer: Buffer, extension: string): string {
  const code = buffer.toString('utf-8');
  // Add language identifier for better context
  return `\`\`\`${extension}\n${code}\n\`\`\``;
}

/**
 * Main extraction function that routes to appropriate extractor
 */
export async function extractText(
  buffer: Buffer,
  mimeType: string,
  filename: string
): Promise<string> {
  const extension = filename.split('.').pop()?.toLowerCase() || '';

  // PDF
  if (mimeType === 'application/pdf' || extension === 'pdf') {
    return await extractPDF(buffer);
  }

  // Word
  if (
    mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    mimeType === 'application/msword' ||
    extension === 'docx' ||
    extension === 'doc'
  ) {
    return await extractWord(buffer);
  }

  // Plain text
  if (mimeType.startsWith('text/plain') || extension === 'txt') {
    return extractText(buffer);
  }

  // Markdown
  if (extension === 'md' || extension === 'markdown') {
    return extractMarkdown(buffer);
  }

  // CSV
  if (mimeType === 'text/csv' || extension === 'csv') {
    return extractCSV(buffer);
  }

  // JSON
  if (mimeType === 'application/json' || extension === 'json') {
    return extractJSON(buffer);
  }

  // Code files
  const codeExtensions = ['js', 'ts', 'jsx', 'tsx', 'py', 'java', 'cpp', 'c', 'go', 'rs', 'rb', 'php', 'html', 'css', 'sql'];
  if (codeExtensions.includes(extension)) {
    return extractCode(buffer, extension);
  }

  // Default: try as text
  try {
    return buffer.toString('utf-8');
  } catch (error) {
    throw new Error(`Unsupported file type: ${mimeType} (${extension})`);
  }
}

/**
 * Get supported file types
 */
export function getSupportedFileTypes(): string[] {
  return [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword',
    'text/plain',
    'text/markdown',
    'text/csv',
    'application/json',
    'text/javascript',
    'text/typescript',
    'text/html',
    'text/css',
    'application/x-python',
    'text/x-python'
  ];
}

/**
 * Check if file type is supported
 */
export function isFileTypeSupported(mimeType: string, filename: string): boolean {
  const extension = filename.split('.').pop()?.toLowerCase() || '';
  const supportedExtensions = [
    'pdf', 'doc', 'docx', 'txt', 'md', 'markdown', 
    'csv', 'json', 'js', 'ts', 'jsx', 'tsx', 'py', 
    'java', 'cpp', 'c', 'go', 'rs', 'rb', 'php', 
    'html', 'css', 'sql'
  ];

  return (
    getSupportedFileTypes().includes(mimeType) ||
    supportedExtensions.includes(extension) ||
    mimeType.startsWith('text/')
  );
}
