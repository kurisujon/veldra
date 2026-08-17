/**
 * Extraction Profile Registry.
 *
 * Maps document types to their extraction profiles.
 * Profiles define expected fields, normalization rules, and few-shot examples.
 */

import { PSA_BIRTH_CERTIFICATE_PROFILE, type FieldDefinition, type ExtractionExample } from './psa-birth';

// ---------------------------------------------------------------------------
// Profile Type
// ---------------------------------------------------------------------------

export interface ExtractionProfile {
  documentType: string;
  fields: readonly FieldDefinition[];
  examples: readonly ExtractionExample[];
}

// Re-export types
export type { FieldDefinition, ExtractionExample };

// ---------------------------------------------------------------------------
// Registry
// ---------------------------------------------------------------------------

const PROFILE_REGISTRY: Record<string, ExtractionProfile> = {
  psabirth: PSA_BIRTH_CERTIFICATE_PROFILE,
};

/**
 * Gets the extraction profile for a document type.
 * Returns null if no specific profile exists (the system will use default extraction).
 */
export function getExtractionProfile(documentType: string): ExtractionProfile | null {
  const key = documentType.toLowerCase().replace(/[^a-z0-9]/g, '');
  return PROFILE_REGISTRY[key] ?? null;
}

/**
 * Returns whether a document type has a dedicated extraction profile.
 */
export function hasExtractionProfile(documentType: string): boolean {
  return getExtractionProfile(documentType) !== null;
}
