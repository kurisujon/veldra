// Polyfill DOMMatrix for pdf-parse in Next.js Server environment
if (typeof global !== 'undefined' && !global.DOMMatrix) {
  (global as any).DOMMatrix = class DOMMatrix {
    constructor() {}
  };
}
const pdfParse = require('pdf-parse');

export async function extractTextFromNativePdf(buffer: Buffer): Promise<string | null> {
  try {
    const data = await pdfParse(buffer);
    const text = data.text ? data.text.trim() : '';
    
    // If the extracted text is very short, it's likely a scanned PDF 
    // without a usable embedded text layer.
    if (text.length < 50) {
      return null; 
    }
    
    return text;
  } catch (e) {
    console.error('pdf-parse error:', e);
    return null; // fall back to PaddleOCR
  }
}
