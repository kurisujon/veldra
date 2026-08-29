import { OCRProvider, CanonicalEvidenceMap, CanonicalOCRPage, CanonicalOCRBlock } from './types';
import { ExtractionError } from '@/lib/ai/types';

// Polyfill DOMMatrix for pdf-parse (pdfjs-dist) in Node environments
if (typeof global !== 'undefined' && !(global as Record<string, unknown>).DOMMatrix) {
  (global as Record<string, unknown>).DOMMatrix = class DOMMatrix {
    constructor() {}
  };
}

export class NativePdfProvider implements OCRProvider {
  name = 'NativePdfProvider';

  canHandle(mimeType: string, hasNativeText?: boolean): boolean {
    return mimeType === 'application/pdf' && hasNativeText === true;
  }

  async extract(buffer: Buffer, mimeType: string): Promise<CanonicalEvidenceMap> {
    const startTime = Date.now();
    
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const pdfParse = require('pdf-parse');
      const pdfData = await pdfParse(buffer);
      const text = typeof pdfData.text === 'string' ? pdfData.text : '';
      
      const processingDurationMs = Date.now() - startTime;
      
      // Since pdf-parse doesn't provide fine-grained bounding boxes easily,
      // we mock the line blocks for now so that the canonical map holds structured data.
      // In a production environment, pdfjs-dist directly could extract the exact rects.
      const lines = text.split('\n').filter((l: string) => l.trim().length > 0);
      const blocks: CanonicalOCRBlock[] = lines.map((line: string, idx: number) => ({
        id: `SPAN_NATIVE_${idx}`,
        text: line,
        normalizedText: line.trim().toUpperCase(),
        boundingBox: { x: 0, y: 0, width: 0, height: 0 }, // Not available via simple pdf-parse
        confidence: 1.0, // Native text has 100% confidence natively
        type: 'line'
      }));

      const page: CanonicalOCRPage = {
        pageNumber: 1, // pdf-parse flattens pages
        width: 0,
        height: 0,
        blocks
      };

      return {
        fullText: text,
        pages: [page],
        averageConfidence: 1.0,
        provider: this.name,
        processingDurationMs
      };
    } catch (error) {
      throw new ExtractionError(
        'DOCUMENT_READ_FAILED',
        'NativePdfProvider failed to read PDF text',
        { retryable: false, cause: error }
      );
    }
  }
}
