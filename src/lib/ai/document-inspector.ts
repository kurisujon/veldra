import type { DocumentInspection, DocumentContentType, DocumentQuality } from '@/lib/ai/types';

if (typeof global !== 'undefined' && !(global as Record<string, unknown>).DOMMatrix) {
  (global as Record<string, unknown>).DOMMatrix = class DOMMatrix {
    constructor() {/* polyfill */}
  };
}

export async function inspectDocument(buffer: Buffer, mimeType: string): Promise<DocumentInspection> {
  try {
    if (mimeType.startsWith('image/')) {
      console.log('[Document Inspector] Inspecting image document');
      return {
        hasNativeText: false,
        nativeTextLength: 0,
        pageCount: 1,
        quality: 'poor',
        contentType: 'image',
        mimeType,
        fileSizeBytes: buffer.length,
      };
    }

    if (mimeType === 'application/pdf') {
      console.log('[Document Inspector] Inspecting PDF document');
      
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const pdfParse = require('pdf-parse');
      const data = await pdfParse(buffer);
      
      const pageCount = typeof data.numpages === 'number' && data.numpages > 0 ? data.numpages : 1;
      const text = typeof data.text === 'string' ? data.text : '';
      const textLength = text.length;
      
      const charsPerPage = textLength / pageCount;
      const hasNativeText = textLength > 50;
      
      let quality: DocumentQuality = 'poor';
      if (hasNativeText) {
        if (charsPerPage > 200) {
          quality = 'clear';
        } else if (charsPerPage > 50) {
          quality = 'degraded';
        }
      }
      
      const contentType: DocumentContentType = hasNativeText ? 'native_text' : 'scanned';
      
      console.log(`[Document Inspector] PDF inspected: ${pageCount} pages, type: ${contentType}`);
      
      return {
        hasNativeText,
        nativeTextLength: textLength,
        pageCount,
        quality,
        contentType,
        mimeType,
        fileSizeBytes: buffer.length,
      };
    }

    console.log(`[Document Inspector] Unsupported mime type: ${mimeType}`);
    return {
      hasNativeText: false,
      nativeTextLength: 0,
      pageCount: 1,
      quality: 'poor',
      contentType: 'scanned',
      mimeType,
      fileSizeBytes: buffer.length,
    };
  } catch (error) {
    console.error('[Document Inspector] Document inspection failed:', error instanceof Error ? error.message : 'Unknown error');
    
    // Provide sensible defaults on failure
    return {
      hasNativeText: false,
      nativeTextLength: 0,
      pageCount: 1,
      quality: 'poor',
      contentType: mimeType.startsWith('image/') ? 'image' : 'scanned',
      mimeType,
      fileSizeBytes: buffer.length,
    };
  }
}
