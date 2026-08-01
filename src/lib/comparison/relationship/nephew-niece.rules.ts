import { DocumentField, RelationshipResult } from '../types';
import { buildEvidenceItem, buildEvidenceChain } from '../evidence/build-evidence-chain';
import { determineMissingEvidence } from '../evidence/missing-evidence';

/**
 * Validates 'niece' or 'nephew' relationships.
 * Chain:
 * 1. Sponsor PSA Birth Certificate -> lists Parent Name (the sibling of the Applicant)
 * 2. Sponsor's Parent PSA (Intermediate) -> Owner name matches Sponsor's Parent Name, lists Grandparents
 * 3. Applicant PSA Birth Certificate -> Lists Grandparents
 * Condition: Applicant PSA and Sponsor's Parent PSA must share at least one parent (the grandparents).
 */
export function verifyNephewNieceRelationship(
  applicantFields: DocumentField[],
  sponsorFields: DocumentField[],
  relationship: 'niece' | 'nephew'
): RelationshipResult {
  // 1. Sponsor's Parent Names
  const sponMotherName = sponsorFields.find(
    (f) => f.document_id.includes('psa') && f.field_name === 'mother_name'
  );
  const sponFatherName = sponsorFields.find(
    (f) => f.document_id.includes('psa') && f.field_name === 'father_name'
  );

  // 2. Intermediate Parent PSA (could be in sponsorFields)
  // We need to find a PSA where the owner name matches either the Sponsor's Mother or Father
  const allFields = [...applicantFields, ...sponsorFields];
  const parentPsaName = allFields.find(
    (f) =>
      f.document_id.includes('psa') &&
      (f.field_name === 'full_name' || f.field_name === 'name') &&
      (f.normalized_value === sponMotherName?.normalized_value ||
        f.normalized_value === sponFatherName?.normalized_value)
  );

  const parentPsaMother = allFields.find(
    (f) => f.document_id === parentPsaName?.document_id && f.field_name === 'mother_name'
  );
  const parentPsaFather = allFields.find(
    (f) => f.document_id === parentPsaName?.document_id && f.field_name === 'father_name'
  );

  // 3. Applicant PSA
  const appPsaMother = applicantFields.find(
    (f) =>
      f.document_id.includes('psa') &&
      f.field_name === 'mother_name' &&
      f.document_id !== parentPsaName?.document_id
  );
  const appPsaFather = applicantFields.find(
    (f) =>
      f.document_id.includes('psa') &&
      f.field_name === 'father_name' &&
      f.document_id !== parentPsaName?.document_id
  );

  const evidence = buildEvidenceChain([
    buildEvidenceItem(sponMotherName, 'Sponsor PSA (Mother)'),
    buildEvidenceItem(sponFatherName, 'Sponsor PSA (Father)'),
    buildEvidenceItem(parentPsaName, "Sponsor's Parent PSA (Owner)"),
    buildEvidenceItem(parentPsaMother, "Sponsor's Parent PSA (Mother/Grandmother)"),
    buildEvidenceItem(parentPsaFather, "Sponsor's Parent PSA (Father/Grandfather)"),
    buildEvidenceItem(appPsaMother, 'Applicant PSA (Mother/Grandmother)'),
    buildEvidenceItem(appPsaFather, 'Applicant PSA (Father/Grandfather)'),
  ]);

  const missing = determineMissingEvidence([
    {
      description: 'Sponsor PSA Birth Certificate with parent names',
      found: !!(sponMotherName?.raw_value || sponFatherName?.raw_value),
    },
    {
      description: "Sponsor's Parent PSA Birth Certificate (Intermediate)",
      found: !!parentPsaName?.raw_value,
    },
    {
      description: "Sponsor's Parent PSA Birth Certificate with grandparent names",
      found: !!(parentPsaMother?.raw_value || parentPsaFather?.raw_value),
    },
    {
      description: 'Applicant PSA Birth Certificate with grandparent names',
      found: !!(appPsaMother?.raw_value || appPsaFather?.raw_value),
    },
  ]);

  let status: RelationshipResult['status'] = 'needs_manual_review';
  let confidence = 0;

  if (missing.length > 0) {
    status = 'insufficient_evidence';
  } else {
    const motherMatch =
      parentPsaMother?.normalized_value &&
      appPsaMother?.normalized_value &&
      parentPsaMother.normalized_value === appPsaMother.normalized_value;

    const fatherMatch =
      parentPsaFather?.normalized_value &&
      appPsaFather?.normalized_value &&
      parentPsaFather.normalized_value === appPsaFather.normalized_value;

    if (motherMatch && fatherMatch) {
      status = 'verified';
      confidence = 100;
    } else if (motherMatch || fatherMatch) {
      status = 'partially_supported';
      confidence = 80;
    } else {
      status = 'needs_manual_review';
      confidence = 30;
    }
  }

  return {
    declared_relationship: relationship,
    status,
    evidence,
    missing_evidence: missing,
    confidence,
  };
}
