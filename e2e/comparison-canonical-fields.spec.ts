import { test, expect } from '@playwright/test'
import { randomUUID } from 'crypto'
import { runCaseVerification } from '../src/lib/comparison/engine'
import type { DocumentField, DocumentMetadata, Sponsor } from '../src/lib/comparison/types'

const caseId = '00000000-0000-0000-0000-000000000000'

function createField(documentId: string, fieldName: string, value: string): DocumentField {
  return {
    id: randomUUID(),
    case_id: caseId,
    document_id: documentId,
    field_name: fieldName,
    raw_value: value,
    normalized_value: value,
    reviewed_value: value,
    final_value: value,
    confidence_score: 1,
    state: 'verified',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
}

test.describe('Canonical comparison field mapping', () => {
  test('maps document-specific applicant fields and verifies a mother relationship', async () => {
    const applicantPsaId = randomUUID()
    const applicantDiplomaId = randomUUID()
    const sponsorIdDocumentId = randomUUID()
    const documents: DocumentMetadata[] = [
      { id: applicantPsaId, type: 'PSABirth', owner_type: 'applicant', sponsor_id: null },
      { id: applicantDiplomaId, type: 'Diploma', owner_type: 'applicant', sponsor_id: null },
      { id: sponsorIdDocumentId, type: 'SponsorValidID', owner_type: 'sponsor', sponsor_id: 'sponsor-1' },
    ]
    const sponsors: Sponsor[] = [
      { id: 'sponsor-1', first_name: 'Maria', last_name: 'Santos', relationship: 'mother' },
    ]
    const fields = [
      createField(applicantPsaId, 'firstName', 'Juan'),
      createField(applicantPsaId, 'lastName', 'Dela Cruz'),
      createField(applicantPsaId, 'motherMaidenFirstName', 'Maria'),
      createField(applicantPsaId, 'motherMaidenLastName', 'Santos'),
      createField(applicantDiplomaId, 'studentFirstName', 'Juan'),
      createField(applicantDiplomaId, 'studentLastName', 'Dela Cruz'),
      createField(sponsorIdDocumentId, 'firstName', 'Maria'),
      createField(sponsorIdDocumentId, 'lastName', 'Santos'),
    ]

    const result = await runCaseVerification(caseId, fields, documents, sponsors)

    expect(result.applicant.results.some((comparison) => comparison.rule_code === 'APP-NAME-01')).toBe(true)
    expect(result.relationship?.status).toBe('verified')
  })
})
