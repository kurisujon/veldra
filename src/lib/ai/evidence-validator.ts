/**
 * Evidence Validator for the Veldra extraction pipeline.
 *
 * After Gemini extracts structured fields and Zod validates the schema,
 * this module verifies that extracted values have genuine source evidence
 * in the OCR text. This catches hallucinated values that would otherwise
 * pass schema validation.
 *
 * Principle: DOCUMENT EVIDENCE > MODEL KNOWLEDGE > HEURISTICS
 */

import type { ExtractedField, EvidenceStatus, OCRResult } from './types';

// ---------------------------------------------------------------------------
// Evidence Validation
// ---------------------------------------------------------------------------

interface EvidenceValidationResult {
  /** Updated fields with evidence status set */
  fields: Record<string, ExtractedField>;
  /** Count of fields with verified evidence */
  verifiedCount: number;
  /** Count of fields with uncertain evidence */
  uncertainCount: number;
  /** Count of fields that are missing */
  missingCount: number;
  /** Overall evidence score (0.0 - 1.0) */
  evidenceScore: number;
}

/**
 * Validates extracted field values against OCR source text.
 *
 * For each field, checks whether the claimed sourceText actually appears
 * in the OCR output. If it doesn't, the field is marked 'uncertain'
 * rather than automatically rejected — a single uncertain field triggers
 * manual review rather than document rejection.
 */
export function validateEvidence(
  fields: Record<string, ExtractedField>,
  ocrResult: OCRResult
): EvidenceValidationResult {
  const validatedFields: Record<string, ExtractedField> = {};
  let verifiedCount = 0;
  let uncertainCount = 0;
  let missingCount = 0;
  let totalScorable = 0;
  let totalScore = 0;

  const ocrText = ocrResult.fullText;
  const normalizedOcrText = normalizeForComparison(ocrText);

  for (const [fieldName, field] of Object.entries(fields)) {
    const validated = validateSingleField(field, ocrText, normalizedOcrText);
    validatedFields[fieldName] = validated;

    if (validated.value !== null) {
      totalScorable++;
      switch (validated.status) {
        case 'verified':
          verifiedCount++;
          totalScore += 1.0;
          break;
        case 'uncertain':
          uncertainCount++;
          totalScore += 0.3;
          break;
        case 'unreadable':
          uncertainCount++;
          totalScore += 0.1;
          break;
        case 'missing':
          missingCount++;
          break;
      }
    } else {
      if (validated.status === 'missing') {
        missingCount++;
      }
    }
  }

  const evidenceScore = totalScorable > 0 ? totalScore / totalScorable : 0;

  return {
    fields: validatedFields,
    verifiedCount,
    uncertainCount,
    missingCount,
    evidenceScore,
  };
}

// ---------------------------------------------------------------------------
// Single Field Validation
// ---------------------------------------------------------------------------

function validateSingleField(
  field: ExtractedField,
  ocrText: string,
  normalizedOcrText: string
): ExtractedField {
  // Field with no value — mark as missing
  if (field.value === null || field.value === undefined || field.value === '') {
    return {
      ...field,
      status: 'missing',
      confidence: field.confidence,
    };
  }

  const value = String(field.value);
  const sourceText = field.sourceText;

  // If no sourceText claimed, mark as uncertain
  if (!sourceText) {
    return {
      ...field,
      status: 'uncertain',
      confidence: Math.min(field.confidence ?? 0.5, 0.5),
    };
  }

  // Check if sourceText exists in OCR text
  const evidenceFound = findEvidenceInText(sourceText, ocrText, normalizedOcrText);

  if (evidenceFound === 'exact') {
    return {
      ...field,
      status: 'verified',
      confidence: Math.max(field.confidence ?? 0.8, 0.8),
    };
  }

  if (evidenceFound === 'normalized') {
    // Source text found after normalization — still good but slightly less certain
    return {
      ...field,
      status: 'verified',
      confidence: Math.max(field.confidence ?? 0.7, 0.7),
    };
  }

  if (evidenceFound === 'partial') {
    // Partial match — the value exists but sourceText doesn't exactly match
    return {
      ...field,
      status: 'uncertain',
      confidence: Math.min(field.confidence ?? 0.5, 0.5),
    };
  }

  // No evidence found at all — possible hallucination
  return {
    ...field,
    status: 'uncertain',
    confidence: Math.min(field.confidence ?? 0.3, 0.3),
  };
}

// ---------------------------------------------------------------------------
// Evidence Search
// ---------------------------------------------------------------------------

type EvidenceMatch = 'exact' | 'normalized' | 'partial' | 'none';

function findEvidenceInText(
  sourceText: string,
  ocrText: string,
  normalizedOcrText: string
): EvidenceMatch {
  if (!ocrText || !sourceText) return 'none';

  // Exact match
  if (ocrText.includes(sourceText)) {
    return 'exact';
  }

  const normalizedSource = normalizeForComparison(sourceText);

  // Normalized match (case-insensitive, whitespace-normalized)
  if (normalizedOcrText.includes(normalizedSource)) {
    return 'normalized';
  }

  // Partial match — check if the VALUE (not sourceText) appears
  // This handles cases where sourceText might include surrounding context
  // but the core value is present
  const words = normalizedSource.split(/\s+/).filter(w => w.length > 2);
  if (words.length > 0) {
    const matchedWords = words.filter(word => normalizedOcrText.includes(word));
    const matchRatio = matchedWords.length / words.length;
    if (matchRatio >= 0.7) {
      return 'partial';
    }
  }

  return 'none';
}

// ---------------------------------------------------------------------------
// Text Normalization for Comparison
// ---------------------------------------------------------------------------

/**
 * Normalizes text for evidence comparison.
 * Handles common OCR variations (0/O, 1/l, extra spaces, etc.)
 */
function normalizeForComparison(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/g, ' ')    // Normalize whitespace
    .replace(/['']/g, "'")    // Normalize quotes
    .replace(/[""]/g, '"')    // Normalize double quotes
    .replace(/[\u00A0]/g, ' ') // Non-breaking space
    .trim();
}
