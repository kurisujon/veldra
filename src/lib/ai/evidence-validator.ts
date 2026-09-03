/**
 * Deterministic Evidence Validator for Veldra Zero-Trust Architecture (Phase 11.6-E)
 *
 * This module enforces the absolute security boundary between AI extraction and system trust.
 * It verifies that AI candidate values are strictly grounded in canonical OCR evidence.
 */

import type { ExtractedField, EvidenceStatus } from './types';
import { EvidenceMap, EvidenceSpan } from '../extraction/evidence/EvidenceMap';
import { normalizeAddress, normalizeDate } from '../extraction/profiles/normalizers';

export interface EvidenceValidationResult {
  /** Updated fields with deterministic state/status applied */
  fields: Record<string, ExtractedField>;
  /** Count of fields successfully validated as supported candidates */
  verifiedCount: number;
  /** Count of fields explicitly not present */
  missingCount: number;
  /** Count of fields rejected due to fabricated evidence or mismatch */
  rejectedCount: number;
}

/**
 * Normalizes text deterministically to account for basic OCR variations,
 * without allowing arbitrary fuzzy matching.
 */
export function normalizeForComparison(text: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .replace(/\s+/g, ' ') // Normalize whitespace
    .replace(/['']/g, "'") // Normalize quotes
    .replace(/[""]/g, '"') // Normalize double quotes
    .replace(/[\u00A0]/g, ' ') // Non-breaking space
    .trim();
}

/**
 * Validates AI candidates deterministically against the Canonical Evidence Map.
 */
export function validateEvidence(
  fields: Record<string, ExtractedField>,
  evidenceMap: EvidenceMap,
  extractionId: string
): EvidenceValidationResult {
  const validatedFields: Record<string, ExtractedField> = {};
  let verifiedCount = 0;
  let missingCount = 0;
  let rejectedCount = 0;

  for (const [fieldName, field] of Object.entries(fields)) {
    try {
      const validatedField = validateSingleField(fieldName, field, evidenceMap, extractionId);
      validatedFields[fieldName] = validatedField;

      if (validatedField.state === 'not_present') {
        missingCount++;
      } else if (validatedField.state === 'candidate') {
        verifiedCount++;
      } else if (validatedField.state === 'ambiguous' || validatedField.state === 'unreadable') {
        // Track these as valid candidate states but not explicitly verified/missing
      } else {
        rejectedCount++;
      }
    } catch (e) {
      // Invalid candidate evidence is retained only as an ambiguous value for
      // human review; `rejected` is not a valid persisted zero-trust state.
      validatedFields[fieldName] = {
        ...field,
        state: 'ambiguous',
        status: 'uncertain', // fallback for legacy compatibility
        value: null,
        evidenceSpanIds: [], // DO NOT persist invalid spans
      };
      rejectedCount++;
    }
  }

  return {
    fields: validatedFields,
    verifiedCount,
    missingCount,
    rejectedCount,
  };
}

