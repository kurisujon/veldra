/**
 * Phase 10: Advanced Three-Stage Verification Engine — Orchestrator
 */

import {
  VerificationStatus,
  ComparisonResult,
  StageResult,
  RelationshipResult,
  CaseVerificationResult,
  Discrepancy,
  Sponsor,
  DocumentField,
  DocumentMetadata,
  VerificationRule,
  FindingScope
} from './types'

import { getVerifiedFields } from './trust-boundary'
import { applicantNameRules } from './applicant/applicant-name.rules'
import { applicantBirthRules } from './applicant/applicant-birth.rules'
import { applicantEducationRules } from './applicant/applicant-education.rules'

import { sponsorNameRules } from './sponsor/sponsor-name.rules'
import { sponsorEmploymentRules } from './sponsor/sponsor-employment.rules'
import { sponsorIncomeRules } from './sponsor/sponsor-income.rules'
import { sponsorAffidavitRules } from './sponsor/sponsor-affidavit.rules'

import { verifyParentRelationship } from './relationship/parent.rules'
import { verifySiblingRelationship } from './relationship/sibling.rules'
import { verifyGrandparentRelationship } from './relationship/grandparent.rules'
import { verifyAuntUncleRelationship } from './relationship/aunt-uncle.rules'
import { verifyNephewNieceRelationship } from './relationship/nephew-niece.rules'
import { verifyCousinRelationship } from './relationship/cousin.rules'

import { normalizeName } from './normalization/normalize-name'
import { normalizeDate } from './normalization/normalize-date'
import { normalizeAddress } from './normalization/normalize-address'
import { normalizeInstitution } from './normalization/normalize-institution'
import { matchesRuleDocumentType, resolveCanonicalFieldName } from './canonical-fields'

const ALL_APPLICANT_RULES = [
  ...applicantNameRules,
  ...applicantBirthRules,
  ...applicantEducationRules
]

const ALL_SPONSOR_RULES = [
  ...sponsorNameRules,
  ...sponsorEmploymentRules,
  ...sponsorIncomeRules,
  ...sponsorAffidavitRules
]

export async function runCaseVerification(
  caseId: string,
  allFields: DocumentField[],
  documents: DocumentMetadata[],
  sponsors: Sponsor[]
): Promise<CaseVerificationResult> {
  // LAYER 3 ZERO-TRUST BOUNDARY
  // Only explicitly verified fields are allowed to participate in findings comparison.
  // Legacy fields without a state, or fields in candidate/unreadable/ambiguous state,
  // are strictly ignored.
  const verifiedFields = getVerifiedFields(allFields)

  const applicantResult = await verifyApplicantDocuments(caseId, verifiedFields, documents)
  const sponsorResult = await verifySponsorDocuments(caseId, verifiedFields, documents, sponsors)
  
  let relationshipResult: RelationshipResult | null = null
  if (applicantResult.canContinue && sponsorResult.canContinue && sponsors.length > 0) {
    relationshipResult = await verifyApplicantSponsorRelationship(caseId, verifiedFields, documents, sponsors)
  }

  return {
    applicant: applicantResult,
    sponsor: sponsorResult,
    relationship: relationshipResult,
  }
}

async function verifyApplicantDocuments(
  caseId: string,
  fields: DocumentField[],
  documents: DocumentMetadata[]
): Promise<StageResult> {
  const applicantFields = fields.filter(f => {
    const meta = documents.find(d => d.id === f.document_id)
    return !meta || meta.owner_type === 'applicant'
  })

  return executeRules(caseId, ALL_APPLICANT_RULES, applicantFields, applicantFields, documents)
}

async function verifySponsorDocuments(
  caseId: string,
  fields: DocumentField[],
  documents: DocumentMetadata[],
  sponsors: Sponsor[]
): Promise<StageResult> {
  if (sponsors.length === 0) {
    return { status: 'verified', discrepancies: [], results: [], canContinue: true }
  }

  return executeRules(caseId, ALL_SPONSOR_RULES, fields, fields, documents, sponsors[0])
}

async function verifyApplicantSponsorRelationship(
  caseId: string,
  fields: DocumentField[],
  documents: DocumentMetadata[],
  sponsors: Sponsor[]
): Promise<RelationshipResult> {
  const sponsor = sponsors[0]
  if (!sponsor) return createBlockedRelationshipResult('unknown', 'No sponsor provided.')

  const normalizedRel = sponsor.relationship.toLowerCase().replace(/[\s-]/g, '_')
  const applicantFields = fields.filter((field) => documents.find((document) => document.id === field.document_id)?.owner_type === 'applicant')
  const sponsorFields = fields.filter((field) => documents.find((document) => document.id === field.document_id)?.owner_type === 'sponsor')

  if (!isSupportedRelationship(normalizedRel)) {
    return createBlockedRelationshipResult(sponsor.relationship, 'Relationship type not supported yet.')
  }

  switch (normalizedRel) {
    case 'mother':
    case 'father':
      return verifyParentRelationship(applicantFields, sponsorFields, normalizedRel, documents)
    case 'sister':
    case 'brother':
      return verifySiblingRelationship(applicantFields, sponsorFields, normalizedRel)
    case 'grandmother':
    case 'grandfather':
      return verifyGrandparentRelationship(applicantFields, sponsorFields, normalizedRel)
    case 'maternal_aunt':
    case 'maternal_uncle':
    case 'paternal_aunt':
    case 'paternal_uncle':
      return verifyAuntUncleRelationship(applicantFields, sponsorFields, normalizedRel)
    case 'niece':
    case 'nephew':
      return verifyNephewNieceRelationship(applicantFields, sponsorFields, normalizedRel)
    case 'maternal_first_cousin':
    case 'paternal_first_cousin':
      return verifyCousinRelationship(applicantFields, sponsorFields, normalizedRel)
  }
}

