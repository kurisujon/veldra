/**
 * Maps comparison-rule canonical names to the document-profile field names
 * persisted by the extraction pipeline. Rules never depend on storage names.
 */
export type CanonicalDocumentType =
  | 'psa_birth'
  | 'psa_marriage'
  | 'diploma'
  | 'sponsor_valid_id'
  | 'affidavit_of_support'
  | 'tor'
  | 'sponsor_coe'
  | 'sponsor_itr'

export const CANONICAL_FIELDS: Record<CanonicalDocumentType, Record<string, string>> = {
  psa_birth: {
    first_name: 'firstName',
    middle_name: 'middleName',
    last_name: 'lastName',
    date_of_birth: 'dateOfBirth',
    place_of_birth: 'placeOfBirth',
    mother_maiden_first_name: 'motherMaidenFirstName',
    mother_maiden_middle_name: 'motherMaidenMiddleName',
    mother_maiden_last_name: 'motherMaidenLastName',
    father_first_name: 'fatherFirstName',
    father_middle_name: 'fatherMiddleName',
    father_last_name: 'fatherLastName',
  },
  psa_marriage: {
    husband_first_name: 'husbandFirstName',
    husband_middle_name: 'husbandMiddleName',
    husband_last_name: 'husbandLastName',
    wife_first_name: 'wifeFirstName',
    wife_middle_name: 'wifeMiddleName',
    wife_last_name: 'wifeLastName',
    date_of_marriage: 'dateOfMarriage',
    place_of_marriage: 'placeOfMarriage',
  },
  diploma: {
    first_name: 'studentFirstName',
    middle_name: 'studentMiddleName',
    last_name: 'studentLastName',
    school_name: 'institutionName',
    degree: 'degree',
    graduation_date: 'dateAwarded',
  },
  sponsor_valid_id: {
    sponsor_first_name: 'firstName',
    sponsor_middle_name: 'middleName',
    sponsor_last_name: 'lastName',
    sponsor_address: 'address',
    expiry_date: 'expiryDate',
  },
  affidavit_of_support: {
    sponsor_first_name: 'sponsorFirstName',
    sponsor_last_name: 'sponsorLastName',
    sponsor_address: 'sponsorAddress',
    applicant_first_name: 'applicantFirstName',
    applicant_last_name: 'applicantLastName',
  },
  // These document types have comparison rules but no installed extraction
  // profile yet. Their entries deliberately remain empty until that contract exists.
  tor: {},
  sponsor_coe: {},
  sponsor_itr: {},
}

export function getCanonicalDocumentType(documentType: string): CanonicalDocumentType | null {
  switch (documentType.toLowerCase().replace(/[\s_-]/g, '')) {
    case 'psabirth':
    case 'sponsorpsabirth':
    case 'birthcertificate':
      return 'psa_birth'
    case 'psamarriage':
    case 'sponsorpsamarriage':
    case 'marriagecertificate':
      return 'psa_marriage'
    case 'diploma':
      return 'diploma'
    case 'validid':
    case 'sponsorvalidid':
    case 'sponsorvalididcard':
    case 'passport':
      return 'sponsor_valid_id'
    case 'affidavitofsupport':
    case 'affidavit':
      return 'affidavit_of_support'
    case 'tor':
    case 'transcriptofrecords':
      return 'tor'
    case 'sponsorcoe':
    case 'coe':
      return 'sponsor_coe'
    case 'sponsoritr':
    case 'itr':
      return 'sponsor_itr'
    default:
      return null
  }
}

export function resolveCanonicalFieldName(documentType: string, canonicalName: string): string {
  const canonicalDocumentType = getCanonicalDocumentType(documentType)
  return canonicalDocumentType
    ? CANONICAL_FIELDS[canonicalDocumentType][canonicalName] ?? canonicalName
    : canonicalName
}

export function matchesRuleDocumentType(documentType: string, ruleDocumentType?: string): boolean {
  if (!ruleDocumentType) return true

  const normalizedRuleType = ruleDocumentType.toLowerCase().replace(/[\s_-]/g, '')
  const canonicalDocumentType = getCanonicalDocumentType(documentType)

  return normalizedRuleType === documentType.toLowerCase().replace(/[\s_-]/g, '')
    || (normalizedRuleType === 'id' && canonicalDocumentType === 'sponsor_valid_id')
    || (normalizedRuleType === 'affidavit' && canonicalDocumentType === 'affidavit_of_support')
    || (normalizedRuleType === 'coe' && canonicalDocumentType === 'sponsor_coe')
    || (normalizedRuleType === 'itr' && canonicalDocumentType === 'sponsor_itr')
}