function validateSingleField(
  fieldName: string,
  field: ExtractedField,
  evidenceMap: EvidenceMap,
  extractionId: string
): ExtractedField {
  const state = field.state || 'candidate';
  const spanIds = field.evidenceSpanIds || [];

  // RULE 1: State Consistency
  if (state === 'not_present') {
    // If AI referenced spans to determine absence, strip them — this is safe.
    return { ...field, state: 'not_present', status: 'missing', value: null, confidence: null, evidenceSpanIds: [] };
  }

  if (state === 'candidate') {
    if (spanIds.length === 0) {
      throw new Error('EVIDENCE_INVALID_STATE: candidate state must have evidence spans');
    }
    if (field.value === null || field.value === undefined) {
      throw new Error('EVIDENCE_INVALID_STATE: candidate state must have a value');
    }
  }

  if (state === 'unreadable' || state === 'ambiguous') {
    return { ...field, state, status: 'uncertain', confidence: null };
  }
  
  if (state === 'verified') {
    // Zero-Trust Rule: verified is ONLY set by human approval (Layer 3).
    // AI cannot mark something verified.
    throw new Error('EVIDENCE_INVALID_STATE: AI cannot assert verified state');
  }

  // RULE 2: Validate Span Existence and Isolation
  const resolvedSpans: EvidenceSpan[] = [];
  for (const spanId of spanIds) {
    const span = evidenceMap.getSpan(spanId);
    if (!span) {
      throw new Error('GEMINI_FABRICATED_EVIDENCE: Span ID does not exist in Canonical Evidence Map');
    }
    if (span.extractionId !== extractionId) {
      throw new Error('EVIDENCE_EXTRACTION_MISMATCH: Span belongs to a different extraction');
    }
    resolvedSpans.push(span);
  }

  // RULE 3: Value <-> Evidence Consistency
  // Reconstruct the text exactly from spans
  const combinedEvidenceText = resolvedSpans.map(s => s.text).join(' ');
  const normalizedEvidence = normalizeForComparison(combinedEvidenceText);
  
  let stringValue = '';
  if (typeof field.value === 'string') {
    stringValue = field.value;
  } else if (Array.isArray(field.value) || typeof field.value === 'object') {
    stringValue = JSON.stringify(field.value);
  } else {
    stringValue = String(field.value);
  }

  const normalizedValue = normalizeForComparison(stringValue);

  // For dates, we might need a specific normalizer. But for deterministic validation:
  // We check if the normalized value is contained within the combined normalized evidence.
  // We DO NOT allow semantic matching.
  
  // Example: Candidate Value = "pedro"
  // Canonical Evidence = "juan dela cruz"
  // -> REJECT
  
  const isExactTextMatch = normalizedEvidence.includes(normalizedValue)
    || normalizedValue.includes(normalizedEvidence);
  const isEquivalentDate = isDateField(fieldName)
    && normalizeEvidenceDate(combinedEvidenceText) === normalizeEvidenceDate(stringValue);
  const isEquivalentPsaBirthPlace = fieldName === 'placeOfBirth'
    && normalizePsaBirthPlace(combinedEvidenceText) === normalizePsaBirthPlace(stringValue);

  if (!isExactTextMatch && !isEquivalentDate && !isEquivalentPsaBirthPlace) {
    throw new Error('EVIDENCE_VALUE_MISMATCH: Candidate value is not supported by referenced spans');
  }

  // RULE 4: Discard AI Geometry & Confidence, Adopt Canonical
  // We take the bounding box of the FIRST span as the primary, or merge them.
  // For OCR confidence, we take the average or minimum.
  const ocrConfidence = resolvedSpans.reduce((min, s) => Math.min(min, (s.ocrConfidence ?? 1.0)), 1.0);
  const primaryBox = resolvedSpans[0].boundingBox;

  return {
    ...field,
    state: 'candidate',
    status: 'uncertain', // Always uncertain until human review
    sourceText: combinedEvidenceText, // Enforce canonical text
    boundingBox: primaryBox, // Enforce canonical box
    confidence: ocrConfidence,
    page: 1, // Enforce canonical page (mocked as 1 for now, or extracted from pageId)
  };
}

function isDateField(fieldName: string): boolean {
  return fieldName.toLowerCase().includes('date');
}

function normalizeEvidenceDate(value: string): string | null {
  const directDate = normalizeDate(value);
  if (directDate && /^\d{4}-\d{2}-\d{2}$/.test(directDate)) {
    return directDate;
  }

  const labeledDate = value.match(
    /(?:\(\s*day\s*\)\s*)?(\d{1,2})\s*(?:\(\s*month\s*\)\s*)?([A-Za-z]+)\s*(?:\(\s*year\s*\)\s*)?(\d{4})/i
  );
  const normalizedDate = labeledDate
    ? normalizeDate(`${labeledDate[1]} ${labeledDate[2]} ${labeledDate[3]}`)
    : null;

  return normalizedDate && /^\d{4}-\d{2}-\d{2}$/.test(normalizedDate)
    ? normalizedDate
    : null;
}

function normalizePsaBirthPlace(value: string): string | null {
  const labeledPlace = value.match(
    /^\s*(?:4\.\s*PLACE OF BIRTH\s*)?\(Name of Hospital\s*\/\s*Clinic\s*\/\s*Institution\s*\/\s*House No\.,\s*Street,\s*Barangay\)\s*(.*?)\s*\(City\/Municipality\)\s*(.*?)\s*,?\s*\(Province\)\s*(.*?)\s*$/i
  );

  if (labeledPlace) {
    return normalizePlaceComponents(labeledPlace[1], labeledPlace[2], labeledPlace[3]);
  }

  return normalizePlaceText(value);
}

function normalizePlaceComponents(
  barangayOrAddress: string,
  cityOrMunicipality: string,
  province: string
): string | null {
  return normalizePlaceText(`${barangayOrAddress}, ${cityOrMunicipality}, ${province}`);
}

function normalizePlaceText(value: string): string | null {
  const normalized = normalizeAddress(value);
  return normalized?.replace(/[,.]/g, ' ').replace(/\s+/g, ' ').trim() || null;
}
