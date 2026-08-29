import { OCRProvider, CanonicalEvidenceMap, CanonicalOCRPage, CanonicalOCRBlock } from './types';

export class MockOcrProvider implements OCRProvider {
  name = 'MockOcrProvider';

  canHandle(mimeType: string, hasNativeText?: boolean): boolean {
    return true; // Catch-all for development
  }

  async extract(buffer: Buffer, mimeType: string): Promise<CanonicalEvidenceMap> {
    const startTime = Date.now();
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));

    const block1: CanonicalOCRBlock = {
      id: 'SPAN_MOCK_001',
      text: 'JUAN DELA CRUZ',
      normalizedText: 'JUAN DELA CRUZ',
      boundingBox: { x: 10, y: 20, width: 200, height: 15 },
      confidence: 0.98,
      type: 'line'
    };
    
    const block2: CanonicalOCRBlock = {
      id: 'SPAN_MOCK_002',
      text: '01 JANUARY 2000',
      normalizedText: '01 JANUARY 2000',
      boundingBox: { x: 10, y: 40, width: 150, height: 15 },
      confidence: 0.95,
      type: 'line'
    };

    const page: CanonicalOCRPage = {
      pageNumber: 1,
      width: 800,
      height: 1200,
      blocks: [block1, block2]
    };

    return {
      fullText: 'JUAN DELA CRUZ\n01 JANUARY 2000',
      pages: [page],
      averageConfidence: 0.965,
      provider: this.name,
      processingDurationMs: Date.now() - startTime
    };
  }
}
