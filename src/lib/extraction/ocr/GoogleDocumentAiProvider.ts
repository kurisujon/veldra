import { OCRProvider, CanonicalEvidenceMap } from './types';
import { ExtractionError } from '@/lib/ai/types';

export class GoogleDocumentAiProvider implements OCRProvider {
  name = 'GoogleDocumentAiProvider';

  private configured: boolean = false;

  constructor() {
    // In a real scenario, this would check process.env.GOOGLE_APPLICATION_CREDENTIALS
    // and verify the Document AI processor ID exists.
    // For now, we keep this isolated and architecture-ready.
    this.configured = false; 
  }

  canHandle(mimeType: string, hasNativeText?: boolean): boolean {
    // Google Document AI can handle everything, but we generally route scans/images here.
    return !hasNativeText && (mimeType === 'application/pdf' || mimeType.startsWith('image/'));
  }

  async extract(buffer: Buffer, mimeType: string): Promise<CanonicalEvidenceMap> {
    if (!this.configured) {
      throw new ExtractionError(
        'OCR_PROVIDER_NOT_CONFIGURED',
        'Google Document AI is not configured yet. Set up GCP credentials and Processor IDs.',
        { retryable: false }
      );
    }

    const startTime = Date.now();
    
    // TODO: Implement actual @google-cloud/documentai SDK call here:
    // const client = new DocumentProcessorServiceClient();
    // const request = { name: processor, rawDocument: { content: buffer, mimeType } };
    // const [result] = await client.processDocument(request);
    // Parse result.document.pages into CanonicalOCRPage[]
    
    return {
      fullText: 'Not Implemented',
      pages: [],
      averageConfidence: 0,
      provider: this.name,
      processingDurationMs: Date.now() - startTime
    };
  }
}
