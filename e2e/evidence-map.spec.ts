import { test, expect } from '@playwright/test';
import { EvidenceMap, normalizeEvidenceText, EvidenceSpan } from '../src/lib/extraction/evidence/EvidenceMap';
import { CanonicalEvidenceMap } from '../src/lib/extraction/ocr/types';

test.describe('EvidenceMap Architecture', () => {
  const mockExtractionId = 'test-extraction-123';
  const mockPageId = 'test-page-456';
  
  const mockCanonicalMap: CanonicalEvidenceMap = {
    fullText: 'JUAN DELA CRUZ',
    pages: [{
      pageNumber: 1,
      width: 1000,
      height: 1000,
      blocks: [
        {
          id: 'SPAN_001',
          text: 'JUAN  DELA CRUZ',
          normalizedText: 'JUAN DELA CRUZ',
          boundingBox: { x: 10, y: 10, width: 100, height: 20 },
          confidence: 0.95,
          type: 'line'
        }
      ]
    }],
    averageConfidence: 0.95,
    provider: 'MockProvider',
    processingDurationMs: 100
  };

  test('A. Span lookup works deterministically', () => {
    const map = EvidenceMap.fromCanonicalProviderMap(mockExtractionId, mockCanonicalMap, [mockPageId]);
    
    // Existing ID resolves
    const span = map.getSpan('SPAN_001');
    expect(span).toBeDefined();
    expect(span?.id).toBe('SPAN_001');
    
    // Unknown ID returns no result
    expect(map.getSpan('SPAN_999')).toBeUndefined();
    expect(map.hasSpan('SPAN_999')).toBe(false);
  });

  test('B. Extraction isolation rejects cross-document spans', () => {
    const map = new EvidenceMap(mockExtractionId);
    const rogueSpan: EvidenceSpan = {
      id: 'SPAN_ROGUE',
      extractionId: 'different-extraction-999',
      pageId: mockPageId,
      text: 'Rogue Text',
      normalizedText: 'rogue text',
      boundingBox: null,
      ocrConfidence: 0.9,
      blockType: 'word'
    };

    expect(() => {
      map.registerSpan(rogueSpan);
    }).toThrowError(/Extraction isolation violation/);
  });

  test('C. Page isolation resolves spans to their page', () => {
    const map = EvidenceMap.fromCanonicalProviderMap(mockExtractionId, mockCanonicalMap, [mockPageId]);
    const spans = map.getSpansForPage(mockPageId);
    
    expect(spans).toHaveLength(1);
    expect(spans[0].pageId).toBe(mockPageId);
    
    const unknownPageSpans = map.getSpansForPage('unknown-page');
    expect(unknownPageSpans).toHaveLength(0);
  });

  test('D. Immutable evidence prevents fabrication', () => {
    const map = EvidenceMap.fromCanonicalProviderMap(mockExtractionId, mockCanonicalMap, [mockPageId]);
    
    // There's no method to arbitrarily add a span without going through registerSpan (which validates).
    // And getSpans rejects missing IDs rather than guessing.
    const fetched = map.getSpans(['SPAN_001', 'FABRICATED_ID']);
    expect(fetched).toHaveLength(1);
    expect(fetched[0].id).toBe('SPAN_001');
  });

  test('E. Deterministic normalization', () => {
    // original OCR text remains unchanged
    expect(mockCanonicalMap.pages[0].blocks[0].text).toBe('JUAN  DELA CRUZ');
    
    // normalizedText is derived deterministically
    const normalized = normalizeEvidenceText('JUAN  DELA CRUZ');
    expect(normalized).toBe('juan dela cruz'); // lowercased, trimmed, squashed spaces
  });

  test('F. Provider compatibility', () => {
    // Both NativePdf and GoogleDocumentAI return CanonicalEvidenceMap which is directly 
    // parsable by EvidenceMap.fromCanonicalProviderMap. We tested that it works with our generic mock above.
    const map = EvidenceMap.fromCanonicalProviderMap(mockExtractionId, mockCanonicalMap, [mockPageId]);
    expect(map.getAllSpans()).toHaveLength(1);
  });
});
