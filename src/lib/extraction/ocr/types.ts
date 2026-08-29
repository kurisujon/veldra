export interface CanonicalBoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface CanonicalOCRBlock {
  id: string; // Internal mapping ID
  text: string;
  normalizedText: string;
  boundingBox: CanonicalBoundingBox;
  confidence: number;
  type: 'word' | 'line' | 'paragraph' | 'key_value' | 'table_cell';
}

export interface CanonicalOCRPage {
  pageNumber: number;
  width: number;
  height: number;
  blocks: CanonicalOCRBlock[];
}

export interface CanonicalEvidenceMap {
  fullText: string;
  pages: CanonicalOCRPage[];
  averageConfidence: number;
  provider: string;
  processingDurationMs: number;
}

export interface OCRProvider {
  name: string;
  
  /**
   * Evaluates if this provider is suitable for the given document and MIME type.
   */
  canHandle(mimeType: string, hasNativeText?: boolean): boolean;
  
  /**
   * Extracts canonical evidence spans from the document buffer.
   */
  extract(buffer: Buffer, mimeType: string): Promise<CanonicalEvidenceMap>;
}
