/**
 * Phase 10 — Relationship Constants
 * Single source of truth for all approved sponsor relationships in Veldra.
 * Import from here — never duplicate this list in UI, Zod, or DB rules.
 */

import type { ApprovedSponsorRelationship } from '../types'

export const APPROVED_SPONSOR_RELATIONSHIPS: ApprovedSponsorRelationship[] = [
  'mother',
  'father',
  'sister',
  'brother',
  'grandmother',
  'grandfather',
  'maternal_aunt',
  'maternal_uncle',
  'paternal_aunt',
  'paternal_uncle',
  'niece',
  'nephew',
  'maternal_first_cousin',
  'paternal_first_cousin',
] as const

/** Human-readable labels for UI display */
export const RELATIONSHIP_LABELS: Record<ApprovedSponsorRelationship, string> = {
  mother: 'Mother',
  father: 'Father',
  sister: 'Sister',
  brother: 'Brother',
  grandmother: 'Grandmother',
  grandfather: 'Grandfather',
  maternal_aunt: 'Maternal Aunt',
  maternal_uncle: 'Maternal Uncle',
  paternal_aunt: 'Paternal Aunt',
  paternal_uncle: 'Paternal Uncle',
  niece: 'Niece',
  nephew: 'Nephew',
  maternal_first_cousin: 'Maternal First Cousin',
  paternal_first_cousin: 'Paternal First Cousin',
}

/** Relationships where evidence chain starts from Applicant PSA parent names */
export const PARENT_RELATIONSHIPS: ApprovedSponsorRelationship[] = ['mother', 'father']

/** Relationships that require a shared parent (both PSAs needed) */
export const SIBLING_RELATIONSHIPS: ApprovedSponsorRelationship[] = ['sister', 'brother']

/** Relationships requiring an intermediate parent document */
export const EXTENDED_FAMILY_RELATIONSHIPS: ApprovedSponsorRelationship[] = [
  'grandmother',
  'grandfather',
  'maternal_aunt',
  'maternal_uncle',
  'paternal_aunt',
  'paternal_uncle',
  'niece',
  'nephew',
  'maternal_first_cousin',
  'paternal_first_cousin',
]

/**
 * Normalizes a raw relationship string from UI/DB into an ApprovedSponsorRelationship.
 * Returns null if the relationship is not in the approved list.
 */
export function normalizeRelationship(raw: string): ApprovedSponsorRelationship | null {
  const normalized = raw.toLowerCase().replace(/[\s-]/g, '_') as ApprovedSponsorRelationship
  return APPROVED_SPONSOR_RELATIONSHIPS.includes(normalized) ? normalized : null
}
