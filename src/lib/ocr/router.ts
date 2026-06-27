import { extractTextFromNativePdf } from './pdf';
import { ocrWithPaddle } from './paddle';
import { OCRResult } from './types';

export async function runDocumentOcr(params: { buffer: Buffer, mimeType: string, fileName: string }): Promise<OCRResult> {
  const { buffer, mimeType, fileName } = params;

  // 1. Try native PDF text extraction first
  if (mimeType === 'application/pdf') {
    const nativeText = await extractTextFromNativePdf(buffer);
    
    // If it has usable text, return immediately
    if (nativeText) {
      return {
        success: true,
        engine: 'pdf-parse',
        text: nativeText
      };
    }
    
    // Otherwise, it's a scanned PDF. Fall through to PaddleOCR
  }

  // 2. Route scanned PDFs and Images to PaddleOCR
  if (mimeType === 'application/pdf' || mimeType.startsWith('image/')) {
    const result = await ocrWithPaddle(buffer, mimeType, fileName);
    return result;
  }

  throw new Error(`Unsupported mime type for extraction: ${mimeType}`);
}
