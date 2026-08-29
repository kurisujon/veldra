/**
 * Phase 10: Advanced Three-Stage Verification Engine — Core Types
 * Single source of truth for all verification type definitions.
 */

// ---------------------------------------------------------------------------
// Verification Statuses
// ---------------------------------------------------------------------------

export type VerificationStatus =
  | 'pending'
  | 'processing'
  | 'verified'
  | 'warning'
  | 'mismatch'
  | 'needs_review';

export type RelationshipVerificationStatus =
  | 'verified'
  | 'partially_supported'
  | 'insufficient_evidence'
  | 'conflicting_evidence'
  | 'not_eligible'
  | 'needs_manual_review';

// ---------------------------------------------------------------------------
// Comparison Methods
// ---------------------------------------------------------------------------

export type ComparisonMethod =
  | 'exact'
  | 'normalized'
  | 'fuzzy'
  | 'calculated'
  | 'semantic'
  | 'manual_review';

// ---------------------------------------------------------------------------
// Document Field (extracted from AI layer)
// ---------------------------------------------------------------------------

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
  state?: string | null
  created_at: string
  updated_at: string
}

// ---------------------------------------------------------------------------
// Document Metadata (ownership & type context)
// ---------------------------------------------------------------------------

export interface DocumentMetadata {
  id: string
  type: string
  owner_type: 'applicant' | 'sponsor'
  sponsor_id: string | null
}

// ---------------------------------------------------------------------------
// Sponsor
// ---------------------------------------------------------------------------

export interface Sponsor {
  id: string
  first_name: string
  last_name: string
  relationship: string
}

// ---------------------------------------------------------------------------
// Comparison Result (persisted to DB)
// ---------------------------------------------------------------------------

export type ComparisonScope =
  | 'applicant_internal'
  | 'sponsor_internal'
  | 'applicant_sponsor';

export interface ComparisonResult {
  case_id: string
  comparison_scope: ComparisonScope
  rule_code: string
  left_document_id: string | null
  right_document_id: string | null
  field_name: string
  left_value: string | null
  right_value: string | null
  left_normalized: string | null
  right_normalized: string | null
  status: VerificationStatus
  severity: FindingSeverity
  explanation: string
  method: ComparisonMethod
}

// ---------------------------------------------------------------------------
// Findings
// ---------------------------------------------------------------------------

export type FindingSeverity = 'High' | 'Medium' | 'Low' | 'Warning';

export type FindingCategory =
  | 'Name Mismatch'
  | 'Address Mismatch'
  | 'Date Mismatch'
  | 'Age Calculation Issue'
  | 'School Gap'
  | 'Missing Information'
  | 'Identity'
  | 'Employment Mismatch'
  | 'Income Discrepancy'
  | 'Document Validity'
  | 'Relationship Evidence';

export type FindingScope =
  | 'applicant_only'
  | 'sponsor_only'
  | 'applicant_and_sponsor';

export interface Discrepancy {
  title: string
  description: string
  category: FindingCategory
  severity: FindingSeverity
  scope: FindingScope
  method: ComparisonMethod
  fieldA: DocumentField | null
  fieldB: DocumentField | null
  explanation?: string
}

// ---------------------------------------------------------------------------
// Verification Rule
// ---------------------------------------------------------------------------

export interface VerificationRule {
  code: string
  category: FindingCategory
  ruleName: string
  scope: ComparisonScope
  condition?: (
    fieldsA: DocumentField[],
    fieldsB: DocumentField[],
    context: { sponsor?: Sponsor }
  ) => boolean
  targetA: { owner: 'applicant' | 'sponsor'; fieldName: string; docType?: string }
  targetB: { owner: 'applicant' | 'sponsor'; fieldName: string; docType?: string }
  method: ComparisonMethod
  severity: FindingSeverity
  explanation: (valA: string, valB: string) => string
}

// ---------------------------------------------------------------------------
// Stage Results
// ---------------------------------------------------------------------------

export interface StageResult {
  status: VerificationStatus
  discrepancies: Discrepancy[]
  results: ComparisonResult[]
  canContinue: boolean
}

// ---------------------------------------------------------------------------
// Relationship Types
// ---------------------------------------------------------------------------

export type ApprovedSponsorRelationship =
  | 'mother'
  | 'father'
  | 'sister'
  | 'brother'
  | 'grandmother'
  | 'grandfather'
  | 'maternal_aunt'
  | 'maternal_uncle'
  | 'paternal_aunt'
  | 'paternal_uncle'
  | 'niece'
  | 'nephew'
  | 'maternal_first_cousin'
  | 'paternal_first_cousin';

// ---------------------------------------------------------------------------
// Relationship Evidence
// ---------------------------------------------------------------------------

export interface EvidenceItem {
  document: string
  field: string
  value: string
  normalized: string
}

export interface RelationshipResult {
  declared_relationship: ApprovedSponsorRelationship | string
  status: RelationshipVerificationStatus
  evidence: EvidenceItem[]
  missing_evidence: string[]
  confidence: number // 0–100
  review_notes?: string
}

// ---------------------------------------------------------------------------
// Full Case Verification Result
// ---------------------------------------------------------------------------

export interface CaseVerificationResult {
  applicant: StageResult
  sponsor: StageResult
  relationship: RelationshipResult | null
}
