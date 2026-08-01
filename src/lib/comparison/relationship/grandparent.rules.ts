import { DocumentField, RelationshipResult } from '../types';
import { buildEvidenceItem, buildEvidenceChain } from '../evidence/build-evidence-chain';
import { determineMissingEvidence } from '../evidence/missing-evidence';

/**
 * Validates 'grandmother' or 'grandfather' relationships.
 * Chain:
 * 1. Applicant PSA Birth Certificate -> lists Parent Name
 * 2. Parent PSA Birth Certificate (Intermediate) -> Name matches Parent Name, lists Grandparent Name
 * 3. Sponsor Valid ID -> Name matches Grandparent Name
 */
export function verifyGrandparentRelationship(
  applicantFields: DocumentField[],
  sponsorFields: DocumentField[],
  relationship: 'grandmother' | 'grandfather'
): RelationshipResult {
  // 1. Find applicant's parents from their PSA
  const appMother = applicantFields.find(
    (f) => f.document_id.includes('psa') && f.field_name === 'mother_name' // Ideally, filter by primary applicant's PSA
  );
  const appFather = applicantFields.find(
    (f) => f.document_id.includes('psa') && f.field_name === 'father_name'
  );

  // 2. Find the intermediate parent's PSA (we assume it's in applicantFields with a full_name or name field)
  // In a real system, we might use document metadata to find the parent's PSA explicitly.
  const parentPsaName = applicantFields.find(
    (f) => f.document_id.includes('psa') && (f.field_name === 'full_name' || f.field_name === 'name')
  );

  // We need to know which parent the intermediate PSA belongs to
  const intermediateIsMother =
    parentPsaName?.normalized_value &&
    appMother?.normalized_value &&
    parentPsaName.normalized_value === appMother.normalized_value;

  const intermediateIsFather =
    parentPsaName?.normalized_value &&
    appFather?.normalized_value &&
    parentPsaName.normalized_value === appFather.normalized_value;

  // 3. Find the grandparent's name from the intermediate PSA
  // It has to be in the same document as the parentPsaName
  const parentPsaMother = applicantFields.find(
    (f) => f.document_id === parentPsaName?.document_id && f.field_name === 'mother_name'
  );
  const parentPsaFather = applicantFields.find(
    (f) => f.document_id === parentPsaName?.document_id && f.field_name === 'father_name'
  );

  // Target grandparent field based on relationship
  const targetGrandparentField =
    relationship === 'grandmother' ? parentPsaMother : parentPsaFather;

  // 4. Find the Sponsor ID Name
  const sponsorIdName = sponsorFields.find(
    (f) => f.field_name === 'full_name' || f.field_name === 'name'
  );

  const evidence = buildEvidenceChain([
    buildEvidenceItem(appMother, 'Applicant PSA (Mother)'),
    buildEvidenceItem(appFather, 'Applicant PSA (Father)'),
    buildEvidenceItem(parentPsaName, 'Intermediate Parent PSA (Owner)'),
    buildEvidenceItem(targetGrandparentField, `Intermediate Parent PSA (${relationship})`),
    buildEvidenceItem(sponsorIdName, 'Sponsor Valid ID'),
  ]);

  const missing = determineMissingEvidence([
    {
      description: 'Applicant PSA Birth Certificate with parent names',
      found: !!(appMother?.raw_value || appFather?.raw_value),
    },
    {
      description: 'Intermediate Parent PSA Birth Certificate (matching one of the applicant parents)',
      found: !!parentPsaName?.raw_value && (!!intermediateIsMother || !!intermediateIsFather),
    },
    {
      description: `Intermediate Parent PSA Birth Certificate with ${relationship} name`,
      found: !!targetGrandparentField?.raw_value,
    },
    {
      description: 'Sponsor Valid ID with name',
      found: !!sponsorIdName?.raw_value,
    },
  ]);

  let status: RelationshipResult['status'] = 'needs_manual_review';
  let confidence = 0;

  if (missing.length > 0) {
    status = 'insufficient_evidence';
  } else if (
    targetGrandparentField?.normalized_value &&
    sponsorIdName?.normalized_value &&
    targetGrandparentField.normalized_value === sponsorIdName.normalized_value
  ) {
    status = 'verified';
    confidence = 100;
  } else {
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
