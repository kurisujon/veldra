/**
 * Field normalization for the Veldra extraction pipeline.
 *
 * Normalizes raw extracted values into canonical forms for:
 * - Dates → YYYY-MM-DD ISO format
 * - Names → Preserved spelling with consistent casing
 * - Identifiers → Cleaned whitespace
 *
 * Preserves the raw value for auditability while producing
 * a normalized value for comparison logic.
 */

import type { ExtractedField } from './types';

import { Registry } from '../extraction/profiles/registry';
import { applyNormalization } from '../extraction/profiles/normalizers';

// ---------------------------------------------------------------------------
// Normalization Entry Point
// ---------------------------------------------------------------------------

/**
 * Normalizes all fields in an extraction result.
 * Produces normalized values while preserving raw values for auditability.
 */
export function normalizeFields(
  fields: Record<string, ExtractedField>,
  documentType: string
): Record<string, ExtractedField> {
  const normalized: Record<string, ExtractedField> = {};
  
  const profile = Registry.getProfile(documentType);

  for (const [fieldName, field] of Object.entries(fields)) {
    // If we have a profile, use its explicit normalization strategy.
    // Otherwise fallback to EXACT (no-op).
    const strategy = profile?.fields[fieldName]?.normalization || 'EXACT';
    normalized[fieldName] = normalizeField(fieldName, field, strategy);
  }

  return normalized;
}

// ---------------------------------------------------------------------------
// Single Field Normalization
// ---------------------------------------------------------------------------

function normalizeField(
  fieldName: string,
  field: ExtractedField,
  strategy: any
): ExtractedField {
  if (field.value === null || field.value === undefined) {
    return field;
  }

  const value = String(field.value);
  const normalizedValue = applyNormalization(value, strategy) || value;

  return {
    ...field,
    // The `value` field holds the normalized value going forward
    // The `sourceText` retains what was actually read from the document
    value: normalizedValue,
  };
}

