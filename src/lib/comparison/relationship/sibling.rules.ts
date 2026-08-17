import { DocumentField, RelationshipResult } from '../types';
import { buildEvidenceItem, buildEvidenceChain } from '../evidence/build-evidence-chain';
import { determineMissingEvidence } from '../evidence/missing-evidence';

/**
 * Validates 'brother' or 'sister' relationships.
 * Chain: Applicant PSA Birth Certificate (Parents) -> Sponsor PSA Birth Certificate (Parents)
 * Condition: Must share at least one parent (mother or father)
 */
export function verifySiblingRelationship(
  applicantFields: DocumentField[],
  sponsorFields: DocumentField[],
  relationship: 'brother' | 'sister'
): RelationshipResult {
  const appMother = applicantFields.find(
    (f) => f.document_id.includes('psa') && f.field_name === 'mother_name'
  );
  const appFather = applicantFields.find(
    (f) => f.document_id.includes('psa') && f.field_name === 'father_name'
  );

  const sponMother = sponsorFields.find(
    (f) => f.document_id.includes('psa') && f.field_name === 'mother_name'
  );
  const sponFather = sponsorFields.find(
    (f) => f.document_id.includes('psa') && f.field_name === 'father_name'
  );

  const evidence = buildEvidenceChain([
    buildEvidenceItem(appMother, 'Applicant PSA Birth Certificate (Mother)'),
    buildEvidenceItem(appFather, 'Applicant PSA Birth Certificate (Father)'),
    buildEvidenceItem(sponMother, 'Sponsor PSA Birth Certificate (Mother)'),
    buildEvidenceItem(sponFather, 'Sponsor PSA Birth Certificate (Father)'),
  ]);

  const missing = determineMissingEvidence([
    {
      description: 'Applicant PSA Birth Certificate with at least one parent name',
      found: !!(appMother?.raw_value || appFather?.raw_value),
    },
    {
      description: 'Sponsor PSA Birth Certificate with at least one parent name',
      found: !!(sponMother?.raw_value || sponFather?.raw_value),
    },
  ]);

  let status: RelationshipResult['status'] = 'needs_manual_review';
  let confidence = 0;

  if (missing.length > 0) {
    status = 'insufficient_evidence';
  } else {
    const motherMatch =
      appMother?.normalized_value &&
      sponMother?.normalized_value &&
      appMother.normalized_value === sponMother.normalized_value;

    const fatherMatch =
      appFather?.normalized_value &&
      sponFather?.normalized_value &&
      appFather.normalized_value === sponFather.normalized_value;

    if (motherMatch && fatherMatch) {
      status = 'verified';
      confidence = 100;
    } else if (motherMatch || fatherMatch) {
      status = 'partially_supported'; // Half-siblings are generally accepted but might need review
      confidence = 80;
    } else {
      // Neither parent matches. 
      // If father is completely missing on either document, it could be a paternal half-sibling without AUSF.
      const isFatherMissing = !appFather?.raw_value || !sponFather?.raw_value;
      if (isFatherMissing) {
        status = 'insufficient_evidence';
        confidence = 10;
        missing.push({
          description: 'Joint Affidavit of Two Disinterested Persons (required because the father field is missing on the PSA Birth Certificate, preventing paternal link verification)',
          found: false
        });
      } else {
        // Both fathers are present and both mothers are present, but NEITHER match.
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
