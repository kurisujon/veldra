import type { DocumentInspection, OCRResult, OCRPage } from './types';
import { getGeminiClient, getGeminiApiKeysCount } from './gemini';
import { ExtractionError } from './types';

// Polyfill DOMMatrix for pdf-parse (pdfjs-dist) in Node environments
if (typeof global !== 'undefined' && !(global as Record<string, unknown>).DOMMatrix) {
  (global as Record<string, unknown>).DOMMatrix = class DOMMatrix {
    constructor() {}
  };
}

export async function readDocumentText(
  buffer: Buffer,
  mimeType: string,
  inspection: DocumentInspection,
  attempt?: number
): Promise<OCRResult> {
  const startTime = Date.now();

  if (inspection.hasNativeText) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const pdfParse = require('pdf-parse');
      const pdfData = await pdfParse(buffer);
      const text = pdfData.text || '';
      
      const processingDurationMs = Date.now() - startTime;
      
      const page: OCRPage = {
        pageNumber: 1,
        text: text,
        width: null,
        height: null,
        blocks: []
      };

      console.log(`[OCR] Extracted native text: ${text.length} characters, 1 page (grouped), duration: ${processingDurationMs}ms`);

      return {
        success: true,
        engine: 'pdf-parse',
        fullText: text,
        pages: [page],
        averageConfidence: 0.95,
        processingDurationMs
      };
    } catch (error) {
      throw new ExtractionError(
        'DOCUMENT_READ_FAILED',
        'Failed to read native text from PDF',
        { retryable: false, cause: error }
      );
    }
  } else {
    const keysCount = getGeminiApiKeysCount();
    let currentKeyIndex = attempt ?? 0;
    let attemptsMade = 0;
    let lastError: unknown = null;
    
    const promptText = `Read all visible text on this document exactly as it appears. Return ONLY the raw text content.
Preserve the layout and spacing as closely as possible.
Do NOT interpret, summarize, restructure, or extract structured fields.
Do NOT add any commentary or formatting.
If text is unclear or partially illegible, include your best reading with [?] markers.`;

    const base64Data = buffer.toString('base64');

    while (attemptsMade < keysCount) {
      try {
        const client = getGeminiClient(currentKeyIndex);
        // Using gemini-2.5-flash directly for text extraction, not the configured model
        const response = await client.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: [
            { inlineData: { data: base64Data, mimeType: mimeType } },
            promptText
          ],
          config: { temperature: 0.0 }
        });
        
        const text = response.text || '';
        const processingDurationMs = Date.now() - startTime;
        
        const page: OCRPage = {
          pageNumber: 1,
          text: text,
          width: null,
          height: null,
          blocks: []
        };
        
        console.log(`[OCR] Gemini OCR extraction: ${text.length} characters, 1 page (grouped), duration: ${processingDurationMs}ms`);

        return {
          success: true,
          engine: 'gemini-ocr',
          fullText: text,
          pages: [page],
          averageConfidence: 0.85,
          processingDurationMs
        };
      } catch (error) {
        lastError = error;
        console.warn(`[OCR] Gemini attempt with key index ${currentKeyIndex % keysCount} failed:`, error instanceof Error ? error.message : String(error));
        currentKeyIndex++;
        attemptsMade++;
      }
    }
    
    throw new ExtractionError('OCR_FAILED', 'OCR failed after all attempts', { retryable: false, cause: lastError });
  }
}