function isSupportedRelationship(relationship: string): relationship is 'mother' | 'father' | 'sister' | 'brother' | 'grandmother' | 'grandfather' | 'maternal_aunt' | 'maternal_uncle' | 'paternal_aunt' | 'paternal_uncle' | 'niece' | 'nephew' | 'maternal_first_cousin' | 'paternal_first_cousin' {
  return [
    'mother', 'father', 'sister', 'brother', 'grandmother', 'grandfather',
    'maternal_aunt', 'maternal_uncle', 'paternal_aunt', 'paternal_uncle',
    'niece', 'nephew', 'maternal_first_cousin', 'paternal_first_cousin',
  ].includes(relationship)
}

function createBlockedRelationshipResult(declared: string, notes: string): RelationshipResult {
  return {
    declared_relationship: declared,
    status: 'needs_manual_review',
    evidence: [],
    missing_evidence: [],
    confidence: 0,
    review_notes: notes
  }
}

function executeRules(
  caseId: string,
  rules: VerificationRule[],
  leftSource: DocumentField[],
  rightSource: DocumentField[],
  documents: DocumentMetadata[],
  sponsor?: Sponsor
): StageResult {
  const discrepancies: Discrepancy[] = []
  const results: ComparisonResult[] = []

  for (const rule of rules) {
    // Collect fields matching the targets
    const leftMatches = leftSource.filter(f => {
      const meta = documents.find(d => d.id === f.document_id)
      return f.field_name === resolveCanonicalFieldName(meta?.type ?? '', rule.targetA.fieldName) &&
             meta?.owner_type === rule.targetA.owner &&
             matchesRuleDocumentType(meta?.type ?? '', rule.targetA.docType)
    })

    const rightMatches = rightSource.filter(f => {
      const meta = documents.find(d => d.id === f.document_id)
      return f.field_name === resolveCanonicalFieldName(meta?.type ?? '', rule.targetB.fieldName) &&
             meta?.owner_type === rule.targetB.owner &&
             matchesRuleDocumentType(meta?.type ?? '', rule.targetB.docType)
    })

    if (rule.condition && !rule.condition(leftMatches, rightMatches, { sponsor })) {
      continue
    }

    // Compare Cartesian product
    for (const lField of leftMatches) {
      for (const rField of rightMatches) {
        if (lField.id === rField.id) continue // skip self-comparison

        const valA = lField.final_value || lField.raw_value || ''
        const valB = rField.final_value || rField.raw_value || ''

        let isMatch = false
        let normA = valA
        let normB = valB

        if (rule.method === 'exact') {
          isMatch = valA === valB
        } else if (rule.method === 'normalized') {
          if (rule.category === 'Name Mismatch' || rule.category === 'Identity') {
            normA = normalizeName(valA)?.normalized || valA
            normB = normalizeName(valB)?.normalized || valB
            isMatch = normA === normB
          } else if (rule.category === 'Date Mismatch') {
            normA = normalizeDate(valA) || valA
            normB = normalizeDate(valB) || valB
            isMatch = normA === normB
          } else if (rule.category === 'Address Mismatch') {
            normA = normalizeAddress(valA) || valA
            normB = normalizeAddress(valB) || valB
            isMatch = normA === normB
          } else {
            normA = valA.trim().toUpperCase()
            normB = valB.trim().toUpperCase()
            isMatch = normA === normB
          }
        } else if (rule.method === 'fuzzy') {
          if (rule.targetA.fieldName.includes('employer') || rule.targetA.fieldName.includes('school')) {
            normA = normalizeInstitution(valA) || valA
            normB = normalizeInstitution(valB) || valB
            isMatch = normA.includes(normB) || normB.includes(normA) || normA === normB
          } else {
            isMatch = valA.toLowerCase().includes(valB.toLowerCase()) || valB.toLowerCase().includes(valA.toLowerCase())
          }
        } else if (rule.method === 'calculated') {
          // Keep it simple for generic executor, specific rules will override logic
          isMatch = valA === valB
        }

        const status: VerificationStatus = isMatch ? 'verified' : (rule.severity === 'Warning' ? 'warning' : 'mismatch')

        results.push({
          case_id: caseId,
          comparison_scope: rule.scope,
          rule_code: rule.code,
          left_document_id: lField.document_id,
          right_document_id: rField.document_id,
          field_name: rule.targetA.fieldName,
          left_value: valA,
          right_value: valB,
          left_normalized: normA,
          right_normalized: normB,
          status,
          severity: rule.severity,
          explanation: rule.explanation(valA, valB),
          method: rule.method
        })

        if (!isMatch) {
          discrepancies.push({
            title: rule.ruleName,
            description: rule.explanation(valA, valB),
            category: rule.category,
            severity: rule.severity,
            scope: rule.scope as FindingScope,
            method: rule.method,
            fieldA: lField,
            fieldB: rField
          })
        }
      }
    }
  }

  const hasHighMismatches = discrepancies.some(d => d.severity === 'High')
  
  return {
    status: discrepancies.length > 0 ? (hasHighMismatches ? 'mismatch' : 'needs_review') : 'verified',
    discrepancies,
    results,
    canContinue: !hasHighMismatches
  }
}
