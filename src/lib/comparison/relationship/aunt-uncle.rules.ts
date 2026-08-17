import { DocumentField, RelationshipResult } from '../types';
import { buildEvidenceItem, buildEvidenceChain } from '../evidence/build-evidence-chain';
import { determineMissingEvidence } from '../evidence/missing-evidence';

/**
 * Validates aunt/uncle relationships.
 * Chain:
 * 1. Applicant PSA Birth Certificate -> lists Parent Name (Mother for maternal, Father for paternal)
 * 2. Parent PSA Birth Certificate (Intermediate) -> Owner name matches Parent Name, lists Grandparents
 * 3. Sponsor PSA Birth Certificate -> Lists Grandparents
 * Condition: Sponsor PSA and Parent PSA must share at least one parent (the grandparents).
 */
export function verifyAuntUncleRelationship(
  applicantFields: DocumentField[],
  sponsorFields: DocumentField[],
  relationship: 'maternal_aunt' | 'maternal_uncle' | 'paternal_aunt' | 'paternal_uncle'
): RelationshipResult {
  const isMaternal = relationship.startsWith('maternal');

  // 1. Applicant's Parent Name
  const appParentField = applicantFields.find(
    (f) =>
      f.document_id.includes('psa') &&
      f.field_name === (isMaternal ? 'mother_name' : 'father_name')
  );

  // 2. Intermediate Parent PSA
  const parentPsaName = applicantFields.find(
    (f) =>
      f.document_id.includes('psa') &&
      (f.field_name === 'full_name' || f.field_name === 'name') &&
      f.normalized_value === appParentField?.normalized_value
  );

  const parentPsaMother = applicantFields.find(
    (f) => f.document_id === parentPsaName?.document_id && f.field_name === 'mother_name'
  );
  const parentPsaFather = applicantFields.find(
    (f) => f.document_id === parentPsaName?.document_id && f.field_name === 'father_name'
  );

  // 3. Sponsor PSA
  const sponPsaMother = sponsorFields.find(
    (f) => f.document_id.includes('psa') && f.field_name === 'mother_name'
  );
  const sponPsaFather = sponsorFields.find(
    (f) => f.document_id.includes('psa') && f.field_name === 'father_name'
  );

  const evidence = buildEvidenceChain([
    buildEvidenceItem(appParentField, `Applicant PSA (${isMaternal ? 'Mother' : 'Father'})`),
    buildEvidenceItem(parentPsaName, 'Intermediate Parent PSA (Owner)'),
    buildEvidenceItem(parentPsaMother, 'Intermediate Parent PSA (Mother/Grandmother)'),
    buildEvidenceItem(parentPsaFather, 'Intermediate Parent PSA (Father/Grandfather)'),
    buildEvidenceItem(sponPsaMother, 'Sponsor PSA (Mother/Grandmother)'),
    buildEvidenceItem(sponPsaFather, 'Sponsor PSA (Father/Grandfather)'),
  ]);

  const missing = determineMissingEvidence([
    {
      description: `Applicant PSA Birth Certificate with ${isMaternal ? 'mother' : 'father'} name`,
      found: !!appParentField?.raw_value,
    },
    {
      description: 'Intermediate Parent PSA Birth Certificate (matching applicant parent)',
      found: !!parentPsaName?.raw_value,
    },
    {
      description: 'Intermediate Parent PSA Birth Certificate with grandparent names',
      found: !!(parentPsaMother?.raw_value || parentPsaFather?.raw_value),
    },
    {
      description: 'Sponsor PSA Birth Certificate with grandparent names',
      found: !!(sponPsaMother?.raw_value || sponPsaFather?.raw_value),
    },
  ]);

  let status: RelationshipResult['status'] = 'needs_manual_review';
  let confidence = 0;

  if (missing.length > 0) {
    status = 'insufficient_evidence';
  } else {
    const motherMatch =
      parentPsaMother?.normalized_value &&
      sponPsaMother?.normalized_value &&
      parentPsaMother.normalized_value === sponPsaMother.normalized_value;

    const fatherMatch =
      parentPsaFather?.normalized_value &&
      sponPsaFather?.normalized_value &&
      parentPsaFather.normalized_value === sponPsaFather.normalized_value;

    if (motherMatch && fatherMatch) {
      status = 'verified';
      confidence = 100;
    } else if (motherMatch || fatherMatch) {
      status = 'partially_supported';
      confidence = 80;
    } else {
      // Neither grandparent matches.
      // If grandfather is completely missing on either document, it could be a paternal half-sibling without AUSF.
      const isFatherMissing = !parentPsaFather?.raw_value || !sponPsaFather?.raw_value;
      if (isFatherMissing) {
        status = 'insufficient_evidence';
        confidence = 10;
        missing.push({
          description: 'Joint Affidavit of Two Disinterested Persons (required because the grandfather field is missing on the PSA Birth Certificate, preventing paternal link verification)',
          found: false
        });
      } else {
        // Both grandfathers are present and both grandmothers are present, but NEITHER match.
        status = 'conflicting_evidence';
        confidence = 0;
      }
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
