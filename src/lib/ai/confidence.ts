/**
 * Multi-signal confidence scoring for the Veldra extraction pipeline.
 *
 * The confidence score is NOT a scientifically calibrated probability.
 * It is an internal quality score based on multiple signals that determines
 * whether a field should be automatically accepted, flagged, or sent
 * to manual review.
 *
 * Signals:
 * - OCR confidence (from the OCR engine)
 * - Extraction confidence (from Gemini)
 * - Evidence found (does sourceText appear in OCR text?)
 * - Evidence exactness (exact match vs normalized match vs partial)
 * - Field validation (does the value make structural sense?)
 * - Document quality (clear vs degraded vs poor)
 */

import type { ExtractedField, DocumentQuality, EvidenceStatus } from './types';

// ---------------------------------------------------------------------------
// Confidence Thresholds
// ---------------------------------------------------------------------------

export const CONFIDENCE_THRESHOLDS = {
  /** Fields above this are automatically accepted */
  HIGH: 0.85,
  /** Fields between MEDIUM and HIGH are accepted but flagged */
  MEDIUM: 0.6,
  /** Fields below MEDIUM require manual review */
  LOW: 0.4,
} as const;

// ---------------------------------------------------------------------------
// Field-Level Confidence
// ---------------------------------------------------------------------------

interface ConfidenceSignals {
  /** Confidence from the OCR engine (0-1), null if unavailable */
  ocrConfidence: number | null;
  /** Confidence reported by Gemini (0-1), null if unavailable */
  extractionConfidence: number | null;
  /** Whether evidence was found in OCR text */
  evidenceStatus: EvidenceStatus;
  /** Document quality assessment */
  documentQuality: DocumentQuality;
  /** Whether the field value passes structural validation */
  structurallyValid: boolean;
}

/**
 * Computes a unified confidence score from multiple signals.
 *
 * Returns a score between 0.0 and 1.0 where:
 * - >= 0.85: High confidence (auto-accept)
 * - 0.6 - 0.85: Medium confidence (accept but flag)
 * - < 0.6: Low confidence (manual review)
 */
export function computeFieldConfidence(signals: ConfidenceSignals): number {
  let score = 0.5; // Base score
  let totalWeight = 0;
  let weightedSum = 0;

  // Evidence status is the strongest signal (weight: 4)
  const evidenceWeight = 4;
  totalWeight += evidenceWeight;
  switch (signals.evidenceStatus) {
    case 'verified':
      weightedSum += evidenceWeight * 1.0;
      break;
    case 'uncertain':
      weightedSum += evidenceWeight * 0.35;
      break;
    case 'missing':
      weightedSum += evidenceWeight * 0.0;
      break;
    case 'unreadable':
      weightedSum += evidenceWeight * 0.15;
      break;
  }

  // Extraction confidence from Gemini (weight: 2)
  if (signals.extractionConfidence !== null) {
    const extractionWeight = 2;
    totalWeight += extractionWeight;
    weightedSum += extractionWeight * signals.extractionConfidence;
  }

  // OCR confidence (weight: 1.5)
  if (signals.ocrConfidence !== null) {
    const ocrWeight = 1.5;
    totalWeight += ocrWeight;
    weightedSum += ocrWeight * signals.ocrConfidence;
  }

  // Document quality (weight: 1)
  const qualityWeight = 1;
  totalWeight += qualityWeight;
  switch (signals.documentQuality) {
    case 'clear':
      weightedSum += qualityWeight * 1.0;
      break;
    case 'degraded':
      weightedSum += qualityWeight * 0.6;
      break;
    case 'poor':
      weightedSum += qualityWeight * 0.3;
      break;
  }

  // Structural validity (weight: 1)
  const structuralWeight = 1;
  totalWeight += structuralWeight;
  weightedSum += structuralWeight * (signals.structurallyValid ? 1.0 : 0.2);

  // Compute weighted average
  score = totalWeight > 0 ? weightedSum / totalWeight : 0.5;

  // Clamp to [0.0, 1.0]
  return Math.max(0.0, Math.min(1.0, score));
}

