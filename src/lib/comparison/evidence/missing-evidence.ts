/**
 * Utility to generate explanations for missing documents/fields
 */

export interface EvidenceRequirement {
  description: string;
  found: boolean;
}

export function determineMissingEvidence(requirements: EvidenceRequirement[]): string[] {
  return requirements
    .filter((req) => !req.found)
    .map((req) => req.description);
}
