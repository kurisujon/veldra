import { SupabaseClient } from '@supabase/supabase-js';
import { Database, Json } from '@/types/database';
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
  const { error: pagesError } = await supabase
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
  const { error: spansError } = await supabase
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
  const { data: spansData, error } = await supabase
    .from('ocr_spans')
    .select('*')
    .eq('extraction_id', extractionId);

  if (error) {
    throw new Error(`Failed to hydrate EvidenceMap: ${error.message}`);
  }

  const evidenceMap = new EvidenceMap(extractionId);

  for (const row of spansData) {
    if (!isBoundingBox(row.bounding_box) || !isEvidenceBlockType(row.block_type)) {
      throw new Error(`Invalid canonical evidence span: ${row.id}`);
    }

    const span: EvidenceSpan = {
      id: row.id,
      extractionId: row.extraction_id,
      pageId: row.page_id,
      text: row.text,
      normalizedText: row.normalized_text,
      boundingBox: row.bounding_box,
      ocrConfidence: row.ocr_confidence,
      blockType: row.block_type
    };
    evidenceMap.registerSpan(span);
  }

  return evidenceMap;
}

function isBoundingBox(value: Json | null): value is EvidenceSpan['boundingBox'] {
  if (value === null) return true;
  if (typeof value !== 'object' || Array.isArray(value)) return false;

  return typeof value.x === 'number'
    && typeof value.y === 'number'
    && typeof value.width === 'number'
    && typeof value.height === 'number';
}

function isEvidenceBlockType(value: string | null): value is EvidenceSpan['blockType'] {
  return value === 'word'
    || value === 'line'
    || value === 'paragraph'
    || value === 'key_value'
    || value === 'table_cell';
}