// ---------------------------------------------------------------------------
// Document-Level Confidence
// ---------------------------------------------------------------------------

/**
 * Computes an overall document confidence score from all field confidences.
 */
export function computeDocumentConfidence(
  fields: Record<string, ExtractedField>
): number {
  const entries = Object.values(fields);
  const scorableFields = entries.filter(
    f => f.value !== null && f.status !== 'missing'
  );

  if (scorableFields.length === 0) return 0;

  const totalConfidence = scorableFields.reduce(
    (sum, f) => sum + (f.confidence ?? 0),
    0
  );

  // Use harmonic-like mean to penalize low outliers more heavily
  // This ensures a single very-low-confidence field pulls the overall score down
  const avgConfidence = totalConfidence / scorableFields.length;

  const minConfidence = Math.min(
    ...scorableFields.map(f => f.confidence ?? 0)
  );

  // Blend average and minimum — the min pulls down the overall score
  return avgConfidence * 0.7 + minConfidence * 0.3;
}

// ---------------------------------------------------------------------------
// Confidence-to-Action Mapping
// ---------------------------------------------------------------------------

export type ConfidenceAction =
  | 'auto_accept'     // High confidence, no review needed
  | 'accept_flagged'  // Medium confidence, accepted but flagged for awareness
  | 'manual_review';  // Low confidence, requires human inspection

/**
 * Determines what action to take based on a confidence score.
 */
export function getConfidenceAction(confidence: number): ConfidenceAction {
  if (confidence >= CONFIDENCE_THRESHOLDS.HIGH) return 'auto_accept';
  if (confidence >= CONFIDENCE_THRESHOLDS.MEDIUM) return 'accept_flagged';
  return 'manual_review';
}

// ---------------------------------------------------------------------------
// Structural Validators
// ---------------------------------------------------------------------------

/**
 * Basic structural validation for common field types.
 * This does NOT validate correctness — only that the format makes sense.
 */
export function isStructurallyValid(fieldName: string, value: string): boolean {
  const name = fieldName.toLowerCase();

  // Date fields should look like dates
  if (name.includes('date') || name === 'dateofbirth' || name === 'dateofregistration') {
    return isPlausibleDate(value);
  }

  // Name fields should contain alphabetic characters
  if (name.includes('name') || name.includes('firstname') || name.includes('lastname')) {
    return isPlausibleName(value);
  }

  // Registry/certificate numbers should contain alphanumeric characters
  if (name.includes('number') || name.includes('registry') || name.includes('certificate')) {
    return isPlausibleIdentifier(value);
  }

  // Default: if it has content, it's structurally valid
  return value.trim().length > 0;
}

function isPlausibleDate(value: string): boolean {
  // Accept common date formats
  const datePatterns = [
    /^\d{4}-\d{2}-\d{2}$/,                    // ISO: 2000-01-15
    /^\d{1,2}\/\d{1,2}\/\d{2,4}$/,            // US: 1/15/2000
    /^\d{1,2}-\d{1,2}-\d{2,4}$/,              // Dash: 15-01-2000
    /^[A-Za-z]+\s+\d{1,2},?\s+\d{4}$/,        // Month Day, Year: January 15, 2000
    /^\d{1,2}\s+[A-Za-z]+\s+\d{4}$/,          // Day Month Year: 15 January 2000
    /^[A-Za-z]+\s+\d{1,2}\s+\d{4}$/,          // Month Day Year: January 15 2000
  ];
  return datePatterns.some(p => p.test(value.trim()));
}

function isPlausibleName(value: string): boolean {
  // Names should be mostly alphabetic (allowing spaces, hyphens, apostrophes, periods)
  const cleaned = value.replace(/[^a-zA-ZÀ-ÿ\s\-'.]/g, '');
  return cleaned.length > 0 && cleaned.length >= value.length * 0.7;
}

function isPlausibleIdentifier(value: string): boolean {
  // Identifiers should contain alphanumeric characters
  const cleaned = value.replace(/[^a-zA-Z0-9\-]/g, '');
  return cleaned.length > 0;
}
