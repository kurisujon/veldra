import { DocumentField, RelationshipResult } from '../types';
import { buildEvidenceItem, buildEvidenceChain } from '../evidence/build-evidence-chain';
import { determineMissingEvidence } from '../evidence/missing-evidence';

/**
 * Validates 'mother' or 'father' relationships.
 * Chain: Applicant PSA Birth Certificate (Mother/Father Name) -> Sponsor Valid ID (Name)
 */
export function verifyParentRelationship(
  applicantFields: DocumentField[],
  sponsorFields: DocumentField[],
  relationship: 'mother' | 'father'
): RelationshipResult {
  const applicantPsaParentNameField = applicantFields.find(
    (f) =>
      f.document_id.includes('psa') && // Note: In reality, we might match by document type metadata
      f.field_name === (relationship === 'mother' ? 'mother_name' : 'father_name')
  );

  const sponsorIdNameField = sponsorFields.find(
    (f) => f.field_name === 'full_name' || f.field_name === 'name'
  );

  const evidence = buildEvidenceChain([
    buildEvidenceItem(applicantPsaParentNameField, 'Applicant PSA Birth Certificate'),
    buildEvidenceItem(sponsorIdNameField, 'Sponsor Valid ID'),
  ]);

  const missing = determineMissingEvidence([
    {
      description: `Applicant PSA Birth Certificate with ${relationship}'s name`,
      found: !!applicantPsaParentNameField?.raw_value,
    },
    {
      description: 'Sponsor Valid ID with name',
      found: !!sponsorIdNameField?.raw_value,
    },
  ]);

  let status: RelationshipResult['status'] = 'needs_manual_review';
  let confidence = 0;

  if (missing.length > 0) {
    status = 'insufficient_evidence';
  } else if (
    applicantPsaParentNameField?.normalized_value &&
    sponsorIdNameField?.normalized_value &&
    applicantPsaParentNameField.normalized_value === sponsorIdNameField.normalized_value
  ) {
    status = 'verified';
    confidence = 100;
  } else {
    // If we have the fields but they don't match exactly, we flag for manual review
    // A robust system would use fuzzy matching here.
    status = 'needs_manual_review';
    confidence = 50;
  }

  return {
    declared_relationship: relationship,
    status,
    evidence,
    missing_evidence: missing,
    confidence,
  };
}
