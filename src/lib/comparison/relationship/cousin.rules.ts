import { DocumentField, RelationshipResult } from '../types';
import { buildEvidenceItem, buildEvidenceChain } from '../evidence/build-evidence-chain';
import { determineMissingEvidence } from '../evidence/missing-evidence';

/**
 * Validates first cousin relationships.
 * Chain:
 * 1. Applicant PSA Birth Certificate -> lists Parent A
 * 2. Sponsor PSA Birth Certificate -> lists Parent B
 * 3. Parent A PSA (Intermediate 1) -> lists Grandparents
 * 4. Parent B PSA (Intermediate 2) -> lists Grandparents
 * Condition: Parent A PSA and Parent B PSA share at least one parent (the common grandparents).
 */
export function verifyCousinRelationship(
  applicantFields: DocumentField[],
  sponsorFields: DocumentField[],
  relationship: 'maternal_first_cousin' | 'paternal_first_cousin'
): RelationshipResult {
  const isMaternal = relationship === 'maternal_first_cousin';

  // 1. Applicant PSA Parent (Parent A)
  const appParentField = applicantFields.find(
    (f) =>
      f.document_id.includes('psa') &&
      f.field_name === (isMaternal ? 'mother_name' : 'father_name')
  );

  // 2. Sponsor PSA Parent (Parent B) - could be either mother or father, we'll try to find an intermediate match for either
  const sponMotherName = sponsorFields.find(
    (f) => f.document_id.includes('psa') && f.field_name === 'mother_name'
  );
  const sponFatherName = sponsorFields.find(
    (f) => f.document_id.includes('psa') && f.field_name === 'father_name'
  );

  const allFields = [...applicantFields, ...sponsorFields];

  // 3. Parent A PSA (Intermediate 1)
  const parentA_PsaName = allFields.find(
    (f) =>
      f.document_id.includes('psa') &&
      (f.field_name === 'full_name' || f.field_name === 'name') &&
      f.normalized_value === appParentField?.normalized_value
  );

  const parentA_PsaMother = allFields.find(
    (f) => f.document_id === parentA_PsaName?.document_id && f.field_name === 'mother_name'
  );
  const parentA_PsaFather = allFields.find(
    (f) => f.document_id === parentA_PsaName?.document_id && f.field_name === 'father_name'
  );

  // 4. Parent B PSA (Intermediate 2)
  const parentB_PsaName = allFields.find(
    (f) =>
      f.document_id.includes('psa') &&
      (f.field_name === 'full_name' || f.field_name === 'name') &&
      (f.normalized_value === sponMotherName?.normalized_value ||
        f.normalized_value === sponFatherName?.normalized_value) &&
      f.document_id !== parentA_PsaName?.document_id // ensure it's a different doc
  );

  const parentB_PsaMother = allFields.find(
    (f) => f.document_id === parentB_PsaName?.document_id && f.field_name === 'mother_name'
  );
  const parentB_PsaFather = allFields.find(
    (f) => f.document_id === parentB_PsaName?.document_id && f.field_name === 'father_name'
  );

  const evidence = buildEvidenceChain([
    buildEvidenceItem(appParentField, `Applicant PSA (${isMaternal ? 'Mother' : 'Father'})`),
    buildEvidenceItem(sponMotherName, 'Sponsor PSA (Mother)'),
    buildEvidenceItem(sponFatherName, 'Sponsor PSA (Father)'),
    buildEvidenceItem(parentA_PsaName, 'Applicant Parent PSA (Owner)'),
    buildEvidenceItem(parentA_PsaMother, 'Applicant Parent PSA (Mother/Grandmother)'),
    buildEvidenceItem(parentA_PsaFather, 'Applicant Parent PSA (Father/Grandfather)'),
    buildEvidenceItem(parentB_PsaName, 'Sponsor Parent PSA (Owner)'),
    buildEvidenceItem(parentB_PsaMother, 'Sponsor Parent PSA (Mother/Grandmother)'),
    buildEvidenceItem(parentB_PsaFather, 'Sponsor Parent PSA (Father/Grandfather)'),
  ]);

  const missing = determineMissingEvidence([
    {
      description: `Applicant PSA Birth Certificate with ${isMaternal ? 'mother' : 'father'} name`,
      found: !!appParentField?.raw_value,
    },
    {
      description: 'Sponsor PSA Birth Certificate with parent names',
      found: !!(sponMotherName?.raw_value || sponFatherName?.raw_value),
    },
    {
      description: 'Applicant Parent PSA Birth Certificate (Intermediate 1)',
      found: !!parentA_PsaName?.raw_value,
    },
    {
      description: 'Applicant Parent PSA Birth Certificate with grandparent names',
      found: !!(parentA_PsaMother?.raw_value || parentA_PsaFather?.raw_value),
    },
    {
      description: 'Sponsor Parent PSA Birth Certificate (Intermediate 2)',
      found: !!parentB_PsaName?.raw_value,
    },
    {
      description: 'Sponsor Parent PSA Birth Certificate with grandparent names',
      found: !!(parentB_PsaMother?.raw_value || parentB_PsaFather?.raw_value),
    },
  ]);

  let status: RelationshipResult['status'] = 'needs_manual_review';
  let confidence = 0;

  if (missing.length > 0) {
    status = 'insufficient_evidence';
  } else {
    const motherMatch =
      parentA_PsaMother?.normalized_value &&
      parentB_PsaMother?.normalized_value &&
      parentA_PsaMother.normalized_value === parentB_PsaMother.normalized_value;

    const fatherMatch =
      parentA_PsaFather?.normalized_value &&
      parentB_PsaFather?.normalized_value &&
      parentA_PsaFather.normalized_value === parentB_PsaFather.normalized_value;

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
