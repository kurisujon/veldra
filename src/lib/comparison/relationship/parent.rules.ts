import { DocumentField, DocumentMetadata, RelationshipResult } from '../types';
import { resolveCanonicalFieldName } from '../canonical-fields';
import { buildEvidenceItem, buildEvidenceChain } from '../evidence/build-evidence-chain';
import { determineMissingEvidence } from '../evidence/missing-evidence';

/**
 * Validates 'mother' or 'father' relationships.
 * Chain: Applicant PSA Birth Certificate (Mother/Father Name) -> Sponsor Valid ID (Name)
 */
export function verifyParentRelationship(
  applicantFields: DocumentField[],
  sponsorFields: DocumentField[],
  relationship: 'mother' | 'father',
  documents: DocumentMetadata[]
): RelationshipResult {
  const applicantPsaFields = applicantFields.filter((field) => {
    const document = documents.find((item) => item.id === field.document_id)
    return document?.type === 'PSABirth' || document?.type === 'SponsorPSABirth'
  })
  const sponsorIdFields = sponsorFields.filter((field) => {
    const document = documents.find((item) => item.id === field.document_id)
    return document?.type === 'ValidID' || document?.type === 'SponsorValidID'
  })

  const parentPrefix = relationship === 'mother' ? 'mother_maiden' : 'father'
  const applicantFirstNameField = applicantPsaFields.find((field) => field.field_name === resolveCanonicalFieldName('PSABirth', `${parentPrefix}_first_name`))
  const applicantLastNameField = applicantPsaFields.find((field) => field.field_name === resolveCanonicalFieldName('PSABirth', `${parentPrefix}_last_name`))
  const sponsorFirstNameField = sponsorIdFields.find((field) => field.field_name === resolveCanonicalFieldName('SponsorValidID', 'sponsor_first_name'))
  const sponsorLastNameField = sponsorIdFields.find((field) => field.field_name === resolveCanonicalFieldName('SponsorValidID', 'sponsor_last_name'))

  const evidence = buildEvidenceChain([
    buildEvidenceItem(applicantFirstNameField, 'Applicant PSA Birth Certificate parent first name'),
    buildEvidenceItem(applicantLastNameField, 'Applicant PSA Birth Certificate parent last name'),
    buildEvidenceItem(sponsorFirstNameField, 'Sponsor Valid ID first name'),
    buildEvidenceItem(sponsorLastNameField, 'Sponsor Valid ID last name'),
  ]);

  const missing = determineMissingEvidence([
    {
      description: `Applicant PSA Birth Certificate with ${relationship}'s name`,
      found: !!applicantFirstNameField?.raw_value && !!applicantLastNameField?.raw_value,
    },
    {
      description: 'Sponsor Valid ID with first and last name',
      found: !!sponsorFirstNameField?.raw_value && !!sponsorLastNameField?.raw_value,
    },
  ]);

  let status: RelationshipResult['status'] = 'needs_manual_review';
  let confidence = 0;

  if (missing.length > 0) {
    status = 'insufficient_evidence';
  } else if (
    applicantFirstNameField?.normalized_value &&
    applicantLastNameField?.normalized_value &&
    sponsorFirstNameField?.normalized_value &&
    sponsorLastNameField?.normalized_value &&
    applicantFirstNameField.normalized_value === sponsorFirstNameField.normalized_value &&
    applicantLastNameField.normalized_value === sponsorLastNameField.normalized_value
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
