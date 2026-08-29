import { OCRProvider } from './types';
import { NativePdfProvider } from './NativePdfProvider';
import { GoogleDocumentAiProvider } from './GoogleDocumentAiProvider';
import { MockOcrProvider } from './MockOcrProvider';
import type { DocumentInspection } from '@/lib/ai/types';

export * from './types';
export { NativePdfProvider } from './NativePdfProvider';
export { GoogleDocumentAiProvider } from './GoogleDocumentAiProvider';
export { MockOcrProvider } from './MockOcrProvider';

/**
 * Returns the best available OCR Provider for the given document constraints.
 * 
 * Order of precedence:
 * 1. NativePdfProvider (if it's a native PDF, always use deterministic extraction)
 * 2. GoogleDocumentAiProvider (for scans/images, if configured)
 * 3. MockOcrProvider (development fallback if Document AI is not configured)
 */
export function getOcrProvider(mimeType: string, inspection: DocumentInspection, useMockFallback = true): OCRProvider {
  const nativeProvider = new NativePdfProvider();
  if (nativeProvider.canHandle(mimeType, inspection.hasNativeText)) {
    return nativeProvider;
  }

  const gcpProvider = new GoogleDocumentAiProvider();
  // Since we haven't configured GCP yet, we will bypass it in favor of Mock for now,
  // unless we explicitly disable the mock fallback.
  // In a real environment, we'd check if GCP is configured here.
  
  if (useMockFallback) {
    console.warn('[OCR] Using MockOcrProvider because Google Document AI is not yet configured.');
    return new MockOcrProvider();
  }

  return gcpProvider;
}
