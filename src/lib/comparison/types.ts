export interface DocumentField {
  id: string
  case_id: string
  document_id: string
  field_name: string
  raw_value: string | null
  normalized_value: string | null
  reviewed_value: string | null
  final_value: string | null
  confidence_score: number | null
  created_at: string
  updated_at: string
}

export interface DocumentMetadata {
  id: string
  owner_type: 'applicant' | 'sponsor'
  sponsor_id: string | null
}

export interface Sponsor {
  id: string
  relationship: string
}

export interface Discrepancy {
  title: string
  description: string
  category: 'Name Mismatch' | 'Address Mismatch' | 'Date Mismatch' | 'Age Calculation Issue' | 'School Gap' | 'Missing Information' | 'Identity'
  severity: 'High' | 'Medium' | 'Low' | 'Warning'
  fieldA: DocumentField
  fieldB: DocumentField
}

export interface VerificationRule {
  category: string
  ruleName: string
  condition?: (applicantFields: DocumentField[], sponsorFields: DocumentField[], sponsor: Sponsor) => boolean
  targetA: { owner: 'applicant' | 'sponsor', fieldName: string }
  targetB: { owner: 'applicant' | 'sponsor', fieldName: string }
  method: 'exactMatch' | 'fuzzyMatch' | 'dateMatch'
  severity: 'High' | 'Medium' | 'Low' | 'Warning'
}
