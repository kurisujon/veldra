import { DocumentField } from './types';

/**
 * LAYER 3 ZERO-TRUST BOUNDARY
 * 
 * This helper ensures that ONLY verified document fields enter the comparison engine.
 * It strictly rejects:
 * - candidate
 * - needs_review
 * - unreadable
 * - ambiguous
 * - not_present
 * - rejected
 * - legacy unverified extraction data (missing state, null, undefined)
 */
export function getVerifiedFields(fields: DocumentField[]): DocumentField[] {
  return fields.filter(field => field.state === 'verified');
}
