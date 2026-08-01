import { DocumentField, EvidenceItem } from '../types';

/**
 * Utility to convert an extracted document field into an EvidenceItem
 */
export function buildEvidenceItem(
  field: DocumentField | undefined | null,
  documentName: string
): EvidenceItem | null {
  if (!field || !field.raw_value) {
    return null;
  }

  return {
    document: documentName,
    field: field.field_name,
    value: field.raw_value,
    normalized: field.normalized_value ?? field.raw_value.toLowerCase().trim(),
  };
}

/**
 * Build an array of evidence items, filtering out nulls
 */
export function buildEvidenceChain(items: (EvidenceItem | null | undefined)[]): EvidenceItem[] {
  return items.filter((item): item is EvidenceItem => item !== null && item !== undefined);
}
