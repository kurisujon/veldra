import { CanonicalOCRBlock, CanonicalOCRPage, CanonicalEvidenceMap } from '../ocr/types';

export interface EvidenceSpan {
  id: string;
  extractionId: string;
  pageId: string;
  text: string;
  normalizedText: string;
  boundingBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  } | null;
  ocrConfidence: number | null;
  blockType: 'word' | 'line' | 'paragraph' | 'key_value' | 'table_cell';
}

/**
 * Deterministically normalizes text for exact matching/search.
 * Preserves the original text in the EvidenceSpan.
 */
export function normalizeEvidenceText(text: string): string {
  if (!text) return '';
  return text
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' '); // Replace multiple spaces with a single space
}

/**
 * Canonical Evidence Map
 * 
 * A read-only, deterministic representation of observed OCR evidence.
 * AI cannot create or modify this map. It only indexes into it.
 */
export class EvidenceMap {
  private spans = new Map<string, EvidenceSpan>();
  private spansByPage = new Map<string, EvidenceSpan[]>();
  public readonly extractionId: string;

  constructor(extractionId: string) {
    this.extractionId = extractionId;
  }

  /**
   * Initializes the EvidenceMap from a provider's CanonicalEvidenceMap.
   * This is the boundary where OCR output becomes immutable system evidence.
   */
  public static fromCanonicalProviderMap(
    extractionId: string, 
    canonicalMap: CanonicalEvidenceMap,
    pageIds: string[] // We expect the caller/persistence layer to provide canonical page UUIDs
  ): EvidenceMap {
    const evidenceMap = new EvidenceMap(extractionId);

    if (canonicalMap.pages.length !== pageIds.length) {
      throw new Error(`Page count mismatch: Canonical map has ${canonicalMap.pages.length} pages, but ${pageIds.length} pageIds were provided.`);
    }

    canonicalMap.pages.forEach((page, index) => {
      const pageId = pageIds[index];
      const pageSpans: EvidenceSpan[] = [];

      page.blocks.forEach((block) => {
        const span: EvidenceSpan = {
          id: block.id,
          extractionId,
          pageId,
          text: block.text,
          normalizedText: normalizeEvidenceText(block.text),
          boundingBox: block.boundingBox,
          ocrConfidence: block.confidence,
          blockType: block.type
        };
        
        evidenceMap.spans.set(span.id, span);
        pageSpans.push(span);
      });

      evidenceMap.spansByPage.set(pageId, pageSpans);
    });

    return evidenceMap;
  }

  /**
   * Directly registers an EvidenceSpan (useful for hydration from DB).
   */
  public registerSpan(span: EvidenceSpan): void {
    if (span.extractionId !== this.extractionId) {
      throw new Error(`Extraction isolation violation: Cannot register span ${span.id} belonging to extraction ${span.extractionId} into EvidenceMap for extraction ${this.extractionId}`);
    }
    
    this.spans.set(span.id, span);
    
    if (!this.spansByPage.has(span.pageId)) {
      this.spansByPage.set(span.pageId, []);
    }
    this.spansByPage.get(span.pageId)!.push(span);
  }

  public getSpan(spanId: string): EvidenceSpan | undefined {
    return this.spans.get(spanId);
  }

  public hasSpan(spanId: string): boolean {
    return this.spans.has(spanId);
  }

  public getSpans(spanIds: string[]): EvidenceSpan[] {
    const result: EvidenceSpan[] = [];
    for (const id of spanIds) {
      const span = this.getSpan(id);
      if (span) {
        result.push(span);
      }
    }
    return result;
  }

  public getSpansForPage(pageId: string): EvidenceSpan[] {
    return this.spansByPage.get(pageId) || [];
  }

  public getAllSpans(): EvidenceSpan[] {
    return Array.from(this.spans.values());
  }

  public getTextForSpans(spanIds: string[], separator: string = ' '): string {
    return this.getSpans(spanIds)
      .map(s => s.text)
      .join(separator);
  }
}
