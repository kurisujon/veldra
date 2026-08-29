import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/database';
import { CanonicalEvidenceMap } from '../ocr/types';
import { EvidenceMap, EvidenceSpan } from './EvidenceMap';
import { v4 as uuidv4 } from 'uuid';

export async function persistCanonicalEvidence(
  supabase: SupabaseClient<Database>,
  extractionId: string,
  canonicalMap: CanonicalEvidenceMap
): Promise<EvidenceMap> {
  // 1. Generate page IDs and map pages
  const pageInserts = canonicalMap.pages.map((page) => {
    return {
      id: uuidv4(),
      extraction_id: extractionId,
      page_number: page.pageNumber,
      width: page.width,
      height: page.height,
      provider_metadata: { provider: canonicalMap.provider }
    };
  });

  const pageIds = pageInserts.map(p => p.id);

  // Insert pages
  const { error: pagesError } = await (supabase as any)
    .from('ocr_pages')
    .insert(pageInserts);

  if (pagesError) {
    throw new Error(`Failed to persist OCR pages: ${pagesError.message}`);
  }

  // 2. Generate EvidenceMap to normalize spans
  const evidenceMap = EvidenceMap.fromCanonicalProviderMap(extractionId, canonicalMap, pageIds);
  const spans = evidenceMap.getAllSpans();

  if (spans.length === 0) {
    return evidenceMap; // Empty document
  }

  // 3. Map to DB inserts
  const spanInserts = spans.map((span) => {
    return {
      id: span.id,
      extraction_id: span.extractionId,
      page_id: span.pageId,
      text: span.text,
      normalized_text: span.normalizedText,
      bounding_box: span.boundingBox,
      ocr_confidence: span.ocrConfidence,
      block_type: span.blockType
    };
  });

  // Supabase bulk insert limit is typically quite high, but for massive documents 
  // we might need chunking in a real production system. Assuming standard IDs here.
  const { error: spansError } = await (supabase as any)
    .from('ocr_spans')
    .insert(spanInserts);

  if (spansError) {
    throw new Error(`Failed to persist OCR spans: ${spansError.message}`);
  }

  return evidenceMap;
}

export async function hydrateEvidenceMap(
  supabase: SupabaseClient<Database>,
  extractionId: string
): Promise<EvidenceMap> {
  const { data: spansData, error } = await (supabase as any)
    .from('ocr_spans')
    .select('*')
    .eq('extraction_id', extractionId);

  if (error) {
    throw new Error(`Failed to hydrate EvidenceMap: ${error.message}`);
  }

  const evidenceMap = new EvidenceMap(extractionId);

  spansData.forEach((row: any) => {
    const span: EvidenceSpan = {
      id: row.id,
      extractionId: row.extraction_id,
      pageId: row.page_id,
      text: row.text,
      normalizedText: row.normalized_text,
      boundingBox: row.bounding_box as any, // Type cast for JSONB
      ocrConfidence: row.ocr_confidence,
      blockType: row.block_type as any
    };
    evidenceMap.registerSpan(span);
  });

  return evidenceMap;
}
